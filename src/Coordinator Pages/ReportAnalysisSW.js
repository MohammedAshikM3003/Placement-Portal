import React, { useState } from 'react'; // Removed unused useEffect
// import { useNavigate } from "react-router-dom"; // Unused
import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// NEW IMPORTS for Date Picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

// Import New Components
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

// Import CSS Files
import './ReportAnalysisSW.css'; 

// Import necessary assets for the Navbar (Adminicon)
import Adminicon from "../assets/Adminicon.png";

// Master data array (Student Wise Data) - 18 records
const initialData = [
  { "So No": 1, "Student Name": "Arun Kumar S.", "Register No.": "731523130001", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "CGPA": "8.5", "Skills": "Java, React", "Placement Status": "Placed", "Company": "Infosys", "Package": "12.0 LPA", "Date of Joining": "01/08/25" },
  { "So No": 2, "Student Name": "Priya V.", "Register No.": "731523130002", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "CGPA": "7.8", "Skills": "Python, Django", "Placement Status": "Unplaced", "Company": "-", "Package": "-", "Date of Joining": "-" },
  { "So No": 3, "Student Name": "Gowtham M.", "Register No.": "731523130003", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "CGPA": "8.2", "Skills": "JavaScript, Node.js", "Placement Status": "Placed", "Company": "TCS", "Package": "10.0 LPA", "Date of Joining": "11/08/25" },
  { "So No": 4, "Student Name": "Nithya R.", "Register No.": "731523130004", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "CGPA": "9.1", "Skills": "Data Science, ML", "Placement Status": "Placed", "Company": "Wipro", "Package": "15.0 LPA", "Date of Joining": "16/08/25" },
  { "So No": 5, "Student Name": "Vikram K.", "Register No.": "731523130005", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "CGPA": "7.5", "Skills": "C++, DSA", "Placement Status": "Unplaced", "Company": "-", "Package": "-", "Date of Joining": "-" },
  { "So No": 6, "Student Name": "Deepika P.", "Register No.": "731523130006", "Department": "CSE", "Batch": "2023-2027", "Section": "C", "CGPA": "8.8", "Skills": "Full Stack", "Placement Status": "Placed", "Company": "Infosys", "Package": "13.0 LPA", "Date of Joining": "26/08/25" },
  
  // New Batch: 2024-2028
  { "So No": 7, "Student Name": "Sanjay R.", "Register No.": "731523130007", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "CGPA": "8.0", "Skills": "Cloud Computing", "Placement Status": "Placed", "Company": "IBM", "Package": "11.0 LPA", "Date of Joining": "01/09/25" },
  { "So No": 8, "Student Name": "Meena L.", "Register No.": "731523130008", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "CGPA": "8.7", "Skills": "DevOps, Docker", "Placement Status": "Placed", "Company": "TCS", "Package": "14.0 LPA", "Date of Joining": "06/09/25" },
  { "So No": 9, "Student Name": "Kavin S.", "Register No.": "731523130009", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "CGPA": "7.9", "Skills": "Mobile Dev", "Placement Status": "Unplaced", "Company": "-", "Package": "-", "Date of Joining": "-" },
  { "So No": 10, "Student Name": "Harini B.", "Register No.": "731523130010", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "CGPA": "9.0", "Skills": "AI/ML, Python", "Placement Status": "Placed", "Company": "Google", "Package": "25.0 LPA", "Date of Joining": "16/09/25" },
  { "So No": 11, "Student Name": "Ramesh C.", "Register No.": "731523130011", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "CGPA": "8.3", "Skills": "Blockchain", "Placement Status": "Placed", "Company": "IBM", "Package": "16.0 LPA", "Date of Joining": "21/09/25" },
  { "So No": 12, "Student Name": "Shalini D.", "Register No.": "731523130012", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "CGPA": "8.6", "Skills": "Cybersecurity", "Placement Status": "Placed", "Company": "Microsoft", "Package": "22.0 LPA", "Date of Joining": "26/09/25" },
  
  // New Batch: 2025-2029
  { "So No": 13, "Student Name": "Ajith V.", "Register No.": "731523130013", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "CGPA": "7.6", "Skills": "Web Dev", "Placement Status": "Unplaced", "Company": "-", "Package": "-", "Date of Joining": "-" },
  { "So No": 14, "Student Name": "Sindhu M.", "Register No.": "731523130014", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "CGPA": "8.4", "Skills": "Data Analytics", "Placement Status": "Placed", "Company": "Infosys", "Package": "12.5 LPA", "Date of Joining": "06/10/25" },
  { "So No": 15, "Student Name": "Dinesh S.", "Register No.": "731523130015", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "CGPA": "8.9", "Skills": "System Design", "Placement Status": "Placed", "Company": "Amazon", "Package": "28.0 LPA", "Date of Joining": "11/10/25" },
  { "So No": 16, "Student Name": "Janani P.", "Register No.": "731523130016", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "CGPA": "9.2", "Skills": "Research, AI", "Placement Status": "Placed", "Company": "Meta", "Package": "30.0 LPA", "Date of Joining": "16/10/25" },
  { "So No": 17, "Student Name": "Praveen J.", "Register No.": "731523130017", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "CGPA": "7.7", "Skills": "Game Dev", "Placement Status": "Unplaced", "Company": "-", "Package": "-", "Date of Joining": "-" },
  { "So No": 18, "Student Name": "Anjali A.", "Register No.": "731523130018", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "CGPA": "8.1", "Skills": "UI/UX Design", "Placement Status": "Placed", "Company": "Adobe", "Package": "18.0 LPA", "Date of Joining": "26/10/25" },
];

function CoReportAnalysisSW({ onLogout, onViewChange }) {
    // const navigate = useNavigate(); // Unused
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Filter states
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedPlacementStatus, setSelectedPlacementStatus] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    
    // Data state
    const [filteredData, setFilteredData] = useState(initialData);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // Apply filters
    const applyFilters = () => {
        let filtered = initialData;

        if (selectedBatch) {
            filtered = filtered.filter(item => item.Batch === selectedBatch);
        }

        if (selectedSection) {
            filtered = filtered.filter(item => item.Section === selectedSection);
        }

        if (selectedPlacementStatus) {
            filtered = filtered.filter(item => item["Placement Status"] === selectedPlacementStatus);
        }

        // Date filtering (if both dates are selected)
        if (startDate && endDate) {
            filtered = filtered.filter(item => {
                if (item["Date of Joining"] === "-") return false;
                const joinDate = new Date(item["Date of Joining"]);
                return joinDate >= startDate && joinDate <= endDate;
            });
        }

        setFilteredData(filtered);
    };

    // Reset filters
    const resetFilters = () => {
        setSelectedBatch('');
        setSelectedSection('');
        setSelectedPlacementStatus('');
        setStartDate(null);
        setEndDate(null);
        setFilteredData(initialData);
    };

    // Export functions
    const exportToExcel = () => {
        const data = filteredData.map(item => [
            item["So No"],
            item["Student Name"],
            item["Register No."],
            item["Department"],
            item["Batch"],
            item["Section"],
            item["CGPA"],
            item["Skills"],
            item["Placement Status"],
            item["Company"],
            item["Package"],
            item["Date of Joining"]
        ]);
        
        const header = ["S.No", "Student Name", "Register No.", "Department", "Batch", "Section", "CGPA", "Skills", "Placement Status", "Company", "Package", "Date of Joining"];
        const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student Report");
        XLSX.writeFile(wb, "Student_Wise_Report.xlsx");
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF("landscape");
        const columns = ["S.No", "Student Name", "Register No.", "Department", "Batch", "Section", "CGPA", "Skills", "Placement Status", "Company", "Package", "Date of Joining"];
        
        const rows = filteredData.map(item => [
            item["So No"],
            item["Student Name"],
            item["Register No."],
            item["Department"],
            item["Batch"],
            item["Section"],
            item["CGPA"],
            item["Skills"],
            item["Placement Status"],
            item["Company"],
            item["Package"],
            item["Date of Joining"]
        ]);

        doc.text("Student Wise Report", 14, 15);
        
        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 20,
            styles: { fontSize: 7 },
        });

        doc.save("Student_Wise_Report.pdf");
        setShowExportMenu(false);
    };

    return (
        <>
            <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className="co-rasw-layout">
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onLogout={onLogout} 
                    currentView="report-analysis" 
                    onViewChange={onViewChange} 
                />
                <div className="co-rasw-main-content">
                    <div className="co-rasw-header">
                        <h1 className="co-rasw-title">Student Wise Report Analysis</h1>
                        <p className="co-rasw-subtitle">Filter and analyze student placement data</p>
                    </div>

                    {/* Filter Section */}
                    <div className="co-rasw-filter-card">
                        <h3>Filter Options</h3>
                        <div className="co-rasw-filter-grid">
                            <div className="co-rasw-filter-item">
                                <label>Batch</label>
                                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                                    <option value="">All Batches</option>
                                    <option value="2023-2027">2023-2027</option>
                                    <option value="2024-2028">2024-2028</option>
                                    <option value="2025-2029">2025-2029</option>
                                </select>
                            </div>

                            <div className="co-rasw-filter-item">
                                <label>Section</label>
                                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                                    <option value="">All Sections</option>
                                    <option value="A">Section A</option>
                                    <option value="B">Section B</option>
                                    <option value="C">Section C</option>
                                </select>
                            </div>

                            <div className="co-rasw-filter-item">
                                <label>Placement Status</label>
                                <select value={selectedPlacementStatus} onChange={(e) => setSelectedPlacementStatus(e.target.value)}>
                                    <option value="">All Status</option>
                                    <option value="Placed">Placed</option>
                                    <option value="Unplaced">Unplaced</option>
                                </select>
                            </div>

                            <div className="co-rasw-filter-item">
                                <label>Start Date</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    dateFormat="dd/MM/yy"
                                    placeholderText="Select start date"
                                />
                            </div>

                            <div className="co-rasw-filter-item">
                                <label>End Date</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    dateFormat="dd/MM/yy"
                                    placeholderText="Select end date"
                                />
                            </div>
                        </div>

                        <div className="co-rasw-filter-buttons">
                            <button className="co-rasw-btn co-rasw-btn-primary" onClick={applyFilters}>
                                Apply Filters
                            </button>
                            <button className="co-rasw-btn co-rasw-btn-secondary" onClick={resetFilters}>
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="co-rasw-results-card">
                        <div className="co-rasw-results-header">
                            <h3>Student Report Results ({filteredData.length} records)</h3>
                            <div className="co-rasw-export-container">
                                <button 
                                    className="co-rasw-btn co-rasw-btn-export"
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                >
                                    Export Data
                                </button>
                                {showExportMenu && (
                                    <div className="co-rasw-export-menu">
                                        <button onClick={exportToExcel}>Export to Excel</button>
                                        <button onClick={exportToPDF}>Download as PDF</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="co-rasw-table-container">
                            <table className="co-rasw-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Student Name</th>
                                        <th>Register No.</th>
                                        <th>Department</th>
                                        <th>Batch</th>
                                        <th>Section</th>
                                        <th>CGPA</th>
                                        <th>Skills</th>
                                        <th>Placement Status</th>
                                        <th>Company</th>
                                        <th>Package</th>
                                        <th>Date of Joining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan="12" style={{ textAlign: "center", padding: "20px" }}>
                                                No data available for the selected filters
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item, index) => (
                                            <tr key={item["So No"]}>
                                                <td>{index + 1}</td>
                                                <td>{item["Student Name"]}</td>
                                                <td>{item["Register No."]}</td>
                                                <td>{item["Department"]}</td>
                                                <td>{item["Batch"]}</td>
                                                <td>{item["Section"]}</td>
                                                <td>{item["CGPA"]}</td>
                                                <td>{item["Skills"]}</td>
                                                <td>
                                                    <span className={`co-rasw-status ${item["Placement Status"].toLowerCase()}`}>
                                                        {item["Placement Status"]}
                                                    </span>
                                                </td>
                                                <td>{item["Company"]}</td>
                                                <td>{item["Package"]}</td>
                                                <td>{item["Date of Joining"]}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CoReportAnalysisSW;