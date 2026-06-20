import re
from typing import Dict, List

from resume_engine.engine import enhance_text
from resume_engine.project_generator import generate_project_desc
from resume_engine.summary_generator import generate_summary
from resume_engine.internship_generator import generate_internship_desc
from resume_engine.achievement_generator import generate_achievement

def enhance_resume_text(text: str) -> str:
    """
    Polishes generic resume text professionally using the local AI engine.
    Uses basic keyword-matching heuristics to classify and route the paragraph
    to the most appropriate specialized template generator.
    """
    base = (text or "").strip()
    if not base:
        return ""
        
    lower_text = base.lower()
    
    # Heuristic 1: Achievements
    if any(k in lower_text for k in ["prize", "won", "award", "rank", "compition", "competition", "hackathon", "first place"]):
        return generate_achievement(base)
        
    # Heuristic 2: Internships/Experiences
    if any(k in lower_text for k in ["worked", "intern", "company", "role", "responsibility", "position"]):
        # Try to extract company name if present (e.g. "worked at XYZ")
        company = ""
        match = re.search(r"at\s+([A-Za-z0-9_]+(\s+[A-Za-z0-9_]+){0,2})", base, flags=re.IGNORECASE)
        if match:
            company = match.group(1)
        return generate_internship_desc(company, base)
        
    # Heuristic 3: Projects
    if any(k in lower_text for k in ["built", "builded", "project", "app", "website", "system", "portal"]):
        # Try to extract project name
        proj_name = ""
        match = re.search(r"build(ed)?\s+([A-Za-z0-9_]+(\s+[A-Za-z0-9_]+){0,2})", base, flags=re.IGNORECASE)
        if match:
            proj_name = match.group(2)
        return generate_project_desc(proj_name, [], base)
        
    # Heuristic 4: Summary
    if any(k in lower_text for k in ["i am", "learner", "seeking", "looking for", "passionate"]):
        return generate_summary(base)
        
    # Fallback to general professional enhancement
    return enhance_text(base)

def generate_project_description(project_name: str, technologies: List[str], description: str) -> Dict[str, str]:
    """
    Called by the project generation API endpoint.
    """
    desc = generate_project_desc(project_name or "Project", technologies or [], description or "")
    return {"text": desc}
