"""
backend/ml/field_detector.py

Validates if an uploaded image is a crop field or a non-crop image.
Classes: Crop Field, Not Crop Field.
Rejects non-crop subjects like: Dogs, Cars, Houses, Selfies/Faces, Roads, Laptops, etc.
"""

import logging
import os
from pathlib import Path
import re

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("bimasetu.field_detector")

WEIGHTS_PATH = os.getenv("FIELD_DETECTOR_WEIGHTS_PATH", "./ml/model_weights/field_detector.pth")

# Lazy load model
_field_model = None
_model_labels = None

def _load_model():
    global _field_model, _model_labels
    if _field_model is not None:
        return _field_model, _model_labels

    # Check for custom weights first
    if Path(WEIGHTS_PATH).exists():
        try:
            import torch
            import torch.nn as nn
            import torchvision.models as tv_models
            
            # Simple binary classifier structure (Crop vs Not Crop)
            model = tv_models.mobilenet_v2(weights=None)
            model.classifier[1] = nn.Linear(model.classifier[1].in_features, 2)
            state = torch.load(WEIGHTS_PATH, map_location="cpu")
            model.load_state_dict(state)
            model.eval()
            _field_model = model
            _model_labels = ["not_crop_field", "crop_field"]
            logger.info("Custom crop field detector loaded from %s", WEIGHTS_PATH)
            return _field_model, _model_labels
        except Exception as exc:
            logger.error("Failed to load custom field detector weights: %s", exc)

    # Fallback to pre-trained MobileNetV2 ImageNet classifier
    try:
        import torch
        import torchvision.models as tv_models
        
        try:
            # torchvision >= 0.13
            weights = tv_models.MobileNet_V2_Weights.DEFAULT
            model = tv_models.mobilenet_v2(weights=weights)
            _model_labels = weights.meta["categories"]
        except AttributeError:
            # torchvision < 0.13
            model = tv_models.mobilenet_v2(pretrained=True)
            _model_labels = None # Will use fallback text index matching if needed
            
        model.eval()
        _field_model = model
        logger.info("MobileNetV2 pre-trained ImageNet classifier loaded as field detector")
        return _field_model, _model_labels
    except Exception as exc:
        logger.warning("Could not load MobileNetV2 pre-trained model (offline/uninstalled?): %s", exc)
        return None, None

def _run_hsv_heuristic(img_bgr: np.ndarray) -> tuple:
    """
    Enhanced fallback/complementary rule-based checker using color histograms,
    fine edge density (Canny), and color uniformity checks.
    Prevents false positives on textured indoor items (wooden desks, patterned carpets)
    and solid artificial surfaces (green folders, colored screens).
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    total_px = img_bgr.shape[0] * img_bgr.shape[1]

    # 1. Color Masking
    # Green vegetation range: Hue 30-90, Saturation 20-255, Value 20-255
    green_mask = cv2.inRange(hsv, (30, 20, 20), (90, 255, 255))
    green_ratio = (green_mask.sum() / 255) / total_px

    # Yellow/brown soil or dry crop: Hue 10-30, Saturation 25-255, Value 20-255
    brown_mask = cv2.inRange(hsv, (10, 25, 20), (30, 255, 255))
    brown_ratio = (brown_mask.sum() / 255) / total_px

    nature_ratio = green_ratio + brown_ratio

    # Skin tone detection to reject selfies: Hue 0-20, Saturation 20-150, Value 60-255
    skin_mask = cv2.inRange(hsv, (0, 20, 60), (20, 150, 255))
    skin_ratio = (skin_mask.sum() / 255) / total_px

    # 2. Texture & Fine Detail Analysis
    # Laplacian variance measures overall texture contrast
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

    # Canny edge density measures ratio of fine details (leaf structures/crops create high density, desks/walls do not)
    edges = cv2.Canny(gray, 30, 120)
    edge_ratio = np.sum(edges > 0) / total_px

    # 3. Color Uniformity check (to reject solid artificial colors)
    green_pixels = hsv[green_mask > 0]
    green_hue_std = np.std(green_pixels[:, 0]) if len(green_pixels) > 500 else 10.0

    brown_pixels = hsv[brown_mask > 0]
    brown_hue_std = np.std(brown_pixels[:, 0]) if len(brown_pixels) > 500 else 10.0

    logger.info(
        "Heuristic check details: green: %.3f (std: %.2f), brown: %.3f (std: %.2f), nature: %.3f, skin: %.3f, laplacian: %.2f, edge_ratio: %.3f",
        green_ratio, green_hue_std, brown_ratio, brown_hue_std, nature_ratio, skin_ratio, laplacian_var, edge_ratio
    )

    # Rejection criteria:
    # 1. Not enough vegetation or soil color
    if nature_ratio < 0.10:
        logger.info("Rejected: insufficient nature color ratio (%.2f)", nature_ratio)
        return False, 0.85

    # 2. Too much skin tone (likely selfie)
    # Only reject if the image also has low texture (real crop fields/soil are highly textured)
    if skin_ratio > 0.30 and (edge_ratio < 0.02 or laplacian_var < 80.0):
        logger.info("Rejected: excessive skin tone ratio (%.2f) with low texture", skin_ratio)
        return False, 0.90

    # 3. Very flat image (wall, computer screen, paper)
    if laplacian_var < 40.0 and nature_ratio < 0.40:
        logger.info("Rejected: image is too flat/low contrast (laplacian_var: %.2f)", laplacian_var)
        return False, 0.80

    # 4. Low edge density (wooden floor, table, desk, clothing, solid objects)
    # A real crop field or vegetation has a high density of leaf/grass edges
    if edge_ratio < 0.015 and nature_ratio < 0.50:
        logger.info("Rejected: insufficient fine detail edge density (edge_ratio: %.3f)", edge_ratio)
        return False, 0.82

    # 5. Uniform artificial green (e.g. green screen, green folder)
    if green_ratio > 0.40 and green_hue_std < 2.5:
        logger.info("Rejected: color distribution is too uniform to be natural vegetation (std: %.2f)", green_hue_std)
        return False, 0.88

    # 5b. Uniform artificial brown (e.g. wooden desk, cardboard box, brown floor)
    if brown_ratio > 0.40 and brown_hue_std < 2.0:
        logger.info("Rejected: brown color distribution is too uniform to be natural soil/dry crops (std: %.2f)", brown_hue_std)
        return False, 0.86

    # 6. If there is NO green at all (<1%), it must have sufficient texture and brown/soil ratio to be accepted
    if green_ratio < 0.01:
        if brown_ratio < 0.15 or edge_ratio < 0.02:
            logger.info("Rejected: brown color without green must be high texture soil/dry crops")
            return False, 0.80

    return True, 0.75

def predict_crop_field(image_bytes: bytes) -> tuple:
    """
    Predicts if the image is a crop field.
    Returns:
        (is_crop_field: bool, confidence: float)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image bytes")

    # Run heuristic first
    hsv_is_crop, hsv_conf = _run_hsv_heuristic(img_bgr)

    # Load model
    model, labels = _load_model()
    if model is None:
        logger.info("Using HSV heuristic result for field detection: %s (conf %.2f)", hsv_is_crop, hsv_conf)
        return hsv_is_crop, hsv_conf

    # Run PyTorch model
    try:
        import torch
        
        # Preprocess
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (224, 224)).astype(np.float32) / 255.0
        
        # ImageNet normalization
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_norm = (img_resized - mean) / std
        tensor = torch.from_numpy(img_norm.transpose(2, 0, 1)).unsqueeze(0)

        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.softmax(outputs, dim=1).squeeze().numpy()

        best_idx = int(np.argmax(probs))
        confidence = float(probs[best_idx])

        if labels is not None and len(labels) == 2:
            # Custom binary classifier mode
            is_crop_field = (labels[best_idx] == "crop_field")
            logger.info("Custom Field Detector output: %s (conf %.2f)", is_crop_field, confidence)
            return is_crop_field, confidence

        # Pre-trained ImageNet mode: Inspect top prediction label text
        pred_label = labels[best_idx].lower() if labels is not None else ""
        logger.info("ImageNet top class: %d -> '%s' (conf %.2f)", best_idx, pred_label, confidence)

        # Explicit whitelisted crop and natural field/vegetation keyword categories
        accept_keywords = [
            "corn", "ear", "hay", "field", "valley", "pasture", "meadow", "grass", "rapeseed", "sunflower", "daisy",
            "cardoon", "artichoke", "cabbage", "broccoli", "cauliflower", "cucumber", "zucchini", "squash", "plain",
            "greenhouse", "acorn squash", "mushroom", "orange", "lemon", "fig", "pineapple", "banana", "orchid", "acorn"
        ]
        is_accepted = any(re.search(r'\b' + re.escape(kw) + r'\b', pred_label) for kw in accept_keywords)

        # Explicit blacklisted non-crop categories that are strictly rejected
        reject_keywords = [
            "dog", "puppy", "cat", "kitten", "car", "cab", "automobile", "sports car", "minivan", "truck", "limousine",
            "building", "house", "church", "monument", "palace", "castle", "villa", "home",
            "screen", "monitor", "laptop", "notebook", "desktop", "keyboard", "computer", "mouse", "modem",
            "person", "man", "woman", "human", "face", "selfie", "suit", "groom", "bride",
            "road", "street", "highway", "intersection", "pavement", "bridge",
            "desk", "table", "chair", "sofa", "bed", "interior", "room", "office", "pot", "plate", "cup", "mug",
            "toy", "book", "backpack", "shoe", "clothing", "shirt", "pants", "jacket", "wall clock",
            "window", "door", "wall", "ceiling", "floor", "shelf", "bookcase", "wardrobe", "cabinet", "drawer",
            "box", "carton", "packet", "container", "bottle", "can", "jar", "basket", "bag", "purse", "wallet",
            "umbrella", "lamp", "light", "candle", "mirror", "towel", "blanket", "sheet", "pillow", "curtain",
            "phone", "telephone", "calculator", "printer", "paper", "folder", "pen", "pencil", "hat", "cap",
            "helmet", "glasses", "sunglasses", "dress", "skirt", "socks", "boot", "sneaker", "sandal", "glove",
            "belt", "tie", "watch", "bicycle", "bike", "motorcycle", "scooter", "train", "bus", "airplane",
            "boat", "ship", "sign", "pole", "bench", "fence", "gate", "brick", "concrete", "stair", "escalator",
            "elevator", "cow", "sheep", "pig", "chicken", "duck", "goat", "horse"
        ]
        is_rejected = any(re.search(r'\b' + re.escape(kw) + r'\b', pred_label) for kw in reject_keywords)

        # 1. Confident rejection (blacklisted class with high confidence)
        if is_rejected and confidence >= 0.15:
            logger.info("Field rejected by confident blacklisted ImageNet class check: '%s' (conf %.2f)", pred_label, confidence)
            return False, confidence

        # 2. Confident acceptance (whitelisted class with high confidence)
        if is_accepted and confidence >= 0.15:
            logger.info("Field accepted by confident whitelisted ImageNet class check: '%s' (conf %.2f)", pred_label, confidence)
            return True, confidence

        # 3. All other cases (neutral classes, weak whitelist, weak blacklist) fall back to the HSV heuristic
        logger.info("ImageNet prediction '%s' (conf %.2f, accepted=%s, rejected=%s) falls back to HSV heuristic: %s", 
                    pred_label, confidence, is_accepted, is_rejected, hsv_is_crop)
        return hsv_is_crop, hsv_conf

    except Exception as exc:
        logger.error("Error during PyTorch field detection inference: %s", exc)
        return hsv_is_crop, hsv_conf
