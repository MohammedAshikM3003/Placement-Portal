import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import '../components/alerts/AlertStyles.css';
import useAdminAuth from '../utils/useAdminAuth';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import AdCalendar from '../components/Calendar/Ad_Calendar.jsx';
import { API_BASE_URL } from '../utils/apiConfig';
import gridfsService from '../services/gridfsService';
import { saveProfileObjectCache } from '../hooks/useProfileCache';
import { resolveProfileUrl } from '../components/Sidebar/profileUtils';
import mongoDBService from '../services/mongoDBService.jsx';
// Assuming these paths are correct for your existing files
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
// FIXED: Import CSS as a Module
import styles from './AdminmainProfile.module.css';
import Dropdown from '../components/common/Dropdown/Dropdown';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import ContentContainer from '../components/layout/ContentContainer/ContentContainer';
import ResponsiveGrid from '../components/layout/ResponsiveGrid/ResponsiveGrid';

// Placeholder image
import Adminicon from "../assets/Adminicon.png";
import ProfileGraduationcap from "../assets/AdminProfileGraduationcap.svg"
// GridFS replaces base64 compression
// import { fileToBase64WithCompression, getBase64SizeKB } from '../utils/imageCompression';

// --- Required Fields Config ---
const REQUIRED_ADMIN_FIELDS = [
    { field: 'firstName', label: 'First Name' },
    { field: 'lastName', label: 'Last Name' },
    { field: 'dob', label: 'DOB' },
    { field: 'gender', label: 'Gender' },
    { field: 'emailId', label: 'Email ID' },
    { field: 'domainMailId', label: 'Domain Mail ID' },
    { field: 'phoneNumber', label: 'Phone Number' },
    { field: 'department', label: 'Branch' },
];

const RequiredStar = () => <span className={styles['Admin-profile-required-star']}>*</span>;

const DropdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4" viewBox="0 0 292.4 292.4" className={styles['Admin-profile-dropdown-icon']}>
        <path fill="#999" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.2 1.8-12.9 5.4-3.7 3.6-5.5 8-5.5 13s1.8 9.4 5.5 13l128.8 128.8c3.7 3.7 8 5.5 13 5.5s9.4-1.8 13-5.5l128.8-128.8c3.7-3.6 5.4-8 5.4-13s-1.7-9.4-5.4-13z" />
    </svg>
);

const MissingFieldsCard = ({ missingFields, onFieldClick, showAllErrors, onToggleShowAll, errorTooltip, supportsPointerTooltip, onTooltipMove, onTooltipLeave }) => {
    if (!missingFields.length) return null;
    const visibleFields = showAllErrors ? missingFields : missingFields.slice(0, 10);
    return (
        <div className={styles['Admin-profile-validation-box']}>
            <h4 className={styles['Admin-profile-validation-heading']}>
                <span className={styles['Admin-profile-validation-icon']} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" role="img" focusable="false">
                        <path fill="currentColor" d="M1 21h22L12 2L1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                </span>
                Required Fields Missing:
            </h4>
            <ul className={styles['Admin-profile-validation-list']}>
                {visibleFields.map((error, index) => (
                    <li
                        key={`${error.field}-${index}`}
                        className={styles['Admin-profile-validation-item']}
                        role="button"
                        tabIndex={0}
                        aria-label="Click to navigate"
                        onClick={() => onFieldClick(error.field)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFieldClick(error.field); } }}
                        onMouseEnter={supportsPointerTooltip ? onTooltipMove : undefined}
                        onMouseMove={supportsPointerTooltip ? onTooltipMove : undefined}
                        onMouseLeave={supportsPointerTooltip ? onTooltipLeave : undefined}
                    >
                        {error.customMessage || `${error.label} is required`}
                    </li>
                ))}
            </ul>
            {supportsPointerTooltip && errorTooltip.visible && (
                <div
                    className={styles['Admin-profile-validation-pointer-tooltip']}
                    style={{ left: `${errorTooltip.x}px`, top: `${errorTooltip.y}px` }}
                >
                    Click to navigate
                </div>
            )}
            {missingFields.length > 10 && (
                <div className={styles['Admin-profile-validation-toggle']}>
                    <button type="button" onClick={onToggleShowAll} className={styles['Admin-profile-show-more-btn']}>
                        <span>{showAllErrors ? 'Show Less' : `Show More (${missingFields.length - 10} more)`}</span>
                        <span className={styles['Admin-profile-show-more-caret']} aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
                                {showAllErrors ? (
                                    <path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                    <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                )}
                            </svg>
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper functions for date handling
// Icons (Classes updated to modular format where needed)
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

// FileSizeErrorPopup Component
const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;

    return (
        <div className={styles['mr-popup-overlay']}>
            <div className={styles['mr-popup-container']}>
                <div className={styles['mr-popup-header']} style={{ backgroundColor: '#4EA24E' }}>
                    Image Too Large!
                </div>
                <div className={styles['mr-popup-body']}>
                    <div className={styles['mr-image-error-icon-container']}>
                        <svg
                            className={styles['mr-image-error-icon']}
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                                <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
                            </g>
                        </svg>
                    </div>
                    <h2 style={{ color: '#d32f2f' }}>Image Size Exceeded âœ—</h2>
                    <p style={{ marginBottom: '16px', marginTop: '20px' }}>
                        Maximum allowed: <strong>500KB</strong>
                    </p>
                    <p style={{ marginBottom: '16px' }}>
                        Your image size: <strong>{fileSizeKB}KB</strong>
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '20px', marginBottom: '10px' }}>
                        Please compress your image or choose a smaller file.
                    </p>
                </div>
                <div className={styles['mr-popup-footer']}>
                    <button onClick={onClose} className={styles['mr-popup-close-btn-red']}>OK</button>
                </div>
            </div>
        </div>
    );
};

// SuccessPopup Component
const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(18,18,34,0.11)',
            zIndex: 1000,
        }}>
            <div className={styles['Admin-DB-AdProfile-popup-container']}>
                <div className={styles['Admin-DB-AdProfile-popup-header']}>Saved !</div>
                <div className={styles['Admin-DB-AdProfile-popup-body']}>
                    <svg className={styles['Admin-DB-AdProfile-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-DB-AdProfile-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={styles['Admin-DB-AdProfile-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Changes Saved âœ“</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className={styles['Admin-DB-AdProfile-popup-footer']}>
                    <button onClick={onClose} className={styles['Admin-DB-AdProfile-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

// Key Icon for Change Login Details button
const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', marginRight: '10px' }}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
);

const normalizeFileLabel = (label = 'resume') => {
    const safe = (label ?? 'resume').toString().trim();
    const lower = safe ? safe.toLowerCase() : 'resume';
    const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
    return { lower, capitalized };
};

const DownloadFailedAlert = ({ isOpen, onClose, color = '#4ea24e' }) => {
    if (!isOpen) return null;

    return (
        <div className="alert-overlay">
            <div className="achievement-popup-container">
                <div className="achievement-popup-header" style={{ backgroundColor: color }}>
                    Download Failed !
                </div>
                <div className="achievement-popup-body">
                    <div className="download-error-icon-container">
                        <svg className="download-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className="download-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
                            <path className="download-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
                        Download Failed !
                    </h2>
                    <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
                        Unable to download the image.<br />
                        Please try again or contact support.
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

const DownloadSuccessAlert = ({ isOpen, onClose, fileLabel = 'resume', title = 'Downloaded !', description, color = '#4ea24e' }) => {
    if (!isOpen) return null;

    const { lower: labelLower, capitalized: labelCapitalized } = normalizeFileLabel(fileLabel);
    const defaultDescription = (
        <>
            The {labelLower} has been successfully
            <br />
            downloaded to your device.
        </>
    );

    return (
        <div className="alert-overlay">
            <div className="achievement-popup-container">
                <div className="achievement-popup-header" style={{ backgroundColor: color }}>
                    {title}
                </div>
                <div className="achievement-popup-body">
                    <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
                        {labelCapitalized} Downloaded âœ“
                    </h2>
                    <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
                        {description || defaultDescription}
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

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const normalizeJpegFilename = (fileName, fallbackName) => {
    const baseName = (fileName || fallbackName || 'image.jpg').trim() || 'image.jpg';
    return baseName.replace(/\.[^.]+$/, '') + '.jpg';
};

const ImagePreviewModal = ({ src, isOpen, onClose, title = 'Preview Image', alt = 'Preview Image', downloadFilename = 'profile-image.jpg' }) => {
    const [downloadPopupState, setDownloadPopupState] = useState('none');
    const shouldShowPreviewPopup = downloadPopupState === 'none' || downloadPopupState === 'progress';

    const handleDownload = async () => {
        if (!src) return;

        if (downloadPopupState !== 'none') return;

        setDownloadPopupState('progress');

        try {
            // Resolve profile URL using shared resolver (handles ids, /api/file/* and runtime base fallback)
            let resolvedUrl = resolveProfileUrl(src, API_BASE_URL);

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
            link.download = downloadFilename;
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

    const handleSuccessClose = () => {
        setDownloadPopupState('none');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {shouldShowPreviewPopup && (
                <div className={styles.imagePreviewOverlay} onClick={downloadPopupState === 'progress' ? undefined : onClose}>
                    <div className={styles.imagePreviewContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.imagePreviewHeader}>{title}</div>
                        <div className={styles.imagePreviewBody}>
                            <img src={src} alt={alt} />
                        </div>
                        <div className={styles.imagePreviewFooter}>
                            <button onClick={onClose} disabled={downloadPopupState === 'progress'} className={`${styles.imagePreviewFooterBtn} ${styles.imagePreviewCloseBtn}`}>
                                Close
                            </button>
                            <button onClick={handleDownload} disabled={downloadPopupState === 'progress'} className={`${styles.imagePreviewFooterBtn} ${styles.imagePreviewDownloadBtn}`}>
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
                color="#4ea24e"
            />
            <DownloadFailedAlert
                isOpen={downloadPopupState === 'error'}
                onClose={() => setDownloadPopupState('none')}
                color="#4ea24e"
            />
        </>
    );
};

const CropImageModal = ({ isOpen, imageSrc, onCrop, onClose, onDiscard }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const createCroppedImage = useCallback(async () => {
        if (!imageSrc || !croppedAreaPixels) {
            return null;
        }

        try {
            const image = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) return null;

            const { width, height, x, y } = croppedAreaPixels;
            canvas.width = width;
            canvas.height = height;

            ctx.save();

            if (rotation !== 0) {
                const centerX = width / 2;
                const centerY = height / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.translate(-centerX, -centerY);
            }

            ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
            ctx.restore();

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(null);
                        return;
                    }
                    resolve(blob);
                }, 'image/jpeg', 0.95);
            });
        } catch (error) {
            console.error('Error creating cropped image:', error);
            return null;
        }
    }, [croppedAreaPixels, imageSrc, rotation]);

    const handleSaveCrop = async () => {
        const croppedBlob = await createCroppedImage();
        if (croppedBlob) {
            onCrop(croppedBlob);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.cropOverlay}>
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
                                <button onClick={() => setRotation((value) => (value - 10 + 360) % 360)} className={styles.rotateBtn} type="button">â†º</button>
                                <span className={styles.angleValue}>{rotation}Â°</span>
                                <button onClick={() => setRotation((value) => (value + 10) % 360)} className={styles.rotateBtn} type="button">â†»</button>
                            </div>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className={styles.angleSlider}
                            />
                            <button onClick={() => setRotation(0)} className={styles.resetBtn} type="button">Reset</button>
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.controlLabel}>Aspect Ratio</label>
                            <div className={styles.aspectRatioButtons}>
                                <button onClick={() => setAspect(null)} className={`${styles.aspectBtn} ${aspect === null ? styles.active : ''}`} type="button">Custom</button>
                                <button onClick={() => setAspect(1)} className={`${styles.aspectBtn} ${aspect === 1 ? styles.active : ''}`} type="button">1:1</button>
                                <button onClick={() => setAspect(4 / 3)} className={`${styles.aspectBtn} ${aspect === 4 / 3 ? styles.active : ''}`} type="button">4:3</button>
                                <button onClick={() => setAspect(3 / 4)} className={`${styles.aspectBtn} ${aspect === 3 / 4 ? styles.active : ''}`} type="button">3:4</button>
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
                    <button onClick={onDiscard} className={`${styles.cropBtn} ${styles.cropDiscardBtn}`} type="button">Discard</button>
                    <button onClick={handleSaveCrop} className={`${styles.cropBtn} ${styles.cropUploadBtn}`} type="button">Upload</button>
                </div>
            </div>
        </div>
    );
};

const CollegeImageCropModal = ({ isOpen, imageSrc, cropType, onSave, onClose, onDiscard }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(cropType === 'banner' ? 16 / 10 : 1);
    const [aspectMode, setAspectMode] = useState(cropType === 'banner' ? 'preset' : 'preset');
    const [customAspectWidth, setCustomAspectWidth] = useState(16);
    const [customAspectHeight, setCustomAspectHeight] = useState(10);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setAspect(cropType === 'banner' ? 16 / 10 : 1);
        setAspectMode(cropType === 'banner' ? 'preset' : 'preset');
        setCustomAspectWidth(16);
        setCustomAspectHeight(10);
    }, [cropType, isOpen, imageSrc]);

    const getCustomAspectRatio = useCallback(() => {
        if (!customAspectWidth || !customAspectHeight) return null;
        return customAspectWidth / customAspectHeight;
    }, [customAspectHeight, customAspectWidth]);

    useEffect(() => {
        if (cropType === 'banner') {
            const ratio = getCustomAspectRatio();
            if (ratio && aspectMode === 'custom') {
                setAspect(ratio);
            }
        }
    }, [aspectMode, cropType, customAspectHeight, customAspectWidth, getCustomAspectRatio]);

    const onCropComplete = useCallback((_, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const createCroppedImage = useCallback(async () => {
        if (!imageSrc || !croppedAreaPixels) return null;

        try {
            const image = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const { width, height, x, y } = croppedAreaPixels;
            canvas.width = width;
            canvas.height = height;

            ctx.save();
            if (rotation !== 0) {
                const centerX = width / 2;
                const centerY = height / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.translate(-centerX, -centerY);
            }

            ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
            ctx.restore();

            return new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob || null), 'image/jpeg', 0.95);
            });
        } catch (error) {
            console.error(`Error creating cropped ${cropType} image:`, error);
            return null;
        }
    }, [cropType, croppedAreaPixels, imageSrc, rotation]);

    const handleSave = async () => {
        const croppedBlob = await createCroppedImage();
        if (croppedBlob) {
            onSave(croppedBlob);
        }
    };

    if (!isOpen) return null;

    const isBanner = cropType === 'banner';
    const modalOverlayClass = isBanner ? styles.collegeCropOverlay : styles.cropOverlay;
    const modalContainerClass = isBanner ? styles.collegeCropContainer : styles.cropContainer;
    const modalHeaderClass = isBanner ? styles.collegeCropHeader : styles.cropHeader;

    return (
        <div className={modalOverlayClass}>
            <div className={modalContainerClass} onClick={(e) => e.stopPropagation()}>
                <div className={modalHeaderClass}>{isBanner ? 'Crop Banner' : 'Crop Logo'}</div>

                {isBanner ? (
                    <>
                        <div className={styles.cropContent}>
                            <div className={styles.cropPreviewArea}>
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
                            </div>
                            <div className={styles.cropControls}>
                                <div className={styles.controlGroup}>
                                    <label className={styles.controlLabel}>Rotate</label>
                                    <div className={styles.rotateControl}>
                                        <button onClick={() => setRotation((value) => (value - 10 + 360) % 360)} className={styles.rotateBtn} type="button">â†º</button>
                                        <span className={styles.angleValue}>{rotation}Â°</span>
                                        <button onClick={() => setRotation((value) => (value + 10) % 360)} className={styles.rotateBtn} type="button">â†»</button>
                                    </div>
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={rotation}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className={styles.angleSlider}
                                    />
                                </div>

                                <div className={styles.controlGroup}>
                                    <label className={styles.controlLabel}>Aspect Ratio</label>
                                    <div className={styles.aspectRatioButtons}>
                                        <button type="button" onClick={() => setAspectMode('custom')} className={`${styles.aspectBtn} ${aspectMode === 'custom' ? styles.active : ''}`}>Custom</button>
                                        <button type="button" onClick={() => { setAspectMode('preset'); setAspect(27 / 10); }} className={`${styles.aspectBtn} ${aspectMode === 'preset' && aspect === 27 / 10 ? styles.active : ''}`}>27:10</button>
                                        <button type="button" onClick={() => { setAspectMode('preset'); setAspect(32 / 10); }} className={`${styles.aspectBtn} ${aspectMode === 'preset' && aspect === 32 / 10 ? styles.active : ''}`}>32:10</button>
                                        <button type="button" onClick={() => { setAspectMode('preset'); setAspect(36 / 10); }} className={`${styles.aspectBtn} ${aspectMode === 'preset' && aspect === 36 / 10 ? styles.active : ''}`}>36:10</button>
                                    </div>
                                    {aspectMode === 'custom' && (
                                        <div className={styles.customAspectEditor}>
                                            <div className={styles.customAspectField}>
                                                <span>W</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={customAspectWidth}
                                                    onChange={(e) => {
                                                        const nextWidth = Number(e.target.value);
                                                        setCustomAspectWidth(nextWidth);
                                                        if (nextWidth > 0 && customAspectHeight > 0) {
                                                            setAspect(nextWidth / customAspectHeight);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.customAspectField}>
                                                <span>H</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={customAspectHeight}
                                                    onChange={(e) => {
                                                        const nextHeight = Number(e.target.value);
                                                        setCustomAspectHeight(nextHeight);
                                                        if (customAspectWidth > 0 && nextHeight > 0) {
                                                            setAspect(customAspectWidth / nextHeight);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <button type="button" onClick={() => setRotation(0)} className={styles.resetBtn}>Reset</button>
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
                    </>
                ) : (
                    <div className={styles.cropContent}>
                        <div className={styles.cropPreviewArea}>
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
                        </div>

                        <div className={styles.cropControls}>
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Rotate</label>
                                <div className={styles.rotateControl}>
                                    <button onClick={() => setRotation((value) => (value - 10 + 360) % 360)} className={styles.rotateBtn} type="button">â†º</button>
                                    <span className={styles.angleValue}>{rotation}Â°</span>
                                    <button onClick={() => setRotation((value) => (value + 10) % 360)} className={styles.rotateBtn} type="button">â†»</button>
                                </div>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className={styles.angleSlider}
                                />
                            </div>

                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Aspect Ratio</label>
                                <div className={styles.aspectRatioButtons}>
                                    <button type="button" onClick={() => setAspect(1)} className={`${styles.aspectBtn} ${aspect === 1 ? styles.active : ''}`}>1:1</button>
                                    <button type="button" onClick={() => setAspect(4 / 3)} className={`${styles.aspectBtn} ${aspect === 4 / 3 ? styles.active : ''}`}>4:3</button>
                                    <button type="button" onClick={() => setAspect(3 / 4)} className={`${styles.aspectBtn} ${aspect === 3 / 4 ? styles.active : ''}`}>3:4</button>
                                </div>
                                <button type="button" onClick={() => setRotation(0)} className={styles.resetBtn}>Reset</button>
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
                )}

                <div className={styles.cropFooter}>
                    <button type="button" onClick={onDiscard} className={`${styles.cropBtn} ${styles.cropDiscardBtn}`}>Discard</button>
                    <button type="button" onClick={handleSave} className={`${styles.cropBtn} ${styles.cropUploadBtn}`}>Upload</button>
                </div>
            </div>
        </div>
    );
};

const EDITABLE_FIELD_LABELS = {
    firstName: 'First Name',
    lastName: 'Last Name',
    dob: 'Date Of Birth',
    gender: 'Gender',
    emailId: 'Personal Email',
    domainMailId: 'Domain Mail ID',
    phoneNumber: 'Phone Number',
    department: 'Department',
    profilePhoto: 'Profile Photo',
    collegeBanner: 'College Banner',
    naacCertificate: 'NAAC Certificate',
    nbaCertificate: 'NBA Certificate',
    collegeLogo: 'College Logo',
    newLoginId: 'New Login ID',
    confirmLoginId: 'Confirm Login ID',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password'
};

const normalizeValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    return String(value).trim();
};

const formatDobForPassword = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        // If it's in YYYY-MM-DD format, convert to DDMMYYYY
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = trimmed.split('-');
            return `${day}${month}${year}`;
        }
        // If it's already in DDMMYYYY format or other format, return as-is
        return trimmed;
    }

    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
        return normalizeValue(value);
    }

    const day = String(dateValue.getDate()).padStart(2, '0');
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const year = String(dateValue.getFullYear());
    return `${day}${month}${year}`;
};

// Sanitize cached URLs: if they point to localhost/loopback, strip host so
// `resolveProfileUrl(..., API_BASE_URL)` can rebuild a proper production URL.
const sanitizeCachedUrl = (value) => {
    if (!value || typeof value !== 'string') return value;
    try {
        const parsed = new URL(value, window.location.origin);
        const hostname = parsed.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return parsed.pathname + parsed.search + parsed.hash;
        }
    } catch (e) {
        // not a full URL - leave as-is
    }
    return value;
};

const EMPTY_PROFILE_SNAPSHOT = {
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    emailId: '',
    domainMailId: '',
    phoneNumber: '',
    department: '',
    currentLoginId: '',
    profilePhoto: '',
    collegeBanner: '',
    naacCertificate: '',
    nbaCertificate: '',
    collegeLogo: '',
    newLoginId: '',
    confirmLoginId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
};

function AdminFieldUpdateBanner({ isVisible, updatedFields = [] }) {
    if (!isVisible || updatedFields.length === 0) return null;

    const fieldText = updatedFields.join('  â€¢  ');
    const shouldScroll = updatedFields.length > 1;

    return (
        <div className={styles.adminBannerContainer}>
            <div className={styles.adminBanner}>
                <div className={styles.adminBannerIconWrapper}>
                    <svg
                        className={styles.adminBannerSaveIcon}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M17 21V13H7V21"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M7 3V8H15"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div className={styles.adminBannerContent}>
                    <p className={styles.adminBannerHeader}>Unsaved Changes</p>
                    <div className={`${styles.adminBannerFieldNamesWrapper} ${shouldScroll ? styles.adminBannerScrolling : ''}`}>
                        <div className={`${styles.adminBannerFieldNames} ${shouldScroll ? styles.adminBannerMarquee : ''}`}>
                            <span>{fieldText}</span>
                            {shouldScroll && <span>{fieldText}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UnsavedChangesModal({ isOpen, changedFields, onClose, onDiscard, onSave, isSaving = false }) {
    if (!isOpen) return null;

    return (
        <div className={styles.adminUnsavedOverlay} onClick={isSaving ? undefined : onClose}>
            <div className={styles.adminUnsavedContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.adminUnsavedHeader}>Details Changed !</div>

                <div className={styles.adminUnsavedBody}>
                    <div className={styles.adminUnsavedIconWrap}>
                        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="6" x2="12" y2="14" />
                            <circle cx="12" cy="18" r="0.75" fill="#fff" stroke="#fff" />
                        </svg>
                    </div>

                    <h2 className={styles.adminUnsavedTitle}>Modified Fields !</h2>

                    {changedFields.length > 0 && (
                        <div className={styles.adminUnsavedFieldsContainer}>
                            <div className={styles.adminUnsavedFieldsList}>
                                {changedFields.map((field, index) => (
                                    <span key={`${field}-${index}`} className={styles.adminUnsavedFieldChip}>
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className={styles.adminUnsavedMessage}>
                        Do you want to save these changes before leaving?
                    </p>
                </div>

                <div className={styles.adminUnsavedFooter}>
                    <button
                        type="button"
                        className={styles.adminUnsavedDiscardButton}
                        onClick={onDiscard}
                        disabled={isSaving}
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        className={styles.adminUnsavedSaveButton}
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Admainprofile() {
    useAdminAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(v => !v);
    
    // State to manage form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        emailId: '',
        domainMailId: '',
        phoneNumber: '',
        department: '',
    });

    // State for login details (no toggle - always visible)
    const [loginData, setLoginData] = useState({
        currentLoginId: '',
        newLoginId: '',
        confirmLoginId: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // State for profile photo
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoBase64, setProfilePhotoBase64] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [showLoginDetails, setShowLoginDetails] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] = useState(false);
    const [currentPasswordVerifyError, setCurrentPasswordVerifyError] = useState('');
    const [isVerifyingCurrentPassword, setIsVerifyingCurrentPassword] = useState(false);
    // Initialize college images from cache to prevent "No Banner" flash
    const [collegeBanner, setCollegeBanner] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeBanner || null;
            }
        } catch (e) {}
        return null;
    });
    const [collegeBannerBase64, setCollegeBannerBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeBanner || '';
            }
        } catch (e) {}
        return '';
    });
    const [collegeBannerName, setCollegeBannerName] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeBannerName || '';
            }
        } catch (e) {}
        return '';
    });
    const [collegeLogoName, setCollegeLogoName] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeLogoName || '';
            }
        } catch (e) {}
        return '';
    });
    const [naacCertificate, setNaacCertificate] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.naacCertificate || null;
            }
        } catch (e) {}
        return null;
    });
    const [naacCertificateBase64, setNaacCertificateBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.naacCertificate || '';
            }
        } catch (e) {}
        return '';
    });
    const [nbaCertificate, setNbaCertificate] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.nbaCertificate || null;
            }
        } catch (e) {}
        return null;
    });
    const [nbaCertificateBase64, setNbaCertificateBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.nbaCertificate || '';
            }
        } catch (e) {}
        return '';
    });
    const [collegeLogo, setCollegeLogo] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeLogo || null;
            }
        } catch (e) {}
        return null;
    });
    const [collegeLogoBase64, setCollegeLogoBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeLogo || '';
            }
        } catch (e) {}
        return '';
    });
    const collegeLogoDisplaySrc = useMemo(() => {
        const rawLogo = collegeLogoBase64 || collegeLogo || '';
        if (!rawLogo) return '';
        return resolveProfileUrl(sanitizeCachedUrl(rawLogo), API_BASE_URL);
    }, [collegeLogo, collegeLogoBase64]);

    const profilePhotoDisplaySrc = useMemo(() => {
        const rawPhoto = profilePhotoBase64 || profilePhoto || '';
        if (!rawPhoto) return '';
        return gridfsService.resolveImageUrl(sanitizeCachedUrl(rawPhoto));
    }, [profilePhoto, profilePhotoBase64]);
    
    // CRITICAL FIX: Resolve college banner URL to production backend (prevent localhost errors on Vercel)
    const collegeBannerDisplaySrc = useMemo(() => {
        const rawBanner = collegeBannerBase64 || collegeBanner || '';
        if (!rawBanner) return '';
        return gridfsService.resolveImageUrl(sanitizeCachedUrl(rawBanner));
    }, [collegeBanner, collegeBannerBase64]);
    
    // CRITICAL FIX: Resolve NAAC certificate URL to production backend
    const naacCertificateDisplaySrc = useMemo(() => {
        const rawNaac = naacCertificateBase64 || naacCertificate || '';
        if (!rawNaac) return '';
        return gridfsService.resolveImageUrl(sanitizeCachedUrl(rawNaac));
    }, [naacCertificate, naacCertificateBase64]);
    
    // CRITICAL FIX: Resolve NBA certificate URL to production backend
    const nbaCertificateDisplaySrc = useMemo(() => {
        const rawNba = nbaCertificateBase64 || nbaCertificate || '';
        if (!rawNba) return '';
        return gridfsService.resolveImageUrl(sanitizeCachedUrl(rawNba));
    }, [nbaCertificate, nbaCertificateBase64]);
    
    const [bannerUploadSuccess, setBannerUploadSuccess] = useState(false);
    const [naacUploadSuccess, setNaacUploadSuccess] = useState(false);
    const [nbaUploadSuccess, setNbaUploadSuccess] = useState(false);
    const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
    // Raw File objects for GridFS upload (set when user picks a new file)
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [collegeBannerFile, setCollegeBannerFile] = useState(null);
    const [naacCertificateFile, setNaacCertificateFile] = useState(null);
    const [nbaCertificateFile, setNbaCertificateFile] = useState(null);
    const [collegeLogoFile, setCollegeLogoFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavView, setPendingNavView] = useState(null);
    const savedDataRef = useRef(EMPTY_PROFILE_SNAPSHOT);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [collegeImagePreview, setCollegeImagePreview] = useState({
        isOpen: false,
        src: '',
        title: 'Preview Image',
        alt: 'Preview Image',
        downloadFilename: 'college-image.jpg'
    });
    const [imageToCrop, setImageToCrop] = useState(null);
    const [pendingProfilePhotoName, setPendingProfilePhotoName] = useState('profile.jpg');
    const [isCollegeCropOpen, setIsCollegeCropOpen] = useState(false);
    const [collegeCropType, setCollegeCropType] = useState('banner');
    const [collegeImageToCrop, setCollegeImageToCrop] = useState(null);
    const [pendingCollegeFileName, setPendingCollegeFileName] = useState('college-image.jpg');

    // --- Validation / MissingFieldsCard state ---
    const [branches, setBranches] = useState([]);
    const [showAllErrors, setShowAllErrors] = useState(false);
    const [highlightedField, setHighlightedField] = useState(null);
    const [errorTooltip, setErrorTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [supportsPointerTooltip, setSupportsPointerTooltip] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
        return (
            window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches ||
            window.matchMedia('(hover: hover) and (pointer: fine)').matches
        );
    });
    const fieldRefs = useRef({});
    const highlightResetTimerRef = useRef(null);
    const highlightClearTimerRef = useRef(null);

    // HYPER-FAST: Initialize loading states based on cache availability
    // If cache exists with valid data, start with isLoading=false to prevent flash
    const [isLoading, setIsLoading] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                // If we have meaningful cached data, don't show loading
                if (data.firstName || data.lastName || data.emailId) {
                    return false;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
        return true; // Show loading only if no valid cache
    });

    // Get admin login ID from localStorage or session
    const getAdminLoginID = () => {
        return localStorage.getItem('adminLoginID') || 'admin1000';
    };

    const getChangedFields = useCallback(() => {
        if (!savedDataRef.current) return [];

        const saved = savedDataRef.current;
        const changed = new Set();

        Object.keys(EDITABLE_FIELD_LABELS).forEach((key) => {
            if (key in formData) {
                if (normalizeValue(formData[key]) !== normalizeValue(saved[key])) {
                    changed.add(EDITABLE_FIELD_LABELS[key]);
                }
            }
        });

        const imageFieldPairs = [
            ['profilePhoto', profilePhoto],
            ['collegeBanner', collegeBanner],
            ['naacCertificate', naacCertificate],
            ['nbaCertificate', nbaCertificate],
            ['collegeLogo', collegeLogo]
        ];

        imageFieldPairs.forEach(([field, value]) => {
            if (normalizeValue(value) !== normalizeValue(saved[field])) {
                changed.add(EDITABLE_FIELD_LABELS[field]);
            }
        });

        ['newLoginId', 'confirmLoginId', 'currentPassword', 'newPassword', 'confirmPassword'].forEach((key) => {
            if (normalizeValue(loginData[key]) !== normalizeValue(saved[key])) {
                changed.add(EDITABLE_FIELD_LABELS[key]);
            }
        });

        return Array.from(changed);
    }, [formData, profilePhoto, collegeBanner, naacCertificate, nbaCertificate, collegeLogo, loginData]);

    const changedFields = useMemo(() => getChangedFields(), [getChangedFields]);
    const shouldShowLoginPasswordFields = isCurrentPasswordVerified;
    const normalizedNewLoginId = normalizeValue(loginData.newLoginId);
    const normalizedConfirmLoginId = normalizeValue(loginData.confirmLoginId);
    const isLoginIdMatch = Boolean(normalizedNewLoginId && normalizedConfirmLoginId && normalizedNewLoginId === normalizedConfirmLoginId);
    const loginIdMismatchError = normalizedNewLoginId && normalizedConfirmLoginId && !isLoginIdMatch
        ? 'New Login ID and Confirm Login ID must match.'
        : '';
    const shouldShowCurrentPasswordField = isLoginIdMatch;
    // Hint text derived from DOB (format: DDMMYYYY) used as password suggestion in other profile areas
    const dobPasswordHint = formatDobForPassword(formData.dob);

    // --- Fetch branches for Branch dropdown ---
    useEffect(() => {
        let isMounted = true;
        const fetchBranches = async () => {
            try {
                const branchResponse = await mongoDBService.getBranches();
                if (!isMounted) return;
                const branchList = Array.isArray(branchResponse)
                    ? branchResponse.filter((b) => b?.isActive !== false)
                    : [];
                setBranches(branchList);
            } catch (err) {
                console.warn('Failed to load branches:', err);
            }
        };
        fetchBranches();
        return () => { isMounted = false; };
    }, []);

    // --- Pointer tooltip support detection ---
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
        const hybridQuery = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
        const primaryQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const updatePointerSupport = () => {
            const isSupported = hybridQuery.matches || primaryQuery.matches;
            setSupportsPointerTooltip(isSupported);
            if (!isSupported) {
                setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
            }
        };
        updatePointerSupport();
        if (typeof hybridQuery.addEventListener === 'function') {
            hybridQuery.addEventListener('change', updatePointerSupport);
            primaryQuery.addEventListener('change', updatePointerSupport);
            return () => {
                hybridQuery.removeEventListener('change', updatePointerSupport);
                primaryQuery.removeEventListener('change', updatePointerSupport);
            };
        }
        hybridQuery.addListener(updatePointerSupport);
        primaryQuery.addListener(updatePointerSupport);
        return () => {
            hybridQuery.removeListener(updatePointerSupport);
            primaryQuery.removeListener(updatePointerSupport);
        };
    }, []);

    // --- Cleanup highlight timers on unmount ---
    useEffect(() => () => {
        if (highlightResetTimerRef.current) clearTimeout(highlightResetTimerRef.current);
        if (highlightClearTimerRef.current) clearTimeout(highlightClearTimerRef.current);
    }, []);

    // --- Missing required fields (drives MissingFieldsCard + Save button disabled) ---
    const missingRequiredFields = useMemo(() => {
        const list = [];

        // 1. Standard required fields
        REQUIRED_ADMIN_FIELDS.forEach(({ field, label }) => {
            if (!normalizeValue(formData[field])) {
                list.push({ field, label });
            }
        });

        // 2. Phone number format
        if (formData.phoneNumber && !/^[6789]\d{9}$/.test(formData.phoneNumber)) {
            list.push({
                field: 'phoneNumber',
                label: 'Phone Number',
                customMessage: 'Phone number must be 10 digits starting with 6, 7, 8, or 9'
            });
        }

        // 3. New password and confirm password presence validation if visible
        let newPasswordMissing = false;
        let confirmPasswordMissing = false;
        if (shouldShowLoginPasswordFields) {
            if (!normalizeValue(loginData.newPassword)) {
                list.push({
                    field: 'newPassword',
                    label: 'New Password'
                });
                newPasswordMissing = true;
            }
            if (!normalizeValue(loginData.confirmPassword)) {
                list.push({
                    field: 'confirmPassword',
                    label: 'Confirm Password'
                });
                confirmPasswordMissing = true;
            }
        }

        // 4. Special: If DOB is changed — validate password matches new DOB
        const isDobChanged = normalizeValue(formData.dob) !== normalizeValue(savedDataRef.current?.dob);
        if (isDobChanged && dobPasswordHint) {
            const enteredNew = normalizeValue(loginData.newPassword);
            const enteredConfirm = normalizeValue(loginData.confirmPassword);
            if (!newPasswordMissing && enteredNew !== dobPasswordHint) {
                list.push({
                    field: 'newPassword',
                    label: 'New Password',
                    customMessage: `DOB changed — New Password must be updated to match the new DOB (${dobPasswordHint})`
                });
            }
            if (!confirmPasswordMissing && enteredConfirm !== dobPasswordHint) {
                list.push({
                    field: 'confirmPassword',
                    label: 'Confirm Password',
                    customMessage: `DOB changed — Confirm Password must match new DOB (${dobPasswordHint})`
                });
            }
        } else if (dobPasswordHint) {
            const enteredNew = normalizeValue(loginData.newPassword);
            const enteredConfirm = normalizeValue(loginData.confirmPassword);
            if (!newPasswordMissing && enteredNew && enteredNew !== dobPasswordHint) {
                list.push({
                    field: 'newPassword',
                    label: 'New Password',
                    customMessage: `New Password must match DOB (${dobPasswordHint})`
                });
            }
            if (!confirmPasswordMissing && enteredConfirm && enteredConfirm !== dobPasswordHint) {
                list.push({
                    field: 'confirmPassword',
                    label: 'Confirm Password',
                    customMessage: `Confirm Password must match DOB (${dobPasswordHint})`
                });
            }
        }

        // 5. Password not matching
        if (showLoginDetails && !newPasswordMissing && !confirmPasswordMissing &&
            loginData.newPassword && loginData.confirmPassword &&
            loginData.newPassword !== loginData.confirmPassword) {
            list.push({
                field: 'confirmPassword',
                label: 'Confirm Password',
                customMessage: 'New Password and Confirm Password must match'
            });
        }

        return list;
    }, [formData, loginData, showLoginDetails, dobPasswordHint, shouldShowLoginPasswordFields]);

    const canSave = useMemo(() => {
        return missingRequiredFields.length === 0 && !isSaving && changedFields.length > 0;
    }, [missingRequiredFields.length, isSaving, changedFields.length]);

    // --- Field registration / scroll-to-field-and-blink ---
    const registerFieldRef = useCallback((field) => (node) => {
        fieldRefs.current[field] = node;
    }, []);

    const clearFieldHighlight = useCallback(() => {
        if (highlightResetTimerRef.current) { clearTimeout(highlightResetTimerRef.current); highlightResetTimerRef.current = null; }
        if (highlightClearTimerRef.current) { clearTimeout(highlightClearTimerRef.current); highlightClearTimerRef.current = null; }
        setHighlightedField(null);
    }, []);

    const scrollToFieldAndBlink = useCallback((field) => {
        const target = fieldRefs.current[field];
        if (!target) return false;

        if (highlightResetTimerRef.current) { clearTimeout(highlightResetTimerRef.current); highlightResetTimerRef.current = null; }
        if (highlightClearTimerRef.current) { clearTimeout(highlightClearTimerRef.current); highlightClearTimerRef.current = null; }

        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        if (typeof target.focus === 'function') {
            try { target.focus({ preventScroll: true }); } catch { target.focus(); }
        }

        clearFieldHighlight();
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => { setHighlightedField(field); });
        });

        highlightClearTimerRef.current = window.setTimeout(() => {
            setHighlightedField((cur) => (cur === field ? null : cur));
        }, 3000);

        return true;
    }, [clearFieldHighlight]);

    const focusAdminField = useCallback((field) => {
        const loginFields = ['currentLoginId', 'newLoginId', 'confirmLoginId', 'currentPassword', 'newPassword', 'confirmPassword'];
        if (loginFields.includes(field) && !showLoginDetails) {
            setShowLoginDetails(true);
            setTimeout(() => {
                scrollToFieldAndBlink(field);
            }, 100);
        } else {
            scrollToFieldAndBlink(field);
        }
    }, [scrollToFieldAndBlink, showLoginDetails]);

    const getAdminFieldClassName = useCallback((field, extraClass = '') => {
        return [
            styles['Admin-main-profile-form-input'],
            highlightedField === field ? styles['Admin-profile-field-highlight'] : '',
            extraClass
        ].filter(Boolean).join(' ');
    }, [highlightedField]);

    const handleErrorTooltipMove = useCallback((event) => {
        if (!supportsPointerTooltip) return;
        setErrorTooltip({ visible: true, x: event.clientX + 14, y: event.clientY + 18 });
    }, [supportsPointerTooltip]);

    const handleErrorTooltipLeave = useCallback(() => {
        if (!supportsPointerTooltip) return;
        setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, [supportsPointerTooltip]);

    useEffect(() => {
        if (changedFields.length === 0) return undefined;

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [changedFields.length]);

    const performViewChange = useCallback((view) => {
        if (!view) return;
        const targetPath = view.startsWith('/') ? view : `/${view}`;
        navigate(targetPath);
    }, [navigate]);

    const handleViewChange = useCallback((view) => {
        if (changedFields.length > 0) {
            setPendingNavView(view);
            setShowUnsavedModal(true);
            setIsSidebarOpen(false);
            return;
        }

        performViewChange(view);
        setIsSidebarOpen(false);
    }, [changedFields.length, performViewChange]);

    // Load admin data on component mount
    useEffect(() => {
        const loadAdminData = async () => {
            try {
                const adminLoginID = getAdminLoginID();

                // INSTANT LOAD: Check cache BEFORE setting loading state
                // This prevents the "Loading profile data..." flash
                const cachedProfile = localStorage.getItem('adminProfileCache');
                if (cachedProfile) {
                    try {
                        const profileData = JSON.parse(cachedProfile);

                        // Check if cache has meaningful data (full profile format)
                        if (profileData.firstName || profileData.lastName || profileData.emailId) {
                            console.log('âœ… Loading profile from cache - INSTANT');

                            // Set all data from cache immediately
                            setFormData({
                                firstName: profileData.firstName || '',
                                lastName: profileData.lastName || '',
                                dob: profileData.dob || '',
                                gender: profileData.gender || '',
                                emailId: profileData.emailId || '',
                                domainMailId: profileData.domainMailId || '',
                                phoneNumber: profileData.phoneNumber || '',
                                department: profileData.department || '',
                            });

                            setLoginData(prev => ({
                                ...prev,
                                currentLoginId: profileData.adminLoginID || adminLoginID,
                                newPassword: '',
                                confirmPassword: '',
                            }));

                            // Load profile photo from cache (resolve GridFS URLs for display)
                            if (profileData.profilePhoto) {
                                const sanitized = sanitizeCachedUrl(profileData.profilePhoto);
                                const resolvedPhoto = resolveProfileUrl(sanitized, API_BASE_URL);
                                setProfilePhoto(resolvedPhoto);
                                setProfilePhotoBase64(resolvedPhoto);
                            }

                            // Load college images from cache if available (resolve GridFS URLs)
                            if (profileData.collegeBanner) {
                                const sanitized = sanitizeCachedUrl(profileData.collegeBanner);
                                const resolved = resolveProfileUrl(sanitized, API_BASE_URL);
                                setCollegeBanner(resolved);
                                setCollegeBannerBase64(resolved);
                                setCollegeBannerName(normalizeJpegFilename(profileData.collegeBannerName, 'banner.jpg'));
                                console.log('âœ… College banner loaded from cache');
                            }
                            if (profileData.naacCertificate) {
                                const sanitized = sanitizeCachedUrl(profileData.naacCertificate);
                                const resolved = resolveProfileUrl(sanitized, API_BASE_URL);
                                setNaacCertificate(resolved);
                                setNaacCertificateBase64(resolved);
                                console.log('âœ… NAAC certificate loaded from cache');
                            }
                            if (profileData.nbaCertificate) {
                                const sanitized = sanitizeCachedUrl(profileData.nbaCertificate);
                                const resolved = resolveProfileUrl(sanitized, API_BASE_URL);
                                setNbaCertificate(resolved);
                                setNbaCertificateBase64(resolved);
                                console.log('âœ… NBA certificate loaded from cache');
                            }
                            if (profileData.collegeLogo) {
                                const sanitized = sanitizeCachedUrl(profileData.collegeLogo);
                                const resolved = resolveProfileUrl(sanitized, API_BASE_URL);
                                setCollegeLogo(resolved);
                                setCollegeLogoBase64(resolved);
                                setCollegeLogoName(normalizeJpegFilename(profileData.collegeLogoName, 'logo.jpg'));
                                console.log('âœ… College logo loaded from cache');
                            }

                            // Keep loading spinners visible - will hide after server fetch completes
                            console.log('âœ… Profile and images loaded instantly from cache');
                            console.log('ðŸ”„ Keeping spinners visible while fetching fresh data from server...');
                            savedDataRef.current = {
                                ...profileData,
                                profilePhoto: normalizeValue(profileData.profilePhoto ? resolveProfileUrl(sanitizeCachedUrl(profileData.profilePhoto), API_BASE_URL) : ''),
                                collegeBanner: normalizeValue(profileData.collegeBanner ? resolveProfileUrl(sanitizeCachedUrl(profileData.collegeBanner), API_BASE_URL) : ''),
                                naacCertificate: normalizeValue(profileData.naacCertificate ? resolveProfileUrl(sanitizeCachedUrl(profileData.naacCertificate), API_BASE_URL) : ''),
                                nbaCertificate: normalizeValue(profileData.nbaCertificate ? resolveProfileUrl(sanitizeCachedUrl(profileData.nbaCertificate), API_BASE_URL) : ''),
                                collegeLogo: normalizeValue(profileData.collegeLogo ? resolveProfileUrl(sanitizeCachedUrl(profileData.collegeLogo), API_BASE_URL) : ''),
                                newLoginId: '',
                                confirmLoginId: '',
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                            };
                            setIsLoading(false);
                            // Continue to fetch from server for any updates (don't return early)
                        }
                    } catch (err) {
                        console.warn('Cache parse error:', err);
                    }
                }

                // Fetch from server to get college images (even if profile was cached)
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
                    headers:{ 'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                    const data = result.data;
                    console.log('ðŸ“¦ Admin Data Received:', {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        dob: data.dob,
                        gender: data.gender,
                        emailId: data.emailId,
                        domainMailId: data.domainMailId,
                        phoneNumber: data.phoneNumber,
                        department: data.department,
                        hasProfilePhoto: !!data.profilePhoto,
                        hasCollegeBanner: !!data.collegeBanner,
                        hasNaacCertificate: !!data.naacCertificate,
                        hasNbaCertificate: !!data.nbaCertificate,
                        hasCollegeLogo: !!data.collegeLogo
                    });

                    // Load personal information
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        emailId: data.emailId || '',
                        domainMailId: data.domainMailId || '',
                        phoneNumber: data.phoneNumber || '',
                        department: data.department || '',
                    });

                    console.log('âœ… Form data set successfully');

                    // Load login ID
                    setLoginData(prev => ({
                        ...prev,
                        currentLoginId: data.adminLoginID || '',
                        newPassword: '',
                        confirmPassword: '',
                    }));

                    // ðŸ–¼ï¸ Load profile photo from cache first, then from server
                    let profilePhotoUrl = null;

                    // Try to get from cache first for instant loading
                    try {
                        const { default: adminImageCacheService } = await import('../services/adminImageCacheService.jsx');
                        const cachedPhoto = adminImageCacheService.getCachedAdminProfilePhoto(data.adminLoginID);

                        if (cachedPhoto) {
                            console.log('âœ… Using cached admin profile photo');
                            profilePhotoUrl = cachedPhoto;
                        } else if (data.profilePhoto) {
                            console.log('ðŸ“¥ Caching admin profile photo from server data');
                            await adminImageCacheService.cacheAdminProfilePhoto(data.adminLoginID, data.profilePhoto);
                            profilePhotoUrl = data.profilePhoto;
                        }
                    } catch (cacheError) {
                        console.warn('âš ï¸ Cache service unavailable, using server data:', cacheError);
                        profilePhotoUrl = data.profilePhoto;
                    }

                    // Load images and hide spinners after server data is received
                    const resolvedProfilePhoto = profilePhotoUrl ? gridfsService.resolveImageUrl(profilePhotoUrl) : '';
                    if (profilePhotoUrl) {
                        setProfilePhoto(resolvedProfilePhoto);
                        setProfilePhotoBase64(resolvedProfilePhoto);
                    } else {
                        setProfilePhoto(null);
                        setProfilePhotoBase64('');
                    }

                    // College Banner (resolve GridFS URL for display)
                    const resolvedBanner = data.collegeBanner ? gridfsService.resolveImageUrl(data.collegeBanner) : '';
                    if (data.collegeBanner) {
                        setCollegeBanner(resolvedBanner);
                        setCollegeBannerBase64(resolvedBanner);
                        setCollegeBannerName(normalizeJpegFilename(data.collegeBannerName, 'banner.jpg'));
                        console.log('âœ… College banner fetched from server');
                    } else {
                        setCollegeBanner(null);
                        setCollegeBannerBase64('');
                        setCollegeBannerName('');
                    }
                    // NAAC Certificate
                    const resolvedNaac = data.naacCertificate ? gridfsService.resolveImageUrl(data.naacCertificate) : '';
                    if (data.naacCertificate) {
                        setNaacCertificate(resolvedNaac);
                        setNaacCertificateBase64(resolvedNaac);
                        console.log('âœ… NAAC certificate fetched from server');
                    } else {
                        setNaacCertificate(null);
                        setNaacCertificateBase64('');
                    }
                    // NBA Certificate
                    const resolvedNba = data.nbaCertificate ? gridfsService.resolveImageUrl(data.nbaCertificate) : '';
                    if (data.nbaCertificate) {
                        setNbaCertificate(resolvedNba);
                        setNbaCertificateBase64(resolvedNba);
                        console.log('âœ… NBA certificate fetched from server');
                    } else {
                        setNbaCertificate(null);
                        setNbaCertificateBase64('');
                    }
                    // College Logo
                    const resolvedLogo = data.collegeLogo ? gridfsService.resolveImageUrl(data.collegeLogo) : '';
                    if (data.collegeLogo) {
                        setCollegeLogo(resolvedLogo);
                        setCollegeLogoBase64(resolvedLogo);
                        setCollegeLogoName(normalizeJpegFilename(data.collegeLogoName, 'logo.jpg'));
                        console.log('âœ… College logo fetched from server');
                    } else {
                        setCollegeLogo(null);
                        setCollegeLogoBase64('');
                        setCollegeLogoName('');
                    }
                    savedDataRef.current = {
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        emailId: data.emailId || '',
                        domainMailId: data.domainMailId || '',
                        phoneNumber: data.phoneNumber || '',
                        department: data.department || '',
                        currentLoginId: data.adminLoginID || '',
                        profilePhoto: resolvedProfilePhoto,
                        collegeBanner: resolvedBanner,
                        naacCertificate: resolvedNaac,
                        nbaCertificate: resolvedNba,
                        collegeLogo: resolvedLogo,
                        newLoginId: '',
                        confirmLoginId: '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    };

                    console.log('âœ… All college images loaded - spinners hidden');

                    // ðŸ’¾ Cache profile data with resolved URLs (including college images on first load)
                    const profileCacheData = {
                        adminLoginID: data.adminLoginID,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        dob: data.dob,
                        gender: data.gender,
                        emailId: data.emailId,
                        domainMailId: data.domainMailId,
                        phoneNumber: data.phoneNumber,
                        department: data.department,
                        profilePhoto: gridfsService.resolveImageUrl(profilePhotoUrl),
                        collegeBanner: gridfsService.resolveImageUrl(data.collegeBanner) || null,
                        naacCertificate: gridfsService.resolveImageUrl(data.naacCertificate) || null,
                        nbaCertificate: gridfsService.resolveImageUrl(data.nbaCertificate) || null,
                        collegeLogo: gridfsService.resolveImageUrl(data.collegeLogo) || null,
                        timestamp: Date.now()
                    };
                    try {
                        saveProfileObjectCache('adminProfileCache', profileCacheData);
                        localStorage.setItem('adminProfileCacheTime', Date.now().toString());
                        console.log('âœ… Admin profile cached successfully (including college images)');
                    } catch (quotaError) {
                        console.warn('âš ï¸ Could not cache profile due to storage quota - trying without images:', quotaError);
                        // Fallback: Cache without college images if quota exceeded
                            try {
                                const minimalCache = {
                                    adminLoginID: data.adminLoginID,
                                    firstName: data.firstName,
                                    lastName: data.lastName,
                                    dob: data.dob,
                                    gender: data.gender,
                                    emailId: data.emailId,
                                    domainMailId: data.domainMailId,
                                    phoneNumber: data.phoneNumber,
                                    department: data.department,
                                    profilePhoto: profilePhotoUrl,
                                    timestamp: Date.now()
                                };
                                saveProfileObjectCache('adminProfileCache', minimalCache);
                                console.log('âœ… Admin profile cached without college images (quota limit)');
                            } catch (fallbackError) {
                                console.warn('âš ï¸ Could not cache even minimal profile:', fallbackError);
                            }
                    }

                    setIsLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error loading admin data:', error);
                setIsLoading(false);
            }
        };

        loadAdminData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle mobile number input changes
    const handleMobileChange = (e) => {
        let value = e.target.value;
        // Remove leading zeros
        value = value.replace(/^0+/, '');
        // Only allow digits
        value = value.replace(/\D/g, '');
        // Limit to 10 digits
        value = value.substring(0, 10);
        setFormData(prev => ({ ...prev, phoneNumber: value }));
    };

    const handleDobChange = (dateValue) => {
        setFormData(prevState => ({
            ...prevState,
            dob: dateValue || ''
        }));

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const verifyCurrentPassword = async () => {
        const currentLoginId = normalizeValue(loginData.currentLoginId || getAdminLoginID());
        const currentPassword = normalizeValue(loginData.currentPassword);

        if (!currentPassword) {
            setIsCurrentPasswordVerified(false);
            setCurrentPasswordVerifyError('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            return;
        }

        setIsVerifyingCurrentPassword(true);
        setCurrentPasswordVerifyError('');

        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/login-credentials`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    currentLoginId,
                    currentPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setIsCurrentPasswordVerified(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                setCurrentPasswordVerifyError(result.message || 'Current password is incorrect.');
                return;
            }

            setIsCurrentPasswordVerified(true);
        } catch (error) {
            console.error('Failed to verify current password:', error);
            setIsCurrentPasswordVerified(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setCurrentPasswordVerifyError('Unable to verify current password. Please try again.');
        } finally {
            setIsVerifyingCurrentPassword(false);
        }
    };

    const handleLoginInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => {
            const next = { ...prev, [name]: value };

            return next;
        });

        if (name === 'currentPassword' || name === 'currentLoginId' || name === 'newLoginId' || name === 'confirmLoginId') {
            setIsCurrentPasswordVerified(false);
            setCurrentPasswordVerifyError('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.type !== 'image/jpeg' && file.type !== 'image/webp') {
            alert('Invalid file type. Please upload a JPG or WebP file.');
            return;
        }
        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 500 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        setPendingProfilePhotoName(file.name || 'profile.jpg');
        setImageToCrop(URL.createObjectURL(file));
        setIsCropModalOpen(true);
        e.target.value = '';
    };

    const closeFileSizeErrorPopup = () => {
        setIsFileSizeErrorOpen(false);
    };

    const handleImageClick = () => {
        if (profilePhoto) {
            setIsImagePreviewOpen(true);
        }
    };

    const handleModalClose = () => {
        setIsImagePreviewOpen(false);
    };

    const handleCollegeImagePreviewClose = () => {
        setCollegeImagePreview({
            isOpen: false,
            src: '',
            title: 'Preview Image',
            alt: 'Preview Image',
            downloadFilename: 'college-image.jpg'
        });
    };

    const openCollegeImagePreview = (type) => {
        if (type === 'banner' && collegeBanner) {
            setCollegeImagePreview({
                isOpen: true,
                src: collegeBannerDisplaySrc || collegeBanner,
                title: 'College Banner Preview',
                alt: 'College Banner Preview',
                downloadFilename: collegeBannerName || 'college-banner.jpg'
            });
        }
        if (type === 'logo' && collegeLogo) {
            setCollegeImagePreview({
                isOpen: true,
                src: collegeLogoDisplaySrc || collegeLogo,
                title: 'College Logo Preview',
                alt: 'College Logo Preview',
                downloadFilename: collegeLogoName || 'college-logo.jpg'
            });
        }
    };

    const handleCropComplete = (croppedBlob) => {
        const croppedFile = new File([croppedBlob], pendingProfilePhotoName || 'profile.jpg', { type: 'image/jpeg' });
        const croppedUrl = URL.createObjectURL(croppedBlob);

        setProfilePhotoFile(croppedFile);
        setProfilePhoto(croppedUrl);
        setProfilePhotoBase64(croppedUrl);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
        setIsCropModalOpen(false);
        setImageToCrop(null);
    };

    const handleCropDiscard = () => {
        setIsCropModalOpen(false);
        setImageToCrop(null);
        setPendingProfilePhotoName('profile.jpg');
    };

    const handleCollegeCropSave = (croppedBlob) => {
        const fileName = normalizeJpegFilename(
            pendingCollegeFileName,
            collegeCropType === 'banner' ? 'banner.jpg' : 'logo.jpg'
        );
        const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' });
        const croppedUrl = URL.createObjectURL(croppedBlob);

        if (collegeCropType === 'banner') {
            setCollegeBannerFile(croppedFile);
            setCollegeBanner(croppedUrl);
            setCollegeBannerName(fileName);
            setBannerUploadSuccess(true);
            setTimeout(() => setBannerUploadSuccess(false), 3000);
        } else {
            setCollegeLogoFile(croppedFile);
            setCollegeLogo(croppedUrl);
            setCollegeLogoName(fileName);
            setLogoUploadSuccess(true);
            setTimeout(() => setLogoUploadSuccess(false), 3000);
        }

        setIsCollegeCropOpen(false);
        setCollegeImageToCrop(null);
    };

    const handleCollegeCropDiscard = () => {
        setIsCollegeCropOpen(false);
        setCollegeImageToCrop(null);
        setPendingCollegeFileName('college-image.jpg');
    };

    const handleRemovePhoto = (e) => {
        e.preventDefault();
        setProfilePhoto(null);
        setProfilePhotoBase64('');
        setProfilePhotoFile(null);
        setIsImagePreviewOpen(false);
        setIsCropModalOpen(false);
        setImageToCrop(null);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        setUploadSuccess(false);
    };

    const handleDiscard = async () => {
        // Reload the admin data from the server
        try {
            const adminLoginID = getAdminLoginID();

            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data;

                // Reload personal information
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    emailId: data.emailId || '',
                    domainMailId: data.domainMailId || '',
                    phoneNumber: data.phoneNumber || '',
                    department: data.department || '',
                });

                // Reload login ID
                setLoginData({
                    currentLoginId: data.adminLoginID || '',
                    newLoginId: '',
                    confirmLoginId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });

                // Reload images (resolve GridFS URLs for display)
                const resolvedProfile = gridfsService.resolveImageUrl(data.profilePhoto);
                const resolvedBanner = gridfsService.resolveImageUrl(data.collegeBanner);
                const resolvedNaac = gridfsService.resolveImageUrl(data.naacCertificate);
                const resolvedNba = gridfsService.resolveImageUrl(data.nbaCertificate);
                const resolvedLogo = gridfsService.resolveImageUrl(data.collegeLogo);
                setProfilePhoto(resolvedProfile || null);
                setProfilePhotoBase64(resolvedProfile || '');
                setCollegeBanner(resolvedBanner || null);
                setCollegeBannerBase64(resolvedBanner || '');
                setNaacCertificate(resolvedNaac || null);
                setNaacCertificateBase64(resolvedNaac || '');
                setNbaCertificate(resolvedNba || null);
                setNbaCertificateBase64(resolvedNba || '');
                setCollegeLogo(resolvedLogo || null);
                setCollegeLogoBase64(resolvedLogo || '');

                savedDataRef.current = {
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    emailId: data.emailId || '',
                    domainMailId: data.domainMailId || '',
                    phoneNumber: data.phoneNumber || '',
                    department: data.department || '',
                    currentLoginId: data.adminLoginID || '',
                    profilePhoto: resolvedProfile || '',
                    collegeBanner: resolvedBanner || '',
                    naacCertificate: resolvedNaac || '',
                    nbaCertificate: resolvedNba || '',
                    collegeLogo: resolvedLogo || '',
                    newLoginId: '',
                    confirmLoginId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                };
            } else {
                // If no data exists, clear everything
                setFormData({
                    firstName: '', lastName: '', dob: '', gender: '', emailId: '',
                    domainMailId: '', phoneNumber: '', department: '',
                });
                setLoginData({
                    currentLoginId: '', newLoginId: '', confirmLoginId: '',
                    currentPassword: '', newPassword: '', confirmPassword: '',
                });
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                setProfilePhoto(null);
                setProfilePhotoBase64('');
                setCollegeBanner(null);
                setCollegeBannerBase64('');
                setNaacCertificate(null);
                setNaacCertificateBase64('');
                setNbaCertificate(null);
                setNbaCertificateBase64('');
                setCollegeLogo(null);
                setCollegeLogoBase64('');

                savedDataRef.current = {
                    firstName: '',
                    lastName: '',
                    dob: '',
                    gender: '',
                    emailId: '',
                    domainMailId: '',
                    phoneNumber: '',
                    department: '',
                    currentLoginId: '',
                    profilePhoto: '',
                    collegeBanner: '',
                    naacCertificate: '',
                    nbaCertificate: '',
                    collegeLogo: '',
                    newLoginId: '',
                    confirmLoginId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                };
            }

            setIsImagePreviewOpen(false);
            setIsCropModalOpen(false);
            setImageToCrop(null);
            setIsCollegeCropOpen(false);
            setCollegeImageToCrop(null);
            setSaveStatus('discarded');
        } catch (error) {
            console.error('Error reloading admin data:', error);
            alert('Failed to discard changes. Please try again.');
        }
    };

    const handleSave = async () => {
        if (isSaving || changedFields.length === 0) return false;

        try {
            setIsSaving(true);
            setSaveStatus(null);

            // Upload any new files to GridFS first
            const storedAdminLoginID = normalizeValue(getAdminLoginID());
            const currentLoginId = normalizeValue(loginData.currentLoginId);
            const newLoginId = normalizeValue(loginData.newLoginId);
            const confirmLoginId = normalizeValue(loginData.confirmLoginId);
            const currentPassword = normalizeValue(loginData.currentPassword);
            const enteredNewPassword = normalizeValue(loginData.newPassword);
            const enteredConfirmPassword = normalizeValue(loginData.confirmPassword);
            const loginIdChangeRequested = Boolean(newLoginId || confirmLoginId);
            const passwordChangeRequested = Boolean(enteredNewPassword || enteredConfirmPassword || shouldShowLoginPasswordFields);
            const loginDetailsChangeRequested = loginIdChangeRequested || passwordChangeRequested;

            if (loginDetailsChangeRequested) {
                if (!currentLoginId) {
                    alert('Current Login ID is required to update login details.');
                    setIsSaving(false);
                    return;
                }

                if (storedAdminLoginID && currentLoginId !== storedAdminLoginID) {
                    alert('Current Login ID does not match your signed-in account.');
                    setIsSaving(false);
                    return;
                }

                if (!currentPassword) {
                    alert('Current Password is required to update login details.');
                    setIsSaving(false);
                    return;
                }

                if (loginIdChangeRequested) {
                    if (!newLoginId) {
                        alert('New Login ID is required.');
                        setIsSaving(false);
                        return;
                    }

                    if (!confirmLoginId) {
                        alert('Confirm Login ID is required.');
                        setIsSaving(false);
                        return;
                    }

                    if (newLoginId !== confirmLoginId) {
                        alert('New Login ID and Confirm Login ID must match.');
                        setIsSaving(false);
                        return;
                    }

                    if (newLoginId === currentLoginId) {
                        alert('New Login ID must be different from the Current Login ID.');
                        setIsSaving(false);
                        return;
                    }

                    if (!isLoginIdMatch) {
                        alert('New Login ID and Confirm Login ID must match.');
                        setIsSaving(false);
                        return;
                    }
                }

                if (passwordChangeRequested) {
                    if (!enteredNewPassword || !enteredConfirmPassword) {
                        alert('New Password and Confirm Password are required.');
                        setIsSaving(false);
                        return;
                    }

                    if (enteredNewPassword !== enteredConfirmPassword) {
                        alert('New Password and Confirm Password must match.');
                        setIsSaving(false);
                        return;
                    }

                    if (!dobPasswordHint) {
                        alert('DOB is required to validate the password.');
                        setIsSaving(false);
                        return;
                    }

                    if (enteredNewPassword !== dobPasswordHint) {
                        alert(`Password should be: ${dobPasswordHint} (based on DOB)`);
                        setIsSaving(false);
                        return;
                    }
                }
            }

            const adminLoginID = currentLoginId || storedAdminLoginID;

            // Upload profile photo if a new file was selected
            let profilePhotoUrl = profilePhotoBase64; // keep existing URL/value
            if (profilePhotoFile) {
                try {
                    const result = await gridfsService.uploadProfileImage(profilePhotoFile, adminLoginID, 'admin');
                    profilePhotoUrl = result.url;
                    setProfilePhotoBase64(profilePhotoUrl);
                    setProfilePhotoFile(null);
                    console.log('âœ… Profile photo uploaded to GridFS:', profilePhotoUrl);
                } catch (uploadErr) {
                    console.error('Failed to upload profile photo:', uploadErr);
                    alert('Failed to upload profile photo. Please try again.');
                    setIsSaving(false);
                    return;
                }
            }

            // Upload college images if new files were selected
            const collegeFiles = {};
            if (collegeBannerFile) collegeFiles.collegeBanner = collegeBannerFile;
            if (naacCertificateFile) collegeFiles.naacCertificate = naacCertificateFile;
            if (nbaCertificateFile) collegeFiles.nbaCertificate = nbaCertificateFile;
            if (collegeLogoFile) collegeFiles.collegeLogo = collegeLogoFile;

            let collegeBannerUrl = collegeBannerBase64;
            let naacCertificateUrl = naacCertificateBase64;
            let nbaCertificateUrl = nbaCertificateBase64;
            let collegeLogoUrl = collegeLogoBase64;

            if (Object.keys(collegeFiles).length > 0) {
                try {
                    const result = await gridfsService.uploadCollegeImages(collegeFiles, adminLoginID);
                    if (result.collegeBanner) { collegeBannerUrl = result.collegeBanner.url; setCollegeBannerBase64(collegeBannerUrl); setCollegeBannerFile(null); }
                    if (result.naacCertificate) { naacCertificateUrl = result.naacCertificate.url; setNaacCertificateBase64(naacCertificateUrl); setNaacCertificateFile(null); }
                    if (result.nbaCertificate) { nbaCertificateUrl = result.nbaCertificate.url; setNbaCertificateBase64(nbaCertificateUrl); setNbaCertificateFile(null); }
                    if (result.collegeLogo) { collegeLogoUrl = result.collegeLogo.url; setCollegeLogoBase64(collegeLogoUrl); setCollegeLogoFile(null); }
                    console.log('âœ… College images uploaded to GridFS');
                } catch (uploadErr) {
                    console.error('Failed to upload college images:', uploadErr);
                    alert('Failed to upload college images. Please try again.');
                    setIsSaving(false);
                    return;
                }
            }

            // Resolve all GridFS URLs to full backend URLs for display, caching, and sidebar
            // IMPORTANT: If user removed an image (empty string), send null to MongoDB to clear it
            profilePhotoUrl = profilePhotoUrl ? gridfsService.resolveImageUrl(profilePhotoUrl) : null;
            collegeBannerUrl = collegeBannerUrl ? gridfsService.resolveImageUrl(collegeBannerUrl) : null;
            naacCertificateUrl = naacCertificateUrl ? gridfsService.resolveImageUrl(naacCertificateUrl) : null;
            nbaCertificateUrl = nbaCertificateUrl ? gridfsService.resolveImageUrl(nbaCertificateUrl) : null;
            collegeLogoUrl = collegeLogoUrl ? gridfsService.resolveImageUrl(collegeLogoUrl) : null;

            // Prepare data to send (GridFS URLs instead of base64)
            // Send null for removed images so MongoDB clears them
            const dataToSave = {
                adminLoginID: adminLoginID,
                ...formData,
                // Images (GridFS URLs or null if removed)
                profilePhoto: profilePhotoUrl || null,
                profilePhotoName: profilePhotoUrl ? 'profile.jpg' : null,
                collegeBanner: collegeBannerUrl || null,
                collegeBannerName: collegeBannerUrl ? (collegeBannerName || 'banner.jpg') : null,
                naacCertificate: naacCertificateUrl || null,
                naacCertificateName: naacCertificateUrl ? 'naac.jpg' : null,
                nbaCertificate: nbaCertificateUrl || null,
                nbaCertificateName: nbaCertificateUrl ? 'nba.jpg' : null,
                collegeLogo: collegeLogoUrl || null,
                collegeLogoName: collegeLogoUrl ? (collegeLogoName || 'logo.jpg') : null,
            };

            // Log cleared images for debugging
            const clearedImages = [];
            if (dataToSave.collegeBanner === null) clearedImages.push('collegeBanner');
            if (dataToSave.naacCertificate === null) clearedImages.push('naacCertificate');
            if (dataToSave.nbaCertificate === null) clearedImages.push('nbaCertificate');
            if (dataToSave.collegeLogo === null) clearedImages.push('collegeLogo');
            if (clearedImages.length > 0) {
                console.log(`ðŸ—‘ï¸ Sending null to clear images: ${clearedImages.join(', ')}`);
            }

            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(dataToSave),
            });

            const result = await response.json();

            if (result.success) {
                let savedLoginId = currentLoginId || storedAdminLoginID;

                if (loginDetailsChangeRequested) {
                    const loginUpdatePayload = {
                        currentLoginId: currentLoginId || storedAdminLoginID,
                        currentPassword,
                    };

                    if (loginIdChangeRequested) {
                        loginUpdatePayload.newLoginId = newLoginId;
                        loginUpdatePayload.confirmLoginId = confirmLoginId;
                    }

                    if (passwordChangeRequested) {
                        loginUpdatePayload.newPassword = enteredNewPassword;
                        loginUpdatePayload.confirmPassword = enteredConfirmPassword;
                    }

                    const loginResponse = await fetch(`${API_BASE_URL}/admin/login-credentials`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                        body: JSON.stringify(loginUpdatePayload),
                    });

                    const loginResult = await loginResponse.json();

                    if (!loginResponse.ok || !loginResult.success) {
                        setSaveStatus('error');
                        alert(loginResult.message || 'Failed to update login credentials. Please try again.');
                        return false;
                    }

                    savedLoginId = loginResult.data?.adminLoginID || newLoginId || currentLoginId || storedAdminLoginID;
                }

                setSaveStatus('saved');

                // ï¿½ INSTANT SYNC: Dispatch sidebar event FIRST (before any async cache ops)
                // This ensures the sidebar updates immediately with zero delay
                const updatedAdminData = {
                    _id: result.data?._id,
                    adminLoginID: savedLoginId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    profilePhoto: profilePhotoUrl,
                    emailId: formData.emailId,
                    personalEmail: formData.personalEmail,
                    phoneNumber: formData.phoneNumber,
                    department: formData.department,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    collegeBanner: collegeBannerUrl,
                    collegeBannerName: collegeBannerName,
                    naacCertificate: naacCertificateUrl,
                    nbaCertificate: nbaCertificateUrl,
                    collegeLogo: collegeLogoUrl,
                    collegeLogoName: collegeLogoName,
                    updatedAt: new Date().toISOString()
                };
                window.dispatchEvent(new CustomEvent('adminProfileUpdated', {
                    detail: updatedAdminData
                }));
                console.log('ðŸ”” Complete admin profile data sent to sidebar - ZERO DELAY (Student Pattern)');

                // Update display states â€” ALWAYS set, even to null, so removed images disappear immediately
                setProfilePhoto(profilePhotoUrl);
                setProfilePhotoBase64(profilePhotoUrl || '');
                setCollegeBanner(collegeBannerUrl);
                setCollegeBannerBase64(collegeBannerUrl || '');
                setNaacCertificate(naacCertificateUrl);
                setNaacCertificateBase64(naacCertificateUrl || '');
                setNbaCertificate(nbaCertificateUrl);
                setNbaCertificateBase64(nbaCertificateUrl || '');
                setCollegeLogo(collegeLogoUrl);
                setCollegeLogoBase64(collegeLogoUrl || '');

                savedDataRef.current = {
                    firstName: formData.firstName || '',
                    lastName: formData.lastName || '',
                    dob: formData.dob || '',
                    gender: formData.gender || '',
                    emailId: formData.emailId || '',
                    domainMailId: formData.domainMailId || '',
                    phoneNumber: formData.phoneNumber || '',
                    department: formData.department || '',
                    currentLoginId: savedLoginId || '',
                    profilePhoto: profilePhotoUrl || '',
                    collegeBanner: collegeBannerUrl || '',
                    naacCertificate: naacCertificateUrl || '',
                    nbaCertificate: nbaCertificateUrl || '',
                    collegeLogo: collegeLogoUrl || '',
                    newLoginId: '',
                    confirmLoginId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                };

                // Show success popup
                setIsSuccessPopupOpen(true);

                // 1. Clear the specific Admin Profile Cache (stops ghosting in Admin panel)
                localStorage.removeItem('adminProfileCache');
                localStorage.removeItem('adminProfileCacheTime');
                console.log('ðŸ—‘ï¸ Admin profile state cache cleared');

                // ðŸ–¼ï¸ Update cached profile photo URL if changed
                if (profilePhotoUrl) {
                    try {
                        const { default: adminImageCacheService } = await import('../services/adminImageCacheService.jsx');
                        await adminImageCacheService.cacheAdminProfilePhoto(savedLoginId || adminLoginID, profilePhotoUrl);
                        console.log('âœ… Admin profile photo cache updated after save');
                    } catch (cacheError) {
                        console.warn('âš ï¸ Failed to update admin profile photo cache after save:', cacheError);
                    }
                }

                // 2. Clear dashboard caches (collegeImagesService)
                try {
                    const { clearCache } = await import('../services/collegeImagesService');
                    clearCache();
                    console.log('âœ… College images cache cleared (dashboards)');
                } catch (cacheError) {
                    console.warn('âš ï¸ Failed to clear college images cache:', cacheError);
                }

                // 3. Clear landing page caches
                try {
                    const { clearCollegeImagesCache } = await import('../services/landingPageCacheService');
                    clearCollegeImagesCache();
                    console.log('âœ… Landing page college images cache cleared');
                } catch (cacheError) {
                    console.warn('âš ï¸ Failed to clear landing page cache:', cacheError);
                }

                // 4. Trigger the UI Refresh event (same tab)
                window.dispatchEvent(new CustomEvent('collegeImagesUpdated', {
                    detail: { timestamp: Date.now() }
                }));

                // 5. Cross-tab signal: write a localStorage key so OTHER tabs (e.g. landing page) auto-refresh
                // The 'storage' event only fires in OTHER tabs, the CustomEvent above handles this tab
                localStorage.setItem('collegeImagesUpdatedSignal', Date.now().toString());
                console.log('ðŸ”” College images update dispatched (same-tab + cross-tab)');

                // Update login ID in localStorage if changed
                if (savedLoginId) {
                    localStorage.setItem('adminLoginID', savedLoginId);
                }
                // Clear login fields
                setLoginData({
                    currentLoginId: savedLoginId,
                    newLoginId: '',
                    confirmLoginId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                return true;

                // (sidebar event + display states already dispatched above)
            } else {
                setSaveStatus('error');
                alert(result.message || 'Failed to save profile. Please try again.');
                return false;
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveStatus('error');

            // Provide specific error messages
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Your profile has been saved to the server successfully, but some data could not be cached locally. This will not affect functionality.');
            } else if (error.message && error.message.includes('network')) {
                alert('Network error. Please check your internet connection and try again.');
            } else {
                alert('Error saving profile. Please try again.');
            }
            return false;
        } finally {
            setIsSaving(false);
        }
    };



    const toggleLoginDetails = () => {
        setShowLoginDetails(prev => !prev);
    };

    const handleCollegeBannerUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
            return;
        }
        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 5 * 1024 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        setCollegeCropType('banner');
        setPendingCollegeFileName(file.name || 'banner.jpg');
        setCollegeImageToCrop(URL.createObjectURL(file));
        setIsCollegeCropOpen(true);
        e.target.value = '';
    };

    const handleNaacUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
            return;
        }
        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 500 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        // Store raw File for GridFS upload on save
        setNaacCertificateFile(file);
        setNaacCertificate(URL.createObjectURL(file));
        setNaacUploadSuccess(true);
        setTimeout(() => setNaacUploadSuccess(false), 3000);
    };

    const handleNbaUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
            return;
        }
        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 500 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        // Store raw File for GridFS upload on save
        setNbaCertificateFile(file);
        setNbaCertificate(URL.createObjectURL(file));
        setNbaUploadSuccess(true);
        setTimeout(() => setNbaUploadSuccess(false), 3000);
    };

    const handleRemoveCollegeBanner = () => {
        setCollegeBanner(null);
        setCollegeBannerBase64('');
        setCollegeBannerName('');
        setCollegeBannerFile(null);
        const fileInput = document.getElementById('banner-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveNaac = () => {
        setNaacCertificate(null);
        setNaacCertificateBase64('');
        setNaacCertificateFile(null);
        const fileInput = document.getElementById('naac-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveNba = () => {
        setNbaCertificate(null);
        setNbaCertificateBase64('');
        setNbaCertificateFile(null);
        const fileInput = document.getElementById('nba-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleCollegeLogoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
            return;
        }
        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 500 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        setCollegeCropType('logo');
        setPendingCollegeFileName(file.name || 'logo.jpg');
        setCollegeImageToCrop(URL.createObjectURL(file));
        setIsCollegeCropOpen(true);
        e.target.value = '';
    };

    const handleRemoveCollegeLogo = () => {
        setCollegeLogo(null);
        setCollegeLogoBase64('');
        setCollegeLogoName('');
        setCollegeLogoFile(null);
        const fileInput = document.getElementById('logo-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleUnsavedModalSave = async () => {
        if (isSaving) return;

        const targetView = pendingNavView;
        setShowUnsavedModal(false);
        const didSave = await handleSave();

        if (didSave && targetView) {
            setPendingNavView(null);
            performViewChange(targetView);
        } else if (!didSave) {
            setPendingNavView(targetView);
        }
    };

    return (
        <PageLayout
            navbar={<AdNavbar Adminicon={Adminicon} />}
            sidebar={
                <AdSidebar
                    onViewChange={handleViewChange}
                    onLogout={() => console.log('Logout Clicked')}
                />
            }
        >
            <AdminFieldUpdateBanner
                isVisible={changedFields.length > 0}
                updatedFields={changedFields}
            />
            {isSaving && <div className={styles['admin-profile-saving-overlay']} />}
            <div className={`${styles['Admin-main-profile-layout']} ${isSaving ? styles['admin-profile-saving'] : ''}`}>

                    {isLoading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '60vh',
                            fontSize: '18px',
                            color: '#666'
                        }}>
                            Loading profile data...
                        </div>
                    ) : (
                    <>
                    {/* UPDATED CLASS: Admin-main-profile-master-card */}
                    <div className={styles['Admin-main-profile-master-card']}>
                        <ContentContainer>

                        {/* UPDATED CLASS: Admin-main-profile-content-grid */}
                        <div className={styles['Admin-main-profile-content-grid']}>

                            {/* Left Side: Forms */}
                            {/* UPDATED CLASS: Admin-main-profile-form-area */}
                            <div className={styles['Admin-main-profile-form-area']}>

                                {/* Personal Information Section */}
                                {/* UPDATED CLASS: Admin-main-profile-section, Admin-main-profile-section-header, Admin-main-profile-input-grid */}
                                <section className={styles['Admin-main-profile-section']}>
                                    <h3 className={styles['Admin-main-profile-section-header']}>Personal Information</h3>
                                    <div className={styles['Admin-main-profile-input-grid']}>
                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="firstName">
                                                <span className={styles['Admin-profile-label-heading']}>First Name <RequiredStar /></span>
                                            </label>
                                            <input
                                                id="firstName"
                                                type="text"
                                                name="firstName"
                                                placeholder="First Name"
                                                className={getAdminFieldClassName('firstName')}
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                                ref={registerFieldRef('firstName')}
                                            />
                                        </div>
                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="lastName">
                                                <span className={styles['Admin-profile-label-heading']}>Last Name <RequiredStar /></span>
                                            </label>
                                            <input
                                                id="lastName"
                                                type="text"
                                                name="lastName"
                                                placeholder="Last Name"
                                                className={getAdminFieldClassName('lastName')}
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                                ref={registerFieldRef('lastName')}
                                            />
                                        </div>

                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="dob">
                                                <span className={styles['Admin-profile-label-heading']}>DOB <RequiredStar /></span>
                                            </label>
                                            <div
                                                id="dob"
                                                className={`${styles['Admin-main-profile-date-wrapper']} ${highlightedField === 'dob' ? styles['Admin-profile-field-highlight'] : ''}`}
                                                ref={registerFieldRef('dob')}
                                            >
                                                <AdCalendar value={formData.dob} onChange={handleDobChange} />
                                            </div>
                                        </div>

                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="gender">
                                                <span className={styles['Admin-profile-label-heading']}>Gender <RequiredStar /></span>
                                            </label>
                                            <Dropdown
                                                options={[
                                                    { label: 'Male', value: 'Male' },
                                                    { label: 'Female', value: 'Female' },
                                                    { label: 'Other', value: 'Other' }
                                                ]}
                                                selectedOption={formData.gender}
                                                onSelect={(value) => handleInputChange({ target: { name: 'gender', value } })}
                                                placeholder="Gender"
                                                disabled={isSaving}
                                                role="admin"
                                                className={styles['profile-dropdown-wrapper']}
                                                headerClassName={`${getAdminFieldClassName('gender')} ${styles['profile-dropdown-header']}`}
                                                ref={registerFieldRef('gender')}
                                            />
                                        </div>

                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="emailId">
                                                <span className={styles['Admin-profile-label-heading']}>Email ID <RequiredStar /></span>
                                            </label>
                                            <input
                                                id="emailId"
                                                type="email"
                                                name="emailId"
                                                placeholder="Email id"
                                                className={getAdminFieldClassName('emailId')}
                                                value={formData.emailId}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                                ref={registerFieldRef('emailId')}
                                            />
                                        </div>
                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="domainMailId">
                                                <span className={styles['Admin-profile-label-heading']}>Domain Mail ID <RequiredStar /></span>
                                            </label>
                                            <input
                                                id="domainMailId"
                                                type="email"
                                                name="domainMailId"
                                                placeholder="Domain Mail id"
                                                className={getAdminFieldClassName('domainMailId')}
                                                value={formData.domainMailId}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                                ref={registerFieldRef('domainMailId')}
                                            />
                                        </div>

                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="phoneNumber">
                                                <span className={styles['Admin-profile-label-heading']}>Phone Number <RequiredStar /></span>
                                            </label>
                                            <div
                                                className={`${styles['mobileInputWrapper']} ${highlightedField === 'phoneNumber' ? styles['Admin-profile-field-highlight-wrapper'] : ''}`}
                                                ref={registerFieldRef('phoneNumber')}
                                            >
                                                <div className={styles['countryCode']}>+91</div>
                                                <input
                                                    id="phoneNumber"
                                                    type="tel"
                                                    name="phoneNumber"
                                                    placeholder="Phone number"
                                                    className={styles['mobileNumberInput']}
                                                    value={formData.phoneNumber}
                                                    onChange={handleMobileChange}
                                                    disabled={isSaving}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="department">
                                                <span className={styles['Admin-profile-label-heading']}>Branch <RequiredStar /></span>
                                            </label>
                                            <Dropdown
                                                options={branches.map(branch => {
                                                    const label = branch?.branchFullName && branch?.branchAbbreviation
                                                        ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                        : branch?.branchFullName || branch?.branchAbbreviation || '';
                                                    const value = branch?.branchAbbreviation || branch?.branchFullName || branch?._id || '';
                                                    return { label, value };
                                                })}
                                                selectedOption={formData.department}
                                                onSelect={(value) => handleInputChange({ target: { name: 'department', value } })}
                                                placeholder="Select Branch"
                                                disabled={isSaving}
                                                role="admin"
                                                className={styles['profile-dropdown-wrapper']}
                                                headerClassName={`${getAdminFieldClassName('department')} ${styles['profile-dropdown-header']}`}
                                                ref={registerFieldRef('department')}
                                            />
                                        </div>
                                    </div>
                                </section>


                                {/* College Details Section */}


                                {/* Change Login Details Button - Toggle visibility */}
                                <button
                                    type="button"
                                    className={styles['Admin-main-profile-change-login-btn']}
                                    onClick={toggleLoginDetails}
                                    disabled={isSaving}
                                >
                                    <KeyIcon />
                                    <span>Change Login Details</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            marginLeft: 'auto',
                                            transform: showLoginDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease'
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            </div>

                            {/* Right Side: Profile Photo Card */}
                            <aside className={styles['Admin-main-profile-photo-card']}>
                                <h3 className={styles['Admin-main-profile-section-header']}>Profile Photo</h3>

                                <div className={styles['Admin-main-profile-photo-icon-container']}>
                                    {profilePhotoDisplaySrc ? (
                                        <img
                                            src={profilePhotoDisplaySrc}
                                            alt="Profile Preview"
                                            className={styles['Admin-main-profile-photo-preview']}
                                            onClick={handleImageClick}
                                        />
                                    ) : (
                                        <img src={ProfileGraduationcap} alt="Graduation Cap" style={{ width: '80px', height: '80px' }}/>
                                    )}
                                </div>

                                <div className={styles['Admin-main-profile-upload-action-area']}>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="file-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {profilePhoto && (
                                            <button onClick={handleRemovePhoto} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove image" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className={styles['Admin-main-profile-hidden-input']}
                                        onChange={handlePhotoUpload}
                                        disabled={isSaving}
                                    />
                                    {uploadSuccess && (
                                        <p className={styles['Admin-main-profile-upload-success-message']}>Profile Photo uploaded Successfully!</p>
                                    )}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG and WebP formats allowed.</p>
                                </div>

                                {saveStatus && (
                                    // UPDATED CLASSES
                                    <p className={`${styles['Admin-main-profile-status-message']} ${saveStatus === 'saved' ? styles['Admin-main-profile-status-success'] : styles['Admin-main-profile-status-error']}`}>
                                        {saveStatus === 'saved' ? 'Successfully Saved' : 'Not Saved'}
                                    </p>
                                )}
                            </aside>

                        </div>
                        {/* Change Login Details Section - Full width below the grid */}
                        {showLoginDetails && (
                        <section className={`${styles['Admin-main-profile-section']} ${styles['Admin-main-profile-login-details']}`}>
                            <h3 className={styles['Admin-main-profile-section-header']}>Change Login Details</h3>
                            <div className={styles['Admin-main-profile-input-grid-three-col']}>
                                <div className={styles['Admin-main-profile-field']}>
                                    <label className={styles['Admin-main-profile-field-label']} htmlFor="currentLoginId">Current Login ID</label>
                                    <input id="currentLoginId" type="text" name="currentLoginId" placeholder="Current Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.currentLoginId} onChange={handleLoginInputChange} disabled={isSaving} />
                                </div>
                                <div className={styles['Admin-main-profile-field']}>
                                    <label className={styles['Admin-main-profile-field-label']} htmlFor="newLoginId">New Login ID</label>
                                    <input id="newLoginId" type="text" name="newLoginId" placeholder="New Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.newLoginId} onChange={handleLoginInputChange} disabled={isSaving} />
                                </div>
                                <div className={styles['Admin-main-profile-field']}>
                                    <label className={styles['Admin-main-profile-field-label']} htmlFor="confirmLoginId">Confirm Login ID</label>
                                    <input id="confirmLoginId" type="text" name="confirmLoginId" placeholder="Confirm Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.confirmLoginId} onChange={handleLoginInputChange} disabled={isSaving} />
                                </div>
                            </div>
                            <div className={styles['Admin-main-profile-input-grid-three-col']}>
                                {shouldShowCurrentPasswordField && (
                                    <div className={styles['Admin-main-profile-field']}>
                                        <label className={styles['Admin-main-profile-field-label']} htmlFor="currentPassword">Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} name="currentPassword" placeholder="Current Password" className={styles['Admin-main-profile-form-input-login']} value={loginData.currentPassword} onChange={handleLoginInputChange} onBlur={verifyCurrentPassword} disabled={isSaving} style={{ paddingRight: '40px' }} />
                                            <button
                                                type="button"
                                                className={styles['Admin-main-profile-password-toggle']}
                                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                                tabIndex={-1}
                                            >
                                                {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                        {!isCurrentPasswordVerified && loginData.currentPassword && (
                                            <p style={{ marginTop: '8px', marginBottom: 0, color: '#c62828', fontSize: '13px', fontWeight: 600 }}>
                                                Enter a correct current password to unlock the new password fields.
                                            </p>
                                        )}
                                        {currentPasswordVerifyError && (
                                            <p style={{ marginTop: '8px', marginBottom: 0, color: '#c62828', fontSize: '13px', fontWeight: 600 }}>
                                                {currentPasswordVerifyError}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {!shouldShowCurrentPasswordField && loginData.newLoginId && loginData.confirmLoginId && (
                                    <p style={{ gridColumn: '1 / -1', marginTop: '-4px', marginBottom: '6px', color: '#c62828', fontSize: '13px', fontWeight: 600 }}>
                                        {loginIdMismatchError}
                                    </p>
                                )}
                                {shouldShowLoginPasswordFields && (
                                    <>
                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="newPassword">
                                                <span className={styles['Admin-profile-label-heading']}>New Password <RequiredStar /></span>
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    id="newPassword"
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    name="newPassword"
                                                    placeholder="New Password"
                                                    className={getAdminFieldClassName('newPassword', styles['Admin-main-profile-form-input-login'])}
                                                    value={loginData.newPassword}
                                                    onChange={handleLoginInputChange}
                                                    disabled={isSaving}
                                                    style={{ paddingRight: '40px' }}
                                                    ref={registerFieldRef('newPassword')}
                                                />
                                                <button
                                                    type="button"
                                                    className={styles['Admin-main-profile-password-toggle']}
                                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                                    tabIndex={-1}
                                                >
                                                    {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                </button>
                                            </div>
                                            <p style={{ marginTop: '-10px', marginBottom: 0, color: '#2e7d32', fontSize: '13px', fontWeight: 600 }}>
                                                Password should be: <span style={{ fontWeight: 800 }}>{dobPasswordHint || 'DDMMYYYY'}</span>{dobPasswordHint ? ' (based on DOB)' : ' (based on DOB)'}
                                            </p>
                                        </div>
                                        <div className={styles['Admin-main-profile-field']}>
                                            <label className={styles['Admin-main-profile-field-label']} htmlFor="confirmPassword">
                                                <span className={styles['Admin-profile-label-heading']}>Confirm Password <RequiredStar /></span>
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    name="confirmPassword"
                                                    placeholder="Confirm Password"
                                                    className={getAdminFieldClassName('confirmPassword', styles['Admin-main-profile-form-input-login'])}
                                                    value={loginData.confirmPassword}
                                                    onChange={handleLoginInputChange}
                                                    disabled={isSaving}
                                                    style={{ paddingRight: '40px' }}
                                                    ref={registerFieldRef('confirmPassword')}
                                                />
                                                <button
                                                    type="button"
                                                    className={styles['Admin-main-profile-password-toggle']}
                                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                        )}
                        </ContentContainer>

                        {/* College Details Section - Independent */}
                        <ContentContainer>
                        <div className={styles['Admin-main-profile-college-section']}>
                            <h3 className={styles['Admin-main-profile-section-header']}>College Details</h3>
                            <ResponsiveGrid columns={4}>
                                {/* College Banner Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>College Banner</h4>
                                    <div
                                        className={styles['Admin-main-profile-college-preview']}
                                        style={{ position: 'relative', cursor: collegeBanner ? 'pointer' : 'default' }}
                                        onClick={collegeBanner ? () => openCollegeImagePreview('banner') : undefined}
                                        role={collegeBanner ? 'button' : undefined}
                                        tabIndex={collegeBanner ? 0 : undefined}
                                        onKeyDown={collegeBanner ? (e) => { if (e.key === 'Enter' || e.key === ' ') openCollegeImagePreview('banner'); } : undefined}
                                    >
                                        {collegeBannerDisplaySrc ? (
                                            <img src={collegeBannerDisplaySrc} alt="College Banner" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Banner</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="banner-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 5 MB)</span>
                                            </div>
                                        </label>
                                        {collegeBanner && (
                                            <button onClick={handleRemoveCollegeBanner} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove banner" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="banner-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleCollegeBannerUpload} disabled={isSaving} />
                                    {bannerUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>Banner uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* NAAC Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>NAAC Certificate</h4>
                                    <div className={styles['Admin-main-profile-college-preview']} style={{ position: 'relative' }}>
                                        {naacCertificateDisplaySrc ? (
                                            <img src={naacCertificateDisplaySrc} alt="NAAC Certificate" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Certificate</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="naac-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {naacCertificate && (
                                            <button onClick={handleRemoveNaac} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove NAAC" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="naac-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleNaacUpload} disabled={isSaving} />
                                    {naacUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>NAAC uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* NBA Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>NBA Certificate</h4>
                                    <div className={styles['Admin-main-profile-college-preview']} style={{ position: 'relative' }}>
                                        {nbaCertificateDisplaySrc ? (
                                            <img src={nbaCertificateDisplaySrc} alt="NBA Certificate" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Certificate</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="nba-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {nbaCertificate && (
                                            <button onClick={handleRemoveNba} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove NBA" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="nba-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleNbaUpload} disabled={isSaving} />
                                    {nbaUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>NBA uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* College Logo Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>College Logo</h4>
                                    <div
                                        className={styles['Admin-main-profile-college-preview']}
                                        style={{ position: 'relative', cursor: collegeLogo ? 'pointer' : 'default' }}
                                        onClick={collegeLogo ? () => openCollegeImagePreview('logo') : undefined}
                                        role={collegeLogo ? 'button' : undefined}
                                        tabIndex={collegeLogo ? 0 : undefined}
                                        onKeyDown={collegeLogo ? (e) => { if (e.key === 'Enter' || e.key === ' ') openCollegeImagePreview('logo'); } : undefined}
                                    >
                                        {collegeLogoDisplaySrc ? (
                                            <img
                                                src={collegeLogoDisplaySrc}
                                                alt="College Logo"
                                                className={styles['Admin-main-profile-college-image']}
                                                onError={(event) => {
                                                    if (collegeLogoBase64 && event.currentTarget.src !== collegeLogoBase64) {
                                                        event.currentTarget.src = resolveProfileUrl(sanitizeCachedUrl(collegeLogoBase64), API_BASE_URL);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Logo</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="logo-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {collegeLogo && (
                                            <button onClick={handleRemoveCollegeLogo} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove Logo" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="logo-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleCollegeLogoUpload} disabled={isSaving} />
                                    {logoUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>Logo uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>
                            </ResponsiveGrid>
                        </div>
                        </ContentContainer>
                    </div>

                    {/* Action Buttons */}
                    {/* UPDATED CLASSES: Admin-main-profile-action-buttons, Admin-main-profile-discard-btn, Admin-main-profile-save-btn */}
                    <div className={styles['Admin-main-profile-action-buttons']}>
                        <button
                            type="button"
                            className={styles['Admin-main-profile-discard-btn']}
                            onClick={handleDiscard}
                            disabled={isSaving || changedFields.length === 0}
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            className={styles['Admin-main-profile-save-btn']}
                            onClick={handleSave}
                            disabled={!canSave}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>

                    {/* Missing Fields Validation Card */}
                    <MissingFieldsCard
                        missingFields={missingRequiredFields}
                        onFieldClick={focusAdminField}
                        showAllErrors={showAllErrors}
                        onToggleShowAll={() => setShowAllErrors((prev) => !prev)}
                        errorTooltip={errorTooltip}
                        supportsPointerTooltip={supportsPointerTooltip}
                        onTooltipMove={handleErrorTooltipMove}
                        onTooltipLeave={handleErrorTooltipLeave}
                    />
                    </>
                    )}
            </div>

            {/* Image Preview Modal */}
            <ImagePreviewModal src={profilePhoto} isOpen={isImagePreviewOpen} onClose={handleModalClose} />
            <ImagePreviewModal
                src={collegeImagePreview.src}
                isOpen={collegeImagePreview.isOpen}
                onClose={handleCollegeImagePreviewClose}
                title={collegeImagePreview.title}
                alt={collegeImagePreview.alt}
                downloadFilename={collegeImagePreview.downloadFilename}
            />
            <CropImageModal
                isOpen={isCropModalOpen}
                imageSrc={imageToCrop}
                onCrop={handleCropComplete}
                onClose={handleCropDiscard}
                onDiscard={handleCropDiscard}
            />
            <CollegeImageCropModal
                isOpen={isCollegeCropOpen}
                imageSrc={collegeImageToCrop}
                cropType={collegeCropType}
                onSave={handleCollegeCropSave}
                onClose={handleCollegeCropDiscard}
                onDiscard={handleCollegeCropDiscard}
            />

            {/* File Size Error Popup */}
            <FileSizeErrorPopup
                isOpen={isFileSizeErrorOpen}
                onClose={closeFileSizeErrorPopup}
                fileSizeKB={fileSizeErrorKB}
            />

            {/* Success Popup */}
            <SuccessPopup
                isOpen={isSuccessPopupOpen}
                onClose={() => setIsSuccessPopupOpen(false)}
            />

            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                changedFields={changedFields}
                onClose={() => {
                    if (isSaving) return;
                    setShowUnsavedModal(false);
                    setPendingNavView(null);
                }}
                onSave={handleUnsavedModalSave}
                onDiscard={() => {
                    if (isSaving) return;
                    setShowUnsavedModal(false);
                    if (pendingNavView) {
                        performViewChange(pendingNavView);
                        setPendingNavView(null);
                    }
                }}
                isSaving={isSaving}
            />
        </PageLayout>
    );
}

export default Admainprofile;