#!/bin/bash
# Docker Swarm Manager Initialization Script
# Run this on the manager node

set -e

echo "==================================="
echo "Initializing Docker Swarm Manager"
echo "==================================="

# Get the advertise address (usually the primary IP)
ADVERTISE_ADDR=${SWARM_ADVERTISE_ADDR:-$(hostname -I | awk '{print $1}')}

echo "Using advertise address: $ADVERTISE_ADDR"

# Initialize the swarm
docker swarm init --advertise-addr "$ADVERTISE_ADDR"

# Get join tokens
echo ""
echo "==================================="
echo "Worker Join Command:"
echo "==================================="
docker swarm join-token worker

echo ""
echo "==================================="
echo "Manager Join Command (for backup managers):"
echo "==================================="
docker swarm join-token manager

# Save tokens to files for automation
docker swarm join-token -q worker > /tmp/worker-token.txt
docker swarm join-token -q manager > /tmp/manager-token.txt

echo ""
echo "Tokens saved to /tmp/worker-token.txt and /tmp/manager-token.txt"
echo "Swarm initialization complete!"
