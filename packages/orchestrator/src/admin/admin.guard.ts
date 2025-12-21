import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
	constructor() {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user || !user.roles || !Array.isArray(user.roles)) {
			throw new ForbiddenException("User not authenticated or missing roles");
		}

		if (!user.roles.includes("admin")) {
			throw new ForbiddenException("Admin access required");
		}

		return true;
	}
}
