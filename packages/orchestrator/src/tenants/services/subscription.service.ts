import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PlanTier, Subscription } from '@prisma/client';

export interface PricingPlan {
    id: PlanTier;
    name: string;
    price: number; // monthly price in cents
    features: {
        maxInstances: number;
        replicas: number;
        storageGb: number;
        bandwidthGb: number;
        sslCert: boolean;
        customDomain: boolean;
        backups: boolean;
        prioritySupport: boolean;
    };
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        features: {
            maxInstances: 1,
            replicas: 1,
            storageGb: 1,
            bandwidthGb: 5,
            sslCert: true,
            customDomain: false,
            backups: false,
            prioritySupport: false,
        },
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 999, // $9.99
        features: {
            maxInstances: 3,
            replicas: 2,
            storageGb: 10,
            bandwidthGb: 50,
            sslCert: true,
            customDomain: true,
            backups: true,
            prioritySupport: false,
        },
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 2499, // $24.99
        features: {
            maxInstances: 10,
            replicas: 3,
            storageGb: 50,
            bandwidthGb: 200,
            sslCert: true,
            customDomain: true,
            backups: true,
            prioritySupport: true,
        },
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 9999, // $99.99
        features: {
            maxInstances: -1, // unlimited
            replicas: 5,
            storageGb: 500,
            bandwidthGb: -1, // unlimited
            sslCert: true,
            customDomain: true,
            backups: true,
            prioritySupport: true,
        },
    },
];

export interface SubscriptionDetails {
    id: string;
    userId: string;
    planId: PlanTier;
    status: string;
    startDate: Date;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);

    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
    ) { }

    getPricingPlans(): PricingPlan[] {
        return PRICING_PLANS;
    }

    getPlanById(planId: PlanTier): PricingPlan | undefined {
        return PRICING_PLANS.find(p => p.id === planId);
    }

    async createSubscription(
        userId: string,
        planId: PlanTier = 'free',
        durationMonths: number = 1
    ): Promise<SubscriptionDetails> {
        const subscription = await this.subscriptionRepository.create({
            userId,
            planId,
            durationMonths,
        });

        this.logger.log(`Subscription created: ${subscription.id} for user ${userId} with plan ${planId}`);

        return this.mapToDetails(subscription);
    }

    async getSubscription(userId: string): Promise<SubscriptionDetails | null> {
        const subscription = await this.subscriptionRepository.findActiveByUserId(userId);

        if (!subscription) {
            return null;
        }

        return this.mapToDetails(subscription);
    }

    async getUserPlan(userId: string): Promise<PricingPlan> {
        const subscription = await this.subscriptionRepository.findActiveByUserId(userId);

        if (!subscription) {
            // Return free plan by default
            return PRICING_PLANS[0]!;
        }

        // Check if subscription is expired
        if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
            await this.subscriptionRepository.expire(subscription.id);
            return PRICING_PLANS[0]!; // Return to free plan
        }

        return this.getPlanById(subscription.planId) || PRICING_PLANS[0]!;
    }

    async upgradePlan(
        userId: string,
        newPlanId: PlanTier,
        durationMonths: number = 1
    ): Promise<SubscriptionDetails> {
        const newPlan = this.getPlanById(newPlanId);

        if (!newPlan) {
            throw new BadRequestException('Invalid plan');
        }

        // Cancel current subscription if exists
        await this.subscriptionRepository.cancelAllActiveByUserId(userId);

        // Create new subscription
        return this.createSubscription(userId, newPlanId, durationMonths);
    }

    async downgradePlan(
        userId: string,
        newPlanId: PlanTier
    ): Promise<SubscriptionDetails> {
        const newPlan = this.getPlanById(newPlanId);

        if (!newPlan) {
            throw new BadRequestException('Invalid plan');
        }

        // Cancel current and create new
        await this.subscriptionRepository.cancelAllActiveByUserId(userId);

        return this.createSubscription(userId, newPlanId, 1);
    }

    async cancelSubscription(subscriptionId: string): Promise<void> {
        await this.subscriptionRepository.cancel(subscriptionId);
        this.logger.log(`Subscription cancelled: ${subscriptionId}`);
    }

    async expireSubscription(subscriptionId: string): Promise<void> {
        await this.subscriptionRepository.expire(subscriptionId);
        this.logger.log(`Subscription expired: ${subscriptionId}`);
    }

    async canCreateInstance(userId: string, currentInstanceCount: number): Promise<boolean> {
        const plan = await this.getUserPlan(userId);
        if (plan.features.maxInstances === -1) return true; // Unlimited
        return currentInstanceCount < plan.features.maxInstances;
    }

    async getReplicasForPlan(userId: string): Promise<number> {
        const plan = await this.getUserPlan(userId);
        return plan.features.replicas;
    }

    private mapToDetails(subscription: Subscription): SubscriptionDetails {
        return {
            id: subscription.id,
            userId: subscription.userId,
            planId: subscription.planId,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        };
    }
}
