import pytest


def test_proration_estimate_known_case(client):
    payload = {
        "subscriber_id": "00000000-0000-0000-0000-000000000001",
        "subscription_id": "00000000-0000-0000-0000-000000000002",
        "from_plan_price": 300,
        "to_plan_price": 600,
        "current_period_start": "2026-01-01T00:00:00Z",
        "current_period_end": "2026-02-01T00:00:00Z",
        "effective_at": "2026-01-16T00:00:00Z",
        "mode": "immediate",
        "currency": "INR",
    }
    r = client.post(
        "/api/v1/billing/internal/proration/estimate",
        json=payload,
        headers={"X-Internal-API-Key": "dev-internal"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["breakdown"]["total_days"] == 31
    assert data["breakdown"]["remaining_days"] == 16
    assert data["old_unused_credit"] == pytest.approx(154.84, abs=0.01)
    assert data["new_remaining_charge"] == pytest.approx(309.68, abs=0.01)
    assert data["net_amount"] == pytest.approx(154.84, abs=0.01)


@pytest.mark.parametrize(
    "effective_at,expected_remaining",
    [
        ("2026-01-01T00:00:00Z", 31),
        ("2026-01-31T00:00:00Z", 1),
        ("2026-02-01T00:00:00Z", 0),
    ],
)
def test_proration_estimate_remaining_days(client, effective_at, expected_remaining):
    payload = {
        "subscriber_id": "00000000-0000-0000-0000-000000000001",
        "subscription_id": "00000000-0000-0000-0000-000000000002",
        "from_plan_price": 100,
        "to_plan_price": 100,
        "current_period_start": "2026-01-01T00:00:00Z",
        "current_period_end": "2026-02-01T00:00:00Z",
        "effective_at": effective_at,
        "mode": "immediate",
        "currency": "INR",
    }
    r = client.post(
        "/api/v1/billing/internal/proration/estimate",
        json=payload,
        headers={"X-Internal-API-Key": "dev-internal"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["breakdown"]["remaining_days"] == expected_remaining


def test_proration_estimate_invalid_period(client):
    payload = {
        "subscriber_id": "00000000-0000-0000-0000-000000000001",
        "subscription_id": "00000000-0000-0000-0000-000000000002",
        "from_plan_price": 100,
        "to_plan_price": 200,
        "current_period_start": "2026-02-01T00:00:00Z",
        "current_period_end": "2026-02-01T00:00:00Z",
        "effective_at": "2026-02-01T00:00:00Z",
        "mode": "immediate",
        "currency": "INR",
    }
    r = client.post(
        "/api/v1/billing/internal/proration/estimate",
        json=payload,
        headers={"X-Internal-API-Key": "dev-internal"},
    )
    assert r.status_code == 400


@pytest.mark.parametrize(
    "from_price,to_price,expected_net_sign",
    [
        (500, 500, 0),
        (500, 800, 1),
        (800, 500, -1),
        (0, 500, 1),
        (500, 0, -1),
        (999, 1000, 1),
        (1000, 999, -1),
        (1, 2, 1),
        (2, 1, -1),
        (299.99, 299.99, 0),
        (299.99, 399.99, 1),
        (399.99, 299.99, -1),
        (150, 151, 1),
        (151, 150, -1),
        (0, 0, 0),
    ],
)
def test_proration_estimate_net_signs(client, from_price, to_price, expected_net_sign):
    payload = {
        "subscriber_id": "00000000-0000-0000-0000-000000000001",
        "subscription_id": "00000000-0000-0000-0000-000000000002",
        "from_plan_price": from_price,
        "to_plan_price": to_price,
        "current_period_start": "2026-01-01T00:00:00Z",
        "current_period_end": "2026-02-01T00:00:00Z",
        "effective_at": "2026-01-16T00:00:00Z",
        "mode": "immediate",
        "currency": "INR",
    }
    r = client.post(
        "/api/v1/billing/internal/proration/estimate",
        json=payload,
        headers={"X-Internal-API-Key": "dev-internal"},
    )
    assert r.status_code == 200, r.text
    net = r.json()["net_amount"]
    if expected_net_sign == 0:
        assert abs(net) < 0.01
    elif expected_net_sign > 0:
        assert net > 0
    else:
        assert net < 0


