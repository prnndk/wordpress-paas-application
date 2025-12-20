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
	// private readonly wpImage: string; // Removed static image property

	constructor(
		private configService: ConfigService,
		private dockerService: DockerService,
		private tenantRepository: TenantRepository
	) {
		this.domain = this.configService.get<string>("DOMAIN", "localhost");
		this.serverIp = this.configService.get<string>("SERVER_IP", this.domain);
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

		// Determine WordPress image from stack
		// Default: Use standard WordPress image (always available from Docker Hub)
		// Custom: Set WORDPRESS_IMAGE=wp-paas-custom:latest in .env after building on Swarm cluster:
		//   cd packages/orchestrator && docker-compose -f docker-compose.build.yml build
		// Note: Custom image includes WP-CLI for auto-installation
		let wpImage = this.configService.get<string>(
			"WORDPRESS_IMAGE",
			"wordpress:6.4-php8.2-apache" // Fallback to standard image if custom not available
		);

		this.logger.log(`Using WordPress image: ${wpImage}`);

		// Merge standard env vars with custom user env vars
		const customEnvVars =
			options?.customEnv?.map((e) => `${e.key}=${e.value}`) || [];

		const spec: ServiceSpec = {
			name: serviceName,
			image: wpImage, // Use dynamic image
			replicas, // Use plan-based replicas
			env: [
				`WORDPRESS_DB_HOST=${database.host}:${database.port}`,
				`WORDPRESS_DB_USER=${database.user}`,
				`WORDPRESS_DB_PASSWORD=${database.password}`,
				`WORDPRESS_DB_NAME=${database.name}`,
				`WORDPRESS_TABLE_PREFIX=wp_`,
				// WordPress admin credentials for WP-CLI auto-install
				`WORDPRESS_ADMIN_USER=${wpAdminUser}`,
				`WORDPRESS_ADMIN_PASSWORD=${wpAdminPassword}`,
				`WORDPRESS_ADMIN_EMAIL=${options?.wpAdminEmail || "admin@example.com"}`,
				`WORDPRESS_SITE_TITLE=${options?.siteTitle || subdomain}`,
				// WP_HOME is used by WP-CLI to set the site URL during installation
				`WP_HOME=http://${this.serverIp}/${subdomain}`,
				// WordPress configuration for path-based access at IP/subdomain
				// We inject dynamic PHP code to handle Traefik's stripped prefix and SSL termination
				`WORDPRESS_CONFIG_EXTRA=
define('WP_HOME', 'http://${this.serverIp}/${subdomain}');
define('WP_SITEURL', 'http://${this.serverIp}/${subdomain}');
define('FORCE_SSL_ADMIN', false);
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('AS3CF_SETTINGS', serialize(array('provider' => 'aws', 'access-key-id' => '${minioAccessKey}', 'secret-access-key' => '${minioSecretKey}')));

// Fix for Traefik StripPrefix: Reconstruct REQUEST_URI
if (isset($_SERVER['HTTP_X_FORWARDED_PREFIX'])) {
    $_SERVER['REQUEST_URI'] = $_SERVER['HTTP_X_FORWARDED_PREFIX'] . $_SERVER['REQUEST_URI'];
}

// Fix for HTTPS behind proxy
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
}
`,
				// S3/MinIO configuration for WP Offload Media plugin
				`S3_UPLOADS_ENDPOINT=${minioEndpoint}`,
				`S3_UPLOADS_BUCKET=${minioBucket}`,
				`S3_UPLOADS_KEY=${minioAccessKey}`,
				`S3_UPLOADS_SECRET=${minioSecretKey}`,
				`S3_UPLOADS_REGION=us-east-1`,
				`S3_UPLOADS_USE_PATH_STYLE=true`,
				...customEnvVars, // Create merge
			],
			labels: {
				"wp-paas.tenant": tenantId,
				"wp-paas.subdomain": subdomain,
				"wp-paas.type": "wordpress",
				// Traefik labels for path-based routing (http://IP/subdomain/)
				"traefik.enable": "true",
				"traefik.docker.network": "wp_paas_proxy_network",

				// HTTP Router
				[`traefik.http.routers.${serviceName}.rule`]: `PathPrefix(\`/${subdomain}\`)`,
				[`traefik.http.routers.${serviceName}.entrypoints`]: "web",
				[`traefik.http.routers.${serviceName}.middlewares`]: `${serviceName}-chain`,

				// HTTPS Router (for websecure entrypoint)
				[`traefik.http.routers.${serviceName}-secure.rule`]: `PathPrefix(\`/${subdomain}\`)`,
				[`traefik.http.routers.${serviceName}-secure.entrypoints`]: "websecure",
				[`traefik.http.routers.${serviceName}-secure.tls`]: "true",
				[`traefik.http.routers.${serviceName}-secure.middlewares`]: `${serviceName}-chain`,

				// Middleware 1: Set X-Forwarded-Prefix header so WordPress knows its path
				[`traefik.http.middlewares.${serviceName}-prefix.headers.customrequestheaders.X-Forwarded-Prefix`]: `/${subdomain}`,

				// Middleware 2: Strip prefix so WordPress receives request at root
				[`traefik.http.middlewares.${serviceName}-strip.stripprefix.prefixes`]: `/${subdomain}`,

				// Middleware Chain: first set header, then strip prefix
				[`traefik.http.middlewares.${serviceName}-chain.chain.middlewares`]: `${serviceName}-prefix,${serviceName}-strip`,

				// Service configuration
				[`traefik.http.services.${serviceName}.loadbalancer.server.port`]: "80",
				[`traefik.http.services.${serviceName}.loadbalancer.passHostHeader`]:
					"true",

				// Health check for the service
				[`traefik.http.services.${serviceName}.loadbalancer.healthcheck.path`]:
					"/",
				[`traefik.http.services.${serviceName}.loadbalancer.healthcheck.interval`]:
					"10s",
			},
			mounts: [
				{
					source: volumeName,
					target: "/var/www/html/wp-content",
					type: "volume", // Changed from 'bind' to 'volume'
				},
			],
			// Docker Native Healthcheck
			healthCheck: {
				test: ["CMD-SHELL", `curl -f http://localhost/ || exit 1`],
				interval: 10000000000, // 10s
				timeout: 5000000000, // 5s
				retries: 3,
				startPeriod: 30000000000, // 30s
			},
			networks: [
				"wp_paas_network",
				"wp_paas_db_network",
				"wp_paas_proxy_network",
			],
			// Allow scheduling on any node (manager or worker)
			// Change to ["node.role == worker"] if you have dedicated workers
			constraints: [],
			// Expose WordPress port via Swarm ingress (accessible on all nodes)
			ports: [
				{
					targetPort: 80,
					// No publishedPort = Docker assigns random port 30000+
				},
			],
			// NOTE: Do NOT override command - WordPress image needs its entrypoint
			// to run docker-entrypoint.sh which sets up WP before starting Apache
		};

		this.logger.log(
			`Creating WordPress Service with Spec: ${JSON.stringify(
				{
					...spec,
					env: spec.env.map((e) => e.split("=")[0] + "=***"), // Redact values
				},
				null,
				2
			)}`
		);

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
}
