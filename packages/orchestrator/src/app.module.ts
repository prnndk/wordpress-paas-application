import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DockerModule } from "./docker/docker.module";
import { TenantsModule } from "./tenants/tenants.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ClusterModule } from "./cluster/cluster.module";
import { AuditModule } from "./audit/audit.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [".env.local", ".env"],
		}),
		PrismaModule,
		DockerModule,
		TenantsModule,
		AuthModule,
		HealthModule,
		ClusterModule,
		AuditModule,
		SubscriptionsModule,
		InvoicesModule,
		PaymentsModule,
	],
})
export class AppModule {}
