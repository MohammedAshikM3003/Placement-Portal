import re
from typing import Dict, List

from concise import makeConcise
from grammar import fixGrammar
from utils.text_utils import normalize_whitespace, sentence_case, title_case

PRO_REPLACEMENTS = [
    (r"\bworked on\b", "Developed"),
    (r"\bmade\b", "Engineered"),
    (r"\bcreated\b", "Designed"),
    (r"\bused\b", "Implemented"),
    (r"\bhelped\b", "Collaborated on"),
    (r"\bfixed\b", "Resolved"),
    (r"\bdid\b", "Executed"),
    (r"\bgood at\b", "Proficient in"),
    (r"\bknow\b", "Experienced in"),
]

PROJECT_PURPOSES = {
    "placement portal": "streamline student recruitment and placement workflows",
    "attendance": "simplify attendance tracking and reporting",
    "resume": "improve resume creation and ATS readiness",
    "portal": "centralize student services and workflows",
    "dashboard": "surface metrics and progress insights",
}


def professionalizeText(text: str) -> str:
    updated = text
    for pattern, replacement in PRO_REPLACEMENTS:
        updated = re.sub(pattern, replacement, updated, flags=re.IGNORECASE)
    return updated


def _apply_project_template(text: str) -> str:
    match = re.search(r"\bworked on\b\s+(?P<name>.+?)(?:\bproject\b|$)", text, flags=re.IGNORECASE)
    if not match:
        return text
    name = normalize_whitespace(match.group("name"))
    if not name:
        return text
    lower_name = name.lower()
    purpose = None
    for key, value in PROJECT_PURPOSES.items():
        if key in lower_name:
            purpose = value
            break
    if not purpose:
        purpose = "improve operational efficiency and user experience"
    project_name = title_case(name)
    return f"Developed a {project_name} application to {purpose}."


def _ensure_sentence(text: str) -> str:
    cleaned = normalize_whitespace(text)
    if not cleaned:
        return ""
    if cleaned[-1] not in ".!?":
        cleaned = cleaned + "."
    return sentence_case(cleaned)


def enhance_resume_text(text: str) -> str:
    base = (text or "").strip()
    if not base:
        return ""
    grammar = fixGrammar(base).get("corrected", base)
    concise = makeConcise(grammar)
    professional = professionalizeText(concise)
    templated = _apply_project_template(professional)
    return _ensure_sentence(templated)


def generate_project_description(project_name: str, technologies: List[str], description: str) -> Dict[str, str]:
    name = title_case(project_name or "Project")
    tech_list = ", ".join([t for t in (technologies or []) if t])
    base = description or f"Developed {name} to improve reliability and user experience."
    base = enhance_resume_text(base)
    if tech_list:
        base = base.rstrip(".") + f" using {tech_list}."
    return {"text": base}
