import {
	Controller,
	Post,
	Get,
	Patch,
	Body,
	Query,
	UseGuards,
	Req,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiQuery,
	ApiConsumes,
	ApiBody,
} from "@nestjs/swagger";
import {
	IsEmail,
	IsString,
	MinLength,
	MaxLength,
	IsOptional,
} from "class-validator";
import { AuthService, AuthTokens } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { MeResponseDto, parseIncludes } from "./dto/me-response.dto";
import { MinioService } from "../storage/minio.service";

class RegisterDto {
	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password!: string;

	@IsString()
	@MaxLength(100)
	fullName!: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	name?: string;
}

class LoginDto {
	@IsEmail()
	email!: string;

	@IsString()
	password!: string;
}

class UpdateProfileDto {
	@IsString()
	@IsOptional()
	@MaxLength(100)
	fullName?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	name?: string;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	avatarUrl?: string;
}

class UpdateSettingsDto {
	@IsString()
	@IsOptional()
	@MaxLength(50)
	timezone?: string;

	@IsString()
	@IsOptional()
	@MaxLength(10)
	language?: string;
}

class ChangePasswordDto {
	@IsString()
	@MinLength(1)
	currentPassword!: string;

	@IsString()
	@MinLength(8)
	@MaxLength(128)
	newPassword!: string;
}

interface AuthenticatedRequest extends Request {
	user: { id: string; email: string };
}

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly minioService: MinioService
	) {}

	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	@ApiResponse({ status: 201, description: "User registered successfully" })
	@ApiResponse({ status: 409, description: "Email already registered" })
	async register(@Body() dto: RegisterDto): Promise<AuthTokens> {
		return this.authService.register(
			dto.email,
			dto.password,
			dto.name,
			dto.fullName
		);
	}

	@Post("login")
	@ApiOperation({ summary: "Login with email and password" })
	@ApiResponse({ status: 200, description: "Login successful" })
	@ApiResponse({ status: 401, description: "Invalid credentials" })
	async login(@Body() dto: LoginDto): Promise<AuthTokens> {
		return this.authService.login(dto.email, dto.password);
	}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: "Get current user profile with optional aggregated data",
		description:
			"Returns user profile with optional tenants, subscriptions, cluster, audit, and billing data. Use include parameter to specify which data to fetch.",
	})
	@ApiQuery({
		name: "include",
		required: false,
		description:
			"Comma-separated list of data to include: tenants, subscriptions, cluster, audit, billing, or all",
		example: "tenants,subscriptions,cluster,audit",
	})
	@ApiResponse({
		status: 200,
		description: "User profile with requested data",
		type: MeResponseDto,
	})
	@ApiResponse({ status: 401, description: "Unauthorized" })
	async me(
		@Req() req: AuthenticatedRequest,
		@Query("include") include?: string
	): Promise<MeResponseDto> {
		const includes = parseIncludes(include);
		return this.authService.getFullUserProfile(req.user.id, includes);
	}

	@Patch("profile")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Update user profile" })
	@ApiResponse({ status: 200, description: "Profile updated successfully" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	async updateProfile(
		@Req() req: AuthenticatedRequest,
		@Body() dto: UpdateProfileDto
	): Promise<{ success: boolean }> {
		return this.authService.updateProfile(req.user.id, dto);
	}

	@Patch("settings")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Update user settings" })
	@ApiResponse({ status: 200, description: "Settings updated successfully" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	async updateSettings(
		@Req() req: AuthenticatedRequest,
		@Body() dto: UpdateSettingsDto
	): Promise<{ success: boolean }> {
		return this.authService.updateSettings(req.user.id, dto);
	}

	@Post("change-password")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Change user password" })
	@ApiResponse({ status: 200, description: "Password changed successfully" })
	@ApiResponse({
		status: 401,
		description: "Unauthorized or wrong current password",
	})
	async changePassword(
		@Req() req: AuthenticatedRequest,
		@Body() dto: ChangePasswordDto
	): Promise<{ success: boolean }> {
		return this.authService.changePassword(
			req.user.id,
			dto.currentPassword,
			dto.newPassword
		);
	}

	@Post("delete-account")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Delete user account permanently" })
	@ApiResponse({ status: 200, description: "Account deleted successfully" })
	@ApiResponse({ status: 401, description: "Unauthorized or wrong password" })
	async deleteAccount(
		@Req() req: AuthenticatedRequest,
		@Body() dto: { password: string }
	): Promise<{ success: boolean }> {
		return this.authService.deleteAccount(req.user.id, dto.password);
	}

	@Post("avatar")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@UseInterceptors(FileInterceptor("file"))
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				file: { type: "string", format: "binary" },
			},
		},
	})
	@ApiOperation({ summary: "Upload user avatar" })
	@ApiResponse({ status: 200, description: "Avatar uploaded successfully" })
	@ApiResponse({ status: 400, description: "Invalid file type" })
	async uploadAvatar(
		@Req() req: AuthenticatedRequest,
		@UploadedFile()
		file: { buffer: Buffer; mimetype: string; originalname: string }
	): Promise<{ avatarUrl: string }> {
		if (!file) {
			throw new BadRequestException("No file uploaded");
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		if (!allowedTypes.includes(file.mimetype)) {
			throw new BadRequestException(
				"Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
			);
		}

		// Upload to MinIO and get URL
		const avatarUrl = await this.minioService.uploadAvatar(
			req.user.id,
			file.buffer,
			file.mimetype
		);

		// Update user profile with new avatar URL
		await this.authService.updateProfile(req.user.id, { avatarUrl });

		return { avatarUrl };
	}
}
