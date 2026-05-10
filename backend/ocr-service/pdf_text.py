from io import BytesIO
import pdfplumber


def extract_pdf_words(pdf_bytes, min_words=30):
    pages = []
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            words = page.extract_words(x_tolerance=1, y_tolerance=1, keep_blank_chars=False)
            if len(words) < min_words:
                pages.append(None)
                continue
            lines = []
            for w in words:
                text = (w.get("text") or "").strip()
                if not text:
                    continue
                x1 = float(w.get("x0", 0.0))
                x2 = float(w.get("x1", 0.0))
                y1 = float(w.get("top", 0.0))
                y2 = float(w.get("bottom", 0.0))
                w_box = max(1.0, x2 - x1)
                h_box = max(1.0, y2 - y1)
                y_center = y1 + h_box / 2.0
                lines.append({
                    "text": text,
                    "conf": 1.0,
                    "x": x1,
                    "y": y1,
                    "w": w_box,
                    "h": h_box,
                    "y_center": y_center,
                    "bbox": [x1, y1, x2, y2]
                })
            lines.sort(key=lambda l: (l["y"], l["x"]))
            pages.append(lines)
    return pages
