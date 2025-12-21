#!/bin/bash
set -e

echo "[Entrypoint Wrapper] Starting WordPress with auto-install..."

# Start auto-install in background after a delay
# This gives the original entrypoint time to set up wp-config.php
(
    sleep 45
    echo "[Entrypoint Wrapper] Running auto-install script..."
    /usr/local/bin/wp-auto-install.sh
) &

# Run original WordPress entrypoint
echo "[Entrypoint Wrapper] Calling original docker-entrypoint.sh..."
exec docker-entrypoint.sh "$@"
