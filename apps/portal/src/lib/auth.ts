/**
 * Authentication Service
 * Handles all authentication operations with Bearer token authentication
 */

import { api, setAuthToken, getAuthToken, ApiRequestError } from "./api";
import type {
	User,
	LoginRequest,
	RegisterRequest,
	AuthResponse,
	MeResponse,
	IncludeOption,
	TenantSummary,
	Subscriptions,
	ClusterSummary,
	AuditSummary,
	Billing,
} from "../types/auth";

// Re-export types for use by other modules
export type {
	User,
	MeResponse,
	IncludeOption,
	TenantSummary,
	Subscriptions,
	ClusterSummary,
	AuditSummary,
	Billing,
};

const USER_STORAGE_KEY = "wp_paas_user";
const PROFILE_STORAGE_KEY = "wp_paas_profile";

// Cached profile data
let cachedProfile: MeResponse | null = null;

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<User> {
	const payload: LoginRequest = { email, password };

	// Step 1: Get access token from backend
	const authResponse = await api.post<AuthResponse>("/auth/login", payload);

	// Step 2: Store token (in memory + localStorage)
	setAuthToken(authResponse.accessToken);

	// Step 3: Fetch full user profile with all data
	const profile = await getFullProfile([
		"tenants",
		"subscriptions",
		"cluster",
		"audit",
	]);

	if (!profile) {
		throw new ApiRequestError("Failed to fetch user data after login", 500);
	}

	// Step 4: Cache user and profile
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile.user));
	localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
	cachedProfile = profile;

	return profile.user;
}

/**
 * Register a new user account
 */
export async function register(
	fullName: string,
	email: string,
	password: string
): Promise<User> {
	const payload: RegisterRequest = { fullName, email, password };

	// Step 1: Register and get token
	const authResponse = await api.post<AuthResponse>("/auth/register", payload);

	// Step 2: Store token
	setAuthToken(authResponse.accessToken);

	// Step 3: Fetch full profile
	const profile = await getFullProfile(["tenants", "subscriptions"]);

	if (!profile) {
		throw new ApiRequestError(
			"Failed to fetch user data after registration",
			500
		);
	}

	// Step 4: Cache user and profile
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile.user));
	localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
	cachedProfile = profile;

	return profile.user;
}

/**
 * Logout current user
 * Clears token and localStorage
 */
export async function logout(): Promise<void> {
	// Clear token (memory + localStorage)
	setAuthToken(null);

	// Clear all cached data
	localStorage.removeItem(USER_STORAGE_KEY);
	localStorage.removeItem(PROFILE_STORAGE_KEY);
	cachedProfile = null;
}

/**
 * Get current authenticated user from backend (basic info only)
 * Requires valid Bearer token
 */
export async function getCurrentUser(): Promise<User | null> {
	try {
		const profile = await getFullProfile([]);

		if (!profile) {
			return null;
		}

		// Update localStorage with fresh user data
		localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile.user));

		return profile.user;
	} catch (error) {
		// Session invalid or expired
		if (error instanceof ApiRequestError && error.status === 401) {
			// Clear stale data
			localStorage.removeItem(USER_STORAGE_KEY);
			localStorage.removeItem(PROFILE_STORAGE_KEY);
			setAuthToken(null);
			cachedProfile = null;
			return null;
		}

		// For other errors, return null
		console.error("Error fetching current user:", error);
		return null;
	}
}

/**
 * Get full user profile with optional aggregated data
 */
export async function getFullProfile(
	includes: IncludeOption[] = []
): Promise<MeResponse | null> {
	try {
		const includeParam =
			includes.length > 0 ? `?include=${includes.join(",")}` : "";
		const profile = await api.get<MeResponse>(`/auth/me${includeParam}`);

		// Cache profile
		cachedProfile = profile;
		localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

		return profile;
	} catch (error) {
		if (error instanceof ApiRequestError && error.status === 401) {
			cachedProfile = null;
			return null;
		}
		console.error("Error fetching full profile:", error);
		return null;
	}
}

/**
 * Get cached profile from memory or localStorage
 */
export function getCachedProfile(): MeResponse | null {
	if (cachedProfile) {
		return cachedProfile;
	}

	try {
		const cached = localStorage.getItem(PROFILE_STORAGE_KEY);
		if (cached) {
			cachedProfile = JSON.parse(cached);
			return cachedProfile;
		}
	} catch {
		// Ignore parse errors
	}

	return null;
}

/**
 * Get cached user from localStorage
 */
export function getCachedUser(): User | null {
	try {
		const cached = localStorage.getItem(USER_STORAGE_KEY);
		return cached ? JSON.parse(cached) : null;
	} catch {
		return null;
	}
}

/**
 * Get cached tenants (from profile)
 */
export function getCachedTenants(): TenantSummary[] | null {
	const profile = getCachedProfile();
	return profile?.tenants || null;
}

/**
 * Get cached subscriptions (from profile)
 */
export function getCachedSubscriptions(): Subscriptions | null {
	const profile = getCachedProfile();
	return profile?.subscriptions || null;
}

/**
 * Get cached cluster (from profile)
 */
export function getCachedCluster(): ClusterSummary | null {
	const profile = getCachedProfile();
	return profile?.cluster || null;
}

/**
 * Get cached audit summary (from profile)
 */
export function getCachedAuditSummary(): AuditSummary | null {
	const profile = getCachedProfile();
	return profile?.auditSummary || null;
}

/**
 * Get cached billing (from profile)
 */
export function getCachedBilling(): Billing | null {
	const profile = getCachedProfile();
	return profile?.billing || null;
}

/**
 * Initialize authentication on app startup
 * Attempts to restore session using stored token
 */
export async function initAuth(): Promise<User | null> {
	// Check if we have a token
	const token = getAuthToken();

	if (!token) {
		// No token, clear any stale user data
		localStorage.removeItem(USER_STORAGE_KEY);
		localStorage.removeItem(PROFILE_STORAGE_KEY);
		cachedProfile = null;
		return null;
	}

	// Try to validate token with backend and get full profile
	const profile = await getFullProfile([
		"tenants",
		"subscriptions",
		"cluster",
		"audit",
	]);

	if (!profile) {
		// Token invalid, clear everything
		setAuthToken(null);
		localStorage.removeItem(USER_STORAGE_KEY);
		localStorage.removeItem(PROFILE_STORAGE_KEY);
		cachedProfile = null;
		return null;
	}

	return profile.user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	return !!getAuthToken() && !!getCachedUser();
}

/**
 * Refresh profile data with specific includes
 */
export async function refreshProfile(
	includes: IncludeOption[] = ["tenants", "subscriptions", "cluster", "audit"]
): Promise<MeResponse | null> {
	return getFullProfile(includes);
}

/**
 * Update user profile (fullName, name, avatarUrl)
 */
export async function updateProfile(data: {
	fullName?: string;
	name?: string;
	avatarUrl?: string;
}): Promise<{ success: boolean }> {
	const result = await api.patch<{ success: boolean }>("/auth/profile", data);
	// Refresh cached profile after update
	await refreshProfile([]);
	return result;
}

/**
 * Update user settings (timezone, language)
 */
export async function updateSettings(data: {
	timezone?: string;
	language?: string;
}): Promise<{ success: boolean }> {
	const result = await api.patch<{ success: boolean }>("/auth/settings", data);
	// Refresh cached profile after update
	await refreshProfile([]);
	return result;
}

/**
 * Change user password
 */
export async function changePassword(
	currentPassword: string,
	newPassword: string
): Promise<{ success: boolean }> {
	return api.post<{ success: boolean }>("/auth/change-password", {
		currentPassword,
		newPassword,
	});
}

/**
 * Delete user account permanently (requires password verification)
 */
export async function deleteAccount(
	password: string
): Promise<{ success: boolean }> {
	return api.post<{ success: boolean }>("/auth/delete-account", { password });
}

/**
 * Upload user avatar image
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
	const formData = new FormData();
	formData.append("file", file);

	const token = getAuthToken();
	const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

	const response = await fetch(`${baseUrl}/auth/avatar`, {
		method: "POST",
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: formData,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message || "Failed to upload avatar");
	}

	const result = await response.json();

	// Refresh cached profile after upload
	await refreshProfile([]);

	return result;
}
