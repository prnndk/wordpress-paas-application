import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { SubscriptionController } from './subscription.controller';
import { TenantsService } from './services/tenants.service';
import { SubscriptionService } from './services/subscription.service';
import { StorageService } from './services/storage.service';
import { WordPressService } from './services/wordpress.service';
import { TenantDatabaseService } from './services/tenant-database.service';
import { TenantRepository } from './repositories/tenant.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { DockerModule } from '../docker/docker.module';

@Module({
    imports: [DockerModule],
    controllers: [TenantsController, SubscriptionController],
    providers: [
        // Services
        TenantsService,
        SubscriptionService,
        StorageService,
        WordPressService,
        TenantDatabaseService,
        // Repositories
        TenantRepository,
        SubscriptionRepository,
    ],
    exports: [TenantsService, SubscriptionService],
})
export class TenantsModule { }
