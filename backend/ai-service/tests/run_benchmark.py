import os
import json
import copy
import sys
import re

# Add the parent directory (backend/ai-service) to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from resume import enhance_resume_text
from ats import check_ats, _extract_skills
from resume_engine.ats_keyword_enhancer import ROLE_KEYWORDS

# Spelling error corrections map
SPELLING_ERRORS = {
    "persn": "person",
    "compition": "competition",
    "startupp": "startup",
    "e-comerce": "e-commerce",
    "hackthon": "hackathon",
    "participted": "participated"
}

def build_plain_text(data):
    personal_info = data.get("personalInfo", {})
    summary = data.get("summary", "")
    education = data.get("education", {})
    skills = data.get("skills", [])
    experiences = data.get("experiences", [])
    projects = data.get("projects", [])
    certifications = data.get("certifications", [])
    achievements = data.get("achievements", [])
    platforms = data.get("platforms", [])
    
    parts = []
    parts.append(f"Name: {personal_info.get('name', 'N/A')}")
    parts.append(f"Email: {personal_info.get('email', 'N/A')}")
    parts.append(f"Phone: {personal_info.get('mobile', 'N/A')}")
    if personal_info.get("linkedin"):
        parts.append(f"LinkedIn: {personal_info.get('linkedin')}")
    if personal_info.get("github"):
        parts.append(f"GitHub: {personal_info.get('github')}")
    if summary:
        parts.append(f"\nSummary: {summary}")
    if education.get("school12"):
        parts.append(f"\nEducation: 12th - {education.get('school12')}, Percentile: {education.get('percentile12', 'N/A')}")
    if education.get("school10"):
        parts.append(f"10th - {education.get('school10')}, Percentile: {education.get('percentile10', 'N/A')}")
        
    if skills:
        flat_skills = []
        for s in skills:
            if isinstance(s, dict):
                flat_skills.extend(s.get("items", []))
            else:
                flat_skills.append(s)
        parts.append(f"\nSkills: {', '.join(flat_skills)}")
        
    for i, e in enumerate(experiences):
        parts.append(f"\nExperience {i + 1}: {e.get('title', '')} at {e.get('companyName', '')} ({e.get('fromDate', '')} - {e.get('toDate', 'Present')})")
        if e.get("description"):
            parts.append(f"Description: {e.get('description')}")
        if e.get("technologies"):
            parts.append(f"Technologies: {', '.join(e.get('technologies'))}")
            
    for i, p in enumerate(projects):
        parts.append(f"\nProject {i + 1}: {p.get('name', '')}")
        if p.get("description"):
            parts.append(f"Description: {p.get('description')}")
        if p.get("technologies"):
            parts.append(f"Technologies: {', '.join(p.get('technologies'))}")
            
    for c in certifications:
        parts.append(f"\nCertification: {c.get('certificateName', '')} - {c.get('issuedBy', '')}")
        
    for a in achievements:
        parts.append(f"\nAchievement: {a.get('details', '')}")
        
    for p in platforms:
        if p.get("url"):
            parts.append(f"\n{p.get('name')}: {p.get('url')}")
            
    return "\n".join(parts)

def count_errors(text):
    if not text:
        return 0
    lower = text.lower()
    total_found = 0
    for err in SPELLING_ERRORS.keys():
        if err in lower:
            total_found += 1
    return total_found

def check_hallucinations(orig, enh):
    # Extract skills present in the original resume
    orig_text = build_plain_text(orig)
    orig_skills = set(s.lower() for s in _extract_skills(orig_text))
    
    # Also include skills listed in the skills categories
    for s_group in orig.get("skills", []):
        if isinstance(s_group, dict):
            for item in s_group.get("items", []):
                orig_skills.add(item.lower())
        else:
            orig_skills.add(s_group.lower())
            
    # Extract skills present in the enhanced resume
    enh_text = build_plain_text(enh)
    enh_skills = set(s.lower() for s in _extract_skills(enh_text))
    
    new_skills = enh_skills - orig_skills
    hallucinated = []
    for ns in new_skills:
        is_variant = False
        for os_skill in orig_skills:
            if ns in os_skill or os_skill in ns:
                is_variant = True
                break
        if not is_variant:
            hallucinated.append(ns)
            
    return len(hallucinated)

def run_evaluation_on_dataset(dataset_dir, files):
    total_before_score = 0
    total_after_score = 0
    total_before_quant = 0
    total_after_quant = 0
    total_errors_before = 0
    total_errors_after = 0
    total_hallucinations = 0
    
    for idx, filename in enumerate(files):
        filepath = os.path.join(dataset_dir, filename)
        with open(filepath, "r") as f:
            resume_data = json.load(f)
            
        role = resume_data.get("resumeSettings", {}).get("jobRole", "Software Engineer")
        
        # 1. Before Metrics
        before_text = build_plain_text(resume_data)
        before_ats = check_ats(before_text, role)
        
        errs_before = 0
        for text_field in [resume_data.get("summary", "")] + \
                          [e.get("description", "") for e in resume_data.get("experiences", [])] + \
                          [p.get("description", "") for p in resume_data.get("projects", [])] + \
                          [a.get("details", "") for a in resume_data.get("achievements", [])]:
            errs_before += count_errors(text_field)
            
        total_errors_before += errs_before
        total_before_score += before_ats.get("overallScore", 0)
        total_before_quant += before_ats.get("categories", {}).get("quantificationScore", {}).get("score", 0)
        
        # 2. AI Enhancement
        enhanced_resume = copy.deepcopy(resume_data)
        if enhanced_resume.get("summary"):
            enhanced_resume["summary"] = enhance_resume_text(enhanced_resume["summary"])
            
        for exp in enhanced_resume.get("experiences", []):
            if exp.get("description"):
                exp["description"] = enhance_resume_text(exp["description"])
                
        for proj in enhanced_resume.get("projects", []):
            if proj.get("description"):
                proj["description"] = enhance_resume_text(proj["description"])
                
        for ach in enhanced_resume.get("achievements", []):
            if ach.get("details"):
                ach["details"] = enhance_resume_text(ach["details"])
                
        # 3. After Metrics
        after_text = build_plain_text(enhanced_resume)
        after_ats = check_ats(after_text, role)
        
        errs_after = 0
        for text_field in [enhanced_resume.get("summary", "")] + \
                          [e.get("description", "") for e in enhanced_resume.get("experiences", [])] + \
                          [p.get("description", "") for p in enhanced_resume.get("projects", [])] + \
                          [a.get("details", "") for a in enhanced_resume.get("achievements", [])]:
            errs_after += count_errors(text_field)
            
        total_errors_after += errs_after
        total_after_score += after_ats.get("overallScore", 0)
        total_after_quant += after_ats.get("categories", {}).get("quantificationScore", {}).get("score", 0)
        
        # Hallucination Checker
        hallucinations = check_hallucinations(resume_data, enhanced_resume)
        total_hallucinations += hallucinations

    n = len(files)
    avg_before = total_before_score / n
    avg_after = total_after_score / n
    avg_quant_before = total_before_quant / n
    avg_quant_after = total_after_quant / n
    spell_rate = ((total_errors_before - total_errors_after) / total_errors_before * 100) if total_errors_before > 0 else 100.0
    hallucination_rate = (total_hallucinations / n) * 100.0
    
    return {
        "count": n,
        "avg_before": avg_before,
        "avg_after": avg_after,
        "avg_quant_before": avg_quant_before,
        "avg_quant_after": avg_quant_after,
        "errors_before": total_errors_before,
        "errors_after": total_errors_after,
        "spell_rate": spell_rate,
        "hallucinations": total_hallucinations,
        "hallucination_rate": hallucination_rate
    }

def main():
    # 1. Evaluate Synthetic Dataset
    syn_dir = os.path.join("tests", "resume_dataset")
    syn_files = [f for f in os.listdir(syn_dir) if f.endswith(".json")] if os.path.exists(syn_dir) else []
    
    syn_results = None
    if syn_files:
        print(f"Evaluating {len(syn_files)} synthetic resumes...")
        syn_results = run_evaluation_on_dataset(syn_dir, syn_files)
        
    # 2. Evaluate Real Anonymized Dataset
    real_dir = os.path.join("tests", "real_resume_dataset")
    real_files = [f for f in os.listdir(real_dir) if f.endswith(".json")] if os.path.exists(real_dir) else []
    
    real_results = None
    if real_files:
        print(f"Evaluating {len(real_files)} anonymized real resumes...")
        real_results = run_evaluation_on_dataset(real_dir, real_files)

    # 3. Keyword Stuffing Detection Validation
    print("Running Keyword Stuffing validation...")
    stuffing_test_resume = "Python Python Python Python Python and Javascript developer."
    stuffing_ats = check_ats(stuffing_test_resume, "Python developer")
    stuffing_detected = stuffing_ats.get("keywordStuffing", False)
    penalty_applied = stuffing_ats.get("penaltyApplied", False)

    # Output scorecards
    print("\n" + "="*60)
    print("            RESUME AI SERVICE BENCHMARK SCORECARD")
    print("="*60)
    
    if syn_results:
        print(f"DATASET: SYNTHETIC RESUMES ({syn_results['count']} Profiles)")
        print("-"*60)
        print(f"Average ATS Score Before:        {syn_results['avg_before']:.2f}%")
        print(f"Average ATS Score After:         {syn_results['avg_after']:.2f}%")
        print(f"Average Score Increase:          +{syn_results['avg_after'] - syn_results['avg_before']:.2f}%")
        print(f"Spelling Clean-up Success Rate:  {syn_results['spell_rate']:.2f}%")
        print(f"Hallucination Rate:              {syn_results['hallucination_rate']:.2f}%")
        print("-"*60)
        
    if real_results:
        print(f"DATASET: REAL ANONYMIZED RESUMES ({real_results['count']} Profiles)")
        print("-"*60)
        print(f"Average ATS Score Before:        {real_results['avg_before']:.2f}%")
        print(f"Average ATS Score After:         {real_results['avg_after']:.2f}%")
        print(f"Average Score Increase:          +{real_results['avg_after'] - real_results['avg_before']:.2f}%")
        print(f"Spelling Clean-up Success Rate:  {real_results['spell_rate']:.2f}%")
        print(f"Hallucination Rate:              {real_results['hallucination_rate']:.2f}% (Goal: < 2.00%)")
        print("-"*60)
        
    print("ANTI-GAMING VERIFICATION:")
    print("-"*60)
    print(f"Keyword Stuffing Detected:       {'PASSED' if stuffing_detected else 'FAILED'}")
    print(f"Anti-Gaming Penalty Applied:     {'PASSED' if penalty_applied else 'FAILED'}")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
