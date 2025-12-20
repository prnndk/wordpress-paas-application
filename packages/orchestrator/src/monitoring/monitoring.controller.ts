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

@Controller('api/v1/tenants')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
    constructor(private readonly monitoringService: MonitoringService) { }

    /**
     * Get metrics for a specific instance
     */
    @Get(':subdomain/metrics')
    async getInstanceMetrics(
        @Param('subdomain') subdomain: string,
    ): Promise<MetricsResponse> {
        const metrics = await this.monitoringService.getInstanceMetrics(subdomain);

        return {
            success: true,
            data: metrics.map(m => ({
                ...m,
                timestamp: m.timestamp.toISOString(),
            })),
        };
    }

    /**
     * Get logs for a specific instance
     */
    @Get(':subdomain/logs')
    async getInstanceLogs(
        @Param('subdomain') subdomain: string,
        @Query('lines') lines?: string,
    ): Promise<LogsResponse> {
        const numLines = lines ? parseInt(lines, 10) : 100;
        const logs = await this.monitoringService.getInstanceLogs(subdomain, numLines);

        return {
            success: true,
            data: logs,
        };
    }
}
