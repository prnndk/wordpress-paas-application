import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from '../docker/docker.service';

interface CreateAnnouncementDto {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'maintenance';
    scheduledAt?: Date;
    expiresAt?: Date;
}

export interface RollingUpdateResult {
    success: boolean;
    servicesUpdated: string[];
    errors: string[];
}

interface CreateScheduledMaintenanceDto {
    scheduledAt: Date;
    targetImage: string;
    forceUpdate?: boolean;
    announcementId?: string;
}

@Injectable()
export class MaintenanceService {
    private readonly logger = new Logger(MaintenanceService.name);
    private currentMaintenanceId: string | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly dockerService: DockerService,
    ) { }

    async createAnnouncement(data: CreateAnnouncementDto) {
        return this.prisma.announcement.create({
            data: {
                title: data.title,
                message: data.message,
                type: data.type || 'info',
                scheduledAt: data.scheduledAt,
                expiresAt: data.expiresAt,
                isActive: true,
            },
        });
    }

    async getActiveAnnouncements() {
        const now = new Date();
        return this.prisma.announcement.findMany({
            where: {
                isActive: true,
                OR: [
                    { scheduledAt: null },
                    { scheduledAt: { lte: now } },
                ],
                AND: [
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: now } },
                        ],
                    },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAllAnnouncements() {
        return this.prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async toggleAnnouncement(id: string, isActive: boolean) {
        return this.prisma.announcement.update({
            where: { id },
            data: { isActive },
        });
    }

    async deleteAnnouncement(id: string) {
        return this.prisma.announcement.delete({
            where: { id },
        });
    }

    // Scheduled Maintenance Methods
    async createScheduledMaintenance(data: CreateScheduledMaintenanceDto) {
        return this.prisma.scheduledMaintenance.create({
            data: {
                scheduledAt: data.scheduledAt,
                targetImage: data.targetImage,
                forceUpdate: data.forceUpdate || false,
                announcementId: data.announcementId,
                status: 'pending',
            },
        });
    }

    async getScheduledMaintenances() {
        return this.prisma.scheduledMaintenance.findMany({
            orderBy: { scheduledAt: 'desc' },
        });
    }

    async cancelScheduledMaintenance(id: string) {
        return this.prisma.scheduledMaintenance.update({
            where: { id },
            data: { status: 'cancelled' },
        });
    }

    async checkActiveMaintenanceWindow() {
        return this.currentMaintenanceId !== null;
    }

    async getActiveMaintenanceInfo() {
        if (!this.currentMaintenanceId) {
            return null;
        }

        const maintenance = await this.prisma.scheduledMaintenance.findUnique({
            where: { id: this.currentMaintenanceId },
        });

        if (!maintenance) {
            return null;
        }

        // Get linked announcement if exists
        let announcement = null;
        if (maintenance.announcementId) {
            announcement = await this.prisma.announcement.findUnique({
                where: { id: maintenance.announcementId },
            });
        }

        return {
            isActive: true,
            startedAt: maintenance.startedAt,
            targetImage: maintenance.targetImage,
            announcement: announcement ? {
                title: announcement.title,
                message: announcement.message,
            } : null,
        };
    }

    async executeScheduledMaintenance(id: string): Promise<RollingUpdateResult> {
        const maintenance = await this.prisma.scheduledMaintenance.findUnique({
            where: { id },
        });

        if (!maintenance) {
            this.logger.error(`Scheduled maintenance ${id} not found`);
            throw new Error(`Scheduled maintenance not found`);
        }

        if (maintenance.status !== 'pending') {
            this.logger.warn(`Cannot execute scheduled maintenance ${id} - current status: ${maintenance.status}`);
            throw new Error(`Cannot execute maintenance with status: ${maintenance.status}. Only pending tasks can be executed.`);
        }

        // Mark as in progress
        this.currentMaintenanceId = id;
        await this.prisma.scheduledMaintenance.update({
            where: { id },
            data: {
                status: 'in_progress',
                startedAt: new Date(),
            },
        });

        try {
            const result = await this.performRollingUpdateWithHealthCheck(
                maintenance.targetImage,
                maintenance.forceUpdate
            );

            // Update maintenance record with results
            await this.prisma.scheduledMaintenance.update({
                where: { id },
                data: {
                    status: result.success ? 'completed' : 'failed',
                    completedAt: new Date(),
                    servicesUpdated: JSON.stringify(result.servicesUpdated),
                    errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
                },
            });

            this.currentMaintenanceId = null;
            return result;
        } catch (error) {
            this.logger.error(`Failed to execute scheduled maintenance ${id}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.prisma.scheduledMaintenance.update({
                where: { id },
                data: {
                    status: 'failed',
                    completedAt: new Date(),
                    errors: JSON.stringify([errorMessage]),
                },
            });
            this.currentMaintenanceId = null;
            throw error;
        }
    }

    async performRollingUpdateWithHealthCheck(newImage: string, forceUpdate: boolean = false): Promise<RollingUpdateResult> {
        this.logger.log(`Starting rolling update with health checks to image: ${newImage}${forceUpdate ? ' (force)' : ''}`);

        const result: RollingUpdateResult = {
            success: true,
            servicesUpdated: [],
            errors: [],
        };

        // Get all WordPress services
        const services = await this.dockerService.listServices({
            'wp-paas.type': 'wordpress',
        });

        this.logger.log(`Found ${services.length} WordPress services to update`);

        for (const service of services) {
            try {
                const currentImage = service.image;
                this.logger.log(`Processing service ${service.name} (current: ${currentImage}, target: ${newImage})`);

                // Get current replica count
                const replicas = service.replicas;

                if (replicas === 0) {
                    this.logger.warn(`Service ${service.name} has 0 replicas, skipping`);
                    continue;
                }

                // Update the service (Docker Swarm handles rolling update automatically)
                this.logger.log(`Updating service ${service.name} to ${newImage}`);
                await this.dockerService.updateService(service.name, {
                    image: newImage,
                    forceUpdate: forceUpdate,
                });

                // Wait for update to complete and verify health
                const healthCheckPassed = await this.waitForServiceHealth(service.name, replicas, 120);

                if (!healthCheckPassed) {
                    this.logger.error(`Health check failed for ${service.name}, rolling back`);

                    // Rollback to previous image
                    await this.dockerService.updateService(service.name, {
                        image: currentImage,
                        forceUpdate: true,
                    });

                    result.errors.push(`Health check failed for ${service.name}, rolled back to ${currentImage}`);
                    result.success = false;

                    // Stop the rolling update process
                    break;
                }

                result.servicesUpdated.push(service.name);
                this.logger.log(`Successfully updated and verified ${service.name}`);

            } catch (error) {
                const errorMessage = `Failed to update ${service.name}: ${error}`;
                this.logger.error(errorMessage);
                result.errors.push(errorMessage);
                result.success = false;
                break; // Stop on first error
            }
        }

        return result;
    }

    private async waitForServiceHealth(serviceName: string, expectedReplicas: number, timeoutSeconds: number): Promise<boolean> {
        this.logger.log(`Waiting for service ${serviceName} to become healthy (${expectedReplicas} replicas, timeout: ${timeoutSeconds}s)`);

        const startTime = Date.now();
        const timeoutMs = timeoutSeconds * 1000;

        while (Date.now() - startTime < timeoutMs) {
            try {
                const serviceInfo = await this.dockerService.getService(serviceName);

                if (!serviceInfo) {
                    this.logger.warn(`Service ${serviceName} not found`);
                    await this.sleep(5000);
                    continue;
                }

                this.logger.log(`Service ${serviceName}: ${serviceInfo.runningReplicas}/${expectedReplicas} replicas running`);

                if (serviceInfo.runningReplicas >= expectedReplicas) {
                    this.logger.log(`Service ${serviceName} is healthy with ${serviceInfo.runningReplicas} running replicas`);
                    return true;
                }

                // Wait before next check
                await this.sleep(5000);
            } catch (error) {
                this.logger.error(`Error checking service health for ${serviceName}:`, error);
                await this.sleep(5000);
            }
        }

        this.logger.error(`Timeout waiting for service ${serviceName} to become healthy`);
        return false;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Legacy method - kept for backward compatibility
    async rollingUpdateAllServices(newImage: string, forceUpdate: boolean = false): Promise<RollingUpdateResult> {
        this.logger.log(`Starting rolling update to image: ${newImage}${forceUpdate ? ' (force)' : ''}`);

        const result: RollingUpdateResult = {
            success: true,
            servicesUpdated: [],
            errors: [],
        };

        // Get all WordPress services
        const services = await this.dockerService.listServices({
            'wp-paas.type': 'wordpress',
        });

        this.logger.log(`Found ${services.length} WordPress services to update`);

        for (const service of services) {
            try {
                this.logger.log(`Updating service ${service.name} to ${newImage}`);
                await this.dockerService.updateService(service.name, {
                    image: newImage,
                    forceUpdate: forceUpdate,
                });
                result.servicesUpdated.push(service.name);
                this.logger.log(`Successfully updated ${service.name}`);
            } catch (error) {
                const errorMessage = `Failed to update ${service.name}: ${error}`;
                this.logger.error(errorMessage);
                result.errors.push(errorMessage);
                result.success = false;
            }
        }

        return result;
    }

    async updateSingleService(serviceName: string, newImage: string) {
        this.logger.log(`Updating service ${serviceName} to image: ${newImage}`);
        await this.dockerService.updateService(serviceName, { image: newImage });
        return { success: true, serviceName };
    }

    async getCurrentWordPressImage() {
        const services = await this.dockerService.listServices({
            'wp-paas.type': 'wordpress',
        });

        if (services.length > 0) {
            return services[0]?.image || 'prnndk/wp-paas-wordpress:latest';
        }

        return 'prnndk/wp-paas-wordpress:latest';
    }
}
