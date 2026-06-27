import { useState, useEffect, useMemo } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import useAdminAuth from '../utils/useAdminAuth';

import AdminBrowseStudenticon from "../assets/AdEsapkicon.svg";

import AdminCompanyDriveIcon from "../assets/adcompanydriveicon.svg";

import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import mongoDBService from '../services/mongoDBService';
import AdCalendar from '../components/Calendar/Ad_Calendar.jsx';

// FIXED: Import CSS as a Module
import styles from './AdminEsstudapp.module.css';

import { CertificateDownloadProgressAlert } from '../components/alerts/DownloadPreviewAlerts';



// Constants from MainRegistration.jsx

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



const MODE_OF_DRIVE_OPTIONS = ["Online", "Offline", "Hybrid"];

const YES_NO_OPTIONS = ["Yes", "No"];

const ARREAR_STATUS_OPTIONS = ["NHA", "NSA", "SA"];

const toDmy = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const RequiredStar = () => <span className={styles['Admin-profile-required-star']}>*</span>;

const MissingFieldsCard = ({ missingFields, onFieldClick, errorTooltip, supportsPointerTooltip, onTooltipMove, onTooltipLeave }) => {
  if (!missingFields.length) return null;
  return (
    <div className={styles['Admin-profile-validation-box']}>
      <h4 className={styles['Admin-profile-validation-heading']}>
        <span className={styles['Admin-profile-validation-icon']} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" role="img" focusable="false">
            <path fill="currentColor" d="M1 21h22L12 2L1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        </span>
        Required Fields Missing:
      </h4>
      <ul className={styles['Admin-profile-validation-list']}>
        {missingFields.map((error, index) => (
          <li
            key={`${error.field}-${index}`}
            className={styles['Admin-profile-validation-item']}
            role="button"
            tabIndex={0}
            aria-label="Click to navigate"
            onClick={() => onFieldClick(error.field)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFieldClick(error.field); } }}
            onMouseEnter={supportsPointerTooltip ? onTooltipMove : undefined}
            onMouseMove={supportsPointerTooltip ? onTooltipMove : undefined}
            onMouseLeave={supportsPointerTooltip ? onTooltipLeave : undefined}
          >
            {error.label} is required
          </li>
        ))}
      </ul>
      {supportsPointerTooltip && errorTooltip.visible && (
        <div
          className={styles['Admin-profile-validation-pointer-tooltip']}
          style={{ left: `${errorTooltip.x}px`, top: `${errorTooltip.y}px` }}
        >
          Click to navigate
        </div>
      )}
    </div>
  );
};

function AdminEsstudapp() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [dateSelectionMode, setDateSelectionMode] = useState('none');
  const [startDateFocused, setStartDateFocused] = useState(false);
  const [endDateFocused, setEndDateFocused] = useState(false);
  const [highlightedField, setHighlightedField] = useState('');
  const [errorTooltip, setErrorTooltip] = useState({ visible: false, x: 0, y: 0 });
  const [searchProgress, setSearchProgress] = useState(15);
  const [supportsPointerTooltip, setSupportsPointerTooltip] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return (
      window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches ||
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  });




  const [filterData, setFilterData] = useState({

    companyName: '',

    driveStartDate: '',

    driveEndDate: '',

    totalRound: '',

    tenthPercentage: '',

    twelfthPercentage: '',

    diplomaPercentage: '',

    ugCgpa: '',

    pgCgpa: '',

    backlogs: '',

    department: '',

    arrearStatus: '',

    bondWillingness: '',

    driveMode: '',

    companyType: '',

    jobs: ''

  });



  // State for company drives data

  const [allDrives, setAllDrives] = useState([]);

  const [companyNames, setCompanyNames] = useState([]);

  const [availableDrives, setAvailableDrives] = useState([]);

  const [selectedDrive, setSelectedDrive] = useState(null); // Store the selected drive object

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const drivesList = useMemo(() => {
    return availableDrives.map(drive => {
      const start = drive.startingDate ? drive.startingDate.split('T')[0] : '';
      const end = drive.endingDate ? drive.endingDate.split('T')[0] : '';
      return {
        ...drive,
        startYmd: start,
        endYmd: end
      };
    });
  }, [availableDrives]);

  const uniqueStartDates = useMemo(() => {
    const dates = drivesList.map(d => d.startYmd).filter(Boolean);
    return Array.from(new Set(dates)).sort();
  }, [drivesList]);

  const uniqueEndDates = useMemo(() => {
    const dates = drivesList.map(d => d.endYmd).filter(Boolean);
    return Array.from(new Set(dates)).sort();
  }, [drivesList]);

  const matchingStartDates = useMemo(() => {
    if (!filterData.driveEndDate) return [];
    const dates = drivesList
      .filter(d => d.endYmd === filterData.driveEndDate)
      .map(d => d.startYmd)
      .filter(Boolean);
    return Array.from(new Set(dates)).sort();
  }, [drivesList, filterData.driveEndDate]);

  const matchingEndDates = useMemo(() => {
    if (!filterData.driveStartDate) return [];
    const dates = drivesList
      .filter(d => d.startYmd === filterData.driveStartDate)
      .map(d => d.endYmd)
      .filter(Boolean);
    return Array.from(new Set(dates)).sort();
  }, [drivesList, filterData.driveStartDate]);

  const handleStartDateChange = (val) => {
    setFilterData(prev => ({
      ...prev,
      driveStartDate: val || ''
    }));
    if (val) {
      if (!filterData.driveEndDate) {
        setDateSelectionMode('start-first');
      }
    } else {
      if (dateSelectionMode === 'start-first') {
        setFilterData(prev => ({
          ...prev,
          driveEndDate: '',
          totalRound: '',
          department: '',
          jobs: '',
          _id: '',
          driveId: ''
        }));
        setSelectedDrive(null);
        setDateSelectionMode('none');
      }
    }
  };

  const handleEndDateChange = (val) => {
    setFilterData(prev => ({
      ...prev,
      driveEndDate: val || ''
    }));
    if (val) {
      if (!filterData.driveStartDate) {
        setDateSelectionMode('end-first');
      }
    } else {
      if (dateSelectionMode === 'end-first') {
        setFilterData(prev => ({
          ...prev,
          driveStartDate: '',
          totalRound: '',
          department: '',
          jobs: '',
          _id: '',
          driveId: ''
        }));
        setSelectedDrive(null);
        setDateSelectionMode('none');
      }
    }
  };

  // Auto-fetch logic when Start Date is selected
  useEffect(() => {
    if (filterData.driveStartDate && dateSelectionMode === 'start-first') {
      if (matchingEndDates.length === 1) {
        const autoEnd = matchingEndDates[0];
        if (filterData.driveEndDate !== autoEnd) {
          setFilterData(prev => ({
            ...prev,
            driveEndDate: autoEnd
          }));
        }
      } else if (matchingEndDates.length > 1) {
        if (filterData.driveEndDate && !matchingEndDates.includes(filterData.driveEndDate)) {
          setFilterData(prev => ({
            ...prev,
            driveEndDate: ''
          }));
        }
      } else {
        setFilterData(prev => ({
          ...prev,
          driveEndDate: ''
        }));
      }
    }
  }, [filterData.driveStartDate, matchingEndDates, filterData.driveEndDate, dateSelectionMode]);

  // Auto-fetch logic when End Date is selected
  useEffect(() => {
    if (filterData.driveEndDate && dateSelectionMode === 'end-first') {
      if (matchingStartDates.length === 1) {
        const autoStart = matchingStartDates[0];
        if (filterData.driveStartDate !== autoStart) {
          setFilterData(prev => ({
            ...prev,
            driveStartDate: autoStart
          }));
        }
      } else if (matchingStartDates.length > 1) {
        if (filterData.driveStartDate && !matchingStartDates.includes(filterData.driveStartDate)) {
          setFilterData(prev => ({
            ...prev,
            driveStartDate: ''
          }));
        }
      } else {
        setFilterData(prev => ({
          ...prev,
          driveStartDate: ''
        }));
      }
    }
  }, [filterData.driveEndDate, matchingStartDates, filterData.driveStartDate, dateSelectionMode]);

  // Reset dateSelectionMode to 'none' if both fields are empty
  useEffect(() => {
    if (!filterData.driveStartDate && !filterData.driveEndDate) {
      setDateSelectionMode('none');
    }
  }, [filterData.driveStartDate, filterData.driveEndDate]);

  // Helper to get drives matching current start and end dates
  const matchedDrivesForDates = useMemo(() => {
    if (!filterData.driveStartDate || !filterData.driveEndDate) return [];
    return drivesList.filter(
      d => d.startYmd === filterData.driveStartDate && d.endYmd === filterData.driveEndDate
    );
  }, [filterData.driveStartDate, filterData.driveEndDate, drivesList]);

  // Unique job roles matching current start and end dates
  const uniqueJobRolesForDates = useMemo(() => {
    const roles = matchedDrivesForDates.map(d => d.jobRole || '').filter(Boolean);
    return Array.from(new Set(roles));
  }, [matchedDrivesForDates]);

  // Auto-populate other fields when a unique drive is matched by start date, end date, and job role
  useEffect(() => {
    if (filterData.driveStartDate && filterData.driveEndDate) {
      if (uniqueJobRolesForDates.length === 1) {
        // Only one job role: auto-fetch it
        const foundDrive = matchedDrivesForDates[0];
        setSelectedDrive(foundDrive);
        const rounds = foundDrive.rounds || foundDrive.round || '';
        const departments = foundDrive.eligibleBranches || foundDrive.department || [];
        const departmentStr = Array.isArray(departments) ? departments.join(', ') : departments;
        const jobRole = foundDrive.jobRole || '';

        setFilterData(prev => {
          if (
            prev._id === foundDrive._id &&
            prev.totalRound === rounds.toString() &&
            prev.department === departmentStr &&
            prev.jobs === jobRole
          ) {
            return prev;
          }
          return {
            ...prev,
            _id: foundDrive._id,
            driveId: foundDrive._id,
            totalRound: rounds.toString(),
            department: departmentStr,
            jobs: jobRole
          };
        });
      } else if (uniqueJobRolesForDates.length > 1) {
        // Multiple job roles on the same date: check if the selected job role matches one of them
        const matchedDrive = matchedDrivesForDates.find(d => d.jobRole === filterData.jobs);
        if (matchedDrive) {
          setSelectedDrive(matchedDrive);
          const rounds = matchedDrive.rounds || matchedDrive.round || '';
          const departments = matchedDrive.eligibleBranches || matchedDrive.department || [];
          const departmentStr = Array.isArray(departments) ? departments.join(', ') : departments;

          setFilterData(prev => {
            if (
              prev._id === matchedDrive._id &&
              prev.totalRound === rounds.toString() &&
              prev.department === departmentStr
            ) {
              return prev;
            }
            return {
              ...prev,
              _id: matchedDrive._id,
              driveId: matchedDrive._id,
              totalRound: rounds.toString(),
              department: departmentStr
            };
          });
        } else {
          // Job role not selected yet or invalid selection
          setSelectedDrive(null);
          setFilterData(prev => {
            const nextJobs = uniqueJobRolesForDates.includes(prev.jobs) ? prev.jobs : '';
            if (
              prev._id === '' &&
              prev.totalRound === '' &&
              prev.department === '' &&
              prev.jobs === nextJobs
            ) {
              return prev;
            }
            return {
              ...prev,
              totalRound: '',
              department: '',
              jobs: nextJobs,
              _id: '',
              driveId: ''
            };
          });
        }
      } else {
        // No job roles found
        setSelectedDrive(null);
        setFilterData(prev => {
          if (
            prev._id === '' &&
            prev.totalRound === '' &&
            prev.department === '' &&
            prev.jobs === ''
          ) {
            return prev;
          }
          return {
            ...prev,
            totalRound: '',
            department: '',
            jobs: '',
            _id: '',
            driveId: ''
          };
        });
      }
    } else {
      // Dates not fully selected
      setSelectedDrive(null);
      setFilterData(prev => {
        if (
          prev._id === '' &&
          prev.totalRound === '' &&
          prev.department === '' &&
          prev.jobs === ''
        ) {
          return prev;
        }
        return {
          ...prev,
          totalRound: '',
          department: '',
          jobs: '',
          _id: '',
          driveId: ''
        };
      });
    }
  }, [filterData.driveStartDate, filterData.driveEndDate, filterData.jobs, uniqueJobRolesForDates, matchedDrivesForDates]);

  // Fetch company drives on mount

  useEffect(() => {

    fetchCompanyDrives();

  }, []);



  // Auto-fill form if redirected from Company Drive page with filterData

  useEffect(() => {

    if (location.state?.filterData && allDrives.length > 0) {

      const incomingData = location.state.filterData;

      console.log('Auto-filling from navigation state:', incomingData);



      // First, populate availableDrives for the selected company

      if (incomingData.companyName) {

        const drivesForCompany = allDrives.filter(

          drive => (drive.companyName || drive.company) === incomingData.companyName

        );

        setAvailableDrives(drivesForCompany);



        // Find and set the selected drive based on start date or drive ID

        if (incomingData.driveStartDate || incomingData._id || incomingData.driveId) {

          const matchedDrive = drivesForCompany.find(drive => {

            // Try to match by ID first (most reliable)

            if (incomingData._id && drive._id === incomingData._id) return true;

            if (incomingData.driveId && drive._id === incomingData.driveId) return true;

            // Fallback to matching by date

            if (incomingData.driveStartDate) {

              const driveStart = drive.startingDate ? drive.startingDate.split('T')[0] : '';

              return driveStart === incomingData.driveStartDate;

            }

            return false;

          });



          if (matchedDrive) {

            console.log('Auto-selected drive:', matchedDrive);

            setSelectedDrive(matchedDrive);

          }

        }

      }



      // Then set the filter data

      setFilterData(prev => ({

        ...prev,

        companyName: incomingData.companyName || prev.companyName,

        driveStartDate: incomingData.driveStartDate || prev.driveStartDate,

        driveEndDate: incomingData.driveEndDate || prev.driveEndDate,

        jobs: incomingData.jobs || prev.jobs,

        department: incomingData.department || prev.department,

        totalRound: incomingData.totalRound || prev.totalRound,

        _id: incomingData._id || incomingData.driveId || prev._id,

        driveId: incomingData._id || incomingData.driveId || prev.driveId

      }));

    }

  }, [location.state, allDrives]);



  const fetchCompanyDrives = async () => {

    try {

      setIsLoading(true);

      const drives = await mongoDBService.getCompanyDrives();

      setAllDrives(drives || []);



      // Extract unique company names

      const uniqueCompanyNames = [...new Set(

        (drives || []).map(drive => drive.companyName || drive.company).filter(Boolean)

      )];

      setCompanyNames(uniqueCompanyNames);

    } catch (error) {

      console.error('Error fetching company drives:', error);

    } finally {

      setIsLoading(false);

    }

  };



  const handleFilterChange = (field, value) => {

    setFilterData(prev => ({

      ...prev,

      [field]: value

    }));



    // When company name changes, find all drives for that company

    if (field === 'companyName') {

      if (value) {

        const drivesForCompany = allDrives.filter(

          drive => (drive.companyName || drive.company) === value

        );



        console.log('All Drives for Company:', value);

        drivesForCompany.forEach((drive, idx) => {

          console.log(`Drive ${idx + 1}:`, {

            startingDate: drive.startingDate,

            endingDate: drive.endingDate,

            startFormatted: drive.startingDate ? drive.startingDate.split('T')[0] : 'N/A',

            endFormatted: drive.endingDate ? drive.endingDate.split('T')[0] : 'N/A'

          });

        });



        setAvailableDrives(drivesForCompany);



        // Reset dependent fields

        setFilterData(prev => ({

          ...prev,

          companyName: value,

          driveStartDate: '',

          driveEndDate: '',

          totalRound: '',

          department: '',

          jobs: ''

        }));

      } else {

        setAvailableDrives([]);

        setFilterData(prev => ({

          ...prev,

          companyName: '',

          driveStartDate: '',

          driveEndDate: '',

          totalRound: '',

          department: '',

          jobs: ''

        }));

      }

    }



    // Handled by handleStartDateChange and handleEndDateChange

  };



  const finalizeSearch = (allStudents, error) => {
    try {
      if (error || !allStudents) {
        // Fallback navigation with filterData only
        const filterDataWithDriveId = {
          ...filterData,
          _id: selectedDrive._id,
          driveId: selectedDrive._id,
          companyName: selectedDrive.companyName,
          jobRole: selectedDrive.jobRole
        };
        navigate('/admin-eligible-students', {
          state: {
            filterData: filterDataWithDriveId,
            selectedDrive: selectedDrive
          }
        });
        return;
      }

      const filters = filterData;
      const filtered = (allStudents || []).filter(student => {
        if (filters.tenthPercentage && parseFloat(student.tenthPercentage) < parseFloat(filters.tenthPercentage)) {
          return false;
        }
        if (filters.twelfthPercentage && parseFloat(student.twelfthPercentage) < parseFloat(filters.twelfthPercentage)) {
          return false;
        }
        if (filters.diplomaPercentage && student.diplomaPercentage && parseFloat(student.diplomaPercentage) < parseFloat(filters.diplomaPercentage)) {
          return false;
        }
        if (filters.ugCgpa && parseFloat(student.overallCGPA) < parseFloat(filters.ugCgpa)) {
          return false;
        }
        if (filters.backlogs && parseInt(student.currentBacklogs || 0) > parseInt(filters.backlogs)) {
          return false;
        }
        if (filters.department && !filters.department.split(',').map(d => d.trim()).includes(student.branch)) {
          return false;
        }
        if (filters.arrearStatus && student.arrearStatus !== filters.arrearStatus) {
          return false;
        }
        if (filters.bondWillingness && student.willingToSignBond !== filters.bondWillingness) {
          return false;
        }
        if (filters.driveMode && student.preferredModeOfDrive !== filters.driveMode) {
          return false;
        }
        if (filters.companyType) {
          const studentCompanyTypes = (student.companyTypes || '').split(',').map(ct => ct.trim());
          if (!studentCompanyTypes.includes(filters.companyType)) {
            return false;
          }
        }
        return true;
      });

      const filterDataWithDriveId = {
        ...filterData,
        _id: selectedDrive._id,
        driveId: selectedDrive._id,
        companyName: selectedDrive.companyName,
        jobRole: selectedDrive.jobRole
      };

      console.log('Navigating with filterData:', filterDataWithDriveId);

      navigate('/admin-eligible-students', {
        state: {
          filterData: filterDataWithDriveId,
          preFetchedStudents: allStudents,
          preFilteredStudents: filtered,
          selectedDrive: selectedDrive
        }
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (!selectedDrive || !selectedDrive._id) {
      alert('Please select a company and drive start date first.');
      return;
    }

    setIsSearching(true);
    setSearchProgress(15);

    let fetchDone = false;
    let fetchingInterval = null;

    // 1. Start fetching immediately
    mongoDBService.getStudents()
      .then(students => {
        fetchDone = true;
        if (fetchingInterval) window.clearInterval(fetchingInterval);
        handleFetchComplete(students, null);
      })
      .catch(err => {
        console.error('Preloading students failed:', err);
        fetchDone = true;
        if (fetchingInterval) window.clearInterval(fetchingInterval);
        handleFetchComplete(null, err);
      });

    // 2. Animate fetching phase smoothly (15% to 60%) while waiting for API
    fetchingInterval = window.setInterval(() => {
      setSearchProgress(prev => {
        if (fetchDone || prev >= 60) {
          window.clearInterval(fetchingInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 100);

    // 3. Complete stages sequentially to give user visual feedback
    const handleFetchComplete = (students, error) => {
      // Stage 2: Filtering (90% - displays "Filtering student database...")
      setSearchProgress(90);

      setTimeout(() => {
        // Stage 3: Finalizing (100% - displays "Finalizing search results...")
        setSearchProgress(100);

        setTimeout(() => {
          finalizeSearch(students, error);
        }, 200);
      }, 300);
    };
  };



  const handleClear = () => {

    setFilterData({

      companyName: '',

      driveStartDate: '',

      driveEndDate: '',

      totalRound: '',

      tenthPercentage: '',

      twelfthPercentage: '',

      diplomaPercentage: '',

      ugCgpa: '',

      pgCgpa: '',

      backlogs: '',

      department: '',

      arrearStatus: '',

      bondWillingness: '',

      driveMode: '',

      companyType: '',

      jobs: ''

    });

    console.log("Clear filter action triggered.");

  };

  const hasActiveTopFilters = Boolean(
    filterData.companyName ||
    filterData.driveStartDate ||
    filterData.driveEndDate ||
    filterData.jobs ||
    filterData.totalRound
  );

  const handleClearTopFilters = () => {
    setFilterData(prev => ({
      ...prev,
      companyName: '',
      driveStartDate: '',
      driveEndDate: '',
      totalRound: '',
      department: '',
      jobs: '',
      _id: '',
      driveId: ''
    }));
    setSelectedDrive(null);
    setDateSelectionMode('none');
    console.log("Clear top filters action triggered.");
  };

  const handleFieldClick = (field) => {
    setHighlightedField(field);
    const element = document.getElementById(field);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedField('');
    }, 3000);
  };




  // ADDED: Navigation function to go back to Eligible Students page

  const handleEligibleStudentsClick = () => {

    navigate('/admin-eligible-students'); // Assuming this is the parent route

  };



  const toggleSidebar = () => {

    setIsSidebarOpen(prev => !prev);

  };



  // Listen for sidebar close event from navigation links

  useEffect(() => {

    const handleCloseSidebar = () => {

      setIsSidebarOpen(false);

    };

    window.addEventListener('closeSidebar', handleCloseSidebar);

    return () => {

      window.removeEventListener('closeSidebar', handleCloseSidebar);

    };

  }, []);

  // --- Pointer tooltip support detection ---
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const hybridQuery = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const primaryQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updatePointerSupport = () => {
      const isSupported = hybridQuery.matches || primaryQuery.matches;
      setSupportsPointerTooltip(isSupported);
      if (!isSupported) {
        setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };
    updatePointerSupport();
    if (typeof hybridQuery.addEventListener === 'function') {
      hybridQuery.addEventListener('change', updatePointerSupport);
      primaryQuery.addEventListener('change', updatePointerSupport);
      return () => {
        hybridQuery.removeEventListener('change', updatePointerSupport);
        primaryQuery.removeEventListener('change', updatePointerSupport);
      };
    }
    return undefined;
  }, []);

  const handleErrorTooltipMove = (event) => {
    if (!supportsPointerTooltip) return;
    setErrorTooltip({ visible: true, x: event.clientX + 14, y: event.clientY + 18 });
  };

  const handleErrorTooltipLeave = () => {
    if (!supportsPointerTooltip) return;
    setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  };

  const getMissingFields = () => {
    const missing = [];
    if (!filterData.companyName) {
      missing.push({ field: 'companyName', label: 'Company Name' });
    }
    if (!filterData.driveStartDate || !filterData.driveEndDate) {
      missing.push({ field: 'admin-search-dates', label: 'Dates' });
    }
    if (!filterData.jobs) {
      missing.push({ field: 'jobs', label: 'Job Role' });
    }
    if (!filterData.totalRound) {
      missing.push({ field: 'totalRound', label: 'Total Round' });
    }
    return missing;
  };

  const missingFieldsList = getMissingFields();
  const isSearchDisabled = missingFieldsList.length > 0;

  return (

    <div className={styles['Admin-es-apk-layout']}>

      <AdNavbar onToggleSidebar={toggleSidebar} />

      <div className={styles['Admin-es-apk-sidebar-wrapper']}>

        <AdSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      </div>

      <div className={styles['Admin-es-apk-main-content']}>

        <div className={styles['Admin-es-apk-top-card']}>

          {/* Student Database Card */}

          <div

            className={`${styles['Admin-es-apk-summary-card']} ${styles['Admin-es-apk-eligible-student-card']}`}

            onClick={() => navigate('/admin-student-database')}

            style={{ cursor: 'pointer' }}

          >

            <div className={`${styles['Admin-es-apk-summary-card-icon']} ${styles['Admin-es-apk-icon-bg-white']}`}>

              <img src={AdminBrowseStudenticon} alt="Student Database" />

            </div>

            <div className={styles['Admin-es-apk-summary-card-title-1']}>Student<br />Database</div>

            <div className={`${styles['Admin-es-apk-summary-card-desc-1']} ${styles['Admin-es-apk-summary-card-desc-1-margin']}`}>Filter, sort and manage <br />Student records</div>

          </div>



          {/* Eligible Students Filter Card */}

          <div className={`${styles['Admin-es-apk-search-filters']} ${styles['Admin-es-apk-eligible-students-search']}`}>

            <div className={styles['Admin-es-apk-search-tab']}>Eligible Students</div>

            {hasActiveTopFilters && (
              <button
                type="button"
                className={styles['Admin-es-apk-clear-btn-header']}
                onClick={handleClearTopFilters}
              >
                Clear
              </button>
            )}

            <div className={`${styles['Admin-es-apk-search-inputs']} ${styles['Admin-es-apk-eligible-inputs']}`}>

              {/* Company Name with Static Label */}
              <div className={styles['Admin-es-apk-input-wrapper']}>
                <label className={styles['Admin-es-apk-static-label']} htmlFor="companyName">
                  Company Name <RequiredStar />
                </label>
                <div className={`${styles['Admin-es-apk-search-input']} ${styles['Admin-es-apk-select-input']} ${highlightedField === 'companyName' ? styles['Admin-es-apk-field-highlight'] : ''}`}>
                  <select
                    id="companyName"
                    value={filterData.companyName}
                    onChange={(e) => handleFilterChange('companyName', e.target.value)}
                    className={styles['Admin-es-apk-select']}
                    disabled={isLoading}
                  >
                    <option value="">Select Company Name</option>
                    {companyNames.map((name, idx) => (
                      <option key={idx} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates Filter with Static Label and Start/End subfields */}
              <div className={styles['Admin-es-apk-input-wrapper']}>
                <label className={styles['Admin-es-apk-static-label']} htmlFor="admin-search-dates">
                  Dates <RequiredStar />
                </label>
                <div id="admin-search-dates" className={`${styles['Admin-es-apk-date-range-inputs']} ${highlightedField === 'admin-search-dates' ? styles['Admin-es-apk-field-highlight'] : ''}`}>
                  {Boolean(filterData.driveEndDate && matchingStartDates.length > 1 && dateSelectionMode === 'end-first') ? (
                    <div className={`${styles['Admin-es-apk-select-container']} ${startDateFocused ? styles['is-focused'] : ''}`}>
                      <select
                        id="admin-search-start-date"
                        className={styles['Admin-es-apk-select']}
                        value={filterData.driveStartDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        onFocus={() => setStartDateFocused(true)}
                        onBlur={() => setStartDateFocused(false)}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        disabled={!filterData.companyName}
                      >
                        <option value="">Start</option>
                        {matchingStartDates.map((ymd) => (
                          <option key={ymd} value={ymd}>
                            {toDmy(ymd)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <AdCalendar
                      id="admin-search-start-date"
                      value={filterData.driveStartDate}
                      onChange={handleStartDateChange}
                      variant="filter"
                      enabledDates={filterData.driveEndDate ? matchingStartDates : uniqueStartDates}
                      style={{ padding: '0px 6px', fontSize: '0.9rem', gap: '4px' }}
                      disabled={!filterData.companyName}
                    />
                  )}

                  <span className={styles['Admin-es-apk-date-range-sep']}>-</span>

                  {Boolean(filterData.driveStartDate && matchingEndDates.length > 1 && dateSelectionMode === 'start-first') ? (
                    <div className={`${styles['Admin-es-apk-select-container']} ${endDateFocused ? styles['is-focused'] : ''}`}>
                      <select
                        id="admin-search-end-date"
                        className={styles['Admin-es-apk-select']}
                        value={filterData.driveEndDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        onFocus={() => setEndDateFocused(true)}
                        onBlur={() => setEndDateFocused(false)}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        disabled={!filterData.companyName}
                      >
                        <option value="">End</option>
                        {matchingEndDates.map((ymd) => (
                          <option key={ymd} value={ymd}>
                            {toDmy(ymd)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <AdCalendar
                      id="admin-search-end-date"
                      value={filterData.driveEndDate}
                      onChange={handleEndDateChange}
                      variant="filter"
                      enabledDates={filterData.driveStartDate ? matchingEndDates : uniqueEndDates}
                      style={{ padding: '0px 6px', fontSize: '0.9rem', gap: '4px' }}
                      disabled={!filterData.companyName}
                    />
                  )}
                </div>
              </div>

              {/* Job Role with Static Label */}
              <div className={styles['Admin-es-apk-input-wrapper']}>
                <label className={styles['Admin-es-apk-static-label']} htmlFor="jobs">
                  Job Role <RequiredStar />
                </label>
                {uniqueJobRolesForDates.length > 1 ? (
                  <div className={`${styles['Admin-es-apk-search-input']} ${styles['Admin-es-apk-select-input']} ${highlightedField === 'jobs' ? styles['Admin-es-apk-field-highlight'] : ''}`}>
                    <select
                      id="jobs"
                      value={filterData.jobs}
                      onChange={(e) => handleFilterChange('jobs', e.target.value)}
                      className={styles['Admin-es-apk-select']}
                    >
                      <option value="">Select Job Role</option>
                      {uniqueJobRolesForDates.map((role, idx) => (
                        <option key={idx} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className={`${styles['Admin-es-apk-search-input']} ${highlightedField === 'jobs' ? styles['Admin-es-apk-field-highlight'] : ''}`}>
                    <input
                      type="text"
                      id="jobs"
                      value={filterData.jobs}
                      readOnly
                      placeholder="Job Role"
                    />
                  </div>
                )}
              </div>

              {/* Total Round with Static Label */}
              <div className={styles['Admin-es-apk-input-wrapper']}>
                <label className={styles['Admin-es-apk-static-label']} htmlFor="totalRound">
                  Total Round <RequiredStar />
                </label>
                <div className={`${styles['Admin-es-apk-search-input']} ${highlightedField === 'totalRound' ? styles['Admin-es-apk-field-highlight'] : ''}`}>
                  <input
                    type="text"
                    id="totalRound"
                    value={filterData.totalRound}
                    readOnly
                    placeholder="Total Round"
                  />
                </div>
              </div>

            </div>

          </div>



          {/* Company Drive Card */}

          <div

            className={`${styles['Admin-es-apk-summary-card']} ${styles['Admin-es-apk-placed-students-card']}`}

            onClick={() => navigate('/admin-company-drive')}

            style={{ cursor: 'pointer' }}

          >

            <div className={`${styles['Admin-es-apk-summary-card-icon']} ${styles['Admin-es-apk-icon-bg-white']}`}>

              <img src={AdminCompanyDriveIcon} alt="Company Drive" className={styles['Admin-es-apk-placed-cap-icon']} />

            </div>

            <div className={styles['Admin-es-apk-summary-card-title-2']}>Company<br />Drive</div>

            <div className={`${styles['Admin-es-apk-summary-card-desc-2']} ${styles['Admin-es-apk-summary-card-desc-2-margin']}`}>View and manage<br />company drives</div>

          </div>

        </div>



        {/* Bottom Filter Section */}

        <div className={styles['Admin-es-apk-bottom-filters']}>

          <h3 className={styles['Admin-es-apk-section-header']}>Application Card</h3>

          <div className={styles['Admin-es-apk-filter-row']}>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="tenthPercentage">10th Percentage</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.tenthPercentage ? styles['filled'] : ''}`}>
                <input
                  type="text"
                  id="tenthPercentage"
                  value={filterData.tenthPercentage}
                  onChange={(e) => handleFilterChange('tenthPercentage', e.target.value)}
                  placeholder="10th Percentage"
                />
              </div>
            </div>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="twelfthPercentage">12th Percentage</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.twelfthPercentage ? styles['filled'] : ''}`}>
                <input
                  type="text"
                  id="twelfthPercentage"
                  value={filterData.twelfthPercentage}
                  onChange={(e) => handleFilterChange('twelfthPercentage', e.target.value)}
                  placeholder="12th Percentage"
                />
              </div>
            </div>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="diplomaPercentage">Diploma Percentage</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.diplomaPercentage ? styles['filled'] : ''}`}>
                <input
                  type="text"
                  id="diplomaPercentage"
                  value={filterData.diplomaPercentage}
                  onChange={(e) => handleFilterChange('diplomaPercentage', e.target.value)}
                  placeholder="Diploma Percentage"
                />
              </div>
            </div>

          </div>



          <div className={styles['Admin-es-apk-filter-row']}>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="ugCgpa">UG CGPA</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.ugCgpa ? styles['filled'] : ''}`}>
                <input
                  type="text"
                  id="ugCgpa"
                  value={filterData.ugCgpa}
                  onChange={(e) => handleFilterChange('ugCgpa', e.target.value)}
                  placeholder="UG CGPA"
                />
              </div>
            </div>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="pgCgpa">PG CGPA</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.pgCgpa ? styles['filled'] : ''}`}>
                <input
                  type="text"
                  id="pgCgpa"
                  value={filterData.pgCgpa}
                  onChange={(e) => handleFilterChange('pgCgpa', e.target.value)}
                  placeholder="PG CGPA"
                />
              </div>
            </div>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="backlogs">No. of Backlogs</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.backlogs ? styles['filled'] : ''}`}>
                <input
                  type="text"
                  id="backlogs"
                  value={filterData.backlogs}
                  onChange={(e) => handleFilterChange('backlogs', e.target.value)}
                  placeholder="No. of Backlogs"
                />
              </div>
            </div>

          </div>



          <div className={styles['Admin-es-apk-filter-row']}>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="department">Department</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.department ? styles['filled'] : ''}`}>
                <input
                  type="text"
                  id="department"
                  value={filterData.department}
                  readOnly
                  placeholder="Department"
                />
              </div>
            </div>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="arrearStatus">Arrear Status</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${styles['Admin-es-apk-select-input']} ${filterData.arrearStatus ? styles['filled'] : ''}`}>
                <select
                  id="arrearStatus"
                  value={filterData.arrearStatus}
                  onChange={(e) => handleFilterChange('arrearStatus', e.target.value)}
                  className={styles['Admin-es-apk-select']}
                >
                  <option value="">Select Arrear Status</option>
                  {ARREAR_STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="bondWillingness">Bond Willingness</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${styles['Admin-es-apk-select-input']} ${filterData.bondWillingness ? styles['filled'] : ''}`}>
                <select
                  id="bondWillingness"
                  value={filterData.bondWillingness}
                  onChange={(e) => handleFilterChange('bondWillingness', e.target.value)}
                  className={styles['Admin-es-apk-select']}
                >
                  <option value="">Select Bond Willingness</option>
                  {YES_NO_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>



          <div className={styles['Admin-es-apk-filter-row']}>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="driveMode">Mode of Drive</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${styles['Admin-es-apk-select-input']} ${filterData.driveMode ? styles['filled'] : ''}`}>
                <select
                  id="driveMode"
                  value={filterData.driveMode}
                  onChange={(e) => handleFilterChange('driveMode', e.target.value)}
                  className={styles['Admin-es-apk-select']}
                >
                  <option value="">Select Mode of Drive</option>
                  {MODE_OF_DRIVE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles['Admin-es-apk-field-group']}>
              <label className={styles['Admin-es-apk-field-label']} htmlFor="companyType">Company Type</label>
              <div className={`${styles['Admin-es-apk-filter-input']} ${styles['Admin-es-apk-select-input']} ${filterData.companyType ? styles['filled'] : ''}`}>
                <select
                  id="companyType"
                  value={filterData.companyType}
                  onChange={(e) => handleFilterChange('companyType', e.target.value)}
                  className={styles['Admin-es-apk-select']}
                >
                  <option value="">Select Company Type</option>
                  {COMPANY_TYPE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>







        </div>

        {missingFieldsList.length > 0 && (
          <MissingFieldsCard
            missingFields={missingFieldsList}
            onFieldClick={handleFieldClick}
            errorTooltip={errorTooltip}
            supportsPointerTooltip={supportsPointerTooltip}
            onTooltipMove={handleErrorTooltipMove}
            onTooltipLeave={handleErrorTooltipLeave}
          />
        )}

        <div className={styles['Admin-es-apk-bottom-button-container']}>

          <button className={styles['Admin-es-apk-clear-bottom-btn']} onClick={handleClear} disabled={isSearching}>Clear</button>

          <button
            className={styles['Admin-es-apk-search-bottom-btn']}
            onClick={handleSearch}
            disabled={isSearchDisabled || isSearching}
          >
            Search
          </button>

        </div>

      </div>

      <CertificateDownloadProgressAlert
        isOpen={isSearching}
        progress={searchProgress}
        fileLabel="student database"
        title="Searching..."
        color="#4EA24E"
        progressColor="#4EA24E"
        messages={{
          initial: 'Fetching eligible students...',
          mid: 'Filtering student database...',
          final: 'Finalizing search results...'
        }}
      />



    </div>

  );

}



export default AdminEsstudapp;