import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsDateString, IsIn, IsArray, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { MaintenanceService } from './maintenance.service';

class CreateAnnouncementDto {
    @IsString()
    @MaxLength(200)
    title!: string;

    @IsString()
    @MaxLength(2000)
    message!: string;

    @IsString()
    @IsIn(['info', 'warning', 'maintenance'])
    @IsOptional()
    type?: 'info' | 'warning' | 'maintenance';

    @IsDateString()
    @IsOptional()
    scheduledAt?: string;

    @IsDateString()
    @IsOptional()
    expiresAt?: string;
}

class ToggleAnnouncementDto {
    @IsBoolean()
    isActive!: boolean;
}

class RollingUpdateDto {
    @IsString()
    image!: string;

    @IsBoolean()
    @IsOptional()
    forceUpdate?: boolean;
}

class CreateScheduledMaintenanceDto {
    @IsDateString()
    scheduledAt!: string;

    @IsString()
    targetImage!: string;

    @IsBoolean()
    @IsOptional()
    forceUpdate?: boolean;

    @IsString()
    @IsOptional()
    announcementId?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    targetTenantIds?: string[];
}

@ApiTags('Admin - Maintenance')
@Controller('admin/maintenance')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Get('image')
    @ApiOperation({ summary: 'Get current WordPress image' })
    async getCurrentImage() {
        const image = await this.maintenanceService.getCurrentWordPressImage();
        return { currentImage: image };
    }

    @Get('tenants')
    @ApiOperation({ summary: 'Get available WordPress tenants' })
    async getAvailableTenants() {
        return this.maintenanceService.getAvailableWordPressTenants();
    }

    @Post('rolling-update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Rolling update all WordPress services' })
    async rollingUpdate(@Body() dto: RollingUpdateDto) {
        return this.maintenanceService.rollingUpdateAllServices(dto.image, dto.forceUpdate || false);
    }

    @Post('update-service/:serviceName')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update single service image' })
    async updateSingleService(
        @Param('serviceName') serviceName: string,
        @Body() dto: RollingUpdateDto,
    ) {
        return this.maintenanceService.updateSingleService(serviceName, dto.image);
    }

    // Scheduled Maintenance Endpoints
    @Post('schedule')
    @ApiOperation({ summary: 'Create scheduled maintenance' })
    async createScheduledMaintenance(@Body() dto: CreateScheduledMaintenanceDto) {
        return this.maintenanceService.createScheduledMaintenance({
            scheduledAt: new Date(dto.scheduledAt),
            targetImage: dto.targetImage,
            forceUpdate: dto.forceUpdate,
            announcementId: dto.announcementId,
            targetTenantIds: dto.targetTenantIds,
        });
    }

    @Get('schedule')
    @ApiOperation({ summary: 'Get all scheduled maintenances' })
    async getScheduledMaintenances() {
        return this.maintenanceService.getScheduledMaintenances();
    }

    @Delete('schedule/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cancel scheduled maintenance' })
    async cancelScheduledMaintenance(@Param('id') id: string) {
        await this.maintenanceService.cancelScheduledMaintenance(id);
    }

    @Post('schedule/:id/execute')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Manually execute scheduled maintenance' })
    async executeScheduledMaintenance(@Param('id') id: string) {
        return this.maintenanceService.executeScheduledMaintenance(id);
    }
}

// Public announcements endpoint (no admin guard)
@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Get()
    @ApiOperation({ summary: 'Get active announcements (public)' })
    async getActiveAnnouncements() {
        return this.maintenanceService.getActiveAnnouncements();
    }
}

// Public maintenance status endpoint
@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceStatusController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Get('status')
    @ApiOperation({ summary: 'Check if maintenance is currently active (public)' })
    async getMaintenanceStatus() {
        const isActive = await this.maintenanceService.checkActiveMaintenanceWindow();
        if (!isActive) {
            return { isActive: false };
        }
        return this.maintenanceService.getActiveMaintenanceInfo();
    }
}

// Admin announcements management
@ApiTags('Admin - Announcements')
@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminAnnouncementsController {
    constructor(private readonly maintenanceService: MaintenanceService) { }

    @Get()
    @ApiOperation({ summary: 'Get all announcements' })
    async getAllAnnouncements() {
        return this.maintenanceService.getAllAnnouncements();
    }

    @Post()
    @ApiOperation({ summary: 'Create announcement' })
    async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
        return this.maintenanceService.createAnnouncement({
            ...dto,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        });
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle announcement active status' })
    async toggleAnnouncement(
        @Param('id') id: string,
        @Body() dto: ToggleAnnouncementDto,
    ) {
        return this.maintenanceService.toggleAnnouncement(id, dto.isActive);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete announcement' })
    async deleteAnnouncement(@Param('id') id: string) {
        await this.maintenanceService.deleteAnnouncement(id);
    }
}
