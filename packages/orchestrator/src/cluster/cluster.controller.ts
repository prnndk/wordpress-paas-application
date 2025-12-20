import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ClusterService } from "./cluster.service";
import { ClusterHealthDto } from "./dto/cluster-health.dto";

@ApiTags("Cluster")
@Controller("cluster")
export class ClusterController {
	constructor(private readonly clusterService: ClusterService) {}

	@Get("health")
	@ApiOperation({ summary: "Get cluster health metrics" })
	@ApiResponse({
		status: 200,
		description: "Cluster health metrics",
		type: ClusterHealthDto,
	})
	async getHealth(): Promise<ClusterHealthDto> {
		return this.clusterService.getClusterHealth();
	}
}
