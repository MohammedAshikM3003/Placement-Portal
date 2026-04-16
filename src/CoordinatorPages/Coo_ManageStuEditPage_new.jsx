import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { API_BASE_URL } from '../utils/apiConfig';

import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import styles from './Coo_ManageStuEditPage_new.module.css'; // Module Import
import '../components/alerts/AlertStyles.css';
import Adminicons from '../assets/Adminicon.png';
import BestAchievement from '../assets/BestAchievementicon.svg';
import StuEyeIcon from '../assets/Coordviewicon.svg';
import StuUploadMarksheetIcon from '../assets/StuUploadMarksheeticon.svg';
import mongoDBService from '../services/mongoDBService.jsx';
import fastDataService from '../services/fastDataService.jsx';
import gridfsService from '../services/gridfsService';
import FieldUpdateBanner from '../components/alerts/FieldUpdateBanner';
import CoordinatorUnsavedChangesAlert from '../components/alerts/CoordinatorUnsavedChangesAlert';
import CoordinatorSaveSuccessAlert from '../components/alerts/CoordinatorSaveSuccessAlert';
import {
    DownloadSuccessAlert,
    DownloadFailedAlert
} from '../components/alerts/DownloadPreviewAlerts';
import {
    PreviewProgressAlert,
    PreviewFailedAlert,
    CertificateDownloadProgressAlert,
    CertificateDownloadSuccessAlert,
    DownloadFailedAlert as ActionDownloadFailedAlert
} from '../components/alerts';

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

const normalizeTrainingCourseName = (value) => (value || '').toString().trim();

const normalizeTrainingYearToken = (value = '') => {
    const raw = value.toString().trim().toUpperCase();
    if (!raw) return '';

    const compact = raw.replace(/[^A-Z0-9]/g, '');
    if (!compact) return '';

    const yearAliases = {
        '1': 'I', '01': 'I', '1ST': 'I', '1STYEAR': 'I', 'FIRST': 'I', 'FIRSTYEAR': 'I', 'I': 'I',
        '2': 'II', '02': 'II', '2ND': 'II', '2NDYEAR': 'II', 'SECOND': 'II', 'SECONDYEAR': 'II', 'II': 'II',
        '3': 'III', '03': 'III', '3RD': 'III', '3RDYEAR': 'III', 'THIRD': 'III', 'THIRDYEAR': 'III', 'III': 'III',
        '4': 'IV', '04': 'IV', '4TH': 'IV', '4THYEAR': 'IV', 'FOURTH': 'IV', 'FOURTHYEAR': 'IV', 'IV': 'IV'
    };

    return yearAliases[compact] || compact;
};

const normalizeTrainingPhaseKey = (value) => {
    const text = (value || '').toString().trim();
    const match = text.match(/\d+/);
    return match ? match[0] : text.toLowerCase();
};

const parseTrainingDurationToDays = (durationValue) => {
    const raw = (durationValue || '').toString().trim().toLowerCase();
    if (!raw) return 0;

    const match = raw.match(/\d+/);
    if (!match) return 0;

    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getInclusiveDaysBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / dayMs);
    return diffDays >= 0 ? diffDays + 1 : 0;
};

const normalizeProfilePicValue = (value) => {
    const raw = (value || '').toString().trim();
    if (!raw) return '';

    // Ignore temporary/browser-only representations for dirty checking
    if (raw.startsWith('blob:') || raw.startsWith('data:')) return '';

    // Normalize to stable relative GridFS path so full URL and relative path compare equal
    const apiPathMatch = raw.match(/\/api\/file\/[a-f0-9]+/i);
    if (apiPathMatch) return apiPathMatch[0].toLowerCase();

    const filePathMatch = raw.match(/\/file\/([a-f0-9]+)/i);
    if (filePathMatch) return `/api/file/${filePathMatch[1].toLowerCase()}`;

    return raw.toLowerCase();
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

const SuccessPopup = ({ isOpen, onClose }) => (
    <CoordinatorSaveSuccessAlert
        isOpen={isOpen}
        onClose={onClose}
    />
);

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
            color="#D23B42"
        />
        <DownloadFailedAlert
            isOpen={downloadPopupState === 'error'}
            onClose={() => setDownloadPopupState('none')}
            color="#2563EB"
        />
        </>
    );
};

const CropImageModal = ({ isOpen, imageSrc, onCrop, onClose, onDiscard }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(1); // 1:1
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = useCallback(async () => {
        if (!imageSrc || !croppedAreaPixels) {
            console.error('Missing imageSrc or croppedAreaPixels');
            return;
        }

        try {
            const image = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.error('Failed to get canvas context');
                return;
            }

            // Calculate the canvas size based on the cropped area
            const { width, height, x, y } = croppedAreaPixels;

            // Set canvas dimensions to the crop size
            canvas.width = width;
            canvas.height = height;

            // Draw the image on canvas
            ctx.save();

            // If there's rotation, apply it
            if (rotation !== 0) {
                const centerX = width / 2;
                const centerY = height / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.translate(-centerX, -centerY);
            }

            ctx.drawImage(
                image,
                x,
                y,
                width,
                height,
                0,
                0,
                width,
                height
            );

            ctx.restore();

            // Convert canvas to blob
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        console.error('Canvas is empty');
                        return;
                    }
                    console.log('âœ… Cropped blob created:', blob.size, 'bytes');
                    resolve(blob);
                }, 'image/jpeg', 0.95);
            });
        } catch (error) {
            console.error('Error creating cropped image:', error);
            return null;
        }
    }, [imageSrc, croppedAreaPixels, rotation]);

    const handleSaveCrop = async () => {
        try {
            const croppedBlob = await createCroppedImage();
            if (croppedBlob) {
                onCrop(croppedBlob);
                onClose();
            } else {
                console.error('Failed to create cropped image');
            }
        } catch (err) {
            console.error('Crop save error:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.cropOverlay} onClick={onClose}>
            <div className={styles.cropContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.cropHeader}>Crop Image</div>

                <div className={styles.cropContent}>
                    <div className={styles.cropPreviewArea}>
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                onCropComplete={onCropComplete}
                                cropShape="rect"
                                restrictPosition={true}
                                showGrid={true}
                            />
                        )}
                    </div>

                    <div className={styles.cropControls}>
                        <div className={styles.controlGroup}>
                            <label className={styles.controlLabel}>Rotate</label>
                            <div className={styles.rotateControl}>
                                <button
                                    onClick={() => setRotation((r) => (r - 10 + 360) % 360)}
                                    className={styles.rotateBtn}
                                    title="Rotate left"
                                >
                                    â†º
                                </button>
                                <span className={styles.angleValue}>{rotation}Â°</span>
                                <button
                                    onClick={() => setRotation((r) => (r + 10) % 360)}
                                    className={styles.rotateBtn}
                                    title="Rotate right"
                                >
                                    â†»
                                </button>
                            </div>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className={styles.angleSlider}
                            />
                            <button
                                onClick={() => setRotation(0)}
                                className={styles.resetBtn}
                            >
                                Reset
                            </button>
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.controlLabel}>Aspect Ratio</label>
                            <div className={styles.aspectRatioButtons}>
                                <button
                                    onClick={() => setAspect(null)}
                                    className={`${styles.aspectBtn} ${aspect === null ? styles.active : ''}`}
                                    title="Custom"
                                >
                                    Custom
                                </button>
                                <button
                                    onClick={() => setAspect(1)}
                                    className={`${styles.aspectBtn} ${aspect === 1 ? styles.active : ''}`}
                                    title="1:1"
                                >
                                    1:1
                                </button>
                                <button
                                    onClick={() => setAspect(4 / 3)}
                                    className={`${styles.aspectBtn} ${aspect === 4 / 3 ? styles.active : ''}`}
                                    title="4:3"
                                >
                                    4:3
                                </button>
                                <button
                                    onClick={() => setAspect(3 / 4)}
                                    className={`${styles.aspectBtn} ${aspect === 3 / 4 ? styles.active : ''}`}
                                    title="3:4"
                                >
                                    3:4
                                </button>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.controlLabel}>Zoom</label>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className={styles.zoomSlider}
                            />
                            <span className={styles.zoomValue}>{(zoom * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                <div className={styles.cropFooter}>
                    <button onClick={onDiscard} className={`${styles.cropBtn} ${styles.discardBtn}`}>
                        Discard
                    </button>
                    <button onClick={handleSaveCrop} className={`${styles.cropBtn} ${styles.uploadBtn}`}>
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper function to create an image from a source
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

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

const ResumeChooserModal = ({ isOpen, onClose, onView, onDownload, isProcessing, activeAction }) => {
    if (!isOpen) return null;

    return (
        <div className="alert-overlay" onClick={onClose}>
            <div className="achievement-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="achievement-popup-header" style={{ backgroundColor: '#D23B42' }}>
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
                                if (isProcessing) {
                                    return;
                                }
                                if (typeof onView === 'function') {
                                    onView();
                                }
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
                                if (isProcessing) {
                                    return;
                                }
                                if (typeof onDownload === 'function') {
                                    onDownload();
                                }
                            }}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: '#D23B42',
                                color: '#fff',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing && activeAction !== 'download' ? 0.75 : 1,
                                boxShadow: '0 2px 8px rgba(210, 59, 66, 0.28)',
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
    skills: 'Skills', profilePicURL: 'Profile Photo',
};

function Coo_ManageStuEditPage({ onLogout, onViewChange }) {
    const { studentId } = useParams(); // Get studentId from URL params
    const navigate = useNavigate();
    const location = window.location;

    // Check if we're in view mode (URL contains /view/)
    const isViewMode = location.pathname.includes('/view/');

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
    const [studentData, setStudentData] = useState(null); // No localStorage cache for coordinator
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [degrees, setDegrees] = useState([]);
    const [selectedDegree, setSelectedDegree] = useState('');
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
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
    const [studentTrainingPhaseMetaMap, setStudentTrainingPhaseMetaMap] = useState({});
    const savedDataRef = useRef(null);
    const afterSaveNavRef = useRef(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavView, setPendingNavView] = useState(null);
    const [isResumeChooserOpen, setIsResumeChooserOpen] = useState(false);
    const [isResumeProcessing, setIsResumeProcessing] = useState(false);
    const [resumeActionType, setResumeActionType] = useState('');
    const [resumePreviewPopupState, setResumePreviewPopupState] = useState('none');
    const [resumePreviewProgress, setResumePreviewProgress] = useState(0);
    const [resumeDownloadPopupState, setResumeDownloadPopupState] = useState('none');
    const [resumeDownloadProgress, setResumeDownloadProgress] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(15);

    // Crop Modal State
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [hasNewProfilePhoto, setHasNewProfilePhoto] = useState(false); // Track if user uploaded new photo

    // Field Update Banner & Unsaved Changes Tracking
    const [originalFormData, setOriginalFormData] = useState(null);
    const [originalSkills, setOriginalSkills] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [changedFieldsList, setChangedFieldsList] = useState([]);

    /**
     * Detects which fields have changed between original and current form data
     * @param {Object} original - Original student data
     * @param {Object} current - Current form data
     * @returns {Array} - Array of user-friendly field labels that were changed
     */
    const detectChangedFields = useCallback((original, current) => {
        if (!original || !current) return [];

        const changedFields = [];

        // Field mapping with exact form labels
        const fieldLabels = {
            // Basic Information
            firstName: 'First Name',
            lastName: 'Last Name',
            regNo: 'Register Number',
            batch: 'Batch',
            degree: 'Degree',
            branch: 'Branch',
            section: 'Section',
            gender: 'Gender',

            // Academic Information
            currentYear: 'Current Year',
            currentSemester: 'Current Semester',
            cgpa: 'CGPA',
            gpa: 'GPA',
            overallCGPA: 'CGPA',
            clearedBacklogs: 'No. of Backlog (Arrear Cleared)',
            currentBacklogs: 'No. of Current Backlog',
            arrearStatus: 'Arrear Status',

            // Personal Information
            address: 'Address',
            city: 'City',
            primaryEmail: 'Primary Email',
            domainEmail: 'Domain Email',
            mobileNo: 'Mobile No.',
            bloodGroup: 'Blood Group',
            aadhaarNo: 'Aadhaar Number',
            portfolioLink: 'Portfolio Link',
            community: 'Community',
            mediumOfStudy: 'Medium of Study',

            // Family Information
            fatherName: 'Father Name',
            fatherOccupation: 'Father Occupation',
            fatherMobile: 'Father Mobile No.',
            motherName: 'Mother Name',
            motherOccupation: 'Mother Occupation',
            motherMobile: 'Mother Mobile No.',
            guardianName: 'Guardian Name',
            guardianMobile: 'Guardian Number',
            aboutSibling: 'About Sibling',
            familyAnnualIncome: 'Family Annual Income',

            // 10th Details
            tenthInstitution: '10th Institution Name',
            tenthBoard: '10th Board',
            tenthPercentage: '10th Percentage',
            tenthYear: '10th Year of Passing',
            tenthMarksheet: '10th Marksheet',

            // 12th Details
            twelfthInstitution: '12th Institution Name',
            twelfthBoard: '12th Board',
            twelfthPercentage: '12th Percentage',
            twelfthYear: '12th Year of Passing',
            twelfthCutoff: '12th Cut-off Marks',
            twelfthMarksheet: '12th Marksheet',

            // Diploma Details
            diplomaInstitution: 'Diploma Institution',
            diplomaBranch: 'Diploma Branch',
            diplomaPercentage: 'Diploma Percentage',
            diplomaYear: 'Diploma Year of Passing',
            diplomaMarksheet: 'Diploma Marksheet',

            // Gap Year
            yearOfGap: 'Year of Gap',
            gapReason: 'Reason for Year of Gap',

            // Additional Information
            residentialStatus: 'Residential Status',
            quota: 'Quota',
            languagesKnown: 'Spoken Languages',
            firstGraduate: 'First Graduate',
            passportNo: 'Passport No.',
            skillSet: 'Skill Set',
            valueAddedCourses: 'Value Added Courses',
            rationCardNo: 'Ration Card No.',
            panNo: 'PAN No.',

            // Preferences
            willingToSignBond: 'Willing to Sign Bond',
            preferredModeOfDrive: 'Preferred Mode of Drive',
            companyTypes: 'Company Preferences',
            preferredJobLocation: 'Job Locations',

            // Profile Links
            githubLink: 'GitHub Link',
            linkedinLink: 'LinkedIn Link',

            // Profile Photo
            profilePicURL: 'Profile Photo'
        };

        // Check each field for changes
        Object.keys(fieldLabels).forEach(field => {
            const oldValue = original[field];
            const newValue = current[field];

            // Handle arrays (like companyTypes and preferredJobLocation)
            if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                const oldSorted = JSON.stringify([...oldValue].sort());
                const newSorted = JSON.stringify([...newValue].sort());
                if (oldSorted !== newSorted) {
                    changedFields.push(fieldLabels[field]);
                }
            }
            // Handle regular values (strings, numbers, etc.)
            else if (oldValue !== newValue) {
                if (field === 'profilePicURL') {
                    const oldNormalizedPic = normalizeProfilePicValue(oldValue);
                    const newNormalizedPic = normalizeProfilePicValue(newValue);
                    if (oldNormalizedPic !== newNormalizedPic) {
                        changedFields.push(fieldLabels[field]);
                    }
                    return;
                }

                // Only add if there's a meaningful change (not just undefined/null/empty conversions)
                const oldNormalized = oldValue?.toString()?.trim() || '';
                const newNormalized = newValue?.toString()?.trim() || '';
                if (oldNormalized !== newNormalized && newNormalized !== '') {
                    changedFields.push(fieldLabels[field]);
                }
            }
        });

        return changedFields;
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isInitialLoading) {
            return;
        }

        setLoadingProgress(15);
        const progressTimer = setInterval(() => {
            setLoadingProgress((prev) => (prev >= 90 ? 90 : prev + 8));
        }, 180);

        return () => clearInterval(progressTimer);
    }, [isInitialLoading]);

    // Detect changes in real-time when form data changes
    useEffect(() => {
        // Don't run change detection during initial loading
        if (isInitialLoading || !originalFormData || !studentData) return;

        const changed = detectChangedFields(originalFormData, studentData);

        // Track skills changes - just show "Skills" if any skill was added/removed/modified
        const currentSkillsFiltered = skills.filter(s => s.trim()).sort().join(',');
        const originalSkillsFiltered = originalSkills.filter(s => s.trim()).sort().join(',');

        if (currentSkillsFiltered !== originalSkillsFiltered && !changed.includes('Skills')) {
            changed.push('Skills');
        }

        // Track profile photo changes - only consider it changed if user uploaded a new photo
        if (hasNewProfilePhoto && !changed.includes('Profile Photo')) {
            changed.push('Profile Photo');
        }

        setChangedFieldsList(changed);
        setHasUnsavedChanges(changed.length > 0);
    }, [studentData, originalFormData, detectChangedFields, skills, originalSkills, hasNewProfilePhoto, isInitialLoading]);

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

    const jobLocationsHiddenValue = useMemo(
        () => selectedJobLocations.join(', '),
        [selectedJobLocations]
    );

    useEffect(() => {
        const fetchDegreeAndBranchData = async () => {
            try {
                const [degreeList, branchList] = await Promise.all([
                    mongoDBService.getDegrees(),
                    mongoDBService.getBranches(),
                ]);

                const sanitizedDegrees = Array.isArray(degreeList)
                    ? degreeList.map((degree) => ({
                        ...degree,
                        degreeAbbreviation: degree.degreeAbbreviation || degree.abbreviation || degree.shortName || '',
                        degreeFullName: degree.degreeFullName || degree.fullName || degree.name || '',
                    }))
                    : [];

                setDegrees(sanitizedDegrees);
                setBranches(Array.isArray(branchList) ? branchList : []);
            } catch (error) {
                console.error('Failed to fetch degree/branch data:', error);
                setDegrees([]);
                setBranches([]);
            }
        };

        fetchDegreeAndBranchData();
    }, []);

    useEffect(() => {
        if (studentData?.degree) setSelectedDegree(studentData.degree);
        if (studentData?.branch) setSelectedBranch(studentData.branch);
    }, [studentData?.degree, studentData?.branch]);

    const filteredBranches = useMemo(() => {
        if (!selectedDegree) return [];
        const normalized = selectedDegree.toLowerCase();
        return branches.filter((branch) => {
            const degree = branch?.degree?.toLowerCase?.() || '';
            const abbreviation = branch?.degreeAbbreviation?.toLowerCase?.() || '';
            return degree === normalized || abbreviation === normalized || degree.includes(normalized);
        });
    }, [branches, selectedDegree]);

    const getBranchOptionValue = useCallback((branch) => {
        if (!branch) return '';
        return branch.branchAbbreviation || branch.branchFullName || branch.branchName || branch.branch;
    }, []);

    const toggleCompanyType = useCallback((option) => {
        setStudentData((prev) => {
            const current = parseMultiValue(prev?.companyTypes);
            const updated = current.includes(option)
                ? current.filter((item) => item !== option)
                : [...current, option];
            return { ...prev, companyTypes: updated.join(', ') };
        });
    }, []);

    const toggleJobLocation = useCallback((option) => {
        setStudentData((prev) => {
            const current = parseMultiValue(prev?.preferredJobLocation);
            const updated = current.includes(option)
                ? current.filter((item) => item !== option)
                : [...current, option];
            return { ...prev, preferredJobLocation: updated.join(', ') };
        });
    }, []);

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
            if (attendanceByRegNo?.success) return attendanceByRegNo;
        }
        if (student?._id) {
            const attendanceByStudentId = await mongoDBService.getStudentAttendance(student._id);
            if (attendanceByStudentId?.success) return attendanceByStudentId;
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
        return studentAttendanceRecords.some((record) => normalizeText(record?.status) === 'absent' && normalizeText(record?.companyName) === driveCompany);
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
            if (!current || rank[status] > rank[current]) companiesMap.set(companyName, status);
        };

        let totalRoundsCleared = 0;
        let shortlistedCount = 0;
        let highestPackageLpa = 0;
        let highestPackageCompany = '';
        let lastDriveDate = '';
        let lastDriveAttended = '';
        let lastDriveRole = '';
        let lastDriveResult = '';

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

            if (overallStatus === 'Placed' || overallStatus.startsWith('Passed-')) shortlistedCount += 1;

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
                if (roundStatus && roundStatus !== 'pending' && roundStatus !== 'not eligible') bucket.attempted += 1;

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

        return {
            totalCompaniesAttended: new Set((eligibleDrives || []).map((drive) => (drive?.companyName || '').toString().trim().toLowerCase()).filter(Boolean)).size,
            totalDrivesAttended: eligibleDrives.length,
            shortlistedCount,
            highestPackageLpa,
            highestPackageCompany,
            totalRoundsCleared,
            lastDriveAttended,
            lastDriveRole,
            lastDriveResult,
            pieData,
            roundDetails,
            bestAt: bestAt.length > 0 ? bestAt : ['No round data'],
            workOn: workOn.length > 0 ? workOn : ['No round data']
        };
    }, [eligibleDrives, findApplicationForDrive, isAttendanceAbsentForDrive]);

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

    const PIE_DATA = driveAnalytics.pieData;
    const ROUND_DETAILS = driveAnalytics.roundDetails;

    const hasCompanyData = useMemo(() => eligibleDrives.length > 0 || studentApplications.length > 0 || studentAttendanceRecords.length > 0, [eligibleDrives.length, studentApplications.length, studentAttendanceRecords.length]);

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
                console.error('Failed to load company analysis data (Coordinator Edit):', error);
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
            const activeYear = normalizeTrainingYearToken(studentData?.currentYear || studentData?.year || '');

            if (!regNo) {
                if (isActive) {
                    setStudentTrainingAssignment(null);
                    setStudentTrainingAttendanceRecords([]);
                    setStudentTrainingPhaseMetaMap({});
                }
                return;
            }

            try {
                const [assignment, attendanceResponse, schedulesResponse] = await Promise.all([
                    mongoDBService.getStudentTrainingAssignment(regNo),
                    mongoDBService.getStudentTrainingAttendanceByRegNo(regNo).catch(() => ({ data: [] })),
                    mongoDBService.getScheduledTrainings().catch(() => [])
                ]);

                if (!isActive) return;

                setStudentTrainingAssignment(assignment || null);
                setStudentTrainingAttendanceRecords(Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : []);

                const allSchedules = Array.isArray(schedulesResponse) ? schedulesResponse : [];
                const phaseEntries = [];

                allSchedules.forEach((schedule) => {
                    const scheduleBatches = Array.isArray(schedule?.batches) ? schedule.batches : [];
                    const schedulePhases = Array.isArray(schedule?.phases) ? schedule.phases : [];

                    const scheduleHasMatchingBatch = activeYear
                        ? scheduleBatches.some((batch) => normalizeTrainingYearToken(batch?.applicableYear || '') === activeYear)
                        : true;

                    const scheduleUpdatedAt = new Date(schedule?.updatedAt || schedule?.createdAt || 0).getTime() || 0;

                    schedulePhases.forEach((phase) => {
                        const phaseNumber = (phase?.phaseNumber || '').toString().trim();
                        if (!phaseNumber) return;

                        const phaseYear = normalizeTrainingYearToken(phase?.applicableYear || '');
                        const includePhase = !activeYear || phaseYear === activeYear || (!phaseYear && scheduleHasMatchingBatch);
                        if (!includePhase) return;

                        const phaseKey = normalizeTrainingPhaseKey(phaseNumber);
                        const phaseCourses = Array.isArray(phase?.applicableCourses)
                            ? phase.applicableCourses.map((course) => normalizeTrainingCourseName(course)).filter(Boolean)
                            : [];

                        const phaseStartRaw = (phase?.startDate || schedule?.startDate || '').toString().trim();
                        const phaseEndRaw = (phase?.endDate || schedule?.endDate || '').toString().trim();
                        const computedTotalDays = parseTrainingDurationToDays(phase?.duration) || getInclusiveDaysBetweenDates(phaseStartRaw, phaseEndRaw);

                        phaseEntries.push({
                            phaseKey,
                            phaseNumber,
                            courses: [...new Set(phaseCourses)],
                            startDate: phaseStartRaw,
                            endDate: phaseEndRaw,
                            totalDays: computedTotalDays,
                            updatedAt: scheduleUpdatedAt
                        });
                    });
                });

                const phaseMapFromSchedules = phaseEntries.reduce((acc, entry) => {
                    const previous = acc[entry.phaseKey];
                    if (!previous || entry.updatedAt >= previous.updatedAt) {
                        acc[entry.phaseKey] = entry;
                    }
                    return acc;
                }, {});

                setStudentTrainingPhaseMetaMap(phaseMapFromSchedules);
            } catch (error) {
                if (!isActive) return;
                setStudentTrainingAssignment(null);
                setStudentTrainingAttendanceRecords([]);
                setStudentTrainingPhaseMetaMap({});
            }
        };

        loadTrainingCardData();

        return () => {
            isActive = false;
        };
    }, [studentData?.regNo, studentData?.registerNo, studentData?.registerNumber]);

    const trainingCardEntries = useMemo(() => {
        const records = Array.isArray(studentTrainingAttendanceRecords) ? studentTrainingAttendanceRecords : [];
        const hasPhaseTaggedAttendance = records.some((entry) => normalizeTrainingPhaseKey(entry?.phaseNumber || entry?.phase || ''));

        const phaseKeySet = new Set();
        Object.keys(studentTrainingPhaseMetaMap || {}).forEach((phaseKey) => {
            if (phaseKey) phaseKeySet.add(phaseKey);
        });

        if (hasPhaseTaggedAttendance) {
            records.forEach((entry) => {
                const key = normalizeTrainingPhaseKey(entry?.phaseNumber || entry?.phase || '');
                if (key) phaseKeySet.add(key);
            });
        }

        const sortedPhaseKeys = [...phaseKeySet].sort((left, right) => {
            const leftNumeric = Number.parseInt(left, 10);
            const rightNumeric = Number.parseInt(right, 10);
            if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)) return leftNumeric - rightNumeric;
            return left.localeCompare(right);
        });

        if (sortedPhaseKeys.length === 0) {
            const presentCount = records.filter((entry) => normalizeText(entry?.status) === 'present').length;
            const absentCount = records.filter((entry) => normalizeText(entry?.status) === 'absent').length;
            const totalSessions = presentCount + absentCount;
            const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

            const attendedCourse = records
                .map((entry) => (entry?.courseName || entry?.course || entry?.trainingName || '').toString().trim())
                .find(Boolean);
            const assignmentCourse = (studentTrainingAssignment?.courseName || '').toString().trim();
            const assignmentTotalDays = Number(studentTrainingAssignment?.totalDays || 0);
            const fallbackDaysFromDates = getInclusiveDaysBetweenDates(studentTrainingAssignment?.startDate, studentTrainingAssignment?.endDate);

            return [{
                label: 'Training 1',
                courseName: assignmentCourse || attendedCourse || 'N/A',
                attendancePercentage,
                totalTrainingDays: assignmentTotalDays > 0 ? assignmentTotalDays : fallbackDaysFromDates
            }];
        }

        return sortedPhaseKeys.map((phaseKey, index) => {
            const phaseMeta = studentTrainingPhaseMetaMap?.[phaseKey] || {};
            const scopedRecords = hasPhaseTaggedAttendance
                ? records.filter((entry) => normalizeTrainingPhaseKey(entry?.phaseNumber || entry?.phase || '') === phaseKey)
                : (index === 0 ? records : []);

            const presentCount = scopedRecords.filter((entry) => normalizeText(entry?.status) === 'present').length;
            const absentCount = scopedRecords.filter((entry) => normalizeText(entry?.status) === 'absent').length;
            const totalSessions = presentCount + absentCount;
            const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

            const attendedCourse = scopedRecords
                .map((entry) => (entry?.courseName || entry?.course || entry?.trainingName || '').toString().trim())
                .find(Boolean);
            const phaseCourse = Array.isArray(phaseMeta?.courses) ? phaseMeta.courses.find((course) => normalizeTrainingCourseName(course)) : '';
            const assignmentCourse = (studentTrainingAssignment?.courseName || '').toString().trim();

            const distinctAttendanceDays = new Set(
                scopedRecords
                    .map((entry) => (entry?.attendanceDate || entry?.attendanceDateKey || entry?.date || '').toString().trim())
                    .filter(Boolean)
            ).size;

            const phaseTotalDays = Number(phaseMeta?.totalDays || 0);
            const fallbackDaysFromDates = getInclusiveDaysBetweenDates(phaseMeta?.startDate, phaseMeta?.endDate);
            const assignmentTotalDays = Number(studentTrainingAssignment?.totalDays || 0);
            const totalTrainingDays = phaseTotalDays > 0
                ? phaseTotalDays
                : fallbackDaysFromDates || distinctAttendanceDays || (sortedPhaseKeys.length === 1 ? assignmentTotalDays : 0);

            const phaseNumberLabel = (phaseMeta?.phaseNumber || '').toString().trim();
            const labelSuffix = phaseNumberLabel || (Number.parseInt(phaseKey, 10) || (index + 1));

            return {
                label: `Training ${labelSuffix}`,
                courseName: attendedCourse || phaseCourse || assignmentCourse || 'N/A',
                attendancePercentage,
                totalTrainingDays
            };
        });
    }, [studentTrainingAttendanceRecords, studentTrainingPhaseMetaMap, studentTrainingAssignment?.courseName, studentTrainingAssignment?.totalDays, studentTrainingAssignment?.startDate, studentTrainingAssignment?.endDate]);

    const hasTrainingData = useMemo(() => (
        Boolean(studentTrainingAssignment) ||
        studentTrainingAttendanceRecords.length > 0 ||
        Object.keys(studentTrainingPhaseMetaMap || {}).length > 0
    ), [studentTrainingAssignment, studentTrainingAttendanceRecords.length, studentTrainingPhaseMetaMap]);

    useEffect(() => {
        if (!selectedRound) return;
        if (!PIE_DATA.some((item) => item.name === selectedRound)) {
            setSelectedRound(null);
            setHoveredRound(null);
        }
    }, [PIE_DATA, selectedRound]);

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

    const resolveResumeUrl = (resumeDoc) => {
        if (!resumeDoc) return '';

        const rawUrl = resumeDoc.gridfsFileUrl
            || (resumeDoc.gridfsFileId ? `/api/file/${resumeDoc.gridfsFileId}` : '')
            || resumeDoc.url
            || resumeDoc.resumeURL
            || resumeDoc.resumeUrl
            || resumeDoc.fileURL
            || resumeDoc.resumeData?.url
            || resumeDoc.resumeData?.resumeURL
            || resumeDoc.resumeData?.resumeUrl
            || '';

        if (!rawUrl) return '';
        if (rawUrl.startsWith('http') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;
        if (rawUrl.startsWith('/api/file/')) return `${API_BASE_URL}${rawUrl.replace('/api', '')}`;
        if (rawUrl.startsWith('/file/')) return `${API_BASE_URL}${rawUrl}`;
        if (rawUrl.startsWith('/api/')) return `${API_BASE_URL.replace('/api', '')}${rawUrl}`;
        if (rawUrl.startsWith('/')) return `${API_BASE_URL.replace('/api', '')}${rawUrl}`;
        return rawUrl;
    };

    const closeResumePopup = () => {
        if (isResumeProcessing) {
            return;
        }

        setIsResumeChooserOpen(false);
    };

    const handleResumeOpen = () => {
        setResumeActionType('');
        setResumePreviewPopupState('none');
        setResumeDownloadPopupState('none');
        setIsResumeChooserOpen(true);
    };

    const resolveResumeFile = async () => {
        if (!studentId) {
            throw new Error('Student ID not found');
        }

        try {
            const resumeResponse = await mongoDBService.getResume(studentId);
            const resumeDoc = resumeResponse?.resume || resumeResponse || null;
            let resumeUrl = resolveResumeUrl(resumeDoc);
            const resumeFileName = resumeDoc?.fileName || resumeDoc?.name || resumeDoc?.resumeData?.fileName || 'resume.pdf';

            if (!resumeUrl && resumeDoc?.fileData) {
                resumeUrl = resumeDoc.fileData.startsWith('data:')
                    ? resumeDoc.fileData
                    : `data:${resumeDoc.fileType || 'application/pdf'};base64,${resumeDoc.fileData}`;
            }

            if (!resumeUrl) {
                const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
                const fallbackResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/api/resume-builder/pdf/${studentId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                    }
                });

                if (fallbackResponse.ok) {
                    const result = await fallbackResponse.json();
                    resumeUrl = resolveResumeUrl(result?.resume || null);
                }
            }

            if (!resumeUrl) {
                throw new Error('Resume not found for this student.');
            }

            if (resumeUrl.startsWith('data:')) {
                return {
                    blobUrl: toPdfBlobUrl(resumeUrl, resumeDoc?.fileType || 'application/pdf'),
                    fileName: resumeFileName,
                    shouldRevoke: true
                };
            }

            if (resumeUrl.startsWith('blob:')) {
                return {
                    blobUrl: resumeUrl,
                    fileName: resumeFileName,
                    shouldRevoke: false
                };
            }

            const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(resumeUrl, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Resume fetch failed with status ${response.status}`);
            }

            const blob = await response.blob();
            if (!blob.size || blob.type.includes('html')) {
                throw new Error('Invalid resume response received');
            }

            return {
                blobUrl: window.URL.createObjectURL(blob),
                fileName: resumeFileName,
                shouldRevoke: true
            };
        } catch (error) {
            console.error('Failed to resolve resume:', error);
            throw error;
        }
    };

    const handleResumeView = async () => {
        if (isResumeProcessing) {
            return;
        }

        let progressInterval;
        let blobUrl = null;
        let shouldRevoke = false;

        try {
            setResumeActionType('preview');
            setIsResumeProcessing(true);
            setIsResumeChooserOpen(false);
            setResumePreviewPopupState('none');
            setResumePreviewPopupState('progress');
            setResumePreviewProgress(0);

            progressInterval = setInterval(() => {
                setResumePreviewProgress((prev) => {
                    if (prev >= 90) {
                        return 90;
                    }
                    return prev + 15;
                });
            }, 150);

            const result = await resolveResumeFile();
            blobUrl = result.blobUrl;
            shouldRevoke = result.shouldRevoke;

            const previewWindow = window.open(blobUrl, '_blank');
            if (!previewWindow) {
                throw new Error('Popup blocked');
            }

            if (progressInterval) {
                clearInterval(progressInterval);
            }
            setResumePreviewProgress(100);
            setTimeout(() => setResumePreviewPopupState('none'), 500);

            if (shouldRevoke && blobUrl) {
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
            }
        } catch (error) {
            console.error('Resume preview failed:', error);
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            if (shouldRevoke && blobUrl) {
                window.URL.revokeObjectURL(blobUrl);
            }
            setIsResumeChooserOpen(false);
            setResumePreviewPopupState('failed');
            setTimeout(() => setResumePreviewPopupState('none'), 3000);
        } finally {
            setIsResumeProcessing(false);
            setResumeActionType('');
        }
    };

    const handleResumeDownload = async () => {
        if (isResumeProcessing) {
            return;
        }

        let progressInterval;
        let blobUrl = null;
        let fileName = 'resume.pdf';
        let shouldRevoke = false;

        try {
            setResumeActionType('download');
            setIsResumeProcessing(true);
            setIsResumeChooserOpen(false);
            setResumeDownloadPopupState('none');
            setResumeDownloadPopupState('progress');
            setResumeDownloadProgress(0);

            progressInterval = setInterval(() => {
                setResumeDownloadProgress((prev) => {
                    if (prev >= 85) {
                        return prev;
                    }
                    return prev + Math.random() * 12;
                });
            }, 150);

            const result = await resolveResumeFile();
            blobUrl = result.blobUrl;
            fileName = result.fileName || fileName;
            shouldRevoke = result.shouldRevoke;

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (progressInterval) {
                clearInterval(progressInterval);
            }
            setResumeDownloadProgress(100);
            setResumeDownloadPopupState('success');
            setTimeout(() => setResumeDownloadPopupState('none'), 2500);

            if (shouldRevoke && blobUrl) {
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
            }
        } catch (error) {
            console.error('Resume download failed:', error);
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            if (shouldRevoke && blobUrl) {
                window.URL.revokeObjectURL(blobUrl);
            }
            setIsResumeChooserOpen(false);
            setResumeDownloadPopupState('failed');
            setTimeout(() => setResumeDownloadPopupState('none'), 3000);
        } finally {
            setIsResumeProcessing(false);
            setResumeActionType('');
        }
    };

    const handleCertificateOpen = () => {
        navigate(`/coo-student-certificates/${studentId}`, { state: { studentData } });
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
        setOriginalFormData({ ...merged });
        setHasUnsavedChanges(false);
        setChangedFieldsList([]);
        setHasNewProfilePhoto(false);
        const processedSkills = Array.isArray(merged.skills) ? merged.skills : parseMultiValue(merged.skillSet || '');
        setStudyCategory(merged.studyCategory || '12th');
        setCurrentYear(merged.currentYear ? String(merged.currentYear) : '');
        setCurrentSemester(merged.currentSemester ? String(merged.currentSemester) : '');
        setSelectedSection(merged.section ? String(merged.section) : '');
        setSkills(processedSkills);
        setOriginalSkills([...processedSkills]); // Track original skills for banner
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

        if (merged.profilePicURL) {
            // Resolve GridFS URLs to full backend URL for display
            const resolvedUrl = gridfsService.getFileUrl(merged.profilePicURL);
            setProfileImage(resolvedUrl);
            setUploadInfo({
                name: 'profile.jpg',
                date: merged.profileUploadDate || new Date().toLocaleDateString('en-GB')
            });
        }

        setIsInitialLoading(false);
    };

    const loadStudentData = useCallback(async () => {
        try {
            if (!studentId) {
                console.error('No studentId provided in URL params');
                setIsInitialLoading(false);
                return;
            }

            // Clear stale student data immediately when switching records.
            setIsInitialLoading(true);
            setStudentData(null);
            setProfileImage(null);
            setDob(null);
            setSkills([]);
            setCurrentYear('');
            setCurrentSemester('');
            setSelectedSection('');
            setStudyCategory('12th');
            setUploadInfo({ name: '', date: '' });
            setOriginalFormData(null);
            setOriginalSkills([]);
            setHasUnsavedChanges(false);
            setChangedFieldsList([]);
            setShowAnalysis(false);

            const completeData = await fastDataService.getCompleteStudentData(studentId);

            if (completeData && completeData.student) {
                populateFormFields(completeData.student);
            } else {
                // Fallback to mongoDBService if fastDataService fails
                const fallbackData = await mongoDBService.getStudentById(studentId);
                if (fallbackData) {
                    populateFormFields(fallbackData);
                } else {
                    setIsInitialLoading(false);
                }
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            alert('Error loading student data. Please try again.');
            setIsInitialLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        if (studentId) {
            loadStudentData();
        }
    }, [studentId, loadStudentData]);

    // Auto-sync not needed for coordinator view
    // Removed auto-sync mechanism

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

        // Store the image blob URL for cropping
        const blobUrl = URL.createObjectURL(file);
        setImageToCrop(blobUrl);
        setProfilePhotoFile(file);
        setIsCropModalOpen(true);

        console.log('âœ… File selected for cropping:', {
            name: file.name,
            mimeType: file.type || 'unknown',
            size: `${fileSizeKB}KB`,
            detectedType: fileType
        });
    };

    const handleCropComplete = (croppedBlob) => {
        // Convert blob to URL and update profile image
        const croppedUrl = URL.createObjectURL(croppedBlob);
        setProfileImage(croppedUrl);

        // Convert blob to File for upload
        const fileName = profilePhotoFile?.name || 'profile.jpg';
        const croppedFile = new File([croppedBlob], fileName, {
            type: croppedBlob.type || 'image/jpeg',
            lastModified: Date.now()
        });
        setProfilePhotoFile(croppedFile);

        // Update upload info
        setUploadInfo({
            name: fileName,
            date: new Date().toLocaleDateString('en-GB'),
            size: (croppedBlob.size / 1024).toFixed(1),
            type: 'cropped'
        });

        // Show success message
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);

        // Mark that user has uploaded a new profile photo
        setHasNewProfilePhoto(true);

        // Clean up
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
    };

    const handleCropModalClose = () => {
        setIsCropModalOpen(false);
        // Clean up the image blob
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        // DON'T reset profilePhotoFile here - it should keep the cropped file
    };

    const handleCropDiscard = () => {
        setIsCropModalOpen(false);
        // Clean up the image blob
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        // Reset everything when discarding
        setProfilePhotoFile(null);
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        setHasNewProfilePhoto(false); // Reset profile photo change flag
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        setProfileImage(null);
        setProfilePhotoFile(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        setHasNewProfilePhoto(false); // Reset profile photo change flag
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving || getChangedFields().length === 0) return;

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
            if (!studentId) {
                alert('No student ID provided');
                return;
            }

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

            // No localStorage updates needed for coordinator view
            // window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedStudentData }));

            // Update the reference for next comparison (this makes the banner disappear)
            setOriginalFormData({ ...updatedStudentData });
            setOriginalSkills([...skills.filter(s => s.trim())]); // Reset original skills after save
            setHasUnsavedChanges(false);
            setChangedFieldsList([]);
            setHasNewProfilePhoto(false); // Reset profile photo change flag after save
            setShowUnsavedModal(false);
            setPendingNavView(null);

            // Show success popup immediately after everything is ready
            setIsSaving(false);
            setPopupOpen(true);
            savedDataRef.current = { ...updatedStudentData, skills: skills.filter(s => s.trim()) };
        } catch (error) {
            afterSaveNavRef.current = null;
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

            // Reset unsaved changes tracking
            setHasUnsavedChanges(false);
            setChangedFieldsList([]);
            setHasNewProfilePhoto(false); // Reset profile photo change flag
            if (studentData) {
                setOriginalFormData({ ...studentData });
            }
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

    const closePopup = () => {
        setPopupOpen(false);
        if (afterSaveNavRef.current) {
            const navTarget = afterSaveNavRef.current;
            afterSaveNavRef.current = null;
            onViewChange(navTarget);
        }
    };

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
        const changed = getChangedFields();
        if (changed.length > 0) {
            setPendingNavView(view);
            setShowUnsavedModal(true);
            setIsSidebarOpen(false);
        } else {
            onViewChange(view);
            setIsSidebarOpen(false);
        }
    };

    const actionableChangedFields = getChangedFields();
    const hasActionableChanges = actionableChangedFields.length > 0;

    return (
        <div className={`${styles.container} ${isSaving ? styles['stu-profile-saving'] : ''}`}>
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

            {/* Field Update Banner - shows when there are unsaved changes */}
            <FieldUpdateBanner
                isVisible={hasUnsavedChanges}
                onClose={() => setHasUnsavedChanges(false)}
                updatedFields={changedFieldsList}
            />

            {/* Unsaved Changes Alert */}
            <CoordinatorUnsavedChangesAlert
                isOpen={showUnsavedModal}
                onClose={() => {
                    if (isSaving) return;
                    setShowUnsavedModal(false);
                    setPendingNavView(null);
                }}
                onSave={() => {
                    // Set the navigation target to execute after save completes
                    afterSaveNavRef.current = pendingNavView;
                    if (formRef.current) {
                        formRef.current.requestSubmit();
                    }
                }}
                onDiscard={() => {
                    if (isSaving) return;
                    setShowUnsavedModal(false);
                    handleDiscard();
                    if (pendingNavView) {
                        onViewChange(pendingNavView);
                        setPendingNavView(null);
                    }
                }}
                isSaving={isSaving}
                changedFields={changedFieldsList.length > 0 ? changedFieldsList : actionableChangedFields}
            />

            <div className={styles.main}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'manage-students'}
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
                                        <input type="text" name="firstName" placeholder="Enter First Name" value={studentData?.firstName || ''} onChange={(e) => setStudentData(prev => ({ ...prev, firstName: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Last Name <RequiredStar /></label>
                                        <input type="text" name="lastName" placeholder="Enter Last Name" value={studentData?.lastName || ''} onChange={(e) => setStudentData(prev => ({ ...prev, lastName: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Register Number <RequiredStar /></label>
                                        <input type="text" name="regNo" placeholder="Enter Register Number" value={studentData?.regNo || ''} onChange={(e) => setStudentData(prev => ({ ...prev, regNo: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Batch <RequiredStar /></label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                value={studentData?.batch ? (studentData.batch.split('-')[0] || '') : ''}
                                                placeholder="Start"
                                                onChange={(e) => {
                                                    const startPart = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    const endPart = studentData?.batch ? (studentData.batch.split('-')[1] || '') : '';
                                                    const nextBatch = [startPart, endPart].filter(Boolean).join('-');
                                                    setStudentData(prev => ({ ...prev, batch: nextBatch }));
                                                }}
                                                disabled={isSaving || isViewMode}
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontWeight: '600', color: '#333' }}>-</span>
                                            <input
                                                type="text"
                                                value={studentData?.batch ? (studentData.batch.split('-')[1] || '') : ''}
                                                placeholder="End"
                                                onChange={(e) => {
                                                    const endPart = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    const startPart = studentData?.batch ? (studentData.batch.split('-')[0] || '') : '';
                                                    const nextBatch = [startPart, endPart].filter(Boolean).join('-');
                                                    setStudentData(prev => ({ ...prev, batch: nextBatch }));
                                                }}
                                                disabled={isSaving || isViewMode}
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
                                                onChange={(date) => {
                                                    setDob(date);
                                                    const formattedDob = date
                                                        ? `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`
                                                        : '';
                                                    setStudentData(prev => ({ ...prev, dob: formattedDob }));
                                                }}
                                                dateFormat="dd-MM-yyyy"
                                                placeholderText="Enter DOB"
                                                className={styles.datepickerInput}
                                                wrapperClassName="StuProfile-datepicker-wrapper-inner"
                                                showPopperArrow={false}
                                                disabled={isSaving || isViewMode}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Degree <RequiredStar /></label>
                                        <select
                                            name="degree"
                                            value={selectedDegree}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setSelectedDegree(value);
                                                setSelectedBranch('');
                                                setStudentData(prev => ({ ...prev, degree: value, branch: '' }));
                                            }}
                                            disabled={isSaving || isViewMode}
                                        >
                                            <option value="" disabled>Select Degree</option>
                                            {degrees.map((degree) => {
                                                const value = degree.degreeAbbreviation || degree.degreeFullName;
                                                const label = degree.degreeFullName
                                                    ? degree.degreeAbbreviation
                                                        ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                                                        : degree.degreeFullName
                                                    : value;
                                                return (
                                                    <option key={degree.id || degree._id || value} value={value}>{label}</option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Branch <RequiredStar /></label>
                                        <select
                                            name="branch"
                                            value={selectedBranch}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setSelectedBranch(value);
                                                setStudentData(prev => ({ ...prev, branch: value }));
                                            }}
                                            disabled={isSaving || isViewMode || !selectedDegree}
                                        >
                                            <option value="" disabled>
                                                {selectedDegree ? 'Select Branch' : 'Select Degree First'}
                                            </option>
                                            {filteredBranches.map((branch) => {
                                                const value = getBranchOptionValue(branch);
                                                const label = branch.branchFullName
                                                    ? branch.branchAbbreviation
                                                        ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                        : branch.branchFullName
                                                    : value;
                                                return (
                                                    <option key={branch.id || branch._id || value} value={value}>{label}</option>
                                                );
                                            })}
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
                                            disabled={isSaving || isViewMode}
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
                                            disabled={!currentYear || isSaving || isViewMode}
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
                                        <select
                                            name="section"
                                            value={selectedSection}
                                            onChange={(e) => {
                                                setSelectedSection(e.target.value);
                                                setStudentData((prev) => ({ ...(prev || {}), section: e.target.value }));
                                            }}
                                            disabled={isSaving || isViewMode}
                                        >
                                            <option value="" disabled>
                                                Section *
                                            </option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                            <option value="D">D</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Gender <RequiredStar /></label>
                                        <select name="gender" value={studentData?.gender || ''} onChange={(e) => setStudentData(prev => ({ ...prev, gender: e.target.value }))} disabled={isSaving || isViewMode}>
                                            <option value="" disabled>Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Address</label>
                                        <input type="text" name="address" placeholder="Enter Address" value={studentData?.address || ''} onChange={(e) => setStudentData(prev => ({ ...prev, address: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>City</label>
                                        <input type="text" name="city" placeholder="Enter City" value={studentData?.city || ''} onChange={(e) => setStudentData(prev => ({ ...prev, city: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Primary Email <RequiredStar /></label>
                                        <input type="email" name="primaryEmail" placeholder="Enter Primary Email" value={studentData?.primaryEmail || ''} onChange={(e) => setStudentData(prev => ({ ...prev, primaryEmail: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Domain Email <RequiredStar /></label>
                                        <input type="email" name="domainEmail" placeholder="Enter Domain Email" value={studentData?.domainEmail || ''} onChange={(e) => setStudentData(prev => ({ ...prev, domainEmail: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mobile No. <RequiredStar /></label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="mobileNo" placeholder="Enter Mobile No." value={studentData?.mobileNo || ''} onChange={(e) => handleMobileChange(e, 'mobileNo')} disabled={isSaving || isViewMode} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Father Name <RequiredStar /></label>
                                        <input type="text" name="fatherName" placeholder="Enter Father Name" value={studentData?.fatherName || ''} onChange={(e) => setStudentData(prev => ({ ...prev, fatherName: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Father Occupation</label>
                                        <input type="text" name="fatherOccupation" placeholder="Enter Father Occupation" value={studentData?.fatherOccupation || ''} onChange={(e) => setStudentData(prev => ({ ...prev, fatherOccupation: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Father Mobile No. <RequiredStar /></label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="fatherMobile" placeholder="Enter Father Mobile No." value={studentData?.fatherMobile || ''} onChange={(e) => handleMobileChange(e, 'fatherMobile')} disabled={isSaving || isViewMode} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mother Name <RequiredStar /></label>
                                        <input type="text" name="motherName" placeholder="Enter Mother Name" value={studentData?.motherName || ''} onChange={(e) => setStudentData(prev => ({ ...prev, motherName: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mother Occupation</label>
                                        <input type="text" name="motherOccupation" placeholder="Enter Mother Occupation" value={studentData?.motherOccupation || ''} onChange={(e) => setStudentData(prev => ({ ...prev, motherOccupation: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Mother Mobile No. <RequiredStar /></label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="motherMobile" placeholder="Enter Mother Mobile No." value={studentData?.motherMobile || ''} onChange={(e) => handleMobileChange(e, 'motherMobile')} disabled={isSaving || isViewMode} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Guardian Name</label>
                                        <input type="text" name="guardianName" placeholder="Enter Guardian Name" value={studentData?.guardianName || ''} onChange={(e) => setStudentData(prev => ({ ...prev, guardianName: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Guardian Number</label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="guardianMobile" placeholder="Enter Guardian Number" value={studentData?.guardianMobile || ''} onChange={(e) => handleMobileChange(e, 'guardianMobile')} disabled={isSaving || isViewMode} className={styles.mobileNumberInput} />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label>&nbsp;</label>
                                        <button type="button" className={styles.fieldButton} onClick={handleResumeOpen}>
                                            Resume
                                        </button>
                                    </div>
                                    <div className={styles.field}>
                                        <label>&nbsp;</label>
                                        <button type="button" className={styles.fieldButton} onClick={handleCertificateOpen}>
                                            Certificate
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.profilePhotoWrapper}>
                                    <div className={styles.profilePhotoBox} style={{ height: '732px' }}>
                                        <h3 className={styles.sectionHeader}>Profile Photo</h3>
                                        <div className={styles.profileIconContainer}>
                                            {profileImage ? (
                                                <img
                                                    src={profileImage}
                                                    alt="Profile Preview"
                                                    className={styles.profilePreviewImg}
                                                    onClick={() => setImagePreviewOpen(true)}
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
                                        {/* Only show upload controls in edit mode */}
                                        {!isViewMode && (
                                            <div className={styles.uploadActionArea}>
                                                <div className={styles.uploadBtnWrapper}>
                                                    <label htmlFor="photo-upload-input" className={styles.profileUploadBtn}>
                                                        <div className={styles.uploadBtnContent}>
                                                            <MdUpload /> <span>Upload (Max 500 KB)</span>
                                                        </div>
                                                    </label>
                                                    {profileImage && (
                                                        <button onClick={handleImageRemove} className={styles.removeImageBtn} aria-label="Remove image" disabled={isSaving || isViewMode}>
                                                            <IoMdClose />
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    id="photo-upload-input"
                                                    ref={fileInputRef}
                                                    style={{ display: 'none' }}
                                                    accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
                                                    onChange={handleImageUpload}
                                                    disabled={isSaving || isViewMode}
                                                />
                                                {uploadSuccess && <p className={styles.uploadSuccessMessage}>Profile Photo uploaded Successfully!</p>}
                                                <p className={styles.uploadHint}>*JPG, JPEG, and WebP formats allowed (WebP recommended).</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Community <RequiredStar /></label>
                                        <select name="community" value={studentData?.community || ''} onChange={(e) => setStudentData(prev => ({ ...prev, community: e.target.value }))} disabled={isSaving || isViewMode}>
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
                                        <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} onChange={(e) => setStudentData(prev => ({ ...prev, mediumOfStudy: e.target.value }))} disabled={isSaving || isViewMode}>
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
                                        <input type="text" name="bloodGroup" placeholder="Enter Blood Group" value={studentData?.bloodGroup || ''} onChange={(e) => setStudentData(prev => ({ ...prev, bloodGroup: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Aadhaar Number <RequiredStar /></label>
                                        <input type="text" name="aadhaarNo" placeholder="Enter Aadhaar Number (12 digits)" value={studentData?.aadhaarNo || ''} maxLength="12" onChange={(e) => setStudentData(prev => ({ ...prev, aadhaarNo: e.target.value.replace(/\D/g, '').slice(0, 12) }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Portfolio Link</label>
                                        <input type="url" name="portfolioLink" placeholder="Enter Portfolio Link" value={studentData?.portfolioLink || ''} onChange={(e) => setStudentData(prev => ({ ...prev, portfolioLink: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className={styles.profileSectionContainer}>
                          <h3 className={styles.sectionHeader}>Academic Background</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.studyCategory} style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => { setStudyCategory(e.target.value); setStudentData(prev => ({ ...prev, studyCategory: e.target.value })); }} disabled={isSaving || isViewMode} />
                                    <label htmlFor="12th">12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => { setStudyCategory(e.target.value); setStudentData(prev => ({ ...prev, studyCategory: e.target.value })); }} disabled={isSaving || isViewMode} />
                                    <label htmlFor="diploma">Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => { setStudyCategory(e.target.value); setStudentData(prev => ({ ...prev, studyCategory: e.target.value })); }} disabled={isSaving || isViewMode} />
                                    <label htmlFor="both">Both</label>
                                </div>
                                    <div className={styles.field}>
                                        <label>10th Institution Name <RequiredStar /></label>
                                        <input type="text" name="tenthInstitution" placeholder="Enter 10th Institution Name" value={studentData?.tenthInstitution || ''} onChange={(e) => setStudentData(prev => ({ ...prev, tenthInstitution: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>10th Board / University <RequiredStar /></label>
                                        <select name="tenthBoard" value={studentData?.tenthBoard || ''} onChange={(e) => setStudentData(prev => ({ ...prev, tenthBoard: e.target.value }))} disabled={isSaving || isViewMode}>
                                            <option value="" disabled>10th Board/University</option>
                                            <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="Other State Board">Other State Board</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>10th Percentage <RequiredStar /></label>
                                        <input type="text" name="tenthPercentage" placeholder="Enter 10th Percentage" value={studentData?.tenthPercentage || ''} onChange={(e) => setStudentData(prev => ({ ...prev, tenthPercentage: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>10th Year of Passing <RequiredStar /></label>
                                        <input type="text" name="tenthYear" placeholder="Enter 10th Year of Passing" value={studentData?.tenthYear || ''} onChange={(e) => setStudentData(prev => ({ ...prev, tenthYear: e.target.value }))} disabled={isSaving || isViewMode} />
                                    </div>
                                    {(studyCategory === '12th' || studyCategory === 'both') && (
                                        <>
                                            <div className={styles.field}>
                                                <label>12th Institution Name <RequiredStar /></label>
                                                <input type="text" name="twelfthInstitution" placeholder="Enter 12th Institution Name" value={studentData?.twelfthInstitution || ''} onChange={(e) => setStudentData(prev => ({ ...prev, twelfthInstitution: e.target.value }))} disabled={isSaving || isViewMode} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Board / University <RequiredStar /></label>
                                                <select name="twelfthBoard" value={studentData?.twelfthBoard || ''} onChange={(e) => setStudentData(prev => ({ ...prev, twelfthBoard: e.target.value }))} disabled={isSaving || isViewMode}>
                                                    <option value="" disabled>12th Board/University</option>
                                                    <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                                    <option value="CBSE">CBSE</option>
                                                    <option value="ICSE">ICSE</option>
                                                    <option value="Other State Board">Other State Board</option>
                                                </select>
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Percentage <RequiredStar /></label>
                                                <input type="text" name="twelfthPercentage" placeholder="Enter 12th Percentage" value={studentData?.twelfthPercentage || ''} onChange={(e) => setStudentData(prev => ({ ...prev, twelfthPercentage: e.target.value }))} disabled={isSaving || isViewMode} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Year of Passing <RequiredStar /></label>
                                                <input type="text" name="twelfthYear" placeholder="Enter 12th Year of Passing" value={studentData?.twelfthYear || ''} onChange={(e) => setStudentData(prev => ({ ...prev, twelfthYear: e.target.value }))} disabled={isSaving || isViewMode} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>12th Cut-off Marks <RequiredStar /></label>
                                                <input type="text" name="twelfthCutoff" placeholder="Enter 12th Cut-off Marks" value={studentData?.twelfthCutoff || ''} onChange={(e) => setStudentData(prev => ({ ...prev, twelfthCutoff: e.target.value }))} disabled={isSaving || isViewMode} />
                                            </div>
                                        </>
                                    )}
                                    {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                        <>
                                            <div className={styles.field}>
                                                <label>Diploma Institution <RequiredStar /></label>
                                                <input type="text" name="diplomaInstitution" placeholder="Enter Diploma Institution" value={studentData?.diplomaInstitution || ''} onChange={(e) => setStudentData(prev => ({ ...prev, diplomaInstitution: e.target.value }))} disabled={isSaving || isViewMode} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Diploma Branch <RequiredStar /></label>
                                                <input type="text" name="diplomaBranch" placeholder="Enter Diploma Branch" value={studentData?.diplomaBranch || ''} onChange={(e) => setStudentData(prev => ({ ...prev, diplomaBranch: e.target.value }))} disabled={isSaving || isViewMode} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Diploma Percentage <RequiredStar /></label>
                                                <input type="text" name="diplomaPercentage" placeholder="Enter Diploma Percentage" value={studentData?.diplomaPercentage || ''} onChange={(e) => setStudentData(prev => ({ ...prev, diplomaPercentage: e.target.value }))} disabled={isSaving || isViewMode} />
                                            </div>
                                            <div className={styles.field}>
                                                <label>Diploma Year of Passing <RequiredStar /></label>
                                                <input type="text" name="diplomaYear" placeholder="Enter Diploma Year of Passing" value={studentData?.diplomaYear || ''} onChange={(e) => setStudentData(prev => ({ ...prev, diplomaYear: e.target.value }))} disabled={isSaving || isViewMode} />
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
                                            onClick={() => navigate('/coo-manage-students-semester/marksheet', {
                                                state: { student: studentData }
                                            })}
                                        >
                                            <img src={StuUploadMarksheetIcon} alt="Upload" className={styles.uploadIcon} />
                                            <span>Upload Sem {currentSem} Marksheet</span>
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
                                        onChange={(e) => setStudentData(prev => ({ ...prev, overallCGPA: e.target.value }))}
                                        disabled={isSaving || isViewMode}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>No. of Backlog (Arrear Cleared)</label>
                                    <input
                                        type="text"
                                        name="clearedBacklogs"
                                        placeholder="Enter No. of Backlog (Arrear Cleared)"
                                        value={studentData?.clearedBacklogs ?? ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, clearedBacklogs: e.target.value }))}
                                        disabled={isSaving || isViewMode}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>No. of Current Backlog</label>
                                    <input
                                        type="text"
                                        name="currentBacklogs"
                                        placeholder="Enter No. of Current Backlog"
                                        value={studentData?.currentBacklogs ?? ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, currentBacklogs: e.target.value }))}
                                        disabled={isSaving || isViewMode}
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
                                        disabled={isSaving || isViewMode}
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
                                        disabled={isSaving || isViewMode}
                                    />
                                </div>
                            </div>
                        </div>

                        {hasTrainingData && (
                            <div className={styles.profileSectionContainer}>
                                <h3 className={styles.sectionHeader}>Training</h3>
                                {trainingCardEntries.map((trainingCard, index) => (
                                    <div
                                        key={`${trainingCard.label}-${index}`}
                                        className={styles.companyStatsGrid}
                                        style={{ marginBottom: index === trainingCardEntries.length - 1 ? '0' : '1rem' }}
                                    >
                                        <div className={styles.companyStatCardEmpty}>
                                            <span className={styles.companyStatLabel}>{trainingCard.label}</span>
                                            <span className={styles.companyStatValueEmpty}>{trainingCard.courseName}</span>
                                        </div>
                                        <div className={styles.companyStatCard}>
                                            <span className={styles.companyStatLabel}>Attendance Percentage</span>
                                            <span className={styles.companyStatValue}>{trainingCard.attendancePercentage}%</span>
                                        </div>
                                        <div className={styles.companyStatCard}>
                                            <span className={styles.companyStatLabel}>Total Training Days</span>
                                            <span className={styles.companyStatValue}>{trainingCard.totalTrainingDays}</span>
                                        </div>
                                    </div>
                                ))}
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
                                            <span className={styles.companyStatLabel}>Last Drive Attended</span>
                                            <span className={styles.companyStatValueEmpty}>{companyStats.lastDriveAttended}</span>
                                        </div>
                                        <div className={styles.companyStatCardEmpty}>
                                            <span className={styles.companyStatLabel}>Last Drive Result</span>
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
                                                        stroke="#B84349"
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
                                                <span className={styles.insightValue}>{companyStats.highestPackageDrive > 0 ? `${companyStats.highestPackageDrive} LPA` : 'N/A'}</span>
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
                                            <span className={styles.anlsPlacedBadge}><span className={styles.anlsPlacedDot} />Placed</span>
                                            <button type="button" className={styles.anlsBackBtn} onClick={() => setShowAnalysis(false)}>Back â†©</button>
                                        </div>
                                    </div>

                                    <div className={styles.anlsGrid}>
                                        {/* Left: Pie Chart */}
                                        <div
                                            className={styles.anlsPieCol}
                                            onMouseLeave={() => {
                                                if (!isMobile && !selectedRound) setHoveredRound(null);
                                            }}
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
                                                            if (!isMobile && !selectedRound) setHoveredRound(PIE_DATA[index].name);
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
                                                                {driveAnalytics.workOn.map((i) => <li key={i}><span className={styles.anlsArrow}>â†’</span>{i}</li>)}
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
                                                                {driveAnalytics.bestAt.map((i) => <li key={i}><span className={styles.anlsArrow}>â†’</span>{i}</li>)}
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
                                            disabled={isSaving || isViewMode}
                                        />
                                        <button
                                            type="button"
                                            className={styles.removeSkillBtn}
                                            onClick={() => handleRemoveSkill(index)}
                                            disabled={isSaving || isViewMode}
                                            aria-label="Remove skill"
                                        >
                                            <svg viewBox="0 0 512 512" fill="currentColor" style={{width:'14px',height:'14px'}}><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className={styles.addSkillBtn}
                                    onClick={handleAddSkill}
                                    disabled={isSaving || isViewMode}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:'22px',height:'22px',flexShrink:0}}>
                                        <circle cx="12" cy="12" r="10" fill="white" stroke="white"/>
                                        <line x1="12" y1="7" x2="12" y2="17" stroke="#D73D3D" strokeWidth="2.5"/>
                                        <line x1="7" y1="12" x2="17" y2="12" stroke="#D73D3D" strokeWidth="2.5"/>
                                    </svg>
                                    <span>Click to Add Skill</span>
                                </button>
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
                                            disabled={isSaving || isViewMode}
                                        >
                                            <option value="" disabled>Residential status</option>
                                            <option value="Hosteller">Hosteller</option>
                                            <option value="Dayscholar">Dayscholar</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Quota <RequiredStar /></label>
                                        <select
                                            name="quota"
                                            value={studentData?.quota || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, quota: e.target.value }))}
                                            disabled={isSaving || isViewMode}
                                        >
                                            <option value="" disabled>Quota</option>
                                            <option value="Management">Management</option>
                                            <option value="Counselling">Counselling</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Spoken Languages</label>
                                        <input
                                            type="text"
                                            name="languagesKnown"
                                            placeholder="Exclude Tamil & English"
                                            value={studentData?.languagesKnown || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, languagesKnown: e.target.value }))}
                                            disabled={isSaving || isViewMode}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>First Graduate <RequiredStar /></label>
                                        <select
                                            name="firstGraduate"
                                            value={studentData?.firstGraduate || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, firstGraduate: e.target.value }))}
                                            disabled={isSaving || isViewMode}
                                        >
                                            <option value="" disabled>First Graduate</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Passport No.</label>
                                        <input
                                            type="text"
                                            name="passportNo"
                                            placeholder="Enter Passport No."
                                            value={studentData?.passportNo || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, passportNo: e.target.value }))}
                                            disabled={isSaving || isViewMode}
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
                                            disabled={isSaving || isViewMode}
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
                                            disabled={isSaving || isViewMode}
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
                                            disabled={isSaving || isViewMode}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Ration Card No. <RequiredStar /></label>
                                        <input
                                            type="text"
                                            name="rationCardNo"
                                            placeholder="Enter Ration Card No."
                                            value={studentData?.rationCardNo || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, rationCardNo: e.target.value }))}
                                            disabled={isSaving || isViewMode}
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
                                            disabled={isSaving || isViewMode}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>PAN No. <RequiredStar /></label>
                                        <input
                                            type="text"
                                            name="panNo"
                                            placeholder="Enter PAN No."
                                            value={studentData?.panNo || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, panNo: e.target.value }))}
                                            disabled={isSaving || isViewMode}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Willing to Sign Bond <RequiredStar /></label>
                                        <select
                                            name="willingToSignBond"
                                            value={studentData?.willingToSignBond || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, willingToSignBond: e.target.value }))}
                                            disabled={isSaving || isViewMode}
                                        >
                                            <option value="" disabled>Willing to Sign Bond</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>Preferred Mode of Drive <RequiredStar /></label>
                                        <select
                                            name="preferredModeOfDrive"
                                            value={studentData?.preferredModeOfDrive || ''}
                                            onChange={(e) => setStudentData(prev => ({ ...prev, preferredModeOfDrive: e.target.value }))}
                                            disabled={isSaving || isViewMode}
                                        >
                                            <option value="" disabled>Preferred Mode of Drive</option>
                                            <option value="On-Campus">On-Campus</option>
                                            <option value="Off-Campus">Off-Campus</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
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
                                            disabled={isSaving || isViewMode}
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
                                            disabled={isSaving || isViewMode}
                                        />
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
                                                        onChange={() => toggleCompanyType(option)}
                                                        disabled={isSaving || isViewMode}
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
                                                        onChange={() => toggleJobLocation(option)}
                                                        disabled={isSaving || isViewMode}
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

                        {/* Only show Save/Discard buttons in edit mode */}
                        {!isViewMode && (
                            <div className={styles.actionButtons}>
                                <button type="button" className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving || isViewMode || !hasActionableChanges}>Discard</button>
                                <button type="submit" className={styles.saveBtn} disabled={isSaving || isViewMode || !hasActionableChanges}>
                                    {isSaving ? (
                                        <>
                                            <div className={styles.loadingSpinner}></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
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
                isProcessing={isResumeProcessing}
                activeAction={resumeActionType}
            />
            <CropImageModal
                isOpen={isCropModalOpen}
                imageSrc={imageToCrop}
                onCrop={handleCropComplete}
                onClose={handleCropModalClose}
                onDiscard={handleCropDiscard}
            />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
            <PreviewProgressAlert
                isOpen={resumePreviewPopupState === 'progress'}
                progress={resumePreviewProgress}
                fileLabel="resume"
                color="#D23B42"
                progressColor="#D23B42"
            />
            <PreviewFailedAlert
                isOpen={resumePreviewPopupState === 'failed'}
                onClose={() => setResumePreviewPopupState('none')}
                color="#D23B42"
            />
            <CertificateDownloadProgressAlert
                isOpen={resumeDownloadPopupState === 'progress'}
                progress={resumeDownloadProgress}
                fileLabel="resume"
                color="#D23B42"
                progressColor="#D23B42"
            />
            <CertificateDownloadSuccessAlert
                isOpen={resumeDownloadPopupState === 'success'}
                onClose={() => setResumeDownloadPopupState('none')}
                fileLabel="resume"
                color="#D23B42"
            />
            <ActionDownloadFailedAlert
                isOpen={resumeDownloadPopupState === 'failed'}
                onClose={() => setResumeDownloadPopupState('none')}
                color="#D23B42"
            />
            <CertificateDownloadProgressAlert
                isOpen={isInitialLoading}
                progress={loadingProgress}
                fileLabel="student profile"
                title="Loading..."
                color="#D23B42"
                progressColor="#D23B42"
                messages={{
                    initial: 'Fetching student profile...',
                    mid: 'Loading latest record...',
                    final: 'Preparing page...'
                }}
            />
        </div>
    );
}

export default Coo_ManageStuEditPage;