import React, { useRef, useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import certificateService from "../services/certificateService.jsx";
import uploadIcon from "../assets/popupUploadicon.png";
import styles from "./Achievements.module.css";
import DOBDatePicker from "../components/Calendar/DOBDatePicker.jsx";
import FormDropdown from "../components/common/FormDropdown/FormDropdown.jsx";

const formatDate = (value) => {
  if (!value && value !== 0) return "";

  const pad = (num) => String(num).padStart(2, "0");

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    return `${pad(value.getDate())}-${pad(value.getMonth() + 1)}-${value.getFullYear()}`;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : formatDate(date);
  }

  const stringValue = sanitizeString(value);
  if (!stringValue) return "";

  const ddmmyyyy = stringValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return `${pad(d)}-${pad(m)}-${y}`;
  }

  const yyyymmdd = stringValue.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd;
    return `${pad(d)}-${pad(m)}-${y}`;
  }

  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return formatDate(parsed);
};

const getNestedValue = (obj, path) => {
  try {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  } catch (e) {
    return undefined;
  }
};

const parseInitialDate = (input) => {
  if (!input && input !== 0) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  const stringValue = sanitizeString(input);
  if (!stringValue) return null;

  const ddmmyyyy = stringValue.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy.map((part, index) => (index === 0 ? part : Number(part)));
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const yyyymmdd = stringValue.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd.map((part, index) => (index === 0 ? part : Number(part)));
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d+$/.test(stringValue)) {
    const timestamp = Number(stringValue);
    if (!Number.isNaN(timestamp)) {
      const date = stringValue.length > 10 ? new Date(timestamp) : new Date(timestamp * 1000);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  const parsed = new Date(stringValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sanitizeString = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  const stringValue = typeof value === "string" ? value : String(value);
  const trimmed = stringValue.trim();
  if (!trimmed || trimmed === "--" || trimmed.toLowerCase() === "na" || trimmed.toLowerCase() === "n/a") {
    return "";
  }
  return trimmed;
};

const normalizeYearValue = (value) => {
  const normalized = sanitizeString(value).toUpperCase();
  if (!normalized) return "";
  const romanMap = {
    "1": "I", "2": "II", "3": "III", "4": "IV",
    "I": "I", "II": "II", "III": "III", "IV": "IV",
  };
  return romanMap[normalized] || normalized;
};

const normalizeSemesterValue = (value) => {
  const normalized = sanitizeString(value);
  if (!normalized) return "";
  const numberMatch = normalized.match(/\d+/);
  return numberMatch ? numberMatch[0] : normalized;
};

const extractBase64Content = (value) => {
  const sanitized = sanitizeString(value);
  if (!sanitized) return "";
  if (sanitized.startsWith("data:")) {
    const commaIndex = sanitized.indexOf(",");
    if (commaIndex !== -1) {
      return sanitized.slice(commaIndex + 1).trim();
    }
    return "";
  }
  return sanitized;
};

const ensureDataUrl = (value, mimeType = "application/pdf") => {
  const sanitized = sanitizeString(value);
  if (!sanitized) return "";
  if (sanitized.startsWith("data:")) {
    return sanitized;
  }
  return `data:${mimeType};base64,${sanitized}`;
};

const getFirstMatchingNumber = (data, keys = []) => {
  for (const key of keys) {
    const candidate = getNestedValue(data, key);
    if (candidate === null || candidate === undefined) continue;
    const parsed = Number(candidate);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const getFirstMatchingValue = (data, keys = []) => {
  for (const key of keys) {
    const candidate = getNestedValue(data, key);
    const sanitized = sanitizeString(candidate);
    if (sanitized) {
      return sanitized;
    }
  }
  return "";
};

const normalizeInitialCertificateData = (rawData = {}) => {
  if (!rawData || typeof rawData !== "object") {
    return {
      id: "",
      achievementId: "",
      certificateId: "",
      reg: "",
      name: "",
      year: "",
      semester: "",
      section: "",
      comp: "",
      prize: "",
      fileName: "",
      fileContent: "",
      filePreviewData: "",
      fileType: "application/pdf",
      fileSize: 0,
      uploadDate: "",
      date: null,
    };
  }

  const data = rawData;

  const reg = getFirstMatchingValue(data, [
    "reg",
    "regNo",
    "registerNumber",
    "registrationNumber",
    "studentRegNo",
  ]);

  const name = getFirstMatchingValue(data, [
    "name",
    "studentName",
    "fullName",
  ]);

  const yearRaw = getFirstMatchingValue(data, [
    "year",
    "academicYear",
    "studentYear",
  ]);

  const semesterRaw = getFirstMatchingValue(data, [
    "semester",
    "sem",
    "semesterValue",
  ]);

  const section = getFirstMatchingValue(data, [
    "section",
    "sectionName",
    "studentSection",
  ]);

  const comp = getFirstMatchingValue(data, [
    "comp",
    "competition",
    "certificateName",
    "eventName",
  ]);

  const prize = getFirstMatchingValue(data, [
    "prize",
    "position",
    "award",
    "rank",
  ]);

  const fileName = getFirstMatchingValue(data, [
    "fileName",
    "certificateFileName",
    "documentName",
    "name",
  ]);

  const rawFileContent =
    data.fileData ||
    data.fileContent ||
    data.certificateFile ||
    data.document ||
    "";

  const normalizedFileContent = extractBase64Content(rawFileContent);

  const normalizedFileType =
    sanitizeString(
      data.fileType ||
      data.type ||
      data.mimeType ||
      data.contentType
    ) || (normalizedFileContent ? "application/pdf" : "");

  const filePreviewData = sanitizeString(
    data.filePreviewData ||
    data.previewData ||
    data.previewUrl ||
    data.filePreview ||
    ""
  );

  const fileSize = getFirstMatchingNumber(data, [
    "fileSize",
    "size",
    "documentSize",
    "certificateSize",
  ]);

  const uploadDateValue =
    data.uploadDate ||
    data.uploadedAt ||
    data.lastUploaded ||
    data.updatedAt ||
    data.createdAt ||
    "";

  const uploadDateCandidate =
    uploadDateValue instanceof Date
      ? uploadDateValue
      : parseInitialDate(uploadDateValue);

  const uploadDateString =
    uploadDateCandidate ? formatDate(uploadDateCandidate) : sanitizeString(uploadDateValue);

  const primaryDateRaw = getFirstMatchingValue(data, [
    "date",
    "eventDate",
    "achievedOn",
    "achievementDate",
    "issuedOn",
    "awardDate",
    "certificateDate",
    "createdAt",
  ]);

  const dateCandidate =
    data.date instanceof Date ? data.date : parseInitialDate(primaryDateRaw);

  const dateString = primaryDateRaw || uploadDateString;

  return {
    id: sanitizeString(data.id || data._id || data.achievementId || data.certificateId),
    achievementId: sanitizeString(data.achievementId || data.id || data.certificateId),
    certificateId: sanitizeString(data.certificateId || data._id || data.id || data.achievementId),
    reg,
    name,
    year: normalizeYearValue(yearRaw),
    semester: normalizeSemesterValue(semesterRaw),
    section,
    comp,
    prize,
    fileName,
    fileContent: normalizedFileContent,
    filePreviewData,
    fileType: normalizedFileType || "application/pdf",
    fileSize,
    uploadDate: uploadDateString,
    date: dateCandidate || parseInitialDate(dateString),
  };
};



// ── Helper: convert Date object → 'YYYY-MM-DD' string ─────────────────────
const dateToStr = (d) => {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ++ NEW: Success Popup Component for Edit ++
const SuccessPopup = ({ onClose }) => (
  <div className={styles['Edit-popup-container']}>
    <div className={styles['Edit-popup-header']}>Edit !</div>
    <div className={styles['Edit-popup-body']}>
      <svg className={styles['Edit-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className={styles['Edit-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
        <path className={styles['Edit-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
        Updated ✓
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Changes are Updated
      </p>
    </div>
    <div className={styles['Edit-popup-footer']}>
      <button onClick={onClose} className={styles['Edit-popup-close-btn']}>
        Close
      </button>
    </div>
  </div>
);

// ++ NEW: Error Popup Component ++
const ErrorPopup = ({ onClose, errorMessage }) => (
  <div className={styles['Edit-popup-container']}>
    <div className={styles['Edit-popup-header']} style={{  }}>Update Failed!</div>
    <div className={styles['Edit-popup-body']}>
      <svg className={styles['Edit-error-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className={styles['Edit-error-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
        <path className={styles['Edit-error-icon--cross']} fill="none" d="M16 16l20 20M36 16L16 36"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
        Update Failed ✗
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        {errorMessage || "Certificate update failed"}
      </p>
    </div>
    <div className={styles['Edit-popup-footer']}>
      <button onClick={onClose} className={styles['Edit-popup-close-btn']}>
        Close
      </button>
    </div>
  </div>
);


export default function EditCertificate({ onClose, onUpdate, initialData }) {
  const fileInputRef = useRef();
  const normalizedInitial = useMemo(() => normalizeInitialCertificateData(initialData), [initialData]);
  const fallbackPreviewData = useMemo(() => {
    if (normalizedInitial.filePreviewData) return normalizedInitial.filePreviewData;
    if (normalizedInitial.fileContent) {
      return ensureDataUrl(normalizedInitial.fileContent, normalizedInitial.fileType);
    }
    return "";
  }, [normalizedInitial]);
  const [fileName, setFileName] = useState(normalizedInitial.fileName || "");
  const [fileContent, setFileContent] = useState(normalizedInitial.fileContent || "");
  const [lastUploaded, setLastUploaded] = useState(normalizedInitial.uploadDate || "");
  const [filePreviewData, setFilePreviewData] = useState(fallbackPreviewData);
  const [fileType, setFileType] = useState(normalizedInitial.fileType || "application/pdf");
  const [fileSize, setFileSize] = useState(normalizedInitial.fileSize || 0);
  const [hasNewFile, setHasNewFile] = useState(false);
  const [error, setError] = useState("");
  const [isUpdated, setIsUpdated] = useState(false); // MODIFIED: State for popup
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  // Calculate file info for display
  const finalFileName = fileName || normalizedInitial.fileName;
  const finalUploadDate = formatDate(hasNewFile ? lastUploaded : normalizedInitial.uploadDate);

  const [formData, setFormData] = useState({
    reg: normalizedInitial.reg || "",
    name: normalizedInitial.name || "",
    year: normalizedInitial.year || "",
    semester: normalizedInitial.semester || "",
    section: normalizedInitial.section || "",
    date: dateToStr(normalizedInitial.date) || "",
    comp: normalizedInitial.comp || "",
    prize: normalizedInitial.prize || "",
  });

  // Clear error on component mount if there's an existing file
  useEffect(() => {
    const hasExistingFile =
      normalizedInitial.fileContent ||
      normalizedInitial.fileName;
    if (hasExistingFile) {
      setError(""); // Clear any error if we have an existing file
      console.log('Cleared error on mount - existing file found:', hasExistingFile);
    }
  }, [normalizedInitial]);

  useEffect(() => {
    setFileName(normalizedInitial.fileName || "");
    setFileContent(normalizedInitial.fileContent || "");
    setLastUploaded(normalizedInitial.uploadDate || "");
    setFilePreviewData(fallbackPreviewData);
    setFileType(normalizedInitial.fileType || "application/pdf");
    setFileSize(normalizedInitial.fileSize || 0);
    setHasNewFile(false);
    setFormData({
      reg: normalizedInitial.reg || "",
      name: normalizedInitial.name || "",
      year: normalizedInitial.year || "",
      semester: normalizedInitial.semester || "",
      section: normalizedInitial.section || "",
      date: dateToStr(normalizedInitial.date) || "",
      comp: normalizedInitial.comp || "",
      prize: normalizedInitial.prize || "",
    });
  }, [normalizedInitial]);

  // Debug file state changes
  useEffect(() => {
    console.log('📁 File state changed:', {
      fileName: fileName,
      fileContent: fileContent ? 'Present' : 'Missing',
      lastUploaded: lastUploaded,
      fileType,
      fileSize,
      hasNewFile,
      timestamp: new Date().toISOString()
    });
  }, [fileName, fileContent, lastUploaded, fileType, fileSize, hasNewFile]);

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

  const [isDragging, setIsDragging] = useState(false);

  const handleFileProcess = (file) => {
    if (!file) return;
    const maxSize = 500 * 1024;
    const fileSizeKB = (file.size / 1024).toFixed(1);

    if (file.type !== "application/pdf") {
      setError("File must be a PDF");
      setFileName(normalizedInitial.fileName || "");
      setFileContent(normalizedInitial.fileContent || "");
      setFilePreviewData(fallbackPreviewData);
      setFileType(normalizedInitial.fileType || "application/pdf");
      setFileSize(normalizedInitial.fileSize || 0);
      setHasNewFile(false);
      return;
    }

    if (file.size > maxSize) {
      setError(`File size limit exceeded!\n\nMaximum allowed: 500KB\nYour file size: ${fileSizeKB}KB\n\nPlease compress your PDF or choose a smaller file.`);
      setFileName(normalizedInitial.fileName || "");
      setFileContent(normalizedInitial.fileContent || "");
      setFilePreviewData(fallbackPreviewData);
      setFileType(normalizedInitial.fileType || "application/pdf");
      setFileSize(normalizedInitial.fileSize || 0);
      setHasNewFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileName(file.name);
    setError("");
    const resolvedType = file.type || "application/pdf";
    setFileContent(file);
    setFilePreviewData(URL.createObjectURL(file));
    setFileType(resolvedType);
    setFileSize(file.size || 0);
    setHasNewFile(true);
    setLastUploaded(formatDate(new Date()));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFileProcess(file);
  };

  const handleUploadClick = () => fileInputRef.current.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    // File upload is OPTIONAL during edit - check for existing file in multiple ways
    const hasExistingFile = normalizedInitial.fileContent || normalizedInitial.fileName;
    const hasNewFile = fileName && fileContent;
    const hasAnyFile = hasExistingFile || hasNewFile;
    
    console.log('File validation check:', {
      hasExistingFile: !!hasExistingFile,
      hasNewFile: !!hasNewFile,
      hasAnyFile: !!hasAnyFile,
      fileName: fileName,
      fileContent: !!fileContent,
      willReplaceFile: !!hasNewFile,
      initialDataFileData: !!initialData?.fileData,
      initialDataFileContent: !!initialData?.fileContent,
      initialDataFileName: !!initialData?.fileName
    });
    
    // Only require file if there was no existing file and no new file uploaded
    if (!hasAnyFile) {
      setError("Please upload your certificate (PDF, Max 500KB).");
      return;
    } else {
      // Clear any existing error if we have a file
      setError("");
    }
    
    if (
      !formData.reg || !formData.name || !formData.year || !formData.semester ||
      !formData.section || !formData.date || !formData.comp || !formData.prize
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsLoading(true); // Start loading
    
    // Optimized: Streamlined processing for faster updates
    const formattedDate = formatDate(formData.date);

    // Fast file replacement logic
    const finalFileData = hasNewFile ? '' : (normalizedInitial.fileContent || ""); // no base64 for new files
    const rawFile = hasNewFile ? fileContent : null; // File object for GridFS upload
    const finalFileName = hasNewFile ? fileName : (normalizedInitial.fileName || fileName);
    const finalUploadDate = formatDate(hasNewFile ? lastUploaded : normalizedInitial.uploadDate);
    const finalFileType = hasNewFile ? (fileType || "application/pdf") : (normalizedInitial.fileType || "application/pdf");
    const finalFileSize = hasNewFile ? (fileSize || 0) : (normalizedInitial.fileSize || 0);
    const finalFilePreviewData = hasNewFile
      ? (filePreviewData || '')
      : fallbackPreviewData;

    const normalizedId = normalizedInitial.id || initialData?.id || `${Date.now()}`;
    const normalizedAchievementId = normalizedInitial.achievementId || initialData?.achievementId || normalizedInitial.certificateId || initialData?.certificateId || normalizedId;
    const normalizedCertificateId = normalizedInitial.certificateId || initialData?.certificateId || normalizedInitial._id || initialData?._id || normalizedAchievementId;

    const updatedAchievement = {
      id: normalizedId,
      achievementId: normalizedAchievementId,
      certificateId: normalizedCertificateId,
      reg: formData.reg,
      name: formData.name,
      year: formData.year,
      semester: formData.semester,
      section: formData.section,
      date: formData.date,
      comp: formData.comp,
      prize: formData.prize,
      status: initialData?.status || "pending",
      approved: initialData?.approved || false,
      fileName: finalFileName,
      fileData: finalFileData, // Empty for new files (using GridFS)
      rawFile: rawFile, // File object for GridFS upload by parent
      fileType: finalFileType,
      fileSize: finalFileSize,
      filePreviewData: finalFilePreviewData,
      uploadDate: finalUploadDate,
    };

    // Optimized: Minimal logging for faster processing

    try {
      // Optimized: Direct update call without excessive logging
      if (onUpdate) {
        await onUpdate(updatedAchievement);
        setIsUpdated(true);
      } else {
        throw new Error('Update function not available');
      }
    } catch (error) {
      console.error('Update failed:', error.message);
      setErrorMessage(error.message || "Certificate update failed. Please try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent back button navigation while updating
  useEffect(() => {
    if (!isLoading) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e) => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isLoading]);

  return (
    <>
      <div
        style={{
          minHeight: "100vh", width: "100vw", position: "fixed", left: 0, top: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0, 0, 0, 0.2)", zIndex: 9999, cursor: "default",
        }}
      >
        {isUpdated ? (
          <SuccessPopup onClose={onClose} />
        ) : isError ? (
          <ErrorPopup onClose={onClose} errorMessage={errorMessage} />
        ) : (
          <div
            className={styles['Achievement-popup-container']}
            style={{ width: 460, maxWidth: "95vw" }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles['Achievement-popup-header']}>
              Edit Certificate
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles['Achievement-popup-body']} style={{ padding: "1.5rem 1.5rem 0.5rem 1.5rem" }}>
                {/* Year & Semester Row */}
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label className={styles['field-label']}>Year</label>
                    <FormDropdown
                      options={[
                        { label: "Year I", value: "I" },
                        { label: "Year II", value: "II" },
                        { label: "Year III", value: "III" },
                        { label: "Year IV", value: "IV" }
                      ]}
                      selectedOption={formData.year}
                      onSelect={(val) => handleInputChange({ target: { name: "year", value: val } })}
                      placeholder="Select Year"
                      disabled={isLoading}
                      role="student"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label className={styles['field-label']}>Semester</label>
                    <FormDropdown
                      options={getAvailableSemesters(formData.year).map(sem => ({
                        label: `Semester ${sem}`,
                        value: sem
                      }))}
                      selectedOption={formData.semester}
                      onSelect={(val) => handleInputChange({ target: { name: "semester", value: val } })}
                      placeholder="Select Semester"
                      disabled={isLoading}
                      role="student"
                    />
                  </div>
                </div>

                {/* Section & Date Row */}
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label className={styles['field-label']}>Section</label>
                    <input className={styles['input-hover']} type="text" name="section" placeholder="Section" value={formData.section} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label className={styles['field-label']}>Date</label>
                    <DOBDatePicker
                      value={formData.date}
                      onChange={isLoading ? () => {} : handleDateChange}
                    />
                  </div>
                </div>

                {/* Competition & Prize Row */}
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label className={styles['field-label']}>Competition</label>
                    <input className={styles['input-hover']} type="text" name="comp" placeholder="Competition" value={formData.comp} onChange={isLoading ? undefined : handleInputChange} disabled={isLoading} required />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label className={styles['field-label']}>Prize</label>
                    <input className={styles['input-hover']} type="text" name="prize" placeholder="Prize" value={formData.prize} onChange={isLoading ? undefined : handleInputChange} disabled={isLoading} required />
                  </div>
                </div>

                {/* Drag & Drop File Zone (Image 2 style) */}
                <div
                  className={`${styles['Achievement-dropzone']} ${isDragging ? styles['Achievement-dropzone-active'] : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleUploadClick}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <div className={styles['Achievement-dropzone-icon']}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className={styles['Achievement-dropzone-title']}>Drag & Drop file here</p>
                  <p className={styles['Achievement-dropzone-text']}>or click to select a file</p>
                  {finalFileName && (
                    <div className={styles['Achievement-selected-file']} onClick={(e) => e.stopPropagation()}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {finalFileName}</span>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileName("");
                          setFileContent("");
                          setFilePreviewData(fallbackPreviewData);
                          setFileType("application/pdf");
                          setFileSize(0);
                          setLastUploaded("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontWeight: "bold", fontSize: "16px", marginLeft: "auto" }}
                        title="Clear file"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 13.5, color: "#444", marginTop: 4, textAlign: "center" }}>
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ color: "#2276fc", fontWeight: 600 }}>*</span> Upload Max 500KB PDF file
                  </div>
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ color: "#0d9477", fontWeight: 800, marginRight: 3 }}>✓</span> File upload is <span style={{ color: "#0d9477", fontWeight: 600 }}>OPTIONAL</span> during edit
                  </div>
                  {finalUploadDate && (
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ color: "#2276fc", fontWeight: 800, marginRight: 3 }}>*</span> Last uploaded: <span style={{ color: "#0d9477" }}>{finalUploadDate}</span>
                    </div>
                  )}
                  {error && <div style={{ color: "#ff6464", marginTop: 4 }}>{error}</div>}
                </div>
              </div>

              <div className={styles['Achievement-popup-footer']}>
                <button
                  type="button"
                  onClick={isLoading ? undefined : onClose}
                  disabled={isLoading}
                  className={styles['Achievement-popup-close-btn']}
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className={styles['Achievement-popup-submit-btn']}
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
