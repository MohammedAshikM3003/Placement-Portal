# backend/ocr-service/ocr/normalizer.py
import re
from typing import Optional

ROMAN_MAP = {
    # 1
    "I": "I", "I1": "I", "1I": "I", "L": "I", "1": "I",
    # 2
    "II": "II", "II1": "II", "1II": "II", "IIl": "II", "ll": "II", "lI": "II", "Il": "II", "11": "II", "iI": "II", "Ii": "II",
    # 3
    "III": "III", "lll": "III", "Ill": "III", "llI": "III", "lIl": "III", "IllI": "III", "iII": "III", "IiI": "III", "iiI": "III",
    # 4
    "IV": "IV", "lV": "IV", "1V": "IV", "iV": "IV", "Iv": "IV",
    # 5
    "V": "V", "v": "V",
    # 6
    "VI": "VI", "V1": "VI", "Vl": "VI", "vI": "VI", "vi": "VI", "Vi": "VI",
    # 7
    "VII": "VII", "Vll": "VII", "VlI": "VII", "VIl": "VII", "viI": "VII", "vii": "VII",
    # 8
    "VIII": "VIII", "Vlll": "VIII", "viii": "VIII",
    # 9
    "IX": "IX", "lX": "IX", "1X": "IX", "ix": "IX",
    # 10
    "X": "X", "x": "X"
}

SEMESTER_RE_LIST = [
    re.compile(r"SEMESTER\s*[-:]?\s*([IVX0-9]+)", re.I),
    re.compile(r"SEM\s*[-:]?\s*([IVX0-9]+)", re.I),
    re.compile(r"\b([1-8])(?:ST|ND|RD|TH)?\s*(?:SEM|SEMESTER)\b", re.I),
    re.compile(r"\b([IVX]+)\s*SEMESTER\b", re.I),
]

def clean_whitespace(text: str) -> str:
    """Collapses spaces, tabs, newlines, strips padding, and removes invisible characters."""
    if not text:
        return ""
    # Remove invisible Unicode characters (soft hyphens, zero-width spaces, control chars)
    text = re.sub(r"[\u200b-\u200d\uFEFF\u00AD]", "", text)
    # Normalize dash variants to standard dash
    text = re.sub(r"[\u2013\u2014]", "-", text)
    # Normalize smart quotes to standard single/double quotes
    text = re.sub(r"[\u2018\u2019]", "'", text)
    text = re.sub(r"[\u201c\u201d]", '"', text)
    # Collapse multiple spaces, tabs, and newlines
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def normalize_roman_numerals(text: str) -> str:
    """
    Normalizes common OCR-corrupted Roman numeral suffixes at the end of a subject name.
    e.g. 'Technical English -Ii' -> 'Technical English II'
    """
    if not text:
        return ""
        
    # Split the last word if it has spaces, dashes, or slashes before it
    pattern = r"(\s*[-/\\_:\s]+\s*)([a-zA-Z0-9]+)$"
    match = re.search(pattern, text)
    if match:
        sep, suffix = match.group(1), match.group(2)
        suffix_upper = suffix.upper()
        if suffix_upper in ROMAN_MAP:
            canonical_roman = ROMAN_MAP[suffix_upper]
            prefix = text[:match.start()]
            return f"{prefix.strip()} {canonical_roman}"
            
    # Also handle standalone lowercase/mixed Roman numerals at the end of the text
    # e.g., 'Power Systems ii' -> 'Power Systems II'
    words = text.split()
    if words:
        last_word = words[-1].upper()
        if last_word in ROMAN_MAP:
            words[-1] = ROMAN_MAP[last_word]
            return " ".join(words)
            
    return text

def correct_ocr_digits(text: str) -> str:
    """Corrects common OCR digit misreadings (e.g. O -> 0, I -> 1)."""
    if not text:
        return ""
    trans_map = {
        'O': '0', 'o': '0',
        'I': '1', 'i': '1', 'l': '1',
        'S': '5', 's': '5',
        'B': '8',
        'Z': '2', 'z': '2',
        'G': '6', 'g': '6'
    }
    return "".join(trans_map.get(c, c) for c in text)

def normalize_course_code(code: str) -> str:
    """Normalizes course code casing, removes whitespace, and corrects OCR digit typos."""
    if not code:
        return ""
    raw = code.strip().upper().replace(" ", "")
    raw = re.sub(r"(?<=\d)O|O(?=\d)", "0", raw)
    raw = re.sub(r"(?<=\d)I|I(?=\d)", "1", raw)
    raw = raw.replace("5A", "SA")
    return raw

def extract_semester_number(text: str) -> Optional[int]:
    """
    Parses a semester string and returns a standardized integer 1-8.
    e.g. 'SEMESTER-VI' -> 6
    """
    if not text:
        return None
    cleaned = clean_whitespace(text).upper()
    
    for regex in SEMESTER_RE_LIST:
        match = regex.search(cleaned)
        if match:
            val = match.group(1).strip()
            if val.isdigit():
                num = int(val)
                if 1 <= num <= 8:
                    return num
            elif val in ROMAN_MAP:
                # Resolve using roman map or direct key
                r_val = ROMAN_MAP[val]
                # Standard lookup for value
                lookup = {
                    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8
                }
                return lookup.get(r_val)
                
    return None
