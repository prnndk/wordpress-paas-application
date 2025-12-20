import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { AuditLogDto } from "./dto/audit-log.dto";

@ApiTags("Audit")
@Controller("audit")
export class AuditController {
	constructor(private readonly auditService: AuditService) {}

	@Get()
	@ApiOperation({ summary: "Get audit logs" })
	@ApiQuery({
		name: "userId",
		required: false,
		description: "Filter by user ID",
	})
	@ApiQuery({
		name: "tenantId",
		required: false,
		description: "Filter by tenant ID",
	})
	@ApiQuery({
		name: "limit",
		required: false,
		description: "Maximum number of logs",
		type: Number,
	})
	@ApiResponse({
		status: 200,
		description: "Audit logs",
		type: [AuditLogDto],
	})
	async getLogs(
		@Query("userId") userId?: string,
		@Query("tenantId") tenantId?: string,
		@Query("limit") limit?: string
	): Promise<AuditLogDto[]> {
		return this.auditService.getAuditLogs({
			userId,
			tenantId,
			limit: limit ? parseInt(limit, 10) : undefined,
		});
	}
}
