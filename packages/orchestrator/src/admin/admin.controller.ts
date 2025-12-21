import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsBoolean, IsString, IsIn } from 'class-validator';
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
}
