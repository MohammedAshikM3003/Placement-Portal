# backend/ocr-service/ocr/grade_detector.py
import re

VALID_GRADES = {"O", "A+", "A", "B+", "B", "C", "U", "S", "RA", "SA", "W", "WD", "AB", "P", "F"}

GRADE_CORRECTIONS = {
    "A-": "A+",
    "B-": "B+",
    "5A": "SA",
    "A1": "A+",
    "B1": "B+",
}

# Regex to find a grade token in a string
GRADE_RE = re.compile(r"\b(O|A\+|A\-|A|B\+|B\-|B|C|U|S|AB|RA|SA|W|WD|P|F)\b", re.I)

def normalize_grade(grade_str: str) -> str:
    """Normalizes case and applies corrections for common OCR mistakes inside grades."""
    if not grade_str:
        return ""
    upper = grade_str.strip().upper()
    corrected = GRADE_CORRECTIONS.get(upper, upper)
    if corrected in VALID_GRADES:
        return corrected
    return upper

def detect_grade_in_tokens(tokens, logger=None):
    """
    Scans a list of text tokens (from right to left, since grades are typically on the right)
    to find a valid grade. Returns the matched grade and the updated token list (with grade removed).
    """
    for idx in range(len(tokens) - 1, -1, -1):
        token = tokens[idx].strip()
        normalized = normalize_grade(token)
        
        if normalized in VALID_GRADES:
            # Reconfirm it's not a course code or part of one
            if re.match(r"^[A-Z]{2,4}$", token) and idx > 0 and tokens[idx-1].isdigit():
                # Might be part of a split course code or registry label, skip
                continue
                
            if logger:
                logger.info(f"Grade detected: '{normalized}' (original token: '{token}')")
            updated_tokens = tokens[:idx] + tokens[idx+1:]
            return normalized, updated_tokens
            
    # Try substring regex match as fallback on the whole tokens list merged
    for idx in range(len(tokens) - 1, -1, -1):
        token = tokens[idx].strip()
        match = GRADE_RE.search(token)
        if match:
            grade = normalize_grade(match.group(1))
            if logger:
                logger.info(f"Grade detected via regex fallback: '{grade}'")
            # Replace token minus the grade or remove it
            rem = token.replace(match.group(1), "").strip()
            updated_tokens = list(tokens)
            if rem:
                updated_tokens[idx] = rem
            else:
                updated_tokens.pop(idx)
            return grade, updated_tokens
            
    return "", tokens
