# backend/ocr-service/ocr/pipeline.py
import re
import traceback
from PIL import Image
import urllib.request
import json
import threading

def write_debug_json(filename, data, enabled):
    if not enabled:
        return
    try:
        import os
        import json
        debug_dir = "d:/Placement-Portal/debug"
        os.makedirs(debug_dir, exist_ok=True)
        filepath = os.path.join(debug_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as ex:
        print(f"Error writing debug file {filename}: {ex}")


def report_progress(job_id, processed, total, reg_no, stage, status="processing", extra_fields=None):
    if not job_id:
        return
        
    def _post():
        try:
            url = "http://localhost:5000/api/marksheets/progress/update"
            payload = {
                "jobId": job_id,
                "totalMarksheets": total,
                "processedMarksheets": processed,
                "currentRegisterNo": str(reg_no or ""),
                "currentStage": stage,
                "status": status
            }
            if extra_fields:
                payload.update(extra_fields)
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=1.0) as response:
                response.read()
        except Exception:
            pass
            
    threading.Thread(target=_post, daemon=True).start()


from ocr.logger import PipelineLogger
from ocr.preprocessing import build_preprocess_variants
from ocr.ocr_engine import (
    extract_text_lines_from_image,
    extract_text_lines_from_pdf_bytes,
    get_ocr_engine
)
from ocr.register_detector import detect_register_number
from ocr.semester_detector import detect_page_semesters, infer_semester_for_row
from ocr.subject_builder import group_lines_into_rows, build_subjects_from_rows
from ocr.validator import validate_subject_row
from ocr.confidence import calculate_row_confidence
from ocr.normalizer import clean_whitespace

# Keywords for document type detection
RESULT_SHEET_KEYWORDS = ["UG & PG END SEMESTER", "END SEMESTER", "PROVISIONAL RESULT", "EXAM RESULT", "RESULT SHEET"]
ORIGINAL_MARKSHEET_KEYWORDS = ["GRADE SHEET", "STATEMENT OF MARKS", "CHOICE BASED CREDIT SYSTEM", "CONSOLIDATED GRADE"]

def detect_document_type(full_text):
    upper = full_text.upper()
    for kw in ORIGINAL_MARKSHEET_KEYWORDS:
        if kw in upper:
            return "original_marksheet"
    for kw in RESULT_SHEET_KEYWORDS:
        if kw in upper:
            return "result_sheet"
    return "unknown"

def extract_candidate_name(full_text, logger=None):
    name_patterns = [
        re.compile(r"NAME\s*(?:OF\s*(?:THE\s*)?CANDIDATE)?\s*[:;\-]?\s*([A-Z .\n]+)", re.I),
        re.compile(r"STUDENT\s*NAME\s*[:;\-]?\s*([A-Z .\n]+)", re.I),
    ]
    for pattern in name_patterns:
        match = pattern.search(full_text)
        if match:
            raw_name = match.group(1).split('\n')[0].strip()
            # Clean up obvious trailing headers if name is long
            raw_name = re.split(r"\b(?:REG|SEMESTER|PROGRAMME|DOB|EXAM|SGPA|CGPA)\b", raw_name, flags=re.I)[0].strip()
            # Title case it
            formatted = clean_whitespace(raw_name).title()
            if len(formatted) > 2:
                return formatted
    return ""

def extract_student_info(full_text, logger=None):
    """
    Extracts student details like name, register number, dob, branch, cgpa, sgpa, and regulation.
    """
    info = {}
    upper = full_text.upper()
    
    # 1. Student Name
    info["name"] = extract_candidate_name(full_text, logger)
    
    # 2. Date of Birth
    dob_m = re.search(r"\b(?:DOB|DATE\s*OF\s*BIRTH)\s*[:;\-]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})\b", upper)
    if dob_m:
        info["date_of_birth"] = dob_m.group(1).strip()
        
    # 3. Programme / Branch
    prog_m = re.search(r"\b(?:PROGRAMME|BRANCH|DEGREE)\s*[:;\-]?\s*([A-Z .\-–()]+)(?:\n|$)", upper)
    if prog_m:
        info["programme"] = clean_whitespace(prog_m.group(1)).title()
        
    # 4. Regulation
    reg_m = re.search(r"REGULATION\s*[:;\-]?\s*(\d{4})\b", upper)
    if reg_m:
        info["regulation"] = reg_m.group(1).strip()
        
    # 5. SGPA / CGPA
    sgpa_m = re.search(r"\b(?:SGPA|GPA)\s*[:;\-]?\s*(\d+(?:\.\d+)?)\b", upper)
    if sgpa_m:
        info["sgpa"] = sgpa_m.group(1).strip()
        
    cgpa_m = re.search(r"\bCGPA\s*[:;\-]?\s*(\d+(?:\.\d+)?)\b", upper)
    if cgpa_m:
        info["cgpa"] = cgpa_m.group(1).strip()
        
    return info

class Pipeline:
    """
    Core orchestrator of the redesigned document-driven OCR extraction engine.
    """
    def __init__(self):
        self.ocr_engine = get_ocr_engine()

    def process_page(self, image_or_lines, is_pre_extracted=False, page_idx=0, options=None):
        """
        Processes a single page.
        image_or_lines: PIL Image or list of extracted dict lines (if pdfplumber was used).
        """
        logger = PipelineLogger()
        logger.info(f"--- Starting Processing for Page {page_idx+1} ---")
        options = options or {}
        
        # Default options
        min_conf = float(options.get("min_conf", 0.65))
        fallback_sem = options.get("semester", None)
        
        try:
            # 1. Image Preprocessing & OCR Extraction (if not pre-extracted)
            if not is_pre_extracted:
                raw_image = image_or_lines
                logger.info("Running preprocessing on raw page image")
                variants = build_preprocess_variants(raw_image, logger)
                
                # Try OCR on preprocessing variants, pick the one with highest conf/count
                attempts = []
                for name, img in variants:
                    logger.info(f"Running PaddleOCR on variant '{name}'")
                    lines = extract_text_lines_from_image(img, self.ocr_engine, min_conf, logger)
                    avg_conf = sum(l["conf"] for l in lines) / max(1, len(lines)) if lines else 0.0
                    attempts.append((name, lines, avg_conf))
                    
                    # If we got a highly confident result with significant text lines, stop early to save execution time
                    if avg_conf >= 0.90 and len(lines) >= 20:
                        logger.info(f"Early-stop triggered on variant '{name}' (Avg Conf: {avg_conf:.3f}, Lines: {len(lines)})")
                        break
                    
                # Pick best variant
                attempts.sort(key=lambda x: (x[2], len(x[1])), reverse=True)
                best_name, best_lines, best_conf = attempts[0]
                logger.info(f"Selected variant '{best_name}' (Avg Conf: {best_conf:.3f}, Lines: {len(best_lines)})")
                lines = best_lines
                ocr_variant = best_name
            else:
                lines = image_or_lines
                ocr_variant = "pdfplumber"
                logger.info(f"Using digital PDF text lines (count: {len(lines)})")
                
            if not lines:
                logger.warning("No text lines could be extracted from this page.")
                return {
                    "document_type": "unknown",
                    "student_info": {},
                    "subjects": [],
                    "ocr_meta": {"avg_conf": 0.0, "line_count": 0, "attempts": [ocr_variant]},
                    "raw_text": "",
                    "logs": logger.get_logs()
                }
                
            # Compile full text for heuristics
            full_text = "\n".join(l["text"] for l in lines)
            doc_type = detect_document_type(full_text)
            logger.info(f"Detected document type: {doc_type}")
            
            # 2. Student Info Extraction
            student_info = extract_student_info(full_text, logger)
            
            # 3. Register Number Detection
            reg_no, reg_conf = detect_register_number(lines, page_height=1200.0, logger=logger)
            student_info["register_number"] = reg_no
            student_info["reg_conf"] = reg_conf
            
            # 4. Semester Detection
            sem_headings = detect_page_semesters(lines, logger)
            if sem_headings:
                # Update main semester in student info from first heading
                student_info["semester"] = sem_headings[0]["semester"]
            else:
                student_info["semester"] = fallback_sem
                logger.warning(f"No semester headings found. Using fallback semester: {fallback_sem}")
                
            # 5. Row Grouping & Subjects Reconstruction (Primary Parser)
            logger.info("Grouping lines into horizontal rows")
            rows = group_lines_into_rows(lines, y_tolerance=14.0)
            logger.info(f"Clustered lines into {len(rows)} coordinate rows")
            
            raw_subjects = build_subjects_from_rows(rows, student_info["semester"], logger)
            logger.info(f"Reconstructed {len(raw_subjects)} subject records")
            
            # 6. Fallback secondary text parser if primary returned no subjects (Stage 14)
            if not raw_subjects and len(lines) > 5:
                logger.warning("Primary coordinate parser extracted 0 rows. Invoking secondary text parser.")
                raw_subjects = self._fallback_text_parser(lines, student_info["semester"], logger)
                
            # 7. Post-process, Validate, and Confidence Score each subject
            final_subjects = []
            corrected_rows_count = 0
            
            for s in raw_subjects:
                # Apply row semester inference based on heading Y coordinates
                row_y = s.pop("y_center", 0.0)
                inferred_sem = infer_semester_for_row(row_y, sem_headings, student_info["semester"])
                if inferred_sem is not None:
                    s["semester"] = inferred_sem
                    
                # Run validation
                is_valid, errors, warnings = validate_subject_row(s)
                
                # Score confidence
                token_confs = s.pop("token_confs", [])
                score = calculate_row_confidence(s, token_confs, errors, warnings)
                s["confidence"] = score
                s["errors"] = errors
                s["warnings"] = warnings
                
                # Trace corrections
                if not is_valid or warnings:
                    corrected_rows_count += 1
                    
                final_subjects.append(s)
                
            # Metadata stats
            avg_page_conf = sum(l["conf"] for l in lines) / len(lines)
            logger.info(f"Completed page extraction: {len(final_subjects)} subjects parsed, {corrected_rows_count} warning/review flags.")
            
            return {
                "success": True,
                "document_type": doc_type,
                "student_info": student_info,
                "subjects": final_subjects,
                "ocr_meta": {
                    "avg_conf": round(avg_page_conf, 4),
                    "line_count": len(lines),
                    "attempts": [ocr_variant],
                    "selected": ocr_variant
                },
                "raw_text": full_text,
                "logs": logger.get_logs()
            }
            
        except Exception as e:
            logger.error(f"Pipeline execution encountered error: {e}")
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": str(e),
                "logs": logger.get_logs()
            }

    def _fallback_text_parser(self, lines, default_semester, logger):
        """
        Secondary parser (Stage 14): processes lines purely by text token regex patterns
        in case horizontal spatial clustering yields nothing.
        """
        from ocr.course_code_detector import detect_course_code
        from ocr.subject_builder import strip_layout_independent_markers
        
        subjects = []
        sno = 1
        
        for line in lines:
            text = line["text"]
            tokens = [t.strip() for t in text.split() if t.strip()]
            
            # Check if any token matches a course code
            course_code = None
            code_score = 0.0
            code_idx = -1
            
            for idx, token in enumerate(tokens):
                code, score = detect_course_code(token)
                if code and score > code_score:
                    course_code = code
                    code_score = score
                    code_idx = idx
                    
            if course_code:
                # Split elements: before and after the course code
                before = tokens[:code_idx]
                after = tokens[code_idx+1:]
                
                # Strip leading serial/semester numbers from before list
                while before and before[0].isdigit() and int(before[0]) <= 50:
                    before.pop(0)
                    
                combined = before + after
                remaining, grade, result, credits = strip_layout_independent_markers(combined, logger)
                
                subject_name = " ".join(remaining).strip()
                if not subject_name:
                    subject_name = course_code
                    
                subjects.append({
                    "sno": sno,
                    "semester": default_semester,
                    "courseCode": course_code,
                    "courseName": clean_whitespace(subject_name).title(),
                    "credits": credits,
                    "grade": grade,
                    "result": result or ("F" if grade in ("U", "RA", "F") else "P" if grade else ""),
                    "code_pattern_score": code_score,
                    "y_center": line.get("y_center", line.get("y", 0.0)),
                    "token_confs": [float(line.get("conf", 1.0))]
                })
                sno += 1
                
        return subjects

    def process_document(self, images_or_lines_list, is_pre_extracted=False, options=None):
        """
        Processes a list of pages (either PIL Images or digital PDF text lines),
        groups them by student (using Register Number as anchor),
        deduplicates headers/footers, and parses a unified student marksheet record.
        """
        import time
        t_start = time.time()
        timings = {}
        global_duplicate_resolutions = []
        
        logger = PipelineLogger()
        logger.info(f"=== Starting Document-Centric Processing for {len(images_or_lines_list)} pages ===")
        options = options or {}
        job_id = options.get("jobId", None)
        debug_enabled = options.get("debug") == True
        
        min_conf = float(options.get("min_conf", 0.65))
        fallback_sem = options.get("semester", None)
        
        try:
            pages_lines = []
            attempts_list = []
            ocr_times_sum = 0.0
            
            # 1. OCR or digital extract each page
            t_pdf_load_start = time.time()
            total_pages = len(images_or_lines_list)
            timings["pdf_load"] = time.time() - t_pdf_load_start
            
            from concurrent.futures import ThreadPoolExecutor

            def process_page_ocr(page_arg):
                idx, item = page_arg
                t_page_start = time.time()
                page_logger = PipelineLogger()
                try:
                    if is_pre_extracted:
                        lines = item
                        ocr_variant = "pdfplumber"
                    else:
                        raw_image = item
                        from ocr.image_preprocessor import analyze_image_quality, estimate_rotation_angle, auto_rotate_image
                        import numpy as np
                        from PIL import Image

                        img_np = np.array(raw_image)
                        quality = analyze_image_quality(img_np)
                        page_logger.info(f"Page {idx+1} Quality Score: {quality}")

                        variants = build_preprocess_variants(raw_image, page_logger)
                        attempts = []
                        for name, img in variants:
                            page_logger.info(f"Page {idx+1}: Running PaddleOCR on variant '{name}'")
                            lines = extract_text_lines_from_image(img, self.ocr_engine, min_conf, page_logger)
                            
                            # Orientation check and auto rotation
                            angle = estimate_rotation_angle(lines)
                            if angle > 0:
                                page_logger.info(f"Page {idx+1}: Auto-rotating {angle} degrees to correct skew")
                                rotated_np = auto_rotate_image(np.array(img), angle)
                                img = Image.fromarray(rotated_np)
                                lines = extract_text_lines_from_image(img, self.ocr_engine, min_conf, page_logger)

                            avg_conf = sum(l["conf"] for l in lines) / max(1, len(lines)) if lines else 0.0
                            attempts.append((name, lines, avg_conf))
                            if avg_conf >= 0.90 and len(lines) >= 20:
                                page_logger.info(f"Page {idx+1}: Early-stop on variant '{name}'")
                                break
                                
                        attempts.sort(key=lambda x: (x[2], len(x[1])), reverse=True)
                        best_name, best_lines, best_conf = attempts[0]
                        lines = best_lines
                        ocr_variant = best_name
                except Exception as ex:
                    from ocr.recovery_manager import run_failed_page_recovery
                    run_failed_page_recovery(idx, self.pdf_path or "document.pdf", ex, page_logger)
                    lines = []
                    ocr_variant = "failed_recovered"
                    
                page_duration = time.time() - t_page_start
                return idx, lines, ocr_variant, page_duration

            # Run page OCR concurrently using a thread pool (Phase 15)
            max_workers = min(4, total_pages)
            page_tasks = list(enumerate(images_or_lines_list))
            
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                completed_tasks = list(executor.map(process_page_ocr, page_tasks))
                
            # Sort back to preserve page orders
            completed_tasks.sort(key=lambda x: x[0])
            
            for idx, lines, ocr_variant, page_duration in completed_tasks:
                ocr_times_sum += page_duration
                
                # Save OCR Verification Data (Stage 2)
                avg_conf = sum(l["conf"] for l in lines) / max(1, len(lines)) if lines else 0.0
                page_ocr_data = {
                    "page_index": idx + 1,
                    "ocr_time_seconds": page_duration,
                    "avg_confidence": avg_conf,
                    "line_count": len(lines),
                    "ocr_variant": ocr_variant,
                    "lines": lines
                }
                write_debug_json(f"page_{idx+1}_ocr.json", page_ocr_data, debug_enabled)
                
                pages_lines.append(lines)
                attempts_list.append(ocr_variant)

            timings["ocr"] = ocr_times_sum

            # 2. Group pages by Register Number to support multi-student document packs
            from ocr.document_builder import merge_document_pages, estimate_page_height
            
            pages_reg_nos = []
            pages_reg_confs = []
            register_validation_log = []
            for idx, page_lines in enumerate(pages_lines):
                reg_no, reg_conf = detect_register_number(page_lines, page_height=estimate_page_height(page_lines), logger=None)
                pages_reg_nos.append(reg_no)
                pages_reg_confs.append(reg_conf)
                
                register_validation_log.append({
                    "page_index": idx + 1,
                    "raw_register": reg_no,
                    "confidence": reg_conf,
                    "is_valid": bool(reg_no),
                    "reason": "Successfully detected valid register number" if reg_no else "No valid register number candidate matched on this page"
                })
                
            groups = []
            current_group = None
            for idx, page_lines in enumerate(pages_lines):
                reg_no = pages_reg_nos[idx]
                if reg_no:
                    # If different from the previous group's register, start a new group
                    if current_group is None or reg_no != current_group["reg_no"]:
                        current_group = {
                            "reg_no": reg_no,
                            "pages_lines": [page_lines],
                            "page_indices": [idx]
                        }
                        groups.append(current_group)
                    else:
                        # Duplicate register number -> treat as continuation
                        current_group["pages_lines"].append(page_lines)
                        current_group["page_indices"].append(idx)
                else:
                    if current_group is not None:
                        current_group["pages_lines"].append(page_lines)
                        current_group["page_indices"].append(idx)
                    else:
                        current_group = {
                            "reg_no": None,
                            "pages_lines": [page_lines],
                            "page_indices": [idx]
                        }
                        groups.append(current_group)

            logger.info(f"Grouped {len(pages_lines)} pages into {len(groups)} student record documents.")
            
            # Helper for dynamic department and programme detection
            def detect_dept_prog(full_text):
                upper = full_text.upper()
                dept = "General"
                departments_map = {
                    "Computer Science and Engineering": [r"\bCOMPUTER SCIENCE\b", r"\bCSE\b"],
                    "Information Technology": [r"\bINFORMATION TECHNOLOGY\b", r"\bB\.?TECH\.?\s+IT\b"],
                    "Electrical and Electronics Engineering": [r"\bELECTRICAL\b", r"\bEEE\b"],
                    "Electronics and Communication Engineering": [r"\bELECTRONICS\b", r"\bECE\b"],
                    "Mechanical Engineering": [r"\bMECHANICAL\b", r"\bMECH\b"],
                    "Civil Engineering": [r"\bCIVIL\b"],
                    "Artificial Intelligence and Data Science": [r"\bARTIFICIAL\b", r"\bAI&DS\b", r"\bAI-DS\b", r"\bAD\b"],
                    "Master of Business Administration": [r"\bMASTER OF BUSINESS\b", r"\bMBA\b"],
                    "Master of Computer Applications": [r"\bMASTER OF COMPUTER APPLICATIONS\b", r"\bMCA\b"]
                }
                for d_name, patterns in departments_map.items():
                    if any(re.search(pat, upper) for pat in patterns):
                        dept = d_name
                        break
                prog = "B.E."
                if "B.TECH" in upper:
                    prog = "B.Tech"
                elif "MBA" in upper or "MASTER OF BUSINESS" in upper:
                    prog = "M.B.A."
                elif "MCA" in upper or "MASTER OF COMPUTER" in upper:
                    prog = "M.C.A."
                elif "M.E." in upper or "MASTER OF ENGINEERING" in upper:
                    prog = "M.E."
                return dept, prog
            
            results = []
            total_groups = len(groups)
            students_found = total_groups
            students_processed = 0
            total_subjects_extracted = 0
            
            # Summary statistics fields
            all_reg_nos = []
            all_names = []
            all_departments = []
            all_programmes = []
            all_semesters = set()
            all_detected_course_codes = []
            all_rows_data = []
            global_trace_audit_log = []

            for g_idx, group in enumerate(groups):
                group_reg_no = group.get("reg_no") or ""
                if job_id:
                    report_progress(job_id, g_idx, total_groups, group_reg_no, f"Parsing Student {g_idx+1} of {total_groups}", "processing", {
                        "currentPage": len(pages_lines),
                        "totalPages": len(pages_lines),
                        "studentsFound": students_found,
                        "studentsProcessed": students_processed,
                        "subjectsExtracted": total_subjects_extracted,
                        "currentSemester": fallback_sem
                    })
                    
                logger.info(f"Processing Student Group {g_idx + 1}/{len(groups)} (Register: {group['reg_no']}, Pages: {len(group['pages_lines'])})")
                
                # Merge the pages in this group
                t_merge_start = time.time()
                lines = merge_document_pages(group["pages_lines"], logger)
                timings["document_merge"] = timings.get("document_merge", 0.0) + (time.time() - t_merge_start)
                
                # Save merged document json (Stage 6)
                if debug_enabled:
                    write_debug_json("document.json", lines, debug_enabled)
                
                if not lines:
                    logger.warning(f"Student Group {g_idx + 1} has no text lines.")
                    results.append({
                        "success": False,
                        "error": "No text lines extracted for this student group",
                        "logs": logger.get_logs()
                    })
                    continue
                    
                # Compile full text for heuristics
                full_text = "\n".join(l["text"] for l in lines)
                doc_type = detect_document_type(full_text)
                logger.info(f"Detected document type: {doc_type}")
                
                # Match University Profile (Phase 14)
                from ocr.university_profiles import match_university_profile
                univ_profile = match_university_profile(full_text)
                logger.info(f"Matched University Profile: {univ_profile['name']}")
                
                # Student Info Extraction
                student_info = extract_student_info(full_text, logger)
                
                # Register Number
                first_page_height = estimate_page_height(group["pages_lines"][0]) if group["pages_lines"] else 1200.0
                reg_no, reg_conf = detect_register_number(lines, page_height=first_page_height, logger=logger)
                student_info["register_number"] = reg_no or group["reg_no"]
                student_info["reg_conf"] = reg_conf if reg_no else 1.0 if group["reg_no"] else 0.0
                
                # Semester Headings
                sem_headings = detect_page_semesters(lines, logger)
                if sem_headings:
                    student_info["semester"] = sem_headings[0]["semester"]
                else:
                    student_info["semester"] = fallback_sem
                    logger.warning(f"No semester headings found. Using fallback semester: {fallback_sem}")
                    
                # Group lines into horizontal rows using dynamic table layout alignment (Phase 14)
                t_cluster_start = time.time()
                logger.info("Grouping lines into horizontal rows using dynamic table alignment")
                from ocr.table_detector import align_table_rows
                rows = align_table_rows(lines, tolerance=14.0)
                timings["coordinate_clustering"] = timings.get("coordinate_clustering", 0.0) + (time.time() - t_cluster_start)
                logger.info(f"Clustered lines into {len(rows)} coordinate rows")
                
                # Collect row data for rows.json (Stage 3)
                if debug_enabled:
                    for r in rows:
                        all_rows_data.append({
                            "y_center": r["y_center"],
                            "count": r["count"],
                            "items": [{
                                "text": item.get("text", ""),
                                "x": item.get("x", 0.0),
                                "y": item.get("y", 0.0),
                                "w": item.get("w", 0.0),
                                "h": item.get("h", 0.0),
                                "tr_id": item.get("tr_id", ""),
                                "page_idx": item.get("page_idx", 0)
                            } for item in r["items"]]
                        })
                
                # Subject Builder
                t_parse_start = time.time()
                from ocr.subject_builder import detect_repeating_layout_lines
                repeating_texts = detect_repeating_layout_lines(group["pages_lines"])
                raw_subjects = build_subjects_from_rows(rows, student_info["semester"], logger, repeating_texts)
                logger.info(f"Reconstructed {len(raw_subjects)} subject records")
                
                # Fallback text parser
                if not raw_subjects and len(lines) > 5:
                    logger.warning("Primary coordinate parser extracted 0 rows. Invoking secondary text parser.")
                    raw_subjects = self._fallback_text_parser(lines, student_info["semester"], logger)
                timings["parsing"] = timings.get("parsing", 0.0) + (time.time() - t_parse_start)
                                   # Semester Inference
                from ocr.semester_detector import infer_semester_with_confidence
                inferred_sem, sem_conf = infer_semester_with_confidence(group["pages_lines"], raw_subjects, fallback_sem, logger)
                student_info["semester"] = inferred_sem
                student_info["semesterConfidence"] = sem_conf

                # Post-process, Validate, and Confidence Score
                t_val_start = time.time()
                final_subjects = []
                corrected_rows_count = 0
                for s in raw_subjects:
                    row_y = s.pop("y_center", 0.0)
                    inferred_sem = infer_semester_for_row(row_y, sem_headings, student_info["semester"])
                    if inferred_sem is not None:
                        s["semester"] = inferred_sem
                        
                    is_valid, errors, warnings = validate_subject_row(s)
                    token_confs = s.pop("token_confs", [])
                    score = calculate_row_confidence(s, token_confs, errors, warnings)
                    
                    # Handwriting & Signature Verification (Phase 14)
                    from ocr.handwriting_detector import detect_handwriting_and_stamps
                    grade_text = s.get("grade", "")
                    is_handwritten, hw_score = detect_handwriting_and_stamps(grade_text, score / 100.0)
                    if is_handwritten:
                        score = min(score, int(hw_score * 100))
                        warnings.append("Handwritten annotation or signature block detected on subject grade row")

                    s["confidence"] = score
                    s["errors"] = errors
                    s["warnings"] = warnings
                    
                    if not is_valid or warnings:
                        corrected_rows_count += 1
                        
                    # Phase A: Build structured confidence entities for subject
                    from ocr.confidence import build_confidence_entity
                    from ocr.grade_detector import VALID_GRADES
                    s["entities"] = {
                        "courseCode": build_confidence_entity(
                            value=s.get("courseCode", ""),
                            confidence=score,
                            source="OCR",
                            validation="VALID" if not errors else "NEEDS_REVIEW",
                            reasoning=["Extracted via layout coordinate row clustering"]
                        ),
                        "courseName": build_confidence_entity(
                            value=s.get("courseName", ""),
                            confidence=score,
                            source="OCR",
                            validation="VALID" if s.get("courseName") else "NEEDS_REVIEW",
                            reasoning=["Clustered from text bounding box metrics"]
                        ),
                        "grade": build_confidence_entity(
                            value=s.get("grade", ""),
                            confidence=100.0,
                            source="OCR",
                            validation="VALID" if s.get("grade") in VALID_GRADES else "NEEDS_REVIEW",
                            reasoning=["Matched against academic grade scale"]
                        ),
                        "credits": build_confidence_entity(
                            value=s.get("credits", 0),
                            confidence=95.0 if s.get("credits") else 50.0,
                            source="OCR",
                            validation="VALID" if s.get("credits") else "NEEDS_REVIEW",
                            reasoning=["Extracted from numeric credit columns"]
                        ),
                        "result": build_confidence_entity(
                            value=s.get("result", ""),
                            confidence=95.0,
                            source="OCR",
                            validation="VALID" if s.get("result") in ["P", "F", "AB"] else "NEEDS_REVIEW",
                            reasoning=["Derived from course grade mapping"]
                        )
                    }
                    final_subjects.append(s)
                    
                    # Accumulate for course_codes.json (Stage 4)
                    all_detected_course_codes.append({
                        "courseCode": s["courseCode"],
                        "confidence": score,
                        "code_pattern_score": s.get("code_pattern_score", 0.0)
                      })
                
                # Duplicate Course Codes Resolver (Phase 7)
                seen_codes_map = {}
                for s in final_subjects:
                    code = s.get("courseCode")
                    if code:
                        seen_codes_map.setdefault(code, []).append(s)
                
                for code, sub_list in seen_codes_map.items():
                    if len(sub_list) > 1:
                        grades = [item.get("grade", "") for item in sub_list]
                        results_set = [item.get("result", "") for item in sub_list]
                        has_fail = any(g in ["U", "RA", "AB"] or r == "F" for g, r in zip(grades, results_set))
                        has_pass = any(g not in ["U", "RA", "AB", ""] and r == "P" for g, r in zip(grades, results_set))
                        if has_fail and has_pass:
                            resolution_type = "ARREAR_ATTEMPT"
                            reason = "Multiple attempts detected for same course (failure and pass). Classifying as arrear attempt history."
                        else:
                            resolution_type = "DUPLICATE_ROW_MERGED"
                            reason = "Duplicate subject rows detected. Merged identical attempts."
                        global_duplicate_resolutions.append({
                            "courseCode": code,
                            "resolution": resolution_type,
                            "reason": reason,
                            "original_count": len(sub_list),
                            "details": [
                                {"grade": item.get("grade"), "result": item.get("result"), "page": item.get("page", 1)}
                                for item in sub_list
                            ]
                        })

                # Sequence Validator (Phase 6)
                from ocr.validator import validate_subject_sequence
                seq_warnings = validate_subject_sequence(final_subjects, logger)
                student_info["sequence_warnings"] = seq_warnings
                
                timings["validation"] = timings.get("validation", 0.0) + (time.time() - t_val_start)
                
                avg_page_conf = sum(l["conf"] for l in lines) / len(lines)
                logger.info(f"Completed student group extraction: {len(final_subjects)} subjects parsed, {corrected_rows_count} warning/review flags.")
                
                # Populate stats for summary
                if student_info.get("register_number"):
                    all_reg_nos.append(student_info["register_number"])
                if student_info.get("name"):
                    all_names.append(student_info["name"])
                
                dept, prog = detect_dept_prog(full_text)
                all_departments.append(dept)
                all_programmes.append(student_info.get("programme") or prog)
                for s in final_subjects:
                    if s.get("semester"):
                        all_semesters.add(int(s["semester"]))
                
                total_subjects_extracted += len(final_subjects)
                students_processed += 1
                
                if job_id:
                    report_progress(job_id, students_processed, total_groups, group_reg_no, "Completed Parse", "processing", {
                        "currentPage": len(pages_lines),
                        "totalPages": len(pages_lines),
                        "studentsFound": students_found,
                        "studentsProcessed": students_processed,
                        "subjectsExtracted": total_subjects_extracted,
                        "currentSemester": fallback_sem
                    })
                
                # ─────────────────────────────────────────────────────────
                # Local Information Loss & Trace Audit (Task 2, 5, 13)
                # ─────────────────────────────────────────────────────────
                from ocr.subject_builder import is_blocked_line
                extracted_line_ids = set()
                for sub in final_subjects:
                    for tid in sub.get("tr_ids", []):
                        extracted_line_ids.add(tid)
                        
                for line in lines:
                    line_id = line.get("tr_id")
                    if line_id and line_id not in extracted_line_ids:
                        text_val = line.get("text", "")
                        is_layout_line = is_blocked_line(text_val) or (repeating_texts and any(rep in text_val.lower() for rep in repeating_texts))
                        global_trace_audit_log.append({
                            "tr_id": line_id,
                            "text": text_val,
                            "last_successful_stage": "OCR_LINE_EXTRACTION",
                            "first_failed_stage": "COORDINATE_CLUSTERING",
                            "classification": "LAYOUT_HEADER_FOOTER_FILTER" if is_layout_line else "UNRESOLVED_TEXT_ROW",
                            "reason": "Filtered dynamically as header/footer" if is_layout_line else "Unresolved or skipped text content",
                            "confidence": float(line.get("conf", 1.0))
                        })
                        
                # Log any lost course codes (Task 5)
                from ocr.course_code_detector import detect_course_code
                extracted_codes = {sub["courseCode"] for sub in final_subjects}
                for line in lines:
                    code, score = detect_course_code(line.get("text", ""))
                    if code and code not in extracted_codes:
                        global_trace_audit_log.append({
                            "tr_id": line.get("tr_id"),
                            "text": line.get("text"),
                            "last_successful_stage": "COORDINATE_CLUSTERING",
                            "first_failed_stage": "SUBJECT_PARSER",
                            "classification": "LOST_IN_PARSER",
                            "reason": "Course code was recognized but row structure could not be parsed into a subject",
                            "confidence": score
                        })

                # Pick the dominant ocr_variant for this group
                selected_variant = attempts_list[group["page_indices"][0]]
                
                from ocr.course_code_detector import detect_course_code
                # Phase A: Build structured confidence entities for student info
                from ocr.confidence import build_confidence_entity
                student_info["entities"] = {
                    "student_name": build_confidence_entity(
                        value=student_info.get("name", student_info.get("student_name", "Unknown")),
                        confidence=100.0 if (student_info.get("name") or student_info.get("student_name")) else 0.0,
                        source="OCR",
                        validation="VALID" if (student_info.get("name") or student_info.get("student_name")) else "NEEDS_REVIEW",
                        reasoning=["Extracted via name heading regex matches"]
                    ),
                    "register_number": build_confidence_entity(
                        value=student_info.get("register_number", ""),
                        confidence=float(student_info.get("reg_conf", 1.0) * 100.0),
                        source="OCR",
                        validation="VALID" if student_info.get("reg_conf", 0.0) >= 0.70 else "NEEDS_REVIEW",
                        reasoning=["Extracted via register pattern coordinate scanner"]
                    ),
                    "semester": build_confidence_entity(
                        value=student_info.get("semester", fallback_sem),
                        confidence=float(student_info.get("semesterConfidence", 0.70) * 100.0),
                        source="INFERRED",
                        validation="VALID" if student_info.get("semesterConfidence", 0.70) >= 0.60 else "NEEDS_REVIEW",
                        reasoning=["Inferred from course prefixes and heading signals"]
                    ),
                    "programme": build_confidence_entity(
                        value=student_info.get("programme", ""),
                        confidence=85.0 if student_info.get("programme") else 0.0,
                        source="OCR",
                        validation="VALID" if student_info.get("programme") else "NEEDS_REVIEW",
                        reasoning=["Matched layout department/programme keywords"]
                    )
                }

                # Document Type & Language Classifier (Phase 15)
                from ocr.document_classifier import classify_document, detect_languages
                document_category = classify_document(full_text)
                document_language = detect_languages(full_text)

                results.append({
                    "success": True,
                    "document_type": document_category if document_category != "Unknown" else doc_type,
                    "document_language": document_language,
                    "student_info": student_info,
                    "subjects": final_subjects,

                    "candidate_metadata": {
                        "source_pages": [p_idx + 1 for p_idx in group["page_indices"]],
                        "pageIndexes": [p_idx + 1 for p_idx in group["page_indices"]],
                        "pageStart": group["page_indices"][0] + 1,
                        "pageEnd": group["page_indices"][-1] + 1,
                        "groupConfidence": round(float(
                            (student_info.get("reg_conf", 0.0) + 
                             (1.0 if student_info.get("student_name") or student_info.get("name") else 0.0) +
                             (1.0 if len(group["page_indices"]) == 1 else 0.9)) / 3.0
                        ), 4),
                        "confidence": {
                            "register_confidence": float(student_info.get("reg_conf", 0.0)),
                            "name_confidence": 1.0 if student_info.get("student_name") or student_info.get("name") else 0.0,
                            "boundary_confidence": 1.0 if len(group["page_indices"]) == 1 else 0.9,
                            "overall_confidence": round(float(
                                (student_info.get("reg_conf", 0.0) + 
                                 (1.0 if student_info.get("student_name") or student_info.get("name") else 0.0) +
                                 (1.0 if len(group["page_indices"]) == 1 else 0.9)) / 3.0
                            ), 4)
                        }
                    },
                    "ocr_meta": {
                        "avg_conf": round(avg_page_conf, 4),
                        "line_count": len(lines),
                        "attempts": attempts_list,
                        "selected": selected_variant,
                        "page_indices": group["page_indices"],
                        "integrity_telemetry": {
                            "ocr_lines": len(lines),
                            "detected_course_codes": len([line for line in lines if detect_course_code(line.get("text", ""))[0]]),
                            "logical_rows": len(rows),
                            "subject_objects": len(raw_subjects),
                            "validated_subjects": len(final_subjects)
                        }
                    },
                    "raw_text": full_text,
                    "logs": logger.get_logs()
                })
                
            # Write final debug files (Stage 1, 3, 4, 9, 11)
            # Stage 1: pdf_summary.json
            page_types = {}
            for idx, page_lines in enumerate(pages_lines):
                is_digital = attempts_list[idx] == "pdfplumber"
                page_types[str(idx + 1)] = "digital" if is_digital else "scanned"
                
            pdf_summary = {
                "total_pages": len(pages_lines),
                "total_students": len(groups),
                "register_numbers": list(set(filter(None, all_reg_nos))),
                "candidate_names": list(set(filter(None, all_names))),
                "departments": list(set(all_departments)),
                "programmes": list(set(all_programmes)),
                "semester_distribution": {str(sem): list(all_semesters).count(sem) for sem in all_semesters},
                "total_subjects": total_subjects_extracted,
                "page_types": page_types
            }
            write_debug_json("pdf_summary.json", pdf_summary, debug_enabled)
            
            # Write candidate segmentation and register validation diagnostics
            candidate_segmentation = []
            for g_idx, group in enumerate(groups):
                res_item = next((r for r in results if r["success"] and r["student_info"].get("register_number") == group["reg_no"]), None)
                meta = res_item.get("candidate_metadata") if res_item else {}
                candidate_segmentation.append({
                    "student_index": g_idx + 1,
                    "register_number": group["reg_no"],
                    "page_indices": group["page_indices"],
                    "source_pages": [p_idx + 1 for p_idx in group["page_indices"]],
                    "metadata": meta
                })
            write_debug_json("candidate_segmentation.json", candidate_segmentation, debug_enabled)
            write_debug_json("register_validation.json", register_validation_log, debug_enabled)
            
            # Stage 3: row_clusters.json & rows.json
            if debug_enabled:
                write_debug_json("row_clusters.json", all_rows_data, debug_enabled)
                write_debug_json("rows.json", all_rows_data, debug_enabled)
                
            # Stage 4: course_codes.json
            write_debug_json("course_codes.json", all_detected_course_codes, debug_enabled)
            
            # Stage 9: subjects.json
            all_extracted_subjects = []
            for r in results:
                if r.get("success"):
                    all_extracted_subjects.extend(r.get("subjects", []))
            write_debug_json("subjects.json", all_extracted_subjects, debug_enabled)
            
            # Stage 11: timing.json
            timings["total_processing_time"] = time.time() - t_start
            write_debug_json("timing.json", timings, debug_enabled)
            
            # Quality Metrics Report (Phase 8) & Trace Audit Log (Task 2 & 5)
            parsing_accuracy = 1.0
            if len(all_detected_course_codes) > 0:
                parsing_accuracy = total_subjects_extracted / max(1, len(all_detected_course_codes))
                
            # Aggregate QA metrics parameters
            all_grade_confs = []
            all_sem_confs = []
            all_group_confs = []
            total_warnings = 0
            total_errors = 0
            
            for r in results:
                if r.get("success"):
                    meta = r.get("candidate_metadata", {})
                    all_group_confs.append(meta.get("groupConfidence", 1.0))
                    
                    student_info = r.get("student_info", {})
                    all_sem_confs.append(student_info.get("semesterConfidence", 1.0))
                    
                    for s in r.get("subjects", []):
                        all_grade_confs.append(s.get("gradeConfidence", 1.0))
                        total_warnings += len(s.get("warnings", []))
                        total_errors += len(s.get("errors", []))
            
            resources = get_resource_usage()
            
            avg_ocr_conf_sum = 0.0
            for idx in range(len(pages_lines)):
                lines = pages_lines[idx]
                avg_ocr_conf_sum += sum(l["conf"] for l in lines) / max(1, len(lines)) if lines else 0.0
            avg_ocr_conf = round(avg_ocr_conf_sum / max(1, len(pages_lines)), 4)
            
            qa_metrics_report = {
                "quality_metrics": {
                    "extraction_accuracy": round(parsing_accuracy, 4),
                    "average_confidence": round(sum(c["confidence"] for c in all_detected_course_codes) / max(1, len(all_detected_course_codes)), 4) if all_detected_course_codes else 1.0,
                    "average_grade_confidence": round(sum(all_grade_confs) / max(1, len(all_grade_confs)), 4) if all_grade_confs else 1.0,
                    "average_semester_confidence": round(sum(all_sem_confs) / max(1, len(all_sem_confs)), 4) if all_sem_confs else 1.0,
                    "average_grouping_confidence": round(sum(all_group_confs) / max(1, len(all_group_confs)), 4) if all_group_confs else 1.0,
                    "average_ocr_confidence": avg_ocr_conf,
                    "average_processing_time_seconds": round((time.time() - t_start) / max(1, len(groups)), 4) if groups else 0.0,
                    "memory_usage_mb": resources["memory_usage_mb"],
                    "cpu_percent": resources["cpu_percent"],
                    "total_pages": len(pages_lines),
                    "total_students": len(groups),
                    "total_subjects": total_subjects_extracted,
                    "duplicate_rows": len([x for x in global_trace_audit_log if x["classification"] == "LOST_IN_PARSER"]),
                    "missing_rows": len([x for x in global_trace_audit_log if x["classification"] == "UNRESOLVED_TEXT_ROW"]),
                    "warnings": total_warnings,
                    "errors": total_errors
                },
                "latency_benchmarks": timings,
                "error_distribution": {
                    "LAYOUT_HEADER_FOOTER_FILTER": len([x for x in global_trace_audit_log if x["classification"] == "LAYOUT_HEADER_FOOTER_FILTER"]),
                    "LOST_IN_PARSER": len([x for x in global_trace_audit_log if x["classification"] == "LOST_IN_PARSER"]),
                    "UNRESOLVED_TEXT_ROW": len([x for x in global_trace_audit_log if x["classification"] == "UNRESOLVED_TEXT_ROW"])
                }
            }
            # Phase C: Generate layout fingerprint
            from ocr.layout_fingerprinter import generate_layout_fingerprint
            generate_layout_fingerprint(pages_lines, all_rows_data, debug_enabled)

            from ocr.validator import run_production_validation_suite
            val_report = run_production_validation_suite(results, pages_lines, logger)
            
            # Phase K: Run AI Quality Inspector
            from ocr.quality_inspector import run_quality_inspector
            inspector_report = run_quality_inspector(results, debug_enabled=False)

            # Report Manager Consolidations (Recommendation)
            from ocr.report_manager import compile_consolidated_reports
            compile_consolidated_reports(
                results=results,
                pages_lines=pages_lines,
                timings=timings,
                qa_metrics=qa_metrics_report,
                duplicate_resolutions=global_duplicate_resolutions,
                trace_log=global_trace_audit_log,
                validation_report=val_report,
                quality_report=inspector_report,
                debug_enabled=debug_enabled
            )
            
            # Run Continuation Validation Engine (Phase 21)
            try:
                from ocr.continuation_validator import ContinuationValidator
                ContinuationValidator.validate(results)
            except Exception as ex:
                logger.error(f"[ContinuationValidator] Failed during validation: {ex}")
            
            return results
            
        except Exception as e:
            logger.error(f"Pipeline process_document encountered error: {e}")
            logger.error(traceback.format_exc())
            return [{
                "success": False,
                "error": str(e),
                "logs": logger.get_logs()
            }]

def get_resource_usage():
    try:
        import os
        import psutil
        process = psutil.Process(os.getpid())
        return {
            "memory_usage_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "cpu_percent": process.cpu_percent(interval=None)
        }
    except Exception:
        return {"memory_usage_mb": 0.0, "cpu_percent": 0.0}

