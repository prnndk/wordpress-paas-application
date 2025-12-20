import { Module } from "@nestjs/common";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
	imports: [TenantsModule],
	controllers: [AuditController],
	providers: [AuditService],
	exports: [AuditService],
})
export class AuditModule {}
