import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
// Assuming these paths are correct for your existing files
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import mongoDBService from '../services/mongoDBService.jsx';
import gridfsService from '../services/gridfsService';
import { fileToBase64WithCompression, getBase64SizeKB } from '../utils/imageCompression';
import API_BASE_URL from '../utils/apiConfig';
import { DownloadSuccessAlert, DownloadFailedAlert } from '../components/alerts/DownloadPreviewAlerts';
import CoordinatorUnsavedChangesAlert from '../components/alerts/CoordinatorUnsavedChangesAlert';

// Import CSS Module
import styles from './Coo_Profile.module.css';

// Placeholder images
import Adminicon from "../assets/Adminicon.png";
import GraduateCapIcon from "../assets/Coordinatorcap.png";
import ProfileGraduationcap from "../assets/ProfileGraduationcap.svg"

// Helper to get coordinator ID from storage
const getCoordinatorId = () => {
    try {
        const coordinatorData = localStorage.getItem('coordinatorData');
        if (coordinatorData) {
            const parsed = JSON.parse(coordinatorData);
            // Try multiple fields where coordinatorId might be stored
            const id = parsed.coordinatorId || parsed._id || parsed.id || parsed.username;
            console.log('ðŸ“‹ Coordinator data from storage:', {
                coordinatorId: parsed.coordinatorId,
                _id: parsed._id,
                id: parsed.id,
                username: parsed.username,
                resolved: id
            });
            return id;
        }
        // Fallback to separate localStorage key
        const separateId = localStorage.getItem('coordinatorId') || localStorage.getItem('coordinatorUsername');
        if (separateId) {
            console.log('ðŸ“‹ Coordinator ID from separate key:', separateId);
            return separateId;
        }
    } catch (e) {
        console.error('Error getting coordinator ID:', e);
    }
    return null;
};

// Helper to check if a string is likely base64 encoded
const isLikelyBase64 = (value) => {
    if (!value || typeof value !== 'string') return false;
    if (value.startsWith('data:') || value.startsWith('http') || value.startsWith('blob:')) {
        return false;
    }
    const cleaned = value.replace(/\s+/g, '');
    return /^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 64;
};

// Helper to get MIME type from filename
const getMimeFromName = (name) => {
    if (!name || typeof name !== 'string') return 'image/jpeg';
    const lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
};

// Helper to normalize profile photo URL (handles raw base64 strings)
const normalizeProfilePhotoUrl = (data) => {
    const source = data?.profilePhoto || data?.profilePicURL || data?.profilePhotoUrl || data?.photoURL;
    if (!source) return null;

    // Already a valid URL format
    if (source.startsWith('data:') || source.startsWith('http') || source.startsWith('blob:')) {
        return source;
    }

    // GridFS relative path /api/file/... - prepend backend base URL
    if (source.startsWith('/api/file/')) {
        const backendBase = API_BASE_URL.replace('/api', '');
        return `${backendBase}${source}`;
    }

    // Raw base64 string - add the data URL prefix
    if (isLikelyBase64(source)) {
        const mime = getMimeFromName(data?.profilePhotoName);
        return `data:${mime};base64,${source}`;
    }

    return source;
};

// Icons to match ManageStudentsProfile styles
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
);

// FileSizeErrorPopup Component
const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;

    return (
        <div className={styles['CoProfile-popup-overlay']}>
            <div className={styles['CoProfile-popup-container']}>
                <div className={styles['CoProfile-popup-header']} style={{ backgroundColor: '#C1272D' }}>
                    Image Too Large!
                </div>
                <div className={styles['CoProfile-popup-body']}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#C1272D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
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
                <div className={styles['CoProfile-popup-footer']}>
                    <button onClick={onClose} style={{ backgroundColor: '#C1272D' }} className={styles['CoProfile-popup-close-btn']}>OK</button>
                </div>
            </div>
        </div>
    );
};

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles['co-profile-success-overlay']}>
            <div className={styles['CoProfile-popup-container']}>
                <div className={styles['CoProfile-popup-header']}>Saved !</div>
                <div className={styles['CoProfile-popup-body']}>
                    <svg className={styles['CoProfile-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['CoProfile-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={styles['CoProfile-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Details Saved âœ“</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className={styles['CoProfile-popup-footer']}>
                    <button onClick={onClose} className={styles['CoProfile-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const UploadIconSVG = () => (
    <svg className={styles['co-profile-upload-svg']} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 16h2V9h4l-5-5-5 5h4v7zm-5 4h12v-2H6v2z" fill="currentColor"/>
    </svg>
);

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    const [downloadPopupState, setDownloadPopupState] = useState('none');
    const shouldShowPreviewPopup = downloadPopupState === 'none' || downloadPopupState === 'progress';

    if (!isOpen) return null;

    const handleSuccessClose = () => {
        setDownloadPopupState('none');
        onClose();
    };

    const handleDownload = async () => {
        if (!src || downloadPopupState === 'progress') return;

        try {
            setDownloadPopupState('progress');
            const response = await fetch(src);
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
                color="#D23B42"
            />
        </>
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

const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);

    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
};

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return null;

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        croppedCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
};

const CropImageModal = ({ isOpen, imageSrc, onCrop, onClose, onDiscard }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSaveCrop = async () => {
        try {
            if (!imageSrc || !croppedAreaPixels) return;
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (!croppedBlob) return;

            const croppedFile = new File([croppedBlob], `coordinator-profile-${Date.now()}.jpg`, {
                type: 'image/jpeg',
            });
            onCrop(croppedFile);
        } catch (error) {
            console.error('Crop failed:', error);
            alert('Unable to crop image. Please try again.');
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
                                <button onClick={() => setRotation((r) => (r - 10 + 360) % 360)} className={styles.rotateBtn}>â†º</button>
                                <span className={styles.angleValue}>{rotation}Â°</span>
                                <button onClick={() => setRotation((r) => (r + 10) % 360)} className={styles.rotateBtn}>â†»</button>
                            </div>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className={styles.angleSlider}
                            />
                            <button onClick={() => setRotation(0)} className={styles.resetBtn}>Reset</button>
                        </div>

                        <div className={styles.controlGroup}>
                            <label className={styles.controlLabel}>Aspect Ratio</label>
                            <div className={styles.aspectRatioButtons}>
                                <button onClick={() => setAspect(null)} className={`${styles.aspectBtn} ${aspect === null ? styles.active : ''}`}>Custom</button>
                                <button onClick={() => setAspect(1)} className={`${styles.aspectBtn} ${aspect === 1 ? styles.active : ''}`}>1:1</button>
                                <button onClick={() => setAspect(4 / 3)} className={`${styles.aspectBtn} ${aspect === 4 / 3 ? styles.active : ''}`}>4:3</button>
                                <button onClick={() => setAspect(3 / 4)} className={`${styles.aspectBtn} ${aspect === 3 / 4 ? styles.active : ''}`}>3:4</button>
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
                    <button onClick={onDiscard} className={`${styles.cropBtn} ${styles.discardBtn}`}>Discard</button>
                    <button onClick={handleSaveCrop} className={`${styles.cropBtn} ${styles.uploadBtn}`}>Upload</button>
                </div>
            </div>
        </div>
    );
};


function CoProfile({ onLogout, currentView, onViewChange }) {
    useCoordinatorAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        emailId: '',
        domainMailId: '',
        phoneNumber: '',
        degree: '',
        branch: '',
        department: '',
        staffId: '',
        cabin: '',
    });

    // Initialize profile photo instantly from the URL already cached by the sidebar / auth service.
    // Falls back to extracting from coordinatorData if the separate key doesn't exist yet.
    const [profilePhoto, setProfilePhoto] = useState(() => {
        try {
            const cached = localStorage.getItem('cachedCoordinatorPicUrl');
            if (cached) return cached;
        } catch (_) {}
        try {
            const stored = JSON.parse(localStorage.getItem('coordinatorData') || 'null');
            if (stored) {
                const url = normalizeProfilePhotoUrl(stored);
                if (url) return url;
            }
        } catch (_) {}
        return null;
    });
    const [profilePhotoBase64, setProfilePhotoBase64] = useState('');
    const [photoDetails, setPhotoDetails] = useState({ fileName: null, uploadDate: null });
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState(0);
    const [originalFormData, setOriginalFormData] = useState(null);
    const [originalPhotoValue, setOriginalPhotoValue] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [changedFieldsList, setChangedFieldsList] = useState([]);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavView, setPendingNavView] = useState(null);
    const afterSaveNavRef = useRef(null);

    const getPhotoCompareValue = useCallback((value) => {
        if (!value) return '';
        const raw = value.toString().trim();
        if (!raw) return '';
        if (raw.startsWith('blob:')) return `blob:${raw}`;
        if (raw.startsWith('data:')) return raw.slice(0, 48);
        return raw.toLowerCase();
    }, []);

    const getChangedFields = useCallback((original, current, originalPhoto, currentPhoto) => {
        if (!original || !current) return [];

        const fieldLabels = {
            firstName: 'First Name',
            lastName: 'Last Name',
            dob: 'Date of Birth',
            gender: 'Gender',
            emailId: 'Email ID',
            domainMailId: 'Domain Mail ID',
            phoneNumber: 'Phone Number',
            degree: 'Degree',
            branch: 'Branch',
            department: 'Department',
            staffId: 'Staff ID',
            cabin: 'Cabin'
        };

        const changed = [];

        Object.keys(fieldLabels).forEach((key) => {
            const before = (original[key] || '').toString().trim();
            const after = (current[key] || '').toString().trim();
            if (before !== after) {
                changed.push(fieldLabels[key]);
            }
        });

        if ((originalPhoto || '') !== (currentPhoto || '')) {
            changed.push('Profile Photo');
        }

        return changed;
    }, []);

    // HYPER-FAST: Initialize loading state based on cache availability
    const [isLoading, setIsLoading] = useState(() => {
        try {
            const cachedData = localStorage.getItem('coordinatorData');
            if (cachedData) {
                const data = JSON.parse(cachedData);
                // Check any meaningful field
                if (data.firstName || data.lastName || data.email || data.coordinatorId || data.username) {
                    return false; // Don't show loading if cache exists
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
        return true;
    });

    // Load coordinator data on component mount
    useEffect(() => {
        const loadCoordinatorData = async () => {
            try {
                // INSTANT LOAD: Check cache BEFORE setting loading state
                const cachedData = localStorage.getItem('coordinatorData');
                console.log('ðŸ” Raw cached coordinator data:', cachedData ? 'exists' : 'null');

                if (cachedData) {
                    try {
                        const data = JSON.parse(cachedData);
                        console.log('ðŸ“¦ Parsed coordinator data:', {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            email: data.email,
                            coordinatorId: data.coordinatorId,
                            username: data.username,
                            hasProfilePhoto: !!(data.profilePhoto || data.profilePicURL)
                        });

                        // Check if cache has FULL profile data (not just minimal login data)
                        // Must have firstName OR lastName OR email - not just coordinatorId/username
                        const hasFullProfileData = data.firstName || data.lastName || data.email;
                        // Cache is only considered complete if degree+branch are also present
                        const hasDegreeData = data.degree && data.branch;

                        if (hasFullProfileData && hasDegreeData) {
                            console.log('âœ… Loading coordinator profile from cache - INSTANT');

                            // Set all data from cache immediately
                            setFormData({
                                firstName: data.firstName || '',
                                lastName: data.lastName || '',
                                dob: data.dob || '',
                                gender: data.gender || '',
                                emailId: data.email || data.emailId || '',
                                domainMailId: data.domainEmail || data.domainMailId || '',
                                phoneNumber: data.phone || data.phoneNumber || '',
                                degree: data.degree || '',
                                branch: data.branch || '',
                                department: data.department || '',
                                staffId: data.coordinatorId || data.username || data.staffId || '',
                                cabin: data.cabin || '',
                            });

                            const initialFormData = {
                                firstName: data.firstName || '',
                                lastName: data.lastName || '',
                                dob: data.dob || '',
                                gender: data.gender || '',
                                emailId: data.email || data.emailId || '',
                                domainMailId: data.domainEmail || data.domainMailId || '',
                                phoneNumber: data.phone || data.phoneNumber || '',
                                degree: data.degree || '',
                                branch: data.branch || '',
                                department: data.department || '',
                                staffId: data.coordinatorId || data.username || data.staffId || '',
                                cabin: data.cabin || '',
                            };
                            setOriginalFormData(initialFormData);

                            // Profile photo: prefer the pre-resolved URL cached by the sidebar,
                            // then fall back to extracting from coordinatorData.
                            const cachedPicUrl = localStorage.getItem('cachedCoordinatorPicUrl');
                            const photoUrl = cachedPicUrl || normalizeProfilePhotoUrl(data);
                            if (photoUrl) {
                                console.log('ðŸ–¼ï¸ Profile photo from cache:', photoUrl.substring(0, 60));
                                setProfilePhoto(photoUrl);
                                // Only set base64 for data: URLs; leave File objects untouched
                                if (!photoUrl.startsWith('blob:')) setProfilePhotoBase64(photoUrl);
                                // Ensure the separate key is populated for next time
                                if (!cachedPicUrl) localStorage.setItem('cachedCoordinatorPicUrl', photoUrl);
                            }
                            setOriginalPhotoValue(getPhotoCompareValue(photoUrl || ''));

                            console.log('âœ… Coordinator profile loaded instantly from cache');
                            setIsLoading(false);
                            return; // Don't fetch from server - cache is fresh
                        } else {
                            // Cache is incomplete (missing degree/branch or only minimal data)
                            // Pre-fill whatever is available while we fetch full data from server
                            console.log('âš ï¸ Cache incomplete (missing degree/branch), fetching from server...');
                            const staffIdValue = data.coordinatorId || data.username || data.staffId || '';
                            setFormData(prev => ({
                                ...prev,
                                firstName: data.firstName || prev.firstName,
                                lastName: data.lastName || prev.lastName,
                                dob: data.dob || prev.dob,
                                gender: data.gender || prev.gender,
                                emailId: data.email || data.emailId || prev.emailId,
                                domainMailId: data.domainEmail || data.domainMailId || prev.domainMailId,
                                phoneNumber: data.phone || data.phoneNumber || prev.phoneNumber,
                                degree: data.degree || prev.degree,
                                branch: data.branch || prev.branch,
                                department: data.department || prev.department,
                                staffId: staffIdValue || prev.staffId,
                                cabin: data.cabin || prev.cabin,
                            }));
                        }
                    } catch (err) {
                        console.warn('Cache parse error:', err);
                    }
                }

                // Only show loading state if we need to fetch from server
                setIsLoading(true);

                // Get coordinator ID for server fetch
                const coordinatorId = getCoordinatorId();

                if (!coordinatorId) {
                    console.warn('âš ï¸ No coordinator ID found - cannot fetch from server');
                    setIsLoading(false);
                    return;
                }

                // Fetch from server as fallback
                console.log('âš ï¸ No cache found, fetching from server...');
                const response = await mongoDBService.getCoordinatorById(coordinatorId);
                const data = response?.coordinator || response;

                if (data) {
                    console.log('ðŸ“¦ Coordinator Data Received:', {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        hasProfilePhoto: !!data.profilePhoto
                    });

                    // Set form data from server response
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        emailId: data.email || '',
                        domainMailId: data.domainEmail || '',
                        phoneNumber: data.phone || '',
                        degree: data.degree || '',
                        branch: data.branch || '',
                        department: data.department || '',
                        staffId: data.coordinatorId || '',
                        cabin: data.cabin || '',
                    });

                    const initialFormData = {
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        emailId: data.email || '',
                        domainMailId: data.domainEmail || '',
                        phoneNumber: data.phone || '',
                        degree: data.degree || '',
                        branch: data.branch || '',
                        department: data.department || '',
                        staffId: data.coordinatorId || '',
                        cabin: data.cabin || '',
                    };
                    setOriginalFormData(initialFormData);

                    // Load profile photo â€” prefer pre-resolved sidebar cache key
                    const cachedPicUrl = localStorage.getItem('cachedCoordinatorPicUrl');
                    const photoUrl = cachedPicUrl || normalizeProfilePhotoUrl(data);
                    if (photoUrl) {
                        setProfilePhoto(photoUrl);
                        if (!photoUrl.startsWith('blob:')) setProfilePhotoBase64(photoUrl);
                        if (!cachedPicUrl) localStorage.setItem('cachedCoordinatorPicUrl', photoUrl);
                    }
                    setOriginalPhotoValue(getPhotoCompareValue(photoUrl || ''));

                    // Update localStorage cache
                    const cacheData = {
                        ...data,
                        profilePicURL: photoUrl || data.profilePicURL || null,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('coordinatorData', JSON.stringify(cacheData));
                    console.log('âœ… Coordinator profile cached successfully');
                }
            } catch (error) {
                console.error('Error loading coordinator data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCoordinatorData();
    }, [getPhotoCompareValue]);

    useEffect(() => {
        if (!originalFormData) return;

        const currentPhotoValue = getPhotoCompareValue(profilePhoto || '');
        const changed = getChangedFields(originalFormData, formData, originalPhotoValue, currentPhotoValue);
        setChangedFieldsList(changed);
        setHasUnsavedChanges(changed.length > 0);
    }, [formData, profilePhoto, originalFormData, originalPhotoValue, getChangedFields, getPhotoCompareValue]);

    const actionableChangedFields = useMemo(() => {
        if (!originalFormData) return [];
        return getChangedFields(
            originalFormData,
            formData,
            originalPhotoValue,
            getPhotoCompareValue(profilePhoto || '')
        );
    }, [originalFormData, formData, originalPhotoValue, profilePhoto, getChangedFields, getPhotoCompareValue]);

    const hasActionableChanges = actionableChangedFields.length > 0;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload a JPG, PNG, or WebP file.');
            return;
        }

        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 500 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }

        try {
            const imageUrl = URL.createObjectURL(file);
            setImageToCrop(imageUrl);
            setIsCropModalOpen(true);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleImageClick = () => {
        if (profilePhoto) {
            setIsModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleCropComplete = (croppedFile) => {
        const previewUrl = URL.createObjectURL(croppedFile);
        setProfilePhoto(previewUrl);
        setProfilePhotoBase64(croppedFile);
        setPhotoDetails({
            fileName: croppedFile.name,
            uploadDate: new Date().toLocaleDateString('en-GB'),
        });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
        setIsCropModalOpen(false);
        if (imageToCrop && imageToCrop.startsWith('blob:')) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
    };

    const handleCropModalClose = () => {
        setIsCropModalOpen(false);
        if (imageToCrop && imageToCrop.startsWith('blob:')) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
    };

    const handleCropDiscard = () => {
        setIsCropModalOpen(false);
        if (imageToCrop && imageToCrop.startsWith('blob:')) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleRemovePhoto = (e) => {
        e.preventDefault();
        setProfilePhoto(null);
        setProfilePhotoBase64('');
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false);
        setIsCropModalOpen(false);
        setImageToCrop(null);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        setUploadSuccess(false);
    };

    const handleDiscard = async () => {
        try {
            const coordinatorId = getCoordinatorId();
            if (!coordinatorId) {
                // Just reset form if no ID
                setFormData({
                    firstName: '', lastName: '', dob: '', gender: '', emailId: '',
                    domainMailId: '', phoneNumber: '', degree: '', branch: '', department: '', staffId: '', cabin: '',
                });
                setProfilePhoto(null);
                setProfilePhotoBase64('');
                setPhotoDetails({ fileName: null, uploadDate: null });
                setIsModalOpen(false);
                setSaveStatus('discarded');
                return;
            }

            // Reload from server
            const response = await mongoDBService.getCoordinatorById(coordinatorId);
            const data = response?.coordinator || response;

            if (data) {
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    emailId: data.email || '',
                    domainMailId: data.domainEmail || '',
                    phoneNumber: data.phone || '',
                    degree: data.degree || '',
                    branch: data.branch || '',
                    department: data.department || '',
                    staffId: data.coordinatorId || '',
                    cabin: data.cabin || '',
                });

                if (data.profilePhoto) {
                    setProfilePhoto(data.profilePhoto);
                    setProfilePhotoBase64(data.profilePhoto);
                } else {
                    setProfilePhoto(null);
                    setProfilePhotoBase64('');
                }

                const resetFormData = {
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    emailId: data.email || '',
                    domainMailId: data.domainEmail || '',
                    phoneNumber: data.phone || '',
                    degree: data.degree || '',
                    branch: data.branch || '',
                    department: data.department || '',
                    staffId: data.coordinatorId || '',
                    cabin: data.cabin || '',
                };
                setOriginalFormData(resetFormData);
                setOriginalPhotoValue(getPhotoCompareValue(data.profilePhoto || ''));
                setChangedFieldsList([]);
                setHasUnsavedChanges(false);
            }

            setIsModalOpen(false);
            setSaveStatus('discarded');
        } catch (error) {
            console.error('Error reloading coordinator data:', error);
            alert('Failed to discard changes. Please try again.');
        }
    };

    const handleSave = async () => {
        if (isSaving || !hasActionableChanges) return false;

        try {
            setIsSaving(true);
            setSaveStatus(null);

            const coordinatorId = getCoordinatorId();
            if (!coordinatorId) {
                alert('No coordinator ID found. Please log in again.');
                setIsSaving(false);
                return;
            }

            // Prepare data to save
            const dataToSave = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                fullName: `${formData.firstName} ${formData.lastName}`.trim(),
                dob: formData.dob,
                gender: formData.gender,
                email: formData.emailId,
                domainEmail: formData.domainMailId,
                phone: formData.phoneNumber,
                degree: formData.degree,
                branch: formData.branch,
                department: formData.department,
                cabin: formData.cabin,
            };

            // Upload profile photo to GridFS if a new file was selected
            if (profilePhotoBase64 instanceof File) {
                const result = await gridfsService.uploadProfileImage(profilePhotoBase64, coordinatorId, 'coordinator');
                dataToSave.profilePhoto = result.url;
                dataToSave.profilePicURL = result.url;
            }

            console.log('ðŸ“¤ Saving coordinator profile:', coordinatorId);

            // Save to database
            const result = await mongoDBService.updateCoordinator(coordinatorId, dataToSave);

            if (result.success || result.coordinator) {
                setSaveStatus('saved');
                const resolvedPhotoUrl = dataToSave.profilePicURL || dataToSave.profilePhoto || profilePhoto || null;

                // Show success popup immediately after successful backend save.
                setOriginalFormData({ ...formData });
                setOriginalPhotoValue(getPhotoCompareValue(resolvedPhotoUrl || ''));
                setChangedFieldsList([]);
                setHasUnsavedChanges(false);
                setIsSuccessPopupOpen(true);

                // Non-blocking UI sync work (cache + sidebar event) after popup trigger.
                setTimeout(() => {
                    try {
                        const existingData = JSON.parse(localStorage.getItem('coordinatorData') || '{}');
                        const updatedCacheData = {
                            ...existingData,
                            ...dataToSave,
                            coordinatorId: coordinatorId,
                            profilePicURL: resolvedPhotoUrl,
                            timestamp: Date.now()
                        };
                        localStorage.setItem('coordinatorData', JSON.stringify(updatedCacheData));
                        if (resolvedPhotoUrl) localStorage.setItem('cachedCoordinatorPicUrl', resolvedPhotoUrl);

                        const updatedProfileData = {
                            coordinatorId: coordinatorId,
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            profilePhoto: dataToSave.profilePhoto || dataToSave.profilePicURL,
                            profilePicURL: dataToSave.profilePicURL || dataToSave.profilePhoto,
                            email: formData.emailId
                        };

                        window.dispatchEvent(new CustomEvent('coordinatorProfileUpdated', {
                            detail: updatedProfileData
                        }));
                        console.log('âœ… Coordinator profile cache and sidebar sync updated after save');
                    } catch (syncError) {
                        console.error('Cache sync error after save:', syncError);
                    }
                }, 0);

                return true;
            } else {
                setSaveStatus('error');
                alert(result.message || 'Failed to save profile. Please try again.');
                return false;
            }
        } catch (error) {
            console.error('Error saving coordinator profile:', error);
            setSaveStatus('error');
            alert('Error saving profile. Please check your connection and try again.');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleClosePopup = () => {
        setIsSuccessPopupOpen(false);
        if (afterSaveNavRef.current) {
            const targetView = afterSaveNavRef.current;
            afterSaveNavRef.current = null;
            onViewChange(targetView);
        }
    };

    const closeFileSizeErrorPopup = () => {
        setIsFileSizeErrorOpen(false);
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleViewChange = (view) => {
        if (isSaving) return;

        if (hasUnsavedChanges) {
            setPendingNavView(view);
            setShowUnsavedModal(true);
            return;
        }

        onViewChange(view);
    };

    // Constructing classNames using the styles object
    const photoClassNames = `${styles['co-profile-photo-preview']} ${profilePhoto ? `${styles['co-profile-photo-clickable']} ${styles['co-profile-photo-active']}` : ''}`;

    // Show loading state only if no cache
    if (isLoading) {
        return (
            <>
                <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
                <div className={styles['co-profile-layout']}>
                    <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="profile" onViewChange={handleViewChange} />
                    <div className={styles['co-profile-main-content']}>
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
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            {isSaving && <div className={styles['co-profile-saving-overlay']} />}
            <div className={`${styles['co-profile-layout']} ${isSaving ? styles['co-profile-saving'] : ''}`}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="profile" onViewChange={handleViewChange} />
                <div className={styles['co-profile-main-content']}>

                    <div className={styles['co-profile-card']}>
                        <h3 className={styles['co-profile-section-header']}>Personal Information</h3>

                        <div className={styles['co-profile-content-grid']}>
                            <div className={styles['co-profile-input-grid']}>
                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-firstName">First Name</label>
                                    <input id="co-profile-firstName" type="text" name="firstName" placeholder="Enter First Name" className={styles['co-profile-form-input']} value={formData.firstName} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-lastName">Last Name</label>
                                    <input id="co-profile-lastName" type="text" name="lastName" placeholder="Enter Last Name" className={styles['co-profile-form-input']} value={formData.lastName} onChange={handleInputChange} disabled={isSaving} />
                                </div>

                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-dob">Date of Birth</label>
                                    <div className={styles['co-profile-date-wrapper']}>
                                        <DatePicker
                                            id="co-profile-dob"
                                            selected={formData.dob ? new Date(formData.dob) : null}
                                            onChange={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    dob: date ? date.toISOString().split('T')[0] : '',
                                                }))
                                            }
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="Enter Date of Birth"
                                            className={styles['co-profile-date-input']}
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            yearDropdownItemNumber={7}
                                            scrollableYearDropdown
                                            popperClassName={styles['co-profile-date-popper']}
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>
                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-gender">Gender</label>
                                    <select id="co-profile-gender" name="gender" className={`${styles['co-profile-form-input']} ${styles['co-profile-form-select']}`} value={formData.gender} onChange={handleInputChange} disabled={isSaving}>
                                        <option value="" disabled hidden>Enter Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-emailId">Email ID</label>
                                    <input id="co-profile-emailId" type="email" name="emailId" placeholder="Enter Email ID" className={styles['co-profile-form-input']} value={formData.emailId} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-domainMailId">Domain Mail ID</label>
                                    <input id="co-profile-domainMailId" type="email" name="domainMailId" placeholder="Enter Domain Mail ID" className={styles['co-profile-form-input']} value={formData.domainMailId} onChange={handleInputChange} disabled={isSaving} />
                                </div>

                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-phoneNumber">Phone Number</label>
                                    <input id="co-profile-phoneNumber" type="tel" name="phoneNumber" placeholder="Enter Phone Number" className={styles['co-profile-form-input']} value={formData.phoneNumber} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-degree">Degree</label>
                                    <input id="co-profile-degree" type="text" name="degree" placeholder="Enter Degree" className={styles['co-profile-form-input']} value={formData.degree} onChange={handleInputChange} disabled={isSaving} />
                                </div>

                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-branch">Branch</label>
                                    <input id="co-profile-branch" type="text" name="branch" placeholder="Enter Branch" className={styles['co-profile-form-input']} value={formData.branch} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                                <div className={styles['co-profile-field-group']}>
                                    <label className={styles['co-profile-field-label']} htmlFor="co-profile-department">Department</label>
                                    <input id="co-profile-department" type="text" name="department" placeholder="Enter Department" className={styles['co-profile-form-input']} value={formData.department} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                            </div>

                            <aside className={styles['co-profile-photo-card']}>
                                <h3 className={`${styles['co-profile-section-header']} ${styles['co-profile-photo-header']}`}>Profile Photo</h3>
                                <div className={styles['co-profile-photo-header-line']}>
                                    <div className={styles['co-profile-photo-icon-container']}>
                                        {profilePhoto ? (
                                            <img
                                                src={profilePhoto}
                                                alt="Profile Preview"
                                                className={photoClassNames}
                                                onClick={handleImageClick}
                                            />
                                        ) : (
                                            <img src={ProfileGraduationcap} alt="Graduation Cap" style={{ width: '100px', height: '90px'}}/>
                                        )}
                                    </div>
                                </div>
                                <div className={styles['co-profile-upload-action-area']}>
                                    <div className={styles['co-profile-upload-btn-wrapper']}>
                                        <label htmlFor="file-upload" className={`${styles['co-profile-profile-upload-btn']} ${isSaving ? styles['co-profile-disabled'] : ''}`}>
                                            <div className={styles['co-profile-upload-btn-content']}><MdUpload /><span>Upload (Max 500 KB)</span></div>
                                        </label>
                                        {profilePhoto && (
                                            <button onClick={handleRemovePhoto} className={styles['co-profile-remove-image-btn']} aria-label="Remove image" disabled={isSaving}><IoMdClose /></button>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"

                                        className={styles['co-profile-hidden-input']}
                                        onChange={handlePhotoUpload}
                                        disabled={isSaving}
                                    />
                                    <p className={styles['co-profile-upload-hint']}>*JPG, PNG, and WebP formats allowed.</p>
                                </div>
                            </aside>
                        </div>
                    </div>

                    <div className={styles['co-profile-card']}>
                        <h3 className={styles['co-profile-section-header']}>Office Details</h3>
                        <div className={`${styles['co-profile-input-grid']} ${styles['co-profile-input-grid-two-col']}`}>
                            <div className={styles['co-profile-field-group']}>
                                <label className={styles['co-profile-field-label']} htmlFor="co-profile-staffId">Staff ID</label>
                                <input id="co-profile-staffId" type="text" name="staffId" placeholder="Enter Staff ID" className={styles['co-profile-form-input']} value={formData.staffId} onChange={handleInputChange} disabled />
                            </div>
                            <div className={styles['co-profile-field-group']}>
                                <label className={styles['co-profile-field-label']} htmlFor="co-profile-cabin">Cabin</label>
                                <input id="co-profile-cabin" type="text" name="cabin" placeholder="Enter Cabin" className={styles['co-profile-form-input']} value={formData.cabin} onChange={handleInputChange} disabled={isSaving} />
                            </div>
                        </div>
                    </div>

                    <div className={styles['co-profile-action-buttons']}>
                        <button type="button" className={styles['co-profile-discard-btn']} onClick={handleDiscard} disabled={isSaving || !hasActionableChanges}>
                            Discard
                        </button>
                        <button type="button" className={styles['co-profile-save-btn']} onClick={handleSave} disabled={isSaving || !hasActionableChanges}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>

                </div>
            </div>

            {isModalOpen && profilePhoto && (
                <ImagePreviewModal src={profilePhoto} isOpen={isModalOpen} onClose={handleModalClose} />
            )}

            <CropImageModal
                isOpen={isCropModalOpen}
                imageSrc={imageToCrop}
                onCrop={handleCropComplete}
                onClose={handleCropModalClose}
                onDiscard={handleCropDiscard}
            />

            <SuccessPopup isOpen={isSuccessPopupOpen} onClose={handleClosePopup} />
            <CoordinatorUnsavedChangesAlert
                isOpen={showUnsavedModal}
                onClose={() => {
                    setShowUnsavedModal(false);
                    setPendingNavView(null);
                }}
                onSave={async () => {
                    const targetView = pendingNavView;
                    setShowUnsavedModal(false);
                    setPendingNavView(null);
                    if (targetView) {
                        afterSaveNavRef.current = targetView;
                    }
                    const saved = await handleSave();
                    if (!saved) {
                        afterSaveNavRef.current = null;
                    }
                }}
                onDiscard={() => {
                    setShowUnsavedModal(false);
                    if (pendingNavView) {
                        const targetView = pendingNavView;
                        setPendingNavView(null);
                        onViewChange(targetView);
                    }
                }}
                changedFields={changedFieldsList}
                isSaving={isSaving}
            />
            <FileSizeErrorPopup isOpen={isFileSizeErrorOpen} onClose={closeFileSizeErrorPopup} fileSizeKB={fileSizeErrorKB} />
        </>
    );
}

export default CoProfile;