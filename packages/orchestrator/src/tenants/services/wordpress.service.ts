import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DockerService, ServiceSpec } from '../../docker/docker.service';
import { TenantRepository } from '../repositories/tenant.repository';
import { TenantDatabase } from './tenant-database.service';

export interface WordPressInstance {
    tenantId: string;
    subdomain: string;
    serviceId?: string;
    status: 'creating' | 'running' | 'stopped' | 'error';
    replicas: number;
    runningReplicas: number;
}

export interface WordPressDeployOptions {
    wpAdminUser: string;
    wpAdminPassword: string;
    replicas: number;
}

@Injectable()
export class WordPressService {
    private readonly logger = new Logger(WordPressService.name);
    private readonly domain: string;
    private readonly serverIp: string;
    private readonly wpImage: string;

    constructor(
        private configService: ConfigService,
        private dockerService: DockerService,
        private tenantRepository: TenantRepository,
    ) {
        this.domain = this.configService.get<string>('DOMAIN', 'localhost');
        // SERVER_IP for WordPress redirects - use actual IP, not localhost
        this.serverIp = this.configService.get<string>('SERVER_IP', this.domain);
        this.wpImage = this.configService.get<string>(
            'WORDPRESS_IMAGE',
            'wordpress:6.4-php8.2-apache'
        );
    }

    async deployWordPress(
        tenantId: string,
        subdomain: string,
        database: TenantDatabase,
        options?: WordPressDeployOptions
    ): Promise<string> {
        const serviceName = `wp_${tenantId}`;
        // Use Docker named volume for wp-content (themes, plugins)
        const volumeName = `wp_content_${tenantId}`;

        // WordPress admin credentials
        const wpAdminUser = options?.wpAdminUser || 'admin';
        const wpAdminPassword = options?.wpAdminPassword || 'changeme123';
        const replicas = options?.replicas || 2;

        // MinIO/S3 configuration for media uploads
        const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://minio:9000');
        const minioAccessKey = this.configService.get<string>('MINIO_ROOT_USER', 'minioadmin');
        const minioSecretKey = this.configService.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin123');
        const minioBucket = `wp-uploads`;

        const spec: ServiceSpec = {
            name: serviceName,
            image: this.wpImage,
            replicas, // Use plan-based replicas
            env: [
                `WORDPRESS_DB_HOST=${database.host}:${database.port}`,
                `WORDPRESS_DB_USER=${database.user}`,
                `WORDPRESS_DB_PASSWORD=${database.password}`,
                `WORDPRESS_DB_NAME=${database.name}`,
                `WORDPRESS_TABLE_PREFIX=wp_`,
                // WordPress admin credentials for auto-setup
                `WORDPRESS_ADMIN_USER=${wpAdminUser}`,
                `WORDPRESS_ADMIN_PASSWORD=${wpAdminPassword}`,
                // WordPress configuration for path-based access at IP/subdomain
                // WP_HOME and WP_SITEURL tell WordPress its full URL including the path
                `WORDPRESS_CONFIG_EXTRA=define('WP_HOME', 'http://${this.serverIp}/${subdomain}'); define('WP_SITEURL', 'http://${this.serverIp}/${subdomain}'); define('FORCE_SSL_ADMIN', false); define('AS3CF_SETTINGS', serialize(array('provider' => 'aws', 'access-key-id' => '${minioAccessKey}', 'secret-access-key' => '${minioSecretKey}')));`,
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
                // Traefik labels for path-based routing (http://IP/subdomain/)
                // Strip the prefix so WordPress receives requests at /
                // WordPress is configured with WP_HOME/WP_SITEURL to generate correct URLs
                'traefik.enable': 'true',
                'traefik.docker.network': 'wp_paas_proxy_network',
                [`traefik.http.routers.${serviceName}.rule`]: `PathPrefix(\`/${subdomain}\`)`,
                [`traefik.http.routers.${serviceName}.entrypoints`]: 'web',
                [`traefik.http.routers.${serviceName}.middlewares`]: `${serviceName}-strip`,
                [`traefik.http.middlewares.${serviceName}-strip.stripprefix.prefixes`]: `/${subdomain}`,
                [`traefik.http.services.${serviceName}.loadbalancer.server.port`]: '80',
                // Health check for the service
                [`traefik.http.services.${serviceName}.loadbalancer.healthcheck.path`]: '/',
                [`traefik.http.services.${serviceName}.loadbalancer.healthcheck.interval`]: '10s',
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
            // Expose WordPress port via Swarm ingress (accessible on all nodes)
            ports: [
                {
                    targetPort: 80,
                    // No publishedPort = Docker assigns random port 30000+
                },
            ],
        };

        const serviceId = await this.dockerService.createService(spec);
        this.logger.log(`WordPress deployed: ${serviceName} (${serviceId}) with ${replicas} replicas`);

        return serviceId;
    }

    async getWordPressInstance(tenantId: string): Promise<WordPressInstance | null> {
        const serviceName = `wp_${tenantId}`;
        const serviceInfo = await this.dockerService.getService(serviceName);

        if (!serviceInfo) {
            return null;
        }

        const tenant = await this.tenantRepository.findById(tenantId);

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
        await this.tenantRepository.updateStatus(tenantId, 'stopped');
        this.logger.log(`WordPress stopped: ${serviceName}`);
    }

    async startWordPress(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        // Get tenant to find out the desired replicas from plan
        const tenant = await this.tenantRepository.findById(tenantId);
        const replicas = tenant?.replicas || 2;
        await this.dockerService.scaleService(serviceName, replicas);
        await this.tenantRepository.updateStatus(tenantId, 'running');
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
