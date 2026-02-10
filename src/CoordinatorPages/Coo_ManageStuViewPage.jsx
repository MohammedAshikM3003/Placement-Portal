import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import CooGraduateCap from "../assets/VectorGC.svg";
import CooBackbtn from "../assets/CooBackbtn.svg";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_ManageStuViewPage.module.css';
import Coordinatoricons from '../assets/Coordinatorcap.png';
import { PreviewProgressAlert } from '../components/alerts/DownloadPreviewAlerts.js';
import mongoDBService from '../services/mongoDBService.jsx';

const GraduationCapIcon = () => (
    <img src={Coordinatoricons} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'-20px'}}/>
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

function CooViewMS({ onLogout, onViewChange }) {
    const { studentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [studentData, setStudentData] = useState(null);
    const [studyCategory, setStudyCategory] = useState('12th');
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const handleCardClick = (view) => {
        if (onViewChange) {
            onViewChange(view);
        }
    };

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    // Normalize ID helper
    const normalizeId = (val) => {
        if (!val) return '';
        if (typeof val === 'object') {
            if (val.$oid) return val.$oid;
            if (val.oid) return val.oid;
        }
        const str = val.toString ? val.toString() : '';
        return str && str !== '[object Object]' ? str : '';
    };

    // Fetch student data
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

                if (response && response.student) {
                    const student = response.student;
                    setStudentData(student);
                    
                    // Set profile image
                    if (student.profilePicURL) {
                        setProfileImage(student.profilePicURL);
                        setUploadInfo({
                            name: 'profile.jpg',
                            date: new Date().toLocaleDateString()
                        });
                    }
                    
                    // Set DOB
                    if (student.dob) {
                        const dobStr = student.dob;
                        if (dobStr.length === 8) {
                            const day = dobStr.substring(0, 2);
                            const month = dobStr.substring(2, 4);
                            const year = dobStr.substring(4, 8);
                            setDob(new Date(year, month - 1, day));
                        }
                    }
                    
                    // Set study category
                    if (student.diplomaInstitution || student.diplomaBranch) {
                        if (student.twelfthInstitution) {
                            setStudyCategory('both');
                        } else {
                            setStudyCategory('diploma');
                        }
                    } else {
                        setStudyCategory('12th');
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
        
        return () => {
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [studentId]);

    // Set constant value for disabled prop
    const DISABLED = true;

    return (
        <div className={styles['co-sv-StuProfile-container']}>
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles['co-sv-StuProfile-main']}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'manage-students'}
                    onViewChange={handleViewChange}
                />
                <div className={styles['co-sv-StuProfile-dashboard-area']}>
                    {isInitialLoading && (
                        <PreviewProgressAlert 
                            isOpen={true} 
                            progress={loadingProgress} 
                            title="Loading..." 
                            messages={{ 
                                initial: 'Fetching student from database...', 
                                mid: 'Preparing profile...', 
                                final: 'Opening profile...' 
                            }}
                            color="#d23b42"
                            progressColor="#d23b42"
                        />
                    )}

                    <form> 
                        {/* --- PERSONAL INFO --- */}
                        <div className={styles['co-sv-StuProfile-profile-section-container']}>
                            <h3 className={styles['co-sv-StuProfile-section-header']}>Personal Information</h3>
                            <button 
                                type="button"
                                className={styles['co-sv-profile-backbtn']}
                                onClick={() => handleCardClick('manage-students')}
                            >
                                Back<img className={styles['co-sv-profile-backbtn-img']} src={CooBackbtn} alt="back" style={{position:"relative", left:"10px"}}/> 
                            </button>
                            <div className={styles['co-sv-StuProfile-form-grid']}>
                                <div className={styles['co-sv-StuProfile-personal-info-fields']}>
                                    <input type="text" placeholder="First Name" value={studentData?.firstName || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Last Name" value={studentData?.lastName || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Register Number" value={studentData?.regNo || ''} disabled={DISABLED} readOnly />
                                    <div className={styles['co-sv-StuProfile-datepicker-wrapper']}>
                                        <DatePicker 
                                            selected={dob} 
                                            onChange={() => {}} 
                                            dateFormat="dd/MM/yyyy" 
                                            placeholderText="DOB" 
                                            className={styles['co-sv-StuProfile-datepicker-input']} 
                                            wrapperClassName={styles['co-sv-StuProfile-datepicker-wrapper-inner']} 
                                            showPopperArrow={false} 
                                            disabled={DISABLED} 
                                        />
                                    </div>
                                    <input type="text" placeholder="Degree" value={studentData?.degree || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Branch" value={studentData?.branch || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Gender" value={studentData?.gender || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Address" value={studentData?.address || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="City" value={studentData?.city || ''} disabled={DISABLED} readOnly />
                                    <input type="email" placeholder="Primary Mail id" value={studentData?.primaryEmail || ''} disabled={DISABLED} readOnly />
                                    <input type="email" placeholder="Domain Mail id" value={studentData?.domainEmail || ''} disabled={DISABLED} readOnly />
                                    <input type="tel" placeholder="Mobile No." value={studentData?.phone || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Father Name" value={studentData?.fatherName || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Father Occupation" value={studentData?.fatherOccupation || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Father Mobile No." value={studentData?.fatherMobile || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Mother Name" value={studentData?.motherName || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Mother Occupation" value={studentData?.motherOccupation || ''} disabled={DISABLED} readOnly />
                                    <input type="text" placeholder="Mother Mobile No." value={studentData?.motherMobile || ''} disabled={DISABLED} readOnly />
                                </div>
                                <div className={styles['co-sv-StuProfile-profile-photo-wrapper']}>
                                    <div className={styles['co-sv-StuProfile-profile-photo-box']} style={{ height: '675px' }}>
                                        <h3 className={styles['co-sv-StuProfile-section-header']}>Profile Photo</h3>
                                        <div className={styles['co-sv-StuProfile-profile-icon-container']}>
                                            {profileImage ? (
                                                <img src={profileImage} alt="Profile Preview" className={styles['co-sv-StuProfile-profile-preview-img']} style={{ cursor: 'default' }} />
                                            ) : (
                                                <GraduationCapIcon />
                                            )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className={styles['co-sv-StuProfile-upload-info-container']}>
                                                <div className={styles['co-sv-StuProfile-upload-info-item']}>
                                                    <FileIcon /><span>{uploadInfo.name}</span>
                                                </div>
                                                <div className={styles['co-sv-StuProfile-upload-info-item']}>
                                                    <CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles['co-sv-StuProfile-form-grid']} style={{ marginTop: '1.5rem' }}>
                                <input type="text" placeholder="Community" value={studentData?.community || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Blood Group" value={studentData?.bloodGroup || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Aadhaar Number" value={studentData?.aadhaarNo || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Medium of study" value={studentData?.mediumOfStudy || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Guardian Name" value={studentData?.guardianName || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Guardian Mobile No" value={studentData?.guardianMobile || ''} disabled={DISABLED} readOnly />
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className={styles['co-sv-StuProfile-profile-section-container']}>
                            <h3 className={styles['co-sv-StuProfile-section-header']}>Academic Background</h3>
                            <div className={styles['co-sv-StuProfile-form-grid']}>
                                <div className={styles['co-sv-StuProfile-study-category']} style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} disabled={DISABLED} readOnly />
                                    <label htmlFor="12th">12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} disabled={DISABLED} readOnly />
                                    <label htmlFor="diploma">Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} disabled={DISABLED} readOnly />
                                    <label htmlFor="both">Both</label>
                                </div>
                                <input type="text" placeholder="10th Institution Name" value={studentData?.tenthInstitution || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="10th Board/University" value={studentData?.tenthBoard || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="10th Percentage" value={studentData?.tenthPercentage || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="10th Year of Passing" value={studentData?.tenthYearOfPassing || ''} disabled={DISABLED} readOnly />
                                {(studyCategory === '12th' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" placeholder="12th Institution Name" value={studentData?.twelfthInstitution || ''} disabled={DISABLED} readOnly />
                                        <input type="text" placeholder="12th Board/University" value={studentData?.twelfthBoard || ''} disabled={DISABLED} readOnly />
                                        <input type="text" placeholder="12th Percentage" value={studentData?.twelfthPercentage || ''} disabled={DISABLED} readOnly />
                                        <input type="text" placeholder="12th Year of Passing" value={studentData?.twelfthYearOfPassing || ''} disabled={DISABLED} readOnly />
                                        <input type="text" placeholder="12th Cut-off Marks" value={studentData?.twelfthCutoff || ''} disabled={DISABLED} readOnly />
                                    </>
                                )}
                                {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" placeholder="Diploma Institution" value={studentData?.diplomaInstitution || ''} disabled={DISABLED} readOnly />
                                        <input type="text" placeholder="Diploma Branch" value={studentData?.diplomaBranch || ''} disabled={DISABLED} readOnly />
                                        <input type="text" placeholder="Diploma Percentage" value={studentData?.diplomaPercentage || ''} disabled={DISABLED} readOnly />
                                        <input type="text" placeholder="Diploma Year of Passing" value={studentData?.diplomaYearOfPassing || ''} disabled={DISABLED} readOnly />
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* --- SEMESTER --- */}
                        <div className={styles['co-sv-StuProfile-profile-section-container']}>
                            <h3 className={styles['co-sv-StuProfile-section-header']}>Semester</h3>
                            <div className={styles['co-sv-StuProfile-form-grid']}>
                                <input type="text" placeholder="Semester 1 GPA" value={studentData?.semester1GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Semester 2 GPA" value={studentData?.semester2GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Semester 3 GPA" value={studentData?.semester3GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Semester 4 GPA" value={studentData?.semester4GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Semester 5 GPA" value={studentData?.semester5GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Semester 6 GPA" value={studentData?.semester6GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Semester 7 GPA" value={studentData?.semester7GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Semester 8 GPA" value={studentData?.semester8GPA || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Overall CGPA" value={studentData?.overallCGPA || ''} disabled={DISABLED} readOnly />
                                <input type="number" placeholder="No. of Backlogs (Cleared)" value={studentData?.backlogsCleared || ''} disabled={DISABLED} readOnly />
                                <input type="number" placeholder="No. of Current Backlogs" value={studentData?.currentBacklogs || ''} disabled={DISABLED} readOnly />
                                <input type="number" placeholder="Year of Gap" value={studentData?.yearOfGap || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} value={studentData?.gapReason || ''} disabled={DISABLED} readOnly />
                            </div>
                        </div>

                        {/* --- OTHER DETAILS --- */}
                        <div className={styles['co-sv-StuProfile-profile-section-container']}>
                            <h3 className={styles['co-sv-StuProfile-section-header']}>Other Details</h3>
                            <div className={styles['co-sv-StuProfile-form-grid']}>
                                <input type="text" placeholder="Residential status" value={studentData?.residentialStatus || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Quota" value={studentData?.quota || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Languages Known" value={studentData?.languagesKnown || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="First Graduate" value={studentData?.firstGraduate || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Passport No." value={studentData?.passportNo || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Skill set" value={studentData?.skillSet || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Value Added Courses" value={studentData?.valueAddedCourses || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="About sibling" value={studentData?.sibling || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Ration card No." value={studentData?.rationCardNo || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Family Annual Income" value={studentData?.familyIncome || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="PAN No." value={studentData?.panNo || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Willing to Sign Bond" value={studentData?.willingToSignBond || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Preferred Mode of Drive" value={studentData?.preferredModeOfDrive || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="GitHub Link" value={studentData?.githubLink || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="LinkedIn Profile Link" value={studentData?.linkedinLink || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Types of companies" value={studentData?.companyTypes || ''} disabled={DISABLED} readOnly />
                                <input type="text" placeholder="Preferred job location" value={studentData?.preferredJobLocation || ''} disabled={DISABLED} readOnly />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CooViewMS;
