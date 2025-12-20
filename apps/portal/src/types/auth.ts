/**
 * Authentication Type Definitions
 * Types matching the backend orchestrator API contract
 */

export interface User {
	id: string;
	email: string;
	name: string | null;
	roles?: string[];
	avatarUrl?: string;
	createdAt?: string;
	lastLoginAt?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name?: string;
	email: string;
	password: string;
}

// Backend response from /auth/login and /auth/register
export interface AuthResponse {
	accessToken: string;
	expiresIn: number; // seconds
}

// Tenant specs
export interface TenantSpecs {
	cpuCores: number;
	ramGb: number;
	diskGb?: number;
}

// Tenant endpoints
export interface TenantEndpoints {
	admin: string;
	site: string;
}

// Tenant summary from /auth/me
export interface TenantSummary {
	id: string;
	name: string;
	slug?: string;
	status: "running" | "stopped" | "provisioning" | "error";
	domain?: string;
	region?: string;
	specs: TenantSpecs;
	planId?: string;
	planName?: string;
	createdAt: string;
	updatedAt?: string;
	endpoints?: TenantEndpoints;
}

// Subscription limits
export interface SubscriptionLimits {
	instances: number; // -1 for unlimited
	maxCpu: number;
	maxRamGb: number;
	maxStorageGb: number;
	maxBandwidthGb: number; // -1 for unlimited
}

// Subscription current plan
export interface SubscriptionCurrent {
	id: string;
	planId: string;
	planName: string;
	price: number;
	currency: string;
	startedAt: string;
	expiresAt?: string;
	status: "active" | "past_due" | "cancelled";
	limits: SubscriptionLimits;
}

export interface PlanFeatures {
	maxInstances: number;
	replicas: number;
	storageGb: number;
	bandwidthGb: number;
	sslCert: boolean;
	customDomain: boolean;
	backups: boolean;
	prioritySupport: boolean;
	[key: string]: any; // Allow future features
}

// Available plan info
export interface PlanInfo {
	id: string;
	name: string;
	price: number; // in cents
	tier?: string; // Optional if not in JSON but useful for grouping
	currency?: string;
	features: PlanFeatures;
	recommended?: boolean;
	// Backward compatibility/UI helpers if needed
	limits?: SubscriptionLimits;
}

// Subscriptions data
export interface Subscriptions {
	current: SubscriptionCurrent;
	availablePlans?: PlanInfo[];
}

// Quota status
export interface QuotaStatus {
	used: number;
	allowed: number;
	canCreate: boolean;
}

// Quota exceeded error from backend
export interface QuotaExceededError {
	error: "QuotaExceeded";
	message: string;
	allowed: number;
	used: number;
	recommendedPlanId?: string;
}

// Cluster summary
export interface ClusterSummary {
	swarmStatus?: string;
	totalNodes?: number;
	onlineNodes?: number;
	totalCpuCores?: number;
	totalRamGb?: number;
	runningServices?: number;
	metricsUpdatedAt?: string;
}

// Audit log item
export interface AuditLogItem {
	id: string;
	timestamp: string;
	level: "info" | "warn" | "error";
	source: string;
	message: string;
	tenantId?: string;
}

// Audit counts
export interface AuditCounts {
	info: number;
	warn: number;
	error: number;
}

// Audit summary
export interface AuditSummary {
	recent: AuditLogItem[];
	counts: AuditCounts;
}

// Billing breakdown
export interface BillingBreakdown {
	tenantId: string;
	planId: string;
	price: number;
}

// Billing info
export interface Billing {
	monthlyEstimate: number;
	currency: string;
	breakdown: BillingBreakdown[];
}

// Enhanced /auth/me response with optional aggregated data
export interface MeResponse {
	user: User;
	tenants?: TenantSummary[];
	subscriptions?: Subscriptions;
	cluster?: ClusterSummary;
	auditSummary?: AuditSummary;
	billing?: Billing;
}

export interface ApiError {
	message: string;
	statusCode?: number;
	error?: string;
	allowed?: number;
	used?: number;
}

// Include options for /auth/me
export type IncludeOption =
	| "tenants"
	| "subscriptions"
	| "cluster"
	| "audit"
	| "billing"
	| "all";
