import os
import uuid
import time
import logging
import json
from datetime import datetime, timezone
from PIL import Image, ExifTags
from app.database import get_connection

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
THUMBNAIL_DIR = "thumbnails"
ALLOWED_FORMATS = {"jpg", "jpeg", "png"}
THUMBNAIL_SIZES = {
    "small": (150, 150),
    "medium": (400, 400),
}

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)


def get_image_record(image_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM images WHERE id = ?", (image_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_images():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM images ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def format_response(record: dict, base_url: str = "http://localhost:8000"):
    image_id = record["id"]
    metadata = {}
    thumbnails = {}

    if record["status"] == "success":
        metadata = {
            "width": record.get("width"),
            "height": record.get("height"),
            "format": record.get("format"),
            "size_bytes": record.get("size_bytes"),
        }
        if record.get("exif_data"):
            try:
                metadata["exif"] = json.loads(record["exif_data"])
            except Exception:
                pass
        if record.get("caption"):
            metadata["caption"] = record["caption"]

        thumbnails = {
            "small": f"{base_url}/api/images/{image_id}/thumbnails/small",
            "medium": f"{base_url}/api/images/{image_id}/thumbnails/medium",
        }

    return {
        "status": record["status"],
        "data": {
            "image_id": image_id,
            "original_name": record["original_name"],
            "processed_at": record.get("processed_at"),
            "metadata": metadata,
            "thumbnails": thumbnails,
        },
        "error": record.get("error"),
    }


def extract_exif(img: Image.Image) -> dict:
    exif_data = {}
    try:
        raw_exif = img._getexif()
        if raw_exif:
            for tag_id, value in raw_exif.items():
                tag = ExifTags.TAGS.get(tag_id, str(tag_id))
                if isinstance(value, bytes):
                    value = value.decode(errors="replace")
                exif_data[tag] = str(value)
    except Exception as e:
        logger.warning(f"EXIF extraction failed: {e}")
    return exif_data


def generate_caption(image_path: str) -> str:
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        import torch

        logger.info("Loading BLIP model for captioning...")
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

        img = Image.open(image_path).convert("RGB")
        inputs = processor(img, return_tensors="pt")
        with torch.no_grad():
            output = model.generate(**inputs, max_new_tokens=50)
        caption = processor.decode(output[0], skip_special_tokens=True)
        logger.info(f"Caption generated: {caption}")
        return caption
    except Exception as e:
        logger.error(f"Captioning failed: {e}")
        return ""


def process_image(image_id: str, file_path: str, original_name: str):
    """Full processing pipeline — runs in background."""
    start_time = time.time()
    conn = get_connection()

    try:
        logger.info(f"Processing image {image_id}: {original_name}")

        img = Image.open(file_path)
        width, height = img.size
        fmt = img.format.lower() if img.format else original_name.rsplit(".", 1)[-1].lower()
        size_bytes = os.path.getsize(file_path)
        exif_data = extract_exif(img)

        # Generate thumbnails
        for size_name, dims in THUMBNAIL_SIZES.items():
            thumb = img.copy()
            thumb.thumbnail(dims, Image.LANCZOS)
            thumb_path = os.path.join(THUMBNAIL_DIR, f"{image_id}_{size_name}.jpg")
            thumb.convert("RGB").save(thumb_path, "JPEG")
            logger.info(f"Thumbnail saved: {thumb_path}")

        # AI captioning
        caption = generate_caption(file_path)

        processing_time = time.time() - start_time
        processed_at = datetime.now(timezone.utc).isoformat()

        conn.execute("""
            UPDATE images SET
                status = 'success',
                processed_at = ?,
                width = ?, height = ?, format = ?, size_bytes = ?,
                caption = ?, exif_data = ?,
                processing_time_seconds = ?, error = NULL
            WHERE id = ?
        """, (
            processed_at, width, height, fmt, size_bytes,
            caption, json.dumps(exif_data) if exif_data else None,
            processing_time, image_id
        ))
        conn.commit()
        logger.info(f"Image {image_id} processed successfully in {processing_time:.2f}s")

    except Exception as e:
        logger.error(f"Processing failed for {image_id}: {e}")
        conn.execute("""
            UPDATE images SET status = 'failed', error = ? WHERE id = ?
        """, (str(e), image_id))
        conn.commit()
    finally:
        conn.close()