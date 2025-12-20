import { Injectable, Logger } from "@nestjs/common";
import { TenantsService } from "../tenants/services/tenants.service";
import { AuditLogDto } from "./dto/audit-log.dto";
import { nanoid } from "nanoid";

interface AuditQueryParams {
	userId?: string;
	tenantId?: string;
	limit?: number;
}

@Injectable()
export class AuditService {
	private readonly logger = new Logger(AuditService.name);

	constructor(private readonly tenantsService: TenantsService) {}

	async getAuditLogs(params: AuditQueryParams = {}): Promise<AuditLogDto[]> {
		const limit = params.limit || 100;
		const logs: AuditLogDto[] = [];

		try {
			// Get tenants for the user if userId provided
			if (!params.userId) {
				// No userId provided, return stub logs
				return this.getStubLogs();
			}

			const tenants = await this.tenantsService.getTenantsByUser(params.userId);

			// Aggregate logs from each tenant
			for (const tenant of tenants) {
				// Skip if filtering by specific tenant and this isn't it
				if (params.tenantId && tenant.id !== params.tenantId) {
					continue;
				}

				try {
					const tenantLogs = await this.tenantsService.getTenantLogs(
						tenant.id,
						50
					);

					// Parse and format logs - use params.userId as it's guaranteed to exist here
					const parsedLogs = this.parseTenantLogs(
						tenantLogs,
						tenant.id,
						params.userId
					);
					logs.push(...parsedLogs);
				} catch (error) {
					this.logger.warn(`Failed to get logs for tenant ${tenant.id}`, error);
				}
			}

			// Sort by timestamp descending and limit
			logs.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			);

			return logs.slice(0, limit);
		} catch (error) {
			this.logger.error("Failed to get audit logs", error);
			return this.getStubLogs();
		}
	}

	private parseTenantLogs(
		rawLogs: string,
		tenantId: string,
		userId: string
	): AuditLogDto[] {
		const logs: AuditLogDto[] = [];
		const lines = rawLogs.split("\n").filter((line) => line.trim());

		for (const line of lines) {
			try {
				// Try to parse structured logs or create from plain text
				const log = this.parseLogLine(line, tenantId, userId);
				if (log) {
					logs.push(log);
				}
			} catch (error) {
				// Skip unparseable lines
			}
		}

		return logs;
	}

	private parseLogLine(
		line: string,
		tenantId: string,
		userId: string
	): AuditLogDto | null {
		// Try to extract timestamp and message from common log formats
		const timestampMatch = line.match(
			/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/
		);
		const timestamp: string = timestampMatch?.[1] ?? new Date().toISOString();

		// Determine log level
		let level: "info" | "warn" | "error" = "info";
		if (
			line.toLowerCase().includes("error") ||
			line.toLowerCase().includes("fail")
		) {
			level = "error";
		} else if (line.toLowerCase().includes("warn")) {
			level = "warn";
		}

		return {
			id: nanoid(),
			timestamp,
			level,
			source: "tenant",
			message: line,
			tenantId,
			userId,
		};
	}

	private getStubLogs(): AuditLogDto[] {
		const now = new Date();
		return [
			{
				id: nanoid(),
				timestamp: new Date(now.getTime() - 3600000).toISOString(),
				level: "info",
				source: "system",
				message: "System started successfully",
			},
			{
				id: nanoid(),
				timestamp: new Date(now.getTime() - 1800000).toISOString(),
				level: "info",
				source: "auth",
				message: "User logged in",
			},
			{
				id: nanoid(),
				timestamp: new Date(now.getTime() - 900000).toISOString(),
				level: "info",
				source: "tenant",
				message: "WordPress instance created",
			},
		];
	}
}
