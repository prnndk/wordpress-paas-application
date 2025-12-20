import {
	Controller,
	Post,
	Get,
	Body,
	Query,
	UseGuards,
	Req,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiQuery,
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

class RegisterDto {
	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password!: string;

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

interface AuthenticatedRequest extends Request {
	user: { id: string; email: string };
}

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	@ApiResponse({ status: 201, description: "User registered successfully" })
	@ApiResponse({ status: 409, description: "Email already registered" })
	async register(@Body() dto: RegisterDto): Promise<AuthTokens> {
		return this.authService.register(dto.email, dto.password, dto.name);
	}

	@Post("login")
	@ApiOperation({ summary: "Login with email and password" })
	@ApiResponse({ status: 200, description: "Login successful" })
	@ApiResponse({ status: 401, description: "Invalid credentials" })
	async login(@Body() dto: LoginDto): Promise<AuthTokens> {
		return this.authService.login(dto.email, dto.password);
	}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async me(@Req() req: AuthenticatedRequest): Promise<{ id: string; email: string; name: string | null; role: string }> {
        const user = await this.authService.getUser(req.user.id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
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
}
