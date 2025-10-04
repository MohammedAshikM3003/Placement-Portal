<<<<<<< HEAD
import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import CertificateUpload from "./PopupAchievements.js";
import EditCertificate from "./popupEditAchievements.js";
import './Achievements.css';
import UploadCertificatecardicon from './assets/UploadCertificatecardicon.svg';
import editcertificatecardicon from './assets/editcertificatecardicon.svg';

const EyeIcon = ({ color = "#4563fd" }) => ( <svg width="22" height="22" viewBox="0 0 24 24" fill="none"> <ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="2"/> <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2"/> </svg> );

export default function Achievements({ onLogout, onViewChange }) { // Removed currentView
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="container">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="main">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          onViewChange={handleViewChange} 
          currentView={'achievements'} // Hardcode 'achievements'
        />
        <div className="achievements-area dashboard-area">
          <AchievementsContent />
        </div>
      </div>
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}

// The rest of the file (AchievementsContent, TableRow, etc.) remains unchanged.
// ... (Your existing AchievementsContent and TableRow components go here)
function AchievementsContent() {
=======
import React, { useState } from "react";
import CertificateUpload from "./PopupAchievements.js";
import EditCertificate from "./popupEditAchievements.js";

import Adminicon from "./assets/Adminicon.png";
import CompanySideBarIcon from "./assets/CompanySideBarIcon.svg";

const EyeIcon = ({ color = "#4563fd" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2"/>
  </svg>
);

const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
];

export default function Achievements({ onLogout, onViewChange, currentView }) {
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [restrictionMessage, setRestrictionMessage] = useState("");
<<<<<<< HEAD
  const [selectedRows, setSelectedRows] = useState([1]);
  const [editingRow, setEditingRow] = useState(null);
=======
  const [selectedRows, setSelectedRows] = useState([1]); 
  const [editingRow, setEditingRow] = useState(null);

  // State for the input fields (what the user selects)
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const [sortBy, setSortBy] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearSemesterFilter, setYearSemesterFilter] = useState("");
<<<<<<< HEAD
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: "", yearSemesterFilter: "", statusFilter: "all", sortBy: "",
  });
  const [filtersHaveBeenApplied, setFiltersHaveBeenApplied] = useState(false);
=======

  // State for the filters that are actually applied to the table
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: "",
    yearSemesterFilter: "",
    statusFilter: "all",
    sortBy: "",
  });

  // A flag to check if the "Apply" button has been clicked
  const [filtersHaveBeenApplied, setFiltersHaveBeenApplied] = useState(false);

>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const [achievements, setAchievements] = useState([
    { id: 1, reg: "731522104001", name: "Rajesh Kumar", year: "IV", semester: "7", section: "A", comp: "AI Hackathon Fest", date: "2025-09-23", prize: "1st", status: "approved", fileName: "ai_hackathon.pdf", fileContent: "...", uploadDate: "15/09/2025" },
    { id: 2, reg: "731522104002", name: "Priya Sharma", year: "IV", semester: "7", section: "B", comp: "Paper Presentation", date: "2025-10-26", prize: "2nd", status: "pending", fileName: "paper_presentation.pdf", fileContent: "...", uploadDate: "16/09/2025" },
    { id: 3, reg: "731522104003", name: "Arjun Singh", year: "IV", semester: "8", section: "A", comp: "Coding Competition", date: "2025-11-15", prize: "3rd", status: "rejected", fileName: "coding_comp.pdf", fileContent: "...", uploadDate: "17/09/2025" },
<<<<<<< HEAD
    { id: 4, reg: "731522104004", name: "Sneha Patel", year: "III", semester: "6", section: "C", comp: "Robotics Challenge", date: "2025-12-05", prize: "1st", status: "approved", fileName: "robotics_challenge.pdf", fileContent: "...", uploadDate: "18/09/2025" },
    { id: 5, reg: "731522104005", name: "Vikram Das", year: "III", semester: "5", section: "B", comp: "Math Olympiad", date: "2025-09-30", prize: "2nd", status: "pending", fileName: "math_olympiad.pdf", fileContent: "...", uploadDate: "19/09/2025" },
    { id: 6, reg: "731522104006", name: "Anita Reddy", year: "II", semester: "4", section: "A", comp: "Science Fair", date: "2025-10-12", prize: "3rd", status: "approved", fileName: "science_fair.pdf", fileContent: "...", uploadDate: "20/09/2025" },
    { id: 7, reg: "731522104007", name: "Karan Mehta", year: "II", semester: "3", section: "C", comp: "Debate Competition", date: "2025-11-20", prize: "1st", status: "rejected", fileName: "debate_comp.pdf", fileContent: "...", uploadDate: "21/09/2025" },
    { id: 8, reg: "731522104008", name: "Meera Joshi", year: "I", semester: "2", section: "B", comp: "Art Contest", date: "2025-12-18", prize: "2nd", status: "approved", fileName: "art_contest.pdf", fileContent: "...", uploadDate: "22/09/2025" },
    { id: 9, reg: "731522104009", name: "Rohan Verma", year: "I", semester: "1", section: "A", comp: "Music Competition", date: "2025-09-28", prize: "3rd", status: "pending", fileName: "music_comp.pdf", fileContent: "...", uploadDate: "23/09/2025" },
=======
    { id: 4, reg: "731522103004", name: "Ananya Reddy", year: "III", semester: "6", section: "C", comp: "Web Dev Challenge", date: "2025-08-05", prize: "1st", status: "approved", fileName: "web_dev_challenge.pdf", fileContent: "...", uploadDate: "01/08/2025" },
    { id: 5, reg: "731522103005", name: "Vikram Mehta", year: "III", semester: "6", section: "B", comp: "Data Science Olympiad", date: "2025-09-01", prize: "Participation", status: "pending", fileName: "data_science_olympiad.pdf", fileContent: "...", uploadDate: "28/08/2025" },
    { id: 6, reg: "731522104006", name: "Sneha Patil", year: "IV", semester: "7", section: "A", comp: "Startup Pitch Contest", date: "2025-10-10", prize: "2nd", status: "approved", fileName: "startup_pitch.pdf", fileContent: "...", uploadDate: "05/10/2025" },
    { id: 7, reg: "731522102007", name: "Rohan Gupta", year: "II", semester: "4", section: "D", comp: "Robotics Expo", date: "2025-07-20", prize: "Honorable Mention", status: "approved", fileName: "robotics_expo.pdf", fileContent: "...", uploadDate: "15/07/2025" },
    { id: 8, reg: "731522104008", name: "Isha Nair", year: "IV", semester: "7", section: "B", comp: "Cyber Security CTF", date: "2025-11-30", prize: "1st", status: "pending", fileName: "cyber_ctf.pdf", fileContent: "...", uploadDate: "25/11/2025" },
    { id: 9, reg: "731522103009", name: "Karan Verma", year: "III", semester: "5", section: "C", comp: "UI/UX Design Contest", date: "2025-06-18", prize: "3rd", status: "rejected", fileName: "ui_ux_design.pdf", fileContent: "...", uploadDate: "12/06/2025" },
    { id: 10, reg: "731522104010", name: "Meera Desai", year: "IV", semester: "7", section: "A", comp: "Cloud Computing Marathon", date: "2025-09-12", prize: "Participation", status: "approved", fileName: "cloud_marathon.pdf", fileContent: "...", uploadDate: "10/09/2025" }
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  ]);

  const handleUploadClick = () => setShowUploadPopup(true);
  const handleClosePopup = () => setShowUploadPopup(false);
<<<<<<< HEAD
  const handleUploadSuccess = (newAchievement) => { const newRecord = { ...newAchievement, id: achievements.length + 1, status: "pending" }; setAchievements(prev => [...prev, newRecord]); setSelectedRows([newRecord.id]); };
=======
  const handleUploadSuccess = (newAchievement) => { const newRecord = { ...newAchievement, id: achievements.length + 1, status: "pending", approved: false }; setAchievements(prev => [...prev, newRecord]); setSelectedRows([newRecord.id]); };
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const handleEditClick = () => { if (selectedRows.length === 1) { const selected = achievements.find(a => a.id === selectedRows[0]); if (selected.status === "approved" || selected.status === "rejected") { setRestrictionMessage(`❌ Cannot edit ${selected.status} achievements!\n\nThis record is locked and cannot be modified.\n\n📝 Only pending records can be edited.`); setShowRestrictionPopup(true); return; } setEditingRow(selected); setShowEditPopup(true); } else { alert("Please select exactly one row to edit"); } };
  const handleCloseEditPopup = () => { setShowEditPopup(false); setEditingRow(null); };
  const handleUpdateAchievement = (updated) => { setAchievements(prev => prev.map(a => a.id === updated.id ? updated : a)); };
  const handleCloseRestrictionPopup = () => setShowRestrictionPopup(false);
  const handleRowSelect = (id) => { setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]); };
<<<<<<< HEAD
=======
  
  // These functions now only update the state for the input fields. They don't cause the table to refilter.
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const handleSortChange = (e) => setSortBy(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleYearSemesterFilterChange = (e) => setYearSemesterFilter(e.target.value);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
<<<<<<< HEAD
  const handleApplyFilters = () => { setAppliedFilters({ searchQuery, yearSemesterFilter, statusFilter, sortBy }); setFiltersHaveBeenApplied(true); };
  const handleClearFilters = () => { setSearchQuery(""); setYearSemesterFilter(""); setSortBy(""); setStatusFilter("all"); setAppliedFilters({ searchQuery: "", yearSemesterFilter: "", statusFilter: "all", sortBy: "" }); setFiltersHaveBeenApplied(false); };
  const handleViewFile = (fileName, fileContent) => { if (fileContent) { const popup = window.open('', '_blank', 'width=800,height=600'); popup.document.write(`<iframe src="${fileContent}#toolbar=0" width="100%" height="100%" style="border:none;"></iframe>`); popup.document.title = fileName; } else { alert('No file to view'); } };
  const getFilteredAndSortedAchievements = () => {
    if (!filtersHaveBeenApplied) return achievements;
    let filtered = [...achievements];
    const { searchQuery, yearSemesterFilter, statusFilter, sortBy } = appliedFilters;
    if (searchQuery) filtered = filtered.filter(a => a.comp.toLowerCase().includes(searchQuery.toLowerCase()));
    if (yearSemesterFilter) { const [year, semester] = yearSemesterFilter.split('/'); filtered = filtered.filter(a => a.year === year && a.semester === semester); }
    if (statusFilter !== "all") filtered = filtered.filter(a => a.status === statusFilter);
    if (sortBy) { return [...filtered].sort((a, b) => { if (sortBy === "date") return new Date(b.date) - new Date(a.date); if (sortBy === "prize") return a.prize.localeCompare(b.prize); return 0; }); }
    return filtered;
  };

  return (
    <>
      <div className="achievements-cards-container">
        <div className="achievements-action-card" onClick={handleUploadClick}>
            <img src={UploadCertificatecardicon} alt="Upload Certificate" className="action-card-img-main" />
            <div className="action-card-title">Upload Certificate</div>
            <div className="action-card-desc">Please upload your<br />certificate here</div>
        </div>
        <div className="achievements-filter-card">
            <button className="filter-card-button">Sort & Filter</button>
            <div className="filter-grid">
                <div className="achievements-input-container">
                    <input type="text" id="competitionName" value={searchQuery} onChange={handleSearchChange} className={`achievements-filter-input ${searchQuery ? 'achievements-has-value' : ''}`} />
                    <label htmlFor="competitionName" className="achievements-floating-label">Enter Competition Name</label>
                </div>
                <select value={yearSemesterFilter} onChange={handleYearSemesterFilterChange} className="achievements-filter-input">
                    <option value="">Year/Semester</option><option value="I/1">I/1</option><option value="I/2">I/2</option><option value="II/3">II/3</option><option value="II/4">II/4</option><option value="III/5">III/5</option><option value="III/6">III/6</option><option value="IV/7">IV/7</option><option value="IV/8">IV/8</option>
                </select>
                <select value={sortBy} onChange={handleSortChange} className="achievements-filter-input">
                    <option value="" disabled>Sort by</option><option value="date">Date</option><option value="prize">Prize</option>
                </select>
                <select value={statusFilter} onChange={handleStatusFilterChange} className="achievements-filter-input">
                    <option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                </select>
            </div>
            <div className="filter-actions">
                <button className="achievements-apply-sort-btn" onClick={handleApplyFilters}>Apply</button>
                <button className="achievements-clear-filter-btn" onClick={handleClearFilters}>Clear</button>
            </div>
        </div>
        <div className="achievements-action-card" onClick={handleEditClick}>
            <img src={editcertificatecardicon} alt="Edit Certificate" className="action-card-img-main"/>
            <div className="action-card-title">Edit Certificate</div>
            <div className="action-card-desc">Edit your certificate<br />information here</div>
        </div>
      </div>
      <div className="achievements-table-container">
        <div className="table-header"><h2>MY ACHIEVEMENTS</h2></div>
        <div className="table-scroll-wrapper">
            <table className="achievements-table">
                <thead>
                    <tr><th>Select</th><th>S.No</th><th>Register No.</th><th>Student Name</th><th>Year</th><th>Semester</th><th>Section</th><th>Competition Name</th><th>Date</th><th>Prize</th><th>Status</th><th>View</th><th>Download</th></tr>
                </thead>
                <tbody>
                    {getFilteredAndSortedAchievements().map((achievement, index) => (<TableRow key={achievement.id} {...achievement} no={index + 1} selected={selectedRows.includes(achievement.id)} onSelect={handleRowSelect} onViewFile={handleViewFile} />))}
                </tbody>
            </table>
        </div>
      </div>
      {showUploadPopup && <CertificateUpload onClose={handleClosePopup} onUpload={handleUploadSuccess} />}
      {showEditPopup && editingRow && <EditCertificate onClose={handleCloseEditPopup} onUpdate={handleUpdateAchievement} initialData={editingRow} />}
      {showRestrictionPopup && (<div className="restriction-popup-overlay"><div className="restriction-popup-content"><h2> ⚠️ Edit Restriction </h2><div className="restriction-message">{restrictionMessage}</div><button onClick={handleCloseRestrictionPopup} className="restriction-ok-btn">OK, I Understand</button></div></div>)}
=======

  // This is the button click handler. It applies all selected filters at once.
  const handleApplyFilters = () => {
    setAppliedFilters({
      searchQuery,
      yearSemesterFilter,
      statusFilter,
      sortBy,
    });
    setFiltersHaveBeenApplied(true);
  };

  // This function clears all inputs and resets the table to its original state.
  const handleClearFilters = () => {
    setSearchQuery("");
    setYearSemesterFilter("");
    setSortBy("");
    setStatusFilter("all");
    setAppliedFilters({
      searchQuery: "",
      yearSemesterFilter: "",
      statusFilter: "all",
      sortBy: "",
    });
    setFiltersHaveBeenApplied(false);
  };

  const handleViewFile = (fileName, fileContent) => { if (fileContent) { const popup = window.open('', '_blank', 'width=800,height=600'); popup.document.write(`<iframe src="${fileContent}#toolbar=0" width="100%" height="100%" style="border:none;"></iframe>`); popup.document.title = fileName; } else { alert('No file to view'); } };
  
  // This function now filters and sorts ONLY based on the `appliedFilters` state.
  const getFilteredAndSortedAchievements = () => {
    if (!filtersHaveBeenApplied) {
      return achievements; // Before clicking "Apply", show the full list.
    }

    let filtered = [...achievements];
    const { searchQuery, yearSemesterFilter, statusFilter, sortBy } = appliedFilters;

    if (searchQuery) {
      filtered = filtered.filter(a => a.comp.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (yearSemesterFilter) {
      const [year, semester] = yearSemesterFilter.split('/');
      filtered = filtered.filter(a => a.year === year && a.semester === semester);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    if (sortBy) {
      return [...filtered].sort((a, b) => {
        if (sortBy === "date") return new Date(b.date) - new Date(a.date);
        if (sortBy === "prize") return a.prize.localeCompare(b.prize);
        return 0;
      });
    }
    return filtered;
  };
  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap');
        
        /* GENERAL & LAYOUT STYLES */
        body { background: #f8f8fb; margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; overflow: hidden; }
        .container { font-family: 'Poppins', Arial, sans-serif; background: #f8f8fb; min-height: 100vh; }
        .main { display: flex; min-height: calc(100vh - 110px); margin-top: 65px; }

        /* NAVBAR STYLES */
        .navbar { display: flex; align-items: center; background: #2085f6; color: #fff; padding: 15px 32px 15px 26px; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: fixed; top: 0; left: 0; right: 0; z-index: 1000; }
        .navbar .left { display: flex; align-items: center; }
        .portal-logo { height: 35px; width: 35px; margin-right: 18px; display: flex; align-items: center; justify-content: center; }
        .portal-logo img { height: 30px; width: 40px; filter: brightness(0) invert(1); }
        .portal-name { font-size: 1.48rem; font-weight: bold; letter-spacing: 0.5px; }
        .navbar .menu { display: flex; gap: 35px; font-size: 1.06rem; }
        .navbar .menu span { color: #fff; text-decoration: none; margin: 0 5px; font-weight: 500; position: relative; padding: 8px 12px; border-radius: 6px; transition: background 0.2s; display: flex; align-items: center; gap: 5px; cursor: pointer; }
        .navbar .menu span:hover { background: rgba(255,255,255,0.1); }
        
        /* SIDEBAR STYLES */
        .sidebar { background: #fff; width: 230px; height: calc(100vh - 65px); box-shadow: 2px 0 12px #e1e6ef3a; display: flex; flex-direction: column; position: fixed; left: 0; top: 65px; overflow-y: auto; z-index: 999; }
        .sidebar .user-info { text-align: center; padding: 25px 20px 20px; font-size: 1rem; color: #555; display: flex; flex-direction: column; align-items: center; position: relative; flex-shrink: 0; margin-top: 15px; }
        .sidebar .user-details { margin-top: 8px; font-weight: 600; font-size: 1.1em; color: #191c24; display: flex; align-items: center; justify-content: flex-start; gap: 0; }
        .sidebar .user-details img { width: 50px; height: 40px; margin-right: 15px; flex-shrink: 0; }
        .sidebar .user-text { display: flex; flex-direction: column; align-items: flex-start; flex: 1; }
        .sidebar .user-year { color: #777; font-size: 0.9em; font-weight: 400; margin-top: 2px; display: block; }
        .sidebar .menu-toggle { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #999; font-size: 1.2em; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background 0.2s; margin-top: 40px; }
        .sidebar .menu-toggle:hover { background: #f0f0f0; }
        .sidebar .nav { flex: 1; display: flex; flex-direction: column; padding: 0; justify-content: flex-start; gap: 0; min-height: 0; }
        .sidebar .nav-section { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
        .sidebar .nav-item { display: flex; align-items: center; font-size: 1.27rem; padding: 18px 25px; color: #000; text-decoration: none; cursor: pointer; transition: all 0.18s; gap: 15px; border-left: 4px solid transparent; margin: 3px 0; margin-top: 10px; }
        .sidebar .nav-item.selected { background: #F8F8F8; border-left: 4px solid #197AFF; color: #197AFF; font-weight: 600; }
        .sidebar .nav-item.selected img { filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%); }
        .sidebar .nav-item:hover:not(.selected) { background: #f0f6ff; border-left: 4px solid #197AFF; color: #197AFF; }
        .sidebar .nav-item img { width: 20px; height: 20px; transition: transform 0.2s; filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%); }
        .sidebar .nav-item:hover img { transform: scale(1.1); }
        .sidebar .nav-item:hover:not(.selected) img { filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%); }
        .sidebar .nav-divider { height: 1px; width: 228px; background: #e0e0e0; margin: 8px 2px; border-top: 1px dotted #ccc; flex-shrink: 0; margin-top: 12px; }
        .sidebar .logout-btn { background: #D23B42; color: #fff; margin: 25px; padding: 10px 0; border: none; border-radius: 60px; font-size: 1.3rem; font-weight: 500; letter-spacing: 0.2px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 50%; margin-left: 50px; margin-bottom: 10px; }
        .sidebar .logout-btn:hover { background: #d55a6a; }
        
        /* MAIN CONTENT STYLES */
        .action-card {
          width: 200px;
          flex-shrink: 0;
          background: #fff;
          border-radius: 16px;
          border: 2px solid #cccccc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          cursor: pointer;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .action-card:hover {
          border-color: #2085f6;
          box-shadow: 0 4px 12px rgba(32, 133, 246, 0.2);
        }
        .filter-input {
          font-size: 16px;
          padding: 8px 13px;
          border-radius: 10px;
          border: 2px solid #d1d4da;
          box-sizing: border-box;
          width: 100%;
          cursor: pointer;
          transition: border-color 0.2s ease;
          outline: none;
          background-color: #fff;
        }
        .filter-input:hover{
          border-color: #2276fc;
          top: 50%;

        }
        .filter-input:focus {
          border-color: #2276fc;

        }

        /* Floating Label Styles */
        .input-container {
          position: relative;
        }
        .floating-label {
          position: absolute;
          pointer-events: none;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          transition: all 0.2s ease-out;
          color: #8b8b8b;
          font-size: 16px;
        }
        .filter-input.has-value + .floating-label,
        .filter-input:focus + .floating-label {
          top: -20px;
          transform: translateY(0) scale(0.85);
          color: #2276fc;
          font-weight: 400 ;
          left : -5px;
        }
        
        .achievements-table { width: 100%; min-width: 1400px; border-collapse: separate; border-spacing: 0; }
        .achievements-table th, .achievements-table td { padding: 16px; text-align: left; white-space: nowrap; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
        .achievements-table th { font-size: 14px; font-weight: 600; color: #555; background: #fff; position: sticky; top: 0; z-index: 1; }
        .achievements-table td { font-size: 15px; color: #535353; font-weight: 500; }
        .achievements-table tbody tr:hover { background-color: #f5f8ff; }
        .status-pill { font-size: 14px; font-weight: 600; border-radius: 10px; padding: 4px 16px; display: inline-block; }
        .status-approved { background: #DEFDED; color: #13CC8B; }
        .status-rejected { background: #FFE6E6; color: #FF4444; }
        .status-pending { background: #F6F7F9; color: #8b8b8b; }
        .apply-sort-btn { width: 170px; height: 38px; background: #ffffff; color: #2276fc; border-radius: 10px;border: 2px solid #2276fc; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);font-weight: 600; font-size: 18px; cursor: pointer; transition: all 0.3s ease; }
        .apply-sort-btn:hover { background-color: #f5f8ff;box-shadow: inset 0 2px 8px #ffffff }
        .clear-filter-btn { width: 170px; height: 38px; background: #d2d2d2; color: #8b8b8b; border-radius: 10px; border: 2px solid #8b8b8b; font-weight: 600; font-size: 18px; cursor: pointer; transition: all 0.3s ease; }
        .clear-filter-btn:hover { background-color: #ffffff;color: #2276fc; border: 2px solid #2276fc;box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
      `}</style>

      <div className="container">
        <div className="navbar">
            <div className="left">
                <span className="portal-logo">
                    <img src={Adminicon} alt="Portal Logo" />
                </span>
                <span className="portal-name">Placement Portal</span>
            </div>
            <div className="menu">
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>About</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Features</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>Contact</span>
            </div>
        </div>
        
        <div className="main">
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
                        {sidebarItems.map((item) => (
                            <span key={item.text} className={`nav-item${item.view === currentView ? ' selected' : ''}`} onClick={() => onViewChange(item.view)}>
                                <img src={item.icon} alt={item.text} /> {item.text}
                            </span>
                        ))}
                    </div>
                    <div className="nav-divider"></div>
                    <span className={`nav-item${currentView === 'profile' ? ' selected' : ''}`} onClick={() => onViewChange('profile')}>
                        <img src={require('./assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
                    </span>
                </nav>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>

            <div style={{ flex: 1, marginLeft: '230px', height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', padding: '30px 32px', boxSizing: 'border-box' }}>
                
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'stretch', marginBottom: '1.5rem', flexShrink: 0 }}>
                    <div className="action-card" onClick={handleUploadClick}>
                        <img src={require('./assets/uploadcertificateicon.png')} alt="Upload" style={{ width: "80px", height: "80px", marginTop:"-10px" }}/>
                        <img src={require('./assets/certificateuploadicon.png')} alt="Upload" style={{ width: "22px", height: "22px", marginTop: "-37px", marginRight:"33px" }}/>
                        <div style={{ fontWeight: 600, fontSize: 18, marginTop: "40px" }}>Upload Certificate</div>
                        <div style={{ fontSize: 16, color: '#929292', textAlign: 'center', marginTop: 20 }}>Please upload your<br />certificate here</div>
                    </div>
                    
                    <div style={{ flexGrow: 1, backgroundColor: 'rgb(210,210,210)', borderRadius: 16, padding: '25px 28px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <button style={{ background: '#2276fc', color: "#fff", borderRadius: 12, border: 'none', fontWeight: 500, fontSize: 17, padding: '7px 31px', marginBottom: 12, boxShadow: '0 2px 12px #C6D6FB' }}>Sort & Filter</button>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%"}}>
                        
                        <div className="input-container">
                          <input 
                            type="text" 
                            id="competitionName"
                            value={searchQuery} 
                            onChange={handleSearchChange} 
                            className={`filter-input ${searchQuery ? 'has-value' : ''}`}
                          />
                          <label htmlFor="competitionName" className="floating-label">Enter Competition Name</label>
                        </div>

                        <select value={yearSemesterFilter} onChange={handleYearSemesterFilterChange} className="filter-input">
                            <option value="">Search by Year/Semester</option>
                            <option value="I/1">I/1</option><option value="I/2">I/2</option><option value="II/3">II/3</option><option value="II/4">II/4</option><option value="III/5">III/5</option><option value="III/6">III/6</option><option value="IV/7">IV/7</option><option value="IV/8">IV/8</option>
                        </select>
                        <select value={sortBy} onChange={handleSortChange} className="filter-input">
                            <option value="" disabled>Sort by</option><option value="date">Date</option><option value="prize">Prize</option>
                        </select>
                        <select value={statusFilter} onChange={handleStatusFilterChange} className="filter-input">
                            <option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%', marginTop: 'auto', paddingTop: '12px' }}>
                        <button className="apply-sort-btn" onClick={handleApplyFilters}>Apply Sort</button>
                        <button className="clear-filter-btn" onClick={handleClearFilters}>Clear</button>
                      </div>
                    </div>

                    <div className="action-card" onClick={handleEditClick}>
                        <img src={require('./assets/editlogo.png')} alt="Edit" style={{ width: "80px", height: "80px",marginTop:"-10px" }}/>
                        <img src={require('./assets/editpencil.png')} alt="Edit" style={{ width: "22px", height: "22px", marginTop: "-35px", marginRight: "30px" }} />
                        <div style={{ fontWeight: 600, fontSize: 18, marginTop: "25px" }}>Edit</div>
                        <div style={{ fontSize: 15.2, color: '#929292', textAlign: 'center', marginTop: 6 }}>Edit your certificate<br />information here</div>
                    </div>
                </div>
                
                <div style={{ background: "#fff", borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '24px 28px', flex: 1, height: '400px', display: 'flex', flexDirection: 'column',width :'1242px'}}>
                    <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 12, flexShrink: 0 }}>My Achievements</div>
                    
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <table className="achievements-table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>S.No</th>
                                    <th>Register No.</th>
                                    <th>Student Name</th>
                                    <th>Year</th>
                                    <th>Semester</th>
                                    <th>Section</th>
                                    <th>Competition Name</th>
                                    <th>Date</th>
                                    <th>Prize</th>
                                    <th>Status</th>
                                    <th>View</th>
                                    <th>Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredAndSortedAchievements().map((achievement, index) => (
                                    <TableRow key={achievement.id} {...achievement} no={index + 1} selected={selectedRows.includes(achievement.id)} onSelect={handleRowSelect} onViewFile={handleViewFile} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {showUploadPopup && <CertificateUpload onClose={handleClosePopup} onUpload={handleUploadSuccess} />}
      {showEditPopup && editingRow && <EditCertificate onClose={handleCloseEditPopup} onUpdate={handleUpdateAchievement} initialData={editingRow} />}
      {showRestrictionPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '30px 40px', width: 450, maxWidth: '98vw', border: '2px solid #ff4444', boxShadow: '0 4px 20px rgba(255, 68, 68, 0.2)' }}>
            <h2 style={{ color: "#ff4444", textAlign: "center", marginBottom: 28 }}> ⚠️ Edit Restriction </h2>
            <div style={{ fontSize: 16, lineHeight: 1.6, textAlign: 'center', whiteSpace: 'pre-line', marginBottom: 30 }}>{restrictionMessage}</div>
            <div style={{ display: "flex", justifyContent: "center" }}><button onClick={handleCloseRestrictionPopup} style={{ background: "#ff4444", color: "#fff", border: "none", borderRadius: 15, padding: "12px 30px", cursor: "pointer" }}>OK, I Understand</button></div>
          </div>
        </div>
      )}
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    </>
  );
}

function TableRow({ id, no, reg, name, year, semester, section, comp, date, prize, status, selected, onSelect, fileName, fileContent, onViewFile }) {
<<<<<<< HEAD
  const handleDownload = () => { if (fileContent) { const link = document.createElement('a'); link.href = fileContent; link.download = fileName || 'certificate.pdf'; document.body.appendChild(link); link.click(); document.body.removeChild(link); } else { alert('No file available'); } };
  const statusClass = `achievements-status-pill achievements-status-${status}`;
  return (
    <tr>
      <td data-label="Select"><input type="checkbox" checked={selected} onChange={() => onSelect(id)} className="row-checkbox" /></td>
      <td data-label="S.No">{no}</td>
      <td data-label="Register No.">{reg}</td>
      <td data-label="Student Name">{name}</td>
      <td data-label="Year">{year}</td>
      <td data-label="Semester">{semester}</td>
      <td data-label="Section">{section}</td>
      <td data-label="Competition">{comp}</td>
      <td data-label="Date">{new Date(date).toLocaleDateString('en-GB')}</td>
      <td data-label="Prize">{prize}</td>
      <td data-label="Status"><span className={statusClass}>{status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}</span></td>
      <td data-label="View"><button onClick={() => onViewFile(fileName, fileContent)} className="table-action-btn"> <EyeIcon /> </button></td>
      <td data-label="Download"><button onClick={handleDownload} className="table-action-btn"> <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2276fc" strokeWidth="2"/><polyline points="7,10 12,15 17,10" stroke="#2276fc" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" stroke="#2276fc" strokeWidth="2"/></svg> </button></td>
=======
  const handleDownload = () => {
    if (fileContent) {
      const link = document.createElement('a');
      link.href = fileContent;
      link.download = fileName || 'certificate.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No file available');
    }
  };

  const statusClass = `status-pill status-${status}`;

  return (
    <tr>
      <td style={{ textAlign: 'center' }}><input type="checkbox" checked={selected} onChange={() => onSelect(id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /></td>
      <td>{no}</td>
      <td>{reg}</td>
      <td>{name}</td>
      <td>{year}</td>
      <td>{semester}</td>
      <td>{section}</td>
      <td>{comp}</td>
      <td style={{ fontWeight: 600, color: '#222' }}>{new Date(date).toLocaleDateString('en-GB')}</td>
      <td>{prize}</td>
      <td style={{textAlign: 'center'}}><span className={statusClass}>{status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
      <td style={{ textAlign: 'center' }}> <button onClick={() => onViewFile(fileName, fileContent)} style={{ background: "transparent", border: "none", cursor: "pointer" }}> <EyeIcon /> </button> </td>
      <td style={{ textAlign: 'center' }}> <button onClick={handleDownload} style={{ background: "transparent", border: "none", cursor: "pointer" }}> <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2276fc" strokeWidth="2"/><polyline points="7,10 12,15 17,10" stroke="#2276fc" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" stroke="#2276fc" strokeWidth="2"/></svg> </button> </td>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    </tr>
  );
}