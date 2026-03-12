import React, { useState, useRef, useEffect } from "react";
import ReactDOM from 'react-dom';
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaStar, FaRegStar } from "react-icons/fa";
import scrollStyles from './PopupScrollbar.module.css';
import companyfeedbackicon from '../assets/companyfeedbackicon.svg';
import CopmanyviewFeedbackicon from '../assets/CopmanyviewFeedbackicon.svg';

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
              0%   { transform: translateX(100%); }
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
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '14px' }}>
            {/* Left: assessment box + stars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
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
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Next Round */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', minWidth: '78px' }}>
                  {isPassed ? 'Next round' : 'Next Round'}
                </span>
                <span style={{ fontWeight: 700 }}>:</span>
                <div style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #dde6f4',
                  borderRadius: '8px',
                  backgroundColor: '#f9fbff',
                  fontSize: '0.8rem',
                  fontFamily: "'Poppins', sans-serif",
                  color: '#555',
                  boxSizing: 'border-box'
                }}>
                  {isPassed ? 'HR Round' : 'Closed'}
                </div>
              </div>

              {/* Scheduled On / Better luck */}
              {isPassed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', minWidth: '78px' }}>Scheduled On</span>
                  <span style={{ fontWeight: 700 }}>:</span>
                  <div style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #dde6f4',
                    borderRadius: '8px',
                    backgroundColor: '#f9fbff',
                    fontSize: '0.8rem',
                    fontFamily: "'Poppins', sans-serif",
                    color: '#555',
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap'
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
                    Better luck next time ! – we encourage you
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

// ── Student Feedback Date Picker ────────────────────────────────────────────
function StudentFeedbackDatePicker({ value, onChange, viewOnly = false, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('day');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [hovered, setHovered] = useState(false);
  const triggerRef = useRef(null);
  const calendarRef = useRef(null);

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekDay = new Date(calYear, calMonth, 1).getDay();

  const selDay   = value ? parseInt(value.split('-')[2]) : null;
  const selMonth = value ? parseInt(value.split('-')[1]) - 1 : null;
  const selYear  = value ? parseInt(value.split('-')[0]) : null;
  const isSelected = (d) => d === selDay && calMonth === selMonth && calYear === selYear;

  const displayVal = value
    ? (() => { const [y,m,d] = value.split('-'); return `${d}-${m}-${y}`; })()
    : '';

  const years = Array.from({ length: 16 }, (_, i) => 2019 + i);
  const yearListRef    = useRef(null);
  const yearThumbRef   = useRef(null);
  const yearDragging   = useRef(false);
  const yearDragStartY = useRef(0);
  const yearScrollStart= useRef(0);

  // Auto-scroll to selected year when year view opens
  useEffect(() => {
    if (viewMode === 'year' && yearListRef.current) {
      const el = yearListRef.current;
      const selected = el.querySelector('[data-selected="true"]');
      if (selected) {
        el.scrollTop = selected.offsetTop - el.clientHeight / 2 + selected.clientHeight / 2;
      }
      updateYearThumb();
    }
  }, [viewMode]);

  const updateYearThumb = () => {
    const el    = yearListRef.current;
    const thumb = yearThumbRef.current;
    if (!el || !thumb) return;
    const ratio      = el.clientHeight / el.scrollHeight;
    const thumbH     = Math.max(30, el.clientHeight * ratio);
    const thumbTop   = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * (el.clientHeight - thumbH);
    thumb.style.height = `${thumbH}px`;
    thumb.style.top    = `${thumbTop}px`;
    thumb.style.opacity = el.scrollHeight > el.clientHeight ? '1' : '0';
  };

  const onYearThumbMouseDown = (e) => {
    e.preventDefault();
    yearDragging.current   = true;
    yearDragStartY.current = e.clientY;
    yearScrollStart.current = yearListRef.current.scrollTop;
    const onMove = (ev) => {
      if (!yearDragging.current) return;
      const el     = yearListRef.current;
      const thumb  = yearThumbRef.current;
      if (!el || !thumb) return;
      const ratio  = el.clientHeight / el.scrollHeight;
      const thumbH = Math.max(30, el.clientHeight * ratio);
      const delta  = ev.clientY - yearDragStartY.current;
      el.scrollTop = yearScrollStart.current + delta / (el.clientHeight - thumbH) * (el.scrollHeight - el.clientHeight);
      updateYearThumb();
    };
    const onUp = () => { yearDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleToggle = () => {
    if (viewOnly) return;
    const newOpen = !open;
    setOpen(newOpen);
    onOpenChange && onOpenChange(newOpen);
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange && onOpenChange(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const inTrigger  = triggerRef.current  && triggerRef.current.contains(e.target);
      const inCalendar = calendarRef.current && calendarRef.current.contains(e.target);
      if (!inTrigger && !inCalendar) {
        setOpen(false);
        onOpenChange && onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const calendarPortal = open ? ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) { setOpen(false); onOpenChange && onOpenChange(false); } }}
    >
    <div
      ref={calendarRef}
      style={{
        position: 'relative', zIndex: 99999,
        backgroundColor: '#fff', borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
        overflow: 'hidden', width: '268px',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      {/* ── Header ── */}
      <div style={{
        backgroundColor: '#197AFF',
        padding: '10px 16px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: '10px'
      }}>
        <button
          onClick={() => setViewMode(v => v === 'month' ? 'day' : 'month')}
          style={{
            background: '#fff', border: 'none', borderRadius: '8px',
            color: '#1a1a1a', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Poppins', sans-serif", minWidth: '80px', justifyContent: 'center'
          }}
        >
          {viewMode === 'month' ? 'MONTH' : MONTHS[calMonth]}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={viewMode === 'month' ? '6 15 12 9 18 15' : '6 9 12 15 18 9'}/>
          </svg>
        </button>
        <button
          onClick={() => setViewMode(v => v === 'year' ? 'day' : 'year')}
          style={{
            background: '#fff', border: 'none', borderRadius: '8px',
            color: '#1a1a1a', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Poppins', sans-serif", minWidth: '90px', justifyContent: 'center'
          }}
        >
          {viewMode === 'year' ? 'YEAR' : calYear}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={viewMode === 'year' ? '6 15 12 9 18 15' : '6 9 12 15 18 9'}/>
          </svg>
        </button>
      </div>

      {/* ── Body (fixed height so card never resizes) ── */}
      <div style={{ height: '252px', overflow: 'hidden', position: 'relative' }}>

      {/* ── Month picker grid ── */}
      {viewMode === 'month' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '16px 12px', height: '100%', boxSizing: 'border-box', alignContent: 'center' }}>
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => { setCalMonth(i); setViewMode('day'); }}
              style={{
                padding: '10px 4px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                backgroundColor: i === calMonth ? '#197AFF' : 'transparent',
                color: i === calMonth ? '#fff' : '#333',
                fontFamily: "'Poppins', sans-serif"
              }}
            >{m}</button>
          ))}
        </div>
      ) : viewMode === 'year' ? (
        /* ── Year picker list with custom blue scrollbar ── */
        <div style={{ position: 'relative', height: '100%', display: 'flex' }}>
          <div
            ref={yearListRef}
            onScroll={updateYearThumb}
            style={{
              flex: 1, overflowY: 'scroll', overflowX: 'hidden',
              scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}
          >
            <style>{`.sfp-year-list::-webkit-scrollbar{display:none}`}</style>
            <div className="sfp-year-list" style={{ paddingRight: '0' }}>
            {years.map(y => (
              <div
                key={y}
                data-selected={y === calYear}
                onClick={() => { setCalYear(y); setViewMode('day'); }}
                style={{
                  padding: '11px 20px', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.95rem', textAlign: 'center',
                  fontFamily: "'Poppins', sans-serif",
                  backgroundColor: y === calYear ? '#197AFF' : 'transparent',
                  color: y === calYear ? '#fff' : '#333',
                }}
              >{y}</div>
            ))}
            </div>
          </div>
          {/* Custom blue volume-bar scrollbar */}
          <div style={{ width: '8px', background: '#e8eef7', borderRadius: '4px', margin: '6px 4px', position: 'relative', flexShrink: 0 }}>
            <div
              ref={yearThumbRef}
              onMouseDown={onYearThumbMouseDown}
              style={{
                position: 'absolute', left: 0, right: 0,
                background: '#197AFF', borderRadius: '4px',
                cursor: 'grab', minHeight: '30px', top: 0
              }}
            />
          </div>
        </div>
      ) : (
        /* ── Day picker ── */
        <div style={{ padding: '8px 10px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', color: '#888', fontWeight: 700, padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstWeekDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const sel = isSelected(day);
              return (
                <button
                  key={day}
                  onClick={() => {
                    const mm = String(calMonth + 1).padStart(2, '0');
                    const dd = String(day).padStart(2, '0');
                    onChange(`${calYear}-${mm}-${dd}`);
                    handleClose();
                  }}
                  style={{
                    textAlign: 'center', padding: '5px 0', borderRadius: '50%',
                    border: 'none', cursor: 'pointer', fontSize: '0.95rem',
                    fontWeight: sel ? 700 : 400,
                    backgroundColor: sel ? '#197AFF' : 'transparent',
                    color: sel ? '#fff' : '#333',
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >{day}</button>
              );
            })}
          </div>
        </div>
      )}

      </div>{/* end fixed-height body */}
    </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {/* Trigger field */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          border: hovered ? '1px solid #2085f6' : '1px solid #dde6f4',
          boxShadow: hovered ? '0 0 0 3px rgba(32,133,246,0.2)' : 'none',
          borderRadius: '8px',
          padding: '0.9rem 0.9rem', cursor: 'pointer', backgroundColor: '#f9fbff',
          fontSize: '0.95rem', color: displayVal ? '#333' : '#888',
          userSelect: 'none', boxSizing: 'border-box', width: '100%',
          transition: 'border-color 0.3s, box-shadow 0.3s'
        }}
      >
        <span style={{ flex: 1 }}>{displayVal || 'Date'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8"  y1="2" x2="8"  y2="6"/>
          <line x1="3"  y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      {calendarPortal}
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
  const [rating, setRating]           = useState(4);
  const [hoverRating, setHoverRating] = useState(0);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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
        <div style={{ padding: '12px 20px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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

          {/* AI Integration + Overall Assessment two-column row */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '14px' }}>

            {/* Left column: AI toggle + Difficulty + Date */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* AI Integration row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>AI - Integration :</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.4rem', backgroundColor: '#f9fbff', borderRadius: '8px', border: '1px solid #dde6f4', height: '53.6px', boxSizing: 'border-box' }}>
                  <input type="radio" id="sfp-ai-enable" name="sfp-ai" checked={aiEnabled} onChange={() => !viewOnly && setAiEnabled(true)} style={{ display: 'none' }} />
                  <label htmlFor="sfp-ai-enable" style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: aiEnabled ? '#fff' : '#666', backgroundColor: aiEnabled ? '#2085f6' : 'transparent', fontWeight: aiEnabled ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Enable</label>
                  <input type="radio" id="sfp-ai-disable" name="sfp-ai" checked={!aiEnabled} onChange={() => !viewOnly && setAiEnabled(false)} style={{ display: 'none' }} />
                  <label htmlFor="sfp-ai-disable" style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: '6px', cursor: viewOnly ? 'default' : 'pointer', transition: 'all 0.2s ease-in-out', color: !aiEnabled ? '#fff' : '#666', backgroundColor: !aiEnabled ? '#2085f6' : 'transparent', fontWeight: !aiEnabled ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !aiEnabled ? '0 2px 8px rgba(32,133,246,0.3)' : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Disable</label>
                </div>
              </div>

              {/* Difficulty Level + Date picker row */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Difficulty dropdown */}
                <div style={{ position: 'relative', flex: 1 }}>
                  <select
                    className="sfp-select"
                    value={difficulty}
                    onChange={e => !viewOnly && setDifficulty(e.target.value)}
                    disabled={viewOnly}
                    style={{ color: difficulty ? '#333' : '#888', cursor: viewOnly ? 'default' : 'pointer' }}
                  >
                    <option value="" disabled>Select Difficulty Level</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="hardcore">Hardcore</option>
                  </select>
                  <span style={{
                    position: 'absolute', right: '10px', top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </div>

                {/* Date picker */}
                <StudentFeedbackDatePicker value={selectedDate} onChange={viewOnly ? () => {} : setSelectedDate} viewOnly={viewOnly} onOpenChange={setDatePickerOpen} />
              </div>
            </div>

            {/* Right column: Overall Assessment + Stars */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minWidth: '158px' }}>
              <div style={{
                backgroundColor: '#4A5BB3',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.95rem',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                Overall Assessment
              </div>
              <div style={{ display: 'flex', gap: '4px', paddingLeft: '2px' }}>
                {[1,2,3,4,5].map(star => (
                  <span
                    key={star}
                    style={{ cursor: viewOnly ? 'default' : 'pointer', fontSize: '1.6rem' }}
                    onMouseEnter={() => !viewOnly && setHoverRating(star)}
                    onMouseLeave={() => !viewOnly && setHoverRating(0)}
                    onClick={() => !viewOnly && setRating(star)}
                  >
                    {(hoverRating || rating) >= star
                      ? <FaStar color="#FFE817" />
                      : <FaRegStar color="#ccc" />}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback + Suggestion two-column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Feedback :</div>
              <SFPScrollTextarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                readOnly={viewOnly}
                height={110}
              />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Suggestion :</div>
              <SFPScrollTextarea
                value={suggestion}
                onChange={e => setSuggestion(e.target.value)}
                readOnly={viewOnly}
                height={110}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '14px 24px 20px' }}>
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
export const generateRounds = (app) => {
  // Check if student is Absent - if any round is Absent, mark all as Absent
  const hasAbsent = app?.rounds?.some(r => r.status === 'Absent');
  
  // If roundDetails exist, use them as the base and merge with student rounds
  if (app?.roundDetails && app.roundDetails.length > 0) {
    return app.roundDetails.map((roundName, index) => {
      // Find corresponding student round by name or round number
      const studentRound = app.rounds?.find(
        r => r.name === roundName || 
             r.roundName === roundName || 
             r.roundNumber === (index + 1)
      );
      
      // If student is absent, mark all rounds as Absent
      const status = hasAbsent ? "Absent" : (studentRound?.status || "Pending");
      
      return {
        name: roundName || `Round ${index + 1}`,
        status: status,
        icon: status === "Passed" 
          ? <FaCheckCircle color="#197AFF" size={28} />
          : status === "Failed"
          ? <FaTimes color="#D23B42" size={28} />
          : status === "Absent"
          ? <FaExclamationCircle color="#FA7B20" size={28} />
          : <FaExclamationCircle color="#949494" size={28} />,
        statusColor: status === "Passed" ? "#197AFF" : 
                     status === "Failed" ? "#D23B42" :
                     status === "Absent" ? "#FA7B20" : "#717070",
        statusText: status
      };
    });
  }
  
  // Fallback: If only student rounds exist without roundDetails
  if (app?.rounds && app.rounds.length > 0) {
    // Check if any round has Absent status
    const hasAbsent = app.rounds.some(r => r.status === 'Absent');
    
    return app.rounds.map(round => {
      const status = hasAbsent ? "Absent" : round.status;
      
      return {
        name: round.name || round.roundName || `Round ${round.roundNumber}`,
        status: status,
        icon: status === "Passed" 
          ? <FaCheckCircle color="#197AFF" size={28} />
          : status === "Failed"
          ? <FaTimes color="#D23B42" size={28} />
          : status === "Absent"
          ? <FaExclamationCircle color="#FA7B20" size={28} />
          : <FaExclamationCircle color="#949494" size={28} />,
        statusColor: status === "Passed" ? "#197AFF" : 
                     status === "Failed" ? "#D23B42" :
                     status === "Absent" ? "#FA7B20" : "#717070",
        statusText: status || "Pending"
      };
    });
  }
  
  return []; // Return empty array if no rounds data
};

export const getOverallStatus = (app) => {
  const rounds = generateRounds(app);
  const hasAbsent = rounds.some(r => r.status === "Absent");
  const hasFailed = rounds.some(r => r.status === "Failed");
  const passedCount = rounds.filter(r => r.status === "Passed").length;
  const totalRounds = app?.totalRounds || app?.roundDetails?.length || rounds.length;
  const allPassed = passedCount === totalRounds && totalRounds > 0;

  if (hasAbsent) {
    return { status: "Absent", color: "#FA7B20" };
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
  console.log('PopUpPending received app:', app);
  console.log('App rounds:', app?.rounds);
  console.log('App roundDetails:', app?.roundDetails);
  
  const rounds = generateRounds(app);
  console.log('Generated rounds:', rounds);

  const { status: overallStatus, color: overallStatusColor } = getOverallStatus(app);
  const [selectedRole, setSelectedRole] = useState('Student');
  const [showAdminFeedback, setShowAdminFeedback] = useState(false);
  const [adminFeedbackRoundPassed, setAdminFeedbackRoundPassed] = useState(false);
  const [showStudentFeedback, setShowStudentFeedback] = useState(false);
  const [selectedRoundName, setSelectedRoundName] = useState('');
  const [feedbackViewMode, setFeedbackViewMode] = useState('edit'); // 'edit' | 'view'

  console.log('PopUpPending Status analysis:', { overallStatus });

  // Get total rounds from roundDetails or rounds array
  const displayTotalRounds = app?.totalRounds || app?.roundDetails?.length || rounds.length || 'N/A';

  return (
    <>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "28px", borderRadius: 16, boxShadow: "0 4px 24px #e9e6ef", flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Company Info Section */}
            <div style={{ marginBottom: 20, padding: "16px", background: "#f6f7fa", borderRadius: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.95rem' }}>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Company: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>{app?.company || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Job Role: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>{app?.jobRole || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Total Rounds: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>{displayTotalRounds}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Drive Date: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>
                    {app?.startDate && app?.endDate 
                      ? `${formatDate(app.startDate)} to ${formatDate(app.endDate)}` 
                      : app?.startDate 
                      ? formatDate(app.startDate) 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: 23, color: "#888" }}>Overall Status: </span>
                <span style={{ 
                  fontSize: 25, 
                  color: overallStatusColor, 
                  fontWeight: 700,
                  padding: '4px 16px',
                  borderRadius: '8px',
                  background: `${overallStatusColor}15`
                }}>
                  {overallStatus}
                </span>
              </div>
              <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: "8px 32px", fontWeight: 600, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 18, marginRight: 6 }}>Back</span><span style={{ fontSize: 22 }}>↩</span>
              </button>
            </div>
            <div style={{ marginTop: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 style={{ fontWeight: 700, fontSize: "1.7rem", marginBottom: 12 }}>Recruitment Journey</h3>
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#555', marginBottom: '0.5rem' }}>Feedback</span>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.4rem',
                    backgroundColor: '#f9fbff',
                    borderRadius: '8px',
                    border: '1px solid #dde6f4',
                    height: '53.6px',
                    boxSizing: 'border-box'
                  }}>
                    {['Student', 'Admin'].map(role => (
                      <button
                        key={role}
                        onClick={(e) => { e.stopPropagation(); setSelectedRole(role); }}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '8px 22px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          color: selectedRole === role ? '#fff' : '#666',
                          backgroundColor: selectedRole === role ? '#2085f6' : 'transparent',
                          fontWeight: selectedRole === role ? 700 : 400,
                          boxShadow: selectedRole === role ? '0 2px 8px rgba(32,133,246,0.3)' : 'none',
                          fontSize: '0.95rem',
                          fontFamily: "'Poppins', sans-serif",
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 28, overflowY: "auto", paddingRight: 4, flexGrow: 1 }} className={scrollStyles['scroll-rounds']}>
                {rounds.length > 0 ? rounds.map((round, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "stretch", background: "#f6f7fa", borderRadius: 16, marginBottom: 18, overflow: 'hidden' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px 18px 16px 24px', gap: '18px' }}>
                      <div style={{ flexShrink: 0 }}>{round.icon}</div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: '#1a1a1a' }}>
                          Round {index + 1} ({round.name})
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
                          Status: <span style={{ color: round.statusColor, fontWeight: 700 }}>{round.statusText}</span>
                        </div>
                      </div>
                    </div>
                    {selectedRole === 'Admin' && (
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isPassed = ['Passed', 'Selected', 'Cleared'].includes(round.statusText);
                            setAdminFeedbackRoundPassed(isPassed);
                            setShowAdminFeedback(true);
                          }}
                          style={{
                            backgroundColor: '#4EA24E', border: 'none', cursor: 'pointer',
                            padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <img src={CopmanyviewFeedbackicon} alt="View" style={{ width: 34, height: 34 }} />
                        </button>
                      </div>
                    )}
                    {selectedRole === 'Student' && (
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoundName(`Round ${index + 1} (${round.name})`);
                            setFeedbackViewMode('edit');
                            setShowStudentFeedback(true);
                          }}
                          style={{
                            backgroundColor: '#197AFF', border: 'none', cursor: 'pointer',
                            padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRight: '1px solid rgba(255,255,255,0.35)'
                          }}
                        >
                          <img src={companyfeedbackicon} alt="Feedback" style={{ width: 34, height: 34, filter: 'brightness(0) invert(1)' }} />
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
                            padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <img src={CopmanyviewFeedbackicon} alt="View" style={{ width: 34, height: 34 }} />
                        </button>
                      </div>
                    )}
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: '#888', padding: '40px', fontSize: '1rem' }}>
                    No round information available
                  </div>
                )}
              </div>
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