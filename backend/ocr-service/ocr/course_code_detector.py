# backend/ocr-service/ocr/course_code_detector.py
import re
from ocr.normalizer import normalize_course_code

# Strict patterns to match course codes from various regulations & universities
COURSE_PATTERNS = [
    # 1. Regulation prefix + Department + 3 or 4 digits + Optional single letter suffix
    # e.g. 21CS601, 23CSE501A, 22IT405
    (re.compile(r"\b(\d{2}[A-Z]{2,4}\d{2,4}[A-Z]?)\b", re.I), 1.0),
    
    # 2. Department + 3 to 5 digits + Optional single letter suffix
    # e.g. CS8601, CCS334, EC3402, CS19541
    (re.compile(r"\b([A-Z]{2,4}\d{3,5}[A-Z]?)\b", re.I), 0.95),
    
    # 3. Regulation prefix + Department prefix + Department suffix + Digits
    # e.g. 19MAB101
    (re.compile(r"\b(\d{2}[A-Z]{3,5}\d{3,4})\b", re.I), 0.90),
    
    # 4. Standard alphanumeric code containing both letters and digits, 5 to 10 characters
    (re.compile(r"\b([A-Z0-9]{5,10})\b", re.I), 0.70)
]

# Words that should never be mistaken for a course code
BLOCKED_TOKENS = {
    "SEMESTER", "SEM", "GRADE", "CREDIT", "CREDITS", "RESULT", "PASS", "FAIL",
    "REGISTER", "REGNO", "ROLLNO", "NAME", "MONTH", "YEAR", "SGPA", "CGPA",
    "UG", "PG", "CHOICE", "CREDIT", "SYSTEM", "STATEMENT", "MARKS", "TRANSCRIPT"
}

def detect_course_code(text: str) -> tuple:
    """
    Checks if a given string contains a course code.
    Returns: (normalized_code: str, score: float) or (None, 0.0)
    """
    if not text:
        return None, 0.0
        
    cleaned = text.strip().upper()
    if cleaned in BLOCKED_TOKENS:
        return None, 0.0
        
    # Check if the string matches any pattern
    for pattern, weight in COURSE_PATTERNS:
        match = pattern.search(cleaned)
        if match:
            candidate = match.group(1)
            # Filter out pure digits (could be roll number, year, dob, etc.) or pure letters
            if candidate.isdigit() or candidate.isalpha():
                continue
                
            normalized = normalize_course_code(candidate)
            # Verify normalized format still has mix of letters and digits
            if not any(c.isdigit() for c in normalized) or not any(c.isalpha() for c in normalized):
                continue
                
            return normalized, weight
            
    return None, 0.0
