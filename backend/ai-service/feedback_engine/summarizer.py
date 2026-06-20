import re
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer
from sumy.summarizers.lsa import LsaSummarizer

def summarize_feedback(text: str, sentence_count: int = 2) -> str:
    """
    Summarizes feedback text using LexRank/LSA. Falls back to sentence ranking if Sumy encounters issues.
    """
    if not text:
        return ""
        
    cleaned = re.sub(r"\s+", " ", text).strip()
    
    # Attempt Sumy LexRank Summarization
    try:
        parser = PlaintextParser.from_string(cleaned, Tokenizer("english"))
        summarizer = LexRankSummarizer()
        summary = summarizer(parser.document, sentence_count)
        result = " ".join([str(sentence) for sentence in summary])
        if result:
            return result
    except Exception:
        pass
        
    # Attempt Sumy LSA Summarization as second choice
    try:
        parser = PlaintextParser.from_string(cleaned, Tokenizer("english"))
        summarizer = LsaSummarizer()
        summary = summarizer(parser.document, sentence_count)
        result = " ".join([str(sentence) for sentence in summary])
        if result:
            return result
    except Exception:
        pass
        
    # Fallback: Split and return top sentences (first 2) if algorithms fail
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", cleaned) if s.strip()]
    return " ".join(sentences[:sentence_count])
