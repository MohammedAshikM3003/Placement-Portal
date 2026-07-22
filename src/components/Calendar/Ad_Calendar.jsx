/**
 * Ad_Calendar - Admin Themed Calendar Component
 *
 * A custom date picker component with admin theme colors (green).
 * Features:
 * - Three view modes: day, month, and year selection
 * - Portal-based overlay for better positioning
 * - Custom scrollbar for year selection
 * - Keyboard and mouse interactions
 * - Highlights today's date and selected date
 * - Admin theme: #4EA24E
 */

import React, { useState, useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import ReactDOM from 'react-dom';

const Ad_Calendar = forwardRef(function Ad_Calendar({
  value,
  onChange,
  disabled = false,
  maxDate = null,
  enabledDates = null,
  triggerClassName = '',
  triggerHighlighted = false,
  variant = 'default',
  style = {},
  themeColor = '#4EA24E',
  hoverColor = '#e8f5e8'
}, ref) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('day');
  const today = useMemo(() => new Date(), []);
  const maxDateValue = useMemo(() => (maxDate ? new Date(maxDate) : null), [maxDate]);
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

  useImperativeHandle(ref, () => triggerRef.current);

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

  const currentYearForPicker = (maxDateValue || today).getFullYear();
  const years = Array.from({ length: currentYearForPicker - 2000 + 1 }, (_, i) => 2000 + i);
  const yearListRef    = useRef(null);

  useEffect(() => {
    if (viewMode === 'year' && yearListRef.current) {
      const el = yearListRef.current;
      const selected = el.querySelector('[data-selected="true"]');
      if (selected) {
        el.scrollTop = selected.offsetTop - el.clientHeight / 2 + selected.clientHeight / 2;
      }
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = () => {
    if (disabled) return;
    setOpen(o => !o);
  };
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
        {/* Header - Admin Green Theme */}
        <div style={{
          backgroundColor: themeColor,
          padding: '12px 18px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: '40px'
        }}>
          <button
            onClick={() => setViewMode(v => v === 'month' ? 'day' : 'month')}
            onMouseEnter={() => setHoveredMonthBtn(true)}
            onMouseLeave={() => setHoveredMonthBtn(false)}
            style={{
              background: hoveredMonthBtn ? hoverColor : '#fff', border: 'none', borderRadius: '8px',
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
              background: hoveredYearBtn ? hoverColor : '#fff', border: 'none', borderRadius: '8px',
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
                const isDisabled = maxDateValue && calYear === maxDateValue.getFullYear() && i > maxDateValue.getMonth();
                return (
                <button
                  key={m}
                  onClick={() => { if (isDisabled) return; setCalMonth(i); setViewMode('day'); }}
                  onMouseEnter={() => setHoveredMonth(i)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  disabled={isDisabled}
                  style={{
                    padding: '12px 6px', borderRadius: '8px', border: 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem',
                    backgroundColor: isSel ? themeColor : isHov ? hoverColor : 'transparent',
                    color: isSel ? '#fff' : isDisabled ? '#b7b7b7' : '#333',
                    opacity: isDisabled ? 0.5 : 1,
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
                style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
              >
                <div className="ad-year-list">
                  {years.map(y => {
                    const isSel = y === calYear;
                    const isHov = hoveredYear === y;
                    const isDisabled = maxDateValue && y > maxDateValue.getFullYear();
                    return (
                    <div
                      key={y}
                      data-selected={y === calYear}
                      onClick={() => { if (isDisabled) return; setCalYear(y); setViewMode('day'); }}
                      onMouseEnter={() => setHoveredYear(y)}
                      onMouseLeave={() => setHoveredYear(null)}
                      style={{
                        padding: '12px 20px', cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: '1rem', textAlign: 'center',
                        fontFamily: "'Poppins', sans-serif",
                        backgroundColor: isSel ? themeColor : isHov ? hoverColor : 'transparent',
                        color: isSel ? '#fff' : isDisabled ? '#b7b7b7' : '#333',
                        opacity: isDisabled ? 0.5 : 1,
                        transition: 'background-color 0.15s'
                      }}
                    >{y}</div>
                    );
                  })}
                </div>
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
                  const dateObj = new Date(calYear, calMonth, day);
                  const yearStr = calYear;
                  const monthStr = String(calMonth + 1).padStart(2, '0');
                  const dayStr = String(day).padStart(2, '0');
                  const ymdStr = `${yearStr}-${monthStr}-${dayStr}`;
                  
                  let isDisabled = maxDateValue && dateObj > maxDateValue;
                  if (!isDisabled && enabledDates) {
                    isDisabled = !enabledDates.includes(ymdStr);
                  }
                  return (
                    <button
                      key={day}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        const mm = String(calMonth + 1).padStart(2, '0');
                        const dd = String(day).padStart(2, '0');
                        onChange(`${calYear}-${mm}-${dd}`);
                        handleClose();
                      }}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        textAlign: 'center', padding: '7px 0', borderRadius: '50%',
                        border: 'none',
                        cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: '0.95rem',
                        fontWeight: sel || tod ? 700 : 500,
                        backgroundColor: sel ? themeColor : isHov ? hoverColor : tod ? hoverColor : 'transparent',
                        color: sel ? '#fff' : isDisabled ? '#b7b7b7' : tod ? themeColor : '#333',
                        opacity: isDisabled ? 0.45 : 1,
                        fontFamily: "'Poppins', sans-serif",
                        transition: 'background-color 0.15s',
                        position: 'relative'
                      }}
                    >
                      {day}
                      {tod && !sel && (
                        <span style={{
                          position: 'absolute',
                          bottom: '2px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: themeColor
                        }} />
                      )}
                    </button>
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

  const isFilterVariant = variant === 'filter';

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger field - Admin Green Theme */}
      <div
        ref={triggerRef}
        data-ad-calendar-field="true"
        className={triggerClassName}
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          border: isFilterVariant 
            ? (open || (hovered && !disabled) ? `3px solid ${themeColor}` : '3px solid #ccc')
            : (triggerHighlighted ? `2px solid ${themeColor === '#4EA24E' ? '#2E7D32' : '#b32d34'}` : hovered && !disabled ? `1px solid ${themeColor}` : `1px solid ${themeColor === '#4EA24E' ? '#def4dd' : '#fbebeb'}`),
          boxShadow: isFilterVariant
            ? 'none'
            : (triggerHighlighted ? (themeColor === '#4EA24E' ? '0 0 0 3px rgba(78,162,78,0.18), 0 0 14px rgba(78,162,78,0.28)' : '0 0 0 3px rgba(210,59,66,0.18), 0 0 14px rgba(210,59,66,0.28)') : hovered && !disabled ? (themeColor === '#4EA24E' ? '0 0 0 3px rgba(78,162,78,0.2)' : '0 0 0 3px rgba(210,59,66,0.2)') : 'none'),
          borderRadius: '8px',
          padding: isFilterVariant ? '0px 15px' : '0.9rem',
          height: isFilterVariant ? '45px' : 'auto',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
          fontSize: '0.95rem',
          userSelect: 'none', boxSizing: 'border-box', width: '100%',
          opacity: disabled ? 0.78 : 1,
          transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
          ...style
        }}
      >
        <span style={{
          flex: 1,
          fontWeight: isFilterVariant ? 450 : 600,
          color: displayVal ? '#333' : '#999'
        }}>
          {displayVal || 'DD-MM-YYYY'}
        </span>
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
});

export default Ad_Calendar;
