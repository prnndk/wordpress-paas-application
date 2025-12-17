# GlusterFS Distributed Storage Setup

This directory contains configurations for setting up GlusterFS as the distributed storage layer for WordPress PaaS.

## Features

- **Replicated Storage**: Data written to one worker is instantly replicated to the other
- **High Availability**: If one worker fails, data remains accessible from the other
- **Scalable**: Can add more bricks/nodes as needed

## Prerequisites

- Docker Swarm with at least 2 worker nodes
- Network connectivity between workers on ports 24007-24008, 49152-49251
- GlusterFS client installed on all nodes (for mounting)

## Setup Steps

### 1. Deploy GlusterFS Servers

From the manager node:

```bash
docker stack deploy -c docker-compose.glusterfs.yml glusterfs
```

Wait for containers to start on both workers:

```bash
docker service ls | grep glusterfs
```

### 2. Initialize Cluster

Run the initialization script:

```bash
GLUSTER_WORKER1_IP=<worker1_ip> GLUSTER_WORKER2_IP=<worker2_ip> ./gluster-init.sh
```

### 3. Mount on Nodes

On each worker node, mount the volume:

```bash
GLUSTER_SERVER_IP=<worker1_ip> ./setup-mount.sh
```

## Volume Structure

```
/mnt/glusterfs/
└── tenants/
    ├── tenant_abc123/
    │   └── wp-content/
    ├── tenant_def456/
    │   └── wp-content/
    └── ...
```

## Verification

Test replication:

```bash
# On Worker 1
echo "test" > /mnt/glusterfs/tenants/test.txt

# On Worker 2 (should see the file immediately)
cat /mnt/glusterfs/tenants/test.txt
```

## Troubleshooting

Check volume status:
```bash
docker exec <container_id> gluster volume status wp_data
```

Check heal info:
```bash
docker exec <container_id> gluster volume heal wp_data info
```
