# Smoke tests

Smoke tests validate a minimal API flow end-to-end through the gateway.

## What the smoke test does

- `GET /health`
- `GET /ready`
- `GET /live`
- `POST /api/v1/leads` (public lead capture)

## Docker Compose

- `make smoke-compose`

This starts the full compose stack, runs the smoke test against `http://localhost:8080` (Nginx -> gateway), then tears down.

## k3s

Prerequisite: manifests applied and `gateway-service` running in namespace `ashva`.

- `make smoke-k3s`

This port-forwards `svc/gateway-service` to `localhost:8080` and runs the same smoke sequence.
