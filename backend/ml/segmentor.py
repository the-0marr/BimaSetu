"""
backend/ml/segmentor.py

SAM (Segment Anything Model) based crop segmentation.
Detects and segments crop regions, identifies damaged areas,
and calculates a damage percentage.

Falls back to HSV-based colour thresholding when model weights
are unavailable.
"""

import logging
import os
import uuid
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("bimasetu.segmentor")

MODEL_PATH = os.getenv("SAM_MODEL_PATH", "./ml/model_weights/sam2_b.pt")
MASK_OUTPUT_DIR = Path("static/masks")
MASK_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------
# Lazy-load SAM so startup never fails if weights are absent
# -----------------------------------------------------------------
_sam_model = None


def _load_sam():
    global _sam_model
    if _sam_model is not None:
        return _sam_model
    
    # 1. Try custom path from env, 2. try default SAM model names
    paths_to_try = [MODEL_PATH, "sam2_b.pt", "sam_b.pt", "mobile_sam.pt"]
    
    for path_to_try in paths_to_try:
        try:
            from ultralytics import SAM  # imported here to avoid hard dep at startup
            if Path(path_to_try).exists() or not path_to_try.startswith("./"):
                _sam_model = SAM(path_to_try)
                logger.info("SAM model loaded successfully from %s", path_to_try)
                return _sam_model
        except Exception as exc:
            logger.debug("Attempt to load SAM from %s failed: %s", path_to_try, exc)
            continue

    logger.warning("Failed to load SAM model. Will use HSV fallback.")
    return None


# -----------------------------------------------------------------
# Public API
# -----------------------------------------------------------------

def segment_damage(image_bytes: bytes) -> dict:
    """
    Accepts raw image bytes.
    Returns:
        {
          "damage_pct": float,      # 0–100
          "mask_path": str,         # relative path to saved overlay PNG
          "method": str,            # "sam" | "hsv_fallback"
          "confidence": float       # confidence score
        }
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image bytes")

    model = _load_sam()

    if model is not None:
        return _segment_sam(model, img_bgr)
    else:
        return _segment_hsv_fallback(img_bgr)


# -----------------------------------------------------------------
# SAM path
# -----------------------------------------------------------------

def _segment_sam(model, img_bgr: np.ndarray) -> dict:
    """Run SAM (Segment Anything Model) segmentation and derive damage percentage."""
    results = model(img_bgr, verbose=False)
    result = results[0]

    h, w = img_bgr.shape[:2]
    total_mask = np.zeros((h, w), dtype=np.uint8)
    damaged_mask = np.zeros((h, w), dtype=np.uint8)
    conf_score = 0.88  # baseline confidence score for SAM

    if result.boxes is not None and len(result.boxes) > 0:
        conf_vals = result.boxes.conf.cpu().numpy().tolist()
        if len(conf_vals) > 0:
            conf_score = float(np.mean(conf_vals))

    if result.masks is not None:
        for mask_tensor in result.masks.data:
            # Resize mask to original image dimensions
            seg_mask = mask_tensor.cpu().numpy()
            seg_mask = cv2.resize(seg_mask, (w, h))
            seg_mask_bin = (seg_mask > 0.5).astype(np.uint8)
            total_mask = cv2.bitwise_or(total_mask, seg_mask_bin)

            # Within each segment, mark damaged pixels via HSV
            region = cv2.bitwise_and(img_bgr, img_bgr, mask=seg_mask_bin)
            dmg = _hsv_damage_mask(region)
            damaged_mask = cv2.bitwise_or(damaged_mask, dmg)
    else:
        # No segments returned — treat whole image as crop area and use HSV
        logger.warning("SAM model returned no masks; using full-image HSV fallback")
        total_mask = np.ones((h, w), dtype=np.uint8)
        damaged_mask = _hsv_damage_mask(img_bgr)

    damage_pct = _calc_damage_pct(total_mask, damaged_mask)
    mask_path = _save_overlay(img_bgr, total_mask, damaged_mask)
    return {
        "damage_pct": round(damage_pct, 2),
        "mask_path": str(mask_path),
        "method": "sam",
        "confidence": round(conf_score, 4)
    }


# -----------------------------------------------------------------
# HSV fallback path
# -----------------------------------------------------------------

def _segment_hsv_fallback(img_bgr: np.ndarray) -> dict:
    """
    Pure HSV thresholding fallback.
    Treats the entire image as the crop area and identifies damage
    via brown, yellow, and waterlogged (blue-grey) tone ranges.
    """
    logger.info("Using HSV fallback segmentation")
    h, w = img_bgr.shape[:2]
    total_mask = np.ones((h, w), dtype=np.uint8)  # whole image = crop
    damaged_mask = _hsv_damage_mask(img_bgr)

    damage_pct = _calc_damage_pct(total_mask, damaged_mask)
    mask_path = _save_overlay(img_bgr, total_mask, damaged_mask)
    return {
        "damage_pct": round(damage_pct, 2),
        "mask_path": str(mask_path),
        "method": "hsv_fallback",
        "confidence": 0.85
    }


# -----------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------

def _hsv_damage_mask(img_bgr: np.ndarray) -> np.ndarray:
    """
    Identify damaged crop pixels using HSV colour ranges:
    - Brown / dried  : H 10–25, S >50, V >40
    - Yellow / wilted: H 25–35, S >80, V >80
    - Waterlogged    : H 90–130, S >40, V <120   (bluish-grey standing water)
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    brown   = cv2.inRange(hsv, (10,  50,  40), (25, 255, 200))
    yellow  = cv2.inRange(hsv, (25,  80,  80), (35, 255, 255))
    water   = cv2.inRange(hsv, (90,  40,   0), (130, 255, 120))

    combined = cv2.bitwise_or(brown, cv2.bitwise_or(yellow, water))
    # Morphological cleanup to reduce noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
    combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN,  kernel)
    return (combined > 0).astype(np.uint8)


def _calc_damage_pct(total_mask: np.ndarray, damaged_mask: np.ndarray) -> float:
    total_pixels = int(total_mask.sum())
    damaged_pixels = int(damaged_mask.sum())
    if total_pixels == 0:
        return 0.0
    pct = (damaged_pixels / total_pixels) * 100.0
    return min(pct, 100.0)


def _save_overlay(img_bgr, total_mask, damaged_mask) -> Path:
    """
    Save a colour-coded overlay:
    - Green tint  → healthy crop region
    - Red tint    → damaged region
    Returns the relative file path.
    """
    overlay = img_bgr.copy()
    # Green channel boost for healthy crop
    healthy = cv2.bitwise_and(total_mask, cv2.bitwise_not(damaged_mask * 255))
    overlay[healthy > 0] = (overlay[healthy > 0] * [0.4, 0.9, 0.4]).astype(np.uint8)
    # Red tint for damaged areas
    overlay[damaged_mask > 0] = (overlay[damaged_mask > 0] * [0.4, 0.4, 0.9]).astype(np.uint8)

    filename = f"{uuid.uuid4().hex}.png"
    out_path = MASK_OUTPUT_DIR / filename
    cv2.imwrite(str(out_path), overlay)
    logger.info("Saved mask overlay to %s", out_path)
    return out_path
