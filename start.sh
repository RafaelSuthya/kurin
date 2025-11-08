#!/usr/bin/env bash
set -euo pipefail

echo "[start.sh] Begin setup"

# 1) Install backend deps
if [ -f composer.json ]; then
  echo "[start.sh] Composer install"
  composer install --no-dev --prefer-dist --no-interaction
fi

# 2) Cache Laravel configs/routes/views jika tersedia
if [ -f artisan ]; then
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
fi

# 3) Build frontend (React) dan salin hasil ke public
if [ -d frontend ]; then
  echo "[start.sh] Build frontend"
  cd frontend
  npm ci
  npm run build
  cd ..
  echo "[start.sh] Copy build to public"
  mkdir -p public
  cp -r frontend/build/* public/
fi

# 4) Laravel storage link & migrate
if [ -f artisan ]; then
  php artisan storage:link || true
  php artisan migrate --force || true
fi

echo "[start.sh] Starting PHP server"
# 5) Jalankan server PHP built-in dengan router khusus agar API Laravel & SPA React jalan
php -S 0.0.0.0:${PORT:-8080} -t public server.php