import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DockerService, ServiceSpec } from "../../docker/docker.service";
import { TenantRepository } from "../repositories/tenant.repository";
import { TenantDatabase } from "./tenant-database.service";

export interface WordPressInstance {
    tenantId: string;
    subdomain: string;
    serviceId?: string;
    status: "creating" | "running" | "stopped" | "error";
    replicas: number;
    runningReplicas: number;
}

export interface WordPressDeployOptions {
    wpAdminUser: string;
    wpAdminPassword: string;
    wpAdminEmail?: string;
    siteTitle?: string;
    replicas: number;
    customEnv?: { key: string; value: string }[];
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
        private tenantRepository: TenantRepository
    ) {
        this.domain = this.configService.get<string>("DOMAIN", "localhost");
        // SERVER_IP for WordPress redirects - use actual IP, not localhost
        this.serverIp = this.configService.get<string>("SERVER_IP", this.domain);
        this.wpImage = this.configService.get<string>(
            "WORDPRESS_IMAGE",
            "prnndk/wp-paas-wordpress:latest"
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
        const wpAdminUser = options?.wpAdminUser || "admin";
        const wpAdminPassword = options?.wpAdminPassword || "changeme123";
        const wpAdminEmail = options?.wpAdminEmail || "admin@localhost.local";
        const siteTitle = options?.siteTitle || "My WordPress Site";
        const replicas = options?.replicas || 2;

        // MinIO/S3 configuration for media uploads
        const minioEndpoint = this.configService.get<string>(
            "MINIO_ENDPOINT",
            "http://minio:9000"
        );
        const minioAccessKey = this.configService.get<string>(
            "MINIO_ROOT_USER",
            "minioadmin"
        );
        const minioSecretKey = this.configService.get<string>(
            "MINIO_ROOT_PASSWORD",
            "minioadmin123"
        );
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
                `WORDPRESS_ADMIN_EMAIL=${wpAdminEmail}`,
                `WORDPRESS_TITLE=${siteTitle}`,
                // Path prefix for any additional URL handling in mu-plugin
                `WP_PAAS_PATH_PREFIX=/${subdomain}`,
                // IMPORTANT: WP_HOME and WP_SITEURL MUST include the path prefix
                // Traefik strips the prefix from incoming requests, but WordPress needs
                // to generate URLs WITH the prefix. This prevents redirect loops.
                // CRITICAL: Cookie paths MUST be defined in wp-config.php (not mu-plugins)
                // because WordPress processes cookie constants BEFORE loading mu-plugins.
                `WORDPRESS_CONFIG_EXTRA=define('WP_HOME', 'http://${this.serverIp}/${subdomain}'); define('WP_SITEURL', 'http://${this.serverIp}/${subdomain}'); define('FORCE_SSL_ADMIN', false); define('COOKIEPATH', '/${subdomain}/'); define('SITECOOKIEPATH', '/${subdomain}/'); define('ADMIN_COOKIE_PATH', '/${subdomain}/wp-admin'); define('PLUGINS_COOKIE_PATH', '/${subdomain}/wp-content/plugins'); define('AS3CF_SETTINGS', serialize(array('provider' => 'aws', 'access-key-id' => '${minioAccessKey}', 'secret-access-key' => '${minioSecretKey}')));`,
                // S3/MinIO configuration for WP Offload Media plugin
                `S3_UPLOADS_ENDPOINT=${minioEndpoint}`,
                `S3_UPLOADS_BUCKET=${minioBucket}`,
                `S3_UPLOADS_KEY=${minioAccessKey}`,
                `S3_UPLOADS_SECRET=${minioSecretKey}`,
                `S3_UPLOADS_REGION=us-east-1`,
                `S3_UPLOADS_USE_PATH_STYLE=true`,
            ],
            labels: {
                "wp-paas.tenant": tenantId,
                "wp-paas.tenant-id": tenantId,
                "wp-paas.subdomain": subdomain,
                "wp-paas.type": "wordpress",
                // Traefik labels for path-based routing (http://IP/subdomain/)
                "traefik.enable": "true",
                "traefik.docker.network": "wp_paas_proxy_network",
                [`traefik.http.routers.${serviceName}.rule`]: `PathPrefix(\`/${subdomain}\`)`,
                [`traefik.http.routers.${serviceName}.entrypoints`]: "web",
                // Strip prefix middleware - WordPress receives / instead of /subdomain/
                [`traefik.http.routers.${serviceName}.middlewares`]: `${serviceName}-stripprefix`,
                [`traefik.http.middlewares.${serviceName}-stripprefix.stripprefix.prefixes`]: `/${subdomain}`,
                // Service config
                [`traefik.http.services.${serviceName}.loadbalancer.server.port`]: "80",
                [`traefik.http.services.${serviceName}.loadbalancer.passHostHeader`]:
                    "true",
                // CRITICAL: Sticky sessions for login to work with multiple replicas
                // Without this, session stored on replica 1 won't be found on replica 2
                [`traefik.http.services.${serviceName}.loadbalancer.sticky.cookie.name`]: `wp_sticky_${subdomain}`,
                [`traefik.http.services.${serviceName}.loadbalancer.sticky.cookie.httpOnly`]:
                    "true",
                [`traefik.http.services.${serviceName}.loadbalancer.sticky.cookie.secure`]:
                    "false",
                [`traefik.http.services.${serviceName}.loadbalancer.sticky.cookie.sameSite`]:
                    "lax",
                // Health check at root (after prefix is stripped)
                [`traefik.http.services.${serviceName}.loadbalancer.healthcheck.path`]:
                    "/",
                [`traefik.http.services.${serviceName}.loadbalancer.healthcheck.interval`]:
                    "30s",
            },
            mounts: [
                {
                    source: volumeName,
                    target: "/var/www/html/wp-content",
                    type: "volume", // Changed from 'bind' to 'volume'
                },
            ],
            networks: [
                "wp_paas_network",
                "wp_paas_db_network",
                "wp_paas_proxy_network",
            ],
            constraints: ["node.role == worker"],
            // Expose WordPress port via Swarm ingress (accessible on all nodes)
            ports: [
                {
                    targetPort: 80,
                    // No publishedPort = Docker assigns random port 30000+
                },
            ],
        };

        const serviceId = await this.dockerService.createService(spec);
        this.logger.log(
            `WordPress deployed: ${serviceName} (${serviceId}) with ${replicas} replicas`
        );

        return serviceId;
    }

    async getWordPressInstance(
        tenantId: string
    ): Promise<WordPressInstance | null> {
        const serviceName = `wp_${tenantId}`;
        const serviceInfo = await this.dockerService.getService(serviceName);

        // Detailed debug for instance status
        if (serviceInfo && serviceInfo.runningReplicas === 0) {
            this.logger.debug(
                `Instance ${serviceName} found but no running replicas. Service info: ${JSON.stringify(
                    serviceInfo
                )}`
            );
        }

        if (!serviceInfo) {
            return null;
        }

        const tenant = await this.tenantRepository.findById(tenantId);

        return {
            tenantId,
            subdomain: tenant?.slug || "",
            serviceId: serviceInfo.id,
            status: serviceInfo.runningReplicas > 0 ? "running" : "stopped",
            replicas: serviceInfo.replicas,
            runningReplicas: serviceInfo.runningReplicas,
        };
    }

    async stopWordPress(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        this.logger.log(`Attempting to stop WordPress service: ${serviceName}`);
        await this.dockerService.scaleService(serviceName, 0);
        await this.tenantRepository.updateStatus(tenantId, "stopped");
        this.logger.log(`WordPress stopped successfully: ${serviceName}`);
    }

    async startWordPress(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        this.logger.log(`Attempting to start WordPress service: ${serviceName}`);

        // Get tenant to find out the desired replicas from plan
        const tenant = await this.tenantRepository.findById(tenantId);
        const replicas = tenant?.replicas || 2;

        this.logger.debug(`Scaling service ${serviceName} to ${replicas} replicas`);
        await this.dockerService.scaleService(serviceName, replicas);

        await this.tenantRepository.updateStatus(tenantId, "running");
        this.logger.log(
            `WordPress service scaled: ${serviceName}. Monitoring stability...`
        );
    }

    async restartWordPress(tenantId: string): Promise<void> {
        this.logger.log(`Restarting WordPress service: wp_${tenantId}`);
        await this.stopWordPress(tenantId);
        // Brief delay before restart
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await this.startWordPress(tenantId);
        this.logger.log(`WordPress restarted successfully: wp_${tenantId}`);
    }

    async deleteWordPress(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        await this.dockerService.removeService(serviceName);
        this.logger.log(`WordPress deleted: ${serviceName}`);
    }

    async rebuildWordPress(
        tenantId: string
    ): Promise<{ success: boolean; message: string }> {
        const serviceName = `wp_${tenantId}`;
        this.logger.log(`Rebuilding WordPress service: ${serviceName}`);

        try {
            // Get current tenant info
            const tenant = await this.tenantRepository.findById(tenantId);
            if (!tenant) {
                throw new Error("Tenant not found");
            }

            // Update status
            await this.tenantRepository.updateStatus(tenantId, "creating");

            // Force update the service with latest image - this recreates all containers
            const wpImage =
                process.env.WORDPRESS_IMAGE || "prnndk/wp-paas-wordpress:latest";
            await this.dockerService.updateService(serviceName, {
                image: wpImage,
                forceUpdate: true,
            });

            // Wait a bit for containers to start recreating
            await new Promise((resolve) => setTimeout(resolve, 5000));

            // Update status back to running
            await this.tenantRepository.updateStatus(tenantId, "running");

            this.logger.log(`WordPress rebuilt successfully: ${serviceName}`);
            return {
                success: true,
                message: "Container rebuild initiated successfully",
            };
        } catch (error) {
            this.logger.error(`Failed to rebuild WordPress: ${serviceName}`, error);
            await this.tenantRepository.updateStatus(tenantId, "error");
            throw error;
        }
    }

    async scaleWordPress(
        tenantId: string,
        replicas: number
    ): Promise<{ success: boolean; replicas: number }> {
        const serviceName = `wp_${tenantId}`;

        // Validate replicas count (minimum 1, maximum 10)
        if (replicas < 1 || replicas > 10) {
            throw new Error("Replicas must be between 1 and 10");
        }

        this.logger.log(
            `Scaling WordPress service ${serviceName} to ${replicas} replicas`
        );

        // Scale the Docker service
        await this.dockerService.scaleService(serviceName, replicas);

        // Update the database
        await this.tenantRepository.updateReplicas(tenantId, replicas);

        // Update status to running (since we always have at least 1 replica)
        await this.tenantRepository.updateStatus(tenantId, "running");

        this.logger.log(
            `WordPress scaled successfully: ${serviceName} -> ${replicas} replicas`
        );

        return { success: true, replicas };
    }

    async getWordPressLogs(
        tenantId: string,
        tail: number = 100
    ): Promise<string> {
        const serviceName = `wp_${tenantId}`;
        return this.dockerService.getServiceLogs(serviceName, { tail });
    }

    async listAllWordPressInstances(): Promise<WordPressInstance[]> {
        const services = await this.dockerService.listServices({
            "wp-paas.type": "wordpress",
        });

        return services.map((svc) => ({
            tenantId: svc.name.replace("wp_", ""),
            subdomain: "",
            serviceId: svc.id,
            status: svc.runningReplicas > 0 ? "running" : "stopped",
            replicas: svc.replicas,
            runningReplicas: svc.runningReplicas,
        }));
    }

    /**
     * Purge all WordPress caches including object cache, transients, and rewrite rules
     */
    async purgeCache(tenantId: string): Promise<void> {
        const serviceName = `wp_${tenantId}`;
        this.logger.log(`Purge cache requested for service: ${serviceName}`);
        // Future implementation: exec into container and run wp-cli
        this.logger.warn(
            `Cache purge not yet implemented - requires Docker exec support`
        );
    }

    async getMetrics(tenantId: string): Promise<{
        cpu: number;
        memory: number;
        storage: number;
    }> {
        const serviceName = `wp_${tenantId}`;
        const volumeName = `wp_content_${tenantId}`;

        const [stats, volumeSize] = await Promise.all([
            this.dockerService.getServiceStats(serviceName),
            this.dockerService.getVolumeUsage(volumeName),
        ]);

        return {
            cpu: stats?.cpuPercent || 0,
            memory: stats?.memoryUsage || 0,
            storage: volumeSize || 0,
        };
    }

    /**
     * Get detailed container inspection including env vars, mounts, networks, etc.
     */
    async getContainerInspect(tenantId: string): Promise<{
        id: string;
        name: string;
        image: string;
        replicas: number;
        runningReplicas: number;
        createdAt: string;
        updatedAt: string;
        env: { key: string; value: string; masked?: boolean }[];
        mounts: { source: string; target: string; type: string }[];
        networks: string[];
        labels: Record<string, string>;
        resources: {
            cpuLimit?: number;
            memoryLimit?: number;
            cpuReservation?: number;
            memoryReservation?: number;
        };
        tasks: {
            id: string;
            nodeId: string;
            state: string;
            desiredState: string;
            error?: string;
            containerStatus?: {
                containerId?: string;
                pid?: number;
                exitCode?: number;
            };
        }[];
    } | null> {
        const serviceName = `wp_${tenantId}`;
        return this.dockerService.getServiceInspect(serviceName);
    }
}
