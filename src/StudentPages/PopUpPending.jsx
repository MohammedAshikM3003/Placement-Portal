import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from 'react-dom';
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaStar, FaRegStar } from "react-icons/fa";
import '../components/alerts/AlertStyles.css';
import {
  PreviewProgressAlert,
  DownloadProgressAlert,
  DownloadSuccessAlert
} from '../components/alerts';
import scrollStyles from './PopupScrollbar.module.css';
import companyfeedbackicon from '../assets/companyfeedbackicon.svg';
import CopmanyviewFeedbackicon from '../assets/CopmanyviewFeedbackicon.svg';
import DOBDatePicker from '../components/Calendar/DOBDatePicker.jsx';
import mongoDBService from '../services/mongoDBService';

// â”€â”€ Custom volume-bar scrollbox (no native browser arrows) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FeedbackScrollBox({ text }) {
  const contentRef = React.useRef(null);
  const [thumb, setThumb] = React.useState({ height: 40, top: 0 });
  const [showBar, setShowBar] = React.useState(false);

  const updateThumb = () => {
    const el = contentRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight;
    setShowBar(canScroll);
    if (!canScroll) return;
    const ratio = el.clientHeight / el.scrollHeight;
    const thumbH = Math.max(ratio * el.clientHeight, 30);
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const maxThumbTop = el.clientHeight - thumbH;
    setThumb({
      height: thumbH,
      top: maxScrollTop > 0 ? (el.scrollTop / maxScrollTop) * maxThumbTop : 0
    });
  };

  React.useEffect(() => { updateThumb(); }, [text]);

  const onThumbMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTop = thumb.top;
    const el = contentRef.current;
    const thumbH = thumb.height;
    const maxThumbTop = el.clientHeight - thumbH;
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const onMove = (mv) => {
      const newTop = Math.max(0, Math.min(maxThumbTop, startTop + mv.clientY - startY));
      el.scrollTop = maxThumbTop > 0 ? (newTop / maxThumbTop) * maxScrollTop : 0;
      updateThumb();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div style={{ display: 'flex', gap: '6px', maxHeight: '180px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      <div
        ref={contentRef}
        onScroll={updateThumb}
        style={{
          flex: 1,
          backgroundColor: '#f5f5f5',
          padding: '14px 16px',
          fontSize: '0.88rem',
          color: '#333',
          lineHeight: 1.6,
          overflowY: 'scroll',
          whiteSpace: 'pre-line',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          boxSizing: 'border-box'
        }}
        className="afp-hide-native"
      >
        {text}
      </div>
      {/* Custom volume-bar track */}
      {showBar && (
        <div style={{
          width: '6px', flexShrink: 0, position: 'relative',
          backgroundColor: '#e0e0e0', borderRadius: '20px',
          margin: '6px 4px 6px 0'
        }}>
          <div
            onMouseDown={onThumbMouseDown}
            style={{
              position: 'absolute', left: 0, width: '100%',
              height: `${thumb.height}px`, top: `${thumb.top}px`,
              backgroundColor: '#B5B5B5', borderRadius: '20px',
              cursor: 'grab', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#909090'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#B5B5B5'}
          />
        </div>
      )}
    </div>
  );
}

// â”€â”€ Admin Feedback Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminFeedbackPopup({ feedbackRecord, roundLabel, feedbackType = 'passed', onClose }) {
  const parsedRating = Number(feedbackRecord?.rating);
  const rating = Number.isFinite(parsedRating) && parsedRating > 0 ? Math.min(5, parsedRating) : 0;
  const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 480;

  const isPassed = feedbackType === 'passed';
  const headerBg = isPassed ? '#197AFF' : '#5C5C5C';
  const assessBg = isPassed ? '#4A5BB3' : '#404040';

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const raw = String(dateString);
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, d] = raw.slice(0, 10).split('-');
      return `${d}-${m}-${y}`;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const feedbackText = (feedbackRecord?.feedback || '').toString().trim() || 'No admin feedback available for this round.';
  const studentCount = Number(feedbackRecord?.studentCount) || 0;
  const countLabel = isPassed ? 'Passed Students' : 'Failed Students';
  const scheduledOn = formatDisplayDate(feedbackRecord?.selectedDate);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '480px',
        maxWidth: '92vw',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        fontFamily: "'Poppins', sans-serif"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: headerBg,
          color: '#fff',
          padding: '1.1rem',
          fontSize: '1.5rem',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.02em'
        }}>
          Admin Feedback
        </div>

        {/* Body */}
        <div style={{ padding: '1.4rem 1.6rem' }}>
          <style>{`
            @keyframes afp-marquee {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-100%); }
            }
            .afp-marquee-inner {
              display: inline-block;
              white-space: nowrap;
              animation: afp-marquee 8s linear infinite;
            }
            .afp-hide-native::-webkit-scrollbar { display: none; }
          `}</style>
          <div style={{ display: 'flex', gap: isMobileView ? '12px' : '16px', alignItems: 'flex-start', marginBottom: '14px', flexDirection: isMobileView ? 'column' : 'row' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: isMobileView ? '100%' : '170px', width: isMobileView ? '100%' : 'auto' }}>
              <div style={{ backgroundColor: assessBg, color: '#fff', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center' }}>
                Overall Assessment
              </div>
              <div style={{ display: 'flex', gap: '4px', paddingLeft: '4px' }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star} style={{ cursor: 'default', fontSize: '1.3rem' }}>
                    {rating >= star ? <FaStar color="#FFE817" /> : <FaRegStar color="#ccc" />}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobileView ? '6px' : '8px', width: '100%' }}>
                <span style={{ fontWeight: 700, fontSize: isMobileView ? '0.78rem' : '0.8rem', whiteSpace: 'nowrap', minWidth: isMobileView ? '86px' : '92px', flexShrink: 0 }}>Round</span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>:</span>
                <div style={{ flex: 1, minWidth: 0, padding: '0.5rem 0.75rem', border: '1px solid #dde6f4', borderRadius: '8px', backgroundColor: '#f9fbff', fontSize: isMobileView ? '0.76rem' : '0.8rem', fontFamily: "'Poppins', sans-serif", color: '#555', boxSizing: 'border-box', overflowWrap: 'anywhere' }}>
                  {roundLabel || feedbackRecord?.roundName || 'Round'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobileView ? '6px' : '8px', width: '100%' }}>
                <span style={{ fontWeight: 700, fontSize: isMobileView ? '0.78rem' : '0.8rem', whiteSpace: 'nowrap', minWidth: isMobileView ? '86px' : '92px', flexShrink: 0 }}>{countLabel}</span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>:</span>
                <div style={{ flex: 1, minWidth: 0, padding: '0.5rem 0.75rem', border: '1px solid #dde6f4', borderRadius: '8px', backgroundColor: '#f9fbff', fontSize: isMobileView ? '0.76rem' : '0.8rem', fontFamily: "'Poppins', sans-serif", color: '#555', boxSizing: 'border-box', overflowWrap: 'anywhere' }}>
                  {studentCount}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobileView ? '6px' : '8px', width: '100%' }}>
                <span style={{ fontWeight: 700, fontSize: isMobileView ? '0.78rem' : '0.8rem', whiteSpace: 'nowrap', minWidth: isMobileView ? '86px' : '92px', flexShrink: 0 }}>Scheduled On</span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>:</span>
                <div style={{ flex: 1, minWidth: 0, padding: '0.5rem 0.75rem', border: '1px solid #dde6f4', borderRadius: '8px', backgroundColor: '#f9fbff', fontSize: isMobileView ? '0.76rem' : '0.8rem', fontFamily: "'Poppins', sans-serif", color: '#555', boxSizing: 'border-box', overflowWrap: 'anywhere' }}>
                  {scheduledOn}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback message box */}
          <FeedbackScrollBox text={feedbackText} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.8rem 1.6rem 1.4rem' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#C0392B',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 48px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Editable textarea with custom volume-bar scrollbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SFPScrollTextarea({ value, onChange, readOnly, height = 110 }) {
  const textareaRef = React.useRef(null);
  const trackRef    = React.useRef(null);
  const [thumb, setThumb]   = React.useState({ height: 30, top: 0 });
  const [showBar, setShowBar] = React.useState(false);

  const updateThumb = () => {
    const el    = textareaRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const canScroll = el.scrollHeight > el.clientHeight;
    setShowBar(canScroll);
    if (!canScroll) return;
    const trackH  = track.clientHeight;
    const thumbH  = Math.max((el.clientHeight / el.scrollHeight) * trackH, 24);
    const maxST   = el.scrollHeight - el.clientHeight;
    const maxTT   = trackH - thumbH;
    setThumb({ height: thumbH, top: maxST > 0 ? (el.scrollTop / maxST) * maxTT : 0 });
  };

  const onThumbMouseDown = (e) => {
    e.preventDefault();
    const startY   = e.clientY;
    const startTop = thumb.top;
    const onMove = (mv) => {
      const el    = textareaRef.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const maxTT  = track.clientHeight - thumb.height;
      const newTop = Math.max(0, Math.min(maxTT, startTop + mv.clientY - startY));
      el.scrollTop = maxTT > 0 ? (newTop / maxTT) * (el.scrollHeight - el.clientHeight) : 0;
      updateThumb();
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{ display: 'flex', height, borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}
      onMouseEnter={updateThumb}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        onScroll={updateThumb}
        className="sfp-hide-native"
        style={{
          flex: 1, height: '100%', border: 'none', backgroundColor: 'transparent',
          padding: '12px', resize: 'none', fontFamily: "'Poppins', sans-serif",
          fontSize: '0.88rem', color: '#444', boxSizing: 'border-box',
          outline: 'none', cursor: readOnly ? 'default' : 'text',
          scrollbarWidth: 'none', overflowY: 'auto'
        }}
      />
      <div
        ref={trackRef}
        style={{ width: '6px', flexShrink: 0, backgroundColor: '#e0e0e0', borderRadius: '20px', margin: '6px 4px 6px 0', position: 'relative' }}
      >
        {showBar && (
          <div
            onMouseDown={onThumbMouseDown}
            style={{ position: 'absolute', left: 0, width: '100%', height: `${thumb.height}px`, top: `${thumb.top}px`, backgroundColor: '#B5B5B5', borderRadius: '20px', cursor: 'grab' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#909090'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#B5B5B5'}
          />
        )}
      </div>
    </div>
  );
}

// â”€â”€ Student Feedback Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StudentFeedbackPopup({
  roundName,
  onClose,
  viewOnly = false,
  driveContext = null,
  roundNumber = null,
  roundStatus = ''
}) {
  const [aiEnabled, setAiEnabled]     = useState(true);
  const [difficulty, setDifficulty]   = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [feedback, setFeedback]       = useState('');
  const [suggestion, setSuggestion]   = useState('');
  const [rating, setRating]           = useState(1);
  const [hoverRating, setHoverRating] = useState(0);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [aiGeneratedFeedback, setAiGeneratedFeedback] = useState(false);
  const [aiGeneratedSuggestion, setAiGeneratedSuggestion] = useState(false);
  const mobileScrollRef = useRef(null);
  const mobileTrackRef = useRef(null);
  const [mobileThumb, setMobileThumb] = useState({ height: 40, top: 0 });
  const parsedRoundNumber = Number.isFinite(Number(roundNumber))
    ? Number(roundNumber)
    : Number(String(roundName || '').match(/round\s+(\d+)/i)?.[1] || 0) || null;

  const getStudentInfoFromStorage = useCallback(() => {
    try {
      const student = JSON.parse(localStorage.getItem('studentData') || 'null') || {};
      return {
        studentId: String(student?._id || student?.id || '').trim(),
        regNo: String(student?.regNo || student?.registerNo || student?.registerNumber || '').trim()
      };
    } catch (error) {
      return { studentId: '', regNo: '' };
    }
  }, []);

  const [isPopupMobile, setIsPopupMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  // Single scroll authority - track entire body scroll
  const updateMobileThumb = useCallback(() => {
    const el = mobileScrollRef.current;
    const track = mobileTrackRef.current;
    if (!el || !track || !isPopupMobile) return;

    const trackH = track.clientHeight;
    const scrollH = el.scrollHeight;
    const clientH = el.clientHeight;

    const ratio = clientH / scrollH;
    const thumbH = Math.max(40, Math.min(trackH * ratio, trackH));
    const maxScroll = scrollH - clientH;
    const maxThumb = trackH - thumbH;

    setMobileThumb({
      height: thumbH,
      top: maxScroll > 0 ? (el.scrollTop / maxScroll) * maxThumb : 0
    });
  }, [isPopupMobile]);

  useEffect(() => {
    const handlePopupResize = () => {
      setIsPopupMobile(window.innerWidth <= 768);
      updateMobileThumb();
    };
    handlePopupResize();
    window.addEventListener('resize', handlePopupResize);
    return () => window.removeEventListener('resize', handlePopupResize);
  }, [updateMobileThumb]);

  useEffect(() => {
    const timer = setTimeout(updateMobileThumb, 100);
    return () => clearTimeout(timer);
  }, [feedback, suggestion, isPopupMobile, updateMobileThumb]);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadExistingStudentFeedback = async () => {
      const normalizedDriveId = String(driveContext?.driveId || '').trim();
      if (!normalizedDriveId || !parsedRoundNumber) return;

      setLoadError('');
      setIsLoadingExisting(true);

      try {
        const studentInfo = getStudentInfoFromStorage();
        const response = await mongoDBService.getStudentFeedback({
          driveId: normalizedDriveId,
          companyName: driveContext?.company,
          jobRole: driveContext?.jobRole,
          startingDate: driveContext?.startDate,
          roundNumber: parsedRoundNumber,
          studentId: studentInfo.studentId,
          regNo: studentInfo.regNo
        });

        if (!isMounted) return;
        const records = Array.isArray(response?.data) ? response.data : [];
        const latest = records[0] || null;
        if (!latest) return;

        setDifficulty((latest?.difficulty || '').toString());
        setSelectedDate((latest?.selectedDate || '').toString().slice(0, 10) || '');
        setFeedback((latest?.feedback || '').toString());
        setSuggestion((latest?.suggestion || '').toString());
        setRating(Number(latest?.rating) > 0 ? Number(latest?.rating) : 1);
        setAiEnabled(latest?.aiEnabled !== false);
      } catch (error) {
        if (isMounted) {
          setLoadError('Unable to load saved feedback for this round.');
          console.error('Student feedback load failed:', error);
        }
      } finally {
        if (isMounted) setIsLoadingExisting(false);
      }
    };

    loadExistingStudentFeedback();

    return () => {
      isMounted = false;
    };
  }, [driveContext?.driveId, driveContext?.company, driveContext?.jobRole, driveContext?.startDate, parsedRoundNumber, getStudentInfoFromStorage]);

  const handleGenerateText = async (textType) => {
    if (viewOnly || !aiEnabled) return;
    if (textType === 'feedback' ? isGeneratingFeedback : isGeneratingSuggestion) return;

    setGenerateError('');
    if (textType === 'feedback') {
      setIsGeneratingFeedback(true);
    } else {
      setIsGeneratingSuggestion(true);
    }

    try {
      const response = await mongoDBService.generateStudentFeedback({
        roundNumber: parsedRoundNumber,
        roundName,
        roundStatus,
        companyName: driveContext?.company || '',
        jobRole: driveContext?.jobRole || '',
        difficulty,
        textType,
        baseText: textType === 'feedback' ? feedback : suggestion
      });

      const generatedText = (response?.text || '').toString().trim();
      if (!generatedText) {
        setGenerateError('No text was generated. Please try again.');
        return;
      }

      if (textType === 'feedback') {
        setFeedback(generatedText);
        setAiGeneratedFeedback(true);
      } else {
        setSuggestion(generatedText);
        setAiGeneratedSuggestion(true);
      }
    } catch (error) {
      setGenerateError(error?.message || 'Failed to generate text.');
    } finally {
      if (textType === 'feedback') {
        setIsGeneratingFeedback(false);
      } else {
        setIsGeneratingSuggestion(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (viewOnly || isSaving) return;

    const normalizedDriveId = String(driveContext?.driveId || '').trim();
    if (!normalizedDriveId) {
      setSaveError('Drive ID is missing. Please reopen the popup and try again.');
      return;
    }
    if (!parsedRoundNumber) {
      setSaveError('Round number is missing. Please reopen the popup and try again.');
      return;
    }
    if (!feedback.trim() && !suggestion.trim()) {
      setSaveError('Please enter feedback or suggestion before submitting.');
      return;
    }

    setSaveError('');
    setIsSaving(true);

    try {
      const studentInfo = getStudentInfoFromStorage();
      await mongoDBService.saveStudentFeedback({
        driveId: normalizedDriveId,
        companyName: driveContext?.company || '',
        jobRole: driveContext?.jobRole || '',
        startingDate: driveContext?.startDate || null,
        endingDate: driveContext?.endDate || null,
        roundNumber: parsedRoundNumber,
        roundName,
        roundStatus,
        difficulty,
        selectedDate,
        rating,
        feedback,
        suggestion,
        aiEnabled,
        aiGeneratedFeedback,
        aiGeneratedSuggestion,
        studentId: studentInfo.studentId,
        regNo: studentInfo.regNo
      });

      setShowSubmitSuccess(true);
    } catch (error) {
      setSaveError(error?.message || 'Failed to save feedback.');
    } finally {
      setIsSaving(false);
    }
  };

  const onMobileThumbDrag = (startE) => {
    startE.preventDefault();
    const isTouch = startE.type === 'touchstart';
    const startY = isTouch ? startE.touches[0].clientY : startE.clientY;
    const startTop = mobileThumb.top;
    const el = mobileScrollRef.current;
    const track = mobileTrackRef.current;
    if (!el || !track) return;

    const thumbH = mobileThumb.height;
    const maxThumb = track.clientHeight - thumbH;
    const maxScroll = el.scrollHeight - el.clientHeight;

    const onMove = (mv) => {
      const clientY = isTouch ? mv.touches[0].clientY : mv.clientY;
      const nextTop = Math.max(0, Math.min(maxThumb, startTop + clientY - startY));
      el.scrollTop = maxThumb > 0 ? (nextTop / maxThumb) * maxScroll : 0;
      updateMobileThumb();
    };

    const onEnd = () => {
      document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
      document.removeEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);
    };

    document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove, { passive: false });
    document.addEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);
  };

  /* â”€â”€ Inline submit success popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (showSubmitSuccess) return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10001, fontFamily: "'Poppins', sans-serif"
    }}>
      <style>{`
        @keyframes sfp-stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes sfp-scale  { 0%,100%{transform:none} 50%{transform:scale3d(1.1,1.1,1)} }
        @keyframes sfp-fill   { 100%{box-shadow:inset 0 0 0 60px #22C55E} }
        .sfp-success-icon { width:80px;height:80px;border-radius:50%;display:block;stroke-width:2;stroke:#fff;stroke-miterlimit:10;margin:0 auto;box-shadow:inset 0 0 0 #22C55E;animation:sfp-fill .4s ease-in-out .4s both,sfp-scale .3s ease-in-out .9s both; }
        .sfp-success-icon circle { stroke-dasharray:166;stroke-dashoffset:166;stroke-width:2;stroke:#22C55E;fill:none;animation:sfp-stroke .6s cubic-bezier(.65,0,.45,1) forwards; }
        .sfp-success-icon path   { stroke-dasharray:48;stroke-dashoffset:48;animation:sfp-stroke .3s cubic-bezier(.65,0,.45,1) .8s forwards; }
      `}</style>
      <div style={{ backgroundColor:'#fff', borderRadius:'12px', width:'400px', maxWidth:'90vw', textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.3)', overflow:'hidden' }}>
        <div style={{ backgroundColor:'#197AFF', color:'#fff', padding:'1rem', fontSize:'1.75rem', fontWeight:700 }}>Feedback</div>
        <div style={{ padding:'2rem', minHeight:'220px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <svg className="sfp-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="25" fill="none"/>
            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 style={{ margin:'1rem 0 0.5rem', fontSize:'24px', color:'#333', fontWeight:600 }}>Submitted âœ“</h2>
          <p style={{ margin:0, color:'#888', fontSize:'16px' }}>Your feedback has been submitted</p>
        </div>
        <div style={{ padding:'1.5rem', backgroundColor:'#f7f7f7' }}>
          <button
            onClick={onClose}
            style={{ backgroundColor:'#D23B42', color:'#fff', border:'none', padding:'0.8rem 1.5rem', borderRadius:'8px', fontSize:'1rem', fontWeight:600, cursor:'pointer', fontFamily:"'Poppins', sans-serif" }}
          >Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '600px',
        maxWidth: '96vw',
        maxHeight: '90vh',
        boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        fontFamily: "'Poppins', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Dim overlay when datepicker is open */}
        {datePickerOpen && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 1,
            borderRadius: '12px', pointerEvents: 'none'
          }} />
        )}
        {/* â”€â”€ Header â”€â”€ */}
        <div style={{
          backgroundColor: '#197AFF',
          color: '#fff',
          padding: '1.1rem',
          fontSize: '1.5rem',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.02em'
        }}>
          {viewOnly ? 'View Feedback' : 'Student Feedback'}
        </div>

        {/* â”€â”€ HR Round badge â”€â”€ */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 16px 0' }}>
          <div style={{
            backgroundColor: '#D7E8FF',
            color: '#293A92',
            borderRadius: '20px',
            padding: '6px 32px',
            fontWeight: 700,
            fontSize: '1rem'
          }}>
            {roundName || 'HR - Round'}
          </div>
        </div>

        {/* â”€â”€ Body â”€â”€ */}
        <div
          ref={isPopupMobile ? mobileScrollRef : null}
          onScroll={isPopupMobile ? updateMobileThumb : null}
          className="sfp-hide-native"
          style={{
            padding: '12px 20px 8px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            position: 'relative'
          }}
        >
          <style>{`
            .sfp-hide-native::-webkit-scrollbar { display: none; }
            .sfp-select {
              width: 100%; padding: 0.9rem 2.5rem 0.9rem 0.9rem;
              border: 1px solid #dde6f4; border-radius: 8px;
              background-color: #f9fbff; font-size: 0.95rem;
              font-family: 'Poppins', sans-serif;
              appearance: none; -webkit-appearance: none;
              cursor: pointer; box-sizing: border-box;
              transition: border-color 0.3s, box-shadow 0.3s;
              outline: none;
            }
            .sfp-select:hover, .sfp-select:focus {
              border-color: #2085f6;
              box-shadow: 0 0 0 3px rgba(32,133,246,0.2);
            }
          `}</style>

          {/* AI Integration + Overall Assessment â€” mobile/desktop layouts */}
          {isPopupMobile ? (
            /* â”€â”€ MOBILE: flat column, no gap below stars â”€â”€ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>

              {/* Row 1: AI Integration â€” full width */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>AI - Integration :</span>
                <div style={{ flex: 1, display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.32rem', backgroundColor: '#f9fbff', borderRadius: '8px', border: '1px solid #dde6f4', height: '50px', boxSizing: 'border-box', minWidth: 0 }}>
                  <input type="radio" id="sfp-ai-enable" name="sfp-ai" checked={aiEnabled} onChange={() => !viewOnly && setAiEnabled(true)} style={{ display: 'none' }} />
                  <label htmlFor="sfp-ai-enable" style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: aiEnabled ? '#fff' : '#666', backgroundColor: aiEnabled ? '#2085f6' : 'transparent', fontWeight: aiEnabled ? 700 : 400, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Enable</label>
                  <input type="radio" id="sfp-ai-disable" name="sfp-ai" checked={!aiEnabled} onChange={() => !viewOnly && setAiEnabled(false)} style={{ display: 'none' }} />
                  <label htmlFor="sfp-ai-disable" style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: !aiEnabled ? '#fff' : '#666', backgroundColor: !aiEnabled ? '#2085f6' : 'transparent', fontWeight: !aiEnabled ? 700 : 400, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Disable</label>
                </div>
              </div>

              {/* Row 2: Overall Assessment + Stars â€” side by side in one row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  backgroundColor: '#4A5BB3', color: '#fff', borderRadius: '8px',
                  padding: '0 8px', fontWeight: 700, fontSize: '0.95rem',
                  textAlign: 'center', flex: 1, boxSizing: 'border-box', height: '50px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  Overall Assessment
                </div>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'nowrap', flexShrink: 0 }}>
                  {[1,2,3,4,5].map(star => (
                    <span
                      key={star}
                      style={{ cursor: viewOnly ? 'default' : 'pointer', fontSize: '2.5rem', lineHeight: 1 }}
                      onMouseEnter={() => !viewOnly && setHoverRating(star)}
                      onMouseLeave={() => !viewOnly && setHoverRating(0)}
                      onClick={() => !viewOnly && setRating(star)}
                    >
                      {(hoverRating || rating) >= star ? <FaStar color="#FFE817" /> : <FaRegStar color="#ccc" />}
                    </span>
                  ))}
                </div>
              </div>

              {/* Row 3: Select (left half) + Date (right half) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select
                    className="sfp-select"
                    value={difficulty}
                    onChange={e => !viewOnly && setDifficulty(e.target.value)}
                    disabled={viewOnly}
                    style={{
                      color: difficulty ? '#333' : '#888',
                      cursor: viewOnly ? 'default' : 'pointer',
                      fontSize: '0.88rem',
                      padding: '0.9rem 2.2rem 0.9rem 0.82rem',
                      height: '50px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="" disabled>Select Difficulty Level</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DOBDatePicker value={selectedDate} onChange={viewOnly ? () => {} : setSelectedDate} />
                </div>
              </div>
            </div>
          ) : (
            /* â”€â”€ DESKTOP: two-column layout â”€â”€ */
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '14px' }}>
              {/* Left column: AI toggle + Difficulty + Date */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* AI Integration row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>AI - Integration :</span>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.4rem', backgroundColor: '#f9fbff', borderRadius: '8px', border: '1px solid #dde6f4', height: '53.6px', boxSizing: 'border-box', minWidth: 0 }}>
                    <input type="radio" id="sfp-ai-enable" name="sfp-ai" checked={aiEnabled} onChange={() => !viewOnly && setAiEnabled(true)} style={{ display: 'none' }} />
                    <label htmlFor="sfp-ai-enable" style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: aiEnabled ? '#fff' : '#666', backgroundColor: aiEnabled ? '#2085f6' : 'transparent', fontWeight: aiEnabled ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Enable</label>
                    <input type="radio" id="sfp-ai-disable" name="sfp-ai" checked={!aiEnabled} onChange={() => !viewOnly && setAiEnabled(false)} style={{ display: 'none' }} />
                    <label htmlFor="sfp-ai-disable" style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: !aiEnabled ? '#fff' : '#666', backgroundColor: !aiEnabled ? '#2085f6' : 'transparent', fontWeight: !aiEnabled ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Disable</label>
                  </div>
                </div>
                {/* Difficulty + Date row */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <select
                      className="sfp-select"
                      value={difficulty}
                      onChange={e => !viewOnly && setDifficulty(e.target.value)}
                      disabled={viewOnly}
                      style={{ color: difficulty ? '#333' : '#888', cursor: viewOnly ? 'default' : 'pointer', fontSize: '0.95rem', padding: '0.9rem 2.5rem 0.9rem 0.9rem' }}
                    >
                      <option value="" disabled>Select Difficulty Level</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <DOBDatePicker value={selectedDate} onChange={viewOnly ? () => {} : setSelectedDate} />
                  </div>
                </div>
              </div>
              {/* Right column: Overall Assessment + Stars */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minWidth: '158px' }}>
                <div style={{
                  backgroundColor: '#4A5BB3', color: '#fff', borderRadius: '8px',
                  padding: '0 14px', fontWeight: 700, fontSize: '0.95rem',
                  textAlign: 'center', width: '100%', boxSizing: 'border-box',
                  height: '53.6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  Overall Assessment
                </div>
                <div style={{ display: 'flex', gap: '4px', paddingLeft: '2px' }}>
                  {[1,2,3,4,5].map(star => (
                    <span
                      key={star}
                      style={{ cursor: viewOnly ? 'default' : 'pointer', fontSize: '2rem' }}
                      onMouseEnter={() => !viewOnly && setHoverRating(star)}
                      onMouseLeave={() => !viewOnly && setHoverRating(0)}
                      onClick={() => !viewOnly && setRating(star)}
                    >
                      {(hoverRating || rating) >= star ? <FaStar color="#FFE817" /> : <FaRegStar color="#ccc" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback + Suggestion */}
          {isPopupMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
              {/* Feedback Area */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Feedback :</div>
                <div style={{ position: 'relative' }}>
                  <SFPScrollTextarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    readOnly={viewOnly}
                    height={130}
                  />
                  {aiEnabled && !viewOnly && (
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '18px',
                      display: 'flex', gap: '6px', zIndex: 1
                    }}>
                      <button onClick={() => { setFeedback(''); setAiGeneratedFeedback(false); }} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(239,68,68,0.35)', transition: 'background 0.2s ease' }} onMouseEnter={e => e.target.style.backgroundColor = '#dc2626'} onMouseLeave={e => e.target.style.backgroundColor = '#ef4444'}>Clear</button>
                      <button onClick={() => handleGenerateText('feedback')} disabled={isGeneratingFeedback || isSaving} style={{ backgroundColor: '#197AFF', opacity: (isGeneratingFeedback || isSaving) ? 0.75 : 1, color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: (isGeneratingFeedback || isSaving) ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(25,122,255,0.35)' }}>{isGeneratingFeedback ? 'Generating...' : 'Generate'}</button>
                    </div>
                  )}
                </div>
                {isLoadingExisting && <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '6px' }}>Loading saved feedback...</div>}
              </div>

              {/* Suggestion Area */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Suggestion :</div>
                <div style={{ position: 'relative' }}>
                  <SFPScrollTextarea
                    value={suggestion}
                    onChange={e => setSuggestion(e.target.value)}
                    readOnly={viewOnly}
                    height={130}
                  />
                  {aiEnabled && !viewOnly && (
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '18px',
                      display: 'flex', gap: '6px', zIndex: 1
                    }}>
                      <button onClick={() => { setSuggestion(''); setAiGeneratedSuggestion(false); }} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(239,68,68,0.35)', transition: 'background 0.2s ease' }} onMouseEnter={e => e.target.style.backgroundColor = '#dc2626'} onMouseLeave={e => e.target.style.backgroundColor = '#ef4444'}>Clear</button>
                      <button onClick={() => handleGenerateText('suggestion')} disabled={isGeneratingSuggestion || isSaving} style={{ backgroundColor: '#197AFF', opacity: (isGeneratingSuggestion || isSaving) ? 0.75 : 1, color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: (isGeneratingSuggestion || isSaving) ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(25,122,255,0.35)' }}>{isGeneratingSuggestion ? 'Generating...' : 'Generate'}</button>
                    </div>
                  )}
                </div>
              </div>
              {(generateError || loadError || saveError) && <div style={{ color: '#d32f2f', fontSize: '0.78rem', marginTop: '-8px' }}>{generateError || loadError || saveError}</div>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Feedback :</div>
              <div style={{ position: 'relative' }}>
                <SFPScrollTextarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  readOnly={viewOnly}
                  height={140}
                />
                {aiEnabled && !viewOnly && (
                  <div style={{
                    position: 'absolute', bottom: '8px', right: '18px',
                    display: 'flex', gap: '6px', zIndex: 1
                  }}>
                    <button
                      onClick={() => { setFeedback(''); setAiGeneratedFeedback(false); }}
                      style={{
                        backgroundColor: '#ef4444', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '4px 12px',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Poppins', sans-serif",
                        boxShadow: '0 2px 6px rgba(239,68,68,0.35)',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={e => e.target.style.backgroundColor = '#ef4444'}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => handleGenerateText('feedback')}
                      disabled={isGeneratingFeedback || isSaving}
                      style={{
                        backgroundColor: '#197AFF', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '4px 12px',
                        fontSize: '0.78rem', fontWeight: 600, cursor: (isGeneratingFeedback || isSaving) ? 'not-allowed' : 'pointer',
                        fontFamily: "'Poppins', sans-serif",
                        boxShadow: '0 2px 6px rgba(25,122,255,0.35)',
                        opacity: (isGeneratingFeedback || isSaving) ? 0.75 : 1
                      }}
                    >
                      {isGeneratingFeedback ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                )}
              </div>
              {isLoadingExisting && <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '6px' }}>Loading saved feedback...</div>}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Suggestion :</div>
                <div style={{ position: 'relative' }}>
                  <SFPScrollTextarea
                    value={suggestion}
                    onChange={e => setSuggestion(e.target.value)}
                    readOnly={viewOnly}
                    height={140}
                  />
                  {aiEnabled && !viewOnly && (
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '18px',
                      display: 'flex', gap: '6px', zIndex: 1
                    }}>
                      <button
                        onClick={() => { setSuggestion(''); setAiGeneratedSuggestion(false); }}
                        style={{
                          backgroundColor: '#ef4444', color: '#fff', border: 'none',
                          borderRadius: '6px', padding: '4px 12px',
                          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                          fontFamily: "'Poppins', sans-serif",
                          boxShadow: '0 2px 6px rgba(239,68,68,0.35)',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={e => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={e => e.target.style.backgroundColor = '#ef4444'}
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => handleGenerateText('suggestion')}
                        disabled={isGeneratingSuggestion || isSaving}
                        style={{
                          backgroundColor: '#197AFF', color: '#fff', border: 'none',
                          borderRadius: '6px', padding: '4px 12px',
                          fontSize: '0.78rem', fontWeight: 600, cursor: (isGeneratingSuggestion || isSaving) ? 'not-allowed' : 'pointer',
                          fontFamily: "'Poppins', sans-serif",
                          boxShadow: '0 2px 6px rgba(25,122,255,0.35)',
                          opacity: (isGeneratingSuggestion || isSaving) ? 0.75 : 1
                        }}
                      >
                        {isGeneratingSuggestion ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {(generateError || loadError || saveError) && <div style={{ color: '#d32f2f', fontSize: '0.78rem', marginTop: '-4px' }}>{generateError || loadError || saveError}</div>}
            </div>
          )}
        </div>

        {/* Fixed scrollbar track for mobile - positioned on right edge of popup */}
        {isPopupMobile && (
          <div
            ref={mobileTrackRef}
            style={{
              position: 'absolute',
              right: '6px',
              top: '120px',
              bottom: '80px',
              width: '6px',
              backgroundColor: '#e0e0e0',
              borderRadius: '10px',
              zIndex: 5
            }}
          >
            <div
              onMouseDown={onMobileThumbDrag}
              onTouchStart={onMobileThumbDrag}
              style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: `${mobileThumb.height}px`,
                top: `${mobileThumb.top}px`,
                backgroundColor: '#2085f6',
                borderRadius: '6px',
                cursor: 'grab',
                touchAction: 'none'
              }}
            />
          </div>
        )}

        {/* â”€â”€ Footer â”€â”€ */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: isPopupMobile ? '14px 24px calc(env(safe-area-inset-bottom, 20px) + 25px)' : '14px 24px 20px', position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #eef1f7', zIndex: 2 }}>
          {viewOnly ? (
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#197AFF', color: '#fff', border: 'none',
                borderRadius: '12px', padding: '10px 48px',
                fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif"
              }}
            >Close</button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isSaving || isGeneratingFeedback || isGeneratingSuggestion}
                style={{
                  backgroundColor: '#7C7C7C', color: '#fff', border: 'none',
                  borderRadius: '12px', padding: '10px 40px',
                  fontWeight: 600, fontSize: '1rem', cursor: (isSaving || isGeneratingFeedback || isGeneratingSuggestion) ? 'not-allowed' : 'pointer',
                  opacity: (isSaving || isGeneratingFeedback || isGeneratingSuggestion) ? 0.7 : 1,
                  fontFamily: "'Poppins', sans-serif"
                }}
              >Discard</button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || isGeneratingFeedback || isGeneratingSuggestion || (!feedback.trim() && !suggestion.trim())}
                style={{
                  backgroundColor: '#197AFF', color: '#fff', border: 'none',
                  borderRadius: '12px', padding: '10px 40px',
                  fontWeight: 600, fontSize: '1rem', cursor: (isSaving || isGeneratingFeedback || isGeneratingSuggestion || (!feedback.trim() && !suggestion.trim())) ? 'not-allowed' : 'pointer',
                  opacity: (isSaving || isGeneratingFeedback || isGeneratingSuggestion || (!feedback.trim() && !suggestion.trim())) ? 0.7 : 1,
                  fontFamily: "'Poppins', sans-serif"
                }}
              >{isSaving ? 'Saving...' : 'Submit'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to format dates from YYYY-MM-DD to DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

// Dynamic rounds based on app data - no hardcoded mock data
const AbsentIcon = ({ size = 28 }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: '#ff2800',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: size * 0.5,
    lineHeight: 1
  }}>A</div>
);

export const generateRounds = (app) => {
  const normalizedAppStatus = (app?.status || '').toString().trim().toLowerCase();
  const isApplicationAbsent = normalizedAppStatus === 'absent';
  const normalizeRoundStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'passed' || normalized === 'selected' || normalized === 'cleared') return 'Passed';
    if (normalized === 'failed' || normalized === 'rejected') return 'Failed';
    if (normalized === 'absent') return 'Absent';
    if (normalized === 'not eligible' || normalized === 'not_eligible' || normalized === 'ineligible') return 'Not Eligible';
    return normalized ? 'Pending' : '';
  };

  const getIconForStatus = (status) => (
    status === 'Passed'
      ? <FaCheckCircle color="#197AFF" size={28} />
      : status === 'Failed'
      ? <FaTimes color="#D23B42" size={28} />
      : status === 'Absent'
      ? <AbsentIcon />
      : status === 'Not Eligible'
      ? <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 36 36"><path fill="#f39c12" d="M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2m11.15 18H6.85a.85.85 0 0 1-.85-.85v-2.3a.85.85 0 0 1 .85-.85h22.3a.85.85 0 0 1 .85.85v2.29a.85.85 0 0 1-.85.86" class="clr-i-solid clr-i-solid-path-1"/><path fill="none" d="M0 0h36v36H0z"/></svg>
      : <FaExclamationCircle color="#949494" size={28} />
  );

  const getColorForStatus = (status) => (
    status === 'Passed' ? '#197AFF' :
    status === 'Failed' ? '#D23B42' :
    status === 'Absent' ? '#ff2800' :
    status === 'Not Eligible' ? '#f39c12' : '#717070'
  );

  const buildRoundEntry = (name, status, index) => ({
    name: name || `Round ${index + 1}`,
    status,
    icon: getIconForStatus(status),
    statusColor: getColorForStatus(status),
    statusText: status || 'Pending'
  });

  const resolveTerminalRoundInfo = (statusList) => {
    let terminalIndex = -1;
    let terminalStatus = '';

    statusList.forEach((status, index) => {
      if (terminalIndex !== -1) return;
      if (status === 'Absent' || status === 'Failed') {
        terminalIndex = index;
        terminalStatus = status;
      }
    });

    if (terminalIndex === -1 && normalizedAppStatus === 'absent') {
      terminalIndex = 0;
      terminalStatus = 'Absent';
    }

    return { terminalIndex, terminalStatus };
  };

  // If roundDetails exist, use them as the base and merge with student rounds
  if (app?.roundDetails && app.roundDetails.length > 0) {
    const detailedRounds = app.roundDetails.map((roundName, index) => {
      // Find corresponding student round by name or round number
      const studentRound = app.rounds?.find(
        r => r.name === roundName ||
             r.roundName === roundName ||
             r.roundNumber === (index + 1)
      );
      return {
        name: roundName || `Round ${index + 1}`,
        originalStatus: normalizeRoundStatus(studentRound?.status)
      };
    });

    const normalizedStatuses = detailedRounds.map((round) => round.originalStatus);
    const { terminalIndex, terminalStatus } = resolveTerminalRoundInfo(normalizedStatuses);

    return detailedRounds.map((round, index) => {
      let status = round.originalStatus || 'Pending';
      if (terminalIndex !== -1) {
        if (index === terminalIndex) {
          status = terminalStatus;
        } else if (index > terminalIndex) {
          status = 'Not Eligible';
        }
      }
      return buildRoundEntry(round.name, status, index);
    });
  }

  // Fallback: If only student rounds exist without roundDetails
  if (app?.rounds && app.rounds.length > 0) {
    const orderedRounds = app.rounds
      .slice()
      .sort((left, right) => Number(left?.roundNumber || 0) - Number(right?.roundNumber || 0));

    const normalizedStatuses = orderedRounds.map((round) => normalizeRoundStatus(round?.status));
    const { terminalIndex, terminalStatus } = resolveTerminalRoundInfo(normalizedStatuses);

    return orderedRounds.map((round, index) => {
      let status = normalizeRoundStatus(round?.status) || 'Pending';
      if (terminalIndex !== -1) {
        if (index === terminalIndex) {
          status = terminalStatus;
        } else if (index > terminalIndex) {
          status = 'Not Eligible';
        }
      }

      return buildRoundEntry(
        round.name || round.roundName || `Round ${round.roundNumber || index + 1}`,
        status,
        index
      );
    });
  }

  // Final fallback: build placeholder rounds from totalRounds when names/statuses are unavailable.
  const inferredTotalRounds = Number(app?.totalRounds) || 0;
  if (inferredTotalRounds > 0) {
    return Array.from({ length: inferredTotalRounds }, (_, index) => {
      const status = isApplicationAbsent
        ? (index === 0 ? 'Absent' : 'Not Eligible')
        : 'Pending';

      return {
        ...buildRoundEntry(`Round ${index + 1}`, status, index)
      };
    });
  }

  return []; // Return empty array if no rounds data at all
};

export const getOverallStatus = (app) => {
  const normalizedAppStatus = (app?.status || '').toString().trim().toLowerCase();
  if (normalizedAppStatus === 'absent') {
    return { status: "Absent", color: "#ff2800" };
  }
  if (normalizedAppStatus === 'failed' || normalizedAppStatus === 'rejected') {
    return { status: "Rejected", color: "#D23B42" };
  }

  const rounds = generateRounds(app);
  const totalRounds = Number(app?.totalRounds || app?.roundDetails?.length || rounds.length || 0);
  const hasRoundData = rounds.length > 0 || totalRounds > 0;
  const hasAbsent = rounds.some(r => r.status === "Absent");
  const hasFailed = rounds.some(r => r.status === "Failed");
  const passedCount = rounds.filter(r => r.status === "Passed").length;
  const allPassed = passedCount === totalRounds && totalRounds > 0;

  if (hasAbsent) {
    return { status: "Absent", color: "#ff2800" };
  }
  if (hasFailed) {
    return { status: "Rejected", color: "#D23B42" };
  }
  if (allPassed) {
    return { status: "Placed", color: "#1FAD66" };
  }
  if (passedCount > 0) {
    return { status: `Passed-${passedCount}`, color: "#1976D2" };
  }
  if (!hasRoundData && (normalizedAppStatus === 'placed' || normalizedAppStatus === 'selected')) {
    return { status: "Placed", color: "#1FAD66" };
  }
  return { status: "Pending", color: "#717070" };
};

export default function PopUpPending({ app, onBack }) {
  const rounds = generateRounds(app);

  const { status: overallStatus, color: overallStatusColor } = getOverallStatus(app);
  const [selectedRole, setSelectedRole] = useState('Student');
  const [showAdminFeedback, setShowAdminFeedback] = useState(false);
  const [adminFeedbackRecords, setAdminFeedbackRecords] = useState([]);
  const [roundEligibilityMap, setRoundEligibilityMap] = useState({});
  const [selectedAdminFeedback, setSelectedAdminFeedback] = useState(null);
  const [selectedAdminFeedbackType, setSelectedAdminFeedbackType] = useState('passed');
  const [selectedAdminRoundLabel, setSelectedAdminRoundLabel] = useState('');
  const [showStudentFeedback, setShowStudentFeedback] = useState(false);
  const [selectedRoundName, setSelectedRoundName] = useState('');
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(null);
  const [selectedRoundStatus, setSelectedRoundStatus] = useState('');
  const [feedbackViewMode, setFeedbackViewMode] = useState('edit'); // 'edit' | 'view'
  const roundsListRef = useRef(null);
  const [roundsThumb, setRoundsThumb] = useState({ height: 34, top: 0 });
  const [showRoundsBar, setShowRoundsBar] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const [offerLetterRecord, setOfferLetterRecord] = useState(null);
  const [isOfferLetterLoading, setIsOfferLetterLoading] = useState(false);
  const [showOfferLetterPopup, setShowOfferLetterPopup] = useState(false);
  const [showOfferLetterPreview, setShowOfferLetterPreview] = useState(false);
  const [isOfferDecisionUpdating, setIsOfferDecisionUpdating] = useState(false);
  const [offerActionInFlight, setOfferActionInFlight] = useState('');
  const [offerPreviewPopupState, setOfferPreviewPopupState] = useState('none'); // none | progress
  const [offerDownloadPopupState, setOfferDownloadPopupState] = useState('none'); // none | progress | success
  const [offerPreviewProgress, setOfferPreviewProgress] = useState(0);
  const [offerDownloadProgress, setOfferDownloadProgress] = useState(0);

  const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

  const getRuntimeBackendOrigin = () => {
    let backendOrigin = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '');

    if (!backendOrigin || backendOrigin.includes('localhost')) {
      if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
        backendOrigin = 'https://placement-portal-zxo2.onrender.com';
      } else {
        backendOrigin = 'http://localhost:5000';
      }
    }

    return backendOrigin.replace(/\/$/, '');
  };

  const resolveOfferLetterUrl = (offerEntry) => {
    if (!offerEntry) return '';

    const directUrl = String(offerEntry?.offerGridfsFileUrl || '').trim();
    const fileId = String(offerEntry?.offerGridfsFileId || '').trim();
    const raw = directUrl || (fileId ? `/api/file/${fileId}` : '');
    if (!raw) return '';

    const backendOrigin = getRuntimeBackendOrigin();

    if (/^https?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        const isCurrentFrontendLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
        const isRawLocal = /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);

        if (!isCurrentFrontendLocal && isRawLocal) {
          return `${backendOrigin}${parsed.pathname}${parsed.search || ''}`;
        }
      } catch (error) {
        // Fallback below keeps current behavior if URL parsing fails.
      }
      return raw;
    }

    return `${backendOrigin}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  const getBestOfferForDrive = useCallback((offers = []) => {
    const driveCompany = normalizeText(app?.company);
    const driveRole = normalizeText(app?.jobRole);
    const driveId = String(app?.driveId || '').trim();

    const sameDriveOffers = offers.filter((entry) => {
      const offerCompany = normalizeText(entry?.company || entry?.companyName);
      const offerRole = normalizeText(entry?.role || entry?.jobRole);
      const offerDriveId = String(entry?.driveId || '').trim();

      if (driveId && offerDriveId) {
        return offerDriveId === driveId;
      }

      return offerCompany === driveCompany && offerRole === driveRole;
    });

    if (!sameDriveOffers.length) return null;

    return sameDriveOffers
      .slice()
      .sort((left, right) => {
        const rightTs = new Date(right?.offerSentAt || right?.offerUploadedAt || right?.updatedAt || 0).getTime();
        const leftTs = new Date(left?.offerSentAt || left?.offerUploadedAt || left?.updatedAt || 0).getTime();
        return rightTs - leftTs;
      })[0] || null;
  }, [app?.company, app?.jobRole, app?.driveId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateRoundsThumb = useCallback(() => {
    const el = roundsListRef.current;
    if (!el) {
      setShowRoundsBar(false);
      return;
    }
    const canScroll = el.scrollHeight > el.clientHeight;
    setShowRoundsBar(canScroll);
    if (!canScroll) return;

    const ratio = el.clientHeight / el.scrollHeight;
    const thumbHeight = Math.max(30, el.clientHeight * ratio);
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const maxThumbTop = el.clientHeight - thumbHeight;
    const thumbTop = maxScrollTop > 0 ? (el.scrollTop / maxScrollTop) * maxThumbTop : 0;

    setRoundsThumb({ height: thumbHeight, top: thumbTop });
  }, []);

  useEffect(() => {
    updateRoundsThumb();
  }, [isMobile, rounds.length, selectedRole, updateRoundsThumb]);

  useEffect(() => {
    const handleThumbResize = () => updateRoundsThumb();
    window.addEventListener('resize', handleThumbResize);
    return () => window.removeEventListener('resize', handleThumbResize);
  }, [updateRoundsThumb]);

  const onRoundsThumbMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY || (e.touches && e.touches[0].clientY);
    const startTop = roundsThumb.top;
    const el = roundsListRef.current;
    if (!el) return;

    const thumbHeight = roundsThumb.height;
    const maxThumbTop = el.clientHeight - thumbHeight;
    const maxScrollTop = el.scrollHeight - el.clientHeight;

    const onMove = (mv) => {
      const clientY = mv.clientY || (mv.touches && mv.touches[0].clientY);
      const nextTop = Math.max(0, Math.min(maxThumbTop, startTop + clientY - startY));
      el.scrollTop = maxThumbTop > 0 ? (nextTop / maxThumbTop) * maxScrollTop : 0;
      updateRoundsThumb();
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };

  const getStudentIdentity = () => {
    try {
      const student = JSON.parse(localStorage.getItem('studentData') || 'null') || {};
      const regNoRaw = String(student?.regNo || student?.registerNo || student?.registerNumber || '').trim();
      return {
        studentId: String(student?._id || student?.id || '').trim(),
        regNoRaw,
        regNo: regNoRaw.toLowerCase()
      };
    } catch (error) {
      return { studentId: '', regNoRaw: '', regNo: '' };
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadOfferLetterForDrive = async () => {
      setIsOfferLetterLoading(true);
      setOfferLetterRecord(null);

      const { studentId, regNoRaw } = getStudentIdentity();
      const candidateRecords = [];

      try {
        if (regNoRaw) {
          const byRegNo = await mongoDBService.getPlacedStudents({ regNo: regNoRaw, offerStatus: 'Sent' }).catch(() => null);
          if (byRegNo?.success && Array.isArray(byRegNo?.data)) {
            candidateRecords.push(...byRegNo.data);
          }
        }

        if (studentId) {
          const byStudentId = await mongoDBService.getPlacedStudents({ studentId, offerStatus: 'Sent' }).catch(() => null);
          if (byStudentId?.success && Array.isArray(byStudentId?.data)) {
            candidateRecords.push(...byStudentId.data);
          }
        }

        if (!isActive) return;

        const unique = [];
        const seen = new Set();
        candidateRecords.forEach((entry) => {
          const key = [
            String(entry?._id || '').trim(),
            String(entry?.offerGridfsFileId || '').trim(),
            String(entry?.offerGridfsFileUrl || '').trim()
          ].join('::');
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(entry);
          }
        });

        const matched = getBestOfferForDrive(unique);
        const hasSentOffer = matched && String(matched?.offerStatus || '').toLowerCase() === 'sent' && resolveOfferLetterUrl(matched);
        setOfferLetterRecord(hasSentOffer ? matched : null);
      } catch (error) {
        console.error('Failed to load drive offer letter:', error);
        if (isActive) {
          setOfferLetterRecord(null);
        }
      } finally {
        if (isActive) {
          setIsOfferLetterLoading(false);
        }
      }
    };

    loadOfferLetterForDrive();

    return () => {
      isActive = false;
    };
  }, [app?.company, app?.jobRole, app?.driveId, getBestOfferForDrive]);

  const handleOfferDecisionUpdate = useCallback(async (decision) => {
    if (!offerLetterRecord || isOfferDecisionUpdating) return false;

    const normalizedDecision = String(decision || '').trim().toLowerCase();
    if (normalizedDecision !== 'accepted' && normalizedDecision !== 'rejected') return false;

    const currentStatus = String(offerLetterRecord?.status || 'Pending').trim().toLowerCase();
    if (currentStatus !== 'pending') return false;

    try {
      setIsOfferDecisionUpdating(true);
      setOfferActionInFlight(normalizedDecision);

      await mongoDBService.updatePlacedStudentOfferResponse({
        placedStudentId: offerLetterRecord?._id,
        regNo: offerLetterRecord?.regNo,
        company: offerLetterRecord?.company,
        role: offerLetterRecord?.role,
        studentId: offerLetterRecord?.studentId || getStudentIdentity().studentId,
        decision: normalizedDecision
      });

      setOfferLetterRecord((prev) => (prev ? {
        ...prev,
        status: normalizedDecision === 'accepted' ? 'Accepted' : 'Rejected'
      } : prev));

      return true;
    } catch (error) {
      console.error(`Failed to ${normalizedDecision} offer letter:`, error);
      return false;
    } finally {
      setIsOfferDecisionUpdating(false);
      setOfferActionInFlight('');
    }
  }, [offerLetterRecord, isOfferDecisionUpdating]);

  const handleOfferAccept = useCallback(() => handleOfferDecisionUpdate('accepted'), [handleOfferDecisionUpdate]);

  const handleOfferReject = useCallback(() => handleOfferDecisionUpdate('rejected'), [handleOfferDecisionUpdate]);

  const buildEligibilityMap = (driveReport) => {
    const { studentId, regNo } = getStudentIdentity();
    const roundsData = Array.isArray(driveReport?.rounds) ? driveReport.rounds : [];

    const isSameStudent = (record = {}) => {
      const recordId = String(record?.studentId || record?.id || '').trim();
      const recordRegNo = String(record?.registerNo || record?.regNo || '').trim().toLowerCase();
      if (studentId && recordId && recordId === studentId) return true;
      if (regNo && recordRegNo && recordRegNo === regNo) return true;
      return false;
    };

    const eligibility = {};
    roundsData.forEach((roundItem) => {
      const roundNumber = Number(roundItem?.roundNumber);
      if (!Number.isFinite(roundNumber) || roundNumber < 1) return;

      const passed = Array.isArray(roundItem?.passedStudents) && roundItem.passedStudents.some(isSameStudent);
      const failed = Array.isArray(roundItem?.failedStudents) && roundItem.failedStudents.some(isSameStudent);

      eligibility[roundNumber] = { passed, failed };
    });

    return eligibility;
  };

  useEffect(() => {
    let isActive = true;

    const loadDriveFeedback = async () => {
      const driveId = (app?.driveId || '').toString().trim();
      if (!driveId) {
        setAdminFeedbackRecords([]);
        setRoundEligibilityMap({});
        return;
      }

      try {
        const [feedbackResponse, roundResultsResponse] = await Promise.all([
          mongoDBService.getFeedbackByDrive(driveId, {
            companyName: app?.company,
            jobRole: app?.jobRole,
            startingDate: app?.startDate
          }),
          mongoDBService.getAllRoundResults('', '', '', driveId)
        ]);
        if (!isActive) return;

        const records = Array.isArray(feedbackResponse?.data) ? feedbackResponse.data : [];
        const eligibility = buildEligibilityMap(roundResultsResponse?.data || {});

        setAdminFeedbackRecords(records);
        setRoundEligibilityMap(eligibility);
      } catch (error) {
        console.error('Failed to fetch admin feedback for drive:', error);
        if (isActive) {
          setAdminFeedbackRecords([]);
          setRoundEligibilityMap({});
        }
      }
    };

    loadDriveFeedback();
    return () => {
      isActive = false;
    };
  }, [app?.driveId]);

  const resolveFeedbackTypeForRound = (roundStatusText = '') => {
    const normalized = String(roundStatusText).trim().toLowerCase();
    if (normalized === 'failed' || normalized === 'rejected' || normalized === 'absent') {
      return 'failed';
    }
    return 'passed';
  };

  const getFeedbackRecordForRound = (roundNumber, feedbackType) => {
    const typedRecords = adminFeedbackRecords.filter((record) => {
      return Number(record?.roundNumber) === Number(roundNumber) &&
        String(record?.feedbackType || '').toLowerCase() === String(feedbackType).toLowerCase();
    });

    if (typedRecords.length === 0) return null;

    return typedRecords.sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0))[0];
  };

  const isEligibleForAdminFeedback = (roundNumber, feedbackType, roundStatusText) => {
    const normalizedType = String(feedbackType || '').toLowerCase();
    const mapEntry = roundEligibilityMap?.[Number(roundNumber)];

    if (mapEntry && typeof mapEntry === 'object') {
      const eligibleFromMap = Boolean(mapEntry?.[normalizedType]);
      if (eligibleFromMap) return true;
    }

    // Fallback: rely on this student's own round status from application history.
    const normalizedStatus = String(roundStatusText || '').trim().toLowerCase();
    if (normalizedType === 'passed') {
      return normalizedStatus === 'passed' || normalizedStatus === 'selected' || normalizedStatus === 'cleared';
    }
    if (normalizedType === 'failed') {
      return normalizedStatus === 'failed' || normalizedStatus === 'rejected' || normalizedStatus === 'absent';
    }
    return false;
  };

  // Get total rounds from roundDetails or rounds array
  const displayTotalRounds = app?.totalRounds || app?.roundDetails?.length || rounds.length || 'N/A';
  const isFirstRoundAbsent = rounds[0]?.status === 'Absent';

  // Mobile rounds pane should stay scrollable for consistent UX.
  const useMobileRoundsScroll = isMobile;

  const feedbackSelector = (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-start', gap: '4px', width: isMobile ? '100%' : 'auto' }}>
      <span style={{ fontSize: isMobile ? '1.1rem' : '1.1rem', fontWeight: 700, color: '#555', marginBottom: isMobile ? '0.2rem' : '0.5rem', lineHeight: 1.05 }}>Feedback</span>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.4rem',
        backgroundColor: '#f9fbff',
        borderRadius: '8px',
        border: '1px solid #dde6f4',
        height: isMobile ? '56px' : '53.6px',
        boxSizing: 'border-box',
        width: isMobile ? '100%' : 'auto'
      }}>
        {['Student', 'Admin'].map(role => (
          <button
            key={role}
            onClick={(e) => { e.stopPropagation(); setSelectedRole(role); }}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: isMobile ? '9px 10px' : '8px 22px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              color: selectedRole === role ? '#fff' : '#666',
              backgroundColor: selectedRole === role ? '#2085f6' : 'transparent',
              fontWeight: selectedRole === role ? 700 : 400,
              boxShadow: selectedRole === role ? '0 2px 8px rgba(32,133,246,0.3)' : 'none',
              fontSize: isMobile ? '0.95rem' : '0.95rem',
              fontFamily: "'Poppins', sans-serif",
              whiteSpace: 'nowrap'
            }}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );

  const roundsToRender = rounds;
  const driveOfferLetterUrl = resolveOfferLetterUrl(offerLetterRecord);
  const driveOfferDecision = String(offerLetterRecord?.status || 'Pending').trim();
  const canShowOfferLetterButton = Boolean(
    offerLetterRecord &&
    String(offerLetterRecord?.offerStatus || '').toLowerCase() === 'sent' &&
    driveOfferLetterUrl
  );

  const closeOfferDownloadSuccessPopup = useCallback(() => {
    setOfferDownloadPopupState('none');
    setOfferDownloadProgress(0);
  }, []);

  const handleOfferLetterPreview = useCallback(() => {
    if (!driveOfferLetterUrl || offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress') return;

    setShowOfferLetterPopup(false);
    setOfferPreviewPopupState('progress');
    setOfferPreviewProgress(0);

    const progressTimer = setInterval(() => {
      setOfferPreviewProgress((prev) => (prev >= 85 ? prev : prev + 12));
    }, 140);

    setTimeout(() => {
      clearInterval(progressTimer);
      setOfferPreviewProgress(100);

      setTimeout(() => {
        setOfferPreviewPopupState('none');
        setOfferPreviewProgress(0);

        // Open only after preview popup finishes, as requested.
        window.open(driveOfferLetterUrl, '_blank', 'noopener,noreferrer');
      }, 260);
    }, 1100);
  }, [driveOfferLetterUrl, offerPreviewPopupState, offerDownloadPopupState]);

  const handleOfferLetterDownload = useCallback(() => {
    if (!driveOfferLetterUrl || offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress') return;

    setShowOfferLetterPopup(false);
    setOfferDownloadPopupState('progress');
    setOfferDownloadProgress(0);

    const progressTimer = setInterval(() => {
      setOfferDownloadProgress((prev) => (prev >= 85 ? prev : prev + 10));
    }, 160);

    setTimeout(() => {
      clearInterval(progressTimer);
      setOfferDownloadProgress(100);

      setTimeout(async () => {
        try {
          const response = await fetch(driveOfferLetterUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch offer letter file');
          }

          const fileBlob = await response.blob();
          const objectUrl = window.URL.createObjectURL(fileBlob);
          const link = document.createElement('a');
          const companyName = String(offerLetterRecord?.company || 'Offer_Letter').replace(/[^a-z0-9_-]/gi, '_');
          const roleName = String(offerLetterRecord?.role || 'Document').replace(/[^a-z0-9_-]/gi, '_');

          link.href = objectUrl;
          link.download = `${companyName}_${roleName}_Offer_Letter.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
          // Fallback keeps download in same tab instead of opening a blank/new tab.
          const link = document.createElement('a');
          link.href = driveOfferLetterUrl;
          link.download = '';
          document.body.appendChild(link);
          link.click();
          link.remove();
        }

        setOfferDownloadPopupState('success');
      }, 320);
    }, 1200);
  }, [driveOfferLetterUrl, offerPreviewPopupState, offerDownloadPopupState, offerLetterRecord?.company, offerLetterRecord?.role]);

  const roundsContent = roundsToRender.length > 0 ? roundsToRender.map((round, index) => (
    <div key={index} style={{ display: "flex", flexDirection: 'row', alignItems: "stretch", background: isMobile ? "#ffffff" : "#f6f7fa", border: isMobile ? '1px solid #e3e9f3' : 'none', borderRadius: 14, marginBottom: index === roundsToRender.length - 1 ? 0 : (isMobile ? 12 : 18), overflow: 'hidden', minHeight: isMobile ? 78 : 'auto', boxShadow: isMobile ? '0 1px 4px rgba(24,39,75,0.08)' : 'none' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: isMobile ? '12px' : '16px 18px 16px 24px', gap: isMobile ? '10px' : '18px' }}>
        <div style={{ flexShrink: 0 }}>{round.icon}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: isMobile ? "1rem" : "1.05rem", fontWeight: 700, color: '#1a1a1a', lineHeight: 1.25 }}>
            Round {index + 1} ({round.name.toLowerCase()})
          </div>
          <div style={{ fontSize: isMobile ? '0.9rem' : '0.85rem', color: '#666', fontWeight: 500 }}>
            Status: <span style={{ color: round.statusColor, fontWeight: 700 }}>{round.statusText}</span>
          </div>
        </div>
      </div>
      {!isFirstRoundAbsent && round.statusText !== 'Not Eligible' && selectedRole === 'Admin' && overallStatus !== "Pending" && (() => {
        const feedbackType = resolveFeedbackTypeForRound(round.statusText);
        const isEligible = isEligibleForAdminFeedback(index + 1, feedbackType, round.statusText);
        if (!isEligible) return null;
        const feedbackRecord = getFeedbackRecordForRound(index + 1, feedbackType);
        return (
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAdminFeedback(feedbackRecord);
              setSelectedAdminFeedbackType(feedbackType);
              setSelectedAdminRoundLabel(`Round ${index + 1} (${round.name})`);
              setShowAdminFeedback(true);
            }}
            style={{
              backgroundColor: '#197AFF', border: 'none', cursor: 'pointer',
              padding: isMobile ? '0 14px' : '0 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? '70px' : 'auto',
              minHeight: 'auto'
            }}
          >
            <img src={CopmanyviewFeedbackicon} alt="View" style={{ width: 34, height: 34 }} />
          </button>
        </div>
        );
      })()}
      {!isFirstRoundAbsent && round.statusText !== 'Not Eligible' && selectedRole === 'Student' && overallStatus !== "Pending" && (
        <div style={{ display: 'flex', flexShrink: 0, width: isMobile ? '112px' : 'auto' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRoundName(`Round ${index + 1} (${round.name})`);
              setSelectedRoundNumber(index + 1);
              setSelectedRoundStatus(round.statusText || '');
              setFeedbackViewMode('edit');
              setShowStudentFeedback(true);
            }}
            style={{
              backgroundColor: '#197AFF', border: 'none', cursor: 'pointer',
              padding: isMobile ? '0 0' : '0 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.35)',
              width: isMobile ? '56px' : 'auto',
              minHeight: 'auto'
            }}
          >
            <img src={companyfeedbackicon} alt="Feedback" style={{ width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, filter: 'brightness(0) invert(1)' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRoundName(`Round ${index + 1} (${round.name})`);
              setSelectedRoundNumber(index + 1);
              setSelectedRoundStatus(round.statusText || '');
              setFeedbackViewMode('view');
              setShowStudentFeedback(true);
            }}
            style={{
              backgroundColor: '#197AFF', border: 'none', cursor: 'pointer',
              padding: isMobile ? '0 0' : '0 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? '56px' : 'auto',
              minHeight: 'auto'
            }}
          >
            <img src={CopmanyviewFeedbackicon} alt="View" style={{ width: isMobile ? 30 : 34, height: isMobile ? 30 : 34 }} />
          </button>
        </div>
      )}
    </div>
  )) : (
    <div style={{ textAlign: 'center', color: '#888', padding: '40px', fontSize: '1rem' }}>
      No round information available
    </div>
  );

  return (
    <>
        <style>{`
          .popup-rounds-hide-native::-webkit-scrollbar { display: none; }
          .popup-main-container { scrollbar-width: none; -ms-overflow-style: none; }
          .popup-main-container::-webkit-scrollbar { display: none; width: 0; height: 0; }
        `}</style>
        <div onClick={(e) => e.stopPropagation()} className="popup-main-container" style={{ background: "#fff", padding: isMobile ? '12px 18px 18px' : '14px 28px 28px', borderRadius: isMobile ? 12 : 16, boxShadow: "0 4px 24px #e9e6ef", flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 'auto' : 0, height: 'auto', maxHeight: isMobile ? 'calc(100vh - 40px)' : 'none', overflowY: isMobile ? 'auto' : 'hidden', overflowX: 'hidden' }}>
            {/* Company Info Section */}
            <div style={{ marginBottom: isMobile ? 16 : 20, padding: isMobile ? '14px' : '16px', background: "#f6f7fa", borderRadius: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: isMobile ? '10px' : '12px', fontSize: isMobile ? '1rem' : '0.95rem' }}>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>Company: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit', wordBreak: 'break-word' }}>{app?.company || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>Job Role: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit', wordBreak: 'break-word' }}>{app?.jobRole || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>Mode: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit' }}>{app?.mode || app?.driveMode || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>Package: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit' }}>{app?.package || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>Start Date: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit', overflowWrap: 'anywhere' }}>
                    {app?.startDate ? formatDate(app.startDate) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>End Date: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit', overflowWrap: 'anywhere' }}>
                    {app?.endDate ? formatDate(app.endDate) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>Total Rounds: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit' }}>{displayTotalRounds}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500, fontSize: isMobile ? '1.02rem' : 'inherit' }}>Bond Period: </span>
                  <span style={{ color: "#333", fontWeight: 600, fontSize: isMobile ? '1.08rem' : 'inherit' }}>{app?.bondPeriod || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: isMobile ? '10px' : '12px', flexDirection: isMobile ? 'column' : 'row', marginBottom: isMobile ? 0 : 0 }}>
              <div style={{ width: isMobile ? '100%' : 'auto', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-start', gap: isMobile ? '8px' : 0, flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : 0, flexWrap: 'nowrap' }}>
                  <span style={{ fontSize: isMobile ? 18 : 23, color: "#888", fontWeight: isMobile ? 500 : 400, whiteSpace: 'nowrap' }}>Overall Status:</span>
                  <span style={{
                    fontSize: isMobile ? 18 : 25,
                    color: overallStatusColor,
                    fontWeight: isMobile ? 600 : 700,
                    padding: isMobile ? '4px 12px' : '4px 16px',
                    borderRadius: '8px',
                    background: `${overallStatusColor}15`,
                    whiteSpace: 'nowrap'
                  }}>
                    {overallStatus}
                  </span>
                </div>
                {isMobile && (
                  <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: '9px 15px', fontWeight: 600, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: 'center', width: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, marginRight: 6 }}>Back</span><span style={{ fontSize: 18 }}>â†©</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'flex-end', width: isMobile ? '100%' : 'auto', gap: isMobile ? 8 : 10, flexShrink: 0 }}>
                {canShowOfferLetterButton && (
                  <button
                    onClick={() => {
                      setShowOfferLetterPreview(false);
                      setShowOfferLetterPopup(true);
                    }}
                    style={{
                      background: '#5932EA',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: isMobile ? '9px 14px' : '8px 20px',
                      fontWeight: 700,
                      fontSize: isMobile ? 14 : 15,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 6px 16px rgba(89, 50, 234, 0.28)'
                    }}
                    title="View Offer Letter"
                  >
                    Offer Letter
                  </button>
                )}
                {!canShowOfferLetterButton && isOfferLetterLoading && (
                  <span style={{ color: '#777', fontSize: isMobile ? 12 : 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Checking offer...</span>
                )}
                {!isMobile && (
                  <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: "8px 32px", fontWeight: 600, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: 'center', width: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span style={{ fontSize: 18, marginRight: 6 }}>Back</span><span style={{ fontSize: 22 }}>â†©</span>
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginTop: isMobile ? 16 : 20, flexGrow: isMobile ? 0 : 1, display: 'flex', flexDirection: 'column', minHeight: 0, rowGap: isMobile ? 0 : 0 }}>
              {isMobile ? (
                <>
                  {!isFirstRoundAbsent && overallStatus !== "Pending" && feedbackSelector}
                  <h3 style={{ fontWeight: 700, fontSize: '1.45rem', marginTop: 14, marginBottom: 12, lineHeight: 1.1 }}>Recruitment Journey</h3>
                </>
              ) : (
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.7rem', marginBottom: 0, lineHeight: 1.1 }}>Recruitment Journey</h3>
                  {!isFirstRoundAbsent && overallStatus !== "Pending" && feedbackSelector}
                </div>
              )}
              {isMobile ? (
                <div style={{ marginTop: 0, flex: '0 0 auto', minHeight: 0, maxHeight: '42vh', position: 'relative', overflow: 'hidden', borderRadius: 12, display: 'flex', flexDirection: 'column', paddingTop: 0, paddingBottom: 8 }}>
                  <div
                    ref={roundsListRef}
                    onScroll={updateRoundsThumb}
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      paddingTop: 0,
                      paddingBottom: 12,
                      paddingRight: 12,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    className={scrollStyles['scroll-rounds']}
                  >
                    {roundsContent}
                  </div>
                  {showRoundsBar && (
                    <div style={{ width: '6px', backgroundColor: '#d7e9ff', borderRadius: '20px', position: 'absolute', top: 2, right: 0, bottom: 2 }}>
                      <div
                        onMouseDown={onRoundsThumbMouseDown}
                        onTouchStart={onRoundsThumbMouseDown}
                        style={{
                          position: 'absolute', left: 0, width: '100%',
                          height: `${roundsThumb.height}px`, top: `${roundsThumb.top}px`,
                          backgroundColor: '#2085f6', borderRadius: '20px', cursor: 'grab',
                          transition: 'background-color 0.2s ease',
                          touchAction: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1667e8'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2085f6'}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 28, flexGrow: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                  <div
                    ref={roundsListRef}
                    onScroll={updateRoundsThumb}
                    style={{ overflowY: "auto", paddingRight: 14, height: '100%' }}
                    className={scrollStyles['scroll-rounds']}
                  >
                    {roundsContent}
                  </div>
                  {showRoundsBar && (
                    <div style={{ width: '8px', backgroundColor: '#d7e9ff', borderRadius: '20px', position: 'absolute', top: 2, right: 2, bottom: 2 }}>
                      <div
                        onMouseDown={onRoundsThumbMouseDown}
                        onTouchStart={onRoundsThumbMouseDown}
                        style={{
                          position: 'absolute', left: 0, width: '100%',
                          height: `${roundsThumb.height}px`, top: `${roundsThumb.top}px`,
                          backgroundColor: '#2085f6', borderRadius: '20px', cursor: 'grab',
                          transition: 'background-color 0.2s ease',
                          touchAction: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1667e8'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2085f6'}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
        {showAdminFeedback && (
          <AdminFeedbackPopup
            feedbackRecord={selectedAdminFeedback}
            feedbackType={selectedAdminFeedbackType}
            roundLabel={selectedAdminRoundLabel}
            onClose={() => { setShowAdminFeedback(false); }}
          />
        )}
        {showStudentFeedback && (
          <StudentFeedbackPopup
            roundName={selectedRoundName}
            roundNumber={selectedRoundNumber}
            roundStatus={selectedRoundStatus}
            driveContext={app}
            viewOnly={feedbackViewMode === 'view'}
            onClose={() => { setShowStudentFeedback(false); }}
          />
        )}
        {showOfferLetterPopup && canShowOfferLetterButton && (
          <div className="alert-overlay">
            <div className="achievement-popup-container" style={{ width: isMobile ? '92vw' : '400px', maxWidth: '90vw' }}>
              <div className="achievement-popup-header" style={{ backgroundColor: '#2085f6', fontSize: isMobile ? '1.45rem' : '1.75rem', padding: isMobile ? '0.85rem 1rem' : '1rem' }}>
                Offer Letter
              </div>
              <div className="achievement-popup-body" style={{ minHeight: '220px', padding: isMobile ? '1.5rem 1.25rem' : '2rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="offer-letter-icon-animate" style={{ width: isMobile ? '60px' : '85px', height: isMobile ? '60px' : '85px', margin: '0 auto 1.5rem auto', display: 'block' }}>
                  <circle cx="10" cy="10" r="10" fill="#1FAD66" />
                  <g fill="#fff" fillRule="evenodd" clipRule="evenodd" className="icon-stroke" transform="translate(10, 10) scale(0.7) translate(-10, -10)">
                    <path d="M2.5 8a.5.5 0 0 1 .5.5V17h14V8.5a.5.5 0 0 1 1 0v9a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5"/>
                    <path d="M3 5.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v4.67a.5.5 0 0 1-.223.416l-6.5 4.33a.5.5 0 0 1-.554 0l-6.5-4.33A.5.5 0 0 1 3 10.17zM4 6v3.902l6 3.997l6-3.997V6z"/>
                    <path d="M9.723 2.084a.5.5 0 0 1 .554 0l4.5 3l-.554.832L10 3.101L5.777 5.916l-.554-.832zm7.131 5.062l1 1l-.708.708l-1-1zm-13 .708l-1 1l-.708-.708l1-1zM6.75 8A.25.25 0 0 1 7 7.75h6a.25.25 0 1 1 0 .5H7A.25.25 0 0 1 6.75 8m.5 2a.25.25 0 0 1 .25-.25h5a.25.25 0 1 1 0 .5h-5a.25.25 0 0 1-.25-.25"/>
                  </g>
                </svg>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: isMobile ? '20px' : '24px', color: '#000', fontWeight: '700' }}>
                  Offer Letter Ready ✓
                </h2>
                <p style={{ margin: 0, color: '#888', fontSize: isMobile ? '15px' : '16px', lineHeight: 1.35 }}>
                  {offerLetterRecord?.company || 'N/A'} · {offerLetterRecord?.role || 'N/A'} · {offerLetterRecord?.pkg || offerLetterRecord?.package || 'N/A'}
                </p>
                <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: isMobile ? '14px' : '15px', lineHeight: 1.45 }}>
                  Your offer letter has been received and processed. You can preview or download it using the buttons below.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                  <span style={{ color: '#666', fontWeight: 600, fontSize: isMobile ? '0.88rem' : '0.95rem' }}>Response:</span>
                  {String(offerLetterRecord?.status || 'Pending').trim().toLowerCase() === 'pending' ? (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={handleOfferAccept}
                        disabled={isOfferDecisionUpdating}
                        style={{
                          backgroundColor: '#1FAD66',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: isMobile ? '8px 14px' : '9px 18px',
                          fontWeight: 700,
                          fontSize: isMobile ? '0.88rem' : '0.95rem',
                          cursor: isOfferDecisionUpdating ? 'not-allowed' : 'pointer',
                          opacity: isOfferDecisionUpdating ? 0.75 : 1
                        }}
                      >
                        {offerActionInFlight === 'accepted' ? 'Saving...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={handleOfferReject}
                        disabled={isOfferDecisionUpdating}
                        style={{
                          backgroundColor: '#D23B42',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: isMobile ? '8px 14px' : '9px 18px',
                          fontWeight: 700,
                          fontSize: isMobile ? '0.88rem' : '0.95rem',
                          cursor: isOfferDecisionUpdating ? 'not-allowed' : 'pointer',
                          opacity: isOfferDecisionUpdating ? 0.75 : 1
                        }}
                      >
                        {offerActionInFlight === 'rejected' ? 'Saving...' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: 16,
                      backgroundColor: String(offerLetterRecord?.status || 'Pending').trim().toLowerCase() === 'accepted' ? '#e8faef' : '#f5f5f5',
                      color: String(offerLetterRecord?.status || 'Pending').trim().toLowerCase() === 'accepted' ? '#1FAD66' : '#333',
                      fontWeight: 700,
                      fontSize: isMobile ? '0.8rem' : '0.88rem'
                    }}>
                      {driveOfferDecision}
                    </span>
                  )}
                </div>
              </div>
              <div className="achievement-popup-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '1.5rem' }}>
                <button
                  onClick={handleOfferLetterPreview}
                  className="achievement-popup-close-btn"
                  disabled={offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress'}
                  style={{
                    flex: '1',
                    background: '#e9f1fc',
                    color: '#2085f6',
                    border: 'none',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: (offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress') ? 'not-allowed' : 'pointer',
                    opacity: (offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress') ? 0.7 : 1,
                    transition: 'background 0.2s ease',
                    boxShadow: 'none',
                    transform: 'none',
                    minWidth: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#d5e5f9';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'none';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#e9f1fc';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'none';
                  }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleOfferLetterDownload}
                  className="achievement-popup-close-btn"
                  disabled={offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress'}
                  style={{
                    flex: '1',
                    backgroundColor: '#2085f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: (offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress') ? 'not-allowed' : 'pointer',
                    opacity: (offerPreviewPopupState === 'progress' || offerDownloadPopupState === 'progress') ? 0.7 : 1,
                    transition: 'background-color 0.2s ease',
                    boxShadow: 'none',
                    transform: 'none',
                    minWidth: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1976d2';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'none';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2085f6';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'none';
                  }}
                >
                  Download
                </button>
                <button
                  onClick={() => setShowOfferLetterPopup(false)}
                  className="achievement-popup-close-btn"
                  style={{
                    flex: '1',
                    backgroundColor: '#D23B42',
                    color: '#fff',
                    border: 'none',
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    boxShadow: 'none',
                    transform: 'none',
                    minWidth: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#b53138';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'none';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#D23B42';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'none';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <PreviewProgressAlert
          isOpen={offerPreviewPopupState === 'progress'}
          progress={offerPreviewProgress}
          fileLabel="offer letter"
          title="Previewing..."
          messages={{
            initial: 'Fetching offer letter from database...',
            mid: 'Preparing preview...',
            final: 'Opening preview...'
          }}
        />

        <DownloadProgressAlert
          isOpen={offerDownloadPopupState === 'progress'}
          progress={offerDownloadProgress}
          fileLabel="offer letter"
          title="Downloading..."
          messages={{
            initial: 'Preparing offer letter for download...',
            mid: 'Finalizing download...',
            final: 'Starting download...'
          }}
        />

        <DownloadSuccessAlert
          isOpen={offerDownloadPopupState === 'success'}
          onClose={closeOfferDownloadSuccessPopup}
          fileLabel="offer letter"
          title="Downloaded !"
          description={(
            <>
              The offer letter has been successfully
              <br />
              downloaded as PDF to your device.
            </>
          )}
          color="#197AFF"
        />
    </>
  );
}