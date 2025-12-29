import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    startingDate: '',
    endingDate: '',
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

                    
                    <button className={styles['Admin-Drive-AD-Success-close-btn']} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

function Adcompanydrivead({ onLogout }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMode, setSuccessMode] = useState('create');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingDriveId, setEditingDriveId] = useState(null);
    const [editingDrive, setEditingDrive] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        const dateObj = new Date(dateValue);
        if (Number.isNaN(dateObj.getTime())) {
            return '';
        }
        return dateObj.toISOString().split('T')[0];
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
        if (location.state?.editingDrive && location.state?.editingDriveId) {
            setIsEditing(true);
            setEditingDriveId(location.state.editingDriveId);
            setEditingDrive(location.state.editingDrive);
            setFormData(mapDriveToForm(location.state.editingDrive));
        } else {
            setIsEditing(false);
            setEditingDriveId(null);
            setEditingDrive(null);
            setFormData(initialFormData);
        }
    }, [location.state]);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'companyName') {
            const selectedCompany = companies.find(company => company.companyName === value);
            if (selectedCompany) {
                setFormData(prev => ({
                    ...initialFormData, // Reset form to clear old data
                    companyName: selectedCompany.companyName,
                    domain: selectedCompany.domain,
                    jobRole: selectedCompany.jobRole,
                    mode: selectedCompany.mode,
                    hrName: selectedCompany.hrName,
                    hrContact: selectedCompany.hrContact,
                    bondPeriod: selectedCompany.bondPeriod,
                    rounds: selectedCompany.round,
                    status: selectedCompany.status,
                    visitDate: selectedCompany.visitDate ? new Date(selectedCompany.visitDate).toISOString().split('T')[0] : '',
                    package: selectedCompany.package,
                    location: selectedCompany.location,
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
        if (isEditing && editingDrive) {
            setFormData(mapDriveToForm(editingDrive));
        } else {
            setFormData(initialFormData);
        }
    };

    const handleAddDrive = async () => {
        setIsLoading(true);
        try {
            const normalizedEligible = formData.eligibleBranches && formData.eligibleBranches.length
                ? Array.from(new Set(formData.eligibleBranches.filter(Boolean)))
                : formData.branch
                    ? [formData.branch]
                    : [];

            const payload = {
                ...formData,
                department: formData.branch,
                eligibleBranches: normalizedEligible,
            };

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
                            <h2 className={styles['Admin-Drive-AD-section-title']}>
                                {isEditing ? 'Edit Company Drive' : 'Add Company Drive'}
                            </h2>
                            
                            <div className={styles['Admin-Drive-AD-form-grid']}>
                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <select
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        className={styles['Admin-Drive-AD-input']}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map((company) => (
                                            <option key={company._id || company.id} value={company.companyName}>
                                                {company.companyName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="text"
                                        name="mode"
                                        value={formData.mode}
                                        onChange={handleInputChange}
                                        placeholder="Mode :"
                                        className={styles['Admin-Drive-AD-input']}
                                    />
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="text"
                                        name="jobRole"
                                        value={formData.jobRole}
                                        onChange={handleInputChange}
                                        placeholder="Job Role :"
                                        className={styles['Admin-Drive-AD-input']}
                                    />
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <select
                                        name="branch"
                                        value={formData.branch}
                                        onChange={handleInputChange}
                                        className={styles['Admin-Drive-AD-input']}
                                    >
                                        <option value="">Select Primary Branch</option>
                                        {branches.map(branch => {
                                            const optionValue = branch.branchAbbreviation || branch.branchCode || branch.branchFullName;
                                            const optionLabel = branch.branchFullName
                                                ? branch.branchAbbreviation
                                                    ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                    : branch.branchFullName
                                                : optionValue;

                                            return (
                                                <option key={branch.id || optionValue} value={optionValue}>
                                                    {optionLabel}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <select
                                        multiple
                                        value={formData.eligibleBranches}
                                        onChange={handleEligibleBranchesChange}
                                        className={`${styles['Admin-Drive-AD-input']} ${styles['Admin-Drive-AD-multiselect']}`}
                                    >
                                        {branches.map(branch => {
                                            const optionValue = branch.branchAbbreviation || branch.branchCode || branch.branchFullName;
                                            const optionLabel = branch.branchFullName
                                                ? branch.branchAbbreviation
                                                    ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                    : branch.branchFullName
                                                : optionValue;

                                            return (
                                                <option key={`${branch.id || optionValue}-eligible`} value={optionValue}>
                                                    {optionLabel}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <small className={styles['Admin-Drive-AD-helper-text']}>
                                        Hold Ctrl/⌘ to select multiple branches eligible for this drive.
                                    </small>
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
                                    />
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="text"
                                        name="cgpa"
                                        value={formData.cgpa}
                                        onChange={handleInputChange}
                                        placeholder="CGPA :"
                                        className={styles['Admin-Drive-AD-input']}
                                    />
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="date"
                                        name="startingDate"
                                        value={formData.startingDate}
                                        onChange={handleInputChange}
                                        className={styles['Admin-Drive-AD-input']}
                                    />
                                </div>

                                <div className={styles['Admin-Drive-AD-form-group']}>
                                    <input
                                        type="date"
                                        name="endingDate"
                                        value={formData.endingDate}
                                        onChange={handleInputChange}
                                        className={styles['Admin-Drive-AD-input']}
                                    />
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
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

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
                            </div>
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
                                    <div className={styles['Admin-Drive-AD-detail-value']}>{formData.visitDate || ''}</div>
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
        </>
    );
}

export default Adcompanydrivead;