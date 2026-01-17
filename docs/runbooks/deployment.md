# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Service health checks passing
- [ ] Backup of current production data
- [ ] Rollback plan prepared

## Deployment Steps

1. **Backup Current State**
   ```bash
   ./infra/scripts/backup.sh
   ```

2. **Run Database Migrations**
   ```bash
   # For each service
   cd services/{service-name}
   alembic upgrade head
   ```

3. **Build and Deploy Services**
   ```bash
   docker-compose -f infra/docker-compose/docker-compose.yml build
   docker-compose -f infra/docker-compose/docker-compose.yml up -d
   ```

4. **Verify Health Checks**
   ```bash
   # Check all service health endpoints
   curl http://localhost:8000/health
   ```

5. **Monitor Logs**
   ```bash
   docker-compose logs -f
   ```

## Rollback Procedure

1. Stop new containers
2. Restore database backup
3. Start previous version containers
4. Verify system is operational

## Post-Deployment

- Monitor error rates
- Check service metrics
- Verify critical user flows
- Review logs for errors
