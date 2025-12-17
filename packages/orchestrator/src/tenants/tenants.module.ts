import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { DatabaseService } from './database.service';
import { StorageService } from './storage.service';
import { WordPressService } from './wordpress.service';

@Module({
    controllers: [TenantsController],
    providers: [TenantsService, DatabaseService, StorageService, WordPressService],
    exports: [TenantsService],
})
export class TenantsModule { }
