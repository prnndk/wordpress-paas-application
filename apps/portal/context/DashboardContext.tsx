import { createContext, useContext } from "react";
import type { SubscriptionCurrent } from "../src/types/auth";

export interface Instance {
	id: string;
	name: string;
	slug: string; // Path segment, not subdomain
	region: string;
	plan: string;
	status: "running" | "stopped" | "provisioning" | "error";
	ip: string;
	endpoints?: {
		site: string;
		admin: string;
	};
	specs: { cpu: string; ram: string };
	created_at: string;
}

export interface DashboardContextType {
	instances: Instance[];
	addInstance: (instance: Instance) => void;
	updateInstanceStatus: (id: string, status: Instance["status"]) => void;
	deleteInstance: (id: string) => void;
	isCreateModalOpen: boolean;
	setCreateModalOpen: (isOpen: boolean) => void;
	user: any;
	refreshInstances: (force?: boolean) => Promise<void>;
	// Subscription-Centric additions
	subscription: SubscriptionCurrent | null;
	quotaUsed: number;
	quotaAllowed: number;
	canCreateInstance: boolean;
	isSidebarCollapsed: boolean;
}

export const DashboardContext = createContext<DashboardContextType | null>(
	null
);

export const useDashboard = () => {
	const context = useContext(DashboardContext);
	if (!context)
		throw new Error("useDashboard must be used within DashboardLayout");
	return context;
};
