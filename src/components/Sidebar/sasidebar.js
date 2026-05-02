import React, { useState, useEffect, useCallback, useRef } from 'react';

import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

import { API_BASE_URL } from '../../utils/apiConfig';
import { resolveProfileUrl, fetchAndCacheBlob, clearBlobCache } from './profileUtils';

import styles from './sasidebar.module.css';

import AdDashboard from "../../assets/addashboardicon.svg";

import ManageStudents from "../../assets/adstuddbicon.svg";

import AdminCompanyProfileicon from "../../assets/adcompanyprofileicon.svg";

import AdminCompanydriveicon from "../../assets/adcompanydriveicon.svg";

import Adcertificate from "../../assets/adeligiblestudicon.svg";

import AdAttendance from "../../assets/adattendanceicon.svg";

import AdminTrainingIcon from "../../assets/admintraining.svg";

import AdminPlacedStudentsicon from "../../assets/adplacedstudicon.svg";

import AdReportAnalysis from "../../assets/adreportanalysisicon.svg";

import AdAddBranch from "../../assets/adaddbranchicon.svg";

import AdProfileicon from "../../assets/adprofileicon.svg";

import AdminProfileGraduationcap from "../../assets/Admincapsidebar.svg";

// Module-level cache (persists across component unmount/remount - PREVENTS FLICKERING!)
let cachedAdminProfile = null;
let cachedProfileTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour



// Navigation items reduced to three: Students, Coordinators, Admin
const sidebarItems = [
  { icon: ManageStudents, text: 'Students', view: 'admin-student-database' },
  { icon: AdAddBranch, text: 'Coordinators', view: 'admin-manage-coordinators' },
  { icon: AdProfileicon, text: 'Admin', view: 'admin-profile-main' },
];



const viewToPath = (view) => `/` + view;

const normalizeSidebarProfilePhoto = (value) => {
  if (!value) return null;
  const resolved = resolveProfileUrl(value, API_BASE_URL);
  return resolved || null;
};



const Sasidebar = ({ isOpen, onLogout, onViewChange }) => {

  const { logout: authLogout } = useAuth();

  const navigate = useNavigate();

  const hasFetchedRef = useRef(false); // Prevent duplicate fetches



  // State for admin profile data - initialize from MODULE-LEVEL cache first (INSTANT!)

  const [adminProfile, setAdminProfile] = useState(() => {
    if (cachedAdminProfile && cachedProfileTimestamp && (Date.now() - cachedProfileTimestamp < CACHE_DURATION)) {
      return cachedAdminProfile;
    }

    const cachedProfile = localStorage.getItem('adminProfileCache');

    if (cachedProfile) {
      try {
        const data = JSON.parse(cachedProfile);

        if (data.firstName || data.lastName) {
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Admin';
          const profileData = {
            name: fullName,
            profilePhoto: normalizeSidebarProfilePhoto(data.profilePhoto)
          };
          cachedAdminProfile = profileData;
          cachedProfileTimestamp = Date.now();
          return profileData;
        } else if (data.name) {
          if (data.profilePhoto) {
            data.profilePhoto = normalizeSidebarProfilePhoto(data.profilePhoto);
          }
          cachedAdminProfile = data;
          cachedProfileTimestamp = Date.now();
          return data;
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
          const fullName = (data.firstName || data.lastName)
            ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
            : 'Admin';

          let profilePhotoUrl = data.profilePhoto;
          try {
            const { default: adminImageCacheService } = await import('../../services/adminImageCacheService.jsx');
            const cachedImage = adminImageCacheService.getCachedAdminProfilePhoto(data.adminLoginID);
            if (cachedImage) {
              profilePhotoUrl = cachedImage;
            } else if (data.profilePhoto) {
              await adminImageCacheService.cacheAdminProfilePhoto(data.adminLoginID, data.profilePhoto);
            }
          } catch (cacheError) {
            console.warn('Cache service unavailable for sidebar, using server data:', cacheError);
          }

          const profileData = {
            name: fullName,
            profilePhoto: profilePhotoUrl || null
          };

          cachedAdminProfile = profileData;
          cachedProfileTimestamp = Date.now();

          setAdminProfile({ ...profileData });
          setImageError(false);
          setImageKey(Date.now());

          try {
            const resolved = resolveProfileUrl(profilePhotoUrl, API_BASE_URL);
            if (resolved && resolved !== profilePhotoUrl) {
              profilePhotoUrl = resolved;
            }
            try {
              const blobUrl = await fetchAndCacheBlob(profilePhotoUrl);
              if (blobUrl) {
                profilePhotoUrl = blobUrl;
                cachedAdminProfile.profilePhoto = profilePhotoUrl;
                setAdminProfile(prev => ({ ...(prev || {}), profilePhoto: profilePhotoUrl }));
              }
            } catch (_) {}
          } catch (_) {}

          localStorage.setItem('adminProfileCacheTime', Date.now().toString());

          if (profilePhotoUrl) {
            const img = new Image();
            img.onload = () => {
              setImageKey(Date.now());
              setImageError(false);
            };
            img.onerror = () => {
              setImageError(true);
            };
            img.src = profilePhotoUrl;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (
      hasFetchedRef.current &&
      cachedAdminProfile &&
      cachedProfileTimestamp &&
      (Date.now() - cachedProfileTimestamp < CACHE_DURATION)
    ) {
      return;
    }

    if (
      cachedAdminProfile &&
      cachedProfileTimestamp &&
      (Date.now() - cachedProfileTimestamp < CACHE_DURATION)
    ) {
      hasFetchedRef.current = true;
      if (adminProfile.name !== cachedAdminProfile.name || adminProfile.profilePhoto !== cachedAdminProfile.profilePhoto) {
        setAdminProfile(cachedAdminProfile);
      }
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchAdminProfile();
  }, [fetchAdminProfile, adminProfile.name, adminProfile.profilePhoto]);


  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        const data = event.detail;
        const fullName = (data.firstName || data.lastName)
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : 'Admin';

        let updatedPhoto = data.profilePhoto || null;
        try { updatedPhoto = resolveProfileUrl(updatedPhoto, API_BASE_URL); } catch (_) {}

        const profileData = {
          name: fullName,
          profilePhoto: normalizeSidebarProfilePhoto(updatedPhoto)
        };

        cachedAdminProfile = profileData;
        cachedProfileTimestamp = Date.now();

        setAdminProfile(profileData);

        setImageError(false);

        setImageKey(Date.now());

        setIsLoading(false);

        return;
      }

      setImageError(false);

      setImageKey(Date.now());

      setIsLoading(true);

      setTimeout(() => {
        fetchAdminProfile();
      }, 50);
    };

    const handleForceRefresh = (event) => {
      if (event.detail) {
        const data = event.detail;
        const fullName = (data.firstName || data.lastName)
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : 'Admin';

        let updatedPhoto = data.profilePhoto || null;
        try { updatedPhoto = resolveProfileUrl(updatedPhoto, API_BASE_URL); } catch (_) {}
        const profileData = {
          name: fullName,
          profilePhoto: normalizeSidebarProfilePhoto(updatedPhoto)
        };

        cachedAdminProfile = profileData;
        cachedProfileTimestamp = Date.now();

        setAdminProfile(profileData);

        setImageError(false);

        setImageKey(Date.now());

        setIsLoading(false);

        return;
      }

      setImageError(false);

      setImageKey(Date.now());

      setIsLoading(true);

      setTimeout(() => {
        fetchAdminProfile();
      }, 100);
    };

    window.addEventListener('adminProfileUpdated', handleProfileUpdate);
    window.addEventListener('forceAdminProfileRefresh', handleForceRefresh);

    const handleStorageChange = (e) => {
      if (e.key === 'adminProfileCacheTime' && e.newValue) {
        cachedProfileTimestamp = null;
        fetchAdminProfile();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('adminProfileUpdated', handleProfileUpdate);
      window.removeEventListener('forceAdminProfileRefresh', handleForceRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchAdminProfile]);


  const isAdminProfilePage = window.location.pathname.startsWith('/admin-profile/');
  const isSastuPage = window.location.pathname === '/sastu-page';
  const isCertificateViewPage = window.location.pathname.startsWith('/admin-student-certificates/');
  const isAdminStudentViewPage = window.location.pathname.startsWith('/admin-student-view/');
  const isAdminStudentEditPage = window.location.pathname.startsWith('/admin-student-edit/');
  const isAdminSemesterMarksheetViewPage = window.location.pathname.startsWith('/admin-semester-marksheet-view/');
  const isActiveZipPage = window.location.pathname.startsWith('/admin/active-zip/') || window.location.pathname.startsWith('/admin/zipped-batch') || window.location.pathname === '/admin/zipped-batches';
  const isAddBranchPage = window.location.pathname === '/admin-add-branch' ||
                          window.location.pathname === '/admin-add-branch-main';
  const isCoordinatorDetailPage = window.location.pathname === '/admin-coordinator-detail';
  const isManageCoordinatorsPage = window.location.pathname.startsWith('/admin-manage-coordinators/');
  const isCompanyDrivePage = window.location.pathname === '/admin-company-drive' ||
    window.location.pathname.startsWith('/admin/company-drive/');
  const isEligibleStudentsPage = window.location.pathname === '/admin-eligible-students';
  const isReportAnalysisPage = window.location.pathname.startsWith('/admin-report-analysis-');
  const isTrainingPage = window.location.pathname === '/admin-training' ||
                         window.location.pathname === '/admin-trainings-archive' ||
                         window.location.pathname === '/admin-add-training' ||
                         window.location.pathname === '/admin-schedule-training' ||
                         window.location.pathname === '/admin-preferred-training-students' ||
                         window.location.pathname === '/admin-schedule-training-batch' ||
                         window.location.pathname === '/admin-attendance-stdinfo' ||
                         window.location.pathname === '/admin-train-attendance-stuinfo' ||
                         window.location.pathname === '/admin-training-history' ||
                         window.location.pathname === '/admin-training-company' ||
                         window.location.pathname.startsWith('/admin-training-history/') ||
                         window.location.pathname.startsWith('/admin-training-company/');


  const handleLogoutClick = async () => {
    cachedAdminProfile = null;
    cachedProfileTimestamp = null;

    try {
      const { default: adminImageCacheService } = await import('../../services/adminImageCacheService.jsx');
      adminImageCacheService.clearAllCaches();
    } catch (error) {
      console.warn('Failed to clear admin image cache on logout:', error);
    }

    try { clearBlobCache(); } catch (_) {}

    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('adminLoginID');
    localStorage.removeItem('adminProfileCache');
    localStorage.removeItem('adminProfileCacheTime');
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userRole');

    if (authLogout) {
      await authLogout();
    }

    navigate('/');
  };
  
  return (
    <div className={`${styles.sasidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles['sa-user-info']}>
        <div className={styles['sa-user-details']}>
          {adminProfile.profilePhoto && !imageError ? (
            <img 
              key={imageKey}
              src={adminProfile.profilePhoto} 
              alt="Profile" 
              onError={() => setImageError(true)}
            />
          ) : (
            <img className={styles['sa-placeholder-cap']} src={AdminProfileGraduationcap} alt="Super Admin" />
          )}
          <div className={styles['sa-user-text']}>
            <span>SUPER ADMIN</span>
          </div>
        </div>
      </div>

      <nav className={styles['sa-nav']}>
        <div className={styles['sa-nav-section']}>
          {sidebarItems.map((item) => (
            <NavLink
              key={item.text}
              to={viewToPath(item.view)}
              data-view={item.view}
              className={({ isActive }) => {
                if (item.view === 'admin-student-database') {
                  const shouldHighlight = isActive || isSastuPage || isAdminProfilePage || isCertificateViewPage || isAdminStudentViewPage || isAdminStudentEditPage || isAdminSemesterMarksheetViewPage || isActiveZipPage;
                  return `${styles['sa-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                if (item.view === 'admin-manage-coordinators') {
                  const shouldHighlight = isActive || isAddBranchPage || isManageCoordinatorsPage;
                  return `${styles['sa-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                if (item.view === 'admin-student-application') {
                  const shouldHighlight = isActive || isEligibleStudentsPage || window.location.pathname === '/admin-student-application';
                  return `${styles['sa-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                if (item.view === 'admin-report-analysis-rarw') {
                  const shouldHighlight = isActive || isReportAnalysisPage;
                  return `${styles['sa-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                if (item.view === 'admin-training') {
                  const shouldHighlight = isActive || isTrainingPage;
                  return `${styles['sa-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                if (item.view === 'admin-company-drive') {
                  const shouldHighlight = isActive || isCompanyDrivePage;
                  return `${styles['sa-nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                }
                return `${styles['sa-nav-item']} ${isActive ? styles.selected : ''}`;
              }}
              onClick={(e) => {
                if (onViewChange) {
                  e.preventDefault();
                  onViewChange(item.view);
                }
                if (window.innerWidth <= 992 && isOpen) {
                  window.dispatchEvent(new CustomEvent('closeSidebar'));
                }
              }}
            >
              <img src={item.icon} alt={item.text} />
              <span className={styles['sa-nav-text']}>{item.text}</span>
            </NavLink>
          ))}
        </div>

        
      </nav>

    </div>
  );

};

export default Sasidebar;
