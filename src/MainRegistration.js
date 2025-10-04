<<<<<<< HEAD
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import BlueAdminicon from './assets/BlueAdminicon.png'
import Navbar from "./components/Navbar/mrnavbar";
import Sidebar from "./components/Sidebar/mrsidebar";
import personalinfo from "./assets/personal information icon.svg";
import academicIcon from "./assets/academic.svg";
import semesterIcon from "./assets/semester.svg";
import otherDetailsIcon from "./assets/otherdetails.svg";
import logindetailsIcon from "./assets/logindetails.svg";
import "./MainRegistration.css";

// Inlined SVG components remain here as they are used by the form
=======
import React, { useState, useRef } from "react";
import Adminicons from './assets/BlueAdminicon.png';
import Adminicon from "./assets/Adminicon.png"; 

// Inlined SVG components to replace react-icons, resolving import errors.

const MdDashboard = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path></svg>
);

const MdArticle = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>
);

const MdEventAvailable = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17 10H7v2h10v-2zm2-7h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-5H7v2h7v-2z"></path></svg>
);

const MdEmojiEvents = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm7 10c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm7-10c0 1.3-.84 2.4-2.18 2.82V7h2v1z"></path></svg>
);

const MdBusiness = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"></path></svg>
);

const MdPerson = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
);

>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const GraduationCapIcon = () => (
<<<<<<< HEAD
    <img src={BlueAdminicon} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop: '-20px' }} />
=======
    <img src={Adminicons} alt="Graduation Cap" style={{ width: '100px', height: '80px' }} />
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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

<<<<<<< HEAD
=======



const sidebarItems = [
  { icon: <MdDashboard />, text: 'Dashboard', view: 'dashboard' },
  { icon: <MdArticle />, text: 'Resume', view: 'resume' },
  { icon: <MdEventAvailable />, text: 'Attendance', view: 'attendance' },
  { icon: <MdEmojiEvents />, text: 'Achievements', view: 'achievements' },
  { icon: <MdBusiness />, text: 'Company', view: 'company' },
];

>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
<<<<<<< HEAD
        <div className="mr-popup-overlay">
            <div className="mr-popup-container">
                <div className="mr-popup-header">
                    Registered !
                </div>
                <div className="mr-popup-body">
                    <svg className="mr-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="mr-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="mr-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
=======
        <div className="popup-overlay">
            <div className="popup-container">
                <div className="popup-header">
                    Registered !
                </div>
                <div className="popup-body">
                    <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
                    </svg>
                    <h2>Login Created ✓</h2>
                    <p>Student ID Created!</p>
                    <p>Click Login button to Redirect </p>
                </div>
<<<<<<< HEAD
                <div className="mr-popup-footer">
                    {/* Use Link component for redirection */}
                    <Link to="/mainlogin" style={{position : "relative",marginLeft : '65px'}}>
                        <button className="mr-login-btn">Login</button>
                    </Link>
=======
                <div className="popup-footer">
                    <button onClick={onClose} className="popup-close-btn">
                        Login 
                    </button>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
<<<<<<< HEAD
    return (
        <div className="mr-image-preview-overlay" onClick={onClose}>
            <div className="mr-image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="mr-image-preview-content" />
                <button onClick={onClose} className="mr-image-preview-close-btn">&times;</button>
=======

    return (
        <div className="image-preview-overlay" onClick={onClose}>
            <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="image-preview-content" />
                <button onClick={onClose} className="image-preview-close-btn">&times;</button>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
            </div>
        </div>
    );
};


<<<<<<< HEAD
function MainRegistration() {
    const sectionList = [
        { key: 'personal', label: 'Personal Information', icon: personalinfo },
        { key: 'academic', label: 'Academic Background', icon: academicIcon },
        { key: 'semester', label: 'Semester', icon: semesterIcon },
        { key: 'other', label: 'Other Details', icon: otherDetailsIcon },
        { key: 'login', label: 'Login Details', icon: logindetailsIcon },
    ];
    
    const [activeSection, setActiveSection] = useState('personal');
    const [completedSections, setCompletedSections] = useState({});
    const sectionRefs = {
        personal: useRef(null),
        academic: useRef(null),
        semester: useRef(null),
        other: useRef(null),
        login: useRef(null),
    };
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);

    const [dob, setDob] = useState(null);
=======
function MainRegistration({ onLogout, onViewChange, currentView }) {
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const formRef = useRef(null);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

<<<<<<< HEAD
    useEffect(() => {
        const dashboard = document.getElementById('mr-dashboard-area');
        if (!dashboard) return;

        const handleScroll = () => {
            if (isScrollingRef.current) {
                return;
            }

            const dashRect = dashboard.getBoundingClientRect();
            let bestFit = null;
            let smallestDistance = Infinity;
            
            sectionList.forEach(({ key }) => {
                const ref = sectionRefs[key];
                if (ref && ref.current) {
                    const rect = ref.current.getBoundingClientRect();
                    if (rect.bottom >= dashRect.top && rect.top <= dashRect.bottom) {
                        const distance = Math.abs(rect.top - dashRect.top);
                        if (distance < smallestDistance) {
                            smallestDistance = distance;
                            bestFit = key;
                        }
                    }
                }
            });

            if (bestFit) {
                setActiveSection(bestFit);
            }
        };

        dashboard.addEventListener('scroll', handleScroll, { passive: true });
        return () => dashboard.removeEventListener('scroll', handleScroll);
    }, [sectionRefs, sectionList]);

    useEffect(() => {
        handleInputChange();
    }, [profileImage]);

    const handleSidebarClick = (key) => {
        isScrollingRef.current = true;
        setActiveSection(key);
        const ref = sectionRefs[key];
        const dashboard = document.getElementById('mr-dashboard-area');

        if (ref && ref.current && dashboard) {
            const dashboardTop = dashboard.getBoundingClientRect().top;
            const sectionTop = ref.current.getBoundingClientRect().top;
            const scrollPosition = sectionTop - dashboardTop + dashboard.scrollTop;
            
            dashboard.scrollTo({ top: scrollPosition - 12, behavior: 'smooth' });

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                isScrollingRef.current = false;
                if (window.innerWidth <= 992) {
                    setIsSidebarOpen(false);
                }
            }, 800);
        } else {
           isScrollingRef.current = false;
           if (window.innerWidth <= 992) {
               setIsSidebarOpen(false);
           }
       }
    };

    const checkSectionComplete = (key) => {
        if (!sectionRefs[key] || !sectionRefs[key].current) return false;
        const inputs = sectionRefs[key].current.querySelectorAll('input, select');
        if (inputs.length === 0) return false;
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].type === 'radio') {
                const name = inputs[i].name;
                const radios = sectionRefs[key].current.querySelectorAll(`input[type="radio"][name="${name}"]`);
                let checked = false;
                radios.forEach(r => { if (r.checked) checked = true; });
                if (!checked) return false;
                i += radios.length - 1;
                continue;
            }
            if (inputs[i].value === '' || inputs[i].value == null) return false;
        }
        return true;
    };

    const handleInputChange = () => {
        const updated = {};
        sectionList.forEach(({ key }) => {
            updated[key] = checkSectionComplete(key);
        });
        setCompletedSections(updated);
    };

=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            if (profileImage) {
                URL.revokeObjectURL(profileImage);
            }
            setProfileImage(URL.createObjectURL(file));
            setUploadInfo({
                name: file.name,
                date: new Date().toLocaleDateString('en-GB')
            });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
<<<<<<< HEAD
            setTimeout(() => handleInputChange(), 0);
=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
        } else {
            alert("Invalid file type. Please upload a JPG file.");
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        if (profileImage) {
            URL.revokeObjectURL(profileImage);
        }
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
<<<<<<< HEAD
        setTimeout(() => handleInputChange(), 0);
=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    };

    const handleSave = (e) => {
        e.preventDefault();
<<<<<<< HEAD
        
        // List of all required fields
        const requiredFields = {
            
        };

        // Add academic-specific required fields based on the selected category

        const form = e.target;
        let isFormValid = true;
        let missingFields = [];

        // Function to check a single field by placeholder
        const checkField = (placeholder) => {
            const input = form.querySelector(`[placeholder="${placeholder}"]`);
            // Handle select fields
            const select = form.querySelector(`select option[disabled][value=""]`);
            if (select && select.textContent.includes(placeholder.replace('*', ''))) {
                const selectElement = select.closest('select');
                if (selectElement && selectElement.value === '') {
                    return false;
                }
            }
            if (input && input.value.trim() === '') {
                return false;
            }
            return true;
        };

        // Check all required fields by category
        for (const section in requiredFields) {
            requiredFields[section].forEach(field => {
                if (!checkField(field)) {
                    isFormValid = false;
                    missingFields.push(field.replace('*', ''));
                }
            });
        }

        // Handle DOB check separately
        if (!dob) {
            isFormValid = false;
            missingFields.push('DOB');
        }

        if (isFormValid) {
            console.log("Form data saved!");
            setPopupOpen(true);
        }
=======
        console.log("Form data saved!");
        setPopupOpen(true);
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    };

    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th');
<<<<<<< HEAD
            setDob(null);
=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
            handleImageRemove(new Event('discard'));
        }
    };

<<<<<<< HEAD
    const closePopup = () => setPopupOpen(false);
    
    return (
        <>
            <div className="mr-container">
                <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className="mr-main">
                    <Sidebar
                        isOpen={isSidebarOpen}
                        currentView={activeSection}
                        completedSections={completedSections}
                        onViewChange={handleSidebarClick}
                    />
                    <div className="mr-dashboard-area" id="mr-dashboard-area">
                        <form ref={formRef} onSubmit={handleSave} onChange={handleInputChange}>
                            {/* Personal Information */}
                            <div className="mr-profile-section-container" ref={sectionRefs.personal}>
                                <h3 className="mr-section-header">Personal Information</h3>
                                <div className="mr-form-grid">
                                    <div className="mr-personal-info-fields">
                                        <input type="text" required placeholder="First Name *"  className='mr-input' />
                                        <input type="text" required placeholder="Last Name *" className="mr-input" />
                                        <input type="text" required placeholder="Register Number *" className="mr-input" />
                                        <div className="mr-datepicker-wrapper">
                                            <DatePicker
                                                selected={dob}
                                                onChange={(date) => setDob(date)}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="DOB*"
                                                className="mr-datepicker-input"
                                                wrapperClassName="mr-datepicker-wrapper-inner"
                                                showPopperArrow={false}
                                                required
                                            />
                                        </div>
                                        <select defaultValue="" className="mr-select" required><option value="" disabled>Degree*</option><option value="B.E">B.E</option><option value="B.Tech">B.Tech</option></select>
                                        <input type="text" placeholder="Branch*" className="mr-input" required />
                                        <select defaultValue="" className="mr-select" required><option value="" disabled>Gender*</option><option value="male">Male</option><option value="female">Female</option></select>
                                        <input type="text" placeholder="Address" className="mr-input" />
                                        <input type="text" placeholder="City" className="mr-input" />
                                        <input type="email" placeholder="Primary Email id *" className="mr-input" required/>
                                        <input type="email" placeholder="Domain Mail *" className="mr-input" required />
                                        <input type="tel" placeholder="Mobile No. *" className="mr-input" required/>
                                        <input type="text" placeholder="Father Name*" className="mr-input" required />
                                        <input type="text" placeholder="Father Occupation" className="mr-input" />
                                        <input type="text" placeholder="Father Mobile No." className="mr-input" />
                                        <input type="text" placeholder="Mother Name*" className="mr-input" required />
                                        <input type="text" placeholder="Mother Occupation" className="mr-input" />
                                        <input type="text" placeholder="Mother Mobile No." className="mr-input" />
                                    </div>
                                    <div className="mr-profile-photo-wrapper">
                                        <div className="mr-profile-photo-box" style={{ height: '675px' }}>
                                            <h3 className="mr-section-header">Profile Photo</h3>
                                            <div className="mr-profile-icon-container">
                                                {profileImage ? (
                                                    <img src={profileImage} alt="Profile Preview" className="mr-profile-preview-img" onClick={() => setImagePreviewOpen(true)} />
                                                ) : (
                                                    <GraduationCapIcon />
                                                )}
                                            </div>
                                            {profileImage && uploadInfo.name && (
                                                <div className="mr-upload-info-container">
                                                    <div className="mr-upload-info-item">
                                                        <FileIcon />
                                                        <span>{uploadInfo.name}</span>
                                                    </div>
                                                    <div className="mr-upload-info-item">
                                                        <CalendarIcon />
                                                        <span>Uploaded on: {uploadInfo.date}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mr-upload-action-area">
                                                <div className="mr-upload-btn-wrapper">
                                                    <label htmlFor="photo-upload-input" className="mr-profile-upload-btn">
                                                        <div className="mr-upload-btn-content">
                                                            <MdUpload />
                                                            <span>Upload (Max 500 KB)</span>
                                                        </div>
                                                    </label>
                                                    {profileImage && (
                                                        <button onClick={handleImageRemove} className="mr-remove-image-btn" aria-label="Remove image">
                                                            <IoMdClose />
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    id="photo-upload-input"
                                                    ref={fileInputRef}
                                                    style={{ display: 'none' }}
                                                    accept="image/jpeg"
                                                    onChange={handleImageUpload}
                                                />
                                                {uploadSuccess && (
                                                    <p className="mr-upload-success-message">
                                                        Profile Photo uploaded Successfully!
                                                    </p>
                                                )}
                                                <p className="mr-upload-hint">*Only JPG format is allowed.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mr-form-grid" style={{ marginTop: '1.5rem' }}>
                                    <select defaultValue="" className="mr-select" required><option value="" disabled>Community*</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                    <input type="text" placeholder="Blood Group*" className="mr-input" required />
                                    <input type="text" placeholder="Aadhaar Number*" className="mr-input" required />
                                    <select defaultValue="" className="mr-select"><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                                    <input type="text" placeholder="Garudian Name" className="mr-input"  />
                                    <input type="text" placeholder="Garudian Mobile No" className="mr-input"  />
                                </div>
                            </div>

                            {/* Academic Background */}
                            <div className="mr-profile-section-container" ref={sectionRefs.academic}>
                                <h3 className="mr-section-header">Academic Background</h3>
                                <div className="mr-form-grid">
                                    <div className="mr-study-category" style={{ gridColumn: '1 / -1' }}>
                                        <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => setStudyCategory(e.target.value)} />
                                        <label htmlFor="12th">12th</label>
                                        <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => setStudyCategory(e.target.value)} />
                                        <label htmlFor="diploma">Diploma</label>
                                        <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => setStudyCategory(e.target.value)} />
                                        <label htmlFor="both">Both</label>
                                    </div>
                                    <input type="text" placeholder="10th Institution Name*" className="mr-input" required />
                                    <select defaultValue="" className="mr-select" required><option value="" disabled>10th Board/University*</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                    <input type="text" placeholder="10th Percentage*" className="mr-input" required />
                                    <input type="text" placeholder="10th Year of Passing*" className="mr-input" required />
                                    {(studyCategory === '12th' || studyCategory === 'both') && (
                                        <>
                                            <input type="text" placeholder="12th Institution Name*" className="mr-input" required />
                                            <select defaultValue="" className="mr-select" required><option value="" disabled>12th Board/University*</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                            <input type="text" placeholder="12th Percentage*" className="mr-input" required />
                                            <input type="text" placeholder="12th Year of Passing*" className="mr-input" required />
                                            <input type="text" placeholder="12th Cut-off Marks*" className="mr-input" required />
                                        </>
                                    )}
                                    {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                        <>
                                            <input type="text" placeholder="Diploma Institution*" className="mr-input" required />
                                            <input type="text" placeholder="Diploma Branch*" className="mr-input" required />
                                            <input type="text" placeholder="Diploma Percentage*" className="mr-input" required />
                                            <input type="text" placeholder="Diploma Year of Passing*" className="mr-input" required />
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mr-profile-section-container" ref={sectionRefs.semester}>
                                <h3 className="mr-section-header">Semester</h3>
                                <div className="mr-form-grid">
                                    <input type="text" placeholder="Semester 1 GPA" className="mr-input" />
                                    <input type="text" placeholder="Semester 2 GPA" className="mr-input" />
                                    <input type="text" placeholder="Semester 3 GPA" className="mr-input" />
                                    <input type="text" placeholder="Semester 4 GPA" className="mr-input" />
                                    <input type="text" placeholder="Semester 5 GPA" className="mr-input" />
                                    <input type="text" placeholder="Semester 6 GPA" className="mr-input" />
                                    <input type="text" placeholder="Semester 7 GPA" className="mr-input" />
                                    <input type="text" placeholder="Semester 8 GPA" className="mr-input" />
                                    <input type="text" placeholder="Overall CGPA" className="mr-input" />
                                    <input type="number" placeholder="No. of Backlogs (Cleared)" className="mr-input" />
                                    <input type="number" placeholder="No. of Current Backlogs" className="mr-input" />
                                    <input type="number" placeholder="Year of Gap" className="mr-input" />
                                    <input type="text" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} className="mr-input" />
                                </div>
                            </div>
                            
                            <div className="mr-profile-section-container" ref={sectionRefs.other}>
                                <h3 className="mr-section-header">Other Details</h3>
                                <div className="mr-form-grid">
                                    <select defaultValue="" className="mr-select"><option value="" disabled required>Residential status*</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                                    <select defaultValue="" className="mr-select" required><option value="" disabled>Quota*</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                                    <input type="text" placeholder="Languages Known" className="mr-input" />
                                    <select defaultValue="" className="mr-select" required><option value="" disabled>First Graduate*</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                    <input type="text" placeholder="Passport No." className="mr-input" />
                                    <input type="text" placeholder="Skill set" className="mr-input" />
                                    <input type="text" placeholder="Value Added Courses" className="mr-input" />
                                    <input type="text" placeholder="About sibling" className="mr-input"/>
                                    <input type="text" placeholder="Ration card No.*" className="mr-input" required />
                                    <input type="text" placeholder="Family Annual Income*" className="mr-input" required />
                                    <input type="text" placeholder="PAN No.*" className="mr-input" required />
                                    <select defaultValue="" className="mr-select"><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                    <select defaultValue="" className="mr-select"><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                                    <input type="text" placeholder="GitHub Link" className="mr-input" />
                                    <input type="text" placeholder="LinkedIn Profile Link" className="mr-input" />
                                    <select defaultValue="" className="mr-select"><option value="" disabled>Types of companies</option><option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="MNC">MNC</option><option value="Startup">Startup</option><option value="Government/Public Sector">Government/Public Sector</option><option value="Non-Profit">Non-Profit</option><option value="Other">Other</option></select>
                                    <select defaultValue="" className="mr-select"><option value="" disabled>Preferred job location</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Bengaluru">Bengaluru</option><option value="Hyderabad">Hyderabad</option><option value="North India">North India</option></select>
                                </div>
                            </div>

                            <div className="mr-profile-section-container" ref={sectionRefs.login}>
                                <h3 className="mr-section-header">Login Details</h3>
                                <div className="mr-form-grid">
                                    <input type="text" placeholder="Register No*" className="mr-input" required />
                                    <input type="password" placeholder="New Password DOB(ddmmyyyy)*" className="mr-input" required />
                                    <input type="password" placeholder="Confirm Password DOB(ddmmyyy)*" className="mr-input" required />
                                </div>
                            </div>

                            <div className="mr-action-buttons">
                                <button type="button" className="mr-discard-btn" onClick={handleDiscard}>Cancel</button>
                                <button type="submit" className="mr-save-btn">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {isSidebarOpen && <div className="mr-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <ImagePreviewModal
                src={profileImage}
                isOpen={isImagePreviewOpen}
                onClose={() => setImagePreviewOpen(false)}
            />
        </>
    );
}

export default MainRegistration;
=======
    const closePopup = () => {
        setPopupOpen(false);
        window.location.replace('/login'); // Redirects to the login page
    };

  return (
    <>
      <style>{`
        /* --- Base Styles and Layout --- */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          background: #f8f8fb;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', Arial, sans-serif;
          overflow: hidden; /* This will hide the main scrollbar */
        }
        .container {
          background: #f8f8fb;
          min-height: 100vh;
        }
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
          cursor: pointer;
        }
        .navbar .menu span:hover {
          background: rgba(255,255,255,0.1);
        }
        .main {
          display: flex;
          height: calc(100vh - 65px);
          margin-top: 65px;
          overflow: hidden; /* This will hide the scrollbar for the main container */
        }
        .sidebar {
          background: #fff;
          width: 230px;
          height: 100%;
          box-shadow: 2px 0 12px #e1e6ef3a;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          z-index: 999;
          flex-shrink: 0;
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
        .sidebar .user-details img {
          width: 50px;
          height: 40px;
          margin-right: 15px;
          flex-shrink: 0;
          border-radius: 50%;
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
          gap: 0px;
          flex-shrink: 0;
        }
        .sidebar .nav-item {
          display: flex;
          align-items: center;
          font-size: 1rem; /* Adjusted from 1.27rem for better fit */
          padding: 16px 25px; /* Adjusted padding */
          color: #333; /* Darker color for better readability */
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
          gap: 15px;
          border-left: 4px solid transparent;
          margin: 3px 0;
          margin-top: 10px;
          font-weight: 500;
        }
        .sidebar .nav-item svg {
          width: 20px;
          height: 20px;
          transition: transform 0.2s, color 0.18s;
          color: #555;
        }
        .sidebar .nav-item.selected {
          background: #F0F6FF;
          border-left: 4px solid #197AFF;
          color: #197AFF;
          font-weight: 600;
        }
        .sidebar .nav-item.selected svg {
          color: #197AFF;
        }
        .sidebar .nav-item:hover:not(.selected) {
          background: #f8faff;
          border-left: 4px solid #a9c7f5;
          color: #197AFF;
        }
        .sidebar .nav-item:hover:not(.selected) svg {
          color: #197AFF;
        }
        .sidebar .nav-divider {
          height: 1px;
          width: 85%;
          background: #e0e0e0;
          margin: 12px auto;
          flex-shrink: 0;
        }
        .sidebar .logout-btn {
          background: #D23B42;
          color: #fff;
          margin: 25px auto 15px auto;
          padding: 12px 0;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 85%;
        }
        .sidebar .logout-btn:hover {
          background: #e04b52;
        }
        .dashboard-area {
          flex: 1;
          height: 100%;
          padding: 25px;
          background: #f8f8fb;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
        }

        /* --- Profile Form Specific Styles --- */
        .profile-section-container {
            background-color: #fff;
            padding: 2.5rem;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            margin-bottom: 2rem;
        }
        .profile-section-container:last-child {
            margin-bottom: 0;
        }
        
        .section-header {
            font-size: 1.25rem;
            font-weight: 600;
            color: #333;
            margin-top: 0;
            margin-bottom: 1.5rem;
            position: relative;
            padding-bottom: 0.5rem;
        }
        
        .section-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 40px;
            height: 3px;
            background-color: #2085f6;
            border-radius: 2px;
        }
        
        .form-grid { 
            display: grid; 
            gap: 1.5rem; 
            grid-template-columns: repeat(3, 1fr); 
            align-items: start;
        }
        
        .personal-info-fields {
            grid-column: 1 / span 2; 
            display: grid;
            grid-template-columns: 1fr 1fr; 
            gap: 1.5rem;
            align-content: start; 
        }

        .profile-photo-wrapper {
            grid-column: 3 / 4;
        }

        .form-grid input, .form-grid select {
          width: 100%;
          padding: 0.9rem;
          border: 1px solid #DDE6F4;
          border-radius: 8px;
          background-color: #F9FBFF;
          font-size: 0.95rem;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        .form-grid input:focus, .form-grid select:focus {
          outline: none;
          border-color: #2085f6;
          box-shadow: 0 0 0 3px rgba(32, 133, 246, 0.2);
        }
        
        .profile-photo-box {
            background-color: #fff; border: 1px solid #DDE6F4; border-radius: 12px;
            padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); height: 100%;
            display: flex; flex-direction: column; justify-content: space-between;
        }

        .profile-photo-box .section-header {
            margin-bottom: 1rem;
            text-align: left;
            border-bottom: none;
        }

        .profile-icon-container {
            padding: 1rem 0;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .profile-preview-img { 
            width: 150px; height: 150px; object-fit: cover; 
            border-radius: 12px; border: 4px solid #e9f1fc; cursor: pointer; 
        }

        .upload-hint { font-size: 0.8rem; color: #888; margin-top: 8px; text-align: center; }

        .upload-success-message {
            font-size: 0.9rem;
            color: #28a745;
            font-weight: 500;
            text-align: center;
            margin: 10px 0 0 0;
        }

        .upload-btn-wrapper { display: flex; align-items: center; gap: 10px; }

        .profile-upload-btn {
            flex-grow: 1; display: flex; align-items: center; justify-content: center; padding: 0.8rem 1rem;
            background-color: #F9FBFF; border: 1px solid #DDE6F4; border-radius: 8px; cursor: pointer;
            font-size: 0.95rem; color: #555; transition: all 0.2s ease-in-out;
        }
        
        .profile-upload-btn:hover {
            background-color: #f0f6ff;
            border-color: #a9c7f5;
        }

        .upload-btn-content { display: flex; align-items: center; gap: 8px; }
        .upload-btn-content svg { transform: translateY(-1px); font-size: 1.3rem; }

        .remove-image-btn {
            background: #fde8e8; border: 1px solid #f9c6c6; color: #d9534f; border-radius: 8px;
            cursor: pointer; width: 45px; height: 45px; padding: 0; display: flex; align-items: center;
            justify-content: center; font-size: 1.5rem; transition: all 0.2s ease; flex-shrink: 0;
        }

        .remove-image-btn:hover { background: #d9534f; color: white; border-color: #d9534f; }
        
        .study-category {
            display: flex;
            gap: 1rem;
            align-items: center;
            padding: 0.5rem;
            background-color: #F9FBFF;
            border-radius: 8px;
            border: 1px solid #DDE6F4;
        }
        .study-category label {
            flex: 1;
            text-align: center;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
        }
        .study-category input[type="radio"] {
            display: none;
        }
        .study-category input[type="radio"]:checked + label {
            background-color: #2085f6;
            color: white;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(32, 133, 246, 0.3);
        }

        .action-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
        }
        .action-buttons button {
            padding: 0.8rem 2rem;
            border-radius: 8px;
            border: none;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
        }
        .discard-btn {
            background-color: #E9F1FC;
            color: #2085f6;
        }
        .save-btn {
            background-color: #2085f6;
            color: white;
        }
        .save-btn:hover {
            background-color: #1a6ac4;
        }
         .discard-btn:hover {
            background-color: #d8e6f8;
        }
        
        /* --- Image Preview Modal --- */
        .image-preview-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.7);
            display: flex; align-items: center; justify-content: center; z-index: 3000; cursor: pointer;
        }
        .image-preview-container {
            position: relative; background-color: #fff; padding: 10px; border-radius: 12px;
            max-width: 90vw; max-height: 90vh; cursor: default;
        }
        .image-preview-content {
            max-width: 100%; max-height: calc(90vh - 20px); display: block; border-radius: 8px;
        }
        .image-preview-close-btn {
            position: absolute; top: -15px; right: -15px; background: white; color: #333;
            border: 2px solid #333; border-radius: 50%; width: 40px; height: 40px;
            font-size: 2rem; font-weight: bold; cursor: pointer; display: flex;
            align-items: center; justify-content: center; line-height: 1; padding: 0 0 5px 0;
        }

        /* --- Popup Styles --- */
        .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        .popup-container {
            background-color: #fff;
            border-radius: 12px;
            width: 400px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .popup-header {
            background-color: #2085f6;
            color: white;
            padding: 1rem;
            font-size: 1.5rem;
            font-weight: 600;
        }
        .popup-body {
            padding: 2rem;
        }
        .popup-body h2 {
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            color: #333;
        }
        .popup-body p {
            margin: 0.25rem 0;
            color: #666;
        }
        .popup-footer {
            padding: 1.5rem;
            background-color: #f7f7f7;
        }
        .popup-close-btn {
            background-color: #197AFF;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .popup-close-btn:hover {
            background-color: #006affff;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #fff;
            stroke-miterlimit: 10;
            margin: 0 auto;
            box-shadow: inset 0px 0px 0px #4bb71b;
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        .success-icon--circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke-miterlimit: 10;
            stroke: #4bb71b;
            fill: none;
            animation: stroke .6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .success-icon--check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke .3s cubic-bezier(0.65, 0, 0.45, 1) .8s forwards;
        }
        @keyframes stroke {
            100% { stroke-dashoffset: 0; }
        }
        @keyframes scale {
            0%, 100% { transform: none; }
            50% { transform: scale3d(1.1, 1.1, 1); }
        }
        @keyframes fill {
            100% { box-shadow: inset 0px 0px 0px 40px #4bb71b; }
        }

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
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                Home
              </span>
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                About
              </span>
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                Features
              </span>
              <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Contact
              </span>
          </div>
        </div>

        <div className="main">
          <div className="sidebar">
            <div className="user-info">
              <div className="user-details">
                <img src={Adminicon} alt="User" />
                <div className="user-text">
                  <span>Student</span>
                  <span className="user-year">Final Year</span>
                </div>
              </div>
            </div>
            <nav className="nav">
              <div className="nav-section">
                {sidebarItems.map((item) => (
                  <span
                    key={item.text}
                    className={`nav-item${item.view === currentView ? ' selected' : ''}`}
                    onClick={() => onViewChange(item.view)}
                  >
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>
              <div className="nav-divider"></div>
              <span
                className={`nav-item${currentView === 'profile' ? ' selected' : ''}`}
                onClick={() => onViewChange('profile')}
              >
                <MdPerson /> Profile
              </span>
            </nav>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>

          <div className="dashboard-area">
            <form ref={formRef} onSubmit={handleSave}>
                <div className="profile-section-container">
                    <h3 className="section-header">Personal Information</h3>
                    <div className="form-grid">
                        <div className="personal-info-fields">
                            <input type="text" placeholder="First Name" />
                            <input type="text" placeholder="Last Name" />
                            <input type="text" placeholder="Register Number" />
                            <input type="date" placeholder="DOB" />
                            <select defaultValue=""><option value="" disabled>Degree</option><option value="B.E">B.E</option><option value="B.Tech">B.Tech</option></select>
                            <input type="text" placeholder="Branch" />
                            <select defaultValue=""><option value="" disabled>Gender</option><option value="male">Male</option><option value="female">Female</option></select>
                            <input type="text" placeholder="Address" />
                            <input type="text" placeholder="City" />
                            <input type="email" placeholder="Primary Email id" />
                            <input type="email" placeholder="Secondary Email id" />
                            <input type="tel" placeholder="Mobile No." />
                            <input type="text" placeholder="Father Name" />
                            <input type="text" placeholder="Father Occupation" />
                            <input type="text" placeholder="Mother Name" />
                            <input type="text" placeholder="Mother Occupation" />
                        </div>
                        
                        <div className="profile-photo-wrapper"> 
                             <div className="profile-photo-box" style={{ height: '560px' }}>
                                <h3 className="section-header">Profile Photo</h3>
                                <div className="profile-icon-container">
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile Preview" className="profile-preview-img" onClick={() => setImagePreviewOpen(true)} />
                                    ) : (
                                        <GraduationCapIcon />
                                    )}
                                </div>
                                
                                {profileImage && uploadInfo.name && (
                                    <div className="upload-info-container">
                                        <div className="upload-info-item">
                                            <FileIcon />
                                            <span>{uploadInfo.name}</span>
                                        </div>
                                        <div className="upload-info-item">
                                            <CalendarIcon />
                                            <span>Uploaded on: {uploadInfo.date}</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="upload-action-area">
                                    <div className="upload-btn-wrapper">
                                        <label htmlFor="photo-upload-input" className="profile-upload-btn">
                                            <div className="upload-btn-content">
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {profileImage && (
                                            <button onClick={handleImageRemove} className="remove-image-btn" aria-label="Remove image">
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        id="photo-upload-input" 
                                        ref={fileInputRef}
                                        style={{ display: 'none' }} 
                                        accept="image/jpeg" 
                                        onChange={handleImageUpload}
                                    />
                                     {uploadSuccess && (
                                        <p className="upload-success-message">
                                            Profile Photo uploaded Successfully!
                                        </p>
                                    )}
                                    <p className="upload-hint">*Only JPG format is allowed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                        <select defaultValue=""><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                        <input type="text" placeholder="Blood Group" />
                        <input type="text" placeholder="Parent Mobile No." />
                        <input type="text" placeholder="Aadhaar Number" />
                        <select defaultValue=""><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                    </div>
                </div>

                <div className="profile-section-container">
                    <h3 className="section-header">Academic Background</h3>
                    <div className="form-grid">
                        <div className="study-category" style={{ gridColumn: '1 / -1' }}>
                            <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => setStudyCategory(e.target.value)} />
                            <label htmlFor="12th">12th</label>
                            <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => setStudyCategory(e.target.value)} />
                            <label htmlFor="diploma">Diploma</label>
                            <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => setStudyCategory(e.target.value)} />
                            <label htmlFor="both">Both</label>
                        </div>

                        {/* Common 10th fields */}
                        <input type="text" placeholder="10th Institution Name" />
                        <select defaultValue=""><option value="" disabled>10th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                        <input type="text" placeholder="10th Percentage" />
                        <input type="text" placeholder="10th Year of Passing" />

                        {/* Conditional Fields for 12th */}
                        {(studyCategory === '12th' || studyCategory === 'both') && (
                            <>
                                <input type="text" placeholder="12th Institution Name" />
                                <select defaultValue=""><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                <input type="text" placeholder="12th Percentage" />
                                <input type="text" placeholder="12th Year of Passing" />
                                <input type="text" placeholder="12th Cut-off Marks" />
                            </>
                        )}
                        
                        {/* Conditional Fields for Diploma */}
                        {(studyCategory === 'diploma' || studyCategory === 'both') && (
                            <>
                                <input type="text" placeholder="Diploma Institution" />
                                <input type="text" placeholder="Diploma Branch" />
                                <input type="text" placeholder="Diploma Percentage" />
                                <input type="text" placeholder="Diploma Year of Passing" />
                            </>
                        )}
                    </div>
                </div>

                <div className="profile-section-container">
                    <h3 className="section-header">Semester</h3>
                    <div className="form-grid">
                        <input type="text" placeholder="Semester 1 GPA" />
                        <input type="text" placeholder="Semester 2 GPA" />
                        <input type="text" placeholder="Semester 3 GPA" />
                        <input type="text" placeholder="Semester 4 GPA" />
                        <input type="text" placeholder="Semester 5 GPA" />
                        <input type="text" placeholder="Semester 6 GPA" />
                        <input type="text" placeholder="Semester 7 GPA" />
                        <input type="text" placeholder="Semester 8 GPA" />
                        <input type="text" placeholder="Overall CGPA" />
                        <input type="number" placeholder="No. of Backlogs (Cleared)" />
                        <input type="number" placeholder="No. of Current Backlogs" />
                        <input type="number" placeholder="Year of Gap" />
                        <input type="text" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} />
                    </div>
                </div>
                
                <div className="profile-section-container">
                    <h3 className="section-header">Other Details</h3>
                    <div className="form-grid">
                        <select defaultValue=""><option value="" disabled>Residential status</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                        <select defaultValue=""><option value="" disabled>Quota</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                        <input type="text" placeholder="Languages Known" />
                        <select defaultValue=""><option value="" disabled>First Graduate</option><option value="Yes">Yes</option><option value="No">No</option></select>
                        <input type="text" placeholder="Passport No." />
                        <input type="text" placeholder="Skill set" />
                        <input type="text" placeholder="Value Added Courses" />
                        <input type="text" placeholder="About sibling" />
                        <input type="text" placeholder="Ration card No." />
                        <input type="text" placeholder="Family Annual Income" />
                        <input type="text" placeholder="PAN No." />
                        <select defaultValue=""><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                        <select defaultValue=""><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                        <input type="text" placeholder="GitHub Link" />
                        <input type="text" placeholder="LinkedIn Profile Link" />
                        <select defaultValue=""><option value="" disabled>Types of companies</option><option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="MNC">MNC</option><option value="Startup">Startup</option><option value="Government/Public Sector">Government/Public Sector</option><option value="Non-Profit">Non-Profit</option><option value="Other">Other</option></select>
                        <select defaultValue=""><option value="" disabled>Preferred job location</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Bengaluru">Bengaluru</option><option value="Hyderabad">Hyderabad</option><option value="North India">North India</option></select>
                    </div>
                </div>


                 <div className="profile-section-container">
                    <h3 className="section-header">Login Details</h3>
                    <div className="form-grid">
                        <input type="text" placeholder="Domain E-Mail Id" />
                        <input type="text" placeholder="New Password" />
                        <input type="text" placeholder="Confirm Password" />
                        

                    </div>
                </div>

                <div className="action-buttons">
                    <button type="button" className="discard-btn" onClick={handleDiscard}>Cancel</button>
                    <button type="submit" className="save-btn">Register</button>
                </div>
            </form>
          </div>
        </div>
      </div>
      <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
      <ImagePreviewModal
        src={profileImage}
        isOpen={isImagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
      />
    </>
  );
}

export default MainRegistration;

>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
