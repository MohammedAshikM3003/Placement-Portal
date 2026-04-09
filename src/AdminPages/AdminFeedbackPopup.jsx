import { useState, useRef, useEffect, useCallback } from "react";
import { FaStar, FaRegStar } from 'react-icons/fa';
import mongoDBService from '../services/mongoDBService';

function SFPScrollTextarea({ value, onChange, readOnly, height = 140, placeholder }) {
  const textareaRef = useRef(null);
  const trackRef = useRef(null);
  const [thumb, setThumb] = useState({ height: 30, top: 0 });
  const [showBar, setShowBar] = useState(false);

  const updateThumb = useCallback(() => {
    const el = textareaRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const canScroll = el.scrollHeight > el.clientHeight;
    setShowBar(canScroll);
    if (!canScroll) return;
    const trackH = track.clientHeight;
    const thumbH = Math.max((el.clientHeight / el.scrollHeight) * trackH, 24);
    const maxST = el.scrollHeight - el.clientHeight;
    const maxTT = trackH - thumbH;
    setThumb({ height: thumbH, top: maxST > 0 ? (el.scrollTop / maxST) * maxTT : 0 });
  }, []);

  useEffect(() => {
    updateThumb();
  }, [value, updateThumb]);

  const onThumbMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTop = thumb.top;
    const onMove = (mv) => {
      const el = textareaRef.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const maxTT = track.clientHeight - thumb.height;
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
      style={{
        display: 'flex',
        height,
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        border: '1px solid #e0e0e0'
      }}
      onMouseEnter={updateThumb}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        onScroll={updateThumb}
        placeholder={placeholder}
        style={{
          flex: 1,
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
          padding: '12px',
          resize: 'none',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.88rem',
          color: '#444',
          boxSizing: 'border-box',
          outline: 'none',
          cursor: readOnly ? 'default' : 'text',
          scrollbarWidth: 'none',
          overflowY: 'auto'
        }}
      />
      <div
        ref={trackRef}
        style={{
          width: '6px',
          flexShrink: 0,
          backgroundColor: '#e0e0e0',
          borderRadius: '20px',
          margin: '6px 4px 6px 0',
          position: 'relative'
        }}
      >
        {showBar && (
          <div
            onMouseDown={onThumbMouseDown}
            style={{
              position: 'absolute',
              left: 0,
              width: '100%',
              height: `${thumb.height}px`,
              top: `${thumb.top}px`,
              backgroundColor: '#B5B5B5',
              borderRadius: '20px',
              cursor: 'grab'
            }}
          />
        )}
      </div>
    </div>
  );
}

export const AdminFeedbackPopup = ({
  isPassed,
  onClose,
  onSubmit,
  roundName,
  roundNumber,
  eligibleStudentsCount = 0,
  totalStudentsCount = 0
}) => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(1);
  const [hoverRating, setHoverRating] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const FIELD_HEIGHT = '50px';

  const [isPopupMobile, setIsPopupMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const onResize = () => setIsPopupMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-set today's date when popup opens
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }, []);

  const color = isPassed
    ? {
        header: '#4EA24E',
        badgeBg: '#D9F6D2',
        badgeText: '#2F8F2F',
        primary: '#53B34A',
        primaryShadow: 'rgba(83,179,74,0.3)',
        assessment: '#53B34A',
        focus: '#53B34A',
        focusRing: 'rgba(83,179,74,0.2)',
        thumb: '#53B34A'
      }
    : {
        header: '#5C5C5C',
        badgeBg: '#EBEBEB',
        badgeText: '#4A4A4A',
        primary: '#5C5C5C',
        primaryShadow: 'rgba(92,92,92,0.28)',
        assessment: '#404040',
        focus: '#5C5C5C',
        focusRing: 'rgba(92,92,92,0.2)',
        thumb: '#8A8A8A'
      };

  const resolveFirstCount = (...values) => {
    for (const value of values) {
      const num = Number(value);
      if (Number.isFinite(num) && num >= 0) {
        return Math.trunc(num);
      }
    }
    return 0;
  };

  const roundPassedCount = Array.isArray(window?.adminFeedbackData?.roundData?.students)
    ? window.adminFeedbackData.roundData.students.filter((student) => student?.status === 'Passed').length
    : NaN;

  const visibleEligibleCount = String(
    resolveFirstCount(
      window?.adminFeedbackData?.passedStudentsCount,
      eligibleStudentsCount,
      roundPassedCount,
      totalStudentsCount,
      0
    )
  );

  const renderPassedCountField = () => (
    <div
      style={{
        height: FIELD_HEIGHT,
        border: '1px solid #d6e9d6',
        borderRadius: '12px',
        backgroundColor: '#f8fcf8',
        display: 'grid',
        gridTemplateColumns: '1fr 92px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          color: '#7e8796',
          fontSize: isPopupMobile ? '0.72rem' : '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap'
        }}
      >
        Passed Students
      </div>
      <div
        style={{
          backgroundColor: '#53B34A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          WebkitTextFillColor: '#ffffff',
          fontWeight: 900,
          fontSize: isPopupMobile ? '1.52rem' : '1.45rem',
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          borderLeft: '1px solid rgba(255,255,255,0.38)',
          lineHeight: 1
        }}
      >
        {visibleEligibleCount}
      </div>
    </div>
  );

  const normalizedRoundName = (roundName || '').toString().trim();
  const roundBadgeText = Number.isFinite(Number(roundNumber))
    ? /^round\s+\d+/i.test(normalizedRoundName)
      ? normalizedRoundName
      : `Round ${roundNumber}${normalizedRoundName ? ` (${normalizedRoundName})` : ''}`
    : (normalizedRoundName || 'Round');

  const roundContext = typeof window !== 'undefined' ? window.adminFeedbackData?.roundData || {} : {};

  const handleGenerateFeedback = async () => {
    if (!aiEnabled || isGenerating) return;

    setGenerateError('');
    setIsGenerating(true);

    try {
      const response = await mongoDBService.generateAdminFeedback({
        feedbackType: 'passed',
        roundNumber: Number(roundNumber) || null,
        roundName: normalizedRoundName,
        companyName: roundContext.companyName || '',
        jobRole: roundContext.jobRole || '',
        studentCount: Number(visibleEligibleCount) || 0,
        baseText: feedback
      });

      const generatedText = (response?.feedback || '').toString().trim();
      if (generatedText) {
        setFeedback(generatedText);
        setAiGenerated(true);
      } else {
        setGenerateError('No text was generated. Please try again.');
      }
    } catch (error) {
      setGenerateError(error?.message || 'Failed to generate feedback.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '560px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif",
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            backgroundColor: color.header,
            color: '#fff',
            padding: '1.1rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '0.02em'
          }}
        >
          Admin Feedback
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 16px 0' }}>
          <div
            style={{
              backgroundColor: color.badgeBg,
              color: color.badgeText,
              borderRadius: '20px',
              padding: '6px 32px',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            {roundBadgeText}
          </div>
        </div>

        <div
          style={{
            padding: '12px 20px 8px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            position: 'relative'
          }}
        >
          <style>{``}</style>

          {isPopupMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>AI - Integration :</span>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    gap: '0.35rem',
                    alignItems: 'center',
                    padding: '0.32rem',
                    backgroundColor: '#f9fbff',
                    borderRadius: '8px',
                    border: '1px solid #dde6f4',
                    height: '53.6px',
                    boxSizing: 'border-box',
                    minWidth: 0
                  }}
                >
                  <input type="radio" id="afp-ai-enable-mobile" name="afp-ai-mobile" checked={aiEnabled} onChange={() => setAiEnabled(true)} style={{ display: 'none' }} />
                  <label htmlFor="afp-ai-enable-mobile" style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: aiEnabled ? '#fff' : '#666', backgroundColor: aiEnabled ? color.primary : 'transparent', fontWeight: aiEnabled ? 700 : 400, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: aiEnabled ? `0 2px 8px ${color.primaryShadow}` : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Enable</label>
                  <input type="radio" id="afp-ai-disable-mobile" name="afp-ai-mobile" checked={!aiEnabled} onChange={() => setAiEnabled(false)} style={{ display: 'none' }} />
                  <label htmlFor="afp-ai-disable-mobile" style={{ flex: 1, textAlign: 'center', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: !aiEnabled ? '#fff' : '#666', backgroundColor: !aiEnabled ? color.primary : 'transparent', fontWeight: !aiEnabled ? 700 : 400, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !aiEnabled ? `0 2px 8px ${color.primaryShadow}` : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Disable</label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: color.assessment, color: '#fff', borderRadius: '8px', padding: '0 8px', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', flex: 1, boxSizing: 'border-box', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Overall Assessment
                </div>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'nowrap', flexShrink: 0 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ cursor: 'pointer', fontSize: '2.5rem', lineHeight: 1 }} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
                      {(hoverRating || rating) >= star ? <FaStar color="#FFE817" /> : <FaRegStar color="#ccc" />}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {renderPassedCountField()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    border: '1px solid #def4dd',
                    borderRadius: '8px',
                    height: FIELD_HEIGHT,
                    padding: '0.9rem', backgroundColor: '#f9fff9',
                    fontSize: '0.84rem',
                    lineHeight: 1.2,
                    userSelect: 'none', boxSizing: 'border-box', width: '100%',
                  }}>
                    <span style={{
                      flex: 1,
                      minWidth: 0,
                      fontWeight: 600,
                      color: '#1a1a1a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {selectedDate ? (() => { const [y,m,d] = selectedDate.split('-'); return `${d}-${m}-${y}`; })() : 'DD-MM-YYYY'}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8"  y1="2" x2="8"  y2="6" />
                      <line x1="3"  y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>AI - Integration :</span>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.4rem', backgroundColor: '#f9fbff', borderRadius: '8px', border: '1px solid #dde6f4', height: '53.6px', boxSizing: 'border-box', minWidth: 0 }}>
                    <input type="radio" id="afp-ai-enable" name="afp-ai" checked={aiEnabled} onChange={() => setAiEnabled(true)} style={{ display: 'none' }} />
                    <label htmlFor="afp-ai-enable" style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease-in-out', color: aiEnabled ? '#fff' : '#666', backgroundColor: aiEnabled ? color.primary : 'transparent', fontWeight: aiEnabled ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: aiEnabled ? `0 2px 8px ${color.primaryShadow}` : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Enable</label>
                    <input type="radio" id="afp-ai-disable" name="afp-ai" checked={!aiEnabled} onChange={() => setAiEnabled(false)} style={{ display: 'none' }} />
                    <label htmlFor="afp-ai-disable" style={{ flex: 1, textAlign: 'center', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease-in-out', color: !aiEnabled ? '#fff' : '#666', backgroundColor: !aiEnabled ? color.primary : 'transparent', fontWeight: !aiEnabled ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: !aiEnabled ? `0 2px 8px ${color.primaryShadow}` : 'none', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>Disable</label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {renderPassedCountField()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      border: '1px solid #def4dd',
                      borderRadius: '8px',
                      height: FIELD_HEIGHT,
                      padding: '0.9rem', backgroundColor: '#f9fff9',
                      fontSize: '0.84rem',
                      lineHeight: 1.2,
                      userSelect: 'none', boxSizing: 'border-box', width: '100%',
                    }}>
                      <span style={{
                        flex: 1,
                        minWidth: 0,
                        fontWeight: 600,
                        color: '#1a1a1a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {selectedDate ? (() => { const [y,m,d] = selectedDate.split('-'); return `${d}-${m}-${y}`; })() : 'DD-MM-YYYY'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8"  y1="2" x2="8"  y2="6" />
                        <line x1="3"  y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minWidth: '158px' }}>
                <div style={{ backgroundColor: color.assessment, color: '#fff', borderRadius: '8px', padding: '0 14px', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', width: '100%', boxSizing: 'border-box', height: '53.6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Overall Assessment
                </div>
                <div style={{ display: 'flex', gap: '4px', paddingLeft: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ cursor: 'pointer', fontSize: '2rem' }} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
                      {(hoverRating || rating) >= star ? <FaStar color="#FFE817" /> : <FaRegStar color="#ccc" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isPopupMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Feedback :</div>
                <div style={{ position: 'relative' }}>
                  <SFPScrollTextarea value={feedback} onChange={(e) => { setFeedback(e.target.value); setAiGenerated(false); }} readOnly={isGenerating} height={112} placeholder="Write your feedback here..." />
                  {isGenerating && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', zIndex: 2 }}>
                      <div style={{ width: '22px', height: '22px', border: `3px solid ${color.focusRing}`, borderTop: `3px solid ${color.primary}`, borderRadius: '50%', animation: 'afpSpin 0.85s linear infinite' }} />
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#555' }}>Generating feedback...</div>
                      <style>{`@keyframes afpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}
                  {aiEnabled && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '18px', display: 'flex', gap: '6px', zIndex: 1 }}>
                      <button onClick={() => { setFeedback(''); setGenerateError(''); setAiGenerated(false); }} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(239,68,68,0.35)' }}>Clear</button>
                      <button onClick={handleGenerateFeedback} disabled={isGenerating} style={{ backgroundColor: color.primary, opacity: isGenerating ? 0.7 : 1, color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: `0 2px 6px ${color.primaryShadow}` }}>Generate</button>
                    </div>
                  )}
                </div>
                {generateError && <div style={{ color: '#d32f2f', fontSize: '0.78rem', marginTop: '6px' }}>{generateError}</div>}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Feedback :</div>
                <div style={{ position: 'relative' }}>
                  <SFPScrollTextarea value={feedback} onChange={(e) => { setFeedback(e.target.value); setAiGenerated(false); }} readOnly={isGenerating} height={158} placeholder="Write your feedback here..." />
                  {isGenerating && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.78)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', zIndex: 2 }}>
                      <div style={{ width: '24px', height: '24px', border: `3px solid ${color.focusRing}`, borderTop: `3px solid ${color.primary}`, borderRadius: '50%', animation: 'afpSpin 0.85s linear infinite' }} />
                      <div style={{ marginTop: '9px', fontSize: '0.82rem', fontWeight: 600, color: '#555' }}>Generating feedback...</div>
                      <style>{`@keyframes afpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}
                  {aiEnabled && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '18px', display: 'flex', gap: '6px', zIndex: 1 }}>
                      <button onClick={() => { setFeedback(''); setGenerateError(''); setAiGenerated(false); }} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: '0 2px 6px rgba(239,68,68,0.35)' }}>Clear</button>
                      <button onClick={handleGenerateFeedback} disabled={isGenerating} style={{ backgroundColor: color.primary, opacity: isGenerating ? 0.7 : 1, color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", boxShadow: `0 2px 6px ${color.primaryShadow}` }}>Generate</button>
                    </div>
                  )}
                </div>
                {generateError && <div style={{ color: '#d32f2f', fontSize: '0.78rem', marginTop: '6px' }}>{generateError}</div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: isPopupMobile ? '14px 24px calc(env(safe-area-inset-bottom, 20px) + 25px)' : '14px 24px 20px', background: '#fff', borderTop: '1px solid #eef1f7' }}>
          <button onClick={onClose} disabled={isGenerating} style={{ backgroundColor: '#7C7C7C', opacity: isGenerating ? 0.6 : 1, color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 40px', fontWeight: 600, fontSize: '1rem', cursor: isGenerating ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif" }}>Discard</button>
          <button onClick={() => (onSubmit ? onSubmit({ feedback, selectedDate, rating, aiEnabled, aiGenerated }) : onClose())} disabled={isGenerating || !feedback.trim()} style={{ backgroundColor: color.primary, opacity: (isGenerating || !feedback.trim()) ? 0.7 : 1, color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 40px', fontWeight: 600, fontSize: '1rem', cursor: (isGenerating || !feedback.trim()) ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif" }}>Submit</button>
        </div>
      </div>
    </div>
  );
};
