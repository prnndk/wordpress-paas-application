import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MaintenanceController, AnnouncementsController, AdminAnnouncementsController, MaintenanceStatusController } from './maintenance.controller';
import { AdminService } from './admin.service';
import { MaintenanceService } from './maintenance.service';
import { SchedulerService } from './scheduler.service';
import { AdminGuard } from './admin.guard';
import { DockerModule } from '../docker/docker.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [DockerModule, StorageModule],
    controllers: [
        AdminController,
        MaintenanceController,
        AnnouncementsController,
        AdminAnnouncementsController,
        MaintenanceStatusController,
    ],
    providers: [AdminService, MaintenanceService, SchedulerService, AdminGuard],
    exports: [AdminService, MaintenanceService, AdminGuard],
})
export class AdminModule { }
