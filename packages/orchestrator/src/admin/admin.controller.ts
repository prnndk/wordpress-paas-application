import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsBoolean, IsString, IsIn, IsOptional, IsNumber, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

class ToggleStatusDto {
    @IsBoolean()
    isActive!: boolean;
}

class SetRoleDto {
    @IsString()
    @IsIn(['user', 'admin'])
    role!: 'user' | 'admin';
}

class UpdateResourcesDto {
    @IsOptional()
    @IsNumber()
    @Min(0.1)
    cpuLimit?: number; // CPU cores (e.g., 0.5 = half a core)

    @IsOptional()
    @IsNumber()
    @Min(64)
    memoryLimit?: number; // Memory in MB

    @IsOptional()
    @IsNumber()
    @Min(0.1)
    cpuReservation?: number; // CPU cores

    @IsOptional()
    @IsNumber()
    @Min(64)
    memoryReservation?: number; // Memory in MB
}

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get admin dashboard statistics' })
    async getStats() {
        return this.adminService.getStats();
    }

    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    async getAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('users/:id/status')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Enable or disable a user' })
    async toggleUserStatus(
        @Param('id') id: string,
        @Body() dto: ToggleStatusDto,
    ) {
        return this.adminService.toggleUserStatus(id, dto.isActive);
    }

    @Patch('users/:id/role')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Set user role' })
    async setUserRole(
        @Param('id') id: string,
        @Body() dto: SetRoleDto,
    ) {
        return this.adminService.setUserRole(id, dto.role);
    }

    @Get('tenants')
    @ApiOperation({ summary: 'List all tenants with usage' })
    async getAllTenants() {
        return this.adminService.getAllTenants();
    }

    @Patch('tenants/:id/status')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Enable or disable a tenant' })
    async toggleTenantStatus(
        @Param('id') id: string,
        @Body() dto: ToggleStatusDto,
    ) {
        return this.adminService.toggleTenantStatus(id, dto.isActive);
    }

    @Get('tenants/:id')
    @ApiOperation({ summary: 'Get tenant details with usage' })
    async getTenantDetails(@Param('id') id: string) {
        const tenant = await this.adminService.getTenantDetails(id);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        return tenant;
    }

    @Get('services')
    @ApiOperation({ summary: 'List all Docker services with node info' })
    async getAllServices() {
        return this.adminService.getAllServices();
    }

    @Get('services/:name/logs')
    @ApiOperation({ summary: 'Get logs for a specific Docker service' })
    @ApiQuery({ name: 'tail', required: false, description: 'Number of log lines to return' })
    async getServiceLogs(
        @Param('name') name: string,
        @Query('tail') tail?: string,
    ) {
        const logs = await this.adminService.getServiceLogs(name, tail ? parseInt(tail, 10) : 100);
        return { logs };
    }

    @Patch('services/:name/resources')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Docker service resource limits' })
    async updateServiceResources(
        @Param('name') name: string,
        @Body() dto: UpdateResourcesDto,
    ) {
        await this.adminService.updateServiceResources(name, dto);
        return { success: true, message: 'Service resources updated successfully' };
    }
}
