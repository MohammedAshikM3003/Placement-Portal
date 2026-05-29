import re

from utils.text_utils import normalize_whitespace, split_sentences, remove_duplicate_words, truncate_sentence

FILLER_PHRASES = ["kind of", "sort of", "somewhat"]
FILLER_WORDS = ["very", "really", "actually", "basically", "just", "quite"]


def _remove_fillers(text: str) -> str:
    cleaned = text
    for phrase in FILLER_PHRASES:
        cleaned = re.sub(r"\b" + re.escape(phrase) + r"\b", "", cleaned, flags=re.IGNORECASE)
    for word in FILLER_WORDS:
        cleaned = re.sub(r"\b" + re.escape(word) + r"\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


def _remove_duplicate_phrases(text: str) -> str:
    words = text.split()
    if len(words) < 4:
        return text
    result = []
    i = 0
    while i < len(words):
        if i + 3 < len(words):
            phrase_one = " ".join(words[i:i + 2]).lower()
            phrase_two = " ".join(words[i + 2:i + 4]).lower()
            if phrase_one == phrase_two:
                result.extend(words[i:i + 2])
                i += 4
                continue
        result.append(words[i])
        i += 1
    return " ".join(result)


def _shorten_sentences(text: str) -> str:
    sentences = split_sentences(text)
    if not sentences:
        return text
    shortened = []
    for sentence in sentences:
        words = sentence.split()
        if len(words) > 32:
            shortened.append(truncate_sentence(sentence, max_words=28))
        else:
            shortened.append(sentence)
    return " ".join(shortened)


def makeConcise(text: str) -> str:
    cleaned = normalize_whitespace(text or "")
    if not cleaned:
        return ""
    cleaned = _remove_fillers(cleaned)
    cleaned = remove_duplicate_words(cleaned)
    cleaned = _remove_duplicate_phrases(cleaned)
    cleaned = _shorten_sentences(cleaned)
    return cleaned
