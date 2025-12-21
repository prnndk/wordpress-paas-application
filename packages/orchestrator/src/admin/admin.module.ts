import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { MaintenanceController, AnnouncementsController, AdminAnnouncementsController } from './maintenance.controller';
import { AdminService } from './admin.service';
import { MaintenanceService } from './maintenance.service';
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
    ],
    providers: [AdminService, MaintenanceService, AdminGuard],
    exports: [AdminService, MaintenanceService, AdminGuard],
})
export class AdminModule { }
