# backend/ocr-service/ocr/semester_detector.py
import re
from collections import Counter
from ocr.normalizer import extract_semester_number

# Pattern matching university course code formats (e.g. 20EE611, 20CS141) where digit represents semester
COURSE_SEM_PATTERN = re.compile(r"^[0-9]{2}[A-Z]{2,4}([1-8])", re.I)

def detect_page_semesters(lines, logger=None):
    """
    Scans OCR lines to locate semester labels and their vertical y-coordinates.
    Returns: list of dicts [{"semester": int, "y": float, "text": str}] sorted by vertical position.
    """
    headings = []
    seen = set()
    
    for line in lines:
        text = line.get("text", "").strip()
        if not text:
            continue
            
        sem = extract_semester_number(text)
        if sem is not None:
            y_center = float(line.get("y_center", line.get("y", 0.0)))
            coordinate_key = round(y_center / 10.0)
            if (sem, coordinate_key) not in seen:
                seen.add((sem, coordinate_key))
                headings.append({
                    "semester": sem,
                    "y": y_center,
                    "text": text
                })
                if logger:
                    logger.info(f"Detected semester heading {sem} at Y={y_center:.1f} from text '{text}'")
                    
    headings.sort(key=lambda h: h["y"])
    return headings

def infer_semester_for_row(row_y, semester_headings, fallback_sem=None):
    """
    Finds the active semester for a subject row Y-coordinate.
    Uses the heading directly above the row, or falls back.
    """
    current_sem = None
    for heading in semester_headings:
        if heading["y"] <= row_y:
            current_sem = heading["semester"]
        else:
            break
            
    if current_sem is not None:
        return current_sem
    if semester_headings:
        return semester_headings[0]["semester"]
    return fallback_sem

def infer_semester_with_confidence(pages_lines, subjects, fallback_sem=None, logger=None):
    """
    Infers the overall candidate marksheet semester and calculates the confidence.
    Signals:
    - Page semester headings (Weight: 0.90)
    - Course code semester digits pattern (Weight: 0.60)
    - Coordinator-provided semester dropdown (Weight: 0.40)
    """
    signals = {}
    
    # 1. Heading Signal
    headings = []
    for lines in pages_lines:
        headings.extend(detect_page_semesters(lines, logger))
    
    if headings:
        # Get most common semester heading
        heading_counts = Counter(h["semester"] for h in headings)
        most_common_heading, count = heading_counts.most_common(1)[0]
        signals[most_common_heading] = signals.get(most_common_heading, 0.0) + 0.90
        if logger:
            logger.info(f"[Semester Inference] Heading signal detected: Sem {most_common_heading} (count={count})")

    # 2. Course Code Suffix Pattern Signal
    inferred_from_codes = []
    for sub in subjects:
        code = str(sub.get("courseCode", "")).strip().upper()
        match = COURSE_SEM_PATTERN.match(code)
        if match:
            inferred_sem = int(match.group(1))
            inferred_from_codes.append(inferred_sem)
            
    if inferred_from_codes:
        code_counts = Counter(inferred_from_codes)
        most_common_code_sem, count = code_counts.most_common(1)[0]
        fraction = count / len(inferred_from_codes)
        # Scale code signal based on agreement fraction
        signals[most_common_code_sem] = signals.get(most_common_code_sem, 0.0) + (fraction * 0.60)
        if logger:
            logger.info(f"[Semester Inference] Course code signal: Sem {most_common_code_sem} (fraction={fraction:.2f})")

    # 3. Fallback selected semester signal
    if fallback_sem:
        try:
            fallback_sem_int = int(fallback_sem)
            signals[fallback_sem_int] = signals.get(signals.get(fallback_sem_int, 0.0)) or 0.0
            signals[fallback_sem_int] += 0.40
            if logger:
                logger.info(f"[Semester Inference] Fallback dropdown signal: Sem {fallback_sem_int}")
        except (ValueError, TypeError):
            pass

    if not signals:
        return fallback_sem or 1, 0.20

    # Pick semester with highest accumulated score
    best_sem = max(signals, key=signals.get)
    max_score = signals[best_sem]
    
    # Normalize score to confidence value (0.0 to 1.0)
    confidence = min(1.0, max_score / 1.50)
    
    if logger:
        logger.info(f"[Semester Inference] Resolved Semester={best_sem} with confidence={confidence:.2f}")
        
    return best_sem, confidence
