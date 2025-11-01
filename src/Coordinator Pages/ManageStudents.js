import React, { useState } from 'react';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import './ManageStudents.css';
import Adminicon from "../assets/Adminicon.png";

// FIX 1: Import the Block Icon image using standard React method
import BlockIconImage from "../assets/coordmstblockicon.svg"; 

// IMPORTS for Export Functionality
import * as XLSX from 'xlsx';
// ✅ FIX APPLIED HERE: Using default import for jspdf
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// Simple icon components using inline SVG
const GradCapIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3e8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
);

// --- START: UPDATED ICON COMPONENTS ---
const CheckIcon = () => (
    <span className="co-ms-resume-uploaded">
        <svg width="20" height="20" viewBox="0 0 24 24" 
            fill="currentColor" // Use currentColor (Green) from CSS class
            stroke="none"> 
            {/* Solid Checkmark Path (filled) */}
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
    </span>
);

const CrossIcon = () => (
    <span className="co-ms-resume-not-uploaded">
        <svg width="20" height="20" viewBox="0 0 24 24" 
            fill="currentColor" // Use currentColor (Red) from CSS class
            stroke="none">
            {/* Solid Close/Cross Path (filled) */}
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"/>
        </svg>
    </span>
);
// --- END: UPDATED ICON COMPONENTS ---


const EyeIcon = () => (
    <svg className="co-ms-profile-eye-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);


function Comanagestud({ onLogout, currentView, onViewChange }) {
    // MODIFICATION 1: Define default department and initialize filter state
    const DEFAULT_DEPT = 'CSE';
    
    // ACTIVE FILTER STATES (only change on button click)

    const [filterDept, setFilterDept] = useState(DEFAULT_DEPT);
    const [filterBatch, setFilterBatch] = useState('');
    
    // DROPDOWN SELECTION STATES (change instantly as user selects)
    // MODIFICATION 2: Removed selectedDept state
    const [selectedBatch, setSelectedBatch] = useState('');

    // NEW: Add filters and selections for Name and RegNo
    const [filterName, setFilterName] = useState('');
    const [filterRegNo, setFilterRegNo] = useState('');
    const [selectedName, setSelectedName] = useState('');
    const [selectedRegNo, setSelectedRegNo] = useState('');

    
    // 2. Add state to track export menu visibility
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [students, setStudents] = useState([
        // --- 10 Unique Student Entries (all set to CSE department) ---
        { 
            id: 1, 
            regNo: '731521104001', 
            name: 'Aravind S', 
            section: 'A',
            department: 'CSE', 
            batch: '2023-2027', 
            phone: '9876543210', 
            email: 'aravinds@ksrce.ac.in', 
            resume: true, 
            placement: 'Placed', 
            blocked: false 
        },
        { 
            id: 2, 
            regNo: '731521104002', 
            name: 'Priya M', 
            section: 'B',
            department: 'CSE', 
            batch: '2024-2028', 
            phone: '9876543211', 
            email: 'priyam@ksrce.ac.in', 
            resume: false, 
            placement: 'Unplaced', 
            blocked: true 
        },
        { 
            id: 3, 
            regNo: '731521104003', 
            name: 'Karthik N', 
            section: 'A', 
            department: 'CSE', 
            batch: '2023-2027', 
            phone: '9876543212', 
            email: 'karthikn@ksrce.ac.in', 
            resume: true, 
            placement: 'Unplaced', 
            blocked: false 
        },
        { 
            id: 4, 
            regNo: '731521104004', 
            name: 'Sneha R', 
            section: 'B',
            department: 'CSE', 
            batch: '2023-2027', 
            phone: '9876543213', 
            email: 'snehar@ksrce.ac.in', 
            resume: true, 
            placement: 'Placed', 
            blocked: false 
        },
        { 
            id: 5, 
            regNo: '731521104005', 
            name: 'Vignesh P', 
            section: 'A',
            department: 'CSE', 
            batch: '2024-2028', 
            phone: '9876543214', 
            email: 'vigneshp@ksrce.ac.in', 
            resume: false, 
            placement: 'Unplaced', 
            blocked: false 
        },
        { 
            id: 6, 
            regNo: '731521104006', 
            name: 'Divya G', 
            section: 'B',
            department: 'CSE', 
            batch: '2023-2027', 
            phone: '9876543215', 
            email: 'divyag@ksrce.ac.in', 
            resume: true, 
            placement: 'Placed', 
            blocked: false 
        },
        { 
            id: 7, 
            regNo: '731521104007', 
            name: 'Rahul K', 
            section: 'A',
            department: 'CSE', 
            batch: '2024-2028', 
            phone: '9876543216', 
            email: 'rahulk@ksrce.ac.in', 
            resume: false, 
            placement: 'Unplaced', 
            blocked: false 
        },
        { 
            id: 8, 
            regNo: '731521104008', 
            name: 'Shalini S', 
            section: 'B',
            department: 'CSE', 
            batch: '2023-2027', 
            phone: '9876543217', 
            email: 'shalinis@ksrce.ac.in', 
            resume: true, 
            placement: 'Placed', 
            blocked: true 
        },
        { 
            id: 9, 
            regNo: '731521104009', 
            name: 'Gowtham V', 
            section: 'A',
            department: 'CSE', 
            batch: '2024-2028', 
            phone: '9876543218', 
            email: 'gowthamv@ksrce.ac.in', 
            resume: false, 
            placement: 'Unplaced', 
            blocked: false 
        },
        { 
            id: 10, 
            regNo: '731521104010', 
            name: 'Janani B', 
            section: 'B',
            department: 'CSE', 
            batch: '2023-2027', 
            phone: '9876543219', 
            email: 'jananib@ksrce.ac.in', 
            resume: true, 
            placement: 'Placed', 
            blocked: false 
        },
        // --- End of 10 Student Entries ---
    ]);
    const [viewBlocklist, setViewBlocklist] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
    
    // Function to apply filters from dropdowns and switch to main view
    const applyFilters = () => {
        // filterDept is already defaulted to 'CSE' and does not need to be updated from a selection state
        setFilterBatch(selectedBatch);
        
        // NEW: SET ACTIVE FILTERS FOR NAME AND REG NO
        setFilterName(selectedName.trim().toLowerCase()); // Trim and lower-case Name
        setFilterRegNo(selectedRegNo.trim());              // Trim Reg No
        

        setViewBlocklist(false);
    };

    const handleStudentSelect = (id) => {
        setSelectedStudentIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    };
    
    const isStudentSelected = selectedStudentIds.size > 0;

    const handleBlock = () => {
        const newStudents = students.map(student =>
            selectedStudentIds.has(student.id)
                ? { ...student, blocked: true }
                : student
        );
        setStudents(newStudents);
    };

    
    const handleUnblock = () => {
        const newStudents = students.map(student =>
            selectedStudentIds.has(student.id)
                ? { ...student, blocked: false }
                : student
        );
        setStudents(newStudents);
    };

    

    const handleDelete = () => {
        const newStudents = students.filter(student => !selectedStudentIds.has(student.id));
        setStudents(newStudents);
        setSelectedStudentIds(new Set());
    };

    // Derived State (This is the active filtering logic)
    const filteredStudents = students.filter(student =>
        // Filter must always check against the fixed filterDept (CSE)
        (student.department === filterDept) &&
        (filterBatch === '' || student.batch === filterBatch) &&
        (filterName === '' || student.name.toLowerCase().includes(filterName)) &&
        (filterRegNo === '' || student.regNo.includes(filterRegNo))
      );
      
    
    const blockedStudents = filteredStudents.filter(s => s.blocked);
    const visibleStudents = viewBlocklist ? blockedStudents : filteredStudents;
    
    // 4. Implement exportToExcel
    const exportToExcel = () => {
        const data = visibleStudents.map(student => [
            student.regNo, 
            student.name, 
            student.department, 
            student.batch, 
            student.section,
            student.phone, 
            student.email, 
            student.placement, 
            student.blocked ? "Blocked" : "Active"
        ]);
        const header = ["Reg No", "Name", "Department", "Batch", "Section", "Phone", "Email", "Placement Status", "Block Status"];
        const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "Students_Report.xlsx");
        setShowExportMenu(false);
    };

    // 5. Implement exportToPDF - NO LOGIC CHANGE, ONLY IMPORT FIX APPLIED
    const exportToPDF = () => {
        const doc = new jsPDF("landscape");
        const columns = [
          "Reg No", "Name", "Department", "Batch", "Section",
          "Phone", "Email", "Placement Status", "Block Status"
        ];
      
        const rows = visibleStudents.map(student => [
          student.regNo,
          student.name,
          student.department,
          student.batch,
          student.section,
          student.phone,
          student.email,
          student.placement,
          student.blocked ? "Blocked" : "Active",
        ]);
      
        doc.text("Students Report", 14, 15);
      
        // ✅ use the imported function directly
        autoTable(doc, {
          head: [columns],
          body: rows,
          startY: 20,
          styles: { fontSize: 8 },
        });
      
        doc.save("Students_Report.pdf");
        setShowExportMenu(false);
      };
      

      const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

    return (
        <>
            <Navbar   onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className="co-ms-layout">
                <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="manage-students" onViewChange={onViewChange} />
                <div className="co-ms-main-content">
                    
                    {/* TOP CARD: Filter and Actions */}
                    <div className="co-ms-top-card">
                        
                        {/* Filter Section */}
                        <div className="co-ms-filter-section">
                            <div className="co-ms-filter-header-container">
                                <div className="co-ms-filter-header">Filter & Sort</div>
                                
                            </div>
                            <div className="co-ms-filter-content">
                            <div className="co-ms-floating-input-container">
                                <input
                                    className="co-ms-floating-input"
                                    placeholder=" "
                                    value={selectedName}
                                    onChange={(e) => setSelectedName(e.target.value)}
                                />
                                <label className="co-ms-floating-label">Name</label>
                            </div>

                            <div className="co-ms-floating-input-container">
                                <input
                                    className="co-ms-floating-input"
                                    placeholder=" "
                                    value={selectedRegNo}
                                    onChange={(e) => setSelectedRegNo(e.target.value)}
                                />
                                <label className="co-ms-floating-label">Reg No</label>
                            </div>

                            {/* MODIFICATION: Swapped position with Batch Dropdown */}
                            <div className="co-ms-floating-select-container">
                                <select
                                    className="co-ms-floating-select"
                                    value={selectedBatch}
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                >
                                    <option value=""></option>
                                    <option value="2023-2027">2023-2027</option>
                                    <option value="2024-2028">2024-2028</option>
                                </select>
                                <label className="co-ms-floating-label">Batch</label>
                            </div>
                            
                            {/* MODIFICATION: Swapped position with Batch Dropdown - This is the fixed Department Label */}
                            <div className="co-ms-dropdown-container-dept">
                                <p style={{
                                    padding: '10px 15px',
                                    fontWeight: '500',
                                    color: '#999',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    height: '45px',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    margin: 0
                                }}>
                                    Department: {DEFAULT_DEPT}
                                </p>
                            </div>


                                <div className="co-ms-button-group">
                                    <button 
                                        className="co-ms-button co-ms-view-students-btn" 
                                        // NEW: Call applyFilters to set the state and filter the table
                                        onClick={applyFilters}
                                    >
                                        View Students
                                    </button>
                                    <button className="co-ms-button co-ms-blocklist-btn" 
                                        onClick={() => {
                                            // The department filter is already set to DEFAULT_DEPT (CSE)
                                            setFilterBatch(selectedBatch);
                                            setViewBlocklist(true);
                                        }}
                                    > Blocklist</button>
                                </div>
                            </div>
                        </div>

                        {/* Action Cards Section - No change */}
                        <div className="co-ms-action-cards-section">
                            <div className="co-ms-action-card">
                                <h4 className="co-ms-action-header">Semester</h4>
                                <p className="co-ms-action-description">
                                    Update <br/>Semester <br/>Wise<br/> Student <br/> CGPA
                                </p>
                                <button 
                                    className="co-ms-action-btn co-ms-semester-btn" 
                                    onClick={() => {
                                        if (onViewChange) {
                                            onViewChange('manage-students-semester');
                                        }
                                    }}
                                >
                                    Semester
                                </button>
                            </div>

                            <div className="co-ms-action-card">
                                <h4 className="co-ms-action-header" >Editing</h4>
                                <p className="co-ms-action-description">
                                    Select <br/>Student <br/>Record<br/> Before <br/> Editing
                                </p>
                                <button 
                                    className="co-ms-action-btn co-ms-edit-btn" 
                                    onClick={() => {
                                        if (onViewChange && selectedStudentIds.size === 1) {
                                            onViewChange('manage-students-profile');
                                        }
                                    }} 
                                    disabled={selectedStudentIds.size !== 1}>Edit</button>
                            </div>
                            
                            <div className="co-ms-action-card">
                                <h4 className="co-ms-action-header">Blocking</h4>
                                <p className="co-ms-action-description">
                                    Select <br/>Student<br/> Record <br/>Before<br/> Blocking
                                </p>
                                <button 
                                    className="co-ms-action-btn co-ms-block-btn" 
                                    onClick={handleBlock} disabled={selectedStudentIds.size < 1}>
                                    Block
                                </button>
                            </div>
                            
                            <div className="co-ms-action-card">
                                <h4 className="co-ms-action-header">Unblocking</h4>
                                <p className="co-ms-action-description">
                                    Select <br/>Student<br/>Record<br/> Before<br/> Unblocking
                                </p>
                                <button 
                                    className="co-ms-action-btn co-ms-unblock-btn" 
                                    onClick={handleUnblock} disabled={selectedStudentIds.size < 1}
                                >
                                    Unblock
                                </button>
                            </div>
                            
                            <div className="co-ms-action-card">
                                <h4 className="co-ms-action-header">Deleting</h4>
                                <p className="co-ms-action-description">
                                    Select <br/> Student <br/> Record <br/> Before <br/>Deleting
                                </p>
                                <button 
                                    className="co-ms-action-btn co-ms-delete-btn" 
                                    onClick={handleDelete} disabled={selectedStudentIds.size < 1}                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM CARD: Student Table */}
                    <div className="co-ms-bottom-card">
                        <div className="co-ms-table-header-row">
                            {/* Update table title to use filterDept */}
                            <h3 className="co-ms-table-title">{filterDept.toUpperCase()} DEPARTMENT STUDENTS</h3>
                            <div className="co-ms-table-actions">
                                {/* 3. Add the Print button with click handler to toggle the export menu */}
                                <div className="co-ms-print-button-container">
                                    <button 
                                        className="co-ms-print-btn co-ms-print-btn" 
                                        onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                                    >
                                        Print
                                    </button>
                                    
                                    {showExportMenu && (
                                        <div className="co-ms-export-menu">
                                            <button onClick={exportToExcel}>Export to Excel</button>
                                            <button onClick={exportToPDF}>Download as PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="co-ms-table-container">
                            <table className="co-ms-students-table">
                                <thead>
                                    <tr className="co-ms-table-head-row">
                                        <th className="co-ms-th co-ms-select">Select</th> 
                                        <th className="co-ms-th co-ms-sno">S.No</th>
                                        <th className="co-ms-th co-ms-photo">Photo</th>
                                        <th className="co-ms-th co-ms-register-number">Register Number</th>
                                        <th className="co-ms-th co-ms-name">Name</th>
                                        <th className="co-ms-th co-ms-section">Section</th>
                                        <th className="co-ms-th co-ms-batch">Batch</th> 
                                        <th className="co-ms-th co-ms-department">Department</th> 
                                        <th className="co-ms-th co-ms-phone">Phone</th>
                                        <th className="co-ms-th co-ms-email">Email</th>
                                        <th className="co-ms-th co-ms-resume">Resume</th>
                                        <th className="co-ms-th co-ms-profile">Profile (view)</th>
                                        <th className="co-ms-th co-ms-placement-status">Placement Status</th>
                                        <th className="co-ms-th co-ms-block">Block</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="15" style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.2rem", fontFamily: "Arial, sans-serif" }}>
                                                {viewBlocklist ? "No blocked students available" : "No data available"}
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleStudents.map((student, index) => (
                                            <tr 
                                                key={student.id} 
                                                className={`co-ms-table-row ${selectedStudentIds.has(student.id) ? 'co-ms-selected-row' : ''}`}
                                                onClick={() => handleStudentSelect(student.id)} 
                                            >
                                                <td className="co-ms-td co-ms-select" onClick={(e) => e.stopPropagation()}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedStudentIds.has(student.id)} 
                                                        onChange={() => handleStudentSelect(student.id)}
                                                    />
                                                </td>
                                                <td className="co-ms-td co-ms-sno">{index + 1}</td>
                                                <td className="co-ms-td co-ms-photo">
                                                    <GradCapIcon />
                                                </td>
                                                <td className="co-ms-td co-ms-register-number">{student.regNo}</td>
                                                <td className="co-ms-td co-ms-name">{student.name}</td>
                                                <td className="co-ms-td co-ms-section">{student.section}</td>
                                                <td className="co-ms-td co-ms-batch">{student.batch}</td> 
                                                <td className="co-ms-td co-ms-department">{student.department}</td> 
                                                <td className="co-ms-td co-ms-phone">{student.phone}</td>
                                                <td className="co-ms-td co-ms-email">{student.email}</td>
                                                <td className="co-ms-td co-ms-resume">
                                                    {student.resume ? <CheckIcon /> : <CrossIcon />}
                                                </td>
                                                <td onClick={() => {
                                    if (onViewChange) {
                                        onViewChange('coo-view-ms');
                                    }
                                }} className="co-ms-td co-ms-profile">
                                               
                                                    <   EyeIcon />
                                                </td>
                                                <td className="co-ms-td co-ms-placement-status">
                                                    <span className={`co-ms-status-tag co-ms-status-${student.placement.toLowerCase()}`}>
                                                        {student.placement}
                                                    </span>
                                                </td>
                                                <td className="co-ms-td co-ms-block-data">
                                                    {/* Replace the BlockIcon with your custom image */}
                                                    <img
                                                        src={BlockIconImage} // FIX 4: Use the imported variable
                                                        alt="Block"
                                                        className="custom-block-img"
                                                        style={{
                                                            filter: student.blocked ? "grayscale(1) brightness(0.7)" : "none"
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        )))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
        </>
    );
}

export default Comanagestud;