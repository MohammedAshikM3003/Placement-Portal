import re

try:
    from nltk.corpus import stopwords
    _STOPWORDS = set(stopwords.words("english"))
except Exception:
    _STOPWORDS = set([
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
        "he", "him", "his", "she", "her", "hers", "it", "its", "they", "them", "their", 
        "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
        "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
        "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
        "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
        "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
        "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
        "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
        "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", 
        "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
    ])

# Custom feedback filler words to exclude
FEEDBACK_STOPWORDS = _STOPWORDS.union({
    "candidate", "student", "interview", "performance", "well", "process", "round", 
    "aspects", "area", "areas", "things", "student's", "candidate's", "performed"
})

def extract_keywords(text: str, top_n: int = 5) -> list:
    """
    Extracts key technical or soft skill phrases from the feedback text.
    """
    if not text:
        return []
        
    # Find word tokens of length >= 3
    words = re.findall(r"\b[a-zA-Z-]{3,}\b", text.lower())
    
    # Simple word frequencies
    freq = {}
    for w in words:
        if w not in FEEDBACK_STOPWORDS:
            freq[w] = freq.get(w, 0) + 1
            
    # Sort by frequency
    sorted_keywords = sorted(freq, key=freq.get, reverse=True)
    return sorted_keywords[:top_n]
