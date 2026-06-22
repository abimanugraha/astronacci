#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}==> $1${NC}"; }
warn()  { echo -e "${YELLOW}==> $1${NC}"; }
error() { echo -e "${RED}==> ERROR: $1${NC}" >&2; }

detect_host_ip() {
  local ip
  ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')
  if [ -z "$ip" ]; then
    ip=$(hostname -I 2>/dev/null | tr ' ' '\n' \
       | grep -vE '^(127\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::)' \
       | head -n1)
  fi
  echo "${ip:-localhost}"
}

ensure_frontend_env() {
  local env_file="frontend/.env"
  local ip; ip=$(detect_host_ip)
  local desired="VITE_API_BASE_URL=http://${ip}:8000"

  if [ ! -f "$env_file" ]; then
    info "Membuat ${env_file} -> ${desired}"
    echo "${desired}" > "$env_file"
    return
  fi

  if grep -q "^VITE_API_BASE_URL=http://${ip}:8000\$" "$env_file"; then
    info "frontend/.env sudah benar (IP: ${ip})"
    return
  fi

  if grep -q "^VITE_API_BASE_URL=" "$env_file"; then
    warn "Update VITE_API_BASE_URL -> http://${ip}:8000 di ${env_file}"
    sed -i "s|^VITE_API_BASE_URL=.*|${desired}|" "$env_file"
  else
    warn "Tambah ${desired} ke ${env_file}"
    echo "${desired}" >> "$env_file"
  fi
}

patch_cors() {
  local cors_file="backend/config/cors.php"
  local ip; ip=$(detect_host_ip)
  local origin="http://${ip}:5173"

  if [ ! -f "$cors_file" ]; then
    warn "File ${cors_file} tidak ditemukan, skip patch CORS"
    return
  fi

  if grep -q "'${origin}'" "$cors_file"; then
    info "CORS sudah include origin ${origin}"
    return
  fi

  local marker_ln
  marker_ln=$(grep -n "'allowed_origins'" "$cors_file" | head -n1 | cut -d: -f1)
  if [ -z "$marker_ln" ]; then
    warn "Marker 'allowed_origins' tidak ditemukan di ${cors_file}, skip"
    return
  fi
  local close_ln
  close_ln=$(awk -v start="$marker_ln" 'NR > start && /^[[:space:]]*\],[[:space:]]*$/ {print NR; exit}' "$cors_file")
  if [ -z "$close_ln" ]; then
    warn "Tidak bisa temukan penutup array allowed_origins, skip"
    return
  fi

  info "Menambahkan ${origin} ke allowed_origins di ${cors_file}"
  sed -i "${close_ln}i\\        '${origin}'," "$cors_file"
}

ensure_config() {
  ensure_frontend_env
  patch_cors
}

check_deps() {
  if ! command -v docker >/dev/null 2>&1; then
    error "Docker tidak ditemukan. Install: https://docs.docker.com/get-docker/"
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose v2 tidak ditemukan. Install: https://docs.docker.com/compose/install/"
    exit 1
  fi
}

cmd_build() {
  info "Building Docker image..."
  docker compose build
}

cmd_up() {
  ensure_config
  info "Starting container..."
  docker compose up -d
  local ip; ip=$(detect_host_ip)
  info "Backend : http://${ip}:8000"
  info "Frontend: http://${ip}:5173"
}

cmd_config() {
  ensure_config
  if docker compose ps app 2>/dev/null | grep -q "astronacci-app"; then
    info "Container sedang berjalan — restart agar perubahan efektif:"
    info "  ./setup.sh down && ./setup.sh up   (atau)   docker compose restart"
  fi
}

cmd_down() {
  info "Stopping container..."
  docker compose down
}

cmd_logs() {
  docker compose logs -f
}

cmd_ssh() {
  docker compose exec app bash || docker compose exec app sh
}

cmd_fresh() {
  warn "Resetting database (migrate:fresh)..."
  docker compose exec app php /app/backend/artisan migrate:fresh --force
}

cmd_clean() {
  warn "Removing containers, volumes, and local images..."
  docker compose down -v --rmi local
}

cmd_help() {
  cat <<EOF
Usage: ./setup.sh [command]

Commands:
  (no command)  build + up (first-time setup)
  build         Build Docker image
  up            Start container in background (auto-generate frontend/.env & patch CORS)
  config        Generate frontend/.env & patch CORS tanpa start container
  down          Stop container
  logs          Tail container logs (Ctrl+C to exit)
  ssh           Masuk ke shell container
  fresh         Reset database (php artisan migrate:fresh)
  clean         Remove containers + volumes + local image
  help          Tampilkan pesan ini
EOF
}

main() {
  check_deps
  local cmd="${1:-default}"
  case "$cmd" in
    build)  cmd_build ;;
    up)     cmd_up ;;
    config) cmd_config ;;
    down)   cmd_down ;;
    logs)   cmd_logs ;;
    ssh)    cmd_ssh ;;
    fresh)  cmd_fresh ;;
    clean)  cmd_clean ;;
    help|-h|--help) cmd_help ;;
    default) cmd_build && cmd_up ;;
    *) error "Unknown command: $cmd"; echo ""; cmd_help; exit 1 ;;
  esac
}

main "$@"
