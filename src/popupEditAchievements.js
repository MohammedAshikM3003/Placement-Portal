import React, { useRef, useState } from "react";
<<<<<<< HEAD
// NEW: Import the date picker component and its CSS
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// NEW: Helper function to parse the incoming date string into a Date object.
// This handles both "dd-MM-yyyy" and "yyyy-MM-dd" formats.
const parseInitialDate = (dateString) => {
  if (!dateString) return null;

  // Try parsing dd-MM-yyyy
  const parts = dateString.split("-");
  if (parts.length === 3 && parts[0].length === 2) {
    // new Date(year, monthIndex, day)
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(date)) return date;
  }

  // Fallback for standard ISO format (yyyy-MM-dd) or other parsable formats
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate)) return isoDate;

  return null;
};

=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c

export default function EditCertificate({ onClose, onUpdate, initialData }) {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState(initialData?.fileName || "");
  const [fileContent, setFileContent] = useState(initialData?.fileContent || "");
  const [lastUploaded, setLastUploaded] = useState(initialData?.uploadDate || "");
  const [error, setError] = useState("");
<<<<<<< HEAD
=======
  const [setIsSubmitted] = useState(false);
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c

  const [formData, setFormData] = useState({
    reg: initialData?.reg || "",
    name: initialData?.name || "",
    year: initialData?.year || "",
    semester: initialData?.semester || "",
    section: initialData?.section || "",
<<<<<<< HEAD
    // MODIFIED: Use the helper function to parse the initial date string
    date: parseInitialDate(initialData?.date),
=======
    date: initialData?.date || "",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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

<<<<<<< HEAD
  // NEW: Add a separate handler for the DatePicker component
  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date: date,
    }));
  };

=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 1024 * 1024) {
      setError("File must be a PDF and less than 1MB");
<<<<<<< HEAD
      setFileName(initialData?.fileName || ""); // Revert to old filename on error
      setFileContent(initialData?.fileContent || "");
=======
      setFileName("");
      setFileContent("");
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
      !formData.reg ||
      !formData.name ||
      !formData.year ||
      !formData.semester ||
      !formData.section ||
<<<<<<< HEAD
      !formData.date || // Check if date object exists
=======
      !formData.date ||
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
      !formData.comp ||
      !formData.prize
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
<<<<<<< HEAD

    // MODIFIED: Format the date object back to a "dd-MM-yyyy" string for submission
    const formattedDate = formData.date
      ? `${String(formData.date.getDate()).padStart(2, "0")}-${String(
          formData.date.getMonth() + 1
        ).padStart(2, "0")}-${formData.date.getFullYear()}`
      : "";
=======
    setLastUploaded(new Date().toLocaleDateString());
    setIsSubmitted(true);
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c

    const updatedAchievement = {
      id: initialData?.id || Date.now(),
      reg: formData.reg,
      name: formData.name,
      year: formData.year,
      semester: formData.semester,
      section: formData.section,
<<<<<<< HEAD
      date: formattedDate, // Use the formatted string
      comp: formData.comp,
      prize: formData.prize,
      status: initialData?.status || "pending",
      approved: initialData?.approved || false,
      fileName: fileName,
      fileContent: fileContent,
      uploadDate: lastUploaded || new Date().toLocaleDateString(),
    };

    onUpdate(updatedAchievement);
    onClose();
=======
      date: formData.date,
      comp: formData.comp,
      prize: formData.prize,
      approved: initialData?.approved || false,
      fileName: fileName,
      fileContent: fileContent,
      uploadDate: new Date().toLocaleDateString(),
    };

    if (onUpdate) onUpdate(updatedAchievement);
    if (onClose) setTimeout(() => { onClose(); }, 100);
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  };

  return (
    <>
      <style>{`
<<<<<<< HEAD
        /* --- No changes needed in this style block, except one addition --- */
=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
        .input-hover:hover {
          border-color: #2276fc;
          box-shadow: 0 0 6px rgba(34, 118, 252, 0.5);
        }
        .input-hover:focus {
          outline: none;
          border-color: #1a56db;
          box-shadow: 0 0 8px rgba(34, 118, 252, 0.8);
        }
<<<<<<< HEAD
        
        /* NEW: Added style for react-datepicker to ensure it fills flex container */
        .react-datepicker-wrapper {
          width: 100%;
        }

=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
<<<<<<< HEAD
          width: 100%;
=======
          width: calc(100% - 166px);
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
      `}</style>
      <div
        style={{
<<<<<<< HEAD
          minHeight: "100vh", width: "100vw", position: "fixed", left: 0, top: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(18,18,34,0.11)", zIndex: 1000,
=======
          minHeight: "100vh",
          width: "100vw",
          position: "fixed",
          left: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(18,18,34,0.11)",
          zIndex: 1000,
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
        }}
      >
        <div
          style={{
<<<<<<< HEAD
            background: "#fff", borderRadius: 18, border: "1.5px solid #e1e8ed", padding: "32px 27px 24px 27px", minWidth: 350, width: 420, maxWidth: "98vw", boxShadow: "0 4px 32px rgba(44,63,87,0.11)", position: "relative",
=======
            background: "#fff",
            borderRadius: 18,
            border: "1.5px solid #e1e8ed",
            padding: "32px 27px 24px 27px",
            minWidth: 350,
            width: 420,
            maxWidth: "98vw",
            boxShadow: "0 4px 32px rgba(44,63,87,0.11)",
            position: "relative",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
          }}
        >
          <form onSubmit={handleSubmit}>
            <button
<<<<<<< HEAD
              type="button" onClick={onClose} style={{
                position: "absolute", top: "14px", right: "18px", background: "transparent", border: "none", fontSize: "25px", color: "#999999", cursor: "pointer", fontWeight: "600", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", zIndex: 2,
              }} title="Close"
=======
              type="button"
              onClick={onClose}
              style={{
                position: "absolute",
                top: "14px",
                right: "18px",
                background: "transparent",
                border: "none",
                fontSize: "25px",
                color: "#999999",
                cursor: "pointer",
                fontWeight: "600",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                zIndex: 2,
              }}
              title="Close"
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
            >
              ×
            </button>
            <h2
              style={{
<<<<<<< HEAD
                color: "#2276fc", textAlign: "center", marginBottom: 14, fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 23, letterSpacing: 0.3,
=======
                color: "#2276fc",
                textAlign: "center",
                marginBottom: 14,
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 23,
                letterSpacing: 0.3,
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              }}
            >
              Edit Certificate
            </h2>
            <div
              style={{
<<<<<<< HEAD
                width: "100%", height: "2px", background: "#ececec", margin: "0 0 22px 0", borderRadius: "1px",
              }}
            />
            {/* Form fields */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input className="input-hover" type="text" name="reg" placeholder="Register Number" value={formData.reg} onChange={handleInputChange} required />
              <input className="input-hover" type="text" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <select className="input-hover" name="year" value={formData.year} onChange={handleInputChange} required>
                <option value="" disabled>Select Year</option>
=======
                width: "100%",
                height: "2px",
                background: "#ececec",
                margin: "0 0 22px 0",
                borderRadius: "1px",
              }}
            />
            {/* 2-column rows */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input
                className="input-hover"
                type="text"
                name="reg"
                placeholder="Register Number"
                value={formData.reg}
                onChange={handleInputChange}
                required
              />
              <input
                className="input-hover"
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <select
                className="input-hover"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Year</option>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
<<<<<<< HEAD
              <select className="input-hover" name="semester" value={formData.semester} onChange={handleInputChange} required>
                <option value="" disabled>Select Semester</option>
                {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input className="input-hover" type="text" name="section" placeholder="Section" value={formData.section} onChange={handleInputChange} required />
              {/* MODIFIED: Replaced input with DatePicker */}
              <DatePicker
                selected={formData.date}
                onChange={handleDateChange}
                dateFormat="dd-MM-yyyy"
                placeholderText="Date"
                className="input-hover"
                required
                autoComplete="off"
              />
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
                {/* ... (rest of the component is the same) ... */}
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
=======
              <select
                className="input-hover"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Semester</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input
                className="input-hover"
                type="text"
                name="section"
                placeholder="Section"
                value={formData.section}
                onChange={handleInputChange}
                required
              />
              <input
                className="input-hover"
                type="date"
                name="date"
                placeholder="Participation Date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input
                className="input-hover"
                type="text"
                name="comp"
                placeholder="Competition"
                value={formData.comp}
                onChange={handleInputChange}
                required
              />
              <input
                className="input-hover"
                type="text"
                name="prize"
                placeholder="Prize"
                value={formData.prize}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* Upload row */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                margin: "16px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                }}
              >
                <button
                  type="button"
                  className="upload-button"
                  onClick={handleUploadClick}
                >
                  <img
                    src={require("./assets/popupUploadicon.png")}
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
                    }}
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 21,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      padding: "4px",
                      color: "#666666",
                      cursor: "pointer",
                      width: "25px",
                      height: "25px",
                      border: "none",
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
              {/* Helper Text Section */}
              <div
                style={{
                  fontSize: 14.2,
                  color: "#444",
                  marginTop: 10,
                  letterSpacing: 0.01,
                  textAlign: "center",
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: "#2276fc", fontWeight: 600 }}>*</span>
                  Upload Max 1MB PDF file
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span
                    style={{ color: "#ff6464", fontWeight: 800, marginRight: 3 }}
                  >
                    *
                  </span>
                  if not uploaded ---&gt;{" "}
                  <span style={{ color: "#2276fc" }}>Upload your Certificate</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "#2276fc", fontWeight: 800, marginRight: 3 }}>
                    *
                  </span>
                  if Certificate uploaded ---&gt; last uploaded on (
                  <span style={{ color: "#0d9477" }}>{lastUploaded || "No date"}</span>)
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
                </div>
                {error && <div style={{ color: "#ff6464", marginTop: 4 }}>{error}</div>}
              </div>
            </div>
<<<<<<< HEAD
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 5 }}>
              <button type="submit" className="submit-button">Update</button>
=======
            {/* Update Button */}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: 5,
              }}
            >
              <button type="submit" className="submit-button">
                Update
              </button>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
            </div>
          </form>
        </div>
      </div>
    </>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
