import re
from typing import Optional, Dict, Any

DEPARTMENTS = {
    "cse": "CSE",
    "computer science": "CSE",
    "ece": "ECE",
    "electronics": "ECE",
    "eee": "EEE",
    "electrical": "EEE",
    "it": "IT",
    "information technology": "IT",
    "mech": "MECH",
    "mechanical": "MECH",
    "civil": "CIVIL",
    "csd": "CSD",
}

YEAR_MAP = {
    "first year": "I",
    "1st year": "I",
    "first": "I",
    "second year": "II",
    "2nd year": "II",
    "second": "II",
    "third year": "III",
    "3rd year": "III",
    "third": "III",
    "fourth year": "IV",
    "4th year": "IV",
    "fourth": "IV",
    "final year": "IV",
}

SEMESTER_MAP = {
    "1st sem": "1", "semester 1": "1", "sem 1": "1",
    "2nd sem": "2", "semester 2": "2", "sem 2": "2",
    "3rd sem": "3", "semester 3": "3", "sem 3": "3",
    "4th sem": "4", "semester 4": "4", "sem 4": "4",
    "5th sem": "5", "semester 5": "5", "sem 5": "5",
    "6th sem": "6", "semester 6": "6", "sem 6": "6",
    "7th sem": "7", "semester 7": "7", "sem 7": "7",
    "8th sem": "8", "semester 8": "8", "sem 8": "8",
}

COMMON_SKILLS = [
    "python", "java", "javascript", "js", "typescript", "ts", "c\\+\\+", "c", "c#",
    "react", "node", "express", "mongodb", "sql", "mysql", "postgresql", "html", "css",
    "django", "flask", "springboot", "angular", "vue", "aws", "docker", "git", "dsa"
]

COMPANIES = [
    "zoho", "tcs", "wipro", "infosys", "cts", "cognizant", "accenture", "amazon", "microsoft", "google", "hcl"
]

def parse_intent(prompt: str) -> Dict[str, Any]:
    text = prompt.strip()
    lower = text.lower()
    intent = {}

    # Helper function to extract numeric bounds from comparisons
    def parse_bound(phrase: str) -> Optional[tuple]:
        val_match = re.search(r"(\d+(?:\.\d+)?)", phrase)
        if not val_match:
            return None
        val = float(val_match.group(1))
        
        # Upper bounds
        if any(x in phrase for x in ["below", "less than", "under", "fewer than", "<", "gpa below", "cgpa below"]):
            is_inclusive = "=" in phrase or "at most" in phrase or "equal" in phrase or "<=" in phrase
            return (val, is_inclusive, True)
            
        # Lower bounds
        if any(x in phrase for x in ["above", "greater than", "more than", "at least", ">", "gpa above", "cgpa above"]):
            is_inclusive = "=" in phrase or "at least" in phrase or "equal" in phrase or ">=" in phrase
            return (val, is_inclusive, False)
            
        return (val, True, False)

    # 1. RegNo parsing (usually 6+ digits)
    reg_no_match = re.search(r"\b\d{6,}\b", lower)
    if reg_no_match:
        intent["regNo"] = reg_no_match.group(0)

    # 2. Name parsing (supporting "find student john" as well as "find john")
    name_match = re.search(
        r"(?:show|find|get|search|display)\s+(?:me\s+)?(?:students?|profiles?|records?|details?|of)?\s*([a-z]+(?:\s+[a-z]+){0,2})",
        lower
    )
    if name_match and "regNo" not in intent:
        candidate_name = name_match.group(1).strip()
        name_words = candidate_name.split()
        invalid_name = False
        
        stop_keywords = {
            "placed", "unplaced", "blocked", "unblocked", "active", "student", "students", 
            "record", "records", "profile", "profiles", "from", "at", "in", "with", "know", 
            "knows", "skilled", "experience", "having", "has", "who", "are", "likely", 
            "eligible", "for", "living", "resident", "marks", "percentage", "cgpa", "gpa"
        }
        
        for word in name_words:
            if word in stop_keywords:
                invalid_name = True
                break
                
        if not invalid_name and candidate_name not in DEPARTMENTS and candidate_name not in YEAR_MAP:
            intent["name"] = candidate_name

    # 3. Department matching
    for key, value in DEPARTMENTS.items():
        if re.search(rf"\b{re.escape(key)}\b", lower):
            intent["department"] = value
            break

    # 4. Year matching
    for key, value in YEAR_MAP.items():
        if key in lower:
            intent["currentYear"] = value
            break

    # 5. Semester matching
    for key, value in SEMESTER_MAP.items():
        if key in lower:
            intent["currentSemester"] = value
            break

    # 6. CGPA / GPA parsing
    cgpa_patterns = [
        r"(?:cgpa|gpa)\s*(?:between)\s*(\d+(?:\.\d+)?)\s*(?:and)\s*(\d+(?:\.\d+?)?)",
        r"(?:cgpa|gpa)\s*(above|greater than|>=|>|more than|at least|below|less than|<=|<|at most)\s*(\d+(?:\.\d+)?)",
        r"(above|greater than|>=|>|more than|at least|below|less than|<=|<|at most)\s*(\d+(?:\.\d+)?)\s*(?:cgpa|gpa)"
    ]
    
    between_match = re.search(cgpa_patterns[0], lower)
    if between_match:
        intent["cgpaMin"] = float(between_match.group(1))
        intent["cgpaMax"] = float(between_match.group(2))
    else:
        for pattern in cgpa_patterns[1:]:
            matches = re.finditer(pattern, lower)
            for m in matches:
                op = m.group(1)
                val = float(m.group(2))
                bound_info = parse_bound(f"{op} {val}")
                if bound_info:
                    val_parsed, is_inclusive, is_upper = bound_info
                    if is_upper:
                        intent["cgpaMax"] = val_parsed
                    else:
                        intent["cgpaMin"] = val_parsed

    # 7. Schooling Percentages (10th & 12th)
    tenth_above = re.search(
        r"(?:10th|tenth)\s*(?:percentage|score|marks|percent)?\s*(?:above|greater than|>=|>|more than|at least)\s*(\d+(?:\.\d+)?)",
        lower
    )
    if tenth_above:
        intent["tenthMin"] = float(tenth_above.group(1))

    twelfth_above = re.search(
        r"(?:12th|twelfth)\s*(?:percentage|score|marks|percent)?\s*(?:above|greater than|>=|>|more than|at least)\s*(\d+(?:\.\d+)?)",
        lower
    )
    if twelfth_above:
        intent["twelfthMin"] = float(twelfth_above.group(1))

    # 8. Backlog / Arrear parsing
    no_backlogs = re.search(
        r"\b(no|zero|0|without)\s+(?:active\s+)?(?:backlogs?|arrears?)\b",
        lower
    )
    if no_backlogs or "all clear" in lower or "clean profile" in lower or "clear record" in lower:
        intent["hasBacklogs"] = False
        intent["backlogCountMax"] = 0
    else:
        # Match backlog count conditions (e.g. backlog above 2, 3 backlogs)
        backlogs_above_post = re.search(
            r"(\d+)\s*(?:backlogs?|arrears?)\s*(?:and|or)?\s*(?:above|more|greater|at least|\+)",
            lower
        )
        if backlogs_above_post:
            intent["hasBacklogs"] = True
            intent["backlogCountMin"] = int(backlogs_above_post.group(1))
        else:
            backlog_gt = re.search(
                r"(?:more than|above|greater than|>)\s*(\d+)\s*(?:backlogs?|arrears?)|(?:backlogs?|arrears?)\s*(?:more than|above|greater than|>)\s*(\d+)",
                lower
            )
            if backlog_gt:
                val_str = backlog_gt.group(1) or backlog_gt.group(2)
                intent["hasBacklogs"] = True
                intent["backlogCountMin"] = int(val_str) + 1
            else:
                backlog_exact = re.search(
                    r"\b(\d+)\s*(?:backlogs?|arrears?)\b",
                    lower
                )
                if backlog_exact:
                    val = int(backlog_exact.group(1))
                    intent["hasBacklogs"] = True if val > 0 else False
                    intent["backlogCountMin"] = val
                    intent["backlogCountMax"] = val
                elif any(x in lower for x in ["backlog", "arrear", "fail"]):
                    intent["hasBacklogs"] = True

    # 9. Skills parsing
    skills_extracted = []
    skills_match = re.search(
        r"(?:knows?|skilled in|skills?|experience in|proficient in|expertise in)\s+([a-z0-9#+.]+(?:\s*,?\s*[a-z0-9#+.]+)*)",
        lower
    )
    if skills_match:
        phrase = skills_match.group(1)
        skills_extracted.extend([s.strip() for s in re.split(r",|\band\b", phrase) if s.strip()])
    
    for skill in COMMON_SKILLS:
        pattern = rf"\b{skill}\b"
        if skill == "c\\+\\+":
            pattern = r"c\+\+"
        elif skill == "c#":
            pattern = r"c#"
            
        if re.search(pattern, lower):
            clean_skill = skill.replace("\\+", "+")
            if clean_skill not in skills_extracted:
                skills_extracted.append(clean_skill)

    if skills_extracted:
        intent["skills"] = ", ".join(skills_extracted)

    # 10. Placement parsing
    unplaced = re.search(
        r"\b(not placed|unplaced|un-placed|eligible for placement)\b",
        lower
    )
    if unplaced:
        if "eligible for placement" not in lower:
            intent["isPlaced"] = False
    elif re.search(r"\bplaced\b", lower):
        intent["isPlaced"] = True

    # Placed company
    placed_co = re.search(
        r"(?:placed|selected|hired|got\s+job)\s+(?:at|in|with|by|company)\s*([a-z0-9&.'-]+)",
        lower
    )
    if placed_co:
        company_candidate = placed_co.group(1).strip()
        if company_candidate not in ["company", "drive", "placement"]:
            intent["isPlaced"] = True
            intent["placedCompany"] = company_candidate.upper()
            
    # Protect company names from city parser
    for co in COMPANIES:
        if re.search(rf"\b{co}\b", lower):
            if any(x in lower for x in ["placed", "placement", "package", "salary", "ctc", "lpa", "offer", "job", "hired", "recruited", "selected"]):
                intent["placedCompany"] = co.upper()
                intent["isPlaced"] = True

    # 11. Salary / Package parsing
    pkg_match = re.search(
        r"(?:package|pkg|salary|ctc)\s*(?:above|greater than|>=|>|more than|at least)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs)?",
        lower
    )
    if pkg_match:
        intent["packageMin"] = float(pkg_match.group(1))
        intent["isPlaced"] = True

    # 12. Drive count & attendance parsing
    drives_above_post = re.search(
        r"(\d+)\s*(?:drives?)\s*(?:and|or)?\s*(?:above|more|greater|at least|\+)",
        lower
    )
    if drives_above_post:
        intent["driveCountMin"] = int(drives_above_post.group(1))
    else:
        drives_gt = re.search(
            r"(?:attended|attending|drives)\s*(?:more than|above|greater than|>)\s*(\d+)|(?:more than|above|greater than|>)\s*(\d+)\s*(?:attended\s+)?drives",
            lower
        )
        if drives_gt:
            val = int(drives_gt.group(1) or drives_gt.group(2))
            intent["driveCountMin"] = val + 1
        else:
            drives_gte = re.search(
                r"(?:attended|attending|drives)\s*(?:at least|>=)\s*(\d+)|(?:at least|>=)\s*(\d+)\s*(?:attended\s+)?drives",
                lower
            )
            if drives_gte:
                val = int(drives_gte.group(1) or drives_gte.group(2))
                intent["driveCountMin"] = val

    # Drives less than X
    drives_lt = re.search(
        r"(?:attended|attending|drives)\s*(?:less than|below|under|<)\s*(\d+)|(?:less than|below|under|<)\s*(\d+)\s*(?:attended\s+)?drives",
        lower
    )
    if drives_lt:
        val = int(drives_lt.group(1) or drives_lt.group(2))
        intent["driveCountMax"] = val - 1
    else:
        drives_lte = re.search(
            r"(?:attended|attending|drives)\s*(?:at most|<=)\s*(\d+)|(?:at most|<=)\s*(\d+)\s*(?:attended\s+)?drives",
            lower
        )
        if drives_lte:
            val = int(drives_lte.group(1) or drives_lte.group(2))
            intent["driveCountMax"] = val

    if "not attended any drive" in lower or "attended 0 drives" in lower or "no drives attended" in lower:
        intent["driveCountMax"] = 0

    # 13. Block status parsing
    if re.search(r"\bblocked\b", lower):
        intent["isBlocked"] = True
    elif re.search(r"\b(unblocked)\b", lower):
        intent["isBlocked"] = False
    elif re.search(r"\bactive\b", lower) and not re.search(r"active\s+(?:backlogs?|arrears?)", lower):
        intent["isBlocked"] = False

    # 13.1 Profile Photo parsing
    if any(x in lower for x in ["no profile photo", "no profile pic", "without profile photo", "missing profile picture", "not uploaded profile photo", "no profile picture", "not uploaded profile pic", "missing profile photo"]):
        intent["hasProfilePic"] = False
    elif any(x in lower for x in ["with profile photo", "has profile photo", "uploaded profile photo", "has profile pic", "with profile pic"]):
        intent["hasProfilePic"] = True

    # 13.2 Profile Extra Fields (from student profile details)
    # firstGraduate
    if any(x in lower for x in ["first graduate", "first-generation graduate", "first gen graduate"]):
        intent["firstGraduate"] = "Yes"
    elif any(x in lower for x in ["not a first graduate", "not first graduate"]):
        intent["firstGraduate"] = "No"

    # willingToSignBond
    if any(x in lower for x in ["willing to sign bond", "willing to sign a bond", "ready to sign bond", "willing for bond", "willing to bond"]):
        intent["willingToSignBond"] = "Yes"
    elif any(x in lower for x in ["not willing to sign bond", "not willing to sign a bond", "not willing to bond"]):
        intent["willingToSignBond"] = "No"

    # residentialStatus
    if any(x in lower for x in ["dayscholar", "day scholar", "dayscholars"]):
        intent["residentialStatus"] = "Dayscholar"
    elif any(x in lower for x in ["hosteller", "hostel student", "hostellers", "staying in hostel"]):
        intent["residentialStatus"] = "Hosteller"

    # quota
    if any(x in lower for x in ["counselling quota", "counseling quota", "counselling"]):
        intent["quota"] = "Counselling"
    elif any(x in lower for x in ["management quota", "management"]):
        intent["quota"] = "Management"

    # preferredModeOfDrive
    if "hybrid" in lower:
        intent["preferredModeOfDrive"] = "Hybrid"
    elif any(x in lower for x in ["on-campus", "on campus"]):
        intent["preferredModeOfDrive"] = "On-Campus"
    elif "online" in lower:
        intent["preferredModeOfDrive"] = "Online"

    # 14. Gender & City parsing
    if re.search(r"\b(female|girl|women|woman)s?\b", lower):
        intent["gender"] = "Female"
    elif re.search(r"\b(male|boy|men|man)s?\b", lower):
        intent["gender"] = "Male"

    # Match city
    city_match = re.search(
        r"(?:from|in|living in|resident of)\s+([a-z]+)\b",
        lower
    )
    if city_match:
        candidate_city = city_match.group(1).strip()
        city_stop_words = ["student", "students", "drive", "drives", "active", "blocked", "unblocked", "placed", "unplaced", "skills", "gpa", "cgpa", "batch"]
        if candidate_city not in DEPARTMENTS and candidate_city not in COMPANIES and candidate_city not in city_stop_words and len(candidate_city) > 3:
            intent["city"] = candidate_city.capitalize()

    # 15. Batch / Year of study parsing
    batch_match = re.search(r"\b(20\d{2})[-–](20\d{2})\b", lower)
    if batch_match:
        intent["batch"] = f"{batch_match.group(1)}-{batch_match.group(2)}"
    else:
        batch_single = re.search(r"\b(20\d{2})\s*(?:batch|graduates?|passout)?\b", lower)
        if batch_single:
            year = int(batch_single.group(1))
            intent["batch"] = f"{year-4}-{year}"

    # 16. Sort matching
    if any(x in lower for x in ["highest package", "top package", "highest salary", "highest ctc", "maximum package", "max package"]):
        intent["sortBy"] = "package"
        intent["sortOrder"] = "desc"
        intent["isPlaced"] = True
    elif any(x in lower for x in ["lowest package", "minimum package", "lowest ctc", "min salary", "minimum salary"]):
        intent["sortBy"] = "package"
        intent["sortOrder"] = "asc"
        intent["isPlaced"] = True
    elif any(x in lower for x in ["top student", "highest cgpa", "academic topper", "highest gpa", "best cgpa", "toppers", "rank holder", "rank holders"]):
        intent["sortBy"] = "cgpa"
        intent["sortOrder"] = "desc"
    elif any(x in lower for x in ["lowest cgpa", "poor academic"]):
        intent["sortBy"] = "cgpa"
        intent["sortOrder"] = "asc"

    # Check for general "sort by X"
    sort_general = re.search(r"sort\s+by\s+(cgpa|gpa|package|pkg|salary|ctc|regno|reg\s+no|register\s+number)", lower)
    if sort_general:
        field = sort_general.group(1).replace(" ", "")
        if field in ["gpa", "cgpa"]:
            intent["sortBy"] = "cgpa"
        elif field in ["pkg", "salary", "ctc", "package"]:
            intent["sortBy"] = "package"
            intent["isPlaced"] = True
        elif field in ["regno", "regno", "register"]:
            intent["sortBy"] = "regNo"
            
        if "desc" in lower or "highest" in lower or "reverse" in lower or "down" in lower:
            intent["sortOrder"] = "desc"
        else:
            intent["sortOrder"] = "asc"

    # 17. Specialized Natural Language Mappings
    if any(x in lower for x in ["product companies", "product company eligibility", "product eligible"]):
        intent["cgpaMin"] = 8.0
        intent["hasBacklogs"] = False
        if "skills" not in intent:
            intent["skills"] = "DSA"
    elif any(x in lower for x in ["mass recruiter", "service company", "service eligible"]):
        intent["cgpaMin"] = 6.0
        intent["hasBacklogs"] = False

    return intent
