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
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const [selectedRows, setSelectedRows] = useState([1]);
  const [editingRow, setEditingRow] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearSemesterFilter, setYearSemesterFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: "", yearSemesterFilter: "", statusFilter: "all", sortBy: "",
  });
  const [filtersHaveBeenApplied, setFiltersHaveBeenApplied] = useState(false);
  const [achievements, setAchievements] = useState([
    { id: 1, reg: "731522104001", name: "Rajesh Kumar", year: "IV", semester: "7", section: "A", comp: "AI Hackathon Fest", date: "2025-09-23", prize: "1st", status: "approved", fileName: "ai_hackathon.pdf", fileContent: "...", uploadDate: "15/09/2025" },
    { id: 2, reg: "731522104002", name: "Priya Sharma", year: "IV", semester: "7", section: "B", comp: "Paper Presentation", date: "2025-10-26", prize: "2nd", status: "pending", fileName: "paper_presentation.pdf", fileContent: "...", uploadDate: "16/09/2025" },
    { id: 3, reg: "731522104003", name: "Arjun Singh", year: "IV", semester: "8", section: "A", comp: "Coding Competition", date: "2025-11-15", prize: "3rd", status: "rejected", fileName: "coding_comp.pdf", fileContent: "...", uploadDate: "17/09/2025" },
    { id: 4, reg: "731522104004", name: "Sneha Patel", year: "III", semester: "6", section: "C", comp: "Robotics Challenge", date: "2025-12-05", prize: "1st", status: "approved", fileName: "robotics_challenge.pdf", fileContent: "...", uploadDate: "18/09/2025" },
    { id: 5, reg: "731522104005", name: "Vikram Das", year: "III", semester: "5", section: "B", comp: "Math Olympiad", date: "2025-09-30", prize: "2nd", status: "pending", fileName: "math_olympiad.pdf", fileContent: "...", uploadDate: "19/09/2025" },
    { id: 6, reg: "731522104006", name: "Anita Reddy", year: "II", semester: "4", section: "A", comp: "Science Fair", date: "2025-10-12", prize: "3rd", status: "approved", fileName: "science_fair.pdf", fileContent: "...", uploadDate: "20/09/2025" },
    { id: 7, reg: "731522104007", name: "Karan Mehta", year: "II", semester: "3", section: "C", comp: "Debate Competition", date: "2025-11-20", prize: "1st", status: "rejected", fileName: "debate_comp.pdf", fileContent: "...", uploadDate: "21/09/2025" },
    { id: 8, reg: "731522104008", name: "Meera Joshi", year: "I", semester: "2", section: "B", comp: "Art Contest", date: "2025-12-18", prize: "2nd", status: "approved", fileName: "art_contest.pdf", fileContent: "...", uploadDate: "22/09/2025" },
    { id: 9, reg: "731522104009", name: "Rohan Verma", year: "I", semester: "1", section: "A", comp: "Music Competition", date: "2025-09-28", prize: "3rd", status: "pending", fileName: "music_comp.pdf", fileContent: "...", uploadDate: "23/09/2025" },
  ]);

  const handleUploadClick = () => setShowUploadPopup(true);
  const handleClosePopup = () => setShowUploadPopup(false);
  const handleUploadSuccess = (newAchievement) => { const newRecord = { ...newAchievement, id: achievements.length + 1, status: "pending" }; setAchievements(prev => [...prev, newRecord]); setSelectedRows([newRecord.id]); };
  const handleEditClick = () => { if (selectedRows.length === 1) { const selected = achievements.find(a => a.id === selectedRows[0]); if (selected.status === "approved" || selected.status === "rejected") { setRestrictionMessage(`❌ Cannot edit ${selected.status} achievements!\n\nThis record is locked and cannot be modified.\n\n📝 Only pending records can be edited.`); setShowRestrictionPopup(true); return; } setEditingRow(selected); setShowEditPopup(true); } else { alert("Please select exactly one row to edit"); } };
  const handleCloseEditPopup = () => { setShowEditPopup(false); setEditingRow(null); };
  const handleUpdateAchievement = (updated) => { setAchievements(prev => prev.map(a => a.id === updated.id ? updated : a)); };
  const handleCloseRestrictionPopup = () => setShowRestrictionPopup(false);
  const handleRowSelect = (id) => { setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]); };
  const handleSortChange = (e) => setSortBy(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleYearSemesterFilterChange = (e) => setYearSemesterFilter(e.target.value);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
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
    </>
  );
}

function TableRow({ id, no, reg, name, year, semester, section, comp, date, prize, status, selected, onSelect, fileName, fileContent, onViewFile }) {
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
    </tr>
  );
}