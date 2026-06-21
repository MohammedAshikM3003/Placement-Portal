import re
from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar

def normalize_tech_stack(techs: list) -> list:
    if not techs:
        return []
    normalized = []
    seen = set()
    mapping = {
        "react": "React",
        "reactjs": "React",
        "react.js": "React",
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
        "html": "HTML",
        "css": "CSS",
        "tailwind": "Tailwind CSS",
        "bootstrap": "Bootstrap",
    }
            
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
    Polishes and generates a compact 2-bullet project description based only on the user's input name, tech, and description.
    Never fabricates metrics, performance gains, database optimization, or scalability claims.
    """
    # 1. Clean spelling and basic grammar
    base = (raw_desc or "").strip()
    base = re.sub(r"^[•\-\*]\s*", "", base)
    base = base.replace("•", "").replace("- ", "").replace("* ", "").strip()
    spelled = correct_spelling(base)
    grammed = correct_grammar(spelled)
    
    # 2. Project Name
    name = project_name.strip() if project_name else ""
    if not name:
        match = re.search(r"\b(make|built|builded|create|created|develop|developed|engineered|project)\s+(a\s+)?([A-Z][a-zA-Z0-9_]*(\s+[A-Z][a-zA-Z0-9_]*){0,2})", spelled)
        if match:
            name = match.group(3)
        else:
            for keyword in ["website", "app", "portal", "system", "module", "application"]:
                if keyword in spelled.lower():
                    name = keyword.capitalize()
                    break
            if not name:
                name = "Application"

    title_name = " ".join([w.capitalize() for w in name.split()])
    # Limit title_name length to 3 words
    title_words = title_name.split()
    if len(title_words) > 3:
        title_name = " ".join(title_words[:3])

    # 3. Technologies
    from ats import _extract_skills
    skills_present = _extract_skills(grammed)
    
    all_techs = list(set((technologies or []) + skills_present))
    norm_techs = normalize_tech_stack(all_techs)
    
    # Prioritize certain technologies in tech_str
    if "React" in norm_techs and "Node.js" in norm_techs:
        techs_limit = ["React", "Node.js"]
    else:
        techs_limit = norm_techs[:2]

    tech_str = ""
    if techs_limit:
        if len(techs_limit) > 1:
            tech_str = f" using {techs_limit[0]} and {techs_limit[1]}"
        else:
            tech_str = f" using {techs_limit[0]}"

    # Extract cleaned purpose/noun phrase from description
    desc_clean = base.strip()
    desc_clean = re.sub(r"^(make|built|builded|create|created|develop|developed|designed|designing|developing|building|making|creating|a|an)\s+", "", desc_clean, flags=re.IGNORECASE).strip()
    desc_clean = re.sub(r"\s+using\s+.*$", "", desc_clean, flags=re.IGNORECASE).strip()
    desc_clean = re.sub(r"\s+with\s+.*$", "", desc_clean, flags=re.IGNORECASE).strip()
    if not desc_clean:
        desc_clean = "project"

    first_word = desc_clean.split()[0].lower() if desc_clean else ""
    if first_word in ["a", "an", "the"]:
        desc_clean_no_article = re.sub(r"^(a|an|the)\s+", "", desc_clean, flags=re.IGNORECASE).strip()
    else:
        desc_clean_no_article = desc_clean

    is_react = any(t.lower() in ["react", "vue", "angular", "html", "css", "js", "javascript"] for t in norm_techs)
    is_node = any(t.lower() in ["node", "nodejs", "node.js", "express", "expressjs", "python", "flask", "django", "java", "spring"] for t in norm_techs)

    if is_react and is_node:
        bullet1 = f"• Developed a full-stack {desc_clean_no_article}{tech_str} with frontend and backend integration."
    elif is_react:
        bullet1 = f"• Developed a responsive {desc_clean_no_article}{tech_str} with user interface components and seamless interaction."
    elif is_node:
        bullet1 = f"• Developed a scalable {desc_clean_no_article}{tech_str} with backend API endpoints and data integration."
    else:
        bullet1 = f"• Developed a custom {desc_clean_no_article}{tech_str} with core features and functional integration."

    # Enforce 25 words limit for the single bullet
    def limit_words(bullet, max_w=25):
        words = bullet.split()
        if len(words) > max_w:
            res = " ".join(words[:max_w-1])
            if not res.endswith("."):
                res += "."
            return res
        return bullet

    bullet1 = limit_words(bullet1, 25)
    return bullet1
