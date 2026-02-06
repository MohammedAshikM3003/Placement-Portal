// Mock API Server for Resume Analysis Testing
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mock resume analysis endpoint
app.post('/resume/analyze', (req, res) => {
  console.log('📄 Received resume analysis request');
  console.log('📁 File name:', req.body.fileName);
  console.log('📊 File data length:', req.body.fileData?.length || 0);
  console.log('📋 Checklist items:', req.body.checklist?.length || 0);
  
  // Validate file type
  const fileName = req.body.fileName || '';
  const fileData = req.body.fileData || '';
  
  // Check if it's a valid resume file
  const isValidResumeFile = validateResumeFile(fileName, fileData);
  
  if (!isValidResumeFile) {
    console.log('❌ Invalid resume file detected');
    return res.json({
      analysisResult: {
        percentage: 0,
        totalScore: 0,
        maxScore: 13,
        grade: 'F',
        description: 'Invalid file type - Please upload a valid resume (PDF, DOC, DOCX)',
        suggestions: [
          'Please upload a valid resume file (PDF, DOC, or DOCX)',
          'Ensure the file contains actual resume content',
          'Check that the file is not corrupted',
          'Try uploading a different resume file'
        ],
        checklistResults: [
          { id: 'name', isCompleted: false },
          { id: 'phone_no', isCompleted: false },
          { id: 'email', isCompleted: false },
          { id: 'linkedin', isCompleted: false },
          { id: 'github', isCompleted: false },
          { id: 'summary', isCompleted: false },
          { id: 'skills', isCompleted: false },
          { id: 'experience', isCompleted: false },
          { id: 'projects', isCompleted: false },
          { id: 'education', isCompleted: false },
          { id: 'certifications', isCompleted: false },
          { id: 'achievements', isCompleted: false },
          { id: 'page_limit', isCompleted: false }
        ]
      }
    });
  }
  
  // Simulate AI processing delay
  setTimeout(() => {
    // Analyze file content for more realistic results
    const analysisResult = analyzeResumeContent(fileName, fileData);
    
    console.log('✅ Sending analysis result:', analysisResult);
    res.json({ analysisResult });
  }, 2000); // 2 second delay to simulate AI processing
});

// Function to validate if file is a valid resume
function validateResumeFile(fileName, fileData) {
  // Check file extension
  const validExtensions = ['.pdf', '.doc', '.docx'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (!validExtensions.includes(fileExtension)) {
    console.log('❌ Invalid file extension:', fileExtension);
    return false;
  }
  
  // Check if file data exists and has reasonable size
  if (!fileData || fileData.length < 100) {
    console.log('❌ File data too small or missing');
    return false;
  }
  
  // For PDF files, check for PDF header or allow text content for testing
  if (fileExtension === '.pdf') {
    try {
      const decodedData = Buffer.from(fileData, 'base64').toString('binary');
      const decodedText = Buffer.from(fileData, 'base64').toString('utf8');
      
      // Check for PDF header OR if it's text content (for testing)
      if (!decodedData.includes('%PDF') && !decodedText.includes('Email:') && !decodedText.includes('Phone:') && !decodedText.includes('Summary:') && !decodedText.includes('Skills:')) {
        console.log('❌ Invalid PDF file - missing PDF header or recognizable content');
        return false;
      }
    } catch (error) {
      console.log('❌ Error decoding PDF file:', error.message);
      return false;
    }
  }
  
  // For DOC/DOCX files, check for Office document signatures
  if (fileExtension === '.doc' || fileExtension === '.docx') {
    try {
      const decodedData = Buffer.from(fileData, 'base64').toString('binary');
      if (fileExtension === '.docx' && !decodedData.includes('PK')) {
        console.log('❌ Invalid DOCX file - missing ZIP signature');
        return false;
      }
      if (fileExtension === '.doc' && !decodedData.includes('Microsoft')) {
        console.log('❌ Invalid DOC file - missing Microsoft signature');
        return false;
      }
    } catch (error) {
      console.log('❌ Error decoding Office document:', error.message);
      return false;
    }
  }
  
  console.log('✅ Valid resume file detected');
  return true;
}

// Function to analyze resume content (mock AI analysis)
function analyzeResumeContent(fileName, fileData) {
  try {
    // Decode file content for basic analysis
    const decodedData = Buffer.from(fileData, 'base64').toString('utf8');
    
    // Enhanced content analysis (mock AI)
    const hasName = /(name|full name|first name|last name|john|smith|david|miller)/i.test(decodedData);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|(phone|mobile|contact|tel|call)/i.test(decodedData);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(decodedData);
    const hasLinkedIn = /linkedin/i.test(decodedData);
    const hasGitHub = /github/i.test(decodedData);
    const hasSummary = /(summary|objective|about|profile)/i.test(decodedData);
    const hasSkills = /(skills|technologies|programming|software)/i.test(decodedData);
    const hasExperience = /(experience|work|employment|job)/i.test(decodedData);
    const hasProjects = /(project|portfolio|work)/i.test(decodedData);
    const hasEducation = /(education|degree|university|college|school)/i.test(decodedData);
    const hasCertifications = /(certification|certificate|course|training)/i.test(decodedData);
    const hasAchievements = /(achievement|award|honor|recognition)/i.test(decodedData);
    
    // Calculate score based on content analysis
    const completedItems = [
      hasName, hasPhone, hasEmail, hasLinkedIn, hasGitHub,
      hasSummary, hasSkills, hasExperience, hasProjects,
      hasEducation, hasCertifications, hasAchievements, true // page_limit always true
    ].filter(Boolean).length;
    
    const percentage = Math.round((completedItems / 13) * 100);
    const grade = getGrade(percentage);
    
    // Generate AI-powered suggestions based on content analysis
    const suggestions = [];
    
    // Analyze content quality and provide intelligent suggestions
    if (!hasName) {
      suggestions.push('🔍 Missing: Add your full name prominently at the top of the resume');
    }
    if (!hasPhone) {
      suggestions.push('📞 Missing: Include a contact number for recruiters to reach you');
    }
    if (!hasEmail) {
      suggestions.push('📧 Missing: Add a professional email address (avoid unprofessional emails)');
    }
    if (!hasLinkedIn) {
      suggestions.push('💼 Recommendation: Add LinkedIn profile to showcase professional network');
    }
    if (!hasGitHub) {
      suggestions.push('💻 Recommendation: Include GitHub profile for technical roles (if applicable)');
    }
    if (!hasSummary) {
      suggestions.push('📝 Missing: Add a compelling professional summary highlighting your key strengths');
    }
    if (!hasSkills) {
      suggestions.push('🛠️ Missing: List technical skills relevant to your target job roles');
    }
    if (!hasExperience) {
      suggestions.push('💼 Missing: Include work experience, internships, or relevant projects');
    }
    if (!hasProjects) {
      suggestions.push('🚀 Missing: Showcase 2-3 key projects demonstrating your capabilities');
    }
    if (!hasEducation) {
      suggestions.push('🎓 Missing: Mention your educational background and relevant coursework');
    }
    if (!hasCertifications) {
      suggestions.push('🏆 Recommendation: Add relevant certifications to stand out from other candidates');
    }
    if (!hasAchievements) {
      suggestions.push('⭐ Recommendation: Highlight achievements, awards, or recognitions');
    }
    
    // Add intelligent recommendations based on overall score
    if (percentage >= 80) {
      suggestions.push('🎉 Excellent resume! Consider adding quantifiable achievements');
      suggestions.push('💡 Pro tip: Use action verbs and specific metrics in your descriptions');
    } else if (percentage >= 60) {
      suggestions.push('👍 Good start! Focus on adding missing essential sections');
      suggestions.push('📈 Consider tailoring content to specific job requirements');
    } else {
      suggestions.push('⚠️ Resume needs significant improvement. Focus on essential sections first');
      suggestions.push('🎯 Prioritize: Name, Contact info, Skills, and Experience sections');
    }
    
    return {
      percentage: percentage,
      totalScore: completedItems,
      maxScore: 13,
      grade: grade,
      description: `Resume analysis completed - ${percentage}% of checklist items found`,
      suggestions: suggestions,
      checklistResults: [
        { id: 'name', isCompleted: hasName },
        { id: 'phone_no', isCompleted: hasPhone },
        { id: 'email', isCompleted: hasEmail },
        { id: 'linkedin', isCompleted: hasLinkedIn },
        { id: 'github', isCompleted: hasGitHub },
        { id: 'summary', isCompleted: hasSummary },
        { id: 'skills', isCompleted: hasSkills },
        { id: 'experience', isCompleted: hasExperience },
        { id: 'projects', isCompleted: hasProjects },
        { id: 'education', isCompleted: hasEducation },
        { id: 'certifications', isCompleted: hasCertifications },
        { id: 'achievements', isCompleted: hasAchievements },
        { id: 'page_limit', isCompleted: true }
      ]
    };
  } catch (error) {
    console.log('❌ Error analyzing resume content:', error.message);
    // Return basic analysis if content analysis fails
    return {
      percentage: 30,
      totalScore: 4,
      maxScore: 13,
      grade: 'C-',
      description: 'Resume analysis completed with limited content detection',
      suggestions: [
        'Ensure your resume is in a readable format',
        'Include all essential contact information',
        'Add relevant work experience and skills',
        'Check file format and content quality'
      ],
      checklistResults: [
        { id: 'name', isCompleted: false },
        { id: 'phone_no', isCompleted: false },
        { id: 'email', isCompleted: false },
        { id: 'linkedin', isCompleted: false },
        { id: 'github', isCompleted: false },
        { id: 'summary', isCompleted: false },
        { id: 'skills', isCompleted: false },
        { id: 'experience', isCompleted: false },
        { id: 'projects', isCompleted: false },
        { id: 'education', isCompleted: false },
        { id: 'certifications', isCompleted: false },
        { id: 'achievements', isCompleted: false },
        { id: 'page_limit', isCompleted: true }
      ]
    };
  }
}

// Helper function to get grade based on percentage
function getGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  return 'C-';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Mock API server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on port ${PORT}`);
  console.log(`📡 Resume analysis endpoint: http://localhost:${PORT}/resume/analyze`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Ready to receive resume analysis requests!`);
});

module.exports = app;
