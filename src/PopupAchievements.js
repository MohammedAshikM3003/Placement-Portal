import React, { useRef, useState } from "react";
<<<<<<< HEAD
// NEW: Import the date picker component and its CSS
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c

export default function CertificateUpload({ onClose, onUpload }) {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [lastUploaded, setLastUploaded] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    reg: "",
    name: "",
    year: "",
    semester: "",
    section: "",
<<<<<<< HEAD
    // MODIFIED: Initialize date as null for the date picker
    date: null,
=======
    date: "",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    comp: "",
    prize: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

<<<<<<< HEAD
  // NEW: Create a separate handler for the DatePicker component
  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date: date, // The date picker returns a Date object directly
    }));
  };

=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 1024 * 1024) {
      setError("File must be a PDF and less than 1MB");
      setFileName("");
      setFileContent("");
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
<<<<<<< HEAD
    // Check all fields, including the date
=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    if (
      !formData.reg ||
      !formData.name ||
      !formData.year ||
      !formData.semester ||
      !formData.section ||
<<<<<<< HEAD
      !formData.date || // Now checks if formData.date is null
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
    setLastUploaded(new Date().toLocaleDateString());
    setIsSubmitted(true);

<<<<<<< HEAD
    // MODIFIED: Format the date object into a "dd-MM-yyyy" string before submitting
    const formattedDate = formData.date
      ? `${String(formData.date.getDate()).padStart(2, "0")}-${String(
          formData.date.getMonth() + 1
        ).padStart(2, "0")}-${formData.date.getFullYear()}`
      : "";

=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    const newAchievement = {
      id: Date.now(),
      reg: formData.reg,
      name: formData.name,
      year: formData.year,
      semester: formData.semester,
      section: formData.section,
<<<<<<< HEAD
      date: formattedDate, // Use the formatted date string
=======
      date: formData.date,
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
      comp: formData.comp,
      prize: formData.prize,
      approved: false,
      fileName: fileName,
      fileContent: fileContent,
      uploadDate: new Date().toLocaleDateString(),
    };

    if (onUpload) onUpload(newAchievement);
<<<<<<< HEAD
    if (onClose)
      setTimeout(() => {
        onClose();
      }, 100);
=======
    if (onClose) setTimeout(() => { onClose(); }, 100);
  };

  const inputStyle = {
    flex: 1,
    fontSize: 15.4,
    fontFamily: "Poppins, sans-serif",
    borderRadius: 10,
    border: "1.5px solid #bddaed",
    background: "#f8faff",
    color: "#3A4957",
    padding: "12px 16px 12px 13px",
    outline: "none",
    fontWeight: 500,
    letterSpacing: ".03em",
    width: "100%",
    minWidth: "0",
    boxSizing: "border-box",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  };

  return (
    <>
      <style>{`
<<<<<<< HEAD
        /* --- No changes needed in this style block --- */
        /* --- Your existing CSS for .input-hover works perfectly --- */
=======
        /* FIX: The .input-hover class now contains only the shared styles for all inputs and selects. */
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

<<<<<<< HEAD
=======
        /* FIX: This new, more specific selector applies the dropdown arrow style ONLY to select elements. */
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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

<<<<<<< HEAD
        /* NEW: Added styles for react-datepicker to ensure it fills flex container */
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
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            border: "1.5px solid #e1e8ed",
            padding: "32px 27px 24px 27px",
            minWidth: 350,
            width: 420,
            maxWidth: "98vw",
            boxShadow: "0 4px 32px rgba(44,63,87,0.11)",
            position: "relative",
          }}
        >
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={onClose}
              style={{
<<<<<<< HEAD
                position: "absolute", top: "14px", right: "18px", background: "transparent", border: "none", fontSize: "25px", color: "#999999", cursor: "pointer", fontWeight: "600", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", zIndex: 2,
=======
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
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              }}
              title="Close"
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
              Upload Certificate
            </h2>
            <div
              style={{
<<<<<<< HEAD
                width: "100%", height: "2px", background: "#ececec", margin: "0 0 22px 0", borderRadius: "1px",
=======
                width: "100%",
                height: "2px",
                background: "#ececec",
                margin: "0 0 22px 0",
                borderRadius: "1px",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              }}
            />
            {/* 2-column rows */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input
<<<<<<< HEAD
                className="input-hover" type="text" name="reg" placeholder="Register Number" value={formData.reg} onChange={handleInputChange} required
              />
              <input
                className="input-hover" type="text" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required
=======
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
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              />
            </div>
            {/* Year and Semester dropdowns */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <select
<<<<<<< HEAD
                className="input-hover" name="year" value={formData.year} onChange={handleInputChange} required
=======
                className="input-hover"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              >
                <option value="" disabled>Year</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
              <select
<<<<<<< HEAD
                className="input-hover" name="semester" value={formData.semester} onChange={handleInputChange} required
=======
                className="input-hover"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              >
                <option value="" disabled>Semester</option>
                {[...Array(8)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input
<<<<<<< HEAD
                className="input-hover" type="text" name="section" placeholder="Section" value={formData.section} onChange={handleInputChange} required
              />
              {/* MODIFIED: Replaced input with DatePicker component */}
              <DatePicker
                selected={formData.date}
                onChange={handleDateChange}
                dateFormat="dd-MM-yyyy"
                placeholderText="Date"
                className="input-hover" // Apply the same class for consistent styling
                required
                autoComplete="off"
=======
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
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <input
<<<<<<< HEAD
                className="input-hover" type="text" name="comp" placeholder="Competition" value={formData.comp} onChange={handleInputChange} required
              />
              <input
                className="input-hover" type="text" name="prize" placeholder="Prize" value={formData.prize} onChange={handleInputChange} required
=======
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
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              />
            </div>
            {/* Upload row */}
            <div
              style={{
<<<<<<< HEAD
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "16px 0",
=======
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                margin: "16px 0",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              }}
            >
              <div
                style={{
<<<<<<< HEAD
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
=======
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
<<<<<<< HEAD
                      fontFamily: "Poppins, sans-serif", fontSize: 21, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", padding: "4px", color: "#666666", cursor: "pointer", width: "25px", height: "25px", border: "none",
=======
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
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
<<<<<<< HEAD
                  fontSize: 14.2, color: "#444", marginTop: 10, letterSpacing: 0.01, textAlign: "center",
                }}
              >
                {/* ... (no changes in this section) ... */}
=======
                  fontSize: 14.2,
                  color: "#444",
                  marginTop: 10,
                  letterSpacing: 0.01,
                  textAlign: "center",
                }}
              >
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
                </div>
                {error && <div style={{ color: "#ff6464", marginTop: 4 }}>{error}</div>}
              </div>
            </div>
            {/* Submit Button */}
            <div
              style={{
<<<<<<< HEAD
                display: "flex", gap: 12, justifyContent: "center", marginTop: 5,
=======
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: 5,
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              }}
            >
              <button type="submit" className="submit-button">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}