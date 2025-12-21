/**
 * Dashboard Data Service
 * Provides API calls for dashboard metrics and data
 */

import { api } from "./api";
import type { PlanInfo, QuotaStatus, SubscriptionLimits } from "../types/auth";

export interface TenantEndpoints {
	site: string;
	admin: string;
}

export interface Invoice {
	id: string;
	invoiceNumber: string;
	amount: number;
	currency: string;
	status: "draft" | "paid" | "overdue" | "cancelled";
	description?: string;
	planId?: string;
	planName?: string;
	issuedAt: string;
	dueDate?: string;
	paidAt?: string;
	downloadUrl?: string;
}

export interface PaymentMethod {
	id: string;
	brand: string; // "visa", "mastercard", etc.
	last4: string;
	expMonth: number;
	expYear: number;
	isDefault: boolean;
	createdAt: string;
}

export interface Tenant {
	id: string;
	userId?: string;
	name: string;
	slug: string;
	region?: string;
	status: string;
	endpoints?: TenantEndpoints;
	createdAt: string;
	updatedAt?: string;
	wpAdminUser?: string;
	wpAdminPassword?: string;
	wpAdminEmail?: string;
	planId?: string;
	replicas?: number;
	runningReplicas?: number;
	specs?: {
		cpuCores: number;
		ramGb: number;
		storageGb: number;
	};
	env?: { key: string; value: string }[];
	db?: {
		host: string;
		name: string;
		user: string;
		password: string;
	};
	storageUsage?: { bytes: number; files: number };
	internal?: {
		serviceId: string;
		volumeName: string;
		network: string;
		nodeId?: string;
	};
	docker?: {
		image: string;
	};
	user?: {
		email: string;
	};
}

/**
 * Create tenant payload - Subscription-Centric model
 * No planId or specs required - subscription determines limits
 */
export interface CreateTenantPayload {
	name: string;
	slug: string;
	region: string;
	env: { key: string; value: string }[];
	wpAdminUser: string;
	wpAdminPassword: string;
	wpAdminEmail?: string;
	siteTitle?: string;
	notes?: string;
}

export interface ClusterHealth {
	totalNodes: number;
	swarmStatus: string;
	totalCpuCores: number;
	totalRamGb: number;
	runningServices: number;
}

export interface AuditLog {
	id: string;
	timestamp: string;
	level: "info" | "warn" | "error";
	source: string;
	message: string;
	tenantId?: string;
	userId?: string;
	metadata?: Record<string, any>;
}

export interface DashboardMetrics {
	totalInstances: number;
	activeInstances: number;
	estimatedCost: number;
}

export const dashboardService = {
	/**
	 * Get all tenants for current user
	 */
	getTenants: () => api.get<Tenant[]>("/tenants"),

	/**
	 * Delete a tenant/instance
	 */
	deleteTenant: (id: string) => api.delete(`/tenants/${id}`),

	/**
	 * Start a stopped instance
	 */
	startTenant: (id: string) => api.post(`/tenants/${id}/start`, {}),

	/**
	 * Stop a running instance
	 */
	stopTenant: (id: string) => api.post(`/tenants/${id}/stop`, {}),

	/**
	 * Restart an instance
	 */
	restartTenant: (id: string) => api.post(`/tenants/${id}/restart`, {}),

	/**
	 * Rebuild an instance (force recreate containers with latest image)
	 */
	rebuildTenant: (id: string) =>
		api.post<{ success: boolean; message: string }>(
			`/tenants/${id}/rebuild`,
			{}
		),

	/**
	 * Get logs for an instance
	 */
	getLogs: (id: string, tail: number = 100) =>
		api.get<{ logs: string }>(`/tenants/${id}/logs?tail=${tail}`),

	/**
	 * Get single tenant details
	 */
	getTenant: (id: string) => api.get<Tenant>(`/tenants/${id}`),

	/**
	 * Purge cache for an instance
	 */
	purgeCache: (id: string) =>
		api.post<{ success: boolean; message: string }>(
			`/tenants/${id}/purge-cache`,
			{}
		),

	/**
	 * Restart PHP-FPM for an instance
	 */
	restartPhp: (id: string) =>
		api.post<{ success: boolean; message: string }>(
			`/tenants/${id}/restart-php`,
			{}
		),

	/**
	 * Get metrics for an instance (legacy Docker-based)
	 */
	getMetrics: (id: string, range: "1H" | "24H" | "7D" = "24H") =>
		api.get<{
			chartData: { time: string; requests: number; latency: number }[];
			resources: { cpu: number; memory: number; storage: number };
			specs: { cpuCores: number; ramGb: number; storageGb: number };
		}>(`/tenants/${id}/metrics?range=${range}`),

	/**
	 * Get Prometheus-based real-time metrics for an instance
	 */
	getPrometheusMetrics: (id: string) =>
		api.get<{
			cpu: { current: number; avg: number; max: number };
			memory: { current: number; limit: number; percent: number };
			network: {
				rxBytes: number;
				txBytes: number;
				rxRate: number;
				txRate: number;
			};
			containerCount: number;
			timestamp: string;
		}>(`/monitoring/${id}/prometheus`),

	/**
	 * Get Prometheus historical data for charts
	 */
	getPrometheusHistory: (id: string, range: "1H" | "24H" | "7D" = "24H") =>
		api.get<{
			cpu: { timestamp: number; value: number }[];
			memory: { timestamp: number; value: number }[];
			network: {
				rx: { timestamp: number; value: number }[];
				tx: { timestamp: number; value: number }[];
			};
			range: string;
		}>(`/monitoring/${id}/prometheus/history?range=${range}`),

	/**
	 * Get cluster-wide Prometheus metrics (admin)
	 */
	getClusterPrometheusMetrics: async () => {
		const response = await api.get<{
			success: boolean;
			data: {
				totalCpu: number;
				totalMemory: number;
				totalContainers: number;
				nodeCount: number;
				tenantCount: number;
				requestsPerSecond: number;
				avgLatency: number;
			};
		}>("/monitoring/cluster/overview");
		return response.data;
	},

	/**
	 * Check Prometheus health status
	 */
	getPrometheusHealth: () =>
		api.get<{
			healthy: boolean;
			timestamp: string;
		}>("/monitoring/prometheus/health"),

	/**
	 * Get container inspection details (env vars, mounts, resources, tasks)
	 */
	getContainerInspect: (id: string) =>
		api.get<{
			id: string;
			name: string;
			image: string;
			replicas: number;
			runningReplicas: number;
			createdAt: string;
			updatedAt: string;
			env: { key: string; value: string; masked?: boolean }[];
			mounts: { source: string; target: string; type: string }[];
			networks: string[];
			labels: Record<string, string>;
			resources: {
				cpuLimit?: number;
				memoryLimit?: number;
				cpuReservation?: number;
				memoryReservation?: number;
			};
			tasks: {
				id: string;
				nodeId: string;
				state: string;
				desiredState: string;
				error?: string;
				containerStatus?: {
					containerId?: string;
					pid?: number;
					exitCode?: number;
				};
			}[];
		}>(`/tenants/${id}/inspect`),

	/**
	 * Get quota status for current user
	 */
	getQuota: () => api.get<QuotaStatus>("/tenants/quota"),

	/**
	 * Create a new tenant/instance
	 * Note: Subscription quota is checked server-side
	 * Returns 403 with QuotaExceeded error if limit reached
	 */
	createTenant: (payload: CreateTenantPayload) =>
		api.post<Tenant>("/tenants", payload),

	/**
	 * Get cluster health metrics
	 */
	getClusterHealth: () => api.get<ClusterHealth>("/cluster/health"),

	/**
	 * Get all subscription plans
	 */
	getPlans: () => api.get<PlanInfo[]>("/subscriptions/plans"),

	/**
	 * Get recommended plans (top 3 for display)
	 */
	getRecommendedPlans: () =>
		api.get<PlanInfo[]>("/subscriptions/plans/recommended"),

	/**
	 * Preview upgrade proration
	 */
	previewUpgrade: (planId: string) =>
		api.get<any>(`/subscriptions/preview-upgrade?planId=${planId}`),

	/**
	 * Upgrade subscription to new plan (mock billing)
	 */
	upgradePlan: (planId: string) =>
		api.post<{ checkoutId: string; redirectUrl: string }>(
			"/subscriptions/upgrade",
			{ planId }
		),

	/**
	 * Downgrade subscription to new plan
	 */
	downgradePlan: (planId: string) =>
		api.post<{ checkoutId: string; redirectUrl: string }>(
			"/subscriptions/downgrade",
			{ planId }
		),

	/**
	 * Get user invoices
	 */
	getInvoices: () => api.get<Invoice[]>("/invoices"),

	/**
	 * Get invoice download URL
	 */
	/**
	 * Get invoice download URL
	 */
	getInvoiceDownloadUrl: (invoiceId: string) =>
		`${import.meta.env.VITE_ORCHESTRATOR_URL}/invoices/${invoiceId}/download`,

	/**
	 * MOCK: Confirm checkout (simulate webhook)
	 */
	confirmCheckout: (
		checkoutId: string,
		status: "success" | "failed" = "success"
	) =>
		api.post<{ success: boolean; message: string }>(
			"/subscriptions/upgrade/confirm",
			{ checkoutId, status }
		),

	/**
	 * Get user payment methods
	 */
	getPaymentMethods: () => api.get<PaymentMethod[]>("/payment-methods"),

	/**
	 * Add new payment method (mock)
	 */
	addPaymentMethod: (data: {
		token: string;
		brand: string;
		last4: string;
		expMonth: number;
		expYear: number;
		setAsDefault?: boolean;
	}) => api.post<PaymentMethod>("/payment-methods", data),

	/**
	 * Delete payment method
	 */
	deletePaymentMethod: (paymentMethodId: string) =>
		api.delete(`/payment-methods/${paymentMethodId}`),

	/**
	 * Set payment method as default
	 */
	setDefaultPaymentMethod: (paymentMethodId: string) =>
		api.patch<PaymentMethod>(`/payment-methods/${paymentMethodId}/default`, {}),

	/**
	 * Get audit logs
	 */
	getAuditLogs: (params?: {
		userId?: string;
		tenantId?: string;
		limit?: number;
	}) => {
		const queryString = params
			? "?" +
			  new URLSearchParams(
					Object.entries(params)
						.filter(([_, v]) => v !== undefined)
						.map(([k, v]) => [k, String(v)])
			  ).toString()
			: "";
		return api.get<AuditLog[]>(`/audit${queryString}`);
	},

	/**
	 * Calculate dashboard metrics from tenants and subscription
	 */
	calculateMetrics: (
		tenants: Tenant[],
		limits?: SubscriptionLimits
	): DashboardMetrics & { quotaUsed: number; quotaAllowed: number } => {
		const totalInstances = tenants.length;
		const activeInstances = tenants.filter(
			(t) => t.status === "running"
		).length;

		// Calculate estimated cost (stub - needs actual plan data)
		const estimatedCost = tenants.length * 10; // $10 per instance as fallback

		return {
			totalInstances,
			activeInstances,
			estimatedCost,
			quotaUsed: totalInstances,
			quotaAllowed: limits?.instances ?? 1,
		};
	},

	/**
	 * Check if user can create more instances
	 */
	canCreateInstance: (
		tenantsCount: number,
		limits?: SubscriptionLimits
	): boolean => {
		if (!limits) return false;
		if (limits.instances === -1) return true; // unlimited
		return tenantsCount < limits.instances;
	},
};
