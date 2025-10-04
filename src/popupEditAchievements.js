import React, { useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helper function to parse date strings
const parseInitialDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length === 3 && parts[0].length === 2) {
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(date)) return date;
  }
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate)) return isoDate;
  return null;
};

// ++ NEW: Success Popup Component for Edit ++
const SuccessPopup = ({ onClose }) => (
  <div className="Edit-popup-container">
    <div className="Edit-popup-header">Edit !</div>
    <div className="Edit-popup-body">
      <svg className="Edit-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="Edit-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="Edit-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
        Updated ✓
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Changes are Updated
      </p>
    </div>
    <div className="Edit-popup-footer">
      <button onClick={onClose} className="Edit-popup-close-btn">
        Close
      </button>
    </div>
  </div>
);


export default function EditCertificate({ onClose, onUpdate, initialData }) {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState(initialData?.fileName || "");
  const [fileContent, setFileContent] = useState(initialData?.fileContent || "");
  const [lastUploaded, setLastUploaded] = useState(initialData?.uploadDate || "");
  const [error, setError] = useState("");
  const [isUpdated, setIsUpdated] = useState(false); // MODIFIED: State for popup

  const [formData, setFormData] = useState({
    reg: initialData?.reg || "",
    name: initialData?.name || "",
    year: initialData?.year || "",
    semester: initialData?.semester || "",
    section: initialData?.section || "",
    date: parseInitialDate(initialData?.date),
    comp: initialData?.comp || "",
    prize: initialData?.prize || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date: date,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 1024 * 1024) {
      setError("File must be a PDF and less than 1MB");
      setFileName(initialData?.fileName || "");
      setFileContent(initialData?.fileContent || "");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setFileContent(event.target.result);
    reader.readAsDataURL(file);
    setError("");
    setFileName(file.name);
    setLastUploaded(new Date().toLocaleDateString());
  };

  const handleUploadClick = () => fileInputRef.current.click();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileName) {
      setError("Please upload your certificate (PDF, Max 1 MB).");
      return;
    }
    if (
      !formData.reg || !formData.name || !formData.year || !formData.semester ||
      !formData.section || !formData.date || !formData.comp || !formData.prize
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");

    const formattedDate = formData.date
      ? `${formData.date.getFullYear()}-${String(
          formData.date.getMonth() + 1
        ).padStart(2, "0")}-${String(formData.date.getDate()).padStart(2, "0")}`
      : "";

    const updatedAchievement = {
      id: initialData?.id || Date.now(),
      reg: formData.reg,
      name: formData.name,
      year: formData.year,
      semester: formData.semester,
      section: formData.section,
      date: formattedDate,
      comp: formData.comp,
      prize: formData.prize,
      status: initialData?.status || "pending",
      approved: initialData?.approved || false,
      fileName: fileName,
      fileContent: fileContent,
      uploadDate: lastUploaded || new Date().toLocaleDateString(),
    };

    onUpdate(updatedAchievement);
    setIsUpdated(true); // MODIFIED: Show popup instead of closing
  };

  return (
    <>
      <style>{`
        /* --- Form Styles (No changes needed) --- */
        .input-hover {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          border: 1.5px solid #bddaed; border-radius: 10px; background: #f8faff;
          color: #3A4957; font-family: "Poppins", sans-serif; font-weight: 500;
          letter-spacing: .03em; font-size: 15.4px; padding: 12px 16px 12px 13px;
          outline: none; width: 100%; box-sizing: border-box; min-width: 0;
        }
        .input-hover:hover {
          border-color: #2276fc; box-shadow: 0 0 6px rgba(34, 118, 252, 0.5);
        }
        .input-hover:focus {
          outline: none; border-color: #1a56db; box-shadow: 0 0 8px rgba(34, 118, 252, 0.8);
        }
        .react-datepicker-wrapper { width: 100%; }
        .upload-button {
          border-radius: 10px; border: 1px solid #bddaed; background: #fff;
          color: #0C0C0D; font-family: "Poppins", sans-serif; font-weight: 500;
          font-size: 16px; padding: 7px 18px; display: flex; align-items: center;
          gap: 6px; cursor: pointer; min-width: 170px; justify-content: center;
          box-shadow: 0 1.5px 6px rgba(0, 0, 0, 0.04);
          transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .upload-button:hover, .upload-button:focus, .upload-button:active {
          background-color: #e6f0ff; border-color: #2276fc; box-shadow: 0 0 10px rgba(34, 118, 252, 0.6); outline: none;
        }
        .submit-button {
          width: 100%; background: #2276fc; color: #fff; font-weight: 600;
          font-size: 19px; font-family: "Poppins", sans-serif; letter-spacing: 0.03em;
          border: none; border-radius: 13px; padding: 11px 0; cursor: pointer;
          box-shadow: 0 2.5px 12px 0 rgba(34,121,252,0.13);
          transition: background-color 0.25s ease, box-shadow 0.25s ease;
        }
        .submit-button:hover {
          background-color: #1a56db; box-shadow: 0 3px 15px 0 rgba(34,89,252,0.3);
        }
        .submit-button:focus, .submit-button:active {
          background-color: #1541b0; box-shadow: 0 0 20px 0 rgba(34,70,252,0.5); outline: none;
        }

        /* ++ NEW: Styles for the animated success popup ++ */
        .Edit-popup-container {
            background-color: #fff; border-radius: 12px; width: 400px; max-width: 90vw;
            text-align: center; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); overflow: hidden;
            font-family: 'Poppins', sans-serif;
        }
        .Edit-popup-header {
            background-color: #2276fc; color: white; padding: 1rem; font-size: 1.75rem; font-weight: 700;
        }
        .Edit-popup-body { padding: 2rem; }
        .Edit-popup-footer { padding: 1.5rem; background-color: #f7f7f7; }
        .Edit-popup-close-btn {
            background-color: #d9534f; color: white; border: none; padding: 0.8rem 1.5rem;
            border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;
            transition: background-color 0.2s;
        }
        .Edit-popup-close-btn:hover { background-color: #c9302c; }

        /* Success icon animations */
        .Edit-success-icon {
            width: 80px; height: 80px; border-radius: 50%; display: block;
            stroke-width: 2; stroke: #fff; stroke-miterlimit: 10; margin: 0 auto;
            box-shadow: inset 0 0 0 #4bb71b;
            animation: Edit-fill 0.4s ease-in-out 0.4s forwards, Edit-scale 0.3s ease-in-out 0.9s both;
        }
        .Edit-success-icon--circle {
            stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2;
            stroke-miterlimit: 10; stroke: #4bb71b; fill: none;
            animation: Edit-stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .Edit-success-icon--check {
            transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48;
            animation: Edit-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes Edit-stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes Edit-scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
        @keyframes Edit-fill { 100% { box-shadow: inset 0 0 0 40px #4bb71b; } }
      `}</style>

      <div
        style={{
          minHeight: "100vh", width: "100vw", position: "fixed", left: 0, top: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(18,18,34,0.11)", zIndex: 1000,
        }}
      >
        {isUpdated ? (
          <SuccessPopup onClose={onClose} />
        ) : (
          <div
            style={{
              background: "#fff", borderRadius: 18, border: "1.5px solid #e1e8ed",
              padding: "32px 27px 24px 27px", minWidth: 350, width: 420, maxWidth: "98vw",
              boxShadow: "0 4px 32px rgba(44,63,87,0.11)", position: "relative",
            }}
          >
            <form onSubmit={handleSubmit}>
              <button
                type="button" onClick={onClose} style={{
                  position: "absolute", top: "14px", right: "18px", background: "transparent",
                  border: "none", fontSize: "25px", color: "#999999", cursor: "pointer",
                  fontWeight: "600", width: "32px", height: "32px", display: "flex",
                  alignItems: "center", justifyContent: "center", borderRadius: "50%", zIndex: 2,
                }} title="Close"
              >
                ×
              </button>
              <h2 style={{
                color: "#2276fc", textAlign: "center", marginBottom: 14,
                fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 23, letterSpacing: 0.3,
              }}>
                Edit Certificate
              </h2>
              <div style={{
                width: "100%", height: "2px", background: "#ececec", margin: "0 0 22px 0", borderRadius: "1px",
              }} />
              
              {/* Form fields */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <input className="input-hover" type="text" name="reg" placeholder="Register Number" value={formData.reg} onChange={handleInputChange} required />
                <input className="input-hover" type="text" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <select className="input-hover" name="year" value={formData.year} onChange={handleInputChange} required>
                  <option value="" disabled>Select Year</option>
                  <option value="I">I</option> <option value="II">II</option>
                  <option value="III">III</option> <option value="IV">IV</option>
                </select>
                <select className="input-hover" name="semester" value={formData.semester} onChange={handleInputChange} required>
                  <option value="" disabled>Select Semester</option>
                  {[...Array(8)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <input className="input-hover" type="text" name="section" placeholder="Section" value={formData.section} onChange={handleInputChange} required />
                <DatePicker selected={formData.date} onChange={handleDateChange} dateFormat="dd-MM-yyyy" placeholderText="Date" className="input-hover" required autoComplete="off" />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <input className="input-hover" type="text" name="comp" placeholder="Competition" value={formData.comp} onChange={handleInputChange} required />
                <input className="input-hover" type="text" name="prize" placeholder="Prize" value={formData.prize} onChange={handleInputChange} required />
              </div>

              {/* Upload row */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "16px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" }}>
                  <button type="button" className="upload-button" onClick={handleUploadClick}>
                    <img src={require("./assets/popupUploadicon.png")} alt="Upload" style={{ width: "22px", height: "22px" }} />
                    <span>{fileName || "Upload"}</span>
                  </button>
                  {fileName && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFileName(""); setLastUploaded(""); }} style={{ fontFamily: "Poppins, sans-serif", fontSize: 21, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", padding: "4px", color: "#666666", cursor: "pointer", width: "25px", height: "25px", border: "none" }} title="Clear">
                      ×
                    </button>
                  )}
                  <input type="file" accept=".pdf" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                </div>
                <div style={{ fontSize: 14.2, color: "#444", marginTop: 10, letterSpacing: 0.01, textAlign: "center" }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#2276fc", fontWeight: 600 }}>*</span> Upload Max 1MB PDF file
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#ff6464", fontWeight: 800, marginRight: 3 }}>*</span> if not uploaded ---&gt; <span style={{ color: "#2276fc" }}>Upload your Certificate</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#2276fc", fontWeight: 800, marginRight: 3 }}>*</span> if Certificate uploaded ---&gt; last uploaded on (<span style={{ color: "#0d9477" }}>{lastUploaded || "No date"}</span>)
                  </div>
                  {error && <div style={{ color: "#ff6464", marginTop: 4 }}>{error}</div>}
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 5 }}>
                <button type="submit" className="submit-button">Update</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}