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
    targetTenantIds?: string[]; // Optional: specific tenant IDs to update
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
                targetTenantIds: data.targetTenantIds ? JSON.stringify(data.targetTenantIds) : null,
                status: 'pending',
            },
        });
    }

    async getScheduledMaintenances() {
        return this.prisma.scheduledMaintenance.findMany({
            orderBy: { scheduledAt: 'desc' },
            include: { announcement: true },
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

        // Get total services count for progress tracking
        const targetTenantIds = maintenance.targetTenantIds ? JSON.parse(maintenance.targetTenantIds) : null;
        let allServices = await this.dockerService.listServices({ 'wp-paas.type': 'wordpress' });

        if (targetTenantIds && targetTenantIds.length > 0) {
            allServices = allServices.filter(service => {
                const serviceIdPart = service.name.replace('wp_', '');
                return targetTenantIds.includes(serviceIdPart);
            });
        }

        const totalServices = allServices.length;

        await this.prisma.scheduledMaintenance.update({
            where: { id },
            data: {
                status: 'in_progress',
                startedAt: new Date(),
                progress: JSON.stringify({ current: 0, total: totalServices, currentService: '' }),
            },
        });

        try {
            const result = await this.performRollingUpdateWithHealthCheck(
                maintenance.targetImage,
                maintenance.forceUpdate,
                targetTenantIds,
                id  // Pass maintenance ID for progress updates
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

    async performRollingUpdateWithHealthCheck(
        newImage: string,
        forceUpdate: boolean = false,
        targetTenantIds: string[] | null = null,
        maintenanceId: string | null = null
    ): Promise<RollingUpdateResult> {
        const tenantFilter = targetTenantIds ? ` for ${targetTenantIds.length} specific tenant(s)` : ' for all tenants';
        this.logger.log(`Starting rolling update with health checks to image: ${newImage}${forceUpdate ? ' (force)' : ''}${tenantFilter}`);

        const result: RollingUpdateResult = {
            success: true,
            servicesUpdated: [],
            errors: [],
        };

        // Get all WordPress services
        let services = await this.dockerService.listServices({
            'wp-paas.type': 'wordpress',
        });

        // Filter by tenant IDs if specified
        if (targetTenantIds && targetTenantIds.length > 0) {
            // Get tenant data from database for the specified IDs
            const tenants = await this.prisma.tenant.findMany({
                where: { id: { in: targetTenantIds } },
                select: { id: true, slug: true },
            });

            this.logger.log(`Target tenants: ${JSON.stringify(tenants)}`);
            this.logger.log(`Available services before filter: ${services.map(s => s.name).join(', ')}`);

            // Service names use tenant ID in format: wp_{tenantId}
            // So we filter by checking if service name contains the tenant ID
            services = services.filter(service => {
                // Service name format is wp_{tenantId}, extract the ID part
                const serviceIdPart = service.name.replace('wp_', '');
                return targetTenantIds.includes(serviceIdPart);
            });

            this.logger.log(`Filtered to ${services.length} services matching target tenant IDs`);
            this.logger.log(`Filtered services: ${services.map(s => s.name).join(', ')}`);
        }

        this.logger.log(`Found ${services.length} WordPress services to update`);

        const totalServices = services.length;
        let currentServiceIndex = 0;

        for (const service of services) {
            try {
                currentServiceIndex++;
                const currentImage = service.image;
                this.logger.log(`Processing service ${service.name} (${currentServiceIndex}/${totalServices}) (current: ${currentImage}, target: ${newImage})`);

                // Update progress in database
                if (maintenanceId) {
                    await this.prisma.scheduledMaintenance.update({
                        where: { id: maintenanceId },
                        data: {
                            progress: JSON.stringify({
                                current: currentServiceIndex - 1,
                                total: totalServices,
                                currentService: service.name,
                            }),
                        },
                    });
                }

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

                // Wait for Docker to start the update process and detect any image pull failures
                this.logger.log(`Waiting 10 seconds for Docker Swarm to pull image and start update process...`);
                await new Promise(resolve => setTimeout(resolve, 10000));

                // Wait for service to become healthy with the new image
                const healthCheckPassed = await this.waitForServiceHealth(service.name, replicas, 120);

                if (!healthCheckPassed) {
                    this.logger.error(`Health check failed for ${service.name}, rolling back`);

                    // Rollback to previous image
                    await this.dockerService.updateService(service.name, {
                        image: currentImage,
                        forceUpdate: true,
                    });

                    const errorMessage = `Failed to update ${service.name}: Health check failed after 120s`;
                    this.logger.error(errorMessage);
                    result.errors.push(errorMessage);
                    result.success = false;

                    // Stop the entire rolling update process
                    break;
                }

                this.logger.log(`Successfully updated and verified ${service.name}`);
                result.servicesUpdated.push(service.name);

                // Update progress after successful update
                if (maintenanceId) {
                    await this.prisma.scheduledMaintenance.update({
                        where: { id: maintenanceId },
                        data: {
                            progress: JSON.stringify({
                                current: currentServiceIndex,
                                total: totalServices,
                                currentService: '',
                            }),
                        },
                    });
                }

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

    private async waitForServiceHealth(
        serviceName: string,
        expectedReplicas: number,
        timeoutSeconds: number
    ): Promise<boolean> {
        this.logger.log(`Waiting for service ${serviceName} to become healthy (${expectedReplicas} replicas, timeout: ${timeoutSeconds}s)`);

        const startTime = Date.now();
        const timeoutMs = timeoutSeconds * 1000;

        while (Date.now() - startTime < timeoutMs) {
            const services = await this.dockerService.listServices({
                'wp-paas.type': 'wordpress',
            });

            const service = services.find(s => s.name === serviceName);

            if (!service) {
                this.logger.error(`Service ${serviceName} not found during health check`);
                return false;
            }

            const runningReplicas = service.runningReplicas;
            this.logger.log(`Service ${serviceName}: ${runningReplicas}/${expectedReplicas} replicas running`);

            // Fail-fast: If any replica is in failed state, immediately return false
            // Check if there are tasks in rejected/failed state
            try {
                const serviceDetails = await this.dockerService.getService(serviceName);
                if (serviceDetails) {
                    // If we have fewer running replicas than expected and some time has passed,
                    // it likely means some replicas failed to start
                    const elapsedSeconds = (Date.now() - startTime) / 1000;

                    // After 30 seconds, if we don't have all replicas running, consider it a failure
                    if (elapsedSeconds > 30 && runningReplicas < expectedReplicas) {
                        this.logger.error(
                            `Service ${serviceName} has only ${runningReplicas}/${expectedReplicas} replicas running after ${Math.round(elapsedSeconds)}s. Failing fast.`
                        );
                        return false;
                    }
                }
            } catch (error) {
                this.logger.warn(`Could not get detailed service info: ${error}`);
            }

            // Success: All replicas are running
            if (runningReplicas >= expectedReplicas) {
                this.logger.log(`Service ${serviceName} is healthy with ${runningReplicas} running replicas`);
                return true;
            }

            // Wait 5 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Timeout reached
        this.logger.error(`Health check timeout for ${serviceName} after ${timeoutSeconds}s`);
        return false;
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
        return { message: 'Service updated successfully' };
    }

    async getAvailableWordPressTenants() {
        // Get all tenants that have WordPress instances
        const tenants = await this.prisma.tenant.findMany({
            where: {
                status: 'running', // Only show running tenants
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return tenants;
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
