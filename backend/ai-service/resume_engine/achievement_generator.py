import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar
from resume_engine.professional_rewriter import professionalize_text

# Common achievement phrases to professionalize
ACHIEVEMENT_REWRITES = [
    (r"\bgot first (prize|place)\b", "Secured First Place"),
    (r"\bwon first (prize|place)\b", "Awarded First Place"),
    (r"\bgot second (prize|place)\b", "Secured Second Place"),
    (r"\bgot third (prize|place)\b", "Secured Third Place"),
    (r"\bgot (a )?prize\b", "Recognized as a prize winner"),
    (r"\bparticipted\b", "Competed in"),
    (r"\bparticipated in (a )?hack(a)?thon\b", "Actively competed in a regional Hackathon, developing prototypes under strict time constraints"),
    (r"\bcoding compition\b", "Coding Competition"),
    (r"\bcoding competition\b", "Coding Competition"),
]

def generate_achievement(details: str) -> str:
    """
    Translates basic achievement notes into formal, accomplishments.
    """
    if not details or len(details.strip()) < 3:
        return "Recognized for academic excellence and active participation in co-curricular activities."
        
    # Clean spelling and grammar
    spelled = correct_spelling(details)
    grammed = correct_grammar(spelled)
    
    text = grammed
    for pattern, replacement in ACHIEVEMENT_REWRITES:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
    # Standardize remaining phrasing
    final_details = professionalize_text(text)
    
    # Capitalize key competitions (Coding Competition, Hackathon, etc.)
    final_details = final_details.replace("coding competition", "Coding Competition")
    final_details = final_details.replace("hackathon", "Hackathon")
    
    # Dynamic skill qualifier for coding/hackathons
    lower_details = final_details.lower()
    if any(k in lower_details for k in ["coding", "hackathon", "programming", "algorithmic", "dsa"]):
        if not any(k in lower_details for k in ["demonstrating", "problem-solving", "skills"]):
            if final_details.endswith("."):
                final_details = final_details[:-1]
            final_details += " by demonstrating strong problem-solving and algorithmic skills"
            
    # Ensure starts capitalized and ends with a period
    final_details = re.sub(r"\s+", " ", final_details).strip()
    if final_details:
        final_details = final_details[0].upper() + final_details[1:]
    if final_details and final_details[-1] != ".":
        final_details += "."
        
    return final_details
