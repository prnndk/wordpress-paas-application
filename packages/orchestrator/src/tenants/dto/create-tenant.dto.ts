import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsArray,
	ValidateNested,
	MinLength,
	MaxLength,
	Matches,
	IsIn,
	IsEmail,
} from "class-validator";

/**
 * Environment variable DTO
 */
export class EnvVarDto {
	@ApiProperty({ description: "Environment variable key", example: "DEBUG" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	@Matches(/^[A-Z_][A-Z0-9_]*$/, {
		message: "Key must be uppercase with underscores (e.g., MY_VAR)",
	})
	key!: string;

	@ApiProperty({ description: "Environment variable value", example: "true" })
	@IsString()
	@MaxLength(1000)
	value!: string;
}

/**
 * Create tenant request DTO - Subscription-Centric model
 *
 * In this model, subscription determines resource limits.
 * planId is optional metadata, not a permission to bypass subscription limits.
 */
export class CreateTenantDto {
	@ApiProperty({ description: "Instance name", example: "My Production Blog" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name!: string;

	@ApiProperty({
		description: "URL slug (path segment)",
		example: "my-blog",
		pattern: "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$",
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(63)
	@Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
		message:
			"Slug must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric",
	})
	slug!: string;

	@ApiProperty({
		description: "Deployment region",
		example: "us-east-1",
		enum: ["us-east-1", "eu-central-1", "ap-south-1", "ca-central-1"],
	})
	@IsString()
	@IsNotEmpty()
	@IsIn(["us-east-1", "eu-central-1", "ap-south-1", "ca-central-1"], {
		message:
			"Region must be one of: us-east-1, eu-central-1, ap-south-1, ca-central-1",
	})
	region!: string;

	@ApiProperty({ description: "Environment variables", type: [EnvVarDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EnvVarDto)
	env!: EnvVarDto[];

	@ApiProperty({ description: "WordPress admin username", example: "admin" })
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(32)
	@Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
		message:
			"Username must start with a letter and contain only letters, numbers, and underscores",
	})
	wpAdminUser!: string;

	@ApiProperty({
		description: "WordPress admin password",
		example: "SecurePass123!",
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@MaxLength(64)
	wpAdminPassword!: string;

	@ApiProperty({
		description: "WordPress admin email",
		example: "admin@example.com",
	})
	@IsString()
	@IsNotEmpty()
	@IsEmail({}, { message: "Must be a valid email address" })
	wpAdminEmail!: string;

	@ApiPropertyOptional({
		description: "Site title for WordPress",
		example: "My Awesome Blog",
	})
	@IsOptional()
	@IsString()
	@MaxLength(200)
	siteTitle?: string;

	@ApiPropertyOptional({ description: "Optional notes about the instance" })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	notes?: string;
}

/**
 * Tenant endpoints DTO
 */
export class TenantEndpointsDto {
	@ApiProperty({
		description: "WordPress site URL",
		example: "https://10.28.85.212/my-site",
	})
	site!: string;

	@ApiProperty({
		description: "WordPress admin URL",
		example: "https://10.28.85.212/my-site/wp-admin",
	})
	admin!: string;
}

/**
 * Tenant response DTO
 */
export class TenantResponseDto {
	@ApiProperty({ description: "Tenant ID" })
	id!: string;

	@ApiProperty({ description: "Instance name" })
	name!: string;

	@ApiProperty({ description: "URL slug" })
	slug!: string;

	@ApiProperty({ description: "Path-based endpoints" })
	endpoints!: TenantEndpointsDto;

	@ApiProperty({ description: "Region" })
	region!: string;

	@ApiProperty({ description: "Resource specs" })
	specs!: {
		cpuCores: number;
		ramGb: number;
		storageGb: number;
	};

	@ApiProperty({ description: "Environment variables" })
	env!: { key: string; value: string }[];

	@ApiProperty({ description: "Instance status" })
	status!: string;

	@ApiProperty({ description: "WordPress admin username" })
	wpAdminUser!: string;

	@ApiProperty({
		description: "WordPress admin password (only returned on create)",
	})
	wpAdminPassword?: string;

	@ApiProperty({ description: "Creation timestamp" })
	createdAt!: string;
}
