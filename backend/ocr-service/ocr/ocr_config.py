# backend/ocr-service/ocr/ocr_config.py
import os

class OCRConfig:
    # OCR Engine Configurations
    BASE_DPI = 200
    MIN_CONFIDENCE = 0.60
    
    # Platform settings
    REVIEW_THRESHOLD = 0.85
    MAX_PAGES_LIMIT = 15
    MAX_FILE_SIZE_MB = 10
    
    # Intelligent Caching Settings
    CACHE_ENABLED = True
    
    # Path configuration
    DEBUG_DIR = "d:/Placement-Portal/debug"
    CACHE_DIR = "d:/Placement-Portal/debug/ocr_cache"
    
    # Rule engine matching weights
    EXACT_CODE_MATCH_WEIGHT = 1.0
    EXACT_NAME_MATCH_WEIGHT = 0.90
    NORMALIZED_NAME_MATCH_WEIGHT = 0.80
    FUZZY_CODE_MATCH_WEIGHT = 0.65
    
    @classmethod
    def get_debug_path(cls, filename):
        if not os.path.exists(cls.DEBUG_DIR):
            os.makedirs(cls.DEBUG_DIR, exist_ok=True)
        return os.path.join(cls.DEBUG_DIR, filename)

    @classmethod
    def get_cache_path(cls, file_hash):
        if not os.path.exists(cls.CACHE_DIR):
            os.makedirs(cls.CACHE_DIR, exist_ok=True)
        return os.path.join(cls.CACHE_DIR, f"{file_hash}.json")
