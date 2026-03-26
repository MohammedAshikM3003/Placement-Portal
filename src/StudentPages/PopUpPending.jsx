import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from 'react-dom';
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaStar, FaRegStar } from "react-icons/fa";
import scrollStyles from './PopupScrollbar.module.css';
import companyfeedbackicon from '../assets/companyfeedbackicon.svg';
import CopmanyviewFeedbackicon from '../assets/CopmanyviewFeedbackicon.svg';
import DOBDatePicker from '../components/Calendar/DOBDatePicker.jsx';

// ── Custom volume-bar scrollbox (no native browser arrows) ─────────────────
function FeedbackScrollBox({ text, bg }) {
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
      {/* Content — native scrollbar hidden */}
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

// ── Admin Feedback Popup ────────────────────────────────────────────────────
function AdminFeedbackPopup({ isPassed, onClose }) {
  const [rating] = useState(isPassed ? 4 : 1);
  const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 480;

  const headerBg   = isPassed ? '#197AFF' : '#5C5C5C';
  const assessBg   = isPassed ? '#4A5BB3' : '#404040';
  const messageBg  = isPassed ? '#999999' : '#999999';
  const feedbackText = isPassed
    ? 'Congratulations on your outstanding performance in the technical round! Your problem-solving approach demonstrated exceptional analytical thinking.\n\nParticularly impressed by:\n• Clean, well-documented code structure\n• Efficient algorithm optimization (O(n) solution)\n• Clear communication of your thought process\n• Strong debugging skills under time\nYour ability to break down complex problems manageable components reflects maturity beyond your academic years.'
    : 'Thank you for your participation in the group discussion round. While you demonstrated subject knowledge, certain areas require development for success in collaborative environments.\n\nAreas observed during the session:\n• Limited active participation in team dialogue\n• Missed opportunities to build on peers\' ideas\n• Communication remained mostly reactive rather than proactive\n• Time management affected conclusion quality';

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
          {/* Overall Assessment + Next Round / Scheduled On */}
          <div style={{ display: 'flex', gap: isMobileView ? '12px' : '16px', alignItems: 'flex-start', marginBottom: '14px', flexDirection: isMobileView ? 'column' : 'row' }}>
            {/* Left: assessment box + stars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: isMobileView ? '100%' : '160px', width: isMobileView ? '100%' : 'auto' }}>
              <div style={{
                backgroundColor: assessBg,
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                Overall Assessment
              </div>
              <div style={{ display: 'flex', gap: '4px', paddingLeft: '4px' }}>
                {[1,2,3,4,5].map(star => (
                  <span
                    key={star}
                    style={{ cursor: 'default', fontSize: '1.3rem' }}
                  >
                    {rating >= star
                      ? <FaStar color="#FFE817" />
                      : <FaRegStar color="#ccc" />}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Next Round + Scheduled On */}
            <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Next Round */}
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobileView ? '6px' : '8px', width: '100%' }}>
                <span style={{ fontWeight: 700, fontSize: isMobileView ? '0.78rem' : '0.8rem', whiteSpace: 'nowrap', minWidth: isMobileView ? '74px' : '78px', flexShrink: 0 }}>
                  {isPassed ? 'Next round' : 'Next Round'}
                </span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>:</span>
                <div style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #dde6f4',
                  borderRadius: '8px',
                  backgroundColor: '#f9fbff',
                  fontSize: isMobileView ? '0.76rem' : '0.8rem',
                  fontFamily: "'Poppins', sans-serif",
                  color: '#555',
                  boxSizing: 'border-box',
                  overflowWrap: 'anywhere'
                }}>
                  {isPassed ? 'HR Round' : 'Closed'}
                </div>
              </div>

              {/* Scheduled On / Better luck */}
              {isPassed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobileView ? '6px' : '8px', width: '100%' }}>
                  <span style={{ fontWeight: 700, fontSize: isMobileView ? '0.78rem' : '0.8rem', whiteSpace: 'nowrap', minWidth: isMobileView ? '74px' : '78px', flexShrink: 0 }}>Scheduled On</span>
                  <span style={{ fontWeight: 700, flexShrink: 0 }}>:</span>
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #dde6f4',
                    borderRadius: '8px',
                    backgroundColor: '#f9fbff',
                    fontSize: isMobileView ? '0.76rem' : '0.8rem',
                    fontFamily: "'Poppins', sans-serif",
                    color: '#555',
                    boxSizing: 'border-box',
                    overflowWrap: 'anywhere'
                  }}>
                    19-07-2026
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: assessBg,
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  <span className="afp-marquee-inner">
                    {'\u00A0\u00A0'}Better luck next time ! – we encourage you
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback message box */}
          <FeedbackScrollBox text={feedbackText} bg={messageBg} />
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

// ── Editable textarea with custom volume-bar scrollbar ─────────────────────
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

// ── Student Feedback Popup ───────────────────────────────────────────────────
function StudentFeedbackPopup({ roundName, onClose, viewOnly = false }) {
  const [aiEnabled, setAiEnabled]     = useState(true);
  const [difficulty, setDifficulty]   = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [feedback, setFeedback]       = useState('');
  const [suggestion, setSuggestion]   = useState('');
  const [rating, setRating]           = useState(1);
  const [hoverRating, setHoverRating] = useState(0);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const mobileScrollRef = useRef(null);
  const mobileTrackRef = useRef(null);
  const [mobileThumb, setMobileThumb] = useState({ height: 40, top: 0 });

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

  /* ── Inline submit success popup ─────────────────────────────────────── */
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
          <h2 style={{ margin:'1rem 0 0.5rem', fontSize:'24px', color:'#333', fontWeight:600 }}>Submitted ✓</h2>
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
        {/* ── Header ── */}
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

        {/* ── HR Round badge ── */}
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

        {/* ── Body ── */}
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

          {/* AI Integration + Overall Assessment — mobile/desktop layouts */}
          {isPopupMobile ? (
            /* ── MOBILE: flat column, no gap below stars ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>

              {/* Row 1: AI Integration — full width */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>AI - Integration :</span>
                <div style={{ flex: 1, display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.32rem', backgroundColor: '#f9fbff', borderRadius: '8px', border: '1px solid #dde6f4', height: '50px', boxSizing: 'border-box', minWidth: 0 }}>
                  <input type="radio" id="sfp-ai-enable" name="sfp-ai" checked={aiEnabled} onChange={() => !viewOnly && setAiEnabled(true)} style={{ display: 'none' }} />
                  <label htmlFor="sfp-ai-enable" style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: aiEnabled ? '#fff' : '#666', backgroundColor: aiEnabled ? '#2085f6' : 'transparent', fontWeight: aiEnabled ? 700 : 400, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Enable</label>
                  <input type="radio" id="sfp-ai-disable" name="sfp-ai" checked={!aiEnabled} onChange={() => !viewOnly && setAiEnabled(false)} style={{ display: 'none' }} />
                  <label htmlFor="sfp-ai-disable" style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: !aiEnabled ? '#fff' : '#666', backgroundColor: !aiEnabled ? '#2085f6' : 'transparent', fontWeight: !aiEnabled ? 700 : 400, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Disable</label>
                </div>
              </div>

              {/* Row 2: Overall Assessment + Stars — side by side in one row */}
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
                    <option value="hardcore">Hardcore</option>
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
            /* ── DESKTOP: two-column layout ── */
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
                      <option value="hardcore">Hardcore</option>
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
                      <button onClick={() => setFeedback('')} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(239,68,68,0.35)', transition: 'background 0.2s ease' }} onMouseEnter={e => e.target.style.backgroundColor = '#dc2626'} onMouseLeave={e => e.target.style.backgroundColor = '#ef4444'}>Clear</button>
                      <button style={{ backgroundColor: '#197AFF', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(25,122,255,0.35)' }}>Generate</button>
                    </div>
                  )}
                </div>
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
                      <button onClick={() => setSuggestion('')} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(239,68,68,0.35)', transition: 'background 0.2s ease' }} onMouseEnter={e => e.target.style.backgroundColor = '#dc2626'} onMouseLeave={e => e.target.style.backgroundColor = '#ef4444'}>Clear</button>
                      <button style={{ backgroundColor: '#197AFF', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(25,122,255,0.35)' }}>Generate</button>
                    </div>
                  )}
                </div>
              </div>
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
                      onClick={() => setFeedback('')}
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
                      style={{
                        backgroundColor: '#197AFF', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '4px 12px',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Poppins', sans-serif",
                        boxShadow: '0 2px 6px rgba(25,122,255,0.35)'
                      }}
                    >
                      Generate
                    </button>
                  </div>
                )}
              </div>
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
                        onClick={() => setSuggestion('')}
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
                        style={{
                          backgroundColor: '#197AFF', color: '#fff', border: 'none',
                          borderRadius: '6px', padding: '4px 12px',
                          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                          fontFamily: "'Poppins', sans-serif",
                          boxShadow: '0 2px 6px rgba(25,122,255,0.35)'
                        }}
                      >
                        Generate
                      </button>
                    </div>
                  )}
                </div>
              </div>
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

        {/* ── Footer ── */}
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
                style={{
                  backgroundColor: '#7C7C7C', color: '#fff', border: 'none',
                  borderRadius: '12px', padding: '10px 40px',
                  fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >Discard</button>
              <button
                onClick={() => setShowSubmitSuccess(true)}
                style={{
                  backgroundColor: '#197AFF', color: '#fff', border: 'none',
                  borderRadius: '12px', padding: '10px 40px',
                  fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >Submit</button>
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
  // Keep backward compatibility for round-level absence from existing data.
  const hasAbsent = app?.rounds?.some(r => r.status === 'Absent');
  
  // Check if Round 1 is failed - if yes, mark subsequent rounds as Not Eligible
  const isRound1Failed = app?.rounds?.[0]?.status === 'Failed' || 
                         (app?.roundDetails && app?.rounds?.find(r => r.roundNumber === 1 || r.name === app.roundDetails[0])?.status === 'Failed');
  
  // If roundDetails exist, use them as the base and merge with student rounds
  if (app?.roundDetails && app.roundDetails.length > 0) {
    return app.roundDetails.map((roundName, index) => {
      // Find corresponding student round by name or round number
      const studentRound = app.rounds?.find(
        r => r.name === roundName || 
             r.roundName === roundName || 
             r.roundNumber === (index + 1)
      );
      
      let status;
      if (isApplicationAbsent) {
        // Attendance-level absent: show first round absent and remaining rounds not eligible.
        status = index === 0 ? "Absent" : "Not Eligible";
      } else if (hasAbsent) {
        // Round-level absent from existing data: preserve old behavior.
        status = "Absent";
      } else if (isRound1Failed && index > 0 && !studentRound?.status) {
        // If Round 1 is failed and this is not the first round and no status exists, mark as Not Eligible
        status = "Not Eligible";
      } else {
        status = studentRound?.status || "Pending";
      }
      
      return {
        name: roundName || `Round ${index + 1}`,
        status: status,
        icon: status === "Passed" 
          ? <FaCheckCircle color="#197AFF" size={28} />
          : status === "Failed"
          ? <FaTimes color="#D23B42" size={28} />
          : status === "Absent"
          ? <AbsentIcon />
          : status === "Not Eligible"
          ? <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 36 36"><path fill="#f39c12" d="M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2m11.15 18H6.85a.85.85 0 0 1-.85-.85v-2.3a.85.85 0 0 1 .85-.85h22.3a.85.85 0 0 1 .85.85v2.29a.85.85 0 0 1-.85.86" class="clr-i-solid clr-i-solid-path-1"/><path fill="none" d="M0 0h36v36H0z"/></svg>
          : <FaExclamationCircle color="#949494" size={28} />,
        statusColor: status === "Passed" ? "#197AFF" : 
                     status === "Failed" ? "#D23B42" :
                     status === "Absent" ? "#ff2800" :
                     status === "Not Eligible" ? "#f39c12" : "#717070",
        statusText: status
      };
    });
  }
  
  // Fallback: If only student rounds exist without roundDetails
  if (app?.rounds && app.rounds.length > 0) {
    // Check if any round has Absent status
    const hasAbsent = app.rounds.some(r => r.status === 'Absent');
    // Check if first round is failed
    const isFirstRoundFailed = app.rounds[0]?.status === 'Failed';
    
    return app.rounds.map((round, index) => {
      let status;
      if (isApplicationAbsent) {
        status = index === 0 ? "Absent" : "Not Eligible";
      } else if (hasAbsent) {
        status = "Absent";
      } else if (isFirstRoundFailed && index > 0 && !round.status) {
        status = "Not Eligible";
      } else {
        status = round.status || "Pending";
      }
      
      return {
        name: round.name || round.roundName || `Round ${round.roundNumber}`,
        status: status,
        icon: status === "Passed" 
          ? <FaCheckCircle color="#197AFF" size={28} />
          : status === "Failed"
          ? <FaTimes color="#D23B42" size={28} />
          : status === "Absent"
          ? <AbsentIcon />
          : status === "Not Eligible"
          ? <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 36 36"><path fill="#f39c12" d="M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2m11.15 18H6.85a.85.85 0 0 1-.85-.85v-2.3a.85.85 0 0 1 .85-.85h22.3a.85.85 0 0 1 .85.85v2.29a.85.85 0 0 1-.85.86" class="clr-i-solid clr-i-solid-path-1"/><path fill="none" d="M0 0h36v36H0z"/></svg>
          : <FaExclamationCircle color="#949494" size={28} />,
        statusColor: status === "Passed" ? "#197AFF" : 
                     status === "Failed" ? "#D23B42" :
                     status === "Absent" ? "#ff2800" :
                     status === "Not Eligible" ? "#f39c12" : "#717070",
        statusText: status || "Pending"
      };
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
        name: `Round ${index + 1}`,
        status,
        icon: status === 'Absent'
          ? <AbsentIcon />
          : status === 'Not Eligible'
          ? <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 36 36"><path fill="#f39c12" d="M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2m11.15 18H6.85a.85.85 0 0 1-.85-.85v-2.3a.85.85 0 0 1 .85-.85h22.3a.85.85 0 0 1 .85.85v2.29a.85.85 0 0 1-.85.86" class="clr-i-solid clr-i-solid-path-1"/><path fill="none" d="M0 0h36v36H0z"/></svg>
          : <FaExclamationCircle color="#949494" size={28} />,
        statusColor: status === 'Absent' ? '#ff2800' : status === 'Not Eligible' ? '#f39c12' : '#717070',
        statusText: status
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

  const rounds = generateRounds(app);
  const hasAbsent = rounds.some(r => r.status === "Absent");
  const hasFailed = rounds.some(r => r.status === "Failed");
  const passedCount = rounds.filter(r => r.status === "Passed").length;
  const totalRounds = app?.totalRounds || app?.roundDetails?.length || rounds.length;
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
  return { status: "Pending", color: "#717070" };
};

export default function PopUpPending({ app, onBack }) {
  const rounds = generateRounds(app);

  const { status: overallStatus, color: overallStatusColor } = getOverallStatus(app);
  const [selectedRole, setSelectedRole] = useState('Student');
  const [showAdminFeedback, setShowAdminFeedback] = useState(false);
  const [adminFeedbackRoundPassed, setAdminFeedbackRoundPassed] = useState(false);
  const [showStudentFeedback, setShowStudentFeedback] = useState(false);
  const [selectedRoundName, setSelectedRoundName] = useState('');
  const [feedbackViewMode, setFeedbackViewMode] = useState('edit'); // 'edit' | 'view'
  const roundsListRef = useRef(null);
  const [roundsThumb, setRoundsThumb] = useState({ height: 34, top: 0 });
  const [showRoundsBar, setShowRoundsBar] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

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
      {!isFirstRoundAbsent && round.statusText !== 'Not Eligible' && selectedRole === 'Admin' && overallStatus !== "Pending" && (
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const isPassed = ['Passed', 'Selected', 'Cleared'].includes(round.statusText);
              setAdminFeedbackRoundPassed(isPassed);
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
      )}
      {!isFirstRoundAbsent && round.statusText !== 'Not Eligible' && selectedRole === 'Student' && overallStatus !== "Pending" && (
        <div style={{ display: 'flex', flexShrink: 0, width: isMobile ? '112px' : 'auto' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRoundName(`Round ${index + 1} (${round.name})`);
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
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: isMobile ? '8px' : '12px', flexDirection: 'row', marginBottom: isMobile ? 0 : 0 }}>
              <div style={{ width: 'auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : 0, flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
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
              <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: isMobile ? '9px 15px' : "8px 32px", fontWeight: isMobile ? 600 : 600, fontSize: isMobile ? 16 : 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: 'center', width: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span style={{ fontSize: isMobile ? 16 : 18, marginRight: 6 }}>Back</span><span style={{ fontSize: isMobile ? 18 : 22 }}>↩</span>
              </button>
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
            isPassed={adminFeedbackRoundPassed}
            onClose={() => { setShowAdminFeedback(false); }}
          />
        )}
        {showStudentFeedback && (
          <StudentFeedbackPopup
            roundName={selectedRoundName}
            viewOnly={feedbackViewMode === 'view'}
            onClose={() => { setShowStudentFeedback(false); }}
          />
        )}
    </>
  );
}