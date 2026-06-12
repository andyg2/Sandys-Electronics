# Edge Devices Inventory - php-apache image
FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql \
 && a2enmod rewrite headers \
 && rm -rf /var/lib/apt/lists/*

COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/init.sh     /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh

WORKDIR /var/www/html

# inventory/ is bind-mounted in docker-compose so live edits show up
# immediately. The image carries everything else (PHP, Apache, modules).

EXPOSE 80
CMD ["/usr/local/bin/init.sh"]
