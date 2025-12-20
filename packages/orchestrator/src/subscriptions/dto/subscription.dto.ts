import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PlanFeaturesDto {
	@ApiProperty()
	maxInstances!: number;
	@ApiProperty()
	replicas!: number;
	@ApiProperty()
	storageGb!: number;
	@ApiProperty()
	bandwidthGb!: number;
	@ApiProperty()
	sslCert!: boolean;
	@ApiProperty()
	customDomain!: boolean;
	@ApiProperty()
	backups!: boolean;
	@ApiProperty()
	prioritySupport!: boolean;
}

export class PlanLimitsDto {
	@ApiProperty({
		description: "Maximum number of instances (-1 for unlimited)",
	})
	instances!: number;
	@ApiProperty({ description: "Maximum CPU cores per instance" })
	maxCpu!: number;
	@ApiProperty({ description: "Maximum RAM in GB per instance" })
	maxRamGb!: number;
	@ApiProperty({ description: "Maximum storage in GB" })
	maxStorageGb!: number;
	@ApiProperty({ description: "Maximum bandwidth in GB (-1 for unlimited)" })
	maxBandwidthGb!: number;
}

export class PlanDto {
	@ApiProperty({ description: "Plan ID (canonical identifier)" })
	id!: string;

	@ApiProperty({ description: "Plan display name" })
	name!: string;

	@ApiProperty({ description: "Monthly price in cents" })
	price!: number;

	@ApiPropertyOptional({ description: "Plan tier" })
	tier?: string;

	@ApiPropertyOptional({ description: "Currency code" })
	currency?: string;

	@ApiProperty({ description: "Plan features object", type: PlanFeaturesDto })
	features!: PlanFeaturesDto;

	@ApiPropertyOptional({ description: "Whether this plan is recommended" })
	recommended?: boolean;
}

export class UserSubscriptionDto {
	@ApiProperty({ description: "Subscription ID" })
	id!: string;

	@ApiProperty({ description: "User ID" })
	userId!: string;

	@ApiProperty({ description: "Plan ID" })
	planId!: string;

	@ApiProperty({ description: "Plan name" })
	planName!: string;

	@ApiProperty({ description: "Monthly price" })
	price!: number;

	@ApiProperty({ description: "Currency code" })
	currency!: string;

	@ApiProperty({ description: "Start date" })
	startedAt!: string;

	@ApiPropertyOptional({ description: "Expiration date" })
	expiresAt?: string;

	@ApiProperty({
		description: "Status",
		enum: ["active", "past_due", "cancelled", "trial"],
	})
	status!: string;

	@ApiProperty({ description: "Resource limits (mapped from features)" })
	limits!: PlanLimitsDto;
}

export class QuotaStatusDto {
	@ApiProperty({ description: "Number of instances currently used" })
	used!: number;

	@ApiProperty({ description: "Maximum allowed instances (-1 for unlimited)" })
	allowed!: number;

	@ApiProperty({ description: "Whether user can create more instances" })
	canCreate!: boolean;

	@ApiProperty({ description: "Current subscription limits" })
	limits!: PlanLimitsDto;
}

export class QuotaExceededErrorDto {
	@ApiProperty({ description: "Error type", example: "QuotaExceeded" })
	error!: string;

	@ApiProperty({ description: "Error message" })
	message!: string;

	@ApiProperty({ description: "Number of allowed instances" })
	allowed!: number;

	@ApiProperty({ description: "Number of currently used instances" })
	used!: number;

	@ApiPropertyOptional({ description: "Recommended upgrade plan ID" })
	recommendedPlanId?: string;
}

import { IsString, IsNotEmpty, IsIn } from "class-validator";

export class UpgradeRequestDto {
	@ApiProperty({ description: "Plan ID to upgrade to", example: "plan_pro_1" })
	@IsString()
	@IsNotEmpty()
	planId!: string;
}

export class CheckoutResponseDto {
	@ApiProperty({ description: "Checkout ID" })
	checkoutId!: string;

	@ApiProperty({ description: "Plan ID" })
	planId!: string;

	@ApiProperty({ description: "Amount to charge" })
	amount!: number;

	@ApiProperty({ description: "Currency code" })
	currency!: string;

	@ApiProperty({
		description: "Checkout status",
		enum: ["pending", "success", "failed", "cancelled"],
	})
	status!: string;

	@ApiProperty({ description: "Mock checkout/redirect URL" })
	redirectUrl!: string;
}

export class ConfirmCheckoutDto {
	@ApiProperty({ description: "Checkout ID to confirm" })
	@IsString()
	@IsNotEmpty()
	checkoutId!: string;

	@ApiProperty({
		description: "Checkout status",
		enum: ["success", "failed", "cancelled"],
	})
	@IsString()
	@IsIn(["success", "failed", "cancelled"])
	status!: "success" | "failed" | "cancelled";
}
