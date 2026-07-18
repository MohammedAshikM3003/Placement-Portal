# backend/ocr-service/ocr/credit_detector.py
import re

# Match integers or decimals between 0 and 10 (e.g. 3, 4, 1.5, 0.0)
CREDIT_PATTERN = re.compile(r"\b([0-9](?:\.[0-9])?)\b")

def detect_credits_in_tokens(tokens, logger=None):
    """
    Searches a list of row tokens from right to left to locate a credit value (0 to 10).
    Returns (credits: str, updated_tokens: list)
    """
    for idx in range(len(tokens) - 1, -1, -1):
        token = tokens[idx].strip()
        match = CREDIT_PATTERN.fullmatch(token)
        if match:
            val = float(match.group(1))
            if 0.0 <= val <= 10.0:
                if logger:
                    logger.info(f"Credits detected: '{token}'")
                updated_tokens = tokens[:idx] + tokens[idx+1:]
                # Keep decimal or convert to integer if it is .0
                if val.is_integer():
                    return str(int(val)), updated_tokens
                return str(val), updated_tokens
                
    return "", tokens
