import React, { useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import certificateService from "../services/certificateService.jsx";
import styles from "./Achievements.module.css";

// ++ NEW: Success Popup Component with Animation ++
const SuccessPopup = ({ onClose }) => (
  <div className="Achievement-popup-container">
    <div className="Achievement-popup-header">Uploaded!</div>
    <div className="Achievement-popup-body">
      <svg className="Achievement-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="Achievement-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="Achievement-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
        Submitted ✓
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Certificate is submitted
      </p>
    </div>
    <div className="Achievement-popup-footer">
      <button onClick={onClose} className="Achievement-popup-close-btn">
        Close
      </button>
    </div>
  </div>
);

// ++ NEW: Error Popup Component with Animation ++
const ErrorPopup = ({ onClose, errorMessage }) => (
  <div className="Achievement-popup-container">
    <div className="Achievement-popup-header" style={{ backgroundColor: '#D23B42' }}>Upload Failed!</div>
    <div className="Achievement-popup-body">
      <svg className="Achievement-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="Achievement-error-icon--circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="Achievement-error-icon--cross" fill="none" d="M16 16l20 20M36 16L16 36"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
        Upload Failed ✗
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        {errorMessage || "Certificate upload failed"}
      </p>
    </div>
    <div className="Achievement-popup-footer">
      <button onClick={onClose} className="Achievement-popup-close-btn">
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
      // Convert file to base64 directly
      const fileData = await certificateService.fileToBase64(file);

      // Remove data URL prefix for cleaner storage in MongoDB
      const base64Data = fileData.split(',')[1] || fileData;
      setFileContent(base64Data);
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
      fileData: fileContent, // This is now the base64 data
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
      <style>{`
        /* --- Styles for the form --- */
        .input-hover {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          border: 1.5px solid #bddaed;
          border-radius: 10px;
          background: #f8faff;
          color: #3A4957;
          font-family: "Poppins", sans-serif;
          font-weight: 500;
          letter-spacing: .03em;
          font-size: 15.4px;
          padding: 12px 16px 12px 13px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        select.input-hover {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%20fill%3D%22%23555%22/%3E%3C/svg%3E');
          background-repeat: no-repeat;
          background-position: right 10px top 50%;
          background-size: 16px;
        }
        .input-hover:hover {
          border-color: #2276fc;
          box-shadow: 0 0 6px rgba(34, 118, 252, 0.5);
        }
        .input-hover:focus {
          outline: none;
          border-color: #1a56db;
          box-shadow: 0 0 8px rgba(34, 118, 252, 0.8);
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .upload-button {
          border-radius: 10px;
          border: 1px solid #bddaed;
          background: #fff;
          color: #0C0C0D;
          font-family: "Poppins", sans-serif;
          font-weight: 500;
          font-size: 16px;
          padding: 7px 18px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          min-width: 170px;
          justify-content: center;
          box-shadow: 0 1.5px 6px rgba(0, 0, 0, 0.04);
          transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .upload-button:hover,
        .upload-button:focus,
        .upload-button:active {
          background-color: #e6f0ff;
          border-color: #2276fc;
          box-shadow: 0 0 10px rgba(34, 118, 252, 0.6);
          outline: none;
        }
        .submit-button {
          width: 100%;
          background: #2276fc;
          color: #fff;
          font-weight: 600;
          font-size: 19px;
          font-family: "Poppins", sans-serif;
          letter-spacing: 0.03em;
          border: none;
          border-radius: 13px;
          padding: 11px 0;
          cursor: pointer;
          box-shadow: 0 2.5px 12px 0 rgba(34,121,252,0.13);
          transition: background-color 0.25s ease, box-shadow 0.25s ease;
        }
        .submit-button:hover {
          background-color: #1a56db;
          box-shadow: 0 3px 15px 0 rgba(34,89,252,0.3);
        }
        .submit-button:focus,
        .submit-button:active {
          background-color: #1541b0;
          box-shadow: 0 0 20px 0 rgba(34,70,252,0.5);
          outline: none;
        }

        /* ++ NEW: Styles for the animated success popup ++ */
        .Achievement-popup-container {
            background-color: #fff;
            border-radius: 12px;
            width: 400px;
            max-width: 90vw;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            font-family: 'Poppins', sans-serif;
        }
        .Achievement-popup-header {
            background-color: #197AFF;
            color: white;
            padding: 1rem;
            font-size: 1.75rem;
            font-weight: 700;
        }
        .Achievement-popup-body {
            padding: 2rem;
        }
        .Achievement-popup-footer {
            padding: 1.5rem;
            background-color: #f7f7f7;
        }
        .Achievement-popup-close-btn {
            background-color: #D23B42;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(210, 59, 66, 0.2);
        }
        .Achievement-popup-close-btn:hover {
            background-color: #b53138;
            box-shadow: 0 4px 12px rgba(210, 59, 66, 0.3);
        }

        /* Success icon animations */
        .Achievement-success-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #fff;
            stroke-miterlimit: 10;
            margin: 0 auto;
            box-shadow: inset 0 0 0 #22C55E;
            animation: Achievement-fill 0.4s ease-in-out 0.4s forwards, Achievement-scale 0.3s ease-in-out 0.9s both;
        }
        .Achievement-success-icon--circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke-miterlimit: 10;
            stroke: #22C55E;
            fill: none;
            animation: Achievement-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .Achievement-success-icon--check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: Achievement-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        
        /* Error icon animations */
        .Achievement-error-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #fff;
            stroke-miterlimit: 10;
            margin: 0 auto;
            box-shadow: inset 0 0 0 #FF4444;
            animation: Achievement-error-fill 0.4s ease-in-out 0.4s forwards, Achievement-scale 0.3s ease-in-out 0.9s both;
        }
        .Achievement-error-icon--circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke-miterlimit: 10;
            stroke: #FF4444;
            fill: none;
            animation: Achievement-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .Achievement-error-icon--cross {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: Achievement-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        
        @keyframes Achievement-stroke {
            100% { stroke-dashoffset: 0; }
        }
        @keyframes Achievement-scale {
            0%, 100% { transform: none; }
            50% { transform: scale3d(1.1, 1.1, 1); }
        }
        @keyframes Achievement-fill {
            100% { box-shadow: inset 0 0 0 40px #22C55E; }
        }
        @keyframes Achievement-error-fill {
            100% { box-shadow: inset 0 0 0 40px #FF4444; }
        }
      `}</style>
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
                    className="input-hover" type="text" name="reg" placeholder="Register Number" value={formData.reg} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                  />
                  <input
                    className="input-hover" type="text" name="name" placeholder="Name" value={formData.name} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                  />
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <select
                    className="input-hover" name="year" value={formData.year} onChange={handleInputChange} required
                  >
                    <option value="" disabled>Year</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                  <select
                    className="input-hover" name="semester" value={formData.semester} onChange={handleInputChange} required
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
                    className="input-hover" type="text" name="section" placeholder="Section" value={formData.section} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} required
                  />
                  <div className={styles['Achievement-datepicker-wrapper']}>
                    <DatePicker
                      selected={formData.date}
                      onChange={handleDateChange}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Date"
                      className="input-hover"
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
                    className="input-hover" type="text" name="comp" placeholder="Competition" value={formData.comp} onChange={handleInputChange} required
                  />
                  <input
                    className="input-hover" type="text" name="prize" placeholder="Prize" value={formData.prize} onChange={handleInputChange} required
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
                      className="upload-button"
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
                    className="submit-button"
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