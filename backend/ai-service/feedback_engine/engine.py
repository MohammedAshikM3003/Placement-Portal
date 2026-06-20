import re
from feedback_engine.sentiment import analyze_sentiment
from feedback_engine.sentence_ranker import rank_sentences
from feedback_engine.summarizer import summarize_feedback

# Mapping of raw review phrases to polished strengths (positive)
STRENGTHS_TRANSLATIONS = [
    # Communication & Presentation
    (r"\bcommunicat(ion|e)\b", "Strong communication skills"),
    (r"\bverbal\b", "Excellent verbal clarity and expressiveness"),
    (r"\bwritten\b", "Clear and professional written communication"),
    (r"\bpresent(ation|ed|ing)?\b", "Polished presentation and public speaking skills"),
    (r"\barticulate\b", "Highly articulate interview presence"),
    (r"\blisten(ing|er)?\b", "Attentive listening and comprehensive understanding"),
    (r"\bconfidence\b", "Confident and engaging professional presence"),
    (r"\binterpersonal\b", "Superb interpersonal and relationship building skills"),
    
    # Teamwork & Leadership
    (r"\blead(er|ership|ing)?\b", "Strong team leadership and guidance capabilities"),
    (r"\bteam(work| player)?\b", "Excellent collaboration and teamwork skills"),
    (r"\bcollab(orate|orative)?\b", "Highly collaborative workspace approach"),
    (r"\bcoordinat(e|ion)?\b", "Efficient project coordination and management skills"),
    (r"\bownership\b", "Strong sense of ownership and accountability"),
    (r"\binitiat(ive|ed)?\b", "Proactive developer showing self-starter initiative"),
    (r"\bmentor(ing|ed)?\b", "Helpful mentorship and guidance of team members"),
    
    # Problem Solving & Logic
    (r"\bproblem-solving\b", "Strong problem-solving capability"),
    (r"\banaly(tical|ze|sis)?\b", "Exceptional analytical thinking and logical deduction"),
    (r"\blogic(al)?\b", "Sound logical reasoning and structured thinking"),
    (r"\bdsa\b", "Strong understanding of Data Structures and Algorithms"),
    (r"\balgorithm(ic|s)?\b", "Strong algorithmic problem-solving capacity"),
    (r"\bmathemat(ic|ical|s)?\b", "Outstanding mathematical and quantitative reasoning"),
    (r"\bcritical\b", "Excellent critical thinking and objective analysis"),
    
    # Software Engineering & Design
    (r"\bcoding\b", "Good coding proficiency"),
    (r"\bclean code\b", "Strong focus on writing clean, readable, and maintainable code"),
    (r"\barchitect(ure|ed)?\b", "Solid grasp of software architecture and system design"),
    (r"\bdesign patterns\b", "Proficient implementation of standard design patterns"),
    (r"\bdebug(ging|ged)?\b", "Exceptional debugging and troubleshooting skills"),
    (r"\btest(ing|ed)?\b", "Thorough unit and integration testing habits"),
    (r"\bqa\b", "Strong attention to quality assurance and software reliability"),
    (r"\brefactor(ing|ed)?\b", "Effective code refactoring and code quality practices"),
    
    # Core Tech Stack
    (r"\bfrontend\b", "Creates highly responsive and user-friendly frontends"),
    (r"\bbackend\b", "Engineers robust, secure, and scalable backend logic"),
    (r"\bdatabase(s)?\b", "Proficient in relational and non-relational database design"),
    (r"\bsql\b", "Excellent SQL query formulation and database indexing skills"),
    (r"\bapi(s)?\b", "Skilled in designing and implementing RESTful API structures"),
    (r"\bcloud\b", "Hands-on understanding of modern cloud deployment methods"),
    (r"\bdevops\b", "Familiarity with containerization and automation pipelines"),
    (r"\bgit\b", "Proficient in git-based version control workflows"),
    
    # Personality & Work Ethic
    (r"\blearn(er|ing)?\b", "Quick learner who adapts rapidly to new technologies"),
    (r"\bmotivat(ed|ion)?\b", "Self-motivated developer with strong drive to succeed"),
    (r"\bcurio(us|sity)?\b", "Intellectually curious and eager to learn"),
    (r"\badapt(able|ability)?\b", "Highly adaptable to changing project guidelines"),
    (r"\bcreativ(e|ity)?\b", "Creative problem solver with out-of-the-box thinking"),
    (r"\bpunctual\b", "Consistently punctual and reliable with deliverables"),
    (r"\borganized\b", "Highly organized workspace and task management"),
    (r"\bdetail-oriented\b", "Detail-oriented observer ensuring high quality work"),
    (r"\bhardworker\b", "Dedicated professional with a strong work ethic"),
    (r"\bpassionat(e)?\b", "Passionate about software craftsmanship and learning"),
    (r"\bconstructive\b", "Receptive to feedback and eager to grow"),
    (r"\bdedicat(ed|ion)?\b", "Dedicated to delivering outstanding product value")
]

# Mapping of raw review phrases to polished improvement needs (negatives)
NEEDS_TRANSLATIONS = [
    # Communication & Presentation
    (r"\bcommunicat(ion|e)\b", "communication clarity"),
    (r"\bverbal\b", "verbal articulation"),
    (r"\bwritten\b", "written documentation"),
    (r"\bpresent(ation|ing)?\b", "presentation delivery"),
    (r"\bconfidence\b", "technical confidence"),
    (r"\barticulate\b", "articulation of thoughts"),
    (r"\blisten(ing|er)?\b", "attentive listening habits"),
    (r"\bshyness\b", "conversational confidence"),
    
    # Teamwork & Leadership
    (r"\blead(er|ership|ing)?\b", "leadership initiative"),
    (r"\bteam(work| player)?\b", "collaborative skills"),
    (r"\bcollab(orate|orative)?\b", "cross-functional collaboration"),
    (r"\bcoordinat(e|ion)?\b", "task coordination"),
    (r"\bownership\b", "taking independent ownership"),
    (r"\binitiat(ive)?\b", "proactive initiative"),
    (r"\bdeleget(ing|e)?\b", "task delegation"),
    
    # Problem Solving & Logic
    (r"\bproblem(s)?\b", "problem-solving abilities"),
    (r"\banaly(tical|ze|sis)?\b", "deep analytical analysis"),
    (r"\blogic(al)?\b", "structured logic design"),
    (r"\bdsa\b", "DSA knowledge"),
    (r"\balgorithm(ic|s)?\b", "algorithmic design"),
    (r"\bmathemat(ic|ical|s)?\b", "quantitative reasoning"),
    (r"\bcritical\b", "critical analysis methods"),
    
    # Software Engineering & Design
    (r"\bcoding\b", "coding proficiency"),
    (r"\bclean code\b", "writing readable/clean code"),
    (r"\barchitect(ure|ed)?\b", "architectural planning"),
    (r"\bdesign patterns\b", "design pattern implementation"),
    (r"\bdebug(ging|ged)?\b", "debugging efficiency"),
    (r"\btest(ing|ed)?\b", "comprehensive testing coverage"),
    (r"\bqa\b", "quality assurance focus"),
    (r"\brefactor(ing|ed)?\b", "code refactoring practices"),
    
    # Core Tech Stack
    (r"\bfrontend\b", "frontend responsiveness tuning"),
    (r"\bbackend\b", "backend system design"),
    (r"\bdatabase(s)?\b", "database indexing and optimization"),
    (r"\bsql\b", "complex SQL query logic"),
    (r"\bapi(s)?\b", "API design standard principles"),
    (r"\bcloud\b", "cloud services deployment"),
    (r"\bdevops\b", "CI/CD pipeline configuration"),
    (r"\bgit\b", "git version control workflows"),
    
    # Personality & Work Ethic
    (r"\blearn(er|ing)?\b", "learning agility under deadlines"),
    (r"\bmotivat(ed|ion)?\b", "intrinsic developer motivation"),
    (r"\bcurio(us|sity)?\b", "technical curiosity"),
    (r"\badapt(able|ability)?\b", "adapting to guidelines quickly"),
    (r"\bcreativ(e|ity)?\b", "out-of-the-box system ideas"),
    (r"\btime\b", "time management and scheduling"),
    (r"\bdeadline(s)?\b", "meeting target deadlines"),
    (r"\borganiz(ed|ation)?\b", "task organization skills"),
    (r"\bdetail-oriented\b", "attention to edge cases"),
    (r"\bhardwork\b", "day-to-day work consistency"),
    (r"\bconstructive\b", "incorporating peer feedback"),
    (r"\bdedicat(ed|ion)?\b", "long-term task dedication")
]

FEEDBACK_TEMPLATES = {
    "Technical Interview Feedback": {
        "prefix": "Technical Evaluation: ",
        "improvement_prefix": "Focus areas for technical enhancement: "
    },
    "HR Feedback": {
        "prefix": "HR & Behavioral Assessment: ",
        "improvement_prefix": "Key soft skills to develop: "
    },
    "Mock Interview Feedback": {
        "prefix": "Mock Interview Performance: ",
        "improvement_prefix": "Suggested preparation adjustments: "
    },
    "Placement Feedback": {
        "prefix": "Placement Readiness Review: ",
        "improvement_prefix": "Recommended actions for placement eligibility: "
    },
    "Internship Feedback": {
        "prefix": "Internship Experience Evaluation: ",
        "improvement_prefix": "Professional development goals: "
    },
    "Faculty Feedback": {
        "prefix": "Academic & Faculty Assessment: ",
        "improvement_prefix": "Academic focus suggestions: "
    }
}

def make_concise(text: str, category: str = None) -> str:
    """
    Summarizes and formats feedback text into high-impact bullets / short sentences based on V3 templates:
    - Identifies strengths (positive) -> outputs first (e.g., "Technical Evaluation: Strong communication skills.")
    - Identifies improvement areas (negatives) -> formats together (e.g., "Focus areas for technical enhancement: Needs improvement in database...")
    """
    if not text or len(text.strip()) < 5:
        return text
        
    cleaned = re.sub(r"\s+", " ", text).strip()
    
    # 1. Auto-classify category if not provided
    if not category:
        lower_text = cleaned.lower()
        if "mock" in lower_text:
            category = "Mock Interview Feedback"
        elif any(k in lower_text for k in ["technical", "dsa", "coding", "algorithm", "database", "backend", "frontend", "architecture", "debug", "test"]):
            category = "Technical Interview Feedback"
        elif any(k in lower_text for k in ["hr", "behavioral", "culture", "interpersonal", "attitude", "soft skill"]):
            category = "HR Feedback"
        elif any(k in lower_text for k in ["internship", "intern", "company", "workplace"]):
            category = "Internship Feedback"
        elif any(k in lower_text for k in ["academic", "faculty", "professor", "college", "marks", "punctual"]):
            category = "Faculty Feedback"
        else:
            category = "Placement Feedback"
            
    template = FEEDBACK_TEMPLATES.get(category, FEEDBACK_TEMPLATES["Placement Feedback"])
    
    # 2. Split text into clauses/sentences
    parts = re.split(r"(?<=[.!?])\s+|but|however|although|and yet", cleaned, flags=re.IGNORECASE)
    clauses = [p.strip() for p in parts if p.strip()]
    
    positives = []
    improvements = []
    
    for c in clauses:
        sent = analyze_sentiment(c)
        c_lower = c.lower()
        
        if sent == "positive":
            matched = False
            for pattern, translation in STRENGTHS_TRANSLATIONS:
                if re.search(pattern, c_lower):
                    positives.append(translation)
                    matched = True
                    break
            if not matched:
                clean_clause = re.sub(r"^(the student has|candidate has|he has|she has)\s+", "", c, flags=re.IGNORECASE)
                clean_clause = clean_clause.strip().capitalize()
                positives.append(clean_clause)
                
        elif sent == "improvement":
            matched = False
            for pattern, translation in NEEDS_TRANSLATIONS:
                if re.search(pattern, c_lower):
                    improvements.append(translation)
                    matched = True
                    break
            if not matched:
                clean_clause = re.sub(r"^(lacks|should improve|needs improvement in)\s+", "", c, flags=re.IGNORECASE)
                clean_clause = clean_clause.strip()
                improvements.append(clean_clause)

    def capitalize_first(s: str) -> str:
        s = s.strip()
        if not s:
            return ""
        return s[0].upper() + s[1:]

    # Remove duplicates
    pos_unique = []
    for p in positives:
        if p.lower() not in [x.lower() for x in pos_unique]:
            pos_unique.append(p)
            
    imp_unique = []
    for imp in improvements:
        if imp.lower() not in [x.lower() for x in imp_unique]:
            imp_unique.append(imp)

    # 3. Formulate combined concise statement using category prefixes
    output_parts = []
    
    if pos_unique:
        strengths_str = ". ".join(pos_unique) + "."
        # Prepend template prefix
        output_parts.append(f"{template['prefix']}{strengths_str}")
        
    if imp_unique:
        if len(imp_unique) == 1:
            imp_clause = f"Needs improvement in {imp_unique[0]}."
        elif len(imp_unique) == 2:
            imp_clause = f"Needs improvement in {imp_unique[0]} and {imp_unique[1]}."
        else:
            imp_clause = f"Needs improvement in {', '.join(imp_unique[:-1])}, and {imp_unique[-1]}."
        # Prepend template improvement prefix
        output_parts.append(f"{template['improvement_prefix']}{imp_clause}")

    # Fallback to sumy text summarization
    if not output_parts:
        summary_fallback = summarize_feedback(text, sentence_count=2)
        return summary_fallback
        
    final_output = " ".join(output_parts)
    
    # Clean up capitalization (only capitalize the first letter of each sentence, preserving inner casing)
    final_output = ". ".join([capitalize_first(s) for s in final_output.split(".") if s.strip()])
    if final_output and not final_output.endswith("."):
        final_output += "."
        
    # Standard replacement cleanup for common matches
    final_output = final_output.replace("strong communication skills", "Strong communication skills")
    final_output = final_output.replace("excellent communication skills", "Excellent communication skills")
    
    # Make sure we correct spacing after colons
    final_output = re.sub(r":\s*", ": ", final_output)
    
    return final_output
