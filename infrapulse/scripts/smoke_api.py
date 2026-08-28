# Smoke-test helper for InfraPulse backend.
# Usage (backend venv active): python ..\scripts\smoke_api.py

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"


def call(method: str, path: str) -> tuple[int, object]:
    request = urllib.request.Request(f"{BASE}{path}", method=method)
    request.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            payload = json.loads(body) if body else None
            return response.status, payload
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            payload = body
        return exc.code, payload


def main() -> int:
    checks = [
        ("GET", "/api/health"),
        ("GET", "/api/status"),
        ("POST", "/api/insights/generate"),
        ("GET", "/api/insights/today"),
        ("GET", "/api/insights"),
        ("GET", "/api/topics"),
        ("GET", "/api/settings"),
        ("POST", "/api/scheduler/run"),
    ]
    failed = 0
    for method, path in checks:
        status, payload = call(method, path)
        ok = 200 <= status < 300
        print(f"{method:6} {path:28} -> {status} {'OK' if ok else 'FAIL'}")
        if path == "/api/insights/today" and isinstance(payload, dict):
            print(f"         today title: {payload.get('title')}")
        if not ok:
            print(f"         {payload}")
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
