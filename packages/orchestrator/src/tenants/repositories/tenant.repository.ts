import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Tenant, Prisma, TenantStatus, PlanTier } from "@prisma/client";

export interface CreateTenantData {
	userId: string;
	name: string;
	slug: string; // URL path segment, required
	region?: string;
	cpuCores?: number;
	ramGb?: number;
	storageGb?: number;

	envVars?: string;
	notes?: string;
	dbName: string;
	dbUser: string;
	dbPassword: string;
	wpAdminUser?: string;
	wpAdminPassword?: string;
	wpAdminEmail?: string;
	planId?: PlanTier;
	replicas?: number;
	status?: TenantStatus;
}

export interface TenantWithUser extends Tenant {
	user?: {
		id: string;
		email: string;
		name: string | null;
	};
}

@Injectable()
export class TenantRepository {
	private readonly logger = new Logger(TenantRepository.name);

	constructor(private readonly prisma: PrismaService) {}

	async create(data: CreateTenantData): Promise<Tenant> {
		return this.prisma.tenant.create({
			data: {
				userId: data.userId,
				name: data.name,
				slug: data.slug, // slug is now the primary path identifier
				region: data.region || "us-east-1",
				cpuCores: data.cpuCores || 1,
				ramGb: data.ramGb || 2,
				storageGb: data.storageGb || 10,

				envVars: data.envVars,
				notes: data.notes,
				dbName: data.dbName,
				dbUser: data.dbUser,
				dbPassword: data.dbPassword,
				wpAdminUser: data.wpAdminUser || "admin",
				wpAdminPassword: data.wpAdminPassword,
				wpAdminEmail: data.wpAdminEmail,
				planId: data.planId || "free",
				replicas: data.replicas || 1,
				status: data.status || "creating",
			},
		});
	}

	async findById(id: string): Promise<Tenant | null> {
		return this.prisma.tenant.findUnique({
			where: { id },
		});
	}

	async findByIdWithUser(id: string): Promise<TenantWithUser | null> {
		return this.prisma.tenant.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
					},
				},
			},
		});
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		try {
			return await this.prisma.tenant.findUnique({ where: { slug } });
		} catch (err: any) {
			this.logger.warn(
				`findBySlug failed (maybe DB schema not migrated): ${
					err?.message || err
				}`
			);
			return null;
		}
	}

	async findByUserId(userId: string): Promise<Tenant[]> {
		try {
			return await this.prisma.tenant.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});
		} catch (err: any) {
			this.logger.warn(
				`findByUserId failed (missing column/table?): ${err?.message || err}`
			);
			return [];
		}
	}

	async findManyByUserId(userId: string): Promise<Tenant[]> {
		return this.findByUserId(userId);
	}

	async findAll(): Promise<Tenant[]> {
		try {
			return await this.prisma.tenant.findMany({
				orderBy: { createdAt: "desc" },
			});
		} catch (err: any) {
			this.logger.warn(
				`findAll failed (missing column/table?): ${err?.message || err}`
			);
			return [];
		}
	}

	async findByStatus(status: TenantStatus): Promise<Tenant[]> {
		try {
			return await this.prisma.tenant.findMany({
				where: { status },
				orderBy: { createdAt: "desc" },
			});
		} catch (err: any) {
			this.logger.warn(
				`findByStatus failed (missing column/table?): ${err?.message || err}`
			);
			return [];
		}
	}

	async countByUserId(userId: string): Promise<number> {
		try {
			return await this.prisma.tenant.count({ where: { userId } });
		} catch (err: any) {
			this.logger.warn(
				`countByUserId failed (missing column/table?): ${err?.message || err}`
			);
			return 0;
		}
	}

	async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
		return this.prisma.tenant.update({
			where: { id },
			data,
		});
	}

	async updateStatus(id: string, status: TenantStatus): Promise<Tenant> {
		return this.prisma.tenant.update({
			where: { id },
			data: { status },
		});
	}

	async updateReplicas(id: string, replicas: number): Promise<Tenant> {
		return this.prisma.tenant.update({
			where: { id },
			data: { replicas },
		});
	}

	async delete(id: string): Promise<Tenant> {
		return this.prisma.tenant.delete({
			where: { id },
		});
	}

	async slugExists(slug: string): Promise<boolean> {
		try {
			const count = await this.prisma.tenant.count({ where: { slug } });
			return count > 0;
		} catch (err: any) {
			this.logger.warn(
				`slugExists check failed (DB may not have slug column): ${
					err?.message || err
				}`
			);
			return false;
		}
	}
}
