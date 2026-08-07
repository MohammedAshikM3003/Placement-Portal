# backend/ocr-service/ocr/document_classifier.py
import re

def classify_document(full_text):
    """
    Classifies document categories based on keywords.
    """
    upper_text = full_text.upper()
    
    if "CONSOLIDATED" in upper_text:
        return "Consolidated Marksheet"
    elif "TRANSCRIPT" in upper_text:
        return "Transcript"
    elif "HALL TICKET" in upper_text or "ADMIT CARD" in upper_text:
        return "Hall Ticket"
    elif "INTERNAL ASSESSMENT" in upper_text or "CONTINUOUS ASSESSMENT" in upper_text:
        return "Internal Assessment"
    elif "CERTIFICATE" in upper_text or "PROVISIONAL" in upper_text:
        return "Certificate"
    elif "GRADE SHEET" in upper_text or "GRADE CARD" in upper_text:
        return "Grade Sheet"
    elif "MARKSHEET" in upper_text or "STATEMENT OF GRADES" in upper_text or "STATEMENT OF MARKS" in upper_text:
        return "Marksheet"
    return "Unknown"

def detect_languages(full_text):
    """
    Detects languages (English, Tamil, Hindi, Mixed) by scanning unicode character blocks.
    """
    has_tamil = False
    has_hindi = False
    has_english = False
    
    for char in full_text:
        code = ord(char)
        if 0x0B80 <= code <= 0x0BFF:
            has_tamil = True
        elif 0x0900 <= code <= 0x097F:
            has_hindi = True
        elif (0x0041 <= code <= 0x005A) or (0x0061 <= code <= 0x007A):
            has_english = True
            
    languages = []
    if has_english:
        languages.append("English")
    if has_tamil:
        languages.append("Tamil")
    if has_hindi:
        languages.append("Hindi")
        
    if len(languages) > 1:
        return "Mixed language"
    elif len(languages) == 1:
        return languages[0]
    return "English"
