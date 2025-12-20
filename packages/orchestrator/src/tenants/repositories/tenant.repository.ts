import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Tenant, Prisma, TenantStatus, PlanTier } from '@prisma/client';

export interface CreateTenantData {
    userId: string;
    name: string;
    subdomain: string;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    wpAdminUser?: string;
    wpAdminPassword?: string;
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
    constructor(private readonly prisma: PrismaService) { }

    async create(data: CreateTenantData): Promise<Tenant> {
        return this.prisma.tenant.create({
            data: {
                userId: data.userId,
                name: data.name,
                subdomain: data.subdomain,
                dbName: data.dbName,
                dbUser: data.dbUser,
                dbPassword: data.dbPassword,
                wpAdminUser: data.wpAdminUser || 'admin',
                wpAdminPassword: data.wpAdminPassword,
                planId: data.planId || 'free',
                replicas: data.replicas || 1,
                status: data.status || 'creating',
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

    async findBySubdomain(subdomain: string): Promise<Tenant | null> {
        return this.prisma.tenant.findUnique({
            where: { subdomain },
        });
    }

    async findByUserId(userId: string): Promise<Tenant[]> {
        return this.prisma.tenant.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAll(): Promise<Tenant[]> {
        return this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByStatus(status: TenantStatus): Promise<Tenant[]> {
        return this.prisma.tenant.findMany({
            where: { status },
            orderBy: { createdAt: 'desc' },
        });
    }

    async countByUserId(userId: string): Promise<number> {
        return this.prisma.tenant.count({
            where: { userId },
        });
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

    async subdomainExists(subdomain: string): Promise<boolean> {
        const count = await this.prisma.tenant.count({
            where: { subdomain },
        });
        return count > 0;
    }
}
