import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import styles from './ResumeBuilder.module.css';
import '../components/alerts/AlertStyles.css';

// Lazy load popups
const PopupExperience = lazy(() => import('./PopupExperience.jsx'));
const PopupProject = lazy(() => import('./PopupProject.jsx'));
const PopupCertification = lazy(() => import('./PopupCertification.jsx'));
const PopupAchievementBuilder = lazy(() => import('./PopupAchievementBuilder.jsx'));
const PopupAdditionalInfo = lazy(() => import('./PopupAdditionalInfo.jsx'));

// ===== ATS KEYWORDS MAPPING =====
// Used by AI for generating relevant content — NOT auto-added to skills
const ATS_KEYWORDS = {
  'Frontend Developer': [
    'HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', 'TypeScript',
    'Responsive Design', 'UI/UX', 'Bootstrap', 'Tailwind CSS', 'Material-UI',
    'Redux', 'REST API', 'GraphQL', 'Webpack', 'Git', 'Agile', 'Cross-browser Compatibility'
  ],
  'Backend Developer': [
    'Node.js', 'Python', 'Java', 'Spring Boot', 'Express.js', 'Django', 'Flask',
    'REST API', 'GraphQL', 'MongoDB', 'MySQL', 'PostgreSQL', 'Redis',
    'Microservices', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'CI/CD', 'Agile'
  ],
  'Full Stack Developer': [
    'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB',
    'MySQL', 'REST API', 'Git', 'Docker', 'AWS', 'TypeScript', 'Redux',
    'Agile', 'Microservices', 'CI/CD', 'Responsive Design', 'Authentication', 'Security'
  ],
  'Data Scientist': [
    'Python', 'R', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'Scikit-learn', 'Pandas', 'NumPy', 'Data Visualization', 'Statistics',
    'SQL', 'Big Data', 'Hadoop', 'Spark', 'NLP', 'Computer Vision', 'A/B Testing', 'Feature Engineering'
  ]
};

const DEFAULT_SKILL_CATEGORIES = [
  { category: 'Languages', items: [] },
  { category: 'Frameworks & Libraries', items: [] },
  { category: 'Databases', items: [] },
  { category: 'Tools & Platforms', items: [] },
  { category: 'Other', items: [] },
];

// ===== MAIN CONTENT =====
function BuilderContent({ onViewChange, studentData: parentStudentData }) {
  // Student data from parent (which listens to profile updates)
  const [studentData, setStudentData] = useState(parentStudentData);

  // Update local state when parent data changes
  useEffect(() => {
    if (parentStudentData) {
      setStudentData(parentStudentData);
    }
  }, [parentStudentData]);

  // ===== FORM STATE =====
  const [personalInfo, setPersonalInfo] = useState({
    name: '', mobile: '', email: '', linkedin: '', github: '', portfolio: ''
  });
  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState({
    college: '', degree: '', branch: '', cgpa: '', graduationYear: '',
    school12: '', percentile12: '', batch12: '',
    school10: '', percentile10: '', batch10: ''
  });

  // Coding Platforms
  const [platforms, setPlatforms] = useState([
    { name: 'Leetcode', url: '' },
    { name: 'Hacker Rank', url: '' },
  ]);

  // Chips-based sections (categorized skills)
  const [skills, setSkills] = useState(DEFAULT_SKILL_CATEGORIES.map(c => ({ ...c, items: [...c.items] })));
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState([]);

  // Resume Settings state
  const [resumeSettings, setResumeSettings] = useState({
    jobRole: '',
    customJobRole: '',
    fontStyle: 'Arial',
    pages: '1',
    enableAI: true,
    linkType: 'HyperLink',
    profilePhoto: false,
    photoPosition: 'Left'
  });

  // Popup state
  const [activePopup, setActivePopup] = useState(null); // 'experience' | 'project' | 'certification' | 'achievement' | 'additionalInfo'
  const [editIndex, setEditIndex] = useState(null);

  // Creating popup state (for Create button)
  const [isCreating, setIsCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState(0);
  const [createStatus, setCreateStatus] = useState(''); // Dynamic status message
  const [showCreated, setShowCreated] = useState(false);
  const [hasCreatedOnce, setHasCreatedOnce] = useState(false); // Prevent multiple clicks
  const [isPreviewing, setIsPreviewing] = useState(false); // Track preview button state

  // ===== USER-SPECIFIC LOCALSTORAGE KEY =====
  // Prevents resume data from leaking between different student sessions
  const getStorageKey = useCallback(() => {
    const id = studentData?._id || studentData?.id || studentData?.regNo;
    return id ? `resumeBuilderData_${id}` : 'resumeBuilderData';
  }, [studentData]);
  
  // Inline input states (replaces window.prompt)
  const [editingPlatformIndex, setEditingPlatformIndex] = useState(null);
  const [activeSkillCategory, setActiveSkillCategory] = useState(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const platformNameInputRef = useRef(null);
  const skillInputRef = useRef(null);

  // Ref for auto-expanding Professional Summary textarea
  const summaryTextareaRef = useRef(null);

  // Resume PDF URL (after generation)
  const [resumePdfUrl, setResumePdfUrl] = useState(null);

  // ===== AUTO-SYNC to MongoDB when popup data changes =====
  const syncToMongoDB = useCallback(async (updatedFields) => {
    const studentId = studentData?._id || studentData?.id;
    if (!studentId) return;

    const token = localStorage.getItem('token');
    const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

    try {
      const storageKey = getStorageKey();
      const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const resumeData = { ...currentData, ...updatedFields };

      await fetch(`${API_BASE}/api/resume-builder/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ studentId, resumeData }),
      });
      console.log('✅ Auto-synced to MongoDB');
    } catch (err) {
      console.warn('⚠️ Auto-sync to MongoDB failed:', err);
    }
  }, [studentData, getStorageKey]);

  // ===== AUTO-EXPAND SUMMARY TEXTAREA =====
  useEffect(() => {
    const textarea = summaryTextareaRef.current;
    if (textarea) {
      // Reset height to measure scrollHeight properly
      textarea.style.height = '150px';
      // Set height to scrollHeight to fit content
      const newHeight = Math.max(150, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [summary]);

  // ===== AUTO-POPULATE from student data (Profile page) =====
  // This fills in missing fields from student profile data
  // skipSkills: if true, don't auto-populate skills (used when skills were explicitly saved)
  const autoPopulateFromProfile = useCallback((skipSkills = false) => {
    if (!studentData) return;

    console.log('Resume Builder - Auto-populating from student data:', {
      linkedinLink: studentData.linkedinLink,
      githubLink: studentData.githubLink,
      portfolioLink: studentData.portfolioLink,
      skipSkills
    });

    // Personal Info — map profile field names to resume fields
    setPersonalInfo(prev => ({
      ...prev,
      name: prev.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim(),
      email: prev.email || studentData.primaryEmail || studentData.domainEmail || studentData.email || '',
      mobile: prev.mobile || studentData.mobileNo || '',
      linkedin: prev.linkedin || studentData.linkedinLink || studentData.linkedinProfile || '',
      github: prev.github || studentData.githubLink || studentData.githubProfile || '',
      portfolio: prev.portfolio || studentData.portfolioLink || studentData.portfolio || '',
    }));

    // Education — auto-fill college, 12th and 10th details
    setEducation(prev => ({
      ...prev,
      college: prev.college || 'K.S.R. College of Engineering',
      degree: prev.degree || studentData.degree || 'B.E.',
      branch: prev.branch || studentData.branch || '',
      cgpa: prev.cgpa || studentData.overallCGPA || '',
      graduationYear: prev.graduationYear || studentData.batch || '',
      school12: prev.school12 || studentData.twelfthInstitution || '',
      percentile12: prev.percentile12 || studentData.twelfthPercentage || '',
      batch12: prev.batch12 || studentData.twelfthYear || '',
      school10: prev.school10 || studentData.tenthInstitution || '',
      percentile10: prev.percentile10 || studentData.tenthPercentage || '',
      batch10: prev.batch10 || studentData.tenthYear || '',
    }));

    // Skills — parse comma-separated skillSet from profile into 'Other' category (only if not skipped and no skills exist)
    if (!skipSkills) {
      setSkills(prev => {
        const hasAny = prev.some(cat => cat.items.length > 0);
        if (hasAny) return prev; // Keep existing skills
        if (studentData.skillSet) {
          const profileSkills = studentData.skillSet
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
          if (profileSkills.length > 0) {
            return prev.map(cat =>
              cat.category === 'Other'
                ? { ...cat, items: [...new Set([...cat.items, ...profileSkills])] }
                : cat
            );
          }
        }
        return prev;
      });
    }
  }, [studentData]);

  // ===== ATS KEYWORD REFERENCE (for AI prompts only, NOT auto-added to skills) =====
  const getATSKeywords = useCallback((jobRole, customJobRole = '') => {
    const roleToUse = jobRole === 'Others' ? customJobRole : jobRole;
    if (!roleToUse || !roleToUse.trim()) return [];
    return ATS_KEYWORDS[jobRole] || [];
  }, []);

  // ===== CHIP HELPERS =====
  const removeChip = useCallback((list, setList, index) => {
    setList(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ===== POPUP HANDLERS =====
  const openExperiencePopup = (index = null) => {
    setEditIndex(index);
    setActivePopup('experience');
  };

  const openProjectPopup = (index = null) => {
    setEditIndex(index);
    setActivePopup('project');
  };

  const openCertificationPopup = (index = null) => {
    setEditIndex(index);
    setActivePopup('certification');
  };

  const openAchievementPopup = (index = null) => {
    setEditIndex(index);
    setActivePopup('achievement');
  };

  const openAdditionalInfoPopup = (index = null) => {
    setEditIndex(index);
    setActivePopup('additionalInfo');
  };

  const closePopup = () => {
    setActivePopup(null);
    setEditIndex(null);
  };

  // ===== SAVE HANDLERS from Popups =====
  const saveExperience = (data) => {
    console.log('ResumeBuilder - Received from popup:', data);
    
    const label = data.title || data.companyName || 'Experience';
    const updatedData = { ...data, label };

    setExperiences(prev => {
      let newExperiences;
      if (editIndex !== null) {
        newExperiences = [...prev];
        newExperiences[editIndex] = updatedData;
      } else {
        newExperiences = [...prev, updatedData];
      }
      
      // Save to localStorage immediately so it isn't lost on refresh
      const storageKey = getStorageKey();
      const currentStorage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      localStorage.setItem(storageKey, JSON.stringify({
        ...currentStorage,
        experiences: newExperiences
      }));

      // Auto-sync to MongoDB so technologies/projects persist
      syncToMongoDB({ experiences: newExperiences });
      
      return newExperiences;
    });
    
    closePopup();
  };

  const saveProject = (data) => {
    console.log('ResumeBuilder - Received project from popup:', data);
    
    const label = data.name || 'Project';
    const updatedData = { ...data, label };

    setProjects(prev => {
      let newProjects;
      if (editIndex !== null) {
        newProjects = [...prev];
        newProjects[editIndex] = updatedData;
      } else {
        newProjects = [...prev, updatedData];
      }
      
      // Save to localStorage immediately
      const storageKey = getStorageKey();
      const currentStorage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      localStorage.setItem(storageKey, JSON.stringify({
        ...currentStorage,
        projects: newProjects
      }));

      // Auto-sync to MongoDB so technologies persist
      syncToMongoDB({ projects: newProjects });
      
      return newProjects;
    });
    
    closePopup();
  };

  const saveCertification = (data) => {
    const label = data.certificateName || 'Certification';
    if (editIndex !== null) {
      setCertifications(prev => {
        const copy = [...prev];
        copy[editIndex] = { ...data, label };
        return copy;
      });
    } else {
      setCertifications(prev => [...prev, { ...data, label }]);
    }
    closePopup();
  };

  const saveAchievement = (data) => {
    const label = data.details ? data.details.substring(0, 40) + (data.details.length > 40 ? '...' : '') : 'Achievement';
    if (editIndex !== null) {
      setAchievements(prev => {
        const copy = [...prev];
        copy[editIndex] = { ...data, label };
        return copy;
      });
    } else {
      setAchievements(prev => [...prev, { ...data, label }]);
    }
    closePopup();
  };

  const saveAdditionalInfoItem = (data) => {
    const label = data.info ? data.info.substring(0, 40) + (data.info.length > 40 ? '...' : '') : 'Info';
    if (editIndex !== null) {
      setAdditionalInfo(prev => {
        const copy = [...prev];
        copy[editIndex] = { ...data, label };
        return copy;
      });
    } else {
      setAdditionalInfo(prev => [...prev, { ...data, label }]);
    }
    closePopup();
  };

  // ===== PLATFORM HANDLERS =====
  const addPlatformRow = () => {
    setPlatforms(prev => [...prev, { name: '', url: '' }]);
    setEditingPlatformIndex(platforms.length);
  };

  const commitPlatformName = (index, name) => {
    const trimmed = name.trim();
    if (trimmed) {
      // Check for duplicate names
      const isDuplicate = platforms.some((p, i) => i !== index && p.name.toLowerCase() === trimmed.toLowerCase());
      if (isDuplicate) {
        // Remove the empty row if duplicate
        setPlatforms(prev => prev.filter((_, i) => i !== index));
      } else {
        setPlatforms(prev => prev.map((p, i) => i === index ? { ...p, name: trimmed } : p));
      }
    } else {
      // Remove empty-named platform
      setPlatforms(prev => prev.filter((_, i) => i !== index));
    }
    setEditingPlatformIndex(null);
  };

  // Auto-focus platform name input when editing
  useEffect(() => {
    if (editingPlatformIndex !== null && platformNameInputRef.current) {
      platformNameInputRef.current.focus();
    }
  }, [editingPlatformIndex]);

  // Auto-focus skill input when shown
  useEffect(() => {
    if (activeSkillCategory !== null && skillInputRef.current) {
      skillInputRef.current.focus();
    }
  }, [activeSkillCategory]);

  const removePlatform = (index) => {
    setPlatforms(prev => prev.filter((_, i) => i !== index));
  };

  const updatePlatformUrl = (index, url) => {
    setPlatforms(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], url };
      return copy;
    });
  };

  // ===== AI CONTENT GENERATION (called automatically during Create when AI is enabled) =====
  const aiGenerateAllContent = async (resumeData) => {
    if (!resumeSettings.enableAI) return resumeData;
    
    const jobRole = resumeSettings.jobRole === 'Others' ? resumeSettings.customJobRole : resumeSettings.jobRole;
    const pageLimit = resumeSettings.pages; // '1', '2', or 'no-limit'
    const atsKeywords = getATSKeywords(resumeSettings.jobRole, resumeSettings.customJobRole);
    
    // Determine word limits based on page count
    const summaryWordLimit = pageLimit === '1' ? '40-60' : pageLimit === '2' ? '60-90' : '80-120';
    const expWordLimit = pageLimit === '1' ? '25-40' : pageLimit === '2' ? '40-60' : '50-80';
    const projWordLimit = pageLimit === '1' ? '20-35' : pageLimit === '2' ? '35-55' : '45-70';
    
    try {
      const { default: aiService } = await import('../services/ollamaService.jsx');
      
      // 1. BATCH AI GENERATION (Replaces individual loops)
      
      // Structure the input for batch processing
      const inputData = {
        job_role: jobRole || 'Software Developer',
        student_name: resumeData.personalInfo?.name || 'Student',
        education: `${resumeData.education?.degree || 'B.E.'} in ${resumeData.education?.branch || 'Engineering'}`,
        skills: resumeData.skills?.flatMap(c => c.items).slice(0, 15).join(', ') || '',
        summary_input: resumeData.summary || '',
        experiences: resumeData.experiences?.map((exp) => exp.description || '').filter(d => d.trim().length > 0) || [],
        projects: resumeData.projects?.map((proj) => ({ title: proj.name, tech: proj.technologies?.join(', '), input: proj.description || '' })).filter(p => p.input.trim().length > 0) || [],
        certifications: resumeData.certifications?.map((cert) => ({ name: cert.certificateName, input: cert.description || '' })).filter(c => c.input.trim().length > 0) || [],
        achievements: resumeData.achievements?.map((ach) => ach.details || '').filter(d => d.trim().length > 0) || [],
        ats_keywords: atsKeywords.slice(0, 10)
      };

      // Only proceed if there is content to generate
      const hasSummary = !!inputData.summary_input;
      const hasExperiences = inputData.experiences.length > 0;
      const hasProjects = inputData.projects.length > 0;
      const hasCertifications = inputData.certifications.length > 0;
      const hasAchievements = inputData.achievements.length > 0;

      if (hasSummary || hasExperiences || hasProjects || hasCertifications || hasAchievements) {
        const batchPrompt = `
You are an expert Technical Recruiter and Resume Writer.

TASK: Rewrite and polish multiple sections of a resume in a SINGLE step.
Target Role: ${inputData.job_role}

INPUT DATA:
${JSON.stringify(inputData, null, 2)}

INSTRUCTIONS:
1. Professional Summary: Rewrite into a strong ${summaryWordLimit} word paragraph (Third person, no "I", no headers).
2. Experiences: Optimize each description provided in the 'experiences' array (${expWordLimit} words each). Use strong action verbs.
3. Projects: Optimize each project description provided in the 'projects' array (${projWordLimit} words each). Highlight technical impact.
4. Certifications: Polish each certification description into exactly ONE short sentence (8-15 words MAX). Keep it concise — do NOT exceed 15 words.
5. Achievements: Polish each achievement into exactly ONE short sentence (8-15 words MAX). Keep it concise — do NOT exceed 15 words.

OUTPUT FORMAT:
Return strictly minimal valid JSON with this structure:
{
  "summary": "polished summary text",
  "experiences": ["polished description 1", "polished description 2", ...], 
  "projects": ["polished description 1", "polished description 2", ...],
  "certifications": ["polished description 1", "polished description 2", ...],
  "achievements": ["polished achievement 1", "polished achievement 2", ...]
}

Rules:
- The "experiences" array must match the input order exactly.
- The "projects" array must match the input order exactly.
- The "certifications" array must match the input order exactly.
- The "achievements" array must match the input order exactly.
- Do NOT include any markdown formatting or extra text. Just the raw JSON object.
`;

        try {
          console.log('🤖 Sending Batch AI Request...');
          // Call AI Service (Single Request)
          const resultText = await aiService.generateContent(batchPrompt, 'json');
          
          // Parse Response
          const result = aiService.cleanJson(resultText);
          
          if (result) {
            // Apply Summary
            if (result.summary && hasSummary) {
              resumeData.summary = result.summary;
            }

            // Apply Experiences
            if (Array.isArray(result.experiences)) {
              let resultIdx = 0;
              for (let i = 0; i < (resumeData.experiences?.length || 0); i++) {
                if (resumeData.experiences[i].description && resumeData.experiences[i].description.trim()) {
                  if (result.experiences[resultIdx]) {
                    // Ensure we store a string, not an object
                    const expVal = result.experiences[resultIdx];
                    const expStr = typeof expVal === 'string' ? expVal : (expVal?.input || expVal?.description || expVal?.text || JSON.stringify(expVal));
                    resumeData.experiences[i].description = expStr.trim();
                  }
                  resultIdx++;
                }
              }
            }

            // Apply Projects
            if (Array.isArray(result.projects)) {
              let resultIdx = 0;
              for (let i = 0; i < (resumeData.projects?.length || 0); i++) {
                if (resumeData.projects[i].description && resumeData.projects[i].description.trim()) {
                  if (result.projects[resultIdx]) {
                    // Ensure we store a string, not an object
                    const projVal = result.projects[resultIdx];
                    const projStr = typeof projVal === 'string' ? projVal : (projVal?.input || projVal?.description || projVal?.text || JSON.stringify(projVal));
                    resumeData.projects[i].description = projStr.trim();
                  }
                  resultIdx++;
                }
              }
            }

            // Apply Certifications
            if (Array.isArray(result.certifications)) {
              let resultIdx = 0;
              for (let i = 0; i < (resumeData.certifications?.length || 0); i++) {
                if (resumeData.certifications[i].description && resumeData.certifications[i].description.trim()) {
                  if (result.certifications[resultIdx]) {
                    const certVal = result.certifications[resultIdx];
                    const certStr = typeof certVal === 'string' ? certVal : (certVal?.input || certVal?.description || certVal?.text || JSON.stringify(certVal));
                    resumeData.certifications[i].description = certStr.trim();
                  }
                  resultIdx++;
                }
              }
            }

            // Apply Achievements
            if (Array.isArray(result.achievements)) {
              let resultIdx = 0;
              for (let i = 0; i < (resumeData.achievements?.length || 0); i++) {
                if (resumeData.achievements[i].details && resumeData.achievements[i].details.trim()) {
                  if (result.achievements[resultIdx]) {
                    const achVal = result.achievements[resultIdx];
                    const achStr = typeof achVal === 'string' ? achVal : (achVal?.input || achVal?.details || achVal?.text || JSON.stringify(achVal));
                    resumeData.achievements[i].details = achStr.trim();
                  }
                  resultIdx++;
                }
              }
            }
            
            console.log('✅ Batch AI generation applied successfully');
          }
        } catch (e) {
          // If rate-limited, propagate so handleCreate can show a user message
          if (e.message?.includes('RATE_LIMITED')) {
            throw e;
          }
          console.warn('AI batch generation failed:', e.message);
        }
      }
      
      /* REMOVED INDIVIDUAL LOOPS */

    } catch (err) {
      console.error('AI content generation error:', err);
      // Propagate rate limit errors to handleCreate
      if (err.message?.includes('RATE_LIMITED')) {
        throw err;
      }
    }
    
    return resumeData;
  };

  // ===== CLIENT-SIDE PDF FALLBACK =====
  const generateClientSidePdf = async () => {
    const html = buildResumeHtml();
    // Create a hidden iframe, render the HTML, and use it to generate PDF via print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Save the HTML as a data URL so it can be used for preview/download
      const blob = new Blob([html], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(blob);
      setResumePdfUrl(htmlUrl);
      
      // Store resume data in localStorage for resume page compatibility
      const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || '{}');
      updatedStudentData.resumeData = {
        url: htmlUrl,
        name: `${personalInfo.name || 'Resume'}_Resume.pdf`,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
      window.dispatchEvent(new Event('storage'));
      
      // Trigger print for PDF save
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const buildResumeHtml = () => {
    // Google Fonts mapping for client-side fallback (no font installation needed)
    const googleFontsMap = {
      'Arial': { import: 'Arimo:wght@400;700', stack: "'Arimo', 'Arial', 'Helvetica', sans-serif" },
      'Times New Roman': { import: 'Tinos:wght@400;700', stack: "'Tinos', 'Times New Roman', 'Times', serif" },
      'Calibri': { import: 'Carlito:wght@400;700', stack: "'Carlito', 'Calibri', 'Candara', sans-serif" },
      'Georgia': { import: 'Tinos:wght@400;700', stack: "'Tinos', 'Georgia', 'Times New Roman', serif" },
      'Helvetica': { import: 'Arimo:wght@400;700', stack: "'Arimo', 'Helvetica', 'Arial', sans-serif" },
      'Cambria': { import: 'Caladea:wght@400;700', stack: "'Caladea', 'Cambria', 'Georgia', serif" },
      'Garamond': { import: 'EB+Garamond:wght@400;700', stack: "'EB Garamond', 'Garamond', 'Georgia', serif" },
      'Verdana': { import: 'Open+Sans:wght@400;700', stack: "'Open Sans', 'Verdana', 'Geneva', sans-serif" }
    };
    const selectedFont = resumeSettings.fontStyle || 'Arial';
    const fontConfig = googleFontsMap[selectedFont] || googleFontsMap['Arial'];
    const fontStack = fontConfig.stack;
    const googleFontImport = fontConfig.import;

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Resume - ${personalInfo.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${googleFontImport}&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: ${fontStack} !important; }
  body { font-family: ${fontStack} !important; font-size: 11pt; line-height: 1.4; color: #333; padding: 0.5in 0.7in; max-width: 8.5in; }
  h1 { font-family: ${fontStack} !important; font-size: 20pt; color: #1a1a1a; text-align: center; margin-bottom: 4px; }
  .contact { text-align: center; font-size: 9.5pt; color: #555; margin-bottom: 12px; }
  .contact a { color: #0066cc; text-decoration: none; font-weight: 500; }
  .contact a:hover { text-decoration: underline; }
  .header-container { display: flex; align-items: center; justify-content: flex-start; gap: 24px; margin-bottom: 10px; }
  .header-container.photo-left { flex-direction: row; }
  .header-container.photo-right { flex-direction: row-reverse; }
  .header-text { flex: 1; text-align: center; }
  .profile-photo { width: 100px; aspect-ratio: 1 / 1; object-fit: cover; flex-shrink: 0; display: block; }
  .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1.5px solid #333; padding-bottom: 2px; margin: 14px 0 6px 0; color: #1a1a1a; letter-spacing: 0.5px; font-family: ${fontStack} !important; }
  .entry { margin-bottom: 8px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; font-size: 10.5pt; gap: 15px; width: 100%; }
  .entry-header > span:last-child { white-space: nowrap; flex-shrink: 0; text-align: right; padding-right: 5px; }
  .entry-sub { font-style: italic; font-size: 10pt; color: #555; margin-bottom: 2px; }
  .entry-desc { font-size: 10pt; margin-left: 12px; }
  ul { margin-left: 16px; }
  li { font-size: 10pt; margin-bottom: 2px; }
  .skills-list { font-size: 10pt; margin-left: 16px; }
  .skills-list li { margin-bottom: 2px; }
  .skills-list li strong { font-weight: bold; }
  @media print { body { padding: 0.4in 0.5in; } }
</style></head><body>
${(() => {
  const showPhoto = resumeSettings.profilePhoto === true;
  const photoPos = resumeSettings.photoPosition || 'Left';
  const photoUrl = studentData?.profilePicURL || studentData?.profilePic || personalInfo.photo || '';
  if (showPhoto && photoUrl) {
    return `<div class="header-container photo-${photoPos.toLowerCase()}">
      <img src="${photoUrl}" alt="" class="profile-photo" onerror="this.style.display='none';" />
      <div class="header-text">
        <h1>${personalInfo.name || 'Your Name'}</h1>
        <div class="contact">
          ${[
            personalInfo.mobile || '',
            personalInfo.email || '',
            personalInfo.linkedin ? '<a href="' + (personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : 'https://' + personalInfo.linkedin) + '" target="_blank">LinkedIn</a>' : '',
            personalInfo.github ? '<a href="' + (personalInfo.github.startsWith('http') ? personalInfo.github : 'https://' + personalInfo.github) + '" target="_blank">GitHub</a>' : '',
            personalInfo.portfolio ? '<a href="' + (personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : 'https://' + personalInfo.portfolio) + '" target="_blank">Portfolio</a>' : ''
          ].filter(item => item !== '').join(' | ')}
          ${platforms.filter(p => p.url).length > 0 ? '<br/>' + platforms.filter(p => p.url).map(p => '<a href="' + (p.url.startsWith('http') ? p.url : 'https://' + p.url) + '" target="_blank">' + p.name + '</a>').join(' | ') : ''}
        </div>
      </div>
    </div>`;
  }
  return `<h1>${personalInfo.name || 'Your Name'}</h1>
<div class="contact">
  ${[
    personalInfo.mobile || '',
    personalInfo.email || '',
    personalInfo.linkedin ? '<a href="' + (personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : 'https://' + personalInfo.linkedin) + '" target="_blank">LinkedIn</a>' : '',
    personalInfo.github ? '<a href="' + (personalInfo.github.startsWith('http') ? personalInfo.github : 'https://' + personalInfo.github) + '" target="_blank">GitHub</a>' : '',
    personalInfo.portfolio ? '<a href="' + (personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : 'https://' + personalInfo.portfolio) + '" target="_blank">Portfolio</a>' : ''
  ].filter(item => item !== '').join(' | ')}
  ${platforms.filter(p => p.url).length > 0 ? '<br/>' + platforms.filter(p => p.url).map(p => '<a href="' + (p.url.startsWith('http') ? p.url : 'https://' + p.url) + '" target="_blank">' + p.name + '</a>').join(' | ') : ''}
</div>`;
})()}

${summary ? `<div class="section-title">Professional Summary</div><p style="font-size:10pt;">${summary}</p>` : ''}

${skills.some(c => c.items?.length > 0) ? `<div class="section-title">Skills</div><ul class="skills-list">${skills.filter(c => c.items?.length > 0).map(c => `<li><strong>${c.category}:</strong> ${c.items.join(', ')}</li>`).join('')}</ul>` : ''}

${experiences.length > 0 ? `<div class="section-title">Internship</div>
${experiences.map(e => {
  const fmtDate = (d) => { if (!d) return ''; const p = d.split('-'); return p.length === 3 ? p[2]+'-'+p[1]+'-'+p[0] : d; };
  const modeLabel = e.mode === 'remote' ? 'Remote' : e.mode === 'hybrid' ? 'Hybrid' : e.mode === 'in-person' ? 'On-Site' : '';
  const titleParts = [];
  if (e.companyName) titleParts.push(e.companyName);
  if (e.location) titleParts.push(e.location);
  const titleStr = titleParts.join(', ') + (modeLabel ? ' (' + modeLabel + ')' : '');
  return `<div class="entry">
  <div class="entry-header"><span>${titleStr}</span><span>${fmtDate(e.fromDate)}${e.fromDate ? ' to ' : ''}${fmtDate(e.toDate) || 'Present'}</span></div>
  ${e.description ? `<div class="entry-desc">${(typeof e.description === 'string' ? e.description : e.description).trim()}</div>` : ''}
  ${e.technologies?.length ? `<div class="entry-desc" style="margin-top:2px;"><strong>Tech:</strong> ${e.technologies.join(', ')}</div>` : ''}
</div>`;
}).join('')}` : ''}

${projects.length > 0 ? `<div class="section-title">Projects</div>
${projects.map(p => {
  const name = typeof p === 'string' ? p : (p.name || p.label);
  const desc = typeof p === 'string' ? '' : p.description;
  const tech = typeof p === 'string' ? [] : (p.technologies || []);
  const github = typeof p === 'string' ? '' : p.githubRepo;
  const hosting = typeof p === 'string' ? '' : (p.hostingLink || '');
  return `<div class="entry">
    <div class="entry-header"><span>${name}</span><span style="font-size:9.5pt;">${github ? `<a href="${github}" target="_blank" style="color:#1565c0;text-decoration:none;">GitHub</a>` : ''}${github && hosting ? ' | ' : ''}${hosting ? `<a href="${hosting}" target="_blank" style="color:#1565c0;text-decoration:none;">Live Demo</a>` : ''}</span></div>
    ${desc ? `<div class="entry-desc">${desc}</div>` : ''}
    ${tech.length ? `<div class="entry-desc"><strong>Tech:</strong> ${tech.join(', ')}</div>` : ''}
  </div>`;
}).join('')}` : ''}

${certifications.length > 0 ? `<div class="section-title">Certifications</div>
${certifications.map(c => {
  const name = typeof c === 'string' ? c : c.certificateName;
  const desc = typeof c === 'string' ? '' : (c.description || '');
  return `<div style="margin-bottom:6px;"><strong>${name}</strong>${desc ? `<br/><span style="font-size:10pt;color:#444;">${desc}</span>` : ''}</div>`;
}).join('')}` : ''}

${achievements.length > 0 ? `<div class="section-title">Achievements</div><ul>
${achievements.map(a => `<li>${typeof a === 'string' ? a : a.details}</li>`).join('')}</ul>` : ''}

${additionalInfo.length > 0 ? `<div class="section-title">Additional Information</div><ul>
${additionalInfo.map(a => `<li>${typeof a === 'string' ? a : a.info}</li>`).join('')}</ul>` : ''}

${education.college || education.school12 || education.school10 ? `<div class="section-title">Education</div>
${education.college ? `<div class="entry"><div class="entry-header"><span>${education.degree || 'B.E.'} in ${education.branch || 'Engineering'} - ${education.college}</span><span>${education.graduationYear || ''}</span></div><div class="entry-sub">CGPA: ${education.cgpa || 'N/A'}</div></div>` : ''}
${education.school12 ? `<div class="entry"><div class="entry-header"><span>12th - ${education.school12}</span><span>${education.batch12 || ''}</span></div><div class="entry-sub">Percentile: ${education.percentile12 || 'N/A'}</div></div>` : ''}
${education.school10 ? `<div class="entry"><div class="entry-header"><span>10th - ${education.school10}</span><span>${education.batch10 || ''}</span></div><div class="entry-sub">Percentile: ${education.percentile10 || 'N/A'}</div></div>` : ''}` : ''}

</body></html>`;
  };

  // ===== PREVIEW =====
  const handlePreview = () => {
    if (resumePdfUrl) {
      window.open(resumePdfUrl, '_blank');
    } else {
      // Preview as HTML
      const html = buildResumeHtml();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    }
  };

  // ===== DOWNLOAD =====
  const handleDownload = () => {
    if (resumePdfUrl) {
      const link = document.createElement('a');
      link.href = resumePdfUrl;
      link.download = `${personalInfo.name || 'Resume'}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      generateClientSidePdf();
    }
  };

  // ===== DISCARD ALL =====
  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard all changes?')) {
      setPersonalInfo({ name: '', mobile: '', email: '', linkedin: '', github: '', portfolio: '' });
      setSummary('');
      setEducation({ college: '', degree: '', branch: '', cgpa: '', graduationYear: '', school12: '', percentile12: '', batch12: '', school10: '', percentile10: '', batch10: '' });
      setPlatforms([{ name: 'Leetcode', url: '' }, { name: 'Hacker Rank', url: '' }]);
      setSkills(DEFAULT_SKILL_CATEGORIES.map(c => ({ ...c, items: [...c.items] }))); setExperiences([]); setProjects([]); setCertifications([]); setAchievements([]); setAdditionalInfo([]); setActiveSkillCategory(null);
      setResumePdfUrl(null);
      localStorage.removeItem(getStorageKey());
      // Also remove legacy non-user-specific key if present
      localStorage.removeItem('resumeBuilderData');
    }
  };

  // ===== CREATE RESUME (Save + Generate PDF) =====
  const handleCreate = async () => {
    // Prevent multiple clicks
    if (hasCreatedOnce || isCreating) return;
    
    setHasCreatedOnce(true); // Disable button after first click
    setIsCreating(true);
    setCreateProgress(0);
    setCreateStatus('Preparing resume data...');

    try {
      // Step 1: Save data
      setCreateStatus('Saving your data...');
      setCreateProgress(5);
      
      // Add student's profile photo to personal info
      const photoUrl = studentData?.profilePicURL || studentData?.profilePic || localStorage.getItem('cachedProfilePicUrl') || '';
      console.log('📷 Adding profile photo to resume:', photoUrl);
      console.log('📷 studentData.profilePicURL:', studentData?.profilePicURL);
      console.log('📷 studentData.profilePic:', studentData?.profilePic);
      
      const personalInfoWithPhoto = {
        ...personalInfo,
        photo: photoUrl,
        profilePicURL: photoUrl
      };
      
      const resumeData = {
        personalInfo: personalInfoWithPhoto, education, platforms, skills,
        experiences, projects, certifications, achievements, additionalInfo,
        resumeSettings,
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(resumeData));

      // Step 2: Save to backend MongoDB
      setCreateProgress(10);
      setCreateStatus('Syncing to database...');
      const studentId = studentData?._id || studentData?.id;
      const token = localStorage.getItem('token');
      const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

      if (studentId) {
        try {
          const saveResponse = await fetch(`${API_BASE}/api/resume-builder/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ studentId, resumeData }),
          });
          if (saveResponse.ok) {
            console.log('✅ Resume data saved to MongoDB');
          } else {
            console.warn('⚠️ MongoDB save failed:', await saveResponse.text());
          }
        } catch (saveErr) {
          console.warn('⚠️ MongoDB save error:', saveErr);
        }
      }
      setCreateProgress(15);

      // Step 3: Build full resume data
      setCreateStatus('Building resume structure...');
      let fullResumeData = {
        ...resumeData,
        summary,
        experiences: experiences.map(e => ({
          title: e.title || e.label,
          label: e.label || e.title || e.companyName || 'Experience',
          companyName: e.companyName,
          location: e.location,
          mode: e.mode || 'in-person',
          fromDate: e.fromDate,
          toDate: e.toDate,
          technologies: e.technologies || [],
          projects: e.projects || [],
          description: typeof e.description === 'object' && e.description !== null
            ? (e.description.input || e.description.description || e.description.text || '')
            : (e.description || ''),
        })),
        projects: projects.map(p => typeof p === 'string' ? { name: p } : {
          name: p.name || p.label,
          label: p.label || p.name || 'Project',
          technologies: p.technologies || [],
          description: typeof p.description === 'object' && p.description !== null
            ? (p.description.input || p.description.description || p.description.text || '')
            : (p.description || ''),
          githubRepo: p.githubRepo,
          hostingLink: p.hostingLink,
        }),
      };
      setCreateProgress(20);
      
      // Step 4: AI batch generation (single request)
      if (resumeSettings.enableAI) {
        console.log('🤖 AI enabled — auto-generating content...');
        setCreateStatus('AI is polishing your content...');
        
        // Animated progress during AI wait (20% → 55% over ~30s)
        const aiProgressInterval = setInterval(() => {
          setCreateProgress(prev => {
            if (prev >= 55) { clearInterval(aiProgressInterval); return 55; }
            return prev + 0.5;
          });
        }, 500);

        // Dynamic status messages while AI works
        const aiStatusMessages = [
          'AI is polishing your content...',
          'Crafting professional summary...',
          'Optimizing experience descriptions...',
          'Enhancing project highlights...',
          'Weaving in ATS keywords...',
          'Fine-tuning word count & tone...',
          'Almost there, reviewing quality...',
        ];
        let statusIdx = 0;
        const aiStatusInterval = setInterval(() => {
          statusIdx = (statusIdx + 1) % aiStatusMessages.length;
          setCreateStatus(aiStatusMessages[statusIdx]);
        }, 4000);

        fullResumeData = await aiGenerateAllContent(fullResumeData);
        
        clearInterval(aiProgressInterval);
        clearInterval(aiStatusInterval);
        setCreateProgress(55);
        setCreateStatus('AI content polished!');
        console.log('✅ AI content generation complete');
        // Brief pause to show success
        await new Promise(r => setTimeout(r, 600));

        // Step 4b: Save AI-polished data back to MongoDB
        if (studentId) {
          try {
            setCreateStatus('Saving AI-polished data...');
            const polishedSaveResponse = await fetch(`${API_BASE}/api/resume-builder/save`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ studentId, resumeData: fullResumeData }),
            });
            if (polishedSaveResponse.ok) {
              console.log('✅ AI-polished resume data saved to MongoDB');
            } else {
              console.warn('⚠️ AI-polished data MongoDB save failed:', await polishedSaveResponse.text());
            }
          } catch (polishedSaveErr) {
            console.warn('⚠️ AI-polished data save error:', polishedSaveErr);
          }
        }
      }

      // Step 5: Generate PDF on server
      setCreateStatus('Generating PDF...');
      setCreateProgress(60);

      const pdfProgressInterval = setInterval(() => {
        setCreateProgress(prev => {
          if (prev >= 85) { clearInterval(pdfProgressInterval); return 85; }
          return prev + 2;
        });
      }, 400);

      const response = await fetch(`${API_BASE}/api/resume-builder/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ studentId, resumeData: fullResumeData }),
      });

      clearInterval(pdfProgressInterval);

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      setCreateProgress(88);
      setCreateStatus('Downloading PDF...');

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      setResumePdfUrl(pdfUrl);

      // Step 6: Upload to GridFS & save
      setCreateProgress(92);
      setCreateStatus('Saving to your profile...');

      // Upload the PDF blob to GridFS
      const pdfFile = new File([blob], `${personalInfo.name || 'Resume'}_Resume.pdf`, { type: 'application/pdf' });
      let gridfsUrl = '';
      try {
        const gridfsService = (await import('../services/gridfsService')).default;
        const uploadResult = await gridfsService.uploadResume(pdfFile, studentId);
        gridfsUrl = uploadResult.gridfsFileUrl;
        console.log('✅ Resume uploaded to GridFS:', gridfsUrl);
      } catch (gridfsErr) {
        console.error('⚠️ GridFS upload failed, continuing with blob URL:', gridfsErr);
      }

      const resumeUrl = gridfsUrl || pdfUrl;
      const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || '{}');
      updatedStudentData.resumeData = {
        url: resumeUrl,
        name: `${personalInfo.name || 'Resume'}_Resume.pdf`,
        createdAt: new Date().toISOString()
      };
      updatedStudentData.resumeURL = resumeUrl;
      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
      
      // Update resume cache so the Resume page shows buttons immediately
      localStorage.setItem('studentResumeStatus', JSON.stringify({
        hasResume: true,
        checkedAt: Date.now()
      }));
      localStorage.setItem('studentResumeData', JSON.stringify({
        resume: {
          url: resumeUrl,
          name: `${personalInfo.name || 'Resume'}_Resume.pdf`,
          createdAt: new Date().toISOString()
        },
        cachedAt: Date.now()
      }));
      
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('profileUpdated'));
      window.dispatchEvent(new Event('resumeBuilt'));
      console.log('✅ Resume saved with GridFS URL for resume page');

      // Don't auto-open, let user click Preview button
      // window.open(pdfUrl, '_blank');
      console.log('✅ Resume ready for preview');

      setCreateProgress(100);
      setCreateStatus('Resume ready!');

      setTimeout(() => {
        setIsCreating(false);
        setIsPreviewing(false);
        setShowCreated(true);
      }, 800);
    } catch (err) {
      console.error('Resume creation failed:', err);
      
      // Rate-limited: show clear message, don't try fallback
      if (err.message?.includes('RATE_LIMITED')) {
        setCreateStatus('API rate limit reached');
        setCreateProgress(0);
        setTimeout(() => {
          setIsCreating(false);
          alert('AI generation failed. Please make sure Ollama is running and try again. Your data is saved.');
        }, 500);
        return;
      }

      setCreateStatus('Trying fallback...');

      // Fallback: client-side PDF
      try {
        await generateClientSidePdf();
        setCreateProgress(100);
        setCreateStatus('Resume ready!');
        setTimeout(() => {
          setIsCreating(false);
          setIsPreviewing(false);
          setShowCreated(true);
        }, 600);
      } catch (fallbackErr) {
        console.error('Client PDF fallback failed:', fallbackErr);
        setIsCreating(false);
        alert('Resume creation failed. Please check your connection and try again.');
      }
    }
  };

  // ===== LOAD SAVED DATA =====
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const studentId = studentData?._id || studentData?.id;
        const token = localStorage.getItem('token');
        const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

        let saved = null;

        // 1. Check if data was pre-fetched from the Resume page (within last 30 seconds)
        const preFetchedAt = parseInt(localStorage.getItem('resumeDataPreFetched') || '0', 10);
        const isPreFetched = (Date.now() - preFetchedAt) < 30000;

        if (isPreFetched) {
          // Data was just pre-fetched and cached in localStorage — skip MongoDB call
          localStorage.removeItem('resumeDataPreFetched');
          const storageKey = getStorageKey();
          saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
          if (saved) {
            console.log('⚡ Resume data loaded instantly from pre-fetch cache');
          }
        }

        // 2. If not pre-fetched, fetch from MongoDB
        if (!saved && studentId) {
          try {
            const response = await fetch(`${API_BASE}/api/resume-builder/load/${studentId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.resumeData) {
                saved = data.resumeData;
                // Update localStorage with MongoDB data
                localStorage.setItem(getStorageKey(), JSON.stringify(saved));
                console.log('✅ Resume data loaded from MongoDB');
              }
            }
          } catch (fetchErr) {
            console.warn('⚠️ MongoDB fetch failed, falling back to localStorage:', fetchErr);
          }
        }

        // 2. Fallback to localStorage if MongoDB fetch failed or returned nothing
        if (!saved) {
          const storageKey = getStorageKey();
          saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
          
          // Migration: if no user-specific data exists, check legacy key and migrate
          if (!saved && storageKey !== 'resumeBuilderData') {
            const legacyData = JSON.parse(localStorage.getItem('resumeBuilderData') || 'null');
            if (legacyData) {
              // Only migrate if the legacy data matches this student's info
              const currentName = `${studentData?.firstName || ''} ${studentData?.lastName || ''}`.trim();
              const legacyName = legacyData.personalInfo?.name?.trim();
              if (legacyName && currentName && legacyName === currentName) {
                saved = legacyData;
                localStorage.setItem(storageKey, JSON.stringify(legacyData));
              }
              // Remove legacy key to prevent data leaks to other users
              localStorage.removeItem('resumeBuilderData');
            }
          }
          
          if (saved) {
            console.log('✅ Resume data loaded from localStorage');
          }
        }
        
        // 3. Populate form fields with loaded data
        if (saved) {
          if (saved.personalInfo) setPersonalInfo(prev => ({ ...prev, ...saved.personalInfo }));
          if (saved.summary) setSummary(saved.summary);
          if (saved.education) setEducation(prev => ({ ...prev, ...saved.education }));
          if (saved.platforms?.length) setPlatforms(saved.platforms);
          // Important: saved.skills can be [] (empty array) which means user wants no skills
          if (saved.skills !== undefined) {
            // Backward compatibility: convert flat array to categorized format
            if (Array.isArray(saved.skills) && saved.skills.length > 0 && typeof saved.skills[0] === 'string') {
              setSkills(prev => prev.map(cat =>
                cat.category === 'Other'
                  ? { ...cat, items: saved.skills }
                  : cat
              ));
            } else if (Array.isArray(saved.skills)) {
              setSkills(saved.skills.length > 0 ? saved.skills : DEFAULT_SKILL_CATEGORIES.map(c => ({ ...c, items: [...c.items] })));
            }
          }
          if (saved.experiences?.length) setExperiences(saved.experiences.map(e => ({
            ...e,
            description: typeof e.description === 'object' && e.description !== null
              ? (e.description.input || e.description.description || e.description.text || '')
              : (e.description || ''),
          })));
          if (saved.projects?.length) setProjects(saved.projects.map(p => ({
            ...p,
            description: typeof p.description === 'object' && p.description !== null
              ? (p.description.input || p.description.description || p.description.text || '')
              : (p.description || ''),
          })));
          if (saved.certifications?.length) setCertifications(saved.certifications);
          if (saved.achievements?.length) setAchievements(saved.achievements);
          if (saved.additionalInfo?.length) setAdditionalInfo(saved.additionalInfo);
          if (saved.resumeSettings) setResumeSettings(prev => ({ ...prev, ...saved.resumeSettings, profilePhoto: false }));
          
          // After loading saved data, fill in any missing fields from student profile
          // Skip skills auto-populate because skills were explicitly saved (even if empty)
          setTimeout(() => autoPopulateFromProfile(true), 100);
        } else {
          // No saved data at all, populate everything from student profile (including skills)
          autoPopulateFromProfile(false);
        }
      } catch (e) {
        console.error('Error loading resume data:', e);
        // On error, try to populate from student profile (including skills since no saved data)
        autoPopulateFromProfile(false);
      }
    };

    if (studentData) {
      fetchResumeData();
    }
  }, [studentData, getStorageKey, autoPopulateFromProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Job role change is tracked but no longer auto-adds keywords to skills

  // ===== RENDER =====
  return (
    <div>
      {/* Header */}
      <div className={styles.headerSection}>
        <p className={styles.headerSubtitle}>Let's Build an ATS-friendly Resume for you easily in minutes.</p>
      </div>

      {/* ===== RESUME SETTINGS ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Resume Settings</h3>
        <div className={styles.settingsGrid}>
          {/* Job Role */}
          <div className={styles.settingsField}>
            <label className={styles.settingsLabel}>Job Role</label>
            <select
              className={styles.formInput}
              value={resumeSettings.jobRole}
              onChange={e => setResumeSettings(prev => ({ ...prev, jobRole: e.target.value, customJobRole: '' }))}
            >
              <option value="">Select Job Role</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Others">Others</option>
            </select>
            {resumeSettings.jobRole === 'Others' && (
              <input
                className={styles.formInput}
                style={{ marginTop: '0.75rem' }}
                placeholder="Enter your job role"
                value={resumeSettings.customJobRole}
                onChange={e => setResumeSettings(prev => ({ ...prev, customJobRole: e.target.value }))}
              />
            )}
          </div>

          {/* Font Style */}
          <div className={styles.settingsField}>
            <label className={styles.settingsLabel}>Font Style</label>
            <select
              className={styles.formInput}
              value={resumeSettings.fontStyle}
              onChange={e => setResumeSettings(prev => ({ ...prev, fontStyle: e.target.value }))}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Cambria">Cambria</option>
              <option value="Garamond">Garamond</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          {/* AI Integration (swapped with Pages) */}
          <div className={styles.settingsField}>
            <label className={styles.settingsLabel}>AI Integration</label>
            <div className={styles.aiToggleButtons}>
              <input
                type="radio"
                id="enableAI-yes"
                name="enableAI"
                checked={resumeSettings.enableAI === true}
                onChange={() => setResumeSettings(prev => ({ ...prev, enableAI: true }))}
              />
              <label htmlFor="enableAI-yes">Enable</label>
              <input
                type="radio"
                id="enableAI-no"
                name="enableAI"
                checked={resumeSettings.enableAI === false}
                onChange={() => setResumeSettings(prev => ({ ...prev, enableAI: false }))}
              />
              <label htmlFor="enableAI-no">Disable</label>
            </div>
          </div>

          {/* Link Type */}
          <div className={styles.settingsField}>
            <label className={styles.settingsLabel}>Link Type</label>
            <div className={styles.aiToggleButtons}>
              <input
                type="radio"
                id="linkType-hyperlink"
                name="linkType"
                checked={resumeSettings.linkType === 'HyperLink'}
                onChange={() => setResumeSettings(prev => ({ ...prev, linkType: 'HyperLink' }))}
              />
              <label htmlFor="linkType-hyperlink">HyperLink</label>
              <input
                type="radio"
                id="linkType-url"
                name="linkType"
                checked={resumeSettings.linkType === 'URL'}
                onChange={() => setResumeSettings(prev => ({ ...prev, linkType: 'URL' }))}
              />
              <label htmlFor="linkType-url">URL</label>
            </div>
          </div>

          {/* Pages (only enabled when AI is on) */}
          <div className={styles.settingsField}>
            <label className={styles.settingsLabel} style={!resumeSettings.enableAI ? { color: '#999' } : {}}>Pages</label>
            <select
              className={styles.formInput}
              value={resumeSettings.pages}
              onChange={e => setResumeSettings(prev => ({ ...prev, pages: e.target.value }))}
              disabled={!resumeSettings.enableAI}
              style={!resumeSettings.enableAI ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="no-limit">No Limit</option>
            </select>
          </div>

          {/* Profile Photo */}
          <div className={styles.settingsField}>
            <label className={styles.settingsLabel}>Profile Photo</label>
            <div className={styles.aiToggleButtons}>
              <input
                type="radio"
                id="profilePhoto-yes"
                name="profilePhoto"
                checked={resumeSettings.profilePhoto === true}
                onChange={() => setResumeSettings(prev => ({ ...prev, profilePhoto: true }))}
              />
              <label htmlFor="profilePhoto-yes">On</label>
              <input
                type="radio"
                id="profilePhoto-no"
                name="profilePhoto"
                checked={resumeSettings.profilePhoto === false}
                onChange={() => setResumeSettings(prev => ({ ...prev, profilePhoto: false }))}
              />
              <label htmlFor="profilePhoto-no">Off</label>
            </div>
          </div>

          {/* Photo Position (only enabled when Profile Photo is On) */}
          {resumeSettings.profilePhoto && (
            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Photo Placing</label>
              <div className={styles.aiToggleButtons}>
                <input
                  type="radio"
                  id="photoPosition-left"
                  name="photoPosition"
                  checked={resumeSettings.photoPosition === 'Left'}
                  onChange={() => setResumeSettings(prev => ({ ...prev, photoPosition: 'Left' }))}
                />
                <label htmlFor="photoPosition-left">Left</label>
                <input
                  type="radio"
                  id="photoPosition-right"
                  name="photoPosition"
                  checked={resumeSettings.photoPosition === 'Right'}
                  onChange={() => setResumeSettings(prev => ({ ...prev, photoPosition: 'Right' }))}
                />
                <label htmlFor="photoPosition-right">Right</label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== PERSONAL INFORMATION ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Personal Information</h3>
        <div className={styles.formGrid}>
          <input className={styles.formInput} placeholder="Name" value={personalInfo.name} onChange={e => setPersonalInfo(p => ({ ...p, name: e.target.value }))} />
          <input className={styles.formInput} placeholder="Mobile Number" value={personalInfo.mobile} onChange={e => setPersonalInfo(p => ({ ...p, mobile: e.target.value }))} />
          <input className={styles.formInput} placeholder="Mail" value={personalInfo.email} onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))} />
          <input className={styles.formInput} placeholder="LinkedIn" value={personalInfo.linkedin} onChange={e => setPersonalInfo(p => ({ ...p, linkedin: e.target.value }))} />
          <input className={styles.formInput} placeholder="GitHub" value={personalInfo.github} onChange={e => setPersonalInfo(p => ({ ...p, github: e.target.value }))} />
          <input className={styles.formInput} placeholder="Portfolio" value={personalInfo.portfolio} onChange={e => setPersonalInfo(p => ({ ...p, portfolio: e.target.value }))} />
        </div>
      </div>

      {/* ===== PROFESSIONAL SUMMARY ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Professional Summary</h3>
        <textarea
          ref={summaryTextareaRef}
          className={styles.formTextarea}
          placeholder={resumeSettings.enableAI
            ? 'Write something about yourself — AI will polish it into a professional summary when you create the resume'
            : 'Write your professional summary here. This text will appear directly in your resume.'
          }
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />
        <div className={styles.textareaActions}>
          {resumeSettings.enableAI && (
            <span style={{ fontSize: '12px', color: '#2085f6', fontStyle: 'italic' }}>✨ AI will auto-generate during Create</span>
          )}
          <button className={styles.clearBtn} onClick={() => setSummary('')}>Clear</button>
        </div>
      </div>

      {/* ===== EDUCATION ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Education</h3>
        {/* College / University */}
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>College / University</p>
        <div className={styles.formGrid}>
          <input className={styles.formInput} placeholder="College / University Name" value={education.college} onChange={e => setEducation(p => ({ ...p, college: e.target.value }))} />
          <input className={styles.formInput} placeholder="Degree (e.g. B.E., B.Tech)" value={education.degree} onChange={e => setEducation(p => ({ ...p, degree: e.target.value }))} />
          <input className={styles.formInput} placeholder="Branch (e.g. CSE, ECE)" value={education.branch} onChange={e => setEducation(p => ({ ...p, branch: e.target.value }))} />
          <input className={styles.formInput} placeholder="CGPA" value={education.cgpa} onChange={e => setEducation(p => ({ ...p, cgpa: e.target.value }))} />
          <input className={styles.formInput} placeholder="Graduation Year (e.g. 2026)" value={education.graduationYear} onChange={e => setEducation(p => ({ ...p, graduationYear: e.target.value }))} />
        </div>
        {/* 12th Standard */}
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '16px 0 8px 0' }}>12th Standard</p>
        <div className={styles.formGrid}>
          <input className={styles.formInput} placeholder="12th - School Name" value={education.school12} onChange={e => setEducation(p => ({ ...p, school12: e.target.value }))} />
          <input className={styles.formInput} placeholder="Percentile" value={education.percentile12} onChange={e => setEducation(p => ({ ...p, percentile12: e.target.value }))} />
          <input className={styles.formInput} placeholder="Batch" value={education.batch12} onChange={e => setEducation(p => ({ ...p, batch12: e.target.value }))} />
        </div>
        {/* 10th Standard */}
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '16px 0 8px 0' }}>10th Standard</p>
        <div className={styles.formGrid}>
          <input className={styles.formInput} placeholder="10th - School Name" value={education.school10} onChange={e => setEducation(p => ({ ...p, school10: e.target.value }))} />
          <input className={styles.formInput} placeholder="Percentile" value={education.percentile10} onChange={e => setEducation(p => ({ ...p, percentile10: e.target.value }))} />
          <input className={styles.formInput} placeholder="Batch" value={education.batch10} onChange={e => setEducation(p => ({ ...p, batch10: e.target.value }))} />
        </div>
      </div>

      {/* ===== CODING PLATFORM ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Coding Platform</h3>
        {platforms.map((platform, index) => (
          <div key={index} className={styles.platformRow}>
            {editingPlatformIndex === index ? (
              <input
                ref={platformNameInputRef}
                className={styles.platformNameInput}
                placeholder="Platform Name (e.g., CodeChef)"
                defaultValue={platform.name}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitPlatformName(index, e.target.value); }
                  if (e.key === 'Escape') { commitPlatformName(index, ''); }
                }}
                onBlur={e => commitPlatformName(index, e.target.value)}
              />
            ) : (
              <span className={styles.platformChip}>
                {platform.name}
                <button className={styles.chipRemove} onClick={() => removePlatform(index)}>×</button>
              </span>
            )}
            <input
              className={styles.platformUrlInput}
              placeholder={platform.name ? `#urlof${platform.name.replace(/\s/g, '')}_Profile` : '#url_Profile'}
              value={platform.url}
              onChange={e => updatePlatformUrl(index, e.target.value)}
            />
          </div>
        ))}
        <button className={styles.addChipBtn} onClick={addPlatformRow} style={{ marginTop: '14px' }}>
          <span className={styles.addChipBtnIcon}>+</span>
          Click to Add Platform
        </button>
      </div>

      {/* ===== CORE SKILLS ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Core Skills</h3>
        {skills.map((cat, catIndex) => (
          <div key={catIndex} className={styles.skillCategoryRow}>
            <div className={styles.skillCategoryField}>
              <input
                className={styles.skillCategoryInput}
                value={cat.category}
                onChange={e => {
                  const val = e.target.value;
                  setSkills(prev => prev.map((c, ci) =>
                    ci === catIndex ? { ...c, category: val } : c
                  ));
                }}
                placeholder="Category Name"
              />
              <button className={styles.categoryRemoveBtn} onClick={() => {
                setSkills(prev => prev.filter((_, ci) => ci !== catIndex));
              }} title="Remove category">×</button>
            </div>
            <div className={styles.chipsContainer} style={{ flex: 1 }}>
              {cat.items.map((skill, i) => (
                <span key={i} className={styles.chip}>
                  {skill}
                  <button className={styles.chipRemove} onClick={() => {
                    setSkills(prev => prev.map((c, ci) =>
                      ci === catIndex ? { ...c, items: c.items.filter((_, si) => si !== i) } : c
                    ));
                  }}>×</button>
                </span>
              ))}
              {activeSkillCategory === catIndex && (
                <input
                  ref={skillInputRef}
                  className={styles.skillNameInput}
                  placeholder="Enter Skill"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = newSkillName.trim();
                      if (val && !cat.items.includes(val)) {
                        setSkills(prev => prev.map((c, ci) =>
                          ci === catIndex ? { ...c, items: [...c.items, val] } : c
                        ));
                      }
                      setNewSkillName('');
                    }
                    if (e.key === 'Escape') { setActiveSkillCategory(null); setNewSkillName(''); }
                  }}
                  onBlur={() => {
                    const val = newSkillName.trim();
                    if (val && !cat.items.includes(val)) {
                      setSkills(prev => prev.map((c, ci) =>
                        ci === catIndex ? { ...c, items: [...c.items, val] } : c
                      ));
                    }
                    setNewSkillName('');
                    setActiveSkillCategory(null);
                  }}
                />
              )}
              <button className={styles.addChipBtn} onClick={() => { setActiveSkillCategory(catIndex); setNewSkillName(''); }}>
                <span className={styles.addChipBtnIcon}>+</span>
                Add Skill
              </button>
            </div>
          </div>
        ))}
        {/* Add custom category */}
        <div style={{ marginTop: '12px' }}>
          {showAddCategory ? (
            <div className={styles.chipsContainer}>
              <input
                className={styles.skillNameInput}
                placeholder="Category Name"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = newCategoryName.trim();
                    if (val && !skills.some(c => c.category === val)) {
                      setSkills(prev => [...prev, { category: val, items: [] }]);
                    }
                    setNewCategoryName('');
                    setShowAddCategory(false);
                  }
                  if (e.key === 'Escape') { setShowAddCategory(false); setNewCategoryName(''); }
                }}
                onBlur={() => {
                  const val = newCategoryName.trim();
                  if (val && !skills.some(c => c.category === val)) {
                    setSkills(prev => [...prev, { category: val, items: [] }]);
                  }
                  setNewCategoryName('');
                  setShowAddCategory(false);
                }}
              />
            </div>
          ) : (
            <button className={styles.addChipBtn} onClick={() => setShowAddCategory(true)}>
              <span className={styles.addChipBtnIcon}>+</span>
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* ===== INTERNSHIP ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Internship</h3>
        <div className={styles.chipsContainer}>
          {experiences.map((exp, i) => (
            <span key={i} className={styles.chip} onClick={() => openExperiencePopup(i)} style={{ cursor: 'pointer' }}>
              {exp.label || exp.title || 'Experience'}
              <button className={styles.chipRemove} onClick={e => { e.stopPropagation(); removeChip(experiences, setExperiences, i); }}>×</button>
            </span>
          ))}
          <button className={styles.addChipBtn} onClick={() => openExperiencePopup(null)}>
            <span className={styles.addChipBtnIcon}>+</span>
            Click to Add Experience
          </button>
        </div>
      </div>

      {/* ===== PROJECTS ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Projects</h3>
        <div className={styles.chipsContainer}>
          {projects.map((proj, i) => (
            <span key={i} className={styles.chip} onClick={() => openProjectPopup(i)} style={{ cursor: 'pointer' }}>
              {proj.label || proj.name || proj}
              <button className={styles.chipRemove} onClick={e => { e.stopPropagation(); removeChip(projects, setProjects, i); }}>×</button>
            </span>
          ))}
          <button className={styles.addChipBtn} onClick={() => openProjectPopup(null)}>
            <span className={styles.addChipBtnIcon}>+</span>
            Click to Add Project
          </button>
        </div>
      </div>

      {/* ===== CERTIFICATIONS ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Certifications</h3>
        <div className={styles.chipsContainer}>
          {certifications.map((cert, i) => (
            <span key={i} className={styles.chip} onClick={() => openCertificationPopup(i)} style={{ cursor: 'pointer' }}>
              {cert.label || cert.certificateName || cert}
              <button className={styles.chipRemove} onClick={e => { e.stopPropagation(); removeChip(certifications, setCertifications, i); }}>×</button>
            </span>
          ))}
          <button className={styles.addChipBtn} onClick={() => openCertificationPopup(null)}>
            <span className={styles.addChipBtnIcon}>+</span>
            Click to Add Certificate
          </button>
        </div>
      </div>

      {/* ===== ACHIEVEMENTS ===== */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Achievements</h3>
        <div className={styles.chipsContainer}>
          {achievements.map((ach, i) => (
            <span key={i} className={styles.chip} onClick={() => openAchievementPopup(i)} style={{ cursor: 'pointer' }}>
              {ach.label || ach.details || ach}
              <button className={styles.chipRemove} onClick={e => { e.stopPropagation(); removeChip(achievements, setAchievements, i); }}>×</button>
            </span>
          ))}
          <button className={styles.addChipBtn} onClick={() => openAchievementPopup(null)}>
            <span className={styles.addChipBtnIcon}>+</span>
            Click to Add Achievement
          </button>
        </div>
      </div>



      {/* ===== GLOBAL SAVE / DISCARD ===== */}
      <div className={styles.globalActionBar}>
        <button className={styles.globalDiscardBtn} onClick={handleDiscard}>Discard</button>
        <button 
          className={styles.globalCreateBtn} 
          onClick={handleCreate}
          disabled={hasCreatedOnce || isCreating}
          style={{ 
            opacity: (hasCreatedOnce || isCreating) ? 0.6 : 1, 
            cursor: (hasCreatedOnce || isCreating) ? 'not-allowed' : 'pointer' 
          }}
        >
          {hasCreatedOnce ? 'Create' : isCreating ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* ===== POPUPS ===== */}
      <Suspense fallback={null}>
        {activePopup === 'experience' && (
          <PopupExperience
            key={editIndex !== null ? `edit-${editIndex}` : 'new'}
            title={editIndex !== null ? experiences[editIndex]?.title : ''}
            data={editIndex !== null ? experiences[editIndex] : null}
            onSave={saveExperience}
            onDiscard={closePopup}
            enableAI={resumeSettings.enableAI}
          />
        )}
        {activePopup === 'project' && (
          <PopupProject
            key={editIndex !== null ? `edit-${editIndex}` : 'new'}
            title={editIndex !== null ? (projects[editIndex]?.name || projects[editIndex]?.label) : ''}
            data={editIndex !== null ? projects[editIndex] : null}
            onSave={saveProject}
            onDiscard={closePopup}
            enableAI={resumeSettings.enableAI}
          />
        )}
        {activePopup === 'certification' && (
          <PopupCertification
            key={editIndex !== null ? `edit-${editIndex}` : 'new'}
            data={editIndex !== null ? certifications[editIndex] : null}
            onSave={saveCertification}
            onDiscard={closePopup}
            enableAI={resumeSettings.enableAI}
          />
        )}
        {activePopup === 'achievement' && (
          <PopupAchievementBuilder
            key={editIndex !== null ? `edit-${editIndex}` : 'new'}
            data={editIndex !== null ? achievements[editIndex] : null}
            onSave={saveAchievement}
            onDiscard={closePopup}
            enableAI={resumeSettings.enableAI}
          />
        )}
        {activePopup === 'additionalInfo' && (
          <PopupAdditionalInfo
            key={editIndex !== null ? `edit-${editIndex}` : 'new'}
            data={editIndex !== null ? additionalInfo[editIndex] : null}
            onSave={saveAdditionalInfoItem}
            onDiscard={closePopup}
          />
        )}
      </Suspense>

      {/* ===== CREATING POPUP ===== */}
      {isCreating && (
        <div className="alert-overlay">
          <div className="achievement-popup-container">
            <div className="achievement-popup-header" style={{ backgroundColor: '#2085f6' }}>
              Resume Creating
            </div>
            <div className="achievement-popup-body">
              <div className="download-progress-icon-container">
                <svg className="download-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle className="download-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
                  <circle
                    className="download-progress-icon--progress"
                    cx="26"
                    cy="26"
                    r="20"
                    fill="none"
                    stroke="#2085f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${createProgress * 1.256} 125.6`}
                    transform="rotate(-90 26 26)"
                    style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.3s ease' }}
                  />
                </svg>
              </div>
              <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
                Creating... {Math.round(createProgress)}%
              </h2>
              <p style={{ margin: 0, color: '#555', fontSize: '15px', fontWeight: '500', minHeight: '22px', transition: 'opacity 0.3s ease' }}>
                {createStatus}
              </p>
              {createProgress > 0 && createProgress < 100 && (
                <p style={{ margin: '8px 0 0 0', color: '#2085f6', fontSize: '12px', fontWeight: '400' }}>
                  This may take 20–30 seconds
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATED SUCCESS POPUP ===== */}
      {showCreated && (
        <div className="alert-overlay">
          <div className="achievement-popup-container">
            <div className="achievement-popup-header" style={{ backgroundColor: '#2085f6' }}>Created!</div>
            <div className="achievement-popup-body">
              <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
              <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>Resume Created ✓</h2>
              <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
                Your resume has been successfully created.
              </p>
            </div>
            <div className="achievement-popup-footer" style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '1.5rem' }}>
              <button 
                onClick={() => {
                  setShowCreated(false);
                  setIsPreviewing(false);
                  setHasCreatedOnce(false);
                  if (onViewChange) onViewChange('resume');
                }} 
                className="achievement-popup-close-btn"
                style={{ 
                  flex: 1,
                  maxWidth: '160px',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Back
              </button>
              <button 
                onClick={() => {
                  if (!resumePdfUrl || isPreviewing) return;
                  setIsPreviewing(true);
                  window.open(resumePdfUrl, '_blank');
                  // Reset after a delay
                  setTimeout(() => {
                    setIsPreviewing(false);
                  }, 2000);
                }} 
                className="achievement-popup-close-btn"
                disabled={isPreviewing || !resumePdfUrl}
                style={{ 
                  backgroundColor: isPreviewing ? '#6c757d' : '#2085f6',
                  borderColor: isPreviewing ? '#6c757d' : '#2085f6',
                  boxShadow: isPreviewing ? 'none' : '0 2px 8px rgba(32, 133, 246, 0.3)',
                  opacity: (isPreviewing || !resumePdfUrl) ? 0.7 : 1,
                  cursor: (isPreviewing || !resumePdfUrl) ? 'not-allowed' : 'pointer',
                  flex: 1,
                  maxWidth: '160px',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {isPreviewing ? 'Previewing...' : 'Preview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MAIN PAGE WRAPPER =====
export default function ResumeBuilder({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studentData') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    const loadStudentData = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (stored) setStudentData(stored);
      } catch { /* ignore */ }
    };

    // Load immediately on mount
    loadStudentData();

    window.addEventListener('storage', loadStudentData);
    window.addEventListener('profileUpdated', loadStudentData);
    return () => {
      window.removeEventListener('storage', loadStudentData);
      window.removeEventListener('profileUpdated', loadStudentData);
    };
  }, []);

  const handleViewChange = (view) => {
    onViewChange(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.resumeBuilderWrapper}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles.main}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="resume"
          onViewChange={handleViewChange}
          studentData={studentData}
        />
        <div className={styles.dashboardArea}>
          <BuilderContent onViewChange={onViewChange} studentData={studentData} />
        </div>
      </div>
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
