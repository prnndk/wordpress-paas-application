#!/bin/bash
# GlusterFS Cluster Initialization Script
# Run from the manager node after GlusterFS containers are running on worker nodes

set -e

echo "==================================="
echo "Initializing GlusterFS Cluster"
echo "==================================="

# Configuration
WORKER1_IP=${GLUSTER_WORKER1_IP:-""}
WORKER2_IP=${GLUSTER_WORKER2_IP:-""}
WORKER1_USER=${GLUSTER_WORKER1_USER:-"root"}
WORKER2_USER=${GLUSTER_WORKER2_USER:-"root"}
VOLUME_NAME="wp_data"
BRICK_PATH="/glusterfs/brick1"

if [ -z "$WORKER1_IP" ] || [ -z "$WORKER2_IP" ]; then
    echo "Usage: GLUSTER_WORKER1_IP=<ip1> GLUSTER_WORKER2_IP=<ip2> [GLUSTER_WORKER1_USER=<user1>] [GLUSTER_WORKER2_USER=<user2>] ./gluster-init.sh"
    echo ""
    echo "Environment variables:"
    echo "  GLUSTER_WORKER1_IP    - IP address of worker 1 (required)"
    echo "  GLUSTER_WORKER2_IP    - IP address of worker 2 (required)"
    echo "  GLUSTER_WORKER1_USER  - SSH user for worker 1 (default: root)"
    echo "  GLUSTER_WORKER2_USER  - SSH user for worker 2 (default: root)"
    exit 1
fi

echo "Worker 1: $WORKER1_USER@$WORKER1_IP"
echo "Worker 2: $WORKER2_USER@$WORKER2_IP"

# SSH command helper
ssh_worker1() {
    ssh -o StrictHostKeyChecking=no "$WORKER1_USER@$WORKER1_IP" "$@"
}

ssh_worker2() {
    ssh -o StrictHostKeyChecking=no "$WORKER2_USER@$WORKER2_IP" "$@"
}

# Execute gluster command on worker1's container
gluster_exec() {
    echo "Executing: gluster $@"
    ssh_worker1 "docker exec \$(docker ps -q -f name=glusterfs) gluster $*"
}

# Wait for GlusterFS to be ready
echo "Waiting for GlusterFS daemon..."
sleep 15

# Check if containers are running on both workers
echo "Checking GlusterFS containers..."
echo "Worker 1:"
ssh_worker1 "docker ps -f name=glusterfs --format 'table {{.Names}}\t{{.Status}}'" || {
    echo "Error: Cannot connect to worker1 or no glusterfs container running"
    exit 1
}
echo "Worker 2:"
ssh_worker2 "docker ps -f name=glusterfs --format 'table {{.Names}}\t{{.Status}}'" || {
    echo "Error: Cannot connect to worker2 or no glusterfs container running"
    exit 1
}

# Probe peers (run from worker1)
echo ""
echo "Probing peer nodes..."
gluster_exec peer probe "$WORKER2_IP"

# Wait for peer to connect
sleep 5

# Check peer status
echo ""
echo "Peer status:"
gluster_exec peer status

# Create brick directory on both workers
echo ""
echo "Creating brick directories..."
ssh_worker1 "docker exec \$(docker ps -q -f name=glusterfs) mkdir -p $BRICK_PATH"
ssh_worker2 "docker exec \$(docker ps -q -f name=glusterfs) mkdir -p $BRICK_PATH"

# Create replicated volume
echo ""
echo "Creating replicated volume '$VOLUME_NAME'..."
gluster_exec volume create "$VOLUME_NAME" replica 2 \
    "$WORKER1_IP:$BRICK_PATH" \
    "$WORKER2_IP:$BRICK_PATH" \
    force

# Start the volume
echo ""
echo "Starting volume..."
gluster_exec volume start "$VOLUME_NAME"

# Set volume options for better performance
echo ""
echo "Configuring volume options..."
gluster_exec volume set "$VOLUME_NAME" performance.cache-size 256MB
gluster_exec volume set "$VOLUME_NAME" performance.write-behind-window-size 1MB
gluster_exec volume set "$VOLUME_NAME" network.ping-timeout 10

# Show volume info
echo ""
echo "Volume Information:"
gluster_exec volume info "$VOLUME_NAME"

echo ""
echo "==================================="
echo "GlusterFS cluster initialized successfully!"
echo "==================================="
echo ""
echo "Mount the volume with: mount -t glusterfs $WORKER1_IP:/$VOLUME_NAME /mnt/glusterfs"
