#!/bin/bash
set -euo pipefail

# Function to configure WordPress after it's ready
configure_wordpress() {
    echo "Waiting for WordPress to be ready..."
    sleep 5

    # Wait for database connection
    echo "Checking database connection..."
    max_retries=30
    counter=0
    until mysql -h"${WORDPRESS_DB_HOST%%:*}" -P"${WORDPRESS_DB_HOST##*:}" -u"${WORDPRESS_DB_USER}" -p"${WORDPRESS_DB_PASSWORD}" -e "SELECT 1" > /dev/null 2>&1; do
        counter=$((counter + 1))
        if [ $counter -gt $max_retries ]; then
            echo "Error: Database connection timeout"
            return 1
        fi
        echo "Waiting for database... ($counter/$max_retries)"
        sleep 2
    done
    echo "Database connection established!"

    # Wait for wp-config.php to be created by the original entrypoint
    while [ ! -f /var/www/html/wp-config.php ]; do
        echo "Waiting for wp-config.php..."
        sleep 2
    done
    echo "wp-config.php found!"

    # ============================================================================
    # CRITICAL FIX: Ensure cookie paths are set in wp-config.php
    # This MUST be done here because WordPress defines COOKIEPATH in wp-settings.php
    # BEFORE mu-plugins are loaded. Without this, login will redirect in a loop.
    # ============================================================================
    if [ -n "${WP_PAAS_PATH_PREFIX:-}" ]; then
        PREFIX="${WP_PAAS_PATH_PREFIX}"
        
        # Check if COOKIEPATH is already defined
        if ! grep -q "define.*COOKIEPATH" /var/www/html/wp-config.php 2>/dev/null; then
            echo "Adding cookie path constants to wp-config.php..."
            
            # Insert cookie path definitions BEFORE "That's all, stop editing!"
            # Or before the require_once line if that comment doesn't exist
            if grep -q "That's all, stop editing" /var/www/html/wp-config.php; then
                sed -i "/That's all, stop editing/i\\
/** Cookie paths for path-based routing */\\
define('COOKIEPATH', '${PREFIX}/');\\
define('SITECOOKIEPATH', '${PREFIX}/');\\
define('ADMIN_COOKIE_PATH', '${PREFIX}/wp-admin');\\
define('PLUGINS_COOKIE_PATH', '${PREFIX}/wp-content/plugins');\\
" /var/www/html/wp-config.php
            else
                # Fallback: append before require_once ABSPATH
                sed -i "/require_once.*ABSPATH.*wp-settings.php/i\\
/** Cookie paths for path-based routing */\\
define('COOKIEPATH', '${PREFIX}/');\\
define('SITECOOKIEPATH', '${PREFIX}/');\\
define('ADMIN_COOKIE_PATH', '${PREFIX}/wp-admin');\\
define('PLUGINS_COOKIE_PATH', '${PREFIX}/wp-content/plugins');\\
" /var/www/html/wp-config.php
            fi
            
            echo "Cookie paths added: COOKIEPATH=${PREFIX}/"
        else
            echo "Cookie paths already defined in wp-config.php"
        fi
    fi

    # CRITICAL: Copy mu-plugins for path-based routing fix
    # This MUST happen on EVERY replica, EVERY time - always overwrite to ensure consistency
    if [ -d /opt/wp-paas-mu-plugins ]; then
        echo "Installing WP-PaaS must-use plugins (forced copy)..."
        mkdir -p /var/www/html/wp-content/mu-plugins
        # Force copy with -f to overwrite existing files
        cp -rf /opt/wp-paas-mu-plugins/* /var/www/html/wp-content/mu-plugins/
        chown -R www-data:www-data /var/www/html/wp-content/mu-plugins/
        echo "mu-plugins installed: $(ls -la /var/www/html/wp-content/mu-plugins/)"
    else
        echo "WARNING: /opt/wp-paas-mu-plugins not found! Path-based routing will NOT work."
    fi

    # Check if WordPress is already installed
    cd /var/www/html
    if ! wp core is-installed --allow-root 2>/dev/null; then
        echo "WordPress not installed. Running auto-install..."
        
        # Set default values if not provided
        WP_TITLE="${WORDPRESS_TITLE:-My WordPress Site}"
        WP_ADMIN_USER="${WORDPRESS_ADMIN_USER:-admin}"
        WP_ADMIN_PASSWORD="${WORDPRESS_ADMIN_PASSWORD:-changeme123}"
        WP_ADMIN_EMAIL="${WORDPRESS_ADMIN_EMAIL:-admin@localhost.local}"
        
        # For WP CLI install, use base URL without path prefix
        # The mu-plugin will add the prefix to generated URLs
        if [ -n "${WORDPRESS_CONFIG_EXTRA:-}" ]; then
            WP_URL=$(echo "${WORDPRESS_CONFIG_EXTRA}" | grep -oP "define\('WP_HOME',\s*'[^']+" | grep -oP "'[^']+" | tail -1 | tr -d "'")
        fi
        
        if [ -z "${WP_URL:-}" ]; then
            WP_URL="http://localhost"
        fi
        
        echo "Installing WordPress..."
        echo "  URL: ${WP_URL}"
        echo "  Title: ${WP_TITLE}"
        echo "  Admin User: ${WP_ADMIN_USER}"
        echo "  Admin Password: ${WP_ADMIN_PASSWORD}"
        echo "  Path Prefix: ${WP_PAAS_PATH_PREFIX:-none}"
        
        # Install WordPress with user-provided credentials
        wp core install \
            --url="${WP_URL}" \
            --title="${WP_TITLE}" \
            --admin_user="${WP_ADMIN_USER}" \
            --admin_password="${WP_ADMIN_PASSWORD}" \
            --admin_email="${WP_ADMIN_EMAIL}" \
            --skip-email \
            --allow-root
        
        echo "WordPress installation complete!"
        echo "=========================================="
        echo "Admin credentials:"
        echo "  Username: ${WP_ADMIN_USER}"
        echo "  Password: ${WP_ADMIN_PASSWORD}"
        echo "=========================================="
        
        wp rewrite structure '/%postname%/' --hard --allow-root 2>/dev/null || true
        wp option update timezone_string 'UTC' --allow-root 2>/dev/null || true
        wp config set AUTOMATIC_UPDATER_DISABLED true --raw --type=constant --allow-root 2>/dev/null || true
        
        chown -R www-data:www-data /var/www/html
        
        echo "WordPress configuration complete!"
    else
        echo "WordPress is already installed. Syncing admin credentials..."
        
        # Sync admin password from environment variable
        WP_ADMIN_USER="${WORDPRESS_ADMIN_USER:-admin}"
        WP_ADMIN_PASSWORD="${WORDPRESS_ADMIN_PASSWORD:-changeme123}"
        
        # Update password if provided
        if [ -n "${WP_ADMIN_PASSWORD}" ]; then
            echo "Updating password for user: ${WP_ADMIN_USER}"
            wp user update "${WP_ADMIN_USER}" --user_pass="${WP_ADMIN_PASSWORD}" --allow-root 2>/dev/null && \
                echo "Password updated successfully!" || \
                echo "Failed to update password (user may not exist)"
        fi
    fi

    # Configure MinIO/S3
    if [ -n "${S3_UPLOADS_ENDPOINT:-}" ] && [ -n "${S3_UPLOADS_BUCKET:-}" ]; then
        echo "Configuring MinIO/S3 storage..."
        
        # Copy pre-installed S3 Uploads plugin (includes Composer dependencies)
        if [ -d /opt/s3-uploads ] && [ ! -d /var/www/html/wp-content/plugins/s3-uploads ]; then
            echo "Installing S3 Uploads plugin with dependencies..."
            cp -r /opt/s3-uploads /var/www/html/wp-content/plugins/s3-uploads
            chown -R www-data:www-data /var/www/html/wp-content/plugins/s3-uploads
            echo "S3 Uploads plugin installed!"
        fi
        
        wp plugin activate s3-uploads --allow-root 2>/dev/null || true
        
        if ! grep -q "S3_UPLOADS_BUCKET" /var/www/html/wp-config.php 2>/dev/null; then
            wp config set S3_UPLOADS_BUCKET "${S3_UPLOADS_BUCKET}" --type=constant --allow-root 2>/dev/null || true
            wp config set S3_UPLOADS_KEY "${S3_UPLOADS_KEY:-minioadmin}" --type=constant --allow-root 2>/dev/null || true
            wp config set S3_UPLOADS_SECRET "${S3_UPLOADS_SECRET:-minioadmin123}" --type=constant --allow-root 2>/dev/null || true
            wp config set S3_UPLOADS_REGION "${S3_UPLOADS_REGION:-us-east-1}" --type=constant --allow-root 2>/dev/null || true
            wp config set S3_UPLOADS_ENDPOINT "${S3_UPLOADS_ENDPOINT}" --type=constant --allow-root 2>/dev/null || true
            wp config set S3_UPLOADS_USE_INSTANCE_PROFILE false --raw --type=constant --allow-root 2>/dev/null || true
            wp config set S3_UPLOADS_BUCKET_URL "${S3_UPLOADS_ENDPOINT}/${S3_UPLOADS_BUCKET}" --type=constant --allow-root 2>/dev/null || true
            echo "S3 configuration added!"
        fi
        
        echo "MinIO/S3 configured: ${S3_UPLOADS_ENDPOINT}/${S3_UPLOADS_BUCKET}"
    fi
    
    echo "WordPress PaaS configuration complete!"
}

# Run configuration in background
configure_wordpress &

# Execute original WordPress entrypoint (this keeps container running)
exec docker-entrypoint.sh apache2-foreground
