import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar
from resume_engine.professional_rewriter import professionalize_text

# Common student project purposes/benefits
PROJECT_BENEFITS = {
    "placement": "enabling students to manage recruitment activities and recruiters to track applications efficiently",
    "attendance": "automating attendance tracking and reporting with real-time data entry",
    "resume": "improving resume creation, styling, and ATS parsing readiness for students",
    "portfolio": "showcasing personal projects, academic achievements, and technical skill sets",
    "ecommerce": "providing users with product browsing, shopping cart functionality, and secure checkouts",
    "e-commerce": "providing users with product browsing, shopping cart functionality, and secure checkouts",
    "chat": "facilitating real-time message exchange and user authentication with socket connections",
    "weather": "allowing users to search and view real-time weather analytics and forecasts",
    "library": "streamlining book cataloging, search, borrowing history, and user management",
}

def normalize_tech_stack(techs: list) -> list:
    if not techs:
        return []
    normalized = []
    seen = set()
    mapping = {
        "react": "React.js",
        "reactjs": "React.js",
        "react.js": "React.js",
        "node": "Node.js",
        "nodejs": "Node.js",
        "node.js": "Node.js",
        "mongodb": "MongoDB",
        "mongo": "MongoDB",
        "express": "Express.js",
        "expressjs": "Express.js",
        "express.js": "Express.js",
        "spring": "Spring Boot",
        "springboot": "Spring Boot",
        "spring boot": "Spring Boot",
        "mysql": "MySQL",
        "postgres": "PostgreSQL",
        "postgresql": "PostgreSQL",
        "javascript": "JavaScript",
        "js": "JavaScript",
        "typescript": "TypeScript",
        "ts": "TypeScript",
        "python": "Python",
        "java": "Java",
        "aws": "AWS",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "html": "HTML5",
        "css": "CSS3",
        "tailwind": "Tailwind CSS",
        "bootstrap": "Bootstrap",
    }
    
    # No MERN auto-expansion to prevent hallucinating technologies
    pass
            
    for t in techs:
        t_clean = t.strip()
        t_lower = t_clean.lower()
        matched = mapping.get(t_lower, t_clean)
        if matched not in seen:
            seen.add(matched)
            normalized.append(matched)
            
    return normalized

def generate_project_desc(project_name: str, technologies: list, raw_desc: str) -> str:
    """
    Polishes and generates a high-quality, professional project description.
    """
    name = project_name.strip() if project_name else "Project"
    
    # Normalize tech stack
    norm_techs = normalize_tech_stack(technologies)
    tech_str = ", ".join(norm_techs) if norm_techs else ""
    
    # Clean raw description
    cleaned_desc = ""
    if raw_desc:
        spelled = correct_spelling(raw_desc)
        grammed = correct_grammar(spelled)
        cleaned_desc = professionalize_text(grammed)
        
    # Check if we have a predefined benefit for this project type
    benefit = ""
    name_lower = name.lower()
    for key, val in PROJECT_BENEFITS.items():
        if key in name_lower:
            benefit = val
            break
            
    if not benefit:
        benefit = "improving operational efficiency, data organization, and overall user experience"
        
    # Title Case project name
    title_name = " ".join([w.capitalize() for w in name.split()])
    
    # Reconstruct
    if cleaned_desc and len(cleaned_desc) > 30:
        # If student provided a decent description, professionalize it and weave it in
        final_desc = cleaned_desc
    else:
        # Template-based description
        tech_clause = f" using {tech_str}" if tech_str else ""
        final_desc = f"Developed a {title_name} application{tech_clause} aimed at {benefit}."
        
    # Format and verify trailing period
    final_desc = re.sub(r"\s+", " ", final_desc).strip()
    if final_desc and final_desc[-1] != ".":
        final_desc += "."
        
    return final_desc
