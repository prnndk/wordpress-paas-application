# WordPress PaaS - Custom WordPress Image
# This image includes WP-CLI for automated installation and MinIO/S3 storage integration

FROM wordpress:6.4-php8.2-apache

# Install dependencies for WP-CLI and S3 storage
RUN apt-get update && apt-get install -y \
    less \
    mariadb-client \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Create a non-root user for WP-CLI (WordPress runs as www-data)
RUN mkdir -p /var/www/.wp-cli/cache \
    && chown -R www-data:www-data /var/www/.wp-cli

# Copy custom entrypoint script
COPY docker-entrypoint-custom.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-custom.sh

# Copy MinIO configuration script
COPY configure-minio.php /usr/local/bin/
RUN chmod +x /usr/local/bin/configure-minio.php

# Copy must-use plugins for path-based routing fix
COPY mu-plugins/ /var/www/html/wp-content/mu-plugins/
RUN chown -R www-data:www-data /var/www/html/wp-content/mu-plugins/

# Set entrypoint
ENTRYPOINT ["docker-entrypoint-custom.sh"]
CMD ["apache2-foreground"]

# Health check to verify WordPress is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/ || exit 1
