# k3s deployment (single-node)

This repo is designed to run on a single-node k3s cluster (e.g. a VPS).

## Prerequisites

- k3s installed and running
- `kubectl` configured for the cluster
- StorageClass `local-path` available (default on k3s)

## Build and load images

Manifests reference images like `ashva/<service>:latest` with `imagePullPolicy: IfNotPresent`.

On a single-node k3s setup, you can build images directly on the node so containerd can use them.

From the repo root on the k3s node:

- Build all service images:
  - `docker build -t ashva/gateway-service:latest services/gateway-service`
  - `docker build -t ashva/auth-service:latest services/auth-service`
  - `docker build -t ashva/lead-service:latest services/lead-service`
  - `docker build -t ashva/content-service:latest services/content-service`
  - `docker build -t ashva/subscriber-service:latest services/subscriber-service`
  - `docker build -t ashva/coupon-service:latest services/coupon-service`
  - `docker build -t ashva/plan-service:latest services/plan-service`
  - `docker build -t ashva/subscription-service:latest services/subscription-service`
  - `docker build -t ashva/billing-service:latest services/billing-service`
  - `docker build -t ashva/payment-service:latest services/payment-service`
  - `docker build -t ashva/ticket-service:latest services/ticket-service`
  - `docker build -t ashva/assignment-service:latest services/assignment-service`
  - `docker build -t ashva/media-service:latest services/media-service`
  - `docker build -t ashva/notification-service:latest services/notification-service`
  - `docker build -t ashva/reporting-service:latest services/reporting-service`
  - `docker build -t ashva/audit-service:latest services/audit-service`

If your cluster cannot see local Docker images (containerd), export and import images:

- `docker save ashva/gateway-service:latest | sudo k3s ctr images import -`

Repeat for each image.

## Configure secrets

`infra/k8s/02-secrets-template.yaml` is a template only.

Create a real secret file (do not commit real secrets):

- Copy `infra/k8s/02-secrets-template.yaml` to `infra/k8s/02-secrets.yaml`
- Replace `CHANGEME` values

## Apply manifests

Apply everything:

- `kubectl apply -f infra/k8s/00-namespace.yaml`
- `kubectl apply -f infra/k8s/01-configmap.yaml`
- `kubectl apply -f infra/k8s/02-secrets.yaml`
- `kubectl apply -f infra/k8s/10-postgres.yaml`
- `kubectl apply -f infra/k8s/11-redis.yaml`
- `kubectl apply -f infra/k8s/12-minio.yaml`
- `kubectl apply -f infra/k8s/20-*.yaml`
- `kubectl apply -f infra/k8s/30-gateway.yaml`
- `kubectl apply -f infra/k8s/40-ingress.yaml`

Check status:

- `kubectl get pods -n ashva`
- `kubectl get svc -n ashva`

## Access the gateway

### Option A: Port-forward (recommended for smoke testing)

- `kubectl port-forward -n ashva svc/gateway-service 8080:80`

Then:

- `http://localhost:8080/health`
- `http://localhost:8080/ready`
- `http://localhost:8080/live`

### Option B: Ingress

If you have Traefik configured with a LoadBalancer or NodePort, access via the node IP.

## Troubleshooting

- If a service crashes immediately, check logs:
  - `kubectl logs -n ashva deploy/<service-name>`
- If a service cannot connect to Postgres, confirm `DATABASE_URL` in the secret uses `postgres:5432`.
- Many services run Alembic migrations on startup; the first boot may take longer.
