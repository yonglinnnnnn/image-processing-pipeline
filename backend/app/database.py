import sqlite3
import logging

DB_PATH = "images.db"
logger = logging.getLogger(__name__)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            original_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'processing',
            processed_at TEXT,
            width INTEGER,
            height INTEGER,
            format TEXT,
            size_bytes INTEGER,
            caption TEXT,
            exif_data TEXT,
            processing_time_seconds REAL,
            error TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()
    logger.info("Database tables ensured")