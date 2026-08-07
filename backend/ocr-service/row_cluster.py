import numpy as np


def group_rows(lines, mult=0.6):
    if not lines:
        return []
    heights = [l["h"] for l in lines if l.get("h")]
    median_h = float(np.median(heights)) if heights else 12.0
    threshold = max(6.0, median_h * mult)

    rows = []
    for line in sorted(lines, key=lambda l: (l["y_center"], l["x"])):
        placed = False
        for row in rows:
            if abs(line["y_center"] - row["y_center"]) <= threshold:
                row["items"].append(line)
                row["y_center"] = (row["y_center"] * row["count"] + line["y_center"]) / (row["count"] + 1)
                row["count"] += 1
                placed = True
                break
        if not placed:
            rows.append({"items": [line], "y_center": line["y_center"], "count": 1})

    for row in rows:
        row["items"].sort(key=lambda l: l["x"])
    rows.sort(key=lambda r: r["y_center"])
    return rows
