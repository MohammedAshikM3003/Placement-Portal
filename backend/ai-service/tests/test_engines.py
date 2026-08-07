import unittest
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from resume_engine.spell_checker import correct_spelling
from resume_engine.grammar_checker import correct_grammar
from resume_engine.professional_rewriter import professionalize_text
from resume_engine.ats_keyword_enhancer import enhance_ats_keywords
from resume_engine.summary_generator import generate_summary
from resume_engine.project_generator import generate_project_desc
from resume_engine.internship_generator import generate_internship_desc
from resume_engine.achievement_generator import generate_achievement
from resume_engine.engine import enhance_text
from ats import check_ats
from feedback_engine.engine import make_concise


class TestResumeEnhancementEngine(unittest.TestCase):
    def test_spell_checker(self):
        text = "i am hard working persn."
        corrected = correct_spelling(text)
        self.assertIn("person", corrected.lower())

    def test_grammar_checker(self):
        text = "i done many projects."
        corrected = correct_grammar(text)
        self.assertTrue(len(corrected) > 0)

    def test_professional_rewriter(self):
        text = "i know python and java."
        rewritten = professionalize_text(text)
        self.assertIn("python", rewritten.lower())
        self.assertIn("java", rewritten.lower())

    def test_ats_keyword_enhancer(self):
        text = "I build backend web apps using python and node."
        enhanced = enhance_ats_keywords(text, "Backend Developer")
        self.assertIn("Node.js", enhanced)
        # Verify no hallucination
        self.assertNotIn("Java", enhanced)

    def test_summary_generator(self):
        text = "i am fast learner and hard worker. looking for software job."
        enhanced = generate_summary(text)
        self.assertIn("Software Engineering student", enhanced)

    def test_project_generator(self):
        name = "placement portal"
        techs = ["React.js", "Node.js"]
        desc = "many user use it."
        enhanced = generate_project_desc(name, techs, desc)
        self.assertIn("Placement Portal", enhanced)
        self.assertIn("React.js", enhanced)

    def test_internship_generator(self):
        text = "worked in abc company. fix bugs and make pages."
        enhanced = generate_internship_desc("ABC Company", text)
        self.assertIn("Contributed to frontend development", enhanced)

    def test_achievement_generator(self):
        text = "got first prize in coding compition."
        enhanced = generate_achievement(text)
        self.assertIn("Secured First Place", enhanced)

    def test_orchestration_engine(self):
        text = "i am hard working persn. i know python and java. i done many projects."
        enhanced = enhance_text(text, "Software Engineer")
        self.assertTrue(len(enhanced) > len(text))


class TestAtsEngineV2(unittest.TestCase):
    def test_ats_v2_breakdown(self):
        resume = """
        John Doe
        john.doe@email.com | 9876543210
        github.com/johndoe | linkedin.com/in/johndoe
        
        SUMMARY
        Dedicated Software Engineer.
        
        EDUCATION
        XYZ University, Bachelor of Engineering
        CGPA: 8.5
        
        SKILLS
        Python, JavaScript, React, Node.js, SQL, Git, Docker, AWS
        
        PROJECTS
        Developed Placement Portal using React, Node.js, and MongoDB.
        Many users use this system.
        
        EXPERIENCE
        Worked as Software Engineer Intern.
        Assisted team with bug fixes.
        """
        
        job = "Looking for a Software Engineer with Python, React, Docker, AWS, and SQL skills."
        
        result = check_ats(resume, job)
        
        # Verify ATS V2 outputs the correct category breakdown structure
        self.assertIn("overallScore", result)
        self.assertIn("categories", result)
        self.assertIn("criticalFixes", result)
        self.assertIn("missingKeywords", result)
        
        cats = result["categories"]
        for cat_key in ["keywordMatch", "skillsMatch", "projectRelevance", "experienceRelevance", 
                        "grammarQuality", "resumeStructure", "educationCompleteness", "contactCompleteness"]:
            self.assertIn(cat_key, cats)
            self.assertIn("name", cats[cat_key])
            self.assertIn("score", cats[cat_key])
            self.assertIn("weight", cats[cat_key])


class TestFeedbackConciser(unittest.TestCase):
    def test_feedback_conciser_flow(self):
        feedback = "Candidate has good communication skills but lacks confidence in technical discussions. Coding ability is average. DSA knowledge should be improved."
        result = make_concise(feedback)
        self.assertIn("Strong communication skills", result)
        self.assertIn("Needs improvement in", result)


if __name__ == "__main__":
    unittest.main()
