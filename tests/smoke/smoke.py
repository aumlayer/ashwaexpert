import json
import sys
import time
import urllib.error
import urllib.request


def _urljoin(base_url: str, path: str) -> str:
    return base_url.rstrip("/") + "/" + path.lstrip("/")


def _request(method: str, url: str, *, headers: dict[str, str] | None = None, body: object | None = None):
    data = None
    req_headers = {"Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")

    req = urllib.request.Request(url, method=method, data=data, headers=req_headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
            ct = resp.headers.get("content-type", "")
            if "application/json" in ct:
                return resp.status, json.loads(raw.decode("utf-8") or "{}")
            return resp.status, raw.decode("utf-8")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            return e.code, raw.decode("utf-8", errors="replace")


def _wait_http_ok(url: str, timeout_s: int = 120) -> None:
    deadline = time.time() + timeout_s
    last = None
    while time.time() < deadline:
        try:
            status, _ = _request("GET", url)
            if status == 200:
                return
            last = f"status={status}"
        except Exception as e:
            last = str(e)
        time.sleep(2)
    raise RuntimeError(f"Timed out waiting for {url} ({last})")


def main() -> int:
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"

    _wait_http_ok(_urljoin(base_url, "/health"), timeout_s=180)

    for path in ("/health", "/ready", "/live"):
        status, payload = _request("GET", _urljoin(base_url, path))
        if status != 200:
            print(f"FAIL {path} status={status} payload={payload}")
            return 1

    lead_req = {
        "name": "Smoke Test",
        "email": "smoke@example.com",
        "phone": "+910000000000",
        "company": "Smoke",
        "message": "smoke",
        "source": "other",
    }
    status, payload = _request("POST", _urljoin(base_url, "/api/v1/leads"), body=lead_req)
    if status not in (200, 201):
        print(f"FAIL create lead status={status} payload={payload}")
        return 1

    lead_id = None
    if isinstance(payload, dict):
        lead_id = payload.get("id")
    print("OK smoke", {"lead_id": lead_id})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
