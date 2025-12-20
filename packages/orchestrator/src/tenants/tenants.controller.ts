import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';
import { TenantsService, TenantDetails } from './services/tenants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreateTenantRequestDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(63)
    @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
        message: 'Subdomain must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric',
    })
    subdomain!: string;

    @IsString()
    @IsOptional()
    @MinLength(3)
    @MaxLength(32)
    wpAdminUser?: string;

    @IsString()
    @IsOptional()
    @MinLength(8)
    @MaxLength(64)
    wpAdminPassword?: string;
}

interface AuthenticatedRequest extends Request {
    user: { id: string; email: string };
}

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new WordPress instance' })
    @ApiResponse({ status: 201, description: 'Instance created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async create(
        @Body() dto: CreateTenantRequestDto,
        @Req() req: AuthenticatedRequest
    ): Promise<TenantDetails> {
        // Validate subdomain doesn't exist
        const existingTenants = await this.tenantsService.getTenantsByUser(req.user.id);
        if (existingTenants.some((t) => t.subdomain === dto.subdomain)) {
            throw new BadRequestException('Subdomain already in use');
        }

        return this.tenantsService.createTenant({
            userId: req.user.id,
            name: dto.name,
            subdomain: dto.subdomain,
            wpAdminUser: dto.wpAdminUser,
            wpAdminPassword: dto.wpAdminPassword,
        });
    }


    @Get()
    @ApiOperation({ summary: 'List all WordPress instances for current user' })
    @ApiResponse({ status: 200, description: 'List of instances' })
    async list(@Req() req: AuthenticatedRequest): Promise<TenantDetails[]> {
        return this.tenantsService.getTenantsByUser(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get details of a WordPress instance' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiResponse({ status: 200, description: 'Instance details' })
    @ApiResponse({ status: 404, description: 'Instance not found' })
    async get(@Param('id') id: string): Promise<TenantDetails> {
        const tenant = await this.tenantsService.getTenant(id);
        if (!tenant) {
            throw new NotFoundException('Instance not found');
        }
        return tenant;
    }

    @Post(':id/start')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Start a stopped WordPress instance' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiResponse({ status: 204, description: 'Instance started' })
    @ApiResponse({ status: 404, description: 'Instance not found' })
    async start(@Param('id') id: string): Promise<void> {
        const tenant = await this.tenantsService.getTenant(id);
        if (!tenant) {
            throw new NotFoundException('Instance not found');
        }
        await this.tenantsService.startTenant(id);
    }

    @Post(':id/stop')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Stop a running WordPress instance' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiResponse({ status: 204, description: 'Instance stopped' })
    @ApiResponse({ status: 404, description: 'Instance not found' })
    async stop(@Param('id') id: string): Promise<void> {
        const tenant = await this.tenantsService.getTenant(id);
        if (!tenant) {
            throw new NotFoundException('Instance not found');
        }
        await this.tenantsService.stopTenant(id);
    }

    @Post(':id/restart')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Restart a WordPress instance' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiResponse({ status: 204, description: 'Instance restarted' })
    @ApiResponse({ status: 404, description: 'Instance not found' })
    async restart(@Param('id') id: string): Promise<void> {
        const tenant = await this.tenantsService.getTenant(id);
        if (!tenant) {
            throw new NotFoundException('Instance not found');
        }
        await this.tenantsService.restartTenant(id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a WordPress instance' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiResponse({ status: 204, description: 'Instance deleted' })
    @ApiResponse({ status: 404, description: 'Instance not found' })
    async delete(@Param('id') id: string): Promise<void> {
        const tenant = await this.tenantsService.getTenant(id);
        if (!tenant) {
            throw new NotFoundException('Instance not found');
        }
        await this.tenantsService.deleteTenant(id);
    }

    @Get(':id/logs')
    @ApiOperation({ summary: 'Get logs for a WordPress instance' })
    @ApiParam({ name: 'id', description: 'Tenant ID' })
    @ApiQuery({ name: 'tail', required: false, description: 'Number of log lines' })
    @ApiResponse({ status: 200, description: 'Log output' })
    @ApiResponse({ status: 404, description: 'Instance not found' })
    async getLogs(
        @Param('id') id: string,
        @Query('tail') tail?: string
    ): Promise<{ logs: string }> {
        const tenant = await this.tenantsService.getTenant(id);
        if (!tenant) {
            throw new NotFoundException('Instance not found');
        }
        const logs = await this.tenantsService.getTenantLogs(
            id,
            tail ? parseInt(tail, 10) : 100
        );
        return { logs };
    }
}
