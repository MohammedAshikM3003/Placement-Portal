import re

# Casual phrases to professional equivalents
CASUAL_MAP = [
    # Verbs / Actions
    (r"\bworked on\b", "Developed"),
    (r"\bmade\b", "Engineered"),
    (r"\bbuilt\b", "Designed and implemented"),
    (r"\bbuilded\b", "Designed and implemented"),
    (r"\bcreated\b", "Architected"),
    (r"\bused\b", "Leveraged"),
    (r"\bhelped\b", "Collaborated on"),
    (r"\bfixed\b", "Resolved"),
    (r"\bfixing\b", "resolving"),
    (r"\bdid\b", "Executed"),
    (r"\bdone\b", "completed"),
    (r"\bknow\b", "proficient in"),
    (r"\bgot\b", "Secured"),
    
    # Adjectives / Nouns
    (r"\bgood at\b", "Proficient in"),
    (r"\bgood in\b", "Proficient in"),
    (r"\bhard working\b", "highly motivated"),
    (r"\bhardworker\b", "dedicated professional"),
    (r"\bfast learner\b", "quick-learning"),
    (r"\bhonest boy\b", "principled professional"),
    (r"\bgood team player\b", "collaborative team member"),
    (r"\blike coding\b", "passionate about software development"),
    (r"\bgaming\b", "strategic problem-solving"),
    (r"\blearn new things\b", "rapidly adapt to emerging technologies"),
    (r"\bdone code\b", "authored source code"),
    (r"\btook care of\b", "managed"),
    (r"\bgot experience\b", "acquired valuable hands-on experience"),
    (r"\bmake database\b", "design and implement database schemas"),
    (r"\bmake frontend\b", "develop responsive user interfaces"),
    
    # Fillers
    (r"\bbasically\b", ""),
    (r"\breally\b", ""),
    (r"\bvery\b", ""),
    (r"\bsuper\b", ""),
    (r"\bkinda\b", ""),
    (r"\bsort of\b", ""),
    (r"\bjust\b", ""),
    (r"\bawesome\b", "excellent"),
    (r"\bcool\b", "innovative"),
    (r"\bstuff\b", "technologies"),
    (r"\bthings\b", "workflows"),
]

# Contextual template rewrites
TEMPLATE_REWRITES = [
    {
        "pattern": r"i am (a )?(highly |very )?(motivated |dedicated )?(hard working|hardworker|fast learner|honest)(.*)",
        "replace": "Dedicated and highly motivated Software Engineering student with strong problem-solving skills and a fast-learning mindset."
    },
    {
        "pattern": r".*know (python|java|javascript|react|node|mongodb)(.*)",
        "replace": r"Hands-on proficiency in \1\2 development with a strong focus on clean coding practices."
    },
    {
        "pattern": r".*(done|built|made) (many|lot of|multiple) (projects|project).*",
        "replace": "Successfully engineered multiple academic and personal projects, demonstrating strong engineering and analytical abilities."
    }
]

def rewrite_sentence(sentence: str) -> str:
    """
    Translates a single casual sentence into a professional sentence.
    """
    cleaned = sentence.strip()
    if not cleaned:
        return ""
        
    lower_s = cleaned.lower()
    
    # 1. Check template rules first for macro rewrites
    for rule in TEMPLATE_REWRITES:
        if re.match(rule["pattern"], lower_s):
            # If match group replacement is used, we apply it, otherwise use direct replacement
            try:
                rewritten = re.sub(rule["pattern"], rule["replace"], lower_s)
                # Capitalize first letter
                return rewritten[0].upper() + rewritten[1:]
            except Exception:
                return rule["replace"]
                
    # 2. Otherwise apply inline phrase-level mappings
    rewritten = cleaned
    for pattern, replacement in CASUAL_MAP:
        # Use regex case-insensitive sub
        rewritten = re.sub(pattern, replacement, rewritten, flags=re.IGNORECASE)
        
    # Clean double spaces
    rewritten = re.sub(r"\s+", " ", rewritten).strip()
    
    # Ensure starts with capital
    if rewritten:
        rewritten = rewritten[0].upper() + rewritten[1:]
        
    return rewritten

def professionalize_text(text: str) -> str:
    """
    Splits text into sentences, rewrites each sentence professionally, and combines.
    """
    if not text:
        return ""
        
    # Simple sentence splitter
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    rewritten_sentences = []
    
    for s in sentences:
        if s.strip():
            rewritten_sentences.append(rewrite_sentence(s))
            
    # Combine sentences back
    combined = " ".join(rewritten_sentences)
    
    # Ensure ends with period
    if combined and combined[-1] not in ".!?":
        combined += "."
        
    return combined
