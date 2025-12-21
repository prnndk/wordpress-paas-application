import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { PrometheusService } from './prometheus.service';

@Module({
    imports: [ConfigModule],
    controllers: [MonitoringController],
    providers: [MonitoringService, PrometheusService],
    exports: [MonitoringService, PrometheusService],
})
export class MonitoringModule { }
