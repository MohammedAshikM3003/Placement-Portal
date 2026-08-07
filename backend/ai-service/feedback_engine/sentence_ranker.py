import re
from feedback_engine.keyword_extractor import extract_keywords

# High-importance feedback verbs and indicator words
VALUED_TERMS = {
    "lacks": 2.5,
    "improve": 2.5,
    "excellent": 2.0,
    "strong": 2.0,
    "needs": 2.0,
    "average": 1.5,
    "good": 1.0,
    "poor": 2.0,
    "should": 1.5,
    "must": 1.5
}

def rank_sentences(text: str) -> list:
    """
    Splits the feedback text into sentences and ranks them by density of key concepts and actionable feedback.
    """
    if not text:
        return []
        
    # Standard sentence splitting
    raw_sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    sentences = [s.strip() for s in raw_sentences if s.strip()]
    if not sentences:
        return []
        
    keywords = extract_keywords(text, top_n=10)
    
    ranked = []
    for idx, s in enumerate(sentences):
        score = 0
        s_lower = s.lower()
        
        # 1. Match against extracted keywords
        for kw in keywords:
            if kw in s_lower:
                score += 1.5
                
        # 2. Match against valued feedback indicators
        for term, term_weight in VALUED_TERMS.items():
            if term in s_lower:
                score += term_weight
                
        # 3. Penalize overly long/rambling sentences (aiming for conciseness)
        word_count = len(s.split())
        if word_count > 25:
            score -= 1.0
            
        ranked.append((s, score, idx))
        
    # Sort by score descending, retaining original order as fallback
    ranked.sort(key=lambda x: (-x[1], x[2]))
    return [item[0] for item in ranked]
