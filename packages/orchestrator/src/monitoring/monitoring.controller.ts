import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { PrometheusService } from './prometheus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface MetricsResponse {
    success: boolean;
    data: {
        containerId: string;
        containerName: string;
        status: string;
        stats: {
            cpuPercent: number;
            memoryUsage: number;
            memoryLimit: number;
            memoryPercent: number;
            networkRx: number;
            networkTx: number;
        } | null;
        timestamp: string;
    }[];
}

interface LogsResponse {
    success: boolean;
    data: string[];
}

@Controller('monitoring')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
    constructor(
        private readonly monitoringService: MonitoringService,
        private readonly prometheusService: PrometheusService,
    ) { }

    /**
     * Get metrics for a specific instance by tenant ID (Docker-based)
     */
    @Get(':tenantId/metrics')
    async getInstanceMetrics(
        @Param('tenantId') tenantId: string,
    ): Promise<MetricsResponse> {
        const metrics = await this.monitoringService.getInstanceMetrics(tenantId);

        return {
            success: true,
            data: metrics.map(m => ({
                ...m,
                timestamp: m.timestamp.toISOString(),
            })),
        };
    }

    /**
     * Get Prometheus-based metrics for a specific tenant
     */
    @Get(':tenantId/prometheus')
    async getPrometheusMetrics(
        @Param('tenantId') tenantId: string,
    ) {
        const metrics = await this.prometheusService.getTenantMetrics(tenantId);

        return {
            success: true,
            data: {
                ...metrics,
                timestamp: metrics.timestamp.toISOString(),
            },
        };
    }

    /**
     * Get Prometheus historical data for a tenant
     */
    @Get(':tenantId/prometheus/history')
    async getPrometheusHistory(
        @Param('tenantId') tenantId: string,
        @Query('range') range?: '1H' | '24H' | '7D',
    ) {
        const timeRange = range || '24H';

        const [cpuHistory, memoryHistory, networkHistory] = await Promise.all([
            this.prometheusService.getTenantCpuHistory(tenantId, timeRange),
            this.prometheusService.getTenantMemoryHistory(tenantId, timeRange),
            this.prometheusService.getTenantNetworkHistory(tenantId, timeRange),
        ]);

        return {
            success: true,
            data: {
                cpu: cpuHistory,
                memory: memoryHistory,
                network: networkHistory,
                range: timeRange,
            },
        };
    }

    /**
     * Get logs for a specific instance by tenant ID
     */
    @Get(':tenantId/logs')
    async getInstanceLogs(
        @Param('tenantId') tenantId: string,
        @Query('lines') lines?: string,
    ): Promise<LogsResponse> {
        const numLines = lines ? parseInt(lines, 10) : 100;
        const logs = await this.monitoringService.getInstanceLogs(tenantId, numLines);

        return {
            success: true,
            data: logs,
        };
    }

    /**
     * Get cluster-wide Prometheus metrics (admin)
     */
    @Get('cluster/overview')
    async getClusterOverview() {
        const metrics = await this.prometheusService.getClusterMetrics();

        return {
            success: true,
            data: metrics,
        };
    }

    /**
     * Check Prometheus health
     */
    @Get('prometheus/health')
    async getPrometheusHealth() {
        const isHealthy = await this.prometheusService.isHealthy();

        return {
            success: true,
            data: {
                healthy: isHealthy,
                timestamp: new Date().toISOString(),
            },
        };
    }

    /**
     * Get metrics for all WordPress instances (admin) - Docker-based
     */
    @Get('all')
    async getAllMetrics() {
        const allMetrics = await this.monitoringService.getAllInstancesMetrics();

        const result: Record<string, MetricsResponse['data']> = {};

        allMetrics.forEach((metrics, key) => {
            result[key] = metrics.map(m => ({
                ...m,
                timestamp: m.timestamp.toISOString(),
            }));
        });

        return {
            success: true,
            data: result,
        };
    }
}
