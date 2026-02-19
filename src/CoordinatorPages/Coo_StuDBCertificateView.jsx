import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Conavbar from '../components/Navbar/Conavbar.js';
import Cosidebar from '../components/Sidebar/Cosidebar.js';
import styles from '../AdminPages/AdStuDBCertificateView.module.css'; // Reuse admin CSS
import Coordinatoricon from "../assets/Coordinatorcap.png";
import mongoDBService from '../services/mongoDBService.jsx';
import {
  DownloadFailedAlert,
  PreviewFailedAlert,
  PreviewProgressAlert,
  CertificateDownloadProgressAlert,
  CertificateDownloadSuccessAlert
} from '../components/alerts';

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

const DefaultProfileIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

function CooStuDBCertificateView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { studentId } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(location.state?.studentData || null);
    const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);
    const [certificates, setCertificates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [scrollPercent, setScrollPercent] = useState(0);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    
    const [downloadPopupState, setDownloadPopupState] = useState('none');
    const [previewPopupState, setPreviewPopupState] = useState('none');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [previewProgress, setPreviewProgress] = useState(0);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleViewChange = (view) => {
        setIsSidebarOpen(false);
        navigate(`/coo-${view}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('coordinatorId');
        localStorage.removeItem('userRole');
        navigate('/coo-login');
    };

    useEffect(() => {
        const loadStudentData = async () => {
            if (!studentId) {
                navigate('/coo-manage-students');
                return;
            }

            setIsLoadingCertificates(true);
            
            if (location.state?.studentData && !studentData) {
                setStudentData(location.state.studentData);
            }
            
            try {
                const fastDataService = (await import('../services/fastDataService.jsx')).default;
                
                const completeData = await Promise.race([
                    fastDataService.getCompleteStudentData(studentId, false),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timeout - using fallback data')), 25000)
                    )
                ]);
                
                const student = completeData?.student;
                
                if (student) {
                    setStudentData(student);
                }

                const certificatesData = completeData?.certificates || [];
                
                const formattedCertificates = certificatesData
                    .filter(cert => {
                        const status = (cert.status || '').toLowerCase();
                        return status === 'approved';
                    })
                    .map(cert => {
                        const certName = cert.comp || cert.competition || cert.certificateName || cert.achievementTitle || 'Untitled Certificate';
                        
                        let formattedDate = 'N/A';
                        const dateToUse = cert.date || cert.uploadDate;
                        if (dateToUse) {
                            try {
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
            } catch (error) {
                console.error('Failed to load student data:', error);
                
                if (!studentData && location.state?.studentData) {
                    setStudentData(location.state.studentData);
                }
                
                try {
                    const certificatesResponse = await Promise.race([
                        mongoDBService.getCertificatesByStudentId(studentId),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Fallback timeout')), 10000)
                        )
                    ]).catch(() => []);
                    
                    const studentCertificates = Array.isArray(certificatesResponse) 
                        ? certificatesResponse 
                        : (certificatesResponse?.certificates || []);
                    
                    const formattedCertificates = studentCertificates
                        .filter(cert => {
                            const status = (cert.status || '').toLowerCase();
                            return status === 'approved';
                        })
                        .map(cert => {
                            const certName = cert.comp || cert.competition || cert.certificateName || cert.achievementTitle || 'Untitled Certificate';
                            
                            let formattedDate = 'N/A';
                            const dateToUse = cert.date || cert.uploadDate;
                            if (dateToUse) {
                                try {
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
                } catch (fallbackError) {
                    console.error('Fallback failed:', fallbackError);
                    setCertificates([]);
                }
            } finally {
                setIsLoadingCertificates(false);
            }
        };

        loadStudentData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, navigate]);

    const handleScroll = (e) => {
        const element = e.target;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setScrollPercent(percent);
        setShowScrollIndicator(scrollHeight > 0);
    };

    const handleViewCertificate = async (certificateUrl) => {
        if (!certificateUrl || certificateUrl === '#') {
            setPreviewPopupState('failed');
            setTimeout(() => setPreviewPopupState('none'), 3000);
            return;
        }

        try {
            setPreviewPopupState('progress');
            setPreviewProgress(0);

            const progressInterval = setInterval(() => {
                setPreviewProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 15;
                });
            }, 150);

            await new Promise(resolve => setTimeout(resolve, 300));

            let previewUrl = certificateUrl;
            
            if (!certificateUrl.startsWith('http')) {
                let base64String = certificateUrl;
                if (!certificateUrl.startsWith('data:')) {
                    base64String = `data:application/pdf;base64,${certificateUrl}`;
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
                previewUrl = URL.createObjectURL(blob);
            }

            const newWindow = window.open(previewUrl, '_blank');
            
            clearInterval(progressInterval);
            setPreviewProgress(100);
            
            if (newWindow) {
                setTimeout(() => setPreviewPopupState('none'), 500);
            } else {
                setPreviewPopupState('failed');
                setTimeout(() => setPreviewPopupState('none'), 3000);
            }
            
            if (previewUrl !== certificateUrl) {
                setTimeout(() => URL.revokeObjectURL(previewUrl), 1000);
            }
        } catch (error) {
            console.error('Preview error:', error);
            setPreviewPopupState('failed');
            setTimeout(() => setPreviewPopupState('none'), 3000);
        }
    };

    const handleDownloadCertificate = async (certificateUrl, certificateName) => {
        if (!certificateUrl || certificateUrl === '#') {
            setDownloadPopupState('failed');
            setTimeout(() => setDownloadPopupState('none'), 2000);
            return;
        }

        try {
            setDownloadPopupState('progress');
            setDownloadProgress(0);

            const progressInterval = setInterval(() => {
                setDownloadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 20;
                });
            }, 100);

            let downloadUrl = certificateUrl;
            let shouldRevoke = false;
            
            if (!certificateUrl.startsWith('http')) {
                let base64String = certificateUrl;
                if (!certificateUrl.startsWith('data:')) {
                    base64String = `data:application/pdf;base64,${certificateUrl}`;
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
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = certificateName || 'certificate.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                clearInterval(progressInterval);
                setDownloadProgress(100);
                
                setDownloadPopupState('success');
                
                if (shouldRevoke) {
                    setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
                }
                
                setTimeout(() => setDownloadPopupState('none'), 2500);
            }, 800);
        } catch (error) {
            console.error('Download error:', error);
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
        navigate(`/coo-manage-students/edit/${studentId}`, { state: { mode: 'view' } });
    };

    const filteredCertificates = certificates.filter(cert => {
        const certName = (cert.name || cert.certificateName || '').toLowerCase();
        const certDate = (cert.date || cert.uploadDate || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return certName.includes(query) || certDate.includes(query);
    });

    const totalCertificates = certificates.length;

    return (
        <>
            <Conavbar Coordinatoricon={Coordinatoricon} onToggleSidebar={toggleSidebar} />
            <div className={styles['certificate-layout']}>
                <Cosidebar isOpen={isSidebarOpen} onLogout={handleLogout} currentView={'manage-students'} onViewChange={handleViewChange} />
                <div className={styles['certificate-main-content']}>
                    
                    <div className={styles['certificate-stats-container']}>
                        <div className={`${styles['certificate-card']} ${styles['certificate-card-student']}`}>
                            <div className={styles['certificate-card-content']}>
                                <h2 className={styles['certificate-card-title']}>Student Info</h2>
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
                                        {studentData?.name || (studentData?.firstName && studentData?.lastName
                                            ? `${studentData.firstName} ${studentData.lastName}`.trim() 
                                            : 'N/A')}
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
                                                    onClick={() => handleViewCertificate(cert.url || cert.certificateUrl)}
                                                >
                                                    <ViewIcon />
                                                    View
                                                </button>
                                                <button 
                                                    className={`${styles['certificate-action-btn']} ${styles['certificate-download-btn']}`}
                                                    onClick={() => handleDownloadCertificate(cert.url || cert.certificateUrl, cert.name || cert.certificateName)}
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

            <CertificateDownloadProgressAlert 
                isOpen={downloadPopupState === 'progress'} 
                progress={downloadProgress}
                color="#d23b42"
                progressColor="#d23b42"
            />
            
            <CertificateDownloadSuccessAlert 
                isOpen={downloadPopupState === 'success'} 
                onClose={closeDownloadPopup}
                color="#d23b42"
            />
            
            <DownloadFailedAlert 
                isOpen={downloadPopupState === 'failed'} 
                onClose={closeDownloadPopup}
                color="#d23b42"
            />
            
            <PreviewProgressAlert 
                isOpen={previewPopupState === 'progress'} 
                progress={previewProgress} 
                fileLabel="certificate"
                color="#d23b42"
                progressColor="#d23b42"
            />
            
            <PreviewFailedAlert 
                isOpen={previewPopupState === 'failed'} 
                onClose={closePreviewPopup}
                color="#d23b42"
            />
        </>
    );
}

export default CooStuDBCertificateView;
