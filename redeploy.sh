#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "docker daemon not running — start it first (sudo systemctl start docker)" >&2
  exit 1
fi

mkdir -p backups
echo "backing up database volume → backups/"
docker run --rm -v daisy-data:/data -v "$PWD/backups:/backups" alpine \
  tar czf "/backups/daisy-$(date +%Y-%m-%d_%H%M%S).tar.gz" -C /data .

echo "pulling images…"
docker compose pull

echo "recreating containers…"
docker compose up -d --no-build --remove-orphans

echo "pruning old images…"
docker image prune -f

docker compose ps