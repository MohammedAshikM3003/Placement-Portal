import cv2
import numpy as np


def draw_boxes(image, lines, color=(0, 255, 0)):
    img = np.array(image.convert("RGB"))
    for l in lines:
        x, y, w, h = int(l["x"]), int(l["y"]), int(l["w"]), int(l["h"])
        cv2.rectangle(img, (x, y), (x + w, y + h), color, 1)
    return img


def draw_rows(image, rows, color=(255, 0, 0)):
    img = np.array(image.convert("RGB"))
    for row in rows:
        ys = [int(i["y"]) for i in row["items"]]
        xs = [int(i["x"]) for i in row["items"]]
        ws = [int(i["w"]) for i in row["items"]]
        hs = [int(i["h"]) for i in row["items"]]
        x1 = min(xs)
        y1 = min(ys)
        x2 = max(xs[i] + ws[i] for i in range(len(xs)))
        y2 = max(ys[i] + hs[i] for i in range(len(ys)))
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 1)
    return img


def draw_columns(image, bounds, color=(0, 255, 255)):
    img = np.array(image.convert("RGB"))
    height, width = img.shape[0], img.shape[1]
    for x in [
        int(bounds.get("code_max_x", 0)),
        int(bounds.get("subject_min_x", 0)),
        int(bounds.get("subject_max_x", 0)),
        int(bounds.get("grade_min_x", 0)),
    ]:
        if x <= 0 or x >= width:
            continue
        cv2.line(img, (x, 0), (x, height), color, 1)
    return img


def draw_footer_region(image, footer_y, color=(0, 0, 255), alpha=0.15):
    img = np.array(image.convert("RGB"))
    height, width = img.shape[0], img.shape[1]
    y = max(0, min(height, int(footer_y)))
    overlay = img.copy()
    cv2.rectangle(overlay, (0, y), (width, height), color, -1)
    img = cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0)
    return img


def draw_semester_headings(image, headings, color=(255, 0, 0)):
    img = np.array(image.convert("RGB"))
    for heading in headings:
        y = int(heading.get("y", 0))
        text = f"SEM {heading.get('semester', '')}"
        cv2.putText(img, text, (10, max(15, y)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    return img
