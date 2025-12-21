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

@Injectable()
export class MaintenanceService {
    private readonly logger = new Logger(MaintenanceService.name);

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
