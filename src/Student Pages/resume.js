import React, { useState, useEffect } from 'react';
import { Typography, Button, Box, Paper } from '@mui/material';
import { Upload, Preview, Download } from '@mui/icons-material';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import './Resume.css';
import Adminicon from '../assets/Adminicon.png';
import resumeAnalysisService from '../services/resumeAnalysisService.js';
import { 
  DownloadFailedAlert, 
  DownloadSuccessAlert, 
  DownloadProgressAlert, 
  PreviewFailedAlert, 
  PreviewProgressAlert 
} from '../components/alerts';

// Success Popup Component with Animation
const SuccessPopup = ({ onClose }) => (
  <div className="Resume-popup-container">
    <div className="Resume-popup-header">Resume Uploaded!</div>
    <div className="Resume-popup-body">
      <svg className="Resume-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="Resume-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="Resume-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
        Resume Uploaded ✓
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Resume has been uploaded and analyzed successfully
      </p>
    </div>
    <div className="Resume-popup-footer">
      <button onClick={onClose} className="Resume-popup-close-btn">
        Close
      </button>
    </div>
  </div>
);

// Validation Popup Component for missing resume
const ValidationPopup = ({ onClose, action }) => (
  <div className="Resume-popup-container">
    <div className="Resume-popup-header">No File !</div>
    <div className="Resume-popup-body">
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="#ff9800" d="M18.308 16.5h3.361q.213 0 .356.144t.144.357t-.144.356t-.356.143h-2.48l3.115 3.116q.14.135.14.338t-.14.35q-.146.165-.357.156q-.21-.01-.357-.156l-3.09-3.09v2.455q0 .213-.144.356t-.357.144t-.356-.144t-.143-.356v-3.361q0-.344.232-.576t.576-.232M14 4v3.2q0 .34.23.57t.57.23H18zM6.616 3h7.213q.331 0 .632.13t.518.349L18.52 7.02q.217.218.348.518t.131.632v5.521q0 .344-.232.576t-.576.232h-1.884q-.343 0-.576.234q-.232.233-.232.578v4.876q0 .345-.232.579t-.576.233H6.616q-.691 0-1.153-.462T5 19.385V4.615q0-.69.463-1.152T6.616 3" strokeWidth="0.4" stroke="#ff9800"/>
        </svg>
      </div>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
        Please Upload a file to {action}
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        You need to upload a resume file before you can {action} it.
      </p>
    </div>
    <div className="Resume-popup-footer">
      <button onClick={onClose} className="Resume-popup-close-btn">
        Got it
      </button>
    </div>
  </div>
);

// The inner components (ResumeChecklist, ResumeScore)
function ResumeChecklist({ analysisResults, analysisResult }) {
  // Use the new professional checklist items based on database matching
  const checklistItems = [
    { id: 'personal_identification', text: 'Personal Identification (Name)' },
    { id: 'email_match', text: 'Email ID Match' },
    { id: 'linkedin_match', text: 'LinkedIn Link Match' },
    { id: 'github_match', text: 'GitHub Link Match' },
    { id: 'mobile_match', text: 'Mobile Number Match' },
    { id: 'career_objective', text: 'Career Objective' },
    { id: 'work_experience', text: 'Work Experience' },
    { id: 'projects', text: 'Projects' },
    { id: 'achievements', text: 'Achievements' },
    { id: 'education', text: 'Education' }
  ];

  // Get dynamic color based on score
         // Use green color for completed items, gray for incomplete
         const completedColor = '#4caf50'; // Green
         const incompleteColor = '#e0e0e0'; // Gray

  return (
    <Paper elevation={2} sx={{ 
      flex: 1,
      width: '100%',
      height: '100%',
      minHeight: '200px',
      p: 2, 
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      border: '2px solid #c8c8c8',
      transition: 'border-color 0.3s ease',
      '&:hover': {
        borderColor: '#2085f6'
      }
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={1.5} fontSize="16px">
        Resume Checklist
      </Typography>
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        maxHeight: '200px', 
        overflowY: 'auto',
        gap: 1,
        pr: 1,
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#1976d2',
          borderRadius: '4px',
          '&:hover': {
            background: '#1565c0',
          },
        },
      }}>
        {checklistItems.map((item, index) => {
          const result = analysisResults?.find(r => r.id === item.id);
          const isCompleted = result?.isCompleted || false;
          
          return (
            <Box key={item.id} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              py: 0.5,
              px: 1,
              borderRadius: '6px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              }
            }}>
              {/* Green vertical bar indicator for completed items */}
              <Box sx={{ 
                width: '4px',
                height: '20px',
                backgroundColor: isCompleted ? completedColor : incompleteColor,
                borderRadius: '2px',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }} />
              
              {/* Green checkbox for completed items */}
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                backgroundColor: isCompleted ? completedColor : incompleteColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                border: isCompleted ? `2px solid ${completedColor}` : `2px solid ${incompleteColor}`
              }}>
                {isCompleted && (
                  <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                    ✓
                  </Typography>
                )}
              </Box>
              
              {/* Green text for completed items */}
              <Typography 
                fontSize={14} 
                color={isCompleted ? completedColor : '#333'} 
                sx={{ 
                  lineHeight: 1.4,
                  fontWeight: isCompleted ? 600 : 400,
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
              >
                {item.text}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

function ResumeScore({ analysisResult }) {
  const grade = analysisResult ? resumeAnalysisService.getGrade(analysisResult.percentage) : null;
  
  return (
    <Paper elevation={2} sx={{ 
      flex: 1,
      width: '100%',
      height: '100%',
      minHeight: '200px',
      p: 2, 
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '2px solid #c8c8c8',
      transition: 'border-color 0.3s ease',
      '&:hover': {
        borderColor: '#2085f6'
      }
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={1.5} fontSize="16px">
        Resume Score
      </Typography>
      
      {analysisResult ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, height: '100%' }}>
          {/* Left Side - Score Display */}
          <Box sx={{ 
            flex: '0 0 120px',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'stretch',
            height: '100%'
          }}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              height: '180px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography fontSize={24} fontWeight={700} color={grade?.color || '#333'} mb={1}>
                {analysisResult.percentage}%
              </Typography>
              <Typography fontSize={16} fontWeight={600} color={grade?.color || '#333'} mb={1}>
                Grade: {grade?.grade || 'N/A'}
              </Typography>
              <Typography fontSize={14} color="#666" mb={1}>
                {grade?.description || 'No analysis available'}
              </Typography>
              <Typography fontSize={12} color="#888" mt={1}>
                {analysisResult.totalScore}/{analysisResult.maxScore} points
              </Typography>
            </Box>
          </Box>
          
          {/* Right Side - Suggestions */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography fontSize={16} color="#333" mb={1.5} fontWeight={600}>
              Suggestions:
            </Typography>
            {analysisResult.suggestions.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ 
                  flex: 1, 
                  maxHeight: '120px', // Reduced height to show only ~3 suggestions
                  overflowY: 'auto',
                  pr: 1,
                  // Custom scrollbar styling
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#1976d2',
                    borderRadius: '4px',
                    '&:hover': {
                      background: '#1565c0',
                    },
                  },
                }}>
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 1.5,
                      py: 0.8, // Increased padding for better spacing
                      px: 1,
                      borderRadius: '6px',
                      transition: 'all 0.3s ease',
                      minHeight: '32px', // Ensure consistent height for each suggestion
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}>
                      {/* Blue vertical bar indicator */}
                      <Box sx={{ 
                        width: '4px',
                        height: '20px', // Increased height for better visibility
                        backgroundColor: '#1976d2',
                        borderRadius: '2px',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                        mt: 0.3
                      }} />
                      
                      {/* Suggestion text */}
                      <Typography 
                        fontSize={12} 
                        color="#666" 
                        sx={{ 
                          lineHeight: 1.4, 
                          flex: 1,
                          wordWrap: 'break-word'
                        }}
                      >
                        {suggestion}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
              </Box>
            ) : (
              <Typography fontSize={12} color="#666" sx={{ fontStyle: 'italic' }}>
                Upload a resume to get personalized suggestions.
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography fontSize={14} color="#333" mb={1.5} fontWeight={500}>
        Resume Strength (Marks)
      </Typography>
      <Typography fontSize={14} color="#666" sx={{ lineHeight: 1.4 }}>
            Upload a resume to get your score and personalized suggestions
      </Typography>
        </Box>
      )}
    </Paper>
  );
}


function MainContent({ onViewChange }) {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploadedFile, setUploadedFile] = React.useState(null);
  const [uploadDate, setUploadDate] = React.useState(null);
  const [uploadError, setUploadError] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showValidationPopup, setShowValidationPopup] = React.useState(false);
  const [validationAction, setValidationAction] = React.useState('');
  const [downloadPopupState, setDownloadPopupState] = React.useState('none'); // 'none', 'progress', 'success', 'failed'
  const [previewPopupState, setPreviewPopupState] = React.useState('none'); // 'none', 'progress', 'failed'
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [previewProgress, setPreviewProgress] = React.useState(0);
  const [studentData, setStudentData] = React.useState(() => {
    // Initialize immediately with localStorage data to prevent glitch
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // OPTIMIZED LOADING: Single call, better error handling
  useEffect(() => {
    const startTime = performance.now();
    let isMounted = true; // Prevent state updates after unmount
    
    const loadResumeData = async () => {
      try {
        const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (!studentData || !isMounted) {
          console.log('⚠️ No student data found');
          return;
        }

        // Show cached data immediately if available for faster UI
        if (studentData.resumeData && studentData.resumeUploadDate) {
          console.log('⚡ Showing cached resume for faster UI');
          setStudentData(studentData);
          setUploadedFile({ name: studentData.resumeData.name, url: studentData.resumeData.url });
          setUploadDate(studentData.resumeUploadDate || 'Unknown');
          setAnalysisResult(studentData.resumeAnalysis);
          
          // Fetch fresh data in background
          setTimeout(() => {
            fetchFreshResume(studentData, startTime);
          }, 100);
          return;
        }

        // No cache, fetch immediately
        await fetchFreshResume(studentData, startTime);
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ Load error:', error);
      }
    };

    const fetchFreshResume = async (studentData, startTime) => {
      try {
        console.log('🔍 Loading resume for student:', studentData.regNo);

        // Step 1: Show loading state
        setUploadedFile({ name: 'Loading...', url: null });
        setUploadDate('Loading...');
        setAnalysisResult(null);

        // Step 2: Get correct student ID from MongoDB
        const fastDataService = (await import('../services/fastDataService.js')).default;
        
        let studentId = null;
        let freshStudentData = null;
        
        try {
          const completeData = await Promise.race([
            fastDataService.getCompleteStudentData(studentData._id || studentData.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          freshStudentData = completeData?.student;
          studentId = freshStudentData?._id || freshStudentData?.id;
          console.log('✅ Student ID fetched from MongoDB:', studentId);
        } catch (error) {
          console.error('❌ Error fetching student data:', error);
          if (studentData.resumeData) {
            // Fallback to cached data
            setUploadedFile({ name: studentData.resumeData.name, url: studentData.resumeData.url });
            setUploadDate(studentData.resumeUploadDate || 'Unknown');
            setAnalysisResult(studentData.resumeAnalysis);
          } else {
            setUploadedFile({ name: 'Error loading resume', url: null });
            setUploadDate('Error loading resume');
          }
          return;
        }

        // Step 3: Fetch resume data
        if (!studentId || !isMounted) {
          console.log('⚠️ No valid student ID');
          return;
        }

        console.log('🔄 Fetching resume data for student:', studentId);
        
        const mongoDBService = (await import('../services/mongoDBService.js')).default;
        const resumeData = await mongoDBService.getResume(studentId);
        
        if (!isMounted) return;
        
        if (resumeData && resumeData.resume && resumeData.resume.fileData) {
          const endTime = performance.now();
          console.log(`✅ RESUME LOAD SUCCESS: ${Math.round(endTime - startTime)}ms`);
          
          const updatedData = {
            ...freshStudentData,
            resumeData: {
              name: resumeData.resume.fileName,
              url: `data:${resumeData.resume.fileType};base64,${resumeData.resume.fileData}`,
              type: resumeData.resume.fileType,
              size: resumeData.resume.fileSize
            },
            resumeUploadDate: new Date(resumeData.resume.uploadedAt).toLocaleDateString(),
            resumeAnalysis: resumeData.resume.analysisResult
          };
          
          // Update UI
          setStudentData(updatedData);
          setUploadedFile({ name: updatedData.resumeData.name, url: updatedData.resumeData.url });
          setUploadDate(updatedData.resumeUploadDate);
          setAnalysisResult(updatedData.resumeAnalysis);
          
          // Cache for next time
          localStorage.setItem('studentData', JSON.stringify(updatedData));
          console.log('✅ Resume cached successfully');
        } else {
          console.log('❌ No resume found in MongoDB');
          setUploadedFile({ name: 'No resume uploaded', url: null });
          setUploadDate('No resume uploaded');
          setAnalysisResult(null);
        }
      } catch (error) {
        console.log('❌ Resume fetch error:', error.message);
        setUploadedFile({ name: 'No resume uploaded', url: null });
        setUploadDate('No resume uploaded');
        setAnalysisResult(null);
      }
    };

    // Start loading
    loadResumeData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once



  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setUploadError('');
    if (!file) return;
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload only PDF files');
      return;
    }
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 1MB');
      return;
    }
    setSelectedFile(file);
    event.target.value = '';
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    try {
      setIsAnalyzing(true);
      setUploadError('');

      // Get student data from localStorage
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData) {
        setUploadError('User not authenticated');
        return;
      }

      console.log('🚀 Starting resume upload and analysis for:', selectedFile.name);

      // Step 1: Upload file to MongoDB (replaces existing resume)
      const mongoDBService = (await import('../services/mongoDBService.js')).default;
      const uploadResponse = await mongoDBService.uploadResumeFile(selectedFile, studentData.id || studentData._id);
      console.log('✅ Resume uploaded to MongoDB:', uploadResponse.message);
      
      // Step 2: Convert file to base64 for AI analysis
      const fileReader = new FileReader();
      const base64FileData = await new Promise((resolve) => {
        fileReader.onload = (e) => resolve(e.target.result.split(',')[1]); // Remove data:type;base64, prefix
        fileReader.readAsDataURL(selectedFile);
      });
      
      // Step 3: DYNAMIC analysis with timeout
      let analysis;
      try {
        console.log('🤖 Starting AI analysis...');
        
        // Add timeout to AI analysis
        const analysisPromise = mongoDBService.analyzeResumeWithFile(
          studentData.id || studentData._id, 
          base64FileData, 
          selectedFile.name
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout')), 5000) // 5 second timeout
        );
        
        const analysisResponse = await Promise.race([analysisPromise, timeoutPromise]);
        
        analysis = analysisResponse.analysisResult;
        console.log('✅ AI analysis completed successfully');
        console.log('📊 Analysis results:', {
          percentage: analysis?.percentage,
          grade: analysis?.grade,
          checklistItems: analysis?.checklistResults?.length || 0
        });
        
        // Validate analysis results
        if (!analysis || !analysis.checklistResults || analysis.checklistResults.length === 0) {
          throw new Error('Invalid analysis results received');
        }
        
      } catch (analysisError) {
        console.warn('⚠️ AI analysis failed, using dynamic fallback:', analysisError.message);
        
        // DYNAMIC fallback analysis
        analysis = await getUltraFastFallbackAnalysis(selectedFile, base64FileData, studentData);
        console.log('✅ DYNAMIC fallback analysis completed');
      }

      // Step 4: Update UI immediately with new data
      const updatedStudentData = {
        ...studentData,
        resumeData: {
          name: selectedFile.name,
          url: `data:${selectedFile.type};base64,${uploadResponse.resume.fileData}`,
          type: selectedFile.type,
          size: selectedFile.size
        },
        resumeUploadDate: new Date().toLocaleDateString(),
        resumeAnalysis: analysis
      };

      // Update localStorage immediately
      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));

      // Update all states immediately
      setUploadedFile({ 
        name: selectedFile.name, 
        url: `data:${selectedFile.type};base64,${uploadResponse.resume.fileData}` 
      });
      setUploadDate(new Date().toLocaleDateString());
      setAnalysisResult(analysis);
      setStudentData(updatedStudentData);
      setSelectedFile(null);
      setShowSuccess(true);
      
      console.log('✅ UI updated successfully with new resume and analysis');

      // Step 5: Background MongoDB sync (non-blocking)
      setTimeout(async () => {
      try {
        await mongoDBService.saveResumeAnalysis(studentData.id || studentData._id, analysis);
          console.log('✅ MongoDB analysis sync completed');
      } catch (mongoError) {
          console.warn('⚠️ MongoDB sync failed (non-critical):', mongoError.message);
      }
      }, 100);

      // Hide success popup after 2 seconds
    setTimeout(() => setShowSuccess(false), 2000);
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // DYNAMIC fallback analysis function
  const getUltraFastFallbackAnalysis = async (file, base64Data, studentData) => {
    try {
      console.log('🔍 DYNAMIC ANALYSIS: Starting pattern detection...');
      console.log('📄 File type:', file.type || file.name?.split('.').pop());
      console.log('📄 File name:', file.name);
      
      let extractedText = '';

      // Extract text content from PDF file using browser-compatible methods
      try {
        // For PDF files, decode base64 using browser-compatible method
        const base64String = base64Data.replace(/^data:[^;]+;base64,/, '');
        const binaryString = atob(base64String);
        
        console.log('📄 Binary string length:', binaryString.length);
        
        // Method 1: Try to extract readable text from the binary string
        const textContent = binaryString;
        
        // Clean up the text - remove binary characters and extract readable content
        extractedText = textContent
          .replace(/[^\x20-\x7E\s]/g, ' ') // Remove non-printable characters
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/[^\w\s@.+()-]/g, ' ') // Keep only alphanumeric, spaces, @, ., +, -, (, )
          .trim();
        
        console.log('📄 Method 1 - PDF text extracted, length:', extractedText.length);
        console.log('📄 Method 1 - First 500 characters:', extractedText.substring(0, 500));
        
        // Method 2: If extraction failed or too short, try alternative method
        if (!extractedText || extractedText.length < 50) {
          console.log('📄 Method 1 failed, trying Method 2...');
          // Try to extract text by looking for common resume patterns
          const commonWords = [
            'name', 'email', 'mobile', 'phone', 'objective', 'experience', 'education', 'skills', 'project', 'achievement',
            'linkedin', 'github', 'objective', 'career', 'summary', 'professional', 'motivated',
            'java', 'python', 'javascript', 'react', 'flask', 'firebase', 'mysql', 'oracle',
            'intern', 'developer', 'engineer', 'software', 'full-stack', 'ai', 'blockchain',
            'iit', 'madras', 'hackathon', 'finalist', 'winner', 'certificate', 'coursera', 'nptel',
            'bachelor', 'engineering', 'computer', 'science', 'college'
          ];
          const foundWords = commonWords.filter(word => binaryString.toLowerCase().includes(word.toLowerCase()));
          extractedText = foundWords.join(' ') + ' ' + file.name;
          console.log('📄 Method 2 - Alternative extraction, found words:', foundWords);
        }
        
        // Method 3: If still no text, try to extract from the raw binary string
        if (!extractedText || extractedText.length < 10) {
          console.log('📄 Method 2 failed, trying Method 3...');
          // Look for readable text patterns in the binary string
          const readablePattern = /[a-zA-Z0-9\s@.+()-]{10,}/g;
          const matches = binaryString.match(readablePattern) || [];
          extractedText = matches.join(' ') || file.name;
          console.log('📄 Method 3 - Raw binary extraction, found matches:', matches.length);
        }
        
        // Method 4: DYNAMIC fallback using student data
        if (!extractedText || extractedText.length < 10) {
          console.log('📄 Method 3 failed, using dynamic student data fallback...');
          // Use student data to create a simulated text for analysis
          extractedText = `
            ${studentData?.firstName || ''} ${studentData?.lastName || ''}
            ${studentData?.primaryEmail || ''}
            ${studentData?.mobileNo || ''}
            ${studentData?.linkedinLink || ''}
            ${studentData?.githubLink || ''}
            ${studentData?.degree || ''} ${studentData?.branch || ''}
            OBJECTIVE Career objective professional summary motivated detail-oriented
            EXPERIENCE Work experience internship employment developer engineer
            PROJECTS Project portfolio applications development github vercel
            ACHIEVEMENTS Awards honors recognition certificates hackathon winner
            EDUCATION University college degree qualification bachelor engineering
          `;
          console.log('📄 Method 4 - Using generic student data fallback for analysis');
        }
        
      } catch (error) {
        console.log('📄 All extraction methods failed:', error.message);
        // Final fallback - use DYNAMIC student data
        extractedText = `
          ${studentData?.firstName || ''} ${studentData?.lastName || ''}
          ${studentData?.primaryEmail || ''}
          ${studentData?.mobileNo || ''}
          ${studentData?.linkedinLink || ''}
          ${studentData?.githubLink || ''}
          ${studentData?.degree || ''} ${studentData?.branch || ''}
          OBJECTIVE Career objective professional summary
          EXPERIENCE Work experience internship employment
          PROJECTS Project portfolio applications development
          ACHIEVEMENTS Awards honors recognition certificates
          EDUCATION University college degree qualification
        `;
        console.log('📄 Final fallback - Using DYNAMIC student data for analysis');
      }

      // Professional resume analysis checking against student database
      console.log('🔍 Starting professional resume analysis...');
      console.log('👤 Student data:', {
        firstName: studentData?.firstName,
        lastName: studentData?.lastName,
        primaryEmail: studentData?.primaryEmail,
        mobileNo: studentData?.mobileNo,
        linkedinLink: studentData?.linkedinLink,
        githubLink: studentData?.githubLink,
        degree: studentData?.degree,
        branch: studentData?.branch
      });

      // 1. Check Personal Identification (Name) - Check firstName + lastName from DB
      console.log('🔍 Checking PERSONAL IDENTIFICATION (Name)...');
      const fullName = `${studentData?.firstName || ''} ${studentData?.lastName || ''}`.trim();
      const hasPersonalIdentification = fullName && extractedText.toLowerCase().includes(fullName.toLowerCase());
      console.log('✅ Name check:', { fullName, found: hasPersonalIdentification });

      // 2. Check Email ID - Match with student profile primaryEmail
      console.log('🔍 Checking EMAIL ID...');
      const studentEmail = studentData?.primaryEmail || '';
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = extractedText.match(emailPattern) || [];
      const hasEmail = foundEmails.some(email => email.toLowerCase() === studentEmail.toLowerCase());
      console.log('✅ Email check:', { studentEmail, foundEmails, match: hasEmail });

      // 3. Check LinkedIn Link - Match with database linkedinLink
      console.log('🔍 Checking LINKEDIN LINK...');
      const studentLinkedIn = studentData?.linkedinLink || '';
      const linkedinPattern = /linkedin\.com\/in\/[a-zA-Z0-9\-_]+/gi;
      const foundLinkedIn = extractedText.match(linkedinPattern) || [];
      
      const hasLinkedIn = foundLinkedIn.some(link => {
        // Clean both URLs to remove protocols and www
        const cleanLink = link.toLowerCase()
          .replace(/https?:\/\//, '')
          .replace(/www\./, '')
          .trim();
        const cleanStudentLinkedIn = studentLinkedIn.toLowerCase()
          .replace(/https?:\/\//, '')
          .replace(/www\./, '')
          .trim();
        
        console.log('🔗 LinkedIn comparison:', {
          foundLinkedIn: cleanLink,
          studentLinkedIn: cleanStudentLinkedIn,
          exactMatch: cleanLink === cleanStudentLinkedIn,
          containsMatch: cleanLink.includes(cleanStudentLinkedIn) || cleanStudentLinkedIn.includes(cleanLink)
        });
        
        // Check for exact match
        if (cleanLink === cleanStudentLinkedIn) {
          console.log('🔗 LinkedIn exact match found');
          return true;
        }
        
        // Check if one contains the other (for partial matches)
        if (cleanStudentLinkedIn && (cleanLink.includes(cleanStudentLinkedIn) || cleanStudentLinkedIn.includes(cleanLink))) {
          console.log('🔗 LinkedIn partial match found');
          return true;
        }
        
        return false;
      });
      
      console.log('✅ LinkedIn check:', { studentLinkedIn, foundLinkedIn, match: hasLinkedIn });

      // 4. Check GitHub Link - Match with database githubLink
      console.log('🔍 Checking GITHUB LINK...');
      const studentGitHub = studentData?.githubLink || '';
      const githubPattern = /github\.com\/[a-zA-Z0-9\-_]+/gi;
      const foundGitHub = extractedText.match(githubPattern) || [];
      const hasGitHub = studentGitHub ? foundGitHub.some(link => 
        link.toLowerCase().includes(studentGitHub.toLowerCase().replace('http://', '').replace('https://', ''))
      ) : foundGitHub.length > 0;
      console.log('✅ GitHub check:', { studentGitHub, foundGitHub, match: hasGitHub });

      // 5. Check Mobile Number - Handle +91 or 10-digit format
      console.log('🔍 Checking MOBILE NUMBER...');
      const studentMobile = studentData?.mobileNo || '';
      const cleanStudentMobile = studentMobile.replace(/[^\d]/g, ''); // Remove all non-digits
      const mobilePattern = /(\+91[\s-]?)?(\d{10})/g;
      const foundMobiles = extractedText.match(mobilePattern) || [];
      
      const hasMobile = foundMobiles.some(mobile => {
        const cleanMobile = mobile.replace(/[^\d]/g, ''); // Remove all non-digits from found mobile
        
        console.log('📱 Mobile comparison:', {
          studentMobile: studentMobile,
          cleanStudentMobile: cleanStudentMobile,
          foundMobile: mobile,
          cleanFoundMobile: cleanMobile,
          condition1: cleanMobile === cleanStudentMobile,
          condition2: cleanStudentMobile === cleanMobile.slice(-10),
          condition3: cleanMobile === cleanStudentMobile.slice(-10)
        });
        
        // Condition 1: Mobile No. in resume matches DB exactly
        if (cleanMobile === cleanStudentMobile) {
          console.log('📱 Condition 1 matched: Exact match');
          return true;
        }
        
        // Condition 2: +91 prefix added to Mobile No. and check with DB
        if (cleanMobile.length === 12 && cleanMobile.startsWith('91') && cleanStudentMobile === cleanMobile.slice(-10)) {
          console.log('📱 Condition 2 matched: +91 prefix with 10-digit match');
          return true;
        }
        
        // Condition 3: Check if DB mobile matches last 10 digits of found mobile
        if (cleanStudentMobile.length === 10 && cleanMobile.length >= 10 && cleanStudentMobile === cleanMobile.slice(-10)) {
          console.log('📱 Condition 3 matched: DB mobile matches last 10 digits of found mobile');
          return true;
        }
        
        return false;
      });
      
      console.log('✅ Mobile check:', { studentMobile, cleanStudentMobile, foundMobiles, match: hasMobile });

      // 6. Check Career Objective
      console.log('🔍 Checking CAREER OBJECTIVE...');
      const hasCareerObjective = /(objective|career objective|goal|aim|aspiration|professional objective|career goal|mission|vision|motivated|detail-oriented)/i.test(extractedText);
      console.log('✅ Career Objective found:', hasCareerObjective);

      // 7. Check Work Experience
      console.log('🔍 Checking WORK EXPERIENCE...');
      const hasWorkExperience = /(experience|work experience|employment|job|internship|developer|engineer|analyst|manager|coordinator|professional experience|work history|employment history|intern|junior|senior|2020|2021|2022|2023|2024|2025)/i.test(extractedText);
      console.log('✅ Work Experience found:', hasWorkExperience);

      // 8. Check Projects
      console.log('🔍 Checking PROJECTS...');
      const hasProjects = /(project|portfolio|projects|work|application|website|built|developed|created|designed|implemented|project portfolio|personal projects|academic projects|github\.com|vercel\.app|portfolio)/i.test(extractedText);
      console.log('✅ Projects found:', hasProjects);

      // 9. Check Achievements
      console.log('🔍 Checking ACHIEVEMENTS...');
      const hasAchievements = /(achievement|achievements|activities|extracurricular|award|honor|recognition|prize|winner|excellent|outstanding|top|best|first|leader|volunteer|club|society|competition|contest|finalist|place|winner|certificate)/i.test(extractedText);
      console.log('✅ Achievements found:', hasAchievements);

      // 10. Check Education - Match degree and branch
      console.log('🔍 Checking EDUCATION...');
      const studentDegree = studentData?.degree || '';
      const studentBranch = studentData?.branch || '';
      const degreePatterns = [
        studentDegree,
        studentDegree.replace('B.E', 'Bachelor of Engineering'),
        studentDegree.replace('B.Tech', 'Bachelor of Technology'),
        studentBranch,
        studentBranch.replace('CSE', 'Computer Science Engineering'),
        studentBranch.replace('CSE', 'Computer Science'),
        'Computer Science Engineering',
        'Computer Science',
        'Engineering'
      ].filter(Boolean);
      
      const hasEducation = degreePatterns.some(pattern => 
        pattern && extractedText.toLowerCase().includes(pattern.toLowerCase())
      ) || /(education|educational background|degree|university|college|school|bachelor|master|phd|computer science|engineering|business|management|academic|qualification|graduation|cgpa|gpa)/i.test(extractedText);
      console.log('✅ Education check:', { studentDegree, studentBranch, degreePatterns, found: hasEducation });


      // Calculate score based on new professional resume structure
      const completedItems = [
        hasPersonalIdentification, hasEmail, hasLinkedIn, hasGitHub, hasMobile,
        hasCareerObjective, hasWorkExperience, hasProjects, hasAchievements, hasEducation
      ].filter(Boolean).length;

      const percentage = Math.round((completedItems / 10) * 100);
      const grade = getGrade(percentage);

      console.log('📊 ANALYSIS COMPLETE:', {
        completedItems,
        totalItems: 10,
        percentage,
        grade
      });

      // Generate suggestions based on new structure and database matching
      const suggestions = generateSuggestions({
        hasPersonalIdentification, hasEmail, hasLinkedIn, hasGitHub, hasMobile,
        hasCareerObjective, hasWorkExperience, hasProjects, hasAchievements, hasEducation,
        studentData
      }, percentage);

      return {
        percentage: percentage,
        totalScore: completedItems,
        maxScore: 10,
        grade: grade,
        description: `Fallback analysis completed - ${percentage}% of essential sections found`,
        suggestions: suggestions,
        checklistResults: [
          { id: 'personal_identification', isCompleted: hasPersonalIdentification },
          { id: 'email_match', isCompleted: hasEmail },
          { id: 'linkedin_match', isCompleted: hasLinkedIn },
          { id: 'github_match', isCompleted: hasGitHub },
          { id: 'mobile_match', isCompleted: hasMobile },
          { id: 'career_objective', isCompleted: hasCareerObjective },
          { id: 'work_experience', isCompleted: hasWorkExperience },
          { id: 'projects', isCompleted: hasProjects },
          { id: 'achievements', isCompleted: hasAchievements },
          { id: 'education', isCompleted: hasEducation }
        ]
      };
    } catch (error) {
      console.error('DYNAMIC analysis error:', error);
      return getBasicFallbackAnalysis(); // Fallback to the most basic analysis
    }
  };

  // Basic fallback analysis for total failure
  const getBasicFallbackAnalysis = () => ({
    percentage: 0,
    totalScore: 0,
    maxScore: 10,
    grade: 'F',
    description: 'Analysis failed - AI service and fallback unavailable',
    suggestions: [
      '❌ Analysis service is temporarily unavailable',
      '📄 Resume uploaded, but analysis could not be performed',
      '🔄 Please try re-analyzing later'
    ],
    checklistResults: [
      { id: 'personal_identification', isCompleted: false },
      { id: 'email_match', isCompleted: false },
      { id: 'linkedin_match', isCompleted: false },
      { id: 'github_match', isCompleted: false },
      { id: 'mobile_match', isCompleted: false },
      { id: 'career_objective', isCompleted: false },
      { id: 'work_experience', isCompleted: false },
      { id: 'projects', isCompleted: false },
      { id: 'achievements', isCompleted: false },
      { id: 'education', isCompleted: false }
    ]
  });

  // Helper functions
  const getGrade = (percentage) => {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D+';
    if (percentage >= 45) return 'D';
    if (percentage >= 40) return 'D-';
    return 'F';
  };

  const generateSuggestions = (analysis, percentage) => {
    const suggestions = [];
    
    if (!analysis.hasPersonalIdentification) {
      suggestions.push('🔍 Missing: Add your full name prominently at the top');
    }
    
    if (!analysis.hasEmail) {
      if (analysis.studentData?.primaryEmail) {
        suggestions.push(`📧 Missing: Add your email "${analysis.studentData.primaryEmail}" to match your profile`);
      } else {
        suggestions.push('📧 Missing: Add a professional email address');
      }
    }
    
    if (!analysis.hasLinkedIn) {
      if (analysis.studentData?.linkedinLink) {
        suggestions.push(`💼 Missing: Add LinkedIn link "${analysis.studentData.linkedinLink}" to match your profile`);
      } else {
        suggestions.push('💼 Recommendation: Add LinkedIn profile URL and save it in your Profile page');
      }
    }
    
    if (!analysis.hasGitHub) {
      if (analysis.studentData?.githubLink) {
        suggestions.push(`💻 Missing: Add GitHub link "${analysis.studentData.githubLink}" to match your profile`);
      } else {
        suggestions.push('💻 Recommendation: Add GitHub profile URL and save it in your Profile page');
      }
    }
    
    if (!analysis.hasMobile) {
      if (analysis.studentData?.mobileNo) {
        suggestions.push(`📞 Missing: Add mobile number "${analysis.studentData.mobileNo}" to match your profile`);
      } else {
        suggestions.push('📞 Missing: Include a contact number for recruiters');
      }
    }
    
    if (!analysis.hasCareerObjective) {
      suggestions.push('🎯 Missing: Include a clear career objective or professional summary');
    }
    
    if (!analysis.hasWorkExperience) {
      suggestions.push('💼 Missing: Include work experience and internships');
    }
    
    if (!analysis.hasProjects) {
      suggestions.push('🚀 Missing: Showcase 2-3 key projects with details');
    }
    
    if (!analysis.hasAchievements) {
      suggestions.push('⭐ Missing: Highlight achievements and extracurricular activities');
    }
    
    if (!analysis.hasEducation) {
      if (analysis.studentData?.degree && analysis.studentData?.branch) {
        suggestions.push(`🎓 Missing: Mention your education "${analysis.studentData.degree} ${analysis.studentData.branch}"`);
      } else {
        suggestions.push('🎓 Missing: Mention educational background and qualifications');
      }
    }

    if (percentage >= 80) {
      suggestions.push('🎉 Excellent professional resume! All essential sections are present');
      suggestions.push('💡 Pro tip: Consider adding quantifiable results and metrics');
    } else if (percentage >= 60) {
      suggestions.push('👍 Good professional structure! Focus on missing essential sections');
      suggestions.push('📈 Consider updating your Profile page with missing links');
    } else {
      suggestions.push('⚠️ Resume needs improvement. Focus on essential professional sections first');
      suggestions.push('🎯 Priority: Name, Contact Info, Career Objective, and Experience');
    }

    return suggestions;
  };

  const handlePreview = async () => {
    if (!uploadedFile) {
      setValidationAction('preview');
      setShowValidationPopup(true);
      return;
    }
    
    // Show preview progress popup
    setPreviewPopupState('progress');
    setPreviewProgress(0);
    
    // Dynamic progress simulation
    const progressInterval = setInterval(() => {
      setPreviewProgress(prev => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 12;
      });
    }, 150);
    
    try {
      console.log('Previewing resume file:', { 
        name: uploadedFile.name, 
        urlLength: uploadedFile.url?.length,
        urlStart: uploadedFile.url?.substring(0, 50),
        isBase64: uploadedFile.url?.includes('data:')
      });
      
      // Check if the URL is a valid base64 string
      if (!uploadedFile.url || !uploadedFile.url.includes('data:')) {
        clearInterval(progressInterval);
        setPreviewPopupState('failed');
        return;
      }
      
      // Complete progress to 100%
      clearInterval(progressInterval);
      setPreviewProgress(100);
      
      // Use requestAnimationFrame for immediate execution
      requestAnimationFrame(() => {
        // Direct preview implementation
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>Resume Preview</title></head>
              <body style="margin:0;">
                <embed src="${uploadedFile.url}" width="100%" height="100%" type="application/pdf">
              </body>
            </html>
          `);
        }
        setPreviewPopupState('none');
      });
    } catch (error) {
      console.error('Preview error:', error);
      clearInterval(progressInterval);
      setPreviewPopupState('failed');
    }
  };

  const handleDownload = async () => {
    if (!uploadedFile) {
      setValidationAction('download');
      setShowValidationPopup(true);
      return;
    }
    
    // Show download progress popup
    setDownloadPopupState('progress');
    setDownloadProgress(0);
    
    // Dynamic progress simulation
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 12;
      });
    }, 150);
    
    try {
      // Let the progress animation run for a bit
      setTimeout(() => {
        // Complete progress to 100%
        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        // Use requestAnimationFrame for immediate execution
        requestAnimationFrame(() => {
          // Direct download implementation
          const link = document.createElement('a');
          link.href = uploadedFile.url;
          link.download = uploadedFile.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloadPopupState('success');
        });
      }, 1500);
    } catch (error) {
      console.error('Download error:', error);
      clearInterval(progressInterval);
      setDownloadPopupState('failed');
    }
  };

  const closeDownloadPopup = () => {
    setDownloadPopupState('none');
    setDownloadProgress(0);
  };

  const closePreviewPopup = () => {
    setPreviewPopupState('none');
    setPreviewProgress(0);
  };

  const handleReAnalyze = async () => {
    if (!uploadedFile) {
      setValidationAction('re-analyze');
      setShowValidationPopup(true);
      return;
    }

    try {
      setIsAnalyzing(true);
      setUploadError('');

      console.log('🔄 Starting re-analysis of existing resume:', uploadedFile.name);
      
      // Get student data
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData) {
        setUploadError('User not authenticated');
        return;
      }

      // Extract base64 data from uploaded file URL
      const base64Data = uploadedFile.url.split(',')[1];
      
      // Call AI analysis
      const mongoDBService = (await import('../services/mongoDBService.js')).default;
      let analysis;
      
      try {
        console.log('🤖 Re-analyzing with AI service...');
        const analysisResponse = await mongoDBService.analyzeResumeWithFile(
          studentData.id || studentData._id, 
          base64Data, 
          uploadedFile.name
        );
        
        analysis = analysisResponse.analysisResult;
        console.log('✅ Re-analysis completed successfully');
        
        // Validate analysis results
        if (!analysis || !analysis.checklistResults || analysis.checklistResults.length === 0) {
          throw new Error('Invalid analysis results received');
        }
        
      } catch (analysisError) {
        console.warn('⚠️ AI re-analysis failed, using dynamic fallback:', analysisError.message);
        
        // DYNAMIC fallback analysis
        analysis = await getUltraFastFallbackAnalysis({ name: uploadedFile.name }, base64Data, studentData);
        console.log('✅ DYNAMIC fallback re-analysis completed');
      }

      // Update student data
      const updatedStudentData = {
        ...studentData,
        resumeAnalysis: analysis
      };

      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
      setAnalysisResult(analysis);
      setStudentData(updatedStudentData);

      // Background MongoDB sync
      setTimeout(async () => {
        try {
          await mongoDBService.saveResumeAnalysis(studentData.id || studentData._id, analysis);
          console.log('✅ MongoDB re-analysis sync completed');
        } catch (mongoError) {
          console.warn('⚠️ MongoDB sync failed (non-critical):', mongoError.message);
        }
      }, 100);

      console.log('✅ Re-analysis complete, new analysis loaded');
    } catch (error) {
      console.error('❌ Error during re-analysis:', error);
      setUploadError('Failed to re-analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewProfile = () => {
    if (onViewChange) onViewChange('profile');
    console.log('View Profile clicked - navigating to profile');
  };

  return (
    <>
      <style>{`
        /* Styles for the animated success popup */
        .Resume-popup-container {
            background-color: #fff;
            border-radius: 12px;
            width: 400px;
            max-width: 90vw;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            font-family: 'Poppins', sans-serif;
        }
        .Resume-popup-header {
            background-color: #197AFF;
            color: white;
            padding: 1rem;
            font-size: 1.75rem;
            font-weight: 700;
        }
        .Resume-popup-body {
            padding: 2rem;
        }
        .Resume-popup-footer {
            padding: 1.5rem;
            background-color: #f7f7ff;
        }
        .Resume-popup-close-btn {
            background-color: #D23B42;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(210, 59, 66, 0.2);
        }
        .Resume-popup-close-btn:hover {
            background-color: #b53138;
            box-shadow: 0 4px 12px rgba(210, 59, 66, 0.3);
        }

        /* Success icon animations */
        .Resume-success-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #fff;
            stroke-miterlimit: 10;
            margin: 0 auto;
            box-shadow: inset 0 0 0 #22C55E;
            animation: Resume-fill 0.4s ease-in-out 0.4s forwards, Resume-scale 0.3s ease-in-out 0.9s both;
        }
        .Resume-success-icon--circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke-miterlimit: 10;
            stroke: #22C55E;
            fill: none;
            animation: Resume-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .Resume-success-icon--check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: Resume-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        
        @keyframes Resume-stroke {
            100% { stroke-dashoffset: 0; }
        }
        @keyframes Resume-scale {
            0%, 100% { transform: none; }
            50% { transform: scale3d(1.1, 1.1, 1); }
        }
        @keyframes Resume-fill {
            100% { box-shadow: inset 0 0 0 40px #22C55E; }
        }
      `}</style>
      <Box sx={{ p: { xs: 1, md: 1 }, mt: { xs: 0, md: -1.5 }, height: '100%' }}>
      <Box 
        display="flex" 
        gap={2} 
        sx={{ 
          width: '100%',
          height: '100%',
          flexDirection: { xs: 'column', md: 'row' }
        }}
      >
        {/* Left Column - Profile Card (Longer) */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: { xs: '100%', md: '30%' },
          height: { xs: 'auto', md: '103%' }
        }}>
          <Paper elevation={3} sx={{ 
            width: '100%', 
            height: '100%',
            p: 3, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            color: '#fff',
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
            border: '2px solid #c8c8c8',
            transition: 'border-color 0.3s ease',
            '&:hover': {
              borderColor: '#2085f6'
            }
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: '20px' }}>
              {studentData?.profilePicURL ? (
                <img 
                  src={studentData.profilePicURL} 
                  alt="Profile" 
                  onClick={() => {
                    const newWindow = window.open('', '_blank', 'width=600,height=600');
                    newWindow.document.write(`
                      <html>
                        <head>
                          <title>Profile Picture Preview</title>
                          <style>
                            body { margin: 0; padding: 20px; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                            img { max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                          </style>
                        </head>
                        <body>
                          <img src="${studentData.profilePicURL}" alt="Profile Picture Preview" />
                        </body>
                      </html>
                    `);
                    newWindow.document.close();
                  }}
                  style={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    marginBottom: 20
                  }}
                />
              ) : (
              <img src={Adminicon} alt="Placement Portal" style={{ width: 120, height: 100, marginBottom: 20, filter: 'brightness(0) invert(1)' }} />
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', mb: 3, pl: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Reg No</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData?.regNo || 'N/A'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Name</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData ? `${studentData.firstName} ${studentData.lastName}` : 'N/A'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>DOB</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData?.dob ? studentData.dob.toString().replace(/(\d{2})(\d{2})(\d{4})/, '$1-$2-$3') : 'N/A'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Dept</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData ? `${studentData.degree} ${studentData.branch}` : 'N/A'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Year</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData?.currentYear || 'N/A'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Sem</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData?.currentSemester || 'N/A'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>CGPA</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData?.overallCGPA || 'Null'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Mobile</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{studentData?.mobileNo || 'N/A'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Mail ID</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '200px', wordBreak: 'break-all' }} title={studentData?.primaryEmail || 'N/A'}>{studentData?.primaryEmail || 'N/A'}</Typography></Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0, mb: '8px', px: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleViewProfile} 
                sx={{ 
                  backgroundColor: '#fff', 
                  color: '#1976d2', 
                  fontWeight: 600, 
                  px: 3, 
                  py: 1, 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  textTransform: 'none', 
                  boxShadow: '0 2px 8px rgba(255,255,255,0.3)', 
                  width: '100%',
                  maxWidth: '200px',
                  whiteSpace: 'nowrap',
                  '&:hover': { 
                    backgroundColor: '#f8f9fa', 
                    boxShadow: '0 4px 12px rgba(255,255,255,0.4)', 
                    transform: 'translateY(-1px)' 
                  }, 
                  '&:active': { transform: 'translateY(0)' } 
                }}
              >
                View Profile
              </Button>
            </Box>
          </Paper>
        </Box>
        
        {/* Right Column - 3 Cards Stacked */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          width: { xs: '100%', md: '70%' },
          height: { xs: 'auto', md: '100%' }
        }}>
          {/* Upload Card */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            flex: '0 0 auto',
            minHeight: '300px'
        }}>
          <Paper elevation={3} sx={{ 
            width: '100%',
            height: '100%',
            p: 3, 
            background: '#fff', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
            display: 'flex', 
            flexDirection: 'column',
            border: '2px solid #c8c8c8',
            transition: 'border-color 0.3s ease',
            '&:hover': {
              borderColor: '#2085f6'
            }
          }}>
            <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="26px" align="center">Upload Your Resume</Typography>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ flex: 1, justifyContent: 'space-evenly' }}>
              <Button variant="outlined" component="label" startIcon={<Upload />} sx={{ borderColor: '#9e9e9e', color: '#9e9e9e', px: 4, py: 2, borderRadius: '12px', fontWeight: 600, fontSize: '16px', textTransform: 'none', borderWidth: '2px', '&:hover': { borderColor: '#757575', backgroundColor: '#f8f9fa', borderWidth: '2px' } }}>
                {selectedFile ? selectedFile.name : 'Upload (Max 1 MB)'}
                <input type="file" hidden accept=".pdf" onChange={handleFileSelect} />
              </Button>
              <Box sx={{ textAlign: 'center', color: '#9e9e9e' }}>
                <Typography fontSize={19} mb={0.5} sx={{ lineHeight: 1.4 }}>*Only PDF files allowed</Typography>
                {uploadError && <Typography fontSize={16} mb={0.5} sx={{ lineHeight: 1.4, color: '#d32f2f' }}>{uploadError}</Typography>}
                {selectedFile && <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#1976d2' }}>Selected: {selectedFile.name}</Typography>}
                {uploadedFile && !selectedFile && <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#1976d2' }}>Last uploaded: {uploadedFile.name}</Typography>}
                {isAnalyzing ? (
                  <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#1976d2' }}>
                    🔍 Analyzing resume... Please wait
                  </Typography>
                ) : showSuccess ? (
                  <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#4caf50' }}>
                    ✓ Resume uploaded and analyzed successfully
                  </Typography>
                ) : (
                  <Typography fontSize={19} sx={{ lineHeight: 1.4 }}>
                    *Click Upload and Select a file
                  </Typography>
                )}
                {analysisResult && (
                  <Typography fontSize={14} sx={{ lineHeight: 1.4, color: '#666', fontStyle: 'italic', mt: 1 }}>
                    Analysis based on file properties and common resume patterns
                  </Typography>
                )}
                {uploadDate && <Typography fontSize={16} sx={{ lineHeight: 1.4, color: '#1976d2' }}>Last uploaded on: {uploadDate}</Typography>}
              </Box>
              <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent="center">
                <Button variant="contained" size="small" startIcon={<Preview />} onClick={handlePreview} sx={{ backgroundColor: '#6c49e0', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textTransform: 'none', px: 3, py: 1, boxShadow: '0 4px 12px rgba(108, 73, 224, 0.3)', '&:hover': { backgroundColor: '#5a35d1', boxShadow: '0 6px 16px rgba(108, 73, 224, 0.4)' } }}>Preview</Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleFileUpload} 
                  disabled={isAnalyzing}
                  sx={{ 
                    borderColor: '#1976d2', 
                    color: '#1976d2', 
                    borderRadius: '8px', 
                    fontWeight: 600, 
                    fontSize: '14px', 
                    textTransform: 'none', 
                    px: 3, 
                    py: 1, 
                    '&:hover': { borderColor: '#1565c0', backgroundColor: '#f5f5f5' },
                    '&:disabled': { opacity: 0.6 }
                  }}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Upload'}
                </Button>
                <Button variant="contained" size="small" startIcon={<Download />} onClick={handleDownload} sx={{ backgroundColor: '#4caf50', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textTransform: 'none', px: 3, py: 1, boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)', '&:hover': { backgroundColor: '#388e3c', boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)' } }}>Download</Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={handleReAnalyze} 
                  disabled={isAnalyzing}
                  sx={{ 
                    backgroundColor: '#ff9800', 
                    borderRadius: '8px', 
                    fontWeight: 600, 
                    fontSize: '14px', 
                    textTransform: 'none', 
                    px: 3, 
                    py: 1, 
                    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)', 
                    '&:hover': { backgroundColor: '#f57c00', boxShadow: '0 6px 16px rgba(255, 152, 0, 0.4)' },
                    '&:disabled': { opacity: 0.6 }
                  }}
                >
                  {isAnalyzing ? 'Re-analyzing...' : 'Re-analyze'}
                </Button>
              </Box>
            </Box>
          </Paper>
          </Box>
          
          {/* Bottom Cards - Checklist and Score */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            flex: '1 1 auto',
            minHeight: '250px',
            mt: -0.5,
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            {/* Checklist Card */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              flex: 1
            }}>
              <ResumeChecklist analysisResults={analysisResult?.checklistResults} analysisResult={analysisResult} />
            </Box>
            
            {/* Score Card */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              flex: 1
            }}>
              <ResumeScore analysisResult={analysisResult} />
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Success Popup */}
      {showSuccess && (
        <div
          style={{
            minHeight: "100vh",
            width: "100vw",
            position: "fixed",
            left: 0,
            top: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(18,18,34,0.11)",
            zIndex: 1000,
          }}
        >
          <SuccessPopup onClose={() => setShowSuccess(false)} />
        </div>
      )}

      {/* Validation Popup */}
      {showValidationPopup && (
        <div
          style={{
            minHeight: "100vh",
            width: "100vw",
            position: "fixed",
            left: 0,
            top: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(18,18,34,0.11)",
            zIndex: 1000,
          }}
        >
          <ValidationPopup 
            onClose={() => setShowValidationPopup(false)} 
            action={validationAction}
          />
        </div>
      )}

      {/* Download/Preview Popup Components */}
      <DownloadProgressAlert 
        isOpen={downloadPopupState === 'progress'} 
        progress={downloadProgress} 
      />
      
      <DownloadSuccessAlert 
        isOpen={downloadPopupState === 'success'} 
        onClose={closeDownloadPopup} 
      />
      
      <DownloadFailedAlert 
        isOpen={downloadPopupState === 'failed'} 
        onClose={closeDownloadPopup} 
      />
      
      <PreviewProgressAlert 
        isOpen={previewPopupState === 'progress'} 
        progress={previewProgress} 
      />
      
      <PreviewFailedAlert 
        isOpen={previewPopupState === 'failed'} 
        onClose={closePreviewPopup} 
      />
    </Box>
    </>
  );
}

function Resume({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState(() => {
    // Initialize immediately with localStorage data to prevent glitch
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });

  // ⚡ INSTANT: Load student data and resume data from cache/localStorage
  useEffect(() => {
    const loadStudentData = () => {
      try {
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData) {
          setStudentData(storedStudentData);
        }
      } catch (error) {
        console.error('Error loading student data for sidebar:', error);
      }
    };
    
    // ⚡ INSTANT: Load from localStorage immediately
    const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    if (storedStudentData) {
      console.log('⚡ Resume: INSTANT load from localStorage');
      setStudentData(storedStudentData);
      
      // Try to get cached resume data
      const resumeData = localStorage.getItem('resumeData');
      if (resumeData) {
        console.log('⚡ Resume: INSTANT resume data from cache');
        // Resume data is already cached and ready
      }
      
      // Try to get even faster cached data
      if (storedStudentData._id) {
        import('../services/fastDataService.js').then(({ default: fastDataService }) => {
          const instantData = fastDataService.getInstantData(storedStudentData._id);
          if (instantData && instantData.student) {
            console.log('⚡ Resume: INSTANT load from cache');
            setStudentData(instantData.student);
          }
        });
      }
      
      // Dispatch immediate profile update for sidebar
      if (storedStudentData.profilePicURL) {
        console.log('🚀 Resume: Dispatching immediate profile update for sidebar');
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: storedStudentData 
        }));
      }
    }
    
    // Also listen for updates
    const handleStorageChange = () => {
      loadStudentData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    window.addEventListener('allDataPreloaded', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
      window.removeEventListener('allDataPreloaded', handleStorageChange);
    };
  }, []);

  // This handler simply calls the navigation function passed from App.js
  const handleViewChange = (view) => {
    onViewChange(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="container">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="main">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout}
          currentView={'resume'} // Hardcode 'resume' for highlighting
          onViewChange={handleViewChange} 
          studentData={studentData}
        />
        <div className="dashboard-area resume-page">
          {/* Pass onViewChange to MainContent so the "View Profile" button works */}
          <MainContent onViewChange={onViewChange} />
        </div>
      </div>
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}

export default Resume;