#!/bin/bash
# Mount GlusterFS Volume Script
# Run on each node that needs access to the shared storage

set -e

echo "==================================="
echo "Mounting GlusterFS Volume"
echo "==================================="

GLUSTER_SERVER=${GLUSTER_SERVER_IP:-"localhost"}
VOLUME_NAME=${GLUSTER_VOLUME:-"wp_data"}
MOUNT_POINT=${GLUSTER_MOUNT_POINT:-"/mnt/glusterfs"}

# Install GlusterFS client if not present
if ! command -v mount.glusterfs &> /dev/null; then
    echo "Installing GlusterFS client..."
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y glusterfs-client
    elif command -v yum &> /dev/null; then
        yum install -y glusterfs-client
    else
        echo "Cannot install glusterfs-client. Please install manually."
        exit 1
    fi
fi

# Create mount point
mkdir -p $MOUNT_POINT

# Add to fstab if not already there
if ! grep -q "$VOLUME_NAME $MOUNT_POINT" /etc/fstab; then
    echo "$GLUSTER_SERVER:/$VOLUME_NAME $MOUNT_POINT glusterfs defaults,_netdev,backup-volfile-servers=${GLUSTER_BACKUP_SERVER:-$GLUSTER_SERVER} 0 0" >> /etc/fstab
fi

# Mount the volume
mount $MOUNT_POINT

# Create tenant directories base
mkdir -p $MOUNT_POINT/tenants
chmod 755 $MOUNT_POINT/tenants

echo ""
echo "GlusterFS volume mounted at $MOUNT_POINT"
df -h $MOUNT_POINT
