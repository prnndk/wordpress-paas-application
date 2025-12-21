import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
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
    constructor(private readonly monitoringService: MonitoringService) { }

    /**
     * Get metrics for a specific instance by tenant ID
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
     * Get metrics for all WordPress instances (admin)
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
