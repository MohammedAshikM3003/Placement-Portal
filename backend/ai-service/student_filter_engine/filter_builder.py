from typing import Dict, Any

def build_filters(intent: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes and constructs the final structured filters dictionary to be passed
    to the Node.js Express backend and MongoDB.
    """
    filters = {}

    # Copy standard fields directly if present
    direct_fields = [
        "regNo", "name", "department", "branch", "batch", "section",
        "currentYear", "currentSemester", "gender", "city", "skills",
        "isBlocked", "isPlaced", "placedCompany", "companyName", "jobRole",
        "sortBy", "sortOrder", "firstGraduate", "willingToSignBond",
        "residentialStatus", "quota", "preferredModeOfDrive"
    ]

    for field in direct_fields:
        if field in intent and intent[field] is not None:
            filters[field] = intent[field]

    # Numeric range mappings
    range_fields = [
        ("cgpaMin", float),
        ("cgpaMax", float),
        ("tenthMin", float),
        ("twelfthMin", float),
        ("packageMin", float),
        ("driveCountMin", int),
        ("driveCountMax", int),
        ("backlogCountMin", int),
        ("backlogCountMax", int)
    ]

    for key, field_type in range_fields:
        if key in intent and intent[key] is not None:
            try:
                filters[key] = field_type(intent[key])
            except (ValueError, TypeError):
                pass

    # Boolean flags
    if "hasBacklogs" in intent and intent["hasBacklogs"] is not None:
        filters["hasBacklogs"] = bool(intent["hasBacklogs"])
    if "hasProfilePic" in intent and intent["hasProfilePic"] is not None:
        filters["hasProfilePic"] = bool(intent["hasProfilePic"])

    # Normalization helper rules
    # If placedCompany is set, ensure isPlaced is True
    if "placedCompany" in filters and filters["placedCompany"]:
        filters["isPlaced"] = True
        
    # If packageMin is set, ensure isPlaced is True
    if "packageMin" in filters and filters["packageMin"] is not None:
        filters["isPlaced"] = True

    # If backlogCountMin is set to > 0, make sure hasBacklogs is True
    if filters.get("backlogCountMin", 0) > 0:
        filters["hasBacklogs"] = True

    # Normalize sort fields
    if "sortBy" in filters:
        valid_sorts = ["regNo", "name", "department", "branch", "batch", "currentYear", "currentSemester", "driveCount", "lastDriveDate", "cgpa", "package"]
        if filters["sortBy"] not in valid_sorts:
            filters["sortBy"] = "regNo"
    if "sortOrder" in filters:
        if str(filters["sortOrder"]).lower() not in ["asc", "desc"]:
            filters["sortOrder"] = "asc"

    return filters
