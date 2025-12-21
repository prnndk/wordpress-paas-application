import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';

interface ContainerStats {
    cpuPercent: number;
    memoryUsage: number;
    memoryLimit: number;
    memoryPercent: number;
    networkRx: number;
    networkTx: number;
}

interface InstanceMetrics {
    containerId: string;
    containerName: string;
    status: string;
    stats: ContainerStats | null;
    timestamp: Date;
}

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name);
    private docker: Docker;

    constructor(private configService: ConfigService) {
        const dockerHost = this.configService.get<string>('DOCKER_HOST');

        if (dockerHost) {
            // Parse tcp://host:port format
            const url = new URL(dockerHost);
            this.docker = new Docker({
                host: url.hostname,
                port: parseInt(url.port) || 2375,
                protocol: url.protocol === 'https:' ? 'https' : 'http',
            });
        } else {
            // Default to local Docker socket
            this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
        }
    }

    /**
     * Get metrics for a specific WordPress instance
     * Works with Docker Swarm by getting task info and attempting container stats
     * Falls back gracefully when container is on a remote node
     */
    async getInstanceMetrics(tenantId: string): Promise<InstanceMetrics[]> {
        const serviceName = `wp_${tenantId}`;
        const metrics: InstanceMetrics[] = [];

        try {
            // First check if service exists
            const service = this.docker.getService(serviceName);
            let serviceInfo;
            try {
                serviceInfo = await service.inspect();
            } catch {
                // Service doesn't exist
                return [{
                    containerId: 'N/A',
                    containerName: serviceName,
                    status: 'not_found',
                    stats: null,
                    timestamp: new Date(),
                }];
            }

            // Get resource limits from service spec
            const resources = serviceInfo.Spec?.TaskTemplate?.Resources;
            const memoryLimit = resources?.Limits?.MemoryBytes || 0;
            // cpuLimit available in: resources?.Limits?.NanoCPUs

            // Get all tasks for the service
            const tasks = await this.docker.listTasks({
                filters: {
                    service: [serviceName],
                    'desired-state': ['running'],
                },
            });

            if (tasks.length === 0) {
                // No running tasks
                return [{
                    containerId: 'N/A',
                    containerName: serviceName,
                    status: 'no_tasks',
                    stats: {
                        cpuPercent: 0,
                        memoryUsage: 0,
                        memoryLimit: memoryLimit,
                        memoryPercent: 0,
                        networkRx: 0,
                        networkTx: 0,
                    },
                    timestamp: new Date(),
                }];
            }

            // Get container stats for each running task
            for (const task of tasks) {
                const containerId = task.Status?.ContainerStatus?.ContainerID;
                const nodeId = task.NodeID;
                const slot = task.Slot || 1;

                // Try to get container stats (only works if container is local)
                let stats: ContainerStats | null = null;

                if (containerId) {
                    try {
                        const container = this.docker.getContainer(containerId);
                        stats = await this.getContainerStats(container);
                    } catch {
                        // Container is on a different node - this is expected in multi-node Swarm
                        // Use estimated values from service spec
                        stats = {
                            cpuPercent: 0, // Unknown - container on remote node
                            memoryUsage: 0,
                            memoryLimit: memoryLimit,
                            memoryPercent: 0,
                            networkRx: 0,
                            networkTx: 0,
                        };
                    }
                }

                metrics.push({
                    containerId: containerId ? containerId.substring(0, 12) : 'pending',
                    containerName: `${serviceName}.${slot}${nodeId ? ` (node: ${nodeId.substring(0, 8)})` : ''}`,
                    status: task.Status?.State || 'unknown',
                    stats,
                    timestamp: new Date(),
                });
            }

            return metrics;
        } catch (error) {
            this.logger.error(`Failed to get metrics for ${serviceName}: ${error}`);
            return [{
                containerId: 'error',
                containerName: serviceName,
                status: 'error',
                stats: null,
                timestamp: new Date(),
            }];
        }
    }

    /**
     * Get stats for a single container
     */
    private async getContainerStats(container: Docker.Container): Promise<ContainerStats> {
        return new Promise((resolve, reject) => {
            container.stats({ stream: false }, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!stats) {
                    reject(new Error('No stats returned'));
                    return;
                }

                // Calculate CPU percentage
                const cpuDelta = stats.cpu_stats.cpu_usage.total_usage -
                    (stats.precpu_stats?.cpu_usage?.total_usage || 0);
                const systemDelta = stats.cpu_stats.system_cpu_usage -
                    (stats.precpu_stats?.system_cpu_usage || 0);
                const cpuCount = stats.cpu_stats.online_cpus || 1;

                let cpuPercent = 0;
                if (systemDelta > 0 && cpuDelta > 0) {
                    cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
                }

                // Memory usage
                const memoryUsage = stats.memory_stats.usage || 0;
                const memoryLimit = stats.memory_stats.limit || 1;
                const memoryPercent = (memoryUsage / memoryLimit) * 100;

                // Network I/O
                let networkRx = 0;
                let networkTx = 0;
                if (stats.networks) {
                    for (const network of Object.values(stats.networks) as any[]) {
                        networkRx += network.rx_bytes || 0;
                        networkTx += network.tx_bytes || 0;
                    }
                }

                resolve({
                    cpuPercent: Math.round(cpuPercent * 100) / 100,
                    memoryUsage,
                    memoryLimit,
                    memoryPercent: Math.round(memoryPercent * 100) / 100,
                    networkRx,
                    networkTx,
                });
            });
        });
    }

    /**
     * Get logs for a specific WordPress instance
     */
    async getInstanceLogs(tenantId: string, lines: number = 100): Promise<string[]> {
        const serviceName = `wp_${tenantId}`;

        try {
            const service = this.docker.getService(serviceName);
            const logsStream = await service.logs({
                stdout: true,
                stderr: true,
                tail: lines,
                timestamps: true,
                follow: false,
            });

            // Collect stream data into buffer
            return new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                logsStream.on('data', (chunk: Buffer) => chunks.push(chunk));
                logsStream.on('end', () => {
                    const logString = Buffer.concat(chunks).toString('utf-8');
                    resolve(logString.split('\n').filter(line => line.length > 0));
                });
                logsStream.on('error', reject);
            });
        } catch (error) {
            this.logger.error(`Failed to get logs for ${serviceName}: ${error}`);
            throw error;
        }
    }

    /**
     * Get aggregated metrics for all WordPress instances
     */
    async getAllInstancesMetrics(): Promise<Map<string, InstanceMetrics[]>> {
        const allMetrics = new Map<string, InstanceMetrics[]>();

        try {
            const services = await this.docker.listServices({
                filters: {
                    label: ['wp-paas.type=wordpress'],
                },
            });

            for (const service of services) {
                const tenantId = service.Spec?.Labels?.['wp-paas.tenant-id'];
                const subdomain = service.Spec?.Labels?.['wp-paas.subdomain'];
                if (tenantId) {
                    const metrics = await this.getInstanceMetrics(tenantId);
                    allMetrics.set(subdomain || tenantId, metrics);
                }
            }

            return allMetrics;
        } catch (error) {
            this.logger.error(`Failed to get all instance metrics: ${error}`);
            throw error;
        }
    }
}
