import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { UserRepository } from "./user.repository";
import { TenantsModule } from "../tenants/tenants.module";
import { ClusterModule } from "../cluster/cluster.module";
import { AuditModule } from "../audit/audit.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: "jwt" }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>("JWT_SECRET", "default-secret"),
				signOptions: {
					expiresIn: configService.get<string>("JWT_EXPIRES_IN", "7d"),
				},
			}),
			inject: [ConfigService],
		}),
		forwardRef(() => TenantsModule),
		ClusterModule,
		AuditModule,
		SubscriptionsModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, UserRepository],
	exports: [AuthService, JwtModule, UserRepository],
})
export class AuthModule {}
