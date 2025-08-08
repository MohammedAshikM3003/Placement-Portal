
import React, { useRef, useState } from "react";

export default function CertificateUpload({ onClose, onUpload }) {
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [lastUploaded, setLastUploaded] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handles file selection and validation
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 1024 * 1024) {
      setError("File must be a PDF and less than 1MB");
      setFileName("");
      setFileContent("");
      return;
    }
    
    // Read the file content
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsDataURL(file);
    
    setError("");
    setFileName(file.name);
    setLastUploaded(new Date().toLocaleDateString());
  };

  // Handles the upload button click, triggers the hidden input
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Form state
  const [formData, setFormData] = useState({
    reg: "",
    name: "",
    section: "",
    date: "",
    comp: "",
    prize: ""
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileName) {
      setError("Please upload your certificate (PDF, Max 1 MB).");
      return;
    }
    
    // Validate required fields
    if (!formData.reg || !formData.name || !formData.section || !formData.date || !formData.comp || !formData.prize) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setError("");
    setLastUploaded(new Date().toLocaleDateString());
    setIsSubmitted(true);
    
    // Create new achievement object
    const newAchievement = {
      id: Date.now(), // Generate unique ID
      reg: formData.reg,
      name: formData.name,
      section: formData.section,
      date: formData.date,
      comp: formData.comp,
      prize: formData.prize,
      approved: false, // New uploads start as not approved
      fileName: fileName,
      fileContent: fileContent,
      uploadDate: new Date().toLocaleDateString()
    };
    
    // Pass the new achievement to parent component
    if (onUpload) {
      onUpload(newAchievement);
    }
    
    // Close popup after a small delay to ensure state updates are processed
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 70px)",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
                                     <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "30px 40px 25px 40px",
              width: 450,
              maxWidth: "98vw",
              border: "1px solid #cccccc",
              position: "relative",
              boxShadow: "none"
            }}
          >
                 <form onSubmit={handleSubmit}>
           {/* Close button */}
           <button
             type="button"
             onClick={onClose}
             style={{
               position: "absolute",
               top: "15px",
               right: "20px",
               background: "transparent",
               border: "none",
               fontSize: "28px",
               color: "#999999",
               cursor: "pointer",
               fontWeight: "600",
               width: "35px",
               height: "35px",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               borderRadius: "50%"
             }}
             title="Close"
           >
             ×
           </button>
                     <h2
             style={{
               color: "#2276fc",
               textAlign: "center",
               marginBottom: 28,
               fontFamily: "Poppins, sans-serif",
               fontWeight: 700,
               fontSize: 24,
               letterSpacing: 0.3,
             }}
           >
             Upload Certificate
           </h2>
                                               <div
               style={{
                 width: "100%",
                 height: "2px",
                 background: "#cccccc",
                 margin: "0 0 28px 0",
                 borderRadius: "1px"
               }}
             />
                               <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              style={inputStyle}
              type="text"
              name="reg"
              placeholder="Register Number"
              value={formData.reg}
              onChange={handleInputChange}
              required
            />
            <input
              style={inputStyle}
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              style={inputStyle}
              type="text"
              name="section"
              placeholder="Section"
              value={formData.section}
              onChange={handleInputChange}
              required
            />
            <input
              style={inputStyle}
              type="date"
              name="date"
              placeholder="Participation Date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <input
              style={inputStyle}
              type="text"
              name="comp"
              placeholder="Competition"
              value={formData.comp}
              onChange={handleInputChange}
              required
            />
            <input
              style={inputStyle}
              type="text"
              name="prize"
              placeholder="Prize"
              value={formData.prize}
              onChange={handleInputChange}
              required
            />
          </div>
                     {/* Upload button */}
                       <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", justifyContent: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", width: "100%" }}>
                                 <button
                   type="button"
                                       style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 17,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                                             borderRadius: 10,
                                             border: "1px solid #cccccc",
                       background: "#ffffff",
                      padding: "8px 18px",
                                             color: "#666666",
                      cursor: "pointer",
                      position: "relative",
                      minWidth: "200px",
                      justifyContent: "center"
                    }}
                   onClick={handleUploadClick}
                 >
                                                                           <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", marginLeft: "-3px" }}>
                      {/* Upload Icon */}
                                            <img 
                         src={require('./assets/uploadicon.png')} 
                         alt="Upload" 
                         style={{ width: "22px", height: "22px" }}
                       />
                      <span>{fileName || "Upload"}</span>
                    </div>
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
                          fontSize: 22,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "transparent",
                          padding: "4px",
                          color: "#666666",
                          cursor: "pointer",
                          width: "28px",
                          height: "28px",
                          border: "none"
                        }}
                        title="Clear"
                      >
                        ×
                      </button>
                    )}
                </button>
               <input
                 type="file"
                 accept=".pdf"
                 ref={fileInputRef}
                 style={{ display: "none" }}
                 onChange={handleFileChange}
               />
             </div>
             
                           {/* Text under upload button */}
              <div style={{ fontSize: 14, color: "#444", marginTop: 8, letterSpacing: 0.01, textAlign: "center" }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: "#2276fc", fontWeight: 600 }}>*</span>
                  Upload Max 1MB PDF file
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: "#ff6464", fontWeight: 800, marginRight: 3 }}>*</span>
                  if not uploaded ---&gt; <span style={{ color: "#2276fc" }}>Upload your Certificate</span>
                </div>
                                                   <div style={{ marginBottom: 10 }}>
                    <span style={{ color: "#2276fc", fontWeight: 800, marginRight: 3 }}>*</span>
                    if Certificate uploaded ---&gt; last uploaded on (
                      <span style={{ color: "#0d9477" }}>{lastUploaded || "No date"}</span>
                    )
                  </div>
                {/* Show error if any */}
                {error && (
                  <div style={{ color: "#ff6464", marginTop: 4 }}>{error}</div>
                )}
              </div>
           </div>
                                           <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                                            <button
                  type="submit"
                  style={{
                    width: "calc(100% - 250px)",
                    background: "#2276fc",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 19,
                    fontFamily: "Poppins, sans-serif",
                    letterSpacing: "0.03em",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 0",
                    cursor: "pointer"
                  }}
                >
               Submit
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}

// Shared text input style
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
};


