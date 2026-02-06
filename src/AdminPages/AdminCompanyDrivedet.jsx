import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';
import Viewicon from "../assets/Viewicon.svg";
import PlacedStudentsCap from '../assets/CompanydriveReportAnalysisicon.svg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.png";
import Navbar from "../components/Navbar/Adnavbar.js";
import Sidebar from "../components/Sidebar/Adsidebar.js";
import mongoDBService from '../services/mongoDBService';
import * as XLSX from 'xlsx';
import styles from './AdminCompanyDrivedet.module.css';

// Success Popup Component
const RoundSaveSuccessPopup = ({ onClose, nextRound }) => {
  return (
    <div className={styles['Admin-Drive-AD-Success-overlay']} onClick={onClose}>
      <div className={styles['Admin-Drive-AD-Success-container']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['Admin-Drive-AD-Success-header']}>
          Saved !
        </div>
        <div className={styles['Admin-Drive-AD-Success-content']}>
          <div className={styles['Admin-Drive-AD-Success-icon-wrapper']}>
            <svg className={styles['Admin-Drive-AD-Success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles['Admin-Drive-AD-Success-icon-circle']} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles['Admin-Drive-AD-Success-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <h3 className={styles['Admin-Drive-AD-Success-title']}>
            Round Results Saved ✓
          </h3>
          <p className={styles['Admin-Drive-AD-Success-text']}>
            {nextRound ? `Moving to Round ${nextRound}...` : 'Round results have been successfully saved'}
          </p>
        </div>
        <div className={styles['Admin-Drive-AD-Success-footer']}>
          <button className={styles['Admin-Drive-AD-Success-close-btn']} onClick={onClose}>
            {nextRound ? 'Loading...' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Validation Warning Popup Component
const NoStatusMarkedPopup = ({ onShow }) => {
  return (
    <div className={styles['Admin-at-popup-overlay']}>
      <div className={styles['Admin-popup-container']}>
        <div className={styles['Admin-popup-header-warning']}>Status Not Marked!</div>
        <div className={styles['Admin-popup-body']}>
          <svg className={styles['Admin-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={styles['Admin-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
            <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none"/>
          </svg>
          <h2 className={styles['Admin-status-title']}>
            Please Mark Student Status
          </h2>
          <p className={styles['Admin-status-text']} style={{ margin: '1.5rem 0', fontSize: 16, color: '#6B6D74' }}>
            Please mark at least one student as <span style={{ fontWeight: 'bold', color: '#4EA24E' }}>Passed</span> or <span style={{ fontWeight: 'bold', color: '#E62727' }}>Failed</span> before saving.
          </p>
        </div>
        <div className={styles['Admin-popup-footer']}>
          <button onClick={onShow} className={styles['Admin-popup-show-btn']}>Show</button>
        </div>
      </div>
    </div>
  );
};

function Admincdd() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [filterData, setFilterData] = useState({
    batch: '',
    registerNo: '',
    cgpa: '',
    skills: ''
  });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [nextRoundNumber, setNextRoundNumber] = useState(null);
  const [isLastRoundSaved, setIsLastRoundSaved] = useState(false);
  const [isLastRound, setIsLastRound] = useState(false);
  const [allStudentsData, setAllStudentsData] = useState([]);
  const [originalAttendanceStudents, setOriginalAttendanceStudents] = useState([]); // Store Round 1 students
  const [allRoundResults, setAllRoundResults] = useState(null);
  const tableRef = useRef(null);

  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    rounds: '',
    jobRole: '',
    currentRound: ''
  });

  // Fetch drive data and students when component mounts
  useEffect(() => {
    const fetchDriveData = async () => {
      try {
        setIsLoading(true);
        
        // Get company data from navigation state
        const companyData = location.state?.company;
        
        if (!companyData) {
          console.error('No company data found');
          navigate('/admin-company-drive');
          return;
        }

        console.log('Initial company data from navigation:', companyData);
        console.log('Company data _id:', companyData._id);
        console.log('Company data keys:', Object.keys(companyData));

        // Handle case where companyData has a drives array (grouped data structure)
        let actualCompanyData = companyData;
        if (companyData.drives && Array.isArray(companyData.drives) && companyData.drives.length > 0) {
          console.log('⚠️ Detected drives array in company data');
          
          // Try to find the specific drive based on additional navigation state
          const targetDriveId = location.state?.driveId;
          const targetStartDate = location.state?.startingDate || companyData.startingDate;
          
          if (targetDriveId) {
            // If driveId was passed, find by ID
            const foundDrive = companyData.drives.find(d => d._id === targetDriveId);
            if (foundDrive) {
              actualCompanyData = foundDrive;
              console.log('✅ Found drive by ID:', targetDriveId);
            } else {
              console.warn('⚠️ Could not find drive with ID:', targetDriveId, '- using first drive');
              actualCompanyData = companyData.drives[0];
            }
          } else if (targetStartDate) {
            // If startingDate was passed, find by date
            const foundDrive = companyData.drives.find(d => 
              d.startingDate && new Date(d.startingDate).toDateString() === new Date(targetStartDate).toDateString()
            );
            if (foundDrive) {
              actualCompanyData = foundDrive;
              console.log('✅ Found drive by date:', targetStartDate);
            } else {
              console.warn('⚠️ Could not find drive with date:', targetStartDate, '- using first drive');
              actualCompanyData = companyData.drives[0];
            }
          } else {
            // Fallback to first drive
            console.warn('⚠️ No driveId or startingDate specified - extracting first drive');
            actualCompanyData = companyData.drives[0];
          }
          
          console.log('Extracted drive data:', actualCompanyData);
        }

        // Fetch the full drive data from database to ensure we have complete information including rounds
        // Use the UNIQUE _id to identify the drive, not just company name and job role
        let fullDriveData = actualCompanyData;
        try {
          const allDrives = await mongoDBService.getCompanyDrives();
          const matchingDrive = allDrives.find(drive => 
            drive._id === actualCompanyData._id || // Use unique _id for exact match
            (drive.companyName === actualCompanyData.companyName && 
             drive.jobRole === actualCompanyData.jobRole &&
             drive.startingDate === actualCompanyData.startingDate) // Include date check as fallback
          );
          
          if (matchingDrive) {
            console.log('Found matching drive from database:', matchingDrive);
            fullDriveData = matchingDrive;
          }
        } catch (error) {
          console.error('Error fetching full drive data:', error);
          // Continue with navigation state data if fetch fails
        }

        // Validate that we have a driveId
        if (!fullDriveData._id) {
          console.error('❌ No driveId found in company data');
          console.error('Full drive data:', fullDriveData);
          alert('Error: Drive ID is missing. Please try selecting the drive again from the Company Drive page.');
          navigate('/admin-company-drive');
          return;
        }
        
        console.log('✅ Drive ID found:', fullDriveData._id);

        // Set company info - ensure we get the actual number of rounds from the drive
        const numberOfRounds = parseInt(fullDriveData.rounds) || parseInt(fullDriveData.numberOfRounds) || parseInt(fullDriveData.round) || 1;
        const roundNames = fullDriveData.roundDetails || [];
        const currentRoundNumber = parseInt(fullDriveData.currentRound) || 1;
        const currentRoundName = roundNames[currentRoundNumber - 1] || `Round ${currentRoundNumber}`;
        
        console.log('Company data rounds:', {
          fullDriveData,
          rounds: fullDriveData.rounds,
          numberOfRounds: fullDriveData.numberOfRounds,
          round: fullDriveData.round,
          finalRounds: numberOfRounds,
          roundNames: roundNames,
          roundDetailsLength: roundNames.length
        });
        
        setCompanyInfo({
          companyName: fullDriveData.companyName || 'N/A',
          rounds: numberOfRounds,
          jobRole: fullDriveData.jobRole || 'N/A',
          currentRound: currentRoundName,
          currentRoundNumber: currentRoundNumber,
          roundNames: roundNames,
          driveId: fullDriveData._id,
          startingDate: fullDriveData.startingDate
        });

        console.log('✅ Company info set with rounds:', numberOfRounds, 'round names:', roundNames);

        // Fetch attendance data for this company and job role
        const attendanceResponse = await mongoDBService.getAllAttendances();
        console.log('Attendance response:', attendanceResponse);
        console.log('Company data for filtering:', {
          companyName: fullDriveData.companyName,
          jobRole: fullDriveData.jobRole
        });
        
        const attendanceData = Array.isArray(attendanceResponse) 
          ? attendanceResponse 
          : (attendanceResponse.data || attendanceResponse.attendances || []);

        console.log('Attendance data array:', attendanceData);
        console.log('Attendance data length:', attendanceData.length);

        // Filter attendance for this specific company, job role, AND dates
        const companyAttendances = attendanceData.filter(att => {
          console.log('Comparing:', {
            attCompany: att.companyName,
            attJobRole: att.jobRole,
            attStartDate: att.startDate,
            targetCompany: fullDriveData.companyName,
            targetJobRole: fullDriveData.jobRole,
            targetStartDate: fullDriveData.startingDate,
            companyMatch: att.companyName === fullDriveData.companyName,
            jobRoleMatch: att.jobRole === fullDriveData.jobRole,
            dateMatch: att.startDate && fullDriveData.startingDate ? 
              new Date(att.startDate).toDateString() === new Date(fullDriveData.startingDate).toDateString() : true
          });
          // Match by company, job role, AND starting date
          return att.companyName === fullDriveData.companyName && 
                 att.jobRole === fullDriveData.jobRole &&
                 (!att.startDate || !fullDriveData.startingDate || 
                  new Date(att.startDate).toDateString() === new Date(fullDriveData.startingDate).toDateString());
        });

        console.log('Filtered company attendances:', companyAttendances);

        // Fetch all round results for this specific company drive (using driveId for uniqueness)
        // Only fetch if driveId exists
        let roundResultsResponse = null;
        if (fullDriveData._id) {
          roundResultsResponse = await mongoDBService.getAllRoundResults(
            fullDriveData.companyName,
            fullDriveData.jobRole,
            fullDriveData.startingDate,
            fullDriveData._id // Pass the unique drive ID
          );
          setAllRoundResults(roundResultsResponse);
          console.log('Round results for drive ID:', fullDriveData._id, roundResultsResponse);
        } else {
          console.warn('No driveId available, skipping round results fetch');
          setAllRoundResults(null);
        }

        if (companyAttendances.length > 0) {
          // Get the latest attendance record
          const latestAttendance = companyAttendances[0];
          const presentStudents = (latestAttendance.students || []).filter(s => 
            s.status && (s.status.toLowerCase() === 'present' || s.status === 'Present')
          );

          console.log('Present students:', presentStudents);
          console.log('Latest attendance:', latestAttendance);

          // Fetch full student details for present students
          if (presentStudents.length > 0) {
            const studentsData = await Promise.all(
              presentStudents.map(async (attendanceStudent) => {
                try {
                  const student = await mongoDBService.getStudentById(attendanceStudent.studentId);
                  return {
                    id: student._id,
                    name: student.name || attendanceStudent.name || 'N/A',
                    registerNo: student.registerNo || attendanceStudent.regNo || 'N/A',
                    branch: student.department || student.branch || attendanceStudent.department || 'N/A',
                    department: student.department || student.branch || attendanceStudent.department || 'N/A',
                    batch: attendanceStudent.batch || student.batch || `${student.yearOfJoining || 'N/A'}-${(parseInt(student.yearOfJoining) + 4) || 'N/A'}`,
                    yearSec: attendanceStudent.yearSec || `${student.year || 'N/A'}-${student.section || 'N/A'}`,
                    semester: attendanceStudent.semester || student.semester || 'N/A',
                    section: student.section || 'N/A',
                    cgpa: student.cgpa || 'N/A',
                    skills: Array.isArray(student.skills) ? student.skills.join(', ') : (student.skills || 'N/A'),
                    phone: attendanceStudent.phoneNo || student.mobile || 'N/A',
                    email: student.primaryEmail || student.email || attendanceStudent.email || 'N/A',
                    photo: student.photo || null,
                    passed: false,
                    failed: false,
                    confirmed: false
                  };
                } catch (error) {
                  console.error(`Error fetching student ${attendanceStudent.studentId}:`, error);
                  // Return basic info from attendance if full fetch fails
                  return {
                    id: attendanceStudent.studentId,
                    name: attendanceStudent.name || 'N/A',
                    registerNo: attendanceStudent.regNo || 'N/A',
                    batch: attendanceStudent.batch || 'N/A',
                    yearSec: attendanceStudent.yearSec || 'N/A',
                    semester: attendanceStudent.semester || 'N/A',
                    section: 'N/A',
                    cgpa: 'N/A',
                    skills: 'N/A',
                    phone: attendanceStudent.phoneNo || 'N/A',
                    email: 'N/A',
                    photo: null,
                    branch: attendanceStudent.department || attendanceStudent.branch || 'N/A',
                    department: attendanceStudent.department || attendanceStudent.branch || 'N/A',
                    passed: false,
                    failed: false,
                    confirmed: false
                  };
                }
              })
            );

            setAllStudentsData(studentsData);
            setOriginalAttendanceStudents(studentsData); // Store original Round 1 students
            
            // Load saved statuses for Round 1 if exists (NEW NESTED STRUCTURE)
            if (roundResultsResponse && roundResultsResponse.data) {
              const driveData = roundResultsResponse.data;
              const round1Data = driveData.rounds?.find(r => r.roundNumber === 1);
              
              if (round1Data) {
                const savedStatuses = {};
                
                // Load from passed students
                round1Data.passedStudents?.forEach(student => {
                  savedStatuses[student.studentId] = {
                    passed: true,
                    failed: false,
                    confirmed: true
                  };
                });
                
                // Load from failed students
                round1Data.failedStudents?.forEach(student => {
                  savedStatuses[student.studentId] = {
                    passed: false,
                    failed: true,
                    confirmed: true
                  };
                });
                
                setStudentStatuses(prev => ({ ...prev, ...savedStatuses }));
              }
            }
          } else {
            setAllStudentsData([]);
          }
        } else {
          setAllStudentsData([]);
        }
      } catch (error) {
        console.error('Error fetching drive data:', error);
        console.error('Error details:', error.message, error.stack);
        alert(`Failed to load drive data: ${error.message || 'Please try again.'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriveData();
  }, [location.state, navigate]);

  // Sample student data for all rounds (fallback/demo data)
  const allRoundsData = {
    [activeRound]: allStudentsData
  };

  // Get current round student data
  const getCurrentRoundData = () => {
    return allStudentsData;
  };

  const studentData = getCurrentRoundData();

  const [studentStatuses, setStudentStatuses] = useState(() => {
    const allStatuses = {};
    Object.keys(allRoundsData).forEach(round => {
      allRoundsData[round].forEach(student => {
        if (!allStatuses[student.id]) {
          allStatuses[student.id] = {
            passed: student.passed,
            failed: student.failed,
            confirmed: student.confirmed
          };
        }
      });
    });
    return allStatuses;
  });

  const handleFilterChange = (field, value) => {
    setFilterData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilter = () => {
    const filtered = studentData.filter(student => {
      const batchMatch = !filterData.batch || student.batch === filterData.batch;
      const regMatch = !filterData.registerNo || student.registerNo.includes(filterData.registerNo);
      const cgpaMatch = !filterData.cgpa || student.cgpa.includes(filterData.cgpa);
      const skillsMatch = !filterData.skills || student.skills.toLowerCase().includes(filterData.skills.toLowerCase());
      return batchMatch && regMatch && cgpaMatch && skillsMatch;
    });
    setFilteredStudents(filtered);
    setIsFiltered(true);
  };

  const handleClear = () => {
    setFilterData({
      batch: '',
      registerNo: '',
      cgpa: '',
      skills: ''
    });
    setFilteredStudents([]);
    setIsFiltered(false);
  };

  const handleStatusChange = (studentId, statusType) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        passed: statusType === 'passed',
        failed: statusType === 'failed'
      }
    }));
  };

  const handleConfirmToggle = (studentId) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        confirmed: !prev[studentId].confirmed
      }
    }));
  };

  const handleSave = async () => {
    try {
      const companyData = location.state?.company;
      if (!companyData) {
        return;
      }

      // Use the driveId from companyInfo state (already validated during initial load)
      const driveId = companyInfo.driveId;
      
      if (!driveId) {
        alert('Error: Drive ID is missing. Please refresh the page and try again.');
        return;
      }

      // Handle case where companyData has a drives array (grouped data structure)
      let actualCompanyData = companyData;
      if (companyData.drives && Array.isArray(companyData.drives) && companyData.drives.length > 0) {
        actualCompanyData = companyData.drives[0];
      }

      // Fetch the full drive data to get complete information including package
      let fullDriveData = actualCompanyData;
      try {
        const allDrives = await mongoDBService.getCompanyDrives();
        const matchingDrive = allDrives.find(drive => 
          drive._id === driveId || // Use the validated driveId
          drive._id === actualCompanyData._id || 
          (drive.companyName === actualCompanyData.companyName && 
           drive.jobRole === actualCompanyData.jobRole &&
           drive.startingDate === actualCompanyData.startingDate)
        );
        
        if (matchingDrive) {
          fullDriveData = matchingDrive;
          console.log('Full drive data for saving:', fullDriveData);
        }
      } catch (error) {
        console.error('Error fetching full drive data for save:', error);
      }

      // Prepare round results - ONLY include students who have been marked (passed or failed)
      const roundResults = displayStudents
        .filter(student => studentStatuses[student.id]?.passed || studentStatuses[student.id]?.failed)
        .map(student => ({
          studentId: student.id,
          name: student.name,
          registerNo: student.registerNo,
          yearSec: student.yearSec,
          semester: student.semester,
          batch: student.batch,
          phone: student.phone,
          branch: student.branch || student.department || 'N/A',
          department: student.department || student.branch || 'N/A',
          email: student.email || 'N/A',
          studentEmail: student.email || 'N/A',
          status: studentStatuses[student.id]?.passed ? 'Passed' : 'Failed',
          roundNumber: activeRound
        }));

      // Validation: Check if ALL students have been marked
      const totalStudents = displayStudents.length;
      const markedStudents = roundResults.length;
      
      if (markedStudents < totalStudents) {
        // Some students are not marked - show validation popup
        setShowValidationPopup(true);
        return;
      }

      // Only set saving state after validation passes
      setIsSaving(true);

      const roundName = companyInfo.roundNames?.[activeRound - 1] || `Round ${activeRound}`;
      
      const roundData = {
        driveId: driveId, // Use the validated driveId from companyInfo
        companyName: actualCompanyData.companyName || companyInfo.companyName,
        jobRole: actualCompanyData.jobRole || companyInfo.jobRole,
        startingDate: actualCompanyData.startingDate || companyInfo.startingDate,
        endingDate: actualCompanyData.endingDate || companyInfo.endingDate,
        roundNumber: activeRound,
        roundName: roundName,
        totalRounds: companyInfo.rounds,
        students: roundResults,
        date: new Date().toISOString()
      };

      console.log('💾 Saving round data with driveId:', roundData.driveId);

      // Save round results to Reports collection (NEW NESTED STRUCTURE)
      const result = await mongoDBService.saveRoundResults(roundData);
      console.log('Round results saved:', result);

      // Update student applications with round results
      try {
        const updateResult = await mongoDBService.updateStudentApplicationRounds(roundData);
        console.log('Student applications updated:', updateResult);
      } catch (updateError) {
        console.error('Error updating student applications:', updateError);
        // Don't fail the entire save if application update fails
      }

      // Show success popup
      const totalRounds = companyInfo.rounds || 1;
      const willAdvance = activeRound < totalRounds;
      const lastRound = activeRound === totalRounds;
      
      // Set last round state
      setIsLastRound(lastRound);
      setIsLastRoundSaved(false); // Reset before attempting save
      
      if (willAdvance) {
        setNextRoundNumber(activeRound + 1);
      } else {
        setNextRoundNumber(null);
      }
      
      setShowSuccessPopup(true);
      
      // Refresh all round results after save
      const updatedResults = await mongoDBService.getAllRoundResults(
        actualCompanyData.companyName || companyInfo.companyName,
        actualCompanyData.jobRole || companyInfo.jobRole,
        actualCompanyData.startingDate || companyInfo.startingDate,
        driveId // Use the validated driveId
      );
      setAllRoundResults(updatedResults);
      
      console.log('Updated round results after save:', updatedResults);

      // If this is the last round, save passed students to PlacedStudent collection
      if (lastRound) {
        try {
          const passedStudents = roundResults.filter(student => student.status === 'Passed');
          
          if (passedStudents.length > 0) {
            // Get package from multiple possible field names
            const packageValue = fullDriveData.package || fullDriveData.pkg || fullDriveData.packageOffered || fullDriveData.salary || 'N/A';
            console.log('Package value for placed students:', packageValue);
            
            const placedStudentsData = {
              companyName: fullDriveData.companyName,
              jobRole: fullDriveData.jobRole,
              students: passedStudents.map(student => ({
                studentId: student.studentId,
                name: student.name,
                regNo: student.registerNo,
                dept: student.department || student.branch,
                batch: student.batch,
                company: fullDriveData.companyName,
                role: fullDriveData.jobRole,
                pkg: packageValue,
                date: new Date().toLocaleDateString('en-GB'),
                status: 'Accepted',
                yearSec: student.yearSec,
                semester: student.semester,
                phone: student.phone,
                email: student.email
              }))
            };

            const placedResult = await mongoDBService.savePlacedStudents(placedStudentsData);
            console.log('Placed students saved:', placedResult);
            setIsLastRoundSaved(true);
          } else {
            console.log('No students passed the last round');
            setIsLastRoundSaved(true); // Set to true even if no students passed
          }
        } catch (placedError) {
          console.error('Error saving placed students:', placedError);
          alert('Round results saved, but failed to save to Placed Students. You can add them manually from the Placed Students page.');
          setIsLastRoundSaved(true); // Still set to true so redirect works
        }
      }
      
      // Auto-advance to next round if not the last round
      if (willAdvance) {
        // Wait a moment for user to see the popup, then load next round
        setTimeout(async () => {
          // Pass the updated results to handleRoundChange
          await handleRoundChange(activeRound + 1, updatedResults);
          // Close popup after students are loaded
          setTimeout(() => {
            setShowSuccessPopup(false);
            setNextRoundNumber(null);
            setIsSaving(false);
          }, 800);
        }, 1500);
      } else {
        // Last round - DON'T auto-close, let user click Close to redirect
        setIsSaving(false);
      }
      
    } catch (error) {
      console.error('Error saving round results:', error);
      alert('Failed to save round results. Please try again.');
      setIsSaving(false);
    }
  };

  const handleClearStatuses = () => {
    const resetStatuses = {};
    Object.keys(allRoundsData).forEach(round => {
      allRoundsData[round].forEach(student => {
        resetStatuses[student.id] = {
          passed: false,
          failed: false,
          confirmed: false
        };
      });
    });
    setStudentStatuses(resetStatuses);
  };

  const handleRoundChange = async (round, updatedRoundResults = null) => {
    setActiveRound(round);
    setIsFiltered(false);
    setFilteredStudents([]);
    setIsLoading(true);
    
    try {
      const companyData = location.state?.company;
      if (!companyData) {
        setIsLoading(false);
        return;
      }
      
      // Use passed results or state results
      const roundResults = updatedRoundResults || allRoundResults;
      
      if (!roundResults) {
        console.log('No round results available yet');
        setIsLoading(false);
        return;
      }

      // Update the round name in companyInfo
      const roundName = companyInfo.roundNames?.[round - 1] || `Round ${round}`;
      setCompanyInfo(prev => ({
        ...prev,
        currentRound: roundName,
        currentRoundNumber: round
      }));

      // NEW: Work with nested structure - roundResults.data is now the drive document
      const driveData = roundResults.data;
      console.log('Drive data for round change:', driveData);
      console.log('Looking for round:', round);
      console.log('Available rounds:', driveData?.rounds);
      
      const currentRoundData = driveData?.rounds?.find(r => r.roundNumber === round);

      // For Round 1, load from attendance. For Round 2+, load from previous round's passed students
      if (round === 1) {
        // Round 1 - always reload the original attendance students
        setAllStudentsData(originalAttendanceStudents);
        
        // Then restore saved statuses if they exist
        if (currentRoundData) {
          const savedStatuses = {};
          
          // Load from passed students
          currentRoundData.passedStudents?.forEach(student => {
            savedStatuses[student.studentId] = {
              passed: true,
              failed: false,
              confirmed: true
            };
          });
          
          // Load from failed students
          currentRoundData.failedStudents?.forEach(student => {
            savedStatuses[student.studentId] = {
              passed: false,
              failed: true,
              confirmed: true
            };
          });
          
          setStudentStatuses(savedStatuses);
        } else {
          setStudentStatuses({});
        }
      } else if (round > 1) {
        const previousRoundData = driveData?.rounds?.find(r => r.roundNumber === round - 1);
        
        console.log('Previous round data:', previousRoundData);
        console.log('Passed students from previous round:', previousRoundData?.passedStudents);

        if (previousRoundData && previousRoundData.passedStudents) {
          const passedStudents = previousRoundData.passedStudents;

          if (passedStudents.length > 0) {
            const studentsToShow = await Promise.all(
              passedStudents.map(async (roundStudent) => {
                try {
                  const student = await mongoDBService.getStudentById(roundStudent.studentId);
                  return {
                    id: student._id,
                    name: student.name || roundStudent.name || 'N/A',
                    registerNo: student.registerNo || roundStudent.registerNo || 'N/A',
                    batch: roundStudent.batch || student.batch || `${student.yearOfJoining || 'N/A'}-${(parseInt(student.yearOfJoining) + 4) || 'N/A'}`,
                    yearSec: roundStudent.yearSec || `${student.year || 'N/A'}-${student.section || 'N/A'}`,
                    semester: roundStudent.semester || student.semester || 'N/A',
                    section: student.section || 'N/A',
                    cgpa: student.cgpa || 'N/A',
                    skills: Array.isArray(student.skills) ? student.skills.join(', ') : (student.skills || 'N/A'),
                    phone: roundStudent.phone || student.mobile || 'N/A',
                    email: student.primaryEmail || student.email || 'N/A',
                    photo: student.photo || null,
                    branch: student.department || student.branch || roundStudent.department || roundStudent.branch || 'N/A',
                    department: student.department || student.branch || roundStudent.department || 'N/A',
                    passed: false,
                    failed: false,
                    confirmed: false
                  };
                } catch (error) {
                  console.error(`Error fetching student ${roundStudent.studentId}:`, error);
                  return {
                    id: roundStudent.studentId,
                    name: roundStudent.name || 'N/A',
                    registerNo: roundStudent.registerNo || 'N/A',
                    batch: roundStudent.batch || 'N/A',
                    yearSec: roundStudent.yearSec || 'N/A',
                    semester: roundStudent.semester || 'N/A',
                    section: 'N/A',
                    cgpa: 'N/A',
                    skills: 'N/A',
                    phone: roundStudent.phone || 'N/A',
                    email: roundStudent.email || 'N/A',
                    photo: null,
                    branch: roundStudent.branch || roundStudent.department || 'N/A',
                    department: roundStudent.department || roundStudent.branch || 'N/A',
                    passed: false,
                    failed: false,
                    confirmed: false
                  };
                }
              })
            );

            // Update the allStudentsData for this round
            setAllStudentsData(studentsToShow);
            
            // Load saved statuses for this round if exists
            if (currentRoundData) {
              const savedStatuses = {};
              
              // Load from passed students
              currentRoundData.passedStudents?.forEach(student => {
                savedStatuses[student.studentId] = {
                  passed: true,
                  failed: false,
                  confirmed: true
                };
              });
              
              // Load from failed students
              currentRoundData.failedStudents?.forEach(student => {
                savedStatuses[student.studentId] = {
                  passed: false,
                  failed: true,
                  confirmed: true
                };
              });
              
              setStudentStatuses(savedStatuses);
            } else {
              // Reset statuses for new round
              const resetStatuses = {};
              studentsToShow.forEach(student => {
                resetStatuses[student.id] = {
                  passed: false,
                  failed: false,
                  confirmed: false
                };
              });
              setStudentStatuses(resetStatuses);
            }
          } else {
            setAllStudentsData([]);
          }
        } else {
          // No previous round data, no students for this round yet
          setAllStudentsData([]);
        }
      }
    } catch (error) {
      console.error('Error loading round data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayStudents = isFiltered ? filteredStudents : studentData;

  const handleExport = async (type) => {
    if (type === 'excel') {
      try {
        const table = document.querySelector('.Admin-cdd-profile-table');
        if (!table) {
          console.error('Table element not found for Excel export.');
          return;
        }
        const ws = XLSX.utils.table_to_sheet(table);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Company Drive Round ' + activeRound);
        XLSX.writeFile(wb, `company_drive_round_${activeRound}.xlsx`);
      } catch (error) {
        console.error('Excel export error:', error);
      }
    } else if (type === 'pdf') {
      try {
        const tableElement = tableRef.current;
        if (!tableElement) {
          console.error('Table element not found for PDF export.');
          return;
        }
        const pdf = new jsPDF('l', 'mm', 'a4');
        autoTable(pdf, { html: tableElement });
        pdf.save(`company_drive_round_${activeRound}.pdf`);
      } catch (error) {
        console.error('PDF export error:', error);
      }
    }
    setShowDropdown(false);
  };

  return (
    <>
      <div className={styles['Admin-cdd-main-wrapper']}>
        <Navbar />
        <div className={styles['Admin-cdd-layout-wrapper']}>
          <Sidebar />
          <div className={`${styles['Admin-cdd-container']} ${styles['Admin-cdd-content-wrapper']}`}>
            <div className={styles['Admin-cdd-dashboard-area']}>
            
            {/* Top Section with 3 Cards */}
            <div className={styles['Admin-cdd-top-section']}>
              {/* Left Card - Dynamic Round Total Students */}
              <div className={`${styles['Admin-cdd-summary-card']} ${styles['Admin-cdd-company-drive-card']}`}>
                <div className={styles['Admin-cdd-round-total-card']}>
                  <div className={styles['Admin-cdd-round-number']}>Round {activeRound}</div>
                  <div className={styles['Admin-cdd-total-students-text']}>Total Students</div>
                  <div className={styles['Admin-cdd-student-count']}>
                    {isLoading ? '...' : studentData.length}
                  </div>
                </div>
              </div>

              {/* Center Card - Company Drive Info */}
              <div className={styles['Admin-cdd-company-profile-search']}>
                <div className={styles['Admin-cdd-search-tab']}>Company Drive</div>
                <div className={styles['Admin-cdd-company-info-grid']}>
                  <div className={styles['Admin-cdd-info-field']}>
                    <div className={styles['Admin-cdd-info-label']}>Company Name</div>
                    <div className={styles['Admin-cdd-info-input']}>
                      {companyInfo.companyName}
                    </div>
                  </div>
                  <div className={styles['Admin-cdd-info-field']}>
                    <div className={styles['Admin-cdd-info-label']}>No. Of Rounds</div>
                    <div className={styles['Admin-cdd-info-input']}>
                      {companyInfo.rounds} Rounds
                    </div>
                  </div>
                  <div className={styles['Admin-cdd-info-field']}>
                    <div className={styles['Admin-cdd-info-label']}>Job Role</div>
                    <div className={styles['Admin-cdd-info-input']}>
                      {companyInfo.jobRole}
                    </div>
                  </div>
                  <div className={styles['Admin-cdd-info-field']}>
                    <div className={styles['Admin-cdd-info-label']}>Current Round</div>
                    <div className={styles['Admin-cdd-info-input']}>
                      {companyInfo.currentRound}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Card - Report Analysis */}
              <div 
                className={`${styles['Admin-cdd-summary-card1']} ${styles['Admin-cdd-placed-students-card']}`}
                onClick={() => navigate('/report-analysis')}
              >
                <div className={`${styles['Admin-cdd-summary-card-icon']} ${styles['Admin-cdd-report-icon-wrapper']}`}>
                  <img src={PlacedStudentsCap} alt="Report Analysis" className={styles['Admin-cdd-report-icon-img']} />
                </div>
                <div className={styles['Admin-cdd-summary-card-title-2']}>Report<br/> Analysis</div>
                <div className={styles['Admin-cdd-summary-card-desc-2']}>View and Analyse the Reports of the Student</div>
              </div>
            </div>

            {/* Round Tabs */}
            <div className={styles['Admin-cdd-round-tabs']}>
              {Array.from({ length: parseInt(companyInfo.rounds) || 1 }, (_, i) => i + 1).map(round => (
                <button
                  key={round}
                  className={`${styles['Admin-cdd-round-tab']} ${activeRound === round ? styles.active : ''} ${round >= 8 && round <= 9 ? styles['high-volume'] : ''}`}
                  onClick={() => handleRoundChange(round)}
                  style={round >= 8 && round <= 9 ? { 
                    position: 'relative',
                    overflow: 'visible'
                  } : {}}
                >
                  Round {round}
                  {round >= 8 && round <= 9 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      background: '#4EA24E',
                      borderRadius: '50%',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}>
                      ⚡
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Company Drive Table */}
            <div className={styles['Admin-cdd-company-profile']}>
              <div className={styles['Admin-cdd-profile-header']}>
                <div className={styles['Admin-cdd-profile-title']}>COMPANY DRIVE</div>
                <div className={styles['Admin-cdd-print-btn-container']}>
                  <button 
                    className={styles['Admin-cdd-print-btn']}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    Print
                  </button>
                  {showDropdown && (
                    <div className={styles['Admin-cdd-dropdown-menu']}>
                      <div className={styles['Admin-cdd-dropdown-item']} onClick={() => handleExport('excel')}>
                        Export to Excel
                      </div>
                      <div className={styles['Admin-cdd-dropdown-item']} onClick={() => handleExport('pdf')}>
                        Save as PDF
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles['Admin-cdd-table-container']}>
                <table className={styles['Admin-cdd-profile-table']} ref={tableRef}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Reg.No</th>
                      <th>Name</th>
                      <th>Year-Sec</th>
                      <th>Sem</th>
                      <th>Batch</th>
                      <th>Phone</th>
                      <th>Passed</th>
                      <th>Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '50px' }}>
                          <div style={{ display: 'inline-block', width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #4EA24E', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                          <div style={{ marginTop: '15px', color: '#666' }}>Loading students...</div>
                        </td>
                      </tr>
                    ) : displayStudents.length > 0 ? displayStudents.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.registerNo}</td>
                        <td>{student.name}</td>
                        <td>{student.yearSec}</td>
                        <td>{student.semester}</td>
                        <td>{student.batch}</td>
                        <td>{student.phone}</td>
                        <td>
                          <div 
                            className={`${styles['Admin-cdd-radio-button']} ${styles['Admin-cdd-radio-centered']} ${studentStatuses[student.id]?.passed ? styles.passed : ''}`}
                            onClick={() => handleStatusChange(student.id, 'passed')}
                          />
                        </td>
                        <td>
                          <div 
                            className={`${styles['Admin-cdd-radio-button']} ${styles['Admin-cdd-radio-centered']} ${studentStatuses[student.id]?.failed ? styles.failed : ''}`}
                            onClick={() => handleStatusChange(student.id, 'failed')}
                          />
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                          No students found for this drive
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className={styles['Admin-cdd-action-buttons']}>
                <button 
                  className={styles['Admin-cdd-save-btn']} 
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  className={styles['Admin-cdd-action-clear-btn']} 
                  onClick={handleClearStatuses}
                  disabled={isSaving}
                  style={{ opacity: isSaving ? 0.5 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      
      {/* Success Popup */}
      {showSuccessPopup && (
        <RoundSaveSuccessPopup 
          onClose={() => {
            if (!nextRoundNumber) {
              setShowSuccessPopup(false);
              setIsSaving(false);
              
              // If this is the last round, redirect to Placed Students page
              if (isLastRound) {
                console.log('Redirecting to placed students page...');
                navigate('/admin-placed-students');
              }
            }
          }} 
          nextRound={nextRoundNumber}
        />
      )}

      {/* Validation Popup */}
      {showValidationPopup && (
        <NoStatusMarkedPopup 
          onShow={() => {
            setShowValidationPopup(false);
            // Scroll to first UNMARKED student row and highlight it
            setTimeout(() => {
              const rows = document.querySelectorAll('tbody tr');
              let firstUnmarkedRow = null;
              
              // Find the first row where the student is not marked
              rows.forEach((row, index) => {
                if (!firstUnmarkedRow) {
                  const student = displayStudents[index];
                  if (student && !studentStatuses[student.id]?.passed && !studentStatuses[student.id]?.failed) {
                    firstUnmarkedRow = row;
                  }
                }
              });
              
              if (firstUnmarkedRow) {
                firstUnmarkedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstUnmarkedRow.style.backgroundColor = '#fff3cd';
                firstUnmarkedRow.style.transition = 'background-color 0.3s ease';
                setTimeout(() => {
                  firstUnmarkedRow.style.backgroundColor = '';
                }, 2000);
              }
            }, 100);
          }}
        />
      )}
    </>
  );
}

export default Admincdd;