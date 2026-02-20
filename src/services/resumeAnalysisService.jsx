// Resume Analysis Service
// Analyzes uploaded resume files (PDF, DOC, DOCX) against professional checklist criteria:
// - Contact Information (Name, Phone, Email)
// - LinkedIn & GitHub Profiles  
// - Professional Summary
// - Technical Skills
// - Work Experience & Internships
// - Projects (1-5+ with descriptions)
// - Education & Degree
// - Certifications
// - Achievements
// - Page Limit (1-2 pages)

import multiProviderService from './multiProviderService.jsx';

class ResumeAnalysisService {
  constructor() {
    // Define checklist items with their keywords and patterns
    this.checklistItems = [
      {
        id: 'contact_info',
        text: 'Include Name, Phone No, Email',
        keywords: ['name', 'phone', 'mobile', 'email', 'contact', 'address'],
        patterns: [/phone/i, /mobile/i, /email/i, /contact/i, /\d{10}/, /@.*\./],
        weight: 15
      },
      {
        id: 'linkedin',
        text: 'Add LinkedIn Profile',
        keywords: ['linkedin', 'linked in', 'linkedin.com', 'linkedin.com/in'],
        patterns: [/linkedin\.com/i, /linkedin\.com\/in/i, /linked\s*in/i],
        weight: 5
      },
      {
        id: 'github',
        text: 'Add GitHub Profile',
        keywords: ['github', 'github.com', 'github.com/'],
        patterns: [/github\.com/i, /github\.com\//i],
        weight: 5
      },
      {
        id: 'summary',
        text: 'Include Summary/About Section',
        keywords: ['summary', 'about', 'objective', 'profile', 'overview', 'introduction'],
        patterns: [/summary/i, /about/i, /objective/i, /profile/i, /overview/i],
        weight: 10
      },
      {
        id: 'skills',
        text: 'List Technical Skills',
        keywords: ['skills', 'technical', 'programming', 'languages', 'technologies', 'tools'],
        patterns: [/skills/i, /technical/i, /programming/i, /languages/i, /technologies/i],
        weight: 15
      },
      {
        id: 'experience',
        text: 'Include Experience/Internships',
        keywords: ['experience', 'internship', 'work', 'employment', 'job', 'position'],
        patterns: [/experience/i, /internship/i, /work/i, /employment/i, /job/i],
        weight: 20
      },
      {
        id: 'projects',
        text: 'Showcase Projects (1-5+ projects)',
        keywords: ['projects', 'project', 'portfolio', 'development', 'built', 'created'],
        patterns: [/projects/i, /project/i, /portfolio/i, /development/i, /built/i, /created/i],
        weight: 20
      },
      {
        id: 'education',
        text: 'Mention Education/Degree',
        keywords: ['education', 'degree', 'bachelor', 'master', 'university', 'college', 'cgpa', 'gpa'],
        patterns: [/education/i, /degree/i, /bachelor/i, /master/i, /university/i, /college/i, /cgpa/i, /gpa/i],
        weight: 10
      },
      {
        id: 'certifications',
        text: 'Include Certifications',
        keywords: ['certification', 'certificate', 'certified', 'course', 'training'],
        patterns: [/certification/i, /certificate/i, /certified/i, /course/i, /training/i],
        weight: 5
      },
      {
        id: 'achievements',
        text: 'Highlight Achievements',
        keywords: ['achievement', 'award', 'recognition', 'honor', 'accomplishment', 'success'],
        patterns: [/achievement/i, /award/i, /recognition/i, /honor/i, /accomplishment/i],
        weight: 5
      },
      {
        id: 'page_limit',
        text: 'Keep Resume within 1-2 Pages',
        keywords: ['1 page', '2 page', 'single page', 'two page', 'page limit'],
        patterns: [/1\s*page/i, /2\s*page/i, /single\s*page/i, /two\s*page/i],
        weight: 10
      }
    ];
  }

  // Extract text from PDF file (API-only approach)
  async extractTextFromPDF(file) {
    console.log('🔍 Attempting PDF text extraction...');
    return await multiProviderService.extractTextFromPDF(file);
  }


  // Analyze resume against checklist
  async analyzeResume(file) {
    console.log('🚀 Starting resume analysis...');
    
    // Extract text from PDF using API only
    const extractedText = await this.extractTextFromPDF(file);
    console.log('📄 Text extracted, length:', extractedText.length);
    
    // Use multi-provider analysis only
    console.log('🤖 Using multi-provider analysis...');
    const providerAnalysis = await multiProviderService.analyzeResumeContent(extractedText);
    return this.convertProviderAnalysisToResults(providerAnalysis, extractedText, file);
  }

  // Convert provider analysis to our result format
  convertProviderAnalysisToResults(providerAnalysis, extractedText, file) {
    const analysisResults = this.checklistItems.map(item => {
      const providerResult = providerAnalysis[item.id] || 'NO';
      let score = 0;
      let isCompleted = false;
      
      // Convert provider response to score
      switch (providerResult) {
        case 'YES':
          score = item.weight;
          isCompleted = true;
          break;
        case 'PARTIAL':
          score = Math.round(item.weight * 0.6);
          isCompleted = false;
          break;
        case 'NO':
        default:
          score = 0;
          isCompleted = false;
          break;
      }
      
      return {
        id: item.id,
        text: item.text,
        score: score,
        maxScore: item.weight,
        isCompleted: isCompleted,
        matchedKeywords: [],
        matchedPatterns: [],
        percentage: Math.round((score / item.weight) * 100)
      };
    });
    
    // Calculate total score
    const totalWeight = this.checklistItems.reduce((sum, item) => sum + item.weight, 0);
    const achievedScore = analysisResults.reduce((sum, result) => sum + result.score, 0);
    const percentage = Math.round((achievedScore / totalWeight) * 100);
    
    const analysisResult = {
      checklistResults: analysisResults,
      totalScore: achievedScore,
      maxScore: totalWeight,
      percentage: percentage,
      suggestions: providerAnalysis.suggestions || this.generateSuggestions(analysisResults),
      extractedText: extractedText.substring(0, 500) + '...',
      timestamp: new Date().toISOString(),
      fileName: file.name,
      analysisMethod: 'multi-provider'
    };
    
    console.log('🤖 Multi-provider analysis complete:', analysisResult);
    return analysisResult;
  }

  // Analyze individual checklist item
  analyzeChecklistItem(item, text) {
    let score = 0;
    let matchedKeywords = [];
    let matchedPatterns = [];
    
    // Check if this is an empty file or image PDF
    if (text === 'empty file' || text === 'image pdf scan photo picture' || text.length < 10) {
      return {
        id: item.id,
        text: item.text,
        score: 0,
        maxScore: item.weight,
        isCompleted: false,
        matchedKeywords: [],
        matchedPatterns: [],
        percentage: 0
      };
    }
    
    // Check keywords
    item.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        score += item.weight * 0.4; // 40% weight for keyword match
      }
    });
    
    // Check patterns
    item.patterns.forEach(pattern => {
      if (pattern.test(text)) {
        matchedPatterns.push(pattern.toString());
        score += item.weight * 0.6; // 60% weight for pattern match
      }
    });
    
    // For basic analysis, be more lenient - give partial credit for common resume terms
    if (score === 0) {
      // Give partial credit if the text contains general resume-related terms
      const generalTerms = ['resume', 'cv', 'skills', 'projects', 'education', 'experience'];
      const hasGeneralTerms = generalTerms.some(term => text.includes(term));
      if (hasGeneralTerms) {
        score = item.weight * 0.3; // 30% partial credit
      }
    }
    
    // Cap the score at the item's weight
    score = Math.min(score, item.weight);
    
    return {
      id: item.id,
      text: item.text,
      score: Math.round(score),
      maxScore: item.weight,
      isCompleted: score >= item.weight * 0.4, // Lowered threshold to 40% for basic analysis
      matchedKeywords,
      matchedPatterns,
      percentage: Math.round((score / item.weight) * 100)
    };
  }

  // Generate suggestions based on analysis
  generateSuggestions(results) {
    const suggestions = [];
    
    // Check if this is an image PDF (all items failed)
    const allFailed = results.every(result => !result.isCompleted);
    const hasImagePDF = results.length > 0 && results[0].matchedKeywords.length === 0 && results[0].matchedPatterns.length === 0;
    
    if (allFailed && hasImagePDF) {
      suggestions.push('This appears to be an image PDF. Please upload a text-based resume for better analysis.');
      suggestions.push('Convert your scanned resume to a text-based PDF using OCR tools.');
      suggestions.push('Ensure your resume contains selectable text, not just images.');
      return suggestions;
    }
    
    // Calculate current score to provide targeted suggestions
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const maxScore = results.reduce((sum, result) => sum + result.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    // Add suggestions for incomplete items
    results.forEach(result => {
      if (!result.isCompleted) {
        switch (result.id) {
          case 'contact_info':
            suggestions.push('Add your name, phone number, and email address');
            break;
          case 'linkedin':
            suggestions.push('Add your LinkedIn profile link');
            break;
          case 'github':
            suggestions.push('Add your GitHub profile link');
            break;
          case 'summary':
            suggestions.push('Add a professional summary or about section');
            break;
          case 'skills':
            suggestions.push('List your technical skills and programming languages');
            break;
          case 'experience':
            suggestions.push('Include your work experience and internships');
            break;
          case 'projects':
            suggestions.push('Showcase 1-5+ projects with descriptions');
            break;
          case 'education':
            suggestions.push('Mention your degree and educational background');
            break;
          case 'certifications':
            suggestions.push('Include relevant certifications and courses');
            break;
          case 'achievements':
            suggestions.push('Highlight your achievements and awards');
            break;
          case 'page_limit':
            suggestions.push('Keep your resume within 1-2 pages');
            break;
          default:
            break;
        }
      }
    });
    
     // Add improvement suggestions for high scores (85%+)
     if (percentage >= 85 && percentage < 100) {
       suggestions.push('🎯 You\'re almost there! Here are ways to reach 100%:');
       
       // Find missing items (score = 0) - these are the main issues
       const missingItems = results.filter(result => result.score === 0);
       if (missingItems.length > 0) {
         suggestions.push('❌ Missing items that are affecting your score:');
         missingItems.forEach(result => {
           switch (result.id) {
             case 'contact_info':
               suggestions.push('• Add your name, phone number, and email address');
               break;
             case 'linkedin':
               suggestions.push('• Add your LinkedIn profile link');
               break;
             case 'github':
               suggestions.push('• Add your GitHub profile link');
               break;
             case 'summary':
               suggestions.push('• Add a professional summary or about section');
               break;
             case 'skills':
               suggestions.push('• List your technical skills and programming languages');
               break;
             case 'experience':
               suggestions.push('• Include your work experience and internships');
               break;
             case 'projects':
               suggestions.push('• Showcase 1-5+ projects with descriptions');
               break;
             case 'education':
               suggestions.push('• Mention your degree and educational background');
               break;
             case 'certifications':
               suggestions.push('• Include relevant certifications and courses');
               break;
             case 'achievements':
               suggestions.push('• Highlight your achievements and awards');
               break;
             case 'page_limit':
               suggestions.push('• Keep your resume within 1-2 pages');
               break;
             default:
               break;
           }
         });
       }
       
       // Find items with partial scores (score > 0 but < maxScore)
       const partialItems = results.filter(result => result.score > 0 && result.score < result.maxScore);
       if (partialItems.length > 0) {
         suggestions.push('⚠️ Items that need improvement:');
         partialItems.forEach(result => {
           switch (result.id) {
             case 'contact_info':
               suggestions.push('• Make sure all contact details are clearly visible');
               break;
             case 'linkedin':
               suggestions.push('• Ensure your LinkedIn profile link is clickable');
               break;
             case 'github':
               suggestions.push('• Ensure your GitHub profile link is clickable');
               break;
             case 'summary':
               suggestions.push('• Write a compelling 2-3 line professional summary');
               break;
             case 'skills':
               suggestions.push('• Add more specific technical skills and tools');
               break;
             case 'experience':
               suggestions.push('• Include more details about your work experience');
               break;
             case 'projects':
               suggestions.push('• Add more project descriptions with technologies used');
               break;
             case 'education':
               suggestions.push('• Include CGPA and relevant academic details');
               break;
             case 'certifications':
               suggestions.push('• Add more relevant certifications');
               break;
             case 'achievements':
               suggestions.push('• Highlight more achievements and recognitions');
               break;
             case 'page_limit':
               suggestions.push('• Optimize content to fit within page limits');
               break;
             default:
               break;
           }
         });
       }
       
       // General improvement tips for high scores
       suggestions.push('💡 Additional tips to reach 100%:');
       suggestions.push('• Use action verbs in your project descriptions');
       suggestions.push('• Quantify your achievements with numbers and metrics');
       suggestions.push('• Ensure consistent formatting and professional layout');
       suggestions.push('• Double-check all contact information and links');
       suggestions.push('• Tailor content to match job requirements');
     }
    
    // Add general tips for any score
    if (suggestions.length === 0) {
      // Check if all items are completed (100% score)
      const allCompleted = results.every(result => result.isCompleted);
      if (allCompleted) {
        suggestions.push('🎉 Excellent! Your resume meets all professional standards.');
        suggestions.push('Your resume is well-structured and complete.');
      } else {
        suggestions.push('📝 Your resume needs some improvements.');
        suggestions.push('Check the checklist above to see what\'s missing.');
      }
    }
    
    // Add specific suggestions based on score ranges
    if (percentage < 30) {
      suggestions.push('🚨 Critical: Your resume is missing essential sections.');
      suggestions.push('• Start by adding contact information and basic sections');
      suggestions.push('• Focus on including skills, education, and at least one project');
    } else if (percentage < 60) {
      suggestions.push('⚠️ Your resume needs significant improvements.');
      suggestions.push('• Add missing essential sections like experience and projects');
      suggestions.push('• Include more technical skills and achievements');
    } else if (percentage < 85) {
      suggestions.push('👍 Good progress! Your resume is taking shape.');
      suggestions.push('• Add more detailed project descriptions');
      suggestions.push('• Include certifications and achievements');
      suggestions.push('• Ensure all contact information is complete');
    }
    
    return suggestions;
  }

  // Get grade based on percentage
  getGrade(percentage) {
    if (percentage >= 90) return { grade: 'A+', color: '#4caf50', description: 'Excellent' };
    if (percentage >= 80) return { grade: 'A', color: '#4caf50', description: 'Very Good' };
    if (percentage >= 70) return { grade: 'B+', color: '#8bc34a', description: 'Good' };
    if (percentage >= 60) return { grade: 'B', color: '#ffc107', description: 'Satisfactory' };
    if (percentage >= 50) return { grade: 'C', color: '#ff9800', description: 'Needs Improvement' };
    return { grade: 'D', color: '#f44336', description: 'Poor' };
  }
}

const resumeAnalysisService = new ResumeAnalysisService();
export default resumeAnalysisService;
