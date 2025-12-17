import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { DatabaseService } from './database.service';
import { StorageService } from './storage.service';
import { WordPressService } from './wordpress.service';

export interface CreateTenantDto {
    userId: string;
    name: string;
    subdomain: string;
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
}

@Injectable()
export class TenantsService implements OnModuleInit {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        private databaseService: DatabaseService,
        private storageService: StorageService,
        private wordpressService: WordPressService
    ) { }

    async onModuleInit(): Promise<void> {
        // Initialize database schema
        await this.databaseService.initializeSchema();
    }

    async createTenant(dto: CreateTenantDto): Promise<TenantDetails> {
        const tenantId = nanoid(16);
        this.logger.log(`Creating tenant: ${tenantId} (${dto.name})`);

        try {
            // Step 1: Create tenant database
            const database = await this.databaseService.createTenantDatabase(tenantId);

            // Step 2: Create storage directory
            await this.storageService.createTenantDirectory(tenantId);

            // Step 3: Save tenant record
            await this.databaseService.saveTenant({
                id: tenantId,
                userId: dto.userId,
                name: dto.name,
                subdomain: dto.subdomain,
                dbName: database.name,
                dbUser: database.user,
                dbPassword: database.password,
                status: 'creating',
            });

            // Step 4: Deploy WordPress service
            await this.wordpressService.deployWordPress(tenantId, dto.subdomain, database);

            // Step 5: Update status
            await this.databaseService.updateTenantStatus(tenantId, 'running');

            this.logger.log(`Tenant created successfully: ${tenantId}`);

            return {
                id: tenantId,
                name: dto.name,
                subdomain: dto.subdomain,
                status: 'running',
                url: `https://${dto.subdomain}.${process.env.DOMAIN || 'localhost'}`,
                replicas: 2,
                runningReplicas: 0, // Will update once service starts
            };
        } catch (error) {
            this.logger.error(`Failed to create tenant: ${tenantId}`, error);

            // Attempt cleanup on failure
            try {
                await this.databaseService.updateTenantStatus(tenantId, 'error');
            } catch {
                // Ignore cleanup errors
            }

            throw error;
        }
    }

    async getTenant(tenantId: string): Promise<TenantDetails | null> {
        const tenant = await this.databaseService.getTenant(tenantId);
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
            url: `https://${tenant.subdomain}.${process.env.DOMAIN || 'localhost'}`,
            replicas: wpInstance?.replicas || 0,
            runningReplicas: wpInstance?.runningReplicas || 0,
            storageUsage,
        };
    }

    async getTenantsByUser(userId: string): Promise<TenantDetails[]> {
        const tenants = await this.databaseService.getTenantsByUser(userId);

        const results: TenantDetails[] = [];
        for (const tenant of tenants) {
            const wpInstance = await this.wordpressService.getWordPressInstance(tenant.id);
            results.push({
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                status: wpInstance?.status || tenant.status,
                url: `https://${tenant.subdomain}.${process.env.DOMAIN || 'localhost'}`,
                replicas: wpInstance?.replicas || 0,
                runningReplicas: wpInstance?.runningReplicas || 0,
                createdAt: tenant.createdAt,
            });
        }

        return results;
    }

    async startTenant(tenantId: string): Promise<void> {
        await this.wordpressService.startWordPress(tenantId);
    }

    async stopTenant(tenantId: string): Promise<void> {
        await this.wordpressService.stopWordPress(tenantId);
    }

    async restartTenant(tenantId: string): Promise<void> {
        await this.wordpressService.restartWordPress(tenantId);
    }

    async deleteTenant(tenantId: string): Promise<void> {
        this.logger.log(`Deleting tenant: ${tenantId}`);

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

        // Step 3: Delete database
        try {
            await this.databaseService.deleteTenantDatabase(tenantId);
        } catch (error) {
            this.logger.warn(`Failed to delete database for ${tenantId}`, error);
        }

        // Step 4: Remove tenant record
        await this.databaseService.deleteTenant(tenantId);

        this.logger.log(`Tenant deleted: ${tenantId}`);
    }

    async getTenantLogs(tenantId: string, tail: number = 100): Promise<string> {
        return this.wordpressService.getWordPressLogs(tenantId, tail);
    }
}
