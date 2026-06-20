import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar
from resume_engine.professional_rewriter import professionalize_text

# Common casual-to-professional mappings for internships
INTERN_TASK_MAPPINGS = [
    (r"\bfix(ed|ing)? bugs?\b", "resolved software defects and improved code stability"),
    (r"\bmake(s|d)?( (ui|frontend|web))? pages?\b", "implemented user interface components and built responsive layouts"),
    (r"\bmade backend\b", "engineered secure server-side logic and database schemas"),
    (r"\bwrite(s|d)? code|writing code|authored code\b", "authored clean, maintainable, and efficient source code"),
    (r"\bteam work|teamwork\b", "collaborated with cross-functional development teams"),
    (r"\btest(ed|ing)?\b", "performed thorough unit and integration testing to ensure quality assurance"),
]

def generate_internship_desc(company: str, raw_desc: str) -> str:
    """
    Polishes raw internship descriptions to use action-oriented professional engineering terminology.
    """
    comp_name = company.strip() if company else "Company"
    
    clean_desc = re.sub(r"\s+", " ", raw_desc.strip().lower()).replace(".", "") if raw_desc else ""
    
    # 1. Check for structural action pairs
    has_frontend = any(k in clean_desc for k in ["ui", "make pages", "frontend", "web pages", "pages"])
    has_maintenance = any(k in clean_desc for k in ["fix bugs", "errors", "defects", "bugs", "fixing"])
    if has_frontend and has_maintenance:
        return f"Contributed to frontend development activities at {comp_name}, where I implemented user interface components, resolved software defects, and collaborated with development teams to improve application performance."

    if not raw_desc or len(raw_desc.strip()) < 5:
        # High quality default internship bullet points if empty
        return (
            f"Assisted the software development team at {comp_name} in building and maintaining "
            f"web applications. Implemented frontend interfaces, assisted in backend integration, "
            f"and resolved code defects to improve system stability."
        )
        
    # 1. Core cleanups (spelling, grammar, rewriter)
    spelled = correct_spelling(raw_desc)
    grammed = correct_grammar(spelled)
    
    # 2. Match and replace common casual tasks
    text = grammed
    for pattern, replacement in INTERN_TASK_MAPPINGS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
    # 3. Professionalize the language
    final_desc = professionalize_text(text)
    
    # Verify final formatting
    final_desc = re.sub(r"\s+", " ", final_desc).strip()
    if final_desc and final_desc[-1] != ".":
        final_desc += "."
        
    return final_desc
