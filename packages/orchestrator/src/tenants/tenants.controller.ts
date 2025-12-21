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
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
	ApiQuery,
} from "@nestjs/swagger";
import { TenantsService, TenantDetails } from "./services/tenants.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTenantDto, TenantResponseDto } from "./dto/create-tenant.dto";
import { QuotaExceededErrorDto } from "../subscriptions/dto/subscription.dto";

interface AuthenticatedRequest extends Request {
	user: { id: string; email: string };
}

@ApiTags("Tenants")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tenants")
export class TenantsController {
	constructor(private readonly tenantsService: TenantsService) {}

	@Post()
	@ApiOperation({
		summary: "Create a new WordPress instance",
		description:
			"Creates a new WordPress instance. Subscription quota is checked - if user has reached their instance limit, a 403 QuotaExceeded error is returned.",
	})
	@ApiResponse({
		status: 201,
		description: "Instance created successfully",
		type: TenantResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: "Invalid input or slug already in use",
	})
	@ApiResponse({
		status: 403,
		description:
			"Quota exceeded - upgrade subscription to create more instances",
		type: QuotaExceededErrorDto,
	})
	async create(
		@Body() dto: CreateTenantDto,
		@Req() req: AuthenticatedRequest
	): Promise<TenantDetails> {
		return this.tenantsService.createTenant({
			userId: req.user.id,
			name: dto.name,
			slug: dto.slug,
			region: dto.region,
			env: dto.env,
			wpAdminUser: dto.wpAdminUser,
			wpAdminPassword: dto.wpAdminPassword,
			wpAdminEmail: dto.wpAdminEmail,
			siteTitle: dto.siteTitle,
			notes: dto.notes,
		});
	}

	@Get("quota")
	@ApiOperation({
		summary: "Get current quota status",
		description:
			"Returns the number of instances used and allowed for the current user",
	})
	@ApiResponse({
		status: 200,
		description: "Quota status",
	})
	async getQuota(
		@Req() req: AuthenticatedRequest
	): Promise<{ used: number; allowed: number; canCreate: boolean }> {
		return this.tenantsService.checkQuota(req.user.id);
	}

	@Get()
	@ApiOperation({ summary: "List all WordPress instances for current user" })
	@ApiResponse({ status: 200, description: "List of instances" })
	async list(@Req() req: AuthenticatedRequest): Promise<TenantDetails[]> {
		return this.tenantsService.getTenantsByUser(req.user.id);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get details of a WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiResponse({ status: 200, description: "Instance details" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async get(@Param("id") id: string): Promise<TenantDetails> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		return tenant;
	}

	@Post(":id/start")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Start a stopped WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiResponse({ status: 204, description: "Instance started" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async start(@Param("id") id: string): Promise<void> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		await this.tenantsService.startTenant(id);
	}

	@Post(":id/stop")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Stop a running WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiResponse({ status: 204, description: "Instance stopped" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async stop(@Param("id") id: string): Promise<void> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		await this.tenantsService.stopTenant(id);
	}

	@Post(":id/restart")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Restart a WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiResponse({ status: 204, description: "Instance restarted" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async restart(@Param("id") id: string): Promise<void> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		await this.tenantsService.restartTenant(id);
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Delete a WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiResponse({ status: 204, description: "Instance deleted" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async delete(@Param("id") id: string): Promise<void> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		await this.tenantsService.deleteTenant(id);
	}

	@Get(":id/logs")
	@ApiOperation({ summary: "Get logs for a WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiQuery({
		name: "tail",
		required: false,
		description: "Number of log lines",
	})
	@ApiResponse({ status: 200, description: "Log output" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async getLogs(
		@Param("id") id: string,
		@Query("tail") tail?: string
	): Promise<{ logs: string }> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		const logs = await this.tenantsService.getTenantLogs(
			id,
			tail ? parseInt(tail, 10) : 100
		);
		return { logs };
	}

	@Post(":id/purge-cache")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Purge cache for a WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiResponse({ status: 200, description: "Cache purged successfully" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async purgeCache(
		@Param("id") id: string
	): Promise<{ success: boolean; message: string }> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		return this.tenantsService.purgeCache(id);
	}

	@Post(":id/restart-php")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Restart PHP-FPM for a WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiResponse({ status: 200, description: "PHP restarted successfully" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async restartPhp(
		@Param("id") id: string
	): Promise<{ success: boolean; message: string }> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		return this.tenantsService.restartPhp(id);
	}

	@Get(":id/metrics")
	@ApiOperation({ summary: "Get metrics for a WordPress instance" })
	@ApiParam({ name: "id", description: "Tenant ID" })
	@ApiQuery({
		name: "range",
		required: false,
		description: "Time range: 1H, 24H, or 7D",
	})
	@ApiResponse({ status: 200, description: "Instance metrics" })
	@ApiResponse({ status: 404, description: "Instance not found" })
	async getMetrics(
		@Param("id") id: string,
		@Query("range") range?: string
	): Promise<any> {
		const tenant = await this.tenantsService.getTenant(id);
		if (!tenant) {
			throw new NotFoundException("Instance not found");
		}
		return this.tenantsService.getMetrics(
			id,
			(range as "1H" | "24H" | "7D") || "24H"
		);
	}
}
