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
  info "Starting container..."
  docker compose up -d
  local ip; ip=$(detect_host_ip)
  info "Backend : http://${ip}:8000"
  info "Frontend: http://${ip}:5173"
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
  up            Start container in background
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
