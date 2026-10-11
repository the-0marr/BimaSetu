"""
backend/ml/groq_vision.py

Production inference via Groq vision API.
The local ml/*.py modules remain as showcase / offline fallbacks.

Models:
  - meta-llama/llama-4-scout-17b-16e-instruct — crop validation, damage %, classification
"""

import base64
import hashlib
import json
import logging
import os
import re
from io import BytesIO

import cv2
import numpy as np
from PIL import Image

from ml.segmentor import _hsv_damage_mask, _save_overlay

logger = logging.getLogger("bimasetu.groq")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
VISION_MODEL = os.getenv(
    "GROQ_VISION_MODEL",
    "meta-llama/llama-4-scout-17b-16e-instruct",
)

DAMAGE_TYPES = [
    "Healthy",
    "Waterlogging",
    "Leaf Disease",
    "Pest Damage",
    "Drought Stress",
    "Nutrient Deficiency",
]

_ANALYSIS_CACHE: dict[str, dict] = {}

SYSTEM_PROMPT = """You are an agricultural crop damage assessor for Indian PMFBY insurance claims.
Analyze the uploaded field/crop photo and respond with ONLY valid JSON (no markdown).
Be conservative: reject non-crop images (pets, vehicles, buildings, selfies, indoor objects, roads).
Estimate visible damaged crop area as a percentage of the crop-visible region (0–100).
Choose exactly one damage_type from the allowed list."""


def _image_hash(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()


def _prepare_image_b64(image_bytes: bytes) -> tuple[str, np.ndarray]:
    """Resize/compress for Groq 4MB base64 limit; return (data_url, bgr array)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image bytes")

    pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    max_side = 1280
    w, h = pil.size
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        pil = pil.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    buf = BytesIO()
    quality = 85
    while quality >= 50:
        buf.seek(0)
        buf.truncate()
        pil.save(buf, format="JPEG", quality=quality, optimize=True)
        if len(buf.getvalue()) <= 2_800_000:
            break
        quality -= 10

    jpeg_bytes = buf.getvalue()
    b64 = base64.b64encode(jpeg_bytes).decode("ascii")
    data_url = f"data:image/jpeg;base64,{b64}"

    decoded = cv2.imdecode(np.frombuffer(jpeg_bytes, np.uint8), cv2.IMREAD_COLOR)
    return data_url, decoded if decoded is not None else img_bgr


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _call_groq_vision(image_bytes: bytes) -> dict:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env (see .env.example)."
        )

    from groq import Groq

    data_url, _ = _prepare_image_b64(image_bytes)
    user_prompt = f"""Analyze this crop field image.

Return JSON with these exact keys:
{{
  "is_crop_field": boolean,
  "crop_field_confidence": number (0.0 to 1.0),
  "damage_pct": number (0.0 to 100.0, estimated % of crop area showing damage),
  "segmentation_confidence": number (0.0 to 1.0),
  "damage_type": one of {json.dumps(DAMAGE_TYPES)},
  "classification_confidence": number (0.0 to 1.0),
  "brief_reason": string (one sentence)
}}"""

    client = Groq(api_key=GROQ_API_KEY)
    completion = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_completion_tokens=512,
    )

    raw = completion.choices[0].message.content or "{}"
    parsed = _parse_json_response(raw)

    damage_type = parsed.get("damage_type", "Healthy")
    if damage_type not in DAMAGE_TYPES:
        for dt in DAMAGE_TYPES:
            if dt.lower() in str(damage_type).lower():
                damage_type = dt
                break
        else:
            damage_type = "Healthy"

    return {
        "is_crop_field": bool(parsed.get("is_crop_field", False)),
        "crop_field_confidence": float(
            np.clip(parsed.get("crop_field_confidence", 0.5), 0.0, 1.0)
        ),
        "damage_pct": float(np.clip(parsed.get("damage_pct", 0.0), 0.0, 100.0)),
        "segmentation_confidence": float(
            np.clip(parsed.get("segmentation_confidence", 0.75), 0.0, 1.0)
        ),
        "damage_type": damage_type,
        "classification_confidence": float(
            np.clip(parsed.get("classification_confidence", 0.75), 0.0, 1.0)
        ),
        "brief_reason": str(parsed.get("brief_reason", "")),
    }


def _get_analysis(image_bytes: bytes) -> dict:
    key = _image_hash(image_bytes)
    if key not in _ANALYSIS_CACHE:
        logger.info("Calling Groq vision model: %s", VISION_MODEL)
        _ANALYSIS_CACHE[key] = _call_groq_vision(image_bytes)
        if len(_ANALYSIS_CACHE) > 32:
            _ANALYSIS_CACHE.pop(next(iter(_ANALYSIS_CACHE)))
    return _ANALYSIS_CACHE[key]


def predict_crop_field(image_bytes: bytes) -> tuple:
    """
    Returns (is_crop_field: bool, confidence: float)
    """
    result = _get_analysis(image_bytes)
    is_crop = result["is_crop_field"]
    conf = result["crop_field_confidence"]
    logger.info(
        "Groq field check: is_crop=%s conf=%.2f — %s",
        is_crop,
        conf,
        result.get("brief_reason", ""),
    )
    return is_crop, conf


def segment_damage(image_bytes: bytes) -> dict:
    """
    Segmentation via Groq damage estimate + local HSV overlay for mask PNG.
    """
    result = _get_analysis(image_bytes)
    _, img_bgr = _prepare_image_b64(image_bytes)

    h, w = img_bgr.shape[:2]
    total_mask = np.ones((h, w), dtype=np.uint8)
    damaged_mask = _hsv_damage_mask(img_bgr)

    local_pct = 0.0
    total_px = int(total_mask.sum()) or 1
    local_pct = (int(damaged_mask.sum()) / total_px) * 100.0

    damage_pct = result["damage_pct"]
    if local_pct > 0 and damage_pct > 0:
        damage_pct = round((damage_pct * 0.7) + (local_pct * 0.3), 2)
    else:
        damage_pct = round(damage_pct, 2)

    mask_path = _save_overlay(img_bgr, total_mask, damaged_mask)
    return {
        "damage_pct": damage_pct,
        "mask_path": str(mask_path),
        "method": f"groq:{VISION_MODEL}",
        "confidence": round(result["segmentation_confidence"], 4),
    }


def classify_damage(image_bytes: bytes) -> dict:
    """
    Classification via Groq vision model.
    """
    result = _get_analysis(image_bytes)
    logger.info(
        "Groq classification: %s @ %.2f",
        result["damage_type"],
        result["classification_confidence"],
    )
    return {
        "damage_type": result["damage_type"],
        "confidence": round(result["classification_confidence"], 4),
        "method": f"groq:{VISION_MODEL}",
    }
