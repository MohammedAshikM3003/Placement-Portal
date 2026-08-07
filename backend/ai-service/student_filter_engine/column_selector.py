from typing import List, Dict, Any

def select_columns(prompt: str, filters: Dict[str, Any]) -> List[str]:
    """
    Selects which extra columns should be displayed in the UI table
    based on the search prompt keywords and applied filters.
    """
    columns = []
    prompt_lower = prompt.lower()

    # 1. Placement Columns
    placement_keywords = [
        "place", "placed", "placement", "unplaced", "company", "package", "salary",
        "ctc", "lpa", "offer", "job", "tcs", "wipro", "infosys", "cts", "cognizant",
        "zoho", "accenture", "amazon", "microsoft", "google", "hcl"
    ]
    has_placement_filter = (
        filters.get("isPlaced") is not None or
        filters.get("placedCompany") or
        filters.get("packageMin") is not None or
        filters.get("sortBy") == "package"
    )
    if has_placement_filter or any(kw in prompt_lower for kw in placement_keywords):
        columns.extend(["placementStatus", "placedCompany", "package"])

    # 2. CGPA Columns
    cgpa_keywords = ["cgpa", "gpa", "marks", "percentage", "percent", "topper", "toppers", "academic", "rank", "score", "top"]
    has_cgpa_filter = (
        filters.get("cgpaMin") is not None or 
        filters.get("cgpaMax") is not None or
        filters.get("sortBy") == "cgpa"
    )
    if has_cgpa_filter or any(kw in prompt_lower for kw in cgpa_keywords):
        columns.append("cgpa")

    # 3. Backlog Columns
    backlog_keywords = ["backlog", "backlogs", "arrear", "arrears", "fail", "cleared", "history"]
    has_backlog_filter = (
        filters.get("hasBacklogs") is not None or
        filters.get("backlogCountMin") is not None or
        filters.get("backlogCountMax") is not None
    )
    if has_backlog_filter or any(kw in prompt_lower for kw in backlog_keywords):
        columns.append("backlogs")

    # 4. Skills Columns
    skill_keywords = ["skill", "skills", "knows", "known", "experience", "developer", "expert", "dsa", "programming", "code"]
    if filters.get("skills") or any(kw in prompt_lower for kw in skill_keywords):
        columns.append("skills")

    # 5. Drive Attendance Columns
    drive_keywords = ["drive", "drives", "attended", "attendance", "recruitment", "interviews"]
    has_drive_filter = filters.get("driveCountMin") is not None or filters.get("driveCountMax") is not None
    if has_drive_filter or any(kw in prompt_lower for kw in drive_keywords):
        columns.extend(["driveCount", "lastDriveDate"])

    # 6. Schooling Percentage Columns
    if "10th" in prompt_lower or "tenth" in prompt_lower or filters.get("tenthMin") is not None:
        columns.append("tenthPercentage")
    if "12th" in prompt_lower or "twelfth" in prompt_lower or filters.get("twelfthMin") is not None:
        columns.append("twelfthPercentage")

    # 7. Block Status Columns
    block_keywords = ["blocked", "unblocked", "active", "blocklist"]
    if filters.get("isBlocked") is not None or any(kw in prompt_lower for kw in block_keywords):
        columns.append("blocked")

    # 8. Eligible Drives Columns
    eligible_keywords = ["eligible", "eligibility", "allowed"]
    if any(kw in prompt_lower for kw in eligible_keywords):
        columns.append("eligibleDrives")

    # 9. Extra student profile fields
    if "first graduate" in prompt_lower or filters.get("firstGraduate") is not None:
        columns.append("firstGraduate")
    if "bond" in prompt_lower or filters.get("willingToSignBond") is not None:
        columns.append("willingToSignBond")
    if any(kw in prompt_lower for kw in ["dayscholar", "hosteller", "hostel"]) or filters.get("residentialStatus") is not None:
        columns.append("residentialStatus")
    if "quota" in prompt_lower or filters.get("quota") is not None:
        columns.append("quota")
    if any(kw in prompt_lower for kw in ["hybrid", "campus", "online"]) or filters.get("preferredModeOfDrive") is not None:
        columns.append("preferredModeOfDrive")

    # 10. Profile photo status
    if any(kw in prompt_lower for kw in ["profile photo", "profile pic", "profile picture", "photo", "picture"]) or filters.get("hasProfilePic") is not None:
        columns.append("hasProfilePic")

    # Deduplicate while keeping original search order
    seen = set()
    unique_columns = []
    for col in columns:
        if col not in seen:
            seen.add(col)
            unique_columns.append(col)

    return unique_columns
