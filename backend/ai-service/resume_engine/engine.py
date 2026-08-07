from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar, check_grammar_details
from resume_engine.professional_rewriter import professionalize_text
from resume_engine.ats_keyword_enhancer import enhance_ats_keywords
from resume_engine.summary_generator import generate_summary
from resume_engine.project_generator import generate_project_desc
from resume_engine.internship_generator import generate_internship_desc
from resume_engine.achievement_generator import generate_achievement

def enhance_text(text: str, job_role: str = "Software Engineer") -> str:
    """
    Orchestrates the entire text enhancement pipeline for a generic paragraph.
    """
    if not text or len(text.strip()) == 0:
        return ""
        
    # 1. Spelling correction
    spelled = correct_spelling(text)
    
    # 2. Grammar correction
    grammed = correct_grammar(spelled)
    
    # 3. Professional rewrite
    rewritten = professionalize_text(grammed)
    
    # 4. ATS keyword enhancement
    enhanced = enhance_ats_keywords(rewritten, job_role)
    
    return enhanced
