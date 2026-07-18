# backend/ocr-service/ocr/university_profiles.py
import re

UNIVERSITY_PROFILES = [
    {
        "id": "ksr",
        "name": "K.S. Rangasamy College of Technology",
        "keywords": ["RANGASAMY", "KSR", "K.S.R."],
        "course_code_regex": r"^[0-9]{2}[A-Z]{2}[0-9]{3}$",
        "grade_style": "KSRCE_STANDARD",
        "semester_format": "SEMESTER X",
        "header_trigger": "Name of the Candidate",
        "confidence_threshold": 85.0
    },
    {
        "id": "anna_univ",
        "name": "Anna University",
        "keywords": ["ANNA UNIVERSITY", "CHENNAI"],
        "course_code_regex": r"^[A-Z]{2}[0-9]{4}$",
        "grade_style": "ANNA_STANDARD",
        "semester_format": "SEMESTER X",
        "header_trigger": "Register Number",
        "confidence_threshold": 80.0
    },
    {
        "id": "generic",
        "name": "Generic Academic Institution",
        "keywords": [],
        "course_code_regex": r"^[A-Z0-9]{4,10}$",
        "grade_style": "GENERIC_STANDARD",
        "semester_format": "SEM X",
        "header_trigger": "Name",
        "confidence_threshold": 75.0
    }
]

def match_university_profile(full_text):
    """
    Dynamically infers the best university profile based on text keyword matches.
    """
    upper_text = full_text.upper()
    best_match = UNIVERSITY_PROFILES[-1] # Default to generic
    max_matches = 0
    
    for profile in UNIVERSITY_PROFILES[:-1]:
        matches = sum(1 for keyword in profile["keywords"] if keyword in upper_text)
        if matches > max_matches:
            max_matches = matches
            best_match = profile
            
    return best_match
