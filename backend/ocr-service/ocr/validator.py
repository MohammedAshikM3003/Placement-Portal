# backend/ocr-service/ocr/validator.py
from ocr.grade_detector import VALID_GRADES

def validate_subject_row(row_data):
    """
    Validates an extracted subject row.
    Returns: (is_valid: bool, errors: list, warnings: list)
    """
    errors = []
    warnings = []
    
    code = row_data.get("courseCode", "")
    name = row_data.get("courseName", "")
    credits_str = row_data.get("credits", "")
    grade = row_data.get("grade", "")
    semester = row_data.get("semester", None)
    
    # 1. Course Code Validation
    if not code:
        errors.append("Course code is missing")
        
    # 2. Subject Name Validation
    if not name:
        warnings.append("Subject name is missing")
    elif len(name) < 3:
        warnings.append(f"Subject name is unusually short: '{name}'")
        
    # 3. Credits Validation
    if credits_str:
        try:
            credits_val = float(credits_str)
            if not (0.0 <= credits_val <= 10.0):
                errors.append(f"Credits out of bounds: {credits_str}")
        except ValueError:
            errors.append(f"Credits is not a valid number: '{credits_str}'")
    else:
        warnings.append("Credits value is missing")
        
    # 4. Grade Validation
    if grade:
        if grade not in VALID_GRADES:
            warnings.append(f"Invalid or unrecognized grade: '{grade}'")
    else:
        warnings.append("Grade value is missing")
        
    # 5. Semester Validation
    if semester is not None:
        try:
            sem_val = int(semester)
            if not (1 <= sem_val <= 8):
                warnings.append(f"Semester value out of typical range (1-8): {semester}")
        except ValueError:
            warnings.append(f"Semester value is not numeric: '{semester}'")
    else:
        warnings.append("Semester is missing")
        
    is_valid = len(errors) == 0
    return is_valid, errors, warnings

def validate_subject_sequence(subjects, logger=None):
    """
    Validates sequence integrity of the extracted subjects list.
    Produces warnings for gaps, repeated codes, or out-of-order serials.
    """
    warnings = []
    if not subjects:
        return warnings
        
    seen_codes = {}
    last_sno = 0
    
    for idx, sub in enumerate(subjects):
        sno = sub.get("sno", idx + 1)
        code = sub.get("courseCode", "")
        
        # 1. Check serial number sequence
        if last_sno > 0 and sno != last_sno + 1:
            msg = f"Non-sequential serial number detected: got {sno}, expected {last_sno + 1}"
            warnings.append(msg)
            if logger:
                logger.warning(msg)
        last_sno = sno
        
        # 2. Check duplicate course codes
        if code:
            if code in seen_codes:
                msg = f"Repeated course code detected: '{code}' (first seen at SNo {seen_codes[code]})"
                warnings.append(msg)
                if logger:
                    logger.warning(msg)
            else:
                seen_codes[code] = sno
                
    return warnings

def run_production_validation_suite(results, pages_lines, logger=None):
    """
    Executes a comprehensive production check list:
    - Student count
    - Subject count
    - Grade count
    - Credit completeness
    - Semester consistency
    - Duplicate course codes
    - Duplicate subject names
    - Serial number continuity
    Returns: dict representing the validation report
    """
    report = {
        "status": "PASS",
        "checks": [],
        "errors": [],
        "warnings": []
    }
    
    # 1. Student Count Check
    student_count = len(results)
    if student_count == 0:
        report["status"] = "FAIL"
        report["errors"].append("No students extracted from document")
        report["checks"].append({"name": "Students Count", "status": "FAIL", "message": "Extracted: 0"})
    else:
        report["checks"].append({"name": "Students Count", "status": "PASS", "message": f"Extracted: {student_count}"})
        
    # 2. Subjects and Grades check
    total_subjects = 0
    missing_credits = 0
    missing_grades = 0
    invalid_grades = 0
    invalid_semesters = 0
    duplicate_codes = 0
    duplicate_names = 0
    non_sequential_serials = 0
    
    seen_codes = set()
    seen_names = set()
    
    for r_idx, r in enumerate(results):
        if not r.get("success"):
            continue
        subjects = r.get("subjects", [])
        total_subjects += len(subjects)
        
        last_sno = 0
        for s in subjects:
            sno = s.get("sno", 0)
            code = s.get("courseCode", "")
            name = s.get("courseName", "")
            grade = s.get("grade", "")
            credits = s.get("credits", "")
            sem = s.get("semester")
            
            # Check grade
            if not grade:
                missing_grades += 1
            elif grade not in VALID_GRADES:
                invalid_grades += 1
                
            # Check credits
            if credits is None or credits == "":
                missing_credits += 1
                
            # Check semester
            if sem is not None:
                try:
                    sem_val = int(sem)
                    if not (1 <= sem_val <= 8):
                        invalid_semesters += 1
                except ValueError:
                    invalid_semesters += 1
            else:
                invalid_semesters += 1
                
            # Check duplicates
            if code:
                if code in seen_codes:
                    duplicate_codes += 1
                seen_codes.add(code)
            if name:
                name_upper = name.upper()
                if name_upper in seen_names:
                    duplicate_names += 1
                seen_names.add(name_upper)
                
            # Check serial sequence
            if last_sno > 0 and sno != last_sno + 1:
                non_sequential_serials += 1
            last_sno = sno
            
    # Add checking results to report
    def add_check(name, count, fail_message, pass_message):
        if count > 0:
            report["status"] = "WARNING" if "warning" in fail_message.lower() else "FAIL"
            if "warning" in fail_message.lower():
                report["warnings"].append(fail_message.format(count))
            else:
                report["errors"].append(fail_message.format(count))
            report["checks"].append({"name": name, "status": "FAIL", "message": fail_message.format(count)})
        else:
            report["checks"].append({"name": name, "status": "PASS", "message": pass_message})

    add_check("Credit Completeness", missing_credits, "Missing credits on {} subject(s)", "All credits populated")
    add_check("Grade Completeness", missing_grades, "Missing grade on {} subject(s)", "All grades populated")
    add_check("Grade Validity", invalid_grades, "Invalid/unrecognized grade on {} subject(s)", "All grades valid")
    add_check("Semester Validity", invalid_semesters, "Invalid or missing semester on {} subject(s)", "All semesters valid")
    add_check("Duplicate Course Codes", duplicate_codes, "Duplicate course codes on {} subject(s)", "No duplicate course codes")
    add_check("Duplicate Subject Names", duplicate_names, "Duplicate subject names on {} subject(s)", "No duplicate subject names")
    add_check("Subject Serial Continuity", non_sequential_serials, "Non-sequential subject serials on {} subject(s)", "Subject serials continuous")
    
    # Finalize status
    if report["errors"]:
        report["status"] = "FAIL"
        
    return report
