ROLE_KEYWORDS = {
    "Frontend Developer": ["React.js", "JavaScript", "TypeScript", "HTML5", "CSS3", "Redux", "REST APIs", "Responsive Design", "Git"],
    "React Developer": ["React.js", "Redux", "JavaScript", "TypeScript", "HTML5", "CSS3", "Next.js", "Webpack", "REST APIs", "Git"],
    "Backend Developer": ["Node.js", "Python", "Java", "Express.js", "FastAPI", "MongoDB", "SQL", "Docker", "AWS", "REST APIs"],
    "Node Developer": ["Node.js", "Express.js", "JavaScript", "TypeScript", "REST APIs", "MongoDB", "Redis", "Docker", "AWS", "Git"],
    "Full Stack Developer": ["React.js", "Node.js", "Express.js", "MongoDB", "JavaScript", "TypeScript", "REST APIs", "Docker", "Git", "AWS"],
    "Data Scientist": ["Python", "Machine Learning", "Scikit-Learn", "Pandas", "NumPy", "SQL", "Data Analysis", "NLP"],
    "Machine Learning Engineer": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "NLP", "MLOps"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Jenkins", "Terraform", "Ansible", "Linux", "Git"],
    "Mobile Developer": ["Swift", "Kotlin", "React Native", "Flutter", "Xcode", "Android Studio", "REST APIs", "Git"],
    "QA Engineer": ["Selenium", "Cypress", "Jest", "JUnit", "Test Automation", "Manual Testing", "Jira", "Postman", "Git"],
    "Cloud Engineer": ["AWS", "Azure", "GCP", "Cloud Computing", "Terraform", "Docker", "Kubernetes", "CI/CD", "Git"],
    "Cyber Security Engineer": ["Cybersecurity", "Firewalls", "SIEM", "Penetration Testing", "Vulnerability Assessment", "Cryptography", "Linux"],
    "Data Engineer": ["SQL", "Python", "ETL", "Spark", "Hadoop", "Kafka", "Data Warehousing", "PostgreSQL", "Airflow"],
    "UI/UX Designer": ["Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping", "User Research", "Interaction Design"],
    "Database Administrator": ["SQL", "MySQL", "PostgreSQL", "Oracle", "Database Administration", "Backup & Recovery", "Performance Tuning"],
    "Embedded Systems Engineer": ["C", "C++", "Microcontrollers", "Embedded C", "RTOS", "Firmware", "IoT", "Arduino"],
    "Product Manager": ["Product Management", "Agile", "Scrum", "Product Roadmap", "User Stories", "Jira", "Confluence"]
}

def enhance_ats_keywords(text: str, job_role: str) -> str:
    """
    Appends a natural sentence containing top missing keywords for the specified job role,
    but ONLY if those keywords correspond to skills already present/extracted from the input text
    (or are case-insensitive/substring variants) to prevent inventing skills (hallucination).
    """
    if not text or not job_role:
        return text
        
    keywords = ROLE_KEYWORDS.get(job_role)
    if not keywords:
        # Check case-insensitive match
        for role, kws in ROLE_KEYWORDS.items():
            if role.lower() in job_role.lower():
                keywords = kws
                break
                
    if not keywords:
        return text

    # Extract technologies present in the input text to define allowed techs (hallucination layer)
    from ats import _extract_skills
    present_skills = _extract_skills(text)
    
    # Filter keywords to only allow those that are in present_skills
    # (or case-insensitive variations/substrings, e.g. mapping "React" to "React.js")
    allowed_keywords = []
    for kw in keywords:
        kw_lower = kw.lower()
        if any(p.lower() in kw_lower or kw_lower in p.lower() for p in present_skills):
            allowed_keywords.append(kw)
            
    if not allowed_keywords:
        return text
        
    lower_text = text.lower()
    missing = []
    for kw in allowed_keywords:
        kw_lower = kw.lower()
        if kw_lower not in lower_text:
            missing.append(kw)
            
    if not missing:
        return text
        
    # Append top 3 missing keywords in a natural, action-oriented sentence
    top_missing = missing[:3]
    
    if len(top_missing) == 1:
        addition = f"Demonstrated proficiency in {top_missing[0]} during implementation."
    elif len(top_missing) == 2:
        addition = f"Leveraged {top_missing[0]} and {top_missing[1]} to streamline project outcomes."
    else:
        addition = f"Utilized {', '.join(top_missing[:-1])}, and {top_missing[-1]} to optimize development workflows."
        
    cleaned = text.strip()
    if cleaned.endswith("."):
        return f"{cleaned} {addition}"
    return f"{cleaned}. {addition}"
