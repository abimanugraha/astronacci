#!/bin/sh
set -e

echo "==> Installing backend dependencies..."
cd /app/backend
if [ ! -d vendor ]; then
  composer install --no-interaction
fi

echo "==> Initializing backend .env..."
if [ ! -f .env ]; then
  cp .env.example .env
fi
if ! grep -q "^APP_KEY=base64:" .env; then
  php artisan key:generate --no-interaction
fi

echo "==> Preparing SQLite..."
touch database/database.sqlite
chmod -R 775 storage bootstrap/cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Installing frontend dependencies..."
cd /app/frontend
if [ ! -d node_modules ]; then
  npm install
fi

echo "==> Starting supervisord..."
exec "$@"
