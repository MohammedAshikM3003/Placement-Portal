# backend/ocr-service/ocr/handwriting_detector.py

def detect_handwriting_and_stamps(line_text, line_conf):
    """
    Analyses OCR lines to flag signatures, stamps, seals, or low-confidence handwriting blocks.
    Returns (is_handwritten: bool, confidence_score: float).
    """
    upper_text = line_text.upper()
    indicators = ["SD/-", "SIGNATURE", "SEAL", "OFFICE USE", "CONTROLLER OF EXAMINATIONS", "APPROVED BY"]
    
    is_flagged = False
    confidence = 1.0
    
    for marker in indicators:
        if marker in upper_text:
            is_flagged = True
            confidence = 0.50 # Assign low score to ensure Human Review
            break
            
    # Low confidence OCR indicates probable handwriting or blur
    if line_conf < 0.65:
        is_flagged = True
        confidence = float(line_conf)
        
    return is_flagged, confidence
