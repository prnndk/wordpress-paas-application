import { Module } from "@nestjs/common";
import { ClusterController } from "./cluster.controller";
import { ClusterService } from "./cluster.service";
import { DockerModule } from "../docker/docker.module";

@Module({
	imports: [DockerModule],
	controllers: [ClusterController],
	providers: [ClusterService],
	exports: [ClusterService],
})
export class ClusterModule {}
