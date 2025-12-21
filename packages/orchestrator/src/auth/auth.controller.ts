import {
	Controller,
	Post,
	Get,
	Patch,
	Body,
	Query,
	UseGuards,
	Req,
	Res,
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
import * as express from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { MeResponseDto, parseIncludes } from "./dto/me-response.dto";
import { MinioService } from "../storage/minio.service";

// Cookie configuration
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
};

const ACCESS_TOKEN_COOKIE = "wp_paas_access_token";
const REFRESH_TOKEN_COOKIE = "wp_paas_refresh_token";

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

interface AuthenticatedRequest extends express.Request {
	user: { id: string; email: string };
	cookies: { [key: string]: string };
}

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly minioService: MinioService
	) {}

	/**
	 * Helper to set authentication cookies
	 */
	private setAuthCookies(
		res: express.Response,
		accessToken: string,
		refreshToken: string,
		accessExpiresIn: number
	): void {
		// Access token cookie - shorter expiry
		res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
			...COOKIE_OPTIONS,
			maxAge: accessExpiresIn * 1000, // Convert seconds to milliseconds
		});

		// Refresh token cookie - longer expiry (7 days)
		res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
			...COOKIE_OPTIONS,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
		});
	}

	/**
	 * Helper to clear authentication cookies
	 */
	private clearAuthCookies(res: express.Response): void {
		res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
		res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
	}

	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	@ApiResponse({ status: 201, description: "User registered successfully" })
	@ApiResponse({ status: 409, description: "Email already registered" })
	async register(
		@Body() dto: RegisterDto,
		@Res({ passthrough: true }) res: express.Response
	): Promise<{ success: boolean; expiresIn: number }> {
		const tokens = await this.authService.register(
			dto.email,
			dto.password,
			dto.name,
			dto.fullName
		);

		// Set cookies instead of returning tokens
		this.setAuthCookies(
			res,
			tokens.accessToken,
			tokens.refreshToken,
			tokens.expiresIn
		);

		return { success: true, expiresIn: tokens.expiresIn };
	}

	@Post("login")
	@ApiOperation({ summary: "Login with email and password" })
	@ApiResponse({ status: 200, description: "Login successful" })
	@ApiResponse({ status: 401, description: "Invalid credentials" })
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: express.Response
	): Promise<{ success: boolean; expiresIn: number }> {
		const tokens = await this.authService.login(dto.email, dto.password);

		// Set cookies instead of returning tokens
		this.setAuthCookies(
			res,
			tokens.accessToken,
			tokens.refreshToken,
			tokens.expiresIn
		);

		return { success: true, expiresIn: tokens.expiresIn };
	}

	@Post("logout")
	@ApiOperation({ summary: "Logout and clear authentication cookies" })
	@ApiResponse({ status: 200, description: "Logout successful" })
	async logout(
		@Res({ passthrough: true }) res: express.Response
	): Promise<{ success: boolean }> {
		this.clearAuthCookies(res);
		return { success: true };
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
		@Body() dto: { password: string },
		@Res({ passthrough: true }) res: express.Response
	): Promise<{ success: boolean }> {
		const result = await this.authService.deleteAccount(
			req.user.id,
			dto.password
		);
		// Clear cookies on account deletion
		this.clearAuthCookies(res);
		return result;
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

	@Post("refresh")
	@ApiOperation({
		summary: "Refresh access token",
		description:
			"Refresh access token using the refresh token from cookies. Returns new tokens in cookies.",
	})
	@ApiResponse({
		status: 200,
		description: "New tokens generated successfully",
	})
	@ApiResponse({
		status: 401,
		description: "Invalid or expired refresh token",
	})
	async refresh(
		@Req() req: AuthenticatedRequest,
		@Res({ passthrough: true }) res: express.Response
	): Promise<{ success: boolean; expiresIn: number }> {
		// Get refresh token from cookie
		const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

		if (!refreshToken) {
			throw new BadRequestException("Refresh token not found");
		}

		const tokens = await this.authService.refreshAccessToken(refreshToken);

		// Set new cookies
		this.setAuthCookies(
			res,
			tokens.accessToken,
			tokens.refreshToken,
			tokens.expiresIn
		);

		return { success: true, expiresIn: tokens.expiresIn };
	}
}
