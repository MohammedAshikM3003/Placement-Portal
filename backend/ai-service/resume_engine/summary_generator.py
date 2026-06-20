import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar
from resume_engine.professional_rewriter import professionalize_text

def generate_summary(text: str, job_role: str = "Software Engineering") -> str:
    """
    Generates a structured, high-impact professional summary from raw student text inputs.
    """
    if not text or len(text.strip()) < 5:
        # Generate default professional summary if empty
        return (
            f"Detail-oriented and highly motivated {job_role} student with strong analytical skills "
            f"and hands-on project experience. Seeking opportunities to apply coding skills and "
            f"contribute to innovative development projects."
        )


    # 1. Clean spelling and basic grammar
    spelled = correct_spelling(text)
    grammed = correct_grammar(spelled)
    
    # 2. Extract key qualities
    lower_g = grammed.lower()
    
    qualities = []
    if "learner" in lower_g or "learn" in lower_g:
        qualities.append("strong learning agility")
    if "hard worker" in lower_g or "work hard" in lower_g or "motivated" in lower_g:
        qualities.append("highly motivated work ethic")
    if "team" in lower_g or "collaborate" in lower_g:
        qualities.append("excellent collaboration and teamwork skills")
    if "dsa" in lower_g or "problem" in lower_g or "coding" in lower_g:
        qualities.append("strong analytical and algorithmic problem-solving abilities")
    if "honest" in lower_g or "good boy" in lower_g:
        qualities.append("professional integrity")
        
    if not qualities:
        qualities = ["strong learning ability", "problem-solving skills", "passion for technology"]
        
    # 3. Formulate professional rewrite
    # Check if they are looking for a job/opportunity
    job_seek = "seeking a challenging role to contribute to innovative software projects and grow professionally"
    if "job" in lower_g or "opportunity" in lower_g or "work in" in lower_g or "looking for" in lower_g:
        job_seek = f"seeking opportunities to contribute as a junior {job_role or 'developer'} in a dynamic team"
        
    # Standard template formatting
    qualities_str = ", ".join(qualities[:-1]) + f", and {qualities[-1]}" if len(qualities) > 1 else qualities[0]
    
    # Check if they mention technologies
    tech_matches = re.findall(r"\b(python|java|javascript|react|node|mongodb|sql|aws|docker|c\+\+|html|css)\b", lower_g)
    tech_str = ""
    if tech_matches:
        techs = sorted(list(set([t.title() for t in tech_matches])))
        tech_str = f" hands-on experience in {', '.join(techs[:-1]) + f' and {techs[-1]}' if len(techs) > 1 else techs[0]} development,"
        
    summary = (
        f"Dedicated and result-driven {job_role or 'Software Engineering'} student with{tech_str} "
        f"{qualities_str}. Proven capacity to build functional applications, {job_seek}."
    )
    
    # Clean formatting
    summary = re.sub(r"\s+", " ", summary).strip()
    if summary and summary[-1] != ".":
        summary += "."
        
    return summary
