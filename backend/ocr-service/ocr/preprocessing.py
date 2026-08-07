# backend/ocr-service/ocr/preprocessing.py
import cv2
import numpy as np
from PIL import Image

def _deskew(gray, logger=None):
    try:
        # Find all thresholded pixels
        coords = np.column_stack(np.where(gray < 255))
        if coords.size == 0:
            return gray
        # minAreaRect returns (center(x, y), size(width, height), angle of rotation)
        angle = cv2.minAreaRect(coords)[-1]
        # In OpenCV, angle is between -90 and 0. Fix range for deskewing.
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        # Only rotate if skew is non-trivial but not extreme (skew usually < 15 degrees)
        if abs(angle) > 0.1 and abs(angle) < 15.0:
            if logger:
                logger.info(f"Deskewing image by {angle:.2f} degrees")
            (h, w) = gray.shape
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    except Exception as e:
        if logger:
            logger.warning(f"Deskewing failed: {e}")
    return gray

def _crop_border(gray, logger=None):
    try:
        thresh = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)[1]
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return gray
        x, y, w, h = cv2.boundingRect(np.vstack(contours))
        # Ensure we don't crop down to nothing
        if w > gray.shape[1] * 0.3 and h > gray.shape[0] * 0.3:
            return gray[y:y + h, x:x + w]
    except Exception as e:
        if logger:
            logger.warning(f"Crop border failed: {e}")
    return gray

def _clahe(gray):
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)

def _sharpen(gray):
    # Unsharp masking
    return cv2.addWeighted(gray, 1.5, cv2.GaussianBlur(gray, (0, 0), 3), -0.5, 0)

def build_preprocess_variants(pil_img, logger=None):
    """
    Builds different preprocessed variants of the image to run OCR on.
    Returns: list of (variant_name, PIL.Image)
    """
    if logger:
        logger.info(f"Building preprocessing variants for image size: {pil_img.size}")
    
    variants = []
    
    try:
        # Convert to Grayscale
        img_np = np.array(pil_img.convert("L"))
        
        # 2. Denoise and Sharpen
        denoise = cv2.fastNlMeansDenoising(img_np, None, 10, 7, 21)
        base = _clahe(denoise)
        base = _sharpen(base)
        
        # 3. Deskew and Crop
        deskewed = _deskew(base, logger)
        cropped = _crop_border(deskewed, logger)
        
        variants.append(("preprocess", Image.fromarray(cropped)))
        
        # 4. Adaptive Thresholding variant (highly readable for text tables)
        adaptive = cv2.adaptiveThreshold(
            cropped, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 10
        )
        variants.append(("adaptive", Image.fromarray(adaptive)))
        
    except Exception as e:
        if logger:
            logger.error(f"Preprocessing variant generation failed: {e}")
            
    # Always append raw as fallback at the end
    variants.append(("raw", pil_img))
    return variants
