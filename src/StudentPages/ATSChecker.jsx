import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import styles from './ATSChecker.module.css';

// ===== SCORE RING COMPONENT =====
const ScoreRing = ({ score, size = 160, strokeWidth = 12, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#2DBE7F' : score >= 60 ? '#F5A623' : score >= 40 ? '#E67E22' : '#E74C3C';

  return (
    <div className={styles.scoreRing}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={styles.scoreRingBg}
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.scoreRingFill}
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: color }}
        />
      </svg>
      <div className={styles.scoreRingText}>
        <span className={styles.scoreRingValue} style={{ color }}>{score}</span>
        <span className={styles.scoreRingMax}>/100</span>
      </div>
      {label && <div className={styles.scoreRingLabel}>{label}</div>}
    </div>
  );
};

// ===== CATEGORY BAR COMPONENT =====
const CategoryBar = ({ name, score, color, issueCount, isExpanded, onToggle }) => {
  const barColor = score >= 80 ? '#2DBE7F' : score >= 60 ? '#F5A623' : score >= 40 ? '#E67E22' : '#E74C3C';

  return (
    <div className={styles.categoryItem} onClick={onToggle}>
      <div className={styles.categoryHeader}>
        <div className={styles.categoryLeft}>
          <span className={styles.categoryDot} style={{ background: color || barColor }} />
          <span className={styles.categoryName}>{name}</span>
        </div>
        <div className={styles.categoryRight}>
          <span className={styles.categoryScore} style={{ color: barColor }}>({score}%)</span>
          <span className={`${styles.categoryArrow} ${isExpanded ? styles.expanded : ''}`}>
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
      <div className={styles.categoryBar}>
        <div className={styles.categoryBarFill} style={{ width: `${score}%`, background: barColor }} />
      </div>
    </div>
  );
};

// ===== CHECK ITEM COMPONENT =====
const CheckItem = ({ check }) => {
  const statusIcon = check.status === 'pass' ? (
    <svg className={styles.checkIconPass} width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="8" fill="#2DBE7F"/>
      <path d="M5.5 9L8 11.5L12.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ) : check.status === 'locked' ? (
    <svg className={styles.checkIconLocked} width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="8" fill="#a0a0a0"/>
      <path d="M7 8V7C7 5.895 7.895 5 9 5s2 .895 2 2v1M7.5 8h3c.276 0 .5.224.5.5v3c0 .276-.224.5-.5.5h-3c-.276 0-.5-.224-.5-.5v-3c0-.276.224-.5.5-.5z" stroke="white" strokeWidth="1" fill="none"/>
    </svg>
  ) : (
    <svg className={styles.checkIconFail} width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="8" fill="#E74C3C"/>
      <path d="M6.5 6.5L11.5 11.5M11.5 6.5L6.5 11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className={styles.checkItem}>
      <div className={styles.checkItemLeft}>
        {statusIcon}
        <span className={styles.checkItemName}>{check.name}</span>
      </div>
      {check.issues?.length > 0 && (
        <div className={styles.checkItemIssues}>
          {check.issues.map((issue, i) => (
            <span key={i} className={styles.checkItemIssue}>• {issue}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== ATS PARSE RATE BAR =====
const ATSParseRateBar = ({ rate }) => {
  const color = rate >= 80 ? '#2DBE7F' : rate >= 60 ? '#F5A623' : '#E74C3C';
  return (
    <div className={styles.atsParseRate}>
      <div className={styles.atsParseHeader}>
        <span>ATS PARSE RATE</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#999" strokeWidth="1"/><path d="M8 7V11M8 5V5.5" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <div className={styles.atsParseBarOuter}>
        <div className={styles.atsParseBarInner} style={{ width: `${rate}%`, background: color }}>
          <span className={styles.atsParsePointer} style={{ background: color }} />
        </div>
      </div>
      <div className={styles.atsParseLabels}>
        {[0, 20, 40, 60, 80, 100].map(v => <span key={v}>{v}</span>)}
      </div>
    </div>
  );
};

// ===== MAIN ATS CHECKER CONTENT =====
function ATSCheckerContent({ onViewChange }) {
  const [studentData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studentData') || 'null'); } catch { return null; }
  });

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, details, suggestions
  const [resumeData, setResumeData] = useState(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);

  // Fetch resume data from MongoDB on mount
  useEffect(() => {
    const fetchResumeDataFromDB = async () => {
      setIsLoadingResume(true);

      const studentId = studentData?._id || studentData?.id;
      const token = localStorage.getItem('token');
      const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

      if (!studentId) {
        // Fallback to localStorage
        try {
          const storageKey = studentId ? `resumeBuilderData_${studentId}` : 'resumeBuilderData';
          const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
          if (stored) {
            setResumeData(stored);
          }
        } catch { /* ignore */ }
        setIsLoadingResume(false);
        return;
      }

      try {
        // Fetch from MongoDB via new endpoint
        const response = await fetch(`${API_BASE}/api/resume-builder/ats-data/${studentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.resumeData) {
            console.log(`✅ Resume data loaded from ${data.source} for ATS analysis`);
            setResumeData(data.resumeData);
            setIsLoadingResume(false);
            return;
          }
        }
      } catch (fetchErr) {
        console.warn('⚠️ MongoDB fetch failed:', fetchErr.message);
      }

      // Fallback: try localStorage
      try {
        const storageKey = `resumeBuilderData_${studentId}`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (stored) {
          console.log('✅ Resume data loaded from localStorage for ATS analysis');
          setResumeData(stored);
        } else {
          // Try legacy key
          const legacy = JSON.parse(localStorage.getItem('resumeBuilderData') || 'null');
          if (legacy) {
            setResumeData(legacy);
          }
        }
      } catch { /* ignore */ }

      setIsLoadingResume(false);
    };

    fetchResumeDataFromDB();
  }, [studentData]);

  // Load resume data helper
  const getResumeData = useCallback(() => {
    return resumeData;
  }, [resumeData]);

  // Run ATS Analysis
  const runAnalysis = useCallback(async () => {
    const resumeData = getResumeData();
    if (!resumeData) {
      alert('No resume data found. Please build your resume first in the Resume Builder.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    setAnalysis(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalyzeProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + Math.random() * 8 + 2;
      });
    }, 200);

    try {
      const token = localStorage.getItem('token');
      const studentId = studentData?._id || studentData?.id;
      const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/resume-builder/ats-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resumeData, studentId }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      clearInterval(progressInterval);
      setAnalyzeProgress(100);

      setTimeout(() => {
        setAnalysis(result.analysis);
        setIsAnalyzing(false);
      }, 500);
    } catch (err) {
      console.error('ATS analysis error:', err);
      clearInterval(progressInterval);

      // Fallback: client-side analysis
      const resumeData2 = getResumeData();
      if (resumeData2) {
        setAnalyzeProgress(100);
        setTimeout(() => {
          setAnalysis(performClientSideAnalysis(resumeData2));
          setIsAnalyzing(false);
        }, 500);
      } else {
        setIsAnalyzing(false);
        alert('Analysis failed. Please try again.');
      }
    }
  }, [getResumeData, studentData]);

  // Auto-run analysis when resume data is loaded from MongoDB
  // First try to load previous analysis result, if not found, run fresh analysis
  useEffect(() => {
    if (resumeData && !analysis && !isAnalyzing && !isLoadingResume) {
      const loadOrRunAnalysis = async () => {
        const studentId = studentData?._id || studentData?.id;
        const token = localStorage.getItem('token');
        const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

        // Try to load previous analysis from MongoDB
        if (studentId) {
          try {
            const response = await fetch(`${API_BASE}/api/resume-builder/ats-result/${studentId}`, {
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.analysis) {
                console.log('✅ Loaded previous ATS analysis from MongoDB');
                setAnalysis(data.analysis);
                return; // Don't re-run analysis
              }
            }
          } catch (err) {
            console.warn('⚠️ Failed to load previous ATS analysis:', err.message);
          }
        }

        // No previous analysis found, run fresh
        runAnalysis();
      };

      loadOrRunAnalysis();
    }
    // eslint-disable-next-line
  }, [resumeData, isLoadingResume]);

  const toggleCategory = (key) => {
    setExpandedCategory(prev => prev === key ? null : key);
  };

  // Resolve score grade
  const getGrade = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#2DBE7F' };
    if (score >= 75) return { label: 'Good', color: '#4A90D9' };
    if (score >= 60) return { label: 'Fair', color: '#F5A623' };
    if (score >= 40) return { label: 'Needs Work', color: '#E67E22' };
    return { label: 'Poor', color: '#E74C3C' };
  };

  // ===== RENDER: LOADING =====
  if (isLoadingResume) {
    return (
      <div className={styles.analyzingState}>
        <div className={styles.analyzingCard}>
          <div className={styles.analyzingIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" className={styles.analyzingSpinner}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e8e8e8" strokeWidth="4"/>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#2DBE7F" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * 0.7}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3 className={styles.analyzingTitle}>Loading Resume Data...</h3>
          <p className={styles.analyzingSubtitle}>Fetching your resume from database</p>
        </div>
      </div>
    );
  }

  // ===== RENDER: NO DATA =====
  if (!resumeData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="15" y="8" width="50" height="64" rx="4" stroke="#ccc" strokeWidth="2" fill="none"/>
            <line x1="25" y1="24" x2="55" y2="24" stroke="#ddd" strokeWidth="2"/>
            <line x1="25" y1="32" x2="55" y2="32" stroke="#ddd" strokeWidth="2"/>
            <line x1="25" y1="40" x2="48" y2="40" stroke="#ddd" strokeWidth="2"/>
            <line x1="25" y1="48" x2="52" y2="48" stroke="#ddd" strokeWidth="2"/>
            <circle cx="58" cy="58" r="16" fill="#f8f8fb" stroke="#2DBE7F" strokeWidth="2"/>
            <path d="M52 58L56 62L64 54" stroke="#2DBE7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>No Resume Data Found</h2>
        <p className={styles.emptyDesc}>Build your resume first in the Resume Builder, then come back to check your ATS score.</p>
        <button className={styles.goToBuilderBtn} onClick={() => onViewChange('resume-builder')}>
          Go to Resume Builder →
        </button>
      </div>
    );
  }

  // ===== RENDER: ANALYZING =====
  if (isAnalyzing) {
    return (
      <div className={styles.analyzingState}>
        <div className={styles.analyzingCard}>
          <div className={styles.analyzingIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" className={styles.analyzingSpinner}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e8e8e8" strokeWidth="4"/>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#2DBE7F" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - analyzeProgress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <span className={styles.analyzingPercent}>{Math.round(analyzeProgress)}%</span>
          </div>
          <h3 className={styles.analyzingTitle}>Analyzing Your Resume...</h3>
          <p className={styles.analyzingSubtitle}>
            {analyzeProgress < 30 ? 'Parsing resume content...' :
             analyzeProgress < 60 ? 'Running ATS compatibility checks...' :
             analyzeProgress < 85 ? 'AI analyzing content quality...' :
             'Finalizing results...'}
          </p>
          <div className={styles.analyzingBar}>
            <div className={styles.analyzingBarFill} style={{ width: `${analyzeProgress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: RESULTS =====
  if (!analysis) return null;

  const grade = getGrade(analysis.overallScore);
  const atsParseRate = analysis.categories?.content?.checks?.[0]?.score || 0;

  return (
    <div className={styles.atsCheckerContent}>
      {/* Header */}
      <div className={styles.checkerHeader}>
        <div className={styles.checkerHeaderLeft}>
          <h1 className={styles.checkerTitle}>Resume ATS Checker</h1>
          <p className={styles.checkerSubtitle}>
            Is your resume good enough? {analysis.aiEnhanced && <span className={styles.aiBadge}>AI Enhanced</span>}
          </p>
        </div>
        <button className={styles.reanalyzeBtn} onClick={runAnalysis}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.65 2.35A8 8 0 1 0 15.93 8.5h-2.02A6 6 0 1 1 12.24 3.76L10 6h6V0l-2.35 2.35z" fill="currentColor"/></svg>
          Re-Analyze
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabActive : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`${styles.tabBtn} ${activeTab === 'details' ? styles.tabActive : ''}`} onClick={() => setActiveTab('details')}>Detailed Analysis</button>
        <button className={`${styles.tabBtn} ${activeTab === 'suggestions' ? styles.tabActive : ''}`} onClick={() => setActiveTab('suggestions')}>Suggestions</button>
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className={styles.overviewGrid}>
          {/* Left: Score Card */}
          <div className={styles.scoreCard}>
            <div className={styles.scoreCardHeader}>
              <span className={styles.scoreCardBrand}>Resume Score</span>
            </div>
            <ScoreRing score={analysis.overallScore} size={180} strokeWidth={14} />
            <div className={styles.scoreIssueCount}>{analysis.totalIssues} Issues</div>
            <div className={styles.scoreGrade} style={{ color: grade.color }}>{grade.label}</div>

            {/* Category Breakdown */}
            <div className={styles.categoryList}>
              {Object.entries(analysis.categories).map(([key, cat]) => (
                <CategoryBar
                  key={key}
                  name={cat.name}
                  score={cat.score}
                  color={cat.color}
                  issueCount={(cat.issues?.length || 0) + (cat.checks?.reduce((s, c) => s + (c.issues?.length || 0), 0) || 0)}
                  isExpanded={expandedCategory === key}
                  onToggle={() => toggleCategory(key)}
                />
              ))}
            </div>
          </div>

          {/* Right: ATS Parse Rate + Issues */}
          <div className={styles.detailsPanel}>
            {/* ATS Parse Rate */}
            <div className={styles.detailCard}>
              <ATSParseRateBar rate={atsParseRate} />
            </div>

            {/* Content Checks */}
            {analysis.categories.content?.checks && (
              <div className={styles.detailCard}>
                <h3 className={styles.detailCardTitle}>
                  <span className={styles.detailDot} style={{ background: '#2DBE7F' }} />
                  CONTENT
                  <span className={styles.issuesBadge}>{analysis.categories.content.checks.filter(c => c.status !== 'pass').length} ISSUES FOUND</span>
                </h3>
                <div className={styles.checksList}>
                  {analysis.categories.content.checks.map((check, i) => (
                    <CheckItem key={i} check={check} />
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <div className={styles.detailCard}>
                <h3 className={styles.detailCardTitle}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1l2.47 5.01L17 6.77l-4 3.9.94 5.5L9 13.77l-4.94 2.4.94-5.5-4-3.9 5.53-.76L9 1z" fill="#F5A623"/></svg>
                  Strengths
                </h3>
                <ul className={styles.tipsList}>
                  {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {/* Critical Fixes */}
            {analysis.criticalFixes?.length > 0 && (
              <div className={styles.detailCard + ' ' + styles.criticalCard}>
                <h3 className={styles.detailCardTitle}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L1 17h16L9 1z" fill="#E74C3C"/><path d="M9 7v4M9 13v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Critical Fixes
                </h3>
                <ul className={styles.tipsList + ' ' + styles.criticalList}>
                  {analysis.criticalFixes.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== DETAILS TAB ===== */}
      {activeTab === 'details' && (
        <div className={styles.detailsTab}>
          {Object.entries(analysis.categories).map(([key, cat]) => (
            <div key={key} className={styles.detailSection}>
              <div className={styles.detailSectionHeader}>
                <div className={styles.detailSectionLeft}>
                  <span className={styles.detailDot} style={{ background: cat.color || '#2DBE7F' }} />
                  <h3 className={styles.detailSectionTitle}>{cat.name}</h3>
                </div>
                <div className={styles.detailSectionScore}>
                  <span style={{ color: cat.score >= 70 ? '#2DBE7F' : cat.score >= 50 ? '#F5A623' : '#E74C3C' }}>{cat.score}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className={styles.detailSectionBar}>
                <div className={styles.detailSectionBarFill} style={{
                  width: `${cat.score}%`,
                  background: cat.score >= 70 ? '#2DBE7F' : cat.score >= 50 ? '#F5A623' : '#E74C3C'
                }} />
              </div>

              {/* Sub checks (for Content) */}
              {cat.checks?.length > 0 && (
                <div className={styles.checksGrid}>
                  {cat.checks.map((check, i) => (
                    <div key={i} className={styles.checkCard}>
                      <div className={styles.checkCardHeader}>
                        <CheckItem check={check} />
                      </div>
                      <div className={styles.checkCardBar}>
                        <div className={styles.checkCardBarFill} style={{
                          width: `${check.score}%`,
                          background: check.score >= 70 ? '#2DBE7F' : check.score >= 50 ? '#F5A623' : '#E74C3C'
                        }} />
                      </div>
                      <span className={styles.checkCardScore}>{check.score}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Issues */}
              {cat.issues?.length > 0 && (
                <div className={styles.issuesList}>
                  {cat.issues.map((issue, i) => (
                    <div key={i} className={styles.issueItem}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="#E67E22" strokeWidth="1.2" fill="none"/>
                        <path d="M7 4v3.5M7 9v.5" stroke="#E67E22" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== SUGGESTIONS TAB ===== */}
      {activeTab === 'suggestions' && (
        <div className={styles.suggestionsTab}>
          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div className={styles.suggestionsCard}>
              <h3 className={styles.suggestionsTitle}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#4A90D9" strokeWidth="1.5" fill="none"/><path d="M10 6v5M10 13v.5" stroke="#4A90D9" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Recommendations
              </h3>
              <div className={styles.suggestionsList}>
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className={styles.suggestionItem}>
                    <span className={styles.suggestionNumber}>{i + 1}</span>
                    <span className={styles.suggestionText}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Tips */}
          {analysis.overallTips?.length > 0 && (
            <div className={styles.suggestionsCard}>
              <h3 className={styles.suggestionsTitle}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a5 5 0 013 9v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2a5 5 0 013-9z" stroke="#F5A623" strokeWidth="1.5" fill="none"/><line x1="8" y1="16" x2="12" y2="16" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/><line x1="8.5" y1="18" x2="11.5" y2="18" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/></svg>
                AI-Powered Tips
              </h3>
              <ul className={styles.aiTipsList}>
                {analysis.overallTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className={styles.quickActions}>
            <button className={styles.quickActionBtn} onClick={() => onViewChange('resume-builder')}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.85 2.85a1.2 1.2 0 011.7 1.7L5.7 15.4l-3.2.9.9-3.2L14.85 2.85z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
              Edit Resume
            </button>
            <button className={styles.quickActionBtn} onClick={runAnalysis}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.65 3.35A10 10 0 1019.93 10.5h-2.02A8 8 0 1115.24 4.76L12 8h8V0l-3.35 3.35z" fill="currentColor"/></svg>
              Re-Check Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== CLIENT-SIDE FALLBACK ANALYSIS =====
function performClientSideAnalysis(data) {
  const { personalInfo = {}, summary = '', education = {}, skills = [], experiences = [], projects = [], certifications = [], achievements = [], platforms = [] } = data;

  const allDescriptions = [
    ...experiences.map(e => e.description || ''),
    ...projects.map(p => p.description || ''),
    summary
  ].filter(Boolean);

  // Content checks
  let atsParseScore = 100;
  if (!personalInfo.name) atsParseScore -= 15;
  if (!personalInfo.email) atsParseScore -= 15;
  if (!personalInfo.mobile) atsParseScore -= 10;

  const numberPattern = /\d+%|\d+\+|\d+x|\$\d+|\d+\s*(users|clients|projects|hours|percent)/gi;
  const descsWithNumbers = allDescriptions.filter(d => numberPattern.test(d)).length;
  const quantifyScore = allDescriptions.length ? Math.round((descsWithNumbers / allDescriptions.length) * 100) : 0;

  let repetitionScore = 85;
  let spellingScore = 90;
  let summarizeScore = summary && summary.length >= 30 ? 80 : 0;

  // Format
  let formatScore = 0;
  if (allDescriptions.filter(d => d.length > 300).length === 0) formatScore += 25;
  if (experiences.length <= 6 && projects.length <= 6) formatScore += 25;
  formatScore += 25; // action verbs assumed OK
  formatScore += 25; // dates assumed OK

  // Style
  let styleScore = 70;
  const casualWords = /\b(awesome|cool|stuff|things|got|gonna|wanna|kinda|basically)\b/gi;
  const fullText = [summary, ...allDescriptions].join(' ');
  if (!(fullText.match(casualWords) || []).length) styleScore = 90;

  // Sections
  let sectionsScore = 0;
  if (personalInfo.name && personalInfo.email) sectionsScore += 20;
  if (education.school12 || education.school10) sectionsScore += 20;
  if (skills.length > 0) sectionsScore += 20;
  if (experiences.length > 0) sectionsScore += 20;
  if (projects.length > 0) sectionsScore += 20;

  // Skills
  let skillsScore = 0;
  if (skills.length >= 8) skillsScore = 100;
  else if (skills.length >= 5) skillsScore = 70;
  else if (skills.length >= 3) skillsScore = 50;
  else if (skills.length >= 1) skillsScore = 30;

  const categories = {
    content: { name: 'CONTENT', score: Math.round((atsParseScore + quantifyScore + repetitionScore + spellingScore + summarizeScore) / 5), weight: 30, color: '#2DBE7F', checks: [
      { name: 'ATS Parse Rate', score: atsParseScore, status: atsParseScore >= 70 ? 'pass' : 'fail', issues: atsParseScore < 100 ? ['Ensure all contact info is present and properly formatted'] : [] },
      { name: 'Quantifying Impact', score: quantifyScore, status: quantifyScore >= 60 ? 'pass' : 'fail', issues: quantifyScore < 60 ? ['Add metrics and numbers to demonstrate impact'] : [] },
      { name: 'Repetition', score: repetitionScore, status: 'pass', issues: [] },
      { name: 'Spelling & Grammar', score: spellingScore, status: 'pass', issues: [] },
      { name: 'Summarize Resume', score: summarizeScore, status: summarizeScore >= 60 ? 'pass' : 'locked', issues: summarizeScore === 0 ? ['Add a professional summary'] : [] },
    ], issues: [] },
    formatBrevity: { name: 'FORMAT & BREVITY', score: formatScore, weight: 20, color: '#4A90D9', issues: formatScore < 80 ? ['Keep descriptions concise and use bullet points'] : [] },
    style: { name: 'STYLE', score: styleScore, weight: 15, color: '#9B59B6', issues: styleScore < 80 ? ['Use consistent professional tone throughout'] : [] },
    sections: { name: 'SECTIONS', score: sectionsScore, weight: 20, color: '#E67E22', issues: sectionsScore < 100 ? ['Ensure all key sections are present'] : [] },
    skills: { name: 'SKILLS', score: skillsScore, weight: 15, color: '#E74C3C', issues: skillsScore < 70 ? ['Add more relevant technical skills'] : [] },
  };

  const overallScore = Math.round(Object.values(categories).reduce((sum, cat) => sum + (cat.score * cat.weight / 100), 0));
  const totalIssues = Object.values(categories).reduce((sum, cat) => sum + (cat.issues?.length || 0) + (cat.checks?.reduce((s, c) => s + (c.issues?.length || 0), 0) || 0), 0);

  const suggestions = [];
  if (!personalInfo.linkedin) suggestions.push('Add LinkedIn profile URL');
  if (!personalInfo.github) suggestions.push('Add GitHub/portfolio link');
  if (!summary) suggestions.push('Write a professional summary');
  if (skills.length < 5) suggestions.push('Add more skills (aim for 6-10)');
  if (experiences.length === 0) suggestions.push('Add work experience or internships');

  return { overallScore, totalIssues, categories, suggestions, strengths: [], criticalFixes: [], overallTips: [], aiEnhanced: false };
}

// ===== MAIN PAGE WRAPPER =====
export default function ATSChecker({ onLogout, onViewChange }) {
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
    <div className={styles.atsCheckerWrapper}>
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
          <ATSCheckerContent onViewChange={onViewChange} />
        </div>
      </div>
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
