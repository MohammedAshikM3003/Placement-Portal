# backend/ocr-service/ocr/table_detector.py

def align_table_rows(lines, tolerance=14.0):
    """
    Groups horizontal OCR lines into tabular rows using coordinate proximity bounds.
    Aligns elements inside rows by their X-coordinates to construct cells dynamically.
    """
    sorted_lines = sorted(lines, key=lambda l: l.get("y", 0.0))
    rows = []
    
    for line in sorted_lines:
        placed = False
        for row in rows:
            # Determine alignment coordinate proximity (vertical match)
            if abs(row["y_center"] - line.get("y", 0.0)) < tolerance:
                row["items"].append(line)
                row["y_center"] = sum(c.get("y", 0.0) for c in row["items"]) / len(row["items"])
                row["count"] = len(row["items"])
                placed = True
                break
        if not placed:
            rows.append({
                "y_center": line.get("y", 0.0),
                "items": [line],
                "count": 1
            })
            
    # Sort items inside each row horizontally (by X axis alignment)
    for row in rows:
        row["items"] = sorted(row["items"], key=lambda c: c.get("x", 0.0))
        
    return rows
