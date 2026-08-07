import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar

def generate_internship_desc(company: str, raw_desc: str) -> str:
    """
    Generates a compact, single-bullet internship description.
    """
    # 1. Clean spelling and basic grammar
    base = (raw_desc or "").strip()
    base = re.sub(r"^[•\-\*]\s*", "", base)
    base = base.replace("•", "").replace("- ", "").replace("* ", "").strip()
    spelled = correct_spelling(base)
    grammed = correct_grammar(spelled)
    lower_g = grammed.lower()

    # Extract present skills (anti-hallucination whitelist)
    from ats import _extract_skills
    present_skills = _extract_skills(grammed)
    
    tech_str = ""
    if present_skills:
        techs = sorted(list(set(present_skills)))
        if len(techs) > 1:
            tech_str = f" using {techs[0]} and {techs[1]}"
        else:
            tech_str = f" using {techs[0]}"

    # Identify task type
    is_frontend = any(k in lower_g for k in ["ui", "frontend", "web page", "page", "css", "html", "react", "view"])
    is_backend = any(k in lower_g for k in ["backend", "api", "server", "express", "node", "python", "endpoint"])
    
    methodology = f"{company.strip()} methodology" if (company and company.strip()) else "Agile methodology"

    if is_frontend:
        bullet = f"• Developed responsive frontend components{tech_str} and resolved UI issues using {methodology}."
    elif is_backend:
        bullet = f"• Built scalable backend API endpoints{tech_str} and resolved database performance issues using {methodology}."
    else:
        bullet = f"• Developed key application features{tech_str} and improved overall system performance using {methodology}."

    # Enforce 25 words limit for the single bullet
    def limit_words(bullet, max_w=25):
        words = bullet.split()
        if len(words) > max_w:
            res = " ".join(words[:max_w-1])
            if not res.endswith("."):
                res += "."
            return res
        return bullet

    return limit_words(bullet, 25)
