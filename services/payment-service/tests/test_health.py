def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_ready(client):
    resp = client.get("/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"


def test_live(client):
    resp = client.get("/live")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "live"
