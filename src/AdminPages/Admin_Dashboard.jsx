import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAdminAuth from "../utils/useAdminAuth";
import Adminmyacc from "../assets/Adminmyacc.svg";
import Adminaddnewcompany from "../assets/Adminaddnewcompany.svg";
import AdminAddBranch from "../assets/AdminAddBranchIcon.svg";
import Adminschedulenewdrive from "../assets/Adminschedulenewdrive.svg";
import Adminbrowsestudents from "../assets/Adminbrowsestudents.svg";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import mongoDBService from "../services/mongoDBService";
import { fetchCollegeImages, getCachedCollegeLogo } from '../services/collegeImagesService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { changeFavicon, FAVICON_TYPES } from '../utils/faviconUtils';
// IMPORT THE MODULE CSS
import styles from "./Admin_Dashboard.module.css";

// ====================================================================
// ATTENDANCE CHART COMPONENT
// ====================================================================
const ModernAttendanceChart = ({ present, absent, isLoading }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport to slightly thicken the ring only on small screens
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 900px)');

        const handleChange = (e) => {
            setIsMobile(e.matches);
        };

        // Initial value
        setIsMobile(mq.matches);

        if (mq.addEventListener) {
            mq.addEventListener('change', handleChange);
        } else if (mq.addListener) {
            mq.addListener(handleChange);
        }

        return () => {
            if (mq.removeEventListener) {
                mq.removeEventListener('change', handleChange);
            } else if (mq.removeListener) {
                mq.removeListener(handleChange);
            }
        };
    }, []);

    const innerRadius = isMobile ? 45 : 55; // thicker ring on mobile
    const outerRadius = 75;                 // keep desktop outer radius
    
    // Prepare pie chart data
    const pieData = (present === 0 && absent === 0) 
        ? [{ name: 'No Data', value: 1, color: '#D3D3D3' }]
        : [
            { name: 'Present', value: present, color: '#00C495' },
            { name: 'Absent', value: absent, color: '#FF6B6B' }
          ];

    return (
        <div className={styles['ad-db-attendance-card-content']}>
            <div className={styles['ad-db-attendance-chart-wrapper']}>
                {isLoading ? (
                    <div className={styles['ad-db-attendance-chart-center-text']}>
                        <div className={styles['ad-db-attendance-chart-center-value']}>...</div>
                        <div className={styles['ad-db-attendance-chart-center-label']}>Loading</div>
                    </div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius}

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
                        <div className={styles['ad-db-attendance-chart-center-text']}>
                            <div className={styles['ad-db-attendance-chart-center-value']}>{presentPerc}%</div>
                            <div className={styles['ad-db-attendance-chart-center-label']}>Present</div>
                        </div>
                    </>
                )}
            </div>
            <div className={styles['ad-db-attendance-details-wrapper']}>
                <div className={styles['ad-db-attendance-detail-item']}>
                    Present
                    {/* Use template literals for multiple classes */}
                    <div className={`${styles['ad-db-attendance-detail-value']} ${styles['ad-db-attendance-present-value']}`}>
                        {isLoading ? '...' : present}
                    </div>
                </div>
                <div className={styles['ad-db-attendance-detail-item']}>
                    Absent
                    <div className={`${styles['ad-db-attendance-detail-value']} ${styles['ad-db-attendance-absent-value']}`}>
                        {isLoading ? '...' : absent}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// MAIN DASHBOARD COMPONENT
// ====================================================================
function AdminDashboard({ onLogout, currentView, onViewChange }) {
  const navigate = useNavigate();
  useAdminAuth(); // JWT authentication verification
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0 });
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [collegeLogoUrl, setCollegeLogoUrl] = useState(() => getCachedCollegeLogo());

  // Change favicon to admin (green flipped) for admin dashboard
  useEffect(() => {
    changeFavicon(FAVICON_TYPES.ADMIN);
  }, []);

  // Fetch college logo from DB
  useEffect(() => {
    const loadCollegeLogo = async () => {
      const images = await fetchCollegeImages();
      if (images && images.collegeLogo) {
        setCollegeLogoUrl(images.collegeLogo);
        console.log('✅ College logo loaded for admin dashboard');
      }
    };
    loadCollegeLogo();
  }, []);

  // Fetch attendance statistics from MongoDB
  const fetchAttendanceStats = async () => {
    try {
      setIsLoadingAttendance(true);
      
      // Try to use cached attendance data first
      const cachedAttendance = localStorage.getItem('attendanceDataCache');
      const cacheTime = localStorage.getItem('attendanceDataCacheTime');
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes

      if (cachedAttendance && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime, 10);
        if (cacheAge < cacheExpiry) {
          console.log('✅ Using cached attendance data');
          const cachedData = JSON.parse(cachedAttendance);
          
          // Process cached data
          const attendances = Array.isArray(cachedData)
            ? cachedData
            : (cachedData?.data || cachedData?.attendances || []);

          const getTime = (att) => {
            const t =
              att?.updatedAt ||
              att?.submittedAt ||
              att?.createdAt ||
              att?.startDate ||
              0;
            const ms = new Date(t).getTime();
            return Number.isFinite(ms) ? ms : 0;
          };

          const latestAttendance = [...attendances].sort((a, b) => getTime(b) - getTime(a))[0];

          if (latestAttendance) {
            setAttendanceStats({
              present: latestAttendance.totalPresent || 0,
              absent: latestAttendance.totalAbsent || 0,
            });
          } else {
            setAttendanceStats({ present: 0, absent: 0 });
          }
          
          setIsLoadingAttendance(false);
          return; // Use cached data, don't fetch
        }
      }

      // Fetch fresh data if cache is expired or unavailable
      const response = await mongoDBService.getAllAttendances();

      // Cache the response
      localStorage.setItem('attendanceDataCache', JSON.stringify(response));
      localStorage.setItem('attendanceDataCacheTime', Date.now().toString());

      // Normalize backend response shapes (sometimes array, sometimes { data: [] })
      const attendances = Array.isArray(response)
        ? response
        : (response?.data || response?.attendances || []);

      // Pick the most recently UPDATED record (updates change updatedAt, not submittedAt)
      // Fallback to submittedAt/createdAt if updatedAt is missing.
      const getTime = (att) => {
        const t =
          att?.updatedAt ||
          att?.submittedAt ||
          att?.createdAt ||
          att?.startDate ||
          0;
        const ms = new Date(t).getTime();
        return Number.isFinite(ms) ? ms : 0;
      };

      const latestAttendance = [...attendances].sort((a, b) => getTime(b) - getTime(a))[0];

      if (latestAttendance) {
        setAttendanceStats({
          present: latestAttendance.totalPresent || 0,
          absent: latestAttendance.totalAbsent || 0,
        });
      } else {
        setAttendanceStats({ present: 0, absent: 0 });
      }
    } catch (error) {
      console.error('Error fetching attendance statistics:', error);
      
      // If 401 error (unauthorized), it means no token - skip and use cached/default data
      if (error.message && error.message.includes('401')) {
        console.warn('⚠️ Unauthorized - using cached or default attendance data');
        setAttendanceStats({ present: 0, absent: 0 });
      }
      
      // Keep previous stats on other errors
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  // Fetch attendance stats on component mount and set up auto-refresh
  useEffect(() => {
    // Check if we have cached data to show immediately
    const cachedAttendance = localStorage.getItem('attendanceDataCache');
    const cacheTime = localStorage.getItem('attendanceDataCacheTime');
    
    if (cachedAttendance && cacheTime) {
      const cacheAge = Date.now() - parseInt(cacheTime, 10);
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        try {
          const cachedData = JSON.parse(cachedAttendance);
          const attendances = Array.isArray(cachedData) ? cachedData : (cachedData?.data || []);
          const getTime = (att) => {
            const t = att?.updatedAt || att?.submittedAt || att?.createdAt || 0;
            return new Date(t).getTime();
          };
          const latestAttendance = [...attendances].sort((a, b) => getTime(b) - getTime(a))[0];
          if (latestAttendance) {
            setAttendanceStats({
              present: latestAttendance.totalPresent || 0,
              absent: latestAttendance.totalAbsent || 0,
            });
            setIsLoadingAttendance(false);
            console.log('✅ Dashboard initialized with cached attendance data');
          }
        } catch (e) {
          console.warn('Failed to parse cached attendance:', e);
        }
      }
    }
    
    // Initial fetch (will update if cache is stale)
    fetchAttendanceStats();
    
    // Set up interval to refresh every 10 seconds for more frequent updates
    const refreshInterval = setInterval(() => {
      fetchAttendanceStats();
    }, 10000); // 10 seconds
    
    // Also refresh when the page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAttendanceStats();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Navigation handlers
  const handleBrowseStudents = () => {
    navigate('/admin-student-database');
  };

  const handleAddCompany = () => {
    navigate('/admin-company-profile', { state: { openAddPopup: true } });
  };

  const handleScheduleDrive = () => {
    navigate('/admin/company-drive/add');
  };

  const handleAttendance = () => {
    navigate('/admin-attendance');
  };

  const handleAddBranch = () => {
    navigate('/admin-add-branch');
  };

  const handleMyAccount = () => {
    navigate('/admin-profile-main');
  };

  return (
    // Use bracket notation for classes with hyphens: styles['class-name']
    <div className={styles['admin-dashboard-page']}>
       <AdNavbar onToggleSidebar={toggleSidebar} />
       <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles['ad-db-dashboard-area']} >
      
      {/* HEADER */}
      <div className={styles['ad-db-college-header']}>
        <img src={collegeLogoUrl} alt="KSR College Logo" className={styles['ad-db-college-logo']} />
        <div className={styles['ad-db-college-name']}>
          K S R COLLEGE OF ENGINEERING (<span>Autonomous</span>) - 637215
        </div>
      </div>
      
      {/* DASHBOARD GRID */}
      <div className={styles['ad-db-dashboard-grid']}>
        
        {/* ROW 1 */}
        {/* Card 1: Browse Students */}
        <div 
          className={`${styles['ad-db-card']} ${styles['ad-db-card-browse']}`}
          onClick={handleBrowseStudents}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles['ad-db-card-icon']}>
            <img src={Adminbrowsestudents} alt="Browse Students" />
          </div>
          <h3 className={styles['ad-db-card-title']}>Browse Students</h3>
          <p className={styles['ad-db-card-sub']}>Filter, sort and manage<br />Student records</p>
        </div>

        {/* Card 2: Add New Company */}
        <div 
          className={`${styles['ad-db-card']} ${styles['ad-db-card-drive']}`}
          onClick={handleAddCompany}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles['ad-db-card-icon']}>
            <img src={Adminaddnewcompany} alt="Upcoming Drive" />
          </div>
          <h3 className={styles['ad-db-card-title']}>Add New Company</h3>
          <div className={styles['ad-db-drive-details']}>
            <p className={styles['ad-db-new-drive-details']}>Register new companies for <br />placement drives</p>
          </div>
        </div>

        {/* Card 3: Attendance Chart */}
        <div 
          className={`${styles['ad-db-card']} ${styles['ad-db-attendance-card']}`}
          onClick={handleAttendance}
          style={{ cursor: 'pointer' }}
        >
          <h2 className={styles['ad-db-new-attendance-title']}>Attendance</h2>
          <ModernAttendanceChart 
            present={attendanceStats.present} 
            absent={attendanceStats.absent} 
            isLoading={isLoadingAttendance}
          />
        </div>

        {/* ROW 2 */}
        {/* Card 4: Schedule Drive */}
        <div 
          className={`${styles['ad-db-card']} ${styles['ad-db-card-certificates']}`}
          onClick={handleScheduleDrive}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles['ad-db-card-icon']}>
            <img src={Adminschedulenewdrive} alt="Upload Certificate"/>
          </div>
          <div className={styles['ad-db-card-content']}>
            <h3 className={styles['ad-db-card-title']}>Schedule New Drive</h3>
            <p className={styles['ad-db-card-sub']}>organies and manage upcoming companies</p>
          </div>
        </div>
        
        {/* Card 5: Add Branch */}
        <div 
          className={styles['ad-db-card']}
          onClick={handleAddBranch}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles['ad-db-card-icon']}>
            <img src={AdminAddBranch} alt="Semester Icon" />
          </div>
          <h3 className={styles['ad-db-card-title']}> Add Branch</h3>
          <p className={styles['ad-db-card-sub']}>Create New Branch</p>
        </div>

        {/* Card 6: My Account */}
        <div 
          className={`${styles['ad-db-card']} ${styles['ad-db-account-card']}`}
          onClick={handleMyAccount}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles['ad-db-card-icon']}><img src={Adminmyacc} alt="My Account" /></div>
          <h3 className={styles['ad-db-card-title']}>My Account</h3>
          <p className={styles['ad-db-card-sub']}>Settings</p>
        </div>

      </div>
    </div>
    </div>
  );
}

export default AdminDashboard;