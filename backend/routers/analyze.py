"""
backend/routers/analyze.py

POST /api/analyze — accepts a crop photo + metadata,
runs segmentation + classification, generates PDF,
and persists the claim to SQLite.
"""

import logging
import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from database import get_connection, init_db
# Production inference via Groq API (showcase modules kept in ml/ for demos)
from ml.groq_vision import segment_damage, classify_damage, predict_crop_field
from pdf.generator import generate_claim_pdf

logger = logging.getLogger("bimasetu.analyze")
router = APIRouter()

# Ensure DB is ready
init_db()

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


@router.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    lat: float = Form(0.0),
    lng: float = Form(0.0),
    timestamp: str = Form(default_factory=lambda: datetime.utcnow().isoformat()),
    uid: str = Form("anonymous"),
    display_name: str = Form("Farmer"),
    claim_id: str = Form(default_factory=lambda: uuid.uuid4().hex),
):
    """
    Full pipeline:
    1. Save uploaded image
    2. Groq vision segmentation → damage_pct
    3. Groq vision classification → damage_type
    4. PDF generation
    5. Persist to SQLite
    6. Return enriched JSON response
    """
    try:
        # --- 1. Save image to disk --------------------------------
        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image file")

        # --- Validation: Geo-tag Check ---
        if not lat or not lng or lat == 0.0 or lng == 0.0:
            logger.warning("Geo-tag validation failed: lat=%s, lng=%s", lat, lng)
            return {
                "success": False,
                "data": {},
                "error": "Geo-tag missing. Capture photo using live camera."
            }

        # --- Validation: Crop Field Check ---
        is_crop, crop_conf = predict_crop_field(image_bytes)
        if not is_crop:
            logger.warning("Crop field validation failed: confidence=%s", crop_conf)
            return {
                "success": False,
                "data": {},
                "error": "Please upload crop field image only."
            }

        ext = Path(image.filename or "upload.jpg").suffix or ".jpg"
        img_filename = f"{claim_id}{ext}"
        img_path = UPLOAD_DIR / img_filename
        img_path.write_bytes(image_bytes)
        logger.info("Saved uploaded image: %s (%d bytes)", img_path, len(image_bytes))

        # --- 2. Segmentation ------------------------------------
        seg_result = segment_damage(image_bytes)
        damage_pct = seg_result["damage_pct"]
        mask_path  = seg_result["mask_path"]
        seg_method = seg_result["method"]
        logger.info("Segmentation: %.1f%% damage (%s)", damage_pct, seg_method)

        # --- 3. Classification ----------------------------------
        cls_result  = classify_damage(image_bytes)
        damage_type = cls_result["damage_type"]
        confidence  = cls_result["confidence"]
        cls_method  = cls_result["method"]
        logger.info("Classification: %s @ %.2f (%s)", damage_type, confidence, cls_method)

        # --- 4. PDF generation ----------------------------------
        pdf_path = generate_claim_pdf(
            claim_id=claim_id,
            uid=uid,
            display_name=display_name,
            lat=lat,
            lng=lng,
            timestamp=timestamp,
            damage_pct=damage_pct,
            damage_type=damage_type,
            confidence=confidence,
            original_image_path=str(img_path),
            mask_image_path=mask_path,
        )
        logger.info("PDF generated: %s", pdf_path)

        # --- 5. Persist to SQLite --------------------------------
        conn = get_connection()
        conn.execute(
            """INSERT OR REPLACE INTO claims
               (id, uid, display_name, lat, lng, timestamp,
                image_path, mask_path, pdf_path,
                damage_pct, damage_type, confidence, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'completed')""",
            (
                claim_id, uid, display_name, lat, lng, timestamp,
                str(img_path), mask_path, pdf_path,
                damage_pct, damage_type, confidence,
            ),
        )
        conn.commit()
        conn.close()

        # --- 6. Build response ----------------------------------
        return {
            "success": True,
            "data": {
                "claim_id":    claim_id,
                "damage_pct":  damage_pct,
                "damage_type": damage_type,
                "confidence":  confidence,
                "mask_url":    f"{BASE_URL}/{mask_path}",
                "image_url":   f"{BASE_URL}/static/uploads/{img_filename}",
                "pdf_url":     f"{BASE_URL}/{pdf_path}",
                "seg_method":  seg_method,
                "cls_method":  cls_method,
                "status":      "completed",
            },
            "error": "",
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Analysis pipeline failed: %s", exc)
        # Persist as failed
        try:
            conn = get_connection()
            conn.execute(
                """INSERT OR IGNORE INTO claims
                   (id, uid, display_name, lat, lng, timestamp, status)
                   VALUES (?,?,?,?,?,?,'failed')""",
                (claim_id, uid, display_name, lat, lng, timestamp),
            )
            conn.commit()
            conn.close()
        except Exception:
            pass
        return {"success": False, "data": {}, "error": str(exc)}
