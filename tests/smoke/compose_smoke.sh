#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose/docker-compose.yml"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down
}
trap cleanup EXIT

docker compose -f "$COMPOSE_FILE" up -d

python "$ROOT_DIR/tests/smoke/smoke.py" "http://localhost:8080"
