import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { API_BASE_URL } from '../utils/apiConfig';

import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './StuProfile.module.css'; // Module Import
import achievementStyles from './Achievements.module.css'; // Achievement popup styles
import Adminicons from '../assets/BlueAdminicon.png';
import BestAchievement from '../assets/BestAchievementicon.svg';
import StuEyeIcon from '../assets/StuEyeicon.svg';
import StuUploadMarksheetIcon from '../assets/StuUploadMarksheeticon.svg';
import mongoDBService from '../services/mongoDBService.jsx';
import fastDataService from '../services/fastDataService.jsx';
import gridfsService from '../services/gridfsService';
import FieldUpdateBanner from '../components/alerts/FieldUpdateBanner';
import UnsavedChangesAlert from '../components/alerts/UnsavedChangesAlert';
import {
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
                        Changes Saved ✓
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
                    <h2>Image Size Exceeded ✗</h2>
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
                    console.log('✅ Cropped blob created:', blob.size, 'bytes');
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
                                    ↺
                                </button>
                                <span className={styles.angleValue}>{rotation}°</span>
                                <button
                                    onClick={() => setRotation((r) => (r + 10) % 360)}
                                    className={styles.rotateBtn}
                                    title="Rotate right"
                                >
                                    ↻
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
                    <h2>Invalid {urlType} Link ✗</h2>
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

function StuProfile({ onLogout, onViewChange }) {
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
    const [studentData, setStudentData] = useState(() => {
        // Initialize from cache to prevent layout shifts
        try {
            const cached = JSON.parse(localStorage.getItem('studentData') || 'null');
            return cached || null;
        } catch {
            return null;
        }
    });
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
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
    const savedDataRef = useRef(null);
    const afterSaveNavRef = useRef(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavView, setPendingNavView] = useState(null);

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
            preferredTraining: 'Preferred Training',

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

            // Handle arrays (like companyTypes, preferredJobLocation, preferredTraining)
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

    // Company Details — merge real studentData with mock fallbacks
    const companyStats = useMemo(() => ({
        totalCompaniesAttended: studentData?.totalCompaniesAttended ?? 10,
        totalDrivesAttended:    studentData?.totalDrivesAttended    ?? 14,
        shortlistedCount:       studentData?.shortlistedCount       ?? 11,
        preferredModeOfDrive:   studentData?.preferredModeOfDrive   || 'Hybrid',
        lastDriveAttended:      studentData?.lastDriveAttended      || '',
        lastDriveResult:        studentData?.lastDriveResult        || '',
        highestPackageDrive:    studentData?.highestPackageDrive    ?? 24,
        totalRoundsCleared:     studentData?.totalRoundsCleared     ?? 19,
    }), [studentData]);

    const PIE_DATA = [
        { name: 'GD Round',      value: 20, color: '#FF9F43' },
        { name: 'Aptitude',      value: 26, color: '#F4C542' },
        { name: 'Technical',     value: 15, color: '#3DDAD7' },
        { name: 'HR Round',      value: 28, color: '#FF7A9E' },
        { name: 'Communication', value: 36, color: '#6C7A89' },
        { name: 'Coding',        value: 31, color: '#197AFF' },
    ];

    const ROUND_DETAILS = {
        'GD Round': {
            companies: [
                { name: 'TCS',           status: 'PASSED'      },
                { name: 'Infosys',       status: 'FAILED'      },
                { name: 'Wipro',         status: 'IN PROGRESS' },
                { name: 'Accenture',     status: 'PASSED'      },
                { name: 'Capgemini',     status: 'PASSED'      },
                { name: 'HCL',           status: 'FAILED'      },
                { name: 'Tech Mahindra', status: 'PASSED'      },
                { name: 'L&T Infotech',  status: 'IN PROGRESS' },
                { name: 'Cognizant',     status: 'PASSED'      },
                { name: 'Mphasis',       status: 'FAILED'      },
            ],
            good: ['Strong articulation of points during the debate.', 'Active listening and building on others\' ideas.'],
            bad:  ['Tended to interrupt occasionally when excited.', 'Eye contact could be more balanced across group.'],
        },
        'Aptitude': {
            companies: [
                { name: 'TCS',           status: 'PASSED'      },
                { name: 'Wipro',         status: 'PASSED'      },
                { name: 'Infosys',       status: 'FAILED'      },
                { name: 'HCL',           status: 'PASSED'      },
                { name: 'Capgemini',     status: 'IN PROGRESS' },
                { name: 'Accenture',     status: 'PASSED'      },
                { name: 'IBM',           status: 'FAILED'      },
                { name: 'Cognizant',     status: 'PASSED'      },
                { name: 'Oracle',        status: 'IN PROGRESS' },
                { name: 'Mphasis',       status: 'PASSED'      },
            ],
            good: ['Consistently strong in quantitative reasoning.', 'Completed all sections within time limits.'],
            bad:  ['Occasional errors in data interpretation.', 'Verbal reasoning scores could be improved.'],
        },
        'Technical': {
            companies: [
                { name: 'Google',        status: 'PASSED'      },
                { name: 'Microsoft',     status: 'IN PROGRESS' },
                { name: 'Amazon',        status: 'FAILED'      },
                { name: 'Flipkart',      status: 'PASSED'      },
                { name: 'Zoho',          status: 'PASSED'      },
                { name: 'Freshworks',    status: 'FAILED'      },
                { name: 'Adobe',         status: 'PASSED'      },
                { name: 'Salesforce',    status: 'IN PROGRESS' },
                { name: 'SAP',           status: 'PASSED'      },
                { name: 'Qualcomm',      status: 'FAILED'      },
            ],
            good: ['Strong knowledge of data structures and algorithms.', 'Explained approach clearly before coding.'],
            bad:  ['Struggled with on-the-spot system design questions.', 'Edge cases missed in a few solutions.'],
        },
        'HR Round': {
            companies: [
                { name: 'Deloitte',      status: 'PASSED'      },
                { name: 'EY',            status: 'PASSED'      },
                { name: 'KPMG',          status: 'FAILED'      },
                { name: 'Accenture',     status: 'PASSED'      },
                { name: 'TCS',           status: 'IN PROGRESS' },
                { name: 'Infosys',       status: 'PASSED'      },
                { name: 'Wipro',         status: 'FAILED'      },
                { name: 'HCL',           status: 'PASSED'      },
                { name: 'Capgemini',     status: 'PASSED'      },
                { name: 'Cognizant',     status: 'IN PROGRESS' },
            ],
            good: ['Confident and well-structured answers.', 'Good alignment of career goals with company values.'],
            bad:  ['Salary negotiation needs improvement.', 'Answers were occasionally too long-winded.'],
        },
        'Communication': {
            companies: [
                { name: 'TCS',           status: 'PASSED'      },
                { name: 'Infosys',       status: 'PASSED'      },
                { name: 'Wipro',         status: 'FAILED'      },
                { name: 'Accenture',     status: 'PASSED'      },
                { name: 'L&T Infotech',  status: 'IN PROGRESS' },
                { name: 'Capgemini',     status: 'PASSED'      },
                { name: 'HCL',           status: 'PASSED'      },
                { name: 'Tech Mahindra', status: 'FAILED'      },
                { name: 'Mphasis',       status: 'IN PROGRESS' },
                { name: 'Cognizant',     status: 'PASSED'      },
            ],
            good: ['Clear and confident verbal communication.', 'Excellent email and written communication skills.'],
            bad:  ['Pace of speech becomes fast under pressure.', 'Could improve active listening in panel discussions.'],
        },
        'Coding': {
            companies: [
                { name: 'Google',        status: 'PASSED'      },
                { name: 'Microsoft',     status: 'PASSED'      },
                { name: 'Amazon',        status: 'IN PROGRESS' },
                { name: 'Adobe',         status: 'PASSED'      },
                { name: 'Flipkart',      status: 'FAILED'      },
                { name: 'Zoho',          status: 'PASSED'      },
                { name: 'Freshworks',    status: 'PASSED'      },
                { name: 'Oracle',        status: 'FAILED'      },
                { name: 'SAP',           status: 'IN PROGRESS' },
                { name: 'Qualcomm',      status: 'PASSED'      },
            ],
            good: ['Efficient solutions with optimal time complexity.', 'Strong command of multiple programming languages.'],
            bad:  ['Occasionally skipped writing test cases.', 'Dynamic programming approach needs more practice.'],
        },
    };

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
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (!storedStudentData || !storedStudentData._id) return;
            
            const studentId = storedStudentData._id || storedStudentData.id;
            const completeData = await fastDataService.getCompleteStudentData(studentId);
            
            if (completeData && completeData.student) {
                populateFormFields(completeData.student);
                if (completeData.resume) localStorage.setItem('resumeData', JSON.stringify(completeData.resume));
                if (completeData.certificates) localStorage.setItem('certificatesData', JSON.stringify(completeData.certificates));
            } else {
                const storedRegNo = localStorage.getItem('regNo');
                const storedDob = localStorage.getItem('dob');
                if (storedRegNo && storedDob) {
                    const fallbackData = await mongoDBService.getStudentByRegNoAndDob(storedRegNo, storedDob);
                    if (fallbackData) populateFormFields(fallbackData);
                }
            }
        } catch (error) {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (storedStudentData) populateFormFields(storedStudentData);
        }
    }, []);

    useEffect(() => {
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData && storedStudentData._id) {
            populateFormFields(storedStudentData);
            const instantData = fastDataService.getInstantData(storedStudentData._id);
            if (instantData && instantData.student) populateFormFields(instantData.student);
            
            if (storedStudentData.profilePicURL) {
                window.dispatchEvent(new CustomEvent('profileUpdated', { 
                    detail: { profilePicURL: storedStudentData.profilePicURL, studentData: storedStudentData } 
                }));
            }
            
            // Set initial sync time
            setLastSyncTime(storedStudentData.updatedAt || new Date().toISOString());
        }
        loadStudentData();
        
        return () => {
            // Cleanup handled globally in AuthContext
        };
    }, [loadStudentData]);

    // Auto-sync mechanism: Check for profile updates every 30 seconds
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
                if (!storedStudentData || !storedStudentData._id) return;
                
                const studentId = storedStudentData._id || storedStudentData.id;
                
                // Use the lightweight status endpoint instead of full student fetch
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/students/${studentId}/status`, {
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
    }, []); // Fixed: Removed lastSyncTime dependency to prevent interval recreation

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

        console.log('✅ File selected for cropping:', {
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
                    console.log('🔄 Uploading profile photo to GridFS...');
                    const result = await gridfsService.uploadProfileImage(profilePhotoFile, studentId, 'student');
                    if (result && result.url) {
                        profilePhotoUrl = result.url; // relative GridFS path e.g. /api/file/xxx
                        finalResolvedUrl = gridfsService.getFileUrl(result.url); // full URL
                        
                        // Don't update UI yet - keep old image visible until save completes
                        // This prevents sidebar flicker (old → placeholder → new)
                        setProfilePhotoFile(null);
                        
                        console.log('✅ Profile photo uploaded to GridFS:', profilePhotoUrl);
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
                            console.log('⚠️ Image preload timeout, continuing anyway');
                            resolve();
                        }, 3000); // 3 second max wait
                        
                        img.onload = () => {
                            clearTimeout(timeout);
                            console.log('✅ New profile image preloaded successfully');
                            resolve();
                        };
                        img.onerror = () => {
                            clearTimeout(timeout);
                            console.log('⚠️ Image preload failed, continuing anyway');
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

    if (isInitialLoading) {
        return (
            <div className={styles.container}>
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
                        <div className={styles.initialLoaderOverlay}>
                            <div className={styles.initialLoaderCard}>
                                <div className={styles.loadingSpinner}></div>
                                <p>Loading your profile...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
            <UnsavedChangesAlert
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
                changedFields={changedFieldsList.length > 0 ? changedFieldsList : getChangedFields()}
            />

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
                                        <input type="text" name="address" placeholder="Enter Address" value={studentData?.address || ''} onChange={(e) => setStudentData(prev => ({ ...prev, address: e.target.value }))} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>City</label>
                                        <input type="text" name="city" placeholder="Enter City" value={studentData?.city || ''} onChange={(e) => setStudentData(prev => ({ ...prev, city: e.target.value }))} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Primary Email <RequiredStar /></label>
                                        <input type="email" name="primaryEmail" placeholder="Enter Primary Email" value={studentData?.primaryEmail || ''} onChange={(e) => setStudentData(prev => ({ ...prev, primaryEmail: e.target.value }))} disabled={isSaving} />
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
                                        <input type="text" name="fatherOccupation" placeholder="Enter Father Occupation" value={studentData?.fatherOccupation || ''} onChange={(e) => setStudentData(prev => ({ ...prev, fatherOccupation: e.target.value }))} disabled={isSaving} />
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
                                        <input type="text" name="motherOccupation" placeholder="Enter Mother Occupation" value={studentData?.motherOccupation || ''} onChange={(e) => setStudentData(prev => ({ ...prev, motherOccupation: e.target.value }))} disabled={isSaving} />
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
                                        <input type="text" name="guardianName" placeholder="Enter Guardian Name" value={studentData?.guardianName || ''} onChange={(e) => setStudentData(prev => ({ ...prev, guardianName: e.target.value }))} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>Guardian Number</label>
                                        <div className={styles.mobileInputWrapper}>
                                            <div className={styles.countryCode}>+91</div>
                                            <input type="tel" name="guardianMobile" placeholder="Enter Guardian Number" value={studentData?.guardianMobile || ''} onChange={(e) => handleMobileChange(e, 'guardianMobile')} disabled={isSaving} className={styles.mobileNumberInput} />
                                        </div>
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
                                        <div className={styles.uploadActionArea}>
                                            <div className={styles.uploadBtnWrapper}>
                                                <label htmlFor="photo-upload-input" className={styles.profileUploadBtn}>
                                                    <div className={styles.uploadBtnContent}>
                                                        <MdUpload /> <span>Upload (Max 500 KB)</span>
                                                    </div>
                                                </label>
                                                {profileImage && (
                                                    <button onClick={handleImageRemove} className={styles.removeImageBtn} aria-label="Remove image" disabled={isSaving}>
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
                                                disabled={isSaving}
                                            />
                                            {uploadSuccess && <p className={styles.uploadSuccessMessage}>Profile Photo uploaded Successfully!</p>}
                                            <p className={styles.uploadHint}>*JPG, JPEG, and WebP formats allowed (WebP recommended).</p>
                                        </div>
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
                                        <input type="text" name="bloodGroup" placeholder="Enter Blood Group" value={studentData?.bloodGroup || ''} onChange={(e) => setStudentData(prev => ({ ...prev, bloodGroup: e.target.value }))} disabled={isSaving} />
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Aadhaar Number <RequiredStar /></label>
                                        <input type="text" name="aadhaarNo" placeholder="Enter Aadhaar Number (12 digits)" value={studentData?.aadhaarNo || ''} maxLength="12" readOnly className={styles.readOnlyInput} />
                                    </div>
                                    <div className={styles.field} style={{ marginTop: '24px' }}>
                                        <label>Portfolio Link</label>
                                        <input type="url" name="portfolioLink" placeholder="Enter Portfolio Link" value={studentData?.portfolioLink || ''} onChange={(e) => setStudentData(prev => ({ ...prev, portfolioLink: e.target.value }))} disabled={isSaving} />
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
                                            onClick={() => onViewChange('semester-marksheet-upload')}
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
                        
                        {/* --- COMPANY DETAILS / ANALYSIS TOGGLE --- */}
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
                                                        stroke="#0062C5"
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
                                    {/* ── Analysis Panel (inline) ── */}
                                    <div className={styles.anlsHeader}>
                                        <h3 className={styles.sectionHeader} style={{ marginBottom: 0, paddingBottom: '6px' }}>Analysis</h3>
                                        <div className={styles.anlsTitleRow}>
                                            <span className={styles.anlsPlacedBadge}><span className={styles.anlsPlacedDot} />Placed</span>
                                            <button type="button" className={styles.anlsBackBtn} onClick={() => setShowAnalysis(false)}>Back ↩</button>
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
                                                            const label = name === 'HR Round' ? 'HR'
                                                                        : name === 'GD Round' ? 'GD'
                                                                        : name;
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
                                                        ✕ Clear Selection
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
                                                            <div className={styles.anlsStatValue}>38</div>
                                                        </div>
                                                        <div className={`${styles.anlsStatCard} ${styles.anlsCardBlue}`}>
                                                            <div className={styles.anlsStatTop}>
                                                                <svg className={styles.anlsStatIcon} viewBox="0 0 24 24" fill="none">
                                                                    <circle cx="12" cy="12" r="9" stroke="#2085f6" strokeWidth="1.8"/>
                                                                    <path d="M8 12l3 3 5-5" stroke="#2085f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                                <span className={styles.anlsStatLabel}>Shortlisted</span>
                                                            </div>
                                                            <div className={styles.anlsStatValue}>12</div>
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
                                                                {['Group Discussion','Aptitude','HR Round','Technical'].map(i => <li key={i}><span className={styles.anlsArrow}>→</span>{i}</li>)}
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
                                                                {['Communication','Coding','HR Round'].map(i => <li key={i}><span className={styles.anlsArrow}>→</span>{i}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Right column: Achievement+LastActivity OR Good/Bad on click */}
                                                {selectedRound && ROUND_DETAILS[selectedRound] ? (
                                                    <div className={styles.anlsAchievCol}>
                                                        <div className={styles.anlsGoodCard}>
                                                            <div className={styles.anlsGoodBadHeader}>
                                                                <span className={styles.anlsGoodIcon}>👍</span>
                                                                <span className={styles.anlsGoodLabel}>GOOD</span>
                                                            </div>
                                                            {ROUND_DETAILS[selectedRound].good.map((g, i) => (
                                                                <div key={i} className={styles.anlsGoodItem}>
                                                                    <span className={styles.anlsCheckIcon}>✅</span>
                                                                    <span>{g}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className={styles.anlsBadCard}>
                                                            <div className={styles.anlsGoodBadHeader}>
                                                                <span className={styles.anlsGoodIcon}>👎</span>
                                                                <span className={styles.anlsBadLabel}>BAD</span>
                                                            </div>
                                                            {ROUND_DETAILS[selectedRound].bad.map((b, i) => (
                                                                <div key={i} className={styles.anlsBadItem}>
                                                                    <span className={styles.anlsCheckIcon}>❌</span>
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
                                                                    <span className={styles.anlsAchievLPA}>24 LPA</span>
                                                                    <span className={styles.anlsAchievSub}>Highest Package</span>
                                                                </div>
                                                                <div className={styles.anlsAchievCompany}>
                                                                    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm2-4h14v-2H5v2zm0-4h14V7H5v2zm2-7v2h10V2H7z"/></svg>
                                                                    <span>Google</span>
                                                                </div>
                                                            </div>
                                                            <div className={styles.anlsAchievBadge}>
                                                                <img src={BestAchievement} alt="Best Achievement" width="40" height="40" style={{ objectFit: 'contain' }} />
                                                            </div>
                                                        </div>
                                                        <div className={styles.anlsLastActivity}>
                                                            <p className={styles.anlsLastTitle}>LAST ACTIVITY</p>
                                                            <p className={styles.anlsLastCompany}>Microsoft</p>
                                                            <p className={styles.anlsLastRole}>SDE Intern</p>
                                                            <span className={styles.anlsLastBadge}>Interviewing</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Legend always visible */}
                                            <div className={styles.anlsLegendBox}>
                                                <div className={styles.anlsLegend}>
                                                    {[
                                                        { n:'Communication', c:'#6C7A89', p:26 },
                                                        { n:'Coding',        c:'#197AFF', p:24 },
                                                        { n:'GD Round',      c:'#FF9F43', p:8  },
                                                        { n:'Aptitude',      c:'#F4C542', p:12 },
                                                        { n:'Technical',     c:'#3DDAD7', p:15 },
                                                        { n:'HR round',      c:'#FF7A9E', p:15 },
                                                    ].map(d => (
                                                        <div key={d.n} className={styles.anlsLegendItem}>
                                                            <span className={styles.anlsLegendCircle} style={{ background: d.c }}>{d.p}%</span>
                                                            <span className={styles.anlsLegendName}>{d.n}</span>
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
                                        <button
                                            type="button"
                                            className={styles.removeSkillBtn}
                                            onClick={() => handleRemoveSkill(index)}
                                            disabled={isSaving}
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
                                    disabled={isSaving}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:'22px',height:'22px',flexShrink:0}}>
                                        <circle cx="12" cy="12" r="10" fill="white" stroke="white"/>
                                        <line x1="12" y1="7" x2="12" y2="17" stroke="#197AFF" strokeWidth="2.5"/>
                                        <line x1="7" y1="12" x2="17" y2="12" stroke="#197AFF" strokeWidth="2.5"/>
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
                                                        onChange={() => handleTrainingToggle(option)}
                                                        disabled={isSaving}
                                                        style={{ cursor: isSaving ? 'not-allowed' : 'pointer' }}
                                                    />
                                                    <span style={{ cursor: isSaving ? 'not-allowed' : 'pointer' }}>{option}</span>
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
                                                        disabled
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
                                                        disabled
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
                        
                        <div className={styles.actionButtons}>
                            <button type="button" className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving}>Discard</button>
                            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
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
            <CropImageModal
                isOpen={isCropModalOpen}
                imageSrc={imageToCrop}
                onCrop={handleCropComplete}
                onClose={handleCropModalClose}
                onDiscard={handleCropDiscard}
            />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default StuProfile;