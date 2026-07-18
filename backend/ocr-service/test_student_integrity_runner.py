# backend/ocr-service/test_student_integrity_runner.py
import sys
import unittest
from ocr.continuation_validator import ContinuationValidator

class TestStudentContinuationChain(unittest.TestCase):
    def test_case_1_single_page(self):
        # Case 1: One page
        data = [{
            "register_number": "73152313001",
            "student_name": "Student One",
            "pages_list": [1],
            "subjects": [{"courseCode": "20CS601"}]
        }]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["students"], 1)
        self.assertEqual(res["complete"], 1)
        self.assertEqual(res["pipelineStatus"], "PASS")

    def test_case_2_two_pages(self):
        # Case 2: Two pages
        data = [{
            "register_number": "73152313002",
            "student_name": "Student Two",
            "pages_list": [1, 2],
            "subjects": [{"courseCode": "20CS601"}]
        }]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["complete"], 1)
        self.assertEqual(res["pipelineStatus"], "PASS")

    def test_case_3_three_pages(self):
        # Case 3: Three pages
        data = [{
            "register_number": "73152313003",
            "student_name": "Student Three",
            "pages_list": [1, 2, 3],
            "subjects": [{"courseCode": "20CS601"}]
        }]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["complete"], 1)

    def test_case_4_five_pages(self):
        # Case 4: Five pages
        data = [{
            "register_number": "73152313004",
            "student_name": "Student Four",
            "pages_list": [1, 2, 3, 4, 5],
            "subjects": [{"courseCode": "20CS601"}]
        }]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["complete"], 1)

    def test_case_5_mixed_document(self):
        # Case 5: Mixed document
        data = [
            {"register_number": "73152313005", "pages_list": [1, 2], "subjects": [{"courseCode": "20CS601"}]},
            {"register_number": "73152313006", "pages_list": [3], "subjects": [{"courseCode": "20CS602"}]},
            {"register_number": "73152313007", "pages_list": [4, 5, 6, 7], "subjects": [{"courseCode": "20CS603"}]}
        ]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["complete"], 3)
        self.assertEqual(res["pipelineStatus"], "PASS")

    def test_case_6_missing_continuation_page(self):
        # Case 6: Missing page index 2 in range 1-3
        data = [{
            "register_number": "73152313008",
            "student_name": "Student Six",
            "pages_list": [1, 3],
            "subjects": [{"courseCode": "20CS601"}]
        }]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["review"], 1)
        self.assertEqual(data[0]["integrity"]["status"], "REVIEW_REQUIRED")

    def test_case_7_duplicate_continuation_page(self):
        # Case 7: Duplicate index 2
        data = [{
            "register_number": "73152313009",
            "student_name": "Student Seven",
            "pages_list": [1, 2, 2, 3],
            "subjects": [{"courseCode": "20CS601"}]
        }]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["broken"], 1)
        self.assertEqual(data[0]["integrity"]["status"], "BROKEN")

    def test_case_8_wrong_register_merge(self):
        # Case 8: Mixed/conflicting register numbers inside boundary
        data = [{
            "register_number": "73152313010",
            "student_name": "Student Eight",
            "pages_list": [1, 2],
            "conflicting_registers": ["73152313011"],
            "subjects": [{"courseCode": "20CS601"}]
        }]
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["broken"], 1)
        self.assertEqual(data[0]["integrity"]["status"], "BROKEN")

    def test_case_9_large_pdf(self):
        # Case 9: 100 students
        data = []
        for i in range(100):
            data.append({
                "register_number": f"73152313{i:03d}",
                "student_name": f"Student {i}",
                "pages_list": [i + 1],
                "subjects": [{"courseCode": "20CS601"}]
            })
        res = ContinuationValidator.validate(data)
        self.assertEqual(res["students"], 100)
        self.assertEqual(res["complete"], 100)
        self.assertEqual(res["pipelineStatus"], "PASS")

if __name__ == '__main__':
    unittest.main()
