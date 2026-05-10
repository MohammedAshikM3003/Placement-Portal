import cv2
import numpy as np
from PIL import Image


def _deskew(gray):
    coords = np.column_stack(np.where(gray < 255))
    if coords.size == 0:
        return gray
    angle = cv2.minAreaRect(coords)[-1]
    angle = -(90 + angle) if angle < -45 else -angle
    (h, w) = gray.shape
    m = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    return cv2.warpAffine(gray, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def _crop_border(gray):
    thresh = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)[1]
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return gray
    x, y, w, h = cv2.boundingRect(np.vstack(contours))
    return gray[y:y + h, x:x + w]


def _clahe(gray):
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def _sharpen(gray):
    return cv2.addWeighted(gray, 1.5, cv2.GaussianBlur(gray, (0, 0), 3), -0.5, 0)


def build_preprocess_variants(pil_img):
    img = np.array(pil_img.convert("L"))
    denoise = cv2.fastNlMeansDenoising(img, None, 10, 7, 21)
    base = _clahe(denoise)
    base = _sharpen(base)
    deskewed = _deskew(base)
    cropped = _crop_border(deskewed)

    adaptive = cv2.adaptiveThreshold(cropped, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY, 31, 10)

    variants = [
        ("raw", pil_img),
        ("preprocess", Image.fromarray(cropped)),
        ("adaptive", Image.fromarray(adaptive))
    ]
    return variants
