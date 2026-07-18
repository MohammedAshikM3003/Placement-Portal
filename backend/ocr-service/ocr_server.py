# backend/ocr-service/ocr_server.py
"""
Redesigned Marksheet OCR Server for Placement Portal
---------------------------------------------------
Integrates the modular, layout-independent OCR extraction pipeline.
Supports different universities, regulations, course code shapes,
and semester formats with robust confidence scoring and error logging.
"""

import os
import sys

# Configure environment variables to optimize CPU execution and prevent PaddlePaddle OpenMP deadlock hangs
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

import traceback
import logging
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# Pipeline imports
from ocr.pipeline import Pipeline
from ocr.ocr_engine import extract_text_lines_from_pdf_bytes, get_ocr_engine

# Preprocessing utils
from ocr.preprocessing import build_preprocess_variants

# ─────────────────────────────────────────────────────────────────────────────
# Logging Configuration
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Instantiate the redesigned pipeline
pipeline_executor = Pipeline()

OCR_MIN_CONF = float(os.environ.get("OCR_MIN_CONF", "0.65"))
OCR_BASE_DPI = int(os.environ.get("OCR_BASE_DPI", "300"))
OCR_RETRY_DPI = int(os.environ.get("OCR_RETRY_DPI", "450"))

def pdf_to_images(pdf_bytes, dpi=300):
    """Convert PDF bytes to a list of PIL Image objects."""
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(pdf_bytes)
        images = []
        scale = dpi / 72.0
        for page in pdf:
            bitmap = page.render(scale=scale)  # type: ignore
            pil_img = bitmap.to_pil()
            images.append(pil_img)
        logger.info(f"Successfully converted PDF to {len(images)} images using pypdfium2")
        return images
    except Exception as e:
        logger.warning(f"pypdfium2 conversion failed: {e}. Trying pdf2image...")
        try:
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(pdf_bytes, dpi=dpi)
            return images
        except Exception as e2:
            logger.warning(f"pdf2image conversion failed: {e2}. Trying Image.open directly.")
            try:
                img = Image.open(BytesIO(pdf_bytes))
                return [img]
            except Exception:
                return []

@app.route("/parse-marksheet-pages-v2", methods=["POST"])
def parse_marksheet_pages_v2():
    """
    Unified V2 endpoint: returns detailed OCR logs, confidence ratings,
    and extracted subjects per page.
    """
    if "file" not in request.files:
        logger.error("[OCR SERVER] No file uploaded")
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        logger.error("[OCR SERVER] Empty filename")
        return jsonify({"success": False, "error": "Empty filename"}), 400

    try:
        logger.info(f"[OCR SERVER] /parse-marksheet-pages-v2 received file: {file.filename}")
        file_bytes = file.read()
        filename_lower = file.filename.lower()

        pages = []
        fallback_semester = request.form.get("semester")
        if fallback_semester:
            try:
                fallback_semester = int(fallback_semester)
            except ValueError:
                pass

        import json
        req_options = {}
        options_raw = request.form.get("options")
        if options_raw:
            try:
                req_options = json.loads(options_raw)
                logger.info(f"[OCR SERVER] Decoded options from request: {req_options}")
            except Exception as ex:
                logger.warning(f"[OCR SERVER] Failed to parse options JSON: {ex}")

        options = {
            "min_conf": req_options.get("min_conf", OCR_MIN_CONF),
            "semester": req_options.get("semester") or fallback_semester,
            "jobId": req_options.get("jobId"),
            "debug": req_options.get("debug") or (os.environ.get("DEBUG_MODE") == "true")
        }

        # Compute SHA256 (Phase 15 - Component 6)
        from ocr.ocr_cache import compute_sha256, get_cached_result, set_cached_result
        file_hash = compute_sha256(file_bytes)
        
        # Bypass cache on debug sessions to ensure fresh overlay files are generated
        bypass_cache = options.get("debug") == True
        cached_res = None if bypass_cache else get_cached_result(file_hash)
        if cached_res:
            logger.info(f"[OCR SERVER] Intelligent Cache Hit for SHA256: {file_hash}")
            return jsonify(cached_res)

        # Parse using the clean developer SDK (Phase 20 - Component 1)
        from ocr.ocr_sdk import OCRPlatform
        pages = OCRPlatform.parse(file_bytes, file.filename, options)

        response_payload = {
            "success": True,
            "total_pages": len(pages),
            "pages": pages
        }
        set_cached_result(file_hash, response_payload)
        logger.info(f"[OCR SERVER] Completed request for {file.filename} with {len(pages)} pages")
        return jsonify(response_payload)

    except Exception as e:
        logger.error(f"[OCR SERVER] Failed parsing file {file.filename}: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/parse-marksheet", methods=["POST"])
def parse_marksheet():
    """
    V1 legacy compatibility endpoint. Runs V2 page parsing
    and merges all extracted subjects into a single combined response.
    """
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"success": False, "error": "Empty filename"}), 400

    try:
        # Delegate directly to our V2 logic
        response = parse_marksheet_pages_v2()
        if isinstance(response, tuple):
            return response
            
        json_data = response.get_json()
        if not json_data.get("success"):
            return response

        # Merge results from all pages
        pages = json_data.get("pages", [])
        merged_subjects = []
        merged_student_info = {}
        merged_raw_text_parts = []
        sno_counter = 1

        for page in pages:
            # Merge student info keys
            for k, v in page.get("student_info", {}).items():
                if v and not merged_student_info.get(k):
                    merged_student_info[k] = v
            # Append subjects with adjusted sno
            for sub in page.get("subjects", []):
                new_sub = dict(sub)
                new_sub["sno"] = sno_counter
                merged_subjects.append(new_sub)
                sno_counter += 1
            if page.get("raw_text"):
                merged_raw_text_parts.append(page["raw_text"])

        return jsonify({
            "success": True,
            "document_type": pages[0].get("document_type", "unknown") if pages else "unknown",
            "student_info": merged_student_info,
            "subjects": merged_subjects,
            "raw_text": "\n".join(merged_raw_text_parts)[:2000]
        })

    except Exception as e:
        logger.error(f"[OCR SERVER] Legacy parse failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "marksheet-ocr", "version": "3.0"})


@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify({"status": "healthy"})


@app.route("/debug-overlay", methods=["POST"])
def debug_overlay():
    """
    Returns overlay image of first page containing bounding boxes of OCR blocks.
    """
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    try:
        file_bytes = file.read()
        filename = file.filename or ""
        filename_lower = filename.lower()

        if filename_lower.endswith(".pdf"):
            images = pdf_to_images(file_bytes, dpi=OCR_BASE_DPI)
            if not images:
                return jsonify({"success": False, "error": "Could not extract pages from PDF"}), 400
            img = images[0]
        else:
            img = Image.open(BytesIO(file_bytes))

        # Get OCR blocks
        from ocr.ocr_engine import extract_text_lines_from_image
        lines = extract_text_lines_from_image(img, min_conf=OCR_MIN_CONF)

        # Draw boxes on image
        import cv2
        import numpy as np
        img_np = np.array(img)
        for line in lines:
            box = line["bbox"]
            cv2.rectangle(img_np, (int(box[0]), int(box[1])), (int(box[2]), int(box[3])), (0, 255, 0), 2)
            cv2.putText(img_np, line["text"][:15], (int(box[0]), int(box[1]) - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

        out = BytesIO()
        Image.fromarray(img_np).save(out, format="PNG")
        out.seek(0)
        return app.response_class(out.read(), mimetype="image/png")
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/v1/health/liveness", methods=["GET"])
def api_v1_liveness():
    return jsonify({"status": "healthy", "service": "ocr", "version": "1.0.0"})

@app.route("/api/v1/health/readiness", methods=["GET"])
def api_v1_readiness():
    if get_ocr_engine() is not None:
        return jsonify({"status": "ready"})
    return jsonify({"status": "not ready"}), 503

@app.route("/api/v1/parse-marksheet-pages-v2", methods=["POST"])
def api_v1_parse_marksheet_pages_v2():
    return parse_marksheet_pages_v2()


if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT") or os.environ.get("PORT", 5001))
    logger.info("=" * 75)
    logger.info("[OCR START] Redesigned Marksheet OCR Service Starting (v3.0)")
    logger.info("=" * 75)
    logger.info(f"[OCR START] Listening on 0.0.0.0:{port}")
    logger.info("[OCR START] PaddleOCR engine initialized and ready")
    logger.info("=" * 75)
    app.run(host="0.0.0.0", port=port, debug=False)
