"""
SQLite database setup for BimaSetu.
Stores farmer claims, analysis results, and generated PDF metadata.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "./bimasetu.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS claims (
            id          TEXT PRIMARY KEY,
            uid         TEXT NOT NULL,
            display_name TEXT,
            lat         REAL,
            lng         REAL,
            timestamp   TEXT NOT NULL,
            image_path  TEXT,
            mask_path   TEXT,
            pdf_path    TEXT,
            damage_pct  REAL,
            damage_type TEXT,
            confidence  REAL,
            status      TEXT DEFAULT 'processing',
            created_at  TEXT DEFAULT (datetime('now'))
        )
    """)

    conn.commit()
    conn.close()
