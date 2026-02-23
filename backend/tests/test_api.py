import io
import pytest
from fastapi.testclient import TestClient
from main import app
from app.database import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def make_fake_image(name="test.jpg", fmt="JPEG"):
    from PIL import Image
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color=(255, 0, 0))
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf, name


def test_upload_valid_image():
    buf, name = make_fake_image()
    response = client.post("/api/images", files={"file": (name, buf, "image/jpeg")})
    assert response.status_code == 200
    data = response.json()
    assert "image_id" in data
    assert data["status"] in ("processing", "success")


def test_upload_invalid_format():
    buf = io.BytesIO(b"fake content")
    response = client.post("/api/images", files={"file": ("file.xlsx", buf, "application/octet-stream")})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "failed"
    assert "invalid file format" in data["error"]


def test_list_images():
    response = client.get("/api/images")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_image():
    response = client.get("/api/images/doesnotexist")
    assert response.status_code == 404


def test_stats():
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "failed" in data
    assert "success_rate" in data
    assert "average_processing_time_seconds" in data


def test_thumbnail_invalid_size():
    buf, name = make_fake_image()
    upload = client.post("/api/images", files={"file": (name, buf, "image/jpeg")})
    image_id = upload.json()["image_id"]
    response = client.get(f"/api/images/{image_id}/thumbnails/huge")
    assert response.status_code == 400