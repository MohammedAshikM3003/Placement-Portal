import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/apiConfig';
import gridfsService from '../../services/gridfsService';
import styles from './Adsidebar.module.css';
import AdDashboard from "../../assets/addashboardicon.svg";
import ManageStudents from "../../assets/adstuddbicon.svg";
import AdTrainingicon from "../../assets/Ad_Trainingicon.svg";
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
  { icon: AdTrainingicon, text: 'Placement Training', view: 'admin-placement-training' },
  { icon: AdminCompanyProfileicon, text: 'Company Profile', view: 'admin-company-profile' },
  { icon: AdminCompanydriveicon, text: 'Company Drive', view: 'admin-company-drive' },
  { icon: Adcertificate, text: 'Eligible Students', view: 'admin-student-application' },
  { icon: AdAttendance, text: 'Attendance', view: 'admin-attendance' },
  { icon: AdminPlacedStudentsicon, text: 'Placed Students', view: 'admin-placed-students' },
  { icon: AdReportAnalysis, text: 'Report Analysis', view: 'admin-report-analysis-rarw' },
  { icon: AdAddBranch, text: 'Add Branch', view: 'admin-add-branch-main' },
];

const viewToPath = (view) => `/` + view;

// ─── Module-level cache (persists across component remounts within a session) ──
const ADMIN_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let cachedAdminData = null;
let adminDataCacheTimestamp = null;
let cachedAdminPicUrl = null;
let cachedAdminBlobUrl = null;
let cachedAdminBlobSourceUrl = null;
let adminBlobFetchInProgress = null;

const fetchAndCacheAdminBlob = async (url) => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (cachedAdminBlobUrl && cachedAdminBlobSourceUrl === url) return cachedAdminBlobUrl;
  if (cachedAdminBlobUrl && cachedAdminBlobSourceUrl !== url) {
    URL.revokeObjectURL(cachedAdminBlobUrl);
    cachedAdminBlobUrl = null;
    cachedAdminBlobSourceUrl = null;
  }
  if (adminBlobFetchInProgress) return adminBlobFetchInProgress;
  adminBlobFetchInProgress = (async () => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size > 0) {
        cachedAdminBlobUrl = URL.createObjectURL(blob);
        cachedAdminBlobSourceUrl = url;
        return cachedAdminBlobUrl;
      }
      return url;
    } catch (e) {
      return url;
    } finally {
      adminBlobFetchInProgress = null;
    }
  })();
  return adminBlobFetchInProgress;
};

const Adsidebar = ({ isOpen, onLogout }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  
  // State for admin profile data - initialize from localStorage if available
  const [adminProfile, setAdminProfile] = useState(() => {
    // P0: module-level cache (in-memory, survives component remounts)
    if (cachedAdminData && adminDataCacheTimestamp &&
        (Date.now() - adminDataCacheTimestamp < ADMIN_CACHE_DURATION)) {
      const d = cachedAdminData;
      const fullName = (d.firstName || d.lastName)
        ? `${d.firstName || ''} ${d.lastName || ''}`.trim() : 'Admin';
      return { name: fullName, profilePhoto: gridfsService.resolveImageUrl(d.profilePhoto) || null };
    }
    // P1: localStorage adminProfileCache
    const cachedProfile = localStorage.getItem('adminProfileCache');
    if (cachedProfile) {
      try {
        const data = JSON.parse(cachedProfile);
        if (data.firstName || data.lastName) {
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Admin';
          cachedAdminData = data;
          adminDataCacheTimestamp = Date.now();
          return {
            name: fullName,
            profilePhoto: gridfsService.resolveImageUrl(data.profilePhoto) || null
          };
        } else if (data.name) {
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

  // adminPicUrl: separate state for profile photo URL with blob caching
  const [adminPicUrl, setAdminPicUrl] = useState(() => {
    // P0: blob URL (instant, in-memory)
    if (cachedAdminBlobUrl) return cachedAdminBlobUrl;
    // P1: module-level URL cache
    if (cachedAdminPicUrl) return cachedAdminPicUrl;
    // P2: separate localStorage key
    try {
      const cached = localStorage.getItem('cachedAdminPicUrl');
      if (cached) { cachedAdminPicUrl = cached; return cached; }
    } catch (_) {}
    // P3: from module-level cached admin data
    if (cachedAdminData?.profilePhoto) {
      const url = gridfsService.resolveImageUrl(cachedAdminData.profilePhoto);
      if (url) { cachedAdminPicUrl = url; return url; }
    }
    // P4: from localStorage adminProfileCache
    try {
      const stored = JSON.parse(localStorage.getItem('adminProfileCache') || 'null');
      if (stored?.profilePhoto) {
        const url = gridfsService.resolveImageUrl(stored.profilePhoto);
        if (url) {
          cachedAdminPicUrl = url;
          localStorage.setItem('cachedAdminPicUrl', url);
          return url;
        }
      }
    } catch (_) {}
    return null;
  });
  
  // Image handling states (like student sidebar)
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Function to fetch admin profile data - wrapped in useCallback to prevent stale closures
  const fetchAdminProfile = useCallback(async (force = false) => {
    // Skip if we already have fresh cached data and are not forced
    if (!force && hasFetchedRef.current && cachedAdminData && adminDataCacheTimestamp &&
        (Date.now() - adminDataCacheTimestamp < ADMIN_CACHE_DURATION)) {
      return;
    }
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
          
          // Update module-level cache
          cachedAdminData = data;
          adminDataCacheTimestamp = Date.now();
          hasFetchedRef.current = true;

          // Force complete state refresh with new object
          setAdminProfile({ ...profileData });
          setImageError(false);
          setImageKey(Date.now()); // Force image re-render

          // Update pic URL state and cache
          if (profileData.profilePhoto) {
            setAdminPicUrl(profileData.profilePhoto);
            cachedAdminPicUrl = profileData.profilePhoto;
            localStorage.setItem('cachedAdminPicUrl', profileData.profilePhoto);
          }
          
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

  // Fetch admin profile data on mount — skip if module-level cache is still fresh
  useEffect(() => {
    if (hasFetchedRef.current && cachedAdminData && adminDataCacheTimestamp &&
        (Date.now() - adminDataCacheTimestamp < ADMIN_CACHE_DURATION)) {
      return;
    }
    if (cachedAdminData && adminDataCacheTimestamp &&
        (Date.now() - adminDataCacheTimestamp < ADMIN_CACHE_DURATION)) {
      hasFetchedRef.current = true;
      return; // useState already initialized from module cache
    }
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  // Background: cache profile image as blob URL for instant rendering on next mount
  useEffect(() => {
    if (!adminPicUrl || adminPicUrl.startsWith('blob:') || adminPicUrl.startsWith('data:')) return;
    if (cachedAdminBlobUrl && cachedAdminBlobSourceUrl === adminPicUrl) {
      setAdminPicUrl(cachedAdminBlobUrl);
      return;
    }
    fetchAndCacheAdminBlob(adminPicUrl).then(blobUrl => {
      if (blobUrl && blobUrl.startsWith('blob:')) setAdminPicUrl(blobUrl);
    });
  }, [adminPicUrl]);

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

        // Update pic URL cache
        const resolvedPhoto = gridfsService.resolveImageUrl(data.profilePhoto);
        if (resolvedPhoto) {
          setAdminPicUrl(resolvedPhoto);
          cachedAdminPicUrl = resolvedPhoto;
          localStorage.setItem('cachedAdminPicUrl', resolvedPhoto);
        }
        
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

        // Update pic URL cache
        const resolvedForce = gridfsService.resolveImageUrl(data.profilePhoto);
        if (resolvedForce) {
          setAdminPicUrl(resolvedForce);
          cachedAdminPicUrl = resolvedForce;
          localStorage.setItem('cachedAdminPicUrl', resolvedForce);
        }

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
        fetchAdminProfile(true);
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
  // Check if current path is any training-related page
  const isTrainingPage = window.location.pathname === '/admin-add-training' ||
                         window.location.pathname === '/admin-schedule-training' ||
                         window.location.pathname === '/admin-schedule-training-batch' ||
                         window.location.pathname === '/admin-attendance-stdinfo' ||
                         window.location.pathname === '/admin-train-attendance-stuinfo';
  
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
    localStorage.removeItem('cachedAdminPicUrl');
    // Clear module-level cache
    cachedAdminData = null;
    adminDataCacheTimestamp = null;
    cachedAdminPicUrl = null;
    if (cachedAdminBlobUrl) {
      URL.revokeObjectURL(cachedAdminBlobUrl);
      cachedAdminBlobUrl = null;
      cachedAdminBlobSourceUrl = null;
    }
    
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
          {adminPicUrl && !imageError ? (
            <img 
              key={imageKey}
              src={adminPicUrl} 
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
                // Special handling for Placement Training - highlight on all training-related pages
                if (item.view === 'admin-placement-training') {
                  const shouldHighlight = isActive || isTrainingPage;
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