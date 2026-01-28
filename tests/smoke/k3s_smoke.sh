#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

kubectl -n ashva port-forward svc/gateway-service 8080:80 >/tmp/ashva-portforward.log 2>&1 &
PF_PID=$!

cleanup() {
  kill "$PF_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

python "$ROOT_DIR/tests/smoke/smoke.py" "http://localhost:8080"
