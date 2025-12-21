# WordPress PaaS - Custom WordPress Image
# This image includes WP-CLI for automated installation and MinIO/S3 storage integration

FROM wordpress:6.4-php8.2-apache

# Install dependencies for WP-CLI, Composer, and S3 storage
RUN apt-get update && apt-get install -y \
    less \
    mariadb-client \
    unzip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Create a non-root user for WP-CLI (WordPress runs as www-data)
RUN mkdir -p /var/www/.wp-cli/cache \
    && chown -R www-data:www-data /var/www/.wp-cli

# Pre-install S3-Uploads plugin with Composer dependencies
# Use --ignore-platform-reqs because dev dependencies have incompatible PHP requirements
RUN mkdir -p /opt/s3-uploads \
    && cd /opt/s3-uploads \
    && git clone --depth 1 https://github.com/humanmade/S3-Uploads.git . \
    && composer install --no-dev --optimize-autoloader --ignore-platform-reqs \
    && chown -R www-data:www-data /opt/s3-uploads

# Copy custom entrypoint script
COPY docker-entrypoint-custom.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-custom.sh

# Copy MinIO configuration script
COPY configure-minio.php /usr/local/bin/
RUN chmod +x /usr/local/bin/configure-minio.php

# Copy must-use plugins to /opt (will be copied to wp-content at runtime after volume mount)
COPY mu-plugins/ /opt/wp-paas-mu-plugins/

# Set entrypoint
ENTRYPOINT ["docker-entrypoint-custom.sh"]
CMD ["apache2-foreground"]

# Health check to verify WordPress is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

