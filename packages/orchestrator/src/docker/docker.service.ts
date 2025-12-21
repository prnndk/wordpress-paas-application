import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';

export interface ServiceSpec {
    name: string;
    image: string;
    replicas: number;
    env: string[];
    labels: Record<string, string>;
    mounts: Array<{
        source: string;
        target: string;
        type: 'bind' | 'volume';
    }>;
    networks: string[];
    constraints?: string[];
    ports?: Array<{
        targetPort: number;
        publishedPort?: number;
        protocol?: 'tcp' | 'udp';
    }>;
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
        const dockerHost = this.configService.get<string>('DOCKER_HOST');

        if (dockerHost?.startsWith('tcp://')) {
            // Remote Docker via TCP
            const url = new URL(dockerHost);
            this.docker = new Docker({
                host: url.hostname,
                port: parseInt(url.port, 10),
            });
        } else if (process.platform === 'win32') {
            // Windows: Use named pipe
            this.docker = new Docker({ socketPath: '//./pipe/docker_engine' });
        } else {
            // Linux/Mac: Unix socket
            this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
        }
    }

    async onModuleInit(): Promise<void> {
        try {
            const info = await this.docker.info();
            this.logger.log(`Connected to Docker: ${info.Name}`);
            this.isConnected = true;

            if (!info.Swarm?.LocalNodeState || info.Swarm.LocalNodeState !== 'active') {
                this.logger.warn('Docker Swarm is not active. WordPress deployments will not work until Swarm is initialized.');
            }
        } catch (error) {
            this.logger.warn('Failed to connect to Docker. Running in limited mode (auth/dashboard only).');
            this.logger.warn('To enable WordPress deployments, ensure Docker is running or set DOCKER_HOST in .env');
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
                    Labels: spec.labels, // Traefik reads labels from ContainerSpec in Swarm mode
                    Mounts: spec.mounts.map((mount) => ({
                        Source: mount.source,
                        Target: mount.target,
                        Type: mount.type,
                    })),
                },
                Placement: {
                    Constraints: spec.constraints || ['node.role == worker'],
                },
                Resources: {
                    Limits: { MemoryBytes: 536870912 }, // 512MB
                    Reservations: { MemoryBytes: 268435456 }, // 256MB
                },
                RestartPolicy: {
                    Condition: 'on-failure',
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
                Mode: 'vip',
                Ports: spec.ports?.map(p => ({
                    TargetPort: p.targetPort,
                    PublishedPort: p.publishedPort,
                    Protocol: p.protocol || 'tcp',
                    PublishMode: 'ingress' as const,
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
                (task) => task.Status?.State === 'running',
            );

            return {
                id: info.ID,
                name: info.Spec?.Name || '',
                replicas: info.Spec?.Mode?.Replicated?.Replicas || 0,
                runningReplicas: runningTasks.length,
                image: info.Spec?.TaskTemplate?.ContainerSpec?.Image || '',
                createdAt: info.CreatedAt || '',
                updatedAt: info.UpdatedAt || '',
            };
        } catch (error) {
            if ((error as { statusCode?: number }).statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async listServices(
        labelFilter?: Record<string, string>,
    ): Promise<ServiceInfo[]> {
        const filters: Record<string, string[]> = {};

        if (labelFilter) {
            filters.label = Object.entries(labelFilter).map(
                ([key, value]) => `${key}=${value}`,
            );
        }

        const services = await this.docker.listServices({ filters });
        const result: ServiceInfo[] = [];

        for (const svc of services) {
            const tasks = await this.docker.listTasks({
                filters: { service: [svc.ID] },
            });
            const runningTasks = tasks.filter(
                (task) => task.Status?.State === 'running',
            );

            result.push({
                id: svc.ID,
                name: svc.Spec?.Name || '',
                replicas: svc.Spec?.Mode?.Replicated?.Replicas || 0,
                runningReplicas: runningTasks.length,
                image: (svc.Spec?.TaskTemplate as { ContainerSpec?: { Image?: string } })?.ContainerSpec?.Image || '',
                createdAt: svc.CreatedAt || '',
                updatedAt: svc.UpdatedAt || '',
            });
        }

        return result;
    }

    async updateService(
        nameOrId: string,
        updates: Partial<{ replicas: number; image: string; forceUpdate: boolean }>,
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

        // Force update by adding/updating a label with timestamp
        // This forces Docker to re-pull the image even if the tag is the same
        if (updates.forceUpdate && updatedSpec.TaskTemplate?.ContainerSpec) {
            updatedSpec.TaskTemplate.ContainerSpec.Labels = {
                ...updatedSpec.TaskTemplate.ContainerSpec.Labels,
                'wp-paas.force-update': Date.now().toString(),
            };
        }

        // Use forceUpdate flag to trigger rolling update
        await service.update({
            version: parseInt(info.Version?.Index?.toString() || '0', 10),
            ...updatedSpec,
        });

        this.logger.log(`Service updated: ${nameOrId}${updates.forceUpdate ? ' (force)' : ''}`);
    }

    async removeService(nameOrId: string): Promise<void> {
        const service = this.docker.getService(nameOrId);
        await service.remove();
        this.logger.log(`Service removed: ${nameOrId}`);
    }

    async getServiceLogs(
        nameOrId: string,
        options?: { tail?: number; since?: number },
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
            return stream.toString('utf-8');
        }

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            stream.on('error', reject);
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
    } | null> {
        try {
            // Get service tasks (containers)
            const service = this.docker.getService(nameOrId);
            const info = await service.inspect();
            const serviceName = info.Spec?.Name || nameOrId;

            // List tasks for this service
            const tasks = await this.docker.listTasks({
                filters: { service: [serviceName], 'desired-state': ['running'] },
            });

            if (tasks.length === 0) {
                return null;
            }

            let totalCpu = 0;
            let totalMemory = 0;
            let totalMemoryLimit = 0;
            let containerCount = 0;

            // Get stats for each container
            for (const task of tasks) {
                if (task.Status?.ContainerStatus?.ContainerID) {
                    try {
                        const container = this.docker.getContainer(task.Status.ContainerStatus.ContainerID);
                        const stats = await container.stats({ stream: false });

                        // Calculate CPU percentage
                        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage -
                            (stats.precpu_stats?.cpu_usage?.total_usage || 0);
                        const systemDelta = stats.cpu_stats.system_cpu_usage -
                            (stats.precpu_stats?.system_cpu_usage || 0);
                        const cpuCount = stats.cpu_stats.online_cpus || 1;

                        if (systemDelta > 0) {
                            totalCpu += (cpuDelta / systemDelta) * cpuCount * 100;
                        }

                        // Memory usage
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
                memoryPercent: totalMemoryLimit > 0
                    ? Math.round((totalMemory / totalMemoryLimit) * 10000) / 100
                    : 0,
            };
        } catch (error) {
            this.logger.warn(`Failed to get service stats for ${nameOrId}: ${error}`);
            return null;
        }
    }
}
