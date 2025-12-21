/**
 * Admin Service for WordPress PaaS Portal
 * Provides API calls for admin-only features:
 * - User Management
 * - System Maintenance (Rolling Updates)
 * - Announcements
 */

import { api } from "./api";

// ============ Types ============

export interface AdminUser {
	id: string;
	email: string;
	name: string | null;
	role: "user" | "admin";
	isActive: boolean;
	createdAt: string;
	_count: {
		tenants: number;
	};
}

export interface AdminStats {
	totalUsers: number;
	totalTenants: number;
	runningTenants: number;
	activeAnnouncements: number;
}

export interface Announcement {
	id: string;
	title: string;
	message: string;
	type: "info" | "warning" | "maintenance";
	isActive: boolean;
	scheduledAt: string | null;
	expiresAt: string | null;
	createdAt: string;
}

export interface CreateAnnouncementPayload {
	title: string;
	message: string;
	type: "info" | "warning" | "maintenance";
	scheduledAt?: string;
	expiresAt?: string;
}

export interface RollingUpdateResult {
	success: boolean;
	servicesUpdated: string[];
	errors: string[];
}

export interface CurrentImageInfo {
	currentImage: string;
}

export interface AdminTenant {
	id: string;
	name: string;
	subdomain: string;
	dbName?: string;
	status: string;
	isActive: boolean;
	planId: string;
	replicas: number;
	createdAt: string;
	updatedAt: string;
	user?: {
		id: string;
		email: string;
		name: string | null;
	};
	docker?: {
		serviceId: string;
		desiredReplicas: number;
		runningReplicas: number;
		image: string;
	};
}

// ============ Admin Service ============

export const adminService = {
	// -------- Stats --------
	/**
	 * Get admin dashboard statistics
	 */
	getStats: () => api.get<AdminStats>("/admin/stats"),

	// -------- User Management --------
	/**
	 * Get all users
	 */
	getUsers: () => api.get<AdminUser[]>("/admin/users"),

	/**
	 * Toggle user active status
	 */
	toggleUserStatus: (userId: string, isActive: boolean) =>
		api.patch<AdminUser>(`/admin/users/${userId}/status`, { isActive }),

	/**
	 * Toggle user role (admin/user)
	 */
	toggleUserRole: (userId: string, role: "user" | "admin") =>
		api.patch<AdminUser>(`/admin/users/${userId}/role`, { role }),

	// -------- Maintenance / Rolling Updates --------
	/**
	 * Get current WordPress Docker image
	 */
	getCurrentImage: () => api.get<CurrentImageInfo>("/admin/maintenance/image"),

	/**
	 * Start rolling update for all WordPress instances
	 */
	startRollingUpdate: (image: string, forceUpdate: boolean = false) =>
		api.post<RollingUpdateResult>("/admin/maintenance/rolling-update", {
			image,
			forceUpdate,
		}),

	// -------- Announcements --------
	/**
	 * Get all announcements
	 */
	getAnnouncements: () => api.get<Announcement[]>("/admin/announcements"),

	/**
	 * Create new announcement
	 */
	createAnnouncement: (data: CreateAnnouncementPayload) =>
		api.post<Announcement>("/admin/announcements", data),

	/**
	 * Toggle announcement active status
	 */
	toggleAnnouncement: (id: string, isActive: boolean) =>
		api.patch<Announcement>(`/admin/announcements/${id}`, { isActive }),

	/**
	 * Delete announcement
	 */
	deleteAnnouncement: (id: string) => api.delete(`/admin/announcements/${id}`),

	// -------- Tenant Management --------
	/**
	 * Get all tenants (admin)
	 */
	getAllTenants: () => api.get<AdminTenant[]>("/admin/tenants"),

	/**
	 * Get single tenant details (admin)
	 */
	getTenant: (tenantId: string) =>
		api.get<AdminTenant>(`/admin/tenants/${tenantId}`),

	/**
	 * Scale tenant replicas
	 */
	scaleTenant: (tenantId: string, replicas: number) =>
		api.post<{ success: boolean; replicas: number }>(`/tenants/${tenantId}/scale`, {
			replicas,
		}),
};
