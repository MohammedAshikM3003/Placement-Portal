import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdStuDBCertificateView.module.css';
import Adminicon from "../assets/Adminicon.png";
import mongoDBService from '../services/mongoDBService.jsx';
import {
  AdminDownloadFailedAlert,
  AdminPreviewFailedAlert,
  AdminPreviewProgressAlert,
  AdminCertificateDownloadProgressAlert,
  AdminCertificateDownloadSuccessAlert
} from '../components/alerts/AdminDownloadPreviewAlerts';

const CertificateIcon = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <circle cx="10" cy="14" r="2"></circle>
        <path d="M10 16v4M8 20h4"></path>
    </svg>
);

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const ViewIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const StarIcon = ({ filled }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const DefaultProfileIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

function AdStuDBCertificateView() {
    useAdminAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const location = useLocation();
    const { studentId } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Initialize with data from previous page if available
    const [studentData, setStudentData] = useState(location.state?.studentData || null);
    const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);
    const [certificates, setCertificates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [scrollPercent, setScrollPercent] = useState(0);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    
    // Download/Preview popup states
    const [downloadPopupState, setDownloadPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
    const [previewPopupState, setPreviewPopupState] = useState('none'); // 'none', 'progress', 'failed'
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [previewProgress, setPreviewProgress] = useState(0);

    // Debug: Log initial student data from navigation
    useEffect(() => {
        console.log('🔍 Initial student data from navigation:', location.state?.studentData);
        console.log('🔍 Student ID from URL:', studentId);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminId');
        localStorage.removeItem('userRole');
        navigate('/admin-login');
    };

    useEffect(() => {
        const loadStudentData = async () => {
            if (!studentId) {
                navigate('/admin-student-database');
                return;
            }

            setIsLoadingCertificates(true);
            
            // Use navigation state as immediate data source
            if (location.state?.studentData && !studentData) {
                setStudentData(location.state.studentData);
            }
            
            try {
                // Fetch complete student data including certificates with timeout handling
                const fastDataService = (await import('../services/fastDataService.jsx')).default;
                
                // Add timeout wrapper with longer duration for slow connections
                const completeData = await Promise.race([
                    fastDataService.getCompleteStudentData(studentId, false),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timeout - using fallback data')), 25000)
                    )
                ]);
                
                const student = completeData?.student;
                
                // Always update student data to ensure we have the latest info
                if (student) {
                    console.log('✅ Student data from API:', student);
                    setStudentData(student);
                } else if (!studentData) {
                    // If API failed but we have navigation state, keep using it
                    console.log('⚠️ Using student data from navigation state');
                }

                // Extract certificates from the complete data response
                const certificatesData = completeData?.certificates || [];
                
                // Format certificates for display - using real database fields
                // Filter to show only approved certificates
                const formattedCertificates = certificatesData
                    .filter(cert => {
                        const status = (cert.status || '').toLowerCase();
                        return status === 'approved';
                    })
                    .map(cert => {
                        // Get the proper certificate name from comp/competition field
                        const certName = cert.comp || cert.competition || cert.certificateName || cert.achievementTitle || 'Untitled Certificate';
                        
                        // Use the event date (cert.date) not uploadDate
                        let formattedDate = 'N/A';
                        const dateToUse = cert.date || cert.uploadDate;
                        if (dateToUse) {
                            try {
                                // Handle DD-MM-YYYY format
                                const dateStr = dateToUse.toString();
                                if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                                    formattedDate = dateStr;
                                } else {
                                    const dateObj = new Date(dateToUse);
                                    formattedDate = dateObj.toLocaleDateString('en-GB', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                    }).replace(/\//g, '-');
                                }
                            } catch (e) {
                                formattedDate = dateToUse.toString();
                            }
                        }
                        
                        return {
                            name: certName,
                            date: formattedDate,
                            url: cert.fileData || cert.certificateUrl || cert.url || '#',
                            certificateId: cert._id || cert.id,
                            achievementId: cert.achievementId,
                            status: cert.status,
                            fileName: cert.fileName || '',
                            studentName: cert.studentName || cert.name || ''
                        };
                    });

                setCertificates(formattedCertificates);
                
                console.log('✅ Certificate data loaded:', {
                    studentName: student?.name || studentData?.name,
                    studentRegNo: student?.regNo || studentData?.regNo,
                    totalCertificates: formattedCertificates.length,
                    certificates: formattedCertificates
                });
            } catch (error) {
                console.error('❌ Failed to load student data:', error);
                
                // Keep using existing student data if available
                if (!studentData && location.state?.studentData) {
                    setStudentData(location.state.studentData);
                }
                
                // Try fallback with mongoDBService to fetch certificates directly
                try {
                    console.log('🔄 Attempting fallback certificate fetch...');
                    
                    // Use shorter timeout for fallback
                    const certificatesResponse = await Promise.race([
                        mongoDBService.getCertificatesByStudentId(studentId),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Fallback timeout')), 10000)
                        )
                    ]).catch((err) => {
                        console.warn('⚠️ Fallback fetch failed:', err.message);
                        return [];
                    });
                    
                    // Handle both array and object response formats
                    const studentCertificates = Array.isArray(certificatesResponse) 
                        ? certificatesResponse 
                        : (certificatesResponse?.certificates || []);
                    
                    console.log('📋 Fallback certificates fetched:', studentCertificates.length);
                    
                    // Debug: Log raw certificate data
                    if (studentCertificates.length > 0) {
                        console.log('🔍 Raw certificate sample:', {
                            hasFileData: !!studentCertificates[0]?.fileData,
                            fileDataLength: studentCertificates[0]?.fileData?.length,
                            hasCertificateUrl: !!studentCertificates[0]?.certificateUrl,
                            hasUrl: !!studentCertificates[0]?.url,
                            keys: Object.keys(studentCertificates[0])
                        });
                    }
                    
                    // Filter to show only approved certificates
                    const formattedCertificates = studentCertificates
                        .filter(cert => {
                            const status = (cert.status || '').toLowerCase();
                            return status === 'approved';
                        })
                        .map(cert => {
                            // Get the proper certificate name from comp/competition field
                            const certName = cert.comp || cert.competition || cert.certificateName || cert.achievementTitle || 'Untitled Certificate';
                            
                            // Use the event date (cert.date) not uploadDate
                            let formattedDate = 'N/A';
                            const dateToUse = cert.date || cert.uploadDate;
                            if (dateToUse) {
                                try {
                                    // Handle DD-MM-YYYY format
                                    const dateStr = dateToUse.toString();
                                    if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                                        formattedDate = dateStr;
                                    } else {
                                        const dateObj = new Date(dateToUse);
                                        formattedDate = dateObj.toLocaleDateString('en-GB', { 
                                            day: '2-digit', 
                                            month: '2-digit', 
                                            year: 'numeric' 
                                        }).replace(/\//g, '-');
                                    }
                                } catch (e) {
                                    formattedDate = dateToUse.toString();
                                }
                            }
                            
                            return {
                                name: certName,
                                date: formattedDate,
                                url: cert.fileData || cert.certificateUrl || cert.url || '#',
                                certificateId: cert._id || cert.id,
                                achievementId: cert.achievementId,
                                status: cert.status,
                                fileName: cert.fileName || '',
                                studentName: cert.studentName || cert.name || ''
                            };
                        });

                    console.log('🔍 Formatted certificates:', formattedCertificates.map(c => ({
                        name: c.name,
                        hasUrl: !!c.url && c.url !== '#',
                        urlLength: c.url?.length || 0,
                        urlPreview: c.url?.substring(0, 50)
                    })));

                    setCertificates(formattedCertificates);
                } catch (fallbackError) {
                    console.error('❌ Fallback failed:', fallbackError);
                    setCertificates([]);
                }
            } finally {
                setIsLoadingCertificates(false);
            }
        };

        loadStudentData();
    }, [studentId, navigate, location.state?.studentData]);

    const handleScroll = (e) => {
        const element = e.target;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setScrollPercent(percent);
        setShowScrollIndicator(scrollHeight > 0);
    };

    const handleViewCertificate = async (certificateUrl, certificateId, achievementId) => {
        console.log('🔍 Preview certificate:', certificateUrl?.substring(0, 50));
        
        let progressInterval;
        
        try {
            // Show preview progress popup FIRST
            console.log('✅ Showing preview progress popup');
            setPreviewPopupState('progress');
            setPreviewProgress(0);

            // Smooth progress animation
            progressInterval = setInterval(() => {
                setPreviewProgress(prev => {
                    if (prev >= 90) {
                        return 90;
                    }
                    return prev + 15;
                });
            }, 150);

            let actualFileData = certificateUrl;
            
            // If URL is invalid or '#', fetch from database
            if (!certificateUrl || certificateUrl === '#' || certificateUrl === 'null') {
                console.log('🔄 Fetching certificate file data from database...');
                
                try {
                    // Fetch the certificate file data using MongoDB service
                    const idToUse = achievementId || certificateId;
                    
                    if (!idToUse) {
                        throw new Error('No certificate ID available');
                    }

                    const certificateDataResponse = await Promise.race([
                        mongoDBService.getCertificateFileByAchievementId(studentId, idToUse),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Certificate fetch timeout')), 30000)
                        )
                    ]);

                    actualFileData = certificateDataResponse?.fileData;
                    
                    if (!actualFileData) {
                        throw new Error('No file data available in response');
                    }
                    
                    console.log('✅ Certificate file data fetched successfully');
                } catch (fetchError) {
                    console.error('❌ Failed to fetch certificate file data:', fetchError);
                    clearInterval(progressInterval);
                    setPreviewPopupState('failed');
                    setTimeout(() => setPreviewPopupState('none'), 3000);
                    return;
                }
            }

            // Wait for popup to render before processing file
            await new Promise(resolve => setTimeout(resolve, 300));

            // Convert base64 to blob URL for preview
            let previewUrl = actualFileData;
            
            // Check if it's base64 data (without or with data URI prefix)
            if (!actualFileData.startsWith('http')) {
                console.log('🔄 Converting base64 to blob URL');
                
                // Add data URI prefix if missing
                let base64String = actualFileData;
                if (!actualFileData.startsWith('data:')) {
                    base64String = `data:application/pdf;base64,${actualFileData}`;
                }
                
                // Extract base64 data
                const base64Data = base64String.includes('base64,') 
                    ? base64String.split('base64,')[1] 
                    : base64String;
                    
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                previewUrl = URL.createObjectURL(blob);
                console.log('✅ Blob URL created:', previewUrl);
            }

            // Open certificate in new tab AFTER popup is visible
            console.log('🚀 Opening certificate in new tab');
            const newWindow = window.open(previewUrl, '_blank');
            
            // Immediately complete progress and close popup
            clearInterval(progressInterval);
            setPreviewProgress(100);
            
            if (newWindow) {
                console.log('✅ Certificate opened successfully');
                // Close popup immediately when file opens
                setTimeout(() => setPreviewPopupState('none'), 500);
            } else {
                console.error('❌ Failed to open new window (popup blocker?)');
                setPreviewPopupState('failed');
                setTimeout(() => setPreviewPopupState('none'), 3000);
            }
            
            // Clean up blob URL if created
            if (previewUrl !== actualFileData) {
                setTimeout(() => URL.revokeObjectURL(previewUrl), 1000);
            }
        } catch (error) {
            console.error('❌ Preview error:', error);
            if (progressInterval) clearInterval(progressInterval);
            setPreviewPopupState('failed');
            setTimeout(() => setPreviewPopupState('none'), 3000);
        }
    };

    const handleDownloadCertificate = async (certificateUrl, certificateName, certificateId, achievementId) => {
        console.log('🔍 Download certificate:', certificateName, certificateUrl?.substring(0, 50));
        
        let progressInterval;
        
        try {
            // Show download progress popup
            console.log('✅ Showing download progress popup');
            setDownloadPopupState('progress');
            setDownloadProgress(0);

            // Smooth progress animation
            progressInterval = setInterval(() => {
                setDownloadProgress(prev => {
                    if (prev >= 85) {
                        return prev;
                    }
                    return prev + Math.random() * 12;
                });
            }, 150);

            let actualFileData = certificateUrl;
            
            // If URL is invalid or '#', fetch from database
            if (!certificateUrl || certificateUrl === '#' || certificateUrl === 'null') {
                console.log('🔄 Fetching certificate file data from database...');
                
                try {
                    // Fetch the certificate file data using MongoDB service
                    const idToUse = achievementId || certificateId;
                    
                    if (!idToUse) {
                        throw new Error('No certificate ID available');
                    }

                    const certificateDataResponse = await Promise.race([
                        mongoDBService.getCertificateFileByAchievementId(studentId, idToUse),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Certificate fetch timeout')), 30000)
                        )
                    ]);

                    actualFileData = certificateDataResponse?.fileData;
                    
                    if (!actualFileData) {
                        throw new Error('No file data available in response');
                    }
                    
                    console.log('✅ Certificate file data fetched successfully');
                } catch (fetchError) {
                    console.error('❌ Failed to fetch certificate file data:', fetchError);
                    clearInterval(progressInterval);
                    setDownloadPopupState('failed');
                    setTimeout(() => setDownloadPopupState('none'), 3000);
                    return;
                }
            }

            // Let progress animation run for a bit
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Convert base64 to blob URL for download
            let downloadUrl = actualFileData;
            let shouldRevoke = false;
            
            // Check if it's base64 data (without or with data URI prefix)
            if (!actualFileData.startsWith('http')) {
                console.log('🔄 Converting base64 to blob URL for download');
                
                // Add data URI prefix if missing
                let base64String = actualFileData;
                if (!actualFileData.startsWith('data:')) {
                    base64String = `data:application/pdf;base64,${actualFileData}`;
                }
                
                const base64Data = base64String.includes('base64,') 
                    ? base64String.split('base64,')[1] 
                    : base64String;
                    
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                downloadUrl = URL.createObjectURL(blob);
                shouldRevoke = true;
                console.log('✅ Blob URL created for download:', downloadUrl);
            }

            // Complete progress
            clearInterval(progressInterval);
            setDownloadProgress(100);

            // Create download link
            console.log('🚀 Triggering download');
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = certificateName || 'certificate.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ Download completed successfully');
            
            // Show success popup
            setDownloadPopupState('success');
            
            // Clean up blob URL if created
            if (shouldRevoke) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
            }
            
            // Auto-close success popup after showing it
            setTimeout(() => setDownloadPopupState('none'), 2500);
        } catch (error) {
            console.error('❌ Download error:', error);
            if (progressInterval) clearInterval(progressInterval);
            setDownloadPopupState('failed');
            setTimeout(() => setDownloadPopupState('none'), 3000);
        }
    };

    const closeDownloadPopup = () => {
        setDownloadPopupState('none');
    };

    const closePreviewPopup = () => {
        setPreviewPopupState('none');
    };

    const handleBackToProfile = () => {
        navigate(`/admin-profile/${studentId}`);
    };

    // Filter certificates based on search
    const filteredCertificates = certificates.filter(cert => {
        const certName = (cert.name || cert.certificateName || '').toLowerCase();
        const certDate = (cert.date || cert.uploadDate || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return certName.includes(query) || certDate.includes(query);
    });

    const totalCertificates = certificates.length;
    const starRating = Math.min(Math.floor(totalCertificates / 2), 5); // Max 5 stars

    return (
        <>
            <Adnavbar Adminicon={Adminicon} onToggleSidebar={toggleSidebar} />
            <div className={styles['certificate-layout']}>
                <Adsidebar isOpen={isSidebarOpen} onLogout={handleLogout} />
                <div className={styles['certificate-main-content']}>
                    
                    {/* Top Info Cards - Always visible */}
                    <div className={styles['certificate-stats-container']}>
                                <div className={`${styles['certificate-card']} ${styles['certificate-card-student']}`}>
                                    <div className={styles['certificate-card-content']}>
                                        <h2 className={styles['certificate-card-title']}>Student Info</h2>
                                        {/* Profile Picture */}
                                        <div className={styles['certificate-profile-pic-container']}>
                                            {studentData?.profilePicURL ? (
                                                <img 
                                                    src={studentData.profilePicURL} 
                                                    alt="Profile" 
                                                    className={styles['certificate-profile-pic']}
                                                />
                                            ) : (
                                                <div className={styles['certificate-default-profile']}>
                                                    <DefaultProfileIcon />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles['certificate-student-info']}>
                                            <p className={styles['certificate-student-name']}>
                                                {studentData?.name || studentData?.firstName && studentData?.lastName 
                                                    ? `${studentData.firstName} ${studentData.lastName}`.trim() 
                                                    : 'N/A'}
                                            </p>
                                            <p className={styles['certificate-student-regno']}>
                                                {studentData?.regNo || studentData?.regno || studentData?.reg || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`${styles['certificate-card']} ${styles['certificate-card-blue']}`}>
                                    <div className={styles['certificate-card-content']}>
                                        <h2 className={styles['certificate-card-title']}>Total<br/>Certificates</h2>
                                        <div className={styles['certificate-card-number']}>{totalCertificates}</div>
                                    </div>
                                </div>

                                <div className={`${styles['certificate-card']} ${styles['certificate-card-rating']}`}>
                                    <h2 className={styles['certificate-card-title']}>Student Details</h2>
                                    <div className={styles['certificate-student-details']}>
                                        <p className={styles['certificate-detail-item']}>
                                            <span className={styles['certificate-detail-label']}>Year:</span> {studentData?.currentYear || studentData?.year || 'N/A'} - {studentData?.section || 'N/A'}
                                        </p>
                                        <p className={styles['certificate-detail-item']}>
                                            <span className={styles['certificate-detail-label']}>Semester:</span> {studentData?.currentSemester || studentData?.semester || 'N/A'}
                                        </p>
                                        <p className={styles['certificate-detail-item']}>
                                            <span className={styles['certificate-detail-label']}>Batch:</span> {studentData?.batch || studentData?.yearOfJoining || 'N/A'}
                                        </p> 
                                        <p className={styles['certificate-detail-item']}>
                                            <span className={styles['certificate-detail-label']}>Degree:</span> {studentData?.degree || 'N/A'}
                                        </p>
                                        <p className={styles['certificate-detail-item']}>
                                            <span className={styles['certificate-detail-label']}>Department:</span> {studentData?.department || studentData?.branch || 'N/A'}
                                        </p>
                                       
                                        
                                    </div>
                                </div>
                            </div>

                    {/* Dark Blue Certificates Section */}
                    <div className={styles['certificate-section']}>
                        <div className={styles['certificate-header']}>
                            <h2 className={styles['certificate-section-title']}>Certificates</h2>
                            <div className={styles['certificate-actions-group']}>
                                <div className={styles['certificate-search-container']}>
                                    <input
                                        type="text"
                                        placeholder="Search certificates..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={styles['certificate-search-input']}
                                    />
                                    <svg className={styles['certificate-search-icon']} width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <button className={styles['certificate-back-btn']} onClick={handleBackToProfile}>
                                    Back to Profile
                                </button>
                            </div>
                        </div>

                        <div className={styles['certificate-list']} onScroll={handleScroll}>
                            {isLoadingCertificates ? (
                                <div className={styles['certificate-empty']}>
                                    <div className={styles['certificate-loading-container']}>
                                        <div className={styles['certificate-loading-bar-background']}>
                                            <div className={styles['certificate-loading-bar-fill']}></div>
                                        </div>
                                        <p className={styles['certificate-loading-text']}>Loading certificates...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {filteredCertificates.length === 0 && !searchQuery && (
                                        <div className={styles['certificate-empty']}>
                                            <CertificateIcon />
                                            <p>No approved certificates yet.</p>
                                        </div>
                                    )}

                                    {filteredCertificates.length === 0 && searchQuery && (
                                        <div className={styles['certificate-empty']}>
                                            <p>No certificates match your search.</p>
                                        </div>
                                    )}

                                    {filteredCertificates.map((cert, index) => (
                                        <div key={cert.certificateId || index} className={styles['certificate-item']}>
                                            <div className={styles['certificate-item-number']}>{index + 1}</div>
                                            <div className={styles['certificate-item-content']}>
                                                <h3 className={styles['certificate-item-name']}>
                                                    {cert.name || `Certificate ${index + 1}`}
                                                </h3>
                                                <p className={styles['certificate-item-date']}>
                                                    {cert.date}
                                                </p>
                                            </div>
                                            <div className={styles['certificate-item-actions']}>
                                                <button 
                                                    className={`${styles['certificate-action-btn']} ${styles['certificate-view-btn']}`}
                                                    onClick={() => handleViewCertificate(
                                                        cert.url || cert.certificateUrl, 
                                                        cert.certificateId, 
                                                        cert.achievementId
                                                    )}
                                                >
                                                    <ViewIcon />
                                                    View
                                                </button>
                                                <button 
                                                    className={`${styles['certificate-action-btn']} ${styles['certificate-download-btn']}`}
                                                    onClick={() => handleDownloadCertificate(
                                                        cert.url || cert.certificateUrl, 
                                                        cert.name || cert.certificateName,
                                                        cert.certificateId,
                                                        cert.achievementId
                                                    )}
                                                >
                                                    <DownloadIcon />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {showScrollIndicator && filteredCertificates.length > 0 && !isLoadingCertificates && (
                            <div className={styles['certificate-scroll-indicator']}>
                                <div 
                                    className={styles['certificate-scroll-indicator-thumb']}
                                    style={{ top: `${scrollPercent}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Download/Preview Popups - Admin Green Theme */}
            <AdminCertificateDownloadProgressAlert 
                isOpen={downloadPopupState === 'progress'} 
                progress={downloadProgress}
                fileLabel="certificate"
            />
            
            <AdminCertificateDownloadSuccessAlert 
                isOpen={downloadPopupState === 'success'} 
                onClose={closeDownloadPopup}
                fileLabel="certificate"
            />
            
            <AdminDownloadFailedAlert 
                isOpen={downloadPopupState === 'failed'} 
                onClose={closeDownloadPopup}
            />
            
            <AdminPreviewProgressAlert 
                isOpen={previewPopupState === 'progress'} 
                progress={previewProgress} 
                fileLabel="certificate"
            />
            
            <AdminPreviewFailedAlert 
                isOpen={previewPopupState === 'failed'} 
                onClose={closePreviewPopup}
            />
        </>
    );
}

export default AdStuDBCertificateView;
