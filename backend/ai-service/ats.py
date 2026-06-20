import re
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import language_tool_python
    _TOOL = language_tool_python.LanguageTool("en-US")
except Exception:
    _TOOL = None

SKILL_TERMS = [
    # Frontend / Web
    "html", "html5", "css", "css3", "javascript", "typescript", "react", "react.js", "vue", "vue.js",
    "angular", "redux", "webpack", "babel", "bootstrap", "tailwind", "tailwind css", "material-ui", "mui",
    "responsive design", "ui/ux", "figma", "adobe xd", "sketch", "wireframing", "prototyping",
    "user research", "interaction design", "next.js", "react native",
    # Backend / System
    "node.js", "node", "express", "express.js", "fastapi", "flask", "django", "spring", "spring boot",
    "java", "python", "kotlin", "swift", "objective-c", "c", "c++", "c#", "go", "rust", "embedded c",
    "microcontrollers", "rtos", "firmware", "iot", "arduino", "raspberry pi", "pcb design",
    # Databases
    "mongodb", "sql", "mysql", "postgresql", "nosql", "redis", "oracle", "sql server", "database administration",
    "backup & recovery", "performance tuning", "database security", "etl", "kafka", "data warehousing",
    "redshift", "snowflake", "airflow",
    # Cloud / DevOps
    "docker", "kubernetes", "aws", "azure", "gcp", "git", "ci/cd", "jenkins", "terraform", "ansible",
    "linux", "bash", "shell scripting", "prometheus", "grafana", "cloud computing", "iam", "vpc",
    "serverless", "lambda",
    # Data Science / ML
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "data visualization", "statistics", "big data", "hadoop", "spark", "nlp", "computer vision",
    "keras", "mlops", "data analysis", "power bi", "tableau", "excel", "dsa", "algorithms",
    "data structures", "feature engineering", "a/b testing",
    # QA / Mobile
    "selenium", "cypress", "jest", "junit", "test automation", "manual testing", "qa", "bug tracking",
    "jira", "postman", "regression testing", "ios", "android", "xcode", "android studio",
    "app store connect", "google play console",
    # Cybersecurity
    "cybersecurity", "firewalls", "siem", "penetration testing", "vulnerability assessment",
    "network security", "cryptography", "wireshark", "owasp", "security audits",
    # Management / Process
    "product management", "agile", "scrum", "product roadmap", "user stories", "market research",
    "confluence", "stakeholder management"
]

SKILL_MAP = {term.lower(): term for term in SKILL_TERMS}

def _extract_skills(text: str) -> List[str]:
    if not text:
        return []
    lower = text.lower()
    found = []
    for key, display in SKILL_MAP.items():
        # Match with word boundaries to avoid false positives (like 'go' in 'good')
        pattern = r"\b" + re.escape(key) + r"\b"
        if re.search(pattern, lower):
            found.append(display)
    return sorted(set(found))

def _compute_similarity(resume_text: str, job_text: str) -> float:
    if not resume_text or not job_text:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf = vectorizer.fit_transform([resume_text, job_text])
        score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(score)
    except Exception:
        return 0.0

def _detect_keyword_stuffing(text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    words = re.findall(r"\b\w+\b", lower)
    
    # Check for consecutive identical skill words
    for i in range(len(words) - 1):
        if words[i] == words[i+1] and words[i] in SKILL_MAP:
            return True
            
    # Check if any skill term is repeated 5+ times in the text
    for skill in SKILL_MAP.keys():
        pattern = r"\b" + re.escape(skill) + r"\b"
        count = len(re.findall(pattern, lower))
        if count >= 5:
            return True
    return False

def _compute_quantification_score(text: str) -> int:
    if not text:
        return 0
    # Patterns for percentages, scale multipliers, metrics (e.g. 50%, 2x, 10+, 1,000, 500+)
    patterns = [
        r"\b\d+%\b",
        r"\b\d+\s*percent\b",
        r"\b\d+x\b",
        r"\b\d+\+\b",
        r"\b\d+k\b",
        r"\b\d+m\b",
        r"\b\d+-\d+\b",
        r"\b\d{2,}\b"
    ]
    
    matches_count = 0
    for p in patterns:
        matches = re.findall(p, text, flags=re.IGNORECASE)
        matches_count += len(matches)
        
    if matches_count == 0:
        return 0
    elif matches_count == 1:
        return 40
    elif matches_count == 2:
        return 75
    else:
        return 100

ROLE_PACKS = {
    "SDE": {
        "requiredKeywords": ["Java", "Python", "C++", "DSA", "Algorithms", "Data Structures"],
        "optionalKeywords": ["Git", "SQL", "Linux", "REST APIs", "Testing"],
        "bonusKeywords": ["System Design", "Docker", "Kubernetes", "AWS"]
    },
    "Frontend Developer": {
        "requiredKeywords": ["HTML", "CSS", "JavaScript", "React", "Responsive Design"],
        "optionalKeywords": ["TypeScript", "Bootstrap", "Tailwind CSS", "Redux", "Git"],
        "bonusKeywords": ["Next.js", "GraphQL", "Webpack", "UI/UX"]
    },
    "Backend Developer": {
        "requiredKeywords": ["Node.js", "Express.js", "Python", "SQL", "REST APIs"],
        "optionalKeywords": ["Java", "Django", "MongoDB", "PostgreSQL", "Git"],
        "bonusKeywords": ["Microservices", "Docker", "Kubernetes", "AWS"]
    },
    "Full Stack Developer": {
        "requiredKeywords": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express.js", "MongoDB"],
        "optionalKeywords": ["SQL", "TypeScript", "REST APIs", "Git", "Redux"],
        "bonusKeywords": ["AWS", "Docker", "Microservices", "CI/CD"]
    },
    "Data Analyst": {
        "requiredKeywords": ["SQL", "Python", "Excel", "Data Analysis", "Tableau"],
        "optionalKeywords": ["Pandas", "NumPy", "Statistics", "Power BI"],
        "bonusKeywords": ["Big Data", "Data Warehousing", "ETL"]
    },
    "Data Scientist": {
        "requiredKeywords": ["Python", "Machine Learning", "Statistics", "SQL", "Pandas"],
        "optionalKeywords": ["NumPy", "Scikit-Learn", "Data Visualization", "R"],
        "bonusKeywords": ["Deep Learning", "TensorFlow", "PyTorch", "NLP"]
    },
    "ML Engineer": {
        "requiredKeywords": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Scikit-Learn"],
        "optionalKeywords": ["Algorithms", "NumPy", "Pandas", "SQL"],
        "bonusKeywords": ["MLOps", "Deep Learning", "NLP", "Computer Vision"]
    },
    "AI Engineer": {
        "requiredKeywords": ["Python", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch"],
        "optionalKeywords": ["Machine Learning", "Scikit-Learn", "Algorithms", "SQL"],
        "bonusKeywords": ["LLMs", "Generative AI", "MLOps", "Keras"]
    },
    "DevOps Engineer": {
        "requiredKeywords": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
        "optionalKeywords": ["Jenkins", "Terraform", "Ansible", "Git", "Bash"],
        "bonusKeywords": ["Prometheus", "Grafana", "Python", "Shell Scripting"]
    },
    "Cloud Engineer": {
        "requiredKeywords": ["AWS", "Azure", "GCP", "Cloud Computing", "Linux"],
        "optionalKeywords": ["Docker", "Kubernetes", "Terraform", "Git", "CI/CD"],
        "bonusKeywords": ["IAM", "VPC", "Serverless", "Lambda"]
    },
    "Cyber Security Engineer": {
        "requiredKeywords": ["Cybersecurity", "Network Security", "Firewalls", "Cryptography", "Linux"],
        "optionalKeywords": ["Penetration Testing", "Vulnerability Assessment", "SIEM", "Wireshark"],
        "bonusKeywords": ["OWASP", "Security Audits", "IAM"]
    },
    "QA Engineer": {
        "requiredKeywords": ["Selenium", "Cypress", "Test Automation", "Manual Testing", "Jira"],
        "optionalKeywords": ["Jest", "JUnit", "Postman", "QA", "Bug Tracking"],
        "bonusKeywords": ["Regression Testing", "CI/CD", "Git"]
    },
    "Mobile Developer": {
        "requiredKeywords": ["Swift", "Kotlin", "React Native", "Flutter", "iOS", "Android"],
        "optionalKeywords": ["Xcode", "Android Studio", "REST APIs", "Git", "Java"],
        "bonusKeywords": ["App Store Connect", "Google Play Console"]
    },
    "Java Developer": {
        "requiredKeywords": ["Java", "Spring Boot", "SQL", "OOP", "Hibernate"],
        "optionalKeywords": ["REST APIs", "Git", "Maven", "JUnit", "MySQL"],
        "bonusKeywords": ["Microservices", "Docker", "Kubernetes", "AWS"]
    },
    "Python Developer": {
        "requiredKeywords": ["Python", "Django", "Flask", "SQL", "OOP"],
        "optionalKeywords": ["FastAPI", "Pandas", "NumPy", "Git", "REST APIs"],
        "bonusKeywords": ["Docker", "AWS", "PostgreSQL", "Celery"]
    },
    "UI/UX Designer": {
        "requiredKeywords": ["Figma", "Adobe XD", "Wireframing", "Prototyping", "User Research"],
        "optionalKeywords": ["UI/UX Design", "Interaction Design", "Sketch", "Information Architecture"],
        "bonusKeywords": ["HTML", "CSS", "Usability Testing"]
    },
    "Business Analyst": {
        "requiredKeywords": ["Agile", "Scrum", "User Stories", "Requirements Gathering", "SQL"],
        "optionalKeywords": ["Jira", "Confluence", "Data Analysis", "Excel", "Tableau"],
        "bonusKeywords": ["Product Roadmap", "Stakeholder Management", "Process Modeling"]
    }
}

def _get_role_pack(job_description: str) -> Dict[str, List[str]]:
    lower_desc = (job_description or "").lower()
    
    # Check for direct matches or substrings
    for role_name, pack in ROLE_PACKS.items():
        if role_name.lower() in lower_desc:
            return pack
            
    # Substring heuristic checks
    if "sde" in lower_desc or "software engineer" in lower_desc:
        return ROLE_PACKS["SDE"]
    if "frontend" in lower_desc:
        return ROLE_PACKS["Frontend Developer"]
    if "backend" in lower_desc:
        return ROLE_PACKS["Backend Developer"]
    if "full stack" in lower_desc or "fullstack" in lower_desc:
        return ROLE_PACKS["Full Stack Developer"]
    if "data scientist" in lower_desc:
        return ROLE_PACKS["Data Scientist"]
    if "data analyst" in lower_desc:
        return ROLE_PACKS["Data Analyst"]
    if "machine learning" in lower_desc or "ml " in lower_desc:
        return ROLE_PACKS["ML Engineer"]
    if "ai " in lower_desc or "artificial intelligence" in lower_desc:
        return ROLE_PACKS["AI Engineer"]
    if "devops" in lower_desc:
        return ROLE_PACKS["DevOps Engineer"]
    if "cloud" in lower_desc:
        return ROLE_PACKS["Cloud Engineer"]
    if "cyber" in lower_desc or "security" in lower_desc:
        return ROLE_PACKS["Cyber Security Engineer"]
    if "qa" in lower_desc or "testing" in lower_desc:
        return ROLE_PACKS["QA Engineer"]
    if "mobile" in lower_desc or "android" in lower_desc or "ios" in lower_desc:
        return ROLE_PACKS["Mobile Developer"]
    if "java" in lower_desc:
        return ROLE_PACKS["Java Developer"]
    if "python" in lower_desc:
        return ROLE_PACKS["Python Developer"]
    if "ui" in lower_desc or "ux" in lower_desc or "design" in lower_desc:
        return ROLE_PACKS["UI/UX Designer"]
    if "business" in lower_desc or "analyst" in lower_desc:
        return ROLE_PACKS["Business Analyst"]
        
    return None

def check_ats(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    ATS V3 Scoring Engine: Calculates scores for 9 categories including Quantification,
    detects keyword stuffing, extracts missing keywords, and handles weights summing to 100%.
    """
    resume_skills = _extract_skills(resume_text)
    job_skills = _extract_skills(job_description)
    
    # If no job description is provided, use standard development skills as fallback
    if not job_skills:
        job_skills = ["Python", "Java", "JavaScript", "SQL", "Git", "REST APIs", "React", "Node.js"]

    role_pack = _get_role_pack(job_description)
    if role_pack:
        # Merge role pack keywords into job_skills
        pack_skills = role_pack["requiredKeywords"] + role_pack["optionalKeywords"] + role_pack["bonusKeywords"]
        job_skills = sorted(list(set(job_skills) | set(pack_skills)))

    matched_skills = sorted(set(resume_skills) & set(job_skills))
    missing_keywords = sorted(set(job_skills) - set(resume_skills))
    
    critical_fixes = []
    
    # Keyword Stuffing Detection
    keyword_stuffing = _detect_keyword_stuffing(resume_text)
    if keyword_stuffing:
        critical_fixes.append("Reduce keyword repetition / stuffing to pass automated ATS filters")
        
    # 1. Keyword Match (20%)
    similarity = _compute_similarity(resume_text, job_description)
    keyword_score = round(similarity * 100)
    keyword_score = max(10, min(100, keyword_score))
    if keyword_stuffing:
        # Penalize keyword stuffing
        keyword_score = max(10, keyword_score - 30)
    
    # 2. Skills Match (20%)
    if role_pack:
        # Calculate skills_score based on required, optional, and bonus keywords weight
        matched_req = [k for k in role_pack["requiredKeywords"] if any(k.lower() == r.lower() for r in resume_skills)]
        matched_opt = [k for k in role_pack["optionalKeywords"] if any(k.lower() == r.lower() for r in resume_skills)]
        matched_bonus = [k for k in role_pack["bonusKeywords"] if any(k.lower() == r.lower() for r in resume_skills)]
        
        required_ratio = len(matched_req) / max(1, len(role_pack["requiredKeywords"]))
        optional_ratio = len(matched_opt) / max(1, len(role_pack["optionalKeywords"]))
        bonus_ratio = len(matched_bonus) / max(1, len(role_pack["bonusKeywords"]))
        
        skills_score = round((0.5 * required_ratio + 0.3 * optional_ratio + 0.2 * bonus_ratio) * 100)
        skills_score = max(0, min(100, skills_score))
        
        missing_req = sorted(set(role_pack["requiredKeywords"]) - set(matched_req))
        if missing_req:
            critical_fixes.append(f"Add critical missing keywords: {', '.join(missing_req[:3])}")
    else:
        skills_ratio = len(matched_skills) / max(1, len(job_skills))
        skills_score = round(skills_ratio * 100)
        skills_score = max(0, min(100, skills_score))
        if len(missing_keywords) > 2:
            critical_fixes.append(f"Add missing ATS keywords: {', '.join(missing_keywords[:3])}")
        
    # 3. Quantification Score (10%)
    quantification_score = _compute_quantification_score(resume_text)
    if quantification_score < 70:
        critical_fixes.append("Quantify accomplishments with metrics, percentages, or scale multipliers")
        
    # 4. Project Relevance (10%)
    project_score = 0
    lower_resume = resume_text.lower()
    project_keywords = ["project", "developed", "engineered", "designed", "built", "implemented"]
    proj_keyword_count = sum(1 for kw in project_keywords if kw in lower_resume)
    if "project" in lower_resume:
        project_score += 50
        project_score += min(50, proj_keyword_count * 10)
    else:
        critical_fixes.append("Add a detailed Projects section to show technical execution")
        
    # 5. Experience Relevance (10%)
    experience_score = 0
    if any(k in lower_resume for k in ["experience", "internship", "worked", "intern"]):
        experience_score = 100
        # If experience is very short, reduce
        if len(lower_resume) < 300:
            experience_score = 50
    else:
        critical_fixes.append("Include internship or work experience details")
        
    # 6. Grammar Quality (10%)
    grammar_issues = 0
    if _TOOL:
        try:
            matches = _TOOL.check(resume_text)
            grammar_issues = len(matches)
        except Exception:
            pass
    grammar_score = max(0, 100 - grammar_issues * 8)
    if grammar_issues > 4:
        critical_fixes.append("Proofread and resolve grammar and spelling issues")
        
    # 7. Resume Structure (10%)
    structure_score = 0
    sections = {
        "summary": ["summary", "objective", "profile"],
        "education": ["education", "academic", "college"],
        "skills": ["skills", "expertise", "technologies"],
        "projects": ["projects", "academic projects", "personal projects"],
        "experience": ["experience", "internship", "employment", "history"]
    }
    found_sections = 0
    for sec, aliases in sections.items():
        if any(alias in lower_resume for alias in aliases):
            found_sections += 1
    structure_score = round((found_sections / len(sections)) * 100)
    if found_sections < len(sections):
        missing_sec = [s.capitalize() for s, aliases in sections.items() if not any(a in lower_resume for a in aliases)]
        if missing_sec:
            critical_fixes.append(f"Add missing sections: {', '.join(missing_sec)}")
            
    # 8. Education Completeness (5%)
    education_score = 0
    if any(k in lower_resume for k in ["college", "university", "school", "cgpa", "percentile"]):
        education_score = 100
        if not any(k in lower_resume for k in ["cgpa", "percentile"]):
            education_score = 70
            critical_fixes.append("Specify GPA or CGPA in the Education section")
    else:
        critical_fixes.append("Add detailed college and school credentials")
        
    # 9. Contact Completeness (5%)
    contact_score = 0
    contact_checks = {
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "mobile": r"\b(?:\+?\d{1,3}[- ]?)?\d{10}\b",
        "linkedin": r"linkedin\.com",
        "github": r"github\.com"
    }
    contact_points = 0
    for c_type, pattern in contact_checks.items():
        if re.search(pattern, lower_resume):
            contact_points += 25
        else:
            critical_fixes.append(f"Add {c_type.capitalize()} profile connection details")
    contact_score = contact_points

    # Overall Score (Weighted V3: keyword 20%, skills 20%, quant 10%, projects 10%, exp 10%, grammar 10%, structure 10%, edu 5%, contact 5%)
    overall_score = round(
        0.20 * keyword_score +
        0.20 * skills_score +
        0.10 * quantification_score +
        0.10 * project_score +
        0.10 * experience_score +
        0.10 * grammar_score +
        0.10 * structure_score +
        0.05 * education_score +
        0.05 * contact_score
    )
    overall_score = max(0, min(100, overall_score))
    
    # Format Score (mapped to structural/style checks)
    format_score = round(0.6 * structure_score + 0.4 * contact_score)

    # Reconstruct category data for the frontend rendering loop
    categories = {
        "keywordMatch": {
            "name": "KEYWORD MATCH",
            "score": keyword_score,
            "weight": 20,
            "color": "#4A90D9",
            "issues": [f"Missing job keywords: {', '.join(missing_keywords[:4])}"] if missing_keywords else []
        },
        "skillsMatch": {
            "name": "SKILLS MATCH",
            "score": skills_score,
            "weight": 20,
            "color": "#E74C3C",
            "issues": [f"Highlight {s} to improve ranking" for s in missing_keywords[:3]]
        },
        "quantificationScore": {
            "name": "QUANTIFICATION METRICS",
            "score": quantification_score,
            "weight": 10,
            "color": "#F39C12",
            "issues": ["Add numbers, percentages, or scale metrics (e.g. 2x, 50%) to project and experience bullet points"] if quantification_score < 70 else []
        },
        "projectRelevance": {
            "name": "PROJECT RELEVANCE",
            "score": project_score,
            "weight": 10,
            "color": "#2DBE7F",
            "issues": ["Add project details with quantified results"] if project_score < 70 else []
        },
        "experienceRelevance": {
            "name": "EXPERIENCE RELEVANCE",
            "score": experience_score,
            "weight": 10,
            "color": "#9B59B6",
            "issues": ["Incorporate key industry achievements in previous roles"] if experience_score < 70 else []
        },
        "grammarQuality": {
            "name": "GRAMMAR QUALITY",
            "score": grammar_score,
            "weight": 10,
            "color": "#E67E22",
            "issues": [f"Grammar/spelling count: {grammar_issues} errors found"] if grammar_issues > 0 else []
        },
        "resumeStructure": {
            "name": "RESUME STRUCTURE",
            "score": structure_score,
            "weight": 10,
            "color": "#34495E",
            "issues": ["Ensure all key headings follow standard templates"] if structure_score < 90 else []
        },
        "educationCompleteness": {
            "name": "EDUCATION COMPLETENESS",
            "score": education_score,
            "weight": 5,
            "color": "#1ABC9C",
            "issues": ["Specify CGPA, branch, and graduation year details"] if education_score < 100 else []
        },
        "contactCompleteness": {
            "name": "CONTACT COMPLETENESS",
            "score": contact_score,
            "weight": 5,
            "color": "#F1C40F",
            "issues": ["Verify email, phone number, LinkedIn, and GitHub links"] if contact_score < 100 else []
        }
    }

    # Suggestions list (compatibility)
    suggestions = []
    if missing_keywords:
        suggestions.append("Add or highlight these skills: " + ", ".join(missing_keywords[:6]))
    if keyword_stuffing:
        suggestions.append("Avoid repetitive skill keywords to prevent spam flags from modern ATS readers.")
    if quantification_score < 70:
        suggestions.append("Quantify your project and work descriptions (e.g., 'improved performance by 20%' or 'managed 3-tier architecture').")
    if grammar_issues > 0:
        suggestions.append(f"Fix the {grammar_issues} grammar/spelling issue(s) detected.")
    if found_sections < len(sections):
        suggestions.append("Incorporate standard headings: Summary, Education, Skills, Projects, and Experience.")
    if contact_score < 100:
        suggestions.append("Provide complete contact info including LinkedIn and GitHub URLs.")

    return {
        "overallScore": overall_score,
        "keywordScore": keyword_score,
        "skillsScore": skills_score,
        "grammarScore": grammar_score,
        "formatScore": format_score,
        "projectScore": project_score,
        "missingKeywords": missing_keywords,
        "grammarIssues": grammar_issues,
        "criticalFixes": list(set(critical_fixes))[:5],
        "categories": categories,
        "suggestions": suggestions,
        "matchedSkills": matched_skills,
        "missingSkills": missing_keywords,
        "keywordStuffing": keyword_stuffing,
        "penaltyApplied": True if keyword_stuffing else False
    }
