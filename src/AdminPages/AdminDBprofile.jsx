import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate

import Navbar from '../components/Navbar/Adnavbar.js';
import Sidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdminDBprofile.module.css'; 
import { PreviewProgressAlert } from '../components/alerts/DownloadPreviewAlerts.js';

import Adminicons from '../assets/AdmingreenCapicon.svg';

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

const EyeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#4563fd" strokeWidth="2"/>
        <circle cx="12" cy="12" r="2" stroke="#4563fd" strokeWidth="2"/>
    </svg>
);

// --- Icons copied from AdminstudDB.js ---
const PopupBlockIcon = () => (
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
);

const PopupUnblockIcon = () => (
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#D2AF3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
);
// --- End of copied icons ---

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(18,18,34,0.11)',
            zIndex: 1000,
        }}>
            <div className={styles['Admin-DB-AdProfile-popup-container']}>
                <div className={styles['Admin-DB-AdProfile-popup-header']}>Saved !</div>
                <div className={styles['Admin-DB-AdProfile-popup-body']}>
                    <svg className={styles['Admin-DB-AdProfile-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-DB-AdProfile-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={styles['Admin-DB-AdProfile-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Changes Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className={styles['Admin-DB-AdProfile-popup-footer']}>
                    <button onClick={onClose} className={styles['Admin-DB-AdProfile-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW Block/Unblock Success Popups (using Admin-DB- styling from AdminstudDB.css) ---
const BlockSuccessPopup = ({ onClose }) => {
    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(18,18,34,0.11)',
            zIndex: 1000,
        }}>
            <div className={styles['Admin-DB-popup-container']}>
                <div className={styles['Admin-DB-popup-header']}>Blocked !</div>
                <div className={styles['Admin-DB-popup-body']}>
                    <div className={styles['Admin-DB-popup-icon-box']}>
                        <PopupBlockIcon />
                    </div>
                    <h2>Student Blocked ✓</h2>
                    <p>The selected Student</p>
                    <p>has been Blocked Successfully!</p>
                    <button className={styles['Admin-DB-popup-btn']} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

const UnblockSuccessPopup = ({ onClose }) => {
    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(18,18,34,0.11)',
            zIndex: 1000,
        }}>
            <div className={styles['Admin-DB-popup-container']}>
                <div className={styles['Admin-DB-popup-header']}>Unblocked !</div>
                <div className={styles['Admin-DB-popup-body']}>
                    <div className={styles['Admin-DB-popup-icon-box']}>
                        <PopupUnblockIcon />
                    </div>
                    <h2>Student Unblocked ✓</h2>
                    <p>The selected Student</p>
                    <p>has been Unblocked Successfully!</p>
                    <button className={styles['Admin-DB-popup-btn']} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
// --- End of new popups ---

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles['Admin-DB-AdProfile-image-preview-overlay']} onClick={onClose}>
            <div className={styles['Admin-DB-AdProfile-image-preview-container']} onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className={styles['Admin-DB-AdProfile-image-preview-content']} />
                <button onClick={onClose} className={styles['Admin-DB-AdProfile-image-preview-close-btn']}>&times;</button>
            </div>
        </div>
    );
};

function AdminAdProfile({ onLogout, onViewChange }) { 
    const { studentId } = useParams(); 
    const location = useLocation(); 
    const navigate = useNavigate(); // Initialize useNavigate

    // Determine if we are in EDIT mode
    const isEditable = location.state?.mode === 'edit';

    const [studyCategory, setStudyCategory] = useState('12th');
    const [studentData, setStudentData] = useState(null);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    
    // --- UPDATED ---
    // New State for Block Status (False = Active/Not Blocked, True = Blocked)
    // Initialize state from location.state.isBlocked, default to false if not provided
    const [isBlocked, setIsBlocked] = useState(location.state?.isBlocked || false);

    // --- NEW STATE for Block/Unblock Popups ---
    const [blockPopupState, setBlockPopupState] = useState(null); // null, 'blocked', 'unblocked'

    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [deletePopupState, setDeletePopupState] = useState(null); // null | 'confirm' | 'success'
    const [loginPwdValue, setLoginPwdValue] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            if (profileImage) URL.revokeObjectURL(profileImage);
            setProfileImage(URL.createObjectURL(file));
            setUploadInfo({ name: file.name, date: new Date().toLocaleDateString('en-GB') });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
        } else {
            alert("Invalid file type. Please upload a JPG file.");
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        if (profileImage) URL.revokeObjectURL(profileImage);
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const pwd = formData.get('loginPassword') || '';
        const confirmPwd = formData.get('confirmLoginPassword') || '';
        if (pwd && confirmPwd && pwd !== confirmPwd) {
            alert('Login password and confirm password do not match.');
            return;
        }
        try {
            const fastDataService = (await import('../services/fastDataService.jsx')).default;
            const payload = {
                address: formData.get('address') || '',
                city: formData.get('city') || '',
                primaryEmail: formData.get('primaryEmail') || '',
                mobileNo: formData.get('mobileNo') || '',
                fatherOccupation: formData.get('fatherOccupation') || '',
                fatherMobile: formData.get('fatherMobile') || '',
                motherOccupation: formData.get('motherOccupation') || '',
                motherMobile: formData.get('motherMobile') || '',
                bloodGroup: formData.get('bloodGroup') || '',
                community: formData.get('community') || '',
                mediumOfStudy: formData.get('mediumOfStudy') || '',
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
                panNo: formData.get('panNo') || '',
                willingToSignBond: formData.get('willingToSignBond') || '',
                preferredModeOfDrive: formData.get('preferredModeOfDrive') || '',
                githubLink: formData.get('githubLink') || '',
                linkedinLink: formData.get('linkedinLink') || '',
                companyTypes: formData.get('companyTypes') || '',
                preferredJobLocation: formData.get('preferredJobLocation') || '',
                loginRegNo: formData.get('loginRegNo') || studentData?.regNo || '',
                loginPassword: pwd || ''
            };

            const result = await fastDataService.updateProfile(studentId, payload);
            const updated = { ...studentData, ...result.student };
            setStudentData(updated);

            const updateData = JSON.stringify({ id: studentId, blocked: isBlocked });
            sessionStorage.setItem('studentUpdate', updateData);

            setPopupOpen(true);
        } catch (err) {
            alert('Failed to save: ' + (err.message || 'Unknown error'));
        }
    };

    const closePopup = () => {
        setPopupOpen(false);
        // Redirect back to AdminstudDB.js (previous page) after closing popup
        navigate(-1);
    };

    const handleDiscard = () => {
        if (formRef.current) {
            // 1. Reset Form Fields
            formRef.current.reset();
            // 2. Reset Local States
            setStudyCategory('12th');
            setDob(null);
            // Reset block status to its original loaded state
            setIsBlocked(location.state?.isBlocked || false); 
            // 3. Reset Image
            handleImageRemove(new Event('discard'));
        }
    };

    // --- Toggle Block Status ---
    const handleToggleBlock = async () => {
        const newBlockedState = !isBlocked;
        try {
            const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
            await mongoDBService.updateStudent(studentId, { blocked: newBlockedState, isBlocked: newBlockedState });
            setIsBlocked(newBlockedState);

            // Save update to sessionStorage so list page reflects immediately
            const updateData = JSON.stringify({ id: studentId, blocked: newBlockedState });
            sessionStorage.setItem('studentUpdate', updateData);

            setBlockPopupState(newBlockedState ? 'blocked' : 'unblocked');
        } catch (e) {
            alert('Failed to update block status: ' + (e.message || 'Unknown error'));
        }
    };

    // --- Close handler for Block/Unblock Popups ---
    const closeBlockPopup = () => {
        setBlockPopupState(null);
        navigate(-1); // Navigate back to the student list
    };
    
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const fastDataService = (await import('../services/fastDataService.jsx')).default;
                const complete = await fastDataService.getCompleteStudentData(studentId, false);
                const data = complete?.student || null;
                if (data) {
                    const normalized = {
                        section: data.section || data.Section || data.sec || data.sectionName || '',
                        community: data.community || data.Community || '',
                        mediumOfStudy: data.mediumOfStudy || data.medium || '',
                        degree: data.degree || data.course || '',
                        branch: data.branch || data.department || '',
                        currentYear: data.currentYear || data.year || '',
                        currentSemester: data.currentSemester || data.semester || '',
                        willingToSignBond: data.willingToSignBond || data.willingtosignbond || '',
                        preferredModeOfDrive: data.preferredModeOfDrive || data.preferredMode || '',
                        companyTypes: data.companyTypes || data.companyType || '',
                        preferredJobLocation: data.preferredJobLocation || data.jobLocation || ''
                    };
                    const merged = { ...data, ...normalized };
                    setStudentData(merged);
                    setStudyCategory(merged.studyCategory || '12th');
                    setCurrentYear(merged.currentYear || '');
                    setCurrentSemester(merged.currentSemester || '');
                    setIsBlocked(!!merged.isBlocked);
                    if (merged.dob) {
                        const dobStr = merged.dob.toString();
                        if (dobStr.length === 8) {
                            const day = dobStr.substring(0, 2);
                            const month = dobStr.substring(2, 4);
                            const year = dobStr.substring(4, 8);
                            setDob(new Date(year, month - 1, day));
                        }
                    }
                    if (merged.profilePicURL) {
                        setProfileImage(merged.profilePicURL);
                        setUploadInfo({ name: 'profile.jpg', date: merged.profileUploadDate || new Date().toLocaleDateString('en-GB') });
                    }
                    setLoginPwdValue(merged.loginPassword || '');
                }
            } catch (e) {
                console.warn('AdminDBprofile load error', e);
            } finally {
                setIsInitialLoading(false);
                setLoadingProgress(100);
            }
        };
        let interval;
        setLoadingProgress(0);
        interval = setInterval(() => setLoadingProgress(p => (p >= 85 ? p : p + 10)), 150);
        load();
        return () => { if (interval) clearInterval(interval); };
    }, [studentId, location.state]);

    const handleConfirmDelete = async () => {
        try {
            const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
            await mongoDBService.deleteStudent(studentId);
            setDeletePopupState('success');
            setTimeout(() => navigate('/admin-student-database'), 1200);
        } catch (err) {
            alert('Delete failed: ' + (err.message || 'Unknown error'));
            setDeletePopupState(null);
        }
    };

    const DeleteConfirmPopup = ({ isOpen, onCancel, onConfirm }) => {
        if (!isOpen) return null;
        return (
            <div style={{
                minHeight: '100vh',
                width: '100vw',
                position: 'fixed',
                left: 0,
                top: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(18,18,34,0.11)',
                zIndex: 1000,
            }}>
                <div className={styles['Admin-DB-AdProfile-popup-container']}>
                    <div className={styles['Admin-DB-AdProfile-popup-header']} style={{ backgroundColor: '#2E7D32' }}>Delete Student</div>
                    <div className={styles['Admin-DB-AdProfile-popup-body']}>
                        <p style={{ fontSize: '16px', color: '#333' }}>Are you sure you want to delete this student?</p>
                        <p style={{ fontSize: '14px', color: '#666' }}>This action cannot be undone.</p>
                    </div>
                    <div className={styles['Admin-DB-AdProfile-popup-footer']} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button onClick={onCancel} className={styles['Admin-DB-AdProfile-popup-close-btn']}>Cancel</button>
                        <button onClick={onConfirm} className={styles['Admin-DB-AdProfile-delete-btn']}>Delete</button>
                    </div>
                </div>
            </div>
        );
    };

    const DeleteSuccessPopup = ({ isOpen }) => {
        if (!isOpen) return null;
        return (
            <div style={{
                minHeight: '100vh',
                width: '100vw',
                position: 'fixed',
                left: 0,
                top: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(18,18,34,0.11)',
                zIndex: 1000,
            }}>
                <div className={styles['Admin-DB-AdProfile-popup-container']}>
                    <div className={styles['Admin-DB-AdProfile-popup-header']} style={{ backgroundColor: '#2E7D32' }}>Deleted</div>
                    <div className={styles['Admin-DB-AdProfile-popup-body']}>
                        <h2>Student Deleted ✓</h2>
                        <p>Record has been removed.</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles['Admin-DB-AdProfile-container']}> 

            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles['Admin-DB-AdProfile-main']}> 

                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'profile'}
                    onViewChange={handleViewChange}
                />
                <div className={styles['Admin-DB-AdProfile-dashboard-area'] + ' dashboard-area'}>
                    {isInitialLoading && (
                        <PreviewProgressAlert 
                            isOpen={true} 
                            progress={loadingProgress} 
                            title="Loading..." 
                            messages={{ initial: 'Fetching student from database...', mid: 'Preparing profile...', final: 'Opening profile...' }}
                            color="#2E7D32"
                            progressColor="#2E7D32"
                        />
                    )}
                    <DeleteConfirmPopup 
                        isOpen={deletePopupState === 'confirm'} 
                        onCancel={() => setDeletePopupState(null)} 
                        onConfirm={handleConfirmDelete} 
                    />
                    <DeleteSuccessPopup isOpen={deletePopupState === 'success'} />

                    
                    <form ref={formRef} onSubmit={handleSave}>
                        {/* --- PERSONAL INFO --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Personal Information</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <div className={styles['Admin-DB-AdProfile-personal-info-fields']}>
                                    <input type="text" name="firstName" placeholder="First Name" value={studentData?.firstName || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <input type="text" name="lastName" placeholder="Last Name" value={studentData?.lastName || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <input type="text" name="regNo" placeholder="Register Number (11 digits)" value={studentData?.regNo || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <select name="batch" value={studentData?.batch || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}>
                                        <option value="" disabled>Batch</option>
                                        <option value="2021-2025">2021-2025</option>
                                        <option value="2022-2026">2022-2026</option>
                                        <option value="2023-2027">2023-2027</option>
                                        <option value="2024-2028">2024-2028</option>
                                    </select>
                                    <div className={styles['Admin-DB-AdProfile-datepicker-wrapper']}>
                                        <DatePicker 
                                            selected={dob} 
                                            onChange={(date) => setDob(date)} 
                                            dateFormat="dd/MM/yyyy" 
                                            placeholderText="DOB" 
                                            className={styles['Admin-DB-AdProfile-datepicker-input']} 
                                            wrapperClassName={styles['Admin-DB-AdProfile-datepicker-wrapper-inner']} 
                                            showPopperArrow={false} 
                                            disabled 
                                        />
                                    </div>
                                    <select name="degree" value={studentData?.degree || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Degree</option><option value="B.E">B.E</option><option value="B.Tech">B.Tech</option></select>
                                    <input type="text" name="branch" placeholder="Branch" value={studentData?.branch || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <select name="gender" value={studentData?.gender || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Gender</option><option value="male">Male</option><option value="female">Female</option></select>
                                    <select name="currentYear" value={currentYear || studentData?.currentYear || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Current Year</option><option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option></select>
                                    <select name="section" value={studentData?.section || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Section</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
                                    <select name="currentSemester" value={currentSemester || studentData?.currentSemester || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Current Semester</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option></select>
                                    <input type="text" name="address" placeholder="Address" defaultValue={studentData?.address || ''} disabled={!isEditable} />
                                    <input type="text" name="city" placeholder="City" defaultValue={studentData?.city || ''} disabled={!isEditable} />
                                    <input type="email" name="primaryEmail" placeholder="Primary Mail id" defaultValue={studentData?.primaryEmail || ''} disabled={!isEditable} />
                                    <input type="email" name="domainEmail" placeholder="Domain Mail id" value={studentData?.domainEmail || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <input type="tel" name="mobileNo" placeholder="Mobile No." defaultValue={studentData?.mobileNo || ''} disabled={!isEditable} />
                                    <input type="text" name="aadhaarNo" placeholder="Aadhaar Number" value={studentData?.aadhaarNo || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <input type="text" name="fatherName" placeholder="Father Name" value={studentData?.fatherName || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <input type="text" name="fatherMobile" placeholder="Father Mobile No." defaultValue={studentData?.fatherMobile || ''} disabled={!isEditable} />
                                    <input type="text" name="fatherOccupation" placeholder="Father Occupation" defaultValue={studentData?.fatherOccupation || ''} disabled={!isEditable} />
                                    <input type="text" name="motherName" placeholder="Mother Name" value={studentData?.motherName || ''} disabled className={styles['Admin-DB-AdProfile-readonly']} />
                                    <input type="text" name="motherMobile" placeholder="Mother Mobile No." defaultValue={studentData?.motherMobile || ''} disabled={!isEditable} />
                                    <input type="text" name="motherOccupation" placeholder="Mother Occupation" defaultValue={studentData?.motherOccupation || ''} disabled={!isEditable} />
                                    <input type="text" name="bloodGroup" placeholder="Blood Group" defaultValue={studentData?.bloodGroup || ''} disabled={!isEditable} />
                                    <select name="community" value={studentData?.community || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                    <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                                </div>
                                <div className={styles['Admin-DB-AdProfile-profile-photo-wrapper']}>
                                    <div className={styles['Admin-DB-AdProfile-profile-photo-box']} style={{ height: '675px' }}>
                                        <h3 className={styles['Admin-DB-AdProfile-section-header']}>Profile Photo</h3>
                                        <div className={styles['Admin-DB-AdProfile-profile-icon-container']}>
                                            {profileImage ? ( <img src={profileImage} alt="Profile Preview" className={styles['Admin-DB-AdProfile-profile-preview-img']} onClick={() => setImagePreviewOpen(true)} /> ) : ( <GraduationCapIcon /> )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className={styles['Admin-DB-AdProfile-upload-info-container']}>
                                                <div className={styles['Admin-DB-AdProfile-upload-info-item']}><FileIcon /><span>{uploadInfo.name}</span></div>
                                                <div className={styles['Admin-DB-AdProfile-upload-info-item']}><CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span></div>
                                            </div>
                                        )}
                                        {isEditable && (
                                            <div className={styles['Admin-DB-AdProfile-upload-action-area']}>
                                                <div className={styles['Admin-DB-AdProfile-upload-btn-wrapper']}>
                                                    <label htmlFor="photo-upload-input" className={styles['Admin-DB-AdProfile-profile-upload-btn']}><div className={styles['Admin-DB-AdProfile-upload-btn-content']}><MdUpload /><span>Upload (Max 500 KB)</span></div></label>
                                                    {profileImage && ( <button onClick={handleImageRemove} className={styles['Admin-DB-AdProfile-remove-image-btn']} aria-label="Remove image"><IoMdClose /></button> )}
                                                </div>
                                                <input type="file" id="photo-upload-input" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg" onChange={handleImageUpload} />
                                                {uploadSuccess && ( <p className={styles['Admin-DB-AdProfile-upload-success-message']}>Profile Photo uploaded Successfully!</p> )}
                                                <p className={styles['Admin-DB-AdProfile-upload-hint']}>*Only JPG format is allowed.</p>
                                            </div>
                                        )}
                                        <div className={styles['Admin-DB-AdProfile-form-grid']} style={{ marginTop: '1rem' }}>
                                            <select name="community" value={studentData?.community || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                            <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} disabled className={styles['Admin-DB-AdProfile-readonly']}><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                                        </div>
                                    </div>
                                </div>
                            
                        </div>
                        {isInitialLoading && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <style>{`@keyframes tableSpin{to{transform:rotate(360deg)}}`}</style>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '5px solid #bfe0c5', borderTopColor: '#2E7D32', animation: 'tableSpin 0.8s linear infinite' }} />
                                    <div style={{ marginTop: '8px', color: '#1b5e20', fontWeight: 600, fontSize: '13px' }}>
                                        Fetching from database...
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Academic Background</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <div className={styles['Admin-DB-AdProfile-study-category']} style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="12th" style={{ cursor: !isEditable ? 'default' : 'pointer' }}>12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="diploma" style={{ cursor: !isEditable ? 'default' : 'pointer' }}>Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="both" style={{ cursor: !isEditable ? 'default' : 'pointer' }}>Both</label>
                                </div>
                                <input type="text" name="tenthInstitution" placeholder="10th Institution Name" defaultValue={studentData?.tenthInstitution || ''} disabled={!isEditable} />
                                <select name="tenthBoard" value={studentData?.tenthBoard || ''} disabled={!isEditable}><option value="" disabled>10th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                <input type="text" name="tenthPercentage" placeholder="10th Percentage" defaultValue={studentData?.tenthPercentage || ''} disabled={!isEditable} />
                                <input type="text" name="tenthYear" placeholder="10th Year of Passing" defaultValue={studentData?.tenthYear || ''} disabled={!isEditable} />
                                {(studyCategory === '12th' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" name="twelfthInstitution" placeholder="12th Institution Name" defaultValue={studentData?.twelfthInstitution || ''} disabled={!isEditable} />
                                        <select name="twelfthBoard" value={studentData?.twelfthBoard || ''} disabled={!isEditable}><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                        <input type="text" name="twelfthPercentage" placeholder="12th Percentage" defaultValue={studentData?.twelfthPercentage || ''} disabled={!isEditable} />
                                        <input type="text" name="twelfthYear" placeholder="12th Year of Passing" defaultValue={studentData?.twelfthYear || ''} disabled={!isEditable} />
                                        <input type="text" name="twelfthCutoff" placeholder="12th Cut-off Marks" defaultValue={studentData?.twelfthCutoff || ''} disabled={!isEditable} />
                                    </>
                                )}
                                {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" name="diplomaInstitution" placeholder="Diploma Institution" defaultValue={studentData?.diplomaInstitution || ''} disabled={!isEditable} />
                                        <input type="text" name="diplomaBranch" placeholder="Diploma Branch" defaultValue={studentData?.diplomaBranch || ''} disabled={!isEditable} />
                                        <input type="text" name="diplomaPercentage" placeholder="Diploma Percentage" defaultValue={studentData?.diplomaPercentage || ''} disabled={!isEditable} />
                                        <input type="text" name="diplomaYear" placeholder="Diploma Year of Passing" defaultValue={studentData?.diplomaYear || ''} disabled={!isEditable} />
                                    </>
                                )}
                            </div>
                        </div>

                        
                        
                        {/* --- SEMESTER & OTHER DETAILS --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Semester</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                {Array.from({ length: 8 }, (_, i) => (
                                    <input
                                        key={`sem${i+1}`}
                                        type="text"
                                        name={`semester${i+1}GPA`}
                                        placeholder={`Semester ${i+1} GPA`}
                                        defaultValue={studentData?.[`semester${i+1}GPA`] || ''}
                                        disabled={!isEditable}
                                    />
                                ))}
                                <input type="text" name="overallCGPA" placeholder="Overall CGPA" defaultValue={studentData?.overallCGPA || ''} disabled={!isEditable} />
                                <input type="number" name="clearedBacklogs" placeholder="No. of Backlogs (Cleared)" defaultValue={studentData?.clearedBacklogs || ''} disabled={!isEditable} />
                                <input type="number" name="currentBacklogs" placeholder="No. of Current Backlogs" defaultValue={studentData?.currentBacklogs || ''} disabled={!isEditable} />
                                <input type="number" name="yearOfGap" placeholder="Year of Gap" defaultValue={studentData?.yearOfGap || ''} disabled={!isEditable} />
                                <input type="text" name="gapReason" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} defaultValue={studentData?.gapReason || ''} disabled={!isEditable} />
                            </div>
                        </div>
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Other Details</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <select name="residentialStatus" value={studentData?.residentialStatus || ''} disabled={!isEditable}><option value="" disabled>Residential status</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                                <select name="quota" value={studentData?.quota || ''} disabled={!isEditable}><option value="" disabled>Quota</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                                <input type="text" name="languagesKnown" placeholder="Languages Known" defaultValue={studentData?.languagesKnown || ''} disabled={!isEditable} />
                                <select name="firstGraduate" value={studentData?.firstGraduate || ''} disabled={!isEditable}><option value="" disabled>First Graduate</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                <input type="text" name="passportNo" placeholder="Passport No." defaultValue={studentData?.passportNo || ''} disabled={!isEditable} />
                                <input type="text" name="skillSet" placeholder="Skill set" defaultValue={studentData?.skillSet || ''} disabled={!isEditable} />
                                <input type="text" name="valueAddedCourses" placeholder="Value Added Courses" defaultValue={studentData?.valueAddedCourses || ''} disabled={!isEditable} />
                                <input type="text" name="aboutSibling" placeholder="About sibling" defaultValue={studentData?.aboutSibling || ''} disabled={!isEditable} />
                                <input type="text" name="rationCardNo" placeholder="Ration card No." defaultValue={studentData?.rationCardNo || ''} disabled={!isEditable} />
                                <input type="text" name="familyAnnualIncome" placeholder="Family Annual Income" defaultValue={studentData?.familyAnnualIncome || ''} disabled={!isEditable} />
                                <input type="text" name="panNo" placeholder="PAN No." defaultValue={studentData?.panNo || ''} disabled={!isEditable} />
                                <select name="willingToSignBond" value={studentData?.willingToSignBond || ''} disabled={!isEditable}><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                <select name="preferredModeOfDrive" value={studentData?.preferredModeOfDrive || ''} disabled={!isEditable}><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                                <input type="text" name="githubLink" placeholder="GitHub Link" defaultValue={studentData?.githubLink || ''} disabled={!isEditable} />
                                <input type="text" name="linkedinLink" placeholder="LinkedIn Profile Link" defaultValue={studentData?.linkedinLink || ''} disabled={!isEditable} />
                                <select name="companyTypes" value={studentData?.companyTypes || ''} disabled={!isEditable}><option value="" disabled>Types of companies</option><option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="MNC">MNC</option><option value="Startup">Startup</option><option value="Government/Public Sector">Government/Public Sector</option><option value="Non-Profit">Non-Profit</option><option value="Other">Other</option></select>
                                <select name="preferredJobLocation" value={studentData?.preferredJobLocation || ''} disabled={!isEditable}><option value="" disabled>Preferred job location</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Bengaluru">Bengaluru</option><option value="Hyderabad">Hyderabad</option><option value="North India">North India</option></select>
                            </div>
                        </div>

                        {/* --- LOGIN DETAILS (moved to end) --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Login Details</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <input type="text" name="loginRegNo" placeholder="Login Registration Number" defaultValue={studentData?.loginRegNo || studentData?.regNo || ''} disabled={!isEditable} />
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPwd ? 'text' : 'password'} 
                                        name="loginPassword" 
                                        placeholder="Login Password" 
                                        value={loginPwdValue} 
                                        onChange={(e) => setLoginPwdValue(e.target.value)} 
                                        disabled={!isEditable} 
                                        style={{ paddingRight: 40 }}
                                    />
                                    {isEditable && (
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPwd(!showPwd)} 
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <EyeIcon />
                                        </button>
                                    )}
                                </div>
                                <input type="password" name="confirmLoginPassword" placeholder="Confirm Login Password" value={loginPwdValue} disabled />
                            </div>
                        </div>
                        
                        {/* MODIFIED ACTION BUTTONS */}
                        {isEditable && (
                            <div className={styles['Admin-DB-AdProfile-action-buttons']}>
                                
                                {/* Dynamic Block/Unblock Button */}
                                <button 
                                    type="button" 
                                    className={styles['Admin-DB-AdProfile-block-btn']}
                                    style={{ backgroundColor: isBlocked ? '#949494' : '#EC3039' }}
                                    onClick={handleToggleBlock}
                                >
                                    {isBlocked ? "Unblock" : "Block"}
                                </button>
                                
                                <button type="button" className={styles['Admin-DB-AdProfile-discard-btn']} onClick={handleDiscard}>Discard</button>
                                <button type="submit" className={styles['Admin-DB-AdProfile-save-btn']}>Save</button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
            {isSidebarOpen && <div className={styles['Admin-DB-AdProfile-overlay']} onClick={() => setIsSidebarOpen(false)}></div>} 
            
            {/* --- All Popups --- */}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
            
            {/* --- NEWLY ADDED POPUPS --- */}
            {blockPopupState === 'blocked' && <BlockSuccessPopup onClose={closeBlockPopup} />}
            {blockPopupState === 'unblocked' && <UnblockSuccessPopup onClose={closeBlockPopup} />}
        </div>
    );
}

export default AdminAdProfile;