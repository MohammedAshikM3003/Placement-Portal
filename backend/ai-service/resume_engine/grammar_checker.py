import language_tool_python

try:
    _TOOL = language_tool_python.LanguageTool("en-US")
except Exception:
    _TOOL = None

import re

PRONOUN_TENSE_RULES = [
    # Remove first-person pronouns at the beginning of sentences/clauses and correct verbs
    (r"\b(?:i|we|he|she|they)\s+(?:am|was|were|have|had|has)\s+(done|built|made|worked|created|developed|engineered|designed|implemented|resolved|fixed)\b", r"\1"),
    (r"\b(?:i|we|he|she|they)\s+(done|built|made|worked|created|developed|engineered|designed|implemented|resolved|fixed)\b", r"\1"),
    (r"\b(?:i|we|he|she|they)\s+(?:know|knows)\b", "proficient in"),
    (r"\b(?:i|we|he|she|they)\s+(?:am|is|are)\s+proficient\s+in\b", "proficient in"),
    (r"\b(?:i|we|he|she|they)\s+(?:am|is|are)\s+having\s+knowledge\s+of\b", "possess strong knowledge of"),
    (r"\b(?:i|we|he|she|they)\s+(?:want|wants|seek|seeks)\s+to\b", "seeking to"),
]

def correct_grammar(text: str) -> str:
    """
    Corrects grammar, punctuation, and capitalization in the input text,
    incorporating general pronoun-to-tense mappings.
    """
    if not text:
        return ""
        
    processed = text
    # Apply pronoun/tense mappings
    for pattern, replacement in PRONOUN_TENSE_RULES:
        processed = re.sub(pattern, replacement, processed, flags=re.IGNORECASE)
        
    if _TOOL:
        try:
            processed = _TOOL.correct(processed)
        except Exception:
            pass
            
    # Post-process to capitalize sentences and strip remaining leading pronouns
    sentences = re.split(r"(?<=[.!?])\s+", processed.strip())
    capitalized = []
    for s in sentences:
        s_strip = s.strip()
        if s_strip:
            # Strip personal pronouns at the very beginning of a sentence
            s_clean = re.sub(r"^(?:i|we|he|she|they)\s+", "", s_strip, flags=re.IGNORECASE)
            # Replace done with Completed/Developed at start
            if s_clean.lower().startswith("done "):
                s_clean = "completed " + s_clean[5:]
            if s_clean:
                s_clean = s_clean[0].upper() + s_clean[1:]
                capitalized.append(s_clean)
    processed = " ".join(capitalized)
    
    return processed

def check_grammar_details(text: str) -> list:
    """
    Analyzes the text for spelling and grammar errors, passive voice, etc.
    Returns a list of dicts detailing the errors.
    """
    if not text or not _TOOL:
        return []
        
    try:
        matches = _TOOL.check(text)
        results = []
        for match in matches:
            # Categorize the rule match
            category = "grammar"
            rule_id = match.ruleId.lower()
            
            if "spell" in rule_id or "typo" in rule_id:
                category = "spelling"
            elif "passive" in rule_id:
                category = "passive_voice"
            elif "repeat" in rule_id or "duplication" in rule_id:
                category = "repetition"
                
            results.append({
                "ruleId": match.ruleId,
                "category": category,
                "message": match.message,
                "replacements": match.replacements[:3] if match.replacements else [],
                "context": match.context,
                "offset": match.offset,
                "length": match.errorLength
            })
        return results
    except Exception:
        return []
