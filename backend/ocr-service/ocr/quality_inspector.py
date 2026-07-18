# backend/ocr-service/ocr/quality_inspector.py
import os
import json
from ocr.grade_detector import VALID_GRADES

def run_quality_inspector(results, debug_enabled=True):
    """
    Asserts document-level sanity checks post-extraction.
    Saves validation flags into quality_report.json.
    """
    quality_report = {
        "status": "APPROVED",
        "anomalies_detected": 0,
        "checks": [],
        "rules_triggered": []
    }

    anomalies = []
    
    # Rule 1: Student Count Sanity
    if len(results) == 0:
        anomalies.append({
            "code": "EMPTY_DOCUMENT",
            "severity": "CRITICAL",
            "message": "Zero candidates parsed from document package."
        })
        
    for r_idx, r in enumerate(results):
        if not r.get("success"):
            continue
        
        student_info = r.get("student_info", {})
        subjects = r.get("subjects", [])
        
        # Rule 2: Impossible Semester
        sem = student_info.get("semester")
        if sem is not None:
            try:
                sem_val = int(sem)
                if not (1 <= sem_val <= 8):
                    anomalies.append({
                        "code": "IMPOSSIBLE_SEMESTER",
                        "severity": "CRITICAL",
                        "message": f"Semester value {sem_val} is outside standard bounds (1-8)."
                    })
            except ValueError:
                anomalies.append({
                    "code": "INVALID_SEMESTER_TYPE",
                    "severity": "CRITICAL",
                    "message": f"Semester value '{sem}' is non-numeric."
                })
        
        # Rule 3: Anomalous subject properties
        seen_codes = set()
        for s in subjects:
            code = s.get("courseCode", "")
            grade = s.get("grade", "")
            credits = s.get("credits", 0)
            
            # Check for invalid codes
            if len(code) < 4 or len(code) > 12:
                anomalies.append({
                    "code": "ANOMALOUS_COURSE_CODE",
                    "severity": "WARNING",
                    "message": f"Course code '{code}' has suspicious format length."
                })
                
            # Check for duplicate course attempts
            if code:
                if code in seen_codes:
                    anomalies.append({
                        "code": "DUPLICATE_COURSE_CODE",
                        "severity": "WARNING",
                        "message": f"Duplicate subject code attempt detected: {code}"
                    })
                seen_codes.add(code)
                
            # Check for invalid grades
            if grade and grade not in VALID_GRADES:
                anomalies.append({
                    "code": "IMPOSSIBLE_GRADE",
                    "severity": "CRITICAL",
                    "message": f"Unrecognized academic grade extracted: '{grade}'"
                })
                
            # Check for impossible credits
            if credits and float(credits) > 10.0:
                anomalies.append({
                    "code": "IMPOSSIBLE_CREDITS",
                    "severity": "CRITICAL",
                    "message": f"Credits value {credits} is exceptionally high (> 10)."
                })

    # Record overall validation status
    quality_report["anomalies_detected"] = len(anomalies)
    quality_report["rules_triggered"] = anomalies
    
    critical_errors = [a for a in anomalies if a["severity"] == "CRITICAL"]
    if critical_errors:
        quality_report["status"] = "REJECTED"
    elif anomalies:
        quality_report["status"] = "WARNING"
        
    if debug_enabled:
        debug_dir = "d:/Placement-Portal/debug"
        if not os.path.exists(debug_dir):
            os.makedirs(debug_dir)
        try:
            with open(os.path.join(debug_dir, "quality_report.json"), "w", encoding="utf-8") as f:
                json.dump(quality_report, f, indent=2)
        except Exception:
            pass
            
    return quality_report
