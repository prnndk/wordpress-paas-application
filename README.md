# WordPress PaaS - Multi-Tenancy Platform

A complete Platform as a Service for deploying isolated WordPress instances on Docker Swarm with automated provisioning, MySQL Master-Slave replication, and GlusterFS distributed storage.

## 🚀 Features

- **Multi-Tenancy**: Each user gets isolated WordPress instances with dedicated database and storage
- **High Availability**: WordPress deployments run on 2 worker nodes with automatic failover
- **Distributed Storage**: GlusterFS replicates `wp-content` across all worker nodes in real-time
- **Database Clustering**: MySQL Master-Slave replication for data redundancy
- **Automatic SSL**: Let's Encrypt certificates via Traefik reverse proxy
- **Modern Dashboard**: Next.js 14 dashboard with Tailwind CSS and Shadcn UI

## 📁 Project Structure

```
├── apps/
│   └── dashboard/          # Next.js frontend application
├── packages/
│   └── orchestrator/       # NestJS backend for Docker Swarm management
├── infrastructure/
│   ├── swarm-init/         # Docker Swarm initialization scripts
│   ├── db-cluster/         # MySQL Master-Slave configuration
│   ├── storage-app/        # GlusterFS distributed storage
│   └── traefik/            # Reverse proxy configuration
├── docker-compose.yml      # Main stack definition
└── .env.example            # Environment variable template
```

## 🛠 Prerequisites

- Docker Engine 24.0+ with Swarm Mode
- 3 servers/VMs (1 Manager, 2 Workers) for production
- Node.js 18+ for local development
- GlusterFS client installed on all nodes

## 🚦 Quick Start

### 1. Clone and Configure

```bash
git clone <repository>
cd cc-fp
cp .env.example .env
# Edit .env with your configuration
```

### 2. Initialize Swarm (Production)

On the manager node:
```bash
cd infrastructure/swarm-init
./init-manager.sh
./setup-networks.sh
```

On each worker node:
```bash
SWARM_MANAGER_IP=<ip> SWARM_WORKER_TOKEN=<token> ./join-worker.sh
```

### 3. Deploy Infrastructure

```bash
# MySQL Cluster
docker stack deploy -c infrastructure/db-cluster/docker-compose.mysql.yml mysql

# GlusterFS Storage
docker stack deploy -c infrastructure/storage-app/docker-compose.glusterfs.yml glusterfs

# Initialize GlusterFS cluster
GLUSTER_WORKER1_IP=<ip1> GLUSTER_WORKER2_IP=<ip2> ./infrastructure/storage-app/gluster-init.sh

# Traefik Reverse Proxy
docker stack deploy -c infrastructure/traefik/docker-compose.traefik.yml traefik
```

### 4. Deploy Application

```bash
# Build and deploy the main stack
docker stack deploy -c docker-compose.yml wppaas
```

### 5. Local Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

## 🔧 Configuration

Key environment variables in `.env`:

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Primary domain for the platform |
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `MYSQL_APP_PASSWORD` | Application database password |
| `JWT_SECRET` | Secret key for JWT tokens |
| `GLUSTER_WORKER1_IP` | IP address of first GlusterFS node |
| `GLUSTER_WORKER2_IP` | IP address of second GlusterFS node |

## 📚 API Documentation

The orchestrator API is documented with Swagger. Access it at:
```
https://api.<your-domain>/docs
```

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Manager Node                           │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ Traefik │  │  Dashboard  │  │      Orchestrator        │ │
│  │   LB    │  │  (Next.js)  │  │       (NestJS)           │ │
│  └────┬────┘  └─────────────┘  └──────────────────────────┘ │
│       │                                                      │
│  ┌────┴────────────────────────────────────────────────────┐│
│  │                   MySQL Master                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────────┐               ┌───────────────────────┐
│     Worker Node 1     │               │     Worker Node 2     │
│  ┌─────────────────┐  │               │  ┌─────────────────┐  │
│  │  WordPress WP1  │  │               │  │  WordPress WP1  │  │
│  │   (replica 1)   │  │◄─────────────►│  │   (replica 2)   │  │
│  └─────────────────┘  │   GlusterFS   │  └─────────────────┘  │
│  ┌─────────────────┐  │  Replication  │  ┌─────────────────┐  │
│  │  GlusterFS      │  │               │  │  GlusterFS      │  │
│  │    Brick        │  │               │  │    Brick        │  │
│  └─────────────────┘  │               │  └─────────────────┘  │
│  ┌─────────────────┐  │               │                       │
│  │  MySQL Slave    │  │               │                       │
│  └─────────────────┘  │               │                       │
└───────────────────────┘               └───────────────────────┘
```

## 📝 License

MIT
