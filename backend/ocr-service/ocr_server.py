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
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

# PaddleOCR imports
from paddleocr import PaddleOCR

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR once (reuse across requests)
ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)

# ---------------------------------------------------------------------------
# Utility: Convert PDF pages to PIL images
# ---------------------------------------------------------------------------

def pdf_to_images(pdf_bytes):
    """Convert PDF bytes to a list of PIL Image objects."""
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(pdf_bytes, dpi=300)
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

def extract_text_lines(image):
    """Run PaddleOCR on a PIL Image and return list of (text, confidence) tuples, sorted top-to-bottom."""
    img_array = np.array(image)
    results = ocr_engine.ocr(img_array, cls=True)
    lines = []
    if results and results[0]:
        for line in results[0]:
            box = line[0]  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            text = line[1][0]
            conf = line[1][1]
            # Use top-left y coordinate for sorting
            y_pos = min(pt[1] for pt in box)
            x_pos = min(pt[0] for pt in box)
            lines.append({"text": text.strip(), "conf": conf, "y": y_pos, "x": x_pos})
    # Sort by vertical position (top to bottom), then horizontal (left to right)
    lines.sort(key=lambda l: (l["y"], l["x"]))
    return lines


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

def extract_student_info(full_text):
    """Extract student details from OCR text using regex patterns."""
    info = {}
    upper = full_text.upper()

    # Name
    name_patterns = [
        r"NAME\s*(?:OF\s*(?:THE\s*)?CANDIDATE)?\s*[:;]\s*(.+)",
        r"STUDENT\s*NAME\s*[:;]\s*(.+)",
        r"NAME\s*[:;]\s*(.+)",
    ]
    for pat in name_patterns:
        m = re.search(pat, upper)
        if m:
            info["name"] = m.group(1).strip().title()
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


# ---------------------------------------------------------------------------
# Subject Table Extraction
# ---------------------------------------------------------------------------

def extract_subjects(lines, doc_type):
    """
    Extract subject rows from OCR lines.
    
    Strategies:
    1. Look for course code patterns (e.g. 20CS511, 18MA201)
    2. Group nearby text into table rows based on y-coordinate clustering
    3. Parse each row for semester, code, name, grade, result
    """
    subjects = []
    
    # Gather all text with positions
    # Course code pattern: 2-digit year + 2-letter dept + 3-digit number
    course_code_pattern = re.compile(r"\b(\d{2}[A-Z]{2}\d{3})\b")
    
    # Group lines by approximate y-coordinate (within 15px = same row)
    rows_by_y = {}
    for line in lines:
        y_key = round(line["y"] / 15) * 15
        if y_key not in rows_by_y:
            rows_by_y[y_key] = []
        rows_by_y[y_key].append(line)
    
    # Sort each row's items by x position
    for y_key in rows_by_y:
        rows_by_y[y_key].sort(key=lambda l: l["x"])
    
    # Process rows that contain course codes
    sorted_y_keys = sorted(rows_by_y.keys())
    sno_counter = 1
    
    for y_key in sorted_y_keys:
        row_items = rows_by_y[y_key]
        row_text = " ".join(item["text"] for item in row_items)
        
        code_match = course_code_pattern.search(row_text)
        if not code_match:
            continue
            
        course_code = code_match.group(1)
        
        # Extract semester number from the row
        semester = None
        sem_match = re.search(r"\b([1-8])\b", row_text)
        # The semester number usually appears before the course code
        code_pos = row_text.find(course_code)
        if sem_match and sem_match.start() < code_pos:
            semester = int(sem_match.group(1))
        else:
            # Try extracting from course code (e.g. 20CS5xx → semester 5)
            code_digit = course_code[4]  # 5th char hints at semester/year
            if code_digit.isdigit():
                semester = int(code_digit)
        
        # Extract grade - look for common grade patterns after course name
        grade = None
        grade_patterns = [
            r"\b(O|A\+|A|B\+|B|C|U|S|AB|RA|SA|W)\b",
        ]
        # Get text after the course code
        after_code = row_text[code_pos + len(course_code):]
        
        # Grade is usually near the end of the row
        grade_candidates = re.findall(r"\b(O|A\+|A\-|A|B\+|B\-|B|C|U|S|AB|RA|SA|W)\b", after_code)
        if grade_candidates:
            grade = normalize_grade(grade_candidates[0])
        
        # Extract result - P/F or PASS/FAIL
        result = None
        result_match = re.search(r"\b(PASS|FAIL|P|F)\b", after_code, re.IGNORECASE)
        if result_match:
            r_val = result_match.group(1).upper()
            result = "P" if r_val in ("PASS", "P") else "F"
        
        # Course name: text between code and grade area
        course_name = ""
        # Collect text items that are between course code and grade columns
        for item in row_items:
            txt = item["text"].strip()
            # Skip if it's a number, the course code, grade, or result
            if txt == course_code or txt in (grade, result, "P", "F", "PASS", "FAIL"):
                continue
            if re.match(r"^\d{1,2}$", txt):  # serial number or semester
                continue
            if re.match(r"^\d{2}[A-Z]{2}\d{3}$", txt):  # course code
                continue
            if txt in ("O", "A+", "A-", "A", "B+", "B-", "B", "C", "U", "S", "AB", "RA", "SA", "W"):
                continue
            # Likely part of course name
            if len(txt) > 2:
                course_name += (" " if course_name else "") + txt
        
        # Clean up course name
        course_name = re.sub(r"\s+", " ", course_name).strip()
        # Remove leading/trailing numbers that might be credits or grade points
        course_name = re.sub(r"^\d+\s+", "", course_name)
        course_name = re.sub(r"\s+\d+$", "", course_name)
        
        if course_code and course_name:
            subjects.append({
                "sno": sno_counter,
                "semester": semester,
                "courseCode": course_code,
                "courseName": course_name.title(),
                "grade": grade or "",
                "result": result or ""
            })
            sno_counter += 1
    
    return subjects


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
            lines = extract_text_lines(img)
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
        subjects = extract_subjects(all_lines, doc_type)
        
        return jsonify({
            "success": True,
            "document_type": doc_type,
            "student_info": student_info,
            "subjects": subjects,
            "raw_text": full_text[:2000]  # First 2000 chars for debugging
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "marksheet-ocr"})


if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT", 5001))
    print(f"🔍 Marksheet OCR Service starting on port {port}")
    print(f"   POST /parse-marksheet  — Upload PDF/image for extraction")
    print(f"   GET  /health           — Health check")
    app.run(host="0.0.0.0", port=port, debug=False)
