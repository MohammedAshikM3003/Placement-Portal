# backend/ocr-service/ocr/image_preprocessor.py
import numpy as np

def analyze_image_quality(image_np):
    """
    Analyses brightness, contrast, and estimates blur metrics using numpy.
    Falls back to OpenCV Laplacian variance if installed.
    """
    if len(image_np.shape) == 3:
        # Convert RGB to grayscale
        gray = np.dot(image_np[...,:3], [0.2989, 0.5870, 0.1140])
    else:
        gray = image_np
        
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))
    
    # Laplacian blur variance estimate
    try:
        import cv2
        laplacian_var = float(cv2.Laplacian(gray.astype(np.uint8), cv2.CV_64F).var())
    except Exception:
        # Basic edge density estimate fallback
        diff_h = np.abs(gray[1:, :] - gray[:-1, :])
        diff_w = np.abs(gray[:, 1:] - gray[:, :-1])
        laplacian_var = float(np.mean(diff_h) + np.mean(diff_w)) * 10.0
        
    return {
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "blur_score": round(laplacian_var, 2),
        "is_low_quality": contrast < 12.0 or laplacian_var < 5.0
    }

def estimate_rotation_angle(ocr_lines):
    """
    Examines word bounding box dimensions to determine if the page is rotated landscape (90/270).
    """
    vertical_boxes = 0
    horizontal_boxes = 0
    
    for line in ocr_lines:
        w = line.get("w", 1.0)
        h = line.get("h", 1.0)
        if h > w * 1.5:
            vertical_boxes += 1
        else:
            horizontal_boxes += 1
            
    # If the majority of parsed elements are oriented vertically, rotate 90 degrees
    if vertical_boxes > horizontal_boxes * 1.5:
        return 90
    return 0

def auto_rotate_image(image_np, angle):
    """
    Rotates numpy image arrays.
    """
    if angle == 90:
        return np.rot90(image_np, k=3) # 90 degrees clockwise
    elif angle == 180:
        return np.rot90(image_np, k=2) # 180 degrees
    elif angle == 270:
        return np.rot90(image_np, k=1) # 270 degrees clockwise
    return image_np
