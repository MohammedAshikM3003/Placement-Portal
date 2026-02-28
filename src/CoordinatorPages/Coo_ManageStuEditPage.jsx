import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Coordinatoricons from '../assets/Coordinatorcap.png';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_ManageStuEditPage.module.css';
import { PreviewProgressAlert } from '../components/alerts/DownloadPreviewAlerts.js';
import mongoDBService from '../services/mongoDBService.jsx';

const COMPANY_TYPE_OPTIONS = ["CORE", "IT", "ITES(BPO/KPO)", "Marketing & Sales", "HR / Business analyst", "Others"];
const JOB_LOCATION_OPTIONS = ["Tamil Nadu", "Bengaluru", "Hyderabad", "North India", "Others"];

// Helper function to update nested state
const updateField = (setStudentData, field, value) => {
    setStudentData(prev => ({...prev, [field]: value}));
};

const MdUpload = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>);
const IoMdClose = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>);
const GraduationCapIcon = () => (<img src={Coordinatoricons} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'-20px'}}/>);
const FileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>);
const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={`${styles['co-ms-StuProfile-popup-overlay']} ${styles['StuProfile-popup-overlay']}`}>
            <div className={`${styles['co-ms-StuProfile-popup-container']} ${styles['StuProfile-popup-container']}`}>
                <div className={`${styles['co-ms-StuProfile-popup-header']} ${styles['StuProfile-popup-header']}`}>Saved !</div>
                <div className={`${styles['co-ms-StuProfile-popup-body']} ${styles['StuProfile-popup-body']}`}>
                    <svg className={`${styles['co-ms-StuProfile-success-icon']} ${styles['StuProfile-success-icon']}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={`${styles['co-ms-StuProfile-success-icon--circle']} ${styles['StuProfile-success-icon--circle']}`} cx="26" cy="26" r="25" fill="none"/>
                        <path className={`${styles['co-ms-StuProfile-success-icon--check']} ${styles['StuProfile-success-icon--check']}`} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Details Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className={`${styles['co-ms-StuProfile-popup-footer']} ${styles['StuProfile-popup-footer']}`}>
                    <button onClick={onClose} className={`${styles['co-ms-StuProfile-popup-close-btn']} ${styles['StuProfile-popup-close-btn']}`}>Close</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={`${styles['co-ms-StuProfile-image-preview-overlay']} ${styles['StuProfile-image-preview-overlay']}`} onClick={onClose}>
            <div className={`${styles['co-ms-StuProfile-image-preview-container']} ${styles['StuProfile-image-preview-container']}`} onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className={`${styles['co-ms-StuProfile-image-preview-content']} ${styles['StuProfile-image-preview-content']}`} />
                <button onClick={onClose} className={`${styles['co-ms-StuProfile-image-preview-close-btn']} ${styles['StuProfile-image-preview-close-btn']}`}>&times;</button>
            </div>
        </div>
    );
};

function CooEditProfile({ onLogout, onViewChange }) {
    const { studentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isEditable = location.state?.mode === 'edit';

    const [studyCategory, setStudyCategory] = useState('12th');
    const [studentData, setStudentData] = useState({});
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [currentYear, setCurrentYear] = useState('');
    const [branches, setBranches] = useState([]);
    const [batches, setBatches] = useState([]);
    const [companyTypes, setCompanyTypes] = useState([]);
    const [jobLocations, setJobLocations] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loginPwdValue, setLoginPwdValue] = useState('');
    const [confirmPwdValue, setConfirmPwdValue] = useState('');
    const [hasResume, setHasResume] = useState(false);
    const [resumeData, setResumeData] = useState(null);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const branchesData = await mongoDBService.getBranches();
                setBranches(branchesData || []);
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };
        fetchBranches();
        const currentYear = new Date().getFullYear();
        const batchOptions = [];
        for (let i = 0; i < 10; i++) {
            const start = currentYear - i;
            const end = start + 4;
            batchOptions.push(`${start}-${end}`);
        }
        setBatches(batchOptions);
    }, []);

    useEffect(() => {
        const MIN_LOADER_MS = 500;
        let progressInterval;
        const load = async () => {
            const loadStartTime = Date.now();
            try {
                setLoadingProgress(0);
                setIsInitialLoading(true);
                progressInterval = setInterval(() => {
                    setLoadingProgress(p => {
                        if (p >= 90) return p;
                        return p + 3;
                    });
                }, 150);
                if (!studentId) {
                    console.error('No student ID provided');
                    setIsInitialLoading(false);
                    return;
                }
                console.log('Fetching student with ID:', studentId);
                const response = await mongoDBService.getStudentById(studentId);
                console.log('Student response:', response);
                
                // Handle both response formats: { student: {...} } or direct student object
                const student = response?.student || response;
                
                if (student && student._id) {
                    console.log('Setting student data:', student);
                    // Normalize field names for consistent access
                    const normalizedData = {
                        ...student,
                        community: student.community || student.Community || '',
                        mediumOfStudy: student.mediumOfStudy || student.medium || student.MediumOfStudy || ''
                    };
                    // Ensure community and mediumOfStudy are explicitly set in state
                    setStudentData(normalizedData);
                    if (student.profilePicURL) {
                        setProfileImage(normalizedData.profilePicURL);
                        setUploadInfo({ name: 'profile.jpg', date: new Date().toLocaleDateString() });
                    }
                    if (normalizedData.dob) {
                        const dobStr = normalizedData.dob.toString();
                        let parsedDate;
                        if (dobStr.length === 8) {
                            const day = dobStr.substring(0, 2);
                            const month = dobStr.substring(2, 4);
                            const year = dobStr.substring(4, 8);
                            parsedDate = new Date(year, month - 1, day);
                        } else {
                            parsedDate = new Date(normalizedData.dob);
                        }
                        if (!isNaN(parsedDate.getTime())) setDob(parsedDate);
                    }
                    if (normalizedData.diplomaInstitution || normalizedData.diplomaBranch) {
                        if (normalizedData.twelfthInstitution) setStudyCategory('both');
                        else setStudyCategory('diploma');
                    } else {
                        setStudyCategory('12th');
                    }
                    if (normalizedData.currentYear) setCurrentYear(normalizedData.currentYear);
                    if (normalizedData.companyTypes) {
                        setCompanyTypes(Array.isArray(normalizedData.companyTypes) ? normalizedData.companyTypes : normalizedData.companyTypes.split(',').map(s => s.trim()));
                    }
                    if (normalizedData.preferredJobLocation) {
                        setJobLocations(Array.isArray(normalizedData.preferredJobLocation) ? normalizedData.preferredJobLocation : normalizedData.preferredJobLocation.split(',').map(s => s.trim()));
                    }
                    if (normalizedData.loginPassword) {
                        setLoginPwdValue(normalizedData.loginPassword);
                        setConfirmPwdValue(normalizedData.loginPassword);
                    }
                    // Load resume data (try uploaded resume first, then resume-builder PDF)
                    try {
                        const resumeResponse = await mongoDBService.getResume(studentId);
                        if (resumeResponse?.resume?.fileData) {
                            setHasResume(true);
                            setResumeData(resumeResponse.resume);
                        } else {
                            throw new Error('No uploaded resume');
                        }
                    } catch (resumeError) {
                        console.warn('Uploaded resume not found, trying resume-builder PDF...', resumeError);
                        // Fallback: try resume-builder generated PDF
                        try {
                            const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
                            const authToken = localStorage.getItem('authToken');
                            const pdfResponse = await fetch(`${API_BASE}/api/resume-builder/pdf/${studentId}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                                }
                            });
                            if (pdfResponse.ok) {
                                const pdfResult = await pdfResponse.json();
                                console.log('📄 Resume-builder response:', pdfResult);
                                if (pdfResult.success && pdfResult.resume?.url) {
                                    console.log('📄 Resume URL format:', pdfResult.resume.url.substring(0, 100));
                                    setHasResume(true);
                                    setResumeData({ ...pdfResult.resume, isBuilderResume: true });
                                } else {
                                    setHasResume(false);
                                    setResumeData(null);
                                }
                            } else {
                                setHasResume(false);
                                setResumeData(null);
                            }
                        } catch (builderError) {
                            console.warn('Resume-builder PDF also not found:', builderError);
                            setHasResume(false);
                            setResumeData(null);
                        }
                    }
                }
                setLoadingProgress(100);
                const loadElapsed = Date.now() - loadStartTime;
                const remainingTime = Math.max(0, MIN_LOADER_MS - loadElapsed);
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            } catch (error) {
                console.error('Error fetching student:', error);
            } finally {
                clearInterval(progressInterval);
                setIsInitialLoading(false);
            }
        };
        load();
        return () => { if (progressInterval) clearInterval(progressInterval); };
    }, [studentId]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === "image/jpeg" || file.type === "image/webp")) {
            if (profileImage && profileImage.startsWith('blob:')) URL.revokeObjectURL(profileImage);
            setProfileImage(URL.createObjectURL(file));
            setUploadInfo({ name: file.name, date: new Date().toLocaleDateString('en-GB') });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2000);
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        if (profileImage && profileImage.startsWith('blob:')) URL.revokeObjectURL(profileImage);
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSelectChange = (field, value) => {
        setStudentData(prev => ({ ...prev, [field]: value }));
        if (field === 'currentYear') setCurrentYear(value);
    };

    const handleCompanyTypeToggle = (type) => {
        if (!isEditable) return;
        setCompanyTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const handleJobLocationToggle = (location) => {
        if (!isEditable) return;
        setJobLocations(prev => prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isEditable) return;
        try {
            setIsSaving(true);
            const formData = new FormData(formRef.current);
            const payload = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                regNo: formData.get('regNo'),
                batch: studentData?.batch,
                dob: dob ? dob.toISOString().split('T')[0] : '',
                degree: studentData?.degree,
                branch: studentData?.branch,
                currentYear: currentYear,
                currentSemester: studentData?.currentSemester,
                section: studentData?.section,
                gender: studentData?.gender,
                address: formData.get('address'),
                city: formData.get('city'),
                primaryEmail: formData.get('primaryEmail'),
                domainEmail: formData.get('domainEmail'),
                mobileNo: formData.get('mobileNo'),
                fatherName: formData.get('fatherName'),
                fatherOccupation: formData.get('fatherOccupation'),
                fatherMobile: formData.get('fatherMobile'),
                motherName: formData.get('motherName'),
                motherOccupation: formData.get('motherOccupation'),
                motherMobile: formData.get('motherMobile'),
                guardianName: formData.get('guardianName'),
                guardianNumber: formData.get('guardianNumber'),
                aadhaarNo: formData.get('aadhaarNo'),
                portfolioLink: formData.get('portfolioLink'),
                community: studentData?.community,
                bloodGroup: formData.get('bloodGroup'),
                mediumOfStudy: studentData?.mediumOfStudy,
                tenthInstitution: formData.get('tenthInstitution'),
                tenthBoard: studentData?.tenthBoard,
                tenthPercentage: formData.get('tenthPercentage'),
                tenthYear: formData.get('tenthYear'),
                twelfthInstitution: formData.get('twelfthInstitution'),
                twelfthBoard: studentData?.twelfthBoard,
                twelfthPercentage: formData.get('twelfthPercentage'),
                twelfthYear: formData.get('twelfthYear'),
                twelfthCutoff: formData.get('twelfthCutoff'),
                diplomaInstitution: formData.get('diplomaInstitution'),
                diplomaBranch: formData.get('diplomaBranch'),
                diplomaPercentage: formData.get('diplomaPercentage'),
                diplomaYear: formData.get('diplomaYear'),
                semester1GPA: formData.get('semester1GPA'),
                semester2GPA: formData.get('semester2GPA'),
                semester3GPA: formData.get('semester3GPA'),
                semester4GPA: formData.get('semester4GPA'),
                semester5GPA: formData.get('semester5GPA'),
                semester6GPA: formData.get('semester6GPA'),
                semester7GPA: formData.get('semester7GPA'),
                semester8GPA: formData.get('semester8GPA'),
                overallCGPA: formData.get('overallCGPA'),
                clearedBacklogs: formData.get('clearedBacklogs'),
                currentBacklogs: formData.get('currentBacklogs'),
                arrearStatus: studentData?.arrearStatus,
                yearOfGap: formData.get('yearOfGap'),
                gapReason: formData.get('gapReason'),
                residentialStatus: studentData?.residentialStatus,
                quota: studentData?.quota,
                languagesKnown: formData.get('languagesKnown'),
                firstGraduate: studentData?.firstGraduate,
                passportNo: formData.get('passportNo'),
                skillSet: formData.get('skillSet'),
                valueAddedCourses: formData.get('valueAddedCourses'),
                aboutSibling: formData.get('aboutSibling'),
                rationCardNo: formData.get('rationCardNo'),
                familyAnnualIncome: formData.get('familyAnnualIncome'),
                panNo: formData.get('panNo'),
                willingToSignBond: studentData?.willingToSignBond,
                preferredModeOfDrive: studentData?.preferredModeOfDrive,
                githubLink: formData.get('githubLink'),
                linkedinLink: formData.get('linkedinLink'),
                companyTypes: companyTypes.join(','),
                preferredJobLocation: jobLocations.join(','),
                loginPassword: loginPwdValue,
                confirmLoginPassword: confirmPwdValue
            };
            if (fileInputRef.current && fileInputRef.current.files[0]) {
                const file = fileInputRef.current.files[0];
                // GridFS upload: send raw file, no Base64
                const gridfsService = (await import('../services/gridfsService')).default;
                const result = await gridfsService.uploadProfileImage(file, studentId, 'student');
                payload.profilePicURL = result.url; // e.g. /api/file/abc123
            }
            await mongoDBService.updateStudent(studentId, payload);
            setPopupOpen(true);
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Failed to save student data');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (formRef.current) formRef.current.reset();
        if (profileImage && profileImage.startsWith('blob:')) URL.revokeObjectURL(profileImage);
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (studentData && studentData.profilePicURL) {
            setProfileImage(studentData.profilePicURL);
            setUploadInfo({ name: 'profile.jpg', date: new Date().toLocaleDateString() });
        }
    };

    const closePopup = () => {
        setPopupOpen(false);
        navigate('/coo-manage-students');
    };

    const handleViewChange = (view) => {
        if (onViewChange) onViewChange(view);
        setIsSidebarOpen(false);
    };

    return (
        <div className={`${styles['co-ms-StuProfile-container']} ${styles['StuProfile-container']}`}>
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={`${styles['co-ms-StuProfile-main']} ${styles['StuProfile-main']}`}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView={'manage-students'} onViewChange={handleViewChange} />
                <div className={`${styles['co-ms-StuProfile-dashboard-area']} ${styles['StuProfile-dashboard-area']}`}>
                    {isInitialLoading && (
                        <PreviewProgressAlert isOpen={true} progress={loadingProgress} title="Loading..." messages={{ initial: 'Fetching student from database...', mid: 'Preparing profile...', final: isEditable ? 'Opening editor...' : 'Opening profile...' }} color="#d23b42" progressColor="#d23b42" />
                    )}
                    <form ref={formRef} onSubmit={handleSave}>
                        <div className={`${styles['co-ms-StuProfile-profile-section-container']} ${styles['StuProfile-profile-section-container']}`}>
                            <h3 className={`${styles['co-ms-StuProfile-section-header']} ${styles['StuProfile-section-header']}`}>Personal Information</h3>
                            <div className={`${styles['co-ms-StuProfile-form-grid']} ${styles['StuProfile-form-grid']}`}>
                                <div className={`${styles['co-ms-StuProfile-personal-info-fields']} ${styles['StuProfile-personal-info-fields']}`}>
                                    <input type="text" name="firstName" placeholder="First Name" value={studentData?.firstName || ''} onChange={(e) => setStudentData(prev => ({...prev, firstName: e.target.value}))} disabled={!isEditable} />
                                    <input type="text" name="lastName" placeholder="Last Name" value={studentData?.lastName || ''} onChange={(e) => setStudentData(prev => ({...prev, lastName: e.target.value}))} disabled={!isEditable} />
                                    <input type="text" name="regNo" placeholder="Register Number (11 digits)" value={studentData?.regNo || ''} onChange={(e) => setStudentData(prev => ({...prev, regNo: e.target.value}))} disabled={!isEditable} />
                                    <select name="batch" value={studentData?.batch || ''} onChange={(e) => handleSelectChange('batch', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Batch</option>
                                        {batches.map((batch) => (<option key={batch} value={batch}>{batch}</option>))}
                                    </select>
                                    <div className={`${styles['co-ms-StuProfile-date-wrapper']} ${styles['StuProfile-date-wrapper']}`}>
                                        <DatePicker
                                            selected={dob}
                                            onChange={(date) => isEditable && setDob(date)}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="Select DOB"
                                            className={`${styles['co-ms-StuProfile-date-input']} ${styles['StuProfile-date-input']}`}
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            yearDropdownItemNumber={15}
                                            scrollableYearDropdown
                                            maxDate={new Date()}
                                            isClearable
                                            autoComplete="off"
                                            disabled={!isEditable}
                                        />
                                    </div>
                                    <select name="degree" value={studentData?.degree || ''} onChange={(e) => handleSelectChange('degree', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Degree</option>
                                        <option value="B.E">B.E</option>
                                        <option value="B.Tech">B.Tech</option>
                                        <option value="M.E">M.E</option>
                                        <option value="M.Tech">M.Tech</option>
                                    </select>
                                    <select name="branch" value={studentData?.branch || ''} onChange={(e) => handleSelectChange('branch', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Branch</option>
                                        {branches.map((branch, index) => (<option key={branch._id || branch.id || index} value={branch.branchAbbreviation}>{branch.branchAbbreviation}</option>))}
                                    </select>
                                    <select name="currentYear" value={currentYear || studentData?.currentYear || ''} onChange={(e) => handleSelectChange('currentYear', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Current Year</option>
                                        <option value="I">I</option>
                                        <option value="II">II</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                    </select>
                                    <select name="currentSemester" value={studentData?.currentSemester || ''} onChange={(e) => handleSelectChange('currentSemester', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Current Semester</option>
                                        {[1,2,3,4,5,6,7,8].map(sem => (<option key={sem} value={sem.toString()}>{sem}</option>))}
                                    </select>
                                    <select name="section" value={studentData?.section || ''} onChange={(e) => handleSelectChange('section', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Section</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                    <select name="gender" value={studentData?.gender || ''} onChange={(e) => handleSelectChange('gender', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    <input type="text" name="address" placeholder="Address" value={studentData?.address || ''} onChange={(e) => setStudentData(prev => ({...prev, address: e.target.value}))} disabled={!isEditable} />
                                    <input type="text" name="city" placeholder="City" value={studentData?.city || ''} onChange={(e) => setStudentData(prev => ({...prev, city: e.target.value}))} disabled={!isEditable} />
                                    <input type="email" name="primaryEmail" placeholder="Primary Mail id" value={studentData?.primaryEmail || ''} onChange={(e) => setStudentData(prev => ({...prev, primaryEmail: e.target.value}))} disabled={!isEditable} />
                                    <input type="email" name="domainEmail" placeholder="Domain Mail id" value={studentData?.domainEmail || ''} onChange={(e) => setStudentData(prev => ({...prev, domainEmail: e.target.value}))} disabled={!isEditable} />
                                    <input type="tel" name="mobileNo" placeholder="Mobile No." value={studentData?.mobileNo || ''} onChange={(e) => setStudentData(prev => ({...prev, mobileNo: e.target.value}))} disabled={!isEditable} />
                                    <input type="text" name="fatherName" placeholder="Father Name" value={studentData?.fatherName || ''} onChange={(e) => updateField(setStudentData, 'fatherName', e.target.value)} disabled={!isEditable} />
                                    <input type="text" name="fatherOccupation" placeholder="Father Occupation" value={studentData?.fatherOccupation || ''} onChange={(e) => updateField(setStudentData, 'fatherOccupation', e.target.value)} disabled={!isEditable} />
                                    <input type="text" name="fatherMobile" placeholder="Father Mobile No." value={studentData?.fatherMobile || ''} onChange={(e) => updateField(setStudentData, 'fatherMobile', e.target.value)} disabled={!isEditable} />
                                    <input type="text" name="motherName" placeholder="Mother Name" value={studentData?.motherName || ''} onChange={(e) => updateField(setStudentData, 'motherName', e.target.value)} disabled={!isEditable} />
                                    <input type="text" name="motherOccupation" placeholder="Mother Occupation" value={studentData?.motherOccupation || ''} onChange={(e) => updateField(setStudentData, 'motherOccupation', e.target.value)} disabled={!isEditable} />
                                    <input type="text" name="motherMobile" placeholder="Mother Mobile No." value={studentData?.motherMobile || ''} onChange={(e) => updateField(setStudentData, 'motherMobile', e.target.value)} disabled={!isEditable} />
                                    <input type="text" name="guardianName" placeholder="Guardian Name" value={studentData?.guardianName || ''} onChange={(e) => updateField(setStudentData, 'guardianName', e.target.value)} disabled={!isEditable} />
                                    <input type="tel" name="guardianNumber" placeholder="Guardian Number" value={studentData?.guardianNumber || ''} onChange={(e) => updateField(setStudentData, 'guardianNumber', e.target.value)} disabled={!isEditable} />
                                    <div className={styles['co-ms-aadhaar-portfolio-grid']}>
                                        <div className={styles['co-ms-aadhaar-column']}>
                                            <input type="text" name="aadhaarNo" placeholder="Aadhaar Number" value={studentData?.aadhaarNo || ''} onChange={(e) => updateField(setStudentData, 'aadhaarNo', e.target.value)} disabled={!isEditable} />
                                            <button 
                                                type="button"
                                                className={`${styles['co-ms-certificate-btn']} ${styles['certificate-btn']}`}
                                                onClick={() => navigate(`/coo-student-certificates/${studentId}`, {
                                                    state: { studentData }
                                                })}
                                            >
                                                Certificates
                                            </button>
                                        </div>
                                        <div className={styles['co-ms-portfolio-column']}>
                                            <input type="text" name="portfolioLink" placeholder="Portfolio Link" value={studentData?.portfolioLink || ''} onChange={(e) => updateField(setStudentData, 'portfolioLink', e.target.value)} disabled={!isEditable} />
                                        </div>
                                    </div>
                                    
                                </div>
                                <div className={`${styles['co-ms-StuProfile-profile-photo-wrapper']} ${styles['StuProfile-profile-photo-wrapper']}`}>
                                    <div className={`${styles['co-ms-StuProfile-profile-photo-box']} ${styles['StuProfile-profile-photo-box']}`} style={{ height: '675px' }}>
                                        <h3 className={`${styles['co-ms-StuProfile-section-header']} ${styles['StuProfile-section-header']}`}>Profile Photo</h3>
                                        <div className={`${styles['co-ms-StuProfile-profile-icon-container']} ${styles['StuProfile-profile-icon-container']}`}>
                                            {profileImage ? (<img src={profileImage} alt="Profile Preview" className={`${styles['co-ms-StuProfile-profile-preview-img']} ${styles['StuProfile-profile-preview-img']}`} onClick={() => isEditable && setImagePreviewOpen(true)} style={{ cursor: isEditable ? 'pointer' : 'default' }} />) : (<GraduationCapIcon />)}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className={`${styles['co-ms-StuProfile-upload-info-container']} ${styles['StuProfile-upload-info-container']}`}>
                                                <div className={`${styles['co-ms-StuProfile-upload-info-item']} ${styles['StuProfile-upload-info-item']}`}><FileIcon /><span>{uploadInfo.name}</span></div>
                                                <div className={`${styles['co-ms-StuProfile-upload-info-item']} ${styles['StuProfile-upload-info-item']}`}><CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span></div>
                                            </div>
                                        )}
                                        {isEditable && (
                                            <div className={`${styles['co-ms-StuProfile-upload-action-area']} ${styles['StuProfile-upload-action-area']}`}>
                                                {uploadSuccess && (<p className={`${styles['co-ms-StuProfile-upload-success-message']} ${styles['StuProfile-upload-success-message']}`}>✓ Image uploaded successfully!</p>)}
                                                <p className={`${styles['co-ms-StuProfile-upload-hint']} ${styles['StuProfile-upload-hint']}`}>*JPG and WebP formats allowed (Max 500 KB)</p>
                                                <div className={`${styles['co-ms-StuProfile-upload-btn-wrapper']} ${styles['StuProfile-upload-btn-wrapper']}`}>
                                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} id="profile-upload" />
                                                    <label htmlFor="profile-upload" className={`${styles['co-ms-StuProfile-profile-upload-btn']} ${styles['StuProfile-profile-upload-btn']}`}><MdUpload /> Upload (Max 500 KB)</label>
                                                    {profileImage && (<button type="button" onClick={handleImageRemove} className={`${styles['co-ms-StuProfile-remove-image-btn']} ${styles['StuProfile-remove-image-btn']}`}><IoMdClose /></button>)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`${styles['co-ms-StuProfile-additional-info-fields']} ${styles['StuProfile-additional-info-fields']}`} style={{display:'flex', flexDirection:'column'}}>
                                    <select name="community" value={studentData?.community || ''} onChange={(e) => handleSelectChange('community', e.target.value)} disabled={!isEditable} style={{marginTop:'20px'}}>
                                    <option value="" disabled>Community</option>
                                    <option value="OC">OC</option>
                                    <option value="BC">BC</option>
                                    <option value="BCM">BCM</option>
                                    <option value="MBC">MBC</option>
                                    <option value="SC">SC</option>
                                    <option value="SCA">SCA</option>
                                    <option value="ST">ST</option>
                                </select>
                                <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} onChange={(e) => handleSelectChange('mediumOfStudy', e.target.value)} disabled={!isEditable} style={{marginTop:'0px'}}>
                                    <option value="" disabled>Medium of study</option>
                                    <option value="English">English</option>
                                    <option value="Tamil">Tamil</option>
                                    <option value="Other">Others</option>
                                </select>
                                <input type="text" name="bloodGroup" placeholder="Blood Group" value={studentData?.bloodGroup || ''} onChange={(e) => setStudentData(prev => ({...prev, bloodGroup: e.target.value}))} disabled={!isEditable} style={{marginTop:'0px'}} />
                                <button 
                                        type="button"
                                        className={`${styles['co-ms-resume-btn']} ${styles['resume-btn']}`} style={{marginTop:'0px'}}
                                        onClick={() => {
                                            if (hasResume && resumeData) {
                                                try {
                                                    let blobUrl;
                                                    // Check for GridFS URL first (new system)
                                                    const gridfsUrl = resumeData.gridfsFileUrl || resumeData.url || '';
                                                    if (gridfsUrl.startsWith('/api/file/') || gridfsUrl.includes('/api/file/')) {
                                                        blobUrl = gridfsUrl.startsWith('http') ? gridfsUrl : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${gridfsUrl}`;
                                                    } else if (resumeData.isBuilderResume && resumeData.url) {
                                                        // Resume-builder generated PDF - convert data URL to Blob
                                                        const dataUrl = resumeData.url;
                                                        console.log('📄 Opening builder resume, URL length:', dataUrl.length);
                                                        console.log('📄 URL start:', dataUrl.substring(0, 100));
                                                        
                                                        // Validate URL format
                                                        if (!dataUrl.startsWith('data:application/pdf;base64,')) {
                                                            alert('Resume data is corrupted. Please regenerate your resume from the Resume Builder page.');
                                                            console.error('❌ Invalid resume URL format:', dataUrl.substring(0, 200));
                                                            return;
                                                        }
                                                        
                                                        // Check if base64 part contains only valid characters (not comma-separated numbers)
                                                        const base64Part = dataUrl.split(',')[1];
                                                        if (!base64Part || /^[\d,\s]+$/.test(base64Part.substring(0, 100))) {
                                                            alert('Resume data is corrupted (byte array format detected). Please regenerate your resume from the Resume Builder page.');
                                                            console.error('❌ Corrupted base64 (appears to be byte array):', base64Part.substring(0, 200));
                                                            return;
                                                        }
                                                        
                                                        const byteString = atob(base64Part);
                                                        const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
                                                        const ab = new ArrayBuffer(byteString.length);
                                                        const ia = new Uint8Array(ab);
                                                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                                                        const blob = new Blob([ab], { type: mimeType || 'application/pdf' });
                                                        blobUrl = URL.createObjectURL(blob);
                                                    } else if (resumeData.fileData) {
                                                        // Uploaded resume - convert base64 to Blob for preview
                                                        const byteString = atob(resumeData.fileData);
                                                        const ab = new ArrayBuffer(byteString.length);
                                                        const ia = new Uint8Array(ab);
                                                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                                                        const blob = new Blob([ab], { type: resumeData.fileType || 'application/pdf' });
                                                        blobUrl = URL.createObjectURL(blob);
                                                    }
                                                    if (blobUrl) window.open(blobUrl, '_blank');
                                                } catch (err) {
                                                    console.error('Error opening resume:', err);
                                                    alert('Failed to open resume. The file may be corrupted. Please regenerate your resume from the Resume Builder page.');
                                                }
                                            }
                                        }}
                                    >
                                        <span>Resume</span>
                                        {hasResume ? (
                                            <svg 
                                                width="24" 
                                                height="24" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                style={{ marginLeft: '8px' }}
                                            >
                                                <circle cx="12" cy="12" r="10" fill="white" />
                                                <path 
                                                    d="M9 12L11 14L15 10" 
                                                    stroke="#d23b42" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ) : (
                                            <svg 
                                                width="24" 
                                                height="24" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                style={{ marginLeft: '8px' }}
                                            >
                                                <circle cx="12" cy="12" r="10" fill="white" />
                                                <path 
                                                    d="M8 8L16 16M16 8L8 16" 
                                                    stroke="#999" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        )}
                                    </button>

                                    <button 
                                        type="button"
                                        className={`${styles['co-ms-certificate-btn-mobile']} ${styles['certificate-btn-mobile']}`}
                                        onClick={() => navigate(`/coo-student-certificates/${studentId}`, {
                                            state: { studentData }
                                        })}
                                    >
                                        Certificates
                                    </button>
                                </div>
                            </div>
                        </div>
                            <div className={`${styles['co-ms-StuProfile-additional-info-fields']} ${styles['StuProfile-additional-info-fields']}`} style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1.5rem', marginTop:'1.5rem'}}>
                                
                            </div>
                        </div>

                        <div className={`${styles['co-ms-StuProfile-profile-section-container']} ${styles['StuProfile-profile-section-container']}`}>
                            <h3 className={`${styles['co-ms-StuProfile-section-header']} ${styles['StuProfile-section-header']}`}>Academic Background</h3>
                            <div className={`${styles['co-ms-StuProfile-form-grid']} ${styles['StuProfile-form-grid']}`}>
                                <div className={`${styles['co-ms-StuProfile-study-category']} ${styles['StuProfile-study-category']}`} style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => isEditable && setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="12th">12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => isEditable && setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="diploma">Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => isEditable && setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="both">Both</label>
                                </div>
                                <input type="text" name="tenthInstitution" placeholder="10th Institution Name" value={studentData?.tenthInstitution || ''} onChange={(e) => setStudentData(prev => ({...prev, tenthInstitution: e.target.value}))} disabled={!isEditable} />
                                <select name="tenthBoard" value={studentData?.tenthBoard || ''} onChange={(e) => handleSelectChange('tenthBoard', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>10th Board/University</option>
                                    <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="Other State Board">Other State Board</option>
                                </select>
                                <input type="text" name="tenthPercentage" placeholder="10th Percentage" value={studentData?.tenthPercentage || ''} onChange={(e) => setStudentData(prev => ({...prev, tenthPercentage: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="tenthYear" placeholder="10th Year of Passing" value={studentData?.tenthYear || ''} onChange={(e) => setStudentData(prev => ({...prev, tenthYear: e.target.value}))} disabled={!isEditable} />
                                {(studyCategory === '12th' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" name="twelfthInstitution" placeholder="12th Institution Name" value={studentData?.twelfthInstitution || ''} onChange={(e) => setStudentData(prev => ({...prev, twelfthInstitution: e.target.value}))} disabled={!isEditable} />
                                        <select name="twelfthBoard" value={studentData?.twelfthBoard || ''} onChange={(e) => handleSelectChange('twelfthBoard', e.target.value)} disabled={!isEditable}>
                                            <option value="" disabled>12th Board/University</option>
                                            <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="Other State Board">Other State Board</option>
                                        </select>
                                        <input type="text" name="twelfthPercentage" placeholder="12th Percentage" value={studentData?.twelfthPercentage || ''} onChange={(e) => setStudentData(prev => ({...prev, twelfthPercentage: e.target.value}))} disabled={!isEditable} />
                                        <input type="text" name="twelfthYear" placeholder="12th Year of Passing" value={studentData?.twelfthYear || ''} onChange={(e) => setStudentData(prev => ({...prev, twelfthYear: e.target.value}))} disabled={!isEditable} />
                                        <input type="text" name="twelfthCutoff" placeholder="12th Cut-off Marks" value={studentData?.twelfthCutoff || ''} onChange={(e) => setStudentData(prev => ({...prev, twelfthCutoff: e.target.value}))} disabled={!isEditable} />
                                    </>
                                )}
                                {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" name="diplomaInstitution" placeholder="Diploma Institution" value={studentData?.diplomaInstitution || ''} onChange={(e) => setStudentData(prev => ({...prev, diplomaInstitution: e.target.value}))} disabled={!isEditable} />
                                        <input type="text" name="diplomaBranch" placeholder="Diploma Branch" value={studentData?.diplomaBranch || ''} onChange={(e) => setStudentData(prev => ({...prev, diplomaBranch: e.target.value}))} disabled={!isEditable} />
                                        <input type="text" name="diplomaPercentage" placeholder="Diploma Percentage" value={studentData?.diplomaPercentage || ''} onChange={(e) => setStudentData(prev => ({...prev, diplomaPercentage: e.target.value}))} disabled={!isEditable} />
                                        <input type="text" name="diplomaYear" placeholder="Diploma Year of Passing" value={studentData?.diplomaYear || ''} onChange={(e) => setStudentData(prev => ({...prev, diplomaYear: e.target.value}))} disabled={!isEditable} />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={`${styles['co-ms-StuProfile-profile-section-container']} ${styles['StuProfile-profile-section-container']}`}>
                            <h3 className={`${styles['co-ms-StuProfile-section-header']} ${styles['StuProfile-section-header']}`}>Semester</h3>
                            <div className={`${styles['co-ms-StuProfile-form-grid']} ${styles['StuProfile-form-grid']}`}>
                                {[1,2,3,4,5,6,7,8].map(sem => (
                                    <input key={sem} type="text" name={`semester${sem}GPA`} placeholder={`Semester ${sem} GPA (e.g., 9.08)`} value={studentData?.[`semester${sem}GPA`] || ''} onChange={(e) => setStudentData(prev => ({...prev, [`semester${sem}GPA`]: e.target.value}))} disabled={!isEditable} />
                                ))}
                                <input type="text" name="overallCGPA" placeholder="Overall CGPA (e.g., 9.08)" value={studentData?.overallCGPA || ''} onChange={(e) => setStudentData(prev => ({...prev, overallCGPA: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="clearedBacklogs" placeholder="No. of Backlogs (Cleared)" value={studentData?.clearedBacklogs || ''} onChange={(e) => setStudentData(prev => ({...prev, clearedBacklogs: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="currentBacklogs" placeholder="No. of Current Backlogs" value={studentData?.currentBacklogs || ''} onChange={(e) => setStudentData(prev => ({...prev, currentBacklogs: e.target.value}))} disabled={!isEditable} />
                                <select name="arrearStatus" value={studentData?.arrearStatus || ''} onChange={(e) => handleSelectChange('arrearStatus', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>Arrear Status</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <input type="text" name="yearOfGap" placeholder="Year of Gap" value={studentData?.yearOfGap || ''} onChange={(e) => setStudentData(prev => ({...prev, yearOfGap: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="gapReason" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} value={studentData?.gapReason || ''} onChange={(e) => setStudentData(prev => ({...prev, gapReason: e.target.value}))} disabled={!isEditable} />
                            </div>
                        </div>

                        <div className={`${styles['co-ms-StuProfile-profile-section-container']} ${styles['StuProfile-profile-section-container']}`}>
                            <h3 className={`${styles['co-ms-StuProfile-section-header']} ${styles['StuProfile-section-header']}`}>Other Details</h3>
                            <div className={`${styles['co-ms-StuProfile-form-grid']} ${styles['StuProfile-form-grid']}`}>
                                <select name="residentialStatus" value={studentData?.residentialStatus || ''} onChange={(e) => handleSelectChange('residentialStatus', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>Residential status</option>
                                    <option value="Hosteller">Hosteller</option>
                                    <option value="Dayscholar">Dayscholar</option>
                                </select>
                                <select name="quota" value={studentData?.quota || ''} onChange={(e) => handleSelectChange('quota', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>Quota</option>
                                    <option value="Management">Management</option>
                                    <option value="Counselling">Counselling</option>
                                </select>
                                <input type="text" name="languagesKnown" placeholder="Languages Known" value={studentData?.languagesKnown || ''} onChange={(e) => setStudentData(prev => ({...prev, languagesKnown: e.target.value}))} disabled={!isEditable} />
                                <select name="firstGraduate" value={studentData?.firstGraduate || ''} onChange={(e) => handleSelectChange('firstGraduate', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>First Graduate</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <input type="text" name="passportNo" placeholder="Passport No." value={studentData?.passportNo || ''} onChange={(e) => setStudentData(prev => ({...prev, passportNo: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="skillSet" placeholder="Skill set" value={studentData?.skillSet || ''} onChange={(e) => setStudentData(prev => ({...prev, skillSet: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="valueAddedCourses" placeholder="Value Added Courses" value={studentData?.valueAddedCourses || ''} onChange={(e) => setStudentData(prev => ({...prev, valueAddedCourses: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="aboutSibling" placeholder="About sibling" value={studentData?.aboutSibling || ''} onChange={(e) => setStudentData(prev => ({...prev, aboutSibling: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="rationCardNo" placeholder="Ration card No." value={studentData?.rationCardNo || ''} onChange={(e) => setStudentData(prev => ({...prev, rationCardNo: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="familyAnnualIncome" placeholder="Family Annual Income" value={studentData?.familyAnnualIncome || ''} onChange={(e) => setStudentData(prev => ({...prev, familyAnnualIncome: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="panNo" placeholder="PAN No." value={studentData?.panNo || ''} onChange={(e) => setStudentData(prev => ({...prev, panNo: e.target.value}))} disabled={!isEditable} />
                                <select name="willingToSignBond" value={studentData?.willingToSignBond || ''} onChange={(e) => handleSelectChange('willingToSignBond', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>Willing to Sign Bond</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <select name="preferredModeOfDrive" value={studentData?.preferredModeOfDrive || ''} onChange={(e) => handleSelectChange('preferredModeOfDrive', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>Preferred Mode of Drive</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                                <input type="text" name="githubLink" placeholder="GitHub Link" value={studentData?.githubLink || ''} onChange={(e) => setStudentData(prev => ({...prev, githubLink: e.target.value}))} disabled={!isEditable} />
                                <input type="text" name="linkedinLink" placeholder="LinkedIn Profile Link" value={studentData?.linkedinLink || ''} onChange={(e) => setStudentData(prev => ({...prev, linkedinLink: e.target.value}))} disabled={!isEditable} />
                                <div className={`${styles['co-ms-StuProfile-checkbox-group']} ${styles['StuProfile-checkbox-group']}`}>
                                    <span className={`${styles['co-ms-StuProfile-checkbox-group-label']} ${styles['StuProfile-checkbox-group-label']}`}>Company Types</span>
                                    <div className={`${styles['co-ms-StuProfile-checkbox-options']} ${styles['StuProfile-checkbox-options']}`}>
                                        {COMPANY_TYPE_OPTIONS.map((type) => (
                                            <label key={type} className={`${styles['co-ms-StuProfile-checkbox-option']} ${styles['StuProfile-checkbox-option']}`}>
                                                <input type="checkbox" checked={companyTypes.includes(type)} onChange={() => handleCompanyTypeToggle(type)} disabled={!isEditable} />
                                                <span>{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={`${styles['co-ms-StuProfile-checkbox-group']} ${styles['StuProfile-checkbox-group']}`}>
                                    <span className={`${styles['co-ms-StuProfile-checkbox-group-label']} ${styles['StuProfile-checkbox-group-label']}`}>Preferred Job Locations</span>
                                    <div className={`${styles['co-ms-StuProfile-checkbox-options']} ${styles['StuProfile-checkbox-options']}`}>
                                        {JOB_LOCATION_OPTIONS.map((location) => (
                                            <label key={location} className={`${styles['co-ms-StuProfile-checkbox-option']} ${styles['StuProfile-checkbox-option']}`}>
                                                <input type="checkbox" checked={jobLocations.includes(location)} onChange={() => handleJobLocationToggle(location)} disabled={!isEditable} />
                                                <span>{location}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Login Details Section */}
                        <div className={`${styles['co-ms-StuProfile-profile-section-container']} ${styles['StuProfile-profile-section-container']}`}>
                            <h3 className={`${styles['co-ms-StuProfile-section-header']} ${styles['StuProfile-section-header']}`}>Login Details</h3>
                            <div className={`${styles['co-ms-StuProfile-form-grid']} ${styles['StuProfile-form-grid']}`}>
                                <input type="text" name="loginRegNo" placeholder="Login Registration Number" value={studentData?.loginRegNo || studentData?.regNo || ''} onChange={(e) => setStudentData(prev => ({...prev, loginRegNo: e.target.value}))} disabled={!isEditable} />
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        name="loginPassword" 
                                        placeholder="Password" 
                                        value={loginPwdValue} 
                                        onChange={(e) => setLoginPwdValue(e.target.value)} 
                                        disabled={!isEditable} 
                                        style={{paddingRight: '40px', width: '100%'}}
                                    />
                                    {isEditable && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#d23b42', fontSize: '18px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                                        >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        )}
                                        </button>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showConfirmPassword ? 'text' : 'password'} 
                                        name="confirmPassword" 
                                        placeholder="Confirm Password" 
                                        value={confirmPwdValue} 
                                        onChange={(e) => setConfirmPwdValue(e.target.value)} 
                                        disabled={!isEditable} 
                                        style={{paddingRight: '40px', width: '100%'}}
                                        required={loginPwdValue ? true : false}
                                    />
                                    {isEditable && (
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#d23b42', fontSize: '18px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                                        >
                                            {showConfirmPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditable && (
                            <div className={`${styles['co-ms-StuProfile-action-buttons']} ${styles['StuProfile-action-buttons']}`}>
                                <button type="button" onClick={handleDiscard} className={`${styles['co-ms-StuProfile-discard-btn']} ${styles['StuProfile-discard-btn']}`}>Discard</button>
                                <button type="submit" className={`${styles['co-ms-StuProfile-save-btn']} ${styles['StuProfile-save-btn']}`} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default CooEditProfile;
