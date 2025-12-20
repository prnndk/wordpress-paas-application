import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PlanTier, Subscription } from "@prisma/client";

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
		id: "free",
		name: "Free",
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
		id: "hobby" as any,
		name: "Hobby",
		price: 500, // $5.00
		features: {
			maxInstances: 2,
			replicas: 1,
			storageGb: 5,
			bandwidthGb: 20,
			sslCert: true,
			customDomain: true,
			backups: false,
			prioritySupport: false,
		},
	},
	{
		id: "starter",
		name: "Starter",
		price: 1500, // $15.00
		features: {
			maxInstances: 5,
			replicas: 2,
			storageGb: 15,
			bandwidthGb: 50,
			sslCert: true,
			customDomain: true,
			backups: true,
			prioritySupport: false,
		},
	},
	{
		id: "starter_plus" as any,
		name: "Starter Plus",
		price: 2500,
		features: {
			maxInstances: 8,
			replicas: 2,
			storageGb: 25,
			bandwidthGb: 100,
			sslCert: true,
			customDomain: true,
			backups: true,
			prioritySupport: false,
		},
	},
	{
		id: "pro",
		name: "Professional",
		price: 4900, // $49.00
		features: {
			maxInstances: 15,
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
		id: "pro_plus" as any,
		name: "Professional Plus",
		price: 7900,
		features: {
			maxInstances: 25,
			replicas: 3,
			storageGb: 100,
			bandwidthGb: 400,
			sslCert: true,
			customDomain: true,
			backups: true,
			prioritySupport: true,
		},
	},
	{
		id: "business",
		name: "Business",
		price: 14900,
		features: {
			maxInstances: 50,
			replicas: 4,
			storageGb: 200,
			bandwidthGb: 1000,
			sslCert: true,
			customDomain: true,
			backups: true,
			prioritySupport: true,
		},
	},
	{
		id: "business_plus" as any,
		name: "Business Plus",
		price: 24900,
		features: {
			maxInstances: 100,
			replicas: 4,
			storageGb: 500,
			bandwidthGb: 2000,
			sslCert: true,
			customDomain: true,
			backups: true,
			prioritySupport: true,
		},
	},
	{
		id: "agency" as any,
		name: "Agency",
		price: 49900,
		features: {
			maxInstances: 200,
			replicas: 5,
			storageGb: 1000,
			bandwidthGb: 5000,
			sslCert: true,
			customDomain: true,
			backups: true,
			prioritySupport: true,
		},
	},
	{
		id: "enterprise",
		name: "Enterprise",
		price: 99990, // $999.90 (approx)
		features: {
			maxInstances: -1, // unlimited
			replicas: 5,
			storageGb: 5000,
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
		private readonly subscriptionRepository: SubscriptionRepository
	) {}

	getPricingPlans(): PricingPlan[] {
		return PRICING_PLANS;
	}

	getPlanById(planId: PlanTier): PricingPlan | undefined {
		return PRICING_PLANS.find((p) => p.id === planId);
	}

	async createSubscription(
		userId: string,
		planId: PlanTier = "free",
		durationMonths: number = 1
	): Promise<SubscriptionDetails> {
		const subscription = await this.subscriptionRepository.create({
			userId,
			planId,
			durationMonths,
		});

		this.logger.log(
			`Subscription created: ${subscription.id} for user ${userId} with plan ${planId}`
		);

		return this.mapToDetails(subscription);
	}

	async getSubscription(userId: string): Promise<SubscriptionDetails | null> {
		const subscription = await this.subscriptionRepository.findActiveByUserId(
			userId
		);

		if (!subscription) {
			return null;
		}

		return this.mapToDetails(subscription);
	}

	async getUserPlan(userId: string): Promise<PricingPlan> {
		const subscription = await this.subscriptionRepository.findActiveByUserId(
			userId
		);

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
			throw new BadRequestException("Invalid plan");
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
			throw new BadRequestException("Invalid plan");
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

	async canCreateInstance(
		userId: string,
		currentInstanceCount: number
	): Promise<boolean> {
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
