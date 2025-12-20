import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DockerModule } from './docker/docker.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
        DockerModule,
        TenantsModule,
        AuthModule,
        HealthModule,
    ],
})
export class AppModule { }

