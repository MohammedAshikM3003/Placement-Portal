# backend/ocr-service/ocr/logger.py
import logging
import sys

# Standard python logger setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
standard_logger = logging.getLogger("ocr_pipeline")

class PipelineLogger:
    """
    Accumulates structured logs for a single OCR execution run.
    Allows returning logs directly to the user (Stage 13).
    """
    def __init__(self):
        self.logs = []

    def info(self, msg: str):
        standard_logger.info(msg)
        self.logs.append(f"[INFO] {msg}")

    def warning(self, msg: str):
        standard_logger.warning(msg)
        self.logs.append(f"[WARNING] {msg}")

    def error(self, msg: str):
        standard_logger.error(msg)
        self.logs.append(f"[ERROR] {msg}")

    def debug(self, msg: str):
        standard_logger.debug(msg)
        self.logs.append(f"[DEBUG] {msg}")

    def get_logs(self):
        return self.logs
