# backend/ocr-service/ocr/confidence.py

def calculate_row_confidence(row_data, token_confs, errors, warnings):
    """
    Computes a percentage-based confidence score (0 to 100) for a parsed subject row.
    """
    if token_confs:
        base_score = sum(token_confs) / len(token_confs) * 100.0
    else:
        base_score = 85.0
        
    base_score -= len(errors) * 35.0
    base_score -= len(warnings) * 8.0
    
    code_pattern_score = row_data.get("code_pattern_score", 0.0)
    if code_pattern_score >= 0.9:
        base_score += 5.0
        
    final_score = max(0, min(100, int(round(base_score))))
    return final_score

def build_confidence_entity(value, confidence, source="OCR", validation="VALID", corrections=None, reasoning=None):
    """
    Constructs a Phase A explainable document intelligence entity block.
    """
    return {
        "value": value,
        "confidence": round(float(confidence), 2),
        "source": source,
        "validation": validation,
        "corrections": corrections or [],
        "reasoning": reasoning or []
    }
