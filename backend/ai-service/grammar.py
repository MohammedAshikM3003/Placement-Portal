from typing import Dict

import language_tool_python

from utils.text_utils import normalize_whitespace, sentence_case

try:
    _TOOL = language_tool_python.LanguageTool("en-US")
except Exception:
    _TOOL = None


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
    if _TOOL:
        corrected = _TOOL.correct(cleaned)
    else:
        corrected = _fallback_fix(cleaned)
    return {"original": original, "corrected": corrected}
