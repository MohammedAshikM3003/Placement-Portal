import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';
import AdminBrowseStudenticon from "../assets/AdEsapkicon.svg";
import AdminCompanyDriveIcon from "../assets/adcompanydriveicon.svg";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import mongoDBService from '../services/mongoDBService';
// FIXED: Import CSS as a Module
import styles from './AdminEsstudapp.module.css';

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

function AdminEsstudapp() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  const location = useLocation();
  
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

    // When drive start date changes, auto-fill end date and rounds
    if (field === 'driveStartDate') {
      const foundDrive = availableDrives.find(drive => {
        // Extract date without timezone conversion
        const driveStart = drive.startingDate ? drive.startingDate.split('T')[0] : '';
        console.log('Comparing:', driveStart, 'with', value);
        return driveStart === value;
      });

      console.log('Selected Drive:', foundDrive);
      console.log('Available Drives:', availableDrives);

      if (foundDrive) {
        // Store the selected drive object
        setSelectedDrive(foundDrive);
        
        // Extract dates without timezone conversion
        const startDate = foundDrive.startingDate ? foundDrive.startingDate.split('T')[0] : '';
        const endDate = foundDrive.endingDate ? foundDrive.endingDate.split('T')[0] : '';
        const rounds = foundDrive.rounds || foundDrive.round || '';
        const departments = foundDrive.eligibleBranches || foundDrive.department || [];
        const departmentStr = Array.isArray(departments) ? departments.join(', ') : departments;
        const jobRole = foundDrive.jobRole || '';
        
        console.log('Setting dates - Start:', startDate, 'End:', endDate);
        console.log('Drive ID:', foundDrive._id);
        
        setFilterData(prev => ({
          ...prev,
          _id: foundDrive._id, // Include the unique drive ID
          driveId: foundDrive._id,
          driveStartDate: startDate,
          driveEndDate: endDate,
          totalRound: rounds.toString(),
          department: departmentStr,
          jobs: jobRole
        }));
      } else {
        setFilterData(prev => ({
          ...prev,
          driveStartDate: value
        }));
      }
    }
  };

  const handleSearch = () => {
    (async () => {
      try {
        // Validate that a drive has been selected
        if (!selectedDrive || !selectedDrive._id) {
          alert('Please select a company and drive start date first.');
          return;
        }

        setIsSearching(true);
        
        // Use selectedDrive._id directly instead of relying on filterData state update
        const driveId = selectedDrive._id;
        console.log('Using drive ID from selectedDrive:', driveId);
        
        // Preload students so next page can render immediately
        const allStudents = await mongoDBService.getStudents();

        // Apply same filtering logic as AdminEligiblestudents to compute filtered list
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

        // Use driveId from selectedDrive state (most reliable source)
        const filterDataWithDriveId = {
          ...filterData,
          _id: selectedDrive._id,
          driveId: selectedDrive._id,
          companyName: selectedDrive.companyName,
          jobRole: selectedDrive.jobRole
        };

        console.log('Navigating with filterData:', filterDataWithDriveId);

        // Navigate with pre-fetched data so eligible students page can render immediately
        navigate('/admin-eligible-students', { 
          state: { 
            filterData: filterDataWithDriveId, 
            preFetchedStudents: allStudents, 
            preFilteredStudents: filtered,
            selectedDrive: selectedDrive // Also pass the drive object
          } 
        });
      } catch (error) {
        console.error('Preloading students failed:', error);
        
        // Validate that a drive has been selected
        if (!selectedDrive || !selectedDrive._id) {
          alert('Please select a company and drive start date first.');
          setIsSearching(false);
          return;
        }
        
        // Use driveId from selectedDrive state
        const filterDataWithDriveId = {
          ...filterData,
          _id: selectedDrive._id,
          driveId: selectedDrive._id,
          companyName: selectedDrive.companyName,
          jobRole: selectedDrive.jobRole
        };
        
        // fallback: navigate with filterData only
        navigate('/admin-eligible-students', { 
          state: { 
            filterData: filterDataWithDriveId,
            selectedDrive: selectedDrive 
          } 
        });
      } finally {
        setIsSearching(false);
      }
    })();
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

  // ADDED: Navigation function to go back to Eligible Students page
  const handleEligibleStudentsClick = () => {
    navigate('/admin-eligible-students'); // Assuming this is the parent route
  };

  return (
    <div className={styles['Admin-es-apk-layout']}>
      <AdNavbar />
      <div className={styles['Admin-es-apk-sidebar-wrapper']}>
        <AdSidebar />
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
                <div className={styles['Admin-es-apk-summary-card-title-1']}>Student<br/>Database</div>
                <div className={`${styles['Admin-es-apk-summary-card-desc-1']} ${styles['Admin-es-apk-summary-card-desc-1-margin']}`}>Filter, sort and manage <br/>Student records</div>
              </div>
              
              {/* Eligible Students Filter Card */}
              <div className={`${styles['Admin-es-apk-search-filters']} ${styles['Admin-es-apk-eligible-students-search']}`}>
                <div className={styles['Admin-es-apk-search-tab']}>Eligible Students</div>
                <div className={`${styles['Admin-es-apk-search-inputs']} ${styles['Admin-es-apk-eligible-inputs']}`}>
                  <div className={`${styles['Admin-es-apk-search-input']} ${styles['Admin-es-apk-select-input']} ${filterData.companyName ? styles['filled'] : ''}`}>
                    <select 
                      id="companyName" 
                      value={filterData.companyName} 
                      onChange={(e) => handleFilterChange('companyName', e.target.value)}
                      className={styles['Admin-es-apk-select']}
                      disabled={isLoading}
                    >
                      <option value="">Company Name</option>
                      {companyNames.map((name, idx) => (
                        <option key={idx} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`${styles['Admin-es-apk-search-input']} ${styles['Admin-es-apk-select-input']} ${filterData.driveStartDate ? styles['filled'] : ''}`}>
                    <select 
                      id="driveStartDate" 
                      value={filterData.driveStartDate} 
                      onChange={(e) => handleFilterChange('driveStartDate', e.target.value)}
                      className={styles['Admin-es-apk-select']}
                      disabled={!filterData.companyName || availableDrives.length === 0}
                    >
                      <option value="">Drive Start Date</option>
                      {availableDrives.map((drive, idx) => {
                        // Extract date in YYYY-MM-DD format without timezone conversion
                        const startDate = drive.startingDate ? drive.startingDate.split('T')[0] : '';
                        // Format for display as DD-MM-YYYY
                        const displayDate = startDate ? startDate.split('-').reverse().join('-') : 'No Date';
                        return startDate ? (
                          <option key={idx} value={startDate}>{displayDate}</option>
                        ) : null;
                      })}
                    </select>
                  </div>
                  <div className={`${styles['Admin-es-apk-search-input']} ${filterData.driveEndDate ? styles['filled'] : ''}`}>
                    <input 
                      type="text" 
                      id="driveEndDate" 
                      value={filterData.driveEndDate ? filterData.driveEndDate.split('-').reverse().join('-') : ''} 
                      readOnly
                      placeholder="Drive End Date"
                    />
                  </div>
                  <div className={`${styles['Admin-es-apk-search-input']} ${filterData.totalRound ? styles['filled'] : ''}`}>
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
              
              {/* Company Drive Card */}
              <div 
                className={`${styles['Admin-es-apk-summary-card']} ${styles['Admin-es-apk-placed-students-card']}`}
                onClick={() => navigate('/admin-company-drive')}
                style={{ cursor: 'pointer' }}
              >
                <div className={`${styles['Admin-es-apk-summary-card-icon']} ${styles['Admin-es-apk-icon-bg-white']}`}>
                  <img src={AdminCompanyDriveIcon} alt="Company Drive" className={styles['Admin-es-apk-placed-cap-icon']}/>
                </div>
                <div className={styles['Admin-es-apk-summary-card-title-2']}>Company<br/>Drive</div>
                <div className={`${styles['Admin-es-apk-summary-card-desc-2']} ${styles['Admin-es-apk-summary-card-desc-2-margin']}`}>View and manage<br/>company drives</div>
              </div>
        </div>
            
        {/* Bottom Filter Section */}
        <div className={styles['Admin-es-apk-bottom-filters']}>
              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.tenthPercentage ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="tenthPercentage" 
                    value={filterData.tenthPercentage} 
                    onChange={(e) => handleFilterChange('tenthPercentage', e.target.value)}
                    placeholder="10th Percentage"
                  />
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.twelfthPercentage ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="twelfthPercentage" 
                    value={filterData.twelfthPercentage} 
                    onChange={(e) => handleFilterChange('twelfthPercentage', e.target.value)}
                    placeholder="12th Percentage"
                  />
                </div>
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

              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.ugCgpa ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="ugCgpa" 
                    value={filterData.ugCgpa} 
                    onChange={(e) => handleFilterChange('ugCgpa', e.target.value)}
                    placeholder="UG CGPA"
                  />
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.pgCgpa ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="pgCgpa" 
                    value={filterData.pgCgpa} 
                    onChange={(e) => handleFilterChange('pgCgpa', e.target.value)}
                    placeholder="PG CGPA"
                  />
                </div>
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

              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.department ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="department" 
                    value={filterData.department} 
                    readOnly
                    placeholder="Department"
                  />
                </div>
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

              <div className={styles['Admin-es-apk-filter-row']}>
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

              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.jobs ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="jobs" 
                    value={filterData.jobs} 
                    readOnly
                    placeholder="Jobs"
                  />
                </div>
              </div>

              <div className={styles['Admin-es-apk-bottom-button-container']}>
                <button className={styles['Admin-es-apk-clear-bottom-btn']} onClick={handleClear} disabled={isSearching}>Clear</button>
                <button className={styles['Admin-es-apk-search-bottom-btn']} onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
        </div>
      </div>
    </div>
  );
}

export default AdminEsstudapp;