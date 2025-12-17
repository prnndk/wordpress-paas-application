#!/bin/bash
# Docker Swarm Worker Join Script
# Run this on each worker node

set -e

echo "==================================="
echo "Joining Docker Swarm as Worker"
echo "==================================="

# These should be set via environment or passed as arguments
MANAGER_IP=${SWARM_MANAGER_IP:-""}
WORKER_TOKEN=${SWARM_WORKER_TOKEN:-""}

if [ -z "$MANAGER_IP" ] || [ -z "$WORKER_TOKEN" ]; then
    echo "Usage: SWARM_MANAGER_IP=<ip> SWARM_WORKER_TOKEN=<token> ./join-worker.sh"
    echo ""
    echo "Get the worker token from the manager node by running:"
    echo "  docker swarm join-token worker"
    exit 1
fi

echo "Joining swarm at $MANAGER_IP..."

docker swarm join --token "$WORKER_TOKEN" "$MANAGER_IP:2377"

echo ""
echo "Successfully joined the swarm!"
echo "Verify on manager with: docker node ls"
