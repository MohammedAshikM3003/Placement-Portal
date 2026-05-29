from typing import Dict, List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import spacy
    _NLP = spacy.load("en_core_web_sm")
except Exception:
    _NLP = None

SKILL_TERMS = [
    "python", "java", "javascript", "typescript", "react", "node.js", "express", "mongodb", "sql",
    "html", "css", "docker", "aws", "azure", "gcp", "git", "rest", "graphql", "fastapi", "flask",
    "django", "spring", "kotlin", "c++", "c#", "go", "rust", "linux", "pandas", "numpy",
    "scikit-learn", "machine learning", "data analysis", "power bi", "tableau", "excel",
]

SKILL_MAP = {term.lower(): term for term in SKILL_TERMS}


def _extract_skills(text: str) -> List[str]:
    if not text:
        return []
    lower = text.lower()
    found = []
    for key, display in SKILL_MAP.items():
        if key in lower:
            found.append(display)
    return sorted(set(found))


def _compute_similarity(resume_text: str, job_text: str) -> float:
    if not resume_text or not job_text:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf = vectorizer.fit_transform([resume_text, job_text])
        score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(score)
    except Exception:
        return 0.0


def check_ats(resume_text: str, job_description: str) -> Dict[str, List[str]]:
    resume_skills = _extract_skills(resume_text)
    job_skills = _extract_skills(job_description)

    matched = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))

    similarity = _compute_similarity(resume_text, job_description)
    skill_ratio = (len(matched) / max(1, len(job_skills))) if job_skills else 0.0

    score = round((0.6 * similarity + 0.4 * skill_ratio) * 100)
    score = max(0, min(100, score))

    suggestions = []
    if missing:
        suggestions.append("Add or highlight these skills: " + ", ".join(missing))
    if similarity < 0.35 and job_description:
        suggestions.append("Increase keyword alignment with the job description.")
    if matched:
        suggestions.append("Emphasize matched skills in experience and project sections.")
    if not job_description:
        suggestions.append("Provide a job description to improve ATS matching accuracy.")

    return {
        "score": score,
        "matchedSkills": matched,
        "missingSkills": missing,
        "suggestions": suggestions,
    }
