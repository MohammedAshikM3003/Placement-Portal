import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mongoDBService from '../services/mongoDBService';
import styles from './AdminLoadingPage.module.css';

const AdminLoadingPage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('Authenticating...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const adminLoginID = localStorage.getItem('adminLoginID');
        const authRole = localStorage.getItem('authRole');
        
        if (!authToken || !adminLoginID || authRole !== 'admin') {
          setError('Authentication required');
          setTimeout(() => navigate('/mainlogin', { replace: true }), 2000);
          return;
        }

        // Step 1: Loading profile information (25%)
        setCurrentTask('Loading profile information...');
        setProgress(25);
        
        try {
          // Fetch admin profile from backend
          const adminProfile = await mongoDBService.getAdminProfile(adminLoginID);
          
          if (adminProfile) {
            // Cache the complete admin profile data including college details
            const fullProfileCache = {
              // Personal Information
              firstName: adminProfile.firstName || '',
              lastName: adminProfile.lastName || '',
              fullName: `${adminProfile.firstName || ''} ${adminProfile.lastName || ''}`.trim(),
              dob: adminProfile.dob || '',
              gender: adminProfile.gender || '',
              emailId: adminProfile.emailId || '',
              domainMailId: adminProfile.domainMailId || '',
              phoneNumber: adminProfile.phoneNumber || '',
              department: adminProfile.department || '',
              staffId: adminProfile.staffId || '',
              cabin: adminProfile.cabin || '',
              adminLoginID: adminProfile.adminLoginID || adminLoginID,
              
              // Profile Photo
              profilePhoto: adminProfile.profilePhoto || null,
              
              // College Details
              collegeBanner: adminProfile.collegeBanner || null,
              naacCertificate: adminProfile.naacCertificate || null,
              nbaCertificate: adminProfile.nbaCertificate || null,
              collegeLogo: adminProfile.collegeLogo || null,
              
              // Timestamp for cache validation
              timestamp: Date.now()
            };
            
            localStorage.setItem('adminProfileCache', JSON.stringify(fullProfileCache));
            localStorage.setItem('adminProfileCacheTime', Date.now().toString());
            console.log('✅ Complete admin profile cached (personal info + college details):', {
              hasPersonalInfo: !!(adminProfile.firstName && adminProfile.lastName),
              hasProfilePhoto: !!adminProfile.profilePhoto,
              hasCollegeBanner: !!adminProfile.collegeBanner,
              hasNaacCert: !!adminProfile.naacCertificate,
              hasNbaCert: !!adminProfile.nbaCertificate,
              hasCollegeLogo: !!adminProfile.collegeLogo
            });
          } else {
            console.log('⚠️ Admin profile not found - this may be first time setup');
            // Set empty cache to prevent repeated failed fetches
            const emptyCache = {
              adminLoginID: adminLoginID,
              timestamp: Date.now(),
              isFirstTimeSetup: true
            };
            localStorage.setItem('adminProfileCache', JSON.stringify(emptyCache));
            localStorage.setItem('adminProfileCacheTime', Date.now().toString());
          }
        } catch (profileError) {
          console.warn('⚠️ Failed to fetch admin profile:', profileError);
          // If 404, it means profile doesn't exist yet (first time)
          if (profileError.message && profileError.message.includes('404')) {
            console.log('📝 Admin profile does not exist - first time setup detected');
            const emptyCache = {
              adminLoginID: adminLoginID,
              timestamp: Date.now(),
              isFirstTimeSetup: true
            };
            localStorage.setItem('adminProfileCache', JSON.stringify(emptyCache));
            localStorage.setItem('adminProfileCacheTime', Date.now().toString());
          }
        }

        await new Promise(resolve => setTimeout(resolve, 600));

        // Step 2: Validating college details (50%)
        setCurrentTask('Validating college details...');
        setProgress(50);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 3: Preparing dashboard (75%)
        setCurrentTask('Preparing dashboard...');
        setProgress(75);
        await new Promise(resolve => setTimeout(resolve, 400));

        // Step 4: Finalizing (100%)
        setCurrentTask('Finalizing...');
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Dispatch admin data ready event
        window.dispatchEvent(new Event('adminDataReady'));
        console.log('✅ Admin data fully loaded, navigating to dashboard');

        // Navigate to dashboard
        setTimeout(() => {
          navigate('/admin-dashboard', { replace: true });
        }, 300);

      } catch (error) {
        console.error('❌ Error loading admin data:', error);
        setError('Failed to load profile data');
        setTimeout(() => navigate('/mainlogin', { replace: true }), 2000);
      }
    };

    loadAdminData();
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        <div className={styles.iconWrapper}>
          <div className={styles.graduationCapIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>Placement Portal</h1>
        <h2 className={styles.subtitle}>Admin Panel</h2>

        {error ? (
          <div className={styles.errorMessage}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className={styles.statusText}>{currentTask}</div>

            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              >
                <div className={styles.progressShine}></div>
              </div>
            </div>

            <div className={styles.progressText}>{progress}%</div>

            <div className={styles.loadingDots}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>

            <p className={styles.pleaseWait}>Please wait while we prepare your dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLoadingPage;
