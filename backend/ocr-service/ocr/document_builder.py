# backend/ocr-service/ocr/document_builder.py
import re
from typing import List, Dict

HEADER_KEYWORDS = [
    "register", "candidate", "name", "programme", "branch",
    "ug & pg end semester", "autonomous", "college", "marksheet",
    "s.no", "semester", "course code", "grade obtained", "result",
    "k.s.r", "engineering", "tiruchengode", "grade", "course", "obtained", "code"
]

FOOTER_KEYWORDS = [
    "revaluation", "fees", "photocopy", "controller",
    "publishing the result", "web site", "date", "utmost care",
    "in case of any error"
]

def is_header_line(text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    return any(kw in lower for kw in HEADER_KEYWORDS)

def is_footer_line(text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    return any(kw in lower for kw in FOOTER_KEYWORDS)

def estimate_page_height(page_lines: List[Dict]) -> float:
    """Estimates page height based on the maximum y coordinate found."""
    if not page_lines:
        return 1200.0
    max_y = 0.0
    for line in page_lines:
        y = float(line.get("y", 0.0))
        h = float(line.get("h", 0.0))
        max_y = max(max_y, y + h)
    return max(max_y + 100.0, 800.0)

def merge_document_pages(pages_lines: List[List[Dict]], logger=None) -> List[Dict]:
    """
    Merges OCR lines from multiple pages into a single continuous document line list.
    - Shifts y-coordinates of page N by cumulative height of preceding pages.
    - Strips duplicate headers on pages > 0.
    - Strips footers on all pages.
    """
    if not pages_lines:
        return []
        
    merged_lines = []
    cumulative_height = 0.0
    
    for idx, page_lines in enumerate(pages_lines):
        if not page_lines:
            continue
            
        page_height = estimate_page_height(page_lines)
        if logger:
            logger.info(f"Processing Page {idx + 1} for document merge. Est Height: {page_height:.2f}")
            
        # Determine regions
        header_limit = page_height * 0.28
        footer_limit = page_height * 0.85
        
        stripped_headers_count = 0
        stripped_footers_count = 0
        
        for line in page_lines:
            text = line.get("text", "")
            y = float(line.get("y", 0.0))
            
            # 1. Strip duplicate headers on pages > 0
            if idx > 0 and y < header_limit and is_header_line(text):
                stripped_headers_count += 1
                continue
                
            # 2. Strip footers on all pages
            if y > footer_limit and is_footer_line(text):
                stripped_footers_count += 1
                continue
                
            # Copy line to avoid mutating the original
            new_line = dict(line)
            new_line["tr_id"] = f"p{idx}_{line.get('tr_id', 'l0')}"
            new_line["y_raw"] = y
            new_line["page_idx"] = idx
            new_line["page_height"] = page_height
            
            # Shift y coordinate
            new_line["y"] = y + cumulative_height
            if "y_center" in new_line:
                new_line["y_center"] = float(new_line["y_center"]) + cumulative_height
            else:
                h = float(new_line.get("h", 0.0))
                new_line["y_center"] = new_line["y"] + (h / 2.0)
                
            merged_lines.append(new_line)
            
        if logger:
            logger.info(f"Page {idx + 1}: Stripped {stripped_headers_count} header lines, {stripped_footers_count} footer lines.")
            
        cumulative_height += page_height
        
    # Sort globally by shifted y_center and then x
    merged_lines.sort(key=lambda l: (l.get("y_center", 0.0), l.get("x", 0.0)))
    if logger:
        logger.info(f"Successfully merged {len(pages_lines)} pages into {len(merged_lines)} continuous document lines.")
        
    return merged_lines
