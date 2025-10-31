import React, { useState, useRef, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import './StuProfile.css';
import Adminicons from '../assets/BlueAdminicon.png';
import mongoDBService from '../services/mongoDBService.js';

// NEW: Import centralized alert system
import { SuccessAlert, ErrorAlert, useAlert } from '../components/alerts';

// Helper components (keep these as they are specific icons)
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

// REMOVED: Old popup components (SuccessPopup, FileSizeErrorPopup, ImagePreviewModal)
// These are now replaced with centralized alert system

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
    // REMOVED: const [isPopupOpen, setPopupOpen] = useState(false);
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
    // REMOVED: const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    // REMOVED: const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');

    // NEW: Use centralized alert system
    const { alerts, showSuccess, showError, closeAlert } = useAlert();

    // Function to get available semesters based on selected year
    const getAvailableSemesters = (year) => {
        const semesterMap = {
            'I': ['1', '2'],
            'II': ['3', '4'],
            'III': ['5', '6'],
            'IV': ['7', '8']
        };
        return semesterMap[year] || [];
    };

    // Function to get required GPA fields based on current year and semester
    const getRequiredGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        
        const semesterNum = parseInt(currentSemester);
        const requiredFields = [];
        
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 7; i++) {
                requiredFields.push(`semester${i}GPA`);
            }
            return requiredFields;
        }
        
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
        
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 8; i++) {
                allFields.push(`semester${i}GPA`);
            }
            return allFields;
        }
        
        for (let i = 1; i <= semesterNum; i++) {
            allFields.push(`semester${i}GPA`);
        }
        
        return allFields;
    };

    const populateFormFields = (data) => {
        console.log('🔍 Populating form fields with data:', data);
        
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
            const storedRegNo = localStorage.getItem('studentRegNo');
            const storedDob = localStorage.getItem('studentDob');
            
            if (!storedRegNo || !storedDob) {
                console.log('No login credentials found');
                showError("Authentication Required", "Please log in to view your profile.");
                return;
            }
            
            console.log('Fetching student data from MongoDB with credentials:', { regNo: storedRegNo, dob: storedDob });
            
            const mongoDBService = (await import('../services/mongoDBService.js')).default;
            const studentData = await mongoDBService.getStudentByRegNoAndDob(storedRegNo, storedDob);
            
            if (studentData) {
                console.log('Successfully fetched student data from MongoDB:', studentData);
                
                if (studentData._id && !studentData.id) {
                    studentData.id = studentData._id;
                }
                
                populateFormFields(studentData);
            } else {
                console.log('No student data found in MongoDB');
                showError("Data Not Found", "Student data not found. Please check your registration.");
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            
            // NEW: Better error handling with centralized alerts
            if (error.message.includes('fetch') || error.message.includes('network')) {
                showError("Network Error", "Please check your internet connection and try again.");
            } else if (error.message.includes('404')) {
                showError("Student Not Found", "Please ensure you are logged in correctly.");
            } else {
                showError("Loading Error", "Error loading profile data. Please try refreshing the page or contact support if the issue persists.");
            }
        }
    }, [showError]);

    useEffect(() => {
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData) {
            console.log('Loading student data from localStorage for instant display:', storedStudentData);
            populateFormFields(storedStudentData);
        }
        
        loadStudentData();
    }, [loadStudentData]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            const maxSize = 500 * 1024; // 500KB in bytes
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                // NEW: Use centralized error alert instead of custom popup
                showError(
                    "Image Too Large!", 
                    `Maximum allowed: 500KB\nYour image size: ${fileSizeKB}KB\n\nPlease compress your image or choose a smaller file.`
                );
                
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            
            try {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64String = event.target.result;
                    setProfileImage(base64String);
                    setUploadInfo({ name: file.name, date: new Date().toLocaleDateString('en-GB') });
                    setUploadSuccess(true);
                    setTimeout(() => setUploadSuccess(false), 5000);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error converting image to base64:', error);
                showError("Processing Error", "Error processing image. Please try again.");
            }
        } else {
            showError("Invalid File Type", "Please upload a JPG file only.");
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            console.log('Current studentData from localStorage:', studentData);
            
            if (!studentData) {
                showError("Authentication Error", "User not authenticated. Please log in again.");
                return;
            }

            if (!studentData.id && !studentData._id) {
                console.error('Student ID is missing from localStorage:', studentData);
                showError("ID Missing", "Student ID not found. Please log out and log in again.");
                return;
            }

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

            await mongoDBService.updateStudent(studentId, updateData);
            
            const updatedStudentData = { ...studentData, ...updateData };
            setStudentData(updatedStudentData);
            
            localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
            
            console.log("Student data updated in MongoDB!");
            
            window.dispatchEvent(new CustomEvent('profileUpdated'));
            
            // NEW: Use centralized success alert instead of custom popup
            setTimeout(() => {
                showSuccess("Changes Saved!", "Your details have been successfully saved in the Portal.");
                setIsSaving(false);
            }, 1000);
            
        } catch (error) {
            console.error("Error updating student data:", error);
            
            // NEW: Better error handling with centralized alerts
            if (error.message.includes('permission')) {
                showError("Permission Denied", "Please check your MongoDB connection.");
            } else if (error.message.includes('not-found')) {
                showError("Record Not Found", "Student record not found. Please log out and log in again.");
            } else if (error.message.includes('network')) {
                showError("Network Error", "Please check your internet connection.");
            } else {
                showError("Update Failed", `Error updating data: ${error.message}\n\nPlease check the console for more details.`);
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
            loadStudentData();
        }
    };

    // REMOVED: const closePopup = () => setPopupOpen(false);
    
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
                    onViewChange={handleViewChange}
                />
                
                {/* REST OF THE COMPONENT JSX REMAINS THE SAME */}
                {/* ... (form content) ... */}
                
                {/* NEW: Centralized Alert Components */}
                <SuccessAlert
                    isOpen={alerts.success.isOpen}
                    onClose={() => closeAlert('success')}
                    title={alerts.success.title}
                    message={alerts.success.message}
                />

                <ErrorAlert
                    isOpen={alerts.error.isOpen}
                    onClose={() => closeAlert('error')}
                    title={alerts.error.title}
                    message={alerts.error.message}
                />

                {/* Keep ImagePreviewModal as it's a specific modal, not an alert */}
                <ImagePreviewModal 
                    src={profileImage} 
                    isOpen={isImagePreviewOpen} 
                    onClose={() => setImagePreviewOpen(false)} 
                />
            </div>
        </div>
    );
}

export default StuProfile;
