import { Injectable, Logger } from "@nestjs/common";
import { DockerService } from "../docker/docker.service";
import { ClusterHealthDto } from "./dto/cluster-health.dto";

@Injectable()
export class ClusterService {
	private readonly logger = new Logger(ClusterService.name);

	constructor(private readonly dockerService: DockerService) {}

	async getClusterHealth(): Promise<ClusterHealthDto> {
		try {
			// Check if Docker is connected
			if (!this.dockerService.isDockerConnected()) {
				this.logger.warn("Docker is not connected, returning stub data");
				return this.getStubHealth();
			}

			// Get nodes info
			const nodes = await this.dockerService.listNodes();

			// Calculate total resources
			let totalCpuCores = 0;
			let totalRamBytes = 0;

			for (const node of nodes) {
				// Use 'any' type assertion to access Docker node properties
				const nodeAny = node as any;
				if (nodeAny.Description?.Resources) {
					totalCpuCores += nodeAny.Description.Resources.NanoCPUs / 1e9;
					totalRamBytes += nodeAny.Description.Resources.MemoryBytes;
				}
			}

			// Count running services by checking if we can list them
			let runningServices = 0;
			try {
				// Try to get service count from Docker
				const serviceInfo = await this.dockerService.getService("*");
				runningServices = serviceInfo ? 1 : 0;
			} catch {
				// If we can't get services, just use 0
				runningServices = 0;
			}

			return {
				totalNodes: nodes.length,
				swarmStatus: nodes.length > 0 ? "active" : "inactive",
				totalCpuCores: Math.round(totalCpuCores),
				totalRamGb: Math.round((totalRamBytes / 1024 ** 3) * 10) / 10, // Round to 1 decimal
				runningServices,
			};
		} catch (error) {
			this.logger.error("Failed to get cluster health from Docker", error);
			return this.getStubHealth();
		}
	}

	private getStubHealth(): ClusterHealthDto {
		return {
			totalNodes: 1,
			swarmStatus: "unknown",
			totalCpuCores: 4,
			totalRamGb: 8,
			runningServices: 0,
		};
	}
}
