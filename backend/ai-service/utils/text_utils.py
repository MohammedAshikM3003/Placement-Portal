import re
from typing import List


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def split_sentences(text: str) -> List[str]:
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def sentence_case(text: str) -> str:
    cleaned = normalize_whitespace(text)
    if not cleaned:
        return ""
    return cleaned[0].upper() + cleaned[1:]


def title_case(text: str) -> str:
    cleaned = normalize_whitespace(text)
    if not cleaned:
        return ""
    return " ".join([w[:1].upper() + w[1:] if w else "" for w in cleaned.split(" ")])


def remove_duplicate_words(text: str) -> str:
    words = text.split()
    result = []
    prev = ""
    for word in words:
        if prev and word.lower() == prev.lower():
            continue
        result.append(word)
        prev = word
    return " ".join(result)


def truncate_sentence(sentence: str, max_words: int = 30) -> str:
    words = sentence.split()
    if len(words) <= max_words:
        return sentence
    trimmed = words[:max_words]
    clipped = " ".join(trimmed)
    cut = max(clipped.rfind(","), clipped.rfind(";"))
    if cut > 0 and cut > len(clipped) * 0.6:
        clipped = clipped[:cut]
    return clipped.rstrip(",;") + "."
