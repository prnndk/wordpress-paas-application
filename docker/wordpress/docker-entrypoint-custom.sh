#!/bin/bash
set -euo pipefail

# Function to configure WordPress after it's ready
configure_wordpress() {
    echo "Waiting for WordPress to be ready..."
    sleep 15

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

    # Check if WordPress is already installed
    cd /var/www/html
    if ! wp core is-installed --allow-root 2>/dev/null; then
        echo "WordPress not installed. Running auto-install..."
        
        # Set default values if not provided
        WP_TITLE="${WORDPRESS_TITLE:-My WordPress Site}"
        WP_ADMIN_USER="${WORDPRESS_ADMIN_USER:-admin}"
        WP_ADMIN_PASSWORD="${WORDPRESS_ADMIN_PASSWORD:-$(openssl rand -base64 12)}"
        WP_ADMIN_EMAIL="${WORDPRESS_ADMIN_EMAIL:-admin@localhost.local}"
        
        # Determine site URL
        if [ -n "${WP_HOME:-}" ]; then
            WP_URL="${WP_HOME}"
        elif [ -n "${WORDPRESS_CONFIG_EXTRA:-}" ]; then
            WP_URL=$(echo "${WORDPRESS_CONFIG_EXTRA}" | grep -oP "define\('WP_HOME',\s*'[^']+" | grep -oP "'[^']+" | tail -1 | tr -d "'")
        fi
        
        if [ -z "${WP_URL:-}" ]; then
            WP_URL="http://localhost"
        fi
        
        echo "Installing WordPress..."
        echo "  URL: ${WP_URL}"
        echo "  Title: ${WP_TITLE}"
        echo "  Admin User: ${WP_ADMIN_USER}"
        
        wp core install \
            --url="${WP_URL}" \
            --title="${WP_TITLE}" \
            --admin_user="${WP_ADMIN_USER}" \
            --admin_password="${WP_ADMIN_PASSWORD}" \
            --admin_email="${WP_ADMIN_EMAIL}" \
            --skip-email \
            --allow-root
        
        echo "WordPress installation complete!"
        echo "Admin credentials:"
        echo "  Username: ${WP_ADMIN_USER}"
        echo "  Password: ${WP_ADMIN_PASSWORD}"
        
        wp rewrite structure '/%postname%/' --hard --allow-root 2>/dev/null || true
        wp option update timezone_string 'UTC' --allow-root 2>/dev/null || true
        wp config set AUTOMATIC_UPDATER_DISABLED true --raw --type=constant --allow-root 2>/dev/null || true
        
        chown -R www-data:www-data /var/www/html
        
        echo "WordPress configuration complete!"
    else
        echo "WordPress is already installed. Skipping auto-install."
    fi

    # Sync WordPress URLs
    if [ -n "${WP_HOME:-}" ]; then
        WP_URL="${WP_HOME}"
    elif [ -n "${WORDPRESS_CONFIG_EXTRA:-}" ]; then
        WP_URL=$(echo "${WORDPRESS_CONFIG_EXTRA}" | grep -oP "define\('WP_HOME',\s*'[^']+" | grep -oP "'[^']+" | tail -1 | tr -d "'")
    fi

    if [ -n "${WP_URL:-}" ]; then
        echo "Syncing WordPress URL to: ${WP_URL}"
        CURRENT_HOME=$(wp option get home --allow-root 2>/dev/null || echo "")
        
        if [ "${CURRENT_HOME}" != "${WP_URL}" ]; then
            wp option update home "${WP_URL}" --allow-root 2>/dev/null || true
            wp option update siteurl "${WP_URL}" --allow-root 2>/dev/null || true
            wp rewrite flush --hard --allow-root 2>/dev/null || true
            echo "URLs updated!"
        fi
    fi

    # Configure MinIO/S3
    if [ -n "${S3_UPLOADS_ENDPOINT:-}" ] && [ -n "${S3_UPLOADS_BUCKET:-}" ]; then
        echo "Configuring MinIO/S3 storage..."
        
        if ! wp plugin is-installed s3-uploads --allow-root 2>/dev/null; then
            cd /tmp
            curl -sL -o s3-uploads.zip https://github.com/humanmade/S3-Uploads/archive/refs/heads/master.zip
            unzip -q s3-uploads.zip
            mv S3-Uploads-master /var/www/html/wp-content/plugins/s3-uploads
            chown -R www-data:www-data /var/www/html/wp-content/plugins/s3-uploads
            cd /var/www/html
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
