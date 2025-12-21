import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InvoicesService } from "../invoices/invoices.service";
import {
	PlanDto,
	UserSubscriptionDto,
	PlanLimitsDto,
} from "./dto/subscription.dto";
import { PrismaService } from "../prisma/prisma.service";

// Extended plans catalog based on user request
const PLANS: PlanDto[] = [
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
		recommended: false,
	},
	{
		id: "hobby",
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
		recommended: false,
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
		recommended: true,
	},
	{
		id: "starter_plus",
		name: "Starter Plus",
		price: 2500, // $25.00
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
		recommended: false,
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
		recommended: true,
	},
	{
		id: "pro_plus",
		name: "Professional Plus",
		price: 7900, // $79.00
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
		recommended: false,
	},
	{
		id: "business",
		name: "Business",
		price: 14900, // $149.00
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
		recommended: true,
	},
	{
		id: "business_plus",
		name: "Business Plus",
		price: 24900, // $249.00
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
		recommended: false,
	},
	{
		id: "agency",
		name: "Agency",
		price: 49900, // $499.00
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
		recommended: false,
	},
	{
		id: "enterprise",
		name: "Enterprise",
		price: 99900, // $999.00
		features: {
			maxInstances: -1,
			replicas: 5,
			storageGb: 5000,
			bandwidthGb: -1,
			sslCert: true,
			customDomain: true,
			backups: true,
			prioritySupport: true,
		},
		recommended: false,
	},
];

@Injectable()
export class SubscriptionsService {
	private readonly logger = new Logger(SubscriptionsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly invoicesService: InvoicesService
	) {}

	/**
	 * Get all plans
	 */
	findAll(): PlanDto[] {
		return PLANS;
	}

	/**
	 * Get recommended plans
	 */
	findRecommended(): PlanDto[] {
		// Return 3 static recommended plans as requested
		const recommendedIds = ["starter", "pro", "business"];
		const recommended = PLANS.filter((p) => recommendedIds.includes(p.id));
		this.logger.log(`Found ${recommended.length} recommended plans`);
		return recommended;
	}

	/**
	 * Get plan by ID
	 */
	getPlan(planId: string): PlanDto | undefined {
		return PLANS.find((p) => p.id === planId);
	}

	/**
	 * Get current subscription for a user
	 */
	async getUserSubscription(userId: string): Promise<UserSubscriptionDto> {
		// Find active subscription
		const sub = await this.prisma.subscription.findFirst({
			where: {
				userId,
				status: "active",
			},
			orderBy: {
				createdAt: "desc", // Get latest
			},
		});

		// Resolve plan
		// Cast enum to string for lookup as our plan IDs are strings matching the enum
		const planId = sub ? String(sub.planId) : "free";
		let plan = this.getPlan(planId);

		// Fallback if not found
		if (!plan) {
			plan = this.getPlan("free") || PLANS[0];
		}

		// Ensure plan is defined for TS (though fallback guarantees it)
		if (!plan) throw new Error("No plans configurated");

		return {
			id: sub ? sub.id : `sub_mock_${userId}`,
			userId,
			planId: plan.id,
			planName: plan.name,
			price: plan.price,
			currency: "USD",
			status: sub ? String(sub.status) : "active",
			startedAt: sub ? sub.startDate.toISOString() : new Date().toISOString(),
			limits: this.mapFeaturesToLimits(plan.features),
		};
	}

	/**
	 * Check if user can create more resources (quota check)
	 */
	async getQuota(userId: string) {
		const subscription = await this.getUserSubscription(userId);
		const limit = subscription.limits.instances;

		// Count current usage
		let used = 0;
		try {
			used = await this.prisma.tenant.count({
				where: { userId },
			});
		} catch (e) {
			// Ignore if table doesn't exist yet
		}

		return {
			used,
			allowed: limit,
			canCreate: limit === -1 || used < limit,
			limits: subscription.limits,
		};
	}

	/**
	 * Calculate prorated credit for remaining days of current subscription
	 */
	public async calculateProration(
		userId: string,
		newPlanPrice: number
	): Promise<any> {
		const currentSub = await this.prisma.subscription.findFirst({
			where: { userId, status: "active" },
		});

		if (!currentSub || currentSub.planId === "free") {
			return {
				netAmount: newPlanPrice,
				credit: 0,
				usedTimeMs: 0,
				remainingTimeMs: 0,
				currentPlanName: "Free",
				newPlanPrice: newPlanPrice,
			};
		}

		const currentPlan = this.getPlan(currentSub.planId as unknown as string);
		if (!currentPlan)
			return {
				netAmount: newPlanPrice,
				credit: 0,
				usedTimeMs: 0,
				remainingTimeMs: 0,
				currentPlanName: "Unknown",
				newPlanPrice: newPlanPrice,
			};

		// Proration Logic (Millisecond Precision)
		const cycleDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
		const now = new Date();
		const elapsedTotal = now.getTime() - currentSub.startDate.getTime();

		// If more than 30 days have passed, mod 30 tells us position in current cycle
		const usedTimeMs = elapsedTotal % cycleDuration;
		const remainingTimeMs = cycleDuration - usedTimeMs;

		// Value calculation
		// Total Plan Value per ms = Price / CycleDuration
		const pricePerMs = currentPlan.price / cycleDuration;

		const remainingValue = remainingTimeMs * pricePerMs;

		// Rounding to 2 decimals worth of "cents" logic usually, but keep integers for cents
		// We use Math.floor for credit to be safe/conservative for the platform, or round?
		// Let's use standard rounding.
		const credit = Math.round(remainingValue);

		this.logger.log(
			`Proration: User ${userId} used ${currentPlan.name} for ${(
				usedTimeMs / 1000
			).toFixed(1)}s. Credit: ${credit}`
		);

		return {
			netAmount: newPlanPrice - credit,
			credit: credit,
			usedTimeMs: usedTimeMs,
			remainingTimeMs: remainingTimeMs,
			currentPlanName: currentPlan.name,
			newPlanPrice: newPlanPrice,
		};
	}

	/**
	 * Upgrade subscription (create checkout)
	 */
	async createUpgradeCheckout(userId: string, targetPlanId: string) {
		this.logger.log(
			`Creating mock checkout for user ${userId} to plan ${targetPlanId}`
		);

		const plan = this.getPlan(targetPlanId);
		if (!plan) {
			throw new BadRequestException("Invalid plan ID");
		}

		// Calculate prorated amount
		const proration = await this.calculateProration(userId, plan.price);

		// Create "Smart" Mock Checkout ID containing detailed payload
		const payloadObj = {
			userId,
			planId: plan.id,
			timestamp: Date.now(),
			amount: proration.netAmount,
			...proration, // Include all details like credit, usedTimeMs etc
		};

		const payloadJson = JSON.stringify(payloadObj);
		const checkoutId = `mock_json_${Buffer.from(payloadJson).toString(
			"base64"
		)}`;

		return {
			checkoutId,
			planId: plan.id,
			amount: proration.netAmount,
			currency: "USD",
			status: "pending",
			redirectUrl: `${
				process.env.FRONTEND_URL || "http://localhost:3030"
			}/checkout/${checkoutId}`,
		};
	}

	/**
	 * Confirm upgrade (webhook handler) - DEPRECATED in favor of confirmCheckout alias
	 */
	async confirmUpgrade(userId: string, _checkoutId: string) {
		this.logger.warn(`Deprecated confirmUpgrade called for ${userId}`);
	}

	// --- Controller aliases & helpers ---

	getAvailablePlans(): PlanDto[] {
		return this.findAll();
	}

	getRecommendedPlans(): PlanDto[] {
		return this.findRecommended();
	}

	getPlanById(planId: string): PlanDto | undefined {
		return this.getPlan(planId);
	}

	/**
	 * Create checkout alias
	 */
	async createCheckout(userId: string, planId: string) {
		return this.createUpgradeCheckout(userId, planId);
	}

	/**
	 * Confirm checkout alias/implementation
	 */
	async confirmCheckout(
		checkoutId: string,
		status: "success" | "failed" | "cancelled"
	) {
		// Mock confirmation logic
		if (status !== "success") {
			return { success: false, message: `Checkout ${status}` };
		}

		try {
			// Extract data from "smart" checkout ID
			let userId, planId, amount;
			let prorationDetails = null;

			// NEW JSON FORMAT (mock_json_)
			if (checkoutId.startsWith("mock_json_")) {
				const base64 = checkoutId.substring(10); // Remove "mock_json_"
				const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
				const payload = JSON.parse(jsonStr);

				userId = payload.userId;
				planId = payload.planId;
				amount = payload.amount || 0;
				prorationDetails = payload; // Contains extra fields
			}
			// LEGACY / BACKWARD COMPAT (mock_)
			else if (checkoutId.startsWith("mock_")) {
				const base64 = checkoutId.substring(5);
				const decoded = Buffer.from(base64, "base64").toString("utf-8");
				const parts = decoded.split(":");
				userId = parts[0];
				planId = parts[1];
				amount = parts[3] ? parseFloat(parts[3]) : 0;
			} else {
				// Fallback for random IDs
				this.logger.warn(`Unknown checkout ID format: ${checkoutId}`);
				return { success: true, message: "Processed (Mock Mode)" };
			}

			if (userId && planId) {
				this.logger.log(
					`Processing checkout for user ${userId} to plan ${planId}. Amount: ${amount}`
				);

				// 1. Update Plan
				await this.updatePlan(userId, planId);

				// 2. Generate Invoice
				const plan = this.getPlan(planId);
				const isRefund = amount < 0;

				let description = "";

				if (isRefund) {
					description = `Downgrade to ${plan?.name || planId}`;
					if (prorationDetails?.remainingTimeMs) {
						const days = Math.floor(
							prorationDetails.remainingTimeMs / (24 * 3600 * 1000)
						);
						description += ` (Refund for ${days} days unused)`;
					}
				} else {
					description = `Upgrade to ${plan?.name || planId}`;
					if (prorationDetails?.credit > 0) {
						description += ` (Credit applied: $${(
							prorationDetails.credit / 100
						).toFixed(2)})`;
					}
				}

				await this.invoicesService.createInvoice(
					userId,
					amount, // can be negative
					planId,
					plan?.name,
					description
				);

				return {
					success: true,
					message: "Subscription updated successfully",
				};
			}

			return { success: false, message: "Invalid checkout payload" };
		} catch (error: any) {
			this.logger.error(`Failed to process checkout: ${error.message}`);
			return { success: false, message: "Failed to process checkout" };
		}
	}

	async updateUserSubscription(userId: string, planId: string) {
		// Direct update (e.g. from Manage Plan -> Downgrade without checkout)
		const plan = this.getPlan(planId);
		if (!plan) throw new BadRequestException("Plan not found");

		const proration = await this.calculateProration(userId, plan.price);
		const amount = proration.netAmount;

		// Update DB
		const sub = await this.updatePlan(userId, planId);

		// Generate Invoice (likely a refund if downgrading directly)
		const isRefund = amount < 0;
		let description = "";

		if (isRefund) {
			description = `Downgrade to ${plan.name}`;
			if (proration.remainingTimeMs) {
				const days = Math.floor(proration.remainingTimeMs / (24 * 3600 * 1000));
				description += ` (Refund for ${days} days unused)`;
			}
		} else {
			description = `Upgrade to ${plan.name}`;
			if (proration.credit > 0) {
				description += ` (Credit applied: $${(proration.credit / 100).toFixed(
					2
				)})`;
			}
		}

		await this.invoicesService.createInvoice(
			userId,
			amount,
			planId,
			plan.name,
			description
		);

		return sub;
	}

	async updatePlan(userId: string, planId: string) {
		const plan = this.getPlan(planId);
		if (!plan) throw new BadRequestException("Invalid plan");

		// Upsert active subscription
		const existing = await this.prisma.subscription.findFirst({
			where: { userId, status: "active" },
		});

		if (existing) {
			await this.prisma.subscription.update({
				where: { id: existing.id },
				data: {
					planId: planId as any, // Cast string to enum
					updatedAt: new Date(),
					// Reset start date if it's a "fresh" start?
					// For proration cycle continuity, Stripe usually doesn't reset anchor.
					// But simple logic: reset start date to now for the new plan period.
					startDate: new Date(),
				},
			});
		} else {
			await this.prisma.subscription.create({
				data: {
					userId,
					planId: planId as any,
					status: "active",
					startDate: new Date(),
				},
			});
		}

		this.logger.log(`User ${userId} upgraded to ${plan.name}`);
		return this.getUserSubscription(userId);
	}

	private mapFeaturesToLimits(features: any): PlanLimitsDto {
		return {
			instances: features.maxInstances,
			maxCpu: 1, // Default or infer
			maxRamGb: 1, // Default or infer
			maxStorageGb: features.storageGb,
			maxBandwidthGb: features.bandwidthGb,
		};
	}
}
