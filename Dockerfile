FROM php:8.2-fpm-alpine

# System dependencies + Node.js
RUN apk add --no-cache \
    git \
    unzip \
    bash \
    supervisor \
    libzip-dev \
    libpng-dev \
    icu-dev \
    oniguruma-dev \
    libxml2-dev \
    sqlite-dev \
    nodejs \
    npm

# PHP extensions (Laravel 12 requirements + extras)
RUN docker-php-ext-install -j$(nproc) \
    pdo_sqlite \
    pdo_mysql \
    mbstring \
    xml \
    ctype \
    bcmath \
    fileinfo \
    zip \
    pcntl \
    intl

# Composer (multi-stage copy from official image)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Supervisor config
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf

# Entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /app

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
