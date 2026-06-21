import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar

def generate_certification_desc(raw_desc: str) -> str:
    """
    Polishes and grammar-corrects the certification description without losing information.
    """
    base = (raw_desc or "").strip()
    base = re.sub(r"^[•\-\*]\s*", "", base)
    base = base.replace("•", "").replace("- ", "").replace("* ", "").strip()
    if not base:
        return ""

    # Spelling and grammar check
    spelled = correct_spelling(base)
    grammed = correct_grammar(spelled)
    
    # Clean trailing period
    if grammed.endswith("."):
        grammed = grammed[:-1].strip()
        
    return grammed
