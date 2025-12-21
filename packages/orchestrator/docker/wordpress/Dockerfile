FROM wordpress:6.4-php8.2-apache

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Copy auto-install script
COPY wp-auto-install.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wp-auto-install.sh

# Copy custom entrypoint wrapper
COPY docker-entrypoint-wrapper.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-wrapper.sh

# Create mu-plugins directory and copy URL fixer plugin
RUN mkdir -p /var/www/html/wp-content/mu-plugins
COPY wp-paas-url-fixer.php /var/www/html/wp-content/mu-plugins/

ENTRYPOINT ["docker-entrypoint-wrapper.sh"]
CMD ["apache2-foreground"]
