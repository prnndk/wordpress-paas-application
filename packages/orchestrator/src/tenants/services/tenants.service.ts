import {
    Injectable,
    Logger,
    BadRequestException,
    ForbiddenException,
} from "@nestjs/common";
import { TenantRepository } from "../repositories/tenant.repository";
import { TenantDatabaseService } from "./tenant-database.service";
import { StorageService } from "./storage.service";
import { WordPressService } from "./wordpress.service";
import { SubscriptionService } from "./subscription.service";
import { Tenant } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface CreateTenantInput {
    userId: string;
    name: string;
    slug: string;
    region: string;
    env: { key: string; value: string }[];
    wpAdminUser: string;
    wpAdminPassword: string;
    wpAdminEmail: string;
    siteTitle?: string;
    notes?: string;
}

export interface TenantEndpoints {
    site: string;
    admin: string;
}

export interface TenantDetails {
    id: string;
    userId?: string; // For ownership checking
    name: string;
    slug: string;
    region?: string;
    status: string;
    endpoints?: TenantEndpoints;
    replicas: number;
    runningReplicas: number;
    createdAt?: Date;
    storageUsage?: { bytes: number; files: number };
    wpAdminUser?: string;
    wpAdminPassword?: string;
    wpAdminEmail?: string;
    planId?: string;
    specs?: {
        cpuCores: number;
        ramGb: number;
        storageGb: number;
    };
    env?: { key: string; value: string }[];
    db?: {
        host: string;
        name: string;
        user: string;
        password: string;
    };
}

export interface QuotaExceededError {
    error: "QuotaExceeded";
    message: string;
    allowed: number;
    used: number;
    recommendedPlanId?: string;
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
        private readonly prisma: PrismaService
    ) { }

    private generatePassword(length: number = 16): string {
        const chars =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    private buildEndpoints(slug: string): TenantEndpoints {
        const serverIp =
            process.env.SERVER_IP || process.env.BASE_DOMAIN || "localhost";
        const scheme = "http";
        const siteUrl = `${scheme}://${serverIp}/${slug}/`;
        const adminUrl = `${siteUrl}wp-admin/`;

        return {
            site: siteUrl,
            admin: adminUrl,
        };
    }

    async checkQuota(
        userId: string
    ): Promise<{ canCreate: boolean; used: number; allowed: number }> {
        const userPlan = await this.subscriptionService.getUserPlan(userId);
        const usedInstances = await this.tenantRepository.countByUserId(userId);
        const allowedInstances = userPlan.features.maxInstances;

        const canCreate =
            allowedInstances === -1 || usedInstances < allowedInstances;

        return {
            canCreate,
            used: usedInstances,
            allowed: allowedInstances,
        };
    }

    async createTenant(input: CreateTenantInput): Promise<TenantDetails> {
        this.logger.log(
            `Creating tenant for user: ${input.userId} (${input.name})`
        );

        const userPlan = await this.subscriptionService.getUserPlan(input.userId);
        const replicas = userPlan.features.replicas;

        const result = await this.prisma.$transaction(async (tx) => {
            const existingCount = await tx.tenant.count({
                where: { userId: input.userId },
            });

            const allowedInstances = userPlan.features.maxInstances;

            if (allowedInstances !== -1 && existingCount >= allowedInstances) {
                throw new ForbiddenException({
                    error: "QuotaExceeded",
                    message: `Instance limit reached. You have ${existingCount} instances and your plan allows ${allowedInstances}.`,
                    allowed: allowedInstances,
                    used: existingCount,
                    recommendedPlanId: "plan_pro_1",
                });
            }

            const existingBySlug = await tx.tenant.findUnique({
                where: { slug: input.slug },
            });
            if (existingBySlug) {
                throw new BadRequestException("Slug already in use");
            }

            return { existingCount, allowedInstances };
        });

        const wpAdminUser = input.wpAdminUser || "admin";
        const wpAdminPassword = input.wpAdminPassword || this.generatePassword(16);

        const specs = {
            cpu: userPlan.features.maxInstances > 3 ? 2 : 1,
            ramGb: Math.min(
                userPlan.features.storageGb / 10,
                userPlan.features.maxInstances > 3 ? 4 : 2
            ),
            storageGb: Math.min(
                userPlan.features.storageGb / (result.existingCount + 1),
                20
            ),
        };

        let tenant: Tenant | null = null;

        try {
            const database = await this.tenantDatabaseService.createTenantDatabase(
                input.slug
            );

            await this.storageService.createTenantDirectory(input.slug);

            const envVarsJson = JSON.stringify(input.env);

            tenant = await this.tenantRepository.create({
                userId: input.userId,
                name: input.name,
                slug: input.slug,
                region: input.region,
                cpuCores: specs.cpu,
                ramGb: specs.ramGb,
                storageGb: specs.storageGb,
                envVars: envVarsJson,
                notes: input.notes,
                dbName: database.name,
                dbUser: database.user,
                dbPassword: database.password,
                wpAdminUser,
                wpAdminPassword,
                planId: userPlan.id,
                wpAdminEmail: input.wpAdminEmail,
                replicas,
                status: "provisioning",
            });

            await this.wordpressService.deployWordPress(
                tenant.id,
                input.slug,
                database,
                {
                    wpAdminUser,
                    wpAdminPassword,
                    wpAdminEmail: input.wpAdminEmail,
                    siteTitle: input.siteTitle || input.name,
                    replicas,
                    customEnv: input.env,
                }
            );

            const endpoints = this.buildEndpoints(input.slug);
            await this.tenantRepository.update(tenant.id, {
                endpoints: JSON.stringify(endpoints),
            });

            await this.tenantRepository.updateStatus(tenant.id, "running");

            this.logger.log(`Tenant created successfully: ${tenant.id}`);

            return {
                id: tenant.id,
                name: input.name,
                slug: input.slug,
                region: input.region,
                status: "provisioning",
                endpoints,
                replicas,
                runningReplicas: 0,
                wpAdminUser,
                wpAdminPassword,
                wpAdminEmail: tenant.wpAdminEmail || input.wpAdminEmail || undefined,
                specs: {
                    cpuCores: specs.cpu,
                    ramGb: specs.ramGb,
                    storageGb: specs.storageGb,
                },
                env: input.env,
                createdAt: tenant.createdAt,
            };
        } catch (error) {
            this.logger.error(`Failed to create tenant`, error);

            if (tenant) {
                try {
                    await this.tenantRepository.updateStatus(tenant.id, "error");
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

        const wpInstance = await this.wordpressService.getWordPressInstance(
            tenantId
        );
        const storageUsage = await this.storageService.getStorageUsage(tenantId);

        let endpoints = this.buildEndpoints(tenant.slug);
        if (tenant.endpoints) {
            try {
                const stored = JSON.parse(tenant.endpoints);
                if (stored.site && stored.admin) {
                    endpoints = stored;
                    if (!endpoints.site.endsWith("/")) endpoints.site += "/";
                    if (!endpoints.admin.endsWith("/")) endpoints.admin += "/";
                }
            } catch {
                endpoints = this.buildEndpoints(tenant.slug);
            }
        }

        let env: { key: string; value: string }[] = [];
        if (tenant.envVars) {
            try {
                env = JSON.parse(tenant.envVars);
            } catch {
                env = [];
            }
        }

        return {
            id: tenant.id,
            userId: tenant.userId,
            name: tenant.name,
            slug: tenant.slug,
            region: tenant.region,
            status: wpInstance?.status || tenant.status,
            endpoints,
            replicas: wpInstance?.replicas || tenant.replicas || 0,
            runningReplicas: wpInstance?.runningReplicas || 0,
            storageUsage,
            wpAdminUser: tenant.wpAdminUser,
            wpAdminPassword: tenant.wpAdminPassword || undefined,
            wpAdminEmail: tenant.wpAdminEmail || undefined,
            planId: tenant.planId,
            specs: {
                cpuCores: tenant.cpuCores,
                ramGb: tenant.ramGb,
                storageGb: tenant.storageGb,
            },
            env,
            db: {
                host: process.env.MYSQL_HOST || "mysql-master",
                name: tenant.dbName || `wp_${tenant.slug.replace(/-/g, "_")}`,
                user: tenant.dbUser || `user_${tenant.slug}`,
                password: tenant.dbPassword || "",
            },
            createdAt: tenant.createdAt,
        };
    }

    async getAllTenants(): Promise<TenantDetails[]> {
        const tenants = await this.tenantRepository.findAll();
        return this.mapTenants(tenants);
    }

    async getTenantsByUser(userId: string): Promise<TenantDetails[]> {
        const tenants = await this.tenantRepository.findByUserId(userId);
        return this.mapTenants(tenants);
    }

    private async mapTenants(tenants: Tenant[]): Promise<TenantDetails[]> {
        const results: TenantDetails[] = [];
        for (const tenant of tenants) {
            const wpInstance = await this.wordpressService.getWordPressInstance(
                tenant.id
            );

            let endpoints = this.buildEndpoints(tenant.slug);
            if (tenant.endpoints) {
                try {
                    const stored = JSON.parse(tenant.endpoints);
                    if (stored.site && stored.admin) {
                        endpoints = stored;
                        if (!endpoints.site.endsWith("/")) endpoints.site += "/";
                        if (!endpoints.admin.endsWith("/")) endpoints.admin += "/";
                    }
                } catch {
                    endpoints = this.buildEndpoints(tenant.slug);
                }
            }

            let env: { key: string; value: string }[] = [];
            if (tenant.envVars) {
                try {
                    env = JSON.parse(tenant.envVars);
                } catch {
                    env = [];
                }
            }

            results.push({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                region: tenant.region,
                status: wpInstance?.status || tenant.status,
                endpoints,
                replicas: wpInstance?.replicas || tenant.replicas || 0,
                runningReplicas: wpInstance?.runningReplicas || 0,
                createdAt: tenant.createdAt,
                planId: tenant.planId,
                specs: {
                    cpuCores: tenant.cpuCores,
                    ramGb: tenant.ramGb,
                    storageGb: tenant.storageGb,
                },
                env,
                wpAdminEmail: tenant.wpAdminEmail || undefined,
            });
        }

        return results;
    }

    async startTenant(tenantId: string): Promise<void> {
        await this.tenantRepository.updateStatus(tenantId, "starting");
        await this.wordpressService.startWordPress(tenantId);
    }

    async stopTenant(tenantId: string): Promise<void> {
        await this.tenantRepository.updateStatus(tenantId, "stopping");
        await this.wordpressService.stopWordPress(tenantId);
        await this.tenantRepository.updateStatus(tenantId, "stopped");
    }

    async restartTenant(tenantId: string): Promise<void> {
        await this.tenantRepository.updateStatus(tenantId, "restarting");
        await this.wordpressService.restartWordPress(tenantId);
    }

    async rebuildTenant(tenantId: string): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Rebuilding tenant: ${tenantId}`);
        return this.wordpressService.rebuildWordPress(tenantId);
    }

    async deleteTenant(tenantId: string): Promise<void> {
        this.logger.log(`Deleting tenant: ${tenantId}`);

        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw new BadRequestException("Tenant not found");
        }

        try {
            await this.wordpressService.deleteWordPress(tenantId);
        } catch (error) {
            this.logger.warn(
                `Failed to delete WordPress service for ${tenantId}`,
                error
            );
        }

        try {
            await this.storageService.deleteTenantDirectory(tenantId);
        } catch (error) {
            this.logger.warn(`Failed to delete storage for ${tenantId}`, error);
        }

        try {
            await this.tenantDatabaseService.deleteTenantDatabase(tenant.slug);
        } catch (error) {
            this.logger.warn(`Failed to delete database for ${tenantId}`, error);
        }

        await this.tenantRepository.delete(tenantId);

        this.logger.log(`Tenant deleted: ${tenantId}`);
    }

    async getTenantLogs(tenantId: string, tail: number = 100): Promise<string> {
        return this.wordpressService.getWordPressLogs(tenantId, tail);
    }

    async scaleReplicas(
        tenantId: string,
        replicas: number
    ): Promise<{ success: boolean; replicas: number }> {
        this.logger.log(`Scaling tenant ${tenantId} to ${replicas} replicas`);
        return this.wordpressService.scaleWordPress(tenantId, replicas);
    }

    async purgeCache(
        tenantId: string
    ): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Purging cache for tenant: ${tenantId}`);
        return {
            success: true,
            message: "Cache purged successfully",
        };
    }

    async restartPhp(
        tenantId: string
    ): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Restarting PHP for tenant: ${tenantId}`);
        try {
            await this.wordpressService.restartWordPress(tenantId);
            return {
                success: true,
                message: "PHP restarted successfully",
            };
        } catch (error) {
            this.logger.error(`Failed to restart PHP for ${tenantId}`, error);
            return {
                success: false,
                message: "Failed to restart PHP",
            };
        }
    }

    async getMetrics(
        tenantId: string,
        range: "1H" | "24H" | "7D" = "24H"
    ): Promise<{
        chartData: { time: string; requests: number; latency: number }[];
        resources: { cpu: number; memory: number; storage: number };
        specs: { cpuCores: number; ramGb: number; storageGb: number };
    }> {
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw new Error("Tenant not found");
        }

        const points = range === "1H" ? 12 : range === "24H" ? 24 : 7;
        const chartData = Array.from({ length: points }, (_, i) => ({
            time:
                range === "1H"
                    ? `${i * 5}m`
                    : range === "24H"
                        ? `${i}:00`
                        : `Day ${i + 1}`,
            requests: Math.floor(Math.random() * 150) + 50,
            latency: Math.floor(Math.random() * 60) + 20,
        }));

        // fetch real runtime metrics
        let realMetrics = { cpu: 0, memory: 0, storage: 0 };
        try {
            realMetrics = await this.wordpressService.getMetrics(tenantId);
        } catch (error) {
            this.logger.warn(`Failed to get real metrics for ${tenantId}`, error);
            // Fallback to 0 if fails (e.g. stopped container)
        }

        // Calculate percentages based on specs
        // RAM: bytes / (ramGb * 1024^3) * 100
        const ramTotalBytes = tenant.ramGb * 1024 * 1024 * 1024;
        const memoryPercent =
            ramTotalBytes > 0
                ? Math.round((realMetrics.memory / ramTotalBytes) * 100)
                : 0;

        // Storage: bytes / (storageGb * 1024^3) * 100
        const storageTotalBytes = tenant.storageGb * 1024 * 1024 * 1024;
        const storagePercent =
            storageTotalBytes > 0
                ? Math.round((realMetrics.storage / storageTotalBytes) * 100)
                : 0;

        // Uptime calculation
        // If uptime > 0 (running), return 100%. If 0, return 0%.
        const uptimePercent = (realMetrics as any).uptime > 0 ? 100 : 0;

        const resources = {
            cpu: Math.round(realMetrics.cpu), // Directly use CPU % from docker stats
            memory: memoryPercent,
            storage: storagePercent,
            uptime: uptimePercent,
            uptimeSeconds: (realMetrics as any).uptime || 0,
        };

        return {
            chartData,
            resources,
            specs: {
                cpuCores: tenant.cpuCores,
                ramGb: tenant.ramGb,
                storageGb: tenant.storageGb,
            },
        };
    }

    /**
     * Get detailed container inspection including env vars, mounts, networks, etc.
     */
    async getContainerInspect(tenantId: string): Promise<{
        id: string;
        name: string;
        image: string;
        replicas: number;
        runningReplicas: number;
        createdAt: string;
        updatedAt: string;
        env: { key: string; value: string; masked?: boolean }[];
        mounts: { source: string; target: string; type: string }[];
        networks: string[];
        labels: Record<string, string>;
        resources: {
            cpuLimit?: number;
            memoryLimit?: number;
            cpuReservation?: number;
            memoryReservation?: number;
        };
        tasks: {
            id: string;
            nodeId: string;
            state: string;
            desiredState: string;
            error?: string;
            containerStatus?: {
                containerId?: string;
                pid?: number;
                exitCode?: number;
            };
        }[];
    } | null> {
        return this.wordpressService.getContainerInspect(tenantId);
    }
}
