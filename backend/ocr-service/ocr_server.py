"""
Marksheet OCR Service for Placement Portal
-------------------------------------------
Extracts student info and subject tables from:
  1. Result Sheet PDFs (temporary exam result)
  2. Original Marksheet / Grade Sheet (official document)

Uses PaddleOCR for text extraction and regex-based parsing.

Run:  python ocr_server.py
Port: 5001 (configurable via OCR_PORT env var)
"""

import os
import re
import json
import tempfile
import traceback
import logging
import sys
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

# PaddleOCR imports
from paddleocr import PaddleOCR

# ─────────────────────────────────────────────────────────────────────────────
# Logging Configuration (Production-safe)
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

from preprocess import build_preprocess_variants
from pdf_text import extract_pdf_words
from subject_parse import (
    parse_subjects,
    STRICT_COURSE_CODE_RE,
    contains_blocked_content,
    detect_semester_heading,
    is_footer_region,
    FOOTER_REGION_PCT,
)
from row_cluster import group_rows
from column_segment import get_fixed_column_bounds
from debug_overlay import (
    draw_boxes,
    draw_rows,
    draw_columns,
    draw_footer_region,
    draw_semester_headings,
)

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR once (reuse across requests)
ocr_engine = PaddleOCR(use_angle_cls=True, lang="en")

# ---------------------------------------------------------------------------
# OCR Configuration
# ---------------------------------------------------------------------------

OCR_MIN_CONF = float(os.environ.get("OCR_MIN_CONF", "0.65"))
OCR_ROW_CLUSTER_MULT = float(os.environ.get("OCR_ROW_CLUSTER_MULT", "0.6"))
OCR_BASE_DPI = int(os.environ.get("OCR_BASE_DPI", "300"))
OCR_RETRY_DPI = int(os.environ.get("OCR_RETRY_DPI", "450"))
OCR_MAX_RETRIES = int(os.environ.get("OCR_MAX_RETRIES", "2"))

# ---------------------------------------------------------------------------
# Utility: Convert PDF pages to PIL images
# ---------------------------------------------------------------------------

def pdf_to_images(pdf_bytes, dpi=300):
    """Convert PDF bytes to a list of PIL Image objects."""
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(pdf_bytes, dpi=dpi)
        return images
    except Exception:
        # Fallback: try treating file as an image directly
        try:
            img = Image.open(BytesIO(pdf_bytes))
            return [img]
        except Exception:
            return []


# ---------------------------------------------------------------------------
# Utility: Run OCR on a PIL image and return all detected text lines
# ---------------------------------------------------------------------------

def extract_text_lines(image, min_conf=None):
    """Run PaddleOCR on a PIL Image and return lines with bounding boxes and confidence."""
    img_array = np.array(image)
    results = ocr_engine.ocr(img_array, cls=True)
    lines = []
    threshold = OCR_MIN_CONF if min_conf is None else float(min_conf)
    if results and results[0]:
        for line in results[0]:
            box = line[0]  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            text = line[1][0]
            conf = float(line[1][1])
            if conf < threshold:
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
                "bbox": [x1, y1, x2, y2]
            })
    # Sort by vertical position (top to bottom), then horizontal (left to right)
    lines.sort(key=lambda l: (l["y"], l["x"]))
    return lines


def run_ocr_with_retries(image):
    """Run OCR with preprocessing variants and confidence selection."""
    attempts = []

    def score_lines(lines_local):
        if not lines_local:
            return 0.0, 0
        avg_conf = sum(l["conf"] for l in lines_local) / max(1, len(lines_local))
        return avg_conf, len(lines_local)

    for name, variant in build_preprocess_variants(image):
        lines = extract_text_lines(variant)
        attempts.append((name, lines))

    scored = []
    for name, lines in attempts:
        avg_conf, count = score_lines(lines)
        scored.append((name, lines, avg_conf, count))

    scored = [s for s in scored if s[1]]
    if not scored:
        return [], {"attempts": [a[0] for a in attempts], "avg_conf": 0.0, "line_count": 0}

    scored.sort(key=lambda s: (s[2], s[3]), reverse=True)
    best_name, best_lines, best_conf, best_count = scored[0]
    return best_lines, {
        "attempts": [a[0] for a in attempts],
        "avg_conf": best_conf,
        "line_count": best_count,
        "selected": best_name
    }


# ---------------------------------------------------------------------------
# Document Type Detection
# ---------------------------------------------------------------------------

RESULT_SHEET_KEYWORDS = [
    "UG & PG END SEMESTER",
    "END SEMESTER EXAMINATION",
    "PROVISIONAL RESULT",
    "EXAM RESULT",
    "RESULT SHEET",
    "SEMESTER EXAMINATION RESULT",
]

ORIGINAL_MARKSHEET_KEYWORDS = [
    "GRADE SHEET",
    "STATEMENT OF MARKS",
    "CHOICE BASED CREDIT SYSTEM",
    "CONSOLIDATED GRADE",
    "ORIGINAL MARKSHEET",
    "TRANSCRIPT",
]


def detect_document_type(full_text):
    """Determine if the document is a result_sheet or original_marksheet."""
    upper = full_text.upper()
    for kw in ORIGINAL_MARKSHEET_KEYWORDS:
        if kw in upper:
            return "original_marksheet"
    for kw in RESULT_SHEET_KEYWORDS:
        if kw in upper:
            return "result_sheet"
    return "unknown"


# ---------------------------------------------------------------------------
# Student Info Extraction
# ---------------------------------------------------------------------------

def normalize_candidate_name(name=""):
    cleaned = re.sub(r"\s+", " ", str(name or "")).strip()
    if not cleaned:
        return ""
    lower = cleaned.lower()
    return re.sub(r"\b\w", lambda m: m.group(0).upper(), lower)


def extract_candidate_name(full_text):
    name_patterns = [
        re.compile(r"NAME\s*(?:OF\s*(?:THE\s*)?CANDIDATE)?\s*[:;\-]?\s*(.+)", re.I),
        re.compile(r"STUDENT\s*NAME\s*[:;\-]?\s*(.+)", re.I),
        re.compile(r"NAME\s*[:;\-]?\s*(.+)", re.I),
    ]

    lines = [line.strip() for line in str(full_text or "").splitlines() if line.strip()]
    for index, line in enumerate(lines):
        for pat in name_patterns:
            match = pat.search(line)
            if not match:
                continue

            raw_name = match.group(1).strip()
            next_line = lines[index + 1].strip() if index + 1 < len(lines) else ""
            next_upper = next_line.upper()

            if not raw_name and next_line and re.fullmatch(r"[A-Z .]+", next_upper or ""):
                raw_name = next_line
            elif next_line:
                initial_match = re.match(r"^([A-Z])(?:\.|\s)?(?:\d+.*)?$", next_upper or "")
                if initial_match:
                    raw_name = f"{raw_name} {initial_match.group(1)}".strip()

            return raw_name, line

    return "", ""


def extract_name_from_full_text(full_text):
    match = re.search(
        r"NAME\s*(?:OF\s*(?:THE\s*)?CANDIDATE)?\s*[:;\-]?\s*([A-Z .\n]+)",
        str(full_text or ""),
        re.I
    )
    if not match:
        return ""

    raw = match.group(1)
    raw = re.sub(r"\s+", " ", raw).strip()
    raw = re.split(
        r"\b(?:REG(?:ISTER)?(?:\s*NO|\s*NUMBER)?|SEMESTER|PROGRAMME|DOB|DATE\s+OF\s+BIRTH|EXAM|SGPA|CGPA|YEAR)\b",
        raw,
        1,
        flags=re.I
    )[0].strip()
    raw = re.split(r"\d{6,}", raw, 1)[0].strip()
    return raw


def extract_student_info(full_text):
    """Extract student details from OCR text using regex patterns."""
    info = {}
    upper = full_text.upper()

    # Name
    raw_name, raw_line = extract_candidate_name(full_text)
    raw_name_alt = ""
    if raw_name:
        raw_name_alt = extract_name_from_full_text(full_text)
        if raw_name_alt and len(raw_name_alt.split()) > len(raw_name.split()):
            raw_name = raw_name_alt

    if raw_name:
        logger.info("NAME RAW OCR LINE: %s", raw_line)
        if raw_name_alt:
            logger.info("NAME RAW OCR FULLTEXT: %s", raw_name_alt)
        logger.info("NAME EXTRACTED FULL: %s", raw_name)
        normalized_name = normalize_candidate_name(raw_name)
        logger.info("NAME FINAL SAVED: %s", normalized_name)
        info["name"] = normalized_name
    else:
        name_patterns = [
            r"NAME\s*(?:OF\s*(?:THE\s*)?CANDIDATE)?\s*[:;]\s*(.+)",
            r"STUDENT\s*NAME\s*[:;]\s*(.+)",
            r"NAME\s*[:;]\s*(.+)",
        ]
        for pat in name_patterns:
            m = re.search(pat, upper)
            if m:
                normalized_name = normalize_candidate_name(m.group(1))
                logger.info("NAME FINAL SAVED: %s", normalized_name)
                info["name"] = normalized_name
                break

    # Register Number
    reg_patterns = [
        r"REG(?:ISTER)?\s*(?:NO|NUMBER|NUM)\.?\s*[:;]?\s*(\d{8,15})",
        r"REGISTER\s*NUMBER\s*[:;]?\s*(\d{8,15})",
        r"REG\.?\s*NO\.?\s*[:;]?\s*(\d{8,15})",
        r"(\d{11,13})",  # fallback: any 11-13 digit number
    ]
    for pat in reg_patterns:
        m = re.search(pat, upper)
        if m:
            info["register_number"] = m.group(1).strip()
            break

    # Date of Birth
    dob_patterns = [
        r"D(?:ATE)?\s*(?:OF)?\s*B(?:IRTH)?\s*[:;]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})",
        r"DOB\s*[:;]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})",
        r"D\s*O\s*B\s*[:;]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})",
    ]
    for pat in dob_patterns:
        m = re.search(pat, upper)
        if m:
            info["date_of_birth"] = m.group(1).strip()
            break

    # Programme / Branch
    prog_patterns = [
        r"PROGRAMME\s*[:;]?\s*(.+?)(?:\n|$)",
        r"BRANCH\s*[:;]?\s*(.+?)(?:\n|$)",
        r"DEGREE\s*[:;]?\s*(.+?)(?:\n|$)",
        r"(B\.?E\.?\s*[-–]?\s*(?:COMPUTER\s*SCIENCE|CSE|ECE|EEE|MECH|CIVIL|IT)[^\n]*)",
    ]
    for pat in prog_patterns:
        m = re.search(pat, upper)
        if m:
            info["programme"] = m.group(1).strip().title()
            break

    # Semester
    sem_patterns = [
        r"SEMESTER\s*[:;]?\s*(\d+|[IVX]+)",
        r"SEM\s*[:;]?\s*(\d+|[IVX]+)",
    ]
    for pat in sem_patterns:
        m = re.search(pat, upper)
        if m:
            val = m.group(1).strip()
            # Convert Roman numerals
            roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}
            info["semester"] = roman_map.get(val, int(val) if val.isdigit() else val)
            break

    # Year
    year_patterns = [
        r"YEAR\s*[:;]?\s*(\d+|[IVX]+)",
    ]
    for pat in year_patterns:
        m = re.search(pat, upper)
        if m:
            val = m.group(1).strip()
            roman_map = {"I": 1, "II": 2, "III": 3, "IV": 4}
            info["year"] = roman_map.get(val, int(val) if val.isdigit() else val)
            break

    # Exam Month/Year
    exam_patterns = [
        r"EXAM\s*(?:MONTH|MM)\s*/?\s*(?:YEAR|YY)\s*[:;]?\s*([A-Z]+\s*\d{4})",
        r"((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\w*\s*[-/]?\s*\d{4})",
    ]
    for pat in exam_patterns:
        m = re.search(pat, upper)
        if m:
            info["exam_month_year"] = m.group(1).strip().title()
            break

    # Regulation
    reg_patterns_2 = [
        r"REGULATION\s*[:;]?\s*(\d{4})",
    ]
    for pat in reg_patterns_2:
        m = re.search(pat, upper)
        if m:
            info["regulation"] = m.group(1).strip()
            break

    # SGPA / GPA
    sgpa_patterns = [
        r"(?:SGPA|GPA|CURRENT\s*SGPA)\s*[:;]?\s*(\d+\.?\d*)",
    ]
    for pat in sgpa_patterns:
        m = re.search(pat, upper)
        if m:
            info["sgpa"] = m.group(1).strip()
            break

    # CGPA
    cgpa_patterns = [
        r"(?:CGPA|OVERALL\s*CGPA|CUMULATIVE)\s*[:;]?\s*(\d+\.?\d*)",
    ]
    for pat in cgpa_patterns:
        m = re.search(pat, upper)
        if m:
            info["cgpa"] = m.group(1).strip()
            break

    # Credits info
    attempted_m = re.search(r"(?:CREDITS?\s*REGISTERED|ATTEMPTED)\s*[:;]?\s*(\d+)", upper)
    if attempted_m:
        info["credits_attempted"] = attempted_m.group(1).strip()

    earned_m = re.search(r"(?:CREDITS?\s*EARNED|CLEARED)\s*[:;]?\s*(\d+)", upper)
    if earned_m:
        info["credits_earned"] = earned_m.group(1).strip()

    pending_m = re.search(r"PENDING\s*[:;]?\s*(\d+)", upper)
    if pending_m:
        info["credits_pending"] = pending_m.group(1).strip()

    # Published date
    pub_m = re.search(r"PUBLISHED\s*[:;]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})", upper)
    if pub_m:
        info["published_date"] = pub_m.group(1).strip()

    return info


# ---------------------------------------------------------------------------
# Grade Normalization
# ---------------------------------------------------------------------------

# OCR often misreads '+' as '-'. Since A- and B- don't exist in this grading system, fix them.
GRADE_CORRECTIONS = {'A-': 'A+', 'B-': 'B+'}

def normalize_grade(grade):
    if not grade:
        return ''
    upper = grade.strip().upper()
    return GRADE_CORRECTIONS.get(upper, upper)


def normalize_result(result):
    if not result:
        return ''
    upper = result.strip().upper()
    if upper in ("PASS", "P"):
        return "P"
    if upper in ("FAIL", "F"):
        return "F"
    if upper == "AB":
        return "AB"
    if upper == "W":
        return "W"
    return upper


def normalize_course_code(code):
    if not code:
        return ''
    raw = code.strip().upper().replace(" ", "")
    # Fix common OCR mistakes inside digit blocks
    raw = re.sub(r"(?<=\d)O|O(?=\d)", "0", raw)
    raw = re.sub(r"(?<=\d)I|I(?=\d)", "1", raw)
    raw = raw.replace("5A", "SA")
    return raw


# ---------------------------------------------------------------------------
# Subject Table Extraction
# ---------------------------------------------------------------------------

SEMESTER_CODE_ROW_RE = re.compile(r"\b([1-8])\s+(20\s*[A-Z]{2,3}\s*[0-9]{3})\b")

def group_lines_into_rows(lines):
    if not lines:
        return []
    heights = [l["h"] for l in lines if l.get("h")]
    median_h = float(np.median(heights)) if heights else 12.0
    threshold = max(6.0, median_h * OCR_ROW_CLUSTER_MULT)

    rows = []
    for line in sorted(lines, key=lambda l: (l["y_center"], l["x"])):
        placed = False
        for row in rows:
            if abs(line["y_center"] - row["y_center"]) <= threshold:
                row["items"].append(line)
                row["y_center"] = (row["y_center"] * row["count"] + line["y_center"]) / (row["count"] + 1)
                row["count"] += 1
                placed = True
                break
        if not placed:
            rows.append({"items": [line], "y_center": line["y_center"], "count": 1})

    for row in rows:
        row["items"].sort(key=lambda l: l["x"])
    rows.sort(key=lambda r: r["y_center"])
    return rows


def extract_row_semesters(lines):
    """
    Extract semester values from table rows in the format:
    <semester> <course_code> <subject_name> <grade> <result>
    """
    semester_map = {}
    rows = group_rows(lines, mult=OCR_ROW_CLUSTER_MULT)
    for row in rows:
        tokens = []
        for item in row["items"]:
            token = str(item.get("text", "")).strip()
            if not token:
                continue
            tokens.append(token)
        if not tokens:
            continue
        row_text = " ".join(tokens)
        row_text = re.sub(r"\s+", " ", row_text).strip()
        match = SEMESTER_CODE_ROW_RE.search(row_text)
        if not match:
            continue
        semester = int(match.group(1))
        course_code = normalize_course_code(match.group(2))
        print(f"[SEM PARSE] semester={semester}, course={course_code}")
        semester_map.setdefault(course_code, []).append(semester)
    return semester_map


def apply_row_semesters(subjects, semester_map):
    if not semester_map:
        return subjects
    for subject in subjects:
        code = normalize_course_code(subject.get("courseCode") or subject.get("course_code") or "")
        if not code:
            continue
        if code in semester_map and semester_map[code]:
            subject["semester"] = semester_map[code].pop(0)
    return subjects


def extract_subjects_v2(lines, doc_type):
    """
    Extract subject rows from OCR lines with coordinate-aware row grouping.
    """
    subjects = []
    course_code_pattern = re.compile(r"\b(\d{2}[A-Z]{2,4}\d{2,4}|[A-Z]{2,4}\d{3,5})\b")
    grade_pattern = re.compile(r"\b(O|A\+|A\-|A|B\+|B\-|B|C|U|S|AB|RA|SA|W)\b")
    result_pattern = re.compile(r"\b(PASS|FAIL|P|F|AB|W)\b", re.IGNORECASE)

    rows = group_lines_into_rows(lines)
    sno_counter = 1
    pending = None

    for row in rows:
        row_text = " ".join(item["text"] for item in row["items"])
        row_text = re.sub(r"\s+", " ", row_text).strip()

        code_match = course_code_pattern.search(row_text)
        grade_match = grade_pattern.search(row_text)
        result_match = result_pattern.search(row_text)

        if not code_match:
            # If this looks like a continuation of a long course name, append to previous
            if pending and row_text and not grade_match and len(row_text.split()) >= 2:
                pending["courseName"] = (pending["courseName"] + " " + row_text).strip()
            continue

        course_code = normalize_course_code(code_match.group(1))
        code_pos = row_text.find(code_match.group(1))
        after_code = row_text[code_pos + len(code_match.group(1)):].strip()

        grade = normalize_grade(grade_match.group(1)) if grade_match else ""
        result = normalize_result(result_match.group(1)) if result_match else ""

        # Remove grade/result tokens from tail for clean course name
        tail = after_code
        if result:
            tail = re.sub(result_pattern, "", tail).strip()
        if grade:
            tail = re.sub(grade_pattern, "", tail).strip()

        # Course name is remaining tail, minus trailing credits
        course_name = re.sub(r"\s+", " ", tail).strip()
        course_name = re.sub(r"^\d+\s+", "", course_name)
        course_name = re.sub(r"\s+\d+$", "", course_name)

        # Semester should come from page header; keep null here
        subject = {
            "sno": sno_counter,
            "semester": None,
            "courseCode": course_code,
            "courseName": course_name.title() if course_name else course_code,
            "grade": grade,
            "result": result
        }

        subjects.append(subject)
        pending = subject
        sno_counter += 1

    return subjects


def build_page_payload(lines, full_text, doc_type):
    student_info = extract_student_info(full_text)
    subjects = parse_subjects(lines, row_cluster_mult=OCR_ROW_CLUSTER_MULT)
    semester_map = extract_row_semesters(lines)
    subjects = apply_row_semesters(subjects, semester_map)
    avg_conf = 0.0
    if lines:
        avg_conf = sum(l["conf"] for l in lines) / max(1, len(lines))
    return {
        "document_type": doc_type,
        "student_info": student_info,
        "subjects": subjects,
        "ocr_meta": {
            "avg_conf": round(avg_conf, 4),
            "line_count": len(lines)
        },
        "raw_text": full_text[:2000]
    }


# ---------------------------------------------------------------------------
# Main Parse Endpoint
# ---------------------------------------------------------------------------

@app.route("/parse-marksheet", methods=["POST"])
def parse_marksheet():
    """
    Accepts a PDF or image file upload.
    Returns extracted student info + subject table as JSON.
    """
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
    
    file = request.files["file"]
    if not file.filename:
        return jsonify({"success": False, "error": "Empty filename"}), 400
    
    try:
        print(f"[OCR REQUEST] /parse-marksheet file={file.filename}")
        file_bytes = file.read()
        filename_lower = file.filename.lower()
        
        # Convert to images
        if filename_lower.endswith(".pdf"):
            images = pdf_to_images(file_bytes)
        elif filename_lower.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp")):
            images = [Image.open(BytesIO(file_bytes))]
        else:
            return jsonify({"success": False, "error": "Unsupported file type. Use PDF or image."}), 400
        
        if not images:
            return jsonify({"success": False, "error": "Could not process the uploaded file."}), 400
        
        # Extract text from all pages
        all_lines = []
        all_text_parts = []
        for img in images:
            lines, meta = run_ocr_with_retries(img)
            all_lines.extend(lines)
            all_text_parts.extend(line["text"] for line in lines)
        
        full_text = "\n".join(all_text_parts)
        
        if not full_text.strip():
            return jsonify({"success": False, "error": "No text could be extracted. Try a clearer image or PDF."}), 400
        
        # Detect document type
        doc_type = detect_document_type(full_text)
        
        # Extract student info
        student_info = extract_student_info(full_text)
        
        # Extract subjects
        subjects = parse_subjects(all_lines, row_cluster_mult=OCR_ROW_CLUSTER_MULT)
        semester_map = extract_row_semesters(all_lines)
        subjects = apply_row_semesters(subjects, semester_map)
        
        print(f"[OCR RESPONSE] /parse-marksheet completed subjects={len(subjects)}")
        return jsonify({
            "success": True,
            "document_type": doc_type,
            "student_info": student_info,
            "subjects": subjects,
            "raw_text": full_text[:2000]  # First 2000 chars for debugging
        })
    
    except Exception as e:
        print(f"[OCR ERROR] /parse-marksheet failed: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/parse-marksheet-pages", methods=["POST"])
def parse_marksheet_pages():
    """
    Accepts a PDF or image file upload.
    Returns extracted student info + subject table per page as JSON.
    """
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"success": False, "error": "Empty filename"}), 400

    try:
        print(f"[OCR REQUEST] /parse-marksheet-pages file={file.filename}")
        file_bytes = file.read()
        filename_lower = file.filename.lower()

        # Convert to images
        if filename_lower.endswith(".pdf"):
            images = pdf_to_images(file_bytes)
        elif filename_lower.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp")):
            images = [Image.open(BytesIO(file_bytes))]
        else:
            return jsonify({"success": False, "error": "Unsupported file type. Use PDF or image."}), 400

        if not images:
            return jsonify({"success": False, "error": "Could not process the uploaded file."}), 400

        pages = []
        for img in images:
            lines, meta = run_ocr_with_retries(img)
            page_text_parts = [line["text"] for line in lines]
            full_text = "\n".join(page_text_parts)

            if not full_text.strip():
                pages.append({
                    "document_type": "unknown",
                    "student_info": {},
                    "subjects": [],
                    "ocr_meta": {"avg_conf": 0.0, "line_count": 0},
                    "raw_text": ""
                })
                continue

            doc_type = detect_document_type(full_text)
            payload = build_page_payload(lines, full_text, doc_type)
            payload["ocr_meta"].update({
                "attempts": meta.get("attempts", []),
                "selected": meta.get("selected"),
                "avg_conf": meta.get("avg_conf", payload["ocr_meta"]["avg_conf"]),
                "line_count": meta.get("line_count", payload["ocr_meta"]["line_count"])
            })

            pages.append(payload)

        print(f"[OCR RESPONSE] /parse-marksheet-pages completed pages={len(pages)}")
        return jsonify({
            "success": True,
            "total_pages": len(pages),
            "pages": pages
        })

    except Exception as e:
        print(f"[OCR ERROR] /parse-marksheet-pages failed: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    logger.info("[HEALTHZ] Health check requested")
    return jsonify({"status": "ok", "service": "marksheet-ocr", "version": "2.0"})


@app.route("/healthz", methods=["GET"])
def healthz():
    logger.info("[HEALTHZ] /healthz requested")
    return jsonify({"status": "healthy"})


@app.route("/debug-overlay", methods=["POST"])
def debug_overlay():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"success": False, "error": "Empty filename"}), 400

    try:
        file_bytes = file.read()
        filename_lower = file.filename.lower()

        if filename_lower.endswith(".pdf"):
            images = pdf_to_images(file_bytes, dpi=OCR_BASE_DPI)
            if not images and OCR_RETRY_DPI > OCR_BASE_DPI:
                images = pdf_to_images(file_bytes, dpi=OCR_RETRY_DPI)
            if not images:
                return jsonify({"success": False, "error": "Could not process the uploaded file."}), 400
            img = images[0]
        else:
            img = Image.open(BytesIO(file_bytes))

        lines, _meta = run_ocr_with_retries(img)
        rows = group_rows(lines, mult=OCR_ROW_CLUSTER_MULT)
        headings = []
        for line in lines:
            text = str(line.get("text", "")).strip()
            if not text:
                continue
            sem = detect_semester_heading(text)
            if sem is None:
                continue
            headings.append({"semester": sem, "y": float(line.get("y_center", line.get("y", 0.0)))})

        accepted_rows = []
        rejected_rows = []
        page_height = img.height
        for row in rows:
            row_text = " ".join(item["text"] for item in row["items"])
            row_text = re.sub(r"\s+", " ", row_text).strip()
            row_y = float(row.get("y_center", 0.0))
            if is_footer_region(row_y, page_height) or contains_blocked_content(row_text):
                rejected_rows.append(row)
                continue
            if STRICT_COURSE_CODE_RE.search(row_text):
                accepted_rows.append(row)

        overlay = draw_boxes(img, lines)
        overlay = draw_rows(Image.fromarray(overlay), accepted_rows, color=(0, 255, 0))
        overlay = draw_rows(Image.fromarray(overlay), rejected_rows, color=(0, 0, 255))
        overlay = draw_columns(Image.fromarray(overlay), get_fixed_column_bounds())
        footer_y = page_height * (1.0 - FOOTER_REGION_PCT)
        overlay = draw_footer_region(Image.fromarray(overlay), footer_y)
        overlay = draw_semester_headings(Image.fromarray(overlay), headings)

        out = BytesIO()
        Image.fromarray(overlay).save(out, format="PNG")
        out.seek(0)
        return app.response_class(out.read(), mimetype="image/png")
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/parse-marksheet-pages-v2", methods=["POST"])
def parse_marksheet_pages_v2():
    """
    V2 endpoint: returns OCR lines, reconstructed subjects, and confidence metadata per page.
    """
    if "file" not in request.files:
        logger.error("[OCR ERROR] No file uploaded in request")
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        logger.error("[OCR ERROR] Empty filename")
        return jsonify({"success": False, "error": "Empty filename"}), 400

    try:
        logger.info(f"[OCR REQUEST] /parse-marksheet-pages-v2 file={file.filename}")
        file_bytes = file.read()
        filename_lower = file.filename.lower()

        pages = []

        if filename_lower.endswith(".pdf"):
            logger.info(f"[OCR PROCESS] Processing PDF: {file.filename}")
            pdf_pages = None
            try:
                pdf_pages = extract_pdf_words(file_bytes, min_words=30)
            except Exception as e:
                logger.warning(f"[OCR PROCESS] PDF text extraction failed: {str(e)}")
                pdf_pages = None

            images = None
            if pdf_pages is None or any(p is None for p in pdf_pages):
                logger.info("[OCR PROCESS] Falling back to image-based OCR")
                images = pdf_to_images(file_bytes, dpi=OCR_BASE_DPI)
                if not images and OCR_RETRY_DPI > OCR_BASE_DPI:
                    logger.info(f"[OCR PROCESS] Retrying with higher DPI ({OCR_RETRY_DPI})")
                    images = pdf_to_images(file_bytes, dpi=OCR_RETRY_DPI)

            if pdf_pages is None and not images:
                logger.error("[OCR ERROR] Could not process the uploaded file - no pages extracted")
                return jsonify({"success": False, "error": "Could not process the uploaded file."}), 400

            total_pages = len(pdf_pages) if pdf_pages is not None else len(images)
            logger.info(f"[OCR PROCESS] Processing {total_pages} page(s)")

            for idx in range(total_pages):
                lines = None
                meta = {"attempts": []}

                if pdf_pages is not None and pdf_pages[idx] is not None:
                    lines = pdf_pages[idx]
                    meta.update({"attempts": ["pdfplumber"], "selected": "pdfplumber", "avg_conf": 1.0})
                else:
                    if not images or idx >= len(images):
                        lines = []
                    else:
                        lines, meta = run_ocr_with_retries(images[idx])

                page_text_parts = [line["text"] for line in lines]
                full_text = "\n".join(page_text_parts)

                if not full_text.strip():
                    pages.append({
                        "document_type": "unknown",
                        "student_info": {},
                        "subjects": [],
                        "ocr_meta": {"avg_conf": 0.0, "line_count": 0, "attempts": meta.get("attempts", [])},
                        "raw_text": ""
                    })
                    continue

                doc_type = detect_document_type(full_text)
                payload = build_page_payload(lines, full_text, doc_type)
                payload["ocr_meta"].update({
                    "attempts": meta.get("attempts", []),
                    "selected": meta.get("selected"),
                    "avg_conf": meta.get("avg_conf", payload["ocr_meta"]["avg_conf"]),
                    "line_count": meta.get("line_count", payload["ocr_meta"]["line_count"])
                })
                pages.append(payload)

        elif filename_lower.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp")):
            img = Image.open(BytesIO(file_bytes))
            lines, meta = run_ocr_with_retries(img)
            page_text_parts = [line["text"] for line in lines]
            full_text = "\n".join(page_text_parts)

            if not full_text.strip():
                pages.append({
                    "document_type": "unknown",
                    "student_info": {},
                    "subjects": [],
                    "ocr_meta": {"avg_conf": 0.0, "line_count": 0, "attempts": meta.get("attempts", [])},
                    "raw_text": ""
                })
            else:
                doc_type = detect_document_type(full_text)
                payload = build_page_payload(lines, full_text, doc_type)
                payload["ocr_meta"].update({
                    "attempts": meta.get("attempts", []),
                    "selected": meta.get("selected"),
                    "avg_conf": meta.get("avg_conf", payload["ocr_meta"]["avg_conf"]),
                    "line_count": meta.get("line_count", payload["ocr_meta"]["line_count"])
                })
                pages.append(payload)
        else:
            return jsonify({"success": False, "error": "Unsupported file type. Use PDF or image."}), 400

        print(f"[OCR RESPONSE] /parse-marksheet-pages-v2 completed pages={len(pages)}")
        return jsonify({
            "success": True,
            "total_pages": len(pages),
            "pages": pages
        })

    except Exception as e:
        print(f"[OCR ERROR] /parse-marksheet-pages-v2 failed: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT") or os.environ.get("PORT", 5001))
    logger.info("=" * 75)
    logger.info("[OCR START] Marksheet OCR Service Starting")
    logger.info("=" * 75)
    logger.info(f"[OCR START] Listening on 0.0.0.0:{port}")
    logger.info("[OCR START] Endpoints available:")
    logger.info("  ✓ POST /parse-marksheet         - Upload PDF/image for extraction")
    logger.info("  ✓ POST /parse-marksheet-pages-v2 - Per-page extraction (v2)")
    logger.info("  ✓ GET  /health                  - Health check")
    logger.info("[OCR START] PaddleOCR engine initialized and ready")
    logger.info("=" * 75)
    app.run(host="0.0.0.0", port=port, debug=False)
