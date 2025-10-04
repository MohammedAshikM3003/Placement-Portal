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
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const GraduationCapIcon = () => (
    <img src={BlueAdminicon} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop: '-20px' }} />
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

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="mr-popup-overlay">
            <div className="mr-popup-container">
                <div className="mr-popup-header">
                    Registered !
                </div>
                <div className="mr-popup-body">
                    <svg className="mr-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="mr-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="mr-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Login Created ✓</h2>
                    <p>Student ID Created!</p>
                    <p>Click Login button to Redirect </p>
                </div>
                <div className="mr-popup-footer">
                    {/* Use Link component for redirection */}
                    <Link to="/mainlogin" style={{position : "relative",marginLeft : '65px'}}>
                        <button className="mr-login-btn">Login</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="mr-image-preview-overlay" onClick={onClose}>
            <div className="mr-image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="mr-image-preview-content" />
                <button onClick={onClose} className="mr-image-preview-close-btn">&times;</button>
            </div>
        </div>
    );
};


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
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const formRef = useRef(null);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

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
            setTimeout(() => handleInputChange(), 0);
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
        setTimeout(() => handleInputChange(), 0);
    };

    const handleSave = (e) => {
        e.preventDefault();
        
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
    };

    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th');
            setDob(null);
            handleImageRemove(new Event('discard'));
        }
    };

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