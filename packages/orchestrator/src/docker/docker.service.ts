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

        // Helper function to demux Docker stream
        const demuxStream = (buffer: Buffer): string => {
            const lines: string[] = [];
            let offset = 0;

            while (offset < buffer.length) {
                // Docker stream header: 8 bytes
                // Byte 0: Stream type (0=stdin, 1=stdout, 2=stderr)
                // Bytes 4-7: Frame size (big-endian uint32)
                if (offset + 8 > buffer.length) {
                    // Remaining data without header, treat as raw
                    lines.push(buffer.slice(offset).toString('utf-8'));
                    break;
                }

                const frameSize = buffer.readUInt32BE(offset + 4);
                const frameStart = offset + 8;
                const frameEnd = frameStart + frameSize;

                if (frameEnd > buffer.length) {
                    // Incomplete frame, take what we can
                    lines.push(buffer.slice(frameStart).toString('utf-8'));
                    break;
                }

                const line = buffer.slice(frameStart, frameEnd).toString('utf-8');
                lines.push(line);
                offset = frameEnd;
            }

            return lines.join('');
        };

        if (Buffer.isBuffer(stream)) {
            return demuxStream(stream);
        }

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => {
                const buffer = Buffer.concat(chunks);
                resolve(demuxStream(buffer));
            });
            stream.on("error", reject);
        });
    }

    async scaleService(nameOrId: string, replicas: number): Promise<void> {
        await this.updateService(nameOrId, { replicas });
        this.logger.log(`Service ${nameOrId} scaled to ${replicas} replicas`);
    }

    /**
     * Get detailed inspection of a service including env vars, mounts, and task info
     */
    async getServiceInspect(nameOrId: string): Promise<{
        id: string;
        name: string;
        image: string;
        replicas: number;
        runningReplicas: number;
        createdAt: string;
        updatedAt: string;
        env: { key: string; value: string; masked?: boolean }[];
        mounts: { source: string; target: string; type: string }[];
        networks: string[];
        labels: Record<string, string>;
        resources: {
            cpuLimit?: number;
            memoryLimit?: number;
            cpuReservation?: number;
            memoryReservation?: number;
        };
        tasks: {
            id: string;
            nodeId: string;
            state: string;
            desiredState: string;
            error?: string;
            containerStatus?: {
                containerId?: string;
                pid?: number;
                exitCode?: number;
            };
        }[];
    } | null> {
        try {
            const service = this.docker.getService(nameOrId);
            const info = await service.inspect();

            // Get tasks for this service
            const tasks = await this.docker.listTasks({
                filters: { service: [nameOrId] },
            });

            const runningTasks = tasks.filter(
                (task) => task.Status?.State === "running"
            );

            // Parse environment variables
            const envVars = (info.Spec?.TaskTemplate?.ContainerSpec?.Env || []).map(
                (envStr: string) => {
                    const [key = "", ...valueParts] = envStr.split("=");
                    const value = valueParts.join("=");
                    // Mask sensitive values
                    const sensitiveKeys = ["PASSWORD", "SECRET", "KEY", "TOKEN", "CREDENTIAL"];
                    const isSensitive = sensitiveKeys.some((k) =>
                        key.toUpperCase().includes(k)
                    );
                    return {
                        key,
                        value: isSensitive ? "********" : value,
                        masked: isSensitive,
                    };
                }
            );

            // Parse mounts
            const mounts = (info.Spec?.TaskTemplate?.ContainerSpec?.Mounts || []).map(
                (mount: { Source?: string; Target?: string; Type?: string }) => ({
                    source: mount.Source || "",
                    target: mount.Target || "",
                    type: mount.Type || "volume",
                })
            );

            // Parse networks
            const networks = (info.Spec?.TaskTemplate?.Networks || []).map(
                (net: { Target?: string }) => net.Target || ""
            );

            // Parse resources
            const resources = {
                cpuLimit: info.Spec?.TaskTemplate?.Resources?.Limits?.NanoCPUs,
                memoryLimit: info.Spec?.TaskTemplate?.Resources?.Limits?.MemoryBytes,
                cpuReservation: info.Spec?.TaskTemplate?.Resources?.Reservations?.NanoCPUs,
                memoryReservation: info.Spec?.TaskTemplate?.Resources?.Reservations?.MemoryBytes,
            };

            // Parse tasks
            const taskInfos = tasks.map((task) => ({
                id: task.ID || "",
                nodeId: task.NodeID || "",
                state: task.Status?.State || "unknown",
                desiredState: task.DesiredState || "unknown",
                error: task.Status?.Err,
                containerStatus: task.Status?.ContainerStatus
                    ? {
                        containerId: task.Status.ContainerStatus.ContainerID,
                        pid: task.Status.ContainerStatus.PID,
                        exitCode: task.Status.ContainerStatus.ExitCode,
                    }
                    : undefined,
            }));

            return {
                id: info.ID,
                name: info.Spec?.Name || "",
                image: info.Spec?.TaskTemplate?.ContainerSpec?.Image || "",
                replicas: info.Spec?.Mode?.Replicated?.Replicas || 0,
                runningReplicas: runningTasks.length,
                createdAt: info.CreatedAt || "",
                updatedAt: info.UpdatedAt || "",
                env: envVars,
                mounts,
                networks,
                labels: (info.Spec?.Labels as Record<string, string>) || {},
                resources,
                tasks: taskInfos,
            };
        } catch (error) {
            if ((error as { statusCode?: number }).statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async listAllServicesWithTasks(): Promise<{
        services: Array<{
            id: string;
            name: string;
            image: string;
            replicas: number;
            runningReplicas: number;
            createdAt: string;
            updatedAt: string;
            labels: Record<string, string>;
            tasks: Array<{
                id: string;
                nodeId: string;
                nodeName: string;
                state: string;
                desiredState: string;
                createdAt: string;
                updatedAt: string;
                error?: string;
            }>;
        }>;
        nodes: Array<{
            id: string;
            hostname: string;
            status: string;
            role: string;
            availability: string;
            address: string;
        }>;
    }> {
        // Get all nodes
        const nodes = await this.docker.listNodes();
        const nodeMap = new Map<
            string,
            {
                hostname: string;
                status: string;
                role: string;
                availability: string;
                address: string;
            }
        >();

        const nodesInfo = nodes.map((node) => {
            const info = {
                id: node.ID || "",
                hostname: node.Description?.Hostname || "unknown",
                status: node.Status?.State || "unknown",
                role: node.Spec?.Role || "unknown",
                availability: node.Spec?.Availability || "unknown",
                address: node.Status?.Addr || "",
            };
            nodeMap.set(info.id, info);
            return info;
        });

        // Get all services (no filter)
        const services = await this.docker.listServices();
        const result = [];

        for (const svc of services) {
            // Get tasks for this service
            const tasks = await this.docker.listTasks({
                filters: { service: [svc.ID] },
            });

            const taskInfos = tasks.map((task) => {
                const nodeInfo = nodeMap.get(task.NodeID || "");
                return {
                    id: task.ID || "",
                    nodeId: task.NodeID || "",
                    nodeName: nodeInfo?.hostname || "unknown",
                    state: task.Status?.State || "unknown",
                    desiredState: task.DesiredState || "unknown",
                    createdAt: task.CreatedAt || "",
                    updatedAt: task.UpdatedAt || "",
                    error: task.Status?.Err,
                };
            });

            const runningTasks = taskInfos.filter(
                (t) => t.state === "running"
            ).length;
            const labels = (svc.Spec?.Labels as Record<string, string>) || {};
            const containerSpec = (svc.Spec?.TaskTemplate as { ContainerSpec?: { Env?: string[]; Mounts?: Array<{ Source?: string; Target?: string; Type?: string }> } })?.ContainerSpec;

            // Parse environment variables
            const envVars = (containerSpec?.Env || []).map(
                (envStr: string) => {
                    const [key = "", ...valueParts] = envStr.split("=");
                    const value = valueParts.join("=");
                    const sensitiveKeys = ["PASSWORD", "SECRET", "KEY", "TOKEN", "CREDENTIAL"];
                    const isSensitive = sensitiveKeys.some((k) =>
                        key.toUpperCase().includes(k)
                    );
                    return {
                        key,
                        value: isSensitive ? "********" : value,
                        masked: isSensitive,
                    };
                }
            );

            // Parse mounts
            const mounts = (containerSpec?.Mounts || []).map(
                (mount: { Source?: string; Target?: string; Type?: string }) => ({
                    source: mount.Source || "",
                    target: mount.Target || "",
                    type: mount.Type || "volume",
                })
            );

            // Parse networks
            const networks = (svc.Spec?.TaskTemplate?.Networks || []).map(
                (net: { Target?: string }) => net.Target || ""
            );

            // Parse resources
            const resources = {
                cpuLimit: svc.Spec?.TaskTemplate?.Resources?.Limits?.NanoCPUs,
                memoryLimit: svc.Spec?.TaskTemplate?.Resources?.Limits?.MemoryBytes,
                cpuReservation: svc.Spec?.TaskTemplate?.Resources?.Reservations?.NanoCPUs,
                memoryReservation: svc.Spec?.TaskTemplate?.Resources?.Reservations?.MemoryBytes,
            };

            result.push({
                id: svc.ID,
                name: svc.Spec?.Name || "",
                image:
                    (svc.Spec?.TaskTemplate as { ContainerSpec?: { Image?: string } })
                        ?.ContainerSpec?.Image || "",
                replicas: svc.Spec?.Mode?.Replicated?.Replicas || 0,
                runningReplicas: runningTasks,
                createdAt: svc.CreatedAt || "",
                updatedAt: svc.UpdatedAt || "",
                labels,
                env: envVars,
                mounts,
                networks,
                resources,
                tasks: taskInfos.map((task) => ({
                    ...task,
                    containerStatus: tasks.find((t) => t.ID === task.id)?.Status?.ContainerStatus
                        ? {
                            containerId: tasks.find((t) => t.ID === task.id)?.Status?.ContainerStatus?.ContainerID,
                            pid: tasks.find((t) => t.ID === task.id)?.Status?.ContainerStatus?.PID,
                            exitCode: tasks.find((t) => t.ID === task.id)?.Status?.ContainerStatus?.ExitCode,
                        }
                        : undefined,
                })),
            });
        }

        return { services: result, nodes: nodesInfo };
    }

    async getServiceStats(nameOrId: string): Promise<{
        cpuPercent: number;
        memoryUsage: number;
        memoryLimit: number;
        memoryPercent: number;
    } | null> {
        try {
            const service = this.docker.getService(nameOrId);
            const info = await service.inspect();
            const serviceName = info.Spec?.Name || nameOrId;

            const tasks = await this.docker.listTasks({
                filters: { service: [serviceName], "desired-state": ["running"] },
            });

            if (tasks.length === 0) {
                return null;
            }

            let totalCpu = 0;
            let totalMemory = 0;
            let totalMemoryLimit = 0;
            let containerCount = 0;

            for (const task of tasks) {
                if (task.Status?.ContainerStatus?.ContainerID) {
                    try {
                        const container = this.docker.getContainer(
                            task.Status.ContainerStatus.ContainerID
                        );
                        const stats = await container.stats({ stream: false });

                        const cpuDelta =
                            stats.cpu_stats.cpu_usage.total_usage -
                            (stats.precpu_stats?.cpu_usage?.total_usage || 0);
                        const systemDelta =
                            stats.cpu_stats.system_cpu_usage -
                            (stats.precpu_stats?.system_cpu_usage || 0);
                        const cpuCount = stats.cpu_stats.online_cpus || 1;

                        if (systemDelta > 0) {
                            totalCpu += (cpuDelta / systemDelta) * cpuCount * 100;
                        }

                        totalMemory += stats.memory_stats.usage || 0;
                        totalMemoryLimit += stats.memory_stats.limit || 0;
                        containerCount++;
                    } catch (err) {
                        this.logger.warn(`Failed to get stats for container: ${err}`);
                    }
                }
            }

            if (containerCount === 0) {
                return null;
            }

            return {
                cpuPercent: Math.round(totalCpu * 100) / 100,
                memoryUsage: totalMemory,
                memoryLimit: totalMemoryLimit,
                memoryPercent:
                    totalMemoryLimit > 0
                        ? Math.round((totalMemory / totalMemoryLimit) * 10000) / 100
                        : 0,
            };
        } catch (error) {
            this.logger.warn(`Failed to get service stats for ${nameOrId}: ${error}`);
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
            return await this.getVolumeUsageExec(volumeName, image);
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
