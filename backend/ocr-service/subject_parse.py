import json
import os
import re
from datetime import datetime

from column_segment import (
    assign_to_fixed_columns,
    detect_column_anchors,
)

STRICT_COURSE_CODE_RE = re.compile(r"\b([0-9]{2}\s*[A-Z]{2,3}\s*[0-9]{3})\b")
GRADE_RE = re.compile(r"(?<![A-Za-z0-9])(O|A\+|A\-|A|B\+|B\-|B|C|U|S|AB|RA|SA|W|WD)(?![A-Za-z0-9])")
RESULT_RE = re.compile(r"\b(PASS|FAIL|P|F|AB|W)\b", re.IGNORECASE)

GRADE_VALUES = {"O", "A+", "A", "B+", "B", "C", "U", "RA", "SA", "W", "WD", "AB"}

SEMESTER_PATTERNS = [
    re.compile(r"SEMESTER\s*[-:]?\s*([IVX0-9]+)", re.IGNORECASE),
    re.compile(r"SEM\s*[-:]?\s*([IVX0-9]+)", re.IGNORECASE),
    re.compile(r"^\s*([1-8])\s*SEMESTER", re.IGNORECASE),
]

BLOCKED_KEYWORDS = [
    "revaluation",
    "last date",
    "controller of examinations",
    "result published",
    "website",
    "semester results",
    "www.",
    "https://",
    "http://",
    "apply online",
    "notification",
    "important notice",
    "published on website",
    "decision is final",
]

ROW_MAX_LEN = int(os.environ.get("OCR_SUBJECT_ROW_MAX_LEN", "120"))
ROW_MIN_LEN = int(os.environ.get("OCR_SUBJECT_ROW_MIN_LEN", "3"))
ROW_MIN_CONF = float(os.environ.get("OCR_SUBJECT_ROW_MIN_CONF", "0.55"))
PARSER_DEBUG = os.environ.get("OCR_PARSER_DEBUG", "1") == "1"
REVIEW_QUEUE_FILE = os.environ.get("OCR_REVIEW_QUEUE_FILE", "")
FOOTER_REGION_PCT = float(os.environ.get("OCR_FOOTER_REGION_PCT", "0.15"))
FOOTER_MIN_PAGE_HEIGHT = float(os.environ.get("OCR_FOOTER_MIN_PAGE_HEIGHT", "600"))
ROW_MAX_WIDTH = float(os.environ.get("OCR_ROW_MAX_WIDTH", "1600"))
ROW_MAX_WIDTH_RATIO = float(os.environ.get("OCR_ROW_MAX_WIDTH_RATIO", "0.95"))
SUBJECT_MAX_GAP = float(os.environ.get("OCR_SUBJECT_MAX_GAP", "50"))
TABLE_MARGIN = float(os.environ.get("OCR_TABLE_MARGIN", "20"))
ROW_Y_TOLERANCE = float(os.environ.get("OCR_ROW_Y_TOLERANCE", "14"))

ROMAN_TO_INT = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4,
    "V": 5,
    "VI": 6,
    "VII": 7,
    "VIII": 8,
}


def normalize_grade(grade):
    if not grade:
        return ''
    upper = grade.strip().upper()
    if upper == 'A-':
        return 'A+'
    if upper == 'B-':
        return 'B+'
    if upper == '5A':
        return 'SA'
    return upper


def normalize_result(result):
    if not result:
        return ''
    upper = result.strip().upper()
    if upper in ('PASS', 'P'):
        return 'P'
    if upper in ('FAIL', 'F'):
        return 'F'
    return upper


def normalize_course_code(code):
    if not code:
        return ''
    raw = code.strip().upper().replace(' ', '')
    raw = re.sub(r"(?<=\d)O|O(?=\d)", "0", raw)
    raw = re.sub(r"(?<=\d)I|I(?=\d)", "1", raw)
    raw = raw.replace("5A", "SA")
    return raw


def _row_text(row_items):
    return " ".join(item["text"] for item in row_items).strip()


def _line_y_center(line):
    if line.get("y_center") is not None:
        return float(line.get("y_center"))
    y = float(line.get("y", 0.0))
    h = float(line.get("h", 0.0))
    return y + (h / 2.0)


def _line_x(line):
    return float(line.get("x", 0.0))


def _group_rows_by_y(lines, y_tolerance):
    rows = []
    for line in sorted(lines, key=lambda l: (_line_y_center(l), _line_x(l))):
        y_center = _line_y_center(line)
        placed = False
        for row in rows:
            if abs(y_center - row["y_center"]) <= y_tolerance:
                row["items"].append(line)
                row["y_center"] = (row["y_center"] * row["count"] + y_center) / (row["count"] + 1)
                row["count"] += 1
                placed = True
                break
        if not placed:
            rows.append({"items": [line], "y_center": y_center, "count": 1})

    for row in rows:
        row["items"].sort(key=lambda l: _line_x(l))
    rows.sort(key=lambda r: r["y_center"])
    return rows


def _row_tokens_for_log(items):
    tokens = []
    for item in items:
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        x = round(float(item.get("x", 0.0)), 1)
        tokens.append((x, text))
    return tokens


def _items_y_center(items, fallback=0.0):
    if not items:
        return fallback
    ys = [_line_y_center(item) for item in items]
    return sum(ys) / len(ys)


def _merge_row_tokens(items):
    row_tokens = []
    for item in items:
        token = str(item.get("text", "")).strip()
        if not token:
            continue
        row_tokens.append((float(item.get("x", 0.0)), token))

    merged_text = " ".join(
        token.strip()
        for _, token in sorted(row_tokens, key=lambda x: x[0])
        if token and token.strip()
    )
    merged_text = re.sub(r"\s+", " ", merged_text).strip()
    return merged_text


def _split_row_by_course_code(items):
    segments = []
    current = None
    for item in items:
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        if STRICT_COURSE_CODE_RE.search(text):
            if current:
                segments.append(current)
            current = [item]
        elif current is not None:
            current.append(item)

    if current:
        segments.append(current)

    if not segments and items:
        return [items]
    return segments


def _debug(message):
    if PARSER_DEBUG:
        print(f"[subject_parse] {message}")


def enqueue_review_row(reason, row_text, course_code=""):
    payload = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "reason": reason,
        "row_text": row_text,
        "course_code": course_code,
    }
    if REVIEW_QUEUE_FILE:
        try:
            with open(REVIEW_QUEUE_FILE, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(payload, ensure_ascii=True) + "\n")
            _debug(f"Queued row for review: {reason}")
            return
        except Exception:
            pass
    _debug(f"Review queue fallback (log-only): {reason}")


def _load_semester_code_map():
    raw = os.environ.get("OCR_SEMESTER_CODE_MAP", "")
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            return {}
        out = {}
        for k, v in data.items():
            try:
                out[str(k).upper()] = int(v)
            except Exception:
                continue
        return out
    except Exception:
        return {}


SEMESTER_CODE_MAP = _load_semester_code_map()


def normalize_semester(value):
    if value is None:
        return None
    raw = str(value).strip().upper().replace(" ", "")
    if not raw:
        return None
    if raw.isdigit():
        num = int(raw)
        if 1 <= num <= 8:
            return num
        return None
    return ROMAN_TO_INT.get(raw)


def detect_semester_heading(text):
    if not text:
        return None
    cleaned = re.sub(r"\s+", " ", text).strip()
    for pattern in SEMESTER_PATTERNS:
        match = pattern.search(cleaned)
        if not match:
            continue
        sem = normalize_semester(match.group(1))
        if sem is not None:
            _debug(f"Detected semester heading: {match.group(1)}")
            _debug(f"Normalized semester: {sem}")
            return sem
    return None


def contains_blocked_content(text):
    if not text:
        return False
    lower = text.lower()
    if any(keyword in lower for keyword in BLOCKED_KEYWORDS):
        return True
    if "http" in lower or "www" in lower:
        return True
    return False


def clean_subject_name(text):
    if not text:
        return ""

    cleaned = text
    cleaned = re.sub(r"https?://\S+", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"www\.\S+", " ", cleaned, flags=re.IGNORECASE)

    # Remove common footer/notice tails deterministically.
    for phrase in BLOCKED_KEYWORDS:
        cleaned = re.sub(re.escape(phrase), " ", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r"([a-z])([A-Z])", r"\1 \2", cleaned)
    cleaned = re.sub(r"([a-zA-Z])and([A-Z])", r"\1 and \2", cleaned)
    cleaned = re.sub(r"([a-zA-Z])of([A-Z])", r"\1 of \2", cleaned)
    cleaned = re.sub(r"([a-zA-Z])for([A-Z])", r"\1 for \2", cleaned)
    cleaned = re.sub(r"([a-zA-Z])in([A-Z])", r"\1 in \2", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"[|`~_^]+", "", cleaned)
    cleaned = re.sub(r"[^A-Za-z0-9&()\-/,.\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -:;,.\t\n\r")
    cleaned = cleaned.strip()

    _debug(f"Cleaned subject name: '{text}' -> '{cleaned}'")
    return cleaned


def _row_confidence(items):
    confs = [float(i.get("conf", 0.0)) for i in items if i.get("conf") is not None]
    if not confs:
        return 0.0
    return sum(confs) / len(confs)


def _punctuation_ratio(text):
    if not text:
        return 0.0
    punct = sum(1 for ch in text if ch in "!@#$%^*_+=~`|\\<>{}[]")
    return punct / max(1, len(text))


def infer_semester_from_code(course_code):
    try:
        if not course_code:
            return None
        upper = str(course_code).upper().strip()

        # Extensible override map via env JSON, example: {"20CS2":3, "20CS3":5}
        for prefix, sem in SEMESTER_CODE_MAP.items():
            if upper.startswith(prefix):
                _debug(f"Fallback semester inference used: {course_code} -> {sem} (map)")
                return sem

        match = re.search(r"(\d{3})$", upper)
        if not match:
            return None

        lead = int(match.group(1)[0])
        mapping = {
            0: 1,
            1: 1,
            2: 3,
            3: 5,
            4: 7,
        }
        semester = mapping.get(lead)
        _debug(f"Fallback semester inference used: {course_code} -> {semester}")
        return semester
    except Exception as exc:
        _debug(f"Semester inference failed: {exc}")
        return None


def is_reasonable_subject_name(name):
    if not name:
        return False
    trimmed = name.strip()
    upper = trimmed.upper()

    if upper in GRADE_VALUES:
        return False
    if re.fullmatch(r"^[A-Z][+]?$", upper or ""):
        return False
    if len(trimmed) > 180:
        return False
    if len(trimmed) < 3:
        return False
    if not re.search(r"[A-Za-z]", trimmed):
        return False
    if re.fullmatch(r"[^A-Za-z0-9]+", trimmed):
        return False
    return True


def is_valid_subject_name(text):
    return is_reasonable_subject_name(text)


def is_valid_subject_row(row_text, course_code, items):
    if not course_code:
        return False, "missing course code"

    if len(row_text) < ROW_MIN_LEN or len(row_text) > ROW_MAX_LEN:
        return False, "row length out of bounds"

    if contains_blocked_content(row_text):
        return False, "blocked footer/notice/url content"

    if row_text.count(".") >= 2:
        return False, "multiple sentence-like segments"

    return True, "ok"


def extract_name_from_row_text(row_text, course_code):
    cleaned = row_text
    if course_code:
        cleaned = re.sub(re.escape(course_code), " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(GRADE_RE, " ", cleaned)
    cleaned = re.sub(RESULT_RE, " ", cleaned)
    cleaned = re.sub(r"\b\d{1,2}\b", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def extract_row_tail_after_code(row_text, course_code):
    cleaned = row_text
    if course_code:
        cleaned = re.sub(re.escape(course_code), " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def extract_row_tail_after_first_code(row_text):
    if not row_text:
        return ""
    match = STRICT_COURSE_CODE_RE.search(row_text)
    if not match:
        return row_text.strip()
    cleaned = row_text[match.end():]
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def extract_course_code(row_text):
    match = STRICT_COURSE_CODE_RE.search(row_text)
    if not match:
        return ""
    return normalize_course_code(match.group(1))


def split_trailing_grade(text):
    if not text:
        return "", ""
    tokens = [t for t in re.split(r"\s+", text.strip()) if t]
    if not tokens:
        return "", ""
    last = tokens[-1].upper()
    if last in GRADE_VALUES:
        _debug(f"Detected trailing grade {last}")
        return " ".join(tokens[:-1]).strip(), last
    return text, ""


def extract_trailing_grade(subject_name, grade):
    if not subject_name:
        return subject_name, grade
    valid_grades = {"O", "A+", "A", "B+", "B", "C", "U", "RA", "SA", "W", "WD", "AB"}
    if not grade or not str(grade).strip():
        tokens = [t.strip() for t in subject_name.strip().split() if t.strip()]
        if tokens:
            last_token = tokens[-1]
            last_token_upper = last_token.upper()
            if last_token_upper in valid_grades:
                before_name = subject_name
                new_subject_name = " ".join(tokens[:-1]).strip()
                new_grade = normalize_grade(last_token_upper)
                
                _debug(f"Before:\n{before_name}")
                _debug(f"After:\ncourseName={new_subject_name}\ngrade={new_grade}")
                
                return new_subject_name, new_grade
    return subject_name, grade


def _strip_trailing_markers(tokens):
    grade = ""
    result = ""
    credit = ""
    while tokens:
        last = tokens[-1]
        upper = last.upper()
        if upper in GRADE_VALUES:
            if not grade:
                grade = normalize_grade(upper)
            tokens.pop()
            continue
        if upper in ("PASS", "FAIL", "P", "F", "AB", "W"):
            if not result:
                result = normalize_result(upper)
            tokens.pop()
            continue
        if re.fullmatch(r"\d{1,2}", last):
            if not credit:
                credit = last
            tokens.pop()
            continue
        break
    return tokens, grade, result, credit


def _page_bounds(lines):
    if not lines:
        return 1.0, 1.0
    max_x = 1.0
    max_y = 1.0
    for line in lines:
        x = float(line.get("x", 0.0))
        y = float(line.get("y", 0.0))
        w = float(line.get("w", 0.0))
        h = float(line.get("h", 0.0))
        max_x = max(max_x, x + w)
        max_y = max(max_y, y + h)
    return max_x, max_y


def is_footer_region(y_center, page_height):
    if page_height <= 0:
        return False
    if page_height < FOOTER_MIN_PAGE_HEIGHT:
        return False
    return y_center >= page_height * (1.0 - FOOTER_REGION_PCT)


def _row_bounds(row):
    ys = [float(i.get("y", 0.0)) for i in row["items"]]
    xs = [float(i.get("x", 0.0)) for i in row["items"]]
    ws = [float(i.get("w", 0.0)) for i in row["items"]]
    hs = [float(i.get("h", 0.0)) for i in row["items"]]
    if not xs or not ys:
        return 0.0, 0.0, 0.0, 0.0
    x1 = min(xs)
    y1 = min(ys)
    x2 = max(xs[i] + ws[i] for i in range(len(xs)))
    y2 = max(ys[i] + hs[i] for i in range(len(ys)))
    return x1, y1, x2, y2


def _table_bounds(rows):
    table_rows = []
    for row in rows:
        row_text = _row_text(row["items"])
        if STRICT_COURSE_CODE_RE.search(row_text):
            table_rows.append(row)
    if not table_rows:
        return None, None
    tops = []
    bottoms = []
    for row in table_rows:
        _, y1, _, y2 = _row_bounds(row)
        tops.append(y1)
        bottoms.append(y2)
    return min(tops), max(bottoms)


def _detect_semester_headings(lines):
    headings = []
    for line in lines:
        text = str(line.get("text", "")).strip()
        if not text:
            continue
        sem = detect_semester_heading(text)
        if sem is None:
            continue
        y_center = float(line.get("y_center", 0.0))
        headings.append({"semester": sem, "y": y_center})
    headings.sort(key=lambda h: h["y"])
    return headings


def _semester_for_row(row_y, headings):
    current = None
    for heading in headings:
        if heading["y"] <= row_y:
            current = heading["semester"]
        else:
            break
    return current


def _first_code_item(items):
    for item in items:
        if STRICT_COURSE_CODE_RE.search(str(item.get("text", ""))):
            return item
    return None


def _first_grade_item(items):
    grade_items = []
    for item in items:
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        match = GRADE_RE.search(text)
        if match:
            grade_items.append(item)
            continue
        for token in re.split(r"\s+", text):
            if token.upper() in GRADE_VALUES:
                grade_items.append(item)
                break
    if not grade_items:
        return None
    return min(grade_items, key=lambda i: float(i.get("x", 0.0)))


def parse_subjects(lines, row_cluster_mult=0.6):
    page_width, page_height = _page_bounds(lines)
    current_semester = None

    # Filter obvious blocked OCR lines before row clustering.
    safe_lines = []
    for line in lines:
        text = str(line.get("text", "")).strip()
        if not text:
            continue
        if contains_blocked_content(text):
            _debug(f"Skipped blocked line (line-level): {text[:80]}")
            continue
        safe_lines.append(line)

    rows = _group_rows_by_y(safe_lines, ROW_Y_TOLERANCE)
    _ = detect_column_anchors(rows)

    _table_top, _table_bottom = _table_bounds(rows)
    subjects = []
    sno = 1

    for row in rows:
        items = row["items"]
        row_text_full = _merge_row_tokens(items)
        if row_text_full:
            heading_semester = detect_semester_heading(row_text_full)
            if heading_semester is not None:
                current_semester = heading_semester
                _debug(f"Detected semester heading: {heading_semester}")
                continue

        row_segments = _split_row_by_course_code(items)

        for segment_items in row_segments:
            if not segment_items:
                continue
            row_text = _merge_row_tokens(segment_items)
            if not row_text:
                continue

            _debug(f"ROW TOKENS: {_row_tokens_for_log(segment_items)}")
            _debug(f"MERGED ROW: {row_text}")

            code = extract_course_code(row_text)
            if not code:
                _debug(f"Skipped row: missing course code :: {row_text[:100]}")
                continue

            _debug(f"Accepted row: {code}")

            buckets = assign_to_fixed_columns(segment_items)

            grade = ""
            result = ""
            credit = ""

            # Extract grade/result/credit from grade/right columns only.
            for bucket in (buckets.get("grade", []) + buckets.get("right", [])):
                bucket_text = str(bucket.get("text", "")).strip()
                if not bucket_text:
                    continue
                grade_found = GRADE_RE.search(bucket_text)
                if grade_found and not grade:
                    _debug(f"Detected grade token: {grade_found.group(1)}")
                    grade = normalize_grade(grade_found.group(1))
                    continue
                result_found = RESULT_RE.search(bucket_text)
                if result_found and not result:
                    result = normalize_result(result_found.group(1))
                    continue
                if re.fullmatch(r"\d{1,2}", bucket_text) and not credit:
                    credit = bucket_text
                    continue

            if not result:
                result_match = RESULT_RE.search(row_text)
                if result_match:
                    result = normalize_result(result_match.group(1))

            tail = extract_row_tail_after_first_code(row_text)
            tokens = [t for t in re.split(r"\s+", tail) if t]
            tokens, trailing_grade, trailing_result, trailing_credit = _strip_trailing_markers(tokens)

            if not grade and trailing_grade:
                grade = trailing_grade
            if not result and trailing_result:
                result = trailing_result
            if not credit and trailing_credit:
                credit = trailing_credit

            base_name = " ".join(tokens).strip()
            if not base_name:
                base_name = tail

            course_name = clean_subject_name(base_name)
            _debug(f"FINAL SUBJECT: {course_name}")

            valid, reason = is_valid_subject_row(row_text, code, segment_items)
            if not valid:
                if "blocked" in reason:
                    _debug("Rejected footer row")
                else:
                    _debug("Rejected invalid row")
                _debug(f"Rejected row: {reason} :: {row_text[:100]}")
                enqueue_review_row(reason, row_text, code)
                continue

            if not is_valid_subject_name(course_name):
                _debug(f"Rejected row: invalid subject name :: {row_text[:100]}")
                enqueue_review_row("bad subject name", row_text, code)
                continue

            semester = current_semester or infer_semester_from_code(code)

            if semester is not None:
                _debug(f"Applied semester {semester} to {code}")

            subject = {
                "sno": sno,
                "semester": semester,
                "courseCode": code,
                "courseName": course_name.title(),
                "grade": grade,
                "result": result,
                "credits": credit,
            }

            # Inspect the last token of courseName and move if empty grade
            updated_name, updated_grade = extract_trailing_grade(subject["courseName"], subject["grade"])
            if updated_grade != subject["grade"]:
                subject["courseName"] = updated_name.title()
                subject["grade"] = updated_grade

            _debug("Extracted subject successfully")

            subjects.append(subject)
            sno += 1

    return subjects
