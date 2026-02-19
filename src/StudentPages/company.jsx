import React, { useState, useMemo, useEffect } from "react";
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import PopUpPending from './PopUpPending.jsx';
import styles from './Company.module.css';

// Fetch eligible students for a student from backend
const getEligibleStudents = async (studentId) => {
  try {
    const response = await import('../services/mongoDBService').then(m => m.default.getEligibleStudentsForStudent(studentId));
    return response?.drives || [];
  } catch (error) {
    console.error('Error fetching eligible students:', error);
    return [];
  }
};

export default function Company({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [studentData, setStudentData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });
  const [eligibleDrives, setEligibleDrives] = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isFetching = false;
    
    const handleProfileUpdate = () => {
      // Prevent multiple simultaneous fetches
      if (isFetching) {
        console.log('Fetch already in progress, skipping...');
        return;
      }
      
      try {
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          setStudentData(updatedStudentData);
          
          // Only fetch if we don't already have data or if student ID changed
          const shouldFetch = eligibleDrives.length === 0 || 
                             studentData?._id !== updatedStudentData._id;
          
          if (!shouldFetch) {
            console.log('Data already loaded, skipping fetch...');
            return;
          }
          
          isFetching = true;
          setIsLoading(true);
          
          // Fetch both eligible drives and student applications
          Promise.all([
            getEligibleStudents(updatedStudentData._id),
            import('../services/mongoDBService').then(m => 
              m.default.getStudentApplications(updatedStudentData._id)
            )
          ]).then(([drives, appsResponse]) => {
            console.log('Fetched drives:', drives);
            console.log('Fetched applications:', appsResponse?.applications);
            setEligibleDrives(drives);
            setStudentApplications(appsResponse?.applications || []);
            setIsLoading(false);
            isFetching = false;
          }).catch((error) => {
            console.error('Error fetching data:', error);
            setIsLoading(false);
            isFetching = false;
          });
        }
      } catch (error) {
        console.error('Error updating student data for sidebar:', error);
        setIsLoading(false);
        isFetching = false;
      }
    };
    
    const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    if (storedStudentData) {
      setStudentData(storedStudentData);
      setIsLoading(true);
      
      // Fetch both eligible drives and student applications
      Promise.all([
        getEligibleStudents(storedStudentData._id),
        import('../services/mongoDBService').then(m => 
          m.default.getStudentApplications(storedStudentData._id)
        )
      ]).then(([drives, appsResponse]) => {
        console.log('Initial fetch - Drives:', drives);
        console.log('Initial fetch - Applications:', appsResponse?.applications);
        setEligibleDrives(drives);
        setStudentApplications(appsResponse?.applications || []);
        setIsLoading(false);
      });
      
      if (storedStudentData._id) {
        import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
          const instantData = fastDataService.getInstantData(storedStudentData._id);
          if (instantData && instantData.student) {
            setStudentData(instantData.student);
          }
        });
      }
    } else {
      setIsLoading(false);
    }
    
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('allDataPreloaded', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('allDataPreloaded', handleProfileUpdate);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // Function to determine overall status based on rounds
  const getOverallStatus = (application) => {
    console.log('getOverallStatus called with application:', application);
    console.log('Application rounds:', application?.rounds);
    
    if (!application || !application?.rounds || application.rounds.length === 0) {
      console.log('No application or rounds found, returning Pending');
      return { status: 'Pending', colorClass: styles.appStatusPending, textClass: styles.appStatusTextPending };
    }

    const rounds = application.rounds;
    console.log('Processing rounds:', rounds);
    
    const hasAbsent = rounds.some(r => r.status === 'Absent');
    const hasFailed = rounds.some(r => r.status === 'Failed');
    const passedCount = rounds.filter(r => r.status === 'Passed').length;
    const totalRounds = rounds.length;
    const allPassed = passedCount === totalRounds && totalRounds > 0;
    
    console.log('Status analysis:', { hasAbsent, hasFailed, allPassed, passedCount, totalRounds });

    if (hasAbsent) {
      console.log('Returning Absent');
      const result = { status: 'Absent', colorClass: styles.appStatusAbsent, textClass: styles.appStatusTextAbsent };
      console.log('Function returning:', result);
      return result;
    }
    if (hasFailed) {
      console.log('Returning Rejected');
      const result = { status: 'Rejected', colorClass: styles.appStatusRejected, textClass: styles.appStatusTextRejected };
      console.log('Function returning:', result);
      return result;
    }
    if (passedCount > 0) {
      console.log(`Returning Passed-${passedCount}`);
      const result = { status: `Passed-${passedCount}`, colorClass: styles.appStatusBlue, textClass: styles.appStatusTextBlue };
      console.log('Function returning:', result);
      return result;
    }
    
    console.log('Returning Pending (default)');
    const result = { status: 'Pending', colorClass: styles.appStatusPending, textClass: styles.appStatusTextPending };
    console.log('Function returning:', result);
    return result;
  };

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  const totalApplications = eligibleDrives.length;
  const pendingCount = studentApplications.filter(app => app.status === 'Pending').length || eligibleDrives.length;
  const rejectedCount = studentApplications.filter(app => app.status === 'Rejected' || app.status === 'Absent').length;

  // If an application is selected, show PopUpPending
  if (selectedApplication) {
    return (
      <div className={styles.container}>
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className={styles.main}>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onLogout={onLogout} 
            onViewChange={handleViewChange} 
            currentView={'company'}
            studentData={studentData}
          />
          <div className={styles.dashboardArea}>
            <PopUpPending 
              app={selectedApplication} 
              onBack={() => setSelectedApplication(null)} 
            />
          </div>
        </div>
        {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
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
          onViewChange={handleViewChange} 
          currentView={'company'}
          studentData={studentData}
        />
        <div className={styles.dashboardArea}>
          {/* Summary Cards */}
          <div className={styles.summaryCardsContainer}>
            <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
              <h2 className={styles.summaryCardTitle}>Total<br/>Applications</h2>
              <div className={styles.summaryCardNumber}>{totalApplications}</div>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <h2 className={styles.summaryCardTitle}>Pending<br/>Applications</h2>
              <div className={styles.summaryCardNumber}>{pendingCount}</div>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
              <h2 className={styles.summaryCardTitle}>Rejected<br/>Applications</h2>
              <div className={styles.summaryCardNumber}>{rejectedCount}</div>
            </div>
          </div>

          {/* My Application History Section */}
          <div className={styles.applicationHistoryContainer}>
            <div className={styles.applicationHistoryTitle}>My Application History</div>
            
            {isLoading ? (
              <div className={styles.loadingWrapper}>
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingBarBackground}>
                    <div className={styles.loadingBarFill}></div>
                  </div>
                  <p className={styles.loadingText}>Loading your applications...</p>
                </div>
              </div>
            ) : eligibleDrives.length === 0 ? (
              <div className={styles.applicationHistoryPlaceholder}>
                <div className={styles.clockIconWrapper}>
                  <svg className={styles.clockIcon} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="6"/>
                    <line x1="50" y1="50" x2="50" y2="25" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                    <line x1="50" y1="50" x2="70" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.placeholderTitle}>There is no Application History</div>
                <div className={styles.placeholderText}>
                  Please Apply for the Drive to Include in the<br />Application History
                </div>
              </div>
            ) : (
              <div className={styles.appList}>
                {eligibleDrives.map((drive, idx) => {
                  // Find matching application to get round data
                  const application = studentApplications.find(
                    app => app.companyName === drive.companyName && 
                           app.jobRole === (drive.jobs || drive.jobRole)
                  );

                  console.log('Drive:', drive.companyName, 'Application:', application);
                  console.log('Application rounds:', application?.rounds);

                  // Get overall status based on rounds
                  const overallStatus = getOverallStatus(application);
                  console.log('Overall status for', drive.companyName, ':', overallStatus);

                  return (
                    <div 
                      key={drive._id || idx} 
                      className={styles.appItem}
                      role="button" 
                      tabIndex="0"
                      onClick={() => {
                        const selectedApp = {
                          company: drive.companyName,
                          jobRole: drive.jobs || drive.jobRole || 'Job Role',
                          startDate: drive.driveStartDate || drive.companyDriveDate,
                          endDate: drive.driveEndDate || drive.driveStartDate || drive.companyDriveDate,
                          roundDetails: drive.roundDetails || [],
                          totalRounds: drive.totalRounds || drive.roundDetails?.length || 0,
                          rounds: application?.rounds || []
                        };
                        console.log('Selected application data:', selectedApp);
                        setSelectedApplication(selectedApp);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.appLogo}>{drive.companyName?.charAt(0).toUpperCase() || 'C'}</div>
                      <div className={styles.appDetails}>
                        <div className={styles.appCompany}>
                          {drive.companyName} : {drive.jobs || drive.jobRole || 'Job Role'}
                        </div>
                        <div className={styles.appPosition}>
                          {formatDate(drive.driveStartDate || drive.companyDriveDate)} to {formatDate(drive.driveEndDate || drive.driveStartDate || drive.companyDriveDate)}
                        </div>
                      </div>
                      <div className={styles.appStatusContainer}>
                        <div className={`${styles.appStatus} ${overallStatus.colorClass}`}>
                          <div className={`${styles.appStatusText} ${overallStatus.textClass}`}>
                            {overallStatus.status}
                          </div>
                        </div>
                        <div className={styles.appArrow}>›</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}
