import React, { useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
    date: null,
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

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date: date,
    }));
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

  const handleUploadClick = () => fileInputRef.current.click();

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
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 9999,
        }}
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
                    className={styles['input-hover']} name="year" value={formData.year} onChange={handleInputChange} required
                  >
                    <option value="" disabled>Year</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                  <select
                    className={styles['input-hover']} name="semester" value={formData.semester} onChange={handleInputChange} required
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
                  <input
                    className={styles['input-hover']} type="text" name="section" placeholder="Section" value={formData.section} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                  />
                  <div className={styles['Achievement-datepicker-wrapper']}>
                    <DatePicker
                      selected={formData.date}
                      onChange={handleDateChange}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Date"
                      className={styles['input-hover']}
                      showPopperArrow={false}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={7}
                      scrollableYearDropdown
                      minDate={new Date(new Date().getFullYear() - 1, 0, 1)}
                      maxDate={new Date(new Date().getFullYear() + 5, 11, 31)}
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <input
                    className={styles['input-hover']} type="text" name="comp" placeholder="Competition" value={formData.comp} onChange={handleInputChange} required
                  />
                  <input
                    className={styles['input-hover']} type="text" name="prize" placeholder="Prize" value={formData.prize} onChange={handleInputChange} required
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileName("");
                          setLastUploaded("");
                          setFileContent("");
                          setFileType("application/pdf");
                          setFileSize(0);
                        }}
                        style={{
                          fontFamily: "Poppins, sans-serif", fontSize: 21, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", padding: "4px", color: "#666666", cursor: "pointer", width: "25px", height: "25px", border: "none",
                        }}
                        title="Clear"
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