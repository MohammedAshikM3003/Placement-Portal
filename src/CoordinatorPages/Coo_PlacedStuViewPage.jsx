import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import CooGraduateCap from "../assets/VectorGC.svg"
import CooBackbtn from "../assets/CooBackbtn.svg"
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import './Coo_PlacedStuViewPage.module.css'; // Renamed CSS file import
import Adminicons from '../assets/Coordinatorcap.png';

// All helper components (MdUpload, IoMdClose, GraduationCapIcon, etc.) remain unchanged.
// Only keeping necessary icons for the view-only mode
const GraduationCapIcon = () => (
    <img src={CooGraduateCap} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'-20px'}}/>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

function CooViewPS({ onLogout, onViewChange }) {
    const navigate = useNavigate();
    // Initialize state with sample data for view-only mode
    const [studyCategory, setStudyCategory] = useState('12th');
    const [profileImage, setProfileImage] = useState('https://via.placeholder.com/200x250?text=Student+Photo'); // Placeholder image for viewing
    const [uploadInfo, setUploadInfo] = useState({ name: 'SampleProfile.jpg', date: '01/01/2024' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(new Date('2003-05-20')); // Sample DOB

    // Disabled handlers for view-only mode
    const handleImageUpload = () => {};
    const handleImageRemove = () => {};
    const handleSave = (e) => { e.preventDefault(); };
    const handleDiscard = () => {};
    const closePopup = () => {};
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        // You would typically fetch student data here in a real application
    }, []);

    const handleCardClick = (newView) => {
        if (onViewChange) {
            onViewChange(newView);
        }
    };

    // Set a constant value for disabled prop
    const DISABLED = true;

    return (
        <div className="co-sv-container container">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="co-sv-main main">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'profile'} // Hardcode 'profile'
                    onViewChange={handleViewChange}
                />
                <div className="co-sv-StuProfile-dashboard-area StuViewProfile-dashboard-area dashboard-area">
                    {/* The form remains, but all inputs are disabled */}
                    <form onSubmit={handleSave}> 
                        {/* --- PERSONAL INFO --- */}
                        <div className="co-sv-StuProfile-profile-section-container StuViewProfile-profile-section-container">
                            <h3 className="co-sv-StuProfile-section-header StuViewProfile-section-header">Personal Information</h3>
                            <button 
                                type="button"
                                className="co-sv-profile-backbtn" // Updated class
                                style={{ position:"absolute",left:"1100px", top:"40px", width:"100px", height:"40px", backgroundColor:"#d23b42", borderRadius:"25px", fontSize:"1.03rem",color:"#fff", border:"none"}} 
                                onClick={() => handleCardClick('placed-students')}
                            >
                                Back<img className="co-sv-profile-backbtn-img" src={CooBackbtn}alt="back" style={{position:"relative", left:"10px"}}/> 
                            </button>
                            <div className="co-sv-StuProfile-form-grid StuViewProfile-form-grid">
                                <div className="co-sv-StuProfile-personal-info-fields StuViewProfile-personal-info-fields">
                                    <input type="text" placeholder="First Name" defaultValue="John" disabled={DISABLED} />
                                    <input type="text" placeholder="Last Name" defaultValue="Doe" disabled={DISABLED} />
                                    <input type="text" placeholder="Register Number" defaultValue="1234567890" disabled={DISABLED} />
                                    <div className="co-sv-StuProfile-datepicker-wrapper StuViewProfile-datepicker-wrapper">
                                        {/* DatePicker is disabled and styled to look like a regular input */}
                                        <DatePicker selected={dob} onChange={() => {}} dateFormat="dd/MM/yyyy" placeholderText="DOB" className="co-sv-StuProfile-datepicker-input StuViewProfile-datepicker-input" wrapperClassName="co-sv-StuProfile-datepicker-wrapper-inner StuViewProfile-datepicker-wrapper-inner" showPopperArrow={false} disabled={DISABLED} />
                                    </div>
                                    <select defaultValue="B.Tech" disabled={DISABLED}><option value="" disabled>Degree</option><option value="B.E">B.E</option><option value="B.Tech">B.Tech</option></select>
                                    <input type="text" placeholder="Branch" defaultValue="Information Technology" disabled={DISABLED} />
                                    <select defaultValue="male" disabled={DISABLED}><option value="" disabled>Gender</option><option value="male">Male</option><option value="female">Female</option></select>
                                    <input type="text" placeholder="Address" defaultValue="123 Main St" disabled={DISABLED} />
                                    <input type="text" placeholder="City" defaultValue="Coimbatore" disabled={DISABLED} />
                                    <input type="email" placeholder="Primary Mail id" defaultValue="john.doe@primary.com" disabled={DISABLED} />
                                    <input type="email" placeholder="Domain Mail id" defaultValue="john.doe@domain.com" disabled={DISABLED} />
                                    <input type="tel" placeholder="Mobile No." defaultValue="9876543210" disabled={DISABLED} />
                                    <input type="text" placeholder="Father Name" defaultValue="Richard Doe" disabled={DISABLED} />
                                    <input type="text" placeholder="Father Occupation" defaultValue="Engineer" disabled={DISABLED} />
                                    <input type="text" placeholder="Father Mobile No." defaultValue="9988776655" disabled={DISABLED} />
                                    <input type="text" placeholder="Mother Name" defaultValue="Jane Doe" disabled={DISABLED} />
                                    <input type="text" placeholder="Mother Occupation" defaultValue="Teacher" disabled={DISABLED} />
                                    <input type="text" placeholder="Mother Mobile No." defaultValue="9988776644" disabled={DISABLED} />
                                </div>
                                <div className="co-sv-StuProfile-profile-photo-wrapper StuViewProfile-profile-photo-wrapper">
                                    <div className="co-sv-StuProfile-profile-photo-box StuViewProfile-profile-photo-box" style={{ height: '675px' }}>
                                        <h3 className="co-sv-StuProfile-section-header StuViewProfile-section-header">Profile Photo</h3>
                                        <div className="co-sv-StuProfile-profile-icon-container StuViewProfile-profile-icon-container">
                                            {profileImage ? ( <img  alt="Profile Preview" className="co-sv-StuProfile-profile-preview-img StuViewProfile-profile-preview-img" style={{ cursor: 'default' }} /> ) : ( <GraduationCapIcon /> )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className="co-sv-StuProfile-upload-info-container StuViewProfile-upload-info-container">
                                                <div className="co-sv-StuProfile-upload-info-item StuViewProfile-upload-info-item"><FileIcon /><span>{uploadInfo.name}</span></div>
                                                <div className="co-sv-StuProfile-upload-info-item StuViewProfile-upload-info-item"><CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span></div>
                                            </div>
                                        )}
                                        {/* Remove the upload action area */}
                                    </div>
                                </div>
                            </div>
                            <div className="co-sv-StuProfile-form-grid StuViewProfile-form-grid" style={{ marginTop: '1.5rem' }}>
                                <select defaultValue="BC" disabled={DISABLED}><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                <input type="text" placeholder="Blood Group" defaultValue="O+" disabled={DISABLED} />
                                <input type="text" placeholder="Aadhaar Number" defaultValue="XXXX XXXX 1234" disabled={DISABLED} />
                                <select defaultValue="English" disabled={DISABLED}><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                                <input type="text" placeholder="Garudian Name" className="co-sv-mr-input StuViewProfile-mr-input" defaultValue="No Guardian" disabled={DISABLED} /> 
                                <input type="text" placeholder="Garudian Mobile No" className="co-sv-mr-input StuViewProfile-mr-input" defaultValue="N/A" disabled={DISABLED} /> 
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className="co-sv-StuProfile-profile-section-container StuViewProfile-profile-section-container">
                           <h3 className="co-sv-StuProfile-section-header StuViewProfile-section-header">Academic Background</h3>
                            <div className="co-sv-StuProfile-form-grid StuViewProfile-form-grid">
                                <div className="co-sv-StuProfile-study-category StuViewProfile-study-category" style={{ gridColumn: '1 / -1' }}>
                                    {/* Radio buttons for selection are now just visually indicating the selected category */}
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} disabled={DISABLED} onChange={() => {}} />
                                    <label htmlFor="12th">12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} disabled={DISABLED} onChange={() => {}} />
                                    <label htmlFor="diploma">Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} disabled={DISABLED} onChange={() => {}} />
                                    <label htmlFor="both">Both</label>
                                </div>
                                <input type="text" placeholder="10th Institution Name" defaultValue="St. Joseph's HSS" disabled={DISABLED} />
                                <select defaultValue="State Board (Tamil Nadu)" disabled={DISABLED}><option value="" disabled>10th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                <input type="text" placeholder="10th Percentage" defaultValue="95.5" disabled={DISABLED} />
                                <input type="text" placeholder="10th Year of Passing" defaultValue="2019" disabled={DISABLED} />
                                {(studyCategory === '12th' || studyCategory === 'both') && ( <> <input type="text" placeholder="12th Institution Name" defaultValue="St. Joseph's HSS" disabled={DISABLED} /> <select defaultValue="State Board (Tamil Nadu)" disabled={DISABLED}><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select> <input type="text" placeholder="12th Percentage" defaultValue="90.0" disabled={DISABLED} /> <input type="text" placeholder="12th Year of Passing" defaultValue="2021" disabled={DISABLED} /> <input type="text" placeholder="12th Cut-off Marks" defaultValue="195.0" disabled={DISABLED} /> </> )}
                                {(studyCategory === 'diploma' || studyCategory === 'both') && ( <> <input type="text" placeholder="Diploma Institution" disabled={DISABLED} /> <input type="text" placeholder="Diploma Branch" disabled={DISABLED} /> <input type="text" placeholder="Diploma Percentage" disabled={DISABLED} /> <input type="text" placeholder="Diploma Year of Passing" disabled={DISABLED} /> </> )}
                            </div>
                        </div>
                        
                        {/* --- SEMESTER --- */}
                        <div className="co-sv-StuProfile-profile-section-container StuViewProfile-profile-section-container">
                            <h3 className="co-sv-StuProfile-section-header StuViewProfile-section-header">Semester</h3>
                            <div className="co-sv-StuProfile-form-grid StuViewProfile-form-grid">
                                <input type="text" placeholder="Semester 1 GPA" defaultValue="8.5" disabled={DISABLED} />
                                <input type="text" placeholder="Semester 2 GPA" defaultValue="8.9" disabled={DISABLED} />
                                <input type="text" placeholder="Semester 3 GPA" defaultValue="9.1" disabled={DISABLED} />
                                <input type="text" placeholder="Semester 4 GPA" defaultValue="9.0" disabled={DISABLED} />
                                <input type="text" placeholder="Semester 5 GPA" defaultValue="8.8" disabled={DISABLED} />
                                <input type="text" placeholder="Semester 6 GPA" defaultValue="8.9" disabled={DISABLED} />
                                <input type="text" placeholder="Semester 7 GPA" defaultValue="N/A" disabled={DISABLED} />
                                <input type="text" placeholder="Semester 8 GPA" defaultValue="N/A" disabled={DISABLED} />
                                <input type="text" placeholder="Overall CGPA" defaultValue="8.86" disabled={DISABLED} />
                                <input type="number" placeholder="No. of Backlogs (Cleared)" defaultValue="0" disabled={DISABLED} />
                                <input type="number" placeholder="No. of Current Backlogs" defaultValue="0" disabled={DISABLED} />
                                <input type="number" placeholder="Year of Gap" defaultValue="0" disabled={DISABLED} />
                                <input type="text" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} defaultValue="None" disabled={DISABLED} />
                            </div>
                        </div>

                        {/* --- OTHER DETAILS --- */}
                        <div className="co-sv-StuProfile-profile-section-container StuViewProfile-profile-section-container">
                            <h3 className="co-sv-StuProfile-section-header StuViewProfile-section-header">Other Details</h3>
                            <div className="co-sv-StuProfile-form-grid StuViewProfile-form-grid">
                                <select defaultValue="Dayscholar" disabled={DISABLED}><option value="" disabled>Residential status</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                                <select defaultValue="Counselling" disabled={DISABLED}><option value="" disabled>Quota</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                                <input type="text" placeholder="Languages Known" defaultValue="Tamil, English, Hindi" disabled={DISABLED} />
                                <select defaultValue="No" disabled={DISABLED}><option value="" disabled>First Graduate</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                <input type="text" placeholder="Passport No." defaultValue="A1B2C3D4" disabled={DISABLED} />
                                <input type="text" placeholder="Skill set" defaultValue="React, JavaScript, Python" disabled={DISABLED} />
                                <input type="text" placeholder="Value Added Courses" defaultValue="Web Development Bootcamp" disabled={DISABLED} />
                                <input type="text" placeholder="About sibling" defaultValue="1 Brother" disabled={DISABLED} />
                                <input type="text" placeholder="Ration card No." defaultValue="123456789" disabled={DISABLED} />
                                <input type="text" placeholder="Family Annual Income" defaultValue="5,00,000" disabled={DISABLED} />
                                <input type="text" placeholder="PAN No." defaultValue="ABCDE1234F" disabled={DISABLED} />
                                <select defaultValue="Yes" disabled={DISABLED}><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                <select defaultValue="Hybrid" disabled={DISABLED}><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                                <input type="text" placeholder="GitHub Link" defaultValue="github.com/johndoe" disabled={DISABLED} />
                                <input type="text" placeholder="LinkedIn Profile Link" defaultValue="linkedin.com/in/johndoe" disabled={DISABLED} />
                                <select defaultValue="IT" disabled={DISABLED}><option value="" disabled>Types of companies</option><option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="MNC">MNC</option><option value="Startup">Startup</option><option value="Government/Public Sector">Government/Public Sector</option><option value="Non-Profit">Non-Profit</option><option value="Other">Other</option></select>
                                <select defaultValue="Bengaluru" disabled={DISABLED}><option value="" disabled>Preferred job location</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Bengaluru">Bengaluru</option><option value="Hyderabad">Hyderabad</option><option value="North India">North India</option></select>
                            </div>
                        </div>
                        
                        {/* Action buttons are completely removed for a clean view-only profile */}
                        <div className="co-sv-StuProfile-action-buttons StuViewProfile-action-buttons" style={{ display: 'none' }}>
                            {/* Buttons removed for view-only */}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CooViewPS;