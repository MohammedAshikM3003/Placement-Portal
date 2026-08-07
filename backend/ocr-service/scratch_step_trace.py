# scratch_step_trace.py
print("Step 1: Importing packages...")
import numpy as np
from PIL import Image
print("Step 2: Importing PaddleOCR...")
from paddleocr import PaddleOCR
print("Step 3: Instantiating PaddleOCR...")
ocr = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)
print("Step 4: Creating dummy image...")
img = np.zeros((100, 100, 3), dtype=np.uint8)
print("Step 5: Executing first OCR...")
res = ocr.ocr(img)
print("Step 6: First OCR complete:", res)
print("Step 7: Finished successfully!")
