import os
import re

try:
    from symspellpy import SymSpell
    import pkg_resources
    
    _SYM_SPELL = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
    # Find and load the default frequency dictionary bundled with symspellpy
    try:
        dict_path = pkg_resources.resource_filename(
            "symspellpy", "frequency_dictionary_en_82_765.txt"
        )
        _SYM_SPELL.load_dictionary(dict_path, term_index=0, count_index=1)
    except Exception:
        try:
            dict_path = pkg_resources.resource_filename(
                "symspellpy", "frequency_dictionary_en_80_000.txt"
            )
            _SYM_SPELL.load_dictionary(dict_path, term_index=0, count_index=1)
        except Exception:
            _SYM_SPELL = None
except Exception:
    _SYM_SPELL = None

# Custom corrections for technical terms often misspelled by students
TECH_CORRECTIONS = {
    "persn": "person",
    "teh": "the",
    "technolgy": "technology",
    "technolgies": "technologies",
    "hackthon": "hackathon",
    "compition": "competition",
    "participted": "participated",
    "e-comerce": "e-commerce",
    "startupp": "startup",
    "webiste": "website",
    "developerr": "developer",
    "enginer": "engineer",
    "databasee": "database",
    "placent": "placement",
    "builded": "developed",
    "making": "creating",
    "fixing": "resolving",
    "appliation": "application",
    "developement": "development",
    "programing": "programming",
    "framwork": "framework",
    "datbase": "database",
    "libary": "library",
    "systemm": "system",
    "enviorment": "environment",
    "collabarate": "collaborate",
    "managment": "management",
    "responsibilty": "responsibility",
    "achivement": "achievement",
    "certifcate": "certificate",
    "colleage": "college",
    "collge": "college",
    "universiy": "university",
    "experiance": "experience",
    "expreience": "experience",
    "studing": "studying",
    "engneering": "engineering",
    "softwer": "software",
    "hardwork": "hard work",
    "communiction": "communication",
}

def correct_spelling(text: str) -> str:
    """
    Corrects spelling errors in the input text using SymSpell word lookup
    augmented by a dictionary of common technical term corrections and a tech whitelist
    to protect technical keywords, proper nouns, and acronyms from being altered.
    """
    if not text:
        return ""
    
    # 1. Build a comprehensive tech whitelist to protect from SymSpell changes
    try:
        from ats import SKILL_MAP
        tech_whitelist = set(SKILL_MAP.keys())
    except Exception:
        tech_whitelist = set()
        
    additional_whitelist = {
        "abc", "acc", "hackathon", "hackathons", "api", "apis", "frontend", "backend",
        "fullstack", "developer", "engineer", "placement", "portal", "app", "apps",
        "github", "linkedin", "google", "microsoft", "amazon", "facebook", "react",
        "node", "mongodb", "express", "sql", "mysql", "postgresql", "java", "python",
        "html", "css", "git", "docker", "kubernetes", "aws", "gcp", "azure"
    }
    tech_whitelist.update(additional_whitelist)
    
    # Preserve layout by tokenizing into word characters vs everything else (punctuation/spaces)
    tokens = re.findall(r"\w+|[^\w\s]|\s+", text)
    
    corrected_tokens = []
    for token in tokens:
        # If the token is not a word (e.g. whitespace, punctuation), keep it as is
        if not re.match(r"^\w+$", token):
            corrected_tokens.append(token)
            continue
            
        token_lower = token.lower()
        
        # A. Quick dictionary check for known misspelled words
        if token_lower in TECH_CORRECTIONS:
            replacement = TECH_CORRECTIONS[token_lower]
            if token.istitle():
                replacement = replacement.capitalize()
            elif token.isupper():
                replacement = replacement.upper()
            corrected_tokens.append(replacement)
            continue
            
        # B. Whitelist protection for tech words and acronyms
        if token_lower in tech_whitelist:
            corrected_tokens.append(token)
            continue
            
        # C. Numeric checks
        if token.isdigit():
            corrected_tokens.append(token)
            continue
            
        # D. Acronyms (e.g. all caps words like ABC)
        if token.isupper() and len(token) > 1:
            corrected_tokens.append(token)
            continue
            
        # E. SymSpell word lookup (non-compound for safety)
        if _SYM_SPELL:
            try:
                # verbosity=0 (TOP suggestion)
                suggestions = _SYM_SPELL.lookup(token, verbosity=0, max_edit_distance=2)
                if suggestions:
                    suggestion = suggestions[0].term
                    if token.istitle():
                        suggestion = suggestion.capitalize()
                    elif token.isupper():
                        suggestion = suggestion.upper()
                    corrected_tokens.append(suggestion)
                    continue
            except Exception:
                pass
                
        corrected_tokens.append(token)
        
    return "".join(corrected_tokens)
