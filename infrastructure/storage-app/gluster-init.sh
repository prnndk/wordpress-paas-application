#!/bin/bash
# GlusterFS Cluster Initialization Script
# Run after GlusterFS containers are running on all worker nodes

set -e

echo "==================================="
echo "Initializing GlusterFS Cluster"
echo "==================================="

# Configuration
WORKER1_IP=${GLUSTER_WORKER1_IP:-""}
WORKER2_IP=${GLUSTER_WORKER2_IP:-""}
VOLUME_NAME="wp_data"
BRICK_PATH="/glusterfs/brick1"

if [ -z "$WORKER1_IP" ] || [ -z "$WORKER2_IP" ]; then
    echo "Usage: GLUSTER_WORKER1_IP=<ip1> GLUSTER_WORKER2_IP=<ip2> ./gluster-init.sh"
    exit 1
fi

echo "Worker 1: $WORKER1_IP"
echo "Worker 2: $WORKER2_IP"

# Wait for GlusterFS to be ready
echo "Waiting for GlusterFS daemon..."
sleep 10

# Probe peers (run from one of the nodes)
echo "Probing peer nodes..."
docker exec $(docker ps -q -f name=glusterfs-server) gluster peer probe $WORKER2_IP

# Wait for peer to connect
sleep 5

# Check peer status
echo "Peer status:"
docker exec $(docker ps -q -f name=glusterfs-server) gluster peer status

# Create replicated volume
echo "Creating replicated volume '$VOLUME_NAME'..."
docker exec $(docker ps -q -f name=glusterfs-server) \
    gluster volume create $VOLUME_NAME replica 2 \
    $WORKER1_IP:$BRICK_PATH \
    $WORKER2_IP:$BRICK_PATH \
    force

# Start the volume
echo "Starting volume..."
docker exec $(docker ps -q -f name=glusterfs-server) gluster volume start $VOLUME_NAME

# Set volume options for better performance
echo "Configuring volume options..."
docker exec $(docker ps -q -f name=glusterfs-server) gluster volume set $VOLUME_NAME performance.cache-size 256MB
docker exec $(docker ps -q -f name=glusterfs-server) gluster volume set $VOLUME_NAME performance.write-behind-window-size 1MB
docker exec $(docker ps -q -f name=glusterfs-server) gluster volume set $VOLUME_NAME network.ping-timeout 10

# Show volume info
echo ""
echo "Volume Information:"
docker exec $(docker ps -q -f name=glusterfs-server) gluster volume info $VOLUME_NAME

echo ""
echo "GlusterFS cluster initialized successfully!"
echo "Mount the volume with: mount -t glusterfs $WORKER1_IP:/$VOLUME_NAME /mnt/glusterfs"
