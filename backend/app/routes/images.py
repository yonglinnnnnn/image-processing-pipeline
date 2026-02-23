import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from app.database import get_connection
from app.services.image_service import (
    process_image, get_image_record, get_all_images,
    format_response, UPLOAD_DIR, THUMBNAIL_DIR, ALLOWED_FORMATS
)
from PIL import Image as PILImage

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/images")
async def upload_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Validate extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_FORMATS:
        image_id = str(uuid.uuid4())[:8]
        processed_at = datetime.now(timezone.utc).isoformat()
        conn = get_connection()
        conn.execute(
            "INSERT INTO images (id, original_name, status, error, processed_at) VALUES (?, ?, 'failed', ?, ?)",
            (image_id, file.filename, "invalid file format", processed_at)
        )
        conn.commit()
        conn.close()
        return {"image_id": image_id, "status": "failed", "error": "invalid file format"}

    image_id = str(uuid.uuid4())[:8]
    file_path = os.path.join(UPLOAD_DIR, f"{image_id}.{ext}")

    # Save file
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Validate actual file format using Pillow
    try:
        with PILImage.open(file_path) as img:
            real_fmt = img.format.lower() if img.format else ""
            if real_fmt not in ("jpeg", "png"):
                raise ValueError(f"Unsupported image format: {real_fmt}")
    except Exception:
        os.remove(file_path)
        processed_at = datetime.now(timezone.utc).isoformat()
        conn = get_connection()
        conn.execute(
            "INSERT INTO images (id, original_name, status, error, processed_at) VALUES (?, ?, 'failed', ?, ?)",
            (image_id, file.filename, "invalid file format", processed_at)
        )
        conn.commit()
        conn.close()
        return {"image_id": image_id, "status": "failed", "error": "invalid file format"}

    # Insert pending record
    conn = get_connection()
    conn.execute(
        "INSERT INTO images (id, original_name, status) VALUES (?, ?, 'processing')",
        (image_id, file.filename)
    )
    conn.commit()
    conn.close()

    # Process in background
    background_tasks.add_task(process_image, image_id, file_path, file.filename)
    logger.info(f"Image {image_id} queued for processing")

    return {"image_id": image_id, "status": "processing"}

@router.get("/images")
async def list_images():
    records = get_all_images()
    return [format_response(r) for r in records]


@router.get("/images/{image_id}")
async def get_image(image_id: str):
    record = get_image_record(image_id)
    if not record:
        raise HTTPException(status_code=404, detail="Image not found")
    return format_response(record)


@router.get("/images/{image_id}/thumbnails/{size}")
async def get_thumbnail(image_id: str, size: str):
    if size not in ("small", "medium"):
        raise HTTPException(status_code=400, detail="Size must be 'small' or 'medium'")

    record = get_image_record(image_id)
    if not record:
        raise HTTPException(status_code=404, detail="Image not found")
    if record["status"] != "success":
        raise HTTPException(status_code=400, detail="Image not yet processed")

    thumb_path = os.path.join(THUMBNAIL_DIR, f"{image_id}_{size}.jpg")
    if not os.path.exists(thumb_path):
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    return FileResponse(thumb_path, media_type="image/jpeg")