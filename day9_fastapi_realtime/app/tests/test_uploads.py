from io import BytesIO

from PIL import Image


def make_image() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (200, 100), "white").save(buffer, format="PNG")
    return buffer.getvalue()


def test_upload_valid_image(client):
    response = client.post(
        "/api/upload",
        files={"file": ("test.png", make_image(), "image/png")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["filename"].endswith(".png")
    assert body["width"] == 200
    assert body["height"] == 100


def test_upload_rejects_invalid_content_type(client):
    response = client.post(
        "/api/upload",
        files={"file": ("test.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400
    assert "Only JPEG" in response.json()["detail"]


def test_upload_rejects_fake_image(client):
    response = client.post(
        "/api/upload",
        files={"file": ("fake.png", b"not-an-image", "image/png")},
    )
    assert response.status_code == 400
    assert "valid image" in response.json()["detail"]


def test_uploaded_file_can_be_downloaded(client):
    upload = client.post(
        "/api/upload",
        files={"file": ("test.png", make_image(), "image/png")},
    )
    filename = upload.json()["filename"]
    response = client.get(f"/api/uploads/{filename}")
    assert response.status_code == 200


def test_missing_uploaded_file_returns_404(client):
    response = client.get("/api/uploads/missing.png")
    assert response.status_code == 404
