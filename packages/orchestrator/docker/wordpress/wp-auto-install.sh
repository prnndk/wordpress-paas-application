#!/bin/bash
set -e

echo "[WP-CLI Auto-Install] Script started..."

# Wait for WordPress files to be ready
echo "[WP-CLI Auto-Install] Waiting for wp-config.php..."
MAX_WAIT=120
WAIT_COUNT=0
until [ -f /var/www/html/wp-config.php ]; do
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
        echo "[WP-CLI Auto-Install] ERROR: Timeout waiting for wp-config.php"
        exit 1
    fi
done
echo "[WP-CLI Auto-Install] wp-config.php found!"

# Wait for database to be ready
echo "[WP-CLI Auto-Install] Waiting for database connection..."
WAIT_COUNT=0
until wp db check --allow-root 2>/dev/null; do
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
        echo "[WP-CLI Auto-Install] ERROR: Timeout waiting for database"
        exit 1
    fi
done
echo "[WP-CLI Auto-Install] Database connection established!"

# Check if WordPress is already installed
if ! wp core is-installed --allow-root 2>/dev/null; then
    echo "[WP-CLI Auto-Install] WordPress not installed. Running installation..."
    
    # Get environment variables with defaults
    WP_URL="${WP_HOME:-http://localhost}"
    WP_TITLE="${WORDPRESS_SITE_TITLE:-My WordPress Site}"
    WP_ADMIN_USER="${WORDPRESS_ADMIN_USER:-admin}"
    WP_ADMIN_PASS="${WORDPRESS_ADMIN_PASSWORD:-changeme123}"
    WP_ADMIN_EMAIL="${WORDPRESS_ADMIN_EMAIL:-admin@example.com}"
    
    echo "[WP-CLI Auto-Install] Installing with:"
    echo "  URL: $WP_URL"
    echo "  Title: $WP_TITLE"
    echo "  Admin User: $WP_ADMIN_USER"
    echo "  Admin Email: $WP_ADMIN_EMAIL"
    echo ""
    echo "⚠️  IMPORTANT: Login with USERNAME '$WP_ADMIN_USER', NOT with email!"
    echo ""
    
    wp core install \
        --url="$WP_URL" \
        --title="$WP_TITLE" \
        --admin_user="$WP_ADMIN_USER" \
        --admin_password="$WP_ADMIN_PASS" \
        --admin_email="$WP_ADMIN_EMAIL" \
        --skip-email \
        --allow-root
    
    echo "[WP-CLI Auto-Install] WordPress installation complete!"
    
    # Force update siteurl and home in database to match WP_HOME
    echo "[WP-CLI Auto-Install] Updating database URLs..."
    wp option update home "$WP_URL" --allow-root
    wp option update siteurl "$WP_URL" --allow-root
    echo "[WP-CLI Auto-Install] Database URLs updated!"
    
    # Verify installation and show credentials
    echo ""
    echo "================================================"
    echo "WordPress Installation Summary:"
    echo "================================================"
    echo "Site URL: $WP_URL"
    echo "Login URL: ${WP_URL}/wp-admin/"
    echo ""
    echo "LOGIN CREDENTIALS:"
    echo "  Username: $WP_ADMIN_USER"
    echo "  Email: $WP_ADMIN_EMAIL"
    echo ""
    echo "⚠️  USE USERNAME TO LOGIN, NOT EMAIL!"
    echo "================================================"
    echo ""
    
    # Set permalink structure
    wp rewrite structure '/%postname%/' --allow-root 2>/dev/null || true
    wp rewrite flush --allow-root 2>/dev/null || true
    
    echo "[WP-CLI Auto-Install] Permalinks configured!"
else
    echo "[WP-CLI Auto-Install] WordPress already installed. Skipping installation."
fi

echo "[WP-CLI Auto-Install] Script finished successfully!"
