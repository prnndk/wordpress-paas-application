import {
	Controller,
	Get,
	Post,
	Body,
	Req,
	Query,
	UseGuards,
	HttpCode,
	HttpStatus,
	BadRequestException,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SubscriptionsService } from "./subscriptions.service";
import {
	PlanDto,
	UpgradeRequestDto,
	CheckoutResponseDto,
	ConfirmCheckoutDto,
} from "./dto/subscription.dto";

interface AuthenticatedRequest extends Request {
	user: { id: string; email: string };
}

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
	constructor(private readonly subscriptionsService: SubscriptionsService) {}

	@Get("plans")
	@ApiOperation({ summary: "Get all available subscription plans" })
	@ApiResponse({ status: 200, description: "List of plans", type: [PlanDto] })
	async getPlans(): Promise<PlanDto[]> {
		return this.subscriptionsService.getAvailablePlans();
	}

	@Get("plans/recommended")
	@ApiOperation({ summary: "Get recommended plans (top 3 for display)" })
	@ApiResponse({
		status: 200,
		description: "Recommended plans",
		type: [PlanDto],
	})
	async getRecommendedPlans(): Promise<PlanDto[]> {
		return this.subscriptionsService.getRecommendedPlans();
	}

	@Get("preview-upgrade")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Preview upgrade proration calculation" })
	async previewUpgrade(
		@Query("planId") planId: string,
		@Req() req: AuthenticatedRequest
	) {
		const plan = this.subscriptionsService.getPlanById(planId);
		if (!plan) throw new BadRequestException("Invalid plan ID");

		const proration = await this.subscriptionsService.calculateProration(
			req.user.id,
			plan.price
		);

		return proration;
	}

	@Post("upgrade")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: "Start subscription upgrade (mock checkout)",
		description:
			"Creates a mock checkout record and returns checkout ID. In production, this would redirect to payment provider.",
	})
	@ApiResponse({
		status: 201,
		description: "Checkout created",
		type: CheckoutResponseDto,
	})
	@ApiResponse({ status: 400, description: "Invalid plan ID" })
	async upgradeSubscription(
		@Body() dto: UpgradeRequestDto,
		@Req() req: AuthenticatedRequest
	): Promise<CheckoutResponseDto> {
		// Validate plan exists
		const plan = this.subscriptionsService.getPlanById(dto.planId);
		if (!plan) {
			throw new BadRequestException("Invalid plan ID");
		}

		// Create checkout record
		const checkout = await this.subscriptionsService.createCheckout(
			req.user.id,
			dto.planId
		);

		return {
			checkoutId: checkout.checkoutId,
			planId: checkout.planId,
			amount: checkout.amount,
			currency: checkout.currency,
			status: checkout.status,
			// In dev, provide mock redirect URL (in production, this would be Stripe checkout URL)
			redirectUrl: `${
				process.env.FRONTEND_URL || "http://localhost:3030"
			}/checkout/${checkout.checkoutId}`,
		};
	}

	@Post("downgrade")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: "Downgrade subscription plan",
		description:
			"Downgrades the subscription immediately or at the end of the billing cycle (mock implementation: immediate).",
	})
	@ApiResponse({
		status: 201,
		description: "Downgrade processed",
		type: CheckoutResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: "Invalid plan ID or invalid transition",
	})
	async downgradeSubscription(
		@Body() dto: UpgradeRequestDto,
		@Req() req: AuthenticatedRequest
	): Promise<CheckoutResponseDto> {
		// Validate plan exists
		const plan = this.subscriptionsService.getPlanById(dto.planId);
		if (!plan) {
			throw new BadRequestException("Invalid plan ID");
		}

		// Downgrade: Immediate update without payment flow
		await this.subscriptionsService.updateUserSubscription(
			req.user.id,
			dto.planId
		);

		// Return success response mimicking checkout structure for frontend compatibility
		return {
			checkoutId: `downgrade_${Date.now()}`,
			planId: plan.id,
			amount: plan.price,
			currency: "USD",
			status: "success", // Explicitly success to trigger UI refresh
			redirectUrl: `${
				process.env.FRONTEND_URL || "http://localhost:3030"
			}/plans`,
		};
	}

	@Post("upgrade/confirm")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Webhook endpoint to confirm checkout (mock)",
		description:
			"Simulates payment provider webhook. Updates checkout status and upgrades user subscription if successful.",
	})
	@ApiResponse({ status: 200, description: "Checkout confirmed and processed" })
	@ApiResponse({
		status: 400,
		description: "Invalid checkout or already processed",
	})
	async confirmCheckout(
		@Body() dto: ConfirmCheckoutDto
	): Promise<{ success: boolean; message: string }> {
		const result = await this.subscriptionsService.confirmCheckout(
			dto.checkoutId,
			dto.status
		);

		return {
			success: result?.success || false,
			message: result?.message || "Unknown error",
		};
	}
}
