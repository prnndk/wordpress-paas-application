import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Subscription, Prisma, PlanTier, SubscriptionStatus } from '@prisma/client';

export interface CreateSubscriptionData {
    userId: string;
    planId: PlanTier;
    durationMonths?: number;
}

export interface SubscriptionWithUser extends Subscription {
    user?: {
        id: string;
        email: string;
        name: string | null;
    };
}

@Injectable()
export class SubscriptionRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: CreateSubscriptionData): Promise<Subscription> {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (data.durationMonths || 1));

        return this.prisma.subscription.create({
            data: {
                userId: data.userId,
                planId: data.planId,
                status: 'active',
                startDate,
                endDate,
            },
        });
    }

    async findById(id: string): Promise<Subscription | null> {
        return this.prisma.subscription.findUnique({
            where: { id },
        });
    }

    async findActiveByUserId(userId: string): Promise<Subscription | null> {
        return this.prisma.subscription.findFirst({
            where: {
                userId,
                status: 'active',
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllByUserId(userId: string): Promise<Subscription[]> {
        return this.prisma.subscription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findExpiredSubscriptions(): Promise<Subscription[]> {
        return this.prisma.subscription.findMany({
            where: {
                status: 'active',
                endDate: {
                    lt: new Date(),
                },
            },
        });
    }

    async update(id: string, data: Prisma.SubscriptionUpdateInput): Promise<Subscription> {
        return this.prisma.subscription.update({
            where: { id },
            data,
        });
    }

    async updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
        return this.prisma.subscription.update({
            where: { id },
            data: { status },
        });
    }

    async cancel(id: string): Promise<Subscription> {
        return this.prisma.subscription.update({
            where: { id },
            data: { status: 'cancelled' },
        });
    }

    async expire(id: string): Promise<Subscription> {
        return this.prisma.subscription.update({
            where: { id },
            data: { status: 'expired' },
        });
    }

    async delete(id: string): Promise<Subscription> {
        return this.prisma.subscription.delete({
            where: { id },
        });
    }

    async cancelAllActiveByUserId(userId: string): Promise<number> {
        const result = await this.prisma.subscription.updateMany({
            where: {
                userId,
                status: 'active',
            },
            data: { status: 'cancelled' },
        });
        return result.count;
    }
}
