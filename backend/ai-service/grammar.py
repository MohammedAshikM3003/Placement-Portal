import re
from typing import Dict

import language_tool_python

from utils.text_utils import normalize_whitespace, sentence_case

try:
    _TOOL = language_tool_python.LanguageTool("en-US")
except Exception:
    _TOOL = None


PRONOUN_TENSE_RULES = [
    (r"\b(?:i|we|he|she|they)\s+(?:am|was|were|have|had|has)\s+(done|built|made|worked|created|developed|engineered|designed|implemented|resolved|fixed)\b", r"\1"),
    (r"\b(?:i|we|he|she|they)\s+(done|built|made|worked|created|developed|engineered|designed|implemented|resolved|fixed)\b", r"\1"),
    (r"\b(?:i|we|he|she|they)\s+(?:know|knows)\b", "proficient in"),
    (r"\b(?:i|we|he|she|they)\s+(?:am|is|are)\s+proficient\s+in\b", "proficient in"),
    (r"\b(?:i|we|he|she|they)\s+(?:am|is|are)\s+having\s+knowledge\s+of\b", "possess strong knowledge of"),
    (r"\b(?:i|we|he|she|they)\s+(?:want|wants|seek|seeks)\s+to\b", "seeking to"),
]


def _fallback_fix(text: str) -> str:
    cleaned = normalize_whitespace(text)
    if not cleaned:
        return cleaned
    if cleaned[-1] not in ".!?":
        cleaned = cleaned + "."
    return sentence_case(cleaned)


def fixGrammar(text: str) -> Dict[str, str]:
    original = text or ""
    cleaned = normalize_whitespace(original)
    if not cleaned:
        return {"original": original, "corrected": original}
        
    processed = cleaned
    for pattern, replacement in PRONOUN_TENSE_RULES:
        processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
        
    if _TOOL:
        corrected = _TOOL.correct(processed)
    else:
        corrected = _fallback_fix(processed)
        
    # Strip leading pronouns and capitalize
    sentences = re.split(r"(?<=[.!?])\s+", corrected.strip())
    capitalized = []
    for s in sentences:
        s_strip = s.strip()
        if s_strip:
            s_clean = re.sub(r"^(?:i|we|he|she|they)\s+", "", s_strip, flags=re.IGNORECASE)
            if s_clean.lower().startswith("done "):
                s_clean = "completed " + s_clean[5:]
            if s_clean:
                s_clean = s_clean[0].upper() + s_clean[1:]
                capitalized.append(s_clean)
    corrected = " ".join(capitalized)
    
    return {"original": original, "corrected": corrected}
