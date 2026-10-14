
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.rate_limiter import limiter


@pytest.fixture(scope="module")
def client():
    # Keep one event loop alive for all requests in this module.
    with TestClient(app) as test_client:
        yield test_client


def test_login_rate_limit(client):
    limiter.reset()

    payload = {
        "username": "rate-limit-test@example.com",
        "password": "WrongPassword@123",
    }

    # The first five requests should reach the login handler.
    for _ in range(5):
        response = client.post("/auth/login", data=payload)
        assert response.status_code != 429, response.text

    # The sixth request should be rate limited.
    response = client.post("/auth/login", data=payload)
    assert response.status_code == 429, response.text


def test_registration_rate_limit(client):
    limiter.reset()

    payload = {
        "name": "Rate Limit Test",
        "email": "rate-limit-automated-test@example.com",
        "password": "TestUser@123",
        "role": "customer",
    }

    # Requests may succeed or report that the email already exists.
    # Neither outcome should be a rate-limit response during the first five.
    for _ in range(5):
        response = client.post("/auth/register", json=payload)
        assert response.status_code != 429, response.text

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 429, response.text
