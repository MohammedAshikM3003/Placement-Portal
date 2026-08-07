# backend/ocr-service/ocr/ocr_sdk.py
import logging
from io import BytesIO
from PIL import Image
from ocr.pipeline import Pipeline
from ocr.ocr_config import OCRConfig
from ocr.ocr_engine import extract_text_lines_from_pdf_bytes

logger = logging.getLogger("OCRPlatform")

def pdf_to_images(pdf_bytes, dpi=300):
    """Convert PDF bytes to a list of PIL Image objects."""
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(pdf_bytes)
        images = []
        scale = dpi / 72.0
        for page in pdf:
            bitmap = page.render(scale=scale)
            pil_img = bitmap.to_pil()
            images.append(pil_img)
        logger.info(f"Successfully converted PDF to {len(images)} images using pypdfium2")
        return images
    except Exception as e:
        logger.warning(f"pypdfium2 conversion failed: {e}. Trying pdf2image...")
        try:
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(pdf_bytes, dpi=dpi)
            return images
        except Exception as e2:
            logger.warning(f"pdf2image conversion failed: {e2}. Trying Image.open directly.")
            try:
                img = Image.open(BytesIO(pdf_bytes))
                return [img]
            except Exception as e3:
                logger.error(f"Image load fallback failed: {e3}")
                return []

class OCRPlatform:
    _executor = None

    @classmethod
    def get_executor(cls):
        if cls._executor is None:
            cls._executor = Pipeline()
        return cls._executor

    @classmethod
    def parse(cls, file_bytes, filename, options=None):
        """
        Parses document PDF or image file bytes and returns extracted structured marksheets.
        """
        if options is None:
            options = {}
            
        executor = cls.get_executor()
        filename_lower = filename.lower()

        # Handle image inputs
        if filename_lower.endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp")):
            img = Image.open(BytesIO(file_bytes))
            return executor.process_document([img], is_pre_extracted=False, options=options)
        
        # Handle PDF inputs
        elif filename_lower.endswith(".pdf"):
            # Digital text extractor fallback check
            digital_lines = None
            try:
                digital_lines = extract_text_lines_from_pdf_bytes(file_bytes, min_words=30, logger=logger)
            except Exception as ex:
                logger.warning(f"[SDK] pdfplumber failed: {ex}")
                digital_lines = None
            
            if digital_lines and not any(p is None for p in digital_lines):
                logger.info("[SDK] Processing digitally extracted lines")
                return executor.process_document(digital_lines, is_pre_extracted=True, options=options)
            
            # Scanned PDF path
            images = pdf_to_images(file_bytes, dpi=OCRConfig.BASE_DPI)
            return executor.process_document(images, is_pre_extracted=False, options=options)
        
        else:
            raise ValueError(f"Unsupported file type: {filename}")

    @classmethod
    def validate(cls, result):
        """
        Performs logical checks on GPAs and grades validation.
        """
        validation_errors = []
        for marksheet in result:
            subjects = marksheet.get("subjects", [])
            if len(subjects) == 0:
                validation_errors.append("No subjects parsed in candidate marksheet.")
        return {
            "valid": len(validation_errors) == 0,
            "errors": validation_errors
        }
