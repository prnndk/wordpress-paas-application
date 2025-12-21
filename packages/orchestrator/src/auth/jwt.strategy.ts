import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService, UserPayload } from "./auth.service";
import { Request } from "express";

/**
 * Custom extractor that checks cookies first, then falls back to Bearer token
 */
function cookieOrBearerExtractor(req: Request): string | null {
	// First try to get token from httpOnly cookie
	if (req && req.cookies && req.cookies["wp_paas_access_token"]) {
		return req.cookies["wp_paas_access_token"];
	}
	// Fall back to Bearer token in Authorization header
	return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private authService: AuthService, configService: ConfigService) {
		super({
			jwtFromRequest: cookieOrBearerExtractor,
			ignoreExpiration: false,
			secretOrKey: configService.get<string>("JWT_SECRET", "default-secret"),
		});
	}

	async validate(payload: UserPayload): Promise<UserPayload> {
		const user = await this.authService.validateUser(payload);
		if (!user) {
			throw new UnauthorizedException();
		}
		return user;
	}
}
