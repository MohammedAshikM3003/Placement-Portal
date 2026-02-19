import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Button, Box, Paper } from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import styles from './Resume.module.css';
import alertStyles from '../components/alerts/AlertStyles.module.css';
import Adminicon from '../assets/Adminicon.png';
import resumeAnalysisService from '../services/resumeAnalysisService.jsx';
import mongoDBService from '../services/mongoDBService.jsx';
import { DownloadProgressAlert, DownloadSuccessAlert, DownloadFailedAlert, PreviewProgressAlert, PreviewFailedAlert } from '../components/alerts/DownloadPreviewAlerts';

const DEGREE_STOP_WORDS = new Set(['of', 'in', 'and', 'for', 'the', 'with', 'to', 'a', 'an', 'on', 'by', 'from']);

// --- Success Popup (Scoped Styles) ---
const SuccessPopup = ({ onClose }) => (
  <div className={styles['Resume-popup-container']}>
    <div className={styles['Resume-popup-header']}>Resume Uploaded!</div>
    <div className={styles['Resume-popup-body']}>
      <svg className={styles['Resume-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className={styles['Resume-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
        <path className={styles['Resume-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
        Resume Uploaded ✓
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Resume has been uploaded and analyzed successfully
      </p>
    </div>
    <div className={styles['Resume-popup-footer']}>
      <button onClick={onClose} className={styles['Resume-popup-close-btn']}>
        Close
      </button>
    </div>
  </div>
);

// --- Validation Popup (Scoped Styles) ---
const ValidationPopup = ({ onClose, action }) => (
  <div className={styles['Resume-popup-container']}>
    <div className={styles['Resume-popup-header']}>No File !</div>
    <div className={styles['Resume-popup-body']}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="#ff9800" d="M18.308 16.5h3.361q.213 0 .356.144t.144.357t-.144.356t-.356.143h-2.48l3.115 3.116q.14.135.14.338t-.14.35q-.146.165-.357.156q-.21-.01-.357-.156l-3.09-3.09v2.455q0 .213-.144.356t-.357.144t-.356-.144t-.143-.356v-3.361q0-.344.232-.576t.576-.232M14 4v3.2q0 .34.23.57t.57.23H18zM6.616 3h7.213q.331 0 .632.13t.518.349L18.52 7.02q.217.218.348.518t.131.632v5.521q0 .344-.232.576t-.576.232h-1.884q-.343 0-.576.234q-.232.233-.232.578v4.876q0 .345-.232.579t-.576.233H6.616q-.691 0-1.153-.462T5 19.385V4.615q0-.69.463-1.152T6.616 3" strokeWidth="0.4" stroke="#ff9800"/>
        </svg>
      </div>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
        Please Build a Resume First
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        You need to build a resume first using the Resume Builder.
      </p>
    </div>
    <div className={styles['Resume-popup-footer']}>
      <button onClick={onClose} className={styles['Resume-popup-close-btn']}>
        Got it
      </button>
    </div>
  </div>
);

function ResumeChecklist({ analysisResults, analysisResult }) {
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

  const completedColor = '#4caf50';
  const incompleteColor = '#e0e0e0';

  return (
    <Paper elevation={2} sx={{ 
      flex: 1, width: '100%', height: '100%', minHeight: '200px', p: 2, 
      background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', border: '2px solid #c8c8c8',
      transition: 'border-color 0.3s ease', '&:hover': { borderColor: '#2085f6' }
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={1.5} fontSize="16px">
        Resume Checklist
      </Typography>
      <Box sx={{ 
        flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '200px', overflowY: 'auto',
        gap: 1, pr: 1,
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb': { background: '#1976d2', borderRadius: '4px', '&:hover': { background: '#1565c0' } },
      }}>
        {checklistItems.map((item, index) => {
          const result = analysisResults?.find(r => r.id === item.id);
          const isCompleted = result?.isCompleted || false;
          
          return (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5, px: 1, borderRadius: '6px', transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#f5f5f5' } }}>
              <Box sx={{ width: '4px', height: '20px', backgroundColor: isCompleted ? completedColor : incompleteColor, borderRadius: '2px', transition: 'all 0.3s ease', flexShrink: 0 }} />
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: isCompleted ? completedColor : incompleteColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', flexShrink: 0, border: isCompleted ? `2px solid ${completedColor}` : `2px solid ${incompleteColor}` }}>
                {isCompleted && <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</Typography>}
              </Box>
              <Typography fontSize={14} color={isCompleted ? completedColor : '#333'} sx={{ lineHeight: 1.4, fontWeight: isCompleted ? 600 : 400, textDecoration: isCompleted ? 'line-through' : 'none', transition: 'all 0.3s ease', flex: 1 }}>
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
      flex: 1, width: '100%', height: '100%', minHeight: '200px', p: 2, 
      background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '2px solid #c8c8c8', transition: 'border-color 0.3s ease', '&:hover': { borderColor: '#2085f6' }
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={1.5} fontSize="16px">Resume Score</Typography>
      {analysisResult ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, height: '100%' }}>
          <Box sx={{ flex: '0 0 120px', display: 'flex', flexDirection: 'column', justifyContent: 'stretch', height: '100%' }}>
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: '6px', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography fontSize={24} fontWeight={700} color={grade?.color || '#333'} mb={1}>{analysisResult.percentage}%</Typography>
              <Typography fontSize={16} fontWeight={600} color={grade?.color || '#333'} mb={1}>Grade: {grade?.grade || 'N/A'}</Typography>
              <Typography fontSize={14} color="#666" mb={1}>{grade?.description || 'No analysis available'}</Typography>
              <Typography fontSize={12} color="#888" mt={1}>{analysisResult.totalScore}/{analysisResult.maxScore} points</Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography fontSize={16} color="#333" mb={1.5} fontWeight={600}>Suggestions:</Typography>
            {analysisResult.suggestions.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ 
                  flex: 1, maxHeight: '120px', overflowY: 'auto', pr: 1,
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
                  '&::-webkit-scrollbar-thumb': { background: '#1976d2', borderRadius: '4px', '&:hover': { background: '#1565c0' } },
                }}>
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.8, px: 1, borderRadius: '6px', transition: 'all 0.3s ease', minHeight: '32px', '&:hover': { backgroundColor: '#f5f5f5' } }}>
                      <Box sx={{ width: '4px', height: '20px', backgroundColor: '#1976d2', borderRadius: '2px', transition: 'all 0.3s ease', flexShrink: 0, mt: 0.3 }} />
                      <Typography fontSize={12} color="#666" sx={{ lineHeight: 1.4, flex: 1, wordWrap: 'break-word' }}>{suggestion}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography fontSize={12} color="#666" sx={{ fontStyle: 'italic' }}>Upload a resume to get personalized suggestions.</Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography fontSize={14} color="#333" mb={1.5} fontWeight={500}>Resume Strength (Marks)</Typography>
          <Typography fontSize={14} color="#666" sx={{ lineHeight: 1.4 }}>Upload a resume to get your score and personalized suggestions</Typography>
        </Box>
      )}
    </Paper>
  );
}

// Main content component for resume page
function MainContent({ onViewChange }) {
  const [success, setSuccess] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Import fastDataService with .jsx extension
  useEffect(() => {
    import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
      // Any initialization with fastDataService if needed
    });
  }, []);
  const [showValidationPopup, setShowValidationPopup] = React.useState(false);
  const [validationAction, setValidationAction] = React.useState('');
  
  // Popup states
  const [downloadPopupState, setDownloadPopupState] = React.useState('none');
  const [previewPopupState, setPreviewPopupState] = React.useState('none');
  
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [previewProgress, setPreviewProgress] = React.useState(0);

  const [studentData, setStudentData] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('studentData') || 'null'); } catch (error) { return null; }
  });
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  
  // Resume data fetched from MongoDB
  const [resumeFromDB, setResumeFromDB] = React.useState(null);

  // --- RESTORED ROBUST DATA LOADING (From Backup) ---
  // Load resume analysis data from localStorage on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadResumeData = async () => {
      try {
        console.log('🔄 Loading resume data...');
        const latestData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (!latestData || !isMounted) {
          console.log('⚠️ No student data found in localStorage');
          return;
        }

        console.log('✅ Student data loaded:', latestData.firstName, latestData.lastName);
        setStudentData(latestData);
        
        // Load resume analysis if available (from Resume Builder)
        if (latestData.resumeAnalysis) {
          setAnalysisResult(latestData.resumeAnalysis);
          console.log('✅ Resume analysis loaded from localStorage');
        }

        // Fetch resume PDF from MongoDB backend via resume-builder route
        const studentId = latestData._id || latestData.id;
        console.log('🔍 Student ID for resume fetch:', studentId);
        
        if (studentId) {
          try {
            const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
            const authToken = localStorage.getItem('authToken');
            console.log('📡 Fetching resume from:', `${API_BASE}/api/resume-builder/pdf/${studentId}`);
            
            const response = await fetch(`${API_BASE}/api/resume-builder/pdf/${studentId}`, {
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
              }
            });
            
            console.log('📡 Resume fetch response status:', response.status);
            
            if (response.ok) {
              const result = await response.json();
              console.log('📡 Resume fetch result:', result.success ? '✅ Success' : '❌ Failed');
              
              if (result.success && result.resume && isMounted) {
                setResumeFromDB(result.resume);
                console.log('✅ Resume fetched from MongoDB - URL length:', result.resume.url?.length || 0);
              } else {
                console.log('⚠️ No resume data in response');
              }
            } else {
              console.log('❌ Resume fetch failed with status:', response.status);
            }
          } catch (fetchErr) {
            console.error('❌ Could not fetch resume from DB:', fetchErr);
          }
        } else {
          console.log('⚠️ No student ID found for resume fetch');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ Load error:', error);
      }
    };

    loadResumeData();
    
    // Listen for storage updates (e.g. when redirected from resume builder)
    const handleStorageUpdate = () => { loadResumeData(); };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('profileUpdated', handleStorageUpdate);
    
    return () => { 
      isMounted = false;
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('profileUpdated', handleStorageUpdate);
    };
  }, []);


  const handlePreview = async () => {
    // Prevent multiple previews
    if (previewPopupState !== 'none') {
      console.log('⚠️ Preview already in progress, ignoring click');
      return;
    }

    console.log('🔍 Starting resume preview...');
    
    // Show progress popup immediately
    setPreviewPopupState('progress');
    setPreviewProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setPreviewProgress(prev => (prev >= 85 ? prev : prev + 12));
    }, 150);

    try {
      // Priority: fetch from MongoDB, then fallback to localStorage
      let resumeUrl = resumeFromDB?.url || studentData?.resumeData?.url || studentData?.resumeURL;
      
      console.log('🔍 Resume URL source:', resumeFromDB ? 'MongoDB' : (studentData?.resumeData?.url ? 'localStorage resumeData' : 'localStorage resumeURL'));
      console.log('🔍 Resume URL length:', resumeUrl?.length);
      
      // If no resume data, try fetching from MongoDB
      if (!resumeUrl) {
        console.log('⚠️ No cached resume, fetching from MongoDB...');
        const latestData = JSON.parse(localStorage.getItem('studentData') || 'null');
        const studentId = latestData?._id || latestData?.id;
        
        if (!studentId) {
          clearInterval(progressInterval);
          setValidationAction('preview');
          setShowValidationPopup(true);
          setPreviewPopupState('none');
          return;
        }

        try {
          const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
          const authToken = localStorage.getItem('authToken');
          
          const response = await fetch(`${API_BASE}/api/resume-builder/pdf/${studentId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.resume?.url) {
              resumeUrl = result.resume.url;
              setResumeFromDB(result.resume);
              console.log('✅ Resume fetched from MongoDB');
            }
          }
        } catch (fetchErr) {
          console.error('❌ Failed to fetch resume:', fetchErr);
        }
      }

      if (!resumeUrl) {
        clearInterval(progressInterval);
        setValidationAction('preview');
        setShowValidationPopup(true);
        setPreviewPopupState('none');
        return;
      }

      // Wait for progress animation
      setTimeout(() => {
        clearInterval(progressInterval);
        setPreviewProgress(100);

        try {
          // Ensure proper format
          let formattedData = resumeUrl;
          
          console.log('🔍 Resume URL starts with:', resumeUrl.substring(0, 100));
          console.log('🔍 Resume URL type:', typeof resumeUrl);
          
          if (!resumeUrl.startsWith('data:')) {
            formattedData = `data:application/pdf;base64,${resumeUrl}`;
            console.log('✅ Added data URL prefix');
          } else {
            console.log('✅ URL already has data prefix');
          }

          // Convert base64 to blob for proper browser PDF viewing
          if (formattedData.startsWith('data:application/pdf;base64,')) {
            console.log('✅ Converting to blob for preview...');
            
            // Find the comma that separates the prefix from the data
            const commaIndex = formattedData.indexOf(',');
            console.log('🔍 Comma found at index:', commaIndex);
            
            const dataAfterPrefix = formattedData.substring(commaIndex + 1);
            
            if (!dataAfterPrefix || dataAfterPrefix.length === 0) {
              throw new Error('Empty data');
            }
            
            console.log('🔍 Data length:', dataAfterPrefix.length);
            console.log('🔍 First 50 chars:', dataAfterPrefix.substring(0, 50));
            
            let byteArray;
            
            // Check if data is comma-separated bytes (e.g., "37,80,68,70...")
            if (dataAfterPrefix.includes(',') && /^[\d,]+$/.test(dataAfterPrefix.substring(0, 100))) {
              console.log('🔧 Detected comma-separated byte format, converting...');
              const byteStrings = dataAfterPrefix.split(',');
              byteArray = new Uint8Array(byteStrings.map(str => parseInt(str, 10)));
              console.log('✅ Converted from comma-separated bytes, size:', byteArray.length);
            } else {
              console.log('🔧 Detected base64 format, decoding...');
              const byteCharacters = atob(dataAfterPrefix);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              byteArray = new Uint8Array(byteNumbers);
              console.log('✅ Decoded from base64, size:', byteArray.length);
            }
            
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            console.log('✅ Blob created, size:', blob.size, 'bytes');
            
            const blobUrl = URL.createObjectURL(blob);
            console.log('✅ Blob URL created:', blobUrl);
            
            // Open blob URL directly — browser's native PDF viewer handles it
            const win = window.open(blobUrl, '_blank');
            if (!win) {
              console.log('⚠️ Popup blocked, using fallback');
              const link = document.createElement('a');
              link.href = blobUrl;
              link.target = '_blank';
              link.click();
            }
            // Set title after a short delay
            setTimeout(() => {
              try { if (win) win.document.title = `Resume - ${studentData?.firstName || 'Preview'}`; } catch(e) {}
            }, 1000);
          } else {
            console.log('🔗 Opening regular URL');
            window.open(formattedData, '_blank');
          }
          
          setPreviewPopupState('none');
        } catch (err) {
          console.error('❌ Preview error:', err);
          setPreviewPopupState('error');
          setTimeout(() => setPreviewPopupState('none'), 2000);
          alert('Failed to preview PDF: ' + err.message);
        }
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('❌ Preview failed:', error);
      setPreviewPopupState('error');
      setTimeout(() => setPreviewPopupState('none'), 2000);
      alert('Failed to preview resume: ' + error.message);
    }
  };

  const handleDownload = async () => {
    // Prevent multiple downloads
    if (downloadPopupState !== 'none') {
      console.log('⚠️ Download already in progress, ignoring click');
      return;
    }

    console.log('📥 Starting resume download...');
    
    setDownloadPopupState('progress');
    setDownloadProgress(0);
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => (prev >= 85 ? prev : prev + 10));
    }, 150);

    try {
      // Priority: fetch from MongoDB, then fallback to localStorage
      let resumeUrl = resumeFromDB?.url || studentData?.resumeData?.url || studentData?.resumeURL;
      const resumeName = resumeFromDB?.name || studentData?.resumeData?.name || `${studentData?.firstName}_${studentData?.lastName}_Resume.pdf` || 'resume.pdf';
      
      console.log('📥 Resume URL source:', resumeFromDB ? 'MongoDB' : (studentData?.resumeData?.url ? 'localStorage resumeData' : 'localStorage resumeURL'));
      console.log('📥 File name:', resumeName);
      
      // If no resume data, try fetching from MongoDB
      if (!resumeUrl) {
        console.log('⚠️ No cached resume, fetching from MongoDB...');
        const latestData = JSON.parse(localStorage.getItem('studentData') || 'null');
        const studentId = latestData?._id || latestData?.id;
        
        if (!studentId) {
          clearInterval(progressInterval);
          setValidationAction('download');
          setShowValidationPopup(true);
          setDownloadPopupState('none');
          return;
        }

        try {
          const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
          const authToken = localStorage.getItem('authToken');
          
          const response = await fetch(`${API_BASE}/api/resume-builder/pdf/${studentId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.resume?.url) {
              resumeUrl = result.resume.url;
              setResumeFromDB(result.resume);
              console.log('✅ Resume fetched from MongoDB');
            }
          }
        } catch (fetchErr) {
          console.error('❌ Failed to fetch resume:', fetchErr);
        }
      }

      if (!resumeUrl) {
        clearInterval(progressInterval);
        setValidationAction('download');
        setShowValidationPopup(true);
        setDownloadPopupState('none');
        return;
      }
      
      // Wait for progress animation
      setTimeout(() => {
        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        try {
          // Ensure proper format
          let formattedData = resumeUrl;
          
          console.log('📥 Resume URL type:', typeof resumeUrl);
          console.log('📥 Resume URL length:', resumeUrl.length);
          
          if (!resumeUrl.startsWith('data:')) {
            formattedData = `data:application/pdf;base64,${resumeUrl}`;
            console.log('✅ Added data URL prefix');
          } else {
            console.log('✅ URL already has data prefix');
          }
          
          // Check if data is comma-separated bytes and convert to proper data URL
          if (formattedData.startsWith('data:application/pdf;base64,')) {
            const commaIndex = formattedData.indexOf(',');
            const dataAfterPrefix = formattedData.substring(commaIndex + 1);
            
            // Check if it's comma-separated bytes
            if (dataAfterPrefix.includes(',') && /^[\d,]+$/.test(dataAfterPrefix.substring(0, 100))) {
              console.log('🔧 Converting comma-separated bytes for download...');
              const byteStrings = dataAfterPrefix.split(',');
              const byteArray = new Uint8Array(byteStrings.map(str => parseInt(str, 10)));
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              formattedData = URL.createObjectURL(blob);
              console.log('✅ Converted to blob URL for download');
            }
          }
          
          // Direct download
          const link = document.createElement('a');
          link.href = formattedData;
          link.download = resumeName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Download triggered');
          setDownloadPopupState('success');
        } catch (err) {
          console.error('❌ Download error:', err);
          setDownloadPopupState('error');
          setTimeout(() => setDownloadPopupState('none'), 2000);
        }
      }, 1500);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('❌ Download failed:', error);
      setDownloadPopupState('error');
      setTimeout(() => setDownloadPopupState('none'), 2000);
    }
  };

  const handleViewProfile = () => { if (onViewChange) onViewChange('profile'); };
  const formatDob = (dob) => {
      if(!dob) return 'N/A';
      return dob.toString().replace(/(\d{2})(\d{2})(\d{4})/, '$1-$2-$3');
  };

  const degreeDisplay = useMemo(() => {
      if (!studentData) return 'N/A';

      const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

      const explicitAbbreviation = normalize(
        studentData.degreeAbbreviation || studentData.degreeCode || studentData.degreeShortName
      );
      if (explicitAbbreviation) return explicitAbbreviation;

      const formatLetters = (letters) => {
        if (!letters) return '';
        const condensed = letters.replace(/[^A-Za-z]/g, '').toUpperCase();
        if (!condensed) return '';
        if (condensed.length === 2) return `${condensed[0]}.${condensed[1]}`;
        return condensed;
      };

      const attemptDerive = (value) => {
        const normalized = normalize(value);
        if (!normalized) return '';

        const matchingDegree = Array.isArray(studentData.availableDegrees)
          ? studentData.availableDegrees.find((degree) => {
              const degreeFull = normalize(degree?.degreeFullName || degree?.fullName || degree?.name);
              return degreeFull && degreeFull.toLowerCase() === normalized.toLowerCase();
            })
          : null;

        if (matchingDegree) {
          const matchAbbrev = normalize(
            matchingDegree.degreeAbbreviation || matchingDegree.abbreviation || matchingDegree.shortName
          );
          if (matchAbbrev) return matchAbbrev;
        }

        const words = normalized
          .split(/\s+/)
          .map((word) => word.replace(/[^A-Za-z]/g, ''))
          .filter(Boolean);

        const filteredWords = words.filter((word) => !DEGREE_STOP_WORDS.has(word.toLowerCase()));
        const sourceWords = filteredWords.length > 0 ? filteredWords : words;

        const letters = sourceWords
          .map((word) => word[0]?.toUpperCase())
          .filter(Boolean)
          .join('');

        return formatLetters(letters);
      };

      const derived =
        attemptDerive(studentData.degreeFullName) ||
        attemptDerive(studentData.degree) ||
        attemptDerive(studentData.course);

      return derived || 'N/A';
  }, [studentData]);

  return (
    <Box sx={{ p: { xs: 1, md: 1 }, mt: { xs: 0, md: 0 }, height: '100%' }}>
        <Box display="flex" gap={2} sx={{ width: '100%', height: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: { xs: '100%', md: '30%' }, height: { xs: 'auto', md: '100%' } }}>
            <Paper
              elevation={3}
              sx={{
                width: '100%',
                height: '100%',
                p: 3,
                pt: 2.5,
                pb: 3.6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 2.5,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: '#fff',
                borderRadius: '16px',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
                border: '2px solid #c8c8c8',
                overflow: 'hidden',
                transition: 'border-color 0.3s ease',
                '&:hover': { borderColor: '#2085f6' }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 0, flexGrow: 1 }}>
              <img src={studentData?.profilePicURL || Adminicon} alt="Profile" style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 20, border: '4px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', objectFit: 'cover' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%', flexGrow: 1, mb: 0.5, pl: 2 }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Reg No</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{studentData?.regNo || 'N/A'}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Name</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{studentData ? `${studentData.firstName} ${studentData.lastName}` : 'N/A'}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>DOB</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{formatDob(studentData?.dob)}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Degree</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{degreeDisplay}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Branch</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{studentData?.branch || 'N/A'}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Year</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{studentData?.currentYear || 'N/A'}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Sem</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{studentData?.currentSemester || 'N/A'}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>CGPA</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{studentData?.overallCGPA || 'Null'}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Mobile</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '140px' }}>{studentData?.mobileNo || 'N/A'}</Typography></Box>
                 <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '80px' }}>Mail ID</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="16px" sx={{ fontWeight: 'bold', minWidth: '140px', wordBreak: 'break-all' }}>{studentData?.primaryEmail || studentData?.domainEmail || 'N/A'}</Typography></Box>
              </Box>
              </Box>
              <Box sx={{ width: '100%', px: 2.5, pb: 2.6, mt: 'auto' }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleViewProfile}
                  sx={{
                    backgroundColor: '#ffffff',
                    color: '#0a4fa3',
                    fontWeight: 600,
                    py: 0.9,
                    borderRadius: '12px',
                    fontSize: '15px',
                    textTransform: 'none',
                    letterSpacing: '0.02em',
                    boxShadow: '0 8px 22px rgba(10, 79, 163, 0.24)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f0f6ff',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 28px rgba(10, 79, 163, 0.32)'
                    }
                  }}
                >
                  View Profile
                </Button>
              </Box>
            </Paper>
          </Box>
          
          {/* Right Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: { xs: '100%', md: '70%' }, height: { xs: 'auto', md: '100%' } }}>
            {/* Build Resume Card */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto', minHeight: '300px' }}>
            <Paper elevation={3} sx={{ 
              width: '100%', height: '100%', p: 4, 
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
              borderRadius: '16px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '3px solid #60a5fa', 
              position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease', 
              '&:hover': { borderColor: '#2563eb', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)' },
              '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', background: '#2563eb', borderRadius: '16px 0 0 16px' }
            }}>
               <Typography variant="h4" fontWeight={800} color="#1e3a5f" mb={1.5} fontSize="32px" align="center">Build Your Professional Resume</Typography>
               <Typography fontSize="15px" color="#475569" mb={2} align="center" sx={{ lineHeight: 1.5 }}>
                 Build a recruiter-ready, ATS-optimized<br />
                 resume in minutes to showcase your top skills<br />
                 and achievements.
               </Typography>
               <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2.5}>
                 <Box sx={{ background: '#fef3c7', color: '#92400e', px: 1.5, py: 0.5, borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>*Powered by</Box>
                 <Box sx={{ background: '#fff', color: '#4a7c59', px: 1.75, py: 0.5, borderRadius: '6px', fontSize: '14px', fontWeight: 700, border: '1px solid #4a7c59' }}>Overleaf</Box>
               </Box>
               <Button
                 variant="contained"
                 size="large"
                 onClick={() => onViewChange('resume-builder')}
                 sx={{
                   background: '#1e3a5f',
                   borderRadius: '30px',
                   fontWeight: 700,
                   fontSize: '18px',
                   textTransform: 'none',
                   px: 5,
                   py: 1.75,
                   boxShadow: '0 4px 15px rgba(30, 58, 95, 0.3)',
                   mb: 2.5,
                   '&:hover': { background: '#2563eb', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)' }
                 }}
               >
                 🔨 Click to Build Resume →
               </Button>
               <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent="center" mb={2}>
                 <Button variant="contained" size="small" startIcon={<Visibility />} onClick={handlePreview} sx={{ backgroundColor: '#8b5cf6', borderRadius: '25px', fontWeight: 600, fontSize: '15px', textTransform: 'none', px: 3.5, py: 1, boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)', '&:hover': { backgroundColor: '#7c3aed' } }}>Preview</Button>
                 <Button variant="contained" size="small" startIcon={<Download />} onClick={handleDownload} sx={{ backgroundColor: '#22c55e', borderRadius: '25px', fontWeight: 600, fontSize: '15px', textTransform: 'none', px: 3.5, py: 1, boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)', '&:hover': { backgroundColor: '#16a34a' } }}>Download</Button>
               </Box>
               <Button
                 variant="contained"
                 onClick={() => onViewChange('ats-checker')}
                 sx={{
                   background: 'linear-gradient(135deg, #2DBE7F 0%, #1a9e62 100%)',
                   borderRadius: '30px',
                   fontWeight: 700,
                   fontSize: '15px',
                   textTransform: 'none',
                   px: 4,
                   py: 1.3,
                   boxShadow: '0 4px 15px rgba(45, 190, 127, 0.3)',
                   '&:hover': { background: 'linear-gradient(135deg, #1a9e62 0%, #158f55 100%)', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(45, 190, 127, 0.4)' }
                 }}
               >
                 🔍 Check ATS Score →
               </Button>
            </Paper>
            </Box>
            
            {/* Bottom Cards */}
            <Box sx={{ display: 'flex', gap: 2, flex: '1 1 auto', minHeight: '250px', mt: -0.5, flexDirection: { xs: 'column', md: 'row' } }}>
               <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                 <ResumeChecklist analysisResults={analysisResult?.checklistResults} analysisResult={analysisResult} />
               </Box>
               <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                 <ResumeScore analysisResult={analysisResult} />
               </Box>
            </Box>
          </Box>
        </Box>

        {/* Popups */}
        {showSuccess && <div className={styles.overlay} style={{display:'flex', alignItems:'center', justifyContent:'center'}}><SuccessPopup onClose={() => setShowSuccess(false)} /></div>}
        {showValidationPopup && <div className={styles.overlay} style={{display:'flex', alignItems:'center', justifyContent:'center'}}><ValidationPopup onClose={() => setShowValidationPopup(false)} action={validationAction} /></div>}

        {/* Download & Preview Alerts */}
        <DownloadProgressAlert isOpen={downloadPopupState === 'progress'} progress={downloadProgress} />
        <DownloadSuccessAlert isOpen={downloadPopupState === 'success'} onClose={() => setDownloadPopupState('none')} />
        <DownloadFailedAlert isOpen={downloadPopupState === 'error'} onClose={() => setDownloadPopupState('none')} />

        <PreviewProgressAlert isOpen={previewPopupState === 'progress'} progress={previewProgress} />
        <PreviewFailedAlert isOpen={previewPopupState === 'error'} onClose={() => setPreviewPopupState('none')} />

      </Box>
  );
}

function Resume({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studentData') || 'null'); } catch (error) { return null; }
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
    
    const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    if (storedStudentData) {
      setStudentData(storedStudentData);
      if (storedStudentData._id) {
        import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
          const instantData = fastDataService.getInstantData(storedStudentData._id);
          if (instantData && instantData.student) {
            setStudentData(instantData.student);
          }
        });
      }
    }
    
    const handleStorageChange = () => loadStudentData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const handleViewChange = (view) => {
    onViewChange(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles['resume-page-wrapper']}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className={styles.main}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout}
          currentView={'resume'} 
          onViewChange={handleViewChange} 
          studentData={studentData}
        />
        
        <div className={`${styles['dashboard-area']} ${styles['resume-page']}`}>
          <MainContent onViewChange={onViewChange} />
        </div>
      </div>
      
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}

export default Resume;