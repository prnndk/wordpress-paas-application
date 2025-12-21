export type InstanceStatus =
	| "running"
	| "stopped"
	| "provisioning"
	| "error"
	| "starting"
	| "stopping"
	| "restarting";

export interface Instance {
	id: string;
	name: string;
	slug: string; // Path segment for URL
	endpoints?: {
		// Path-based URLs
		site: string;
		admin: string;
	};
	status: InstanceStatus;
	createdAt: string;
	region: string;
	specs: {
		cpu: string;
		ram: string;
		storage: string;
	};
	db: {
		host: string;
		name: string;
		user: string;
	};
}

export interface User {
	id: string;
	email: string;
	name: string;
}

export interface Stats {
	totalInstances: number;
	activeInstances: number;
	totalCpu: number; // in vCores
	totalRam: number; // in GB
}
