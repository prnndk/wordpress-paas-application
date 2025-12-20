/**
 * API Client for WordPress PaaS Orchestrator
 * Uses Bearer token authentication with localStorage persistence
 */

const BASE_URL =
	import.meta.env.VITE_ORCHESTRATOR_URL || "http://localhost:3001";
const TOKEN_STORAGE_KEY = "wp_paas_token";

// In-memory token storage (synced with localStorage)
let accessToken: string | null = null;

/**
 * Initialize token from localStorage on module load
 */
function initToken(): void {
	const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
	if (stored) {
		accessToken = stored;
	}
}

// Auto-initialize
initToken();

/**
 * Set authentication token (stores in memory and localStorage)
 */
export function setAuthToken(token: string | null): void {
	accessToken = token;
	if (token) {
		localStorage.setItem(TOKEN_STORAGE_KEY, token);
	} else {
		localStorage.removeItem(TOKEN_STORAGE_KEY);
	}
}

/**
 * Get current authentication token
 */
export function getAuthToken(): string | null {
	return accessToken;
}

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

	// Add Authorization header if token exists
	if (accessToken) {
		headers["Authorization"] = `Bearer ${accessToken}`;
	}

	try {
		const response = await fetch(url, {
			...options,
			headers,
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
