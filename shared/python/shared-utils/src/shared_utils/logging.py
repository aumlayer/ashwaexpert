import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict


def configure_json_logger(name: str, level: str = "INFO") -> logging.Logger:
    logging.basicConfig(level=level, format="%(message)s")
    return logging.getLogger(name)


def build_log_event(
    *,
    service: str,
    environment: str,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    correlation_id: str,
    client_ip: str,
) -> Dict[str, Any]:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": service,
        "environment": environment,
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": duration_ms,
        "correlation_id": correlation_id,
        "client_ip": client_ip,
    }


def log_event(logger: logging.Logger, event: Dict[str, Any]) -> None:
    logger.info(json.dumps(event))
