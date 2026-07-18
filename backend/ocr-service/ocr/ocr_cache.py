# backend/ocr-service/ocr/ocr_cache.py
import os
import json
import hashlib

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "debug", "ocr_cache")

def compute_sha256(file_bytes):
    """
    Computes SHA256 hash for a given binary file content.
    """
    return hashlib.sha256(file_bytes).hexdigest()

def get_cached_result(sha256_hash):
    """
    Retrieves cached OCR result if SHA256 matches.
    """
    if not os.path.exists(CACHE_DIR):
        return None
    cache_path = os.path.join(CACHE_DIR, f"{sha256_hash}.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def set_cached_result(sha256_hash, result):
    """
    Saves extracted OCR result to file-based cache.
    """
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        cache_path = os.path.join(CACHE_DIR, f"{sha256_hash}.json")
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
    except Exception:
        pass
