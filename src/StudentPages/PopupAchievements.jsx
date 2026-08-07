import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import certificateService from "../services/certificateService.jsx";
import styles from "./Achievements.module.css";
import DOBDatePicker from "../components/Calendar/DOBDatePicker.jsx";
import FormDropdown from "../components/common/FormDropdown/FormDropdown.jsx";

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

export default function CertificateUpload({ onClose, onUpload }) {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [lastUploaded, setLastUploaded] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
          year: studentData.currentYear || "I",
          semester: studentData.currentSemester || "1",
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

  const handleFileProcess = (file) => {
    if (!file) return;
    const maxSize = 500 * 1024;
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
      setError(`File size limit exceeded!\n\nMaximum allowed: 500KB\nYour file size: ${fileSizeKB}KB\n\nPlease compress your PDF or choose a smaller file.`);
      setFileName("");
      setFileContent("");
      setFileType("application/pdf");
      setFileSize(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFileContent(file);
    setError("");
    setFileName(file.name);
    setLastUploaded(formatDate(new Date()));
    setFileType(file.type || "application/pdf");
    setFileSize(file.size || 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFileProcess(file);
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

  const handleUploadClick = () => { if (isLoading) return; fileInputRef.current.click(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    setIsLoading(true);
    
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
      date: formData.date,
      comp: formData.comp,
      prize: formData.prize,
      status: "pending",
      fileName: fileName,
      fileData: '',
      rawFile: fileContent,
      fileType,
      fileSize,
      uploadDate: formatDate(new Date()),
    };

    try {
      if (onUpload) {
        await onUpload(newAchievement);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage(error.message || "Certificate upload failed. Please try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent back button navigation while submitting
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
          cursor: "default",
        }}
      >
        {!isSubmitted && !isError ? (
            <div
              className={styles['Achievement-popup-container']}
              style={{ width: 460, maxWidth: "95vw" }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles['Achievement-popup-header']}>
                Upload Certificate
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
                      <input
                        className={styles['input-hover']} type="text" name="section" placeholder="Section" value={formData.section} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                      />
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
                      <input
                        className={styles['input-hover']} type="text" name="comp" placeholder="Competition" value={formData.comp} onChange={handleInputChange} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : undefined }} required
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label className={styles['field-label']}>Prize</label>
                      <input
                        className={styles['input-hover']} type="text" name="prize" placeholder="Prize" value={formData.prize} onChange={handleInputChange} disabled={isLoading} style={{ cursor: isLoading ? 'not-allowed' : undefined }} required
                      />
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
                    {fileName && (
                      <div className={styles['Achievement-selected-file']} onClick={(e) => e.stopPropagation()}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {fileName}</span>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileName("");
                            setFileContent("");
                            setFileType("application/pdf");
                            setFileSize(0);
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
                    {!fileName && (
                      <div>
                        <span style={{ color: "#ff6464", fontWeight: 800, marginRight: 3 }}>*</span>
                        <span style={{ color: "#2276fc" }}>Please upload your Certificate</span>
                      </div>
                    )}
                    {error && <div style={{ color: "#ff6464", marginTop: 4 }}>{error}</div>}
                  </div>
                </div>

                <div className={styles['Achievement-popup-footer']}>
                  <button
                    type="button"
                    onClick={isLoading ? null : onClose}
                    disabled={isLoading}
                    className={styles['Achievement-popup-close-btn']}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={styles['Achievement-popup-submit-btn']}
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