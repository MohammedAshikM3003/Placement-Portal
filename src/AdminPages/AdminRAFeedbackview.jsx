import { useState, useRef, useEffect, useCallback } from "react";
import { FaStar, FaRegStar } from 'react-icons/fa';

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

export const AdminRAFeedbackview = ({
  roundName,
  onClose,
  studentData = {}
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(1);
  const [hoverRating, setHoverRating] = useState(0);
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

  const color = {
    header: '#4EA24E',
    badgeBg: '#E8F5E8',
    badgeText: '#2a5a2a',
    primary: '#4EA24E',
    primaryShadow: 'rgba(78,162,78,0.3)',
    assessment: '#4EA24E',
    focus: '#4EA24E',
    focusRing: 'rgba(78,162,78,0.2)',
    thumb: '#4EA24E'
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
          Feedback View
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
            {roundName || 'HR - Round'}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <div style={{ backgroundColor: color.badgeBg, color: color.badgeText, borderRadius: '999px', padding: '6px 14px', fontWeight: 700, fontSize: '0.92rem' }}>
                {studentData.Name || 'Student Feedback'}
              </div>
              {studentData.RegNo && (
                <div style={{ backgroundColor: '#f3f6fb', color: '#4f5b6b', borderRadius: '999px', padding: '6px 14px', fontWeight: 600, fontSize: '0.86rem' }}>
                  Reg No: {studentData.RegNo}
                </div>
              )}
              {studentData.Result && (
                <div style={{ backgroundColor: '#f3f6fb', color: '#4f5b6b', borderRadius: '999px', padding: '6px 14px', fontWeight: 600, fontSize: '0.86rem' }}>
                  Result: {studentData.Result}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'nowrap' }}>
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #def4dd', borderRadius: '8px', height: FIELD_HEIGHT, padding: '0 0.9rem', backgroundColor: '#f9fff9', fontSize: '0.84rem', lineHeight: 1.2, userSelect: 'none', boxSizing: 'border-box', width: '100%' }}>
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedDate ? (() => { const [y, m, d] = selectedDate.split('-'); return `${d}-${m}-${y}`; })() : 'DD-MM-YYYY'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>

              <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ backgroundColor: color.assessment, color: '#fff', borderRadius: '8px', padding: '0 14px', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', height: FIELD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Overall Assessment
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ cursor: 'pointer', fontSize: isPopupMobile ? '2.2rem' : '2.05rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
                      {(hoverRating || rating) >= star ? <FaStar color="#FFE817" /> : <FaRegStar color="#ccc" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isPopupMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Feedback :</div>
                <div style={{ position: 'relative' }}>
                  <SFPScrollTextarea value={feedback} onChange={(e) => setFeedback(e.target.value)} readOnly={false} height={112} placeholder="Write your feedback here..." />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>Feedback :</div>
                <div style={{ position: 'relative' }}>
                  <SFPScrollTextarea value={feedback} onChange={(e) => setFeedback(e.target.value)} readOnly={false} height={158} placeholder="Write your feedback here..." />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: isPopupMobile ? '14px 24px calc(env(safe-area-inset-bottom, 20px) + 25px)' : '14px 24px 20px', background: '#fff', borderTop: '1px solid #eef1f7' }}>
          <button onClick={onClose} style={{ backgroundColor: '#7C7C7C', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 40px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Close</button>
          <button onClick={onClose} style={{ backgroundColor: color.primary, color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 40px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default AdminRAFeedbackview;
