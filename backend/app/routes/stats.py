import logging
from fastapi import APIRouter
from app.database import get_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/stats")
async def get_stats():
    conn = get_connection()
    rows = conn.execute("SELECT status, processing_time_seconds FROM images").fetchall()
    conn.close()

    total = len(rows)
    failed = sum(1 for r in rows if r["status"] == "failed")
    success = sum(1 for r in rows if r["status"] == "success")
    times = [r["processing_time_seconds"] for r in rows if r["processing_time_seconds"] is not None]

    success_rate = f"{(success / total * 100):.2f}%" if total > 0 else "0%"
    avg_time = round(sum(times) / len(times), 2) if times else 0

    logger.info("Stats endpoint called")
    return {
        "total": total,
        "failed": failed,
        "success_rate": success_rate,
        "average_processing_time_seconds": avg_time,
    }