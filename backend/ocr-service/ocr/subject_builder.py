# backend/ocr-service/ocr/subject_builder.py
import re
from ocr.course_code_detector import detect_course_code
from ocr.normalizer import clean_whitespace, normalize_roman_numerals

BLOCKED_KEYWORDS_WORDS = {
    "revaluation", "examination", "published", "website", "apply", "notice",
    "gpa", "cgpa", "total", "grand", "cleared", "candidate", "dob", "branch"
}
BLOCKED_KEYWORDS_PHRASES = [
    "controller of", "last date", "register number", "name of the candidate",
    "office of", "result on website"
]

VALID_GRADES = {"O", "A+", "A", "B+", "B", "C", "U", "S", "RA", "SA", "W", "WD", "AB", "P", "F"}
CREDIT_PATTERN = re.compile(r"\b([0-9](?:\.[0-9])?)\b")

def detect_grade_confidence(grade: str, items: list) -> float:
    if not grade:
        return 1.0
    upper_grade = grade.upper()
    for item in items:
        text = str(item.get("text", "")).strip().upper()
        if text == upper_grade or upper_grade in text:
            return float(item.get("conf", 1.0))
    return 1.0
def is_blocked_line(text: str) -> bool:
    """Checks if a row contains footer/notice/label text that should be skipped."""
    if not text:
        return True
    lower = text.lower()
    
    # 1. Match specific layout phrases
    if any(p in lower for p in BLOCKED_KEYWORDS_PHRASES):
        return True
        
    # 2. Match individual blocked words with strict word boundaries
    for w in BLOCKED_KEYWORDS_WORDS:
        if re.search(rf"\b{re.escape(w)}\b", lower):
            return True
            
    # 3. Check for URL patterns
    if "www." in lower or "http" in lower:
        return True
        
    return False

def group_lines_into_rows(lines, y_tolerance=14.0):
    """
    Groups OCR lines into horizontal rows based on vertical proximity.
    Returns: list of dicts [{"y_center": float, "items": list}] sorted top-to-bottom.
    """
    if not lines:
        return []
        
    for line in lines:
        if line.get("y_center") is None:
            y = float(line.get("y", 0.0))
            h = float(line.get("h", 0.0))
            line["y_center"] = y + (h / 2.0)
            
    sorted_lines = sorted(lines, key=lambda l: (l["y_center"], l["x"]))
    rows = []
    
    for line in sorted_lines:
        y_center = line["y_center"]
        placed = False
        
        for row in rows:
            if abs(y_center - row["y_center"]) <= y_tolerance:
                row["items"].append(line)
                row["y_center"] = (row["y_center"] * row["count"] + y_center) / (row["count"] + 1)
                row["count"] += 1
                placed = True
                break
                
        if not placed:
            rows.append({
                "items": [line],
                "y_center": y_center,
                "count": 1
            })
            
    for row in rows:
        row["items"].sort(key=lambda item: item.get("x", 0.0))
        
    rows.sort(key=lambda r: r["y_center"])
    return rows

def strip_layout_independent_markers(tokens, logger=None):
    """
    Layout-independent token stripper. Extracts result, grade, and credits
    from EITHER side (left or right end) of a token list, returning the remaining tokens.
    """
    grade = ""
    result = ""
    credits = ""
    
    changed = True
    while changed and tokens:
        changed = False
        
        # 1. Check right side (trailing markers)
        last = tokens[-1].strip().upper()
        if last in ("PASS", "FAIL", "P", "F", "AB", "W"):
            if not result:
                result = "P" if last in ("PASS", "P") else "F" if last in ("FAIL", "F") else last
                if logger:
                    logger.info(f"Right Result detected: '{result}'")
            tokens.pop()
            changed = True
            continue
            
        from ocr.grade_detector import normalize_grade
        normalized_g = normalize_grade(last)
        if normalized_g in (VALID_GRADES - {"P", "F"}):
            if not grade:
                grade = normalized_g
                if logger:
                    logger.info(f"Right Grade detected: '{grade}'")
            tokens.pop()
            changed = True
            continue
            
        if CREDIT_PATTERN.fullmatch(last):
            val = float(last)
            if 0.0 <= val <= 10.0:
                if not credits:
                    credits = str(int(val)) if val.is_integer() else str(val)
                    if logger:
                        logger.info(f"Right Credits detected: '{credits}'")
                tokens.pop()
                changed = True
                continue
                
        if normalized_g in ("P", "F"):
            if not result:
                result = normalized_g
            elif not grade:
                grade = normalized_g
            tokens.pop()
            changed = True
            continue
            
        # 2. Check left side (leading markers)
        first = tokens[0].strip().upper()
        if first in ("PASS", "FAIL", "P", "F", "AB", "W"):
            if not result:
                result = "P" if first in ("PASS", "P") else "F" if first in ("FAIL", "F") else first
                if logger:
                    logger.info(f"Left Result detected: '{result}'")
            tokens.pop(0)
            changed = True
            continue
            
        normalized_g = normalize_grade(first)
        if normalized_g in (VALID_GRADES - {"P", "F"}):
            if not grade:
                grade = normalized_g
                if logger:
                    logger.info(f"Left Grade detected: '{grade}'")
            tokens.pop(0)
            changed = True
            continue
            
        if CREDIT_PATTERN.fullmatch(first):
            val = float(first)
            if 0.0 <= val <= 10.0:
                if not credits:
                    credits = str(int(val)) if val.is_integer() else str(val)
                    if logger:
                        logger.info(f"Left Credits detected: '{credits}'")
                tokens.pop(0)
                changed = True
                continue
                
        if normalized_g in ("P", "F"):
            if not result:
                result = normalized_g
            elif not grade:
                grade = normalized_g
            tokens.pop(0)
            changed = True
            continue
            
    return tokens, grade, result, credits

def build_subjects_from_rows(rows, default_semester=None, logger=None, repeating_texts=None):
    """
    Reconstructs subjects from clustered rows using a layout-independent
    sequential state machine.
    """
    subjects_list = []
    active_subject = None
    
    # Process rows top-to-bottom
    for row in rows:
        raw_tokens = [item["text"].strip() for item in row["items"] if item.get("text")]
        if not raw_tokens:
            continue
            
        row_text = " ".join(raw_tokens)
        row_text_lower = row_text.lower()
        
        # Check standard blocks and dynamic repeating headers
        is_layout = is_blocked_line(row_text) or (repeating_texts and any(rep in row_text_lower for rep in repeating_texts))
        if is_layout:
            if logger:
                logger.debug(f"Skipping blocked layout row: '{row_text[:60]}'")
            continue
            
        # Detect if this row contains a Course Code
        course_code = None
        code_score = 0.0
        code_idx = -1
        
        for idx, token in enumerate(raw_tokens):
            code, score = detect_course_code(token)
            if code and score > code_score:
                course_code = code
                code_score = score
                code_idx = idx
                
        if course_code:
            # We found a course code -> start a new subject context
            code_item = row["items"][code_idx]
            code_right = float(code_item.get("x", 0.0)) + float(code_item.get("w", 0.0))
            
            # Find the leftmost grade/result/credit item to the right of the course code
            grade_left = 99999.0
            for item in row["items"]:
                txt = str(item.get("text", "")).strip().upper()
                from ocr.grade_detector import normalize_grade
                is_grade = normalize_grade(txt) in VALID_GRADES
                is_result = txt in ("PASS", "FAIL", "P", "F", "AB", "W")
                is_credit = bool(CREDIT_PATTERN.fullmatch(txt))
                
                if (is_grade or is_result or is_credit) and float(item.get("x", 0.0)) > code_right:
                    grade_left = min(grade_left, float(item.get("x", 99999.0)))
            
            # Extract metadata (grade, result, credits) from ALL tokens on the row
            all_tokens_copy = [item["text"].strip() for item in row["items"] if item.get("text")]
            _, grade, result, credits = strip_layout_independent_markers(all_tokens_copy, logger)
            
            # Strict subject region filtering (Stage 1)
            filtered_tokens = []
            for item in row["items"]:
                item_x = float(item.get("x", 0.0))
                item_w = float(item.get("w", 0.0))
                center = item_x + (item_w / 2.0)
                
                if item == code_item:
                    continue
                if center < code_right - 10.0 or center > grade_left + 10.0:
                    continue
                filtered_tokens.append(item["text"].strip())
            
            # Pop leading SNO (serial number) markers from filtered_tokens (usually <= 50)
            while filtered_tokens and filtered_tokens[0].isdigit() and int(filtered_tokens[0]) <= 50:
                filtered_tokens.pop(0)
                
            remaining_tokens, _, _, _ = strip_layout_independent_markers(filtered_tokens, logger)
            
            active_subject = {
                "sno": len(subjects_list) + 1,
                "semester": default_semester,
                "courseCode": course_code,
                "courseName": "",  # will be finalized later
                "credits": credits,
                "grade": grade,
                "result": result,
                "code_pattern_score": code_score,
                "y_center": row["y_center"],
                "token_confs": [float(item.get("conf", 1.0)) for item in row["items"]],
                "tr_ids": [item.get("tr_id") for item in row["items"] if item.get("tr_id")],
                "page_idx": row["items"][0].get("page_idx", 0) if row["items"] else 0,
                "name_parts": [t for t in remaining_tokens if t],
                "items_raw": list(row["items"]),
                "code_right": code_right,
                "grade_left": grade_left
            }
            subjects_list.append(active_subject)
        else:
            # No course code -> append details to the active subject if we have one
            if active_subject is not None:
                # Check page boundary safety
                current_page_idx = row["items"][0].get("page_idx", 0) if row["items"] else 0
                is_safe = True
                
                if current_page_idx != active_subject["page_idx"]:
                    for item in row["items"]:
                        item_text_lower = item.get("text", "").strip().lower()
                        y_raw = float(item.get("y_raw", item.get("y", 0.0)))
                        page_height = float(item.get("page_height", 1200.0))
                        
                        in_margin = (y_raw < page_height * 0.22) or (y_raw > page_height * 0.82)
                        is_layout_item = (repeating_texts and any(rep in item_text_lower for rep in repeating_texts)) or is_blocked_line(item_text_lower)
                        if is_layout_item or (not repeating_texts and in_margin):
                            is_safe = False
                            break
                            
                if is_safe:
                    # Extract any metadata first
                    all_tokens_copy = [item["text"].strip() for item in row["items"] if item.get("text")]
                    _, grade, result, credits = strip_layout_independent_markers(all_tokens_copy, logger)
                    
                    if grade and not active_subject["grade"]:
                        active_subject["grade"] = grade
                    if result and not active_subject["result"]:
                        active_subject["result"] = result
                    if credits and not active_subject["credits"]:
                        active_subject["credits"] = credits
                        
                    code_right = active_subject.get("code_right", 0.0)
                    grade_left = active_subject.get("grade_left", 99999.0)
                    
                    filtered_tokens = []
                    for item in row["items"]:
                        item_x = float(item.get("x", 0.0))
                        item_w = float(item.get("w", 0.0))
                        center = item_x + (item_w / 2.0)
                        
                        if center < code_right - 10.0 or center > grade_left + 10.0:
                            continue
                        filtered_tokens.append(item["text"].strip())
                        
                    remaining_tokens, _, _, _ = strip_layout_independent_markers(filtered_tokens, logger)
                    
                    for t in remaining_tokens:
                        if t and t not in active_subject["name_parts"]:
                            active_subject["name_parts"].append(t)
                            
                    active_subject["token_confs"].extend([float(item.get("conf", 1.0)) for item in row["items"]])
                    active_subject["tr_ids"].extend([item.get("tr_id") for item in row["items"] if item.get("tr_id")])
                    active_subject["items_raw"].extend(row["items"])
                    
    # Finalize subjects
    for sub in subjects_list:
        sub_name = " ".join(sub["name_parts"]).strip()
        if not sub_name:
            sub_name = sub["courseCode"]
            
        sub_name_clean = clean_whitespace(sub_name)
        sub["originalCourseName"] = sub_name_clean
        normalized = normalize_roman_numerals(sub_name_clean)
        sub["courseName"] = normalized
        sub["normalizedCourseName"] = normalized
        
        # Calculate gradeConfidence
        sub["gradeConfidence"] = detect_grade_confidence(sub["grade"], sub.get("items_raw", []))
        
        # Set default result if grade is present
        if sub["grade"] and not sub["result"]:
            sub["result"] = "F" if sub["grade"] in ("U", "RA", "F", "AB") else "P"
            
        del sub["name_parts"]
        if "page_idx" in sub:
            del sub["page_idx"]
        if "items_raw" in sub:
            del sub["items_raw"]
            
    # Deduplicate subjects based on courseCode
    deduped_subjects = []
    seen_codes = set()
    
    for sub in subjects_list:
        code = sub["courseCode"]
        if code not in seen_codes:
            seen_codes.add(code)
            deduped_subjects.append(sub)
        else:
            existing_idx = next(i for i, s in enumerate(deduped_subjects) if s["courseCode"] == code)
            existing = deduped_subjects[existing_idx]
            
            existing_fail = existing["grade"] in ("U", "RA", "F", "AB") or existing["result"] in ("F", "AB")
            sub_fail = sub["grade"] in ("U", "RA", "F", "AB") or sub["result"] in ("F", "AB")
            
            if existing_fail and not sub_fail:
                deduped_subjects[existing_idx] = sub
            elif existing_fail == sub_fail:
                existing_conf = sum(existing["token_confs"]) / len(existing["token_confs"]) if existing.get("token_confs") else 0
                sub_conf = sum(sub["token_confs"]) / len(sub["token_confs"]) if sub.get("token_confs") else 0
                if sub_conf > existing_conf:
                    deduped_subjects[existing_idx] = sub
                    
    for idx, sub in enumerate(deduped_subjects):
        sub["sno"] = idx + 1
        
    return deduped_subjects


def detect_repeating_layout_lines(pages_lines, y_threshold_fraction=0.30):
    """
    Identifies text lines located in top or bottom page regions that repeat across multiple pages,
    returning a set of lowercase repeating strings representing headers/footers.
    """
    if len(pages_lines) < 2:
        return set()
        
    from collections import Counter
    from ocr.document_builder import estimate_page_height
    candidates = []
    
    for idx, lines in enumerate(pages_lines):
        page_height = estimate_page_height(lines)
        for line in lines:
            text = line.get("text", "").strip()
            # Only consider layout lines of length >= 12 to prevent single words from acting as filter blocks
            if not text or len(text) < 12:
                continue
            y_raw = float(line.get("y_raw", line.get("y", 0.0)))
            
            # Collect lines in top 30% or bottom 30% margins
            if (y_raw < page_height * y_threshold_fraction) or (y_raw > page_height * (1.0 - y_threshold_fraction)):
                candidates.append(text.lower())
                
    counts = Counter(candidates)
    repeating = {text for text, count in counts.items() if count > 1}
    return repeating

