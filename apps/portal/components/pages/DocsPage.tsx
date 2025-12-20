import React, { useState, useEffect } from "react";
import {
	ChevronRight,
	Copy,
	Check,
	Info,
	AlertTriangle,
	FileText,
	Menu,
	X,
	Server,
	Shield,
	Zap,
	Database,
	Globe,
	Key,
} from "lucide-react";

// --- Types ---
type TocItem = { id: string; label: string };

interface DocSection {
	id: string;
	title: string;
	category: string;
	toc: TocItem[];
	content: React.ReactNode;
}

// --- Reusable UI Components ---

const CodeBlock = ({
	code,
	language = "bash",
	title,
}: {
	code: string;
	language?: string;
	title?: string;
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className='my-6 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-lg ring-1 ring-white/10'>
			<div className='flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700'>
				<span className='text-xs font-mono text-slate-400 font-bold uppercase'>
					{title || language}
				</span>
				<button
					onClick={handleCopy}
					className='text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium'>
					{copied ? (
						<>
							<Check className='w-3.5 h-3.5 text-green-400' /> Copied
						</>
					) : (
						<>
							<Copy className='w-3.5 h-3.5' /> Copy
						</>
					)}
				</button>
			</div>
			<div className='p-4 overflow-x-auto'>
				<pre className='text-sm font-mono text-indigo-100 leading-relaxed'>
					<code>{code}</code>
				</pre>
			</div>
		</div>
	);
};

const Alert = ({
	type,
	title,
	children,
}: {
	type: "info" | "warning" | "tip";
	title: string;
	children?: React.ReactNode;
}) => {
	const styles = {
		info: "bg-blue-50 border-blue-200 text-blue-900 icon-blue-600",
		warning: "bg-amber-50 border-amber-200 text-amber-900 icon-amber-600",
		tip: "bg-emerald-50 border-emerald-200 text-emerald-900 icon-emerald-600",
	};

	const icons = {
		info: Info,
		warning: AlertTriangle,
		tip: Zap,
	};

	const Icon = icons[type];

	return (
		<div
			className={`my-6 p-4 rounded-lg border flex gap-3 ${styles[type]
				.split(" ")
				.slice(0, 3)
				.join(" ")}`}>
			<Icon
				className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles[type]
					.split(" ")
					.pop()
					?.replace("icon-", "text-")}`}
			/>
			<div>
				<h4 className='font-bold text-sm mb-1'>{title}</h4>
				<div className='text-sm leading-relaxed opacity-90'>{children}</div>
			</div>
		</div>
	);
};

// --- Documentation Content Data ---

const DOCS_DATA: Record<string, DocSection> = {
	// --- GETTING STARTED ---
	introduction: {
		id: "introduction",
		title: "Introduction to WPCube",
		category: "Getting Started",
		toc: [
			{ id: "philosophy", label: "Philosophy" },
			{ id: "why-docker", label: "Why Docker Swarm?" },
			{ id: "security-model", label: "Security Model" },
		],
		content: (
			<>
				<p className='lead text-xl text-slate-600'>
					WPCube is an opinionated, container-native Platform as a Service
					(PaaS) designed specifically for high-performance WordPress workloads.
				</p>
				<p>
					Unlike traditional shared hosting or bare VPS solutions, WPCube treats
					your WordPress site as an <strong>immutable application</strong>. We
					leverage Docker Swarm for orchestration, ensuring that your
					application is isolated, scalable, and self-healing by design.
				</p>

				<h2
					id='philosophy'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Philosophy
				</h2>
				<p>
					We believe that modern infrastructure should be invisible. You
					shouldn't have to configure Nginx vhosts, manage PHP-FPM pools, or
					worry about kernel patches.
				</p>
				<ul className='list-disc list-outside ml-6 space-y-2 mt-4'>
					<li>
						<strong>Isolation First:</strong> Every site gets its own kernel
						namespace. No "noisy neighbors".
					</li>
					<li>
						<strong>Ephemeral Runtimes:</strong> Containers can be destroyed and
						recreated at any time without data loss (thanks to persistent
						volumes).
					</li>
					<li>
						<strong>Declarative Config:</strong> Your infrastructure state is
						defined by code, not manual server tweaking.
					</li>
				</ul>

				<h2
					id='why-docker'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Why Docker Swarm?
				</h2>
				<p>
					While Kubernetes has won the orchestration war, Docker Swarm remains
					superior for specific use cases requiring simplicity and low overhead.
					WPCube utilizes a customized Swarm overlay network to provide
					low-latency service discovery between your WordPress app and its MySQL
					database.
				</p>
			</>
		),
	},
	quickstart: {
		id: "quickstart",
		title: "Quickstart Guide",
		category: "Getting Started",
		toc: [
			{ id: "create-account", label: "1. Create Account" },
			{ id: "launch-instance", label: "2. Launch Instance" },
			{ id: "dns-config", label: "3. DNS Configuration" },
		],
		content: (
			<>
				<p>
					Follow this guide to deploy your first production-ready WordPress
					container in under 2 minutes.
				</p>

				<h2
					id='create-account'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					1. Create an Account
				</h2>
				<p>
					Sign up at the <a href='/signup'>Registration Page</a>. You will
					automatically be placed on the "Developer Tier" which allows for 1
					active instance.
				</p>

				<h2
					id='launch-instance'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					2. Launch Instance
				</h2>
				<p>
					Navigate to the Dashboard and click{" "}
					<strong>"Create New Instance"</strong>.
				</p>
				<div className='bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-sm'>
					<ol className='list-decimal list-inside space-y-2'>
						<li>
							Enter a <strong>Site Name</strong> (e.g., "My Portfolio").
						</li>
						<li>
							Choose a <strong>Subdomain</strong> (e.g.,{" "}
							<code>portfolio.wpcube.local</code>). This is used for internal
							routing.
						</li>
						<li>
							Select a <strong>Region</strong> closer to your customers (US-East
							or EU-Central).
						</li>
						<li>
							Click <strong>Provision</strong>.
						</li>
					</ol>
				</div>
				<Alert type='tip' title='Provisioning Time'>
					The first deployment takes about 30-45 seconds as we allocate a
					dedicated Persistent Volume Claim (PVC) and cold-start the MySQL 8.0
					container.
				</Alert>

				<h2
					id='dns-config'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					3. DNS Configuration
				</h2>
				<p>
					Once running, note the <strong>Load Balancer IP</strong> shown in your
					dashboard. Point your domain's A Record to this IP.
				</p>
			</>
		),
	},
	architecture: {
		id: "architecture",
		title: "Platform Architecture",
		category: "Getting Started",
		toc: [
			{ id: "overview", label: "System Overview" },
			{ id: "ingress", label: "Ingress Layer" },
			{ id: "storage", label: "Storage Layer" },
		],
		content: (
			<>
				<p>
					Understanding how WPCube routes traffic and stores data helps in
					debugging and optimization.
				</p>

				<h2
					id='overview'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					System Overview
				</h2>
				<p>
					WPCube runs on a cluster of bare-metal servers. We do not resell
					AWS/GCP instances; we own the hardware to ensure consistent I/O
					performance.
				</p>

				<div className='my-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center'>
					<div className='inline-block text-left font-mono text-xs leading-relaxed'>
						<div className='mb-2 text-slate-400'>// Request Flow</div>
						<div className='p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 mb-2 text-center'>
							User (Browser)
						</div>
						<div className='flex justify-center text-slate-300'>
							↓ HTTPS (443)
						</div>
						<div className='p-2 bg-slate-800 text-white rounded mb-2 text-center'>
							Global Edge LB (L4)
						</div>
						<div className='flex justify-center text-slate-300'>↓</div>
						<div className='p-2 bg-purple-50 border border-purple-100 text-purple-700 rounded mb-2 text-center'>
							Ingress Controller (Traefik)
						</div>
						<div className='flex justify-center text-slate-300'>
							↓ (Overlay Network)
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='p-2 bg-green-50 border border-green-100 text-green-700 rounded text-center'>
								WP Container
							</div>
							<div className='p-2 bg-blue-50 border border-blue-100 text-blue-700 rounded text-center'>
								MySQL Container
							</div>
						</div>
					</div>
				</div>

				<h2
					id='ingress'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Ingress Layer
				</h2>
				<p>
					We use <strong>Traefik</strong> as our ingress controller. It
					automatically detects new containers and reconfigures routing rules in
					real-time. It also handles:
				</p>
				<ul className='list-disc list-outside ml-6 space-y-1 mt-2'>
					<li>Let's Encrypt SSL termination.</li>
					<li>Gzip/Brotli compression.</li>
					<li>Rate limiting (DDoS mitigation).</li>
				</ul>

				<h2
					id='storage'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Storage Layer
				</h2>
				<p>
					WordPress is stateful. We use <strong>Ceph</strong> distributed
					storage to ensure that if a physical node fails, your data volume
					(`/var/www/html`) is instantly re-mounted to a healthy node.
				</p>
			</>
		),
	},
	deployment: {
		id: "deployment",
		title: "CLI Deployment",
		category: "Getting Started",
		toc: [
			{ id: "cli-install", label: "Installing CLI" },
			{ id: "create-command", label: "Create Command" },
		],
		content: (
			<>
				<p>
					For power users, the WPCube CLI offers the fastest way to manage
					infrastructure.
				</p>

				<h2
					id='cli-install'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Installing CLI
				</h2>
				<CodeBlock
					title='Terminal'
					code={`curl -sL https://cli.wpcube.io/install.sh | bash
wpcube login --key=sk_live_...`}
				/>

				<h2
					id='create-command'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Create Command
				</h2>
				<p>Spin up a high-availability cluster with a single command:</p>
				<CodeBlock
					title='Terminal'
					code={`wpcube create \\
  --name="enterprise-shop" \\
  --plan="business" \\
  --php="8.2" \\
  --region="us-east"`}
				/>
				<Alert type='info' title='Response'>
					The CLI will output a JSON object containing your WP Admin credentials
					and database connection string. Save these immediately.
				</Alert>
			</>
		),
	},

	// --- CORE CONCEPTS ---
	"pods-containers": {
		id: "pods-containers",
		title: "Pods & Containers",
		category: "Core Concepts",
		toc: [
			{ id: "container-model", label: "The Container Model" },
			{ id: "resource-limits", label: "Resource Limits" },
		],
		content: (
			<>
				<p>
					In WPCube, your site runs as a Docker <strong>Service</strong>. This
					services defines the container image, environment variables, and
					resource constraints.
				</p>

				<h2
					id='container-model'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					The Container Model
				</h2>
				<p>
					We use a custom-built Docker image based on `wordpress:fpm-alpine`.
					This image is optimized for high-concurrency and low memory footprint.
				</p>
				<ul className='list-disc list-outside ml-6 space-y-2 mt-4'>
					<li>
						<strong>OS:</strong> Alpine Linux 3.18
					</li>
					<li>
						<strong>Server:</strong> Nginx (internal) + PHP-FPM 8.1/8.2
					</li>
					<li>
						<strong>Caching:</strong> Opcache pre-configured
					</li>
				</ul>

				<h2
					id='resource-limits'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Resource Limits
				</h2>
				<p>
					To prevent the "noisy neighbor" effect common in shared hosting, every
					container has hard limits enforced by Linux cgroups.
				</p>
				<table className='min-w-full mt-4 border border-slate-200 rounded-lg overflow-hidden'>
					<thead className='bg-slate-50'>
						<tr>
							<th className='px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase'>
								Plan
							</th>
							<th className='px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase'>
								CPU Share
							</th>
							<th className='px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase'>
								RAM Hard Limit
							</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-slate-100'>
						<tr>
							<td className='px-4 py-2'>Starter</td>
							<td className='px-4 py-2'>1.0 vCPU</td>
							<td className='px-4 py-2'>2 GB</td>
						</tr>
						<tr>
							<td className='px-4 py-2'>Pro</td>
							<td className='px-4 py-2'>2.0 vCPU</td>
							<td className='px-4 py-2'>4 GB</td>
						</tr>
						<tr>
							<td className='px-4 py-2'>Business</td>
							<td className='px-4 py-2'>4.0 vCPU</td>
							<td className='px-4 py-2'>8 GB</td>
						</tr>
					</tbody>
				</table>
				<p className='mt-4 text-sm text-slate-500'>
					* If your container exceeds the RAM limit, the kernel OOM (Out of
					Memory) killer will restart it automatically.
				</p>
			</>
		),
	},
	"persistent-volumes": {
		id: "persistent-volumes",
		title: "Persistent Volumes",
		category: "Core Concepts",
		toc: [
			{ id: "data-persistence", label: "Data Persistence" },
			{ id: "backups", label: "Automated Backups" },
		],
		content: (
			<>
				<p>
					Containers are ephemeral (temporary), but your data must be permanent.
					We solve this using <strong>Persistent Volumes</strong>.
				</p>

				<h2
					id='data-persistence'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Data Persistence
				</h2>
				<p>
					We map the `/var/www/html` directory inside your container to a
					distributed NVMe block storage volume.
				</p>
				<CodeBlock
					title='docker-compose.yml (Simplified)'
					code={`services:
  wordpress:
    image: wpcube/wordpress:latest
    volumes:
      - wp_data:/var/www/html

volumes:
  wp_data:
    driver: local-persist
    driver_opts:
      mountpoint: /mnt/ceph/volumes/site-1024`}
					language='yaml'
				/>
				<p>
					This ensures that even if we upgrade the underlying server hardware or
					redeploy your container, your uploads, plugins, and themes remain
					intact.
				</p>

				<h2
					id='backups'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Automated Backups
				</h2>
				<p>
					We take block-level snapshots of your volume every 24 hours (or hourly
					on Enterprise plans). Snapshots are stored off-site in AWS S3 for
					disaster recovery.
				</p>
			</>
		),
	},
	networking: {
		id: "networking",
		title: "Networking & Mesh",
		category: "Core Concepts",
		toc: [
			{ id: "overlay", label: "Overlay Network" },
			{ id: "service-discovery", label: "Service Discovery" },
		],
		content: (
			<>
				<p>
					WPCube utilizes a Virtual Private Cloud (VPC) model for every tenant.
					Your database is not exposed to the public internet.
				</p>

				<h2
					id='overlay'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Overlay Network
				</h2>
				<p>
					Containers communicate over an encrypted VXLAN overlay network. This
					allows services to talk to each other across different physical hosts
					securely.
				</p>

				<h2
					id='service-discovery'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Service Discovery
				</h2>
				<p>
					Docker includes an internal DNS resolver. You don't need to know the
					IP address of your database container. You can simply use its service
					name as the hostname.
				</p>
				<Alert type='tip' title='WP Config Example'>
					In your <code>wp-config.php</code>, the DB_HOST is simply configured
					as <code>mysql</code>.
				</Alert>
				<CodeBlock
					title='wp-config.php'
					language='php'
					code={`define( 'DB_NAME', getenv('WORDPRESS_DB_NAME') );
define( 'DB_USER', getenv('WORDPRESS_DB_USER') );
define( 'DB_PASSWORD', getenv('WORDPRESS_DB_PASSWORD') );
define( 'DB_HOST', 'mysql' ); // Internal service name`}
				/>
			</>
		),
	},
	"env-vars": {
		id: "env-vars",
		title: "Environment Variables",
		category: "Core Concepts",
		toc: [
			{ id: "standard-vars", label: "Standard Variables" },
			{ id: "custom-vars", label: "Injecting Custom Vars" },
		],
		content: (
			<>
				<p>
					We follow the{" "}
					<a
						href='https://12factor.net/config'
						className='text-indigo-600 underline'
						target='_blank'>
						12-Factor App
					</a>{" "}
					methodology. Configuration is stored in the environment, not hardcoded
					in files.
				</p>

				<h2
					id='standard-vars'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Standard Variables
				</h2>
				<p>
					The following variables are pre-injected into your container runtime:
				</p>
				<table className='min-w-full mt-4 border border-slate-200 rounded-lg text-sm'>
					<tbody className='divide-y divide-slate-100'>
						<tr>
							<td className='px-4 py-2 font-mono text-indigo-700'>
								WORDPRESS_DB_HOST
							</td>
							<td className='px-4 py-2'>Internal hostname of DB</td>
						</tr>
						<tr>
							<td className='px-4 py-2 font-mono text-indigo-700'>
								WORDPRESS_DB_USER
							</td>
							<td className='px-4 py-2'>Database username</td>
						</tr>
						<tr>
							<td className='px-4 py-2 font-mono text-indigo-700'>WP_DEBUG</td>
							<td className='px-4 py-2'>Boolean (true/false)</td>
						</tr>
						<tr>
							<td className='px-4 py-2 font-mono text-indigo-700'>WP_HOME</td>
							<td className='px-4 py-2'>Public URL of site</td>
						</tr>
					</tbody>
				</table>

				<h2
					id='custom-vars'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Injecting Custom Vars
				</h2>
				<p>
					You can add custom environment variables (e.g., API keys for plugins)
					via the Dashboard settings page or CLI.
				</p>
				<CodeBlock code={`wpcube env set STRIPE_KEY=sk_test_12345 --id=1024`} />
			</>
		),
	},

	// --- GUIDES ---
	migrating: {
		id: "migrating",
		title: "Migrating from cPanel",
		category: "Guides",
		toc: [
			{ id: "export", label: "1. Export Data" },
			{ id: "import-files", label: "2. Import Files" },
			{ id: "import-db", label: "3. Import Database" },
		],
		content: (
			<>
				<p>
					Moving from shared hosting to WPCube requires moving your `wp-content`
					folder and your database dump.
				</p>

				<h2
					id='export'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					1. Export Data
				</h2>
				<p>
					In cPanel File Manager, zip your <code>public_html/wp-content</code>{" "}
					folder. Then, use phpMyAdmin to "Export" your database as a{" "}
					<code>.sql</code> file.
				</p>

				<h2
					id='import-files'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					2. Import Files
				</h2>
				<p>
					Use our CLI to upload the content zip. We will automatically extract
					it to the correct volume path.
				</p>
				<CodeBlock code={`wpcube cp ./wp-content.zip my-site:/var/www/html/`} />

				<h2
					id='import-db'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					3. Import Database
				</h2>
				<p>
					Pipe your SQL file directly into the remote database container using
					the CLI.
				</p>
				<CodeBlock code={`cat backup.sql | wpcube db import --id=1024`} />

				<Alert type='warning' title='Search & Replace'>
					Don't forget to run a search-and-replace if your domain name is
					changing during migration. You can use{" "}
					<code>wpcube wp search-replace old.com new.com</code>.
				</Alert>
			</>
		),
	},
	"custom-domains": {
		id: "custom-domains",
		title: "Custom Domains",
		category: "Guides",
		toc: [
			{ id: "add-domain", label: "1. Add Domain in Dashboard" },
			{ id: "configure-dns", label: "2. Configure DNS" },
			{ id: "verification", label: "3. Verification" },
		],
		content: (
			<>
				<p>
					Map your production domain (e.g., <code>example.com</code>) to your
					WPCube instance.
				</p>

				<h2
					id='add-domain'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					1. Add Domain
				</h2>
				<p>
					Go to{" "}
					<strong>Dashboard &gt; Instance &gt; Settings &gt; Domains</strong>{" "}
					and enter your domain name.
				</p>

				<h2
					id='configure-dns'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					2. Configure DNS
				</h2>
				<p>
					Log in to your DNS provider (GoDaddy, Namecheap, Cloudflare) and
					create the following records:
				</p>
				<table className='min-w-full mt-4 border border-slate-200 rounded-lg text-sm'>
					<thead className='bg-slate-50'>
						<tr>
							<th className='px-4 py-2 text-left'>Type</th>
							<th className='px-4 py-2 text-left'>Host</th>
							<th className='px-4 py-2 text-left'>Value / Target</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-slate-100'>
						<tr>
							<td className='px-4 py-2 font-bold'>A</td>
							<td className='px-4 py-2'>@</td>
							<td className='px-4 py-2 font-mono'>
								75.2.1.10 (Load Balancer IP)
							</td>
						</tr>
						<tr>
							<td className='px-4 py-2 font-bold'>CNAME</td>
							<td className='px-4 py-2'>www</td>
							<td className='px-4 py-2 font-mono'>example.com</td>
						</tr>
					</tbody>
				</table>

				<h2
					id='verification'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					3. Verification
				</h2>
				<p>
					It may take up to 24 hours for DNS to propagate, though typically it
					happens within minutes.
				</p>
			</>
		),
	},
	"ssl-setup": {
		id: "ssl-setup",
		title: "SSL Configuration",
		category: "Guides",
		toc: [
			{ id: "auto-ssl", label: "Auto-SSL" },
			{ id: "troubleshooting", label: "Troubleshooting" },
		],
		content: (
			<>
				<p>
					Security is standard. WPCube provides free, automated SSL certificates
					for all domains.
				</p>

				<h2
					id='auto-ssl'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Auto-SSL
				</h2>
				<p>
					We use <strong>Let's Encrypt</strong> integrated directly into our
					edge load balancers. When you add a custom domain and point the DNS,
					our system automatically initiates an HTTP-01 challenge to issue a
					certificate.
				</p>
				<ul className='list-disc list-outside ml-6 space-y-2 mt-4'>
					<li>
						<strong>Zero Config:</strong> No keys to generate or CSRs to sign.
					</li>
					<li>
						<strong>Auto Renewal:</strong> Certificates are renewed 30 days
						before expiration automatically.
					</li>
				</ul>

				<h2
					id='troubleshooting'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Troubleshooting
				</h2>
				<Alert type='warning' title='Cloudflare Users'>
					If you use Cloudflare Proxy (Orange Cloud), ensure your SSL/TLS mode
					is set to <strong>Full</strong> or <strong>Full (Strict)</strong>.
					Setting it to "Flexible" will cause infinite redirect loops.
				</Alert>
			</>
		),
	},
	"db-management": {
		id: "db-management",
		title: "Database Management",
		category: "Guides",
		toc: [
			{ id: "phpmyadmin", label: "Accessing phpMyAdmin" },
			{ id: "ssh-tunnel", label: "External Access (SSH Tunnel)" },
		],
		content: (
			<>
				<p>
					Direct database access is restricted for security, but we provide
					secure methods to manage your data.
				</p>

				<h2
					id='phpmyadmin'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					Accessing phpMyAdmin
				</h2>
				<p>
					For security, we do not expose phpMyAdmin publicly. Instead, we spin
					up a temporary, password-protected container on demand.
				</p>
				<p className='mt-2'>
					Run <code>wpcube db ui --id=1024</code> in your terminal to generate a
					secure, one-time login URL.
				</p>

				<h2
					id='ssh-tunnel'
					className='scroll-mt-24 text-2xl font-bold text-slate-900 mt-12 mb-4'>
					External Access (SSH Tunnel)
				</h2>
				<p>
					To connect via a desktop client like TablePlus or Sequel Ace, use SSH
					tunneling.
				</p>
				<CodeBlock
					title='Terminal'
					code={`# Open tunnel mapping local port 3306 to remote container port 3306
ssh -L 3306:127.0.0.1:3306 user@ssh.wpcube.io -i ~/.ssh/id_rsa`}
				/>
				<p className='mt-4'>
					Then connect your SQL client to <code>127.0.0.1</code> using the DB
					credentials found in your dashboard.
				</p>
			</>
		),
	},
};

// --- Helper to group data for sidebar ---
const getSidebarGroups = () => {
	const groups: Record<string, { id: string; title: string }[]> = {};
	Object.values(DOCS_DATA).forEach((doc) => {
		if (!groups[doc.category]) groups[doc.category] = [];
		groups[doc.category].push({ id: doc.id, title: doc.title });
	});
	// Force specific order
	const order = ["Getting Started", "Core Concepts", "Guides"];
	return order.map((cat) => ({ category: cat, items: groups[cat] || [] }));
};

export const DocsPage: React.FC = () => {
	const [activeSlug, setActiveSlug] = useState("introduction");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Scroll to top when slug changes
	useEffect(() => {
		window.scrollTo(0, 0);
		setMobileMenuOpen(false);
	}, [activeSlug]);

	const activeDoc = DOCS_DATA[activeSlug];
	const sidebarGroups = getSidebarGroups();

	return (
		<div className='min-h-screen bg-white font-sans text-slate-900'>
			{/* Mobile Header for Docs Navigation */}
			<div className='lg:hidden border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between sticky top-16 z-20'>
				<span className='font-semibold text-sm text-slate-600'>
					Documentation Menu
				</span>
				<button
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className='p-1 rounded hover:bg-slate-200'>
					{mobileMenuOpen ? (
						<X className='w-5 h-5' />
					) : (
						<Menu className='w-5 h-5' />
					)}
				</button>
			</div>

			<div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='lg:grid lg:grid-cols-12 gap-12'>
					{/* Left Sidebar (Navigation) */}
					<aside
						className={`
            lg:block lg:col-span-3 border-r border-slate-200 pt-8 pb-20 
            ${
							mobileMenuOpen
								? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto block"
								: "hidden"
						}
            lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto
          `}>
						{mobileMenuOpen && (
							<div className='flex justify-between items-center mb-6 lg:hidden'>
								<span className='font-bold text-lg'>Docs Navigation</span>
								<button onClick={() => setMobileMenuOpen(false)}>
									<X className='w-6 h-6' />
								</button>
							</div>
						)}

						<div className='space-y-8'>
							{sidebarGroups.map((group) => (
								<div key={group.category}>
									<h3 className='font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider pl-3'>
										{group.category}
									</h3>
									<ul className='space-y-1'>
										{group.items.map((item) => (
											<li key={item.id}>
												<button
													onClick={() => setActiveSlug(item.id)}
													className={`w-full text-left block px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
														activeSlug === item.id
															? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm"
															: "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent"
													}`}>
													{item.title}
												</button>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</aside>

					{/* Main Content (Article) */}
					<main className='lg:col-span-7 py-12 lg:pr-8 min-h-[80vh]'>
						{/* Breadcrumbs */}
						<nav className='flex items-center text-sm text-slate-500 mb-8 space-x-2'>
							<span className='hover:text-slate-900 cursor-pointer'>Docs</span>
							<ChevronRight className='w-4 h-4' />
							<span className='hover:text-slate-900 cursor-pointer'>
								{activeDoc.category}
							</span>
							<ChevronRight className='w-4 h-4' />
							<span className='font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded'>
								{activeDoc.title}
							</span>
						</nav>

						<article className='prose prose-slate prose-lg prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-500 max-w-none prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none'>
							<h1 className='text-4xl font-extrabold tracking-tight text-slate-900 mb-6'>
								{activeDoc.title}
							</h1>

							{activeDoc.content}
						</article>

						{/* Feedback Section */}
						<div className='mt-20 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4'>
							<div className='text-sm text-slate-500'>
								Last updated:{" "}
								<span className='font-medium text-slate-900'>
									October 24, 2023
								</span>
							</div>
							<div className='flex items-center gap-4'>
								<p className='text-sm text-slate-500 font-medium'>
									Was this page helpful?
								</p>
								<div className='flex gap-2'>
									<button className='text-sm font-bold text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-4 py-2 rounded-lg bg-white transition-colors shadow-sm'>
										Yes
									</button>
									<button className='text-sm font-bold text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-lg bg-white transition-colors shadow-sm'>
										No
									</button>
								</div>
							</div>
						</div>
					</main>

					{/* Right Sidebar (Table of Contents) */}
					<aside className='hidden lg:block lg:col-span-2 py-12 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto'>
						<h4 className='text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2'>
							<FileText className='w-3 h-3' /> On this page
						</h4>
						<ul className='space-y-3 text-sm border-l border-slate-200 ml-1'>
							{activeDoc.toc.map((item) => (
								<li key={item.id}>
									<a
										href={`#${item.id}`}
										onClick={(e) => {
											e.preventDefault();
											document
												.getElementById(item.id)
												?.scrollIntoView({ behavior: "smooth" });
										}}
										className='text-slate-500 hover:text-indigo-600 block transition-colors pl-4 border-l-2 border-transparent hover:border-indigo-500 -ml-[2px]'>
										{item.label}
									</a>
								</li>
							))}
						</ul>

						<div className='mt-12 p-4 bg-slate-50 rounded-xl border border-slate-200'>
							<h5 className='font-bold text-slate-900 text-sm mb-2'>
								Need help?
							</h5>
							<p className='text-xs text-slate-500 mb-3'>
								Can't find what you're looking for?
							</p>
							<button className='text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1'>
								Contact Support <ChevronRight className='w-3 h-3' />
							</button>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
};
