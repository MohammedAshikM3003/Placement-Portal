import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useAdminAuth from '../utils/useAdminAuth';

import Navbar from "../components/Navbar/Adnavbar.js";
import Sidebar from "../components/Sidebar/Adsidebar.js";
import styles from './AdminCompanyDriveAD.module.css';
import mongoDBService from '../services/mongoDBService';
import Adminicon from "../assets/Adminicon.png";

// Define the initial state for the form
const initialFormData = {
    companyName: '',
    mode: '',
    jobRole: '',
    branch: '',
    eligibleBranches: [],
    rounds: 0, 
    cgpa: '',
    startingDate: null,
    endingDate: null,
    domain: '',
    hrName: '',
    hrContact: '',
    status: '',
    visitDate: '',
    package: '',
    location: '',
    bondPeriod: '',
    roundDetails: [] 
};

// --- Success Popup Component ---
const DriveAddedPopup = ({ onClose, mode = 'create' }) => {
    const isUpdate = mode === 'update';
    return (
        <div className={styles['Admin-Drive-AD-Success-overlay']} onClick={onClose}>
            <div className={styles['Admin-Drive-AD-Success-container']} onClick={(e) => e.stopPropagation()}>
                <div className={styles['Admin-Drive-AD-Success-header']}>
                    {isUpdate ? 'Updated !' : 'Added !'}
                </div>
                <div className={styles['Admin-Drive-AD-Success-content']}>
                    <div className={styles['Admin-Drive-AD-Success-icon-wrapper']}>
                        <svg className={styles['Admin-Drive-AD-Success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className={styles['Admin-Drive-AD-Success-icon-circle']} cx="26" cy="26" r="25" fill="none"/>
                            <path className={styles['Admin-Drive-AD-Success-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                    <h3 className={styles['Admin-Drive-AD-Success-title']}>
                        {isUpdate ? 'Drive Updated ✓' : 'Drive Added ✓'}
                    </h3>
                    <p className={styles['Admin-Drive-AD-Success-text']}>
                        {isUpdate
                            ? 'Drive details have been successfully updated in the portal'
                            : 'New drive has been successfully added in the portal'}
                    </p>
                </div>
                <div className={styles['Admin-Drive-AD-Success-footer']}>
                    <button className={styles['Admin-Drive-AD-Success-close-btn']} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

function Adcompanydrivead({ onLogout }) {
    useAdminAuth(); // JWT authentication verification
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMode, setSuccessMode] = useState('create');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [editingDriveId, setEditingDriveId] = useState(null);
    const [editingDrive, setEditingDrive] = useState(null);
    const [showDepartmentPopup, setShowDepartmentPopup] = useState(false);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [validationWarnings, setValidationWarnings] = useState({});
    const navigate = useNavigate();
    const location = useLocation();

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return null;
        const dateObj = new Date(dateValue);
        if (Number.isNaN(dateObj.getTime())) {
            return null;
        }
        return dateObj;
    };

    const mapDriveToForm = (drive = {}) => {
        const roundsFromData = typeof drive.rounds === 'number'
            ? drive.rounds
            : typeof drive.round === 'number'
                ? drive.round
                : Array.isArray(drive.roundDetails)
                    ? drive.roundDetails.length
                    : 0;

        const roundDetails = Array.isArray(drive.roundDetails)
            ? drive.roundDetails
            : new Array(roundsFromData).fill('');

        return {
            ...initialFormData,
            companyName: drive.companyName || '',
            mode: drive.mode || '',
            jobRole: drive.jobRole || '',
            branch: drive.branch || drive.department || '',
            eligibleBranches: Array.isArray(drive.eligibleBranches) && drive.eligibleBranches.length
                ? drive.eligibleBranches
                : drive.branch
                    ? [drive.branch]
                    : drive.department
                        ? [drive.department]
                        : [],
            rounds: roundsFromData,
            cgpa: drive.cgpa || '',
            startingDate: formatDateForInput(drive.startingDate),
            endingDate: formatDateForInput(drive.endingDate),
            domain: drive.domain || '',
            hrName: drive.hrName || '',
            hrContact: drive.hrContact || '',
            status: drive.status || '',
            visitDate: formatDateForInput(drive.visitDate),
            package: drive.package || '',
            location: drive.location || '',
            bondPeriod: drive.bondPeriod || '',
            roundDetails
        };
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const data = await mongoDBService.getCompanies();
                setCompanies(data || []);
            } catch (error) {
                console.error('Error fetching companies:', error);
            }

            try {
                const branchList = await mongoDBService.getBranches();
                const activeBranches = Array.isArray(branchList)
                    ? branchList.filter(branch => branch?.isActive !== false)
                    : [];
                setBranches(activeBranches);
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (location.state?.viewMode && location.state?.editingDrive) {
            // View-only mode
            setViewMode(true);
            setIsEditing(false);
            const formState = mapDriveToForm(location.state.editingDrive);
            setFormData(formState);
            setSelectedDepartments(formState.eligibleBranches || []);
        } else if (location.state?.editingDrive && location.state?.editingDriveId) {
            // Edit mode
            setViewMode(false);
            setIsEditing(true);
            setEditingDriveId(location.state.editingDriveId);
            setEditingDrive(location.state.editingDrive);
            const formState = mapDriveToForm(location.state.editingDrive);
            setFormData(formState);
            setSelectedDepartments(formState.eligibleBranches || []);
        } else {
            // Create new mode
            setViewMode(false);
            setIsEditing(false);
            setEditingDriveId(null);
            setEditingDrive(null);
            setFormData(initialFormData);
            setSelectedDepartments([]);
        }
    }, [location.state]);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Clear validation warning for this field when user starts typing
        if (validationWarnings[name]) {
            setValidationWarnings(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }

        if (name === 'companyName') {
            const selectedCompany = companies.find(company => company.companyName === value);
            if (selectedCompany) {
                const numRounds = selectedCompany.round || selectedCompany.rounds || 0;
                const roundDetailsArray = new Array(numRounds).fill('');
                
                setFormData(prev => ({
                    ...initialFormData, // Reset form to clear old data
                    companyName: selectedCompany.companyName || '',
                    domain: selectedCompany.domain || '',
                    jobRole: selectedCompany.jobRole || '',
                    mode: selectedCompany.mode || '',
                    hrName: selectedCompany.hrName || '',
                    hrContact: selectedCompany.hrContact || '',
                    bondPeriod: selectedCompany.bondPeriod || '',
                    rounds: numRounds,
                    roundDetails: roundDetailsArray,
                    eligibleBranches: selectedCompany.eligibleBranches || [],
                    cgpa: selectedCompany.cgpa || '',
                    status: selectedCompany.status || '',
                    visitDate: selectedCompany.visitDate ? (() => {
                        const date = new Date(selectedCompany.visitDate);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}-${month}-${year}`;
                    })() : '',
                    package: selectedCompany.package || '',
                    location: selectedCompany.location || '',
                    companyId: selectedCompany._id || selectedCompany.id // Store ID for reference
                }));
            } else {
                // If 'Select Company' is chosen, reset the form
                setFormData(prev => ({
                    ...initialFormData,
                    companyName: '',
                    branch: '',
                    companyId: undefined
                }));
            }
        } else if (name === 'rounds') {
            const numRounds = Math.max(0, parseInt(value) || 0); 
            setFormData(prev => {
                const existingDetails = prev.roundDetails;
                const newDetails = new Array(numRounds).fill('');
                for (let i = 0; i < Math.min(existingDetails.length, numRounds); i++) {
                    newDetails[i] = existingDetails[i];
                }
                return { ...prev, rounds: numRounds, roundDetails: newDetails };
            });
        } else if (name === 'branch') {
            setFormData(prev => {
                const cleanedEligible = prev.eligibleBranches.filter(branchValue => branchValue && branchValue !== '');
                const nextEligible = value
                    ? Array.from(new Set([...cleanedEligible, value]))
                    : cleanedEligible.filter(branchValue => branchValue !== prev.branch);
                return {
                    ...prev,
                    branch: value,
                    eligibleBranches: nextEligible
                };
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEligibleBranchesChange = (event) => {
        const { options } = event.target;
        const selectedValues = [];
        for (let i = 0; i < options.length; i += 1) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }
        const uniqueSelected = Array.from(new Set(selectedValues.filter(Boolean)));
        setFormData(prev => ({ ...prev, eligibleBranches: uniqueSelected }));
    };

    const handleRoundInputChange = (index, value) => {
        setFormData(prev => {
            const newRoundDetails = [...prev.roundDetails];
            newRoundDetails[index] = value;
            return { ...prev, roundDetails: newRoundDetails };
        });
    };

    const handleDiscard = () => {
        navigate('/admin-company-drive');
    };

    const handleDepartmentToggle = (deptValue) => {
        setSelectedDepartments(prev => {
            if (prev.includes(deptValue)) {
                return prev.filter(d => d !== deptValue);
            } else {
                return [...prev, deptValue];
            }
        });
    };

    const handleDepartmentSelect = () => {
        setFormData(prev => ({
            ...prev,
            eligibleBranches: selectedDepartments
        }));
        setShowDepartmentPopup(false);
    };

    const handleDepartmentClose = () => {
        setSelectedDepartments(formData.eligibleBranches || []);
        setShowDepartmentPopup(false);
    };

    const handleAddDrive = async () => {
        // Reset validation warnings
        const warnings = {};
        
        // Validate required fields and collect warnings
        if (!formData.companyName) {
            warnings.companyName = 'Please fill out this field.';
        }
        if (!formData.mode) {
            warnings.mode = 'Please fill out this field.';
        }
        if (!formData.jobRole) {
            warnings.jobRole = 'Please fill out this field.';
        }
        if (!formData.eligibleBranches || formData.eligibleBranches.length === 0) {
            warnings.eligibleBranches = 'Please fill out this field.';
        }
        if (!formData.rounds || formData.rounds === 0) {
            warnings.rounds = 'Please fill out this field.';
        }
        if (!formData.cgpa) {
            warnings.cgpa = 'Please fill out this field.';
        }
        if (!formData.startingDate) {
            warnings.startingDate = 'Please fill out this field.';
        }
        if (!formData.endingDate) {
            warnings.endingDate = 'Please fill out this field.';
        }
        
        // Validate all round details are filled
        const emptyRounds = formData.roundDetails.filter((round, index) => !round || round.trim() === '');
        if (emptyRounds.length > 0) {
            warnings.roundDetails = 'Please fill all round details';
        }

        // If there are any warnings, show them and return
        if (Object.keys(warnings).length > 0) {
            setValidationWarnings(warnings);
            return;
        }
        
        // Clear warnings if validation passes
        setValidationWarnings({});

        setIsLoading(true);
        try {
            const normalizedEligible = formData.eligibleBranches && formData.eligibleBranches.length
                ? Array.from(new Set(formData.eligibleBranches.filter(Boolean)))
                : formData.branch
                    ? [formData.branch]
                    : [];

            // Format dates to simple YYYY-MM-DD string
            const formatDateForSubmit = (date) => {
                if (!date) return '';
                if (date instanceof Date && !isNaN(date.getTime())) {
                    // Format as YYYY-MM-DD using local timezone to avoid UTC conversion
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const formatted = `${year}-${month}-${day}`;
                    console.log('formatDateForSubmit - Input date:', date, 'Formatted:', formatted);
                    return formatted;
                }
                return '';
            };

            const payload = {
                ...formData,
                department: formData.branch,
                eligibleBranches: normalizedEligible,
                startingDate: formatDateForSubmit(formData.startingDate),
                endingDate: formatDateForSubmit(formData.endingDate),
            };

            console.log('Payload to be sent:', JSON.stringify(payload, null, 2));
            console.log('Starting Date payload:', payload.startingDate);
            console.log('Ending Date payload:', payload.endingDate);

            if (isEditing && editingDriveId) {
                await mongoDBService.updateCompanyDrive(editingDriveId, payload);
                setSuccessMode('update');
            } else {
                await mongoDBService.createCompanyDrive(payload);
                setSuccessMode('create');
            }
            setShowSuccessPopup(true);
        } catch (error) {
            console.error('Error adding drive:', error);
            // Optionally, show an error popup to the user
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessPopup(false);
        navigate('/admin-company-drive');
    };

    return (
        <>
            <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} onLogout={onLogout} />
            <div className={styles['Admin-Drive-AD-layout']}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
                <div className={styles['Admin-Drive-AD-main-content']}>
                    <div className={styles['Admin-Drive-AD-container']}>
                        
                        {/* Left Section - Add Company Drive */}
                        <div className={styles['Admin-Drive-AD-left-section']}>
                            <div className={styles['Admin-Drive-AD-header-section']}>
                                <h2 className={styles['Admin-Drive-AD-section-title']}>
                                    {isEditing ? 'Edit Company Drive' : 'Add Company Drive'}
                                </h2>
                                <button 
                                    className={styles['Admin-Drive-AD-back-button']}
                                    onClick={() => navigate('/admin-company-drive')}
                                    type="button"
                                >
                                    ← Back To Company Drive
                                </button>
                            </div>
                            
                            <div className={styles['Admin-Drive-AD-form-grid']}>
                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <select
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className={styles['Admin-Drive-AD-input']}
                                        required
                                        disabled={viewMode}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map((company) => (
                                            <option key={company._id || company.id} value={company.companyName}>
                                                {company.companyName}
                                            </option>
                                        ))}
                                    </select>
                                    {validationWarnings.companyName && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.companyName}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <select
                                        name="mode"
                                        value={formData.mode}
                                        onChange={handleInputChange}
                                        className={styles['Admin-Drive-AD-input']}
                                        required
                                        disabled={viewMode}
                                    >
                                        <option value="">Mode :</option>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                    {validationWarnings.mode && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.mode}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="text"
                                        name="jobRole"
                                        value={formData.jobRole}
                                        onChange={handleInputChange}
                                        placeholder="Job Role :"
                                        className={styles['Admin-Drive-AD-input']}
                                        required                                        readOnly={viewMode}
                                        disabled={viewMode}                                        readOnly={viewMode}
                                        disabled={viewMode}
                                    />
                                    {validationWarnings.jobRole && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.jobRole}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']} style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowDepartmentPopup(true)}
                                        className={styles['Admin-Drive-AD-input']}
                                        style={{ textAlign: 'left', cursor: viewMode ? 'default' : 'pointer', paddingRight: '45px' }}
                                        disabled={viewMode}
                                    >
                                        {formData.eligibleBranches && formData.eligibleBranches.length > 0
                                            ? `${formData.eligibleBranches.length} Department${formData.eligibleBranches.length > 1 ? 's' : ''} Selected`
                                            : 'Select Departments'}
                                    </button>
                                    {validationWarnings.eligibleBranches && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']} style={{ right: '45px' }}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.eligibleBranches}
                                            </div>
                                        </>
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '28px',
                                        height: '28px',
                                        backgroundColor: '#4EA24E',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        pointerEvents: 'none'
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="number"
                                        name="rounds"
                                        value={formData.rounds}
                                        onChange={handleInputChange}
                                        placeholder="Rounds :"
                                        className={styles['Admin-Drive-AD-input']}
                                        min="0"
                                        required
                                    />
                                    {validationWarnings.rounds && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.rounds}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="text"
                                        name="cgpa"
                                        value={formData.cgpa}
                                        onChange={handleInputChange}
                                        placeholder="CGPA :"
                                        className={styles['Admin-Drive-AD-input']}
                                        required
                                        readOnly={viewMode}
                                        disabled={viewMode}
                                    />
                                    {validationWarnings.cgpa && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.cgpa}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <div className={styles['Admin-Drive-AD-datepicker-wrapper']}>
                                        <DatePicker
                                            selected={formData.startingDate}
                                            onChange={(date) => {
                                                setFormData(prev => ({ ...prev, startingDate: date }));
                                                if (validationWarnings.startingDate) {
                                                    setValidationWarnings(prev => {
                                                        const updated = { ...prev };
                                                        delete updated.startingDate;
                                                        return updated;
                                                    });
                                                }
                                            }}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="Start Date"
                                            className={styles['Admin-Drive-AD-input']}
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            yearDropdownItemNumber={7}
                                            scrollableYearDropdown
                                            minDate={new Date(new Date().getFullYear() - 1, 0, 1)}
                                            maxDate={new Date(new Date().getFullYear() + 5, 11, 31)}
                                            required
                                            disabled={viewMode}
                                            readOnly={viewMode}
                                        />
                                    </div>
                                    {validationWarnings.startingDate && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.startingDate}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <div className={styles['Admin-Drive-AD-datepicker-wrapper']}>
                                        <DatePicker
                                            selected={formData.endingDate}
                                            onChange={(date) => {
                                                setFormData(prev => ({ ...prev, endingDate: date }));
                                                if (validationWarnings.endingDate) {
                                                    setValidationWarnings(prev => {
                                                        const updated = { ...prev };
                                                        delete updated.endingDate;
                                                        return updated;
                                                    });
                                                }
                                            }}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="End Date"
                                            className={styles['Admin-Drive-AD-input']}
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            yearDropdownItemNumber={7}
                                            scrollableYearDropdown
                                            minDate={new Date(new Date().getFullYear() - 1, 0, 1)}
                                            maxDate={new Date(new Date().getFullYear() + 5, 11, 31)}
                                            required
                                            disabled={viewMode}
                                            readOnly={viewMode}
                                        />
                                    </div>
                                    {validationWarnings.endingDate && (
                                        <>
                                            <span className={styles['Admin-Drive-AD-warning-icon']}>!</span>
                                            <div className={styles['Admin-Drive-AD-warning-tooltip']}>
                                                {validationWarnings.endingDate}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={styles['Admin-Drive-AD-round-section']}>
                                <h3 className={styles['Admin-Drive-AD-round-title']}>Round Details</h3>
                                
                                <div className={styles['Admin-Drive-AD-round-grid']}>
                                    {formData.roundDetails.length === 0 && (
                                        <div className={styles['Admin-Drive-AD-round-placeholder']}>
                                            Enter a number in the "Rounds" field to add round details.
                                        </div>
                                    )}

                                    {formData.roundDetails.map((roundValue, index) => (
                                        <div className={styles['Admin-Drive-AD-round-item']} key={index}>
                                            <label>Round {index + 1} :</label>
                                            <input
                                                type="text"
                                                value={roundValue}
                                                onChange={(e) => handleRoundInputChange(index, e.target.value)}
                                                placeholder="Enter Round Name"
                                                className={styles['Admin-Drive-AD-round-input']}
                                                required
                                                readOnly={viewMode}
                                                disabled={viewMode}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!viewMode && (
                                <div className={styles['Admin-Drive-AD-action-buttons']}>
                                    <button 
                                        className={styles['Admin-Drive-AD-add-btn']}
                                        onClick={handleAddDrive}
                                        disabled={isLoading}
                                    >
                                        <svg className={styles['Admin-Drive-AD-btn-icon']} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                        <div className={styles['Admin-Drive-AD-btn-text']}>
                                            <span>{isLoading ? (isEditing ? 'Updating...' : 'Adding...') : isEditing ? 'Update Drive' : 'Add Drive'}</span><br/>
                                            <span className={styles['Admin-Drive-AD-btn-subtitle1']}>
                                                {isEditing ? 'Save changes to the drive' : 'Add drive to the placements'}
                                            </span>
                                        </div>
                                    </button>

                                {!viewMode && (
                                    <>
                                        <button 
                                            className={styles['Admin-Drive-AD-discard-btn']}
                                            onClick={handleDiscard}
                                        >
                                            <svg className={styles['Admin-Drive-AD-btn-icon']} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            <div className={styles['Admin-Drive-AD-btn-text']}>
                                                <span>{isEditing ? 'Reset' : 'Discard'}</span><br/>
                                                <span className={styles['Admin-Drive-AD-btn-subtitle']}>
                                                    {isEditing ? 'Revert to existing details' : 'Cancel changes'}
                                                </span>
                                            </div>
                                        </button>
                                    </>
                                )}
                                </div>
                            )}
                        </div>

                        {/* Right Section - Company Details */}
                        <div className={styles['Admin-Drive-AD-right-section']}>
                            <h2 className={styles['Admin-Drive-AD-section-title']}>Company Details</h2>
                            
                            <div className={styles['Admin-Drive-AD-details-container']}>
                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Company Name</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.companyName || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Domain</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.domain || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Job Role</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.jobRole || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Mode</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.mode || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>HR Name</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.hrName || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>HR Contact</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.hrContact || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Rounds</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.rounds || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Eligible Branches</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>
                                        {formData.eligibleBranches && formData.eligibleBranches.length
                                            ? formData.eligibleBranches.join(', ')
                                            : formData.branch || '—'}
                                    </div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Status</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.status || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Visit Date</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>
                                        {formData.visitDate 
                                            ? (formData.visitDate instanceof Date 
                                                ? formData.visitDate.toLocaleDateString('en-GB') 
                                                : formData.visitDate)
                                            : ''}
                                    </div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Package</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.package || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Location</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.location || ''}</div>
                                </div>

                                <div className={styles['Admin-Drive-AD-detail-row']}>
                                    <label>Bond Period</label>
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.bondPeriod || ''}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {showSuccessPopup && <DriveAddedPopup onClose={handleSuccessClose} mode={successMode} />}
            
            {/* Department Selection Popup */}
            {showDepartmentPopup && (
                <div className={styles['Admin-Drive-AD-dept-popup-overlay']} onClick={handleDepartmentClose}>
                    <div className={styles['Admin-Drive-AD-dept-popup-container']} onClick={(e) => e.stopPropagation()}>
                        <div className={styles['Admin-Drive-AD-dept-popup-header']}>
                            Departments : {selectedDepartments.length}
                        </div>
                        <div className={styles['Admin-Drive-AD-dept-popup-content']}>
                            {branches.map(branch => {
                                const deptValue = branch.branchAbbreviation || branch.branchCode || branch.branchFullName;
                                const deptLabel = branch.branchFullName
                                    ? branch.branchAbbreviation
                                        ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                        : branch.branchFullName
                                    : deptValue;
                                const isSelected = selectedDepartments.includes(deptValue);
                                
                                return (
                                    <div
                                        key={branch.id || deptValue}
                                        className={`${styles['Admin-Drive-AD-dept-item']} ${isSelected ? styles['Admin-Drive-AD-dept-item-selected'] : ''}`}
                                        onClick={() => handleDepartmentToggle(deptValue)}
                                    >
                                        <div className={styles['Admin-Drive-AD-dept-checkbox']}>
                                            {isSelected && (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M3 8L6.5 11.5L13 5" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </div>
                                        <span className={styles['Admin-Drive-AD-dept-label']}>{deptLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles['Admin-Drive-AD-dept-popup-actions']}>
                            <button
                                className={styles['Admin-Drive-AD-dept-btn-close']}
                                onClick={handleDepartmentClose}
                            >
                                Close
                            </button>
                            <button
                                className={styles['Admin-Drive-AD-dept-btn-select']}
                                onClick={handleDepartmentSelect}
                            >
                                Select
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Adcompanydrivead;