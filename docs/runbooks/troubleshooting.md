# Troubleshooting Guide

## Common Issues

### Service Not Starting

**Symptoms**: Container exits immediately

**Diagnosis**:
1. Check container logs: `docker logs <container-name>`
2. Verify environment variables are set
3. Check database connectivity

**Resolution**:
- Review service logs for specific errors
- Verify all required environment variables
- Check service dependencies are running

### Database Connection Errors

**Symptoms**: Services cannot connect to PostgreSQL

**Diagnosis**:
1. Verify PostgreSQL is running: `docker ps | grep postgres`
2. Check DATABASE_URL environment variable
3. Test connection: `psql -U ashva -d ashva_db`

**Resolution**:
- Restart PostgreSQL container
- Verify network connectivity
- Check database credentials

### High Error Rates

**Symptoms**: Increased 5xx errors in gateway

**Diagnosis**:
1. Check Prometheus metrics
2. Review service logs
3. Check downstream service health

**Resolution**:
- Identify failing service
- Check service resource usage
- Scale service if needed
- Review recent deployments

### Payment Webhook Failures

**Symptoms**: Payments not being processed

**Diagnosis**:
1. Check payment-service logs
2. Verify webhook endpoint is accessible
3. Check Cashfree webhook configuration

**Resolution**:
- Verify webhook signature validation
- Check idempotency handling
- Review webhook event logs

## Log Locations

- Service logs: `docker logs <service-name>`
- Nginx logs: `/var/log/nginx/`
- Application logs: Service stdout/stderr (JSON format)

## Getting Help

1. Check service-specific README.md runbook section
2. Review architecture documentation
3. Check service health endpoints
4. Review Prometheus/Grafana dashboards
