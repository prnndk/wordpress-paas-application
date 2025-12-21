import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// User Profile DTO
export class UserProfileDto {
	@ApiProperty({ description: "User ID" })
	id!: string;

	@ApiProperty({ description: "Email address" })
	email!: string;

	@ApiProperty({ description: "Display name", nullable: true })
	name!: string | null;

	@ApiPropertyOptional({ description: "Full name" })
	fullName?: string;

	@ApiPropertyOptional({ description: "Username" })
	username?: string;

	@ApiProperty({ description: "User roles", type: [String] })
	roles!: string[];

	@ApiPropertyOptional({ description: "Avatar URL" })
	avatarUrl?: string;

	@ApiPropertyOptional({ description: "Timezone" })
	timezone?: string;

	@ApiPropertyOptional({ description: "Language preference" })
	language?: string;

	@ApiProperty({ description: "Account creation date" })
	createdAt!: string;

	@ApiPropertyOptional({ description: "Last login date" })
	lastLoginAt?: string;
}

// Tenant Summary DTO
export class TenantSpecsDto {
	@ApiProperty({ description: "CPU cores" })
	cpuCores!: number;

	@ApiProperty({ description: "RAM in GB" })
	ramGb!: number;

	@ApiPropertyOptional({ description: "Disk in GB" })
	diskGb?: number;
}

export class TenantEndpointsDto {
	@ApiPropertyOptional({ description: "WordPress admin URL" })
	admin?: string;

	@ApiPropertyOptional({ description: "Site URL" })
	site?: string;
}

export class TenantSummaryDto {
	@ApiProperty({ description: "Tenant ID" })
	id!: string;

	@ApiProperty({ description: "Tenant name" })
	name!: string;

	@ApiPropertyOptional({ description: "Subdomain slug" })
	slug?: string;

	@ApiProperty({
		description: "Status",
		enum: ["running", "stopped", "provisioning", "error"],
	})
	status!: string;

	@ApiPropertyOptional({ description: "Custom domain" })
	domain?: string;

	@ApiPropertyOptional({ description: "Region" })
	region?: string;

	@ApiProperty({ description: "Instance specs" })
	specs!: TenantSpecsDto;

	@ApiPropertyOptional({ description: "Plan ID" })
	planId?: string;

	@ApiPropertyOptional({ description: "Plan name" })
	planName?: string;

	@ApiProperty({ description: "Creation date" })
	createdAt!: string;

	@ApiPropertyOptional({ description: "Last update date" })
	updatedAt?: string;

	@ApiPropertyOptional({ description: "Endpoints" })
	endpoints?: TenantEndpointsDto;
}

// Subscription Limits DTO
export class SubscriptionLimitsDto {
	@ApiProperty({ description: "Maximum instances (-1 for unlimited)" })
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

// Plan Features DTO (mirrors backend structure)
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

// Subscription DTOs
export class SubscriptionCurrentDto {
	@ApiProperty({ description: "Subscription ID" })
	id!: string;

	@ApiProperty({ description: "Plan ID" })
	planId!: string;

	@ApiProperty({ description: "Plan name" })
	planName!: string;

	@ApiProperty({ description: "Monthly price in cents" })
	price!: number;

	@ApiProperty({ description: "Currency code" })
	currency!: string;

	@ApiProperty({ description: "Start date" })
	startedAt!: string;

	@ApiPropertyOptional({ description: "Expiration date" })
	expiresAt?: string;

	@ApiProperty({
		description: "Status",
		enum: ["active", "past_due", "cancelled"],
	})
	status!: string;

	@ApiProperty({ description: "Subscription resource limits" })
	limits!: SubscriptionLimitsDto;
}

export class PlanInfoDto {
	@ApiProperty({ description: "Plan ID" })
	id!: string;

	@ApiProperty({ description: "Plan name" })
	name!: string;

	@ApiProperty({ description: "Monthly price in cents" })
	price!: number;

	@ApiProperty({ description: "Plan features", type: PlanFeaturesDto })
	features!: PlanFeaturesDto;
}

export class SubscriptionsDto {
	@ApiProperty({ description: "Current subscription" })
	current!: SubscriptionCurrentDto;

	@ApiPropertyOptional({ description: "Available plans", type: [PlanInfoDto] })
	availablePlans?: PlanInfoDto[];
}

// Cluster Summary DTO
export class ClusterSummaryDto {
	@ApiPropertyOptional({ description: "Swarm status" })
	swarmStatus?: string;

	@ApiPropertyOptional({ description: "Total nodes" })
	totalNodes?: number;

	@ApiPropertyOptional({ description: "Online nodes" })
	onlineNodes?: number;

	@ApiPropertyOptional({ description: "Total CPU cores" })
	totalCpuCores?: number;

	@ApiPropertyOptional({ description: "Total RAM in GB" })
	totalRamGb?: number;

	@ApiPropertyOptional({ description: "Running services" })
	runningServices?: number;

	@ApiPropertyOptional({ description: "Metrics timestamp" })
	metricsUpdatedAt?: string;
}

// Audit Summary DTO
export class AuditLogItemDto {
	@ApiProperty({ description: "Log ID" })
	id!: string;

	@ApiProperty({ description: "Timestamp" })
	timestamp!: string;

	@ApiProperty({ description: "Log level", enum: ["info", "warn", "error"] })
	level!: string;

	@ApiProperty({ description: "Log source" })
	source!: string;

	@ApiProperty({ description: "Log message" })
	message!: string;

	@ApiPropertyOptional({ description: "Tenant ID" })
	tenantId?: string;
}

export class AuditCountsDto {
	@ApiProperty({ description: "Info count" })
	info!: number;

	@ApiProperty({ description: "Warning count" })
	warn!: number;

	@ApiProperty({ description: "Error count" })
	error!: number;
}

export class AuditSummaryDto {
	@ApiProperty({ description: "Recent audit logs", type: [AuditLogItemDto] })
	recent!: AuditLogItemDto[];

	@ApiProperty({ description: "Log counts by level" })
	counts!: AuditCountsDto;
}

// Billing DTO
export class BillingBreakdownDto {
	@ApiProperty({ description: "Tenant ID" })
	tenantId!: string;

	@ApiProperty({ description: "Plan ID" })
	planId!: string;

	@ApiProperty({ description: "Price" })
	price!: number;
}

export class BillingDto {
	@ApiProperty({ description: "Monthly cost estimate" })
	monthlyEstimate!: number;

	@ApiProperty({ description: "Currency code" })
	currency!: string;

	@ApiProperty({
		description: "Billing breakdown",
		type: [BillingBreakdownDto],
	})
	breakdown!: BillingBreakdownDto[];
}

// Main Response DTO
export class MeResponseDto {
	@ApiProperty({ description: "User profile" })
	user!: UserProfileDto;

	@ApiPropertyOptional({
		description: "User tenants",
		type: [TenantSummaryDto],
	})
	tenants?: TenantSummaryDto[];

	@ApiPropertyOptional({ description: "Subscription info" })
	subscriptions?: SubscriptionsDto;

	@ApiPropertyOptional({ description: "Cluster summary" })
	cluster?: ClusterSummaryDto;

	@ApiPropertyOptional({ description: "Audit summary" })
	auditSummary?: AuditSummaryDto;

	@ApiPropertyOptional({ description: "Billing info" })
	billing?: BillingDto;
}

// Include options type
export type IncludeOption =
	| "tenants"
	| "subscriptions"
	| "cluster"
	| "audit"
	| "billing"
	| "all";

export function parseIncludes(includeParam?: string): Set<IncludeOption> {
	if (!includeParam) {
		return new Set();
	}

	const includes = includeParam
		.split(",")
		.map((s) => s.trim().toLowerCase()) as IncludeOption[];

	if (includes.includes("all")) {
		return new Set(["tenants", "subscriptions", "cluster", "audit", "billing"]);
	}

	return new Set(
		includes.filter((i) =>
			["tenants", "subscriptions", "cluster", "audit", "billing"].includes(i)
		)
	);
}
