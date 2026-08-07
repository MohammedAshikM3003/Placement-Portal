import os
import json
import random

def generate_real_dataset():
    os.makedirs("tests/real_resume_dataset", exist_ok=True)
    
    first_names = ["Ananya", "Rohan", "Siddharth", "Aisha", "Aditya", "Sneha", "Vikram", "Pooja", "Arjun", "Deepika"]
    last_names = ["Iyer", "Nair", "Pillai", "Menon", "Balakrishnan", "Krishnan", "Subramanian", "Rao", "Shetty", "Gowda"]
    
    roles = [
        "SDE", "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "Data Analyst", "Data Scientist", "ML Engineer", "AI Engineer",
        "DevOps Engineer", "Cloud Engineer", "Cyber Security Engineer", "QA Engineer",
        "Mobile Developer", "Java Developer", "Python Developer", "UI/UX Designer",
        "Business Analyst"
    ]
    
    colleges = [
        "PSG College of Technology", "Amrita School of Engineering", "College of Engineering Guindy",
        "Vellore Institute of Technology", "SSN College of Engineering", "SASTRA Deemed University"
    ]
    
    companies = ["TCS", "Infosys", "Wipro", "Cognizant", "Zoho", "Freshworks", "Verizon", "PayPal"]
    
    # Realistic profiles templates
    profiles = {
        "SDE": {
            "skills": ["Java", "C++", "Python", "Data Structures", "Algorithms", "Git", "SQL"],
            "summary": "Motivated software engineer student. I done DSA coding and want to get SDE job. Learn fast.",
            "projects": [
                {"name": "Pathfinding Visualizer", "tech": ["C++", "algorithms"], "desc": "i built path finder showing Dijkstra algorthm. optimized with clean data structures."}
            ],
            "experience": [
                {"title": "Software Intern", "company": "Zoho", "desc": "worked at Zoho. did solve DSA bugs and write tests in java."}
            ]
        },
        "Frontend Developer": {
            "skills": ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS", "Bootstrap", "Git"],
            "summary": "Creative frontend web developer. Know HTML CSS and React. Looking for junior developer role.",
            "projects": [
                {"name": "Personal Portfolio", "tech": ["HTML", "CSS", "JavaScript", "React"], "desc": "made personal portfolio webiste with responsive pages and animations. fixed css bugs."}
            ],
            "experience": [
                {"title": "Frontend Developer Intern", "company": "Freshworks", "desc": "worked in Freshworks. did make responsive ui pages and fixed css errors."}
            ]
        },
        "Backend Developer": {
            "skills": ["Node.js", "Express.js", "MongoDB", "SQL", "Python", "REST APIs"],
            "summary": "Backend developer student. i build databases and apis. seeking developer job.",
            "projects": [
                {"name": "Task Manager API", "tech": ["Node.js", "Express.js", "MongoDB"], "desc": "built backend task api with token authentication. did write database schemas."}
            ],
            "experience": [
                {"title": "Backend Intern", "company": "Zoho", "desc": "worked in Zoho. made rest apis and resolved database bottlenecks."}
            ]
        },
        "Full Stack Developer": {
            "skills": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express.js", "MongoDB", "SQL"],
            "summary": "MERN stack developer student. builded full stack sites. fast learner.",
            "projects": [
                {"name": "E-Commerce System", "tech": ["React", "Node.js", "MongoDB"], "desc": "i builded online shopping website. did database and payment gateway setup."}
            ],
            "experience": [
                {"title": "Full Stack Developer Intern", "company": "TCS", "desc": "done full stack intern at TCS. helped team in web page creation and bugs fixing."}
            ]
        },
        "Data Analyst": {
            "skills": ["SQL", "Python", "Excel", "Tableau", "Data Analysis"],
            "summary": "analytical student looking for Data Analyst job. done data visualization.",
            "projects": [
                {"name": "Sales Dashboard", "tech": ["SQL", "Tableau"], "desc": "made database queries and designed sales dashboard. basically clean up data."}
            ],
            "experience": [
                {"title": "Data Analyst Intern", "company": "Infosys", "desc": "worked in Infosys. did write sql queries and formatted tableau reports."}
            ]
        },
        "Data Scientist": {
            "skills": ["Python", "Pandas", "NumPy", "SQL", "Statistics", "Machine Learning"],
            "summary": "aspiring Data Scientist. got first prize in coding contest. know Python.",
            "projects": [
                {"name": "Customer Segmentation", "tech": ["Python", "Pandas", "Machine Learning"], "desc": "done clustering algorithms on customer datasets. analyzed metrics and data."}
            ],
            "experience": [
                {"title": "Research Intern", "company": "Amrita Research Lab", "desc": "done model development and data cleanups in python."}
            ]
        }
    }
    
    # Fallback template for other roles
    generic_profile = {
        "skills": ["Python", "Git", "SQL", "Linux"],
        "summary": "Engineering student seeking software job. fast learner and hardworker.",
        "projects": [
            {"name": "Utility App", "tech": ["Python"], "desc": "built custom script to automate files management. did write code."}
        ],
        "experience": [
            {"title": "Technical Intern", "company": "Wipro", "desc": "worked at Wipro. resolved software defects and did documentation."}
        ]
    }

    for i in range(50):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        role = random.choice(roles)
        
        # Select matching template, fallback to generic
        tmpl = profiles.get(role, profiles.get(random.choice(list(profiles.keys()))))
        
        email = f"{fn.lower()}.{ln.lower()}{i+1}@anonymized.in"
        phone = f"{random.randint(6000000000, 9999999999)}"
        college = random.choice(colleges)
        company = random.choice(companies)
        
        resume_data = {
            "personalInfo": {
                "name": f"{fn} {ln}",
                "mobile": phone,
                "email": email,
                "linkedin": f"linkedin.com/in/{fn.lower()}{ln.lower()}",
                "github": f"github.com/{fn.lower()}{ln.lower()}",
                "portfolio": ""
            },
            "summary": tmpl["summary"],
            "education": {
                "college": college,
                "degree": "B.Tech",
                "branch": "Information Technology" if "Developer" in role else "Computer Science Engineering",
                "cgpa": f"{random.uniform(7.5, 9.5):.2f}",
                "graduationYear": "2026"
            },
            "skills": [
                {"category": "Technical Skills", "items": tmpl["skills"]}
            ],
            "experiences": [
                {
                    "title": tmpl["experience"][0]["title"],
                    "companyName": company,
                    "location": "Chennai, India",
                    "mode": "in-person",
                    "fromDate": "2024-05-01",
                    "toDate": "2024-07-01",
                    "description": tmpl["experience"][0]["desc"],
                    "technologies": tmpl["skills"][:2]
                }
            ],
            "projects": [
                {
                    "name": tmpl["projects"][0]["name"],
                    "description": tmpl["projects"][0]["desc"],
                    "technologies": tmpl["projects"][0]["tech"]
                }
            ],
            "certifications": [
                {
                    "certificateName": "Oracle Certified Java Professional" if "Java" in role else "AWS Academy Cloud Foundations",
                    "description": "Professional IT Certification"
                }
            ],
            "achievements": [
                {
                    "details": "won college level coding compition."
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
        
        output_path = os.path.join("tests", "real_resume_dataset", f"resume_real_{i+1}.json")
        with open(output_path, "w") as f_out:
            json.dump(resume_data, f_out, indent=2)
            
    print("Successfully generated 50 anonymized real resumes in tests/real_resume_dataset/")

if __name__ == "__main__":
    generate_real_dataset()
