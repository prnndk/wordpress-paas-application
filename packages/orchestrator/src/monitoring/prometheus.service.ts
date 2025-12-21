import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PrometheusQueryResult {
    status: 'success' | 'error';
    data: {
        resultType: 'vector' | 'matrix' | 'scalar' | 'string';
        result: Array<{
            metric: Record<string, string>;
            value?: [number, string];
            values?: Array<[number, string]>;
        }>;
    };
    error?: string;
    errorType?: string;
}

export interface TenantMetrics {
    cpu: {
        current: number;
        avg: number;
        max: number;
    };
    memory: {
        current: number;
        limit: number;
        percent: number;
    };
    network: {
        rxBytes: number;
        txBytes: number;
        rxRate: number;
        txRate: number;
    };
    storage: {
        used: number;
        total: number;
        percent: number;
    };
    containerCount: number;
    timestamp: Date;
}

export interface ClusterMetrics {
    totalCpu: number;
    totalMemory: number;
    totalContainers: number;
    nodeCount: number;
    tenantCount: number;
    requestsPerSecond: number;
    avgLatency: number;
}

export interface TimeSeriesData {
    timestamp: number;
    value: number;
}

@Injectable()
export class PrometheusService {
    private readonly logger = new Logger(PrometheusService.name);
    private readonly prometheusUrl: string;

    constructor(private configService: ConfigService) {
        this.prometheusUrl = this.configService.get<string>(
            'PROMETHEUS_URL',
            'http://prometheus:9090'
        );
        this.logger.log(`Prometheus URL configured: ${this.prometheusUrl}`);
    }

    /**
     * Execute a PromQL instant query
     */
    private async query(promql: string): Promise<PrometheusQueryResult> {
        try {
            const url = `${this.prometheusUrl}/api/v1/query`;
            const response = await fetch(`${url}?query=${encodeURIComponent(promql)}`);

            if (!response.ok) {
                throw new Error(`Prometheus query failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Prometheus query error: ${error}`);
            throw error;
        }
    }

    /**
     * Execute a PromQL range query for time series data
     */
    private async queryRange(
        promql: string,
        start: Date,
        end: Date,
        step: string = '1m'
    ): Promise<PrometheusQueryResult> {
        try {
            const url = `${this.prometheusUrl}/api/v1/query_range`;
            const params = new URLSearchParams({
                query: promql,
                start: (start.getTime() / 1000).toString(),
                end: (end.getTime() / 1000).toString(),
                step,
            });

            const response = await fetch(`${url}?${params}`);

            if (!response.ok) {
                throw new Error(`Prometheus range query failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Prometheus range query error: ${error}`);
            throw error;
        }
    }

    /**
     * Get current metrics for a specific tenant
     * Note: Since cAdvisor uses cgroups format, we query all docker containers
     * and filter by service-related metrics. For accurate tenant-specific metrics,
     * consider using the existing MonitoringService which queries Docker API directly.
     */
    async getTenantMetrics(tenantId: string): Promise<TenantMetrics> {
        try {
            // Query all Docker container memory usage (cgroups format: /system.slice/docker-*.scope)
            const memoryQuery = `
                sum(container_memory_usage_bytes{id=~"/system.slice/docker-.*\\\\.scope"})
            `;

            // Query all Docker container CPU usage
            const cpuQuery = `
                sum(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker-.*\\\\.scope"}[5m])) * 100
            `;

            // Network metrics for all Docker containers
            const networkRxQuery = `
                sum(container_network_receive_bytes_total{id=~"/system.slice/docker-.*\\\\.scope"})
            `;

            const networkTxQuery = `
                sum(container_network_transmit_bytes_total{id=~"/system.slice/docker-.*\\\\.scope"})
            `;

            const networkRxRateQuery = `
                sum(rate(container_network_receive_bytes_total{id=~"/system.slice/docker-.*\\\\.scope"}[5m]))
            `;

            const networkTxRateQuery = `
                sum(rate(container_network_transmit_bytes_total{id=~"/system.slice/docker-.*\\\\.scope"}[5m]))
            `;

            // Count Docker containers
            const containerCountQuery = `
                count(container_memory_usage_bytes{id=~"/system.slice/docker-.*\\\\.scope"})
            `;

            // Filesystem/Storage metrics (host-level, as per-container fs is not available)
            const storageUsageQuery = `
                sum(container_fs_usage_bytes{id="/"})
            `;

            const storageTotalQuery = `
                sum(container_fs_limit_bytes{id="/"})
            `;

            // Execute all queries in parallel
            const [
                cpuResult,
                memoryResult,
                networkRxResult,
                networkTxResult,
                networkRxRateResult,
                networkTxRateResult,
                containerCountResult,
                storageUsageResult,
                storageTotalResult,
            ] = await Promise.all([
                this.query(cpuQuery),
                this.query(memoryQuery),
                this.query(networkRxQuery),
                this.query(networkTxQuery),
                this.query(networkRxRateQuery),
                this.query(networkTxRateQuery),
                this.query(containerCountQuery),
                this.query(storageUsageQuery),
                this.query(storageTotalQuery),
            ]);

            // Extract values from results
            const extractValue = (result: PrometheusQueryResult): number => {
                if (result.status === 'success' && result.data.result.length > 0) {
                    const firstResult = result.data.result[0];
                    const value = firstResult?.value;
                    return value ? parseFloat(value[1]) : 0;
                }
                return 0;
            };

            const cpuCurrent = extractValue(cpuResult);
            const memoryCurrent = extractValue(memoryResult);
            // Memory limit not available in cgroups format, estimate based on container count
            const containerCount = extractValue(containerCountResult);
            const memoryLimit = containerCount > 0 ? 512 * 1024 * 1024 * containerCount : 0; // Assume 512MB per container
            const networkRx = extractValue(networkRxResult);
            const networkTx = extractValue(networkTxResult);
            const networkRxRate = extractValue(networkRxRateResult);
            const networkTxRate = extractValue(networkTxRateResult);
            const storageUsed = extractValue(storageUsageResult);
            const storageTotal = extractValue(storageTotalResult);

            return {
                cpu: {
                    current: Math.round(cpuCurrent * 100) / 100,
                    avg: Math.round(cpuCurrent * 100) / 100, // Would need range query for true avg
                    max: Math.round(cpuCurrent * 100) / 100, // Would need range query for true max
                },
                memory: {
                    current: memoryCurrent,
                    limit: memoryLimit,
                    percent: memoryLimit > 0
                        ? Math.round((memoryCurrent / memoryLimit) * 10000) / 100
                        : 0,
                },
                network: {
                    rxBytes: networkRx,
                    txBytes: networkTx,
                    rxRate: Math.round(networkRxRate * 100) / 100,
                    txRate: Math.round(networkTxRate * 100) / 100,
                },
                storage: {
                    used: storageUsed,
                    total: storageTotal,
                    percent: storageTotal > 0 ? Math.round((storageUsed / storageTotal) * 10000) / 100 : 0,
                },
                containerCount: containerCount,
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Failed to get tenant metrics for ${tenantId}: ${error}`);
            // Return zero metrics on error
            return {
                cpu: { current: 0, avg: 0, max: 0 },
                memory: { current: 0, limit: 0, percent: 0 },
                network: { rxBytes: 0, txBytes: 0, rxRate: 0, txRate: 0 },
                storage: { used: 0, total: 0, percent: 0 },
                containerCount: 0,
                timestamp: new Date(),
            };
        }
    }

    /**
     * Get historical CPU usage for a tenant
     */
    async getTenantCpuHistory(
        tenantId: string,
        range: '1H' | '24H' | '7D' = '24H'
    ): Promise<TimeSeriesData[]> {
        const serviceName = `wp_${tenantId}`;
        const { start, end, step } = this.getRangeParams(range);

        const query = `
            sum(rate(container_cpu_usage_seconds_total{
                container_label_com_docker_swarm_service_name="${serviceName}"
            }[5m])) * 100
        `;

        try {
            const result = await this.queryRange(query, start, end, step);
            return this.extractTimeSeries(result);
        } catch {
            return [];
        }
    }

    /**
     * Get historical memory usage for a tenant
     */
    async getTenantMemoryHistory(
        tenantId: string,
        range: '1H' | '24H' | '7D' = '24H'
    ): Promise<TimeSeriesData[]> {
        const serviceName = `wp_${tenantId}`;
        const { start, end, step } = this.getRangeParams(range);

        const query = `
            sum(container_memory_usage_bytes{
                container_label_com_docker_swarm_service_name="${serviceName}"
            })
        `;

        try {
            const result = await this.queryRange(query, start, end, step);
            return this.extractTimeSeries(result);
        } catch {
            return [];
        }
    }

    /**
     * Get historical network usage for a tenant
     */
    async getTenantNetworkHistory(
        tenantId: string,
        range: '1H' | '24H' | '7D' = '24H'
    ): Promise<{ rx: TimeSeriesData[]; tx: TimeSeriesData[] }> {
        const serviceName = `wp_${tenantId}`;
        const { start, end, step } = this.getRangeParams(range);

        const rxQuery = `
            sum(rate(container_network_receive_bytes_total{
                container_label_com_docker_swarm_service_name="${serviceName}"
            }[5m]))
        `;

        const txQuery = `
            sum(rate(container_network_transmit_bytes_total{
                container_label_com_docker_swarm_service_name="${serviceName}"
            }[5m]))
        `;

        try {
            const [rxResult, txResult] = await Promise.all([
                this.queryRange(rxQuery, start, end, step),
                this.queryRange(txQuery, start, end, step),
            ]);

            return {
                rx: this.extractTimeSeries(rxResult),
                tx: this.extractTimeSeries(txResult),
            };
        } catch {
            return { rx: [], tx: [] };
        }
    }

    /**
     * Get cluster-wide metrics overview
     */
    async getClusterMetrics(): Promise<ClusterMetrics> {
        try {
            // Total CPU usage across all Docker containers (cgroups format)
            const totalCpuQuery = `
                sum(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker-.*\\\\.scope"}[5m])) * 100
            `;

            // Total memory usage
            const totalMemoryQuery = `
                sum(container_memory_usage_bytes{id=~"/system.slice/docker-.*\\\\.scope"})
            `;

            // Total container count
            const totalContainersQuery = `
                count(container_memory_usage_bytes{id=~"/system.slice/docker-.*\\\\.scope"})
            `;

            // Node count from node exporter
            const nodeCountQuery = `count(up{job="node-exporter"})`;

            // Tenant count - count unique Docker containers (approximation)
            const tenantCountQuery = `
                count(container_memory_usage_bytes{id=~"/system.slice/docker-.*\\\\.scope"})
            `;

            // Requests per second from Traefik (using entrypoint metrics)
            const rpsQuery = `
                sum(rate(traefik_entrypoint_requests_total[5m]))
            `;

            // Average latency from Traefik
            const latencyQuery = `
                avg(rate(traefik_entrypoint_request_duration_seconds_sum[5m]) / rate(traefik_entrypoint_request_duration_seconds_count[5m]))
            `;

            const [
                totalCpuResult,
                totalMemoryResult,
                totalContainersResult,
                nodeCountResult,
                tenantCountResult,
                rpsResult,
                latencyResult,
            ] = await Promise.all([
                this.query(totalCpuQuery),
                this.query(totalMemoryQuery),
                this.query(totalContainersQuery),
                this.query(nodeCountQuery),
                this.query(tenantCountQuery),
                this.query(rpsQuery),
                this.query(latencyQuery),
            ]);

            const extractValue = (result: PrometheusQueryResult): number => {
                if (result.status === 'success' && result.data.result.length > 0) {
                    const firstResult = result.data.result[0];
                    const value = firstResult?.value;
                    return value ? parseFloat(value[1]) : 0;
                }
                return 0;
            };

            return {
                totalCpu: Math.round(extractValue(totalCpuResult) * 100) / 100,
                totalMemory: extractValue(totalMemoryResult),
                totalContainers: extractValue(totalContainersResult),
                nodeCount: extractValue(nodeCountResult),
                tenantCount: extractValue(tenantCountResult),
                requestsPerSecond: Math.round(extractValue(rpsResult) * 100) / 100,
                avgLatency: Math.round(extractValue(latencyResult) * 1000) / 1000,
            };
        } catch (error) {
            this.logger.error(`Failed to get cluster metrics: ${error}`);
            return {
                totalCpu: 0,
                totalMemory: 0,
                totalContainers: 0,
                nodeCount: 0,
                tenantCount: 0,
                requestsPerSecond: 0,
                avgLatency: 0,
            };
        }
    }

    /**
     * Check Prometheus health
     */
    async isHealthy(): Promise<boolean> {
        try {
            const response = await fetch(`${this.prometheusUrl}/-/healthy`);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get range query parameters based on time range
     */
    private getRangeParams(range: '1H' | '24H' | '7D'): {
        start: Date;
        end: Date;
        step: string;
    } {
        const end = new Date();
        let start: Date;
        let step: string;

        switch (range) {
            case '1H':
                start = new Date(end.getTime() - 60 * 60 * 1000);
                step = '1m';
                break;
            case '24H':
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
                step = '5m';
                break;
            case '7D':
                start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
                step = '1h';
                break;
            default:
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
                step = '5m';
        }

        return { start, end, step };
    }

    /**
     * Extract time series data from Prometheus result
     */
    private extractTimeSeries(result: PrometheusQueryResult): TimeSeriesData[] {
        if (result.status !== 'success' || result.data.result.length === 0) {
            return [];
        }

        const firstResult = result.data.result[0];
        const values = firstResult?.values;
        if (!values) {
            return [];
        }

        return values.map(([timestamp, value]) => ({
            timestamp: timestamp * 1000, // Convert to milliseconds
            value: parseFloat(value),
        }));
    }
}
