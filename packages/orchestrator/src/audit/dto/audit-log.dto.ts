import { ApiProperty } from "@nestjs/swagger";

export class AuditLogDto {
	@ApiProperty({ description: "Unique log ID" })
	id!: string;

	@ApiProperty({ description: "Timestamp in ISO 8601 format" })
	timestamp!: string;

	@ApiProperty({ description: "Log level", enum: ["info", "warn", "error"] })
	level!: string;

	@ApiProperty({
		description: "Log source",
		enum: ["auth", "tenant", "system"],
	})
	source!: string;

	@ApiProperty({ description: "Log message" })
	message!: string;

	@ApiProperty({ description: "Tenant ID (if applicable)", required: false })
	tenantId?: string;

	@ApiProperty({ description: "User ID (if applicable)", required: false })
	userId?: string;

	@ApiProperty({ description: "Additional metadata", required: false })
	metadata?: Record<string, any>;
}
