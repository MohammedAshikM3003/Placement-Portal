from typing import Dict, Any
from student_filter_engine.intent_parser import parse_intent
from student_filter_engine.filter_builder import build_filters
from student_filter_engine.column_selector import select_columns

def generate_explanation(filters: Dict[str, Any], columns: list) -> str:
    """
    Generates a natural, user-friendly explanation sentence describing 
    what filters were parsed and which columns are being displayed.
    """
    phrases = []
    
    # 1. Basic profile, Dept and Year
    dept = filters.get("department")
    year = filters.get("currentYear")
    gender = filters.get("gender")
    reg_no = filters.get("regNo")
    name = filters.get("name")
    
    basic = ""
    if gender:
        basic += f"{gender} "
    if dept:
        basic += f"{dept} "
    else:
        basic += "Student "
        
    if year:
        basic += f"({year} Year) "
        
    basic = basic.strip() + "s"
    phrases.append(basic)
    
    # If regNo or name is queried directly
    if reg_no:
        phrases.append(f"with Register Number '{reg_no}'")
    if name:
        phrases.append(f"with name matching '{name}'")
    
    # 2. Placement Status
    is_placed = filters.get("isPlaced")
    co = filters.get("placedCompany")
    pkg = filters.get("packageMin")
    
    if is_placed is True:
        if co:
            phrases.append(f"placed at {co}")
        else:
            phrases.append("who are placed")
        if pkg:
            phrases.append(f"with a package of {pkg} LPA or above")
    elif is_placed is False:
        phrases.append("who are unplaced")
        
    # 3. Academics
    cg_min = filters.get("cgpaMin")
    cg_max = filters.get("cgpaMax")
    if cg_min is not None and cg_max is not None:
        phrases.append(f"with CGPA between {cg_min} and {cg_max}")
    elif cg_min is not None:
        phrases.append(f"with CGPA of {cg_min} or above")
    elif cg_max is not None:
        phrases.append(f"with CGPA of {cg_max} or below")
        
    # Schooling percentages
    tenth = filters.get("tenthMin")
    twelfth = filters.get("twelfthMin")
    if tenth is not None:
        phrases.append(f"10th percentage of {tenth}% or above")
    if twelfth is not None:
        phrases.append(f"12th percentage of {twelfth}% or above")

    # 4. Backlogs
    has_back = filters.get("hasBacklogs")
    b_min = filters.get("backlogCountMin")
    b_max = filters.get("backlogCountMax")
    
    if has_back is False:
        phrases.append("with no active backlogs")
    elif has_back is True:
        if b_min is not None and b_max is not None and b_min == b_max:
            phrases.append(f"having exactly {b_min} backlog(s)")
        elif b_min is not None:
            phrases.append(f"having {b_min} or more backlog(s)")
        else:
            phrases.append("with active backlogs")
            
    # 5. Skills
    sk = filters.get("skills")
    if sk:
        phrases.append(f"skilled in {sk}")
        
    # 6. Drive Count
    d_min = filters.get("driveCountMin")
    d_max = filters.get("driveCountMax")
    if d_min is not None:
        phrases.append(f"who attended {d_min} or more drive(s)")
    elif d_max is not None:
        phrases.append(f"who attended {d_max} or fewer drive(s)")
        
    # 7. Block Status
    blocked = filters.get("isBlocked")
    if blocked is True:
        phrases.append("who are blocked")
    elif blocked is False:
        phrases.append("who are active")

    # 7.1 Profile Photo Status
    has_photo = filters.get("hasProfilePic")
    if has_photo is True:
        phrases.append("who have uploaded a profile photo")
    elif has_photo is False:
        phrases.append("who have not uploaded a profile photo")

    # 8. Sorting
    sort_by = filters.get("sortBy")
    sort_order = filters.get("sortOrder")
    sort_phrase = ""
    if sort_by:
        field_label = "Register Number"
        if sort_by == "package":
            field_label = "Placement Package"
        elif sort_by == "cgpa":
            field_label = "CGPA"
        
        direction = "descending" if sort_order == "desc" else "ascending"
        sort_phrase = f"sorted by {field_label} ({direction})"

    # Construct final explanation sentence
    main_sentence = "Showing " + phrases[0]
    if len(phrases) > 1:
        details = ", ".join(phrases[1:])
        if ", " in details:
            parts = details.rsplit(", ", 1)
            details = " and ".join(parts)
        main_sentence += " " + details
        
    if sort_phrase:
        main_sentence += f", {sort_phrase}"
        
    main_sentence += "."
    
    # Add column indicators
    if columns:
        columns_labels = []
        for c in columns:
            if c == "placementStatus": columns_labels.append("Placement Status")
            elif c == "placedCompany": columns_labels.append("Company")
            elif c == "package": columns_labels.append("Package")
            elif c == "cgpa": columns_labels.append("CGPA")
            elif c == "backlogs": columns_labels.append("Backlogs")
            elif c == "skills": columns_labels.append("Skills")
            elif c == "driveCount": columns_labels.append("Drives Attended")
            elif c == "lastDriveDate": columns_labels.append("Last Drive Date")
            elif c == "tenthPercentage": columns_labels.append("10th %")
            elif c == "twelfthPercentage": columns_labels.append("12th %")
            elif c == "blocked": columns_labels.append("Blocked Status")
            elif c == "eligibleDrives": columns_labels.append("Eligible Drives")
            
        col_sentence = f" Displaying extra columns: {', '.join(columns_labels)}."
        main_sentence += col_sentence

    return main_sentence

def filter_students(prompt: str) -> Dict[str, Any]:
    """
    Main entry point orchestrating student filter parsing.
    """
    intent = parse_intent(prompt)
    filters = build_filters(intent)
    columns = select_columns(prompt, filters)
    reason = generate_explanation(filters, columns)
    
    return {
        "filters": filters,
        "columns": columns,
        "reason": reason
    }
