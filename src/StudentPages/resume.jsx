import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Button, Box, Paper } from '@mui/material';
import { Visibility, Download, TouchApp, EditNote, SaveAlt, CloudDownload } from '@mui/icons-material';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import styles from './Resume.module.css';
import alertStyles from '../components/alerts/AlertStyles.module.css';
import Adminicon from '../assets/Adminicon.png';
import resumeAnalysisService from '../services/resumeAnalysisService.jsx';
import mongoDBService from '../services/mongoDBService.jsx';
import { DownloadProgressAlert, DownloadSuccessAlert, DownloadFailedAlert, PreviewProgressAlert, PreviewFailedAlert } from '../components/alerts/DownloadPreviewAlerts';
import { API_BASE_URL } from '../utils/apiConfig';

const DEGREE_STOP_WORDS = new Set(['of', 'in', 'and', 'for', 'the', 'with', 'to', 'a', 'an', 'on', 'by', 'from']);

// Resolve GridFS profile URLs to full backend URLs (same pattern as Sidebar)
const resolveProfileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  if (url.startsWith('/api/file/')) return `${API_BASE_URL}${url.replace('/api', '')}`;
  if (url.startsWith('/file/')) return `${API_BASE_URL}${url}`;
  if (/^[a-f0-9]{24}$/.test(url)) return `${API_BASE_URL}/file/${url}`;
  return url;
};

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

// ATS Score Card - Shows only the score, grade, and percentage
function ATSScoreCard({ analysisResult }) {
  const grade = analysisResult ? resumeAnalysisService.getGrade(analysisResult.percentage) : null;
  
  return (
    <Paper elevation={2} sx={{ 
      flex: 1, width: '100%', height: '100%', p: 2, 
      background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', border: '2px solid #c8c8c8',
      transition: 'border-color 0.3s ease', '&:hover': { borderColor: '#2085f6' },
      overflow: 'hidden'
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={1} fontSize="15px">
        ATS Score
      </Typography>
      {analysisResult ? (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '50px',
          flexDirection: { xs: 'column', sm: 'row' },
          py: 0.5,
          ml: '60px'
        }}>
          {/* Score Circle */}
          <Box sx={{ 
            width: '110px', 
            height: '110px', 
            minWidth: '110px',
            borderRadius: '50%', 
            background: `conic-gradient(${grade?.color || '#1976d2'} ${analysisResult.percentage * 3.6}deg, #f5f5f5 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
          }}>
            <Box sx={{ 
              width: '86px', 
              height: '86px', 
              borderRadius: '50%', 
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography fontSize={28} fontWeight={800} color={grade?.color || '#333'} lineHeight={1.1}>
                {analysisResult.percentage}%
              </Typography>
              <Typography fontSize={11} fontWeight={600} color="#666">
                ATS Score
              </Typography>
            </Box>
          </Box>
          
          {/* Grade Info */}
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1, minWidth: 0 }}>
            <Box sx={{ 
              display: 'inline-block',
              px: 2.5,
              py: 0.6,
              backgroundColor: grade?.color || '#1976d2',
              borderRadius: '16px',
              mb: 0.5
            }}>
              <Typography fontSize={15} fontWeight={700} color="#fff">
                Grade: {grade?.grade || 'N/A'}
              </Typography>
            </Box>
            <Typography fontSize={13} color="#666" mb={0.3} fontWeight={500} sx={{ lineHeight: 1.4 }}>
              {grade?.description || 'No analysis available'}
            </Typography>
            <Typography fontSize={12} color="#888" fontWeight={600}>
              {analysisResult.totalScore} / {analysisResult.maxScore} points
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          py: 1
        }}>
          <Typography fontSize={36} mb={1}>📊</Typography>
          <Typography fontSize={14} color="#333" mb={0.5} fontWeight={600}>
            No Score Available
          </Typography>
          <Typography fontSize={13} color="#666" sx={{ lineHeight: 1.5 }}>
            Build your resume to see ATS score
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// ATS Suggestions Card - Shows only the suggestions
function ATSSuggestionsCard({ analysisResult }) {
  return (
    <Paper elevation={2} sx={{ 
      flex: 1, width: '100%', height: '100%', p: 2, 
      background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '2px solid #c8c8c8', transition: 'border-color 0.3s ease', '&:hover': { borderColor: '#2085f6' },
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={1} fontSize="15px">
        ATS Suggestions
      </Typography>
      {analysisResult && analysisResult.suggestions && analysisResult.suggestions.length > 0 ? (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto',
          pr: 0.5,
          gap: 0.8,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#1976d2', borderRadius: '4px', '&:hover': { background: '#1565c0' } },
        }}>
          {analysisResult.suggestions.map((suggestion, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 1.2, 
                py: 0.8, 
                px: 1.2, 
                borderRadius: '8px', 
                transition: 'all 0.3s ease',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                '&:hover': { 
                  backgroundColor: '#e3f2fd',
                  borderColor: '#90caf9',
                  transform: 'translateX(4px)'
                } 
              }}
            >
              <Box sx={{ 
                minWidth: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#1976d2',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
                mt: 0.1
              }}>
                {index + 1}
              </Box>
              <Typography fontSize={12.5} color="#333" sx={{ lineHeight: 1.5, flex: 1, wordWrap: 'break-word', fontWeight: 500 }}>
                {suggestion}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          py: 1
        }}>
          <Typography fontSize={36} mb={1}>💡</Typography>
          <Typography fontSize={14} color="#333" mb={0.5} fontWeight={600}>
            No Suggestions Available
          </Typography>
          <Typography fontSize={13} color="#666" sx={{ lineHeight: 1.5 }}>
            Build your resume to get ATS improvement suggestions
          </Typography>
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
  const [atsPopupState, setAtsPopupState] = React.useState('none');
  
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [previewProgress, setPreviewProgress] = React.useState(0);
  const [atsProgress, setAtsProgress] = React.useState(0);
  const [atsProgressMessage, setAtsProgressMessage] = React.useState('');

  const [studentData, setStudentData] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('studentData') || 'null'); } catch (error) { return null; }
  });
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  
  // Loading state for "Click to Build Resume" button
  const [isBuildLoading, setIsBuildLoading] = React.useState(false);

  // Resume data fetched from MongoDB - Initialize from cache if available
  const [resumeFromDB, setResumeFromDB] = React.useState(() => {
    try {
      // Try to load from full resume data cache first
      const cachedData = localStorage.getItem('studentResumeData');
      if (cachedData) {
        const { resume, cachedAt } = JSON.parse(cachedData);
        const age = Date.now() - cachedAt;
        // Cache is valid for 5 minutes
        if (age < 5 * 60 * 1000 && resume) {
          console.log('🚀 Initial state: Loaded resume from cache, instant display!');
          return resume;
        }
      }
      
      // Fallback to status cache
      const cached = localStorage.getItem('studentResumeStatus');
      if (cached) {
        const { hasResume, checkedAt } = JSON.parse(cached);
        const age = Date.now() - checkedAt;
        // Cache is valid for 5 minutes
        if (age < 5 * 60 * 1000) {
          console.log('🚀 Initial state: Using cached resume status -', hasResume ? 'Has resume (will fetch)' : 'No resume');
          // Return a placeholder if has resume (will be populated in useEffect)
          // Return null if no resume
          return hasResume ? { _isPlaceholder: true } : null;
        }
      }
    } catch (e) {
      console.warn('Initial cache check failed:', e);
    }
    return null;
  });
  
  // Loading state for initial resume data check - Start as false if we have cache
  const [isCheckingResume, setIsCheckingResume] = React.useState(() => {
    try {
      // Check for full data cache first
      const cachedData = localStorage.getItem('studentResumeData');
      if (cachedData) {
        const { cachedAt } = JSON.parse(cachedData);
        const age = Date.now() - cachedAt;
        if (age < 5 * 60 * 1000) {
          console.log('✅ Full resume data cached, no loading needed!');
          return false;
        }
      }
      
      // Fallback to status cache
      const cached = localStorage.getItem('studentResumeStatus');
      if (cached) {
        const { checkedAt } = JSON.parse(cached);
        const age = Date.now() - checkedAt;
        // Cache is valid for 5 minutes
        if (age < 5 * 60 * 1000) {
          console.log('✅ Resume status cached, no loading state needed');
          return false; // Don't show loading, use cache
        }
      }
    } catch (e) {
      console.warn('Cache check failed:', e);
    }
    console.log('⚠️ No valid cache, will show loading state');
    return true; // Show loading if no valid cache
  });

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
          setIsCheckingResume(false);
          return;
        }

        console.log('✅ Student data loaded:', latestData.firstName, latestData.lastName);
        setStudentData(latestData);
        
        // Load resume analysis if available (from Resume Builder)
        if (latestData.resumeAnalysis) {
          setAnalysisResult(latestData.resumeAnalysis);
          console.log('✅ Resume analysis loaded from localStorage');
        }

        // Check cache first
        let usedCache = false;
        try {
          const cached = localStorage.getItem('studentResumeStatus');
          if (cached) {
            const { hasResume, checkedAt } = JSON.parse(cached);
            const age = Date.now() - checkedAt;
            
            // Cache is valid for 5 minutes
            if (age < 5 * 60 * 1000) {
              console.log('✅ Using cached resume status:', hasResume ? 'Has resume' : 'No resume');
              
              if (hasResume) {
                // We know they have a resume, fetch it in background (no loading state)
                const studentId = latestData._id || latestData.id;
                if (studentId && isMounted) {
                  // Fetch in background without blocking UI
                  (async () => {
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
                        if (result.success && result.resume && isMounted) {
                          setResumeFromDB(result.resume);
                          
                          // Extract ATS analysis from resume if available
                          if (result.resume.atsAnalysis && result.resume.atsAnalysis.overallScore) {
                            const atsData = result.resume.atsAnalysis;
                            setAnalysisResult({
                              percentage: atsData.overallScore || 0,
                              totalScore: atsData.overallScore || 0,
                              maxScore: 100,
                              suggestions: atsData.suggestions || [],
                              checklistResults: []
                            });
                            // Update ATS cache
                            localStorage.setItem('studentATSAnalysis', JSON.stringify({
                              analysis: atsData,
                              cachedAt: Date.now()
                            }));
                            console.log('✅ ATS analysis extracted from resume fetch, score:', atsData.overallScore);
                          }
                          
                          // Update cache with fresh data
                          localStorage.setItem('studentResumeData', JSON.stringify({
                            resume: result.resume,
                            cachedAt: Date.now()
                          }));
                          localStorage.setItem('studentResumeStatus', JSON.stringify({
                            hasResume: true,
                            checkedAt: Date.now()
                          }));
                          
                          console.log('✅ Resume fetched from MongoDB (background) and cache updated');
                        }
                      }
                    } catch (fetchErr) {
                      console.error('❌ Background resume fetch failed:', fetchErr);
                    }
                  })();
                }
              } else {
                // Cache says no resume
                if (isMounted) {
                  setResumeFromDB(null);
                }
              }
              
              usedCache = true;
              if (isMounted) {
                setIsCheckingResume(false);
              }
              return;
            }
          }
        } catch (cacheErr) {
          console.warn('Cache read failed:', cacheErr);
        }

        // If no valid cache, fetch from server
        if (!usedCache) {
          setIsCheckingResume(true);
          
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
                  
                  // Extract ATS analysis from resume if available
                  if (result.resume.atsAnalysis && result.resume.atsAnalysis.overallScore) {
                    const atsData = result.resume.atsAnalysis;
                    setAnalysisResult({
                      percentage: atsData.overallScore || 0,
                      totalScore: atsData.overallScore || 0,
                      maxScore: 100,
                      suggestions: atsData.suggestions || [],
                      checklistResults: []
                    });
                    localStorage.setItem('studentATSAnalysis', JSON.stringify({
                      analysis: atsData,
                      cachedAt: Date.now()
                    }));
                    console.log('✅ ATS analysis extracted from resume, score:', atsData.overallScore);
                  }
                  
                  // Update cache with full data
                  localStorage.setItem('studentResumeData', JSON.stringify({
                    resume: result.resume,
                    cachedAt: Date.now()
                  }));
                  localStorage.setItem('studentResumeStatus', JSON.stringify({
                    hasResume: true,
                    checkedAt: Date.now()
                  }));
                } else {
                  console.log('⚠️ No resume data in response');
                  setResumeFromDB(null);
                  
                  // Update cache
                  localStorage.removeItem('studentResumeData');
                  localStorage.setItem('studentResumeStatus', JSON.stringify({
                    hasResume: false,
                    checkedAt: Date.now()
                  }));
                }
              } else {
                console.log('❌ Resume fetch failed with status:', response.status);
                setResumeFromDB(null);
                
                // Update cache
                localStorage.removeItem('studentResumeData');
                localStorage.setItem('studentResumeStatus', JSON.stringify({
                  hasResume: false,
                  checkedAt: Date.now()
                }));
              }
            } catch (fetchErr) {
              console.error('❌ Could not fetch resume from DB:', fetchErr);
              setResumeFromDB(null);
              
              // Update cache
              localStorage.removeItem('studentResumeData');
              
              // Update cache
              localStorage.setItem('studentResumeStatus', JSON.stringify({
                hasResume: false,
                checkedAt: Date.now()
              }));
            } finally {
              if (isMounted) {
                setIsCheckingResume(false);
              }
            }
          } else {
            console.log('⚠️ No student ID found for resume fetch');
            setIsCheckingResume(false);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ Load error:', error);
        setIsCheckingResume(false);
      }
    };

    loadResumeData();
    
    // Listen for profile/storage updates - only update studentData, NOT resume cache
    const handleProfileUpdate = () => { 
      try {
        const latestData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (latestData && isMounted) {
          setStudentData(latestData);
          console.log('✅ Student data refreshed (profile update, resume cache preserved)');
        }
      } catch (e) {
        console.warn('Profile update handler error:', e);
      }
    };
    
    // Listen for resume built event - ONLY this should invalidate resume cache
    const handleResumeBuilt = () => {
      console.log('📄 Resume built event received, refreshing resume data...');
      // Invalidate cache - new data will be fetched
      localStorage.removeItem('studentResumeStatus');
      localStorage.removeItem('studentResumeData');
      loadResumeData();
    };
    
    // Listen for ATS analysis update event
    const handleATSAnalysisUpdate = (event) => {
      console.log('📊 ATS analysis updated event received');
      if (event.detail && isMounted) {
        // Convert from ATS Checker format to resume page format
        const atsData = event.detail;
        setAnalysisResult({
          percentage: atsData.overallScore || 0,
          totalScore: atsData.overallScore || 0,
          maxScore: 100,
          suggestions: atsData.suggestions || [],
          checklistResults: []
        });
        // Update localStorage cache
        localStorage.setItem('studentATSAnalysis', JSON.stringify({
          analysis: atsData,
          cachedAt: Date.now()
        }));
        console.log('✅ ATS analysis updated from event and cache refreshed');
      }
    };
    
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('resumeBuilt', handleResumeBuilt);
    window.addEventListener('atsAnalysisUpdated', handleATSAnalysisUpdate);
    
    return () => { 
      isMounted = false;
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('resumeBuilt', handleResumeBuilt);
      window.removeEventListener('atsAnalysisUpdated', handleATSAnalysisUpdate);
    };
  }, []);

  // Load ATS analysis from localStorage cache (populated during auth)
  useEffect(() => {
    let isMounted = true;
    
    const loadATSAnalysis = async () => {
      if (!studentData || !resumeFromDB) {
        return;
      }

      const studentId = studentData._id || studentData.id;
      if (!studentId) {
        return;
      }

      // Try localStorage cache first (populated during login)
      try {
        const cached = localStorage.getItem('studentATSAnalysis');
        if (cached) {
          const { analysis, cachedAt } = JSON.parse(cached);
          const cacheAge = Date.now() - (cachedAt || 0);
          const CACHE_TTL = 3 * 60 * 1000; // 3 minutes TTL
          
          if (analysis && isMounted) {
            setAnalysisResult({
              percentage: analysis.overallScore || 0,
              totalScore: analysis.overallScore || 0,
              maxScore: 100,
              suggestions: analysis.suggestions || [],
              checklistResults: []
            });
            console.log('✅ ATS analysis loaded from cache, score:', analysis.overallScore);
            
            // If cache is fresh, skip server fetch
            if (cacheAge < CACHE_TTL) {
              return;
            }
            // Cache is stale but has data - still refresh in background
            console.log('🔄 ATS cache stale, refreshing from server...');
          } else if (cachedAt && cacheAge < CACHE_TTL) {
            console.log('ℹ️ Cached: No ATS analysis available yet (cache fresh)');
            return; // We checked recently, no analysis exists
          } else {
            console.log('🔄 ATS cache expired, will fetch from server...');
          }
        }
      } catch (e) {
        console.warn('Cache read failed:', e);
      }

      // No cache - fetch from server (fallback)
      try {
        const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const authToken = localStorage.getItem('authToken');
        
        console.log('📊 Fetching ATS analysis for studentId:', studentId);
        
        const response = await fetch(`${API_BASE}/api/resume-builder/ats-analysis/${studentId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.hasAnalysis && result.atsAnalysis && isMounted) {
            const atsData = result.atsAnalysis;
            setAnalysisResult({
              percentage: atsData.overallScore || 0,
              totalScore: atsData.overallScore || 0,
              maxScore: 100,
              suggestions: atsData.suggestions || [],
              checklistResults: []
            });
            // Update cache
            localStorage.setItem('studentATSAnalysis', JSON.stringify({
              analysis: atsData,
              cachedAt: Date.now()
            }));
            console.log('✅ ATS analysis loaded from MongoDB:', atsData.overallScore);
          } else {
            console.log('⚠️ No ATS analysis available yet - Click "Check ATS Score" to analyze your resume');
            localStorage.setItem('studentATSAnalysis', JSON.stringify({
              analysis: null,
              cachedAt: Date.now()
            }));
          }
        } else if (response.status === 404) {
          console.log('ℹ️ No ATS analysis found - Click "Check ATS Score" to analyze your resume');
        } else {
          console.warn('⚠️ Unexpected response status:', response.status);
        }
      } catch (error) {
        console.log('ℹ️ Could not fetch ATS analysis:', error.message);
      }
    };

    loadATSAnalysis();
    
    return () => {
      isMounted = false;
    };
  }, [studentData, resumeFromDB]);


  // Handle Check ATS - show popup, fetch data, run analysis, then navigate to ATSChecker page
  const handleCheckATS = async () => {
    if (atsPopupState !== 'none') return;
    setAtsPopupState('progress');
    setAtsProgress(0);
    setAtsProgressMessage('Fetching resume from database...');

    // Dynamic progress animation
    let targetProgress = 10;
    const progressInterval = setInterval(() => {
      setAtsProgress(prev => {
        if (prev < targetProgress) {
          const diff = targetProgress - prev;
          const increment = Math.min(diff * 0.1, 2); // Smooth acceleration
          return Math.min(prev + increment, targetProgress);
        }
        return prev;
      });
    }, 100);

    try {
      const studentId = studentData?._id || studentData?.id;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      let fetchedResumeData = null;
      let analysisResult = null;

      // Step 1: Fetch resume data
      targetProgress = 15;
      if (studentId) {
        setAtsProgressMessage('Loading resume data...');
        targetProgress = 20;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(`${API_BASE}/api/resume-builder/ats-data/${studentId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.resumeData) {
              fetchedResumeData = data.resumeData;
              targetProgress = 30;
            }
          }
        } catch (fetchErr) {
          console.warn('ATS data fetch failed:', fetchErr.message);
        }

        // Fallback: try localStorage
        if (!fetchedResumeData) {
          try {
            const storageKey = `resumeBuilderData_${studentId}`;
            const stored = localStorage.getItem(storageKey) || localStorage.getItem('resumeBuilderData');
            if (stored) {
              fetchedResumeData = JSON.parse(stored);
              targetProgress = 30;
            }
          } catch { /* ignore */ }
        }
      }

      // Step 2: Try to load existing analysis from MongoDB
      if (studentId && fetchedResumeData) {
        targetProgress = 35;
        setAtsProgressMessage('Checking for existing analysis...');
        try {
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 8000);
          targetProgress = 40;
          const atsResponse = await fetch(`${API_BASE}/api/resume-builder/ats-result/${studentId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller2.signal,
          });
          clearTimeout(timeoutId2);
          targetProgress = 50;

          if (atsResponse.ok) {
            const atsData = await atsResponse.json();
            if (atsData.success && atsData.analysis) {
              analysisResult = atsData.analysis;
              targetProgress = 85;
              setAtsProgressMessage('Analysis loaded!');
            }
          }
        } catch (err) {
          console.warn('Existing analysis fetch failed:', err.message);
        }
      }

      // Step 3: If no existing analysis, run fresh ATS check
      if (!analysisResult && fetchedResumeData) {
        targetProgress = 55;
        setAtsProgressMessage('AI analyzing content quality...');
        try {
          targetProgress = 60;
          const atsCheckResponse = await fetch(`${API_BASE}/api/resume-builder/ats-check`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ resumeData: fetchedResumeData, studentId }),
          });
          targetProgress = 75;

          if (atsCheckResponse.ok) {
            const checkResult = await atsCheckResponse.json();
            if (checkResult.analysis) {
              analysisResult = checkResult.analysis;
              targetProgress = 85;
              setAtsProgressMessage('Analysis complete!');

              // Save analysis to MongoDB in background
              fetch(`${API_BASE}/api/resume-builder/save-ats-analysis`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ studentId, atsAnalysis: analysisResult }),
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.warn('ATS check failed:', err.message);
        }
      }

      // Step 4: Store everything for ATSChecker page
      targetProgress = 90;
      if (fetchedResumeData) {
        sessionStorage.setItem('atsCheckerPrefetchedData', JSON.stringify(fetchedResumeData));
      }
      if (analysisResult) {
        sessionStorage.setItem('atsCheckerPrefetchedAnalysis', JSON.stringify(analysisResult));
      }

      // Finish progress and navigate
      targetProgress = 95;
      setAtsProgressMessage('Opening ATS Checker...');
      await new Promise(resolve => setTimeout(resolve, 300));
      targetProgress = 100;
      await new Promise(resolve => setTimeout(resolve, 400));

      clearInterval(progressInterval);
      setAtsPopupState('none');
      setAtsProgress(0);
      onViewChange('ats-checker');
    } catch (err) {
      console.error('ATS check error:', err);
      clearInterval(progressInterval);
      setAtsPopupState('none');
      setAtsProgress(0);
      onViewChange('ats-checker');
    }
  };

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
          // Check if it's a GridFS URL (e.g., /api/file/abc123)
          if (resumeUrl.startsWith('/api/file/') || resumeUrl.includes('/api/file/')) {
            console.log('✅ GridFS URL detected, opening directly');
            const fullUrl = resumeUrl.startsWith('http') ? resumeUrl : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${resumeUrl}`;
            const win = window.open(fullUrl, '_blank');
            if (!win) {
              const link = document.createElement('a');
              link.href = fullUrl;
              link.target = '_blank';
              link.click();
            }
            setPreviewPopupState('none');
            return;
          }

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
          // Check if it's a GridFS URL
          if (resumeUrl.startsWith('/api/file/') || resumeUrl.includes('/api/file/')) {
            console.log('✅ GridFS URL detected, downloading directly');
            const fullUrl = resumeUrl.startsWith('http') ? resumeUrl : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${resumeUrl}`;
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = resumeName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setDownloadPopupState('success');
            return;
          }

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

  // Handle "Click to Build Resume" with pre-fetch loading
  const handleBuildResume = async () => {
    if (isBuildLoading) return;
    setIsBuildLoading(true);
    try {
      const sd = studentData || JSON.parse(localStorage.getItem('studentData') || 'null');
      const studentId = sd?._id || sd?.id;
      if (studentId) {
        const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const authToken = localStorage.getItem('token');
        // Pre-fetch resume data from MongoDB and cache in localStorage
        const response = await fetch(`${API_BASE}/api/resume-builder/load/${studentId}`, {
          headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.resumeData) {
            // Save to localStorage with user-specific key
            const storageKey = `resumeBuilderData_${studentId}`;
            localStorage.setItem(storageKey, JSON.stringify(data.resumeData));
            // Set pre-fetched flag so ResumeBuilder skips redundant MongoDB call
            localStorage.setItem('resumeDataPreFetched', Date.now().toString());
            console.log('✅ Resume data pre-fetched and cached');
          }
        }
      }
    } catch (err) {
      console.warn('Pre-fetch skipped:', err.message);
    }
    onViewChange('resume-builder');
  };
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
              <img src={useMemo(() => studentData?.profilePicURL ? resolveProfileUrl(studentData.profilePicURL) : Adminicon, [studentData?.profilePicURL])} alt="Profile" style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 20, border: '4px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', objectFit: 'cover' }} />
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
            {isCheckingResume ? (
              /* Loading State */
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: '300px' }}>
                <Paper elevation={3} sx={{ 
                  width: '100%', height: '100%', p: 4, 
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                  borderRadius: '16px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid #60a5fa'
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      border: '4px solid #e3f2fd', 
                      borderTop: '4px solid #1e3a5f', 
                      borderRadius: '50%', 
                      margin: '0 auto 20px',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <Typography variant="h5" fontWeight={700} color="#1e3a5f" mb={1}>
                      Loading Resume Data...
                    </Typography>
                    <Typography fontSize="14px" color="#475569">
                      Checking your resume status
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ) : (
              /* Main Content */
              <>
            {/* Build Resume Card */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: resumeFromDB ? '0 0 auto' : '1 1 auto', minHeight: resumeFromDB ? '280px' : '300px' }}>
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

               {/* Step-by-step instructions for new students */}
               {!resumeFromDB && (
                 <Box sx={{ width: '100%', mb: 3, overflow: 'hidden' }}>
                   <Typography fontWeight={700} fontSize="16px" color="#1e3a5f" mb={1.5} align="center">
                     How to Build Your Resume
                   </Typography>
                   <Box sx={{
                     display: 'flex',
                     gap: 2,
                     overflowX: 'auto',
                     pb: 1,
                     px: 0.5,
                     scrollSnapType: 'x mandatory',
                     '&::-webkit-scrollbar': { height: '6px' },
                     '&::-webkit-scrollbar-track': { background: 'transparent' },
                     '&::-webkit-scrollbar-thumb': { background: '#93c5fd', borderRadius: '3px' },
                   }}>
                     {[
                       { step: '1', icon: <TouchApp sx={{ fontSize: 28, color: '#2563eb' }} />, title: 'Click "Build Resume"', desc: 'Click the button below to open the resume builder form.' },
                       { step: '2', icon: <EditNote sx={{ fontSize: 28, color: '#2563eb' }} />, title: 'Fill Your Details', desc: 'Enter your personal info, education, skills & projects.' },
                       { step: '3', icon: <SaveAlt sx={{ fontSize: 28, color: '#2563eb' }} />, title: 'Save & Generate', desc: 'Submit the form and your resume PDF is created instantly.' },
                       { step: '4', icon: <CloudDownload sx={{ fontSize: 28, color: '#2563eb' }} />, title: 'Preview & Download', desc: 'View, download, or check your ATS compatibility score.' },
                     ].map((item) => (
                       <Paper key={item.step} elevation={2} sx={{
                         minWidth: '150px',
                         flex: '1 1 0',
                         p: 2,
                         borderRadius: '14px',
                         background: '#fff',
                         border: '1.5px solid #e2e8f0',
                         display: 'flex',
                         flexDirection: 'column',
                         alignItems: 'center',
                         textAlign: 'center',
                         scrollSnapAlign: 'start',
                         transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                         '&:hover': {
                           transform: 'translateY(-4px)',
                           boxShadow: '0 8px 24px rgba(37, 99, 235, 0.18)',
                           borderColor: '#60a5fa',
                         },
                       }}>
                         <Box sx={{
                           width: '52px',
                           height: '52px',
                           borderRadius: '50%',
                           background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           color: '#fff',
                           fontWeight: 800,
                           fontSize: '20px',
                           mb: 1.5,
                           boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                         }}>
                           {item.step}
                         </Box>
                         <Box mb={0.5}>{item.icon}</Box>
                         <Typography fontWeight={700} fontSize="13.5px" color="#1e3a5f" mb={0.5} lineHeight={1.3}>
                           {item.title}
                         </Typography>
                         <Typography fontSize="12px" color="#64748b" lineHeight={1.4}>
                           {item.desc}
                         </Typography>
                       </Paper>
                     ))}
                   </Box>
                   <Typography fontSize="12.5px" color="#ef4444" mt={1.5} align="center" fontWeight={600} fontStyle="italic">
                     * Read instructions carefully before building the resume
                   </Typography>
                 </Box>
               )}

               <Button
                 variant="contained"
                 size="large"
                 onClick={handleBuildResume}
                 disabled={isBuildLoading}
                 sx={{
                   background: isBuildLoading ? '#475569' : '#1e3a5f',
                   borderRadius: '8px',
                   fontWeight: 700,
                   fontSize: '18px',
                   textTransform: 'none',
                   px: 5,
                   py: 1.75,
                   boxShadow: '0 4px 15px rgba(30, 58, 95, 0.3)',
                   mb: 2.5,
                   '&:hover': { background: isBuildLoading ? '#475569' : '#2563eb', boxShadow: isBuildLoading ? 'none' : '0 6px 20px rgba(37, 99, 235, 0.4)' },
                   '&.Mui-disabled': { color: '#fff', background: '#475569' }
                 }}
               >
                 <Box display="flex" alignItems="center" gap={1}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                     <path fill="currentColor" d="m16.06 13.09l5.63 5.59l-3.32 3.28l-5.59-5.59v-.92l2.36-2.36zm.91-2.53L16 9.6l-4.79 4.8v1.97L5.58 22L2.3 18.68l5.59-5.59h1.97l.78-.78L6.8 8.46H5.5L2.69 5.62L5.31 3l2.8 2.8v1.31L12 10.95l2.66-2.66l-.96-1.01L15 5.97h-2.66l-.65-.65L15 2l.66.66v2.66L16.97 4l3.28 3.28c1.09 1.1 1.09 2.89 0 3.98l-1.97-2.01z"/>
                   </svg>
                   <span>{isBuildLoading ? 'Click to Build Resume ...' : 'Click to Build Resume →'}</span>
                 </Box>
               </Button>
               {resumeFromDB && (
                 <>
                   <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent="center" mb={2}>
                     <Button variant="contained" size="small" startIcon={<Visibility />} onClick={handlePreview} sx={{ backgroundColor: '#8b5cf6', borderRadius: '8px', fontWeight: 600, fontSize: '15px', textTransform: 'none', px: 3.5, py: 1, boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)', '&:hover': { backgroundColor: '#7c3aed', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' } }}>Preview</Button>
                     <Button variant="contained" size="small" startIcon={<Download />} onClick={handleDownload} sx={{ backgroundColor: '#22c55e', borderRadius: '8px', fontWeight: 600, fontSize: '15px', textTransform: 'none', px: 3.5, py: 1, boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)', '&:hover': { backgroundColor: '#16a34a', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' } }}>Download</Button>
                   </Box>
                   <Button
                     variant="contained"
                     onClick={handleCheckATS}
                     sx={{
                       background: 'linear-gradient(135deg, #2DBE7F 0%, #1a9e62 100%)',
                       borderRadius: '8px',
                       fontWeight: 700,
                       fontSize: '15px',
                       textTransform: 'none',
                       px: 4,
                       py: 1.3,
                       boxShadow: '0 4px 15px rgba(45, 190, 127, 0.3)',
                       '&:hover': { background: 'linear-gradient(135deg, #1a9e62 0%, #158f55 100%)', boxShadow: '0 6px 20px rgba(45, 190, 127, 0.4)' }
                     }}
                   >
                     <Box display="flex" alignItems="center" gap={1}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                         <g fill="none">
                           <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/>
                           <path fill="currentColor" d="M10.5 2c1.251 0 2.44.27 3.509.756a3 3 0 0 0-.97 1.759A6.5 6.5 0 1 0 17 10.5l-.005-.269c.536.48 1.239.765 1.991.769a8.46 8.46 0 0 1-1.809 4.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 3c.927 0 1.801.23 2.568.635a3 3 0 0 0 1.963 2.204l.348.119A5.5 5.5 0 1 1 10.5 5M19 1a1 1 0 0 1 .898.56l.048.117l.13.378a3 3 0 0 0 1.684 1.8l.185.07l.378.129a1 1 0 0 1 .118 1.844l-.118.048l-.378.13a3 3 0 0 0-1.8 1.684l-.07.185l-.129.378a1 1 0 0 1-1.844.117l-.048-.117l-.13-.378a3 3 0 0 0-1.684-1.8l-.185-.07l-.378-.129a1 1 0 0 1-.118-1.844l.118-.048l.378-.13a3 3 0 0 0 1.8-1.684l.07-.185l.129-.378A1 1 0 0 1 19 1"/>
                         </g>
                       </svg>
                       <span>Check ATS Score →</span>
                     </Box>
                   </Button>
                 </>
               )}
            </Paper>
            </Box>
            
            {/* Bottom Cards - ATS Score and Suggestions */}
            {resumeFromDB && (
              <Box sx={{ display: 'flex', gap: 1.5, flex: '1 1 0', minHeight: '180px', mt: 0, flexDirection: { xs: 'column', md: 'row' } }}>
                 <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                   <ATSScoreCard analysisResult={analysisResult} />
                 </Box>
                 <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                   <ATSSuggestionsCard analysisResult={analysisResult} />
                 </Box>
              </Box>
            )}
            </>
            )}
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

        {/* ATS Check Loading Popup */}
        <PreviewProgressAlert
          isOpen={atsPopupState === 'progress'}
          progress={atsProgress}
          title="Checking ATS Score..."
          color="#2085f6"
          progressColor="#2085f6"
          fileLabel="resume"
          messages={{
            initial: atsProgressMessage || 'Fetching resume from database...',
            mid: atsProgressMessage || 'AI analyzing content quality...',
            final: 'Opening ATS Checker...'
          }}
        />

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