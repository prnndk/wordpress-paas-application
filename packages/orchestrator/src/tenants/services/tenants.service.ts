import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TenantRepository } from '../repositories/tenant.repository';
import { TenantDatabaseService } from './tenant-database.service';
import { StorageService } from './storage.service';
import { WordPressService } from './wordpress.service';
import { SubscriptionService } from './subscription.service';
import { Tenant } from '@prisma/client';

export interface CreateTenantDto {
    userId: string;
    name: string;
    subdomain: string;
    wpAdminUser?: string;
    wpAdminPassword?: string;
}

export interface TenantDetails {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    url: string;
    replicas: number;
    runningReplicas: number;
    createdAt?: Date;
    storageUsage?: { bytes: number; files: number };
    wpAdminUser?: string;
    wpAdminPassword?: string;
    planId?: string;
}

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        private readonly tenantRepository: TenantRepository,
        private readonly tenantDatabaseService: TenantDatabaseService,
        private readonly storageService: StorageService,
        private readonly wordpressService: WordPressService,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    private generatePassword(length: number = 16): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    async createTenant(dto: CreateTenantDto): Promise<TenantDetails> {
        this.logger.log(`Creating tenant for user: ${dto.userId} (${dto.name})`);

        // Check subscription limits
        const existingCount = await this.tenantRepository.countByUserId(dto.userId);
        const canCreate = await this.subscriptionService.canCreateInstance(dto.userId, existingCount);

        if (!canCreate) {
            throw new BadRequestException('Instance limit reached for your plan. Please upgrade to create more instances.');
        }

        // Check if subdomain already exists
        if (await this.tenantRepository.subdomainExists(dto.subdomain)) {
            throw new BadRequestException('Subdomain already in use');
        }

        // Get replicas based on user's plan
        const replicas = await this.subscriptionService.getReplicasForPlan(dto.userId);
        const userPlan = await this.subscriptionService.getUserPlan(dto.userId);

        // Generate WordPress admin credentials if not provided
        const wpAdminUser = dto.wpAdminUser || 'admin';
        const wpAdminPassword = dto.wpAdminPassword || this.generatePassword(16);

        let tenant: Tenant | null = null;

        try {
            // Step 1: Create tenant database (external MySQL database for WordPress)
            const database = await this.tenantDatabaseService.createTenantDatabase(dto.subdomain);

            // Step 2: Create storage directory
            await this.storageService.createTenantDirectory(dto.subdomain);

            // Step 3: Save tenant record using repository
            tenant = await this.tenantRepository.create({
                userId: dto.userId,
                name: dto.name,
                subdomain: dto.subdomain,
                dbName: database.name,
                dbUser: database.user,
                dbPassword: database.password,
                wpAdminUser,
                wpAdminPassword,
                planId: userPlan.id as any,
                replicas,
                status: 'creating',
            });

            // Step 4: Deploy WordPress service with admin credentials
            await this.wordpressService.deployWordPress(
                tenant.id,
                dto.subdomain,
                database,
                { wpAdminUser, wpAdminPassword, replicas }
            );

            // Step 5: Update status
            await this.tenantRepository.updateStatus(tenant.id, 'running');

            this.logger.log(`Tenant created successfully: ${tenant.id}`);

            return {
                id: tenant.id,
                name: dto.name,
                subdomain: dto.subdomain,
                status: 'running',
                url: `http://${process.env.SERVER_IP || process.env.DOMAIN || 'localhost'}/${dto.subdomain}`,
                replicas,
                runningReplicas: 0,
                wpAdminUser,
                wpAdminPassword,
                planId: userPlan.id,
            };
        } catch (error) {
            this.logger.error(`Failed to create tenant`, error);

            // Attempt cleanup on failure
            if (tenant) {
                try {
                    await this.tenantRepository.updateStatus(tenant.id, 'error');
                } catch {
                    // Ignore cleanup errors
                }
            }

            throw error;
        }
    }

    async getTenant(tenantId: string): Promise<TenantDetails | null> {
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            return null;
        }

        const wpInstance = await this.wordpressService.getWordPressInstance(tenantId);
        const storageUsage = await this.storageService.getStorageUsage(tenantId);

        return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: wpInstance?.status || tenant.status,
            url: `http://${process.env.SERVER_IP || process.env.DOMAIN || 'localhost'}/${tenant.subdomain}`,
            replicas: wpInstance?.replicas || tenant.replicas || 0,
            runningReplicas: wpInstance?.runningReplicas || 0,
            storageUsage,
            wpAdminUser: tenant.wpAdminUser,
            wpAdminPassword: tenant.wpAdminPassword || undefined,
            planId: tenant.planId,
        };
    }

    async getTenantsByUser(userId: string): Promise<TenantDetails[]> {
        const tenants = await this.tenantRepository.findByUserId(userId);

        const results: TenantDetails[] = [];
        for (const tenant of tenants) {
            const wpInstance = await this.wordpressService.getWordPressInstance(tenant.id);
            results.push({
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                status: wpInstance?.status || tenant.status,
                url: `http://${process.env.SERVER_IP || process.env.DOMAIN || 'localhost'}/${tenant.subdomain}`,
                replicas: wpInstance?.replicas || tenant.replicas || 0,
                runningReplicas: wpInstance?.runningReplicas || 0,
                createdAt: tenant.createdAt,
            });
        }

        return results;
    }

    async startTenant(tenantId: string): Promise<void> {
        await this.wordpressService.startWordPress(tenantId);
        await this.tenantRepository.updateStatus(tenantId, 'running');
    }

    async stopTenant(tenantId: string): Promise<void> {
        await this.wordpressService.stopWordPress(tenantId);
        await this.tenantRepository.updateStatus(tenantId, 'stopped');
    }

    async restartTenant(tenantId: string): Promise<void> {
        await this.wordpressService.restartWordPress(tenantId);
    }

    async deleteTenant(tenantId: string): Promise<void> {
        this.logger.log(`Deleting tenant: ${tenantId}`);

        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw new BadRequestException('Tenant not found');
        }

        // Step 1: Stop and remove WordPress service
        try {
            await this.wordpressService.deleteWordPress(tenantId);
        } catch (error) {
            this.logger.warn(`Failed to delete WordPress service for ${tenantId}`, error);
        }

        // Step 2: Delete storage
        try {
            await this.storageService.deleteTenantDirectory(tenantId);
        } catch (error) {
            this.logger.warn(`Failed to delete storage for ${tenantId}`, error);
        }

        // Step 3: Delete tenant database
        try {
            await this.tenantDatabaseService.deleteTenantDatabase(tenant.subdomain);
        } catch (error) {
            this.logger.warn(`Failed to delete database for ${tenantId}`, error);
        }

        // Step 4: Remove tenant record
        await this.tenantRepository.delete(tenantId);

        this.logger.log(`Tenant deleted: ${tenantId}`);
    }

    async getTenantLogs(tenantId: string, tail: number = 100): Promise<string> {
        return this.wordpressService.getWordPressLogs(tenantId, tail);
    }
}
