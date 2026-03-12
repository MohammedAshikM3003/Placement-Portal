import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import certificateService from "../services/certificateService.jsx";
import styles from "./Achievements.module.css";

// ++ NEW: Success Popup Component with Animation ++
const SuccessPopup = ({ onClose }) => (
  <div className={styles['Achievement-popup-container']}>
    <div className={styles['Achievement-popup-header']}>Uploaded!</div>
    <div className={styles['Achievement-popup-body']}>
      <svg className={styles['Achievement-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className={styles['Achievement-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
        <path className={styles['Achievement-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
        Submitted ✓
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Certificate is submitted
      </p>
    </div>
    <div className={styles['Achievement-popup-footer']}>
      <button onClick={onClose} className={styles['Achievement-popup-close-btn']}>
        Close
      </button>
    </div>
  </div>
);

// ++ NEW: Error Popup Component with Animation ++
const ErrorPopup = ({ onClose, errorMessage }) => (
  <div className={styles['Achievement-popup-container']}>
    <div className={styles['Achievement-popup-header']} style={{ backgroundColor: '#D23B42' }}>Upload Failed!</div>
    <div className={styles['Achievement-popup-body']}>
      <svg className={styles['Achievement-error-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className={styles['Achievement-error-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
        <path className={styles['Achievement-error-icon--cross']} fill="none" d="M16 16l20 20M36 16L16 36"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
        Upload Failed ✗
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        {errorMessage || "Certificate upload failed"}
      </p>
    </div>
    <div className={styles['Achievement-popup-footer']}>
      <button onClick={onClose} className={styles['Achievement-popup-close-btn']}>
        Close
      </button>
    </div>
  </div>
);


const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// ── Custom Date Picker (same as PopUpPending.jsx) ──────────────────────────
function AchievementDatePicker({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('day');
  const today = React.useMemo(() => new Date(), []);
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 + 2 }, (_, i) => 2019 + i);
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
    const onUp = () => { yearDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleToggle = () => { if (disabled) return; setOpen(o => !o); };
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
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div ref={calendarRef} style={{ position: 'relative', zIndex: 99999, backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.22)', overflow: 'hidden', width: 'min(320px, 90vw)', fontFamily: "'Poppins', sans-serif" }}>
        {/* Header */}
        <div style={{ backgroundColor: '#197AFF', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
          <button onClick={() => setViewMode(v => v === 'month' ? 'day' : 'month')}
            onMouseEnter={() => setHoveredMonthBtn(true)} onMouseLeave={() => setHoveredMonthBtn(false)}
            style={{ background: hoveredMonthBtn ? '#e8eef7' : '#fff', border: 'none', borderRadius: '8px', color: '#1a1a1a', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Poppins', sans-serif", minWidth: '80px', justifyContent: 'center', transition: 'background-color 0.15s' }}>
            {viewMode === 'month' ? 'MON' : MONTHS[calMonth]}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points={viewMode === 'month' ? '6 15 12 9 18 15' : '6 9 12 15 18 9'}/></svg>
          </button>
          <button onClick={() => setViewMode(v => v === 'year' ? 'day' : 'year')}
            onMouseEnter={() => setHoveredYearBtn(true)} onMouseLeave={() => setHoveredYearBtn(false)}
            style={{ background: hoveredYearBtn ? '#e8eef7' : '#fff', border: 'none', borderRadius: '8px', color: '#1a1a1a', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Poppins', sans-serif", minWidth: '90px', justifyContent: 'center', transition: 'background-color 0.15s' }}>
            {viewMode === 'year' ? 'YEAR' : calYear}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points={viewMode === 'year' ? '6 15 12 9 18 15' : '6 9 12 15 18 9'}/></svg>
          </button>
        </div>
        {/* Body – fixed height */}
        <div style={{ height: '288px', overflow: 'hidden', position: 'relative' }}>
          {viewMode === 'month' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', padding: '18px 16px', height: '100%', boxSizing: 'border-box', alignContent: 'center' }}>
              {MONTHS.map((m, i) => {
                const isSel = i === calMonth;
                const isHov = hoveredMonth === i;
                return (
                  <button key={m} onClick={() => { setCalMonth(i); setViewMode('day'); }}
                    onMouseEnter={() => setHoveredMonth(i)} onMouseLeave={() => setHoveredMonth(null)}
                    style={{ padding: '12px 6px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', backgroundColor: isSel ? '#197AFF' : isHov ? '#e8eef7' : 'transparent', color: isSel ? '#fff' : '#333', fontFamily: "'Poppins', sans-serif", transition: 'background-color 0.15s' }}>{m}</button>
                );
              })}
            </div>
          ) : viewMode === 'year' ? (
            <div style={{ position: 'relative', height: '100%', display: 'flex' }}>
              <div ref={yearListRef} onScroll={updateYearThumb} style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.ach-up-year::-webkit-scrollbar{display:none}`}</style>
                <div className="ach-up-year">
                  {years.map(y => {
                    const isSel = y === calYear;
                    const isHov = hoveredYear === y;
                    return (
                      <div key={y} data-selected={y === calYear} onClick={() => { setCalYear(y); setViewMode('day'); }}
                        onMouseEnter={() => setHoveredYear(y)} onMouseLeave={() => setHoveredYear(null)}
                        style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', textAlign: 'center', fontFamily: "'Poppins', sans-serif", backgroundColor: isSel ? '#197AFF' : isHov ? '#e8eef7' : 'transparent', color: isSel ? '#fff' : '#333', transition: 'background-color 0.15s' }}>{y}</div>
                    );
                  })}
                </div>
              </div>
              <div style={{ width: '8px', background: '#e8eef7', borderRadius: '4px', margin: '6px 4px', position: 'relative', flexShrink: 0 }}>
                <div ref={yearThumbRef} onMouseDown={onYearThumbMouseDown}
                  style={{ position: 'absolute', left: 0, right: 0, background: '#197AFF', borderRadius: '4px', cursor: 'grab', minHeight: '30px', top: 0 }} />
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px 14px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#888', fontWeight: 700, padding: '4px 0' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                {Array.from({ length: firstWeekDay }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1; const sel = isSelected(day); const tod = isToday(day); const isHov = hoveredDay === day;
                  return (
                    <button key={day} onClick={() => { const mm = String(calMonth+1).padStart(2,'0'); const dd = String(day).padStart(2,'0'); onChange(`${calYear}-${mm}-${dd}`); handleClose(); }}
                      onMouseEnter={() => setHoveredDay(day)} onMouseLeave={() => setHoveredDay(null)}
                      style={{ textAlign: 'center', padding: '7px 0', borderRadius: '50%', border: tod && !sel ? '2px solid #197AFF' : 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: sel || tod ? 700 : 500, backgroundColor: sel ? '#197AFF' : isHov ? '#e8eef7' : 'transparent', color: sel ? '#fff' : tod ? '#197AFF' : '#333', fontFamily: "'Poppins', sans-serif", transition: 'background-color 0.15s' }}>{day}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div ref={triggerRef} onClick={handleToggle}
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: hovered ? '1.5px solid #2276fc' : '1.5px solid #bddaed', boxShadow: hovered ? '0 0 6px rgba(34,118,252,0.5)' : 'none', borderRadius: '10px', padding: '12px 16px 12px 13px', cursor: disabled ? 'not-allowed' : 'pointer', backgroundColor: disabled ? '#f5f5f5' : '#f8faff', fontSize: '15.4px', fontFamily: "'Poppins', sans-serif", fontWeight: 500, letterSpacing: '0.03em', color: displayVal ? '#3A4957' : '#aaa', userSelect: 'none', boxSizing: 'border-box', width: '100%', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', opacity: disabled ? 0.6 : 1 }}>
        <span style={{ flex: 1 }}>{displayVal || 'Date'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      {calendarPortal}
    </div>
  );
}

export default function CertificateUpload({ onClose, onUpload }) {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [lastUploaded, setLastUploaded] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [fileType, setFileType] = useState("application/pdf");
  const [fileSize, setFileSize] = useState(0);

  const [formData, setFormData] = useState({
    reg: "",
    name: "",
    year: "",
    semester: "",
    section: "",
    department: "",
    degree: "",
    date: "",
    comp: "",
    prize: "",
  });

  // Auto-populate form with student data
  React.useEffect(() => {
    try {
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (studentData) {
        const normalizedSection = studentData.section || studentData.Section || studentData.sec || studentData.sectionName || "";
        const normalizedDepartment =
          studentData.department ||
          studentData.branch ||
          studentData.dept ||
          studentData.studentDepartment ||
          "";

        const normalizedDegree =
          studentData.degree ||
          studentData.course ||
          studentData.program ||
          "";

        setFormData(prev => ({
          ...prev,
          reg: studentData.regNo || "",
          name: `${studentData.firstName || ""} ${studentData.lastName || ""}`.trim(),
          year: studentData.currentYear || "I", // Use current year from student data
          semester: studentData.currentSemester || "1", // Use current semester from student data
          section: normalizedSection || "",
          department: normalizedDepartment,
          degree: normalizedDegree
        }));
      }
    } catch (error) {
      console.error('Error loading student data for certificate upload:', error);
    }
  }, []);

  // Function to get available semesters based on selected year
  const getAvailableSemesters = (year) => {
    const semesterMap = {
      'I': ['1', '2'],
      'II': ['3', '4'],
      'III': ['5', '6'],
      'IV': ['7', '8']
    };
    return semesterMap[year] || [];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // If year changes, reset semester to first available option
      if (name === 'year') {
        const availableSemesters = getAvailableSemesters(value);
        newData.semester = availableSemesters[0] || '';
      }
      
      return newData;
    });
  };

  const handleDateChange = (dateStr) => {
    setFormData((prev) => ({ ...prev, date: dateStr }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (500KB = 500 * 1024 bytes)
    const maxSize = 500 * 1024; // 500KB in bytes
    const fileSizeKB = (file.size / 1024).toFixed(1);
    
    if (file.type !== "application/pdf") {
      setError("File must be a PDF");
      setFileName("");
      setFileContent("");
      setFileType("application/pdf");
      setFileSize(0);
      return;
    }
    
    if (file.size > maxSize) {
      setError(`File size limit exceeded!

Maximum allowed: 500KB
Your file size: ${fileSizeKB}KB

Please compress your PDF or choose a smaller file.`);
      setFileName("");
      setFileContent("");
      setFileType("application/pdf");
      setFileSize(0);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      // Store raw file for GridFS upload on submit
      setFileContent(file); // Store File object instead of base64
      setError("");
      setFileName(file.name);
      setLastUploaded(formatDate(new Date()));
      setFileType(file.type || "application/pdf");
      setFileSize(file.size || 0);
    } catch (error) {
      console.error('File upload error:', error);
      setError(error.message || "Failed to process file. Please try again.");
      setFileName("");
      setFileContent("");
      setFileType("application/pdf");
      setFileSize(0);
    }
  };

  const handleUploadClick = () => { if (isLoading) return; fileInputRef.current.click(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    if (!fileName) {
      setError("Please upload your certificate (PDF, Max 500KB).");
      return;
    }
    if (
      !formData.reg ||
      !formData.name ||
      !formData.year ||
      !formData.semester ||
      !formData.section ||
      !formData.department ||
      !formData.degree ||
      !formData.date ||
      !formData.comp ||
      !formData.prize
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsLoading(true); // Start loading
    
    const formattedDate = formatDate(formData.date);

    const generatedId = Date.now().toString();
    const newAchievement = {
      id: generatedId,
      achievementId: generatedId,
      certificateId: generatedId,
      reg: formData.reg,
      name: formData.name,
      year: formData.year,
      semester: formData.semester,
      section: formData.section,
      department: formData.department,
      degree: formData.degree,
      date: formattedDate,
      comp: formData.comp,
      prize: formData.prize,
      status: "pending",
      fileName: fileName,
      fileData: '', // No longer sending base64, using GridFS
      rawFile: fileContent, // Pass File object for GridFS upload by parent
      fileType,
      fileSize,
      uploadDate: formatDate(new Date()),
    };

    try {
      // Call the upload function and wait for it to complete
      if (onUpload) {
        await onUpload(newAchievement);
        // Show success popup immediately - no delays
        setIsSubmitted(true);
      }
    } catch (error) {
      // Show error popup if upload failed
      console.error('Upload failed:', error);
      setErrorMessage(error.message || "Certificate upload failed. Please try again.");
      setIsError(true);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          position: "fixed",
          left: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.2)",
          zIndex: 9999,
          cursor: "pointer",
        }}
        onClick={isLoading ? null : onClose}
      >
        {!isSubmitted && !isError ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                border: "1.5px solid #e1e8ed",
                padding: "32px 27px 24px 27px",
                minWidth: 350,
                width: 420,
                maxWidth: "98vw",
                zIndex: 1005,
                boxShadow: "0 4px 32px rgba(44,63,87,0.11)",
                position: "relative",
              }}
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <button
                  type="button"
                  onClick={isLoading ? null : onClose}
                  disabled={isLoading}
                  style={{
                    position: "absolute", top: "14px", right: "18px", background: "transparent", border: "none", fontSize: "25px", color: isLoading ? "#cccccc" : "#999999", cursor: isLoading ? "not-allowed" : "pointer", fontWeight: "600", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", zIndex: 2, opacity: isLoading ? 0.5 : 1,
                  }}
                  title={isLoading ? "Upload in progress..." : "Close"}
                >
                  ×
                </button>
                <h2
                  style={{
                    color: "#2276fc", textAlign: "center", marginBottom: 14, fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 23, letterSpacing: 0.3,
                  }}
                >
                  Upload Certificate
                </h2>
                <div
                  style={{
                    width: "100%", height: "2px", background: "#ececec", margin: "0 0 22px 0", borderRadius: "1px",
                  }}
                />
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <input
                    className={styles['input-hover']} type="text" name="reg" placeholder="Register Number" value={formData.reg} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                  />
                  <input
                    className={styles['input-hover']} type="text" name="name" placeholder="Name" value={formData.name} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                  />
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <select
                    className={styles['input-hover']} name="year" value={formData.year} onChange={handleInputChange} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }} required
                  >
                    <option value="" disabled>Year</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                  <select
                    className={styles['input-hover']} name="semester" value={formData.semester} onChange={handleInputChange} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }} required
                  >
                    <option value="" disabled>Semester</option>
                    {getAvailableSemesters(formData.year).map(sem => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      className={styles['input-hover']} type="text" name="section" placeholder="Section" value={formData.section} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                    />
                  </div>
                  <AchievementDatePicker
                    value={formData.date}
                    onChange={isLoading ? undefined : handleDateChange}
                    disabled={isLoading}
                  />
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <input
                    className={styles['input-hover']} type="text" name="comp" placeholder="Competition" value={formData.comp} onChange={handleInputChange} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : undefined }} required
                  />
                  <input
                    className={styles['input-hover']} type="text" name="prize" placeholder="Prize" value={formData.prize} onChange={handleInputChange} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : undefined }} required
                  />
                </div>
                <div
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "16px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                    }}
                  >
                    <button
                      type="button"
                      className={styles['upload-button']}
                      onClick={handleUploadClick}
                      disabled={isLoading}
                      style={{
                        opacity: isLoading ? 0.6 : 1,
                        cursor: isLoading ? "not-allowed" : "pointer"
                      }}
                    >
                      <img
                        src={require("../assets/popupUploadicon.png")}
                        alt="Upload"
                        style={{ width: "22px", height: "22px" }}
                      />
                      <span>{fileName || "Upload"}</span>
                    </button>
                    {fileName && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={(e) => {
                          if (isLoading) return;
                          e.stopPropagation();
                          setFileName("");
                          setLastUploaded("");
                          setFileContent("");
                          setFileType("application/pdf");
                          setFileSize(0);
                        }}
                        style={{
                          fontFamily: "Poppins, sans-serif", fontSize: 21, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", padding: "4px", color: isLoading ? "#cccccc" : "#666666", cursor: isLoading ? "not-allowed" : "pointer", width: "25px", height: "25px", border: "none", opacity: isLoading ? 0.5 : 1,
                        }}
                        title={isLoading ? "Upload in progress..." : "Clear"}
                      >
                        ×
                      </button>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 14.2, color: "#444", marginTop: 10, letterSpacing: 0.01, textAlign: "center",
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ color: "#2276fc", fontWeight: 600 }}>*</span>
                      Upload Max 500KB PDF file
                    </div>
                    {!fileName && (
                    <div style={{ marginBottom: 4 }}>
                      <span
                        style={{ color: "#ff6464", fontWeight: 800, marginRight: 3 }}
                      >
                        *
                      </span>
                      <span style={{ color: "#2276fc" }}>Please upload your Certificate</span>
                    </div>
                    )}
                    {fileName && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: "#2276fc", fontWeight: 800, marginRight: 3 }}>
                        *
                      </span>
                      Last uploaded: (<span style={{ color: "#0d9477" }}>{lastUploaded || "No date"}</span>)
                    </div>
                    )}
                    {error && <div style={{ color: "#ff6464", marginTop: 4 }}>{error}</div>}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex", gap: 12, justifyContent: "center", marginTop: 5,
                  }}
                >
                  <button 
                    type="submit" 
                    className={styles['submit-button']}
                    disabled={isLoading}
                    style={{
                      opacity: isLoading ? 0.7 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Uploading...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
        ) : isSubmitted ? (
          <SuccessPopup onClose={onClose} />
        ) : (
          <ErrorPopup onClose={onClose} errorMessage={errorMessage} />
        )}
      </div>
    </>
  );
}