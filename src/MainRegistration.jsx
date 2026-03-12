/**
 * MainRegistration.jsx - Student Self-Registration Form
 * 
 * Image handling: GridFS storage (raw File upload, NOT base64)
 * Supported formats: JPG, JPEG, WebP
 * File picker: No accept attribute - all files visible, validation done in JS
 * 
 * Rebuilt fresh to avoid browser cache issues.
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import ReactDOM from 'react-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import BlueAdminicon from './assets/BlueAdminicon.png'
import Navbar from "./components/Navbar/mrnavbar";
import Sidebar from "./components/Sidebar/mrsidebar";
import personalinfo from "./assets/personal information icon.svg";
import academicIcon from "./assets/academic.svg";
import otherDetailsIcon from "./assets/otherdetails.svg";
import logindetailsIcon from "./assets/logindetails.svg";
import styles from "./MainRegistration.module.css";
import mongoDBService from './services/mongoDBService';
import gridfsService from './services/gridfsService';

// URL validation patterns for profile links
const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/?$/;
const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]{3,100}\/?$/;

const COMPANY_TYPE_OPTIONS = [
  "CORE",
  "IT",
  "ITES(BPO/KPO)",
  "Marketing & Sales",
  "HR / Business analyst",
  "Others"
];

const JOB_LOCATION_OPTIONS = [
  "Tamil Nadu",
  "Bengaluru",
  "Hyderabad",
  "North India",
  "Others"
];

/**
 * Robust file type detection - checks MIME type first, falls back to extension.
 * Returns "jpg" | "webp" | null
 */
const getFileType = (file) => {
  const fileName = file.name.toLowerCase();
  // Check MIME type first (most reliable)
  if (file.type) {
    if (file.type === "image/jpeg" || file.type === "image/jpg") return "jpg";
    if (file.type === "image/webp") return "webp";
  }
  // Fallback to extension check (for browsers with incomplete MIME detection)
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return "jpg";
  if (fileName.endsWith('.webp')) return "webp";
  return null;
};

const cx = (...classNames) =>
  classNames
    .filter(Boolean)
    .map((name) => styles[name] || name)
    .join(" ");

// Custom Mobile Input Component with +91 Prefix
const MobileInputWithPrefix = ({ name, placeholder, value, onChange, maxLength = 10, ...props }) => {
  const handleInputChange = (e) => {
    let inputValue = e.target.value;
    inputValue = inputValue.replace(/\D/g, '');
    inputValue = inputValue.replace(/^0+/, '');
    // First digit must be 6, 7, 8, or 9
    if (inputValue.length > 0 && !/^[6789]/.test(inputValue)) {
      inputValue = '';
    }
    if (inputValue.length > maxLength) {
      inputValue = inputValue.slice(0, maxLength);
    }
    e.target.value = inputValue;
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={cx("mr-mobile-input-wrapper")}>
      <div className={cx("mr-mobile-prefix")}>+91</div>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        onChange={handleInputChange}
        maxLength={maxLength}
        inputMode="numeric"
        className={cx("mr-mobile-input")}
        {...props}
      />
    </div>
  );
};

const MdUpload = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
  >
    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
  </svg>
);

const IoMdClose = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
  >
    <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z" />
  </svg>
);

const RequiredStar = () => <span className={cx("mr-required-star")}>*</span>;

const GraduationCapIcon = () => (
  <img
    src={BlueAdminicon}
    alt="Graduation Cap"
    style={{ width: "100px", height: "90px", marginTop: "-20px" }}
  />
);

const FileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "18px", height: "18px", marginRight: "8px", color: "#555", flexShrink: 0 }}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "18px", height: "18px", marginRight: "8px", color: "#555", flexShrink: 0 }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/* ─── Popup Components ─── */

const SuccessPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")}>Registered !</div>
        <div className={cx("mr-popup-body")}>
          <svg className={cx("mr-success-icon")} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={cx("mr-success-icon--circle")} cx="26" cy="26" r="25" fill="none" />
            <path className={cx("mr-success-icon--check")} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
          <h2>Login Created 🎉</h2>
          <p>Student ID Created!</p>
          <p>Click Login button to Redirect</p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button
            onClick={() => { onClose(); window.location.href = "/mainlogin"; }}
            className={cx("mr-popup-login-btn", "mr-popup-login-btn--primary")}
          >
            <span className={cx("mr-popup-login-btn__label")}>Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ExistingRegNoPopup = ({ isOpen, onClose, regNo }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Already Exists!
        </div>
        <div className={cx("mr-popup-body")}>
          <svg className={cx("mr-error-icon")} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={cx("mr-error-icon--circle")} cx="26" cy="26" r="25" fill="none" />
            <path className={cx("mr-error-icon--cross")} fill="none" d="M16 16l20 20M36 16l-20 20" />
          </svg>
          <h2 style={{ color: "#000" }}>Registration Number Already Exists</h2>
          <p style={{ marginBottom: "8px" }}>
            Registration Number: <strong>{regNo}</strong>
          </p>
          <p style={{ marginBottom: "8px" }}>
            This registration number is already registered in our system.
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            Please use a different registration number or contact support if you believe this is an error.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const MismatchedRegNoPopup = ({ isOpen, onClose, personalRegNo, loginRegNo }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Registration Numbers Don't Match!
        </div>
        <div className={cx("mr-popup-body")}>
          <svg className={cx("mr-error-icon")} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={cx("mr-error-icon--circle")} cx="26" cy="26" r="25" fill="none" />
            <path className={cx("mr-error-icon--cross")} fill="none" d="M16 16l20 20M36 16l-20 20" />
          </svg>
          <h2 style={{ color: "#000" }}>Registration Numbers Don't Match ✗</h2>
          <p style={{ marginBottom: "8px" }}>
            Personal Info Registration: <strong>{personalRegNo}</strong>
          </p>
          <p style={{ marginBottom: "8px" }}>
            Login Registration: <strong>{loginRegNo}</strong>
          </p>
          <p style={{ marginBottom: "8px" }}>The login registration number must match the personal information registration number.</p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            Please enter the same registration number in both fields.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDiscardPopup = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#2085f6" }}>
          Discard Changes?
        </div>
        <div className={cx("mr-popup-body")}>
          <svg
            className={cx("mr-warning-icon")}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
            style={{ width: "80px", height: "80px", margin: "0 auto 20px", display: "block" }}
          >
            <circle className={cx("mr-warning-icon--circle")} cx="26" cy="26" r="25" fill="none" />
            <g className={cx("mr-warning-icon--exclamation")}>
              <line x1="26" y1="18" x2="26" y2="30" />
              <line x1="26" y1="34" x2="26" y2="38" />
            </g>
          </svg>
          <h2 style={{ color: "#000", marginBottom: "15px" }}>Exit Registration Form?</h2>
          <p style={{ marginBottom: "8px", fontSize: "15px" }}>
            All your entered information will be lost.
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            Are you sure you want to discard all changes and exit?
          </p>
        </div>
        <div className={cx("mr-popup-footer")} style={{ gap: "20px", display: "flex" }}>
          <button onClick={onCancel} className={cx("mr-popup-login-btn")} style={{ backgroundColor: "#6c757d" }}>
            <span className={cx("mr-popup-login-btn__label")}>Cancel</span>
          </button>
          <button onClick={onConfirm} className={cx("mr-popup-login-btn")} style={{ backgroundColor: "#dc3545" }}>
            <span className={cx("mr-popup-login-btn__label")}>Discard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ValidationErrorPopup = ({ isOpen, onClose, message, title = "Validation Error" }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#dc3545" }}>
          {title}
        </div>
        <div className={cx("mr-popup-body")}>
          <svg
            className={cx("mr-error-icon")}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
            style={{ width: "80px", height: "80px", margin: "0 auto 20px", display: "block" }}
          >
            <circle className={cx("mr-error-icon--circle")} cx="26" cy="26" r="25" fill="none" />
            <path className={cx("mr-error-icon--cross")} fill="none" d="M16 16l20 20M36 16l-20 20" />
          </svg>
          <h2 style={{ color: "#000", marginBottom: "15px" }}>{title}</h2>
          <div style={{ textAlign: "left", marginTop: "20px" }}>
            {message.split('\n').map((line, i) => (
              <p key={i} style={{ marginBottom: "8px", fontSize: "15px" }}>{line}</p>
            ))}
          </div>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Image Too Large!
        </div>
        <div className={cx("mr-popup-body")}>
          <div className={cx("mr-image-error-icon-container")}>
            <svg
              className={cx("mr-image-error-icon")}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
              </g>
            </svg>
          </div>
          <h2 style={{ color: "#d32f2f" }}>Image Size Exceeded ✗</h2>
          <p style={{ marginBottom: "16px", marginTop: "20px" }}>
            Maximum allowed: <strong>500KB</strong>
          </p>
          <p style={{ marginBottom: "16px" }}>
            Your image size: <strong>{fileSizeKB}KB</strong>
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "20px", marginBottom: "10px" }}>
            Please compress your image or choose a smaller file.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const FileFormatErrorPopup = ({ isOpen, onClose, fileName }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Invalid File Format!
        </div>
        <div className={cx("mr-popup-body")}>
          <div className={cx("mr-image-error-icon-container")}>
            <svg
              className={cx("mr-image-error-icon")}
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
              </g>
            </svg>
          </div>
          <h2 style={{ color: "#d32f2f" }}>Invalid File Format ✗</h2>
          {fileName && (
            <p style={{ marginBottom: "16px", marginTop: "20px", wordBreak: "break-all" }}>
              File: <strong>{fileName}</strong>
            </p>
          )}
          <p style={{ marginBottom: "16px", marginTop: "20px" }}>
            Allowed formats: <strong>JPG, JPEG, WebP</strong>
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "20px", marginBottom: "10px" }}>
            Please upload an image in JPG, JPEG, or WebP format.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className={cx("mr-image-preview-overlay")} onClick={onClose}>
      <div className={cx("mr-image-preview-container")} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Profile Preview" className={cx("mr-image-preview-content")} />
        <button onClick={onClose} className={cx("mr-image-preview-close-btn")}>&times;</button>
      </div>
    </div>
  );
};

const URLValidationErrorPopup = ({ isOpen, onClose, urlType, invalidUrl }) => {
  if (!isOpen) return null;

  const examples = {
    GitHub: 'https://github.com/username',
    LinkedIn: 'https://linkedin.com/in/username'
  };

  const renderIcon = () => {
    if (urlType === 'GitHub') {
      return (
        <div className={cx("mr-image-error-icon-container")}>
          <svg className={cx("mr-image-error-icon")} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
            <path fill="#fff" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
          </svg>
        </div>
      );
    }
    return (
      <div className={cx("mr-image-error-icon-container")}>
        <svg className={cx("mr-image-error-icon")} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="#fff" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
        </svg>
      </div>
    );
  };

  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Invalid {urlType} URL!
        </div>
        <div className={cx("mr-popup-body")}>
          {renderIcon()}
          <h2 style={{ color: "#d32f2f" }}>Invalid {urlType} Link ✗</h2>
          {invalidUrl && (
            <p style={{ marginBottom: "16px", marginTop: "20px", wordBreak: "break-all" }}>
              You entered: <strong>{invalidUrl}</strong>
            </p>
          )}
          <p style={{ marginBottom: "16px" }}>
            Correct format: <strong>{examples[urlType]}</strong>
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "20px", marginBottom: "10px" }}>
            Please enter a valid {urlType} profile URL or leave it empty.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

/* ─── DOB Date Picker ─── */

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

/* ─── Main Component ─── */

function MainRegistration() {
  const sectionList = useMemo(
    () => [
      { key: "personal", label: "Personal Information", icon: personalinfo },
      { key: "academic", label: "Academic Background", icon: academicIcon },
      { key: "other", label: "Other Details", icon: otherDetailsIcon },
      { key: "login", label: "Login Details", icon: logindetailsIcon },
    ],
    []
  );

  const formRef = useRef(null);
  const personalSectionRef = useRef(null);
  const academicSectionRef = useRef(null);
  const otherSectionRef = useRef(null);
  const loginSectionRef = useRef(null);

  const sectionRefs = useMemo(
    () => ({
      personal: personalSectionRef,
      academic: academicSectionRef,
      other: otherSectionRef,
      login: loginSectionRef,
    }),
    []
  );

  const fileInputRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const prevErrorCountRef = useRef(0);

  /* ── State ── */
  const [branches, setBranches] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [activeSection, setActiveSection] = useState("personal");
  const [completedSections, setCompletedSections] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dob, setDob] = useState('');
  const [studyCategory, setStudyCategory] = useState("12th");
  const [currentYear, setCurrentYear] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [uploadInfo, setUploadInfo] = useState({ name: "", date: "" });
  const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isRegisterEnabled, setIsRegisterEnabled] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isExistingRegNoPopupOpen, setExistingRegNoPopupOpen] = useState(false);
  const [existingRegNo, setExistingRegNo] = useState("");
  const [isCheckingRegNo, setIsCheckingRegNo] = useState(false);
  const [isMismatchedRegNoPopupOpen, setMismatchedRegNoPopupOpen] = useState(false);
  const [personalRegNo, setPersonalRegNo] = useState("");
  const [loginRegNo, setLoginRegNo] = useState("");
  const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
  const [fileSizeErrorKB, setFileSizeErrorKB] = useState("");
  const [isFileFormatErrorOpen, setIsFileFormatErrorOpen] = useState(false);
  const [invalidFileName, setInvalidFileName] = useState("");
  const [selectedCompanyTypes, setSelectedCompanyTypes] = useState([]);
  const [selectedJobLocations, setSelectedJobLocations] = useState([]);
  const [residentialStatus, setResidentialStatus] = useState("");
  const [isDiscardPopupOpen, setIsDiscardPopupOpen] = useState(false);
  const [quota, setQuota] = useState("");
  const [firstGraduate, setFirstGraduate] = useState("");
  const [willingToSignBond, setWillingToSignBond] = useState("");
  const [preferredModeOfDrive, setPreferredModeOfDrive] = useState("");
  const [isURLErrorPopupOpen, setURLErrorPopupOpen] = useState(false);
  const [urlErrorType, setUrlErrorType] = useState("");
  const [invalidUrl, setInvalidUrl] = useState("");
  const [batchStartYear, setBatchStartYear] = useState("");
  const [batchEndYear, setBatchEndYear] = useState("");
  const [isValidationErrorPopupOpen, setValidationErrorPopupOpen] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState("");

  /* ── Derived / Memoized ── */

  const filteredBranches = useMemo(() => {
    if (!selectedDegree) return [];
    const normalized = selectedDegree.toLowerCase();
    return branches.filter((branch) => {
      const degree = branch?.degree?.toLowerCase?.() || "";
      const abbreviation = branch?.degreeAbbreviation?.toLowerCase?.() || "";
      return degree === normalized || abbreviation === normalized || degree.includes(normalized);
    });
  }, [branches, selectedDegree]);

  const getBranchOptionValue = useCallback((branch) => {
    if (!branch) return "";
    return branch.branchAbbreviation || branch.branchFullName || branch.branchName || branch.branch;
  }, []);

  /* ── Section Completion ── */

  const checkSectionComplete = useCallback(
    (key) => {
      const sectionRef = sectionRefs[key]?.current;
      if (!sectionRef) return false;

      if (key === "academic") {
        if (!studyCategory) return false;
        const alwaysRequired = ["tenthInstitution", "tenthBoard", "tenthPercentage", "tenthYear"];
        const twelfthRequired = studyCategory === "12th" || studyCategory === "both"
          ? ["twelfthInstitution", "twelfthBoard", "twelfthPercentage", "twelfthYear", "twelfthCutoff"]
          : [];
        const diplomaRequired = studyCategory === "diploma" || studyCategory === "both"
          ? ["diplomaInstitution", "diplomaBranch", "diplomaPercentage", "diplomaYear"]
          : [];
        const requiredSelectors = [...alwaysRequired, ...twelfthRequired, ...diplomaRequired];
        return requiredSelectors.every((fieldName) => {
          const input = sectionRef.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
          return input && input.value.trim() !== "";
        });
      }

      const requiredInputs = sectionRef.querySelectorAll("input[required], select[required]");
      if (!requiredInputs.length) return false;

      const seenRadio = new Set();
      for (const input of requiredInputs) {
        if (input.type === "radio") {
          if (seenRadio.has(input.name)) continue;
          const radios = sectionRef.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
          const checked = Array.from(radios).some((radio) => radio.checked);
          seenRadio.add(input.name);
          if (!checked) return false;
        } else if (!input.value || input.value.trim() === "") {
          return false;
        }
      }
      return true;
    },
    [sectionRefs, studyCategory]
  );

  /* ── Scroll to Field & Blink ── */

  const scrollToFieldAndBlink = useCallback((fieldName) => {
    if (!formRef.current) return;

    let field = null;

    if (fieldName === 'dob') {
      field = formRef.current.querySelector('[data-dob-field]');
    } else if (fieldName === 'companyTypes') {
      field = formRef.current.querySelector('input[name="companyTypes"]');
    } else if (fieldName === 'preferredJobLocation') {
      field = formRef.current.querySelector('input[name="preferredJobLocation"]');
    } else {
      field = formRef.current.querySelector(`[name="${fieldName}"]`);
    }

    if (field) {
      const section = field.closest('[class*="mr-profile-section-container"]');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setTimeout(() => {
        if (fieldName === 'companyTypes' || fieldName === 'preferredJobLocation') {
          const container = field.closest('.mr-checkbox-group') || field.closest('[class*="checkbox"]') || field.parentElement;
          if (container) {
            container.classList.add('field-blink');
            setTimeout(() => container.classList.remove('field-blink'), 3000);
          }
        } else {
          // Check if this is a mobile input field (inside mobile-input-wrapper)
          const mobileWrapper = field.closest('[class*="mr-mobile-input-wrapper"]');
          if (mobileWrapper) {
            // Handle mobile input wrapper highlighting
            const originalBorder = mobileWrapper.style.border;
            const originalBoxShadow = mobileWrapper.style.boxShadow;
            const originalBackground = mobileWrapper.style.backgroundColor;
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
              if (blinkCount % 2 === 0) {
                mobileWrapper.style.border = '2px solid #ffc107';
                mobileWrapper.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
                mobileWrapper.style.backgroundColor = '#fff9e6';
              } else {
                mobileWrapper.style.border = originalBorder;
                mobileWrapper.style.boxShadow = originalBoxShadow;
                mobileWrapper.style.backgroundColor = originalBackground;
              }
              blinkCount++;
              if (blinkCount >= 4) {
                clearInterval(blinkInterval);
                mobileWrapper.style.border = originalBorder;
                mobileWrapper.style.boxShadow = originalBoxShadow;
                mobileWrapper.style.backgroundColor = originalBackground;
              }
            }, 375);
            field.focus();
          } else if (field.tagName === 'SELECT') {
            const originalBorder = field.style.border;
            const originalBoxShadow = field.style.boxShadow;
            const originalBackground = field.style.backgroundColor;
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
              if (blinkCount % 2 === 0) {
                field.style.border = '2px solid #ffc107';
                field.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
                field.style.backgroundColor = '#fff9e6';
              } else {
                field.style.border = originalBorder;
                field.style.boxShadow = originalBoxShadow;
                field.style.backgroundColor = originalBackground;
              }
              blinkCount++;
              if (blinkCount >= 4) {
                clearInterval(blinkInterval);
                field.style.border = originalBorder;
                field.style.boxShadow = originalBoxShadow;
                field.style.backgroundColor = originalBackground;
              }
            }, 375);
            field.focus();
          } else {
            field.classList.add('field-blink');
            field.focus();
            setTimeout(() => field.classList.remove('field-blink'), 3000);
          }
        }
      }, 500);
    } else {
      const sectionMap = {
        firstName: 'personal', lastName: 'personal', regNo: 'personal',
        batch: 'personal', dob: 'personal', degree: 'personal', branch: 'personal',
        section: 'personal', gender: 'personal', primaryEmail: 'personal',
        domainEmail: 'personal', mobileNo: 'personal', fatherName: 'personal',
        fatherMobile: 'personal', motherName: 'personal', motherMobile: 'personal',
        community: 'personal', aadhaarNo: 'other',
        portfolioLink: 'other', mediumOfStudy: 'other', residentialStatus: 'other',
        quota: 'other', firstGraduate: 'other', skillSet: 'other',
        rationCardNo: 'other', familyAnnualIncome: 'other', panNo: 'other',
        willingToSignBond: 'other', preferredModeOfDrive: 'other',
        companyTypes: 'other', preferredJobLocation: 'other',
        twelfthInstitution: 'academic', twelfthBoard: 'academic',
        twelfthPercentage: 'academic', twelfthYear: 'academic', twelfthCutoff: 'academic',
        diplomaInstitution: 'academic', diplomaBranch: 'academic',
        diplomaPercentage: 'academic', diplomaYear: 'academic',
        tenthInstitution: 'academic', tenthBoard: 'academic',
        tenthPercentage: 'academic', tenthYear: 'academic',
        currentYear: 'personal', currentSemester: 'personal',
        loginRegNo: 'login', loginPassword: 'login', confirmPassword: 'login'
      };
      const sectionKey = sectionMap[fieldName];
      if (sectionKey && sectionRefs[sectionKey]?.current) {
        sectionRefs[sectionKey].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [sectionRefs]);

  /* ── Validation ── */

  const validateAllFields = useCallback(() => {
    if (!formRef.current) return { isValid: false, errors: [] };
    const formData = new FormData(formRef.current);
    const errors = [];

    const requiredFields = {
      firstName: "First Name", lastName: "Last Name", regNo: "Registration Number",
      batch: "Batch", degree: "Degree", branch: "Branch", section: "Section",
      gender: "Gender", primaryEmail: "Primary Email", domainEmail: "Domain Email",
      mobileNo: "Mobile Number", fatherName: "Father Name", fatherMobile: "Father's Mobile Number",
      motherName: "Mother Name", motherMobile: "Mother's Mobile Number", community: "Community",
      aadhaarNo: "Aadhaar Number", portfolioLink: "Portfolio Link",
      mediumOfStudy: "Medium of Study", residentialStatus: "Residential Status",
      quota: "Quota", firstGraduate: "First Graduate", skillSet: "Skill Set",
      rationCardNo: "Ration Card Number", familyAnnualIncome: "Family Annual Income",
      panNo: "PAN Number", willingToSignBond: "Willing to Sign Bond",
      preferredModeOfDrive: "Preferred Mode of Drive", loginRegNo: "Login Registration Number",
      loginPassword: "Login Password", confirmPassword: "Confirm Password",
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      const value = formData.get(field);
      if (!value || value.trim() === "") errors.push({ message: `${label} is required`, field });
    });

    if (!dob) errors.push({ message: "Date of Birth is required", field: "dob" });

    const regNo = formData.get("regNo");
    if (regNo && !/^\d{11}$/.test(regNo)) errors.push({ message: "Registration number must be exactly 11 digits", field: "regNo" });

    const dobFormatted = dob ? dob.split('-').reverse().join('') : "";
    if (dob && !/^\d{8}$/.test(dobFormatted)) errors.push({ message: "Please select a valid date of birth", field: "dob" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const primaryEmail = formData.get("primaryEmail");
    const domainEmail = formData.get("domainEmail");
    if (primaryEmail && !emailRegex.test(primaryEmail)) errors.push({ message: "Primary email format is invalid", field: "primaryEmail" });
    if (domainEmail && !emailRegex.test(domainEmail)) errors.push({ message: "Domain email format is invalid", field: "domainEmail" });

    const mobileNo = formData.get("mobileNo");
    if (mobileNo && !/^[6789]\d{9}$/.test(mobileNo)) errors.push({ message: "Mobile number must be 10 digits starting with 6, 7, 8, or 9", field: "mobileNo" });

    const fatherMobile = formData.get("fatherMobile");
    if (fatherMobile && !/^[6789]\d{9}$/.test(fatherMobile)) errors.push({ message: "Father's mobile number must be 10 digits starting with 6, 7, 8, or 9", field: "fatherMobile" });

    const motherMobile = formData.get("motherMobile");
    if (motherMobile && !/^[6789]\d{9}$/.test(motherMobile)) errors.push({ message: "Mother's mobile number must be 10 digits starting with 6, 7, 8, or 9", field: "motherMobile" });

    const aadhaarNo = formData.get("aadhaarNo");
    if (aadhaarNo && !/^\d{12}$/.test(aadhaarNo)) errors.push({ message: "Aadhaar number must be exactly 12 digits", field: "aadhaarNo" });

    const loginRegNoValue = formData.get("loginRegNo");
    const loginPassword = formData.get("loginPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (loginRegNoValue !== regNo) errors.push({ message: "Login registration number must match the main registration number", field: "loginRegNo" });
    if (dobFormatted && loginPassword !== dobFormatted) errors.push({ message: "Login password must be your date of birth in DDMMYYYY format", field: "loginPassword" });
    if (confirmPassword !== loginPassword) errors.push({ message: "Password confirmation does not match", field: "confirmPassword" });

    if (studyCategory === "12th" || studyCategory === "both") {
      const twelfthFields = {
        twelfthInstitution: "12th Institution Name", twelfthBoard: "12th Board/University",
        twelfthPercentage: "12th Percentage", twelfthYear: "12th Year of Passing",
        twelfthCutoff: "12th Cut-off Marks",
      };
      Object.entries(twelfthFields).forEach(([field, label]) => {
        const value = formData.get(field);
        if (!value || value.trim() === "") errors.push({ message: `${label} is required`, field });
      });
    }

    if (studyCategory === "diploma" || studyCategory === "both") {
      const diplomaFields = {
        diplomaInstitution: "Diploma Institution", diplomaBranch: "Diploma Branch",
        diplomaPercentage: "Diploma Percentage", diplomaYear: "Diploma Year of Passing",
      };
      Object.entries(diplomaFields).forEach(([field, label]) => {
        const value = formData.get(field);
        if (!value || value.trim() === "") errors.push({ message: `${label} is required`, field });
      });
    }

    const tenthFields = {
      tenthInstitution: "10th Institution Name", tenthBoard: "10th Board/University",
      tenthPercentage: "10th Percentage", tenthYear: "10th Year of Passing",
    };
    Object.entries(tenthFields).forEach(([field, label]) => {
      const value = formData.get(field);
      if (!value || value.trim() === "") errors.push({ message: `${label} is required`, field });
    });

    const currentYearValue = currentYear || formData.get("currentYear");
    const currentSemesterValue = currentSemester || formData.get("currentSemester");
    if (!currentYearValue) errors.push({ message: "Current Year is required", field: "currentYear" });
    if (!currentSemesterValue) errors.push({ message: "Current Semester is required", field: "currentSemester" });

    const githubLink = formData.get("githubLink");
    if (githubLink && githubLink.trim()) {
      if (!GITHUB_URL_REGEX.test(githubLink.trim())) {
        errors.push({ message: "GitHub link must be a valid URL (e.g. https://github.com/username)", field: "githubLink" });
      }
    }

    const linkedinLink = formData.get("linkedinLink");
    if (linkedinLink && linkedinLink.trim()) {
      if (!LINKEDIN_URL_REGEX.test(linkedinLink.trim())) {
        errors.push({ message: "LinkedIn link must be a valid URL (e.g. https://linkedin.com/in/username)", field: "linkedinLink" });
      }
    }

    if (!selectedCompanyTypes || selectedCompanyTypes.length === 0) {
      errors.push({ message: "At least one Company Type must be selected", field: "companyTypes" });
    }

    if (!selectedJobLocations || selectedJobLocations.length === 0) {
      errors.push({ message: "At least one Preferred Job Location must be selected", field: "preferredJobLocation" });
    }

    return { isValid: errors.length === 0, errors };
  }, [currentYear, currentSemester, dob, studyCategory, selectedCompanyTypes, selectedJobLocations]);

  /* ── Input/Form Handlers ── */

  const handleInputChange = useCallback(() => {
    const updated = {};
    sectionList.forEach(({ key }) => {
      updated[key] = checkSectionComplete(key);
    });
    setCompletedSections(updated);

    const validation = validateAllFields();
    setIsRegisterEnabled(validation.isValid);
    setValidationErrors(validation.errors);

    if (validation.errors.length !== prevErrorCountRef.current) {
      setShowAllErrors(false);
    }
    prevErrorCountRef.current = validation.errors.length;
  }, [sectionList, checkSectionComplete, validateAllFields]);

  const handleCompanyTypeChange = useCallback(
    (event) => {
      const { value, checked } = event.target;
      setSelectedCompanyTypes((prev) => {
        const next = checked ? [...prev, value] : prev.filter((item) => item !== value);
        setTimeout(handleInputChange, 0);
        return next;
      });
    },
    [handleInputChange]
  );

  const handleJobLocationChange = useCallback(
    (event) => {
      const { value, checked } = event.target;
      setSelectedJobLocations((prev) => {
        const next = checked ? [...prev, value] : prev.filter((item) => item !== value);
        setTimeout(handleInputChange, 0);
        return next;
      });
    },
    [handleInputChange]
  );

  /* ── Popup Close Handlers ── */
  const closePopup = useCallback(() => setPopupOpen(false), []);
  const closeExistingRegNoPopup = useCallback(() => setExistingRegNoPopupOpen(false), []);
  const closeMismatchedRegNoPopup = useCallback(() => setMismatchedRegNoPopupOpen(false), []);
  const closeFileSizeErrorPopup = useCallback(() => setIsFileSizeErrorOpen(false), []);
  const closeFileFormatErrorPopup = useCallback(() => setIsFileFormatErrorOpen(false), []);
  const closeURLErrorPopup = useCallback(() => setURLErrorPopupOpen(false), []);

  /* ── Discard Handlers ── */
  const handleDiscard = useCallback(() => setIsDiscardPopupOpen(true), []);
  const handleConfirmDiscard = useCallback(() => { setIsDiscardPopupOpen(false); window.location.href = "/"; }, []);
  const handleCancelDiscard = useCallback(() => setIsDiscardPopupOpen(false), []);

  /* ── Effects ── */

  useEffect(() => {
    handleInputChange();
  }, [handleInputChange, profileImage, currentYear, currentSemester, studyCategory, batchStartYear, batchEndYear]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (profileImage && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  // Fetch degrees and branches
  useEffect(() => {
    let isSubscribed = true;
    const fetchDegreeAndBranchData = async () => {
      try {
        const [degreeList, branchList] = await Promise.all([
          mongoDBService.getDegrees(),
          mongoDBService.getBranches(),
        ]);
        if (!isSubscribed) return;

        const sanitizedDegrees = Array.isArray(degreeList)
          ? degreeList.map((degree) => ({
              ...degree,
              degreeAbbreviation: degree.degreeAbbreviation || degree.abbreviation || degree.shortName || "",
              degreeFullName: degree.degreeFullName || degree.fullName || degree.name || "",
            }))
          : [];
        const sanitizedBranches = Array.isArray(branchList) ? branchList : [];
        setDegrees(sanitizedDegrees);
        setBranches(sanitizedBranches);
      } catch (error) {
        console.error("Failed to fetch degree/branch data:", error);
      }
    };
    fetchDegreeAndBranchData();
    return () => { isSubscribed = false; };
  }, []);

  /* ── Year/Semester Helpers ── */

  const getAvailableSemesters = useCallback((year) => {
    const semesterMap = { I: ["1", "2"], II: ["3", "4"], III: ["5", "6"], IV: ["7", "8"] };
    return semesterMap[year] || [];
  }, []);

  const handleBatchStartYearChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      // First digit must be 2 (valid years start with 2, e.g. 2021)
      if (value.length > 0 && value[0] !== '2') return;
      setBatchStartYear(value);
      if (value.length === 4) {
        setBatchEndYear(String(parseInt(value, 10) + 4));
      } else {
        setBatchEndYear("");
      }
    }
  }, []);

  /* ── Sidebar Click ── */

  const handleSidebarClick = useCallback(
    (key) => {
      isScrollingRef.current = true;
      setActiveSection(key);
      const ref = sectionRefs[key];

      if (ref?.current) {
        const scrollToSection = () => {
          const sectionElement = ref.current;
          sectionElement.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
          setTimeout(() => {
            const rect = sectionElement.getBoundingClientRect();
            const headerHeight = 65;
            const targetPosition = window.pageYOffset + rect.top - headerHeight - 20;
            window.scrollTo({ top: targetPosition, behavior: "smooth" });
          }, 200);
        };
        setTimeout(scrollToSection, 100);

        if (window.innerWidth <= 992) {
          setTimeout(() => setIsSidebarOpen(false), 300);
        }

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => { isScrollingRef.current = false; }, 600);
      } else if (window.innerWidth <= 992) {
        setIsSidebarOpen(false);
      }
    },
    [sectionRefs]
  );

  /* ── Image Upload Handler ── */
  /* NO accept attribute on file input = Windows shows ALL files.
     Validation is done here in JS using getFileType(). */

  const handleImageUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      console.log('[MainRegistration] File selected:', file.name, 'MIME:', file.type, 'Size:', file.size);

      const fileType = getFileType(file);

      if (!fileType) {
        // Invalid format — show popup (NO alert)
        console.warn('[MainRegistration] Invalid format for:', file.name, '| MIME:', file.type);
        setInvalidFileName(file.name);
        setIsFileFormatErrorOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Check file size: Maximum 500KB
      const maxSize = 500 * 1024;
      const sizeKB = (file.size / 1024).toFixed(1);

      if (file.size > maxSize) {
        setFileSizeErrorKB(sizeKB);
        setIsFileSizeErrorOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Store raw File object for GridFS upload (NOT base64)
      setProfilePhotoFile(file);

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setProfileImage(objectUrl);

      setUploadInfo({
        name: file.name,
        date: new Date().toLocaleDateString("en-GB"),
        size: sizeKB,
        type: fileType
      });

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);

      console.log('[MainRegistration] Image accepted:', {
        name: file.name,
        mimeType: file.type || 'unknown',
        size: sizeKB + 'KB',
        detectedType: fileType
      });
    },
    []
  );

  /* ── Image Remove Handler ── */

  const handleImageRemove = useCallback(
    (event) => {
      if (event?.preventDefault) event.preventDefault();
      if (profileImage && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
      setProfileImage(null);
      setProfilePhotoFile(null);
      setUploadInfo({ name: "", date: "" });
      setUploadSuccess(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [profileImage]
  );

  /* ── Registration Number Checks ── */

  const checkRegistrationNumberExists = useCallback(
    async (regNo) => {
      if (!regNo || regNo.length !== 11) return false;
      try {
        setIsCheckingRegNo(true);
        return await mongoDBService.checkStudentExists(regNo);
      } catch (error) {
        console.error("Error checking registration number:", error);
        return false;
      } finally {
        setIsCheckingRegNo(false);
      }
    },
    []
  );

  const handleRegNoBlur = useCallback(
    async (event) => {
      const regNoValue = event.target.value.trim();
      if (regNoValue.length === 11 && /^\d{11}$/.test(regNoValue)) {
        const exists = await checkRegistrationNumberExists(regNoValue);
        if (exists) {
          setExistingRegNo(regNoValue);
          setExistingRegNoPopupOpen(true);
          event.target.value = "";
          event.target.focus();
        }
      }
    },
    [checkRegistrationNumberExists]
  );

  const handleLoginRegNoBlur = useCallback(
    (event) => {
      const loginRegNoValue = event.target.value.trim();
      const personalRegNoValue = formRef.current?.querySelector('input[name="regNo"]').value.trim() || "";
      if (
        loginRegNoValue.length === 11 &&
        personalRegNoValue.length === 11 &&
        /^\d{11}$/.test(loginRegNoValue) &&
        /^\d{11}$/.test(personalRegNoValue) &&
        loginRegNoValue !== personalRegNoValue
      ) {
        setPersonalRegNo(personalRegNoValue);
        setLoginRegNo(loginRegNoValue);
        setMismatchedRegNoPopupOpen(true);
        event.target.value = "";
        event.target.focus();
      }
    },
    []
  );

  /* ── Save / Submit ── */

  const handleSave = useCallback(
    async (event) => {
      event.preventDefault();
      setIsRegistering(true);

      try {
        const formData = new FormData(event.target);
        const regNoValue = formData.get("regNo") || "";
        const loginRegNoValue = formData.get("loginRegNo") || "";
        const loginPassword = formData.get("loginPassword") || "";
        const confirmPassword = formData.get("confirmPassword") || "";
        const dobFormatted = dob ? dob.split('-').reverse().join('') : "";

        const invalidMessages = [];
        if (!/^\d{11}$/.test(regNoValue)) invalidMessages.push("Registration number must be exactly 11 digits");
        if (!/^\d{8}$/.test(dobFormatted)) invalidMessages.push("Please select a valid date of birth");
        if (loginRegNoValue !== regNoValue) invalidMessages.push("Login registration number must match the main registration number");
        if (loginPassword !== dobFormatted) invalidMessages.push("Login password must be your date of birth in DDMMYYYY format");
        if (confirmPassword !== loginPassword) invalidMessages.push("Password confirmation does not match");

        if (invalidMessages.length) {
          setValidationErrorMessage(invalidMessages.join("\n"));
          setValidationErrorPopupOpen(true);
          return;
        }

        const existingStudent = await mongoDBService
          .getStudentByRegNoAndDob(regNoValue, dobFormatted)
          .catch((error) => {
            if (error.message.includes("Student not found")) return null;
            throw error;
          });

        if (existingStudent) {
          setValidationErrorMessage(`Registration number already exists. Please use a different registration number.\n\nFound student ID: ${existingStudent.id}`);
          setValidationErrorPopupOpen(true);
          setIsRegistering(false);
          return;
        }

        // Build student data — profilePicURL will be set after GridFS upload
        const studentData = {
          regNo: regNoValue,
          dob: dobFormatted,
          firstName: formData.get("firstName") || "",
          lastName: formData.get("lastName") || "",
          batch: formData.get("batch") || "",
          degree: formData.get("degree") || "",
          branch: formData.get("branch") || "",
          currentYear: formData.get("currentYear") || currentYear || "",
          currentSemester: formData.get("currentSemester") || currentSemester || "",
          studyCategory: formData.get("studyCategory") || studyCategory || "",
          section: formData.get("section") || "",
          gender: formData.get("gender") || "",
          address: formData.get("address") || "",
          city: formData.get("city") || "",
          primaryEmail: formData.get("primaryEmail") || "",
          domainEmail: formData.get("domainEmail") || "",
          mobileNo: "+91" + (formData.get("mobileNo") || ""),
          fatherName: formData.get("fatherName") || "",
          fatherOccupation: formData.get("fatherOccupation") || "",
          fatherMobile: formData.get("fatherMobile") ? "+91" + formData.get("fatherMobile") : "",
          motherName: formData.get("motherName") || "",
          motherOccupation: formData.get("motherOccupation") || "",
          motherMobile: formData.get("motherMobile") ? "+91" + formData.get("motherMobile") : "",
          guardianName: formData.get("guardianName") || "",
          guardianMobile: formData.get("guardianMobile") ? "+91" + formData.get("guardianMobile") : "",
          community: formData.get("community") || "",
          bloodGroup: formData.get("bloodGroup") || "",
          aadhaarNo: formData.get("aadhaarNo") || "",
          portfolioLink: formData.get("portfolioLink") || "",
          mediumOfStudy: formData.get("mediumOfStudy") || "",
          tenthInstitution: formData.get("tenthInstitution") || "",
          tenthBoard: formData.get("tenthBoard") || "",
          tenthPercentage: formData.get("tenthPercentage") || "",
          tenthYear: formData.get("tenthYear") || "",
          twelfthInstitution: formData.get("twelfthInstitution") || "",
          twelfthBoard: formData.get("twelfthBoard") || "",
          twelfthPercentage: formData.get("twelfthPercentage") || "",
          twelfthYear: formData.get("twelfthYear") || "",
          twelfthCutoff: formData.get("twelfthCutoff") || "",
          diplomaInstitution: formData.get("diplomaInstitution") || "",
          diplomaBranch: formData.get("diplomaBranch") || "",
          diplomaPercentage: formData.get("diplomaPercentage") || "",
          diplomaYear: formData.get("diplomaYear") || "",
          residentialStatus: formData.get("residentialStatus") || residentialStatus || "",
          quota: formData.get("quota") || quota || "",
          languagesKnown: formData.get("languagesKnown") || "",
          firstGraduate: formData.get("firstGraduate") || firstGraduate || "",
          passportNo: formData.get("passportNo") || "",
          skillSet: formData.get("skillSet") || "",
          valueAddedCourses: formData.get("valueAddedCourses") || "",
          aboutSibling: formData.get("aboutSibling") || "",
          rationCardNo: formData.get("rationCardNo") || "",
          familyAnnualIncome: formData.get("familyAnnualIncome") || "",
          panNo: formData.get("panNo") || "",
          willingToSignBond: formData.get("willingToSignBond") || willingToSignBond || "",
          preferredModeOfDrive: formData.get("preferredModeOfDrive") || preferredModeOfDrive || "",
          githubLink: formData.get("githubLink") || "",
          linkedinLink: formData.get("linkedinLink") || "",
          companyTypes: formData.get("companyTypes") || selectedCompanyTypes.join(", ") || "",
          preferredJobLocation: formData.get("preferredJobLocation") || selectedJobLocations.join(", ") || "",
          profilePicURL: "",
          profileUploadDate: uploadInfo.date || new Date().toLocaleDateString("en-GB"),
          loginRegNo: loginRegNoValue,
          loginPassword,
        };

        // Create student first
        const createResponse = await mongoDBService.createStudent(studentData);
        console.log('[MainRegistration] Create student response:', createResponse);

        // Backend returns { message, student: { _id, ... } }
        const createdStudent = createResponse?.student || createResponse;
        const studentId = createdStudent?._id || createdStudent?.id;

        if (!studentId) {
          throw new Error("Failed to create student record — no ID returned");
        }

        // Upload profile photo to GridFS (raw File, NOT base64)
        if (profilePhotoFile) {
          try {
            console.log('[MainRegistration] Uploading to GridFS:', {
              name: profilePhotoFile.name,
              mimeType: profilePhotoFile.type || 'application/octet-stream',
              size: (profilePhotoFile.size / 1024).toFixed(1) + 'KB',
              studentId: studentId,
              userType: 'student'
            });

            const result = await gridfsService.uploadProfileImage(
              profilePhotoFile,
              studentId,
              'student'
            );

            console.log('[MainRegistration] GridFS upload result:', result);

            if (result && result.url) {
              await mongoDBService.updateStudent(studentId, {
                profilePicURL: result.url,
                profileUploadDate: uploadInfo.date || new Date().toLocaleDateString("en-GB")
              });
              console.log('[MainRegistration] Profile photo stored in GridFS:', result.url);
            }
          } catch (uploadErr) {
            console.error('[MainRegistration] Failed to upload profile photo:', uploadErr);
            // Don't fail registration — just log
          }
        }

        // Clean up object URL
        if (profileImage && profileImage.startsWith('blob:')) {
          URL.revokeObjectURL(profileImage);
        }

        setTimeout(() => {
          setPopupOpen(true);
          setIsRegistering(false);
        }, 1000);
      } catch (error) {
        console.error("Error saving student data:", error);
        setValidationErrorMessage(`Error saving data: ${error.message}. Check console for details.`);
        setValidationErrorPopupOpen(true);
      } finally {
        setIsRegistering(false);
      }
    },
    [
      currentSemester,
      currentYear,
      dob,
      profilePhotoFile,
      profileImage,
      selectedCompanyTypes,
      selectedJobLocations,
      studyCategory,
      uploadInfo,
      willingToSignBond,
      preferredModeOfDrive,
      residentialStatus,
      quota,
      firstGraduate,
    ]
  );

  /* ─── Render ─── */

  return (
    <div className={cx("mr-page-wrapper")}>
      <div className={cx("mr-container")}>
        <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <div className={cx("mr-main")}>
          <Sidebar
            isOpen={isSidebarOpen}
            currentView={activeSection}
            completedSections={completedSections}
            onViewChange={handleSidebarClick}
          />
          <div className={cx("mr-dashboard-area")} id="mr-dashboard-area">
            <form ref={formRef} onSubmit={handleSave} onChange={handleInputChange}>

              {/* ── Personal Information ── */}
              <div className={cx("mr-profile-section-container")} ref={sectionRefs.personal}>
                <h3 className={cx("mr-section-header")}>Personal Information</h3>
                <div className={cx("mr-form-grid")}>
                  <div className={cx("mr-personal-info-fields")}>
                    <div className={cx("mr-field")}>
                      <label>First Name <RequiredStar /></label>
                      <input type="text" name="firstName" placeholder="Enter First Name" required />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Last Name <RequiredStar /></label>
                      <input type="text" name="lastName" placeholder="Enter Last Name" required />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Register Number <RequiredStar /></label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          name="regNo"
                          placeholder="Enter Register Number (11 digits)"
                          maxLength="11"
                          onBlur={handleRegNoBlur}
                          required
                        />
                        {isCheckingRegNo && <div className={cx("mr-regno-checking-spinner")} />}
                      </div>
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Batch <RequiredStar /></label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                          type="text"
                          value={batchStartYear}
                          onChange={handleBatchStartYearChange}
                          placeholder="Start"
                          maxLength="4"
                          style={{ flex: 1 }}
                          required
                        />
                        <span style={{ fontWeight: "600", color: "#333" }}>-</span>
                        <input
                          type="text"
                          value={batchEndYear}
                          placeholder="End"
                          maxLength="4"
                          style={{ flex: 1 }}
                          readOnly
                          disabled
                        />
                      </div>
                      <input
                        type="hidden"
                        name="batch"
                        value={batchStartYear && batchEndYear ? `${batchStartYear}-${batchEndYear}` : ""}
                      />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>DOB <RequiredStar /></label>
                      <DOBDatePicker value={dob} onChange={setDob} />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Degree <RequiredStar /></label>
                      <select
                        name="degree"
                        value={selectedDegree}
                        onChange={(event) => {
                          setSelectedDegree(event.target.value);
                          setSelectedBranch('');
                        }}
                        required
                      >
                        <option value="" disabled>Select Degree</option>
                        {degrees.map((degree) => {
                          const value = degree.degreeAbbreviation || degree.degreeFullName;
                          const label = degree.degreeFullName
                            ? degree.degreeAbbreviation
                              ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                              : degree.degreeFullName
                            : value;
                          return (
                            <option key={degree.id || degree._id || value} value={value}>{label}</option>
                          );
                        })}
                      </select>
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Branch <RequiredStar /></label>
                      <select
                        name="branch"
                        value={selectedBranch}
                        onChange={(event) => setSelectedBranch(event.target.value)}
                        required
                        disabled={!selectedDegree}
                      >
                        <option value="" disabled>
                          {selectedDegree ? 'Select Branch' : 'Select Degree First'}
                        </option>
                        {filteredBranches.map((branch) => {
                          const value = getBranchOptionValue(branch);
                          const label = branch.branchFullName
                            ? branch.branchAbbreviation
                              ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                              : branch.branchFullName
                            : value;
                          return (
                            <option key={branch.id || branch._id || value} value={value}>{label}</option>
                          );
                        })}
                      </select>
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Current Year <RequiredStar /></label>
                      <select
                        name="currentYear"
                        value={currentYear}
                        onChange={(event) => {
                          const newYear = event.target.value;
                          setCurrentYear(newYear);
                          const semesters = getAvailableSemesters(newYear);
                          setCurrentSemester(semesters[0] || "");
                          setTimeout(handleInputChange, 100);
                        }}
                        required
                      >
                        <option value="" disabled>Select Current Year</option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Current Semester <RequiredStar /></label>
                      <select
                        name="currentSemester"
                        value={currentSemester}
                        onChange={(event) => {
                          setCurrentSemester(event.target.value);
                          setTimeout(handleInputChange, 100);
                        }}
                        required
                        disabled={!currentYear}
                      >
                        <option value="" disabled>
                          {currentYear ? "Select Current Semester" : "Select Year First"}
                        </option>
                        {getAvailableSemesters(currentYear).map((semesterOption) => (
                          <option key={semesterOption} value={semesterOption}>{semesterOption}</option>
                        ))}
                      </select>
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Section <RequiredStar /></label>
                      <select name="section" defaultValue="" required>
                        <option value="" disabled>Select Section</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Gender <RequiredStar /></label>
                      <select name="gender" defaultValue="" required>
                        <option value="" disabled>Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Address</label>
                      <input type="text" name="address" placeholder="Enter Address" />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>City</label>
                      <input type="text" name="city" placeholder="Enter City" />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Primary Email <RequiredStar /></label>
                      <input type="email" name="primaryEmail" placeholder="Enter Primary Email" required />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Domain Email <RequiredStar /></label>
                      <input type="email" name="domainEmail" placeholder="Enter Domain Email" required />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Mobile No. <RequiredStar /></label>
                      <MobileInputWithPrefix name="mobileNo" placeholder="Enter Mobile No." onChange={handleInputChange} />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Father Name <RequiredStar /></label>
                      <input type="text" name="fatherName" placeholder="Enter Father Name" required />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Father Occupation</label>
                      <input type="text" name="fatherOccupation" placeholder="Enter Father Occupation" />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Father's Mobile No. <RequiredStar /></label>
                      <MobileInputWithPrefix name="fatherMobile" placeholder="Enter Father's Mobile No." onChange={handleInputChange} />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Mother Name <RequiredStar /></label>
                      <input type="text" name="motherName" placeholder="Enter Mother Name" required />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Mother Occupation</label>
                      <input type="text" name="motherOccupation" placeholder="Enter Mother Occupation" />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Mother's Mobile No. <RequiredStar /></label>
                      <MobileInputWithPrefix name="motherMobile" placeholder="Enter Mother's Mobile No." onChange={handleInputChange} />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Guardian Name</label>
                      <input type="text" name="guardianName" placeholder="Enter Guardian Name" />
                    </div>
                    <div className={cx("mr-field")}>
                      <label>Guardian's Mobile No.</label>
                      <MobileInputWithPrefix name="guardianMobile" placeholder="Enter Guardian's Mobile No." onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* ── Profile Photo ── */}
                  <div className={cx("mr-profile-photo-wrapper")}>
                    <div className={cx("mr-profile-photo-box")} style={{ height: "732px" }}>
                      <h3 className={cx("mr-section-header")}>Profile Photo</h3>
                      <div className={cx("mr-profile-icon-container")}>
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile Preview"
                            className={cx("mr-profile-preview-img")}
                            onClick={() => setImagePreviewOpen(true)}
                            onLoad={() => console.log('[MainRegistration] Image preview loaded')}
                            onError={(e) => console.error('[MainRegistration] Image preview failed:', e)}
                          />
                        ) : (
                          <GraduationCapIcon />
                        )}
                      </div>
                      {profileImage && uploadInfo.name && (
                        <div className={cx("mr-upload-info-container")}>
                          <div className={cx("mr-upload-info-item")}>
                            <FileIcon />
                            <span>{uploadInfo.name}</span>
                          </div>
                          <div className={cx("mr-upload-info-item")}>
                            <CalendarIcon />
                            <span>Uploaded on: {uploadInfo.date}</span>
                          </div>
                        </div>
                      )}
                      <div className={cx("mr-upload-action-area")}>
                        <div className={cx("mr-upload-btn-wrapper")}>
                          <label htmlFor="photo-upload-input" className={cx("mr-profile-upload-btn")}>
                            <div className={cx("mr-upload-btn-content")}>
                              <MdUpload /> <span>Upload (Max 500 KB)</span>
                            </div>
                          </label>
                          {profileImage && (
                            <button
                              onClick={handleImageRemove}
                              className={cx("mr-remove-image-btn")}
                              aria-label="Remove image"
                            >
                              <IoMdClose />
                            </button>
                          )}
                        </div>
                        {/*
                          NO accept attribute here — Windows file picker will show ALL files.
                          File format validation is handled by getFileType() in handleImageUpload.
                        */}
                        <input
                          type="file"
                          id="photo-upload-input"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          onChange={handleImageUpload}
                        />
                        {uploadSuccess && (
                          <p className={cx("mr-upload-success-message")}>
                            Profile Photo uploaded Successfully!
                          </p>
                        )}
                        <p className={cx("mr-upload-hint")}>*Supported formats: JPG, JPEG, WebP (max 500KB)</p>
                      </div>
                    </div>
                    <div style={{ marginTop: "24px" }} className={cx("mr-field")}>
                      <label>Community <RequiredStar /></label>
                      <select name="community" defaultValue="" required>
                        <option value="" disabled>Select Community</option>
                        <option value="OC">OC</option>
                        <option value="BC">BC</option>
                        <option value="BCM">BCM</option>
                        <option value="MBC">MBC</option>
                        <option value="SC">SC</option>
                        <option value="SCA">SCA</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div style={{ marginTop: "24px" }} className={cx("mr-field")}>
                      <label>Medium <RequiredStar /></label>
                      <select name="mediumOfStudy" defaultValue="" required>
                        <option value="" disabled>Select Medium</option>
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Other">Others</option>
                      </select>
                    </div>
                    <div style={{ marginTop: "24px" }} className={cx("mr-field")}>
                      <label>Blood Group</label>
                      <input type="text" name="bloodGroup" placeholder="Enter Blood Group" />
                    </div>
                    <div style={{ marginTop: "24px" }} className={cx("mr-field")}>
                      <label>Aadhaar Number <RequiredStar /></label>
                      <input type="text" name="aadhaarNo" placeholder="Enter Aadhaar Number (12 digits)" maxLength="12" required />
                    </div>
                    <div style={{ marginTop: "24px" }} className={cx("mr-field")}>
                      <label>Portfolio Link</label>
                      <input type="url" name="portfolioLink" placeholder="Enter Portfolio Link" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Academic Background ── */}
              <div className={cx("mr-profile-section-container")} ref={sectionRefs.academic}>
                <h3 className={cx("mr-section-header")}>Academic Background</h3>
                <div className={cx("mr-form-grid")}>
                  <div className={cx("mr-study-category")} style={{ gridColumn: "1 / -1" }}>
                    <input type="radio" id="12th" name="studyCategory" value="12th" checked={studyCategory === "12th"} onChange={(e) => setStudyCategory(e.target.value)} />
                    <label htmlFor="12th">12th</label>
                    <input type="radio" id="diploma" name="studyCategory" value="diploma" checked={studyCategory === "diploma"} onChange={(e) => setStudyCategory(e.target.value)} />
                    <label htmlFor="diploma">Diploma</label>
                    <input type="radio" id="both" name="studyCategory" value="both" checked={studyCategory === "both"} onChange={(e) => setStudyCategory(e.target.value)} />
                    <label htmlFor="both">Both</label>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>10th Institution Name <RequiredStar /></label>
                    <input type="text" name="tenthInstitution" placeholder="Enter 10th Institution Name" required />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>10th Board <RequiredStar /></label>
                    <select name="tenthBoard" defaultValue="" required>
                      <option value="" disabled>Select 10th Board</option>
                      <option value="State Board">State Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="Other State Board">Other State Board</option>
                    </select>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>10th Percentage <RequiredStar /></label>
                    <input type="text" name="tenthPercentage" placeholder="Enter 10th Percentage" required />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>10th Year of Passing <RequiredStar /></label>
                    <input type="text" name="tenthYear" placeholder="Enter 10th Year of Passing" required />
                  </div>
                  {(studyCategory === "12th" || studyCategory === "both") && (
                    <>
                      <div className={cx("mr-field")}>
                        <label>12th Institution Name <RequiredStar /></label>
                        <input type="text" name="twelfthInstitution" placeholder="Enter 12th Institution Name" required />
                      </div>
                      <div className={cx("mr-field")}>
                        <label>12th Board <RequiredStar /></label>
                        <select name="twelfthBoard" defaultValue="" required>
                          <option value="" disabled>Select 12th Board</option>
                          <option value="State Board">State Board</option>
                          <option value="CBSE">CBSE</option>
                          <option value="ICSE">ICSE</option>
                          <option value="Other State Board">Other State Board</option>
                        </select>
                      </div>
                      <div className={cx("mr-field")}>
                        <label>12th Percentage <RequiredStar /></label>
                        <input type="text" name="twelfthPercentage" placeholder="Enter 12th Percentage" required />
                      </div>
                      <div className={cx("mr-field")}>
                        <label>12th Year of Passing <RequiredStar /></label>
                        <input type="text" name="twelfthYear" placeholder="Enter 12th Year of Passing" required />
                      </div>
                      <div className={cx("mr-field")}>
                        <label>12th Cut-off <RequiredStar /></label>
                        <input type="text" name="twelfthCutoff" placeholder="Enter 12th Cut-off" required />
                      </div>
                    </>
                  )}
                  {(studyCategory === "diploma" || studyCategory === "both") && (
                    <>
                      <div className={cx("mr-field")}>
                        <label>Diploma Institution <RequiredStar /></label>
                        <input type="text" name="diplomaInstitution" placeholder="Enter Diploma Institution" required />
                      </div>
                      <div className={cx("mr-field")}>
                        <label>Diploma Branch <RequiredStar /></label>
                        <input type="text" name="diplomaBranch" placeholder="Enter Diploma Branch" required />
                      </div>
                      <div className={cx("mr-field")}>
                        <label>Diploma Percentage <RequiredStar /></label>
                        <input type="text" name="diplomaPercentage" placeholder="Enter Diploma Percentage" required />
                      </div>
                      <div className={cx("mr-field")}>
                        <label>Diploma Year <RequiredStar /></label>
                        <input type="text" name="diplomaYear" placeholder="Enter Diploma Year" required />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Other Details ── */}
              <div className={cx("mr-profile-section-container")} ref={sectionRefs.other}>
                <h3 className={cx("mr-section-header")}>Other Details</h3>
                <div className={cx("mr-form-grid")}>
                  <div className={cx("mr-field")}>
                    <label>Residential Status <RequiredStar /></label>
                    <select name="residentialStatus" value={residentialStatus} onChange={(e) => setResidentialStatus(e.target.value)} required>
                      <option value="" disabled>Select Residential Status</option>
                      <option value="Hosteller">Hosteller</option>
                      <option value="Dayscholar">Dayscholar</option>
                    </select>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Quota <RequiredStar /></label>
                    <select name="quota" value={quota} onChange={(e) => setQuota(e.target.value)} required>
                      <option value="" disabled>Select Quota</option>
                      <option value="Management">Management</option>
                      <option value="Counselling">Counselling</option>
                    </select>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Spoken Languages</label>
                    <input type="text" name="languagesKnown" placeholder="Exclude Tamil & English" />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>First Graduate <RequiredStar /></label>
                    <select name="firstGraduate" value={firstGraduate} onChange={(e) => setFirstGraduate(e.target.value)} required>
                      <option value="" disabled>Select First Graduate</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Passport No.</label>
                    <input type="text" name="passportNo" placeholder="Enter Passport No." />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Skill set <RequiredStar /></label>
                    <input type="text" name="skillSet" placeholder="Enter Skill set" required />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Value Added Courses</label>
                    <input type="text" name="valueAddedCourses" placeholder="Enter Value Added Courses" />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>About Sibling</label>
                    <input type="text" name="aboutSibling" placeholder="Enter About Sibling" />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Ration card No. <RequiredStar /></label>
                    <input type="text" name="rationCardNo" placeholder="Enter Ration card No." required />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Family Annual Income <RequiredStar /></label>
                    <input type="text" name="familyAnnualIncome" placeholder="Enter Family Annual Income" required />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>PAN No. <RequiredStar /></label>
                    <input type="text" name="panNo" placeholder="Enter PAN No." required />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Willing to Sign Bond <RequiredStar /></label>
                    <select name="willingToSignBond" value={willingToSignBond} onChange={(e) => setWillingToSignBond(e.target.value)} required>
                      <option value="" disabled>Select Willing to Sign Bond</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Preferred Mode of Drive <RequiredStar /></label>
                    <select name="preferredModeOfDrive" value={preferredModeOfDrive} onChange={(e) => setPreferredModeOfDrive(e.target.value)} required>
                      <option value="" disabled>Select Preferred Mode of Drive</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Github Link</label>
                    <input
                      type="url"
                      name="githubLink"
                      placeholder="Enter Github Link (e.g. https://github.com/username)"
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && !GITHUB_URL_REGEX.test(val)) {
                          e.target.style.borderColor = '#dc3545';
                          e.target.title = 'Must be: https://github.com/your-username';
                          setUrlErrorType('GitHub');
                          setInvalidUrl(val);
                          setURLErrorPopupOpen(true);
                        } else {
                          e.target.style.borderColor = val ? '#28a745' : '';
                          e.target.title = '';
                        }
                      }}
                    />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>LinkedIn Link</label>
                    <input
                      type="url"
                      name="linkedinLink"
                      placeholder="Enter LinkedIn Link (e.g. https://linkedin.com/in/username)"
                      onChange={handleInputChange}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && !LINKEDIN_URL_REGEX.test(val)) {
                          e.target.style.borderColor = '#dc3545';
                          e.target.title = 'Must be: https://linkedin.com/in/your-username';
                          setUrlErrorType('LinkedIn');
                          setInvalidUrl(val);
                          setURLErrorPopupOpen(true);
                        } else {
                          e.target.style.borderColor = val ? '#28a745' : '';
                          e.target.title = '';
                        }
                      }}
                    />
                  </div>
                  {/* Hidden inputs for state-managed fields */}
                  <input type="hidden" name="companyTypes" value={selectedCompanyTypes.join(", ")} />
                  <input type="hidden" name="preferredJobLocation" value={selectedJobLocations.join(", ")} />
                  
                  <div className={cx("mr-checkbox-group")}>
                    <span className={cx("mr-checkbox-group__label")}>Company Types <RequiredStar /></span>
                    <div className={cx("mr-checkbox-group__options")}>
                      {COMPANY_TYPE_OPTIONS.map((option, index) => {
                        const isChecked = selectedCompanyTypes.includes(option);
                        return (
                          <label key={option} className={cx("mr-checkbox-option")}>
                            <input
                              type="checkbox"
                              name="companyTypes"
                              value={option}
                              checked={isChecked}
                              onChange={handleCompanyTypeChange}
                              required={!selectedCompanyTypes.length && index === 0}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className={cx("mr-checkbox-group")}>
                    <span className={cx("mr-checkbox-group__label")}>Preferred Job Locations <RequiredStar /></span>
                    <div className={cx("mr-checkbox-group__options")}>
                      {JOB_LOCATION_OPTIONS.map((option, index) => {
                        const isChecked = selectedJobLocations.includes(option);
                        return (
                          <label key={option} className={cx("mr-checkbox-option")}>
                            <input
                              type="checkbox"
                              name="preferredJobLocation"
                              value={option}
                              checked={isChecked}
                              onChange={handleJobLocationChange}
                              required={!selectedJobLocations.length && index === 0}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Login Details ── */}
              <div className={cx("mr-profile-section-container")} ref={sectionRefs.login}>
                <h3 className={cx("mr-section-header")}>Login Details</h3>
                <div className={cx("mr-form-grid")}>
                  <div className={cx("mr-field")}>
                    <label>Register No <RequiredStar /></label>
                    <input
                      type="text"
                      name="loginRegNo"
                      placeholder="Enter Register No (11 digits)"
                      maxLength="11"
                      onBlur={handleLoginRegNoBlur}
                      required
                    />
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Password <RequiredStar /></label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        name="loginPassword"
                        placeholder="Enter Password (DDMMYYYY)"
                        required
                        style={{ paddingRight: "40px" }}
                      />
                      <button type="button" className={cx("password-toggle-btn")} onClick={() => setShowLoginPassword((prev) => !prev)}>
                        {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className={cx("mr-field")}>
                    <label>Confirm Password <RequiredStar /></label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Enter Confirm Password"
                        required
                        style={{ paddingRight: "40px" }}
                      />
                      <button type="button" className={cx("password-toggle-btn")} onClick={() => setShowConfirmPassword((prev) => !prev)}>
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className={cx("mr-action-buttons")}>
                <button
                  type="button"
                  className={cx("mr-discard-btn", isRegistering ? "mr-discard-btn-disabled" : "")}
                  onClick={handleDiscard}
                  disabled={isRegistering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cx("mr-save-btn", !isRegisterEnabled ? "mr-save-btn-disabled" : "")}
                  disabled={!isRegisterEnabled || isRegistering}
                  onClick={(event) => {
                    if (!isRegisterEnabled) {
                      event.preventDefault();
                      const errorMessages = validationErrors.map(e => e.message).slice(0, 5).join("\n");
                      setValidationErrorMessage(`Please complete required fields:\n${errorMessages}`);
                      setValidationErrorPopupOpen(true);
                    }
                  }}
                >
                  {isRegistering ? (
                    <>
                      <div className={cx("mr-loading-spinner")} />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </button>
              </div>

              {/* ── Validation Error List ── */}
              {validationErrors.length > 0 && (
                <div className={styles.validationErrorBox}>
                  <h4>⚠️ Required Fields Missing:</h4>
                  <ul>
                    {(showAllErrors ? validationErrors : validationErrors.slice(0, 10)).map((error, index) => (
                      <li
                        key={index}
                        onClick={() => scrollToFieldAndBlink(error.field)}
                        className={styles.validationErrorItem}
                      >
                        {error.message}
                      </li>
                    ))}
                  </ul>
                  {validationErrors.length > 10 && (
                    <div className={styles.validationErrorToggle}>
                      <button
                        type="button"
                        onClick={() => setShowAllErrors(!showAllErrors)}
                        className={styles.showMoreButton}
                      >
                        {showAllErrors
                          ? 'Show Less ▲'
                          : `Show More (${validationErrors.length - 10} more) ▼`
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Overlays & Popups ── */}
      {isSidebarOpen && <div className={cx("mr-overlay")} onClick={() => setIsSidebarOpen(false)} />}

      <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
      <ConfirmDiscardPopup isOpen={isDiscardPopupOpen} onConfirm={handleConfirmDiscard} onCancel={handleCancelDiscard} />
      <ExistingRegNoPopup isOpen={isExistingRegNoPopupOpen} onClose={closeExistingRegNoPopup} regNo={existingRegNo} />
      <MismatchedRegNoPopup isOpen={isMismatchedRegNoPopupOpen} onClose={closeMismatchedRegNoPopup} personalRegNo={personalRegNo} loginRegNo={loginRegNo} />
      <FileSizeErrorPopup isOpen={isFileSizeErrorOpen} onClose={closeFileSizeErrorPopup} fileSizeKB={fileSizeErrorKB} />
      <FileFormatErrorPopup isOpen={isFileFormatErrorOpen} onClose={closeFileFormatErrorPopup} fileName={invalidFileName} />
      <URLValidationErrorPopup isOpen={isURLErrorPopupOpen} onClose={closeURLErrorPopup} urlType={urlErrorType} invalidUrl={invalidUrl} />
      <ValidationErrorPopup isOpen={isValidationErrorPopupOpen} onClose={() => setValidationErrorPopupOpen(false)} message={validationErrorMessage} />
      <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
    </div>
  );
}

export default MainRegistration;
