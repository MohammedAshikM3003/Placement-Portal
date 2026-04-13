import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from '../utils/apiConfig';
import useAdminAuth from '../utils/useAdminAuth';

import Navbar from '../components/Navbar/Adnavbar';
import Sidebar from '../components/Sidebar/Adsidebar';
import styles from './AdminStuProfileView.module.css'; // Module Import
import achievementStyles from '../StudentPages/Achievements.module.css'; // Achievement popup styles
import '../components/alerts/AlertStyles.css';
import Adminicons from '../assets/AdmingreenCapicon.svg';
import BestAchievement from '../assets/BestAchievementicon.svg';
import StuEyeIcon from '../assets/StuProfileviewgreenicon.svg';
import StuUploadMarksheetIcon from '../assets/StuUploadMarksheeticon.svg';
import mongoDBService from '../services/mongoDBService.jsx';
import fastDataService from '../services/fastDataService.jsx';
import gridfsService from '../services/gridfsService';
import {
    CertificateDownloadProgressAlert,
    DownloadSuccessAlert,
    DownloadFailedAlert
} from '../components/alerts/DownloadPreviewAlerts';

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

const ARREAR_STATUS_OPTIONS = ["NHA", "NSA", "SA"];

const PREFERRED_TRAINING_OPTIONS = [
    "Java",
    "Python",
    "Fullstack Development",
    "Gen AI",
    "Cloud Computing"
];

// URL validation patterns for profile links
const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/?$/;
const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]{3,100}\/?$/;

const parseMultiValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

const normalizeDate = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return trimmed.slice(0, 10);
        }

        const ddmmyyyy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})/);
        if (ddmmyyyy) {
            const [, dd, mm, yyyy] = ddmmyyyy;
            return `${yyyy}-${mm}-${dd}`;
        }
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value.toString().split('T')[0];
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper components
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const RequiredStar = () => <span className={styles.requiredStar}>*</span>;

const GraduationCapIcon = () => (
    <img src={Adminicons} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'-20px'}}/>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles.popupOverlay} onClick={onClose}>
            {/* Reuse Achievements-style animated success card */}
            <div className={achievementStyles['Achievement-popup-container']} onClick={e => e.stopPropagation()}>
                <div className={achievementStyles['Achievement-popup-header']}>Saved!</div>
                <div className={achievementStyles['Achievement-popup-body']}>
                    <svg className={achievementStyles['Achievement-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={achievementStyles['Achievement-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={achievementStyles['Achievement-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
                        Changes Saved âœ“
                    </h2>
                    <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
                        Your Details have been
                    </p>
                    <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
                        Successfully saved in the Portal
                    </p>
                </div>
                <div className={achievementStyles['Achievement-popup-footer']}>
                    <button onClick={onClose} className={achievementStyles['Achievement-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;

    const formattedFileSize = (() => {
        const numeric = Number(fileSizeKB);
        if (Number.isFinite(numeric)) {
            return numeric.toFixed(1);
        }
        return fileSizeKB;
    })();

    return (
        <div className={styles.popupOverlay} onClick={onClose}>
            <div className={styles.imageSizePopup} onClick={e => e.stopPropagation()}>
                <div className={styles.imageSizePopupHeader}>Image Too Large!</div>
                <div className={styles.imageSizePopupBody}>
                    <div className={styles.imageSizePopupIconWrapper}>
                        <svg
                            className={styles.imageSizePopupIcon}
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                        >
                            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                                <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
                            </g>
                        </svg>
                    </div>
                    <h2>Image Size Exceeded âœ—</h2>
                    <p className={styles.imageSizePopupLine}>
                        Maximum allowed: <strong>500KB</strong>
                    </p>
                    <p className={styles.imageSizePopupLine}>
                        Your image size: <strong>{formattedFileSize}KB</strong>
                    </p>
                    <p className={styles.imageSizePopupHint}>
                        Please compress your image or choose a smaller file.
                    </p>
                </div>
                <div className={styles.imageSizePopupFooter}>
                    <button onClick={onClose} className={styles.imageSizePopupButton}>OK</button>
                </div>
            </div>
        </div>
    );
};

const toPdfBlobUrl = (fileData, mimeType = 'application/pdf') => {
    const rawData = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    const byteCharacters = atob(rawData);
    const byteNumbers = new Array(byteCharacters.length);

    for (let index = 0; index < byteCharacters.length; index += 1) {
        byteNumbers[index] = byteCharacters.charCodeAt(index);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return window.URL.createObjectURL(blob);
};

const resolveResumeFileUrl = (value) => {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:')) return value;
    if (value.startsWith('/api/file/')) return gridfsService.getFileUrl(value);
    if (value.startsWith('/file/')) return `${API_BASE_URL}${value}`;
    if (value.startsWith('/api/')) return `${API_BASE_URL.replace('/api', '')}${value}`;
    if (value.startsWith('/')) return `${API_BASE_URL.replace('/api', '')}${value}`;
    return value;
};

const fetchFileAsBlobUrl = async (fileUrl) => {
    const resolvedUrl = resolveResumeFileUrl(fileUrl);

    if (!resolvedUrl) {
        throw new Error('Resume URL is missing');
    }

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const response = await fetch(resolvedUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`File fetch failed with status ${response.status}`);
    }

    const blob = await response.blob();

    if (!blob.size || blob.type.includes('html')) {
        throw new Error('Invalid file response received');
    }

    return window.URL.createObjectURL(blob);
};

const getResumeDocument = async (studentId) => {
    try {
        const response = await mongoDBService.getResume(studentId);
        return response?.resume || response || null;
    } catch (error) {
        console.warn('Resume lookup failed:', error);
        return null;
    }
};

const fetchResumeBlobUrl = async (studentId) => {
    const resumeDoc = await getResumeDocument(studentId);

    if (resumeDoc) {
        const fileName = resumeDoc.fileName
            || resumeDoc.name
            || resumeDoc.resumeData?.name
            || resumeDoc.resumeData?.fileName
            || 'resume.pdf';

        const candidateUrl = resumeDoc.gridfsFileUrl
            || (resumeDoc.gridfsFileId ? `/api/file/${resumeDoc.gridfsFileId}` : '')
            || resumeDoc.url
            || resumeDoc.resumeURL
            || resumeDoc.resumeUrl
            || resumeDoc.fileURL
            || resumeDoc.resumeData?.url
            || resumeDoc.resumeData?.resumeURL
            || resumeDoc.resumeData?.resumeUrl
            || resumeDoc.resumeData?.fileUrl
            || resumeDoc.resumeData?.pdfUrl
            || '';

        if (candidateUrl && !candidateUrl.startsWith('data:') && !candidateUrl.startsWith('blob:') && candidateUrl !== '#') {
            return {
                blobUrl: await fetchFileAsBlobUrl(candidateUrl),
                fileName
            };
        }

        const base64Data = resumeDoc.fileData
            || resumeDoc.fileContent
            || resumeDoc.resumeData?.fileData
            || resumeDoc.resumeData?.fileContent
            || resumeDoc.resumeData?.base64
            || resumeDoc.resumeData?.content
            || '';

        if (base64Data) {
            return {
                blobUrl: toPdfBlobUrl(base64Data, resumeDoc.fileType || 'application/pdf'),
                fileName
            };
        }

        if (candidateUrl.startsWith('data:')) {
            return {
                blobUrl: toPdfBlobUrl(candidateUrl, resumeDoc.fileType || 'application/pdf'),
                fileName
            };
        }
    }

    const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE}/api/resume-builder/pdf/${studentId}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
    });

    if (!response.ok) {
        throw new Error('Resume not found');
    }

    const result = await response.json();
    if (!result?.success || !result?.resume?.url) {
        throw new Error('Resume not found');
    }

    return {
        blobUrl: await fetchFileAsBlobUrl(result.resume.url),
        fileName: result.resume.fileName || 'resume.pdf'
    };
};

const ResumeChooserModal = ({ isOpen, onClose, onView, onDownload, isProcessing, activeAction }) => {
    if (!isOpen) return null;

    return (
        <div className="alert-overlay" onClick={onClose}>
            <div className="achievement-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="achievement-popup-header" style={{ backgroundColor: '#4EA24E' }}>
                    Resume
                </div>
                <div className="achievement-popup-body">
                    <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                    <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
                        Student Resume
                    </h2>
                    <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
                        Choose an action to open or download the resume.
                    </p>
                </div>
                <div className="achievement-popup-footer">
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => {
                                if (isProcessing) return;
                                if (typeof onView === 'function') onView();
                            }}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: '#197AFF',
                                color: '#fff',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing && activeAction !== 'preview' ? 0.75 : 1,
                                boxShadow: '0 2px 8px rgba(25, 122, 255, 0.2)',
                                minWidth: '108px'
                            }}
                        >
                            {isProcessing && activeAction === 'preview' ? 'Preview..' : 'Preview'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (isProcessing) return;
                                if (typeof onDownload === 'function') onDownload();
                            }}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: '#4EA24E',
                                color: '#fff',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing && activeAction !== 'download' ? 0.75 : 1,
                                boxShadow: '0 2px 8px rgba(78, 162, 78, 0.2)',
                                minWidth: '108px'
                            }}
                        >
                            {isProcessing && activeAction === 'download' ? 'Download..' : 'Download'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResumeFailedAlert = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="alert-overlay">
            <div className="achievement-popup-container">
                <div className="achievement-popup-header" style={{ backgroundColor: '#D73D3D' }}>
                    Resume Failed !
                </div>
                <div className="achievement-popup-body">
                    <div className="download-error-icon-container">
                        <svg className="download-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className="download-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349" />
                            <path className="download-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
                        Resume Failed !
                    </h2>
                    <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
                        Unable to open or download the resume.
                        <br />
                        Please try again.
                    </p>
                </div>
                <div className="achievement-popup-footer">
                    <button type="button" onClick={onClose} className="achievement-popup-close-btn">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    const [downloadPopupState, setDownloadPopupState] = useState('none');
    const shouldShowPreviewPopup = downloadPopupState === 'none' || downloadPopupState === 'progress';

    if (!isOpen) return null;

    const handleSuccessClose = () => {
        setDownloadPopupState('none');
        onClose();
    };

    const handleDownload = async () => {
        if (downloadPopupState !== 'none') return;

        setDownloadPopupState('progress');

        try {
            if (!src) {
                throw new Error('Profile image not available');
            }

            let resolvedUrl = src;
            const backendBaseUrl = API_BASE_URL.replace('/api', '');

            if (/^[a-f0-9]{24}$/i.test(resolvedUrl)) {
                resolvedUrl = `${backendBaseUrl}/file/${resolvedUrl}`;
            } else if (resolvedUrl.startsWith('/api/file/')) {
                resolvedUrl = `${backendBaseUrl}${resolvedUrl.replace('/api', '')}`;
            } else if (resolvedUrl.startsWith('/file/')) {
                resolvedUrl = `${backendBaseUrl}${resolvedUrl}`;
            } else if (resolvedUrl.startsWith('/')) {
                resolvedUrl = `${backendBaseUrl}${resolvedUrl}`;
            }

            let hrefForDownload = resolvedUrl;
            let revokeObjectUrl = null;

            if (!resolvedUrl.startsWith('data:') && !resolvedUrl.startsWith('blob:')) {
                const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
                const response = await fetch(resolvedUrl, {
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
                });

                if (!response.ok) {
                    throw new Error(`Download failed with status ${response.status}`);
                }

                const blob = await response.blob();
                revokeObjectUrl = window.URL.createObjectURL(blob);
                hrefForDownload = revokeObjectUrl;
            }

            const link = document.createElement('a');
            link.href = hrefForDownload;
            link.download = 'profile-image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (revokeObjectUrl) {
                setTimeout(() => window.URL.revokeObjectURL(revokeObjectUrl), 1000);
            }

            setDownloadPopupState('success');
        } catch (error) {
            console.error('Image download failed:', error);
            setDownloadPopupState('error');
        }
    };

    return (
        <>
        {shouldShowPreviewPopup && (
            <div className={styles.imagePreviewOverlay} onClick={downloadPopupState === 'progress' ? undefined : onClose}>
                <div className={styles.imagePreviewContainer} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.imagePreviewHeader}>Preview Image</div>
                    <div className={styles.imagePreviewBody}>
                        <img src={src} alt="Profile Preview" />
                    </div>
                    <div className={styles.imagePreviewFooter}>
                        <button
                            onClick={onClose}
                            disabled={downloadPopupState === 'progress'}
                            className={`${styles.imagePreviewFooterBtn} ${styles.imagePreviewCloseBtn}`}
                        >
                            Close
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloadPopupState === 'progress'}
                            className={`${styles.imagePreviewFooterBtn} ${styles.imagePreviewDownloadBtn}`}
                        >
                            {downloadPopupState === 'progress' ? 'Downloading...' : 'Download'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        <DownloadSuccessAlert
            isOpen={downloadPopupState === 'success'}
            onClose={handleSuccessClose}
            fileLabel="image"
            title="Downloaded !"
            description="The image has been successfully downloaded to your device."
            color="#4EA24E"
        />
        <DownloadFailedAlert
            isOpen={downloadPopupState === 'error'}
            onClose={() => setDownloadPopupState('none')}
            color="#4EA24E"
        />
        </>
    );
};

const URLValidationErrorPopup = ({ isOpen, onClose, urlType, invalidUrl }) => {
    if (!isOpen) return null;

    const examples = {
        GitHub: 'https://github.com/username',
        LinkedIn: 'https://linkedin.com/in/username'
    };

    const renderIcon = () => {
        if (urlType === 'GitHub') {
            return (
                <div className={styles.imageSizePopupIconWrapper}>
                    <svg
                        className={styles.imageSizePopupIcon}
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="#fff"
                            d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"
                        />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className={styles.imageSizePopupIconWrapper}>
                    <svg
                        className={styles.imageSizePopupIcon}
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="#fff"
                            d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"
                        />
                    </svg>
                </div>
            );
        }
    };

    return (
        <div className={styles.popupOverlay} onClick={onClose}>
            <div className={styles.imageSizePopup} onClick={e => e.stopPropagation()}>
                <div className={styles.imageSizePopupHeader}>Invalid {urlType} URL!</div>
                <div className={styles.imageSizePopupBody}>
                    {renderIcon()}
                    <h2>Invalid {urlType} Link âœ—</h2>
                    {invalidUrl && (
                        <p className={styles.imageSizePopupLine} style={{ wordBreak: 'break-all' }}>
                            You entered: <strong>{invalidUrl}</strong>
                        </p>
                    )}
                    <p className={styles.imageSizePopupLine}>
                        Correct format: <strong>{examples[urlType]}</strong>
                    </p>
                    <p className={styles.imageSizePopupHint}>
                        Please enter a valid {urlType} profile URL or leave it empty.
                    </p>
                </div>
                <div className={styles.imageSizePopupFooter}>
                    <button onClick={onClose} className={styles.imageSizePopupButton}>OK</button>
                </div>
            </div>
        </div>
    );
};

const EDITABLE_FIELD_LABELS = {
    address: 'Address', city: 'City', primaryEmail: 'Primary Email',
    mobileNo: 'Mobile Number', fatherOccupation: "Father's Occupation",
    fatherMobile: "Father's Mobile", motherOccupation: "Mother's Occupation",
    motherMobile: "Mother's Mobile", guardianName: 'Guardian Name',
    guardianMobile: 'Guardian Mobile', bloodGroup: 'Blood Group',
    section: 'Section', currentYear: 'Current Year', currentSemester: 'Current Semester',
    semester1GPA: 'Sem 1 GPA', semester2GPA: 'Sem 2 GPA',
    semester3GPA: 'Sem 3 GPA', semester4GPA: 'Sem 4 GPA',
    semester5GPA: 'Sem 5 GPA', semester6GPA: 'Sem 6 GPA',
    semester7GPA: 'Sem 7 GPA', semester8GPA: 'Sem 8 GPA',
    overallCGPA: 'Overall CGPA', clearedBacklogs: 'Cleared Backlogs',
    currentBacklogs: 'Current Backlogs', yearOfGap: 'Year of Gap',
    gapReason: 'Gap Reason', residentialStatus: 'Residential Status',
    quota: 'Quota', languagesKnown: 'Languages Known',
    firstGraduate: 'First Graduate', passportNo: 'Passport No',
    skillSet: 'Skill Set', valueAddedCourses: 'Value Added Courses',
    aboutSibling: 'About Sibling', rationCardNo: 'Ration Card No',
    familyAnnualIncome: 'Family Annual Income', willingToSignBond: 'Willing to Sign Bond',
    preferredModeOfDrive: 'Preferred Mode of Drive',
    githubLink: 'GitHub Link', linkedinLink: 'LinkedIn Link',
    portfolioLink: 'Portfolio Link', companyTypes: 'Company Types',
    preferredJobLocation: 'Preferred Job Location',
    preferredTraining: 'Preferred Training',
    skills: 'Skills', profilePicURL: 'Profile Photo',
};

function UnsavedChangesModal({ changedFields, onDiscard, onSave }) {
    const fieldText = changedFields.length > 2
        ? `${changedFields.slice(0, 2).join(', ')},....... have successfully changed`
        : `${changedFields.join(', ')} have successfully changed`;
    return (
        <div className={styles.popupOverlay}>
            <div className={achievementStyles['Achievement-popup-container']} onClick={e => e.stopPropagation()}>
                <div className={achievementStyles['Achievement-popup-header']}>Details Changed!</div>
                <div className={achievementStyles['Achievement-popup-body']}>
                    <div className={styles.unsavedIconWrap}>
                        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="7" x2="12" y2="14"/>
                            <circle cx="12" cy="18" r="0.5" fill="#333" stroke="#333"/>
                        </svg>
                    </div>
                    <h2 className={styles.unsavedTitle}>Save Changes!</h2>
                    <p className={styles.unsavedFieldText}>{fieldText}</p>
                </div>
                <div className={achievementStyles['Achievement-popup-footer']}>
                    <button className={achievementStyles['Achievement-popup-cancel-btn']} onClick={onDiscard}>Discard</button>
                    <button className={styles.unsavedSaveBtn} onClick={onSave}>Save</button>
                </div>
            </div>
        </div>
    );
}

function AdminStuProfileView({ onLogout, onViewChange }) {
    useAdminAuth(); // Admin authentication check
    const { studentId } = useParams(); // Get studentId from route
    const navigate = useNavigate();
    const location = useLocation();
    // Always in view-only mode for this file
    const isEditMode = false;

    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [profilePhotoFile, setProfilePhotoFile] = useState(null); // Raw File for GridFS upload on Save
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false); // Loading handled by popup, no need for page loading
    const [loadingProgress, setLoadingProgress] = useState(15);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [isURLErrorPopupOpen, setURLErrorPopupOpen] = useState(false);
    const [urlErrorType, setUrlErrorType] = useState('');
    const [invalidUrl, setInvalidUrl] = useState('');
    const [skills, setSkills] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [hoveredRound, setHoveredRound] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
    const [eligibleDrives, setEligibleDrives] = useState([]);
    const [studentApplications, setStudentApplications] = useState([]);
    const [studentAttendanceRecords, setStudentAttendanceRecords] = useState([]);
    const [studentTrainingAssignment, setStudentTrainingAssignment] = useState(null);
    const [studentTrainingAttendanceRecords, setStudentTrainingAttendanceRecords] = useState([]);
    const savedDataRef = useRef(null);
    const afterSaveNavRef = useRef(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavView, setPendingNavView] = useState(null);
    const [isResumeChooserOpen, setIsResumeChooserOpen] = useState(false);
    const [isResumeFailureOpen, setIsResumeFailureOpen] = useState(false);
    const [isResumeDownloading, setIsResumeDownloading] = useState(false);
    const [resumeActionType, setResumeActionType] = useState('');
    const [isResumeDownloadSuccessOpen, setIsResumeDownloadSuccessOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isInitialLoading) return undefined;

        setLoadingProgress(15);
        const timer = window.setInterval(() => {
            setLoadingProgress((prev) => {
                if (prev >= 95) return 95;
                if (prev < 50) return prev + 8;
                if (prev < 80) return prev + 4;
                return prev + 2;
            });
        }, 220);

        return () => window.clearInterval(timer);
    }, [isInitialLoading]);

    const selectedCompanyTypes = useMemo(
        () => parseMultiValue(studentData?.companyTypes),
        [studentData?.companyTypes]
    );

    const selectedJobLocations = useMemo(
        () => parseMultiValue(studentData?.preferredJobLocation),
        [studentData?.preferredJobLocation]
    );

    const companyTypesHiddenValue = useMemo(
        () => selectedCompanyTypes.join(', '),
        [selectedCompanyTypes]
    );

    const selectedTrainings = useMemo(
        () => parseMultiValue(studentData?.preferredTraining),
        [studentData?.preferredTraining]
    );

    const handleTrainingToggle = (option) => {
        if (isSaving) return;
        const current = parseMultiValue(studentData?.preferredTraining);
        // Toggle off if already selected, otherwise select only this one
        const updated = current.includes(option) ? [] : [option];
        setStudentData(prev => ({ ...prev, preferredTraining: updated.join(', ') }));
    };

    const jobLocationsHiddenValue = useMemo(
        () => selectedJobLocations.join(', '),
        [selectedJobLocations]
    );

    const findApplicationForDrive = useCallback((drive) => {
        const driveId = (drive?.driveId || drive?._id || '').toString();
        const driveRole = normalizeText(drive?.jobs || drive?.jobRole);

        return studentApplications.find((app) => {
            const appDriveId = (app?.driveId || '').toString();
            if (driveId && appDriveId && appDriveId === driveId) {
                return true;
            }

            return normalizeText(app?.companyName) === normalizeText(drive?.companyName) &&
                normalizeText(app?.jobRole) === driveRole;
        });
    }, [studentApplications]);

    const fetchStudentAttendanceRecords = useCallback(async (student) => {
        const regNo = student?.regNo || student?.registerNumber || student?.registerNo || '';

        if (regNo) {
            const attendanceByRegNo = await mongoDBService.getStudentAttendanceByRegNo(regNo);
            if (attendanceByRegNo?.success) {
                return attendanceByRegNo;
            }
        }

        if (student?._id) {
            const attendanceByStudentId = await mongoDBService.getStudentAttendance(student._id);
            if (attendanceByStudentId?.success) {
                return attendanceByStudentId;
            }
        }

        return { success: true, data: [] };
    }, []);

    const isAttendanceAbsentForDrive = useCallback((drive) => {
        const driveCompany = normalizeText(drive?.companyName);
        const driveRole = normalizeText(drive?.jobs || drive?.jobRole);
        const driveStart = normalizeDate(drive?.driveStartDate || drive?.companyDriveDate);
        const driveEnd = normalizeDate(drive?.driveEndDate || drive?.driveStartDate || drive?.companyDriveDate);

        const matched = studentAttendanceRecords.some((record) => {
            if (normalizeText(record?.status) !== 'absent') return false;
            if (normalizeText(record?.companyName) !== driveCompany) return false;

            const recordRole = normalizeText(record?.jobRole);
            if (recordRole && driveRole && recordRole !== driveRole) return false;

            const recStart = normalizeDate(record?.startDate);
            const recEnd = normalizeDate(record?.endDate);
            const hasDriveDates = Boolean(driveStart || driveEnd);
            const hasRecordDates = Boolean(recStart || recEnd);

            if (!hasDriveDates || !hasRecordDates) return true;

            return (
                driveStart === recStart ||
                driveEnd === recEnd ||
                driveStart === recEnd ||
                driveEnd === recStart ||
                (!driveEnd && driveStart && driveStart === recStart) ||
                (!recEnd && recStart && recStart === driveStart)
            );
        });

        if (matched) return true;

        return studentAttendanceRecords.some((record) =>
            normalizeText(record?.status) === 'absent' && normalizeText(record?.companyName) === driveCompany
        );
    }, [studentAttendanceRecords]);

    const driveAnalytics = useMemo(() => {
        const colorPalette = ['#6C7A89', '#197AFF', '#FF9F43', '#F4C542', '#3DDAD7', '#FF7A9E', '#10B981', '#8B5CF6'];
        const roundBuckets = new Map();

        const ensureRoundBucket = (roundLabel) => {
            const safeLabel = (roundLabel || '').toString().trim();
            if (!safeLabel) return null;

            const key = normalizeText(safeLabel);
            if (!roundBuckets.has(key)) {
                roundBuckets.set(key, { name: safeLabel, attempted: 0, passed: 0, failed: 0, absent: 0, companies: new Map() });
            }
            return key;
        };

        const updateCompanyStatus = (companiesMap, companyName, status) => {
            if (!companyName) return;
            const rank = { 'IN PROGRESS': 1, PASSED: 2, FAILED: 3 };
            const current = companiesMap.get(companyName);
            if (!current || rank[status] > rank[current]) {
                companiesMap.set(companyName, status);
            }
        };

        let totalRoundsCleared = 0;
        let shortlistedCount = 0;
        let rejectedCount = 0;
        let pendingCount = 0;
        let placedCount = 0;
        let highestPackageLpa = 0;
        let highestPackageCompany = '';
        let lastDriveDate = '';
        let lastDriveAttended = '';
        let lastDriveRole = '';
        let lastDriveResult = '';
        const pendingDriveCandidates = [];

        (eligibleDrives || []).forEach((drive) => {
            const companyName = (drive?.companyName || '').toString().trim();
            const application = findApplicationForDrive(drive);
            const attendanceAbsent = isAttendanceAbsentForDrive(drive);

            const normalizedStatus = normalizeText(application?.status);
            const overallStatus = attendanceAbsent ? 'Absent'
                : normalizedStatus === 'placed' || normalizedStatus === 'selected' ? 'Placed'
                : normalizedStatus === 'rejected' || normalizedStatus === 'failed' ? 'Rejected'
                : application?.rounds?.some((round) => normalizeText(round?.status) === 'failed') ? 'Rejected'
                : application?.rounds?.some((round) => normalizeText(round?.status) === 'absent') ? 'Absent'
                : application?.rounds?.some((round) => normalizeText(round?.status) === 'passed') ? `Passed-${application.rounds.filter((round) => normalizeText(round?.status) === 'passed').length}`
                : 'Pending';

            if (overallStatus === 'Placed') {
                placedCount += 1;
                shortlistedCount += 1;
            } else if (overallStatus.startsWith('Passed-')) {
                shortlistedCount += 1;
            } else if (overallStatus === 'Rejected' || overallStatus === 'Absent') {
                rejectedCount += 1;
            } else {
                pendingCount += 1;
                pendingDriveCandidates.push({ companyName, date: normalizeDate(drive?.driveStartDate || drive?.companyDriveDate || drive?.driveEndDate) });
            }

            const driveDate = normalizeDate(drive?.driveEndDate || drive?.driveStartDate || drive?.companyDriveDate);
            if (driveDate && (!lastDriveDate || driveDate > lastDriveDate)) {
                lastDriveDate = driveDate;
                lastDriveAttended = companyName;
                lastDriveRole = (drive?.jobs || drive?.jobRole || '').toString();
                lastDriveResult = overallStatus;
            }

            for (const candidate of [drive?.packageLpa, drive?.highestPackage, drive?.salaryPackage, drive?.ctc, drive?.package]) {
                const value = Number(candidate);
                if (Number.isFinite(value) && value > highestPackageLpa) {
                    highestPackageLpa = value;
                    highestPackageCompany = companyName;
                }
            }

            const rounds = Array.isArray(application?.rounds) ? application.rounds : [];
            const plannedRounds = Array.isArray(drive?.roundDetails) ? drive.roundDetails.map((item) => (item || '').toString().trim()).filter(Boolean) : [];

            const applyRoundStatus = (bucketKey, roundStatusRaw) => {
                if (!bucketKey) return;
                const bucket = roundBuckets.get(bucketKey);
                if (!bucket) return;

                const roundStatus = normalizeText(roundStatusRaw);
                const normalizedCompanyName = companyName || 'Unknown Company';
                if (roundStatus && roundStatus !== 'pending' && roundStatus !== 'not eligible') {
                    bucket.attempted += 1;
                }

                if (roundStatus === 'passed') {
                    bucket.passed += 1;
                    totalRoundsCleared += 1;
                    updateCompanyStatus(bucket.companies, normalizedCompanyName, 'PASSED');
                } else if (roundStatus === 'failed' || roundStatus === 'absent') {
                    if (roundStatus === 'failed') bucket.failed += 1; else bucket.absent += 1;
                    updateCompanyStatus(bucket.companies, normalizedCompanyName, 'FAILED');
                } else {
                    updateCompanyStatus(bucket.companies, normalizedCompanyName, 'IN PROGRESS');
                }
            };

            if (plannedRounds.length > 0) {
                plannedRounds.forEach((plannedRoundName, index) => {
                    const bucketKey = ensureRoundBucket(plannedRoundName);
                    const matchedRound = rounds.find((round) => normalizeText(round?.name || round?.roundName || round?.roundType || round?.type) === normalizeText(plannedRoundName) || Number(round?.roundNumber) === index + 1);
                    applyRoundStatus(bucketKey, matchedRound?.status);
                });
            } else {
                rounds.forEach((round, index) => {
                    const roundLabel = round?.name || round?.roundName || round?.roundType || round?.type || `Round ${Number(round?.roundNumber) || index + 1}`;
                    const bucketKey = ensureRoundBucket(roundLabel);
                    applyRoundStatus(bucketKey, round?.status);
                });
            }
        });

        const orderedBuckets = Array.from(roundBuckets.values());
        const totalAttempted = orderedBuckets.reduce((sum, bucket) => sum + bucket.attempted, 0);
        const pieData = orderedBuckets.map((bucket, index) => ({ name: bucket.name, value: totalAttempted > 0 ? Math.round((bucket.attempted / totalAttempted) * 100) : 0, color: colorPalette[index % colorPalette.length] }));

        const roundDetails = orderedBuckets.reduce((acc, bucket) => {
            const passRate = bucket.attempted > 0 ? Math.round((bucket.passed / bucket.attempted) * 100) : 0;
            const good = [];
            const bad = [];

            if (bucket.attempted === 0) {
                good.push('No completed rounds yet for this category.');
                bad.push('Attempt more drives to unlock insight quality.');
            } else {
                if (passRate >= 60) good.push(`Healthy conversion rate at ${passRate}% for this category.`); else bad.push(`Conversion is ${passRate}%. Focus improvement in this category.`);
                if (bucket.absent > 0) bad.push(`${bucket.absent} round(s) marked absent. Attendance impact detected.`);
                if (bucket.passed > 0) good.push(`${bucket.passed} round(s) cleared successfully.`);
            }

            acc[bucket.name] = { companies: Array.from(bucket.companies.entries()).map(([name, status]) => ({ name, status })), good, bad };
            return acc;
        }, {});

        const sortable = orderedBuckets.map((bucket) => ({ category: bucket.name, attempted: bucket.attempted, passRate: bucket.attempted > 0 ? Math.round((bucket.passed / bucket.attempted) * 100) : 0 })).filter((item) => item.attempted > 0);
        const bestAt = sortable.slice().sort((a, b) => b.passRate - a.passRate).slice(0, 3).map((item) => item.category);
        const workOn = sortable.slice().sort((a, b) => a.passRate - b.passRate).slice(0, 4).map((item) => item.category);

        const upcomingDrive = pendingDriveCandidates
            .filter((item) => item.companyName)
            .sort((a, b) => (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31'))
            .find((item) => !item.date || item.date >= normalizeDate(new Date())) || pendingDriveCandidates[0];

        return {
            totalCompaniesAttended: new Set((eligibleDrives || []).map((drive) => (drive?.companyName || '').toString().trim().toLowerCase()).filter(Boolean)).size,
            totalDrivesAttended: eligibleDrives.length,
            shortlistedCount,
            rejectedCount,
            pendingCount,
            placedCount,
            highestPackageLpa,
            highestPackageCompany,
            totalRoundsCleared,
            lastDriveAttended,
            lastDriveRole,
            lastDriveResult,
            upcomingCompany: upcomingDrive?.companyName || '',
            pieData,
            roundDetails,
            bestAt: bestAt.length > 0 ? bestAt : ['No round data'],
            workOn: workOn.length > 0 ? workOn : ['No round data'],
        };
    }, [eligibleDrives, findApplicationForDrive, isAttendanceAbsentForDrive, studentId, studentApplications]);

    const hasCompanyData = useMemo(() => {
        return eligibleDrives.length > 0 || studentApplications.length > 0 || studentAttendanceRecords.length > 0;
    }, [eligibleDrives.length, studentApplications.length, studentAttendanceRecords.length]);

    const isStudentPlaced = useMemo(() => {
        const placementCandidates = [studentData?.placementStatus, studentData?.placement, studentData?.placementResult, studentData?.finalPlacementStatus, studentData?.companyPlacementStatus, studentData?.jobStatus, studentData?.status].map((value) => normalizeText(value)).filter(Boolean);
        if (placementCandidates.some((value) => value === 'placed' || value === 'selected' || value === 'offer received' || value === 'hired')) return true;
        if (placementCandidates.some((value) => value === 'not placed' || value === 'unplaced' || value === 'notplaced' || value === 'rejected' || value === 'failed' || value === 'pending')) return false;
        if (typeof studentData?.isPlaced === 'boolean') return studentData.isPlaced;
        return driveAnalytics.placedCount > 0;
    }, [driveAnalytics.placedCount, studentData]);

    useEffect(() => {
        const studentIdForSync = studentData?._id || studentId;
        if (!studentIdForSync) return;

        const syncCompanyData = async () => {
            try {
                const [eligibleResponse, appsResponse, attendanceResponse] = await Promise.all([
                    mongoDBService.getEligibleStudentsForStudent(studentIdForSync),
                    mongoDBService.getStudentApplications(studentIdForSync),
                    fetchStudentAttendanceRecords(studentData)
                ]);

                setEligibleDrives(eligibleResponse?.drives || []);
                setStudentApplications(appsResponse?.applications || []);
                setStudentAttendanceRecords(attendanceResponse?.data || []);
            } catch (error) {
                console.error('Failed to load company analysis data (View):', error);
                setEligibleDrives([]);
                setStudentApplications([]);
                setStudentAttendanceRecords([]);
            }
        };

        syncCompanyData();
    }, [fetchStudentAttendanceRecords, studentData, studentId]);

    useEffect(() => {
        let isActive = true;

        const loadTrainingCardData = async () => {
            const regNo = (studentData?.regNo || studentData?.registerNumber || studentData?.registerNo || '').toString().trim();

            if (!regNo) {
                if (isActive) {
                    setStudentTrainingAssignment(null);
                    setStudentTrainingAttendanceRecords([]);
                }
                return;
            }

            try {
                const [assignment, attendanceResponse] = await Promise.all([
                    mongoDBService.getStudentTrainingAssignment(regNo),
                    mongoDBService.getStudentTrainingAttendanceByRegNo(regNo).catch(() => ({ data: [] }))
                ]);

                if (!isActive) return;

                setStudentTrainingAssignment(assignment || null);
                setStudentTrainingAttendanceRecords(Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : []);
            } catch (error) {
                if (!isActive) return;
                setStudentTrainingAssignment(null);
                setStudentTrainingAttendanceRecords([]);
            }
        };

        loadTrainingCardData();

        return () => {
            isActive = false;
        };
    }, [studentData?.regNo, studentData?.registerNo, studentData?.registerNumber]);

    const companyStats = useMemo(() => ({
        totalCompaniesAttended: driveAnalytics.totalCompaniesAttended,
        totalDrivesAttended: driveAnalytics.totalDrivesAttended,
        shortlistedCount: driveAnalytics.shortlistedCount,
        preferredModeOfDrive: studentData?.preferredModeOfDrive || 'Hybrid',
        lastDriveAttended: driveAnalytics.lastDriveAttended || '',
        lastDriveResult: driveAnalytics.lastDriveResult || '',
        highestPackageDrive: driveAnalytics.highestPackageLpa,
        totalRoundsCleared: driveAnalytics.totalRoundsCleared,
    }), [driveAnalytics, studentData?.preferredModeOfDrive]);

    const trainingCardStats = useMemo(() => {
        const presentCount = studentTrainingAttendanceRecords.filter(
            (entry) => normalizeText(entry?.status) === 'present'
        ).length;
        const absentCount = studentTrainingAttendanceRecords.filter(
            (entry) => normalizeText(entry?.status) === 'absent'
        ).length;
        const totalSessions = presentCount + absentCount;
        const attendancePercentage = totalSessions > 0
            ? Math.round((presentCount / totalSessions) * 100)
            : 0;

        const attendedCourse = studentTrainingAttendanceRecords
            .map((entry) => (entry?.courseName || entry?.course || entry?.trainingName || '').toString().trim())
            .find(Boolean);

        const assignmentCourse = (studentTrainingAssignment?.courseName || '').toString().trim();
        const preferredCourse = (selectedTrainings[0] || '').toString().trim();
        const assignmentTotalDays = Number(studentTrainingAssignment?.totalDays || 0);

        let calculatedTotalDays = 0;
        const assignmentStartDate = studentTrainingAssignment?.startDate;
        const assignmentEndDate = studentTrainingAssignment?.endDate;
        if (assignmentStartDate && assignmentEndDate) {
            const start = new Date(assignmentStartDate);
            const end = new Date(assignmentEndDate);
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
                const dayMs = 24 * 60 * 60 * 1000;
                const diffDays = Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / dayMs);
                if (diffDays >= 0) calculatedTotalDays = diffDays + 1;
            }
        }

        const totalTrainingDays = assignmentTotalDays > 0 ? assignmentTotalDays : calculatedTotalDays;

        return {
            courseName: assignmentCourse || attendedCourse || preferredCourse || 'N/A',
            attendancePercentage,
            totalTrainingDays
        };
    }, [
        normalizeText,
        selectedTrainings,
        studentTrainingAssignment?.courseName,
        studentTrainingAssignment?.endDate,
        studentTrainingAssignment?.startDate,
        studentTrainingAssignment?.totalDays,
        studentTrainingAttendanceRecords
    ]);

    const PIE_DATA = driveAnalytics.pieData;
    const ROUND_DETAILS = driveAnalytics.roundDetails;

    const successRate = useMemo(() => {
        const attended   = companyStats.totalDrivesAttended;
        const shortlisted = companyStats.shortlistedCount;
        if (attended === 0) return 0;
        return Math.min(100, Math.round((shortlisted / attended) * 100));
    }, [companyStats.totalDrivesAttended, companyStats.shortlistedCount]);

    const getAvailableSemesters = (year) => {
        const semesterMap = { 'I': ['1', '2'], 'II': ['3', '4'], 'III': ['5', '6'], 'IV': ['7', '8'] };
        return semesterMap[year] || [];
    };

    const getRequiredGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        const semesterNum = parseInt(currentSemester);
        const requiredFields = [];
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 7; i++) requiredFields.push(`semester${i}GPA`);
            return requiredFields;
        }
        for (let i = 1; i < semesterNum; i++) requiredFields.push(`semester${i}GPA`);
        return requiredFields;
    };

    const getAllGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        const semesterNum = parseInt(currentSemester);
        const allFields = [];
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 8; i++) allFields.push(`semester${i}GPA`);
            return allFields;
        }
        for (let i = 1; i <= semesterNum; i++) allFields.push(`semester${i}GPA`);
        return allFields;
    };

    const populateFormFields = (data) => {
        const normalized = {
            section: data.section || data.Section || data.sec || data.sectionName || '',
            residentialStatus: data.residentialStatus || data.ResidentialStatus || data.residentialstatus || '',
            quota: data.quota || data.Quota || '',
            firstGraduate: data.firstGraduate || data.firstgraduate || '',
            willingToSignBond: data.willingToSignBond || data.willingtosignbond || data.signBond || '',
            preferredModeOfDrive: data.preferredModeOfDrive || data.preferredMode || data.driveMode || '',
            companyTypes: data.companyTypes || data.companyType || '',
            preferredJobLocation: data.preferredJobLocation || data.jobLocation || '',
            community: data.community || data.Community || data.caste || '',
            mediumOfStudy: data.mediumOfStudy || data.medium || '',
            degree: data.degree || data.course || '',
            branch: data.branch || data.department || '',
            currentYear: data.currentYear || data.year || '',
            currentSemester: data.currentSemester || data.semester || ''
        };

        const merged = { ...data, ...normalized };
        setStudentData(merged);
        const processedSkills = Array.isArray(merged.skills) ? merged.skills : parseMultiValue(merged.skillSet || '');
        setStudyCategory(merged.studyCategory || '12th');
        setCurrentYear(merged.currentYear ? String(merged.currentYear) : '');
        setCurrentSemester(merged.currentSemester ? String(merged.currentSemester) : '');
        setSelectedSection(merged.section ? String(merged.section) : '');
        setSkills(processedSkills);
        savedDataRef.current = { ...merged, skills: processedSkills };

        if (merged.dob) {
            const dobStr = merged.dob.toString();
            if (dobStr.length === 8) {
                const day = dobStr.substring(0, 2);
                const month = dobStr.substring(2, 4);
                const year = dobStr.substring(4, 8);
                setDob(new Date(year, month - 1, day));
            }
        }

        // Handle profile image loading with debugging
        console.log('ðŸ” Profile Image Debug (View):', {
            hasProfilePicURL: !!merged.profilePicURL,
            profilePicURL: merged.profilePicURL,
            profileUploadDate: merged.profileUploadDate
        });

        if (merged.profilePicURL) {
            // Resolve GridFS URLs to full backend URL for display
            const resolvedUrl = gridfsService.getFileUrl(merged.profilePicURL);
            console.log('âœ… Profile Image Resolved (View):', resolvedUrl);
            setProfileImage(resolvedUrl);
            setUploadInfo({
                name: 'profile.jpg',
                date: merged.profileUploadDate || new Date().toLocaleDateString('en-GB')
            });
        } else {
            // Clear profile image if no profilePicURL is present
            console.log('âš ï¸ No profilePicURL found (View), clearing profile image');
            setProfileImage(null);
            setUploadInfo({ name: '', date: '' });
        }

        setIsInitialLoading(false);
    };

    const loadStudentData = useCallback(async () => {
        if (!studentId) return;

        let didPopulate = false;

        try {
            const completeData = await fastDataService.getCompleteStudentData(studentId);
            console.log('ðŸ” API Response - completeData (View):', {
                exists: !!completeData,
                hasStudent: !!completeData?.student,
                hasProfilePicURL: !!completeData?.student?.profilePicURL,
                profilePicURL: completeData?.student?.profilePicURL
            });

            if (completeData && completeData.student) {
                didPopulate = true;
                populateFormFields(completeData.student);
            }
        } catch (error) {
            console.error('Error loading student data:', error);
        } finally {
            if (!didPopulate) {
                setIsInitialLoading(false);
            }
        }
    }, [studentId]);

    useEffect(() => {
        // ADMIN VIEW FIX: When admin is viewing a student's profile, we should ONLY
        // load data from the API using the studentId from URL params, NOT from localStorage.
        // localStorage.studentData contains the logged-in admin's data, not the viewed student's data.

        setIsInitialLoading(true);

        // CLEAR OLD DATA FIRST - prevents showing previous student's data when switching
        setStudentData(null);
        setProfileImage(null);
        setDob(null);
        setCurrentYear('');
        setCurrentSemester('');
        setSelectedSection('');
        setSkills([]);
        setUploadInfo({ name: '', date: '' });
        setStudyCategory('12th');

        if (studentId) {
            console.log('ðŸ” Admin viewing student (View):', studentId, '- Loading fresh data from API');
            loadStudentData();
        } else {
            // Fallback to localStorage (shouldn't happen in admin view, but keeping for safety)
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            console.log('âš ï¸ No studentId in URL (View) - falling back to localStorage:', {
                exists: !!storedStudentData,
                hasId: !!storedStudentData?._id,
                hasProfilePicURL: !!storedStudentData?.profilePicURL
            });

            if (storedStudentData && storedStudentData._id) {
                populateFormFields(storedStudentData);
            } else {
                setIsInitialLoading(false);
            }
        }

        return () => {
            // Cleanup handled globally in AuthContext
        };
    }, [studentId, loadStudentData]);

    // Auto-sync mechanism: Check for profile updates every 30 seconds
    useEffect(() => {
        // ADMIN VIEW FIX: Disable auto-sync for admin viewing students
        // Auto-sync should only run for students viewing their own profile
        // Admin should manually refresh if they want updated data
        if (studentId) {
            console.log('ðŸ” Admin view (View) - auto-sync disabled (use manual refresh to see updates)');
            return; // Don't run auto-sync for admin viewing students
        }

        const checkForUpdates = async () => {
            try {
                const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
                if (!storedStudentData || !storedStudentData._id) return;

                const currentStudentId = storedStudentData._id || storedStudentData.id;

                // Use the lightweight status endpoint instead of full student fetch
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/students/${currentStudentId}/status`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) return;

                const statusData = await response.json();
                if (!statusData.success) return;

                // If blocked status changed, handle it
                if (statusData.student?.blocked) {
                    console.warn('Account blocked by admin');
                }
            } catch (error) {
                // Silently ignore sync errors to avoid console spam
            }
        };

        // Check for updates every 30 seconds (reduced from 10s)
        const syncInterval = setInterval(checkForUpdates, 30000);

        // Cleanup interval on unmount
        return () => clearInterval(syncInterval);
    }, [studentId]); // Added studentId dependency

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        // Robust file type detection using both MIME type and extension
        const getFileType = (file, fileName) => {
            // Check MIME type first (most reliable)
            if (file.type) {
                if (file.type === "image/jpeg" || file.type === "image/jpg") return "jpg";
                if (file.type === "image/webp") return "webp";
            }

            // Fallback to extension check
            if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return "jpg";
            if (fileName.endsWith('.webp')) return "webp";

            return null;
        };

        const fileType = getFileType(file, fileName);

        if (!fileType) {
            setInvalidUrl(file.name);
            setUrlErrorType('File Format');
            setURLErrorPopupOpen(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const maxSize = 500 * 1024;
        const fileSizeKB = (file.size / 1024).toFixed(1);

        if (file.size > maxSize) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        // Store raw File for GridFS upload on Save
        setProfilePhotoFile(file);
        setProfileImage(URL.createObjectURL(file));
        setUploadInfo({
            name: file.name,
            date: new Date().toLocaleDateString('en-GB'),
            size: fileSizeKB,
            type: fileType
        });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);

        console.log('âœ… File selected:', {
            name: file.name,
            mimeType: file.type || 'unknown',
            size: `${fileSizeKB}KB`,
            detectedType: fileType
        });
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        setProfileImage(null);
        setProfilePhotoFile(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isEditMode) return;

        // Validate GitHub and LinkedIn URLs before saving
        const githubVal = studentData?.githubLink?.trim() || '';
        const linkedinVal = studentData?.linkedinLink?.trim() || '';
        if (githubVal && !GITHUB_URL_REGEX.test(githubVal)) {
            setUrlErrorType('GitHub');
            setInvalidUrl(githubVal);
            setURLErrorPopupOpen(true);
            return;
        }
        if (linkedinVal && !LINKEDIN_URL_REGEX.test(linkedinVal)) {
            setUrlErrorType('LinkedIn');
            setInvalidUrl(linkedinVal);
            setURLErrorPopupOpen(true);
            return;
        }

        setIsSaving(true);

        try {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (!storedStudentData || (!storedStudentData._id && !storedStudentData.id)) {
                alert('User not authenticated');
                return;
            }

            // Always prefer MongoDB _id so updates and complete-data fetch use the same document
            const studentId = storedStudentData._id || storedStudentData.id;

            // Upload profile photo to GridFS FIRST if a new file was selected
            let profilePhotoUrl = studentData?.profilePicURL || '';
            // Initialize finalResolvedUrl with existing profile URL (in case no new photo uploaded)
            let finalResolvedUrl = studentData?.profilePicURL ? gridfsService.getFileUrl(studentData.profilePicURL) : '';

            if (profilePhotoFile) {
                try {
                    console.log('ðŸ”„ Uploading profile photo to GridFS...');
                    const result = await gridfsService.uploadProfileImage(profilePhotoFile, studentId, 'student');
                    if (result && result.url) {
                        profilePhotoUrl = result.url; // relative GridFS path e.g. /api/file/xxx
                        finalResolvedUrl = gridfsService.getFileUrl(result.url); // full URL

                        // Don't update UI yet - keep old image visible until save completes
                        // This prevents sidebar flicker (old â†’ placeholder â†’ new)
                        setProfilePhotoFile(null);

                        console.log('âœ… Profile photo uploaded to GridFS:', profilePhotoUrl);
                    }
                } catch (uploadErr) {
                    console.error('Failed to upload profile photo:', uploadErr);
                    alert('Failed to upload profile photo. Please try again.');
                    setIsSaving(false);
                    return;
                }
            }

            const formData = new FormData(e.target);

            const updateData = {
                // Include all readonly fields to preserve complete profile data
                firstName: formData.get('firstName') || studentData?.firstName || '',
                lastName: formData.get('lastName') || studentData?.lastName || '',
                regNo: formData.get('regNo') || studentData?.regNo || '',
                dob: formData.get('dob') || studentData?.dob || '',
                gender: formData.get('gender') || studentData?.gender || '',
                department: formData.get('department') || studentData?.department || '',
                degree: formData.get('degree') || studentData?.degree || '',
                branch: formData.get('branch') || studentData?.branch || '',
                batch: formData.get('batch') || studentData?.batch || '',
                fatherName: formData.get('fatherName') || studentData?.fatherName || '',
                motherName: formData.get('motherName') || studentData?.motherName || '',
                domainEmail: formData.get('domainEmail') || studentData?.domainEmail || '',
                aadhaarNo: formData.get('aadhaarNo') || studentData?.aadhaarNo || '',
                community: formData.get('community') || studentData?.community || '',
                mediumOfStudy: formData.get('mediumOfStudy') || studentData?.mediumOfStudy || '',

                // Academic background (readonly)
                tenthBoard: formData.get('tenthBoard') || studentData?.tenthBoard || '',
                tenthInstitution: formData.get('tenthInstitution') || studentData?.tenthInstitution || '',
                tenthPercentage: formData.get('tenthPercentage') || studentData?.tenthPercentage || '',
                tenthYear: formData.get('tenthYear') || studentData?.tenthYear || '',
                twelfthBoard: formData.get('twelfthBoard') || studentData?.twelfthBoard || '',
                twelfthInstitution: formData.get('twelfthInstitution') || studentData?.twelfthInstitution || '',
                twelfthPercentage: formData.get('twelfthPercentage') || studentData?.twelfthPercentage || '',
                twelfthYear: formData.get('twelfthYear') || studentData?.twelfthYear || '',
                twelfthCutoff: formData.get('twelfthCutoff') || studentData?.twelfthCutoff || '',
                diplomaBoard: formData.get('diplomaBoard') || studentData?.diplomaBoard || '',
                diplomaInstitution: formData.get('diplomaInstitution') || studentData?.diplomaInstitution || '',
                diplomaPercentage: formData.get('diplomaPercentage') || studentData?.diplomaPercentage || '',
                diplomaYear: formData.get('diplomaYear') || studentData?.diplomaYear || '',

                // Editable fields - preserve existing data if field not on current form view
                address: formData.get('address') || studentData?.address || '',
                city: formData.get('city') || studentData?.city || '',
                primaryEmail: formData.get('primaryEmail') || studentData?.primaryEmail || '',
                mobileNo: formData.get('mobileNo') || studentData?.mobileNo || '',
                fatherOccupation: formData.get('fatherOccupation') || studentData?.fatherOccupation || '',
                fatherMobile: formData.get('fatherMobile') || studentData?.fatherMobile || '',
                motherOccupation: formData.get('motherOccupation') || studentData?.motherOccupation || '',
                motherMobile: formData.get('motherMobile') || studentData?.motherMobile || '',
                section: formData.get('section') || studentData?.section || '',
                guardianName: formData.get('guardianName') || studentData?.guardianName || '',
                guardianMobile: formData.get('guardianMobile') || studentData?.guardianMobile || '',
                bloodGroup: formData.get('bloodGroup') || studentData?.bloodGroup || '',
                studyCategory: studyCategory || studentData?.studyCategory || '',
                currentYear: formData.get('currentYear') || studentData?.currentYear || '',
                currentSemester: formData.get('currentSemester') || studentData?.currentSemester || '',
                semester1GPA: formData.get('semester1GPA') || studentData?.semester1GPA || '',
                semester2GPA: formData.get('semester2GPA') || studentData?.semester2GPA || '',
                semester3GPA: formData.get('semester3GPA') || studentData?.semester3GPA || '',
                semester4GPA: formData.get('semester4GPA') || studentData?.semester4GPA || '',
                semester5GPA: formData.get('semester5GPA') || studentData?.semester5GPA || '',
                semester6GPA: formData.get('semester6GPA') || studentData?.semester6GPA || '',
                semester7GPA: formData.get('semester7GPA') || studentData?.semester7GPA || '',
                semester8GPA: formData.get('semester8GPA') || studentData?.semester8GPA || '',
                overallCGPA: formData.get('overallCGPA') || studentData?.overallCGPA || '',
                clearedBacklogs: formData.get('clearedBacklogs') || studentData?.clearedBacklogs || '',
                currentBacklogs: formData.get('currentBacklogs') || studentData?.currentBacklogs || '',
                yearOfGap: formData.get('yearOfGap') || studentData?.yearOfGap || '',
                gapReason: formData.get('gapReason') || studentData?.gapReason || '',
                residentialStatus: formData.get('residentialStatus') || studentData?.residentialStatus || '',
                quota: formData.get('quota') || studentData?.quota || '',
                languagesKnown: formData.get('languagesKnown') || studentData?.languagesKnown || '',
                firstGraduate: formData.get('firstGraduate') || studentData?.firstGraduate || '',
                passportNo: formData.get('passportNo') || studentData?.passportNo || '',
                skillSet: formData.get('skillSet') || studentData?.skillSet || '',
                skills: skills.filter(s => s.trim()),
                valueAddedCourses: formData.get('valueAddedCourses') || studentData?.valueAddedCourses || '',
                aboutSibling: formData.get('aboutSibling') || studentData?.aboutSibling || '',
                rationCardNo: formData.get('rationCardNo') || studentData?.rationCardNo || '',
                familyAnnualIncome: formData.get('familyAnnualIncome') || studentData?.familyAnnualIncome || '',
                willingToSignBond: formData.get('willingToSignBond') || studentData?.willingToSignBond || '',
                preferredModeOfDrive: formData.get('preferredModeOfDrive') || studentData?.preferredModeOfDrive || '',
                githubLink: formData.get('githubLink') || studentData?.githubLink || '',
                linkedinLink: formData.get('linkedinLink') || studentData?.linkedinLink || '',
                portfolioLink: formData.get('portfolioLink') || studentData?.portfolioLink || '',
                companyTypes: formData.get('companyTypes') || studentData?.companyTypes || '',
                preferredJobLocation: formData.get('preferredJobLocation') || studentData?.preferredJobLocation || '',
                profilePicURL: (() => {
                    // Store relative GridFS path in DB, not full URL or Base64
                    const pic = profilePhotoUrl || studentData?.profilePicURL || '';
                    if (pic.startsWith('blob:')) return studentData?.profilePicURL || ''; // Don't save blob URLs
                    if (pic.includes('/file/')) {
                        // Extract relative /api/file/xxx path from full URL
                        const match = pic.match(/\/api\/file\/[a-f0-9]+/) || pic.match(/\/file\/([a-f0-9]+)/);
                        if (match) return match[0].startsWith('/api') ? match[0] : `/api${match[0]}`;
                    }
                    if (pic.startsWith('data:')) return studentData?.profilePicURL || ''; // Don't store Base64 anymore
                    if (pic.startsWith('http://') || pic.startsWith('https://')) {
                        // Extract path from full URL
                        const match = pic.match(/\/api\/file\/[a-f0-9]+/);
                        if (match) return match[0];
                    }
                    return pic;
                })(),
                profileUploadDate: uploadInfo.date || new Date().toLocaleDateString('en-GB')
            };

            const result = await fastDataService.updateProfile(studentId, updateData);
            console.log('StuProfile handleSave result.student:', result?.student);

            const updatedStudentData = {
                ...(studentData || {}),
                ...(result?.student || {}),
                ...updateData,
                // Ensure we use the resolved GridFS URL for display
                profilePicURL: finalResolvedUrl || updateData.profilePicURL || studentData?.profilePicURL
            };

            // If we have a new profile image, preload it before updating UI (prevents placeholder flash)
            if (finalResolvedUrl && finalResolvedUrl !== studentData?.profilePicURL) {
                try {
                    await new Promise((resolve, reject) => {
                        const img = new Image();
                        const timeout = setTimeout(() => {
                            console.log('âš ï¸ Image preload timeout, continuing anyway');
                            resolve();
                        }, 3000); // 3 second max wait

                        img.onload = () => {
                            clearTimeout(timeout);
                            console.log('âœ… New profile image preloaded successfully');
                            resolve();
                        };
                        img.onerror = () => {
                            clearTimeout(timeout);
                            console.log('âš ï¸ Image preload failed, continuing anyway');
                            resolve(); // Don't reject, just continue
                        };
                        img.src = finalResolvedUrl;
                    });
                } catch (preloadErr) {
                    console.warn('Image preload error:', preloadErr);
                }
            }

            // Clean up blob URLs to prevent memory leaks (after preload completes)
            if (profileImage && profileImage.startsWith('blob:')) {
                URL.revokeObjectURL(profileImage);
            }

            // Update local state with new data including new profile pic
            setStudentData(updatedStudentData);
            setCurrentYear(String(updatedStudentData.currentYear || ''));
            setCurrentSemester(String(updatedStudentData.currentSemester || ''));
            setSelectedSection(String(updatedStudentData.section || ''));

            // Update profile image preview to new image (seamless transition - image already preloaded)
            if (finalResolvedUrl) {
                setProfileImage(finalResolvedUrl);
            }

            // Update localStorage and sidebar ONCE with complete data (image already loaded)
            localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedStudentData }));

            // Show success popup immediately after everything is ready
            setIsSaving(false);
            setPopupOpen(true);
            savedDataRef.current = { ...updatedStudentData, skills: skills.filter(s => s.trim()) };
            if (afterSaveNavRef.current) {
                const navTarget = afterSaveNavRef.current;
                afterSaveNavRef.current = null;
                performViewChange(navTarget);
            }
        } catch (error) {
            if (error.message.includes('permission')) { alert('Permission denied.'); }
            else if (error.message.includes('not-found')) { alert('Student record not found.'); }
            else if (error.message.includes('network')) { alert('Network error.'); }
            else { alert(`Error updating data: ${error.message}`); }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th'); setDob(null);
            loadStudentData();
        }
    };

    const handleAddSkill = () => {
        setSkills(prev => [...prev, '']);
    };

    const handleSkillChange = (index, value) => {
        setSkills(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const handleRemoveSkill = (index) => {
        setSkills(prev => prev.filter((_, i) => i !== index));
    };

    const handleMobileChange = (e, fieldName) => {
        let value = e.target.value;
        // Remove leading zeros
        value = value.replace(/^0+/, '');
        // Only allow digits
        value = value.replace(/\D/g, '');
        // First digit must be 6, 7, 8, or 9
        if (value.length > 0 && !/^[6789]/.test(value)) {
            value = '';
        }
        // Limit to 10 digits
        value = value.substring(0, 10);
        setStudentData(prev => ({ ...prev, [fieldName]: value }));
    };

    const closePopup = () => setPopupOpen(false);

    const closeResumePopup = () => {
        if (isResumeDownloading) {
            return;
        }

        setIsResumeChooserOpen(false);
    };

    const openResumePopup = () => {
        setIsResumeFailureOpen(false);
        setIsResumeDownloadSuccessOpen(false);
        setResumeActionType('');
        setIsResumeChooserOpen(true);
    };

    const resolveResumeFile = async () => {
        if (!studentId) {
            throw new Error('Student ID not found');
        }

        const { blobUrl, fileName } = await fetchResumeBlobUrl(studentId);
        return { blobUrl, fileName: fileName || 'resume.pdf' };
    };

    const handleResumeView = async () => {
        if (isResumeDownloading) {
            return;
        }

        setResumeActionType('preview');
        setIsResumeDownloading(true);

        let blobUrl = null;

        try {
            const result = await resolveResumeFile();
            blobUrl = result.blobUrl;

            const resumeWindow = window.open(blobUrl, '_blank');
            if (!resumeWindow) {
                throw new Error('Popup blocked');
            }

            setIsResumeChooserOpen(false);
            setIsResumeFailureOpen(false);

            setTimeout(() => {
                if (blobUrl) {
                    window.URL.revokeObjectURL(blobUrl);
                }
            }, 1500);
        } catch (error) {
            console.error('Resume view failed:', error);
            if (blobUrl) {
                window.URL.revokeObjectURL(blobUrl);
            }
            setIsResumeChooserOpen(false);
            setIsResumeFailureOpen(true);
        } finally {
            setIsResumeDownloading(false);
            setResumeActionType('');
        }
    };

    const handleResumeDownload = async () => {
        if (isResumeDownloading) {
            return;
        }

        setResumeActionType('download');
        setIsResumeDownloading(true);

        let blobUrl = null;
        let downloadFileName = 'resume.pdf';

        try {
            const result = await resolveResumeFile();
            blobUrl = result.blobUrl;
            downloadFileName = result.fileName || downloadFileName;

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = downloadFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsResumeChooserOpen(false);
            setIsResumeFailureOpen(false);
            setIsResumeDownloadSuccessOpen(true);

            setTimeout(() => {
                if (blobUrl) {
                    window.URL.revokeObjectURL(blobUrl);
                }
            }, 1500);
        } catch (error) {
            console.error('Resume download failed:', error);
            if (blobUrl) {
                window.URL.revokeObjectURL(blobUrl);
            }
            setIsResumeChooserOpen(false);
            setIsResumeFailureOpen(true);
        } finally {
            setIsResumeDownloading(false);
            setResumeActionType('');
        }
    };

    const performViewChange = useCallback((view) => {
        if (!view) return;

        if (typeof onViewChange === 'function') {
            onViewChange(view);
            return;
        }

        const targetPath = view.startsWith('/') ? view : `/${view}`;
        navigate(targetPath);
    }, [onViewChange, navigate]);

    const getChangedFields = () => {
        if (!savedDataRef.current || !studentData) return [];
        const saved = savedDataRef.current;
        const changed = [];
        for (const [key, label] of Object.entries(EDITABLE_FIELD_LABELS)) {
            if (key === 'skills') {
                const savedSkills = Array.isArray(saved.skills) ? saved.skills.filter(s => s).join(',') : '';
                const curSkills = skills.filter(s => s.trim()).join(',');
                if (savedSkills !== curSkills) changed.push(label);
            } else if (key === 'profilePicURL') {
                if (profilePhotoFile) changed.push(label);
            } else {
                if (String(saved[key] || '') !== String(studentData[key] || '')) changed.push(label);
            }
        }
        return changed;
    };

    const handleViewChange = (view) => {
        if (!isEditMode) {
            performViewChange(view);
            setIsSidebarOpen(false);
            return;
        }

        const changed = getChangedFields();
        if (changed.length > 0) {
            setPendingNavView(view);
            setShowUnsavedModal(true);
            setIsSidebarOpen(false);
        } else {
            performViewChange(view);
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className={`${styles.container} ${isSaving ? styles['stu-profile-saving'] : ''} ${isEditMode ? styles.editMode : ''}`}>
            {isSaving && <div className={styles['stu-profile-saving-overlay']} />}
            {/* Profile Update Notification */}
            {showUpdateNotification && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    backgroundColor: '#4ea24e',
                    color: 'white',
                    padding: '15px 25px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'slideInRight 0.3s ease-out',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: '500',
                    fontSize: '14px'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span>Your profile has been updated by admin</span>
                </div>
            )}

            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles.main}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'profile'}
                    onViewChange={handleViewChange}
                    studentData={studentData}
                />
                <div className={styles.dashboardArea}>
                    <form ref={formRef} onSubmit={handleSave}>
                        {/* --- PERSONAL INFO --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Personal Information</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.personalInfoFields}>
                                    <div className={styles.field}>
                                        <label>First Name <RequiredStar /></label>
                                        <input type="text" name="firstName" placeholder="Enter First Name" value={studentData?.firstName || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Last Name <RequiredStar /></label>
                                        <input type="text" name="lastName" placeholder="Enter Last Name" value={studentData?.lastName || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Register Number <RequiredStar /></label>
                                        <input type="text" name="regNo" placeholder="Enter Register Number" value={studentData?.regNo || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Batch <RequiredStar /></label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                value={studentData?.batch ? (studentData.batch.split('-')[0] || '') : ''}
                                                placeholder="Start"
                                                readOnly
                                                className={styles.readOnlyInput}
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontWeight: '600', color: '#333' }}>-</span>
                                            <input
                                                type="text"
                                                value={studentData?.batch ? (studentData.batch.split('-')[1] || '') : ''}
                                                placeholder="End"
                                                readOnly
                                                className={styles.readOnlyInput}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                        <input type="hidden" name="batch" value={studentData?.batch || ''} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Date of Birth <RequiredStar /></label>
                                        <div className={styles.datepickerWrapper}>
                                            <DatePicker
                                                selected={dob}
                                                onChange={() => {}}
                                                dateFormat="dd-MM-yyyy"
                                                placeholderText="Enter DOB"
                                                className={`${styles.datepickerInput} ${styles.readOnlyInput}`}
                                                wrapperClassName="StuProfile-datepicker-wrapper-inner"
                                                showPopperArrow={false}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Degree <RequiredStar /></label>
                                        <select name="degree" value={studentData?.degree || ''} disabled className={styles.readOnlyInput}>
                                            <option value="" disabled>Degree</option>
                                            <option value={studentData?.degree || ''}>{studentData?.degree || 'N/A'}</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Branch <RequiredStar /></label>
                                        <select
                                            name="branch"
                                            value={studentData?.branch || ''}
                                            disabled
                                            className={styles.readOnlyInput}
                                        >
                                            <option value="" disabled>Branch</option>
                                            <option value={studentData?.branch || ''}>{studentData?.branch || 'N/A'}</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Current Year <RequiredStar /></label>
                                        <select
                                            name="currentYear"
                                            value={currentYear || ''}
                                            required
                                            onChange={(e) => {
                                                const newYear = e.target.value;
                                                setCurrentYear(newYear);
                                                const semesters = getAvailableSemesters(newYear);
                                                const firstSemester = semesters[0] || '';
                                                setCurrentSemester(firstSemester);
                                                setStudentData((prev) => ({ ...(prev || {}), currentYear: newYear, currentSemester: firstSemester }));
                                            }}
                                            disabled={isSaving}
                                        >
                                            <option value="" disabled>Current Year</option>
                                            <option value="I">I</option>
                                            <option value="II">II</option>
                                            <option value="III">III</option>
                                            <option value="IV">IV</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Current Semester <RequiredStar /></label>
                                        <select
                                            name="currentSemester"
                                            value={currentSemester || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setCurrentSemester(value);
                                                setStudentData((prev) => ({ ...(prev || {}), currentSemester: value }));
                                            }}
                                            required
                                            disabled={!currentYear || isSaving}
                                        >
                                            <option value="" disabled>{currentYear ? 'Current Semester' : 'Select Year First'}</option>
                                            {getAvailableSemesters(currentYear).map((sem) => (
                                                <option key={sem} value={sem}>
                                                    {sem}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Section <RequiredStar /></label>
                                        <>
                                            <select
                                                name="section"
                                                value={selectedSection}
                                                disabled
                                                className={styles.readOnlyInput}
                                            >
                                                <option value="" disabled>
                                                    Section *
                                                </option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                            </select>
                                            <input type="hidden" name="section" value={selectedSection || ''} />
                                        </>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Gender <RequiredStar /></label>
                                        <select name="gender" value={studentData?.gender || ''} disabled className={styles.readOnlyInput}>
                                            <option value="" disabled>Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Address</label>
                                        <input type="text" name="address" placeholder="Enter Address" defaultValue={studentData?.address || ''} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>City</label>
                                        <input type="text" name="city" placeholder="Enter City" defaultValue={studentData?.city || ''} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Primary Email <RequiredStar /></label>
                                        <input type="email" name="primaryEmail" placeholder="Enter Primary Email" defaultValue={studentData?.primaryEmail || ''} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Domain Email <RequiredStar /></label>
                                        <input type="email" name="domainEmail" placeholder="Enter Domain Email" value={studentData?.domainEmail || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mobile No. <RequiredStar /></label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="mobileNo" placeholder="Enter Mobile No." value={studentData?.mobileNo || ''} onChange={(e) => handleMobileChange(e, 'mobileNo')} disabled={isSaving} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Father Name <RequiredStar /></label>
                                        <input type="text" name="fatherName" placeholder="Enter Father Name" value={studentData?.fatherName || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Father Occupation</label>
                                        <input type="text" name="fatherOccupation" placeholder="Enter Father Occupation" defaultValue={studentData?.fatherOccupation || ''} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Father Mobile No. <RequiredStar /></label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="fatherMobile" placeholder="Enter Father Mobile No." value={studentData?.fatherMobile || ''} onChange={(e) => handleMobileChange(e, 'fatherMobile')} disabled={isSaving} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mother Name <RequiredStar /></label>
                                        <input type="text" name="motherName" placeholder="Enter Mother Name" value={studentData?.motherName || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mother Occupation</label>
                                        <input type="text" name="motherOccupation" placeholder="Enter Mother Occupation" defaultValue={studentData?.motherOccupation || ''} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mother Mobile No. <RequiredStar /></label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="motherMobile" placeholder="Enter Mother Mobile No." value={studentData?.motherMobile || ''} onChange={(e) => handleMobileChange(e, 'motherMobile')} disabled={isSaving} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Guardian Name</label>
                                        <input type="text" name="guardianName" placeholder="Enter Guardian Name" defaultValue={studentData?.guardianName || ''} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Guardian Number</label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="guardianMobile" placeholder="Enter Guardian Number" value={studentData?.guardianMobile || ''} onChange={(e) => handleMobileChange(e, 'guardianMobile')} disabled={isSaving} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>&nbsp;</label>
                                        <button
                                            type="button"
                                            className={styles.fieldButton}
                                            onClick={openResumePopup}
                                        >
                                            Resume
                                        </button>
                                    </div>
                                    <div className={styles.field}>
                                        <label>&nbsp;</label>
                                        <button
                                            type="button"
                                            className={styles.fieldButton}
                                            onClick={() => navigate(`/admin-student-certificates/${studentId}`, { state: { studentData } })}
                                        >
                                            Certificate
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.profilePhotoWrapper}>
                                    <div className={styles.profilePhotoBox}>
                                        <h3 className={styles.sectionHeader}>Profile Photo</h3>
                                        <div className={styles.profileIconContainer}>
                                            {profileImage ? (
                                                <img
                                                    src={profileImage}
                                                    alt="Profile Preview"
                                                    className={styles.profilePreviewImg}
                                                    onClick={() => setImagePreviewOpen(true)}
                                                    onError={(e) => {
                                                        console.error('âŒ Profile image failed to load (View):', profileImage);
                                                        console.error('Image error event:', e);
                                                    }}
                                                    onLoad={() => {
                                                        console.log('âœ… Profile image loaded successfully (View):', profileImage);
                                                    }}
                                                />
                                            ) : (
                                                <GraduationCapIcon />
                                            )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className={styles.uploadInfoContainer}>
                                                <div className={styles.uploadInfoItem}>
                                                    <FileIcon />
                                                    <span>{uploadInfo.name}</span>
                                                </div>
                                                <div className={styles.uploadInfoItem}>
                                                    <CalendarIcon />
                                                    <span>Uploaded on: {uploadInfo.date}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Community <RequiredStar /></label>
                                        <select name="community" value={studentData?.community || ''} disabled className={styles.readOnlyInput}>
                                            <option value="" disabled>
                                                Community
                                            </option>
                                            <option value="OC">OC</option>
                                            <option value="BC">BC</option>
                                            <option value="BCM">BCM</option>
                                            <option value="MBC">MBC</option>
                                            <option value="SC">SC</option>
                                            <option value="SCA">SCA</option>
                                            <option value="ST">ST</option>
                                        </select>
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Medium of Study <RequiredStar /></label>
                                        <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} disabled className={styles.readOnlyInput}>
                                            <option value="" disabled>
                                                Medium
                                            </option>
                                            <option value="English">English</option>
                                            <option value="Tamil">Tamil</option>
                                            <option value="Other">Others</option>
                                        </select>
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Blood Group</label>
                                        <input type="text" name="bloodGroup" placeholder="Enter Blood Group" defaultValue={studentData?.bloodGroup || ''} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Aadhaar Number <RequiredStar /></label>
                                        <input type="text" name="aadhaarNo" placeholder="Enter Aadhaar Number (12 digits)" value={studentData?.aadhaarNo || ''} maxLength="12" readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Portfolio Link</label>
                                        <input type="url" name="portfolioLink" placeholder="Enter Portfolio Link" defaultValue={studentData?.portfolioLink || ''} disabled={isSaving} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className={styles.profileSectionContainer}>
                          <h3 className={styles.sectionHeader}>Academic Background</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.studyCategory} style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} disabled />
                                    <label htmlFor="12th">12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} disabled />
                                    <label htmlFor="diploma">Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} disabled />
                                    <label htmlFor="both">Both</label>
                                </div>
                                    <div className={styles.field}>
                                        <label>10th Institution Name <RequiredStar /></label>
                                        <input type="text" name="tenthInstitution" placeholder="Enter 10th Institution Name" value={studentData?.tenthInstitution || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>10th Board / University <RequiredStar /></label>
                                        <select name="tenthBoard" value={studentData?.tenthBoard || ''} disabled className={styles.readOnlyInput}>
                                            <option value="" disabled>10th Board/University</option>
                                            <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="Other State Board">Other State Board</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>10th Percentage <RequiredStar /></label>
                                        <input type="text" name="tenthPercentage" placeholder="Enter 10th Percentage" value={studentData?.tenthPercentage || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>10th Year of Passing <RequiredStar /></label>
                                        <input type="text" name="tenthYear" placeholder="Enter 10th Year of Passing" value={studentData?.tenthYear || ''} readOnly className={styles.readOnlyInput} />
                                    </div>
                                    {(studyCategory === '12th' || studyCategory === 'both') && (
                                        <>
                                            <div className={styles.field}>
                                                <label>12th Institution Name <RequiredStar /></label>
                                                <input type="text" name="twelfthInstitution" placeholder="Enter 12th Institution Name" value={studentData?.twelfthInstitution || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Board / University <RequiredStar /></label>
                                                <select name="twelfthBoard" value={studentData?.twelfthBoard || ''} disabled className={styles.readOnlyInput}>
                                                    <option value="" disabled>12th Board/University</option>
                                                    <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                                    <option value="CBSE">CBSE</option>
                                                    <option value="ICSE">ICSE</option>
                                                    <option value="Other State Board">Other State Board</option>
                                                </select>
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Percentage <RequiredStar /></label>
                                                <input type="text" name="twelfthPercentage" placeholder="Enter 12th Percentage" value={studentData?.twelfthPercentage || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Year of Passing <RequiredStar /></label>
                                                <input type="text" name="twelfthYear" placeholder="Enter 12th Year of Passing" value={studentData?.twelfthYear || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Cut-off Marks <RequiredStar /></label>
                                                <input type="text" name="twelfthCutoff" placeholder="Enter 12th Cut-off Marks" value={studentData?.twelfthCutoff || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                        </>
                                    )}
                                    {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                        <>
                                            <div className={styles.field}>
                                                <label>Diploma Institution <RequiredStar /></label>
                                                <input type="text" name="diplomaInstitution" placeholder="Enter Diploma Institution" value={studentData?.diplomaInstitution || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Diploma Branch <RequiredStar /></label>
                                                <input type="text" name="diplomaBranch" placeholder="Enter Diploma Branch" value={studentData?.diplomaBranch || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Diploma Percentage <RequiredStar /></label>
                                                <input type="text" name="diplomaPercentage" placeholder="Enter Diploma Percentage" value={studentData?.diplomaPercentage || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Diploma Year of Passing <RequiredStar /></label>
                                                <input type="text" name="diplomaYear" placeholder="Enter Diploma Year of Passing" value={studentData?.diplomaYear || ''} readOnly className={styles.readOnlyInput} />
                                            </div>
                                        </>
                                    )}
                            </div>
                        </div>

                            {/* --- SEMESTER --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Semester</h3>
                            <div className={styles.marksheetGrid}>
                                {/* Show semesters 1 to current semester only */}
                                {(() => {
                                    const currentSem = parseInt(currentSemester) || 1;
                                    const semestersToShow = Array.from({ length: currentSem }, (_, i) => i + 1);
                                    return semestersToShow.map((semesterNumber) => (
                                        <div key={semesterNumber} className={styles.semesterBox}>
                                            <span className={styles.semesterLabel}>Semester {semesterNumber}</span>
                                            <button type="button" className={styles.viewMarksheetBtn}>
                                                <img src={StuEyeIcon} alt="View" className={styles.eyeIcon} />
                                            </button>
                                        </div>
                                    ));
                                })()}

                                {/* Upload button for current semester */}
                                {(() => {
                                    const currentSem = parseInt(currentSemester) || 1;
                                    return (
                                        <button
                                            type="button"
                                            className={styles.uploadMarksheetBtnFull}
                                            onClick={() => navigate(`/admin-semester-marksheet-view/${studentId}`, { state: { student: studentData } })}
                                        >
                                            <img src={StuUploadMarksheetIcon} alt="Upload" className={styles.uploadIcon} />
                                            <span>View Sem {currentSem} Marksheet</span>
                                        </button>
                                    );
                                })()}
                            </div>

                            {/* Separator line */}
                            <div className={styles.semesterSeparator}></div>

                            <div className={`${styles.formGrid} ${styles.academicGrid}`} style={{ marginTop: '2rem' }}>
                                <div className={styles.field}>
                                    <label>CGPA</label>
                                    <input
                                        type="text"
                                        name="overallCGPA"
                                        placeholder="Enter CGPA"
                                        value={studentData?.overallCGPA ?? ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>No. of Backlog (Arrear Cleared)</label>
                                    <input
                                        type="text"
                                        name="clearedBacklogs"
                                        placeholder="Enter No. of Backlog (Arrear Cleared)"
                                        value={studentData?.clearedBacklogs ?? ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>No. of Current Backlog</label>
                                    <input
                                        type="text"
                                        name="currentBacklogs"
                                        placeholder="Enter No. of Current Backlog"
                                        value={studentData?.currentBacklogs ?? ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Year of Gap</label>
                                    <input
                                        type="text"
                                        name="yearOfGap"
                                        placeholder="Enter Year of Gap"
                                        value={studentData?.yearOfGap ?? ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, yearOfGap: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className={`${styles.field} ${styles.fullWidth}`}>
                                    <label>Reason for Year of Gap</label>
                                    <input
                                        type="text"
                                        name="gapReason"
                                        placeholder="Enter Reason for Year of Gap"
                                        value={studentData?.gapReason ?? ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, gapReason: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </div>

                        {(studentTrainingAssignment || studentTrainingAttendanceRecords.length > 0) && (
                            <div className={styles.profileSectionContainer}>
                                <h3 className={styles.sectionHeader}>Training</h3>
                                <div className={styles.companyStatsGrid}>
                                    <div className={styles.companyStatCardEmpty}>
                                        <span className={styles.companyStatLabel}>Training 1</span>
                                        <span className={styles.companyStatValueEmpty}>{trainingCardStats.courseName}</span>
                                    </div>
                                    <div className={styles.companyStatCard}>
                                        <span className={styles.companyStatLabel}>Attendance Percentage</span>
                                        <span className={styles.companyStatValue}>{trainingCardStats.attendancePercentage}%</span>
                                    </div>
                                    <div className={styles.companyStatCard}>
                                        <span className={styles.companyStatLabel}>Total Training Days</span>
                                        <span className={styles.companyStatValue}>{trainingCardStats.totalTrainingDays}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- COMPANY DETAILS / ANALYSIS TOGGLE --- */}
                        {hasCompanyData && (
                        <div className={styles.profileSectionContainer}>
                            {!showAnalysis ? (
                                <>
                                    <h3 className={styles.sectionHeader}>Company Details</h3>
                                    <div className={styles.companyStatsGrid}>
                                        <div className={styles.companyStatCard}>
                                            <span className={styles.companyStatLabel}>Total Companies Attended</span>
                                            <span className={styles.companyStatValue}>{companyStats.totalCompaniesAttended}</span>
                                        </div>
                                        <div className={styles.companyStatCard}>
                                            <span className={styles.companyStatLabel}>Total Drives Attended</span>
                                            <span className={styles.companyStatValue}>{companyStats.totalDrivesAttended}</span>
                                        </div>
                                        <div className={styles.companyStatCard}>
                                            <span className={styles.companyStatLabel}>Shortlisted Count</span>
                                            <span className={styles.companyStatValue}>{companyStats.shortlistedCount}</span>
                                        </div>
                                        <div className={styles.companyStatCard}>
                                            <span className={styles.companyStatLabel}>Preferred Mode</span>
                                            <span className={styles.companyStatValue}>{companyStats.preferredModeOfDrive}</span>
                                        </div>
                                        <div className={styles.companyStatCardEmpty}>
                                            <span className={styles.companyStatLabel}>#Last Drive Attended</span>
                                            <span className={styles.companyStatValueEmpty}>{companyStats.lastDriveAttended}</span>
                                        </div>
                                        <div className={styles.companyStatCardEmpty}>
                                            <span className={styles.companyStatLabel}>#Last Drive Result</span>
                                            <span className={styles.companyStatValueEmpty}>{companyStats.lastDriveResult}</span>
                                        </div>
                                    </div>
                                    <div className={styles.companyBottomRow}>
                                        <div className={styles.successRateWrapper}>
                                            <div className={styles.successRateCircleContainer}>
                                                <svg className={styles.successRateSvg} viewBox="0 0 120 120">
                                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e8e8e8" strokeWidth="10" />
                                                    <circle
                                                        cx="60" cy="60" r="50" fill="none"
                                                        stroke="#4EA24E"
                                                        strokeWidth="10"
                                                        strokeLinecap="round"
                                                        strokeDasharray="314.16"
                                                        strokeDashoffset={314.16 * (1 - successRate / 100)}
                                                        transform="rotate(-90 60 60)"
                                                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                                                    />
                                                </svg>
                                                <div className={styles.successRateInner}>
                                                    <span className={styles.successRateLabel}>Success Rate %</span>
                                                    <span className={styles.successRateNum}>{successRate}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.performanceInsightsCard}>
                                            <h4 className={styles.insightsTitle}>Top performance Insights</h4>
                                            <div className={styles.insightRow}>
                                                <span className={styles.insightLabel}>Highest Package Drive :</span>
                                                <span className={styles.insightValue}>{companyStats.highestPackageDrive} LPA</span>
                                            </div>
                                            <div className={styles.insightRow}>
                                                <span className={styles.insightLabel}>Total Rounds Cleared :</span>
                                                <span className={styles.insightValue}>{companyStats.totalRoundsCleared}</span>
                                            </div>
                                        </div>
                                        <button type="button" className={styles.viewAnalysisBtn} onClick={() => setShowAnalysis(true)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.viewAnalysisIcon}>
                                                <path d="M3 13h2v7H3v-7zm4-5h2v12H7V8zm4-3h2v15h-2V5zm4 6h2v9h-2v-9z"/>
                                            </svg>
                                            <span>View Analysis</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* â”€â”€ Analysis Panel (inline) â”€â”€ */}
                                    <div className={styles.anlsHeader}>
                                        <h3 className={styles.sectionHeader} style={{ marginBottom: 0, paddingBottom: '6px' }}>Analysis</h3>
                                        <div className={styles.anlsTitleRow}>
                                            <span className={`${styles.anlsPlacedBadge} ${isStudentPlaced ? styles.anlsPlacedBadgePlaced : styles.anlsPlacedBadgeNotPlaced}`}><span className={`${styles.anlsPlacedDot} ${isStudentPlaced ? styles.anlsPlacedDotPlaced : styles.anlsPlacedDotNotPlaced}`} />{isStudentPlaced ? 'Placed' : 'Not placed'}</span>
                                            <button type="button" className={styles.anlsBackBtn} onClick={() => setShowAnalysis(false)}>Back â†©</button>
                                        </div>
                                    </div>

                                    <div className={styles.anlsGrid}>
                                        {/* Left: Pie Chart */}
                                        <div
                                            className={styles.anlsPieCol}
                                            onMouseLeave={() => { if (!selectedRound) setHoveredRound(null); }}
                                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                                        >
                                            <ResponsiveContainer width="100%" height={isMobile ? 300 : 330}>
                                                <PieChart tabIndex={-1} style={{ outline: 'none' }}>
                                                    <Pie
                                                        data={PIE_DATA}
                                                        cx="50%" cy="50%" outerRadius={isMobile ? 130 : 148} dataKey="value"
                                                        animationBegin={0} animationDuration={800}
                                                        isAnimationActive={false}
                                                        labelLine={false}
                                                        activeIndex={-1}
                                                        activeShape={null}
                                                        onMouseEnter={(data, index) => {
                                                            if (!selectedRound) setHoveredRound(PIE_DATA[index].name);
                                                        }}
                                                        onClick={(data, index) => {
                                                            const name = PIE_DATA[index].name;
                                                            setSelectedRound(name);
                                                            setHoveredRound(name);
                                                        }}
                                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, name }) => {
                                                            const RADIAN = Math.PI / 180;
                                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
                                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                            let rot = -midAngle;
                                                            rot = ((rot % 360) + 360) % 360;
                                                            if (rot > 180) rot -= 360;
                                                            if (rot > 90) rot -= 180;
                                                            if (rot < -90) rot += 180;
                                                            const label = name.length > 12 ? `${name.slice(0, 12)}..` : name;
                                                            const fs = isMobile ? 11 : 11;
                                                            return (
                                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight="700" transform={`rotate(${rot}, ${x}, ${y})`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)', userSelect: 'none', pointerEvents: 'none' }}>
                                                                    {label}
                                                                </text>
                                                            );
                                                        }}
                                                    >
                                                        {PIE_DATA.map((entry, i) => {
                                                            const activeRound = selectedRound || hoveredRound;
                                                            const isActive = !activeRound || entry.name === activeRound;
                                                            return (
                                                                <Cell
                                                                    key={i}
                                                                    fill={isActive ? entry.color : '#BDBDBD'}
                                                                    style={{ cursor: 'pointer', outline: 'none' }}
                                                                />
                                                            );
                                                        })}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {selectedRound && (
                                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-4px' }}>
                                                    <button
                                                        type="button"
                                                        className={styles.anlsClearBtn}
                                                        onClick={() => { setSelectedRound(null); setHoveredRound(null); }}
                                                    >
                                                        âœ• Clear Selection
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: stats + legend */}
                                        <div className={styles.anlsRightCol}>
                                            <div className={styles.anlsRightTop}>
                                                {/* Left column: Stats grid OR Companies card on click */}
                                                {selectedRound && ROUND_DETAILS[selectedRound] ? (
                                                    <div className={styles.anlsCompaniesCard} style={{ borderColor: PIE_DATA.find(d => d.name === selectedRound)?.color }}>
                                                        <h4 className={styles.anlsCompaniesTitle}>{selectedRound} Companies</h4>
                                                        <div className={styles.anlsCompaniesList}>
                                                            {ROUND_DETAILS[selectedRound].companies.map(c => {
                                                                const sColor = c.status === 'PASSED' ? '#10B981' : c.status === 'FAILED' ? '#EF4444' : '#94A3B8';
                                                                return (
                                                                    <div key={c.name} className={styles.anlsCompanyRow}>
                                                                        <span className={styles.anlsCompanyDot} style={{ background: sColor }} />
                                                                        <span className={styles.anlsCompanyName}>{c.name}</span>
                                                                        <span className={styles.anlsCompanyStatus} style={{ color: sColor }}>{c.status}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={styles.anlsStatsGrid}>
                                                        <div className={`${styles.anlsStatCard} ${styles.anlsCardLavender}`}>
                                                            <div className={styles.anlsStatTop}>
                                                                <svg className={styles.anlsStatIcon} viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="9" cy="7" r="4" stroke="#6C63FF" strokeWidth="1.8"/>
                                                                    <path d="M2 20c0-4 3.134-7 7-7" stroke="#6C63FF" strokeWidth="1.8" strokeLinecap="round"/>
                                                                    <path d="M16 13l2 2 4-4" stroke="#6C63FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                                <span className={styles.anlsStatLabel}>Attended</span>
                                                            </div>
                                                            <div className={styles.anlsStatValue}>{companyStats.totalDrivesAttended}</div>
                                                        </div>
                                                        <div className={`${styles.anlsStatCard} ${styles.anlsCardBlue}`}>
                                                            <div className={styles.anlsStatTop}>
                                                                <svg className={styles.anlsStatIcon} viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="12" cy="12" r="9" stroke="#2085f6" strokeWidth="1.8"/>
                                                                    <path d="M8 12l3 3 5-5" stroke="#2085f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                                <span className={styles.anlsStatLabel}>Shortlisted</span>
                                                            </div>
                                                            <div className={styles.anlsStatValue}>{companyStats.shortlistedCount}</div>
                                                        </div>
                                                        <div className={`${styles.anlsStatCard} ${styles.anlsCardPink}`}>
                                                            <div className={styles.anlsStatTop}>
                                                                <svg className={styles.anlsStatIcon} viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="12" cy="12" r="9" stroke="#E05C6C" strokeWidth="1.8"/>
                                                                    <path d="M12 8v4" stroke="#E05C6C" strokeWidth="1.8" strokeLinecap="round"/>
                                                                    <circle cx="12" cy="16" r="0.8" fill="#E05C6C"/>
                                                                </svg>
                                                                <span className={styles.anlsStatLabel}>Work On</span>
                                                            </div>
                                                            <ul className={styles.anlsStatList}>
                                                                {driveAnalytics.workOn.map((item) => <li key={item}><span className={styles.anlsArrow}>â†’</span>{item}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div className={`${styles.anlsStatCard} ${styles.anlsCardMint}`}>
                                                            <div className={styles.anlsStatTop}>
                                                                <svg className={styles.anlsStatIcon} viewBox="0 0 24 24" fill="none">
                                                                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="#27AE8C" strokeWidth="1.6" strokeLinejoin="round"/>
                                                                </svg>
                                                                <span className={styles.anlsStatLabel}>Best</span>
                                                            </div>
                                                            <ul className={styles.anlsStatList}>
                                                                {driveAnalytics.bestAt.map((item) => <li key={item}><span className={styles.anlsArrow}>â†’</span>{item}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Right column: Achievement+LastActivity OR Good/Bad on click */}
                                                {selectedRound && ROUND_DETAILS[selectedRound] ? (
                                                    <div className={styles.anlsAchievCol}>
                                                        <div className={styles.anlsGoodCard}>
                                                            <div className={styles.anlsGoodBadHeader}>
                                                                <span className={styles.anlsGoodIcon}>ðŸ‘</span>
                                                                <span className={styles.anlsGoodLabel}>GOOD</span>
                                                            </div>
                                                            {ROUND_DETAILS[selectedRound].good.map((g, i) => (
                                                                <div key={i} className={styles.anlsGoodItem}>
                                                                    <span className={styles.anlsCheckIcon}>âœ…</span>
                                                                    <span>{g}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className={styles.anlsBadCard}>
                                                            <div className={styles.anlsGoodBadHeader}>
                                                                <span className={styles.anlsGoodIcon}>ðŸ‘Ž</span>
                                                                <span className={styles.anlsBadLabel}>BAD</span>
                                                            </div>
                                                            {ROUND_DETAILS[selectedRound].bad.map((b, i) => (
                                                                <div key={i} className={styles.anlsBadItem}>
                                                                    <span className={styles.anlsCheckIcon}>âŒ</span>
                                                                    <span>{b}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={styles.anlsAchievCol}>
                                                        <div className={styles.anlsAchievBanner}>
                                                            <div>
                                                                <p className={styles.anlsAchievMeta}>BEST ACHIEVEMENT</p>
                                                                <div className={styles.anlsAchievMain}>
                                                                    <span className={styles.anlsAchievLPA}>{companyStats.highestPackageDrive > 0 ? `${companyStats.highestPackageDrive} LPA` : 'N/A'}</span>
                                                                    <span className={styles.anlsAchievSub}>Highest Package</span>
                                                                </div>
                                                                <div className={styles.anlsAchievCompany}>
                                                                    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm2-4h14v-2H5v2zm0-4h14V7H5v2zm2-7v2h10V2H7z"/></svg>
                                                                    <span>{driveAnalytics.highestPackageCompany || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                            <div className={styles.anlsAchievBadge}>
                                                                <img src={BestAchievement} alt="Best Achievement" width="40" height="40" style={{ objectFit: 'contain' }} />
                                                            </div>
                                                        </div>
                                                        <div className={styles.anlsLastActivity}>
                                                            <p className={styles.anlsLastTitle}>LAST ACTIVITY</p>
                                                            <p className={styles.anlsLastCompany}>{companyStats.lastDriveAttended || 'N/A'}</p>
                                                            <p className={styles.anlsLastRole}>{driveAnalytics.lastDriveRole || 'N/A'}</p>
                                                            <span className={styles.anlsLastBadge}>{companyStats.lastDriveResult || 'Pending'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Legend always visible */}
                                            <div className={styles.anlsLegendBox}>
                                                <div className={styles.anlsLegend}>
                                                    {PIE_DATA.map((d) => (
                                                        <div
                                                            key={d.name}
                                                            role="button"
                                                            tabIndex={0}
                                                            className={`${styles.anlsLegendItem} ${selectedRound === d.name ? styles.anlsLegendItemActive : ''}`}
                                                            onClick={() => {
                                                                setSelectedRound(d.name);
                                                                setHoveredRound(d.name);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setSelectedRound(d.name);
                                                                    setHoveredRound(d.name);
                                                                }
                                                            }}
                                                            aria-label={`Open ${d.name} round details`}
                                                        >
                                                            <span className={styles.anlsLegendCircle} style={{ background: d.color }}>{d.value}%</span>
                                                            <span className={styles.anlsLegendName}>{d.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Stepper */}
                                    <div className={styles.anlsStepper}>
                                        {[
                                            { label:'Applied',   s:'done'    },
                                            { label:'Attended',  s:'done'    },
                                            { label:'Interview', s:'current' },
                                            { label:'Result',    s:'pending' },
                                        ].map((step, i, arr) => (
                                            <React.Fragment key={step.label}>
                                                <div className={styles.anlsStepItem}>
                                                    <div className={`${styles.anlsStepCircle} ${step.s === 'done' ? styles.anlsStep_done : step.s === 'current' ? styles.anlsStep_current : styles.anlsStep_pending}`}>
                                                        {step.s === 'done' ? (
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
                                                        ) : step.s === 'current' ? (
                                                            <span className={styles.anlsStepDot}/>
                                                        ) : null}
                                                    </div>
                                                    <span className={`${styles.anlsStepLabel} ${step.s === 'done' ? styles.anlsStepLbl_done : step.s === 'current' ? styles.anlsStepLbl_current : styles.anlsStepLbl_pending}`}>{step.label}</span>
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <div className={`${styles.anlsStepLine} ${arr[i+1].s === 'pending' ? styles.anlsStepLinePending : styles.anlsStepLineDone}`}/>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        )}

                        {/* --- SKILLS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Skills</h3>
                            <div className={styles.skillsGrid}>
                                {skills.map((skill, index) => (
                                    <div key={index} className={styles.skillCard}>
                                        <input
                                            type="text"
                                            className={styles.skillInput}
                                            value={skill}
                                            onChange={(e) => handleSkillChange(index, e.target.value)}
                                            placeholder={`Skill ${index + 1}`}
                                            disabled={isSaving}
                                        />
                                        {isEditMode && (
                                            <button
                                                type="button"
                                                className={styles.removeSkillBtn}
                                                onClick={() => handleRemoveSkill(index)}
                                                disabled={isSaving}
                                                aria-label="Remove skill"
                                            >
                                                <svg viewBox="0 0 512 512" fill="currentColor" style={{width:'14px',height:'14px'}}><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"/></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isEditMode && (
                                    <button
                                        type="button"
                                        className={styles.addSkillBtn}
                                        onClick={handleAddSkill}
                                        disabled={isSaving}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:'22px',height:'22px',flexShrink:0}}>
                                            <circle cx="12" cy="12" r="10" fill="white" stroke="white"/>
                                            <line x1="12" y1="7" x2="12" y2="17" stroke="#4EA24E" strokeWidth="2.5"/>
                                            <line x1="7" y1="12" x2="17" y2="12" stroke="#4EA24E" strokeWidth="2.5"/>
                                        </svg>
                                        <span>Click to Add Skill</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- OTHER DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Other Details</h3>
                            <div className={styles.formGrid}>
                                    <div className={styles.field}>
                                        <label>Residential Status <RequiredStar /></label>
                                        <select
                                            name="residentialStatus"
                                            value={studentData?.residentialStatus || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, residentialStatus: e.target.value }))}
                                            disabled={isSaving}
                                        >
                                            <option value="" disabled>Residential status</option>
                                            <option value="Hosteller">Hosteller</option>
                                            <option value="Dayscholar">Dayscholar</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Quota <RequiredStar /></label>
                                        <>
                                            <select
                                                name="quota"
                                                value={studentData?.quota || ''}
                                                disabled
                                                className={styles.readOnlyInput}
                                            >
                                                <option value="" disabled>Quota</option>
                                                <option value="Management">Management</option>
                                                <option value="Counselling">Counselling</option>
                                            </select>
                                            <input type="hidden" name="quota" value={studentData?.quota || ''} />
                                        </>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Spoken Languages</label>
                                        <input
                                            type="text"
                                            name="languagesKnown"
                                            placeholder="Exclude Tamil & English"
                                            value={studentData?.languagesKnown || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, languagesKnown: e.target.value }))}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>First Graduate <RequiredStar /></label>
                                        <>
                                            <select
                                                name="firstGraduate"
                                                value={studentData?.firstGraduate || ''}
                                                disabled
                                                className={styles.readOnlyInput}
                                            >
                                                <option value="" disabled>First Graduate</option>
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                            <input type="hidden" name="firstGraduate" value={studentData?.firstGraduate || ''} />
                                        </>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Passport No.</label>
                                        <input
                                            type="text"
                                            name="passportNo"
                                            placeholder="Enter Passport No."
                                            value={studentData?.passportNo || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, passportNo: e.target.value }))}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Skill Set <RequiredStar /></label>
                                        <input
                                            type="text"
                                            name="skillSet"
                                            placeholder="Enter Skill Set"
                                            value={studentData?.skillSet || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, skillSet: e.target.value }))}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Value Added Courses</label>
                                        <input
                                            type="text"
                                            name="valueAddedCourses"
                                            placeholder="Enter Value Added Courses"
                                            value={studentData?.valueAddedCourses || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, valueAddedCourses: e.target.value }))}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>About Sibling</label>
                                        <input
                                            type="text"
                                            name="aboutSibling"
                                            placeholder="Enter About Sibling"
                                            value={studentData?.aboutSibling || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, aboutSibling: e.target.value }))}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Ration Card No. <RequiredStar /></label>
                                        <input
                                            type="text"
                                            name="rationCardNo"
                                            placeholder="Enter Ration Card No."
                                            value={studentData?.rationCardNo || ''}
                                            readOnly
                                            className={styles.readOnlyInput}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Family Annual Income <RequiredStar /></label>
                                        <input
                                            type="text"
                                            name="familyAnnualIncome"
                                            placeholder="Enter Family Annual Income"
                                            value={studentData?.familyAnnualIncome || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, familyAnnualIncome: e.target.value }))}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>PAN No. <RequiredStar /></label>
                                        <input
                                            type="text"
                                            name="panNo"
                                            placeholder="Enter PAN No."
                                            value={studentData?.panNo || ''}
                                            readOnly
                                            className={styles.readOnlyInput}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Willing to Sign Bond <RequiredStar /></label>
                                        <>
                                            <select
                                                name="willingToSignBond"
                                                value={studentData?.willingToSignBond || ''}
                                                disabled
                                                className={styles.readOnlyInput}
                                            >
                                                <option value="" disabled>Willing to Sign Bond</option>
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                            <input type="hidden" name="willingToSignBond" value={studentData?.willingToSignBond || ''} />
                                        </>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Preferred Mode of Drive <RequiredStar /></label>
                                        <>
                                            <select
                                                name="preferredModeOfDrive"
                                                value={studentData?.preferredModeOfDrive || ''}
                                                disabled
                                                className={styles.readOnlyInput}
                                            >
                                                <option value="" disabled>Preferred Mode of Drive</option>
                                                <option value="On-Campus">On-Campus</option>
                                                <option value="Off-Campus">Off-Campus</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                            <input type="hidden" name="preferredModeOfDrive" value={studentData?.preferredModeOfDrive || ''} />
                                        </>
                                    </div>
                                    <div className={styles.field}>
                                        <label>GitHub Link</label>
                                        <input
                                            type="url"
                                            name="githubLink"
                                            placeholder="Enter GitHub Link (e.g. https://github.com/username)"
                                            value={studentData?.githubLink || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, githubLink: e.target.value }))}
                                            onBlur={(e) => {
                                                const val = e.target.value.trim();
                                                if (val && !GITHUB_URL_REGEX.test(val)) {
                                                    e.target.style.borderColor = '#dc3545';
                                                    e.target.title = 'Must be: https://github.com/your-username';
                                                    setUrlErrorType('GitHub');
                                                    setInvalidUrl(val);
                                                    setURLErrorPopupOpen(true);
                                                } else {
                                                    e.target.style.borderColor = val ? '#28a745' : '';
                                                    e.target.title = '';
                                                }
                                            }}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>LinkedIn Link</label>
                                        <input
                                            type="url"
                                            name="linkedinLink"
                                            placeholder="Enter LinkedIn Link (e.g. https://linkedin.com/in/username)"
                                            value={studentData?.linkedinLink || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, linkedinLink: e.target.value }))}
                                            onBlur={(e) => {
                                                const val = e.target.value.trim();
                                                if (val && !LINKEDIN_URL_REGEX.test(val)) {
                                                    e.target.style.borderColor = '#dc3545';
                                                    e.target.title = 'Must be: https://linkedin.com/in/your-username';
                                                    setUrlErrorType('LinkedIn');
                                                    setInvalidUrl(val);
                                                    setURLErrorPopupOpen(true);
                                                } else {
                                                    e.target.style.borderColor = val ? '#28a745' : '';
                                                    e.target.title = '';
                                                }
                                            }}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className={styles.checkboxGroup}>
                                        <span className={styles.checkboxGroupLabel}>Preferred Training</span>
                                        <div className={styles.checkboxOptions}>
                                            {PREFERRED_TRAINING_OPTIONS.map((option) => (
                                                <label key={option} className={styles.checkboxOption}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTrainings.includes(option)}
                                                        readOnly
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.checkboxGroup}>
                                        <span className={styles.checkboxGroupLabel}>Company Types <RequiredStar /></span>
                                        <div className={styles.checkboxOptions}>
                                            {COMPANY_TYPE_OPTIONS.map((option) => (
                                                <label key={option} className={styles.checkboxOption}>
                                                    <input
                                                        type="checkbox"
                                                        name="companyTypesReadonly"
                                                        checked={selectedCompanyTypes.includes(option)}
                                                        readOnly
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.checkboxGroup}>
                                        <span className={styles.checkboxGroupLabel}>Preferred Job Locations <RequiredStar /></span>
                                        <div className={styles.checkboxOptions}>
                                            {JOB_LOCATION_OPTIONS.map((option) => (
                                                <label key={option} className={styles.checkboxOption}>
                                                    <input
                                                        type="checkbox"
                                                        name="jobLocationsReadonly"
                                                        checked={selectedJobLocations.includes(option)}
                                                        readOnly
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <input type="hidden" name="companyTypes" value={companyTypesHiddenValue} />
                                    <input type="hidden" name="preferredJobLocation" value={jobLocationsHiddenValue} />
                            </div>
                        </div>

                        {/* --- LOGIN DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Login Details</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label>Registration Number <RequiredStar /></label>
                                    <input
                                        type="text"
                                        name="loginRegNo"
                                        value={studentData?.regNo || ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Login Password <RequiredStar /></label>
                                    <input
                                        type="text"
                                        name="loginPassword"
                                        value={studentData?.loginPassword || ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Confirm Password <RequiredStar /></label>
                                    <input
                                        type="text"
                                        name="confirmPassword"
                                        value={studentData?.confirmPassword || studentData?.loginPassword || ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                </div>
                            </div>
                        </div>

                        {isEditMode && (
                            <div className={styles.actionButtons}>
                                <button
                                    type="button"
                                    className={styles.discardBtn}
                                    onClick={handleDiscard}
                                    disabled={isSaving}
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className={styles.saveBtn}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <FileSizeErrorPopup
                isOpen={isFileSizeErrorOpen}
                onClose={() => setIsFileSizeErrorOpen(false)}
                fileSizeKB={fileSizeErrorKB}
            />
            <URLValidationErrorPopup
                isOpen={isURLErrorPopupOpen}
                onClose={() => setURLErrorPopupOpen(false)}
                urlType={urlErrorType}
                invalidUrl={invalidUrl}
            />
            <ResumeChooserModal
                isOpen={isResumeChooserOpen}
                onClose={closeResumePopup}
                onView={handleResumeView}
                onDownload={handleResumeDownload}
                isProcessing={isResumeDownloading}
                activeAction={resumeActionType}
            />
            <ResumeFailedAlert
                isOpen={isResumeFailureOpen}
                onClose={() => setIsResumeFailureOpen(false)}
            />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
            <DownloadSuccessAlert
                isOpen={isResumeDownloadSuccessOpen}
                onClose={() => setIsResumeDownloadSuccessOpen(false)}
                fileLabel="resume"
                title="Downloaded !"
                description="The resume has been successfully downloaded to your device."
                color="#4EA24E"
            />
            <CertificateDownloadProgressAlert
                isOpen={isInitialLoading}
                progress={loadingProgress}
                fileLabel="student profile"
                title="Loading..."
                color="#4EA24E"
                progressColor="#4EA24E"
                messages={{
                    initial: 'Fetching student profile...',
                    mid: 'Loading latest record...',
                    final: 'Preparing page...'
                }}
            />
            {showUnsavedModal && (
                <UnsavedChangesModal
                    changedFields={getChangedFields()}
                    onDiscard={() => {
                        setShowUnsavedModal(false);
                        performViewChange(pendingNavView);
                    }}
                    onSave={() => {
                        afterSaveNavRef.current = pendingNavView;
                        setShowUnsavedModal(false);
                        formRef.current?.requestSubmit();
                    }}
                />
            )}
        </div>
    );
}

export default AdminStuProfileView;