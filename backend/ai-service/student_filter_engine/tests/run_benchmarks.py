import time
import os
import sys

# Ensure backend/ai-service is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from student_filter_engine.engine import filter_students

TEST_PROMPTS = [
    # --- Category 1: Departments (10 prompts) ---
    {
        "prompt": "CSE students",
        "expected_filters": {"department": "CSE"},
        "expected_columns": []
    },
    {
        "prompt": "show me mechanical engineering department",
        "expected_filters": {"department": "MECH"},
        "expected_columns": []
    },
    {
        "prompt": "IT department students",
        "expected_filters": {"department": "IT"},
        "expected_columns": []
    },
    {
        "prompt": "ECE branch profiles",
        "expected_filters": {"department": "ECE"},
        "expected_columns": []
    },
    {
        "prompt": "find EEE records",
        "expected_filters": {"department": "EEE"},
        "expected_columns": []
    },
    {
        "prompt": "civil engineering list",
        "expected_filters": {"department": "CIVIL"},
        "expected_columns": []
    },
    {
        "prompt": "CSD students",
        "expected_filters": {"department": "CSD"},
        "expected_columns": []
    },
    {
        "prompt": "information technology graduates",
        "expected_filters": {"department": "IT"},
        "expected_columns": []
    },
    {
        "prompt": "show computer science students",
        "expected_filters": {"department": "CSE"},
        "expected_columns": []
    },
    {
        "prompt": "electronics students",
        "expected_filters": {"department": "ECE"},
        "expected_columns": []
    },

    # --- Category 2: Academic Benchmarks (12 prompts) ---
    {
        "prompt": "CGPA above 8",
        "expected_filters": {"cgpaMin": 8.0},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "gpa below 7.5",
        "expected_filters": {"cgpaMax": 7.5},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "students with cgpa between 7 and 9",
        "expected_filters": {"cgpaMin": 7.0, "cgpaMax": 9.0},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "10th percentage above 85",
        "expected_filters": {"tenthMin": 85.0},
        "expected_columns": ["tenthPercentage"]
    },
    {
        "prompt": "twelfth score above 90",
        "expected_filters": {"twelfthMin": 90.0},
        "expected_columns": ["twelfthPercentage"]
    },
    {
        "prompt": "cgpa >= 8.5",
        "expected_filters": {"cgpaMin": 8.5},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "students having gpa less than 6.0",
        "expected_filters": {"cgpaMax": 6.0},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "10th marks >= 75%",
        "expected_filters": {"tenthMin": 75.0},
        "expected_columns": ["tenthPercentage"]
    },
    {
        "prompt": "12th percentage greater than 80",
        "expected_filters": {"twelfthMin": 80.0},
        "expected_columns": ["twelfthPercentage"]
    },
    {
        "prompt": "excellent academic records cgpa above 9.0",
        "expected_filters": {"cgpaMin": 9.0},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "gpa at least 7.0",
        "expected_filters": {"cgpaMin": 7.0},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "students below 8 gpa",
        "expected_filters": {"cgpaMax": 8.0},
        "expected_columns": ["cgpa"]
    },

    # --- Category 3: Arrear / Backlog Queries (12 prompts) ---
    {
        "prompt": "no backlogs",
        "expected_filters": {"hasBacklogs": False, "backlogCountMax": 0},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "students with backlogs",
        "expected_filters": {"hasBacklogs": True},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "more than 2 backlogs",
        "expected_filters": {"hasBacklogs": True, "backlogCountMin": 3},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "exactly 0 backlogs",
        "expected_filters": {"hasBacklogs": False, "backlogCountMax": 0},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "having active arrears",
        "expected_filters": {"hasBacklogs": True},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "students with zero arrears",
        "expected_filters": {"hasBacklogs": False, "backlogCountMax": 0},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "students having 3 arrears",
        "expected_filters": {"hasBacklogs": True, "backlogCountMin": 3, "backlogCountMax": 3},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "clean profile no active arrears",
        "expected_filters": {"hasBacklogs": False, "backlogCountMax": 0},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "students having more than 5 arrears",
        "expected_filters": {"hasBacklogs": True, "backlogCountMin": 6},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "students with active backlog",
        "expected_filters": {"hasBacklogs": True},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "all clear records",
        "expected_filters": {"hasBacklogs": False, "backlogCountMax": 0},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "students with 1 backlog",
        "expected_filters": {"hasBacklogs": True, "backlogCountMin": 1, "backlogCountMax": 1},
        "expected_columns": ["backlogs"]
    },

    # --- Category 4: Placement & Packages (12 prompts) ---
    {
        "prompt": "placed students",
        "expected_filters": {"isPlaced": True},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "unplaced students",
        "expected_filters": {"isPlaced": False},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "placed in TCS",
        "expected_filters": {"isPlaced": True, "placedCompany": "TCS"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "students placed at Zoho",
        "expected_filters": {"isPlaced": True, "placedCompany": "ZOHO"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "package above 6 LPA",
        "expected_filters": {"isPlaced": True, "packageMin": 6.0},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "placed students with package greater than 10",
        "expected_filters": {"isPlaced": True, "packageMin": 10.0},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "not placed yet",
        "expected_filters": {"isPlaced": False},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "got job in CTS",
        "expected_filters": {"isPlaced": True, "placedCompany": "CTS"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "salary above 5 lpa",
        "expected_filters": {"isPlaced": True, "packageMin": 5.0},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "placed at Wipro",
        "expected_filters": {"isPlaced": True, "placedCompany": "WIPRO"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "unplaced profiles",
        "expected_filters": {"isPlaced": False},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "CTC above 8 LPA",
        "expected_filters": {"isPlaced": True, "packageMin": 8.0},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },

    # --- Category 5: Attendance & Drives (10 prompts) ---
    {
        "prompt": "attended more than 5 drives",
        "expected_filters": {"driveCountMin": 6},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "attended 0 drives",
        "expected_filters": {"driveCountMax": 0},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "drives attended >= 3",
        "expected_filters": {"driveCountMin": 3},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "not attended any drives",
        "expected_filters": {"driveCountMax": 0},
        "expected_columns": ["driveCount"]
    },
    {
        "prompt": "drives attended at least 2",
        "expected_filters": {"driveCountMin": 2},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "less than 3 drives attended",
        "expected_filters": {"driveCountMax": 2},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "no drives attended",
        "expected_filters": {"driveCountMax": 0},
        "expected_columns": ["driveCount"]
    },
    {
        "prompt": "active in drives attended above 1",
        "expected_filters": {"driveCountMin": 2},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "drives below 5",
        "expected_filters": {"driveCountMax": 4},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "attended at least 4 drives",
        "expected_filters": {"driveCountMin": 4},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },

    # --- Category 6: Year & Batch & Semester (10 prompts) ---
    {
        "prompt": "final year students",
        "expected_filters": {"currentYear": "IV"},
        "expected_columns": []
    },
    {
        "prompt": "third year students",
        "expected_filters": {"currentYear": "III"},
        "expected_columns": []
    },
    {
        "prompt": "first year profiles",
        "expected_filters": {"currentYear": "I"},
        "expected_columns": []
    },
    {
        "prompt": "2022-2026 batch",
        "expected_filters": {"batch": "2022-2026"},
        "expected_columns": []
    },
    {
        "prompt": "semester 5 records",
        "expected_filters": {"currentSemester": "5"},
        "expected_columns": []
    },
    {
        "prompt": "second year students",
        "expected_filters": {"currentYear": "II"},
        "expected_columns": []
    },
    {
        "prompt": "sem 7 students",
        "expected_filters": {"currentSemester": "7"},
        "expected_columns": []
    },
    {
        "prompt": "3rd sem ECE",
        "expected_filters": {"currentSemester": "3", "department": "ECE"},
        "expected_columns": []
    },
    {
        "prompt": "2023 batch CSE",
        "expected_filters": {"batch": "2019-2023", "department": "CSE"},
        "expected_columns": []
    },
    {
        "prompt": "4th year IT",
        "expected_filters": {"currentYear": "IV", "department": "IT"},
        "expected_columns": []
    },

    # --- Category 7: Sorting & Metrics (10 prompts) ---
    {
        "prompt": "highest package students",
        "expected_filters": {"isPlaced": True, "sortBy": "package", "sortOrder": "desc"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "top students",
        "expected_filters": {"sortBy": "cgpa", "sortOrder": "desc"},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "lowest cgpa",
        "expected_filters": {"sortBy": "cgpa", "sortOrder": "asc"},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "lowest package",
        "expected_filters": {"isPlaced": True, "sortBy": "package", "sortOrder": "asc"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "highest salary placed from CSE",
        "expected_filters": {"isPlaced": True, "department": "CSE", "sortBy": "package", "sortOrder": "desc"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "academic toppers in final year",
        "expected_filters": {"currentYear": "IV", "sortBy": "cgpa", "sortOrder": "desc"},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "minimum salary offered",
        "expected_filters": {"isPlaced": True, "sortBy": "package", "sortOrder": "asc"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "rank holders in IT",
        "expected_filters": {"department": "IT", "sortBy": "cgpa", "sortOrder": "desc"},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "maximum package offered at Zoho",
        "expected_filters": {"isPlaced": True, "placedCompany": "ZOHO", "sortBy": "package", "sortOrder": "desc"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "sort by cgpa descending",
        "expected_filters": {"sortBy": "cgpa", "sortOrder": "desc"},
        "expected_columns": ["cgpa"]
    },

    # --- Category 8: Skills & Profile Status (12 prompts) ---
    {
        "prompt": "skilled in Python",
        "expected_filters": {"skills": "python"},
        "expected_columns": ["skills"]
    },
    {
        "prompt": "knows Java",
        "expected_filters": {"skills": "java"},
        "expected_columns": ["skills"]
    },
    {
        "prompt": "knows python and javascript",
        "expected_filters": {"skills": "python, javascript"},
        "expected_columns": ["skills"]
    },
    {
        "prompt": "blocked students",
        "expected_filters": {"isBlocked": True},
        "expected_columns": ["blocked"]
    },
    {
        "prompt": "active students",
        "expected_filters": {"isBlocked": False},
        "expected_columns": ["blocked"]
    },
    {
        "prompt": "CSE students who know React",
        "expected_filters": {"department": "CSE", "skills": "react"},
        "expected_columns": ["skills"]
    },
    {
        "prompt": "unblocked final year profiles",
        "expected_filters": {"isBlocked": False, "currentYear": "IV"},
        "expected_columns": ["blocked"]
    },
    {
        "prompt": "experience in docker",
        "expected_filters": {"skills": "docker"},
        "expected_columns": ["skills"]
    },
    {
        "prompt": "proficient in c++",
        "expected_filters": {"skills": "c++"},
        "expected_columns": ["skills"]
    },
    {
        "prompt": "blocked ECE records",
        "expected_filters": {"department": "ECE", "isBlocked": True},
        "expected_columns": ["blocked"]
    },
    {
        "prompt": "students who know dsa",
        "expected_filters": {"skills": "dsa"},
        "expected_columns": ["skills"]
    },
    {
        "prompt": "knows springboot and mysql",
        "expected_filters": {"skills": "springboot, mysql"},
        "expected_columns": ["skills"]
    },

    # --- Category 9: Combined & Natural Language (12 prompts) ---
    {
        "prompt": "CSE students with CGPA above 8",
        "expected_filters": {"department": "CSE", "cgpaMin": 8.0},
        "expected_columns": ["cgpa"]
    },
    {
        "prompt": "unplaced final year students",
        "expected_filters": {"isPlaced": False, "currentYear": "IV"},
        "expected_columns": ["placementStatus", "placedCompany", "package"]
    },
    {
        "prompt": "CSE students with cgpa above 8 and no backlogs",
        "expected_filters": {"department": "CSE", "cgpaMin": 8.0, "hasBacklogs": False, "backlogCountMax": 0},
        "expected_columns": ["cgpa", "backlogs"]
    },
    {
        "prompt": "Show me placed students from TCS with cgpa > 7.5",
        "expected_filters": {"isPlaced": True, "placedCompany": "TCS", "cgpaMin": 7.5},
        "expected_columns": ["placementStatus", "placedCompany", "package", "cgpa"]
    },
    {
        "prompt": "Show me students who are likely eligible for product companies",
        "expected_filters": {"cgpaMin": 8.0, "hasBacklogs": False, "skills": "DSA"},
        "expected_columns": ["cgpa", "backlogs", "skills"]
    },
    {
        "prompt": "mass recruiter eligible ECE students",
        "expected_filters": {"department": "ECE", "cgpaMin": 6.0, "hasBacklogs": False},
        "expected_columns": ["cgpa", "backlogs"]
    },
    {
        "prompt": "final year unplaced ECE students with cgpa above 7.0 and no active backlogs",
        "expected_filters": {"currentYear": "IV", "isPlaced": False, "department": "ECE", "cgpaMin": 7.0, "hasBacklogs": False},
        "expected_columns": ["placementStatus", "placedCompany", "package", "cgpa", "backlogs"]
    },
    {
        "prompt": "female CSE students from Chennai",
        "expected_filters": {"gender": "Female", "department": "CSE", "city": "Chennai"},
        "expected_columns": []
    },
    {
        "prompt": "students living in Coimbatore with backlog above 2",
        "expected_filters": {"city": "Coimbatore", "hasBacklogs": True, "backlogCountMin": 3},
        "expected_columns": ["backlogs"]
    },
    {
        "prompt": "blocked female IT students in third year",
        "expected_filters": {"isBlocked": True, "gender": "Female", "department": "IT", "currentYear": "III"},
        "expected_columns": ["blocked"]
    },
    {
        "prompt": "register number 202201 records",
        "expected_filters": {"regNo": "202201"},
        "expected_columns": []
    },
    {
        "prompt": "find student John",
        "expected_filters": {"name": "john"},
        "expected_columns": []
    },
    {
        "prompt": "students who attended 8 drives and above",
        "expected_filters": {"driveCountMin": 8},
        "expected_columns": ["driveCount", "lastDriveDate"]
    },
    {
        "prompt": "students who have not uploaded profile photo yet",
        "expected_filters": {"hasProfilePic": False},
        "expected_columns": ["hasProfilePic"]
    },
    {
        "prompt": "placed students with profile picture",
        "expected_filters": {"isPlaced": True, "hasProfilePic": True},
        "expected_columns": ["placementStatus", "placedCompany", "package", "hasProfilePic"]
    },
    {
        "prompt": "first graduate students",
        "expected_filters": {"firstGraduate": "Yes"},
        "expected_columns": ["firstGraduate"]
    },
    {
        "prompt": "students willing to sign bond",
        "expected_filters": {"willingToSignBond": "Yes"},
        "expected_columns": ["willingToSignBond"]
    },
    {
        "prompt": "dayscholar students in third year",
        "expected_filters": {"residentialStatus": "Dayscholar", "currentYear": "III"},
        "expected_columns": ["residentialStatus"]
    },
    {
        "prompt": "management quota profiles",
        "expected_filters": {"quota": "Management"},
        "expected_columns": ["quota"]
    },
    {
        "prompt": "students with hybrid mode preferred",
        "expected_filters": {"preferredModeOfDrive": "Hybrid"},
        "expected_columns": ["preferredModeOfDrive"]
    }
]

def run_benchmarks():
    print("==========================================================")
    print("        STUDENT AI FILTER ENGINE BENCHMARK SUITE")
    print("==========================================================")
    print(f"Total test cases to execute: {len(TEST_PROMPTS)}")
    print("Running evaluations...\n")

    passed_count = 0
    total_time = 0.0

    for idx, tc in enumerate(TEST_PROMPTS, 1):
        prompt = tc["prompt"]
        expected_filters = tc["expected_filters"]
        expected_columns = tc["expected_columns"]

        start_time = time.perf_counter()
        result = filter_students(prompt)
        elapsed = (time.perf_counter() - start_time) * 1000.0  # in ms
        total_time += elapsed

        actual_filters = result["filters"]
        actual_columns = result["columns"]
        reason = result["reason"]

        # Validate filters matches (expected_filters should be a subset of actual_filters)
        filter_match = True
        for key, exp_val in expected_filters.items():
            act_val = actual_filters.get(key)
            if key == "skills":
                # Check subset/overlap for skills
                if not act_val or exp_val.lower() not in act_val.lower():
                    filter_match = False
                    break
            elif key == "name":
                if not act_val or exp_val.lower() not in act_val.lower():
                    filter_match = False
                    break
            else:
                if act_val != exp_val:
                    filter_match = False
                    break

        # Validate columns subset matches
        col_match = all(c in actual_columns for c in expected_columns)

        if filter_match and col_match:
            passed_count += 1
            status = "PASS"
        else:
            status = "FAIL"
            print(f"[{idx:03d}] {status} - Prompt: '{prompt}' ({elapsed:.2f}ms)")
            if not filter_match:
                print(f"      Filters Mismatch: Expected: {expected_filters}, Actual: {actual_filters}")
            if not col_match:
                print(f"      Columns Mismatch: Expected: {expected_columns}, Actual: {actual_columns}")
            print(f"      Reason parsed: {reason}")
            print("-" * 60)

    avg_latency = total_time / len(TEST_PROMPTS)
    success_rate = (passed_count / len(TEST_PROMPTS)) * 100.0

    print("\n==========================================================")
    print("                    BENCHMARK RESULTS")
    print("==========================================================")
    print(f"Total Executed : {len(TEST_PROMPTS)}")
    print(f"Total Passed   : {passed_count}")
    print(f"Total Failed   : {len(TEST_PROMPTS) - passed_count}")
    print(f"Success Rate   : {success_rate:.2f}%")
    print(f"Avg Latency    : {avg_latency:.2f} ms")
    print("==========================================================")

    # Return exit status (0 if all passed, 1 if any failed)
    return 0 if passed_count == len(TEST_PROMPTS) else 1

if __name__ == "__main__":
    sys.exit(run_benchmarks())
