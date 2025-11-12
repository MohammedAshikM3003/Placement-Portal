import React, { useState } from "react";
import Searchbysection from "../assets/Searchbysection.png";
import Statusicon from "../assets/Statusicon.png";
import VectorCertificatename from "../assets/VectorCertificateName.png";
import { useNavigate } from 'react-router-dom';

import CVSearchicon from "../assets/CVSearchicon.png";
import Dropdown from "../assets/Dropdown.png";
import Viewicon from "../assets/Viewicon.png";
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.png";
import './CertificateVerification.css';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

import {
  FaEye,
} from "react-icons/fa";


const initialCertificates = [
  {
    id: 1,
    regNo: "73152313001",
    name: "Student 1",
    year:"III",
    semester:"5",
    section: "B",
    comtName: "Hackathon",
    prize:"1st",
    status: "Pending",
  },
  {
    id: 2,
    regNo: "73152313002",
    name: "Student 2",
    year:"IV",
    semester:"7",
    section: "A",
    comtName: "Workshop",
    prize:"3rd",
    status: "Accepted",
  },
  {
    id: 3,
    regNo: "73152313003",
    name: "Student 3",
    year:"III",
    semester:"5",
    section: "A",
    comtName: "NPTEL",
    prize:"Participation",
    status: "Rejected",
  },
  {
    id: 4,
    regNo: "73152313004",
    name: "Student 4",
    year:"IV",
    semester:"7",
    section: "A",
    comtName: "Codathon",
    prize:"1st",
    status: "Rejected",
  },

  {
    id: 5,
    regNo: "73152313005",
    name: "Student 5",
    year:"III",
    semester:"5",
    section: "A",
    comtName: "NPTEL",
    prize:"1st",
    status: "Rejected",
  },
 
  {
    id: 6,
    regNo: "73152313006",
    name: "Student 6",
    year:"IV",
    semester:"7",
    section: "B",
    comtName: "Workshop",
    prize:"Participation",
    status: "Accepted",
  },
 
  {
    id: 7,
    regNo: "73152313007",
    name: "Student 7",
    year:"II",
    semester:"3",
    section: "B",
    comtName: "Learnathon",
    prize:"Participation",
    status: "Accepted",
  },
 
  {
    id: 8,
    regNo: "73152313008",
    name: "Student 8",
    year:"IV",
    semester:"7",
    section: "A",
    comtName: "Hacathon",
    prize:"2nd",
    status: "Accepted",
  },
 
  {
    id: 9,
    regNo: "73152313009",
    name: "Student 9",
    year:"III",
    semester:"5",
    section: "B",
    comtName: "Ideathon",
    prize:"3rd",
    status: "Pending",
  },
 
  {
    id: 10,
    regNo: "73152313010",
    name: "Student 10",
    year:"II",
    semester:"3",
    section: "A",
    comtName: "Workshop",
    prize:"Participation",
    status: "Pending", // Changed to Pending for testing
  },
];

export default function PlacementPortal({ onLogout, currentView, onViewChange }) {
  
  const [certificates, setCertificates] = useState(initialCertificates); // NEW STATE FOR ALL CERTIFICATES
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);
  const [hover3, setHover3] = useState(false);
  const [hover4, setHover4] = useState(false);
  const [isPendingHovered, setIsPendingHovered] = useState(false);
  const [isManageHovered, setIsManageHovered] = useState(false);
  const [hoverApply, setHoverApply] = useState(false);
  const [hoverClear, setHoverClear] = useState(false);
  
  // NEW STATE FOR STATUS FILTER
  const [statusFilter, setStatusFilter] = useState(""); // "" for all, "Pending" for pending

  const [values, setValues] = useState({
    input1: "",
    input2: "",
    input3: "",
    input4: "",
  });

  const handleChange = (e, key) => {
    setValues((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };
  // const [activeItem, setActiveItem] = useState("Certificate Verification"); // Unused

  const navigate = useNavigate();
  // const handleItemClick = (itemName) => { // Unused
  //     setActiveItem(itemName);
  //   };
  const [focus1, setFocus1] = useState(false);
  const [focus2, setFocus2] = useState(false);
  const [focus3, setFocus3] = useState(false);
  const [focus4, setFocus4] = useState(false);

  const [filteredCertificates, setFilteredCertificates] = useState(certificates);
  
  // Calculate Pending Count - NOW USES THE MAIN 'certificates' STATE
  const pendingCount = certificates.filter(cert => cert.status === "Pending").length;
  
  // UPDATED applyFilters to consider statusFilter and use the main 'certificates' state
  const applyFilters = (status = statusFilter, currentCertificates = certificates) => {
    let filtered = currentCertificates.filter((cert) => { // Use currentCertificates
      return (
        (status === "" || cert.status === status) && // NEW STATUS FILTER CONDITION
        (values.input1 === "" || cert.regNo?.toLowerCase().includes(values.input1.toLowerCase())) &&
        (values.input2 === "" || cert.section?.toLowerCase().includes(values.input2.toLowerCase())) &&
        (values.input3 === "" || 
          `${cert.year}/${cert.semester}`.toLowerCase() === values.input3.toLowerCase())&&
          
        (values.input4 === "" || cert.comtName?.toLowerCase().includes(values.input4.toLowerCase()))
      );
    });
    setFilteredCertificates(filtered);
  };
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };


  // NEW FUNCTION TO FILTER BY PENDING STATUS
  const filterPendingCertificates = () => {
    const newStatus = statusFilter === "Pending" ? "" : "Pending";
    setStatusFilter(newStatus);
    applyFilters(newStatus);
    
    // Also clear other search inputs for a clean filter
    setValues({
      input1: "",
      input2: "",
      input3: "",
      input4: "",
    });
  };

  
  const clearFilters = () => {
    setValues({
      input1: "",
      input2: "",
      input3: "",
      input4: "",
    });
    setStatusFilter(""); // Reset status filter
    setFilteredCertificates(certificates); // reset back to original
  };
  
  
  // NEW HANDLER FUNCTION FOR ACCEPT/REJECT
  const handleAction = (id, newStatus) => {
    // 1. Update the main certificates array
    const updatedCertificates = certificates.map(cert => 
      cert.id === id ? { ...cert, status: newStatus } : cert
    );
    
    setCertificates(updatedCertificates); // Update main state
    
    // 2. Re-apply filters to update the displayed table
    // Use the updated array for filtering
    applyFilters(statusFilter, updatedCertificates); 
  };
  
  return (
    <div className="co-cv-container">
      {/* Top Navigation Bar */}
      <Navbar  onToggleSidebar={toggleSidebar}  />
        
      <div className="co-cv-portal">
        <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="certificate-verification" onViewChange={onViewChange} />
          
        {/* Main Content */}
        <div className="co-cv-main">
        
          <div className="co-cv-flex-row">
          
            {/* Search Filter Bar */}
            <div style={{ flex: 2 }}>
           
              <div className="co-cv-filter-bar">
              <button className="co-cv-certificate">Certificate Verification</button>
              {/* Register Number */}

             
              <div className="co-cv-input-wrapper1"  style={{position: "relative" }}>
                <img src={CVSearchicon} alt="CVSearchicon Icon" className="co-cv-icon1" />

                <input
                  className="co-cv-input1"
                  style={{
                    border: hover1 ? "2px solid #E80000" : "2px solid #ccc",
                    padding: "17px 20px 12px 40px", 
                  }}
                  value={values.input1}
                  onChange={(e) => handleChange(e, "input1")}
                  onFocus={() => setFocus1(true)}
                  onBlur={() => setFocus1(false)}
                  onMouseEnter={() => setHover1(true)}
                  onMouseLeave={() => setHover1(false)}
                />
                <label
                  style={{
                    position: "absolute",
                    left: "-380px",
                    top: values.input1 || focus1 ? "-35px" : "-5px",
                    fontSize: values.input1 || focus1 ? "0.8rem" : "1rem",
                    color: focus1 ? "#B71C1C" : "#888",
                    pointerEvents: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  Register Number
                </label>
              </div>

               
              {/* Search by Section */}
              <div className="co-cv-input-wrapper2" style={{ position: "relative" }}>
                <img src={Searchbysection} alt="Searchbysection Icon" className="co-cv-icon2" />

                <input
                  className="co-cv-input2"
                  style={{
                    border: hover2 ? "2px solid #E80000" : "2px solid #ccc",
                    padding: "17px 20px 12px 40px",
                  }}
                  value={values.input2}
                  onChange={(e) => handleChange(e, "input2")}
                  onFocus={() => setFocus2(true)}
                  onBlur={() => setFocus2(false)}
                  onMouseEnter={() => setHover2(true)}
                  onMouseLeave={() => setHover2(false)}
                />
                <label className="co-cv-input2-mv"
                  style={{
                    position: "absolute",
                    left: "370px",
                    top: values.input2 || focus2 ? "-100px" : "-70px",
                    fontSize: values.input2 || focus2 ? "0.8rem" : "1rem",
                    color: focus2 ? "#B71C1C" : "#888",
                    pointerEvents: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  Search by Section
                </label>
              </div>

            
              {/* Year/Semester */}
              <div className="co-cv-input-wrapper3" style={{ position: "relative" }}>
                <img src={Statusicon} alt="Statusicon Icon" className="co-cv-icon3" />

                <select
                  className="co-cv-input3"
                  style={{
                    border: hover3 ? "2px solid #E80000" : "2px solid #ccc",
                    padding: "17px 20px 12px 40px",
                    appearance: "none",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                  value={values.input3}
                  onChange={(e) => handleChange(e, "input3")}
                  onFocus={() => setFocus3(true)}
                  onBlur={() => setFocus3(false)}
                  onMouseEnter={() => setHover3(true)}
                  onMouseLeave={() => setHover3(false)}
                >
                  <option value="" disabled hidden></option>
                  <option value="I/1">I / 1</option>
                  <option value="I/2">I / 2</option>
                  <option value="II/3">II / 3</option>
                  <option value="II/4">II / 4</option>
                  <option value="III/5">III / 5</option>
                  <option value="III/6">III / 6</option>
                  <option value="IV/7">IV / 7</option>
                  <option value="IV/8">IV / 8</option>
                </select>

                {/* Floating Label */}
                <label
                  style={{
                    position: "absolute",
                    left: "40px",
                    top: values.input3 || focus3 ? "-35px" : "-6px",
                    fontSize: values.input3 || focus3 ? "0.8rem" : "1rem",
                    color: focus3 ? "#B71C1C" : "#888",
                    pointerEvents: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  Year / Semester
                </label>

                <img src={Dropdown} alt="Dropdown Icon" className="co-cv-dropicon3" />
              </div>

              {/* Certificate Name */}
              <div className="co-cv-input-wrapper4" style={{ position: "relative" }}>
                <img src={VectorCertificatename} alt="VectorCertificatename Icon" className="co-cv-icon4" />

                <input
                  className="co-cv-input4"
                  style={{
                    border: hover4 ? "2px solid #E80000" : "2px solid #ccc",
                    padding: "17px 20px 12px 40px",
                  }}
                  value={values.input4}
                  onChange={(e) => handleChange(e, "input4")}
                  onFocus={() => setFocus4(true)}
                  onBlur={() => setFocus4(false)}
                  onMouseEnter={() => setHover4(true)}
                  onMouseLeave={() => setHover4(false)}
                />
                <label
                  style={{
                    position: "absolute",
                    left: "370px",
                    top: values.input4 || focus4 ? "-65px" : "-35px",
                    fontSize: values.input4 || focus4 ? "0.8rem" : "1rem",
                    color: focus4 ? "#B71C1C" : "#888",
                    pointerEvents: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  Competition Name
                </label>
              </div>
  

              <button
                className="co-cv-apply-btn"
                style={{
                  boxShadow: hoverApply ? "0 2px 6px rgba(255, 14, 14, 0.7)" : "none",
                  transition: "box-shadow 0.3s ease",
                }}
                onClick={() => applyFilters()} // Use applyFilters without args to apply current state
                onMouseEnter={() => setHoverApply(true)}
                onMouseLeave={() => setHoverApply(false)}
              >
                Apply Filters
              </button>

              <button
                className="co-cv-clear-bttn"
                style={{
                  border: hoverClear ? "2px solid #E80000" : "2px solid #787878",
                  color: hoverClear ? "#B71C1C" : "#333",
                  background: hoverClear ? "#fff" : "#D3D2D2",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onClick={clearFilters}
                onMouseEnter={() => setHoverClear(true)}
                onMouseLeave={() => setHoverClear(false)}
              >
                Clear
              </button>
            </div>
          </div>
            
          {/* Cards */}
          <div>
            <div className="co-cv-input-wrapper5">
              <div
                className="co-cv-manage-students"
                style={{
                  border: isManageHovered ? "2px solid #E80000" : "2px solid #606060",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setIsManageHovered(true)}
                onMouseLeave={() => setIsManageHovered(false)}
              >
                <img
                  src={AdminBrowseStudenticon}
                  alt="CVManagestudents Icon"
                  className="co-cv-ms-icon"
                />
                <div  onClick={() => navigate(`/manage-students`)}
                  className="text-align-center font-weight-600 font-size-1-9rem margin-bottom-15"
                >
                  Manage Students
                </div>
                <div
                  className="text-align-center font-size-0-96rem color-888 margin-bottom-negative-60"
                >
                  Access and manage student information.
                </div>
              </div>
            </div>
          </div>

          <div>
            <div
              className="co-cv-card-pending-one"
              style={{
                border: statusFilter === "Pending" ? "2px solid #E80000" : isPendingHovered ? "2px solid #E80000" : "2px solid #606060",
                cursor: "pointer", 
              }}
              onClick={filterPendingCertificates} 
              onMouseEnter={() => setIsPendingHovered(true)}
              onMouseLeave={() => setIsPendingHovered(false)}
            
            >
              <h3>Pending Certificates</h3>
              <p className="color-red margin-top-negative-30">
                {/* DISPLAY PENDING COUNT */}
                <span className="font-size-3rem font-weight-bold">{pendingCount}</span> 
              </p>
            </div>
          </div>
            
          {/* Certificate Verification Table */}
          <div className="co-cv-table-box">
            <div className="font-weight-bold font-size-1-3rem color-222 margin-bottom-8">
              CERTIFICATE VERIFICATION
            </div>
            <div className="co-cv-table-wrapper">
              <table className="co-cv-table">
                <thead>
                  <tr>
                    <th className="co-cv-th">S.No</th>
                    <th className="co-cv-th">Reg no</th>
                    <th className="co-cv-th">Student Name</th>
                    <th className="co-cv-th">Year</th>
                    <th className="co-cv-th">Semester</th>
                    <th className="co-cv-th">Section</th>
                    <th className="co-cv-th">Compitition Name</th>
                    <th className="co-cv-th">Prize</th>
                    <th className="co-cv-th">Status</th>
                    <th className="co-cv-th">Action</th>
                    <th className="co-cv-th">View</th>
                  </tr>
                </thead>
                <tbody>
                {filteredCertificates.map((cert, idx) => (
                    <tr key={cert.id}>
                      <td className="co-cv-td">{idx + 1}</td>
                      <td className="co-cv-td">{cert.regNo}</td>
                      <td className="co-cv-td">{cert.name}</td>
                      <td className="co-cv-td">{cert.year}</td>
                      <td className="co-cv-td">{cert.semester}</td>
                      <td className="co-cv-td">{cert.section}</td>
                      <td className="co-cv-td">{cert.comtName}</td>
                      <td className="co-cv-td">{cert.prize}</td>
                      <td className="co-cv-td">
                        {cert.status === "Pending" ? (
                          <span className="co-cv-status-pending">Pending</span>
                        ) : cert.status === "Accepted" ? (
                          <span className="co-cv-status-accepted">Accepted</span>
                        ) : (
                          <span className="co-cv-status-rejected">Rejected</span>
                        )}
                      </td>
                      <td className="co-cv-td">
                      {cert.status === "Pending" && ( // Only show buttons if status is Pending
                        <>
                          <span>
                          <button 
                            className="co-cv-action-btn-accept"
                            onClick={() => handleAction(cert.id, "Accepted")} // NEW onClick HANDLER
                          >
                            Accept
                          </button>
                          </span>
                          <span>
                          <button 
                            className="co-cv-action-btn-reject1"
                            onClick={() => handleAction(cert.id, "Rejected")} // NEW onClick HANDLER
                          >
                            Reject
                          </button>
                          </span>
                        </>
                      )}
                      {cert.status !== "Pending" && ( // Show empty span if not Pending
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>-</span>
                      )}
                      </td>
                      <td className="co-cv-td">
                        <img src={Viewicon} alt="Viewicon Icon" className="co-cv-eye-btn" />
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
    </div>
  );
}