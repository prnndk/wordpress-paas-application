import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Docker from "dockerode";

export interface ServiceSpec {
	name: string;
	image: string;
	replicas: number;
	env: string[];
	labels: Record<string, string>;
	mounts: Array<{
		source: string;
		target: string;
		type: "bind" | "volume";
	}>;
	networks: string[];
	constraints?: string[];
	ports?: Array<{
		targetPort: number;
		publishedPort?: number;
		protocol?: "tcp" | "udp";
	}>;
	healthCheck?: {
		test: string[];
		interval?: number;
		timeout?: number;
		retries?: number;
		startPeriod?: number;
	};
	command?: string[];
}

export interface ServiceInfo {
	id: string;
	name: string;
	replicas: number;
	runningReplicas: number;
	image: string;
	createdAt: string;
	updatedAt: string;
}

@Injectable()
export class DockerService implements OnModuleInit {
	private readonly logger = new Logger(DockerService.name);
	private docker: Docker;
	private isConnected = false;

	constructor(private configService: ConfigService) {
		const dockerHost = this.configService.get<string>("DOCKER_HOST");

		if (dockerHost?.startsWith("tcp://")) {
			const url = new URL(dockerHost);
			this.docker = new Docker({
				host: url.hostname,
				port: parseInt(url.port, 10),
			});
		} else if (process.platform === "win32") {
			this.docker = new Docker({ socketPath: "//./pipe/docker_engine" });
		} else {
			this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
		}
	}

	async onModuleInit(): Promise<void> {
		try {
			const info = await this.docker.info();
			this.logger.log(`Connected to Docker: ${info.Name}`);
			this.isConnected = true;

			if (
				!info.Swarm?.LocalNodeState ||
				info.Swarm.LocalNodeState !== "active"
			) {
				this.logger.warn(
					"Docker Swarm is not active. WordPress deployments will not work until Swarm is initialized."
				);
			}
		} catch (error) {
			this.logger.warn(
				"Failed to connect to Docker. Running in limited mode (auth/dashboard only)."
			);
			this.logger.warn(
				"To enable WordPress deployments, ensure Docker is running or set DOCKER_HOST in .env"
			);
			this.isConnected = false;
		}
	}

	isDockerConnected(): boolean {
		return this.isConnected;
	}

	async listNodes(): Promise<Docker.Node[]> {
		return this.docker.listNodes();
	}

	async createService(spec: ServiceSpec): Promise<string> {
		this.logger.log(`Creating service: ${spec.name}`);

		const serviceSpec: Docker.ServiceSpec = {
			Name: spec.name,
			TaskTemplate: {
				ContainerSpec: {
					Image: spec.image,
					Env: spec.env,
					Labels: spec.labels,
					Command: spec.command,
					Mounts: spec.mounts.map((mount) => ({
						Source: mount.source,
						Target: mount.target,
						Type: mount.type,
					})),
					HealthCheck: spec.healthCheck
						? {
								Test: spec.healthCheck.test,
								Interval: spec.healthCheck.interval,
								Timeout: spec.healthCheck.timeout,
								Retries: spec.healthCheck.retries,
								StartPeriod: spec.healthCheck.startPeriod,
						  }
						: undefined,
				},
				Placement: {
					Constraints: spec.constraints || ["node.role == worker"],
				},
				Resources: {
					Limits: { MemoryBytes: 536870912 },
					Reservations: { MemoryBytes: 268435456 },
				},
				RestartPolicy: {
					Condition: "on-failure",
					Delay: 5000000000,
					MaxAttempts: 3,
				},
				Networks: spec.networks.map((networkName) => ({ Target: networkName })),
			},
			Mode: {
				Replicated: { Replicas: spec.replicas },
			},
			Labels: spec.labels,
			EndpointSpec: {
				Mode: "vip",
				Ports:
					spec.ports?.map((p) => ({
						TargetPort: p.targetPort,
						PublishedPort: p.publishedPort,
						Protocol: p.protocol || "tcp",
						PublishMode: "ingress" as const,
					})) || [],
			},
		};

		const service = await this.docker.createService(serviceSpec);
		this.logger.log(`Service created: ${service.id}`);
		return service.id;
	}

	async getService(nameOrId: string): Promise<ServiceInfo | null> {
		try {
			const service = this.docker.getService(nameOrId);
			const info = await service.inspect();
			const tasks = await this.docker.listTasks({
				filters: { service: [nameOrId] },
			});

			const runningTasks = tasks.filter(
				(task) => task.Status?.State === "running"
			);

			if (runningTasks.length === 0 && tasks.length > 0) {
				const failedTasks = tasks.filter((t) =>
					["complete", "failed", "shutdown", "rejected", "orphaned"].includes(
						t.Status?.State || ""
					)
				);

				const targetTask =
					failedTasks.length > 0
						? failedTasks.sort(
								(a, b) =>
									new Date(b.UpdatedAt || "").getTime() -
									new Date(a.UpdatedAt || "").getTime()
						  )[0]
						: tasks.sort(
								(a, b) =>
									new Date(b.UpdatedAt || "").getTime() -
									new Date(a.UpdatedAt || "").getTime()
						  )[0];

				this.logger.warn(
					`Service ${info.Spec?.Name} has no running tasks. Inspecting task ${targetTask.ID} (State: ${targetTask.Status?.State}). Message: ${targetTask.Status?.Message}. Err: ${targetTask.Status?.Err}`
				);

				if (targetTask.Status?.ContainerStatus) {
					this.logger.warn(
						`Container exit code: ${targetTask.Status.ContainerStatus.ExitCode}`
					);

					try {
						const serviceLogs = await service.logs({
							stdout: true,
							stderr: true,
							tail: 50,
							timestamps: true,
						});
						this.logger.error(
							`Service Logs (tail 50): \n${serviceLogs.toString()}`
						);
					} catch (logErr) {
						this.logger.error(`Failed to fetch service logs:`, logErr);
					}
				}
			}

			return {
				id: info.ID,
				name: info.Spec?.Name || "",
				replicas: info.Spec?.Mode?.Replicated?.Replicas || 0,
				runningReplicas: runningTasks.length,
				image: info.Spec?.TaskTemplate?.ContainerSpec?.Image || "",
				createdAt: info.CreatedAt || "",
				updatedAt: info.UpdatedAt || "",
			};
		} catch (error) {
			if ((error as { statusCode?: number }).statusCode === 404) {
				return null;
			}
			throw error;
		}
	}

	async listServices(
		labelFilter?: Record<string, string>
	): Promise<ServiceInfo[]> {
		const filters: Record<string, string[]> = {};

		if (labelFilter) {
			filters.label = Object.entries(labelFilter).map(
				([key, value]) => `${key}=${value}`
			);
		}

		const services = await this.docker.listServices({ filters });
		const result: ServiceInfo[] = [];

		for (const svc of services) {
			const tasks = await this.docker.listTasks({
				filters: { service: [svc.ID] },
			});
			const runningTasks = tasks.filter(
				(task) => task.Status?.State === "running"
			);

			result.push({
				id: svc.ID,
				name: svc.Spec?.Name || "",
				replicas: svc.Spec?.Mode?.Replicated?.Replicas || 0,
				runningReplicas: runningTasks.length,
				image:
					(svc.Spec?.TaskTemplate as { ContainerSpec?: { Image?: string } })
						?.ContainerSpec?.Image || "",
				createdAt: svc.CreatedAt || "",
				updatedAt: svc.UpdatedAt || "",
			});
		}

		return result;
	}

	async updateService(
		nameOrId: string,
		updates: Partial<{ replicas: number; image: string; forceUpdate: boolean }>
	): Promise<void> {
		const service = this.docker.getService(nameOrId);
		const info = await service.inspect();

		const updatedSpec = { ...info.Spec };

		if (updates.replicas !== undefined && updatedSpec.Mode?.Replicated) {
			updatedSpec.Mode.Replicated.Replicas = updates.replicas;
		}

		if (updates.image && updatedSpec.TaskTemplate?.ContainerSpec) {
			updatedSpec.TaskTemplate.ContainerSpec.Image = updates.image;
		}

		if (updates.forceUpdate && updatedSpec.TaskTemplate?.ContainerSpec) {
			updatedSpec.TaskTemplate.ContainerSpec.Labels = {
				...updatedSpec.TaskTemplate.ContainerSpec.Labels,
				"wp-paas.force-update": Date.now().toString(),
			};
		}

		await service.update({
			version: parseInt(info.Version?.Index?.toString() || "0", 10),
			...updatedSpec,
		});

		this.logger.log(
			`Service updated: ${nameOrId}${updates.forceUpdate ? " (force)" : ""}`
		);
	}

	async removeService(nameOrId: string): Promise<void> {
		const service = this.docker.getService(nameOrId);
		await service.remove();
		this.logger.log(`Service removed: ${nameOrId}`);
	}

	async getServiceLogs(
		nameOrId: string,
		options?: { tail?: number; since?: number }
	): Promise<string> {
		const service = this.docker.getService(nameOrId);
		const stream = await service.logs({
			stdout: true,
			stderr: true,
			tail: options?.tail || 100,
			since: options?.since || 0,
			timestamps: true,
		});

		if (Buffer.isBuffer(stream)) {
			return stream.toString("utf-8");
		}

		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			stream.on("data", (chunk: Buffer) => chunks.push(chunk));
			stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
			stream.on("error", reject);
		});
	}

	async scaleService(nameOrId: string, replicas: number): Promise<void> {
		await this.updateService(nameOrId, { replicas });
		this.logger.log(`Service ${nameOrId} scaled to ${replicas} replicas`);
	}

	async getServiceStats(nameOrId: string): Promise<{
		cpuPercent: number;
		memoryUsage: number;
		memoryLimit: number;
		memoryPercent: number;
		uptime: number; // Seconds since started
	} | null> {
		try {
			const service = this.docker.getService(nameOrId);
			const info = await service.inspect();
			const serviceName = info.Spec?.Name || nameOrId;

			// Get tasks to find the running container
			const tasks = await this.docker.listTasks({
				filters: { service: [serviceName], "desired-state": ["running"] },
			});

			// Filter for actually running tasks with a container ID
			const runningTask = tasks.find(
				(task) =>
					task.Status?.State === "running" &&
					task.Status?.ContainerStatus?.ContainerID
			);

			if (!runningTask || !runningTask.Status?.ContainerStatus?.ContainerID) {
				return null;
			}

			const containerId = runningTask.Status.ContainerStatus.ContainerID;
			const container = this.docker.getContainer(containerId);
			const stats = await container.stats({ stream: false });
			const containerInfo = await container.inspect();

			// Calculate CPU %
			const cpuDelta =
				stats.cpu_stats.cpu_usage.total_usage -
				(stats.precpu_stats?.cpu_usage?.total_usage || 0);
			const systemDelta =
				stats.cpu_stats.system_cpu_usage -
				(stats.precpu_stats?.system_cpu_usage || 0);
			const cpuCount = stats.cpu_stats.online_cpus || 1;

			let cpuPercent = 0;
			if (systemDelta > 0) {
				cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
			}

			// Calculate Uptime (now - StartedAt)
			const startedAt = new Date(containerInfo.State.StartedAt).getTime();
			const uptime = Math.floor((Date.now() - startedAt) / 1000);

			return {
				cpuPercent: Math.round(cpuPercent * 100) / 100,
				memoryUsage: stats.memory_stats.usage || 0,
				memoryLimit: stats.memory_stats.limit || 0,
				memoryPercent:
					stats.memory_stats.limit > 0
						? Math.round(
								((stats.memory_stats.usage || 0) / stats.memory_stats.limit) *
									10000
						  ) / 100
						: 0,
				uptime: uptime > 0 ? uptime : 0,
			};
		} catch (error: any) {
			// 404 errors are expected for stopped/deleted instances - use debug level
			const is404 =
				error?.statusCode === 404 || error?.message?.includes("404");
			if (is404) {
				this.logger.debug(
					`Service stats unavailable for ${nameOrId} (not running)`
				);
			} else {
				this.logger.warn(
					`Failed to get service stats for ${nameOrId}: ${error}`
				);
			}
			return null;
		}
	}

	// Use the configured WordPress image for volume checks to avoid pulling new images
	private getVolumeCheckImage(): string {
		return process.env.WORDPRESS_IMAGE || "prnndk/wp-paas-wordpress:latest";
	}

	async getVolumeUsage(volumeName: string): Promise<number> {
		const image = this.getVolumeCheckImage();
		try {
			// Create a temporary container to check volume usage
			// We use 'du -sb /data' to get size in bytes
			const stream = await this.docker.run(
				image,
				["du", "-sb", "/data"],
				process.stdout,
				{
					HostConfig: {
						AutoRemove: true,
						Mounts: [
							{
								Type: "volume",
								Source: volumeName,
								Target: "/data",
								ReadOnly: true,
							},
						],
					},
				}
			);

			const output = stream.output as any;
			if (output && output.statusCode === 0) {
				return this.getVolumeUsageExec(volumeName, image);
			}
			return 0;
		} catch (error: any) {
			// 404 errors are expected if image doesn't exist locally - use debug level
			const is404 =
				error?.statusCode === 404 ||
				error?.message?.includes("404") ||
				error?.message?.includes("no such");
			if (is404) {
				this.logger.debug(
					`Volume usage unavailable for ${volumeName} (image not available)`
				);
			} else {
				this.logger.warn(
					`Failed to get volume usage for ${volumeName}: ${error}`
				);
			}
			return 0;
		}
	}

	private async getVolumeUsageExec(
		volumeName: string,
		image: string
	): Promise<number> {
		let container;
		try {
			container = await this.docker.createContainer({
				Image: image,
				Cmd: ["du", "-sb", "/data"],
				HostConfig: {
					AutoRemove: true,
					Mounts: [
						{
							Type: "volume",
							Source: volumeName,
							Target: "/data",
							ReadOnly: true,
						},
					],
				},
			});

			await container.start();
			const stream = await container.logs({
				stdout: true,
				stderr: true,
				follow: true,
			});

			const output = stream.toString();
			const sizeStr = output.split(/\s+/)[0] ?? "0";
			const size = parseInt(sizeStr, 10);
			return isNaN(size) ? 0 : size;
		} catch (error) {
			this.logger.warn(`Failed to measure volume ${volumeName} size: ${error}`);
			return 0;
		}
	}
}
