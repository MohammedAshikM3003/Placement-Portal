# backend/ocr-service/ocr/semantic_matcher.py
import re
import math
import os
import json

def get_ngrams(text, n=3):
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    ngrams = []
    # Character n-grams
    for i in range(len(text) - n + 1):
        ngrams.append(text[i:i+n])
    # Word-level unigrams
    ngrams.extend(text.split())
    return [ng for ng in ngrams if ng.strip()]

def calculate_cosine_similarity(text1, text2):
    vec1 = get_ngrams(text1)
    vec2 = get_ngrams(text2)
    
    if not vec1 or not vec2:
        return 0.0
        
    freq1 = {}
    for w in vec1:
        freq1[w] = freq1.get(w, 0) + 1
        
    freq2 = {}
    for w in vec2:
        freq2[w] = freq2.get(w, 0) + 1
        
    intersection = set(freq1.keys()) & set(freq2.keys())
    dot_product = sum(freq1[x] * freq2[x] for x in intersection)
    
    sum1 = sum(freq1[x]**2 for x in freq1.keys())
    sum2 = sum(freq2[x]**2 for x in freq2.keys())
    
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    if not denominator:
        return 0.0
    return float(dot_product) / denominator

def find_best_semantic_match(course_name, master_list, threshold=0.70):
    """
    Scans a master list of course dictionary records to find the best semantic similarity fit.
    """
    best_score = 0.0
    best_match = None
    
    for candidate in master_list:
        cand_name = candidate.get("courseName", candidate.get("course_name", ""))
        score = calculate_cosine_similarity(course_name, cand_name)
        if score > best_score:
            best_score = score
            best_match = candidate
            
    report = {
        "candidate": course_name,
        "similarity": round(best_score, 4),
        "decision": "APPROVED" if best_score >= threshold else "REJECTED",
        "reason": f"Semantic cosine score {best_score:.4f} is above threshold {threshold}" if best_score >= threshold else f"Best similarity score {best_score:.4f} is below minimum threshold {threshold}"
    }
    
    # Save matcher diagnostic report in debug directory
    debug_dir = "d:/Placement-Portal/debug"
    if os.path.exists(debug_dir):
        try:
            report_path = os.path.join(debug_dir, "semantic_match_report.json")
            # If report already exists, load and append
            existing_reports = []
            if os.path.exists(report_path):
                with open(report_path, "r", encoding="utf-8") as rf:
                    existing_reports = json.load(rf)
                    if not isinstance(existing_reports, list):
                        existing_reports = []
            existing_reports.append(report)
            with open(report_path, "w", encoding="utf-8") as wf:
                json.dump(existing_reports, wf, indent=2)
        except Exception:
            pass
            
    if best_score >= threshold:
        return best_match, best_score
    return None, best_score
