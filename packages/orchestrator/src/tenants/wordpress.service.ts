import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DockerService, ServiceSpec } from '../docker/docker.service';
import { DatabaseService, TenantDatabase } from './database.service';
import { StorageService } from './storage.service';

export interface WordPressInstance {
    tenantId: string;
    subdomain: string;
    serviceId?: string;
    status: 'creating' | 'running' | 'stopped' | 'error';
    replicas: number;
    runningReplicas: number;
}

@Injectable()
export class WordPressService {
    private readonly logger = new Logger(WordPressService.name);
    private readonly domain: string;
    private readonly wpImage: string;

    constructor(
        private configService: ConfigService,
        private dockerService: DockerService,
        private databaseService: DatabaseService,
        private storageService: StorageService
    ) {
        this.domain = this.configService.get<string>('DOMAIN', 'localhost');
        this.wpImage = this.configService.get<string>(
            'WORDPRESS_IMAGE',
            'wordpress:6.4-php8.2-apache'
        );
    }

    async deployWordPress(
        tenantId: string,
        subdomain: string,
        database: TenantDatabase
    ): Promise<string> {
        const serviceName = `wp_${tenantId}`;
        // Use Docker named volume for wp-content (themes, plugins)
        const volumeName = `wp_content_${tenantId}`;

        // MinIO/S3 configuration for media uploads
        const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://minio:9000');
        const minioAccessKey = this.configService.get<string>('MINIO_ROOT_USER', 'minioadmin');
        const minioSecretKey = this.configService.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin123');
        const minioBucket = `wp-uploads`;

        const spec: ServiceSpec = {
            name: serviceName,
            image: this.wpImage,
            replicas: 2, // High availability requirement
            env: [
                `WORDPRESS_DB_HOST=${database.host}:${database.port}`,
                `WORDPRESS_DB_USER=${database.user}`,
                `WORDPRESS_DB_PASSWORD=${database.password}`,
                `WORDPRESS_DB_NAME=${database.name}`,
                `WORDPRESS_TABLE_PREFIX=wp_`,
                `WORDPRESS_CONFIG_EXTRA=define('WP_HOME', 'https://${subdomain}.${this.domain}'); define('WP_SITEURL', 'https://${subdomain}.${this.domain}'); define('AS3CF_SETTINGS', serialize(array('provider' => 'aws', 'access-key-id' => '${minioAccessKey}', 'secret-access-key' => '${minioSecretKey}')));`,
                // S3/MinIO configuration for WP Offload Media plugin
                `S3_UPLOADS_ENDPOINT=${minioEndpoint}`,
                `S3_UPLOADS_BUCKET=${minioBucket}`,
                `S3_UPLOADS_KEY=${minioAccessKey}`,
                `S3_UPLOADS_SECRET=${minioSecretKey}`,
                `S3_UPLOADS_REGION=us-east-1`,
                `S3_UPLOADS_USE_PATH_STYLE=true`,
            ],
            labels: {
                'wp-paas.tenant': tenantId,
                'wp-paas.subdomain': subdomain,
                'wp-paas.type': 'wordpress',
                // Traefik labels for automatic routing
                'traefik.enable': 'true',
                [`traefik.http.routers.${serviceName}.rule`]: `Host(\`${subdomain}.${this.domain}\`)`,
                [`traefik.http.routers.${serviceName}.entrypoints`]: 'websecure',
                [`traefik.http.routers.${serviceName}.tls.certresolver`]: 'letsencrypt',
                [`traefik.http.services.${serviceName}.loadbalancer.server.port`]: '80',
            },
            mounts: [
                {
                    source: volumeName,
                    target: '/var/www/html/wp-content',
                    type: 'volume', // Changed from 'bind' to 'volume'
                },
            ],
            networks: ['wp_paas_network', 'wp_paas_db_network', 'wp_paas_proxy_network'],
            constraints: ['node.role == worker'],
        };

        const serviceId = await this.dockerService.createService(spec);
        this.logger.log(`WordPress deployed: ${serviceName} (${serviceId})`);

        return serviceId;
    }

    async getWordPressInstance(tenantId: string): Promise<WordPressInstance | null> {
        const serviceName = `wp_${tenantId}`;
        const serviceInfo = await this.dockerService.getService(serviceName);

        if (!serviceInfo) {
            return null;
        }

        const tenant = await this.databaseService.getTenant(tenantId);

        return {
            tenantId,
            subdomain: tenant?.subdomain || '',
            serviceId: serviceInfo.id,
            status: serviceInfo.runningReplicas > 0 ? 'running' : 'stopped',
            replicas: serviceInfo.replicas,
            runningReplicas: serviceInfo.runningReplicas,
        };
    }

    async stopWordPress(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        await this.dockerService.scaleService(serviceName, 0);
        await this.databaseService.updateTenantStatus(tenantId, 'stopped');
        this.logger.log(`WordPress stopped: ${serviceName}`);
    }

    async startWordPress(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        await this.dockerService.scaleService(serviceName, 2);
        await this.databaseService.updateTenantStatus(tenantId, 'running');
        this.logger.log(`WordPress started: ${serviceName}`);
    }

    async restartWordPress(tenantId: string): Promise<void> {
        await this.stopWordPress(tenantId);
        // Brief delay before restart
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.startWordPress(tenantId);
        this.logger.log(`WordPress restarted: wp_${tenantId}`);
    }

    async deleteWordPress(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        await this.dockerService.removeService(serviceName);
        this.logger.log(`WordPress deleted: ${serviceName}`);
    }

    async getWordPressLogs(tenantId: string, tail: number = 100): Promise<string> {
        const serviceName = `wp_${tenantId}`;
        return this.dockerService.getServiceLogs(serviceName, { tail });
    }

    async listAllWordPressInstances(): Promise<WordPressInstance[]> {
        const services = await this.dockerService.listServices({
            'wp-paas.type': 'wordpress',
        });

        return services.map((svc) => ({
            tenantId: svc.name.replace('wp_', ''),
            subdomain: '',
            serviceId: svc.id,
            status: svc.runningReplicas > 0 ? 'running' : 'stopped',
            replicas: svc.replicas,
            runningReplicas: svc.runningReplicas,
        }));
    }
}
