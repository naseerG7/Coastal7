from fastapi.testclient import TestClient

from app.main import app


def test_websocket_echo_broadcast():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/notifications") as websocket:
            websocket.send_text("hello")
            data = websocket.receive_json()
            assert data == {"type": "message", "message": "hello"}
