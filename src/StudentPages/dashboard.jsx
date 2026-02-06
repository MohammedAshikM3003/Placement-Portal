import React from "react";
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import ksrCollegeImage from "../assets/ksrCollegeImage.jpg";
import Profile from "../assets/totalpercentagestudenticon.png";
import totalpercentagestudenticon from "../assets/UpcomingDriveIcon.svg";
import Resume from "../assets/UploadResumeIcon.svg";
import certificateuploadicon from "../assets/UploadCertificatecardicon.svg";
import mongoDBService from '../services/mongoDBService';
import { fetchCollegeImages } from '../services/collegeImagesService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
// Import CSS Module
import styles from "./dashboard.module.css";

// Attendance Chart Component with Animation
const AttendanceChart = ({ present, absent, isLoading }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    
    // Prepare pie chart data
    const pieData = (present === 0 && absent === 0) 
        ? [{ name: 'No Data', value: 1, color: '#D3D3D3' }]
        : [
            { name: 'Present', value: present, color: '#00C495' },
            { name: 'Absent', value: absent, color: '#FF6B6B' }
          ];

    return (
        <div className={styles['stu-db-attendance-card-content']}>
            <div className={styles['stu-db-attendance-chart-wrapper']}>
                {isLoading ? (
                    <div className={styles['stu-db-attendance-chart-center-text']}>
                        <div className={styles['stu-db-attendance-chart-center-value']}>...</div>
                        <div className={styles['stu-db-attendance-chart-center-label']}>Loading</div>
                    </div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    // Full 360° donut (clockwise)
                                    startAngle={90}
                                    endAngle={-270}
                                    paddingAngle={0}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className={styles['stu-db-attendance-chart-center-text']}>
                            <div className={styles['stu-db-attendance-chart-center-value']}>{presentPerc}%</div>
                            <div className={styles['stu-db-attendance-chart-center-label']}>Present</div>
                        </div>
                    </>
                )}
            </div>
            <div className={styles['stu-db-attendance-details-wrapper']}>
                <div className={styles['stu-db-attendance-detail-item']}>
                    Present
                    <div className={`${styles['stu-db-attendance-detail-value']} ${styles['stu-db-attendance-present-value']}`}>
                        {isLoading ? '...' : present}
                    </div>
                </div>
                <div className={styles['stu-db-attendance-detail-item']}>
                    Absent
                    <div className={`${styles['stu-db-attendance-detail-value']} ${styles['stu-db-attendance-absent-value']}`}>
                        {isLoading ? '...' : absent}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function StudentDashboard({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [collegeLogoUrl, setCollegeLogoUrl] = React.useState(ksrCollegeImage); // Default fallback

  // Fetch college logo from DB
  React.useEffect(() => {
    const loadCollegeLogo = async () => {
      const images = await fetchCollegeImages();
      if (images && images.collegeLogo) {
        setCollegeLogoUrl(images.collegeLogo);
        console.log('✅ College logo loaded for student dashboard');
      }
    };
    loadCollegeLogo();
  }, []);
  
  // ⚡ INSTANT: Initialize with best available cached data immediately (synchronous)
  const [studentData, setStudentData] = React.useState(() => {
    try {
      // Prefer completeStudentData.student if it exists, since it usually has profilePicURL
      const completeRaw = localStorage.getItem('completeStudentData');
      if (completeRaw) {
        const completeParsed = JSON.parse(completeRaw);
        if (completeParsed?.student) {
          console.log('⚡ Dashboard INIT: Loaded completeStudentData.student synchronously', {
            hasProfilePic: !!completeParsed.student.profilePicURL
          });
          return completeParsed.student;
        }
      }

      // Fallback: plain studentData
      const stored = localStorage.getItem('studentData');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('⚡ Dashboard INIT: Loaded studentData synchronously', {
          hasProfilePic: !!parsed.profilePicURL
        });
        return parsed;
      }
    } catch (error) {
      console.error('❌ Dashboard INIT: Error loading student data:', error);
    }
    return null;
  });

  // Attendance data state - Initialize from cache immediately
  const [attendanceData, setAttendanceData] = React.useState(() => {
    try {
      const cachedAttendance = localStorage.getItem('studentAttendanceCache');
      const cacheTime = localStorage.getItem('studentAttendanceCacheTime');
      
      if (cachedAttendance && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime, 10);
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAge < cacheExpiry) {
          const cached = JSON.parse(cachedAttendance);
          console.log('⚡ Dashboard: Loaded attendance from cache', cached);
          return cached;
        }
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading cached attendance:', error);
    }
    return { present: 0, absent: 0 };
  });
  const [isLoadingAttendance, setIsLoadingAttendance] = React.useState(false);
  const attendanceFetchedRef = React.useRef(false);

  // ⚡ Listen for profile updates ONLY if we don't have data yet
  React.useEffect(() => {
    // If we already have student data with profile pic, don't listen for updates
    if (studentData && studentData.profilePicURL) {
      console.log('✅ Dashboard: Already has complete student data, skipping event listeners');
      return;
    }

    const handleProfileUpdate = (event) => {
      try {
        // Only update if we don't have data yet
        if (studentData && studentData.profilePicURL) {
          console.log('⏭️ Dashboard: Already has data, ignoring profile update');
          return;
        }

        let updatedData = null;

        if (event?.detail?.student) {
          updatedData = event.detail.student;
        } else if (event?.detail && typeof event.detail === 'object') {
          const maybeStudent = event.detail;
          if (maybeStudent.regNo || maybeStudent._id || maybeStudent.profilePicURL) {
            updatedData = maybeStudent;
          }
        }

        if (!updatedData) {
          const fromStorage = JSON.parse(localStorage.getItem('studentData') || 'null');
          if (fromStorage && (fromStorage.regNo || fromStorage._id)) {
            updatedData = fromStorage;
          }
        }

        if (!updatedData) {
          return;
        }

        console.log('🔄 Dashboard: Student data updated ONCE', {
          hasProfilePic: !!updatedData.profilePicURL
        });
        setStudentData(updatedData);
      } catch (error) {
        console.error('❌ Dashboard: Error updating student data:', error);
      }
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('studentDataUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('studentDataUpdated', handleProfileUpdate);
    };
  }, [studentData]);

  // Fetch attendance data from MongoDB (ONCE per session, in background)
  React.useEffect(() => {
    const fetchAttendanceData = async () => {
      // Check cache first
      const cachedAttendance = localStorage.getItem('studentAttendanceCache');
      const cacheTime = localStorage.getItem('studentAttendanceCacheTime');
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      
      if (cachedAttendance && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime, 10);
        if (cacheAge < cacheExpiry) {
          console.log('✅ Dashboard: Using cached attendance, no fetch needed');
          attendanceFetchedRef.current = true;
          return; // Cache is fresh, don't fetch
        }
      }
      
      // Prevent multiple concurrent fetches
      if (attendanceFetchedRef.current) {
        console.log('⏭️ Dashboard: Attendance already fetched, skipping...');
        return;
      }
      
      try {
        attendanceFetchedRef.current = true;
        setIsLoadingAttendance(true);
        
        const storedStudentData = studentData || JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData && storedStudentData.regNo) {
          console.log('📊 Dashboard: Fetching attendance for', storedStudentData.regNo);
          
          // Fetch attendance from database
          const response = await mongoDBService.getStudentAttendanceByRegNo(storedStudentData.regNo);
          
          if (response.success && response.data) {
            const records = response.data;
            // Count present and absent drives
            const present = records.filter(r => r.status === 'Present').length;
            const absent = records.filter(r => r.status === 'Absent').length;
            
            const newAttendanceData = { present, absent };
            
            console.log('✅ Dashboard: Attendance loaded', newAttendanceData);
            setAttendanceData(newAttendanceData);
            
            // Cache the attendance data
            localStorage.setItem('studentAttendanceCache', JSON.stringify(newAttendanceData));
            localStorage.setItem('studentAttendanceCacheTime', Date.now().toString());
          }
        }
      } catch (error) {
        console.error('❌ Dashboard: Error fetching attendance data:', error);
        // Reset ref on error so user can retry
        attendanceFetchedRef.current = false;
      } finally {
        setIsLoadingAttendance(false);
      }
    };
    
    // Only fetch if we have studentData
    if (studentData && studentData.regNo) {
      // Fetch in background (won't actually fetch if cache is fresh)
      fetchAttendanceData();
    }
  }, [studentData]);

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles['stu-db-container']}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles['stu-db-main']}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          onViewChange={handleViewChange} 
          currentView={'dashboard'}
          studentData={studentData}
        />
        <div className={styles['stu-db-dashboard-area']}>
          {/* College header */}
          <div className={styles['stu-db-college-header']}>
            <img src={collegeLogoUrl} alt="KSR College Logo" className={styles['stu-db-college-logo']} />
            <div className={styles['stu-db-college-name']}>
              K S R COLLEGE OF ENGINEERING (<span>Autonomous</span>) - 637215
            </div>
          </div>
          
          {/* Main Dashboard Grid */}
          <div className={styles['stu-db-dashboard-grid']}>
            
            {/* Row 1 - 3 Cards */}
            {/* Card 1: My Profile */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('profile')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={Profile} alt="My Profile" />
              </div>
              <h3 className={styles['stu-db-card-title']}>My Profile</h3>
              <p className={styles['stu-db-card-sub']}>View and update your<br />personal information</p>
            </div>

            {/* Card 2: Resume */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('resume')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={Resume} alt="Resume" />
              </div>
              <h3 className={styles['stu-db-card-title']}>Resume</h3>
              <p className={styles['stu-db-card-sub']}>Upload and analyze<br />your resume</p>
            </div>

            {/* Card 3: Achievements */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('achievements')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={certificateuploadicon} alt="Achievements" />
              </div>
              <h3 className={styles['stu-db-card-title']}>Achievements</h3>
              <p className={styles['stu-db-card-sub']}>Manage your certificates<br />and accomplishments</p>
            </div>

            {/* Row 2 - 2 Cards spanning different widths */}
            {/* Card 4: Attendance (spans 2 columns) */}
            <div className={`${styles['stu-db-card']} ${styles['stu-db-attendance-card']}`} onClick={() => handleViewChange('attendance')}>
              <h2 className={styles['stu-db-new-attendance-title']}>Attendance</h2>
              <AttendanceChart 
                present={attendanceData.present} 
                absent={attendanceData.absent} 
                isLoading={isLoadingAttendance}
              />
            </div>

            {/* Card 5: Company Placement */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('company')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={totalpercentagestudenticon} alt="Company Placement" />
              </div>
              <h3 className={styles['stu-db-card-title']}>Company Placement</h3>
              <p className={styles['stu-db-card-sub']}>Track your placement<br />applications and status</p>
            </div>

          </div>
        </div>
      </div>
      {isSidebarOpen && <div className={styles['stu-db-overlay']} onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}