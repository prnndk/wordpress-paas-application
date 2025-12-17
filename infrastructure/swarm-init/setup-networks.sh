#!/bin/bash
# Create overlay networks for the WordPress PaaS
# Run this on the manager node after swarm initialization

set -e

echo "==================================="
echo "Creating Docker Overlay Networks"
echo "==================================="

# Main application network - for all services
docker network create \
    --driver overlay \
    --attachable \
    --subnet=10.10.0.0/16 \
    wp_paas_network 2>/dev/null || echo "wp_paas_network already exists"

# Database network - isolated for MySQL
docker network create \
    --driver overlay \
    --attachable \
    --subnet=10.20.0.0/16 \
    wp_paas_db_network 2>/dev/null || echo "wp_paas_db_network already exists"

# Storage network - for GlusterFS communication
docker network create \
    --driver overlay \
    --attachable \
    --subnet=10.30.0.0/16 \
    wp_paas_storage_network 2>/dev/null || echo "wp_paas_storage_network already exists"

# Traefik proxy network
docker network create \
    --driver overlay \
    --attachable \
    --subnet=10.40.0.0/16 \
    wp_paas_proxy_network 2>/dev/null || echo "wp_paas_proxy_network already exists"

echo ""
echo "Networks created successfully!"
docker network ls | grep wp_paas
