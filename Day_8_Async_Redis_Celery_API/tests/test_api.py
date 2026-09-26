from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_cached_data():
    r = client.get("/cached-data?key=test")
    assert r.status_code == 200
    assert "source" in r.json()
