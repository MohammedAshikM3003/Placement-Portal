/**
 * DOBDatePicker - Date of Birth Date Picker Component
 *
 * A custom date picker component with day, month, and year selection views.
 * Features:
 * - Three view modes: day, month, and year selection
 * - Portal-based overlay for better positioning
 * - Custom scrollbar for year selection
 * - Keyboard and mouse interactions
 * - Highlights today's date and selected date
 * - Responsive design with hover states
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

function DOBDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('day');
  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [hovered, setHovered] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [hoveredYear, setHoveredYear] = useState(null);
  const [hoveredMonthBtn, setHoveredMonthBtn] = useState(false);
  const [hoveredYearBtn, setHoveredYearBtn] = useState(false);
  const triggerRef  = useRef(null);
  const calendarRef = useRef(null);

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekDay = new Date(calYear, calMonth, 1).getDay();

  const selDay   = value ? parseInt(value.split('-')[2]) : null;
  const selMonth = value ? parseInt(value.split('-')[1]) - 1 : null;
  const selYear  = value ? parseInt(value.split('-')[0]) : null;
  const isSelected = (d) => d === selDay && calMonth === selMonth && calYear === selYear;
  const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const displayVal = value
    ? (() => { const [y,m,d] = value.split('-'); return `${d}-${m}-${y}`; })()
    : '';

  const currentYearForPicker = new Date().getFullYear();
  const years = Array.from({ length: currentYearForPicker - 2000 + 1 }, (_, i) => 2000 + i);
  const yearListRef    = useRef(null);
  const yearThumbRef   = useRef(null);
  const yearDragging   = useRef(false);
  const yearDragStartY = useRef(0);
  const yearScrollStart= useRef(0);

  useEffect(() => {
    if (viewMode === 'year' && yearListRef.current) {
      const el = yearListRef.current;
      const selected = el.querySelector('[data-selected="true"]');
      if (selected) {
        el.scrollTop = selected.offsetTop - el.clientHeight / 2 + selected.clientHeight / 2;
      }
      updateYearThumb();
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateYearThumb = () => {
    const el    = yearListRef.current;
    const thumb = yearThumbRef.current;
    if (!el || !thumb) return;
    const ratio    = el.clientHeight / el.scrollHeight;
    const thumbH   = Math.max(30, el.clientHeight * ratio);
    const thumbTop = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * (el.clientHeight - thumbH);
    thumb.style.height  = `${thumbH}px`;
    thumb.style.top     = `${thumbTop}px`;
    thumb.style.opacity = el.scrollHeight > el.clientHeight ? '1' : '0';
  };

  const onYearThumbMouseDown = (e) => {
    e.preventDefault();
    yearDragging.current    = true;
    yearDragStartY.current  = e.clientY;
    yearScrollStart.current = yearListRef.current.scrollTop;
    const onMove = (ev) => {
      if (!yearDragging.current) return;
      const el    = yearListRef.current;
      const thumb = yearThumbRef.current;
      if (!el || !thumb) return;
      const ratio  = el.clientHeight / el.scrollHeight;
      const thumbH = Math.max(30, el.clientHeight * ratio);
      const delta  = ev.clientY - yearDragStartY.current;
      el.scrollTop = yearScrollStart.current + delta / (el.clientHeight - thumbH) * (el.scrollHeight - el.clientHeight);
      updateYearThumb();
    };
    const onUp = () => {
      yearDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleToggle = () => setOpen(o => !o);
  const handleClose  = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const inTrigger  = triggerRef.current  && triggerRef.current.contains(e.target);
      const inCalendar = calendarRef.current && calendarRef.current.contains(e.target);
      if (!inTrigger && !inCalendar) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const calendarPortal = open ? ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        ref={calendarRef}
        style={{
          position: 'relative', zIndex: 99999,
          backgroundColor: '#fff', borderRadius: '14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
          overflow: 'hidden', width: 'min(320px, 90vw)',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        {/* Header */}
        <div style={{
          backgroundColor: '#197AFF',
          padding: '12px 18px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: '40px'
        }}>
          <button
            onClick={() => setViewMode(v => v === 'month' ? 'day' : 'month')}
            onMouseEnter={() => setHoveredMonthBtn(true)}
            onMouseLeave={() => setHoveredMonthBtn(false)}
            style={{
              background: hoveredMonthBtn ? '#e8eef7' : '#fff', border: 'none', borderRadius: '8px',
              color: '#1a1a1a', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: "'Poppins', sans-serif", minWidth: '80px', justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
          >
            {viewMode === 'month' ? 'MON' : MONTHS[calMonth]}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={viewMode === 'month' ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
            </svg>
          </button>
          <button
            onClick={() => setViewMode(v => v === 'year' ? 'day' : 'year')}
            onMouseEnter={() => setHoveredYearBtn(true)}
            onMouseLeave={() => setHoveredYearBtn(false)}
            style={{
              background: hoveredYearBtn ? '#e8eef7' : '#fff', border: 'none', borderRadius: '8px',
              color: '#1a1a1a', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: "'Poppins', sans-serif", minWidth: '90px', justifyContent: 'center',
              transition: 'background-color 0.15s'
            }}
          >
            {viewMode === 'year' ? 'YEAR' : calYear}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={viewMode === 'year' ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
            </svg>
          </button>
        </div>

        {/* Body – fixed height so card never resizes */}
        <div style={{ height: '288px', overflow: 'hidden', position: 'relative' }}>

          {viewMode === 'month' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', padding: '18px 16px', height: '100%', boxSizing: 'border-box', alignContent: 'center' }}>
              {MONTHS.map((m, i) => {
                const isSel = i === calMonth;
                const isHov = hoveredMonth === i;
                return (
                <button
                  key={m}
                  onClick={() => { setCalMonth(i); setViewMode('day'); }}
                  onMouseEnter={() => setHoveredMonth(i)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  style={{
                    padding: '12px 6px', borderRadius: '8px', border: 'none',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                    backgroundColor: isSel ? '#197AFF' : isHov ? '#e8eef7' : 'transparent',
                    color: isSel ? '#fff' : '#333',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'background-color 0.15s'
                  }}
                >{m}</button>
                );
              })}
            </div>
          ) : viewMode === 'year' ? (
            <div style={{ position: 'relative', height: '100%', display: 'flex' }}>
              <div
                ref={yearListRef}
                onScroll={updateYearThumb}
                style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`.dob-year-list::-webkit-scrollbar{display:none}`}</style>
                <div className="dob-year-list">
                  {years.map(y => {
                    const isSel = y === calYear;
                    const isHov = hoveredYear === y;
                    return (
                    <div
                      key={y}
                      data-selected={y === calYear}
                      onClick={() => { setCalYear(y); setViewMode('day'); }}
                      onMouseEnter={() => setHoveredYear(y)}
                      onMouseLeave={() => setHoveredYear(null)}
                      style={{
                        padding: '12px 20px', cursor: 'pointer',
                        fontWeight: 700, fontSize: '1rem', textAlign: 'center',
                        fontFamily: "'Poppins', sans-serif",
                        backgroundColor: isSel ? '#197AFF' : isHov ? '#e8eef7' : 'transparent',
                        color: isSel ? '#fff' : '#333',
                        transition: 'background-color 0.15s'
                      }}
                    >{y}</div>
                    );
                  })}
                </div>
              </div>
              {/* Custom scrollbar thumb */}
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
            /* Day picker */
            <div style={{ padding: '10px 14px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#888', fontWeight: 700, padding: '4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                {Array.from({ length: firstWeekDay }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const sel = isSelected(day);
                  const tod = isToday(day);
                  const isHov = hoveredDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const mm = String(calMonth + 1).padStart(2, '0');
                        const dd = String(day).padStart(2, '0');
                        onChange(`${calYear}-${mm}-${dd}`);
                        handleClose();
                      }}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        textAlign: 'center', padding: '7px 0', borderRadius: '50%',
                        border: tod && !sel ? '2px solid #197AFF' : 'none',
                        cursor: 'pointer', fontSize: '0.95rem',
                        fontWeight: sel || tod ? 700 : 500,
                        backgroundColor: sel ? '#197AFF' : isHov ? '#e8eef7' : 'transparent',
                        color: sel ? '#fff' : tod ? '#197AFF' : '#333',
                        fontFamily: "'Poppins', sans-serif",
                        transition: 'background-color 0.15s'
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
    <div style={{ position: 'relative' }}>
      {/* Trigger field */}
      <div
        ref={triggerRef}
        data-dob-field="true"
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          border: hovered ? '1px solid #2085f6' : '1px solid #dde6f4',
          boxShadow: hovered ? '0 0 0 3px rgba(32,133,246,0.2)' : 'none',
          borderRadius: '8px',
          padding: '0.9rem', cursor: 'pointer', backgroundColor: '#f9fbff',
          fontSize: '0.95rem', color: displayVal ? '#333' : '#9aa7c2',
          userSelect: 'none', boxSizing: 'border-box', width: '100%',
          transition: 'border-color 0.3s, box-shadow 0.3s'
        }}
      >
        <span style={{ flex: 1 }}>{displayVal || 'DD-MM-YYYY'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8"  y1="2" x2="8"  y2="6" />
          <line x1="3"  y1="10" x2="21" y2="10" />
        </svg>
      </div>
      {calendarPortal}
    </div>
  );
}

export default DOBDatePicker;
