import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DockerService } from "../docker/docker.service";
import { MinioService } from "../storage/minio.service";

export interface UserWithStats {
	id: string;
	email: string;
	name: string | null;
	role: string;
	isActive: boolean;
	createdAt: Date;
	_count: {
		tenants: number;
	};
}

export interface TenantWithUsage {
	id: string;
	name: string;
	slug: string;
	status: string;
	isActive: boolean;
	planId: string;
	replicas: number;
	createdAt: Date;
	user: {
		id: string;
		email: string;
		name: string | null;
	};
	runningReplicas?: number;
}

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly dockerService: DockerService,
		private readonly minioService: MinioService
	) { }

	async getAllUsers(): Promise<UserWithStats[]> {
		return this.prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				isActive: true,
				createdAt: true,
				_count: {
					select: { tenants: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async toggleUserStatus(userId: string, isActive: boolean) {
		return this.prisma.user.update({
			where: { id: userId },
			data: { isActive },
		});
	}

	async setUserRole(userId: string, role: "user" | "admin") {
		return this.prisma.user.update({
			where: { id: userId },
			data: { role },
		});
	}

	async getAllTenants(): Promise<TenantWithUsage[]> {
		const tenants = await this.prisma.tenant.findMany({
			include: {
				user: {
					select: { id: true, email: true, name: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Enhance with Docker service info
		const result: TenantWithUsage[] = [];
		for (const tenant of tenants) {
			const serviceName = `wp_${tenant.id}`;
			let runningReplicas = 0;

			try {
				const serviceInfo = await this.dockerService.getService(serviceName);
				if (serviceInfo) {
					runningReplicas = serviceInfo.runningReplicas;
				}
			} catch (error) {
				this.logger.warn(`Failed to get service info for ${serviceName}`);
			}

			result.push({
				...tenant,
				runningReplicas,
			});
		}

		return result;
	}

	async toggleTenantStatus(tenantId: string, isActive: boolean) {
		const tenant = await this.prisma.tenant.update({
			where: { id: tenantId },
			data: { isActive },
		});

		// If deactivating, scale service to 0
		const serviceName = `wp_${tenantId}`;
		try {
			if (!isActive) {
				await this.dockerService.scaleService(serviceName, 0);
				this.logger.log(
					`Scaled down service ${serviceName} due to deactivation`
				);
			} else {
				// Restore replicas when reactivating
				await this.dockerService.scaleService(serviceName, tenant.replicas);
				this.logger.log(
					`Scaled up service ${serviceName} to ${tenant.replicas} replicas`
				);
			}
		} catch (error) {
			this.logger.error(`Failed to scale service ${serviceName}: ${error}`);
		}

		return tenant;
	}

	async getStats() {
		const [totalUsers, totalTenants, runningTenants, activeAnnouncements] =
			await Promise.all([
				this.prisma.user.count(),
				this.prisma.tenant.count(),
				this.prisma.tenant.count({ where: { status: "running" } }),
				this.prisma.announcement.count({ where: { isActive: true } }),
			]);

		return {
			totalUsers,
			totalTenants,
			runningTenants,
			activeAnnouncements,
		};
	}

	async getTenantDetails(tenantId: string) {
		const tenant = await this.prisma.tenant.findUnique({
			where: { id: tenantId },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
						role: true,
						isActive: true,
						createdAt: true,
					},
				},
			},
		});

		if (!tenant) {
			return null;
		}

		// Get Docker service info
		const serviceName = `wp_${tenantId}`;
		let dockerInfo = {
			runningReplicas: 0,
			desiredReplicas: tenant.replicas,
			image: "unknown",
			createdAt: null as string | null,
			updatedAt: null as string | null,
		};

		try {
			const serviceInfo = await this.dockerService.getService(serviceName);
			if (serviceInfo) {
				dockerInfo = {
					runningReplicas: serviceInfo.runningReplicas,
					desiredReplicas: serviceInfo.replicas,
					image: serviceInfo.image,
					createdAt: serviceInfo.createdAt,
					updatedAt: serviceInfo.updatedAt,
				};
			}
		} catch (error) {
			this.logger.warn(
				`Failed to get service info for ${serviceName}: ${error}`
			);
		}

		// Get service logs (last 50 lines)
		let recentLogs: string[] = [];
		try {
			const logs = await this.dockerService.getServiceLogs(serviceName, {
				tail: 50,
			});
			recentLogs = logs ? logs.split("\n").filter((l) => l.trim()) : [];
		} catch (error) {
			this.logger.warn(`Failed to get logs for ${serviceName}: ${error}`);
		}

		// Get storage usage from MinIO
		let storageUsage = {
			totalObjects: 0,
			totalSize: 0,
			totalSizeFormatted: "0 B",
		};
		try {
			storageUsage = await this.minioService.getTenantStorageUsage(tenant.slug);
		} catch (error) {
			this.logger.warn(
				`Failed to get storage usage for ${tenant.slug}: ${error}`
			);
		}

		// Get resource usage (CPU/Memory)
		let resourceUsage = {
			cpuPercent: 0,
			memoryUsage: 0,
			memoryLimit: 0,
			memoryPercent: 0,
			memoryUsageFormatted: "0 B",
			memoryLimitFormatted: "0 B",
		};
		try {
			const stats = await this.dockerService.getServiceStats(serviceName);
			if (stats) {
				resourceUsage = {
					...stats,
					memoryUsageFormatted: this.formatBytes(stats.memoryUsage),
					memoryLimitFormatted: this.formatBytes(stats.memoryLimit),
				};
			}
		} catch (error) {
			this.logger.warn(
				`Failed to get resource usage for ${serviceName}: ${error}`
			);
		}

		return {
			...tenant,
			docker: dockerInfo,
			recentLogs,
			storageUsage,
			resourceUsage,
			urls: {
				frontend: `/${tenant.slug}`,
				admin: `/${tenant.slug}/wp-admin`,
			},
		};
	}

	async getAllServices() {
		return this.dockerService.listAllServicesWithTasks();
	}

	async getServiceLogs(serviceName: string, tail: number = 100): Promise<string[]> {
		this.logger.log(`Fetching logs for service: ${serviceName}, tail: ${tail}`);
		try {
			const logs = await this.dockerService.getServiceLogs(serviceName, { tail });
			const lines = logs.split("\n").filter((line) => line.trim().length > 0);
			this.logger.log(`Successfully fetched ${lines.length} log lines for ${serviceName}`);
			return lines;
		} catch (error: any) {
			this.logger.error(`Failed to get logs for service ${serviceName}: ${error.message || error}`);
			// Return error message as log line for debugging
			return [`[Error] Failed to fetch logs: ${error.message || 'Unknown error'}`];
		}
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	/**
	 * Update Docker service resource limits (CPU and Memory)
	 * @param serviceName The name of the Docker service
	 * @param resources Object containing cpuLimit (cores), memoryLimit (MB), cpuReservation (cores), memoryReservation (MB)
	 */
	async updateServiceResources(
		serviceName: string,
		resources: {
			cpuLimit?: number; // CPU cores (e.g., 0.5 = half a core)
			memoryLimit?: number; // Memory in MB
			cpuReservation?: number; // CPU cores
			memoryReservation?: number; // Memory in MB
		}
	): Promise<void> {
		this.logger.log(
			`Updating resources for service ${serviceName}: CPU=${resources.cpuLimit || 'unchanged'} cores, Memory=${resources.memoryLimit || 'unchanged'} MB`
		);

		// Convert user-friendly values to Docker format
		const dockerResources: {
			cpuLimit?: number;
			memoryLimit?: number;
			cpuReservation?: number;
			memoryReservation?: number;
		} = {};

		// Convert CPU cores to nanoCPUs (1 CPU = 1e9 nanoCPUs)
		if (resources.cpuLimit !== undefined) {
			dockerResources.cpuLimit = Math.round(resources.cpuLimit * 1e9);
		}
		if (resources.cpuReservation !== undefined) {
			dockerResources.cpuReservation = Math.round(resources.cpuReservation * 1e9);
		}

		// Convert MB to bytes
		if (resources.memoryLimit !== undefined) {
			dockerResources.memoryLimit = resources.memoryLimit * 1024 * 1024;
		}
		if (resources.memoryReservation !== undefined) {
			dockerResources.memoryReservation = resources.memoryReservation * 1024 * 1024;
		}

		await this.dockerService.updateServiceResources(serviceName, dockerResources);
		this.logger.log(`Successfully updated resources for service ${serviceName}`);
	}
}
