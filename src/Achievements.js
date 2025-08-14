import React, { useState, useRef } from "react";
import CertificateUpload from "./PopupAchievements.js";

// Imports from Dashboard for icons
import Adminicon from "./assets/Adminicon.png";
import CompanySideBarIcon from "./assets/CompanySideBarIcon.svg";

const EyeIcon = ({ color = "#4563fd" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2"/>
  </svg>
);

// Sidebar items array from Dashboard
const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
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
    <>
      {/* --- STYLES FROM DASHBOARD --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap');
        
        body {
          background: #f8f8fb;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', Arial, sans-serif;
        }
        
        .container {
          font-family: 'Poppins', Arial, sans-serif;
          background: #f8f8fb;
          min-height: 100vh;
        }
        
        /* Navbar styles */
        .navbar {
          display: flex;
          align-items: center;
          background: #2085f6;
          color: #fff;
          padding: 15px 32px 15px 26px;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        
        .navbar .left {
          display: flex;
          align-items: center;
        }
        
        .portal-logo {
          height: 35px;
          width: 35px;
          margin-right: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .portal-logo img {
          height: 30px;
          width: 40px;
          filter: brightness(0) invert(1);
        }
        
        .portal-name {
          font-size: 1.48rem;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        
        .navbar .menu {
          display: flex;
          gap: 35px;
          font-size: 1.06rem;
        }
        
        .navbar .menu span {
          color: #fff;
          text-decoration: none;
          margin: 0 5px;
          font-weight: 500;
          position: relative;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .navbar .menu span:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .main {
          display: flex;
          min-height: calc(100vh - 65px);
          margin-top: 65px;
        }
        
        /* Sidebar */
        .sidebar {
          background: #fff;
          width: 230px; /* Adjusted from 230px to 270px to match original layout */
          height: calc(100vh - 65px);
          box-shadow: 2px 0 12px #e1e6ef3a;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 65px;
          overflow-y: auto;
          z-index: 999;
        }
        
        .sidebar .user-info {
          text-align: center;
          padding: 25px 20px 20px 20px;
          font-size: 1rem;
          color: #555;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex-shrink: 0;
          margin-top: 15px;
        }
        
        .sidebar .user-details img {
          width: 50px;
          height: 40px;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .sidebar .user-details {
          margin-top: 8px;
          font-weight: 600;
          font-size: 1.1em;
          color: #191c24;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0;
        }
        
        .sidebar .user-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }
        
        .sidebar .user-year {
          color: #777;
          font-size: 0.9em;
          font-weight: 400;
          margin-top: 2px;
          display: block;
        }
        
        .sidebar .menu-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #999;
          font-size: 1.2em;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
          margin-top: 40px; 
        }
        
        .sidebar .menu-toggle:hover {
          background: #f0f0f0;
        }
        
        .sidebar .nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0px 0;
          justify-content: flex-start;
          gap: 0;
          min-height: 0;
        }
        
        .sidebar .nav-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .sidebar .nav-item {
          display: flex;
          align-items: center;
          font-size: 1.27rem;
          padding: 18px 25px;
          color: #000000;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
          gap: 15px;
          border-left: 4px solid transparent;
          margin: 3px 0;
          margin-top : 10px;
        }
        
        .sidebar .nav-item.selected {
          background: #F8F8F8;
          border-left: 4px solid #197AFF;
          color: #197AFF;
          font-weight: 600;
        }
        
        .sidebar .nav-item.selected img {
          filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%);
        }
        
        .sidebar .nav-item:hover:not(.selected) {
          background: #f0f6ff;
          border-left: 4px solid #197AFF;
          color: #197AFF;
        }
        
        .sidebar .nav-item img {
          width: 20px;
          height: 20px;
          transition: transform 0.2s;
          filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
        }
        
        .sidebar .nav-item:hover img {
          transform: scale(1.1);
        }
        
        .sidebar .nav-item:hover:not(.selected) img {
          filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%);
        }
        
        .sidebar .nav-divider {
          height: 1px;
          width: 228px;
          background: #e0e0e0;
          margin: 8px 2px;
          border-top: 1px dotted #ccc;
          flex-shrink: 0;
          margin-top: 12px;
        }
        
        .sidebar .logout-btn {
          background: #D23B42;
          color: #fff;
          margin: 25px 25px 25px 25px;
          padding: 10px 0;
          border: none;
          border-radius: 60px;
          font-size: 1.3rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 50%;
          margin-left: 50px;
          margin-bottom: 10px;
        }
        
        .sidebar .logout-btn:hover {
          background: #d55a6a;
        }
      `}</style>
      
      <div className="container">
        {/* --- NAVBAR (from Dashboard) --- */}
        <div className="navbar">
            <div className="left">
                <span className="portal-logo">
                    <img src={Adminicon} alt="Portal Logo" />
                </span>
                <span className="portal-name">Placement Portal</span>
            </div>
            <div className="menu">
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>About</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Features</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>Contact</span>
            </div>
        </div>

        <div className="main">
            {/* --- SIDEBAR (REPLACED) --- */}
            <div className="sidebar">
              <div className="user-info">
                  <div className="user-details">
                      <img src={Adminicon} alt="Admin" style={{ filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)" }} />
                      <div className="user-text">
                          <span>Student</span>
                          <span className="user-year">Final Year</span>
                      </div>
                      <img src={Adminicon} alt="Admin" style={{ width: "16px", height: "16px", marginLeft: "auto" }} />
                  </div>
              </div>
              <button className="menu-toggle">•••</button>
              <nav className="nav">
                  <div className="nav-section">
                      {sidebarItems.slice(0, 5).map((item) => (
                          <span key={item.text} className={`nav-item${item.view === currentView ? ' selected' : ''}`} onClick={() => { console.log("Sidebar item clicked:", item.text, "view:", item.view); onViewChange(item.view); }}>
                              <img src={item.icon} alt={item.text} /> {item.text}
                          </span>
                      ))}
                  </div>
                  <div className="nav-divider"></div>
                  <span className={`nav-item${currentView === 'profile' ? ' selected' : ''}`} onClick={() => onViewChange('profile')}>
                      <img src={require('./assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
                  </span>
              </nav>
              <button className="logout-btn" onClick={onLogout}>
                  Logout
              </button>
            </div>
            
            {/* --- MAIN CONTENT (Original from Achievements page) --- */}
            <div style={{
              flex: 1,
              padding: '30px 32px',
              background: '#F9FAFB',
              overflow: 'auto',
              marginLeft: '270px',
              marginTop: '0', // Removed marginTop because .main already handles it
              height: 'calc(100vh - 65px)',
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
                    src={require('./assets/uploadcertificateicon.png')}
                    alt="Upload Certificate" 
                    style={{ width: "70px", height: "70px",marginTop:"-20px" }}
                  />
                </div>
                <img 
                    src={require('./assets/certificateuploadicon.png')}
                    alt="Upload Certificate" 
                    style={{ width: "20px", height: "20px",marginTop : "-40px",marginRight:"30px" }}
                  />
                <div style={{
                  fontWeight: 600, fontSize: 18,marginTop: "20px"
                }}>Upload Certificate</div>
                <div style={{
                  fontSize: 14, color: '#929292', textAlign: 'center', marginTop: 8
                }}>
                  Please upload your<br />certificate here
                </div>
                <div style={{
                  marginTop: -5,
                  border: '1px solid #dbdcdf',
                  borderRadius: 7,
                  width: 0, height: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f7f8fa', cursor: 'pointer'
                }}>
                  {/* Upload Arrow */}
                
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
                  style={{ width: "70px", height: "70px",marginTop: "-20px"}}
                />
                </div>
                <img 
                  src={require('./assets/editpencil.png')} 
                  alt="Edit" 
                  style={{ width: "20px", height: "20px",marginTop: "-40px",marginRight: "30px" }}
                />
                <div style={{
                  fontWeight: 600, fontSize: 18,marginTop: "20px"
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
              width: 1175,
            
            }}>
              <div style={{
                fontWeight: 600, fontSize: 22, marginBottom: 12
              }}>My Achievements</div>
              <table style={{
                width: '100%', borderCollapse: 'collapse', fontSize: 15,
                minWidth: 1100
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
      </div>
      
      {/* --- POPUPS (Unchanged) --- */}
      {showUploadPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
              position: 'relative', background: '#fff', borderRadius: 20,
              padding: '30px 38px 24px 38px', width: 640, maxWidth: '98vw'
            }}>
            <CertificateUpload onClose={handleClosePopup} onUpload={handleUploadSuccess} />
          </div>
        </div>
      )}
      {showEditPopup && editingRow && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 20, padding: '30px 40px 25px 40px',
            width: 450, maxWidth: '98vw', border: '2px solid #cccccc',
          }}>
            <button type="button" onClick={handleCloseEditPopup}
              style={{
                position: "absolute", top: "15px", right: "20px", background: "transparent", border: "none", fontSize: "28px",
                color: "#999999", cursor: "pointer", fontWeight: "600", width: "35px", height: "35px", display: "flex",
                alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "background 0.2s"
              }}
              title="Close">
              ×
            </button>
            <h2 style={{
                color: "#2276fc", textAlign: "center", marginBottom: 28, fontFamily: "Poppins, sans-serif",
                fontWeight: 700, fontSize: 24, letterSpacing: 0.3,
              }}>
              Edit Certificate
            </h2>
            <div style={{
                width: "100%", height: "2px", background: "#cccccc",
                margin: "0 0 28px 0", borderRadius: "1px"
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
                fileName: editFileName || editingRow.fileName
              };
              setAchievements(prev => prev.map(achievement => achievement.id === editingRow.id ? updatedAchievement : achievement));
              handleCloseEditPopup();
            }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <input style={inputStyle} type="text" name="reg" placeholder="Register Number" defaultValue={editingRow.reg} required />
                <input style={inputStyle} type="text" name="name" placeholder="Name" defaultValue={editingRow.name} required />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <input style={inputStyle} type="text" name="section" placeholder="Section" defaultValue={editingRow.section} required />
                <input style={inputStyle} type="date" name="date" placeholder="Participation Date" defaultValue={editingRow.date} required />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                <input style={inputStyle} type="text" name="comp" placeholder="Competition" defaultValue={editingRow.comp} required />
                <input style={inputStyle} type="text" name="prize" placeholder="Prize" defaultValue={editingRow.prize} required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <button type="button"
                    style={{
                      fontFamily: "Poppins, sans-serif", fontSize: 17, fontWeight: 500, display: "flex",
                      alignItems: "center", gap: 6, borderRadius: 10, border: "1px solid #cccccc",
                      background: "#ffffff", padding: "8px 18px", color: "#666666", cursor: "pointer",
                      position: "relative", minWidth: "200px", justifyContent: "space-between"
                    }}
                    onClick={handleEditUploadClick}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", marginLeft: "-3px" }}>
                      <img src={require('./assets/uploadicon.png')} alt="Upload" style={{ width: "22px", height: "22px" }} />
                      <span>{editFileName || "Upload"}</span>
                    </div>
                    {editFileName && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditFileName(""); }}
                        style={{
                          fontFamily: "Poppins, sans-serif", fontSize: 22, fontWeight: 600, display: "flex",
                          alignItems: "center", justifyContent: "center", background: "transparent", padding: "4px",
                          color: "#666666", cursor: "pointer", width: "28px", height: "28px", border: "none"
                        }}
                        title="Clear">
                        ×
                      </button>
                    )}
                  </button>
                  <input type="file" accept=".pdf" ref={editFileInputRef} style={{ display: "none" }} onChange={handleEditFileChange} />
                </div>
                <div style={{ fontSize: 14, color: "#444", marginTop: 8, letterSpacing: 0.01, textAlign: "center" }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#2276fc", fontWeight: 600 }}>*</span> Upload Max 1MB PDF file
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#ff6464", fontWeight: 800, marginRight: 3 }}>*</span> if not uploaded ---&gt; <span style={{ color: "#2276fc" }}>Upload your Certificate</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ color: "#2276fc", fontWeight: 800, marginRight: 3 }}>*</span> if Certificate uploaded ---&gt; last uploaded on (<span style={{ color: "#0d9477" }}>{editFileName ? new Date().toLocaleDateString() : "No date"}</span>)
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button type="submit"
                  style={{
                    width: "calc(100% - 250px)", background: "linear-gradient(90deg,#2276fc 70%, #4588fb 100%)",
                    color: "#fff", fontWeight: 600, fontSize: 19, fontFamily: "Poppins, sans-serif", letterSpacing: "0.03em",
                    border: "none", borderRadius: 15, padding: "8px 0", boxShadow: "0 2px 14px #d1e2fb60",
                    cursor: "pointer", transition: "background 0.18s"
                  }}>
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showRestrictionPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            position: 'relative', background: '#fff', borderRadius: 20, padding: '30px 40px 25px 40px',
            width: 450, maxWidth: '98vw', border: '2px solid #ff4444', boxShadow: '0 4px 20px rgba(255, 68, 68, 0.2)'
          }}>
            <button type="button" onClick={handleCloseRestrictionPopup}
              style={{
                position: "absolute", top: "15px", right: "20px", background: "transparent", border: "none", fontSize: "28px",
                color: "#999999", cursor: "pointer", fontWeight: "600", width: "35px", height: "35px", display: "flex",
                alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "background 0.2s"
              }}
              title="Close">
              ×
            </button>
            <h2 style={{
              color: "#ff4444", textAlign: "center", marginBottom: 28, fontFamily: "Poppins, sans-serif",
              fontWeight: 700, fontSize: 24, letterSpacing: 0.3,
            }}>
              ⚠️ Edit Restriction
            </h2>
            <div style={{
              width: "100%", height: "2px", background: "#ff4444",
              margin: "0 0 28px 0", borderRadius: "1px"
            }} />
            <div style={{
              fontSize: 16, lineHeight: 1.6, color: "#333",
              textAlign: "center", whiteSpace: "pre-line", marginBottom: 30
            }}>
              {restrictionMessage}
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={handleCloseRestrictionPopup}
                style={{
                  background: "#ff4444", color: "#fff", fontWeight: 600, fontSize: 16, fontFamily: "Poppins, sans-serif",
                  letterSpacing: "0.03em", border: "none", borderRadius: 15, padding: "12px 30px",
                  cursor: "pointer", transition: "background 0.18s"
                }}>
                OK, I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Unchanged Child Components ---

const inputStyle = {
  flex: 1, fontSize: 15.4, fontFamily: "Poppins, sans-serif", borderRadius: 10, border: "1.5px solid #bddaed",
  background: "#f8faff", color: "#3A4957", padding: "12px 16px 12px 13px", outline: "none", fontWeight: 500, letterSpacing: ".03em",
};

function TableRow({ id, no, reg, name, section, comp, date, prize, status, selected, onSelect, fileName, fileContent, onViewFile }) {
  const handleDownload = () => {
    if (fileName) {
      const content = `CERTIFICATE OF ACHIEVEMENT...`; // Content generation logic remains the same
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
      case "approved": return { text: "Approved", style: { background: "#DEFDED", color: "#13CC8B", fontSize: 14, fontWeight: 600, borderRadius: 10, padding: "2px 19px" } };
      case "rejected": return { text: "Rejected", style: { background: "#FFE6E6", color: "#FF4444", fontSize: 14, fontWeight: 600, borderRadius: 10, padding: "2px 16px" } };
      default: return { text: "Pending", style: { background: "#F6F7F9", color: "#8b8b8b", fontSize: 14, fontWeight: 600, borderRadius: 10, padding: "2px 16px" } };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <tr style={{ borderBottom: '1.1px solid #e8e9f2', background: '#ffffff' }}>
      <td style={tdStyle}><input type="checkbox" checked={selected} onChange={() => onSelect(id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} /></td>
      <td style={tdStyle}>{no}</td>
      <td style={tdStyle}>{reg}</td>
      <td style={tdStyle}>{name}</td>
      <td style={tdStyle}>{section}</td>
      <td style={tdStyle}>{comp}</td>
      <td style={{ ...tdStyle, fontWeight: 600, color: '#222' }}>{date}</td>
      <td style={tdStyle}>{prize}</td>
      <td style={tdStyle}><span style={statusDisplay.style}>{statusDisplay.text}</span></td>
      <td style={{ ...tdStyle, textAlign: 'center', cursor: "pointer" }}>
        <button onClick={() => onViewFile(fileName, reg, name, section, comp, date, prize, fileContent)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
          title={fileName ? `View ${fileName}` : "No file available"}>
          <EyeIcon color="#4563fd" />
        </button>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center', cursor: "pointer" }}>
        <button onClick={handleDownload}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
          title={fileName ? `Download ${fileName}` : "No file available"}>
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

const thStyle = { fontWeight: 600, padding: '8px 6px', textAlign: 'left', borderBottom: '2.5px solid #eee' };
const tdStyle = { fontWeight: 500, padding: '8px 6px', color: '#535353', borderBottom: 'none' };