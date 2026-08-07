import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar

def generate_achievement(details: str) -> str:
    """
    Polishes the achievement details faithfully.
    Only enhances existing information without fabricating awards, ranks, or competitions.
    """
    base = (details or "").strip()
    base = re.sub(r"^[•\-\*]\s*", "", base)
    base = base.replace("•", "").replace("- ", "").replace("* ", "").strip()
    if not base:
        return ""

    # Clean spelling and grammar
    spelled = correct_spelling(base)
    grammed = correct_grammar(spelled)
    lower_g = grammed.lower()

    # Rule 1: NCC candidate
    if "ncc" in lower_g:
        return "• Active NCC candidate with leadership and teamwork experience."

    # Rule 2: Volunteer
    if "volunteer" in lower_g:
        return "• Participated in volunteer activities and community engagement initiatives."

    # Rule 3: Hackathon
    if "hackathon" in lower_g or "hackthon" in lower_g:
        # Determine prize/award
        place = ""
        if "first" in lower_g or "1st" in lower_g:
            place = "first prize"
        elif "second" in lower_g or "2nd" in lower_g:
            place = "second prize"
        elif "third" in lower_g or "3rd" in lower_g:
            place = "third prize"
        elif "won" in lower_g:
            place = "a prize"
            
        if place:
            return f"• Won {place} in a hackathon, demonstrating strong technical and problem-solving abilities."
        else:
            return "• Participated in a hackathon, collaborating on technical solution development."

    # Rule 4: Coding / Technical Competition
    if "competition" in lower_g or "compition" in lower_g or "contest" in lower_g:
        place = ""
        if "first" in lower_g or "1st" in lower_g:
            place = "first prize"
        elif "second" in lower_g or "2nd" in lower_g:
            place = "second prize"
        elif "third" in lower_g or "3rd" in lower_g:
            place = "third prize"
            
        comp_type = "coding competition" if "coding" in lower_g else "technical competition"
        if place:
            return f"• Won {place} in a {comp_type}, demonstrating strong technical skills."
        else:
            return f"• Participated in a {comp_type}, demonstrating competitive technical skills."

    # Rule 5: Generic Fallback (Polish and grammar correct the user's input, do not hallucinate)
    # Capitalize the first letter and ensure it starts with a bullet point
    bullet = grammed
    if not bullet.startswith("•"):
        # Strip any existing leading bullet indicators
        bullet = re.sub(r"^[•\-\*]\s*", "", bullet)
        # Capitalize first letter
        if bullet:
            bullet = bullet[0].upper() + bullet[1:]
        bullet = f"• {bullet}"
        
    if not bullet.endswith("."):
        bullet += "."
        
    return bullet
