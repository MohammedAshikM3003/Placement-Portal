import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from '../utils/apiConfig';

import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import styles from './Coo_ManageStudentView.module.css'; // Module Import
import Adminicons from '../assets/Adminicon.png';
import BestAchievement from '../assets/BestAchievementicon.svg';
import StuEyeIcon from '../assets/Coordviewicon.svg';
import mongoDBService from '../services/mongoDBService.jsx';
import fastDataService from '../services/fastDataService.jsx';
import gridfsService from '../services/gridfsService';

const COMPANY_TYPE_OPTIONS = [
    "CORE",
    "IT",
    "ITES(BPO/KPO)",
    "Marketing & Sales",
    "HR / Business analyst",
    "Others"
];

const JOB_LOCATION_OPTIONS = [
    "Tamil Nadu",
    "Bengaluru",
    "Hyderabad",
    "North India",
    "Others"
];

const ARREAR_STATUS_OPTIONS = ["NHA", "NSA", "SA"];

const PREFERRED_TRAINING_OPTIONS = [
    "Java",
    "Python",
    "Fullstack Development",
    "Gen AI",
    "Cloud Computing"
];

const parseMultiValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

function Coo_ManageStudentView({ onLogout, onViewChange }) {
    const { studentId } = useParams(); // Get studentId from URL params
    const navigate = useNavigate();
    const [studyCategory, setStudyCategory] = useState('12th');
    const [profileImage, setProfileImage] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [skills, setSkills] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [hoveredRound, setHoveredRound] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);

    // Helper functions for multi-select values
    const selectedCompanyTypes = useMemo(
        () => parseMultiValue(studentData?.companyTypes),
        [studentData?.companyTypes]
    );

    const selectedJobLocations = useMemo(
        () => parseMultiValue(studentData?.preferredJobLocation),
        [studentData?.preferredJobLocation]
    );

    const selectedTrainings = useMemo(
        () => parseMultiValue(studentData?.preferredTraining),
        [studentData?.preferredTraining]
    );

    const companyTypesHiddenValue = useMemo(
        () => selectedCompanyTypes.join(', '),
        [selectedCompanyTypes]
    );

    const jobLocationsHiddenValue = useMemo(
        () => selectedJobLocations.join(', '),
        [selectedJobLocations]
    );

    // Company Details — merge real studentData with mock fallbacks
    const companyStats = useMemo(() => ({
        totalCompaniesAttended: studentData?.totalCompaniesAttended ?? 10,
        totalDrivesAttended:    studentData?.totalDrivesAttended    ?? 14,
        shortlistedCount:       studentData?.shortlistedCount       ?? 11,
        preferredModeOfDrive:   studentData?.preferredModeOfDrive   || 'Hybrid',
        lastDriveAttended:      studentData?.lastDriveAttended      || '',
        lastDriveResult:        studentData?.lastDriveResult        || '',
        highestPackageDrive:    studentData?.highestPackageDrive    ?? 24,
        totalRoundsCleared:     studentData?.totalRoundsCleared     ?? 19,
    }), [studentData]);

    const PIE_DATA = [
        { name: 'Shortlisted', value: companyStats.shortlistedCount, fill: '#4CAF50' },
        { name: 'Remaining', value: companyStats.totalDrivesAttended - companyStats.shortlistedCount, fill: '#E0E0E0' }
    ];

    const successRate = useMemo(() => {
        const attended   = companyStats.totalDrivesAttended;
        const shortlisted = companyStats.shortlistedCount;
        if (attended === 0) return 0;
        return Math.min(100, Math.round((shortlisted / attended) * 100));
    }, [companyStats.totalDrivesAttended, companyStats.shortlistedCount]);

    const getAvailableSemesters = (year) => {
        const semesterMap = { 'I': ['1', '2'], 'II': ['3', '4'], 'III': ['5', '6'], 'IV': ['7', '8'] };
        return semesterMap[year] || [];
    };

    const populateFormFields = useCallback((data) => {
        if (!data) return;

        const normalized = {
            currentYear: data.currentYear,
            currentSemester: data.currentSemester,
            section: data.section,
            registerNumber: data.registerNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            dob: data.dob,
            address: data.address,
            city: data.city,
            primaryEmail: data.primaryEmail,
            secondaryEmail: data.secondaryEmail,
            mobileNo: data.mobileNo,
            fatherMobile: data.fatherMobile,
            fatherOccupation: data.fatherOccupation,
            motherMobile: data.motherMobile,
            motherOccupation: data.motherOccupation,
            guardianName: data.guardianName,
            guardianMobile: data.guardianMobile,
            profilePicURL: data.profilePicURL || data.profilePhotoUrl,
            bloodGroup: data.bloodGroup,
            linkedinLink: data.linkedinLink,
            githubLink: data.githubLink,
            portfolioLink: data.portfolioLink,
        };

        const merged = { ...data, ...normalized };
        setStudentData(merged);
        const processedSkills = Array.isArray(merged.skills) ? merged.skills : parseMultiValue(merged.skillSet || '');
        setStudyCategory(merged.studyCategory || '12th');
        setCurrentYear(merged.currentYear ? String(merged.currentYear) : '');
        setCurrentSemester(merged.currentSemester ? String(merged.currentSemester) : '');
        setSelectedSection(merged.section ? String(merged.section) : '');
        setSkills(processedSkills);

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
            // Resolve GridFS URLs to full backend URL for display
            const resolvedUrl = gridfsService.getFileUrl(merged.profilePicURL);
            setProfileImage(resolvedUrl);
        }

        setIsInitialLoading(false);
    }, []);

    const loadStudentData = useCallback(async () => {
        if (!studentId) return;

        try {
            setIsInitialLoading(true);
            console.log('Loading student data for ID:', studentId);

            // Try fastDataService first
            const data = await fastDataService.getStudentData(studentId);
            console.log('Loaded student data:', data);

            if (data) {
                populateFormFields(data);
            } else {
                // Fallback to mongoDBService if fastDataService fails
                const fallbackData = await mongoDBService.getStudentById(studentId);
                if (fallbackData) populateFormFields(fallbackData);
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            alert('Error loading student data. Please try again.');
        }
    }, [studentId, populateFormFields]);

    useEffect(() => {
        if (studentId) {
            loadStudentData();
        }
    }, [studentId, loadStudentData]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    if (isInitialLoading) {
        return (
            <div className={styles.container}>
                <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className={styles.main}>
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onLogout={onLogout}
                        currentView={'manage-students'}
                        onViewChange={handleViewChange}
                        studentData={studentData}
                    />
                    <div className={styles.dashboardArea}>
                        <div className={styles.initialLoaderOverlay}>
                            <div className={styles.initialLoaderCard}>
                                <div className={styles.loadingSpinner}></div>
                                <h3>Loading Student Data...</h3>
                                <p>Please wait while we fetch the student information.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={styles.main}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'manage-students'}
                    onViewChange={handleViewChange}
                    studentData={studentData}
                />
                <div className={styles.dashboardArea}>
                    <div className={styles.viewOnlyContainer}>
                        {/* --- PERSONAL INFO --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Personal Information</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label>Current Year</label>
                                    <select value={currentYear} disabled>
                                        <option value="" disabled>Current Year</option>
                                        <option value="I">I</option>
                                        <option value="II">II</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Current Semester</label>
                                    <select value={currentSemester} disabled>
                                        <option value="" disabled>{currentYear ? 'Current Semester' : 'Select Year First'}</option>
                                        {getAvailableSemesters(currentYear).map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Section</label>
                                    <input type="text" value={selectedSection || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Register Number</label>
                                    <input type="text" value={studentData?.registerNumber || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>First Name</label>
                                    <input type="text" value={studentData?.firstName || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Last Name</label>
                                    <input type="text" value={studentData?.lastName || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Date of Birth</label>
                                    <input type="text" value={dob ? dob.toLocaleDateString() : ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Address</label>
                                    <input type="text" value={studentData?.address || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>City</label>
                                    <input type="text" value={studentData?.city || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Primary Email</label>
                                    <input type="email" value={studentData?.primaryEmail || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Secondary Email</label>
                                    <input type="email" value={studentData?.secondaryEmail || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.mobileNo || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Father Occupation</label>
                                    <input type="text" value={studentData?.fatherOccupation || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Father Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.fatherMobile || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Mother Occupation</label>
                                    <input type="text" value={studentData?.motherOccupation || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Mother Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.motherMobile || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Guardian Name</label>
                                    <input type="text" value={studentData?.guardianName || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Guardian Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.guardianMobile || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>

                                {/* Profile Image Section - View Only */}
                                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                    <label>Profile Photo</label>
                                    <div className={styles.imageUploadContainer}>
                                        {profileImage ? (
                                            <div className={styles.imagePreviewContainer}>
                                                <img src={profileImage} alt="Profile" className={styles.profileImagePreview} />
                                            </div>
                                        ) : (
                                            <div className={styles.noImagePlaceholder}>
                                                <img src={Adminicons} alt="No Profile" className={styles.placeholderIcon} />
                                                <span>No profile photo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label>Blood Group</label>
                                    <input type="text" value={studentData?.bloodGroup || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>LinkedIn Link</label>
                                    <input type="url" value={studentData?.linkedinLink || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>GitHub Link</label>
                                    <input type="url" value={studentData?.githubLink || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Portfolio Link</label>
                                    <input type="url" value={studentData?.portfolioLink || ''} readOnly />
                                </div>
                            </div>
                        </div>

                        {/* --- COMPANY DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Company Details</h3>
                            <div className={styles.companyStatsGrid}>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Total Companies Attended</span>
                                    <span className={styles.companyStatValue}>{companyStats.totalCompaniesAttended}</span>
                                </div>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Total Drive Attended</span>
                                    <span className={styles.companyStatValue}>{companyStats.totalDrivesAttended}</span>
                                </div>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Shortlisted Count</span>
                                    <span className={styles.companyStatValue}>{companyStats.shortlistedCount}</span>
                                </div>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Preferred Mode of Drive</span>
                                    <span className={styles.companyStatValue}>{companyStats.preferredModeOfDrive}</span>
                                </div>
                                <div className={styles.companyStatCardEmpty}>
                                    <span className={styles.companyStatLabel}>#Last Drive Attended</span>
                                    <span className={styles.companyStatValueEmpty}>{companyStats.lastDriveAttended}</span>
                                </div>
                                <div className={styles.companyStatCardEmpty}>
                                    <span className={styles.companyStatLabel}>#Last Drive Result</span>
                                    <span className={styles.companyStatValueEmpty}>{companyStats.lastDriveResult}</span>
                                </div>
                            </div>
                            <div className={styles.companyBottomRow}>
                                <div className={styles.successRateWrapper}>
                                    <div className={styles.successRateCircleContainer}>
                                        <svg className={styles.successRateSvg} viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e8e8e8" strokeWidth="10" />
                                            <circle
                                                cx="60" cy="60" r="50" fill="none"
                                                stroke="#B84349"
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray="314.16"
                                                strokeDashoffset={314.16 * (1 - successRate / 100)}
                                                transform="rotate(-90 60 60)"
                                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                                            />
                                        </svg>
                                        <div className={styles.successRateInner}>
                                            <span className={styles.successRateLabel}>Success Rate %</span>
                                            <span className={styles.successRateNum}>{successRate}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.performanceInsightsCard}>
                                    <h4 className={styles.insightsTitle}>Top performance Insights</h4>
                                    <div className={styles.insightRow}>
                                        <span className={styles.insightLabel}>Highest Package Drive :</span>
                                        <span className={styles.insightValue}>{companyStats.highestPackageDrive} LPA</span>
                                    </div>
                                    <div className={styles.insightRow}>
                                        <span className={styles.insightLabel}>Total Rounds Cleared :</span>
                                        <span className={styles.insightValue}>{companyStats.totalRoundsCleared}</span>
                                    </div>
                                </div>
                                <div className={styles.viewAnalysisButtonWrapper}>
                                    <button
                                        className={styles.viewAnalysisBtn}
                                        onClick={() => setShowAnalysis(!showAnalysis)}
                                    >
                                        {showAnalysis ? 'Hide Analysis' : 'View Analysis'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- SKILLS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Skills</h3>
                            <div className={styles.skillsContainer}>
                                <div className={styles.skillsList}>
                                    {skills.length > 0 ? skills.map((skill, index) => (
                                        <div key={index} className={styles.skillItem}>
                                            <input
                                                type="text"
                                                value={skill}
                                                readOnly
                                                placeholder={`Skill ${index + 1}`}
                                            />
                                        </div>
                                    )) : (
                                        <div className={styles.noSkillsMessage}>No skills added</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- OTHER DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Other Details</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label>Residential Status</label>
                                    <select value={studentData?.residentialStatus || ''} disabled>
                                        <option value="" disabled>Residential status</option>
                                        <option value="rural">Rural</option>
                                        <option value="urban">Urban</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Languages Known</label>
                                    <input type="text" value={studentData?.languagesKnown || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Passport No.</label>
                                    <input type="text" value={studentData?.passportNo || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Skill Set</label>
                                    <input type="text" value={studentData?.skillSet || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Value Added Courses</label>
                                    <input type="text" value={studentData?.valueAddedCourses || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>About Sibling</label>
                                    <input type="text" value={studentData?.aboutSibling || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Student ID</label>
                                    <input type="text" value={studentData?.studentId || ''} readOnly className={styles.readOnlyInput} />
                                </div>
                                <div className={styles.field}>
                                    <label>Family Annual Income</label>
                                    <input type="text" value={studentData?.familyAnnualIncome || ''} readOnly />
                                </div>
                            </div>
                        </div>

                        {/* --- PREFERENCE DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Preference Details</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label>Company Types</label>
                                    <div className={styles.checkboxGroup}>
                                        {COMPANY_TYPE_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCompanyTypes.includes(option)}
                                                    disabled
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Preferred Job Location</label>
                                    <div className={styles.checkboxGroup}>
                                        {JOB_LOCATION_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedJobLocations.includes(option)}
                                                    disabled
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Preferred Training</label>
                                    <div className={styles.checkboxGroup}>
                                        {PREFERRED_TRAINING_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTrainings.includes(option)}
                                                    disabled
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <input type="hidden" name="companyTypes" value={companyTypesHiddenValue} />
                                <input type="hidden" name="preferredJobLocation" value={jobLocationsHiddenValue} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
}

export default Coo_ManageStudentView;