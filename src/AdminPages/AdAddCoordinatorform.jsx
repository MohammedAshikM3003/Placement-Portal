import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import Ad_Calendar from '../components/Calendar/Ad_Calendar.jsx';
import styles from './AdAddCoordinatorform.module.css';
import Dropdown from '../components/common/Dropdown/Dropdown';
import Adminicon from "../assets/Adminicon.png";
import ProfileGraduationcap from "../assets/VectorGC.svg";
import AddCoordinatoricon from "../assets/AddCoordinatoricon.svg";
import mongoDBService from "../services/mongoDBService.jsx";
import { PreviewProgressAlert, DownloadSuccessAlert, DownloadFailedAlert } from '../components/alerts/DownloadPreviewAlerts.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { resolveProfileUrl } from '../components/Sidebar/profileUtils';
import API_BASE_URL from '../utils/apiConfig';
import OtpModal from '../components/dialog/OtpModal/OtpModal';

const REQUIRED_COORDINATOR_FIELDS = [
    { field: 'firstName', label: 'First Name' },
    { field: 'lastName', label: 'Last Name' },
    { field: 'dob', label: 'DOB' },
    { field: 'gender', label: 'Gender' },
    { field: 'emailId', label: 'Email ID' },
    { field: 'domainMailId', label: 'Domain Mail ID' },
    { field: 'phoneNumber', label: 'Phone Number' },
    { field: 'degree', label: 'Degree' },
    { field: 'branch', label: 'Branch' },
    { field: 'coordinatorId', label: 'Coordinator ID' },
    { field: 'password', label: 'Enter Password' },
    { field: 'confirmPassword', label: 'Confirm Password' }
];

const RequiredStar = () => <span className={styles['Admin-cood-detail-required-star']}>*</span>;

const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path>
    </svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path>
    </svg>
);

const DropdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4" viewBox="0 0 292.4 292.4" className={styles['Admin-cood-detail-dropdown-icon']}>
        <path fill="#999" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.2 1.8-12.9 5.4-3.7 3.6-5.5 8-5.5 13s1.8 9.4 5.5 13l128.8 128.8c3.7 3.7 8 5.5 13 5.5s9.4-1.8 13-5.5l128.8-128.8c3.7-3.6 5.4-8 5.4-13s-1.7-9.4-5.4-13z" />
    </svg>
);

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
                    <h2 style={{ color: '#d32f2f' }}>Image Size Exceeded Γ£ù</h2>
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

const MissingFieldsCard = ({ missingFields, onFieldClick, showAllErrors, onToggleShowAll, errorTooltip, supportsPointerTooltip, onTooltipMove, onTooltipLeave }) => {
    if (!missingFields.length) return null;

    const visibleFields = showAllErrors ? missingFields : missingFields.slice(0, 10);

    return (
        <div className={styles['Admin-cood-detail-validation-box']}>
            <h4 className={styles['Admin-cood-detail-validation-heading']}>
                <span className={styles['Admin-cood-detail-validation-icon']} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" role="img" focusable="false">
                        <path fill="currentColor" d="M1 21h22L12 2L1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                </span>
                Required Fields Missing:
            </h4>
            <ul className={styles['Admin-cood-detail-validation-list']}>
                {visibleFields.map((error, index) => (
                    <li
                        key={`${error.field}-${index}`}
                        className={styles['Admin-cood-detail-validation-item']}
                        role="button"
                        tabIndex={0}
                        aria-label="Click to navigate"
                        onClick={() => {
                            console.log('[DEBUG] Missing field item clicked:', error.field);
                            onFieldClick(error.field);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                console.log('[DEBUG] Missing field item activated via keyboard:', error.field);
                                onFieldClick(error.field);
                            }
                        }}
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
                    className={styles['Admin-cood-detail-validation-pointer-tooltip']}
                    style={{ left: `${errorTooltip.x}px`, top: `${errorTooltip.y}px` }}
                >
                    Click to navigate
                </div>
            )}
            {missingFields.length > 10 && (
                <div className={styles['Admin-cood-detail-validation-toggle']}>
                    <button type="button" onClick={onToggleShowAll} className={styles['Admin-cood-detail-show-more-btn']}>
                        <span>{showAllErrors ? 'Show Less' : `Show More (${missingFields.length - 10} more)`}</span>
                        <span className={styles['Admin-cood-detail-show-more-caret']} aria-hidden="true">
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

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const normalizeJpegFilename = (fileName, fallbackName = 'profile-photo.jpg') => {
    const baseName = (fileName || fallbackName || 'profile-photo.jpg').trim() || 'profile-photo.jpg';
    return baseName.replace(/\.[^.]+$/, '') + '.jpg';
};

const PhotoCropModal = ({ isOpen, imageSrc, fileName, onSave, onDiscard, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setAspect(1);
        setCroppedAreaPixels(null);
    }, [imageSrc, isOpen]);

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

            return await new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob || null), 'image/jpeg', 0.95);
            });
        } catch (error) {
            console.error('Error creating cropped image:', error);
            return null;
        }
    }, [croppedAreaPixels, imageSrc, rotation]);

    const handleSave = async () => {
        const croppedBlob = await createCroppedImage();
        if (croppedBlob) {
            onSave(croppedBlob, normalizeJpegFilename(fileName));
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles['Admin-cood-detail-crop-overlay']} onClick={onClose}>
            <div className={styles['Admin-cood-detail-crop-container']} onClick={(event) => event.stopPropagation()}>
                <div className={styles['Admin-cood-detail-crop-header']}>Crop Image</div>
                <div className={styles['Admin-cood-detail-crop-content']}>
                    <div className={styles['Admin-cood-detail-crop-preview-area']}>
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

                    <div className={styles['Admin-cood-detail-crop-controls']}>
                        <div className={styles['Admin-cood-detail-control-group']}>
                            <label className={styles['Admin-cood-detail-control-label']}>Rotate</label>
                            <div className={styles['Admin-cood-detail-rotate-control']}>
                                <button type="button" onClick={() => setRotation((value) => (value - 10 + 360) % 360)} className={styles['Admin-cood-detail-rotate-btn']}>↺</button>
                                <span className={styles['Admin-cood-detail-angle-value']}>{rotation}°</span>
                                <button type="button" onClick={() => setRotation((value) => (value + 10) % 360)} className={styles['Admin-cood-detail-rotate-btn']}>↻</button>
                            </div>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={rotation}
                                onChange={(event) => setRotation(Number(event.target.value))}
                                className={styles['Admin-cood-detail-angle-slider']}
                            />
                            <button type="button" onClick={() => setRotation(0)} className={styles['Admin-cood-detail-reset-btn']}>Reset</button>
                        </div>

                        <div className={styles['Admin-cood-detail-control-group']}>
                            <label className={styles['Admin-cood-detail-control-label']}>Aspect Ratio</label>
                            <div className={styles['Admin-cood-detail-aspect-ratio-buttons']}>
                                <button type="button" onClick={() => setAspect(1)} className={`${styles['Admin-cood-detail-aspect-btn']} ${aspect === 1 ? styles['Admin-cood-detail-aspect-active'] : ''}`}>1:1</button>
                                <button type="button" onClick={() => setAspect(4 / 3)} className={`${styles['Admin-cood-detail-aspect-btn']} ${aspect === 4 / 3 ? styles['Admin-cood-detail-aspect-active'] : ''}`}>4:3</button>
                                <button type="button" onClick={() => setAspect(3 / 4)} className={`${styles['Admin-cood-detail-aspect-btn']} ${aspect === 3 / 4 ? styles['Admin-cood-detail-aspect-active'] : ''}`}>3:4</button>
                            </div>
                        </div>

                        <div className={styles['Admin-cood-detail-control-group']}>
                            <label className={styles['Admin-cood-detail-control-label']}>Zoom</label>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                value={zoom}
                                onChange={(event) => setZoom(Number(event.target.value))}
                                className={styles['Admin-cood-detail-zoom-slider']}
                            />
                            <span className={styles['Admin-cood-detail-zoom-value']}>{(zoom * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
                <div className={styles['Admin-cood-detail-crop-footer']}>
                    <button type="button" onClick={onDiscard} className={`${styles['Admin-cood-detail-crop-btn']} ${styles['Admin-cood-detail-crop-discard-btn']}`}>Discard</button>
                    <button type="button" onClick={handleSave} className={`${styles['Admin-cood-detail-crop-btn']} ${styles['Admin-cood-detail-crop-upload-btn']}`}>Upload</button>
                </div>
            </div>
        </div>
    );
};

const normalizeString = (value) => {
    if (value === null || value === undefined) return '';
    return value.toString().trim();
};

const degreeOptionValue = (degree) => normalizeString(degree?.degreeAbbreviation) || normalizeString(degree?.degreeFullName) || normalizeString(degree?.id) || normalizeString(degree?._id);

const normalizeForMatch = (value) => normalizeString(value).toUpperCase();

const branchSelectValue = (branch) => normalizeString(branch?.branchAbbreviation) || normalizeString(branch?.branchFullName) || normalizeString(branch?.branchCode) || normalizeString(branch?.id) || normalizeString(branch?._id);

const formatDobForPassword = (date) => {
    if (!date) return '';
    const dob = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dob.getTime())) return '';
    const day = String(dob.getDate()).padStart(2, '0');
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    const year = dob.getFullYear();
    return `${day}${month}${year}`;
};

const isLikelyBase64 = (value) => {
    if (!value || typeof value !== 'string') return false;
    if (value.startsWith('data:') || value.startsWith('http') || value.startsWith('blob:')) {
        return false;
    }
    const cleaned = value.replace(/\s+/g, '');
    return /^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 64;
};

const getMimeFromName = (name) => {
    if (!name || typeof name !== 'string') return 'image/jpeg';
    const lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
};

const normalizeProfilePhotoUrl = (photo, photoName, apiBaseUrl) => {
    if (!photo) return null;

    if (photo.startsWith('data:') || photo.startsWith('http') || photo.startsWith('blob:')) {
        return photo;
    }

    if (isLikelyBase64(photo)) {
        const mime = getMimeFromName(photoName);
        return `data:${mime};base64,${photo}`;
    }

    try {
        return resolveProfileUrl(photo, apiBaseUrl);
    } catch (err) {
        console.error('resolveProfileUrl failed, falling back to basic join:', err);
        if (String(photo).startsWith('/api/file/')) {
            const backendBase = apiBaseUrl.replace('/api', '');
            return `${backendBase}${photo}`;
        }
        return photo;
    }
};

const formatDobForCalendar = (date) => {
    if (!date) return '';
    const dob = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dob.getTime())) return '';
    const day = String(dob.getDate()).padStart(2, '0');
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    const year = dob.getFullYear();
    return `${year}-${month}-${day}`;
};

const parseCalendarDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

function AdminFieldUpdateBanner({ isVisible, updatedFields = [] }) {
    if (!isVisible || updatedFields.length === 0) return null;

    const fieldText = updatedFields.join('  •  ');
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

function AdminCoDet() {
    /*
    return (
        <>
            <AdNavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className={styles['Admin-cood-detail-layout']}>
                <AdSidebar isOpen={isSidebarOpen} onLogout={handleLogout} />

                <div className={`${styles['Admin-cood-detail-main-content']} ${isSidebarOpen ? styles['sidebar-open'] : ''}`}>
                    {isInitialLoading && (
                        <PreviewProgressAlert
                            isOpen={true}
                            progress={loadingProgress}
                            title="Loading..."
                            messages={{
                                initial: 'Fetching coordinator details...',
                                mid: 'Preparing form...',
                                final: 'Opening editor...'
                            }}
                            color="#4EA24E"
                            progressColor="#4EA24E"
                        />
                    )}

                    <div className={styles['Admin-cood-detail-main-card']}>
                        <div className={styles['Admin-cood-detail-credentials-card']}>
                            <h3 className={styles['Admin-cood-detail-card-title']}>Coordinator Details</h3>

                            <div className={styles['Admin-cood-detail-details-grid']}>
                                <div className={styles['Admin-cood-detail-main-column']}>
                                    <div className={styles['Admin-cood-detail-card-content']}>
                                        <section className={styles['Admin-cood-detail-section']}>
                                            <div className={styles['Admin-cood-detail-input-grid']}>
                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        First Name <RequiredStar />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        placeholder="First Name"
                                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.firstName ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Last Name <RequiredStar />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        placeholder="Last Name"
                                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.lastName ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        DOB <RequiredStar />
                                                    </span>
                                                    <div className={styles['Admin-cood-detail-calendar-wrapper']}>
                                                        <Ad_Calendar
                                                            value={formatDobForCalendar(formData.dob)}
                                                            onChange={handleDobChange}
                                                            maxDate={new Date()}
                                                            disabled={isViewMode}
                                                        />
                                                    </div>
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Gender <RequiredStar />
                                                    </span>
                                                    <Dropdown
                                                        options={[
                                                            { label: 'Male', value: 'Male' },
                                                            { label: 'Female', value: 'Female' },
                                                            { label: 'Other', value: 'Other' }
                                                        ]}
                                                        selectedOption={formData.gender}
                                                        onSelect={(val) => handleInputChange({ target: { name: 'gender', value: val } })}
                                                        placeholder="Select Gender"
                                                        disabled={isViewMode}
                                                        role="admin"
                                                        className={styles['coord-form-dropdown-wrapper']}
                                                        headerClassName={`${styles['Admin-cood-detail-form-input']} ${styles['coord-form-dropdown-header']} ${errors.gender ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        ref={genderSelectRef}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Email ID <RequiredStar />
                                                    </span>
                                                    <input
                                                        type="email"
                                                        name="emailId"
                                                        placeholder="Email id"
                                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.emailId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        value={formData.emailId}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    Domain Mail ID
                                                    <input
                                                        type="email"
                                                        name="domainMailId"
                                                        placeholder="Domain Mail id"
                                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.domainMailId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        value={formData.domainMailId}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Phone Number <RequiredStar />
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        name="phoneNumber"
                                                        placeholder="Phone number"
                                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.phoneNumber ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        value={formData.phoneNumber}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    Cabin
                                                    <input
                                                        type="text"
                                                        name="cabin"
                                                        placeholder="Cabin"
                                                        className={styles['Admin-cood-detail-form-input']}
                                                        value={formData.cabin}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Degree <RequiredStar />
                                                    </span>
                                                    <Dropdown
                                                        options={degrees.map((degree) => {
                                                            const value = degreeOptionValue(degree);
                                                            const label = degree?.degreeFullName && degree?.degreeAbbreviation
                                                                ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                                                                : degree?.degreeFullName || degree?.degreeAbbreviation || value;
                                                            return { label, value };
                                                        })}
                                                        selectedOption={selectedDegree}
                                                        onSelect={(degreeValue) => {
                                                            setSelectedDegree(degreeValue);
                                                            handleInputChange({ target: { name: 'degree', value: degreeValue } });
                                                            if (!lockedBranchMeta) {
                                                                handleInputChange({ target: { name: 'branch', value: '' } });
                                                            }
                                                        }}
                                                        placeholder="Select Degree"
                                                        disabled={Boolean(lockedBranchMeta) || isViewMode}
                                                        role="admin"
                                                        className={styles['coord-form-dropdown-wrapper']}
                                                        headerClassName={`${styles['Admin-cood-detail-form-input']} ${styles['coord-form-dropdown-header']} ${errors.degree ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        ref={degreeSelectRef}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Branch <RequiredStar />
                                                    </span>
                                                    <Dropdown
                                                        options={filteredBranches.map((branch) => {
                                                            const label = branch?.branchFullName && branch?.branchAbbreviation
                                                                ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                                : branch?.branchFullName || branch?.branchAbbreviation;
                                                            const value = branchSelectValue(branch);
                                                            return { label, value };
                                                        })}
                                                        selectedOption={formData.branch}
                                                        onSelect={(val) => handleInputChange({ target: { name: 'branch', value: val } })}
                                                        placeholder={filteredBranches.length ? 'Select Branch' : 'No branches available'}
                                                        disabled={Boolean(lockedBranchMeta) || (!lockedBranchMeta && !selectedDegree) || !filteredBranches.length || isViewMode}
                                                        role="admin"
                                                        className={styles['coord-form-dropdown-wrapper']}
                                                        headerClassName={`${styles['Admin-cood-detail-form-input']} ${styles['coord-form-dropdown-header']} ${errors.branch ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        ref={branchSelectRef}
                                                    />
                                                </label>
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <div className={`${styles['Admin-cood-detail-photo-wrapper']} ${errors.profilePhoto ? styles['Admin-cood-detail-input-error'] : ''}`}>
                                    <div className={styles['Admin-cood-detail-photo-box']}>
                                        <h3 className={styles['Admin-cood-detail-photo-title']}>Profile Photo</h3>
                                        <div className={styles['Admin-cood-detail-profile-icon-container']}>
                                            {profilePhoto ? (
                                                <img
                                                    src={profilePhoto}
                                                    alt="Profile Preview"
                                                    className={styles['Admin-cood-detail-profile-preview-img']}
                                                    onClick={handleImageClick}
                                                />
                                            ) : (
                                                <img
                                                    src={ProfileGraduationcap}
                                                    alt="Graduation Cap"
                                                    className={styles['Admin-cood-detail-graduation-cap-icon']}
                                                    useAdminAuth(); // JWT authentication verification
                                                    const navigate = useNavigate();
                                                    const location = useLocation();
                                                    const urlSearchParams = useMemo(() => new URLSearchParams(location.search || ''), [location.search]);
                                                    const branchParam = normalizeString(urlSearchParams.get('branch'));
                                                    const editIdParam = normalizeString(urlSearchParams.get('editId'));
                                                    const viewIdParam = normalizeString(urlSearchParams.get('viewId'));
                                                    const branchState = normalizeString(location.state?.branchCode);
                                                    const preselectedBranchRaw = branchState || branchParam;
                                                    const preselectedBranchCode = normalizeForMatch(preselectedBranchRaw);
                                                    const isEditMode = Boolean(editIdParam);
                                                    const isViewMode = Boolean(viewIdParam);

                                                    const [formData, setFormData] = useState({
                                                        firstName: '',
                                                        lastName: '',
                                                        dob: null,
                                                        gender: '',
                                                        emailId: '',
                                                        domainMailId: '',
                                                        phoneNumber: '',
                                                        coordinatorId: '',
                                                        cabin: '',
                                                        password: '',
                                                        confirmPassword: '',
                                                        degree: '',
                                                        branch: ''
                                                    });

                                                    const [errors, setErrors] = useState({});
                                                    const [profilePhoto, setProfilePhoto] = useState(null);
                                                    const [profilePhotoData, setProfilePhotoData] = useState(null);
                                                    const [photoDetails, setPhotoDetails] = useState({ fileName: null, uploadDate: null });
                                                    const [isModalOpen, setIsModalOpen] = useState(false);
                                                    const [saveStatus, setSaveStatus] = useState(null);
                                                    const [popupMessage, setPopupMessage] = useState(null);
                                                    const [degrees, setDegrees] = useState([]);
                                                    const [branches, setBranches] = useState([]);
                                                    const [selectedDegree, setSelectedDegree] = useState('');
                                                    const [lockedBranchMeta, setLockedBranchMeta] = useState(null);
                                                    const [lockedDegreeValue, setLockedDegreeValue] = useState('');
                                                    const [isSaving, setIsSaving] = useState(false);
                                                    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
                                                    const [showSuccessModal, setShowSuccessModal] = useState(false);
                                                    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
                                                    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
                                                    const [isInitialLoading, setIsInitialLoading] = useState(false);
                                                    const [loadingProgress, setLoadingProgress] = useState(0);

                                                    const genderSelectRef = useRef(null);
                                                    const degreeSelectRef = useRef(null);
                                                    const branchSelectRef = useRef(null);
                                                    const previewObjectUrlRef = useRef(null);

                                                />
                                            )}
                                        </div>
                                        <div className={styles['Admin-cood-detail-upload-action-area']}>
                                            {!isViewMode && (
                                                <div className={styles['Admin-cood-detail-upload-btn-wrapper']}>
                                                    <label htmlFor="file-upload" className={styles['Admin-cood-detail-profile-upload-btn']}>
                                                        <div className={styles['Admin-cood-detail-upload-btn-content']}>
                                                            <MdUpload />
                                                            <span>Upload</span>
                                                        </div>
                                                    </label>
                                                    {profilePhoto && (
                                                        <button
                                                            onClick={handleRemovePhoto}
                                                            className={styles['Admin-cood-detail-remove-image-btn']}
                                                            aria-label="Remove image"
                                                        >
                                                            <IoMdClose />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {!isViewMode && (
                                                <>
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        className={styles['Admin-cood-detail-hidden-input']}
                                                        onChange={handlePhotoUpload}
                                                    />
                                                    {popupMessage && typeof popupMessage === 'object' && (
                                                        <p
                                                            className={popupMessage.type === 'success' ? styles['Admin-cood-detail-upload-success-message'] : styles['Admin-cood-detail-status-error']}
                                                            style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: '500', margin: '8px 0 0 0' }}
                                                        >
                                                            {popupMessage.text}
                                                        </p>
                                                    )}
                                                    <p className={styles['Admin-cood-detail-upload-hint']}>*JPG and WebP formats allowed.</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles['Admin-cood-detail-credentials-card']} ${styles['Admin-cood-detail-login-card']}`}>
                            <h3 className={styles['Admin-cood-detail-card-title']}>Coordinator Login Credentials</h3>
                            <div className={styles['Admin-cood-detail-card-content']}>
                                <div className={styles['Admin-cood-detail-login-fields']}>
                                    <label className={styles['Admin-cood-detail-field-label']}>
                                        <span className={styles['Admin-cood-detail-label-heading']}>
                                            Coordinator ID <RequiredStar />
                                        </span>
                                        <input
                                            type="text"
                                            name="coordinatorId"
                                            placeholder="Coordinator ID"
                                            className={`${styles['Admin-cood-detail-form-input']} ${errors.coordinatorId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                            value={formData.coordinatorId}
                                            onChange={handleInputChange}
                                            disabled={isViewMode}
                                        />
                                    </label>
                                    {!isViewMode && (
                                        <>
                                            <label className={styles['Admin-cood-detail-field-label']}>
                                                Enter Password
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="Enter Password"
                                                    className={`${styles['Admin-cood-detail-form-input']} ${errors.password ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                />
                                            </label>
                                            <div className={styles['Admin-cood-detail-password-hint']}>
                                                Password should be: <span>{formatDobForPassword(formData.dob) || 'DDMMYYYY'}</span> (based on DOB)
                                            </div>
                                            <label className={styles['Admin-cood-detail-field-label']}>
                                                Confirm Password
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    placeholder="Confirm Password"
                                                    className={`${styles['Admin-cood-detail-form-input']} ${errors.confirmPassword ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                />
                                            </label>
                                        </>
                                    )}
                                    {!isViewMode && (
                                        <div className={styles['Admin-cood-detail-login-buttons-desktop']}>
                                            <button
                                                type="button"
                                                className={styles['Admin-cood-detail-discard-btn']}
                                                onClick={handleDiscard}
                                            >
                                                Discard
                                            </button>
                                            <button
                                                type="button"
                                                className={styles['Admin-cood-detail-confirm-save-btn']}
                                                onClick={handleConfirmSave}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : (isEditMode ? 'Update Coordinator' : 'Confirm & Save')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!isViewMode && (
                            <div className={styles['Admin-cood-detail-mobile-actions']}>
                                <button
                                    type="button"
                                    className={styles['Admin-cood-detail-discard-btn']}
                                    onClick={handleDiscard}
                                >
                                    Discard
                                </button>
                                <button
                                    type="button"
                                    className={styles['Admin-cood-detail-confirm-save-btn']}
                                    onClick={handleConfirmSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : (isEditMode ? 'Update Coordinator' : 'Confirm & Save')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isCropModalOpen && cropImageSrc && (
                <PhotoCropModal
                    isOpen={isCropModalOpen}
                    imageSrc={cropImageSrc}
                    fileName={cropImageName}
                    onSave={handleCropSave}
                    onDiscard={handleCropDiscard}
                    onClose={handleCropDiscard}
                />
            )}

            {isModalOpen && profilePhoto && (
                <div className={styles['co-modal-overlay']} onClick={handleModalClose}>
                    <div className={styles['co-modal-content']} onClick={(e) => e.stopPropagation()}>
                        <span className={styles['co-modal-close']} onClick={handleModalClose}>&times;</span>
                        <img src={profilePhoto} alt="Full Profile Preview" className={styles['co-modal-image']} />
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className={styles['success-modal-overlay']}>
                    <div className={styles['success-modal-content']}>
                        <div className={styles['success-modal-header']}>
                            {isEditMode ? 'Updated!' : 'Added!'}
                        </div>
                        <div className={styles['success-modal-body']}>
                            <div className={styles['success-modal-icon-wrapper']}>
                                <img src={ProfileGraduationcap} alt="Success" className={styles['success-modal-icon']} />
                            </div>
                            <h2>{isEditMode ? 'Co-ordinator Updated ' : 'Co-ordinator Added '}</h2>
                            <p>{isEditMode ? 'Co-ordinator details have been' : 'New Co-ordinator have been'}<br />Successfully {isEditMode ? 'Updated' : 'Added in the Portal'}</p>
                            <button
                                className={styles['success-modal-close-btn']}
                                onClick={handleCloseSuccessModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <FileSizeErrorPopup
                isOpen={isFileSizeErrorOpen}
                onClose={closeFileSizeErrorPopup}
                fileSizeKB={fileSizeErrorKB}
            />
        </>
    );
}
    */
const [branches, setBranches] = useState([]);

    useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const urlSearchParams = useMemo(() => new URLSearchParams(location.search || ''), [location.search]);
    const branchParam = normalizeString(urlSearchParams.get('branch'));
    const editIdParam = normalizeString(urlSearchParams.get('editId'));
    const viewIdParam = normalizeString(urlSearchParams.get('viewId'));
    const branchState = normalizeString(location.state?.branchCode);
    const preselectedBranchRaw = branchState || branchParam;
    const preselectedBranchCode = normalizeForMatch(preselectedBranchRaw);
    const isEditMode = Boolean(editIdParam);
    const isViewMode = Boolean(viewIdParam);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: null,
        gender: '',
        emailId: '',
        domainMailId: '',
        phoneNumber: '',
        coordinatorId: '',
        cabin: '',
        password: '',
        confirmPassword: '',
        degree: '',
        branch: ''
    });

    const [errors, setErrors] = useState({});
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoData, setProfilePhotoData] = useState(null);
    const [photoDetails, setPhotoDetails] = useState({ fileName: null, uploadDate: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadPopupState, setDownloadPopupState] = useState('none');
    const [saveStatus, setSaveStatus] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [degrees, setDegrees] = useState([]);
    const [selectedDegree, setSelectedDegree] = useState('');
    const [lockedBranchMeta, setLockedBranchMeta] = useState(null);
    const [lockedDegreeValue, setLockedDegreeValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [cropImageName, setCropImageName] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showAllErrors, setShowAllErrors] = useState(false);
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    const [initialData, setInitialData] = useState({
        firstName: '',
        lastName: '',
        dob: null,
        gender: '',
        emailId: '',
        domainMailId: '',
        phoneNumber: '',
        coordinatorId: '',
        cabin: '',
        password: '',
        confirmPassword: '',
        degree: '',
        branch: ''
    });

    const changedFields = useMemo(() => {
        if (!initialData) return [];
        const changed = [];
        const normalize = (val) => {
            if (val === null || val === undefined) return '';
            if (val instanceof Date) {
                return val.toDateString();
            }
            return String(val).trim();
        };

        const EDITABLE_FIELD_LABELS = {
            firstName: 'First Name',
            lastName: 'Last Name',
            dob: 'Date Of Birth',
            gender: 'Gender',
            emailId: 'Email ID',
            domainMailId: 'Domain Mail ID',
            phoneNumber: 'Phone Number',
            cabin: 'Cabin',
            degree: 'Degree',
            branch: 'Branch',
            coordinatorId: 'Coo ID',
            password: 'Password',
            confirmPassword: 'Confirm Password'
        };

        Object.keys(EDITABLE_FIELD_LABELS).forEach((key) => {
            let formVal = formData[key];
            let initVal = initialData[key];
            if (key === 'dob') {
                const formDobStr = formVal ? new Date(formVal).toDateString() : '';
                const initDobStr = initVal ? new Date(initVal).toDateString() : '';
                if (formDobStr !== initDobStr) {
                    changed.push(EDITABLE_FIELD_LABELS[key]);
                }
            } else {
                if (normalize(formVal) !== normalize(initVal)) {
                    changed.push(EDITABLE_FIELD_LABELS[key]);
                }
            }
        });

        return changed;
    }, [formData, initialData]);

    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavView, setPendingNavView] = useState(null);

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

    const handleUnsavedModalSave = async () => {
        setShowUnsavedModal(false);
        await handleConfirmSave();
    };
    const [highlightedField, setHighlightedField] = useState(null);
    const [errorTooltip, setErrorTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [supportsPointerTooltip, setSupportsPointerTooltip] = useState(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
        return (
            window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches ||
            window.matchMedia("(hover: hover) and (pointer: fine)").matches
        );
    });

    const fieldRefs = useRef({});
    const highlightResetTimerRef = useRef(null);
    const highlightClearTimerRef = useRef(null);
    const previousErrorCountRef = useRef(0);

    const genderSelectRef = useRef(null);
    const degreeSelectRef = useRef(null);
    const branchSelectRef = useRef(null);
    const previewObjectUrlRef = useRef(null);
    const cropObjectUrlRef = useRef(null);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminId');
        localStorage.removeItem('userRole');
        navigate('/admin-login');
    };

    const handleInputChange = (e) => {
        let { name, value } = e.target;
        if (name === 'phoneNumber') {
            value = value.replace(/\D/g, '');
            value = value.replace(/^0+/, '');
            if (value.length > 0 && !/^[6789]/.test(value)) {
                value = '';
            }
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleDobChange = (date) => {
        const nextDate = date instanceof Date ? date : parseCalendarDate(date);
        setFormData((prev) => ({ ...prev, dob: nextDate }));
        if (errors.dob) {
            setErrors((prev) => ({ ...prev, dob: null }));
        }
    };

    const handlePhotoUpload = (e) => {
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

        if (cropObjectUrlRef.current) {
            URL.revokeObjectURL(cropObjectUrlRef.current);
            cropObjectUrlRef.current = null;
        }

        const cropUrl = URL.createObjectURL(file);
        cropObjectUrlRef.current = cropUrl;
        setCropImageSrc(cropUrl);
        setCropImageName(file.name);
        setIsCropModalOpen(true);
        setPopupMessage(null);
        e.target.value = '';
    };

    const handleCropSave = (croppedBlob, outputFileName) => {
        if (!croppedBlob) return;

        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }

        const croppedFile = new File([croppedBlob], outputFileName, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(croppedFile);
        previewObjectUrlRef.current = previewUrl;

        setProfilePhoto(previewUrl);
        setProfilePhotoData(croppedFile);
        setPhotoDetails({ fileName: croppedFile.name, uploadDate: new Date().toISOString() });
        setPopupMessage({ type: 'success', text: 'Image uploaded successfully' });
        setIsCropModalOpen(false);

        if (cropObjectUrlRef.current) {
            URL.revokeObjectURL(cropObjectUrlRef.current);
            cropObjectUrlRef.current = null;
        }

        setCropImageSrc(null);
        setCropImageName('');

        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleCropDiscard = () => {
        setIsCropModalOpen(false);

        if (cropObjectUrlRef.current) {
            URL.revokeObjectURL(cropObjectUrlRef.current);
            cropObjectUrlRef.current = null;
        }

        setCropImageSrc(null);
        setCropImageName('');
        setPopupMessage(null);

        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleImageClick = () => { if (profilePhoto) setIsModalOpen(true); };
    const handleModalClose = () => {
        if (downloadPopupState !== 'progress') {
            setIsModalOpen(false);
        }
    };
    const handleSuccessClose = () => {
        setDownloadPopupState('none');
        setIsModalOpen(false);
    };
    const handleDownload = async () => {
        if (!profilePhoto || downloadPopupState === 'progress') return;

        try {
            setDownloadPopupState('progress');
            const response = await fetch(profilePhoto);
            if (!response.ok) throw new Error('Failed to download image');

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `coordinator-profile-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);

            setDownloadPopupState('success');
        } catch (error) {
            console.error('Download failed:', error);
            setDownloadPopupState('error');
        }
    };
    const shouldShowPreviewPopup = downloadPopupState === 'none' || downloadPopupState === 'progress';
    const closeFileSizeErrorPopup = () => setIsFileSizeErrorOpen(false);

    const handleRemovePhoto = (e) => {
        e.preventDefault();
        if (cropObjectUrlRef.current) {
            URL.revokeObjectURL(cropObjectUrlRef.current);
            cropObjectUrlRef.current = null;
        }
        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }
        setProfilePhoto(null);
        setProfilePhotoData(null);
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false);
        setIsCropModalOpen(false);
        setCropImageSrc(null);
        setCropImageName('');
        const fileInput = document.getElementById('file-upload');

        if (fileInput) fileInput.value = '';
        setPopupMessage(null);
    };

    const handleDiscard = () => {
        setFormData({
            firstName: '', lastName: '', dob: null, gender: '', emailId: '',
            domainMailId: '', phoneNumber: '', coordinatorId: '', cabin: '',
            password: '', confirmPassword: '', degree: lockedDegreeValue || '', branch: lockedBranchMeta ? branchSelectValue(lockedBranchMeta) : ''
        });

        setProfilePhoto(null);
        setProfilePhotoData(null);
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false);
        setSaveStatus('discarded');

        setPopupMessage(null);
        setErrors({});
        navigate(-1);
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ['firstName', 'lastName', 'dob', 'gender', 'emailId',
            'domainMailId', 'phoneNumber', 'coordinatorId',
            'degree', 'branch'];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = 'This field is required';
            }
        });

        if (formData.phoneNumber && !/^[6789]\d{9}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number must be 10 digits starting with 6, 7, 8, or 9';
        }

        const passwordHint = formatDobForPassword(formData.dob);
        const shouldValidatePassword = !isViewMode && (!isEditMode || formData.password || formData.confirmPassword);

        if (shouldValidatePassword) {
            if (!formData.password) {
                newErrors.password = 'This field is required';
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'This field is required';
            }

            if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }

            if (passwordHint && formData.password && formData.password !== passwordHint) {
                newErrors.password = `Password should be: ${passwordHint} (based on DOB)`;
            }

            if (passwordHint && formData.confirmPassword && formData.confirmPassword !== passwordHint) {
                newErrors.confirmPassword = `Password should be: ${passwordHint} (based on DOB)`;
            }
        }

        if (!isEditMode && formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setPopupMessage(null);

        const nextErrorCount = Object.keys(newErrors).length;
        if (nextErrorCount !== previousErrorCountRef.current) {
            setShowAllErrors(false);
        }
        previousErrorCountRef.current = nextErrorCount;

        setErrors(newErrors);
        return nextErrorCount === 0;
    };

    const handleConfirmSave = async () => {
        if (!validateForm()) {
            console.log("Validation failed", errors);
            setSaveStatus('error');
            return;
        }

        setIsSaving(true);

        try {
            // Retrieve admin email for identity verification
            let adminEmail = '';
            try {
                const cachedProfile = JSON.parse(localStorage.getItem('adminProfileCache'));
                adminEmail = cachedProfile?.domainMailId || cachedProfile?.emailId;
            } catch (e) {}

            if (!adminEmail) {
                const adminLoginID = localStorage.getItem('adminLoginID') || 'admin';
                const profile = await mongoDBService.getAdminProfile(adminLoginID);
                adminEmail = profile?.domainMailId || profile?.emailId;
            }

            if (!adminEmail) {
                alert('Admin email address is required to proceed with identity verification.');
                setIsSaving(false);
                return;
            }

            setOtpEmail(adminEmail);
            setIsOtpOpen(true);
        } catch (err) {
            console.error('Error fetching admin profile for OTP:', err);
            alert('Failed to initialize verification system. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const executeConfirmSave = async () => {
        setIsOtpOpen(false);
        setIsSaving(true);
        setSaveStatus('saving');

        // Find the selected degree and branch objects to get full names
        const selectedDegreeObj = degrees.find(d =>
            normalizeString(d?.degreeAbbreviation) === normalizeString(formData.degree) ||
            normalizeString(d?.degreeFullName) === normalizeString(formData.degree)
        );

        const selectedBranchObj = branches.find(b =>
            normalizeString(b?.branchAbbreviation) === normalizeString(formData.branch) ||
            normalizeString(b?.branchFullName) === normalizeString(formData.branch) ||
            normalizeString(b?.branchCode) === normalizeString(formData.branch)
        );

        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dob: formData.dob ? formData.dob.toISOString() : null,
            gender: formData.gender,
            email: formData.emailId,
            emailId: formData.emailId,
            domainEmail: formData.domainMailId,
            domainMailId: formData.domainMailId,
            phoneNumber: formData.phoneNumber,
            degree: selectedDegreeObj?.degreeFullName || formData.degree,
            branch: selectedBranchObj?.branchFullName || formData.branch,
            department: selectedBranchObj?.branchAbbreviation || formData.branch,
            coordinatorId: formData.coordinatorId,
            cabin: formData.cabin,
            username: formData.coordinatorId,
            profilePhotoData: null, // Will be uploaded via GridFS
            profilePhotoName: photoDetails.fileName,
        };

        try {
            // Upload profile photo to GridFS if a File object is available
            if (profilePhotoData instanceof File) {
                const gridfsService = (await import('../services/gridfsService')).default;
                const coordId = formData.coordinatorId || editIdParam;
                const result = await gridfsService.uploadProfileImage(profilePhotoData, coordId, 'coordinator');
                payload.profilePhotoData = result.url; // GridFS URL
            }

            // Include password fields when creating or when editing credentials
            if (!isViewMode && formData.password && formData.confirmPassword) {
                payload.password = formData.password;
                payload.confirmPassword = formData.confirmPassword;
            }

            let response;
            if (isEditMode) {
                response = await mongoDBService.updateCoordinator(editIdParam, payload);
                console.log('Coordinator updated:', response);

                if (formData.password && formData.confirmPassword) {
                    await mongoDBService.updateCoordinatorCredentials(editIdParam, {
                        username: formData.coordinatorId,
                        password: formData.password
                    });
                }
            } else {
                response = await mongoDBService.createCoordinator(payload);
                console.log('Coordinator created:', response);
            }
            setSaveStatus('saved');
            setInitialData({ ...formData });
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error saving coordinator:', error);
            const message = error?.message || 'An error occurred while saving. Please try again.';
            alert(message);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // NEW: Function to close modal and navigate
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        // Navigate to the existing coordinators page for the branch just added/edited
        navigate(`/admin-manage-coordinators/${formData.branch || 'all'}`);
    };


    const handleDropdownIconClick = (ref) => {
        if (ref.current) {
            ref.current.focus();
            const event = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            ref.current.dispatchEvent(event);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleErrorTooltipMove = useCallback((event) => {
        if (!supportsPointerTooltip) return;
        setErrorTooltip({ visible: true, x: event.clientX + 14, y: event.clientY + 18 });
    }, [supportsPointerTooltip]);

    const handleErrorTooltipLeave = useCallback(() => {
        if (!supportsPointerTooltip) return;
        setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, [supportsPointerTooltip]);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

        const hybridQuery = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
        const primaryQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
        const updatePointerSupport = () => {
            const isSupported = hybridQuery.matches || primaryQuery.matches;
            setSupportsPointerTooltip(isSupported);
            if (!isSupported) {
                setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
            }
        };

        updatePointerSupport();

        if (typeof hybridQuery.addEventListener === "function") {
            hybridQuery.addEventListener("change", updatePointerSupport);
            primaryQuery.addEventListener("change", updatePointerSupport);
            return () => {
                hybridQuery.removeEventListener("change", updatePointerSupport);
                primaryQuery.removeEventListener("change", updatePointerSupport);
            };
        }

        hybridQuery.addListener(updatePointerSupport);
        primaryQuery.addListener(updatePointerSupport);
        return () => {
            hybridQuery.removeListener(updatePointerSupport);
            primaryQuery.removeListener(updatePointerSupport);
        };
    }, []);

    const filteredBranches = useMemo(() => {
        if (lockedBranchMeta) {
            return [lockedBranchMeta];
        }

        if (!selectedDegree) return branches;

        const normalizedSelectedDegree = selectedDegree?.toString?.().toUpperCase?.() || '';

        const matchingBranches = branches.filter((branch) => {
            if (!branch) return false;

            const degreeCandidates = [
                normalizeForMatch(branch?.degreeAbbreviation),
                normalizeForMatch(branch?.degreeFullName)
            ].filter(Boolean);

            return degreeCandidates.includes(normalizedSelectedDegree);
        });

        return matchingBranches.length ? matchingBranches : branches;
    }, [branches, selectedDegree, lockedBranchMeta]);

    const photoClassNames = useMemo(() => {
        const baseClass = styles['Admin-cood-detail-photo-preview'];
        if (!profilePhoto) return baseClass;
        return `${baseClass} ${styles['Admin-cood-detail-photo-clickable']} ${styles['Admin-cood-detail-photo-active']}`;
    }, [profilePhoto]);

    const missingRequiredFields = useMemo(() => {
        const list = [];

        // 1. Check required fields
        REQUIRED_COORDINATOR_FIELDS.forEach(({ field, label }) => {
            // Password fields are only required if we should validate password
            const shouldValidatePassword = !isViewMode && (!isEditMode || formData.password || formData.confirmPassword);
            if ((field === 'password' || field === 'confirmPassword') && !shouldValidatePassword) {
                return;
            }
            if (!formData[field]) {
                list.push({ field, label });
            }
        });

        // Validate phone number format
        if (!isViewMode && formData.phoneNumber && !/^[6789]\d{9}$/.test(formData.phoneNumber)) {
            list.push({
                field: 'phoneNumber',
                label: 'Phone Number',
                customMessage: 'Phone number must be 10 digits starting with 6, 7, 8, or 9'
            });
        }

        // 2. Validate password format (must match DOB in DDMMYYYY format) if DOB and password are both present
        const shouldValidatePassword = !isViewMode && (!isEditMode || formData.password || formData.confirmPassword);
        if (shouldValidatePassword) {
            const passwordHint = formatDobForPassword(formData.dob);
            if (passwordHint) {
                if (formData.password && formData.password !== passwordHint) {
                    list.push({
                        field: 'password',
                        label: 'Password',
                        customMessage: `password must be your date of birth in DDMMYYYY format (${passwordHint})`
                    });
                }
                if (formData.confirmPassword && formData.confirmPassword !== passwordHint) {
                    list.push({
                        field: 'confirmPassword',
                        label: 'Confirm Password',
                        customMessage: `confirm password must be your date of birth in DDMMYYYY format (${passwordHint})`
                    });
                }
            }
        }

        // 3. Validate passwords matching
        if (shouldValidatePassword && formData.password && formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                list.push({
                    field: 'confirmPassword',
                    label: 'Confirm Password',
                    customMessage: 'Enter Password and Confirm Password must match'
                });
            }
        }

        return list;
    }, [formData, isEditMode, isViewMode]);

    const canSaveCoordinator = useMemo(() => {
        return missingRequiredFields.length === 0 && !isSaving && !isViewMode;
    }, [missingRequiredFields.length, isSaving, isViewMode]);

    const registerFieldRef = useCallback((field) => (node) => {
        console.log('[DEBUG] registerFieldRef called for:', field, 'node:', node);
        fieldRefs.current[field] = node;
        console.log('[DEBUG] fieldRefs.current after registration:', fieldRefs.current);
    }, []);

    const clearFieldHighlight = useCallback(() => {
        if (highlightResetTimerRef.current) {
            clearTimeout(highlightResetTimerRef.current);
            highlightResetTimerRef.current = null;
        }

        if (highlightClearTimerRef.current) {
            clearTimeout(highlightClearTimerRef.current);
            highlightClearTimerRef.current = null;
        }

        setHighlightedField(null);
    }, []);

    const scrollToFieldAndBlink = useCallback((field) => {
        console.log('[DEBUG] scrollToFieldAndBlink called with field:', field);
        console.log('[DEBUG] fieldRefs.current:', fieldRefs.current);

        const target = fieldRefs.current[field];
        console.log('[DEBUG] target for field:', target);

        if (!target) {
            console.log('[DEBUG] REF NOT FOUND for field:', field);
            return false;
        }

        if (highlightResetTimerRef.current) {
            clearTimeout(highlightResetTimerRef.current);
            highlightResetTimerRef.current = null;
        }

        if (highlightClearTimerRef.current) {
            clearTimeout(highlightClearTimerRef.current);
            highlightClearTimerRef.current = null;
        }

        console.log('[DEBUG] scrolling to field:', field);
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

        if (typeof target.focus === 'function') {
            try {
                target.focus({ preventScroll: true });
            } catch {
                target.focus();
            }
        }

        if (target.tagName === 'SELECT') {
            target.dispatchEvent(new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true
            }));
        } else if (target.dataset?.adCalendarField === 'true' && typeof target.click === 'function') {
            target.click();
        }

        clearFieldHighlight();
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                setHighlightedField(field);
            });
        });

        highlightClearTimerRef.current = window.setTimeout(() => {
            setHighlightedField((currentField) => (currentField === field ? null : currentField));
        }, 3000);

        return true;
    }, [clearFieldHighlight]);

    const focusCoordinatorField = useCallback((field) => {
        console.log('[DEBUG] focusCoordinatorField called with:', field);
        if (!scrollToFieldAndBlink(field)) {
            console.log('[DEBUG] scrollToFieldAndBlink returned false for:', field);
            return;
        }
        console.log('[DEBUG] scrollToFieldAndBlink succeeded for:', field);
    }, [scrollToFieldAndBlink]);

    const getCoordinatorFieldClassName = useCallback((field, extraClassName = '') => {
        return [
            styles['Admin-cood-detail-form-input'],
            highlightedField === field ? styles['Admin-cood-detail-field-highlight'] : '',
            extraClassName
        ].filter(Boolean).join(' ');
    }, [highlightedField]);

    useEffect(() => () => {
        if (highlightResetTimerRef.current) {
            clearTimeout(highlightResetTimerRef.current);
            highlightResetTimerRef.current = null;
        }
        if (highlightClearTimerRef.current) {
            clearTimeout(highlightClearTimerRef.current);
            highlightClearTimerRef.current = null;
        }
        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }
        if (cropObjectUrlRef.current) {
            URL.revokeObjectURL(cropObjectUrlRef.current);
            cropObjectUrlRef.current = null;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchBranchesAndDegrees = async () => {
            try {
                const [degreeResponse, branchResponse] = await Promise.all([
                    mongoDBService.getDegrees(),
                    mongoDBService.getBranches()
                ]);

                if (!isMounted) return;

                const degreeList = Array.isArray(degreeResponse)
                    ? degreeResponse.filter((degree) => degree?.isActive !== false)
                    : [];
                const branchList = Array.isArray(branchResponse)
                    ? branchResponse.filter((branch) => branch?.isActive !== false)
                    : [];

                setDegrees(degreeList);
                setBranches(branchList);

                if (preselectedBranchCode) {
                    const matchingBranch = branchList.find((branch) => {
                        const matchCandidates = [
                            branch?.branchAbbreviation,
                            branch?.branchFullName,
                            branch?.branchCode,
                            branch?.id,
                            branch?._id
                        ].map(normalizeForMatch).filter(Boolean);
                        return matchCandidates.includes(preselectedBranchCode);
                    });

                    if (matchingBranch) {
                        const sanitizedBranch = {
                            ...matchingBranch,
                            branchAbbreviation: normalizeString(matchingBranch.branchAbbreviation),
                            branchFullName: normalizeString(matchingBranch.branchFullName),
                            branchCode: normalizeString(matchingBranch.branchCode)
                        };

                        setLockedBranchMeta(sanitizedBranch);

                        const matchableBranchDegrees = [
                            normalizeForMatch(matchingBranch.degreeAbbreviation),
                            normalizeForMatch(matchingBranch.degreeFullName)
                        ].filter(Boolean);

                        const matchingDegree = degreeList.find((degree) => {
                            const candidateValues = [
                                normalizeForMatch(degree?.degreeAbbreviation),
                                normalizeForMatch(degree?.degreeFullName),
                                normalizeForMatch(degree?.id),
                                normalizeForMatch(degree?._id)
                            ].filter(Boolean);
                            return candidateValues.some((candidate) => matchableBranchDegrees.includes(candidate));
                        });

                        const preferredDegreeValue = matchingDegree
                            ? degreeOptionValue(matchingDegree)
                            : (normalizeString(matchingBranch.degreeAbbreviation) || normalizeString(matchingBranch.degreeFullName));

                        const branchValue = branchSelectValue(matchingBranch);

                        setLockedDegreeValue(preferredDegreeValue);
                        setSelectedDegree(preferredDegreeValue);
                        setFormData((prev) => ({
                            ...prev,
                            degree: preferredDegreeValue,
                            branch: branchValue
                        }));
                        setInitialData((prev) => ({
                            ...prev,
                            degree: preferredDegreeValue,
                            branch: branchValue
                        }));
                        return;
                    }
                }

                setLockedBranchMeta(null);
                setLockedDegreeValue('');
                setSelectedDegree('');
                setFormData((prev) => ({ ...prev, degree: '', branch: '' }));
            } catch (error) {
                console.error('Failed to load degree/branch data:', error);
            }
        };

        fetchBranchesAndDegrees();

        return () => {
            isMounted = false;
        };
    }, [preselectedBranchCode]);

    useEffect(() => {
        let isMounted = true;

        const loadCoordinatorDetails = async () => {
            const idToFetch = editIdParam || viewIdParam;
            if (!idToFetch) return;

            setIsInitialLoading(true);
            setLoadingProgress(20);
            try {
                const response = await mongoDBService.getCoordinatorById(idToFetch);
                if (!isMounted) return;
                
                setLoadingProgress(60);
                const coordinator = response?.coordinator;
                if (coordinator) {
                    const dobValue = coordinator.dob ? new Date(coordinator.dob) : null;
                    
                    // Find matching branch in branch list using coordinator's department code
                    const departmentCode = normalizeString(coordinator.department);
                    const matchingBranch = branches.find(b => 
                        normalizeForMatch(b?.branchAbbreviation) === normalizeForMatch(departmentCode) ||
                        normalizeForMatch(b?.branchCode) === normalizeForMatch(departmentCode) ||
                        normalizeForMatch(b?.id) === normalizeForMatch(departmentCode) ||
                        normalizeForMatch(b?._id) === normalizeForMatch(departmentCode)
                    );

                    let degreeValue = '';
                    let branchValue = '';

                    if (matchingBranch) {
                        branchValue = branchSelectValue(matchingBranch);
                        // Find matching degree for this branch
                        const matchableBranchDegrees = [
                            normalizeForMatch(matchingBranch.degreeAbbreviation),
                            normalizeForMatch(matchingBranch.degreeFullName)
                        ].filter(Boolean);

                        const matchingDegree = degrees.find((degree) => {
                            const candidateValues = [
                                normalizeForMatch(degree?.degreeAbbreviation),
                                normalizeForMatch(degree?.degreeFullName),
                                normalizeForMatch(degree?.id),
                                normalizeForMatch(degree?._id)
                            ].filter(Boolean);
                            return candidateValues.some((candidate) => matchableBranchDegrees.includes(candidate));
                        });

                        degreeValue = matchingDegree ? degreeOptionValue(matchingDegree) : '';
                    } else {
                        // Fallback to whatever is stored on the coordinator document
                        degreeValue = coordinator.degree || '';
                        branchValue = coordinator.branch || '';
                    }

                    setSelectedDegree(degreeValue);

                    const calculatedPassword = dobValue ? formatDobForPassword(dobValue) : '';
                    const loadedData = {
                        firstName: coordinator.firstName || '',
                        lastName: coordinator.lastName || '',
                        dob: dobValue,
                        gender: coordinator.gender || '',
                        emailId: coordinator.email || coordinator.emailId || '',
                        domainMailId: coordinator.domainEmail || coordinator.domainMailId || '',
                        phoneNumber: coordinator.phone || coordinator.phoneNumber || '',
                        coordinatorId: coordinator.coordinatorId || '',
                        cabin: coordinator.cabin || '',
                        password: calculatedPassword,
                        confirmPassword: calculatedPassword,
                        degree: degreeValue,
                        branch: branchValue
                    };
                    setFormData(loadedData);
                    setInitialData(loadedData);

                    if (coordinator.profilePhoto) {
                        const resolvedPhoto = normalizeProfilePhotoUrl(coordinator.profilePhoto, coordinator.profilePhotoName, API_BASE_URL);
                        setProfilePhoto(resolvedPhoto);
                        setPhotoDetails({
                            fileName: coordinator.profilePhotoName || 'profile-photo.jpg',
                            uploadDate: coordinator.updatedAt ? new Date(coordinator.updatedAt).toLocaleDateString('en-GB') : 'N/A'
                        });
                    }
                }
                setLoadingProgress(100);
            } catch (error) {
                console.error('Failed to load coordinator details:', error);
            } finally {
                if (isMounted) {
                    setIsInitialLoading(false);
                }
            }
        };

        if (degrees.length > 0 && branches.length > 0) {
            loadCoordinatorDetails();
        }
    }, [editIdParam, viewIdParam, degrees, branches]);

    return (
        <>
            <AdNavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <AdminFieldUpdateBanner
                isVisible={changedFields.length > 0}
                updatedFields={changedFields}
            />
            <div className={styles['Admin-cood-detail-layout']}>
                <AdSidebar
                    isOpen={isSidebarOpen}
                    onLogout={handleLogout}
                    onViewChange={handleViewChange}
                />

                <div className={`${styles['Admin-cood-detail-main-content']} ${isSidebarOpen ? styles['sidebar-open'] : ''}`}>
                    {isInitialLoading && (
                        <PreviewProgressAlert
                            isOpen={true}
                            progress={loadingProgress}
                            title="Loading..."
                            messages={{
                                initial: 'Fetching coordinator details...',
                                mid: 'Preparing form...',
                                final: 'Opening editor...'
                            }}
                            color="#4EA24E"
                            progressColor="#4EA24E"
                        />
                    )}
                    <div className={styles['Admin-cood-detail-main-card']}>
                        <div className={styles['Admin-cood-detail-credentials-card']}>
                            <h3 className={styles['Admin-cood-detail-card-title']}>Coordinator Details</h3>
                            <div className={styles['Admin-cood-detail-details-grid']}>
                                <div className={styles['Admin-cood-detail-main-column']}>
                                    <div className={styles['Admin-cood-detail-card-content']}>
                                        <section className={styles['Admin-cood-detail-section']}>
                                            <div className={styles['Admin-cood-detail-input-grid']}>
                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        First Name <RequiredStar />
                                                    </span>
                                                    <input
                                                        ref={registerFieldRef('firstName')}
                                                        type="text"
                                                        name="firstName"
                                                        placeholder="First Name"
                                                        className={getCoordinatorFieldClassName('firstName', errors.firstName ? styles['Admin-cood-detail-input-error'] : '')}
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Last Name <RequiredStar />
                                                    </span>
                                                    <input
                                                        ref={registerFieldRef('lastName')}
                                                        type="text"
                                                        name="lastName"
                                                        placeholder="Last Name"
                                                        className={getCoordinatorFieldClassName('lastName', errors.lastName ? styles['Admin-cood-detail-input-error'] : '')}
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        DOB <RequiredStar />
                                                    </span>
                                                    <div className={styles['Admin-cood-detail-calendar-wrapper']}>
                                                        <Ad_Calendar
                                                            ref={registerFieldRef('dob')}
                                                            triggerClassName={highlightedField === 'dob' ? styles['Admin-cood-detail-field-highlight'] : ''}
                                                            triggerHighlighted={highlightedField === 'dob'}
                                                            value={formatDobForCalendar(formData.dob)}
                                                            onChange={handleDobChange}
                                                            maxDate={new Date()}
                                                            disabled={isViewMode}
                                                        />
                                                    </div>
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Gender <RequiredStar />
                                                    </span>
                                                    <Dropdown
                                                        options={[
                                                            { label: 'Male', value: 'Male' },
                                                            { label: 'Female', value: 'Female' },
                                                            { label: 'Other', value: 'Other' }
                                                        ]}
                                                        selectedOption={formData.gender}
                                                        onSelect={(val) => handleInputChange({ target: { name: 'gender', value: val } })}
                                                        placeholder="Select Gender"
                                                        disabled={isViewMode}
                                                        role="admin"
                                                        className={styles['coord-form-dropdown-wrapper']}
                                                        headerClassName={getCoordinatorFieldClassName('gender', `${styles['coord-form-dropdown-header']} ${errors.gender ? styles['Admin-cood-detail-input-error'] : ''}`)}
                                                        ref={(node) => {
                                                            genderSelectRef.current = node;
                                                            fieldRefs.current.gender = node;
                                                        }}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Email ID <RequiredStar />
                                                    </span>
                                                    <input
                                                        ref={registerFieldRef('emailId')}
                                                        type="email"
                                                        name="emailId"
                                                        placeholder="Email id"
                                                        className={getCoordinatorFieldClassName('emailId', errors.emailId ? styles['Admin-cood-detail-input-error'] : '')}
                                                        value={formData.emailId}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Domain Mail ID <RequiredStar />
                                                    </span>
                                                    <input
                                                        ref={registerFieldRef('domainMailId')}
                                                        type="email"
                                                        name="domainMailId"
                                                        placeholder="Domain Mail id"
                                                        className={getCoordinatorFieldClassName('domainMailId', errors.domainMailId ? styles['Admin-cood-detail-input-error'] : '')}
                                                        value={formData.domainMailId}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Phone Number <RequiredStar />
                                                    </span>
                                                    <div className={`${styles['mobileInputWrapper']} ${errors.phoneNumber ? styles['Admin-cood-detail-input-error'] : ''} ${highlightedField === 'phoneNumber' ? styles['Admin-cood-detail-field-highlight'] : ''}`}>
                                                        <div className={styles['countryCode']}>+91</div>
                                                        <input
                                                            ref={registerFieldRef('phoneNumber')}
                                                            type="tel"
                                                            name="phoneNumber"
                                                            placeholder="Phone number"
                                                            className={styles['mobileNumberInput']}
                                                            value={formData.phoneNumber}
                                                            onChange={handleInputChange}
                                                            disabled={isViewMode}
                                                            maxLength={10}
                                                        />
                                                    </div>
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    Cabin
                                                    <input
                                                        type="text"
                                                        name="cabin"
                                                        placeholder="Cabin"
                                                        className={styles['Admin-cood-detail-form-input']}
                                                        value={formData.cabin}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Degree <RequiredStar />
                                                    </span>
                                                    <Dropdown
                                                        options={degrees.map((degree) => {
                                                            const value = degreeOptionValue(degree);
                                                            const label = degree?.degreeFullName && degree?.degreeAbbreviation
                                                                ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                                                                : degree?.degreeFullName || degree?.degreeAbbreviation || value;
                                                            return { label, value };
                                                        })}
                                                        selectedOption={selectedDegree}
                                                        onSelect={(degreeValue) => {
                                                            setSelectedDegree(degreeValue);
                                                            handleInputChange({ target: { name: 'degree', value: degreeValue } });
                                                            if (!lockedBranchMeta) {
                                                                handleInputChange({ target: { name: 'branch', value: '' } });
                                                            }
                                                        }}
                                                        placeholder="Select Degree"
                                                        disabled={Boolean(lockedBranchMeta) || isViewMode}
                                                        role="admin"
                                                        className={styles['coord-form-dropdown-wrapper']}
                                                        headerClassName={getCoordinatorFieldClassName('degree', `${styles['coord-form-dropdown-header']} ${errors.degree ? styles['Admin-cood-detail-input-error'] : ''}`)}
                                                        ref={(node) => {
                                                            degreeSelectRef.current = node;
                                                            fieldRefs.current.degree = node;
                                                        }}
                                                    />
                                                </label>

                                                <label className={styles['Admin-cood-detail-field-label']}>
                                                    <span className={styles['Admin-cood-detail-label-heading']}>
                                                        Branch <RequiredStar />
                                                    </span>
                                                    <Dropdown
                                                        options={filteredBranches.map((branch) => {
                                                            const label = branch?.branchFullName && branch?.branchAbbreviation
                                                                ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                                : branch?.branchFullName || branch?.branchAbbreviation;
                                                            const value = branchSelectValue(branch);
                                                            return { label, value };
                                                        })}
                                                        selectedOption={formData.branch}
                                                        onSelect={(val) => handleInputChange({ target: { name: 'branch', value: val } })}
                                                        placeholder={filteredBranches.length ? 'Select Branch' : 'No branches available'}
                                                        disabled={Boolean(lockedBranchMeta) || (!lockedBranchMeta && !selectedDegree) || !filteredBranches.length || isViewMode}
                                                        role="admin"
                                                        className={styles['coord-form-dropdown-wrapper']}
                                                        headerClassName={getCoordinatorFieldClassName('branch', `${styles['coord-form-dropdown-header']} ${errors.branch ? styles['Admin-cood-detail-input-error'] : ''}`)}
                                                        ref={(node) => {
                                                            branchSelectRef.current = node;
                                                            fieldRefs.current.branch = node;
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <div className={`${styles['Admin-cood-detail-photo-wrapper']} ${errors.profilePhoto ? styles['Admin-cood-detail-input-error'] : ''}`}>
                                    <div className={styles['Admin-cood-detail-photo-box']}>
                                        <h3 className={styles['Admin-cood-detail-photo-title']}>Profile Photo</h3>
                                        <div className={styles['Admin-cood-detail-profile-icon-container']}>
                                            {profilePhoto ? (
                                                <img
                                                    src={profilePhoto}
                                                    alt="Profile Preview"
                                                    className={styles['Admin-cood-detail-profile-preview-img']}
                                                    onClick={handleImageClick}
                                                />
                                            ) : (
                                                <img
                                                    src={ProfileGraduationcap}
                                                    alt="Graduation Cap"
                                                    className={styles['Admin-cood-detail-graduation-cap-icon']}
                                                />
                                            )}
                                        </div>
                                        <div className={styles['Admin-cood-detail-upload-action-area']}>
                                            {!isViewMode && (
                                                <div className={styles['Admin-cood-detail-upload-btn-wrapper']}>
                                                    <label htmlFor="file-upload" className={styles['Admin-cood-detail-profile-upload-btn']}>
                                                        <div className={styles['Admin-cood-detail-upload-btn-content']}>
                                                            <MdUpload />
                                                            <span>Upload</span>
                                                        </div>
                                                    </label>
                                                    {profilePhoto && (
                                                        <button
                                                            onClick={handleRemovePhoto}
                                                            className={styles['Admin-cood-detail-remove-image-btn']}
                                                            aria-label="Remove image"
                                                        >
                                                            <IoMdClose />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {!isViewMode && (
                                                <>
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        className={styles['Admin-cood-detail-hidden-input']}
                                                        onChange={handlePhotoUpload}
                                                    />
                                                    {popupMessage && typeof popupMessage === 'object' && (
                                                        <p
                                                            className={popupMessage.type === 'success' ? styles['Admin-cood-detail-upload-success-message'] : styles['Admin-cood-detail-status-error']}
                                                            style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: '500', margin: '8px 0 0 0' }}
                                                        >
                                                            {popupMessage.text}
                                                        </p>
                                                    )}
                                                    <p className={styles['Admin-cood-detail-upload-hint']}>*JPG and WebP formats allowed.</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>



                        </div>
                        <div className={`${styles['Admin-cood-detail-credentials-card']} ${styles['Admin-cood-detail-login-card']}`}>
                            <h3 className={styles['Admin-cood-detail-card-title']}>Coordinator Login Credentials</h3>
                            <div className={styles['Admin-cood-detail-card-content']}>
                                <div className={styles['Admin-cood-detail-login-fields']}>
                                    <label className={styles['Admin-cood-detail-field-label']}>
                                        <span className={styles['Admin-cood-detail-label-heading']}>
                                            Coordinator ID <RequiredStar />
                                        </span>
                                        <input
                                            ref={registerFieldRef('coordinatorId')}
                                            type="text"
                                            name="coordinatorId"
                                            placeholder="Coordinator ID"
                                            className={getCoordinatorFieldClassName('coordinatorId', errors.coordinatorId ? styles['Admin-cood-detail-input-error'] : '')}
                                            value={formData.coordinatorId}
                                            onChange={handleInputChange}
                                            disabled={isViewMode}
                                        />
                                    </label>
                                    
                                        <>
                                            <label className={styles['Admin-cood-detail-field-label']}>
                                                <span className={styles['Admin-cood-detail-label-heading']}>
                                                    Enter Password <RequiredStar />
                                                </span>
                                                <div className={styles['Admin-cood-detail-password-wrapper']}>
                                                    <input
                                                        ref={registerFieldRef('password')}
                                                        type={isViewMode ? "text" : (showPassword ? "text" : "password")}
                                                        name="password"
                                                        placeholder="Enter Password"
                                                        className={getCoordinatorFieldClassName('password', errors.password ? styles['Admin-cood-detail-input-error'] : '')}
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                    {!isViewMode && (
                                                        <button
                                                            type="button"
                                                            className={styles['Admin-cood-detail-password-toggle-btn']}
                                                            onClick={() => setShowPassword(prev => !prev)}
                                                        >
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    )}
                                                </div>
                                                {!isViewMode && (
                                                    <div className={styles['Admin-cood-detail-password-hint']}>
                                                        Password should be: <span>{formatDobForPassword(formData.dob) || 'DDMMYYYY'}</span> (based on DOB)
                                                    </div>
                                                )}
                                            </label>

                                            <label className={styles['Admin-cood-detail-field-label']}>
                                                <span className={styles['Admin-cood-detail-label-heading']}>
                                                    Confirm Password <RequiredStar />
                                                </span>
                                                <div className={styles['Admin-cood-detail-password-wrapper']}>
                                                    <input
                                                        ref={registerFieldRef('confirmPassword')}
                                                        type={isViewMode ? "text" : (showConfirmPassword ? "text" : "password")}
                                                        name="confirmPassword"
                                                        placeholder="Confirm Password"
                                                        className={getCoordinatorFieldClassName('confirmPassword', errors.confirmPassword ? styles['Admin-cood-detail-input-error'] : '')}
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                        disabled={isViewMode}
                                                    />
                                                    {!isViewMode && (
                                                        <button
                                                            type="button"
                                                            className={styles['Admin-cood-detail-password-toggle-btn']}
                                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                                        >
                                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    )}
                                                </div>
                                            </label>
                                        </>
                                    

                                </div>
                            </div>
                        </div>

                        {missingRequiredFields.length > 0 && (
                            <MissingFieldsCard
                                missingFields={missingRequiredFields}
                                onFieldClick={focusCoordinatorField}
                                showAllErrors={showAllErrors}
                                onToggleShowAll={() => setShowAllErrors((prev) => !prev)}
                                errorTooltip={errorTooltip}
                                supportsPointerTooltip={supportsPointerTooltip}
                                onTooltipMove={handleErrorTooltipMove}
                                onTooltipLeave={handleErrorTooltipLeave}
                            />
                        )}
                        {!isViewMode && (
                            <div className={styles['Admin-cood-detail-final-actions']}>
                                <button
                                    type="button"
                                    className={styles['Admin-cood-detail-discard-btn']}
                                    onClick={handleDiscard}
                                >
                                    Discard
                                </button>
                                <button
                                    type="button"
                                    className={styles['Admin-cood-detail-confirm-save-btn']}
                                    onClick={handleConfirmSave}
                                    disabled={!canSaveCoordinator}
                                >
                                    {isSaving ? 'Saving...' : (isEditMode ? 'Update Coordinator' : 'Confirm & Save')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {isCropModalOpen && cropImageSrc && (
                <PhotoCropModal
                    isOpen={isCropModalOpen}
                    imageSrc={cropImageSrc}
                    fileName={cropImageName}
                    onSave={handleCropSave}
                    onDiscard={handleCropDiscard}
                    onClose={handleCropDiscard}
                />
            )}

            {isModalOpen && profilePhoto && shouldShowPreviewPopup && (
                <div className={styles.imagePreviewOverlay} onClick={downloadPopupState === 'progress' ? undefined : handleModalClose}>
                    <div className={styles.imagePreviewContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.imagePreviewHeader}>Preview Image</div>
                        <div className={styles.imagePreviewBody}>
                            <img src={profilePhoto} alt="Profile Preview" />
                        </div>
                        <div className={styles.imagePreviewFooter}>
                            <button
                                onClick={handleModalClose}
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
                color="#4ea24e"
            />

            <DownloadFailedAlert
                isOpen={downloadPopupState === 'error'}
                onClose={() => setDownloadPopupState('none')}
                color="#4ea24e"
            />

            {showSuccessModal && (
                <div className={styles['success-modal-overlay']}>
                    <div className={styles['success-modal-content']}>
                        <div className={styles['success-modal-header']}>
                            {isEditMode ? 'Updated !' : 'Added !'}
                        </div>
                        <div className={styles['success-modal-body']}>
                            <div className={styles['success-modal-icon']}>
                                <img src={AddCoordinatoricon} alt="Coordinator Success" style={{ width: '40px', height: '40px', filter: 'brightness(0) invert(1)' }} />
                            </div>
                            <h2 className={styles['success-modal-title']}>
                                {isEditMode ? 'Co-ordinator Updated ✓' : 'Co-ordinator Added ✓'}
                            </h2>
                            <p className={styles['success-modal-message']}>
                                {isEditMode 
                                    ? 'Co-ordinator details have been Successfully Updated in the Portal'
                                    : 'New Co-ordinator have been Successfully Added in the Portal'}
                            </p>
                        </div>
                        <div className={styles['success-modal-footer']}>
                            <button
                                className={styles['success-modal-close-btn']}
                                onClick={handleCloseSuccessModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Size Error Popup */}
            <FileSizeErrorPopup
                isOpen={isFileSizeErrorOpen}
                onClose={() => setIsFileSizeErrorOpen(false)}
                fileSizeKB={fileSizeErrorKB}
            />

            {/* OTP Verification Modal */}
            <OtpModal
                isOpen={isOtpOpen}
                onClose={() => setIsOtpOpen(false)}
                role="admin"
                email={otpEmail}
                purpose="ADMIN_ACTION"
                onVerifySuccess={executeConfirmSave}
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
        </>
    );
}

export default AdminCoDet;