import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/apiConfig';
import gridfsService from '../../services/gridfsService';
import styles from './Adsidebar.module.css';
import AdDashboard from "../../assets/addashboardicon.svg";
import ManageStudents from "../../assets/adstuddbicon.svg";
import AdminCompanyProfileicon from "../../assets/adcompanyprofileicon.svg";
import AdminCompanydriveicon from "../../assets/adcompanydriveicon.svg";
import Adcertificate from "../../assets/adeligiblestudicon.svg";
import AdAttendance from "../../assets/adattendanceicon.svg";
import AdminPlacedStudentsicon from "../../assets/adplacedstudicon.svg";
import AdReportAnalysis from "../../assets/adreportanalysisicon.svg";
import AdAddBranch from "../../assets/adaddbranchicon.svg";
import AdProfileicon from "../../assets/adprofileicon.svg";
import AdminProfileGraduationcap from "../../assets/Admincapsidebar.svg";

// Navigation items are now in an array for easier management
const sidebarItems = [
  { icon: AdDashboard, text: 'Dashboard', view: 'admin-dashboard' },
  { icon: ManageStudents, text: 'Student Database', view: 'admin-student-database' },
  { icon: AdminCompanyProfileicon, text: 'Company Profile', view: 'admin-company-profile' },
  { icon: AdminCompanydriveicon, text: 'Company Drive', view: 'admin-company-drive' },
  { icon: Adcertificate, text: 'Eligible Students', view: 'admin-student-application' },
  { icon: AdAttendance, text: 'Attendance', view: 'admin-attendance' },
  { icon: AdminPlacedStudentsicon, text: 'Placed Students', view: 'admin-placed-students' },
  { icon: AdReportAnalysis, text: 'Report Analysis', view: 'admin-report-analysis-rarw' },
  { icon: AdAddBranch, text: 'Add Branch', view: 'admin-add-branch-main' },
];

const viewToPath = (view) => `/` + view;

const Adsidebar = ({ isOpen, onLogout }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  
  // State for admin profile data - initialize from localStorage if available
  const [adminProfile, setAdminProfile] = useState(() => {
    const cachedProfile = localStorage.getItem('adminProfileCache');
    if (cachedProfile) {
      try {
        const data = JSON.parse(cachedProfile);
        // Handle both formats: full profile cache OR sidebar-only cache
        if (data.firstName || data.lastName) {
          // Full profile cache format from AdminmainProfile.jsx
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Admin';
          return {
            name: fullName,
            profilePhoto: gridfsService.resolveImageUrl(data.profilePhoto) || null
          };
        } else if (data.name) {
          // Already in sidebar format
          return {
            ...data,
            profilePhoto: gridfsService.resolveImageUrl(data.profilePhoto) || null
          };
        }
      } catch (error) {
        console.error('Error parsing cached profile:', error);
      }
    }
    return {
      name: 'Admin',
      profilePhoto: null
    };
  });
  
  // Image handling states (like student sidebar)
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch admin profile data - wrapped in useCallback to prevent stale closures
  const fetchAdminProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const adminLoginID = localStorage.getItem('adminLoginID') || 'admin1000';
      const authToken = localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          // FIX: Ensure fallback to "Admin" if names are missing
          const fullName = (data.firstName || data.lastName) 
            ? `${data.firstName || ''} ${data.lastName || ''}`.trim() 
            : 'Admin';
          
          // 🖼️ Try to use cached image first, fallback to server data
          let profilePhotoUrl = data.profilePhoto;
          try {
            const { default: adminImageCacheService } = await import('../../services/adminImageCacheService.jsx');
            const cachedImage = adminImageCacheService.getCachedAdminProfilePhoto(data.adminLoginID);
            
            if (cachedImage) {
              console.log('✅ Admin sidebar using cached profile photo');
              profilePhotoUrl = cachedImage;
            } else if (data.profilePhoto) {
              console.log('📥 Caching admin profile photo for sidebar');
              await adminImageCacheService.cacheAdminProfilePhoto(data.adminLoginID, data.profilePhoto);
            }
          } catch (cacheError) {
            console.warn('⚠️ Cache service unavailable for sidebar, using server data:', cacheError);
          }
          
          const profileData = {
            name: fullName,
            profilePhoto: gridfsService.resolveImageUrl(profilePhotoUrl) || null
          };
          
          // Force complete state refresh with new object
          setAdminProfile({ ...profileData });
          setImageError(false);
          setImageKey(Date.now()); // Force image re-render
          
          // NOTE: Don't update adminProfileCacheTime here to avoid infinite loops
          // The storage event listener in this same component would trigger
          // fetchAdminProfile() again, causing continuous updates
          // Only the profile page should update the cache timestamp
          
          console.log('✅ Admin sidebar profile updated:', fullName);
          
          // Preload image if exists to ensure it's ready
          if (profilePhotoUrl) {
            const img = new Image();
            img.onload = () => {
              console.log('✅ Admin profile image preloaded successfully');
              setImageKey(Date.now());
              setImageError(false);
            };
            img.onerror = () => {
              console.warn('⚠️ Failed to load admin profile image');
              setImageError(true);
            };
            img.src = gridfsService.resolveImageUrl(profilePhotoUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependencies since it doesn't rely on any props or state

  // Fetch admin profile data on mount
  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  // Listen for profile update events (when admin saves their profile)
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('🔄 Admin profile update detected in sidebar');
      
      // INSTANT SYNC: If data is provided in the event detail, update state immediately
      // This is the "Student Style" pattern - bypasses network fetch entirely
      if (event.detail) {
        const data = event.detail;
        const fullName = (data.firstName || data.lastName) 
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim() 
          : 'Admin';

        setAdminProfile({
          name: fullName,
          profilePhoto: gridfsService.resolveImageUrl(data.profilePhoto) || null
        });
        
        setImageError(false);
        setImageKey(Date.now()); // Forces the <img> tag to refresh
        setIsLoading(false); // No spinner needed - instant update!
        
        // NOTE: Don't overwrite adminProfileCache here - the profile page manages the full cache
        // We just update our local component state for instant UI sync
        
        console.log('✅ Admin sidebar updated instantly from event payload');
        return; // Stop here - no need to fetch from server!
      }
      
      // FALLBACK: Only fetch from server if the event has no data payload
      setImageError(false);
      setImageKey(Date.now());
      setIsLoading(true);
      
      // Small delay to ensure cache is updated
      setTimeout(() => {
        fetchAdminProfile();
      }, 50);
    };
    
    const handleForceRefresh = (event) => {
      console.log('🔄 Force refresh admin profile in sidebar');
      
      // Check for data payload first (instant sync)
      if (event.detail) {
        const data = event.detail;
        const fullName = (data.firstName || data.lastName) 
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim() 
          : 'Admin';

        setAdminProfile({
          name: fullName,
          profilePhoto: gridfsService.resolveImageUrl(data.profilePhoto) || null
        });
        
        setImageError(false);
        setImageKey(Date.now());
        setIsLoading(false);
        console.log('✅ Admin sidebar force-refreshed from event payload');
        return;
      }
      
      setImageError(false);
      setImageKey(Date.now());
      setIsLoading(true);
      
      setTimeout(() => {
        fetchAdminProfile();
      }, 100);
    };

    // Listen for custom events
    window.addEventListener('adminProfileUpdated', handleProfileUpdate);
    window.addEventListener('forceAdminProfileRefresh', handleForceRefresh);

    // Also listen for storage events (in case profile is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'adminProfileCacheTime' && e.newValue) {
        console.log('🔄 Admin profile cache updated, refreshing sidebar');
        setImageError(false);
        setImageKey(Date.now());
        fetchAdminProfile();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('adminProfileUpdated', handleProfileUpdate);
      window.removeEventListener('forceAdminProfileRefresh', handleForceRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchAdminProfile]); // Add fetchAdminProfile to dependencies

  // Check if current path is admin profile (student view)
  const isAdminProfilePage = window.location.pathname.startsWith('/admin-profile/');
  // Check if current path is certificate view page
  const isCertificateViewPage = window.location.pathname.startsWith('/admin-student-certificates/');
  // Check if current path is add branch pages (both main and form)
  const isAddBranchPage = window.location.pathname === '/admin-add-branch' || 
                          window.location.pathname === '/admin-add-branch-main';
  // Check if current path is coordinator detail page
  const isCoordinatorDetailPage = window.location.pathname === '/admin-coordinator-detail';
  // Check if current path is manage coordinators page
  const isManageCoordinatorsPage = window.location.pathname.startsWith('/admin-manage-coordinators/');
  // Check if current path is company drive related pages
  const isCompanyDrivePage = window.location.pathname.startsWith('/admin/company-drive/');
  // Check if current path is eligible students page
  const isEligibleStudentsPage = window.location.pathname === '/admin-eligible-students';
  // Check if current path is any report analysis page
  const isReportAnalysisPage = window.location.pathname.startsWith('/admin-report-analysis-');
  
  const handleLogoutClick = async () => {
    // Clear admin image cache
    try {
      const { default: adminImageCacheService } = await import('../../services/adminImageCacheService.jsx');
      adminImageCacheService.clearAllCaches();
      console.log('✅ Admin image cache cleared on logout from sidebar');
    } catch (error) {
      console.warn('⚠️ Failed to clear admin image cache on logout:', error);
    }

    // Clear all localStorage data
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('adminLoginID');
    localStorage.removeItem('adminProfileCache');
    localStorage.removeItem('adminProfileCacheTime');
    
    // Clear legacy keys
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userRole');
    
    // Call AuthContext logout to end session
    if (authLogout) {
      await authLogout();
    }
    
    // Redirect to landing page
    navigate('/');
  };
  
  return (
    <div className={`${styles.adsidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles['ad-user-info']}>
        <div className={styles['ad-user-details']}>
          {adminProfile.profilePhoto && !imageError ? (
            <img 
              key={imageKey}
              src={gridfsService.resolveImageUrl(adminProfile.profilePhoto)} 
              alt="Profile" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles['ad-placeholder-circle']}>
              <img src={AdminProfileGraduationcap} alt="Admin" />
            </div>
          )}
          <div className={styles['ad-user-text']}>
            <span>{(adminProfile.name || 'Admin').toUpperCase()}</span>
          </div>
        </div>
      </div>

      <nav className={styles['ad-nav']}>
        <div className={styles['ad-nav-section']}>
          {sidebarItems.map((item) => (
            <NavLink
              key={item.text}
              to={viewToPath(item.view)}
              className={({ isActive }) => {
                // Special handling for Student Database - highlight when viewing student profile or certificates
                if (item.view === 'admin-student-database') {
                  const shouldHighlight = isActive || isAdminProfilePage || isCertificateViewPage;
                  return `${styles['ad-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                // Special handling for Add Branch - highlight on main, form, and manage coordinators pages
                if (item.view === 'admin-add-branch-main') {
                  const shouldHighlight = isActive || isAddBranchPage || isManageCoordinatorsPage;
                  return `${styles['ad-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                // Special handling for Report Analysis - highlight on all 4 report analysis pages
                if (item.view === 'admin-report-analysis-rarw') {
                  const shouldHighlight = isActive || isReportAnalysisPage;
                  return `${styles['ad-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                return `${styles['ad-nav-item']} ${isActive ? styles.selected : ''}`;
              }}
            >
              <img src={item.icon} alt={item.text} />
              <span className={styles['ad-nav-text']}>{item.text}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles['ad-nav-divider']}></div>

        <NavLink
          to="/admin-profile-main"
          className={({ isActive }) => `${styles['ad-nav-item']} ${isActive ? styles.selected : ''}`}
        >
          <img src={AdProfileicon} alt="Profile" />
          <span className={styles['ad-nav-text']}>Profile</span>
        </NavLink>

        <button className={styles['ad-logout-btn']} onClick={handleLogoutClick}>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Adsidebar;