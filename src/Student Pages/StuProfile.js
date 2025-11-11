import React, { useState, useRef, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import './StuProfile.css';
import Adminicons from '../assets/BlueAdminicon.png';
import mongoDBService from '../services/mongoDBService.js';
import fastDataService from '../services/fastDataService.js';

// Helper components
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const GraduationCapIcon = () => (
    <img src={Adminicons} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'-20px'}}/>
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
        <div className="StuProfile-popup-overlay">
            <div className="StuProfile-popup-container">
                <div className="StuProfile-popup-header">Saved !</div>
                <div className="StuProfile-popup-body">
                    <svg className="StuProfile-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="StuProfile-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="StuProfile-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Changes Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className="StuProfile-popup-footer">
                    <button onClick={onClose} className="StuProfile-popup-close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;
    return (
        <div className="StuProfile-popup-overlay">
            <div className="StuProfile-popup-container">
                <div className="StuProfile-popup-header" style={{ backgroundColor: '#1976d2' }}>
                    Image Too Large!
                </div>
                <div className="StuProfile-popup-body">
                    <svg className="StuProfile-image-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="StuProfile-image-error-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <g className="StuProfile-image-error-icon--inner-icon">
                            {/* Simple image frame */}
                            <rect x="14" y="14" width="24" height="24" rx="2" ry="2" fill="none"/>
                            {/* Simple mountain */}
                            <polyline points="18 32 26 22 34 32"/>
                            {/* Simple sun */}
                            <circle cx="30" cy="20" r="2"/>
                            {/* No symbol - simple cross */}
                            <line x1="20" y1="20" x2="32" y2="32"/>
                            <line x1="32" y1="20" x2="20" y2="32"/>
                        </g>
                    </svg>
                    <h2 style={{ color: '#d32f2f' }}>Image Size Exceeded ✗</h2>
                    <p style={{ marginBottom: '8px' }}>Maximum allowed: <strong>500KB</strong></p>
                    <p style={{ marginBottom: '8px' }}>Your image size: <strong>{fileSizeKB}KB</strong></p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                        Please compress your image or choose a smaller file.
                    </p>
                </div>
                <div className="StuProfile-popup-footer">
                    <button onClick={onClose} className="StuProfile-popup-close-btn" style={{ backgroundColor: '#1976d2' }}>OK</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="StuProfile-image-preview-overlay" onClick={onClose}>
            <div className="StuProfile-image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="StuProfile-image-preview-content" />
                <button onClick={onClose} className="StuProfile-image-preview-close-btn">&times;</button>
            </div>
        </div>
    );
};

function StuProfile({ onLogout, onViewChange }) {
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');

    // Function to get available semesters based on selected year
    const getAvailableSemesters = (year) => {
        const semesterMap = {
            'I': ['1', '2'],
            'II': ['3', '4'],
            'III': ['5', '6'],
            'IV': ['7', '8'] // 7th and 8th semesters for 4th year
        };
        return semesterMap[year] || [];
    };

    // Function to get required GPA fields based on current year and semester
    const getRequiredGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        
        const semesterNum = parseInt(currentSemester);
        const requiredFields = [];
        
        // Special case: IV year 8th sem - show all semesters 1-7 (8th optional)
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 7; i++) {
                requiredFields.push(`semester${i}GPA`);
            }
            return requiredFields;
        }
        
        // Regular case: collect all previous semesters
        for (let i = 1; i < semesterNum; i++) {
            requiredFields.push(`semester${i}GPA`);
        }
        
        return requiredFields;
    };

    // Function to get all GPA fields to display (including optional ones)
    const getAllGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        
        const semesterNum = parseInt(currentSemester);
        const allFields = [];
        
        // Special case: IV year 8th sem - show all semesters 1-8 (8th optional)
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 8; i++) {
                allFields.push(`semester${i}GPA`);
            }
            return allFields;
        }
        
        // Regular case: collect all previous semesters + current semester (optional)
        for (let i = 1; i <= semesterNum; i++) {
            allFields.push(`semester${i}GPA`);
        }
        
        return allFields;
    };

    const populateFormFields = (data) => {
        console.log('🔍 Populating form fields with data:', data);
        console.log('🔍 Key fields from MongoDB:', {
            skillSet: data.skillSet,
            languagesKnown: data.languagesKnown,
            residentialStatus: data.residentialStatus,
            quota: data.quota,
            firstGraduate: data.firstGraduate,
            passportNo: data.passportNo,
            valueAddedCourses: data.valueAddedCourses,
            aboutSibling: data.aboutSibling,
            rationCardNo: data.rationCardNo,
            familyAnnualIncome: data.familyAnnualIncome,
            panNo: data.panNo,
            willingToSignBond: data.willingToSignBond,
            preferredModeOfDrive: data.preferredModeOfDrive,
            githubLink: data.githubLink,
            linkedinLink: data.linkedinLink,
            companyTypes: data.companyTypes,
            preferredJobLocation: data.preferredJobLocation
        });
        console.log('🔍 All available fields in data:', Object.keys(data));
        
        setStudentData(data);
        setStudyCategory(data.studyCategory || '12th');
        setCurrentYear(data.currentYear || '');
        setCurrentSemester(data.currentSemester || '');
        
        if (data.dob) {
            const dobStr = data.dob.toString();
            if (dobStr.length === 8) {
                const day = dobStr.substring(0, 2);
                const month = dobStr.substring(2, 4);
                const year = dobStr.substring(4, 8);
                setDob(new Date(year, month - 1, day));
            }
        }
        
        if (data.profilePicURL) {
            setProfileImage(data.profilePicURL);
            setUploadInfo({
                name: 'profile.jpg',
                date: data.profileUploadDate || new Date().toLocaleDateString('en-GB')
            });
        }
    };

    const loadStudentData = useCallback(async () => {
        try {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            
            if (!storedStudentData || !storedStudentData._id) {
                console.log('No stored student data found');
                return;
            }
            
            const studentId = storedStudentData._id || storedStudentData.id;
            
            // ⚡ SUPER FAST: Get complete data in one call
            console.log('🚀 Loading complete student data...');
            const completeData = await fastDataService.getCompleteStudentData(studentId);
            
            if (completeData && completeData.student) {
                console.log('✅ INSTANT: Complete data loaded:', {
                    student: !!completeData.student,
                    resume: !!completeData.resume,
                    certificates: completeData.certificates?.length || 0,
                    hasProfilePic: completeData.stats?.hasProfilePic
                });
                
                // Populate form with complete data
                populateFormFields(completeData.student);
                
                // Store additional data for other components
                if (completeData.resume) {
                    localStorage.setItem('resumeData', JSON.stringify(completeData.resume));
                }
                if (completeData.certificates) {
                    localStorage.setItem('certificatesData', JSON.stringify(completeData.certificates));
                }
                
            } else {
                console.log('No complete data found');
                // Fallback to old method if needed
                const storedRegNo = localStorage.getItem('regNo');
                const storedDob = localStorage.getItem('dob');
                if (storedRegNo && storedDob) {
                    const fallbackData = await mongoDBService.getStudentByRegNoAndDob(storedRegNo, storedDob);
                    if (fallbackData) {
                        populateFormFields(fallbackData);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error loading complete student data:', error);
            
            // Fallback to localStorage data
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (storedStudentData) {
                console.log('⚠️ Using localStorage fallback');
                populateFormFields(storedStudentData);
            }
        }
    }, []);

    useEffect(() => {
        // ⚡ INSTANT: Load data from cache/localStorage first
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData && storedStudentData._id) {
            console.log('⚡ INSTANT: Loading from localStorage:', storedStudentData);
            populateFormFields(storedStudentData);
            
            // Try to get instant cached data
            const instantData = fastDataService.getInstantData(storedStudentData._id);
            if (instantData && instantData.student) {
                console.log('⚡ INSTANT: Using cached complete data');
                populateFormFields(instantData.student);
            }
        }
        
        // Then fetch fresh data from MongoDB in background
        loadStudentData();
    }, [loadStudentData]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            // Check file size (500KB = 500 * 1024 bytes)
            const maxSize = 500 * 1024; // 500KB in bytes
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                setFileSizeErrorKB(fileSizeKB);
                setIsFileSizeErrorOpen(true);
                // Clear the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            
            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64String = event.target.result;
                    setProfileImage(base64String);
                    setUploadInfo({ name: file.name, date: new Date().toLocaleDateString('en-GB') });
                    setUploadSuccess(true);
                    setTimeout(() => setUploadSuccess(false), 5000);
                    
                    // Don't update localStorage or other pages until Save is clicked
                    // Changes will only be reflected after clicking Save button
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error converting image to base64:', error);
                alert("Error processing image. Please try again.");
            }
            
            // Changes are only saved to localStorage and other pages when Save button is clicked
        } else {
            alert("Invalid file type. Please upload a JPG file.");
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Don't update localStorage or dispatch event here - only on Save
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            // Get student data from localStorage instead of authService
            const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            console.log('Current studentData from localStorage:', studentData);
            
            if (!studentData) {
                alert('User not authenticated');
                return;
            }

            if (!studentData.id && !studentData._id) {
                console.error('Student ID is missing from localStorage:', studentData);
                alert('Student ID not found. Please log out and log in again.');
                return;
            }

            // Use _id if id is not available (MongoDB format)
            const studentId = studentData.id || studentData._id;

            const formData = new FormData(e.target);
            const updateData = {
                address: formData.get('address') || '',
                city: formData.get('city') || '',
                primaryEmail: formData.get('primaryEmail') || '',
                mobileNo: formData.get('mobileNo') || '',
                fatherOccupation: formData.get('fatherOccupation') || '',
                fatherMobile: formData.get('fatherMobile') || '',
                motherOccupation: formData.get('motherOccupation') || '',
                motherMobile: formData.get('motherMobile') || '',
                guardianName: formData.get('guardianName') || '',
                guardianMobile: formData.get('guardianMobile') || '',
                bloodGroup: formData.get('bloodGroup') || '',
                studyCategory: studyCategory,
                currentYear: formData.get('currentYear') || '',
                currentSemester: formData.get('currentSemester') || '',
                semester1GPA: formData.get('semester1GPA') || '',
                semester2GPA: formData.get('semester2GPA') || '',
                semester3GPA: formData.get('semester3GPA') || '',
                semester4GPA: formData.get('semester4GPA') || '',
                semester5GPA: formData.get('semester5GPA') || '',
                semester6GPA: formData.get('semester6GPA') || '',
                semester7GPA: formData.get('semester7GPA') || '',
                semester8GPA: formData.get('semester8GPA') || '',
                overallCGPA: formData.get('overallCGPA') || '',
                clearedBacklogs: formData.get('clearedBacklogs') || '',
                currentBacklogs: formData.get('currentBacklogs') || '',
                yearOfGap: formData.get('yearOfGap') || '',
                gapReason: formData.get('gapReason') || '',
                residentialStatus: formData.get('residentialStatus') || '',
                quota: formData.get('quota') || '',
                languagesKnown: formData.get('languagesKnown') || '',
                firstGraduate: formData.get('firstGraduate') || '',
                passportNo: formData.get('passportNo') || '',
                skillSet: formData.get('skillSet') || '',
                valueAddedCourses: formData.get('valueAddedCourses') || '',
                aboutSibling: formData.get('aboutSibling') || '',
                rationCardNo: formData.get('rationCardNo') || '',
                familyAnnualIncome: formData.get('familyAnnualIncome') || '',
                willingToSignBond: formData.get('willingToSignBond') || '',
                preferredModeOfDrive: formData.get('preferredModeOfDrive') || '',
                githubLink: formData.get('githubLink') || '',
                linkedinLink: formData.get('linkedinLink') || '',
                companyTypes: formData.get('companyTypes') || '',
                preferredJobLocation: formData.get('preferredJobLocation') || '',
                profilePicURL: profileImage || '',
                profileUploadDate: uploadInfo.date || new Date().toLocaleDateString('en-GB')
            };

            console.log('Update data being sent:', updateData);
            console.log('Student ID being used:', studentId);

            // ⚡ SUPER FAST: Update profile with instant cache update
            console.log('🚀 FAST: Updating profile...');
            const result = await fastDataService.updateProfile(studentId, updateData);
            
            // Update local state immediately
            const updatedStudentData = { ...studentData, ...result.student };
            setStudentData(updatedStudentData);
            
            console.log("✅ INSTANT: Profile updated in MongoDB with cache!");
            
            // Events are automatically dispatched by fastDataService
            
            // Show success popup after a short delay
            setTimeout(() => {
                setPopupOpen(true);
                setIsSaving(false);
            }, 1000);
        } catch (error) {
            console.error("Error updating student data:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            // More specific error messages
            if (error.message.includes('permission')) {
                alert('Permission denied. Please check your MongoDB connection.');
            } else if (error.message.includes('not-found')) {
                alert('Student record not found. Please log out and log in again.');
            } else if (error.message.includes('network')) {
                alert('Network error. Please check your internet connection.');
            } else {
                alert(`Error updating data: ${error.message}\n\nPlease check the console for more details.`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th');
            setDob(null);
            handleImageRemove(new Event('discard'));
            // Optionally, reload original data
            loadStudentData();
        }
    };

    const closePopup = () => setPopupOpen(false);
    
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    return (
        <div className="container">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="main">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'profile'}
                    onViewChange={handleViewChange}
                    studentData={studentData}
                />
                <div className="StuProfile-dashboard-area dashboard-area">
                    <form ref={formRef} onSubmit={handleSave}>
                        {/* --- PERSONAL INFO --- */}
                        <div className="StuProfile-profile-section-container">
                            <h3 className="StuProfile-section-header">Personal Information</h3>
                            <div className="StuProfile-form-grid">
                                <div className="StuProfile-personal-info-fields">
                                        <input type="text" name="firstName" placeholder="First Name" value={studentData?.firstName || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                        <input type="text" name="lastName" placeholder="Last Name" value={studentData?.lastName || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                        <input type="text" name="regNo" placeholder="Register Number" value={studentData?.regNo || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                        <input type="text" name="batch" placeholder="Batch" value={studentData?.batch || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                    <div className="StuProfile-datepicker-wrapper">
                                            <DatePicker 
                                                selected={dob} 
                                                onChange={(date) => setDob(date)} 
                                                dateFormat="dd/MM/yyyy" 
                                                placeholderText="DOB" 
                                                className="StuProfile-datepicker-input" 
                                                wrapperClassName="StuProfile-datepicker-wrapper-inner" 
                                                showPopperArrow={false}
                                                readOnly
                                                disabled
                                                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                                            />
                                    </div>
                                        <select name="degree" value={studentData?.degree || ''} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}>
                                            <option value="" disabled>Degree</option>
                                            <option value="B.E">B.E</option>
                                            <option value="B.Tech">B.Tech</option>
                                        </select>
                                        <input type="text" name="branch" placeholder="Branch" value={studentData?.branch || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                        <select name="currentYear" value={currentYear || studentData?.currentYear || ''} onChange={(e) => {
                                            // Update state to trigger GPA field refresh
                                            setCurrentYear(e.target.value);
                                            setCurrentSemester('');
                                            // Update studentData to trigger semester dropdown refresh
                                            const updatedData = { ...studentData, currentYear: e.target.value, currentSemester: '' };
                                            setStudentData(updatedData);
                                        }}>
                                            <option value="" disabled>Current Year</option>
                                            <option value="I">I</option>
                                            <option value="II">II</option>
                                            <option value="III">III</option>
                                            <option value="IV">IV</option>
                                        </select>
                                        <select name="currentSemester" value={currentSemester || studentData?.currentSemester || ''} onChange={(e) => {
                                            // Update state to trigger GPA field refresh
                                            setCurrentSemester(e.target.value);
                                            // Update studentData to trigger GPA field refresh
                                            const updatedData = { ...studentData, currentSemester: e.target.value };
                                            setStudentData(updatedData);
                                        }}>
                                            <option value="" disabled>Current Semester</option>
                                            {getAvailableSemesters(currentYear).map(sem => (
                                                <option key={sem} value={sem}>{sem}</option>
                                            ))}
                                        </select>
                                        <select name="gender" value={studentData?.gender || ''} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}>
                                            <option value="" disabled>Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                        <input type="text" name="address" placeholder="Address" defaultValue={studentData?.address || ''} />
                                        <input type="text" name="city" placeholder="City" defaultValue={studentData?.city || ''} />
                                        <input type="email" name="primaryEmail" placeholder="Primary Mail id" defaultValue={studentData?.primaryEmail || ''} />
                                        <input type="email" name="domainEmail" placeholder="Domain Mail id" value={studentData?.domainEmail || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                        <input type="tel" name="mobileNo" placeholder="Mobile No." defaultValue={studentData?.mobileNo || ''} />
                                        <input type="text" name="fatherName" placeholder="Father Name" value={studentData?.fatherName || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                        <input type="text" name="fatherOccupation" placeholder="Father Occupation" defaultValue={studentData?.fatherOccupation || ''} />
                                        <input type="text" name="fatherMobile" placeholder="Father Mobile No." defaultValue={studentData?.fatherMobile || ''} />
                                        <input type="text" name="motherName" placeholder="Mother Name" value={studentData?.motherName || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                        <input type="text" name="motherOccupation" placeholder="Mother Occupation" defaultValue={studentData?.motherOccupation || ''} />
                                        <input type="text" name="guardianName" placeholder="Guardian Name" defaultValue={studentData?.guardianName || ''} />
                                        <input type="text" name="guardianMobile" placeholder="Guardian Number" defaultValue={studentData?.guardianMobile || ''} />
                                        <input type="text" name="bloodGroup" placeholder="Blood Group" defaultValue={studentData?.bloodGroup || ''}/>
                                        <input type="text" name="aadhaarNo" placeholder="Aadhaar Number" value={studentData?.aadhaarNo || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/>
                                </div>
                                <div className="StuProfile-profile-photo-wrapper">
                                    <div className="StuProfile-profile-photo-box" style={{ height: '675px' }}>
                                        <h3 className="StuProfile-section-header">Profile Photo</h3>
                                        <div className="StuProfile-profile-icon-container">
                                            {profileImage ? ( <img src={profileImage} alt="Profile Preview" className="StuProfile-profile-preview-img" onClick={() => setImagePreviewOpen(true)} /> ) : ( <GraduationCapIcon /> )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className="StuProfile-upload-info-container">
                                                <div className="StuProfile-upload-info-item"><FileIcon /><span>{uploadInfo.name}</span></div>
                                                <div className="StuProfile-upload-info-item"><CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span></div>
                                            </div>
                                        )}
                                        <div className="StuProfile-upload-action-area">
                                            <div className="StuProfile-upload-btn-wrapper">
                                                <label htmlFor="photo-upload-input" className="StuProfile-profile-upload-btn"><div className="StuProfile-upload-btn-content"><MdUpload /><span>Upload (Max 500 KB)</span></div></label>
                                                {profileImage && ( <button onClick={handleImageRemove} className="StuProfile-remove-image-btn" aria-label="Remove image"><IoMdClose /></button> )}
                                            </div>
                                            <input type="file" id="photo-upload-input" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg" onChange={handleImageUpload} />
                                            {uploadSuccess && ( <p className="StuProfile-upload-success-message">Profile Photo uploaded Successfully!</p> )}
                                            <p className="StuProfile-upload-hint">*Only JPG format is allowed.</p>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <input type="text" name="motherMobile" placeholder="Mother Mobile No." defaultValue={studentData?.motherMobile || ''} />    
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <select name="community" value={studentData?.community || ''} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                    <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}>
                                            <option value="" disabled>Medium of study</option>
                                            <option value="English">English</option>
                                            <option value="Tamil">Tamil</option>
                                            <option value="Other">Others</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className="StuProfile-profile-section-container">
                           <h3 className="StuProfile-section-header">Academic Background</h3>
                            <div className="StuProfile-form-grid">
                                <div className="StuProfile-study-category" style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                    <label htmlFor="12th" style={{color: studyCategory === '12th' ? '#ffffff' : '#666', cursor: 'not-allowed', fontWeight: studyCategory === '12th' ? '700' : '400', backgroundColor: studyCategory === '12th' ? '#1976d2' : 'transparent', padding: '8px 16px', borderRadius: '6px'}}>12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                    <label htmlFor="diploma" style={{color: studyCategory === 'diploma' ? '#ffffff' : '#666', cursor: 'not-allowed', fontWeight: studyCategory === 'diploma' ? '700' : '400', backgroundColor: studyCategory === 'diploma' ? '#1976d2' : 'transparent', padding: '8px 16px', borderRadius: '6px'}}>Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                    <label htmlFor="both" style={{color: studyCategory === 'both' ? '#ffffff' : '#666', cursor: 'not-allowed', fontWeight: studyCategory === 'both' ? '700' : '400', backgroundColor: studyCategory === 'both' ? '#1976d2' : 'transparent', padding: '8px 16px', borderRadius: '6px'}}>Both</label>
                                </div>
                                    <input type="text" name="tenthInstitution" placeholder="10th Institution Name" value={studentData?.tenthInstitution || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                    <select name="tenthBoard" value={studentData?.tenthBoard || ''} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}><option value="" disabled>10th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                    <input type="text" name="tenthPercentage" placeholder="10th Percentage" value={studentData?.tenthPercentage || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                    <input type="text" name="tenthYear" placeholder="10th Year of Passing" value={studentData?.tenthYear || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} />
                                    {(studyCategory === '12th' || studyCategory === 'both') && ( <> <input type="text" name="twelfthInstitution" placeholder="12th Institution Name" value={studentData?.twelfthInstitution || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> <select name="twelfthBoard" value={studentData?.twelfthBoard || ''} disabled style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select> <input type="text" name="twelfthPercentage" placeholder="12th Percentage" value={studentData?.twelfthPercentage || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> <input type="text" name="twelfthYear" placeholder="12th Year of Passing" value={studentData?.twelfthYear || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> <input type="text" name="twelfthCutoff" placeholder="12th Cut-off Marks" value={studentData?.twelfthCutoff || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> </> )}
                                    {(studyCategory === 'diploma' || studyCategory === 'both') && ( <> <input type="text" name="diplomaInstitution" placeholder="Diploma Institution" value={studentData?.diplomaInstitution || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> <input type="text" name="diplomaBranch" placeholder="Diploma Branch" value={studentData?.diplomaBranch || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> <input type="text" name="diplomaPercentage" placeholder="Diploma Percentage" value={studentData?.diplomaPercentage || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> <input type="text" name="diplomaYear" placeholder="Diploma Year of Passing" value={studentData?.diplomaYear || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/> </> )}
                            </div>
                        </div>
                        
                            {/* --- SEMESTER & OTHER DETAILS --- */}
                        <div className="StuProfile-profile-section-container">
                            <h3 className="StuProfile-section-header">Semester</h3>
                            <div className="StuProfile-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'start' }}>
                                    {/* Dynamic GPA fields based on current year and semester */}
                                    {getAllGPAFields().map(field => {
                                        const semesterNumber = field.replace('semester', '').replace('GPA', '');
                                        const isRequired = getRequiredGPAFields().includes(field);
                                        return (
                                            <input 
                                                key={field}
                                                type="text" 
                                                name={field} 
                                                placeholder={`Semester ${semesterNumber} GPA ${isRequired ? '*' : ''}`} 
                                                defaultValue={studentData?.[field] || ''} 
                                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}
                                            />
                                        );
                                    })}
                                    
                                    {/* Always show overall CGPA */}
                                    <input type="text" name="overallCGPA" placeholder="Overall CGPA" defaultValue={studentData?.overallCGPA || ''} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}/>
                                    <input type="text" name="clearedBacklogs" placeholder="No. of Backlogs (Cleared)" defaultValue={studentData?.clearedBacklogs || ''} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}/>
                                    <input type="text" name="currentBacklogs" placeholder="No of Current Backlog (Arrear)" defaultValue={studentData?.currentBacklogs || ''} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}/>
                                    <input type="text" name="yearOfGap" placeholder="Year of Gap" defaultValue={studentData?.yearOfGap || ''} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }}/>
                                    <input type="text" name="gapReason" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} defaultValue={studentData?.gapReason || ''}/>
                            </div>
                        </div>
                        <div className="StuProfile-profile-section-container">
                            <h3 className="StuProfile-section-header">Other Details</h3>
                            <div className="StuProfile-form-grid">
                                    <select name="residentialStatus" value={studentData?.residentialStatus || ''}><option value="" disabled>Residential status</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                                    <select name="quota" value={studentData?.quota || ''}><option value="" disabled>Quota</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                                    <input type="text" name="languagesKnown" placeholder="Languages Known" defaultValue={studentData?.languagesKnown || ''}/>
                                    <select name="firstGraduate" value={studentData?.firstGraduate || ''}><option value="" disabled>First Graduate</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                    <input type="text" name="passportNo" placeholder="Passport No." defaultValue={studentData?.passportNo || ''}/>
                                    <input type="text" name="skillSet" placeholder="Skill set" defaultValue={studentData?.skillSet || ''}/>
                                    <input type="text" name="valueAddedCourses" placeholder="Value Added Courses" defaultValue={studentData?.valueAddedCourses || ''}/>
                                    <input type="text" name="aboutSibling" placeholder="About sibling" defaultValue={studentData?.aboutSibling || ''}/>
                                    <input type="text" name="rationCardNo" placeholder="Ration card No." value={studentData?.rationCardNo || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/>
                                    <input type="text" name="familyAnnualIncome" placeholder="Family Annual Income" defaultValue={studentData?.familyAnnualIncome || ''}/>
                                    <input type="text" name="panNo" placeholder="PAN No." value={studentData?.panNo || ''} readOnly style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}/>
                                    <select name="willingToSignBond" value={studentData?.willingToSignBond || ''}><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                    <select name="preferredModeOfDrive" value={studentData?.preferredModeOfDrive || ''}><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                                    <input type="text" name="githubLink" placeholder="GitHub Link" defaultValue={studentData?.githubLink || ''}/>
                                    <input type="text" name="linkedinLink" placeholder="LinkedIn Profile Link" defaultValue={studentData?.linkedinLink || ''}/>
                                    <select name="companyTypes" value={studentData?.companyTypes || ''}><option value="" disabled>Types of companies</option><option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="MNC">MNC</option><option value="Startup">Startup</option><option value="Government/Public Sector">Government/Public Sector</option><option value="Non-Profit">Non-Profit</option><option value="Other">Other</option></select>
                                    <select name="preferredJobLocation" value={studentData?.preferredJobLocation || ''}><option value="" disabled>Preferred job location</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Bengaluru">Bengaluru</option><option value="Hyderabad">Hyderabad</option><option value="North India">North India</option></select>
                            </div>
                        </div>
                        
                        <div className="StuProfile-action-buttons">
                            <button type="button" className="StuProfile-discard-btn" onClick={handleDiscard} disabled={isSaving}>Discard</button>
                            <button type="submit" className="StuProfile-save-btn" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <div className="StuProfile-loading-spinner"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <FileSizeErrorPopup 
                isOpen={isFileSizeErrorOpen} 
                onClose={() => setIsFileSizeErrorOpen(false)} 
                fileSizeKB={fileSizeErrorKB} 
            />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default StuProfile;