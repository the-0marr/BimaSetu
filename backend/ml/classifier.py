"""
backend/ml/classifier.py

EfficientNet B0-based damage type classifier.
Fine-tuned on 6 classes:
  0 → Healthy
  1 → Waterlogging
  2 → Leaf Disease
  3 → Pest Damage
  4 → Drought Stress
  5 → Nutrient Deficiency

Falls back to colour-histogram rule-based classification when
model weights are unavailable.
"""

import logging
import os
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("bimasetu.classifier")

WEIGHTS_PATH = os.getenv("CLASSIFIER_WEIGHTS_PATH", "./ml/model_weights/efficientnet_b0.pth")

CLASS_NAMES = {
    0: "Healthy",
    1: "Waterlogging",
    2: "Leaf Disease",
    3: "Pest Damage",
    4: "Drought Stress",
    5: "Nutrient Deficiency"
}

# Normalisation constants (ImageNet)
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    if not Path(WEIGHTS_PATH).exists():
        logger.warning("EfficientNet B0 weights not found at %s — using rule-based fallback", WEIGHTS_PATH)
        return None
    try:
        import torch
        import torchvision.models as tv_models
        import torch.nn as nn

        model = tv_models.efficientnet_b0(weights=None)
        # Replace linear classifier head with 6-class head
        num_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_features, 6)
        
        state = torch.load(WEIGHTS_PATH, map_location="cpu")
        model.load_state_dict(state)
        model.eval()
        _model = model
        logger.info("EfficientNet B0 classifier loaded from %s", WEIGHTS_PATH)
        return _model
    except Exception as exc:
        logger.error("Failed to load EfficientNet B0: %s", exc)
        return None


# -----------------------------------------------------------------
# Public API
# -----------------------------------------------------------------

def classify_damage(image_bytes: bytes) -> dict:
    """
    Accepts raw image bytes.
    Returns:
        {
          "damage_type": str,    # Healthy | Waterlogging | Leaf Disease | Pest Damage | Drought Stress | Nutrient Deficiency
          "confidence": float,   # 0.0–1.0
          "method": str          # "efficientnet_b0" | "rule_based"
        }
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image bytes")

    model = _load_model()
    if model is not None:
        return _classify_efficientnet(model, img_bgr)
    else:
        return _classify_rule_based(img_bgr)


# -----------------------------------------------------------------
# EfficientNet B0 path
# -----------------------------------------------------------------

def _classify_efficientnet(model, img_bgr: np.ndarray) -> dict:
    import torch

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (224, 224)).astype(np.float32) / 255.0
    img_norm = (img_resized - _MEAN) / _STD
    tensor = torch.from_numpy(img_norm.transpose(2, 0, 1)).unsqueeze(0)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1).squeeze().numpy()

    class_idx = int(np.argmax(probs))
    confidence = float(probs[class_idx])
    damage_type = CLASS_NAMES[class_idx]
    logger.info("EfficientNet B0 prediction: %s (%.2f)", damage_type, confidence)
    return {"damage_type": damage_type, "confidence": round(confidence, 4), "method": "efficientnet_b0"}


# -----------------------------------------------------------------
# Rule-based fallback
# -----------------------------------------------------------------

def _classify_rule_based(img_bgr: np.ndarray) -> dict:
    """
    Heuristic classification supporting 6 classes based on color and texture:
    - Healthy: High green ratio, low brown/yellow/dark ratios.
    - Waterlogging: High blue/grey standing water ratios.
    - Leaf Disease: Scattered brown/yellow spots (high spot density).
    - Pest Damage: Eaten patches (dark irregular areas).
    - Drought Stress: Broad wilting yellowing across the crop.
    - Nutrient Deficiency: Patchy, light-green chlorosis discoloration.
    """
    logger.info("Using rule-based damage classification (6 classes)")

    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    total_px = img_bgr.shape[0] * img_bgr.shape[1]

    # --- Feature extraction ---
    # Blue/grey water ratio
    water_mask = cv2.inRange(hsv, (90, 30, 40), (130, 255, 200))
    grey_mask  = cv2.inRange(hsv, (0, 0, 80),   (180, 40, 200))
    water_ratio = (water_mask.sum() / 255 + grey_mask.sum() / 255) / total_px

    # Green healthy ratio
    green_mask  = cv2.inRange(hsv, (36, 50, 50), (89, 255, 255))
    green_ratio = (green_mask.sum() / 255) / total_px

    # Yellow/wilted ratio
    yellow_mask = cv2.inRange(hsv, (25, 50, 50), (35, 255, 255))
    yellow_ratio = (yellow_mask.sum() / 255) / total_px

    # Brown/dried ratio
    brown_mask  = cv2.inRange(hsv, (10, 50, 40), (25, 255, 200))
    brown_ratio = (brown_mask.sum() / 255) / total_px

    # Dark irregular patch ratio
    dark_mask   = cv2.inRange(hsv, (0, 0, 0),    (180, 255, 60))
    dark_ratio  = (dark_mask.sum() / 255) / total_px

    # Brown spot count (leaf disease spots)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    spots  = cv2.morphologyEx(brown_mask, cv2.MORPH_OPEN, kernel)
    n_contours, _ = cv2.findContours(spots, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    spot_density = len(n_contours) / (total_px / 1000)

    # --- Decision logic ---
    scores = {
        "Healthy": max(green_ratio * 4.0 - (brown_ratio + dark_ratio + yellow_ratio) * 1.5, 0.05),
        "Waterlogging": max(water_ratio * 4.0, 0.01),
        "Leaf Disease": max(spot_density * 0.8 + brown_ratio * 2.0, 0.01),
        "Pest Damage": max(dark_ratio * 3.5 + brown_ratio * 0.5, 0.01),
        "Drought Stress": max(yellow_ratio * 2.5 + brown_ratio * 1.5 - water_ratio * 2.0, 0.01),
        "Nutrient Deficiency": max(yellow_ratio * 2.0 + green_ratio * 1.0 - (brown_ratio + water_ratio) * 1.5, 0.01)
    }

    best = max(scores, key=scores.get)
    total_score = sum(scores.values()) or 1.0
    confidence  = round(min(scores[best] / total_score, 0.95), 4)

    logger.info(
        "Rule-based scores: %s → %s (conf %.2f)",
        {k: round(v, 3) for k, v in scores.items()}, best, confidence,
    )
    return {"damage_type": best, "confidence": confidence, "method": "rule_based"}
