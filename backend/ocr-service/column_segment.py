import os

import numpy as np

# Deterministic column boundaries (override via env per template/layout)
CODE_COLUMN_MAX_X = float(os.environ.get("OCR_CODE_COLUMN_MAX_X", "300"))
SUBJECT_COLUMN_MIN_X = float(os.environ.get("OCR_SUBJECT_COLUMN_MIN_X", "300"))
SUBJECT_COLUMN_MAX_X = float(os.environ.get("OCR_SUBJECT_COLUMN_MAX_X", "1100"))
GRADE_COLUMN_MIN_X = float(os.environ.get("OCR_GRADE_COLUMN_MIN_X", "1100"))


def get_fixed_column_bounds():
    return {
        "code_max_x": CODE_COLUMN_MAX_X,
        "subject_min_x": SUBJECT_COLUMN_MIN_X,
        "subject_max_x": SUBJECT_COLUMN_MAX_X,
        "grade_min_x": GRADE_COLUMN_MIN_X,
    }


def detect_column_anchors(rows):
    xs = []
    for row in rows:
        for item in row["items"]:
            xs.append(item["x"])
    if not xs:
        return []

    hist, edges = np.histogram(xs, bins=20)
    peaks = [edges[i] for i in range(1, len(hist) - 1) if hist[i] > hist[i - 1] and hist[i] > hist[i + 1]]
    anchors = sorted(peaks)
    return anchors


def assign_to_columns(row_items, anchors):
    if not anchors:
        return {"misc": row_items}

    def nearest_anchor(x):
        best = anchors[0]
        best_dist = abs(x - best)
        for a in anchors[1:]:
            d = abs(x - a)
            if d < best_dist:
                best, best_dist = a, d
        return best

    buckets = {}
    for item in row_items:
        key = nearest_anchor(item["x"])
        buckets.setdefault(key, []).append(item)
    return buckets


def assign_to_fixed_columns(row_items):
    buckets = {"code": [], "subject": [], "grade": [], "right": []}
    for item in row_items:
        x = float(item.get("x", 0.0))
        if x <= CODE_COLUMN_MAX_X:
            buckets["code"].append(item)
        elif SUBJECT_COLUMN_MIN_X <= x <= SUBJECT_COLUMN_MAX_X:
            buckets["subject"].append(item)
        elif x >= GRADE_COLUMN_MIN_X:
            buckets["grade"].append(item)
        else:
            buckets["right"].append(item)
    return buckets
