/**
 * Authentication Service
 * Handles all authentication operations with httpOnly cookie-based authentication
 * Tokens are managed by the browser via httpOnly cookies - no client-side token storage
 */

import { api, ApiRequestError } from "./api";
import type {
	User,
	LoginRequest,
	RegisterRequest,
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

// Response type for cookie-based auth endpoints
interface AuthCookieResponse {
	success: boolean;
	expiresIn: number;
}

const USER_STORAGE_KEY = "wp_paas_user";
const PROFILE_STORAGE_KEY = "wp_paas_profile";

// Cached profile data
let cachedProfile: MeResponse | null = null;

/**
 * Login with email and password
 * Tokens are set as httpOnly cookies by the backend
 */
export async function login(email: string, password: string): Promise<User> {
	const payload: LoginRequest = { email, password };

	// Step 1: Login - backend will set httpOnly cookies
	await api.post<AuthCookieResponse>("/auth/login", payload);

	// Step 2: Fetch full user profile with all data
	const profile = await getFullProfile([
		"tenants",
		"subscriptions",
		"cluster",
		"audit",
	]);

	if (!profile) {
		throw new ApiRequestError("Failed to fetch user data after login", 500);
	}

	// Step 3: Cache user and profile in localStorage (non-sensitive UI data only)
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile.user));
	localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
	cachedProfile = profile;

	return profile.user;
}

/**
 * Register a new user account
 * Tokens are set as httpOnly cookies by the backend
 */
export async function register(
	fullName: string,
	email: string,
	password: string
): Promise<User> {
	const payload: RegisterRequest = { fullName, email, password };

	// Step 1: Register - backend will set httpOnly cookies
	await api.post<AuthCookieResponse>("/auth/register", payload);

	// Step 2: Fetch full profile
	const profile = await getFullProfile(["tenants", "subscriptions"]);

	if (!profile) {
		throw new ApiRequestError(
			"Failed to fetch user data after registration",
			500
		);
	}

	// Step 3: Cache user and profile
	localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile.user));
	localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
	cachedProfile = profile;

	return profile.user;
}

/**
 * Logout current user
 * Calls backend to clear httpOnly cookies
 */
export async function logout(): Promise<void> {
	try {
		// Call logout endpoint to clear httpOnly cookies on the server
		await api.post<{ success: boolean }>("/auth/logout");
	} catch (error) {
		// Even if the API call fails, clear local data
		console.error("Logout API call failed:", error);
	}

	// Clear all cached data
	localStorage.removeItem(USER_STORAGE_KEY);
	localStorage.removeItem(PROFILE_STORAGE_KEY);
	cachedProfile = null;
}

/**
 * Get current authenticated user from backend (basic info only)
 * Authentication is verified via httpOnly cookies
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
 * Attempts to restore session using httpOnly cookies
 */
export async function initAuth(): Promise<User | null> {
	// Try to validate session with backend
	// If cookies are valid, backend will authenticate the request
	try {
		const profile = await getFullProfile([
			"tenants",
			"subscriptions",
			"cluster",
			"audit",
		]);

		if (!profile) {
			// Session invalid, clear local data
			localStorage.removeItem(USER_STORAGE_KEY);
			localStorage.removeItem(PROFILE_STORAGE_KEY);
			cachedProfile = null;
			return null;
		}

		return profile.user;
	} catch (error) {
		// Handle 401 errors (session expired)
		if (error instanceof ApiRequestError && error.status === 401) {
			localStorage.removeItem(USER_STORAGE_KEY);
			localStorage.removeItem(PROFILE_STORAGE_KEY);
			cachedProfile = null;
			return null;
		}

		// For network errors, try to use cached data
		console.error("Error during auth init:", error);
		const cachedUser = getCachedUser();
		if (cachedUser) {
			// Return cached user, but session might be stale
			return cachedUser;
		}

		return null;
	}
}

/**
 * Check if user is authenticated
 * With httpOnly cookies, we can only check if we have cached user data
 * The actual auth state is verified on each API call
 */
export function isAuthenticated(): boolean {
	return !!getCachedUser();
}

/**
 * Refresh the access token using the refresh token cookie
 * This is called automatically when the access token expires
 */
export async function refreshToken(): Promise<boolean> {
	try {
		await api.post<AuthCookieResponse>("/auth/refresh");
		return true;
	} catch (error) {
		console.error("Token refresh failed:", error);
		return false;
	}
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
	const result = await api.post<{ success: boolean }>("/auth/delete-account", {
		password,
	});
	// Clear local data after account deletion
	localStorage.removeItem(USER_STORAGE_KEY);
	localStorage.removeItem(PROFILE_STORAGE_KEY);
	cachedProfile = null;
	return result;
}

/**
 * Upload user avatar image
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
	const formData = new FormData();
	formData.append("file", file);

	const result = await api.upload<{ avatarUrl: string }>(
		"/auth/avatar",
		formData
	);

	// Refresh cached profile after upload
	await refreshProfile([]);

	return result;
}
