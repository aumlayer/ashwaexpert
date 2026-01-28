import sys
from pathlib import Path

import pytest
from fastapi import HTTPException


def _import_helpers():
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
    import main as payment_main  # type: ignore
    from app.models import PaymentGatewayConfig  # type: ignore

    return payment_main, PaymentGatewayConfig


def test_cashfree_headers_requires_credentials():
    payment_main, PaymentGatewayConfig = _import_helpers()
    cfg = PaymentGatewayConfig(provider="cashfree", mode="sandbox", is_active=True, credentials={}, updated_at=None)  # type: ignore[arg-type]
    with pytest.raises(HTTPException) as e:
        payment_main._cashfree_headers(cfg)  # type: ignore[attr-defined]
    assert e.value.status_code == 400


def test_cashfree_base_url_env_override(monkeypatch):
    payment_main, PaymentGatewayConfig = _import_helpers()
    monkeypatch.setattr(payment_main, "CASHFREE_API_BASE", "https://example.com/pg")
    cfg = PaymentGatewayConfig(provider="cashfree", mode="sandbox", is_active=True, credentials={}, updated_at=None)  # type: ignore[arg-type]
    assert payment_main._cashfree_base_url(cfg) == "https://example.com/pg"


@pytest.mark.parametrize(
    "mode,expected_prefix",
    [
        ("sandbox", "https://sandbox.cashfree.com/pg"),
        ("live", "https://api.cashfree.com/pg"),
    ],
)
def test_cashfree_base_url_defaults_by_mode(monkeypatch, mode, expected_prefix):
    payment_main, PaymentGatewayConfig = _import_helpers()
    monkeypatch.setattr(payment_main, "CASHFREE_API_BASE", "")
    cfg = PaymentGatewayConfig(provider="cashfree", mode=mode, is_active=True, credentials={}, updated_at=None)  # type: ignore[arg-type]
    assert payment_main._cashfree_base_url(cfg).startswith(expected_prefix)


def test_cashfree_headers_accepts_alt_keys():
    payment_main, PaymentGatewayConfig = _import_helpers()
    cfg = PaymentGatewayConfig(
        provider="cashfree",
        mode="sandbox",
        is_active=True,
        credentials={"app_id": "x", "secret_key": "y", "api_version": "2022-09-01"},
        updated_at=None,  # type: ignore[arg-type]
    )
    headers = payment_main._cashfree_headers(cfg)  # type: ignore[attr-defined]
    assert headers["x-client-id"] == "x"
    assert headers["x-client-secret"] == "y"


