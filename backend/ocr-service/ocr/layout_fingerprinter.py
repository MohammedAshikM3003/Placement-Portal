# backend/ocr-service/ocr/layout_fingerprinter.py
import hashlib
import json
import os

def generate_layout_fingerprint(pages_lines, rows, debug_enabled=True):
    """
    Formulates structural signatures based on coordinates, bounding patterns, and columns.
    """
    if not pages_lines:
        return {
            "layout_hash": "empty_layout",
            "page_count": 0,
            "column_count": 0,
            "row_count": 0,
            "orientation": "PORTRAIT"
        }
        
    page_count = len(pages_lines)
    first_page_lines = pages_lines[0]
    
    # Calculate column boundaries by bucketizing vertical alignment coordinates
    column_bins = set()
    for line in first_page_lines:
        column_bins.add(round(line.get("x", 0.0) / 40.0) * 40)
        
    column_count = max(1, len(column_bins))
    row_count = len(rows)
    
    sig_str = f"pages:{page_count};columns:{column_count};rows:{row_count}"
    layout_hash = hashlib.md5(sig_str.encode('utf-8')).hexdigest()
    
    fingerprint = {
        "layout_hash": layout_hash,
        "page_count": page_count,
        "column_count": column_count,
        "row_count": row_count,
        "orientation": "PORTRAIT" if column_count < 18 else "LANDSCAPE",
        "signature_metrics": sig_str
    }
    
    if debug_enabled:
        debug_dir = "d:/Placement-Portal/debug"
        if os.path.exists(debug_dir):
            try:
                with open(os.path.join(debug_dir, "layout_fingerprint.json"), "w", encoding="utf-8") as f:
                    json.dump(fingerprint, f, indent=2)
            except Exception:
                pass
                
    return fingerprint
