import re

POSITIVE_WORDS = {
    "good", "great", "excellent", "strong", "proficient", "clear", "confident", 
    "fluent", "well", "impressive", "outstanding", "competent", "knowledgeable"
}

NEGATIVE_WORDS = {
    "lacks", "improve", "needs", "weak", "average", "improvement", "poor", 
    "difficult", "fail", "unable", "struggles", "inadequate", "shortcomings"
}

def analyze_sentiment(text: str) -> str:
    """
    Categorizes the general sentiment of a sentence/clause.
    Returns: 'positive', 'improvement', or 'neutral'
    """
    if not text:
        return "neutral"
        
    tokens = re.findall(r"\b\w+\b", text.lower())
    
    pos_score = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg_score = sum(1 for t in tokens if t in NEGATIVE_WORDS)
    
    if pos_score > neg_score:
        return "positive"
    elif neg_score > pos_score:
        return "improvement"
        
    return "neutral"
