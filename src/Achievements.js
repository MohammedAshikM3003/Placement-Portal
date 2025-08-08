import React, { useState, useRef } from "react";
import CertificateUpload from "./PopupAchievements.js";
import { FaGraduationCap, FaTachometerAlt, FaFileAlt, FaCalendarAlt, FaRegStar, FaBriefcase, FaUser, FaSignOutAlt, FaHome, FaInfo, FaStar, FaEnvelope } from 'react-icons/fa';

const EyeIcon = ({ color = "#4563fd" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2"/>
  </svg>
);

// Menu items array (matching resume.js)
const menuItems = [
  { text: 'Dashboard', icon: <FaTachometerAlt size={24} />, active: false },
  { text: 'Resume', icon: <FaFileAlt size={24} />, active: false },
  { text: 'Attendance', icon: <FaCalendarAlt size={24} />, active: false },
  { text: 'Achievements', icon: <FaRegStar size={24} />, active: true },
  { text: 'Company', icon: <FaBriefcase size={24} />, active: false },
];

const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: require('./assets/CompanySideBarIcon.svg'), text: 'Company', view: 'company' },
  { icon: require('./assets/ProfileSideBarIcon.png'), text: 'Profile', view: 'profile' },
];

// --- Main Placement Portal Component ---
export default function PlacementPortal({ onLogout, onViewChange, currentView }) {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const [selectedRows, setSelectedRows] = useState([1]); // Select first row by default
  const [editingRow, setEditingRow] = useState(null);
  const [editFileName, setEditFileName] = useState("");
  const editFileInputRef = useRef();
  const [sortBy, setSortBy] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortApplied, setSortApplied] = useState(false); // New state to track if sort has been applied

  // Sample data for achievements
  const [achievements, setAchievements] = useState([
    {
      id: 1,
      reg: "7315XXXX2",
      name: "Rajesh Kumar",
      section: "B",
      comp: "AI Hackathon Fest",
      date: "23/09/2025",
      prize: "1st",
      approved: true,
      status: "approved",
      fileName: "ai_hackathon_certificate.pdf",
      fileContent: "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQo+Pg0KZW5kb2JqDQo1IDAgb2JqDQo8PA0KL0xlbmd0aCA0NA0KPj4NCnN0cmVhbQ0KQlQNCjc1IDUwIFRECi9GMSAxMiBUZgooSGVsbG8gV29ybGQpIFRqCkVUCmVuZG9iag0KeHJlZg0KMCA2DQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTAgMDAwMDAgbg0KMDAwMDAwMDA3OSAwMDAwMCBuDQowMDAwMDAwMTczIDAwMDAwIG4NCjAwMDAwMDAzMDEgMDAwMDAgbg0KMDAwMDAwMDM4MCAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjQ5MjQKJSVFT0Y="
    },
    {
      id: 2,
      reg: "7315XXXX2",
      name: "Rajesh Kumar",
      section: "B",
      comp: "Paper Presentation",
      date: "26/10/2025",
      prize: "2nd",
      approved: false,
      status: "pending",
      fileName: "paper_presentation_certificate.pdf",
      fileContent: "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQo+Pg0KZW5kb2JqDQo1IDAgb2JqDQo8PA0KL0xlbmd0aCA0NA0KPj4NCnN0cmVhbQ0KQlQNCjc1IDUwIFRECi9GMSAxMiBUZgooUGFwZXIgUHJlc2VudGF0aW9uKSBUagpFVAplbmRvYmoNCnhyZWYNCjAgNg0KMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDEwIDAwMDAwIG4NCjAwMDAwMDAwNzkgMDAwMDAgbg0KMDAwMDAwMDE3MyAwMDAwMCBuDQowMDAwMDAwMzAxIDAwMDAwIG4NCjAwMDAwMDAzODAgMDAwMDAgbg0KdHJhaWxlcg0KPDwNCi9TaXplIDYNCi9Sb290IDEgMCBSDQo+Pg0Kc3RhcnR4cmVmDQo0OTINCg=="
    },
    {
      id: 3,
      reg: "7315XXXX2",
      name: "Rajesh Kumar",
      section: "B",
      comp: "Coding Competition",
      date: "15/11/2025",
      prize: "3rd",
      approved: false,
      status: "rejected",
      fileName: "coding_competition_certificate.pdf",
      fileContent: "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQo+Pg0KZW5kb2JqDQo1IDAgb2JqDQo8PA0KL0xlbmd0aCA0NA0KPj4NCnN0cmVhbQ0KQlQNCjc1IDUwIFRECi9GMSAxMiBUZgooQ29kaW5nIENvbXBldGl0aW9uKSBUagpFVAplbmRvYmoNCnhyZWYNCjAgNg0KMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDEwIDAwMDAwIG4NCjAwMDAwMDAwNzkgMDAwMDAgbg0KMDAwMDAwMDE3MyAwMDAwMCBuDQowMDAwMDAwMzAxIDAwMDAwIG4NCjAwMDAwMDAzODAgMDAwMDAgbg0KdHJhaWxlcg0KPDwNCi9TaXplIDYNCi9Sb290IDEgMCBSDQo+Pg0Kc3RhcnR4cmVmDQo0OTINCg=="
    }
  ]);

  const handleUploadClick = () => {
    console.log("Upload button clicked, setting showUploadPopup to true");
    setShowUploadPopup(true);
  };

  const handleClosePopup = () => {
    setShowUploadPopup(false);
  };

  const handleUploadSuccess = (newAchievement) => {
    console.log("Upload success, new achievement:", newAchievement);
    // Add status field to new achievement
    const achievementWithStatus = {
      ...newAchievement,
      status: "pending",
      approved: false
    };
    setAchievements(prev => {
      const updatedAchievements = [...prev, achievementWithStatus];
      console.log("Updated achievements:", updatedAchievements);
      return updatedAchievements;
    });
    // Auto-select the newly added achievement
    setSelectedRows([achievementWithStatus.id]);
    console.log("Selected rows after upload:", [achievementWithStatus.id]);
  };

  const handleEditClick = () => {
    if (selectedRows.length === 1) {
      const selectedAchievement = achievements.find(a => a.id === selectedRows[0]);
      
      // Check if achievement is approved or rejected
      if (selectedAchievement.status === "approved") {
        console.log("Showing approved restriction popup");
        setRestrictionMessage("❌ Cannot edit approved achievements!\n\n✅ This achievement has been approved and cannot be modified.\n\n📝 Only pending achievements can be edited.");
        setShowRestrictionPopup(true);
        return;
      }
      
      if (selectedAchievement.status === "rejected") {
        console.log("Showing rejected restriction popup");
        setRestrictionMessage("❌ Cannot edit rejected achievements!\n\n❌ This achievement has been rejected and cannot be modified.\n\n📝 Only pending achievements can be edited.");
        setShowRestrictionPopup(true);
        return;
      }
      
      setEditingRow(selectedAchievement);
      setShowEditPopup(true);
    } else {
      alert("Please select exactly one row to edit");
    }
  };

  const handleCloseRestrictionPopup = () => {
    setShowRestrictionPopup(false);
    setRestrictionMessage("");
  };

  const handleCloseEditPopup = () => {
    setShowEditPopup(false);
    setEditingRow(null);
    setEditFileName("");
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 1024 * 1024) {
      alert("File must be a PDF and less than 1MB");
      setEditFileName("");
      return;
    }
    setEditFileName(file.name);
  };

  const handleEditUploadClick = () => {
    editFileInputRef.current.click();
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };


  // Filter and sort functions
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setSortApplied(false); // Reset sort applied when user changes sort option
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setSortApplied(false); // Reset sort applied when user changes status filter
  };

  const handleSort = () => {
    // Check if both dropdowns have values selected
    if (!sortBy || sortBy === "" || !statusFilter || statusFilter === "" || statusFilter === "all") {
      alert("Please select both 'Sort by' and 'Status' options before applying sort.");
      return;
    }
    
    // This will trigger re-render with sorted data
    console.log("Sorting by:", sortBy, "Status filter:", statusFilter);
    // Force re-render by updating state
    setAchievements(prev => [...prev]);
    setSortApplied(true); // Set sortApplied to true after applying sort
  };

  const handleViewFile = (fileName, reg, name, section, comp, date, prize, fileContent) => {
    if (fileName) {
      // Create a file viewer popup
      const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      popup.document.write(`
        <html>
          <head>
            <title>File Viewer - ${fileName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 0; margin: 0; background: #f5f5f5; height: 100vh; overflow-x: hidden; }
              .container { display: flex; align-items: center; justify-content: center; height: 100vh; width: 100vw; background: #f5f5f5; overflow-x: hidden; }
              .file-content { 
                background: #fff; 
                padding: 0; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 0;
                width: 100vw;
                min-height: 85vh;
                max-width: 100vw;
                max-height: 100vh;
                overflow-x: hidden;
              }
              iframe { border: none; width: 100vw; height: 85vh; border-radius: 10px; background: #fff; max-width: 100vw; }
              .placeholder { padding: 40px; color: #666; font-style: italic; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="file-content">
                ${fileName.toLowerCase().includes('.pdf') && fileContent ? 
                  '<iframe src="' + fileContent + '#toolbar=0"></iframe>' :
                  '<div class="placeholder">📄 File Content<br><br>No file content available for preview.</div>'
                }
              </div>
            </div>
          </body>
        </html>
      `);
      popup.document.close();
    } else {
      alert('No file available to view');
    }
  };

  // Get filtered and sorted achievements
  const getFilteredAndSortedAchievements = () => {
    // If sort has not been applied, return original data
    if (!sortApplied) {
      return achievements;
    }

    let filtered = achievements;

    // Apply status filter
    if (statusFilter !== "all" && statusFilter !== "") {
      filtered = achievements.filter(achievement => {
        if (statusFilter === "approved") return achievement.status === "approved";
        if (statusFilter === "pending") return achievement.status === "pending";
        if (statusFilter === "rejected") return achievement.status === "rejected";
        return true;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date) - new Date(a.date); // Newest first
        case "name":
          return a.name.localeCompare(b.name);
        case "competition":
          return a.comp.localeCompare(b.comp);
        case "prize":
          return a.prize.localeCompare(b.prize);
        default:
          return 0;
      }
    });

    return sorted;
  };

  return (
    <div style={{
      fontFamily: 'Poppins, sans-serif', // overall font
      minHeight: '100vh',
      background: '#F9FAFB'
    }}>
      {/* --- NAVBAR --- */}
      <div style={{
        background: '#2276fc',
        display: 'flex',
        alignItems: 'center',
        height: 65,
        padding: '0 35px',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        {/* Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaGraduationCap size={50} color="#fff" style={{ marginRight: 16 }} />
          <span style={{
            fontWeight: 800, color: "#fff", fontSize: "1.5rem", letterSpacing: 1
          }}>
            Placement Portal
          </span>
        </div>
        {/* Nav Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <span style={{
            color:'#fff', fontWeight:500, fontSize:16, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '5px'
          }}><FaHome /> Home</span>
          <span style={{
            color:'#fff', fontWeight:500, fontSize:16, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '5px'
          }}><FaInfo /> About</span>
          <span style={{
            color:'#fff', fontWeight:500, fontSize:16, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '5px'
          }}><FaStar /> Features</span>
          <span style={{
            color:'#fff', fontWeight:500, fontSize:16, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '5px'
          }}><FaEnvelope /> Contact</span>
        </div>
      </div>
      {/* --- SIDEBAR + MAIN CONTENT --- */}
        <div style={{ display: 'flex', height: 'calc(100vh - 70px)', position: 'relative' }}>
        {/* Sidebar */}
        <div style={{
          width: 270,
          background: "#fff",
          height: "calc(100vh - 65px)",
          display: "flex",
          flexDirection: "column",
          borderRight: "1.5px solid #e5e7eb",
          fontFamily: 'Inter, Arial, sans-serif',
          position: "fixed",
          left: 0,
          top: 65,
          overflow: "hidden"
        }}>
          {/* Top Section - Fixed */}
          <div style={{
            padding: "18px 0 0 0", // reduced top padding
            flexShrink: 0,
            background: "#fff",
            zIndex: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", paddingLeft: 18 }}>
              <FaGraduationCap size={32} color="#2563eb" style={{ marginRight: 10 }} />
            <div>
                <span style={{ fontWeight: 800, color: "#222", fontSize: 17 }}>Student</span><br />
                <span style={{ color: "#bdbdbd", fontSize: 13, fontWeight: 500 }}>Final Year</span>
              </div>
            </div>
          </div>

          {/* Static Menu Section */}
          <div style={{ 
            flex: 1, 
            padding: "10px 0 0 0", // reduced top padding
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
              {menuItems.map(item => (
                <li 
                  key={item.text} 
                  onClick={() => {
                    console.log("Sidebar item clicked:", item.text);
                    if (item.text === 'Dashboard') onViewChange("dashboard");
                    else if (item.text === 'Resume') onViewChange("resume");
                    else if (item.text === 'Achievements') onViewChange("achievements");
                    else if (item.text === 'Attendance') onViewChange("attendance");
                    else if (item.text === 'Company') onViewChange("company");
                    else if (item.text === 'Profile') onViewChange("profile");
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, // reduced gap
                    padding: "10px 18px 10px 18px", // reduced padding
                    borderRadius: 12,
                    marginBottom: 2, // reduced margin
                    cursor: "pointer",
                    color: item.active ? "#197AFF" : "#000000",
                    fontWeight: item.active ? 800 : 500,
                    background: item.active ? "#eaf2ff" : "transparent",
                    position: "relative",
                    fontSize: 15,
                  }}
                >
                  {item.active && (
                    <div style={{
                      position: "absolute",
                      left: 0, top: 6, bottom: 6, width: 7,
                      borderRadius: 6,
                      background: "#2563eb"
                    }} />
                  )}
                  <span style={{ color: item.active ? "#197AFF" : "#000000", fontSize: 20 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Section - Fixed */}
          <div style={{ 
            paddingBottom: 10, // reduced
            paddingTop: 6, // reduced
            flexShrink: 0,
            background: "#fff",
            borderTop: "1.5px solid #e5e7eb",
            zIndex: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 18px 10px 18px" }}>
              <FaUser size={18} color="#000000" />
              <span style={{ fontSize: 15, color: "#000000", fontWeight: 600 }}>Profile</span>
            </div>
            <button
              onClick={onLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#e57373",
                color: "#fff",
                border: "none",
                padding: "12px 0",
                borderRadius: 20,
                width: "85%",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 2px 8px #f1f5f9",
                marginLeft: "auto",
                marginRight: "auto",
                justifyContent: "center",
                letterSpacing: 0.5,
              }}
            >
              <FaSignOutAlt size={18} /> Logout
            </button>
          </div>
        </div>
        {/* --- MAIN CONTENT --- */}
        <div style={{
          flex: 1,
          padding: '30px 32px',
          background: '#F9FAFB',
          overflow: 'auto',
          marginLeft: '270px',
          marginTop: '65px',
          height: 'calc(100vh - 135px)',
          width: 'calc(100vw - 270px)'
        }}>
          {/* TOP CARDS (Upload/Edit/Filter) */}
          <div style={{
            display: 'flex', gap: 40, alignItems: 'start', marginBottom: 20
          }}>
            {/* Upload Certificate Card */}
            <div style={{
              width: 200, height: 220,
              background: '#fff',
              borderRadius: 16,
              border: '1.5px solid #B5B7BC',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1.5px 12px #dde1f360',
              cursor: 'pointer'
            }} onClick={handleUploadClick}>
              <div style={{ marginBottom: 8 }}>
                <img 
                  src={require('./assets/uploadcerti.png')} 
                  alt="Upload Certificate" 
                  style={{ width: "40px", height: "40px" }}
                />
              </div>
              <div style={{
                fontWeight: 600, fontSize: 18
              }}>Upload Certificate</div>
              <div style={{
                fontSize: 14, color: '#929292', textAlign: 'center', marginTop: 8
              }}>
                Please upload your<br />certificate here
              </div>
              <div style={{
                marginTop: 18,
                border: '1px solid #dbdcdf',
                borderRadius: 7,
                width: 31, height: 31,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f7f8fa', cursor: 'pointer'
              }}>
                {/* Upload Arrow */}
                <svg width="18" height="18">
                  <path d="M9 3v12M3 9h12" stroke="#2276fc" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {/* Filter & Short Card */}
            <div style={{
              flex: 1, minWidth: 440,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: '25px 28px',
              boxShadow: '0 1.5px 12px #dde1f360',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{
                width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8
              }}>
                <button style={{
                  background: '#2276fc',
                  color: "#fff",
                  borderRadius: 12,
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 17,
                  padding: '7px 31px',
                  marginBottom: 4,
                  boxShadow: '0 2px 12px #C6D6FB',
                  cursor: "pointer"
                }}>Sort & Filter</button>
              </div>
              <select 
                value={sortBy || ""}
                onChange={handleSortChange}
                style={{
                fontSize: 16,
                marginBottom: 12,
                width: '95%',
                padding: '8px 13px',
                borderRadius: 10,
                border: '1px solid #d1d4da',
                background: '#fff', outline: 'none'
                }}
              >
                <option value="" disabled>Sort by</option>
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="competition">Competition</option>
                <option value="prize">Prize</option>
              </select>
              <select 
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{
                fontSize: 16,
                marginBottom: 12,
                width: '95%',
                padding: '8px 13px',
                borderRadius: 10,
                border: '1px solid #d1d4da',
                background: '#fff', outline: 'none'
                }}
              >
                <option value="" disabled selected>Status</option>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Reject</option>
              </select>
                              <button 
                onClick={handleSort}
                disabled={!sortBy || sortBy === "" || !statusFilter || statusFilter === "" || statusFilter === "all"}
                style={{
                width: '100%', height: 42,
                background: (!sortBy || sortBy === "" || !statusFilter || statusFilter === "" || statusFilter === "all") ? '#f0f0f0' : '#fff',
                borderRadius: 10,
                border: '1.5px solid #2276fc',
                color: (!sortBy || sortBy === "" || !statusFilter || statusFilter === "" || statusFilter === "all") ? '#999' : '#2276fc', 
                fontSize: 16, 
                fontWeight: 600,
                cursor: (!sortBy || sortBy === "" || !statusFilter || statusFilter === "" || statusFilter === "all") ? "not-allowed" : "pointer", 
                marginTop: 4,
                opacity: (!sortBy || sortBy === "" || !statusFilter || statusFilter === "" || statusFilter === "all") ? 0.6 : 1
                }}
              >
                Apply Sort
              </button>
            </div>
            {/* Edit Certificate Card */}
            <div style={{
              width: 200, height: 220,
              background: '#fff',
              borderRadius: 16,
              border: '1.5px solid #b8b6bd',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1.5px 12px #dde1f360',
              cursor: 'pointer'
            }} onClick={handleEditClick}>
              <div style={{ marginBottom: 10 }}>
              <img 
                src={require('./assets/editlogo.png')} 
                alt="Edit" 
                style={{ width: "40px", height: "40px" }}
              />
              </div>
              <div style={{
                fontWeight: 600, fontSize: 18
              }}>Edit</div>
              <div style={{
                fontSize: 15.2, color: '#929292', textAlign: 'center', marginTop: 6
              }}>
                Edit your certificate<br />information here
              </div>
            </div>
          </div>
          {/* --- ACHIEVEMENTS TABLE --- */}
          <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: '0 1.5px 12px #dde1f330',
            padding: '24px 18px',
            minWidth: 800,
            overflowX: 'auto'
          }}>
            <div style={{
              fontWeight: 600, fontSize: 22, marginBottom: 12
            }}>My Achievements</div>
            <table style={{
              width: '100%', borderCollapse: 'collapse', fontSize: 15,
              minWidth: 1200
            }}>
              <thead>
                <tr style={{ color: '#100', fontWeight: 50, background: '#ffffff' }}>
                  <th style={thStyle}>
                    <span>Select</span>
                  </th>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>Register No.</th>
                  <th style={thStyle}>Student Name</th>
                  <th style={thStyle}>Section</th>
                  <th style={thStyle}>Competition Name</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Prize</th>
                  <th style={thStyle}>Approved</th>
                  <th style={thStyle}>View</th>
                  <th style={thStyle}>Download</th>
                </tr>
              </thead>
              <tbody>
                {console.log("Rendering table with achievements:", achievements, "selectedRows:", selectedRows)}
                {getFilteredAndSortedAchievements().map((achievement, index) => (
                  <TableRow 
                    key={achievement.id}
                    id={achievement.id}
                    no={index + 1}
                    reg={achievement.reg}
                    name={achievement.name}
                    section={achievement.section}
                    comp={achievement.comp}
                    date={achievement.date}
                    prize={achievement.prize}
                    approved={achievement.approved}
                    status={achievement.status}
                    selected={selectedRows.includes(achievement.id)}
                    onSelect={handleRowSelect}
                    fileName={achievement.fileName}
                    fileContent={achievement.fileContent}
                    onViewFile={handleViewFile}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Certificate Upload Popup */}
      {console.log("showUploadPopup state:", showUploadPopup)}
      {showUploadPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
                     <div style={{
             position: 'relative',
             background: '#fff',
             borderRadius: 20,
             padding: '30px 38px 24px 38px',
             width: 640,
             maxWidth: '98vw',
           }}>
            
            <CertificateUpload onClose={handleClosePopup} onUpload={handleUploadSuccess} />
          </div>
        </div>
      )}

      {/* Edit Certificate Popup */}
      {showEditPopup && editingRow && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            position: 'relative',
            background: '#fff',
            borderRadius: 20,
            padding: '30px 40px 25px 40px',
            width: 450,
            maxWidth: '98vw',
            border: '2px solid #cccccc',
          }}>
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseEditPopup}
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
                borderRadius: "50%",
                transition: "background 0.2s"
              }}
              title="Close"
            >
              ×
            </button>
            
            <h2 style={{
              color: "#2276fc",
              textAlign: "center",
              marginBottom: 28,
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 0.3,
            }}>
              Edit Certificate
            </h2>
            
            <div style={{
              width: "100%",
              height: "2px",
              background: "#cccccc",
              margin: "0 0 28px 0",
              borderRadius: "1px"
            }} />
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updatedAchievement = {
                ...editingRow,
                reg: formData.get('reg') || editingRow.reg,
                name: formData.get('name') || editingRow.name,
                section: formData.get('section') || editingRow.section,
                date: formData.get('date') || editingRow.date,
                comp: formData.get('comp') || editingRow.comp,
                prize: formData.get('prize') || editingRow.prize,
                fileName: editFileName || editingRow.fileName // Update with new file if uploaded
              };
              
              setAchievements(prev => 
                prev.map(achievement => 
                  achievement.id === editingRow.id ? updatedAchievement : achievement
                )
              );
              
              handleCloseEditPopup();
            }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <input
                  style={inputStyle}
                  type="text"
                  name="reg"
                  placeholder="Register Number"
                  defaultValue={editingRow.reg}
                  required
                />
                <input
                  style={inputStyle}
                  type="text"
                  name="name"
                  placeholder="Name"
                  defaultValue={editingRow.name}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <input
                  style={inputStyle}
                  type="text"
                  name="section"
                  placeholder="Section"
                  defaultValue={editingRow.section}
                  required
                />
                <input
                  style={inputStyle}
                  type="date"
                  name="date"
                  placeholder="Participation Date"
                  defaultValue={editingRow.date}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <input
                  style={inputStyle}
                  type="text"
                  name="comp"
                  placeholder="Competition"
                  defaultValue={editingRow.comp}
                  required
                />
                <input
                  style={inputStyle}
                  type="text"
                  name="prize"
                  placeholder="Prize"
                  defaultValue={editingRow.prize}
                  required
                />
              </div>
              
              {/* Upload button for edit popup */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
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
                      justifyContent: "space-between"
                    }}
                    onClick={handleEditUploadClick}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", marginLeft: "-3px" }}>
                      <img 
                        src={require('./assets/uploadicon.png')} 
                        alt="Upload" 
                        style={{ width: "22px", height: "22px" }}
                      />
                      <span>{editFileName || "Upload"}</span>
                    </div>
                    {editFileName && (
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditFileName(""); 
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
                    ref={editFileInputRef}
                    style={{ display: "none" }}
                    onChange={handleEditFileChange}
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
                      <span style={{ color: "#0d9477" }}>{editFileName ? new Date().toLocaleDateString() : "No date"}</span>
                    )
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  type="submit"
                  style={{
                    width: "calc(100% - 250px)",
                    background: "linear-gradient(90deg,#2276fc 70%, #4588fb 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 19,
                    fontFamily: "Poppins, sans-serif",
                    letterSpacing: "0.03em",
                    border: "none",
                    borderRadius: 15,
                    padding: "8px 0",
                    boxShadow: "0 2px 14px #d1e2fb60",
                    cursor: "pointer",
                    transition: "background 0.18s"
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restriction Message Popup */}
      {showRestrictionPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            position: 'relative',
            background: '#fff',
            borderRadius: 20,
            padding: '30px 40px 25px 40px',
            width: 450,
            maxWidth: '98vw',
            border: '2px solid #ff4444',
            boxShadow: '0 4px 20px rgba(255, 68, 68, 0.2)'
          }}>
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseRestrictionPopup}
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
                borderRadius: "50%",
                transition: "background 0.2s"
              }}
              title="Close"
            >
              ×
            </button>
            
            <h2 style={{
              color: "#ff4444",
              textAlign: "center",
              marginBottom: 28,
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 0.3,
            }}>
              ⚠️ Edit Restriction
            </h2>
            
            <div style={{
              width: "100%",
              height: "2px",
              background: "#ff4444",
              margin: "0 0 28px 0",
              borderRadius: "1px"
            }} />
            
            <div style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "#333",
              textAlign: "center",
              whiteSpace: "pre-line",
              marginBottom: 30
            }}>
              {restrictionMessage}
            </div>
            
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleCloseRestrictionPopup}
                style={{
                  background: "#ff4444",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  fontFamily: "Poppins, sans-serif",
                  letterSpacing: "0.03em",
                  border: "none",
                  borderRadius: 15,
                  padding: "12px 30px",
                  cursor: "pointer",
                  transition: "background 0.18s"
                }}
              >
                OK, I Understand
              </button>
            </div>
          </div>
        </div>
      )}
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
};


// --- Table Row for Achievements ---
function TableRow({ id, no, reg, name, section, comp, date, prize, approved, status, selected, onSelect, fileName, fileContent, onViewFile, index }) {
  console.log(`TableRow ${id}: selected = ${selected}`);
  
  const handleDownload = () => {
    if (fileName) {
      // Create a certificate file with all details
      const content = `CERTIFICATE OF ACHIEVEMENT

Student Details:
Register Number: ${reg}
Name: ${name}
Section: ${section}

Achievement Details:
Competition: ${comp}
Date: ${date}
Prize: ${prize}

Certificate File: ${fileName}
Upload Date: ${new Date().toLocaleDateString()}

This is a certificate of achievement for the above student.
Generated by Placement Portal System.`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'certificate.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('No file available for download');
    }
  };

  const getStatusDisplay = () => {
    switch(status) {
      case "approved":
        return {
          text: "Approved",
          style: {
            background: "#DEFDED", 
            color: "#13CC8B", 
            fontSize: 14, 
            fontWeight: 600,
            borderRadius: 10, 
            padding: "2px 19px"
          }
        };
      case "rejected":
        return {
          text: "Rejected",
          style: {
            background: "#FFE6E6", 
            color: "#FF4444", 
            fontSize: 14, 
            fontWeight: 600,
            borderRadius: 10, 
            padding: "2px 16px"
          }
        };
      default:
        return {
          text: "Pending",
          style: {
            background: "#F6F7F9", 
            color: "#8b8b8b", 
            fontSize: 14, 
            fontWeight: 600,
            borderRadius: 10, 
            padding: "2px 16px"
          }
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <tr style={{ 
      borderBottom: '1.1px solid #e8e9f2',
      background: '#ffffff'
    }}>
      <td style={tdStyle}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(id)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
      </td>
      <td style={tdStyle}>{no}</td>
      <td style={tdStyle}>{reg}</td>
      <td style={tdStyle}>{name}</td>
      <td style={tdStyle}>{section}</td>
      <td style={tdStyle}>{comp}</td>
      <td style={{ ...tdStyle, fontWeight: 600, color: '#222' }}>{date}</td>
      <td style={tdStyle}>{prize}</td>
      <td style={tdStyle}>
        <span style={statusDisplay.style}>{statusDisplay.text}</span>
      </td>
      <td style={{
        ...tdStyle, textAlign: 'center', cursor: "pointer"
      }}>
        <button
          onClick={() => onViewFile(fileName, reg, name, section, comp, date, prize, fileContent)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title={fileName ? `View ${fileName}` : "No file available"}
        >
        <EyeIcon color="#4563fd" />
        </button>
      </td>
      <td style={{
        ...tdStyle, textAlign: 'center', cursor: "pointer"
      }}>
        <button
          onClick={handleDownload}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title={fileName ? `Download ${fileName}` : "No file available"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2276fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7,10 12,15 17,10" stroke="#2276fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="#2276fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}

// ---- Table/Column Header and Cell styles ----
const thStyle = {
  fontWeight: 600, padding: '8px 6px', textAlign: 'left', borderBottom: '2.5px solid #eee'
};
const tdStyle = {
  fontWeight: 500, padding: '8px 6px', color: '#535353', borderBottom: 'none'
};


