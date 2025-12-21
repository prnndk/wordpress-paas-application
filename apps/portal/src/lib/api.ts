/**
 * API Client for WordPress PaaS Orchestrator
 * Uses httpOnly cookie-based authentication
 */

const BASE_URL =
	import.meta.env.VITE_ORCHESTRATOR_URL || "http://localhost:3001";

/**
 * Custom error class for API request failures
 */
export class ApiRequestError extends Error {
	constructor(message: string, public status: number, public data?: any) {
		super(message);
		this.name = "ApiRequestError";
	}
}

/**
 * Make an HTTP request to the API
 * Cookies are automatically sent with credentials: 'include'
 */
async function request<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${BASE_URL}${endpoint}`;

	const headers: HeadersInit = {
		"Content-Type": "application/json",
		...options.headers,
	};

	try {
		const response = await fetch(url, {
			...options,
			headers,
			credentials: "include", // Essential for sending/receiving cookies
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new ApiRequestError(
				errorData.message || `HTTP ${response.status}: ${response.statusText}`,
				response.status,
				errorData
			);
		}

		if (response.status === 204) {
			return {} as T;
		}

		return response.json();
	} catch (error) {
		if (error instanceof ApiRequestError) {
			throw error;
		}
		throw new ApiRequestError(
			error instanceof Error ? error.message : "Network request failed",
			0
		);
	}
}

/**
 * API methods
 */
export const api = {
	get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

	post: <T>(endpoint: string, data?: any) =>
		request<T>(endpoint, {
			method: "POST",
			body: data ? JSON.stringify(data) : undefined,
		}),

	put: <T>(endpoint: string, data?: any) =>
		request<T>(endpoint, {
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		}),

	patch: <T>(endpoint: string, data?: any) =>
		request<T>(endpoint, {
			method: "PATCH",
			body: data ? JSON.stringify(data) : undefined,
		}),

	delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

/**
 * @deprecated Token management functions are no longer needed with httpOnly cookies
 * These are kept as stubs for backward compatibility during migration
 */
export function setAuthToken(_token: string | null): void {
	// No-op: Tokens are now managed via httpOnly cookies
	console.warn(
		"setAuthToken is deprecated. Tokens are now managed via httpOnly cookies."
	);
}

export function getAuthToken(): string | null {
	// Cannot access httpOnly cookies from JavaScript
	// Return null - auth state should be determined by API calls
	return null;
}

export function setRefreshToken(_token: string | null): void {
	// No-op: Tokens are now managed via httpOnly cookies
	console.warn(
		"setRefreshToken is deprecated. Tokens are now managed via httpOnly cookies."
	);
}

export function getRefreshToken(): string | null {
	// Cannot access httpOnly cookies from JavaScript
	return null;
}

export function setTokenExpiry(_expiresIn: number): void {
	// No-op: Token expiry is managed by cookie maxAge
	console.warn(
		"setTokenExpiry is deprecated. Token expiry is managed by cookies."
	);
}

export function isTokenExpired(): boolean {
	// Cannot determine from JavaScript with httpOnly cookies
	// The API will return 401 if token is expired
	return false;
}

export function clearAllTokens(): void {
	// No-op for client side - use logout API endpoint to clear cookies
	console.warn(
		"clearAllTokens is deprecated. Use the /auth/logout endpoint to clear cookies."
	);
}
