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
	) {}

	private generatePassword(length: number = 16): string {
		const chars =
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
		let password = "";
		for (let i = 0; i < length; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return password;
	}

	/**
	 * Build endpoints from SERVER_IP and slug
	 * Example: SERVER_IP=10.28.85.212, slug=wendy2
	 * Returns: { site: "https://10.28.85.212/wendy2", admin: "https://10.28.85.212/wendy2/wp-admin" }
	 */
	private buildEndpoints(slug: string): TenantEndpoints {
		const serverIp =
			process.env.SERVER_IP || process.env.BASE_DOMAIN || "localhost";
		// Always use HTTPS for production, HTTP for localhost
		const scheme = serverIp.includes("localhost") ? "http" : "https";
		const siteUrl = `${scheme}://${serverIp}/${slug}/`;
		const adminUrl = `${siteUrl}wp-admin/`;

		return {
			site: siteUrl,
			admin: adminUrl,
		};
	}

	/**
	 * Check quota and throw QuotaExceeded error if user cannot create more instances
	 */
	async checkQuota(
		userId: string
	): Promise<{ canCreate: boolean; used: number; allowed: number }> {
		const userPlan = await this.subscriptionService.getUserPlan(userId);
		const usedInstances = await this.tenantRepository.countByUserId(userId);
		const allowedInstances = userPlan.features.maxInstances;

		// -1 means unlimited
		const canCreate =
			allowedInstances === -1 || usedInstances < allowedInstances;

		return {
			canCreate,
			used: usedInstances,
			allowed: allowedInstances,
		};
	}

	/**
	 * Create tenant with transactional quota check
	 * Ensures atomicity: quota check and tenant creation happen together
	 */
	async createTenant(input: CreateTenantInput): Promise<TenantDetails> {
		this.logger.log(
			`Creating tenant for user: ${input.userId} (${input.name})`
		);

		// Get user plan for specs
		const userPlan = await this.subscriptionService.getUserPlan(input.userId);
		const replicas = userPlan.features.replicas;

		// Use transactional approach for quota check + create
		// This prevents race conditions where two requests could exceed quota
		const result = await this.prisma.$transaction(async (tx) => {
			// Count existing tenants within transaction
			const existingCount = await tx.tenant.count({
				where: { userId: input.userId },
			});

			const allowedInstances = userPlan.features.maxInstances;

			// Check quota (-1 means unlimited)
			if (allowedInstances !== -1 && existingCount >= allowedInstances) {
				throw new ForbiddenException({
					error: "QuotaExceeded",
					message: `Instance limit reached. You have ${existingCount} instances and your plan allows ${allowedInstances}.`,
					allowed: allowedInstances,
					used: existingCount,
					recommendedPlanId: "plan_pro_1",
				});
			}

			// Check if slug already exists
			const existingBySlug = await tx.tenant.findUnique({
				where: { slug: input.slug },
			});
			if (existingBySlug) {
				throw new BadRequestException("Slug already in use");
			}

			return { existingCount, allowedInstances };
		});

		// Generate WordPress admin credentials if not provided
		const wpAdminUser = input.wpAdminUser || "admin";
		const wpAdminPassword = input.wpAdminPassword || this.generatePassword(16);

		// Get specs from subscription plan
		const specs = {
			cpu: userPlan.features.maxInstances > 3 ? 2 : 1, // Higher plans get more CPU
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
			// Step 1: Create tenant database (external MySQL database for WordPress)
			const database = await this.tenantDatabaseService.createTenantDatabase(
				input.slug
			);

			// Step 2: Create storage directory
			await this.storageService.createTenantDirectory(input.slug);

			// Step 3: Serialize env vars
			const envVarsJson = JSON.stringify(input.env);

			// Step 4: Save tenant record using repository
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
				planId: "free", // Default, subscription determines actual limits
				wpAdminEmail: input.wpAdminEmail, // Added wpAdminEmail
				replicas,
				status: "provisioning",
			});

			// Step 5: Deploy WordPress service with admin credentials
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

			// Step 6: Build and store endpoints
			const endpoints = this.buildEndpoints(input.slug);
			await this.tenantRepository.update(tenant.id, {
				endpoints: JSON.stringify(endpoints),
			});

			// Step 7: Update status
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

			// Attempt cleanup on failure
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

		// Parse endpoints from stored JSON or build them
		let endpoints = this.buildEndpoints(tenant.slug);
		if (tenant.endpoints) {
			try {
				const stored = JSON.parse(tenant.endpoints);
				if (stored.site && stored.admin) {
					endpoints = stored;
					// Force trailing slashes
					if (!endpoints.site.endsWith("/")) endpoints.site += "/";
					if (!endpoints.admin.endsWith("/")) endpoints.admin += "/";
				}
			} catch {
				// Fall back to building if JSON is invalid
				endpoints = this.buildEndpoints(tenant.slug);
			}
		}

		// Parse env vars
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
			name: tenant.name,
			slug: tenant.slug,
			region: tenant.region,
			status: wpInstance?.status || tenant.status,
			endpoints,
			replicas: wpInstance?.replicas || tenant.replicas || 0,
			runningReplicas: wpInstance?.runningReplicas || 0,
			storageUsage,
			wpAdminUser: tenant.wpAdminUser,
			wpAdminEmail: tenant.wpAdminEmail || undefined,
			// Do not return password on subsequent fetches
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

	async getTenantsByUser(userId: string): Promise<TenantDetails[]> {
		const tenants = await this.tenantRepository.findByUserId(userId);

		const results: TenantDetails[] = [];
		for (const tenant of tenants) {
			const wpInstance = await this.wordpressService.getWordPressInstance(
				tenant.id
			);

			// Parse endpoints from stored JSON or build them
			let endpoints = this.buildEndpoints(tenant.slug);
			if (tenant.endpoints) {
				try {
					const stored = JSON.parse(tenant.endpoints);
					if (stored.site && stored.admin) {
						endpoints = stored;
						// Force trailing slashes
						if (!endpoints.site.endsWith("/")) endpoints.site += "/";
						if (!endpoints.admin.endsWith("/")) endpoints.admin += "/";
					}
				} catch {
					// Fall back to building if JSON is invalid
					endpoints = this.buildEndpoints(tenant.slug);
				}
			}

			// Parse env vars
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
			});
		}

		return results;
	}

	async startTenant(tenantId: string): Promise<void> {
		// Set intermediate status first
		await this.tenantRepository.updateStatus(tenantId, "starting");
		await this.wordpressService.startWordPress(tenantId);
		// Status will be updated to 'running' by polling/health check
	}

	async stopTenant(tenantId: string): Promise<void> {
		// Set intermediate status first
		await this.tenantRepository.updateStatus(tenantId, "stopping");
		await this.wordpressService.stopWordPress(tenantId);
		// Set final status after operation completes
		await this.tenantRepository.updateStatus(tenantId, "stopped");
	}

	async restartTenant(tenantId: string): Promise<void> {
		// Set intermediate status first
		await this.tenantRepository.updateStatus(tenantId, "restarting");
		await this.wordpressService.restartWordPress(tenantId);
		// Status will be updated to 'running' by polling/health check
	}

	async deleteTenant(tenantId: string): Promise<void> {
		this.logger.log(`Deleting tenant: ${tenantId}`);

		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new BadRequestException("Tenant not found");
		}

		// Step 1: Stop and remove WordPress service
		try {
			await this.wordpressService.deleteWordPress(tenantId);
		} catch (error) {
			this.logger.warn(
				`Failed to delete WordPress service for ${tenantId}`,
				error
			);
		}

		// Step 2: Delete storage
		try {
			await this.storageService.deleteTenantDirectory(tenantId);
		} catch (error) {
			this.logger.warn(`Failed to delete storage for ${tenantId}`, error);
		}

		// Step 3: Delete tenant database
		try {
			await this.tenantDatabaseService.deleteTenantDatabase(tenant.slug);
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

	/**
	 * Purge cache for a WordPress instance
	 * Note: Currently a placeholder - actual cache purging would require Redis/Varnish integration
	 */
	async purgeCache(
		tenantId: string
	): Promise<{ success: boolean; message: string }> {
		this.logger.log(`Purging cache for tenant: ${tenantId}`);
		// TODO: Integrate with Redis/Varnish when caching is implemented
		// For now, we just return success
		return {
			success: true,
			message: "Cache purged successfully",
		};
	}

	/**
	 * Restart PHP-FPM for a WordPress instance
	 * This restarts the WordPress container which effectively restarts PHP
	 */
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

	/**
	 * Get metrics for a WordPress instance
	 * Returns mock data for now - real metrics require Prometheus/Grafana integration
	 */
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

		// Generate mock chart data based on range
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

		// Mock resource usage
		const resources = {
			cpu: Math.floor(Math.random() * 40) + 20,
			memory: Math.floor(Math.random() * 30) + 20,
			storage: Math.floor(Math.random() * 40) + 10,
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
}
