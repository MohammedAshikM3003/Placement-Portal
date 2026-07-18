# backend/ocr-service/ocr/ocr_engine.py
import os
os.environ["PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT"] = "0"

import numpy as np
from io import BytesIO
import pdfplumber
from PIL import Image

_ocr_engine_instance = None

def get_ocr_engine():
    """Lazily initialize and return the global PaddleOCR engine instance."""
    global _ocr_engine_instance
    if _ocr_engine_instance is None:
        from paddleocr import PaddleOCR
        # Initialize PaddleOCR engine with English language, textline orientation, disabled mkldnn, and using PP-OCRv4 version.
        _ocr_engine_instance = PaddleOCR(use_textline_orientation=True, lang="en", enable_mkldnn=False, ocr_version="PP-OCRv4")
    return _ocr_engine_instance

def extract_text_lines_from_image(image, ocr_engine=None, min_conf=0.65, logger=None):
    """
    Runs PaddleOCR on a PIL image and returns sorted OCR blocks.
    Each block has text, confidence, page-aligned coordinates.
    """
    if ocr_engine is None:
        ocr_engine = get_ocr_engine()
        
    if image.mode != "RGB":
        image = image.convert("RGB")
        
    img_array = np.array(image)
    results = ocr_engine.ocr(img_array, use_doc_orientation_classify=False, use_doc_unwarping=False)
    lines = []
    
    if results and results[0]:
        first_elem = results[0]
        if isinstance(first_elem, dict) and ("res" in first_elem or "rec_texts" in first_elem):
            # Parse dict format
            res_data = first_elem.get("res", first_elem)
            texts = res_data.get("rec_texts", [])
            scores = res_data.get("rec_scores", [])
            boxes = res_data.get("rec_boxes", res_data.get("rec_polys", res_data.get("dt_polys", [])))
            for i in range(min(len(texts), len(scores), len(boxes))):
                text = texts[i]
                conf = float(scores[i])
                if conf < min_conf:
                    continue
                box = boxes[i]
                
                # Check if box is a 4-element flat array [x1, y1, x2, y2]
                if len(box) == 4 and not isinstance(box[0], (list, np.ndarray, tuple)):
                    x1, y1, x2, y2 = float(box[0]), float(box[1]), float(box[2]), float(box[3])
                else:
                    # It is a polygon [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                    xs = [pt[0] for pt in box]
                    ys = [pt[1] for pt in box]
                    x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
                    
                w = max(1.0, x2 - x1)
                h = max(1.0, y2 - y1)
                y_center = y1 + h / 2.0
                
                lines.append({
                    "text": text.strip(),
                    "conf": conf,
                    "x": x1,
                    "y": y1,
                    "w": w,
                    "h": h,
                    "y_center": y_center,
                    "bbox": [x1, y1, x2, y2],
                    "tr_id": f"img_l{len(lines)}"
                })
        else:
            # Parse standard list format
            for line in results[0]:
                if not isinstance(line, (list, tuple)) or len(line) < 2:
                    continue
                box = line[0]
                text_info = line[1]
                if not isinstance(text_info, (list, tuple)) or len(text_info) < 2:
                    continue
                text = text_info[0]
                conf = float(text_info[1])
                
                if conf < min_conf:
                    continue
                    
                xs = [pt[0] for pt in box]
                ys = [pt[1] for pt in box]
                x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
                w = max(1.0, x2 - x1)
                h = max(1.0, y2 - y1)
                y_center = y1 + h / 2.0
                
                lines.append({
                    "text": text.strip(),
                    "conf": conf,
                    "x": x1,
                    "y": y1,
                    "w": w,
                    "h": h,
                    "y_center": y_center,
                    "bbox": [x1, y1, x2, y2],
                    "tr_id": f"img_l{len(lines)}"
                })
            
    # Sort primarily top-to-bottom, secondarily left-to-right
    lines.sort(key=lambda l: (l["y"], l["x"]))
    return lines

def extract_text_lines_from_pdf_bytes(pdf_bytes, min_words=30, logger=None):
    """
    Runs pdfplumber on raw PDF bytes to extract digital text words/blocks.
    Returns list of pages, where each page is a list of standardized text line dicts,
    or None if the page is empty/scanned.
    """
    pages = []
    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            for idx, page in enumerate(pdf.pages):
                words = page.extract_words(x_tolerance=1, y_tolerance=1, keep_blank_chars=False)
                if len(words) < min_words:
                    if logger:
                        logger.info(f"Page {idx+1} has too few digital words ({len(words)}). Marking for image-based OCR.")
                    pages.append(None)
                    continue
                    
                lines = []
                for w in words:
                    text = (w.get("text") or "").strip()
                    if not text:
                        continue
                    x1 = float(w.get("x0", 0.0))
                    x2 = float(w.get("x1", 0.0))
                    y1 = float(w.get("top", 0.0))
                    y2 = float(w.get("bottom", 0.0))
                    w_box = max(1.0, x2 - x1)
                    h_box = max(1.0, y2 - y1)
                    y_center = y1 + h_box / 2.0
                    
                    lines.append({
                        "text": text,
                        "conf": 1.0, # digital PDF extraction has high confidence
                        "x": x1,
                        "y": y1,
                        "w": w_box,
                        "h": h_box,
                        "y_center": y_center,
                        "bbox": [x1, y1, x2, y2],
                        "tr_id": f"dig_l{len(lines)}"
                    })
                lines.sort(key=lambda l: (l["y"], l["x"]))
                pages.append(lines)
    except Exception as e:
        if logger:
            logger.warning(f"Digital PDF extraction via pdfplumber failed: {e}")
        return None
    return pages
