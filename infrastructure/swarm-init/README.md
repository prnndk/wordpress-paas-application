# Docker Swarm Infrastructure Setup

This directory contains scripts for initializing and managing the Docker Swarm cluster.

## Prerequisites

- Docker Engine 24.0+ installed on all nodes
- SSH access to all nodes from the manager
- Open ports: 2377 (cluster management), 7946 (node communication), 4789 (overlay network)

## Setup Steps

### 1. Initialize Manager Node

On the manager node:

```bash
chmod +x init-manager.sh
./init-manager.sh
```

This will:
- Initialize the Swarm
- Display join tokens for workers
- Save tokens to `/tmp/` for automation

### 2. Join Worker Nodes

On each worker node:

```bash
chmod +x join-worker.sh
SWARM_MANAGER_IP=<manager_ip> SWARM_WORKER_TOKEN=<token> ./join-worker.sh
```

### 3. Create Networks

Back on the manager node:

```bash
chmod +x setup-networks.sh
./setup-networks.sh
```

## Networks Created

| Network Name          | Subnet        | Purpose                    |
|-----------------------|---------------|----------------------------|
| `wp_paas_network`     | 10.10.0.0/16  | Main application network   |
| `wp_paas_db_network`  | 10.20.0.0/16  | MySQL cluster network      |
| `wp_paas_storage_network` | 10.30.0.0/16 | GlusterFS network       |
| `wp_paas_proxy_network` | 10.40.0.0/16 | Traefik proxy network    |

## Verify Setup

```bash
docker node ls    # List all nodes
docker network ls # List networks
```
