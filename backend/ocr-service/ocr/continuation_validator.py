# backend/ocr-service/ocr/continuation_validator.py
import os
import json
import logging
from ocr.ocr_config import OCRConfig

logger = logging.getLogger("ContinuationValidator")

class ContinuationValidator:
    @classmethod
    def validate(cls, student_groups):
        """
        Validates page chains, subject counts, duplicate pages, and student boundaries.
        Input: list of student dictionary records containing:
          - register_number
          - student_name
          - pages (list of page dicts or numbers)
          - subjects
        """
        student_reports = []
        total_students = len(student_groups)
        complete_count = 0
        review_count = 0
        broken_count = 0
        total_pages = 0
        total_missing = 0
        total_duplicates = 0

        for record in student_groups:
            reg_no = record.get("register_number") or record.get("registerNo") or "Unknown"
            name = record.get("student_name") or record.get("studentName") or "Unknown"
            subjects = record.get("subjects") or []
            
            # Map page indexes
            pages_list = record.get("pages_list") or []
            if not pages_list:
                pages_list = [1] # Default to page 1 if single page
            
            total_pages += len(pages_list)
            
            # Deduplicate and sort pages
            seen_pages = set()
            duplicates = []
            for p in pages_list:
                if p in seen_pages:
                    duplicates.append(p)
                else:
                    seen_pages.add(p)
            
            total_duplicates += len(duplicates)
            
            # Find missing pages in range
            missing_pages = []
            if len(seen_pages) > 1:
                min_p = min(seen_pages)
                max_p = max(seen_pages)
                for p in range(min_p, max_p + 1):
                    if p not in seen_pages:
                        missing_pages.append(p)
            
            total_missing += len(missing_pages)

            # Integrity score calculation
            integrity_score = 100
            warnings = []
            
            # Deduct for missing pages
            if missing_pages:
                integrity_score -= len(missing_pages) * 25
                warnings.append(f"Missing continuation page(s): {missing_pages}")
            
            # Deduct for duplicates
            if duplicates:
                integrity_score -= len(duplicates) * 20
                warnings.append(f"Duplicate continuation page(s) detected: {duplicates}")

            # Register number boundary checks
            conflicting_regs = record.get("conflicting_registers") or []
            if conflicting_regs:
                integrity_score -= len(conflicting_regs) * 50
                warnings.append(f"Student boundary conflict: mixed registers {conflicting_regs}")

            # Subject count checks
            subject_mismatch = record.get("subject_count_mismatch", False)
            if subject_mismatch:
                integrity_score -= 15
                warnings.append("SUBJECT_COUNT_MISMATCH: extracted subjects deviate from expectations")

            # Low confidence checks
            low_conf_subjects = [s for s in subjects if s.get("confidence", 1.0) < OCRConfig.MIN_CONFIDENCE]
            if low_conf_subjects:
                integrity_score -= len(low_conf_subjects) * 5
                warnings.append(f"Low confidence subject extractions: {len(low_conf_subjects)} courses")

            # Clamp score
            integrity_score = max(0, min(100, integrity_score))

            # Determine status (Phase 21 status guidelines)
            if duplicates or conflicting_regs:
                status = "BROKEN"
                broken_count += 1
            elif missing_pages or subject_mismatch or integrity_score < 80:
                status = "REVIEW_REQUIRED"
                review_count += 1
            elif integrity_score > 95 and not warnings:
                status = "COMPLETE"
                complete_count += 1
            else:
                status = "PARTIAL"
                complete_count += 1

            student_reports.append({
                "registerNo": reg_no,
                "studentName": name,
                "pages": sorted(list(seen_pages)),
                "pageCount": len(pages_list),
                "expectedPages": len(pages_list) + len(missing_pages),
                "subjects": len(subjects),
                "duplicates": len(duplicates),
                "missingPages": missing_pages,
                "integrityScore": integrity_score,
                "status": status,
                "warnings": warnings
            })

            # Decorate the original record with integrity payload
            record["integrity"] = {
                "status": status,
                "score": integrity_score,
                "pages": sorted(list(seen_pages)),
                "warnings": warnings
            }

        # Write reports
        debug_dir = OCRConfig.DEBUG_DIR
        os.makedirs(debug_dir, exist_ok=True)
        
        # Write individual students reports
        with open(os.path.join(debug_dir, "student_integrity_report.json"), "w", encoding="utf-8") as f:
            json.dump(student_reports, f, indent=2, ensure_ascii=False)

        # Write overall summary report
        pipeline_status = "PASS" if broken_count == 0 else "FAIL"
        summary = {
            "students": total_students,
            "complete": complete_count,
            "review": review_count,
            "broken": broken_count,
            "pages": total_pages,
            "missingPages": total_missing,
            "duplicates": total_duplicates,
            "pipelineStatus": pipeline_status
        }
        with open(os.path.join(debug_dir, "pdf_integrity_summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        return summary
