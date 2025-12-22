import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface PrometheusQueryResult {
	status: "success" | "error";
	data: {
		resultType: "vector" | "matrix" | "scalar" | "string";
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
			"PROMETHEUS_URL",
			"http://prometheus:9090"
		);
		this.logger.log(`Prometheus URL configured: ${this.prometheusUrl}`);
	}

	/**
	 * Execute a PromQL instant query
	 */
	private async query(promql: string): Promise<PrometheusQueryResult> {
		try {
			const url = `${this.prometheusUrl}/api/v1/query`;
			const response = await fetch(
				`${url}?query=${encodeURIComponent(promql)}`
			);

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
		step: string = "1m"
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
				throw new Error(
					`Prometheus range query failed: ${response.statusText}`
				);
			}

			return await response.json();
		} catch (error) {
			this.logger.error(`Prometheus range query error: ${error}`);
			throw error;
		}
	}

	/**
	 * Get current metrics for a specific tenant
	 * Tries multiple query strategies in sequence until one works
	 */
	async getTenantMetrics(tenantId: string): Promise<TenantMetrics> {
		const serviceName = `wp_${tenantId}`;
		const namePattern = `.*${serviceName}.*`;

		// Helper to try multiple queries and return first successful result
		const tryQueries = async (queries: string[]): Promise<number> => {
			for (const query of queries) {
				try {
					const result = await this.query(query.trim());
					if (result.status === "success" && result.data.result.length > 0) {
						const value = result.data.result[0]?.value;
						if (value) return parseFloat(value[1]);
					}
				} catch {
					continue;
				}
			}
			return 0;
		};

		try {
			// CPU queries - try in order
			const cpuQueries = [
				`sum(rate(container_cpu_usage_seconds_total{name=~"${namePattern}"}[5m])) * 100`,
				`sum(rate(container_cpu_usage_seconds_total{container_label_com_docker_swarm_service_name="${serviceName}"}[5m])) * 100`,
				`avg(rate(container_cpu_usage_seconds_total{id=~"/docker/.*"}[5m])) * 100`,
			];

			// Memory queries
			const memoryQueries = [
				`sum(container_memory_usage_bytes{name=~"${namePattern}"})`,
				`sum(container_memory_usage_bytes{container_label_com_docker_swarm_service_name="${serviceName}"})`,
				`avg(container_memory_usage_bytes{id=~"/docker/.*"})`,
			];

			// Memory limit queries
			const memoryLimitQueries = [
				`sum(container_spec_memory_limit_bytes{name=~"${namePattern}"})`,
				`sum(container_spec_memory_limit_bytes{container_label_com_docker_swarm_service_name="${serviceName}"})`,
			];

			// Network RX queries
			const networkRxQueries = [
				`sum(container_network_receive_bytes_total{name=~"${namePattern}"})`,
				`sum(container_network_receive_bytes_total{container_label_com_docker_swarm_service_name="${serviceName}"})`,
				`avg(container_network_receive_bytes_total{id=~"/docker/.*"})`,
			];

			// Network TX queries
			const networkTxQueries = [
				`sum(container_network_transmit_bytes_total{name=~"${namePattern}"})`,
				`sum(container_network_transmit_bytes_total{container_label_com_docker_swarm_service_name="${serviceName}"})`,
				`avg(container_network_transmit_bytes_total{id=~"/docker/.*"})`,
			];

			// Network RX rate queries
			const networkRxRateQueries = [
				`sum(rate(container_network_receive_bytes_total{name=~"${namePattern}"}[5m]))`,
				`sum(rate(container_network_receive_bytes_total{container_label_com_docker_swarm_service_name="${serviceName}"}[5m]))`,
				`avg(rate(container_network_receive_bytes_total{id=~"/docker/.*"}[5m]))`,
			];

			// Network TX rate queries
			const networkTxRateQueries = [
				`sum(rate(container_network_transmit_bytes_total{name=~"${namePattern}"}[5m]))`,
				`sum(rate(container_network_transmit_bytes_total{container_label_com_docker_swarm_service_name="${serviceName}"}[5m]))`,
				`avg(rate(container_network_transmit_bytes_total{id=~"/docker/.*"}[5m]))`,
			];

			// Container count queries
			const containerCountQueries = [
				`count(container_memory_usage_bytes{name=~"${namePattern}"})`,
				`count(container_memory_usage_bytes{container_label_com_docker_swarm_service_name="${serviceName}"})`,
			];

			// Storage queries
			const storageUsageQueries = [
				`sum(container_fs_usage_bytes{name=~"${namePattern}"})`,
				`sum(container_fs_usage_bytes{container_label_com_docker_swarm_service_name="${serviceName}"})`,
				`sum(container_fs_usage_bytes{id="/"})`,
			];

			const storageTotalQueries = [
				`sum(container_fs_limit_bytes{name=~"${namePattern}"})`,
				`sum(container_fs_limit_bytes{container_label_com_docker_swarm_service_name="${serviceName}"})`,
				`sum(container_fs_limit_bytes{id="/"})`,
			];

			// Execute all query groups in parallel
			const [
				cpuCurrent,
				memoryCurrent,
				memoryLimitFromPrometheus,
				networkRx,
				networkTx,
				networkRxRate,
				networkTxRate,
				containerCount,
				storageUsed,
				storageTotal,
			] = await Promise.all([
				tryQueries(cpuQueries),
				tryQueries(memoryQueries),
				tryQueries(memoryLimitQueries),
				tryQueries(networkRxQueries),
				tryQueries(networkTxQueries),
				tryQueries(networkRxRateQueries),
				tryQueries(networkTxRateQueries),
				tryQueries(containerCountQueries),
				tryQueries(storageUsageQueries),
				tryQueries(storageTotalQueries),
			]);

			// Ensure container count is at least 1
			const finalContainerCount = Math.max(1, containerCount);

			// Get memory limit from Prometheus or estimate (512MB per container)
			const memoryLimit =
				memoryLimitFromPrometheus > 0 && isFinite(memoryLimitFromPrometheus)
					? memoryLimitFromPrometheus
					: 512 * 1024 * 1024 * finalContainerCount;

			return {
				cpu: {
					current: Math.round(cpuCurrent * 100) / 100,
					avg: Math.round(cpuCurrent * 100) / 100,
					max: Math.round(cpuCurrent * 100) / 100,
				},
				memory: {
					current: memoryCurrent,
					limit: memoryLimit,
					percent:
						memoryLimit > 0
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
					percent:
						storageTotal > 0
							? Math.round((storageUsed / storageTotal) * 10000) / 100
							: 0,
				},
				containerCount: finalContainerCount,
				timestamp: new Date(),
			};
		} catch (error) {
			this.logger.error(
				`Failed to get tenant metrics for ${tenantId}: ${error}`
			);
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
		range: "1H" | "24H" | "7D" = "24H"
	): Promise<TimeSeriesData[]> {
		const serviceName = `wp_${tenantId}`;
		const namePattern = `.*${serviceName}.*`;
		const { start, end, step } = this.getRangeParams(range);

		// Try multiple matching strategies
		const queries = [
			`sum(rate(container_cpu_usage_seconds_total{name=~"${namePattern}"}[5m])) * 100`,
			`sum(rate(container_cpu_usage_seconds_total{container_label_com_docker_swarm_service_name="${serviceName}"}[5m])) * 100`,
			`sum(rate(container_cpu_usage_seconds_total{id=~"/docker/.*"}[5m])) * 100 / count(container_cpu_usage_seconds_total{id=~"/docker/.*"})`,
		];

		for (const query of queries) {
			try {
				const result = await this.queryRange(query, start, end, step);
				const data = this.extractTimeSeries(result);
				if (data.length > 0) return data;
			} catch {
				continue;
			}
		}
		return [];
	}

	/**
	 * Get historical memory usage for a tenant
	 */
	async getTenantMemoryHistory(
		tenantId: string,
		range: "1H" | "24H" | "7D" = "24H"
	): Promise<TimeSeriesData[]> {
		const serviceName = `wp_${tenantId}`;
		const namePattern = `.*${serviceName}.*`;
		const { start, end, step } = this.getRangeParams(range);

		// Try multiple matching strategies
		const queries = [
			`sum(container_memory_usage_bytes{name=~"${namePattern}"})`,
			`sum(container_memory_usage_bytes{container_label_com_docker_swarm_service_name="${serviceName}"})`,
			`sum(container_memory_usage_bytes{id=~"/docker/.*"}) / count(container_memory_usage_bytes{id=~"/docker/.*"})`,
		];

		for (const query of queries) {
			try {
				const result = await this.queryRange(query, start, end, step);
				const data = this.extractTimeSeries(result);
				if (data.length > 0) return data;
			} catch {
				continue;
			}
		}
		return [];
	}

	/**
	 * Get historical network usage for a tenant
	 */
	async getTenantNetworkHistory(
		tenantId: string,
		range: "1H" | "24H" | "7D" = "24H"
	): Promise<{ rx: TimeSeriesData[]; tx: TimeSeriesData[] }> {
		const serviceName = `wp_${tenantId}`;
		const namePattern = `.*${serviceName}.*`;
		const { start, end, step } = this.getRangeParams(range);

		// Try multiple matching strategies for RX
		const rxQueries = [
			`sum(rate(container_network_receive_bytes_total{name=~"${namePattern}"}[5m]))`,
			`sum(rate(container_network_receive_bytes_total{container_label_com_docker_swarm_service_name="${serviceName}"}[5m]))`,
			`sum(rate(container_network_receive_bytes_total{id=~"/docker/.*"}[5m])) / count(container_network_receive_bytes_total{id=~"/docker/.*"})`,
		];

		const txQueries = [
			`sum(rate(container_network_transmit_bytes_total{name=~"${namePattern}"}[5m]))`,
			`sum(rate(container_network_transmit_bytes_total{container_label_com_docker_swarm_service_name="${serviceName}"}[5m]))`,
			`sum(rate(container_network_transmit_bytes_total{id=~"/docker/.*"}[5m])) / count(container_network_transmit_bytes_total{id=~"/docker/.*"})`,
		];

		let rxData: TimeSeriesData[] = [];
		let txData: TimeSeriesData[] = [];

		// Try RX queries
		for (const query of rxQueries) {
			try {
				const result = await this.queryRange(query, start, end, step);
				const data = this.extractTimeSeries(result);
				if (data.length > 0) {
					rxData = data;
					break;
				}
			} catch {
				continue;
			}
		}

		// Try TX queries
		for (const query of txQueries) {
			try {
				const result = await this.queryRange(query, start, end, step);
				const data = this.extractTimeSeries(result);
				if (data.length > 0) {
					txData = data;
					break;
				}
			} catch {
				continue;
			}
		}

		return { rx: rxData, tx: txData };
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
				if (result.status === "success" && result.data.result.length > 0) {
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
	private getRangeParams(range: "1H" | "24H" | "7D"): {
		start: Date;
		end: Date;
		step: string;
	} {
		const end = new Date();
		let start: Date;
		let step: string;

		switch (range) {
			case "1H":
				start = new Date(end.getTime() - 60 * 60 * 1000);
				step = "1m";
				break;
			case "24H":
				start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
				step = "5m";
				break;
			case "7D":
				start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
				step = "1h";
				break;
			default:
				start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
				step = "5m";
		}

		return { start, end, step };
	}

	/**
	 * Extract time series data from Prometheus result
	 */
	private extractTimeSeries(result: PrometheusQueryResult): TimeSeriesData[] {
		if (result.status !== "success" || result.data.result.length === 0) {
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
