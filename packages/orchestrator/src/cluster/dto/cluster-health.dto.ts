import { ApiProperty } from "@nestjs/swagger";

export class ClusterHealthDto {
	@ApiProperty({ description: "Total number of nodes in the cluster" })
	totalNodes!: number;

	@ApiProperty({
		description: "Swarm status",
		enum: ["active", "inactive", "unknown"],
	})
	swarmStatus!: string;

	@ApiProperty({ description: "Total CPU cores across all nodes" })
	totalCpuCores!: number;

	@ApiProperty({ description: "Total RAM in GB across all nodes" })
	totalRamGb!: number;

	@ApiProperty({ description: "Number of running services" })
	runningServices!: number;
}
