import os
import json
import random

def generate_dataset():
    # Find absolute paths relative to current directory
    os.makedirs("tests/resume_dataset", exist_ok=True)
    
    first_names = ["Rahul", "Amit", "Priya", "Anjali", "Vikram", "Sneha", "Rohan", "Aditya", "Neha", "Karan"]
    last_names = ["Sharma", "Verma", "Gupta", "Kumar", "Singh", "Patel", "Reddy", "Nair", "Mehta", "Joshi"]
    
    roles = [
        "Frontend Developer", "React Developer", "Backend Developer", "Node Developer",
        "Full Stack Developer", "Data Scientist", "Machine Learning Engineer", "DevOps Engineer",
        "Mobile Developer", "QA Engineer", "Cloud Engineer", "Cyber Security Engineer",
        "Data Engineer", "UI/UX Designer", "Database Administrator", "Embedded Systems Engineer",
        "Product Manager"
    ]
    
    skills_pool = {
        "Frontend Developer": ["HTML", "CSS", "JS", "React", "bootstrap"],
        "Backend Developer": ["Node", "Express", "Mongo", "Python", "SQL"],
        "Data Scientist": ["Python", "Pandas", "numpy", "ML", "SQL"],
        "DevOps Engineer": ["Docker", "AWS", "Git", "Linux", "Jenkins"],
    }
    
    casual_summaries = [
        "i am hard working persn. got good in coding. learn new things.",
        "honest boy like coding and gaming. fast learner and team player.",
        "basically worked on backend and did code. seeking awesome job.",
        "super motivated college student looking for cool web development job.",
        "really good team player got first prize in coding compition."
    ]
    
    casual_experiences = [
        "worked in abc company. did frontend pages and fixed bugs.",
        "done web developer intern at startupp. made database schemas.",
        "assisted team and did write code for backend. basically solved errors.",
        "fixed bugs in website and worked on the database stuff.",
        "made responsive ui layout for e-comerce. helped the team."
    ]
    
    casual_projects = [
        "i built a cool website for buying stuff online. did all code.",
        "made a chat app for messaging. used socket stuff.",
        "designed weather checker application showing forecasts.",
        "built library management system. basically managed catalog.",
        "made attendance tracker. did write code in react and node."
    ]
    
    casual_achievements = [
        "got first prize in coding compition.",
        "won hackthon at college level.",
        "got award for best project.",
        "participted in coding contest.",
        "secured first place in hackathon."
    ]

    for i in range(100):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        role = random.choice(roles)
        
        skills = skills_pool.get(role, ["Java", "Python", "SQL", "Git"])
        
        include_exp = random.random() > 0.1
        include_proj = random.random() > 0.1
        include_edu = random.random() > 0.1
        
        valid_email = random.random() > 0.15
        valid_phone = random.random() > 0.15
        
        email = f"{fn.lower()}.{ln.lower()}@email.com" if valid_email else f"{fn.lower()}@@gmail"
        phone = f"{random.randint(6000000000, 9999999999)}" if valid_phone else "12345"
        
        resume_data = {
            "personalInfo": {
                "name": f"{fn} {ln}",
                "mobile": phone,
                "email": email,
                "linkedin": f"linkedin.com/in/{fn.lower()}{ln.lower()}" if random.random() > 0.2 else "",
                "github": f"github.com/{fn.lower()}{ln.lower()}" if random.random() > 0.2 else "",
                "portfolio": ""
            },
            "summary": random.choice(casual_summaries),
            "education": {
                "college": "XYZ Engineering College" if include_edu else "",
                "degree": "B.E." if include_edu else "",
                "branch": "Computer Science" if include_edu else "",
                "cgpa": "8.2" if (include_edu and random.random() > 0.2) else "",
                "graduationYear": "2026" if include_edu else ""
            },
            "skills": [
                {"category": "Technical", "items": skills}
            ],
            "experiences": [
                {
                    "title": "Software Developer Intern",
                    "companyName": "ABC Corp",
                    "location": "Remote",
                    "mode": "remote",
                    "fromDate": "2024-01-01",
                    "toDate": "2024-04-01",
                    "description": random.choice(casual_experiences),
                    "technologies": ["React", "JavaScript"]
                }
            ] if include_exp else [],
            "projects": [
                {
                    "name": "E-Commerce System",
                    "description": random.choice(casual_projects),
                    "technologies": ["Node.js", "Express", "MongoDB"]
                }
            ] if include_proj else [],
            "certifications": [
                {
                    "certificateName": "AWS Certified Cloud Practitioner",
                    "description": "Certified in cloud fundamentals"
                }
            ] if random.random() > 0.3 else [],
            "achievements": [
                {
                    "details": random.choice(casual_achievements)
                }
            ],
            "platforms": [
                {"name": "Leetcode", "url": f"leetcode.com/{fn.lower()}"}
            ],
            "additionalInfo": [],
            "resumeSettings": {
                "jobRole": role,
                "customJobRole": "",
                "fontStyle": "Arial",
                "pages": "1",
                "enableAI": True,
                "linkType": "HyperLink"
            }
        }
        
        output_path = os.path.join("tests", "resume_dataset", f"resume_{i+1}.json")
        with open(output_path, "w") as f_out:
            json.dump(resume_data, f_out, indent=2)

    print("Successfully generated 100 bad resumes in tests/resume_dataset/")

if __name__ == "__main__":
    generate_dataset()
