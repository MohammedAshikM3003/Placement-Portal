# backend/ocr-service/ocr/register_detector.py
import re
from ocr.normalizer import correct_ocr_digits

# Typical labels indicating register number
REGISTER_LABELS = [
    r"REG(?:ISTER)?\s*(?:NO|NUMBER|NUM)\.?",
    r"ROLL\s*(?:NO|NUMBER|NUM)\.?",
    r"ENROLL(?:MENT)?\s*(?:NO|NUMBER|NUM)\.?",
]

# Patterns for candidate register numbers:
# Most universities use pure digits of length 8-15.
# Alphanumeric roll numbers can also exist, e.g. 21CS001, etc.
CANDIDATE_REG_RE = re.compile(r"\b([A-Z0-9]{8,15})\b", re.I)

def is_valid_register(val: str, conf: float) -> bool:
    """
    Validates register number string to filter out layout text,
    headers, and low-confidence OCR noise.
    """
    if not val:
        return False
        
    val_clean = val.strip().upper()
    
    # 1. Length validation (typically 8-15 characters for real register numbers)
    if not (8 <= len(val_clean) <= 15):
        return False
        
    # 2. Check for typical digit-to-letter OCR corruptions to catch layout noise
    # e.g., 'N05EME5TER' -> 'NOSEMESTER'
    sub_map = {
        '0': 'O', '1': 'I', '2': 'Z', '3': 'E', '4': 'A',
        '5': 'S', '6': 'G', '7': 'T', '8': 'B', '9': 'G'
    }
    normalized_letters = "".join(sub_map.get(c, c) for c in val_clean)
    
    # Blocked layout keywords
    blocked_keywords = [
        "SEMESTER", "REGISTER", "RESULT", "GRADE", "CGPA", "SGPA",
        "COLLEGE", "PAGE", "NAME", "BRANCH", "PROGRAMME", "DATE",
        "ROLL", "ENROLL", "EXAM", "CONTROLLER", "AUTONOMOUS", "ENGINEERING"
    ]
    
    for word in blocked_keywords:
        if word in normalized_letters:
            return False
            
    # 3. Numeric density validation
    # If the register number contains alphabetical characters, ensure it's not mostly text.
    # University roll numbers are typically mostly numeric (e.g. 21CS001 has 5 digits, 2 letters: 71% numeric).
    # Fake candidate tokens like 'NOSEMESTER' or OCR noise have low numeric density.
    digit_count = sum(1 for c in val_clean if c.isdigit())
    numeric_density = digit_count / len(val_clean)
    
    if not val_clean.isdigit():
        # It's alphanumeric -> enforce higher standards
        # If it has very few numbers, reject it
        if numeric_density < 0.40:
            return False
        # Reject alphanumeric fallback matches with low confidence
        if conf < 0.50:
            return False
            
    return True


def detect_register_number(lines, page_height=1000.0, logger=None):
    """
    Scans OCR lines to extract student register number with confidence scoring.
    Returns: (register_number: str, confidence: float)
    """
    candidates = []
    
    # 1. Look for anchor labels
    for idx, line in enumerate(lines):
        text = line["text"].upper()
        
        # Check if the text matches any registration label
        matched_label = False
        for pattern in REGISTER_LABELS:
            if re.search(pattern, text):
                matched_label = True
                break
                
        if matched_label:
            if logger:
                logger.info(f"Anchor label matched in text: '{line['text']}'")
                
            # Heuristic A: Register number is in the same line
            # e.g. "Register No: 2112001201"
            clean_digits = correct_ocr_digits(text)
            match = re.search(r"\b(\d{8,15})\b", clean_digits)
            if match:
                candidates.append({
                    "val": match.group(1),
                    "score": 95,
                    "reason": "Adjacent to label on same line"
                })
                continue
                
            # Heuristic B: Look at subsequent lines within a reasonable distance (top-to-bottom)
            # Register number could be on the line below or next block
            for offset in range(1, min(5, len(lines) - idx)):
                next_line = lines[idx + offset]
                # Check vertical proximity
                if abs(next_line["y"] - line["y"]) < 60.0:
                    clean_next = correct_ocr_digits(next_line["text"].upper())
                    match = re.search(r"\b(\d{8,15})\b", clean_next)
                    if match:
                        candidates.append({
                            "val": match.group(1),
                            "score": 85,
                            "reason": "Horizontal proximity to label block"
                        })
                elif next_line["y"] - line["y"] >= 60.0:
                    # Too far down vertically, stop search
                    break
                    
    # 2. General page-wide fallback search for 8-15 digit sequences
    for line in lines:
        clean_text = correct_ocr_digits(line["text"].upper())
        # Strip internal spaces in case OCR split the number
        space_stripped = re.sub(r"\s+", "", clean_text)
        
        for num_match in re.finditer(r"\b(\d{8,15})\b", clean_text):
            val = num_match.group(1)
            # Base score depends on vertical position (headers are usually top 30% of page)
            y_pos_factor = 1.0 - (line["y"] / max(1.0, page_height))
            base_score = 40 + (y_pos_factor * 20) # up to 60 points
            
            # Boost if it is typical length 11 or 12 digits
            if len(val) in (11, 12):
                base_score += 15
                
            candidates.append({
                "val": val,
                "score": base_score,
                "reason": "Global pattern match"
            })
            
        # Alphanumeric fallback if no digits found
        for alpha_match in CANDIDATE_REG_RE.finditer(space_stripped):
            val = alpha_match.group(1)
            # Filter pure alphabetical strings
            if not val.isalpha() and not val.isdigit():
                candidates.append({
                    "val": val,
                    "score": 30,
                    "reason": "Global alphanumeric match"
                })

    # Filter out invalid register number candidates (e.g. layout words or noise)
    valid_candidates = []
    for c in candidates:
        if is_valid_register(c["val"], c["score"] / 100.0):
            valid_candidates.append(c)
            
    if not valid_candidates:
        if logger:
            logger.warning("No valid candidate register numbers found on the page.")
        return "", 0.0
        
    # Sort valid candidates by score descending
    valid_candidates.sort(key=lambda c: c["score"], reverse=True)
    best = valid_candidates[0]
    
    if logger:
        logger.info(f"Selected Register Number: '{best['val']}' with confidence {best['score']}% (Reason: {best['reason']})")
        
    return best["val"], best["score"] / 100.0
