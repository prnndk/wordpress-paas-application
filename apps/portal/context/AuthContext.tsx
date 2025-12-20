import React, { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../src/lib/auth";
import type { User } from "../src/types/auth";
import { ApiRequestError } from "../src/lib/api";

// --- Types ---
interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<boolean>;
	register: (name: string, email: string, password: string) => Promise<boolean>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Initialize authentication on mount
	useEffect(() => {
		const initializeAuth = async () => {
			setIsLoading(true);

			try {
				// Try to restore session from backend
				const currentUser = await authService.initAuth();
				setUser(currentUser);
			} catch (error) {
				console.error("Failed to initialize auth:", error);
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		initializeAuth();
	}, []);

	// Login function
	const login = async (email: string, password: string): Promise<boolean> => {
		try {
			const loggedInUser = await authService.login(email, password);
			setUser(loggedInUser);
			return true;
		} catch (error) {
			console.error("Login failed:", error);
			if (error instanceof ApiRequestError) {
				// Error message will be shown in UI
				throw error;
			}
			return false;
		}
	};

	// Register function
	const register = async (
		name: string,
		email: string,
		password: string
	): Promise<boolean> => {
		try {
			const registeredUser = await authService.register(name, email, password);
			setUser(registeredUser);
			return true;
		} catch (error) {
			console.error("Registration failed:", error);
			if (error instanceof ApiRequestError) {
				// Error message will be shown in UI
				throw error;
			}
			return false;
		}
	};

	// Logout function
	const logout = async () => {
		try {
			await authService.logout();
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			// Always clear user state, even if API call fails
			setUser(null);
		}
	};

	const value = {
		user,
		isLoading,
		login,
		register,
		logout,
		isAuthenticated: !!user,
	};

	// Show loading screen during initial auth check
	if (isLoading && !user) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-slate-50'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
			</div>
		);
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
