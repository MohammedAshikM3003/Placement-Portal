import React, { useState } from "react";
import * as XLSX from 'xlsx';
import  jsPDF  from 'jspdf';
import autoTable from'jspdf-autotable';
// import { GiFireRay } from 'react-icons/gi'; // Unused
import { FaEye } from "react-icons/fa"; // Importing the eye icon
import searchcompany from '../assets/seachcompany.png';
import searchbydept from '../assets/SearchbyDepartment.png';
import searchdomain from '../assets/SearchDomain.png';
import searchmode from '../assets/searchMode.png';
import { useNavigate } from 'react-router-dom'; // Removed unused BrowserRouter, Routes, Route, Link
// import styled from 'styled-components'; // Unused
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import Companyprofile from "../assets/Companyprofile.svg";
import './CompanyDrive.css';

// === Example company data! Add/remove as needed ===
const sampleCompanyData = [
  {
    id: 1,
    company: "TechNova Solutions",
    domain: "IT Sector",
    jobRole: "Junior Developer",
    branch: "CSE, IT, ECE",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "20-10-2025",
    package: "6 LPA",
    location: "Chennai"
  },
  {
    id: 2,
    company: "DataFlow Systems",
    domain: "Data Analytics",
    jobRole: "Data Analyst",
    branch: "CSE, IT",
    mode: "Online",
    status: "Confirmed",
    visitDate: "25-10-2025",
    package: "7 LPA",
    location: "Bangalore"
  },
  {
    id: 3,
    company: "CloudTech Innovations",
    domain: "Cloud Computing",
    jobRole: "Cloud Engineer",
    branch: "CSE, IT, ECE",
    mode: "Hybrid",
    status: "Pending",
    visitDate: "30-10-2025",
    package: "8 LPA",
    location: "Hyderabad"
  },
  {
    id: 4,
    company: "WebCraft Studios",
    domain: "Web Development",
    jobRole: "Frontend Developer",
    branch: "CSE, IT",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "15-11-2025",
    package: "5.5 LPA",
    location: "Chennai"
  },
  {
    id: 5,
    company: "MobileFirst Tech",
    domain: "Mobile Development",
    jobRole: "Mobile App Developer",
    branch: "CSE, IT, ECE",
    mode: "Online",
    status: "Confirmed",
    visitDate: "18-11-2025",
    package: "6.5 LPA",
    location: "Mumbai"
  },
  {
    id: 6,
    company: "CyberGuard Inc.",
    domain: "Cybersecurity",
    jobRole: "Security Analyst",
    branch: "CSE, IT",
    mode: "Online",
    status: "Confirmed",
    visitDate: "22-11-2025",
    package: "9 LPA",
    location: "Pune"
  },
  {
    id: 7,
    company: "Innovate AI",
    domain: "Artificial Intelligence",
    jobRole: "Machine Learning Engineer",
    branch: "CSE, ECE",
    mode: "Hybrid",
    status: "Pending",
    visitDate: "28-11-2025",
    package: "10 LPA",
    location: "Bangalore"
  },
  {
    id: 8,
    company: "QuantumLeap",
    domain: "FinTech",
    jobRole: "Backend Developer",
    branch: "CSE, IT, ECE",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "05-12-2025",
    package: "8.5 LPA",
    location: "Mumbai"
  },
  {
    id: 9,
    company: "NetSphere",
    domain: "Networking",
    jobRole: "Network Engineer",
    branch: "ECE, IT",
    mode: "Online",
    status: "Confirmed",
    visitDate: "10-12-2025",
    package: "7.5 LPA",
    location: "Delhi"
  },
  {
    id: 10,
    company: "GameCraft Studios",
    domain: "Gaming",
    jobRole: "Game Developer",
    branch: "CSE, IT",
    mode: "Hybrid",
    status: "Pending",
    visitDate: "15-12-2025",
    package: "8 LPA",
    location: "Hyderabad"
  }
];

export default function App({ onLogout, currentView, onViewChange }) {
  // State for search filters
  const [filters, setFilters] = useState({
    company: '',
    domain: '',
    department: '',
    mode: ''
  });
  // const [activeItem, setActiveItem] = useState("Company Drive"); // Unused
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // This function will set the active item when a menu item is clicked
  // const handleItemClick = (itemName) => { // Unused
  //   setActiveItem(itemName);
  // };

  // State for filtered data
  const [filteredData, setFilteredData] = useState(sampleCompanyData);
  // const [showFiltered, setShowFiltered] = useState(true); // Unused

  // Handle input changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle View Drive button click
  const handleViewDrive = () => {
    let filtered = [...sampleCompanyData];

    if (filters.company && filters.company.trim()) {
        filtered = filtered.filter(item =>
          item.company.toLowerCase().includes(filters.company.toLowerCase().trim())
        );
      }

    if (filters.domain && filters.domain.trim()) {
      filtered = filtered.filter(item =>
        item.domain.toLowerCase().includes(filters.domain.toLowerCase().trim())
      );
    }

    if (filters.department && filters.department.trim()) {
      filtered = filtered.filter(item =>
        item.branch.toLowerCase().includes(filters.department.toLowerCase().trim())
      );
    }

    if (filters.mode && filters.mode.trim()) {
      filtered = filtered.filter(item =>
        item.mode.toLowerCase().includes(filters.mode.toLowerCase().trim())
      );
    }

    // Sort by company name alphabetically
    filtered.sort((a, b) => a.company.localeCompare(b.company));

    setFilteredData(filtered);
    // setShowFiltered(true); // Unused
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      company: '',
      domain: '',
      department: '',
      mode: ''
    });
    setFilteredData(sampleCompanyData);
    // setShowFiltered(true); // Unused
  };
  const toggleExportMenu = () => {
    setShowExportMenu(prev => !prev);
  };

  const exportToExcel = () => {
    const header = ["S.No", "Company", "Domain", "Job Role", "Branch", "Mode", "Status", "Visit Date", "Package", "Location"];
    const data = filteredData.map((item, index) => [
        index + 1,
        item.company,
        item.domain,
        item.jobRole,
        item.branch,
        item.mode,
        item.status,
        item.visitDate,
        item.package,
        item.location
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Company Drives");
    XLSX.writeFile(wb, "CompanyDrives.xlsx");
    setShowExportMenu(false);
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF();
  
    // Define the table headers
    const tableColumn = ["S.No", "Company", "Domain", "Job Role", "Branch", "Mode", "Status", "Visit Date", "Package", "Location"];
  
    // Prepare the data rows from your filtered data
    const tableRows = filteredData.map((item, index) => [
        index + 1,
        item.company,
        item.domain,
        item.jobRole,
        item.branch,
        item.mode,
        item.status,
        item.visitDate,
        item.package,
        item.location
    ]);
  
    // Add a title to the PDF
    doc.setFontSize(16);
    doc.text("Company Drives Report", 14, 15);
  
    // Generate the table using autoTable
    autoTable(doc,{
        head: [tableColumn],
        body: tableRows,
        startY: 20, // Start the table 20mm from the top
        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            valign: 'middle',
            halign: 'center',
            minCellHeight: 8
        },
        headStyles: {
            fillColor: [215, 61, 61], // Red color for header
            textColor: 255, // White text
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left', cellWidth: 25 },
            2: { halign: 'left', cellWidth: 25 },
            3: { halign: 'left', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 20 },
            5: { halign: 'center', cellWidth: 15 },
            6: { halign: 'center', cellWidth: 15 },
            7: { halign: 'center', cellWidth: 20 },
            8: { halign: 'center', cellWidth: 15 },
            9: { halign: 'left', cellWidth: 'auto' }
        },
        margin: { top: 20 },
    });
  
    // Save the PDF
    doc.save("CompanyDrives.pdf");
    setShowExportMenu(false);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div>
      
      {/* --- NAVBAR --- */}
      <Navbar onToggleSidebar={toggleSidebar}  />
        
      {/* --- BODY LAYOUT --- */}
      <div className="co-cd-layout">
        {/* --- SIDEBAR --- */}
        <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="company-drive" onViewChange={onViewChange} />
          
        
        {/* --- MAIN CONTENT --- */}
        <div className="co-cd-main-content">
          {/* Top Cards Row */}
          <div className="co-cd-top-cards-row">

            {/* 1: Report Analysis Card */}
            <div className="co-cd-card co-cd-report-analysis-card"  onClick={() => navigate(`/report-analysismain`)} >
              <img src={require("../assets/CoordReportanalysis.png")} alt="Report Analysis" className="co-cd-report-analysis-card__image" />
              <span className="co-cd-report-analysis-card__title">Report Analysis</span>
              <span className="co-cd-report-analysis-card__description">Tracks eligibility,<br/>applications, and selections</span>
            </div>

            {/* 2: Company Drive Search Card */}
            <div className="co-cd-search-filter-card">
              <div className="co-cd-search-filter-card__tabs-container">
                <button className="co-cd-search-filter-card__tab-button">Company Drive</button>
              </div>
              <div className="co-cd-search-filter-card__fields-container">
                <div className="co-cd-search-filter-card__fields-row">

                  {/* Company Search Input */}
                  <div className="co-cd-search-filter-card__input-wrapper">
                    <img src={searchcompany} alt="Company Icon" className="co-cd-input-icon" />
                    <input
                      id="co-cd-search-company"
                      className="co-cd-search-filter-card__input"
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      required
                    />
                    <label htmlFor="co-cd-search-company" className="co-cd-search-filter-card__label">
                      Search Company
                    </label>
                  </div>

                  {/* Domain Search Input */}
                  <div className="co-cd-search-filter-card__input-wrapper">
                    <img src={searchdomain} alt="Domain Icon" className="co-cd-input-icon" />
                    <input
                      id="co-cd-search-domain"
                      className="co-cd-search-filter-card__input"
                      value={filters.domain}
                      onChange={(e) => handleFilterChange('domain', e.target.value)}
                      required
                    />
                    <label htmlFor="co-cd-search-domain" className="co-cd-search-filter-card__label">
                      Search Domain
                    </label>
                  </div>
                </div>
                <div className="co-cd-search-filter-card__fields-row">

                  {/* Department Search Input */}
                  <div className="co-cd-search-filter-card__input-wrapper">
                    <img src={searchbydept} alt="Branch Icon" className="co-cd-input-icon" />
                    <input
                      id="co-cd-search-department"
                      className="co-cd-search-filter-card__input"
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      required
                    />
                    <label htmlFor="co-cd-search-department" className="co-cd-search-filter-card__label">
                      Search by Branch
                    </label>
                  </div>

                  {/* Mode Search Dropdown - FIX APPLIED HERE */}
                  <div className="co-cd-search-filter-card__input-wrapper">
                    <img src={searchmode} alt="Mode Icon" className="co-cd-input-icon" />
                    <select
                      id="co-cd-search-mode"
                      // **CHANGED CLASS to standard __input**
                      className="co-cd-search-filter-card__input" 
                      style={{ width: '280px' }}
                      value={filters.mode}
                      onChange={(e) => handleFilterChange('mode', e.target.value)}
                      required
                    >
                      {/* First option with value="" is the placeholder */}
                      <option  value=""></option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                    {/* **ADDED LABEL ADJACENT TO SELECT** */}
                    <label htmlFor="co-cd-search-mode" className="co-cd-search-filter-card__label">
                     Search by Mode
                    </label>
                  </div>
                </div>
              </div>
         <div className="co-cd-search-filter-card__button-group">
          <button className="co-cd-search-filter-card__view-button" onClick={handleViewDrive}> View Drive </button>
          <button className="co-cd-search-filter-card__clear-button" onClick={resetFilters}>Clear </button> 
          </div>
     </div>

            {/* 3: Company Profile Card */}
            <div className="co-cd-card co-cd-company-profile-card"  onClick={() => navigate(`/company-profile`)} >
              <img src={Companyprofile} alt="Company Profile" className="co-cd-company-profile-card__image" />
              <span className="co-cd-card-title company-profile-card__title">Company Profile</span>
              <span className="co-cd-card-desc company-profile-card__description">View & explore<br/>Company Profile</span>
            </div>

          </div>
          
          {/* --- Company Drive Table Container --- */}
          <div className="co-cd-drive-table-container">
          <div className="co-cd-print-menu-wrapper">
    <button className="co-cd-drive-table-container__print-button" onClick={toggleExportMenu}>
        Print
    </button>
    {showExportMenu && (
        <div className="co-cd-export-menu">
            <div onClick={exportToExcel}>Export to Excel</div>
            <div onClick={exportToPDF}>Export to PDF</div>
        </div>
    )}
</div>
              <div className="co-cd-drive-table-container__title-bar">
                  COMPANY DRIVE
              </div>

              <div className="co-cd-drive-table-container__table-wrapper" id="co-cd-drive-table-container__table-wrapper">
                  {/* The table content remains the same */}
                  <table>
                  <thead>
    <tr>
    <th>S.No</th>
    <th>Company</th>
    <th>Domain</th>
    <th>Job Role</th>
    <th>Branch</th>
    <th>Mode</th>
    <th>Status</th>
    <th>Visit Date</th>
    <th>Package</th>
    <th>Location</th>
    <th>View</th>
    </tr>
</thead>
<tbody>
    {filteredData.map((item, index) => (
    <tr key={item.id}>
        <td>{index + 1}</td>
        <td>{item.company}</td>
        <td>{item.domain}</td>
        <td>{item.jobRole}</td>
        <td>{item.branch}</td>
        <td>{item.mode}</td>
        <td>{item.status}</td>
        <td>{item.visitDate}</td>
        <td>{item.package}</td>
        <td>{item.location}</td>
        <td>
          <button className="co-cd-eye-icon-button" onClick={() => alert(`Viewing details for ${item.company}`)}>
            <FaEye />
          </button>
        </td>
    </tr>
    ))}
</tbody>
                  </table>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
}