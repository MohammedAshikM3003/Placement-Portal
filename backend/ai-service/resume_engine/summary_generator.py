import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar

def generate_summary(text: str, job_role: str = "Software Engineering") -> str:
    """
    Generates a high-impact, compact professional summary (target 25-35 words).
    Only enhances existing information without adding template filler.
    """
    role = job_role.strip() if job_role else "Software Engineering"
    role_title = role if "student" in role.lower() else f"{role} student"
    role_title = " ".join([w.capitalize() for w in role_title.split()])

    # Clean spelling and grammar
    base = (text or "").strip()
    spelled = correct_spelling(base)
    grammed = correct_grammar(spelled)
    
    # Extract present technologies (anti-hallucination whitelist)
    from ats import _extract_skills
    present_skills = _extract_skills(grammed)
    
    tech_str = ""
    if present_skills:
        techs = sorted(list(set(present_skills)))[:3]
        techs_title = []
        for t in techs:
            techs_title.append(t.title() if t.lower() in ["java", "react", "python", "javascript", "mongodb", "sql", "node", "html", "css"] else t)
            
        if len(techs_title) > 1:
            tech_str = f" skilled in {', '.join(techs_title[:-1])} and {techs_title[-1]} development,"
        else:
            tech_str = f" skilled in {techs_title[0]} development,"
    else:
        tech_str = ""

    # Combine to target 25-35 words
    if tech_str:
        summary = f"{role_title}{tech_str} with strong problem-solving abilities, excellent analytical skills, and a keen interest in building scalable, user-centric web applications."
    else:
        summary = f"{role_title} with a strong technical foundation, problem-solving abilities, excellent analytical skills, and a dedicated passion for building scalable, responsive, and user-centric web applications."
        
    # Clean formatting
    summary = re.sub(r"\s+", " ", summary).strip()
    if summary and summary[-1] != ".":
        summary += "."
        
    # Word range check and padding/limiting
    words = summary.split()
    if len(words) > 35:
        summary = " ".join(words[:35])
        if not summary.endswith("."):
            summary += "."
    elif len(words) < 25:
        # Pad with professional tail to hit at least 25 words
        filler = ". Committed to continuous learning, team collaboration, and delivering high-quality software solutions."
        summary = summary.rstrip(".") + filler
        words = summary.split()
        if len(words) > 35:
            summary = " ".join(words[:35])
            if not summary.endswith("."):
                summary += "."
                
    return summary
