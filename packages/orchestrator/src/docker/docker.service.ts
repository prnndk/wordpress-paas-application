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
		interval?: number; // nanoseconds
		timeout?: number; // nanoseconds
		retries?: number;
		startPeriod?: number; // nanoseconds
	};
	command?: string[]; // Optional override for entrypoint/command
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
			// Remote Docker via TCP
			const url = new URL(dockerHost);
			this.docker = new Docker({
				host: url.hostname,
				port: parseInt(url.port, 10),
			});
		} else if (process.platform === "win32") {
			// Windows: Use named pipe
			this.docker = new Docker({ socketPath: "//./pipe/docker_engine" });
		} else {
			// Linux/Mac: Unix socket
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
			// Don't throw - allow the app to start without Docker for development
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
					Command: spec.command, // Pass command if provided
					Mounts: spec.mounts.map((mount) => ({
						Source: mount.source,
						Target: mount.target,
						Type: mount.type,
					})),
					HealthCheck: spec.healthCheck
						? {
								Test: spec.healthCheck.test, // Dockerode expects PascalCase 'Test'
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
					Limits: { MemoryBytes: 536870912 }, // 512MB
					Reservations: { MemoryBytes: 268435456 }, // 256MB
				},
				RestartPolicy: {
					Condition: "on-failure",
					Delay: 5000000000, // 5 seconds in nanoseconds
					MaxAttempts: 3,
				},
				Networks: spec.networks.map((networkName) => ({ Target: networkName })), // Networks must be in TaskTemplate for Swarm
			},
			Mode: {
				Replicated: { Replicas: spec.replicas },
			},
			Labels: spec.labels, // Keep labels on service level too for filtering
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

			// Debug: If no running tasks, log why the latest task failed
			if (runningTasks.length === 0 && tasks.length > 0) {
				// Find the most recent task that is NOT starting/preparing (i.e. one that actually failed/stopped)
				// States: new, allocated, pending, assigned, accepted, preparing, starting, running, complete, shutdown, failed, rejected, remove, orphaned
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

					// Fetch logs from the SERVICE instead of the ephemeral container
					// This works better in Swarm as managers can aggregate logs
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
		updates: Partial<{ replicas: number; image: string }>
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

		await service.update({
			version: parseInt(info.Version?.Index?.toString() || "0", 10),
			...updatedSpec,
		});

		this.logger.log(`Service updated: ${nameOrId}`);
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
}
