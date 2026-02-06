import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './Coo_CompanyProfilePopup.module.css';

const parseDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateToISO = (date) => {
    if (!date || Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

function CooCompanyProfilePopup({ isOpen, onClose, onSubmit, editingCompany, viewingCompany }) {
    
    // --- Initial Form State ---
    const getInitialFormData = () => {
        const sourceCompany = viewingCompany || editingCompany;
        if (sourceCompany) {
            return {
                companyName: sourceCompany.companyName || sourceCompany.company || '',
                companyType: sourceCompany.companyType || sourceCompany.domain || '',
                jobRole: sourceCompany.jobRole || '',
                mode: sourceCompany.mode || '',
                hrName: sourceCompany.hrName || '',
                hrContact: sourceCompany.hrContact || '',
                round: sourceCompany.round || '',
                status: sourceCompany.status || '',
                visitDate: sourceCompany.visitDate || '',
                package: sourceCompany.package || '',
                location: sourceCompany.location || '',
                bondPeriod: sourceCompany.bondPeriod || ''
            };
        }
        return {
            companyName: '',
            companyType: '',
            jobRole: '',
            mode: '',
            hrName: '',
            hrContact: '',
            round: '',
            status: '',
            visitDate: '',
            package: '',
            location: '',
            bondPeriod: ''
        };
    };

    const [formData, setFormData] = useState(getInitialFormData());
    
    // --- State for showing the success message ---
    const [showSuccess, setShowSuccess] = useState(false);
    const [successTitle, setSuccessTitle] = useState('Company Added ✔');
    const [successHeader, setSuccessHeader] = useState('Added !');
    const [isProcessing, setIsProcessing] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleVisitDateChange = (date) => {
        setFormData(prevState => ({
            ...prevState,
            visitDate: formatDateToISO(date)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.companyName || !formData.companyType || !formData.jobRole || !formData.hrName) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (formData.round && isNaN(parseInt(formData.round))) {
            alert('Round must be a number');
            return;
        }

        // Prepare the data object
        const submitData = {
            ...formData,
            round: formData.round ? parseInt(formData.round) : ''
        };
        
        setSubmitError('');

        if (editingCompany) {
            setIsProcessing(true);
            Promise.resolve(onSubmit(submitData))
                .then(() => {
                    setIsProcessing(false);
                    handleClose();
                })
                .catch((error) => {
                    setIsProcessing(false);
                    setSubmitError(error?.message || 'Failed to save company. Please try again.');
                });
        } else {
            // IF ADDING, SHOW INTERNAL SUCCESS POPUP
            setSuccessHeader('Added !');
            setSuccessTitle('Company Added ✔');
            setShowSuccess(true);
        }
    };

    // Final Close Action for "Added" success screen
    const handleSuccessClose = () => {
        // Format data
        const submitData = {
            ...formData,
            round: formData.round ? parseInt(formData.round) : ''
        };

        setSubmitError('');
        setIsProcessing(true);
        Promise.resolve(onSubmit(submitData))
            .then(() => {
                setIsProcessing(false);
                handleClose();
            })
            .catch((error) => {
                setIsProcessing(false);
                setSubmitError(error?.message || 'Failed to add company. Please try again.');
            });
    };

    // Standard Close/Cancel
    const handleClose = () => {
        setFormData(getInitialFormData());
        setShowSuccess(false);
        setSubmitError('');
        setIsProcessing(false);
        onClose();
    };

    // Update form data and hide success screen when props change
    useEffect(() => {
        const getFormData = () => {
            const sourceCompany = viewingCompany || editingCompany;
            if (sourceCompany) {
                return {
                    companyName: sourceCompany.companyName || sourceCompany.company || '',
                    companyType: sourceCompany.companyType || sourceCompany.domain || '',
                    jobRole: sourceCompany.jobRole || '',
                    mode: sourceCompany.mode || '',
                    hrName: sourceCompany.hrName || '',
                    hrContact: sourceCompany.hrContact || '',
                    round: sourceCompany.round || '',
                    status: sourceCompany.status || '',
                    visitDate: sourceCompany.visitDate || '',
                    package: sourceCompany.package || '',
                    location: sourceCompany.location || '',
                    bondPeriod: sourceCompany.bondPeriod || ''
                };
            }
            return {
                companyName: '',
                companyType: '',
                jobRole: '',
                mode: '',
                hrName: '',
                hrContact: '',
                round: '',
                status: '',
                visitDate: '',
                package: '',
                location: '',
                bondPeriod: ''
            };
        };

        setFormData(getFormData());
        setShowSuccess(false); 
        setSubmitError('');
        setIsProcessing(false);
    }, [editingCompany, viewingCompany, isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles['Coo-cp-popup-overlay']} onClick={handleClose}>
            <div 
                className={`${styles['Coo-cp-popup-container']} ${showSuccess ? styles['is-success'] : styles['is-form']}`} 
                onClick={(e) => e.stopPropagation()}
            >
                
                {showSuccess ? (
                    /* --- SUCCESS POPUP MARKUP (Only for Adding) --- */
                    <>
                        <div className={styles['Coo-cp-added-popup-header']}>
                            {successHeader}
                        </div>
                        <div className={styles['Coo-cp-added-popup-content']}>
                            <div className={styles['Coo-cp-added-icon-wrapper']}>
                                <svg className={styles['Coo-cp-added-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle className={styles['Coo-cp-added-icon-circle']} cx="26" cy="26" r="25" fill="none"/>
                                    <path className={styles['Coo-cp-added-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                </svg>
                            </div>
                            
                            <h3 className={styles['Coo-cp-added-title']}>{successTitle}</h3>
                            
                            <p className={styles['Coo-cp-added-text']}>
                                The Company has been successfully added in the Portal.
                            </p>
                        </div>
                        <div className={styles['Coo-cp-added-popup-footer']}>
                            <button className={styles['Coo-cp-added-close-btn']} onClick={handleSuccessClose}>
                                Close
                            </button>
                            {submitError && (
                                <p className={styles['Coo-cp-added-error']}>
                                    {submitError}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    /* --- FORM MARKUP --- */
                    <>
                        <div className={styles['Coo-cp-popup-header']}>
                            <h2>{viewingCompany ? 'View Company' : (editingCompany ? 'Edit Company' : 'Add Company')}</h2>
                            <button className={styles['Coo-cp-popup-close-btn']} onClick={handleClose} disabled={isProcessing}>×</button>
                        </div>

                        <form className={styles['Coo-cp-popup-form']} onSubmit={handleSubmit}>
                            <div className={styles['Coo-cp-popup-form-grid']}>
                                {/* Fields... */}
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Company Name *</label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" required disabled={!!viewingCompany} />
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Company Type *</label>
                                    <select name="companyType" value={formData.companyType} onChange={handleChange} required disabled={!!viewingCompany}>
                                        <option value="">Select Company Type</option>
                                        <option value="CORE">CORE</option>
                                        <option value="IT">IT</option>
                                        <option value="ITES(BPO/KPO)">ITES(BPO/KPO)</option>
                                        <option value="Marketing & Sales">Marketing & Sales</option>
                                        <option value="HR / Business analyst">HR / Business analyst</option>
                                    </select>
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Job Role *</label>
                                    <input type="text" name="jobRole" value={formData.jobRole} onChange={handleChange} placeholder="e.g., Junior Developer" required disabled={!!viewingCompany} />
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Mode</label>
                                    <select name="mode" value={formData.mode} onChange={handleChange} disabled={!!viewingCompany}>
                                        <option value="">Select Mode</option>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>HR Name *</label>
                                    <input type="text" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="Enter HR name" required disabled={!!viewingCompany} />
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>HR Contact</label>
                                    <input type="email" name="hrContact" value={formData.hrContact} onChange={handleChange} placeholder="Enter email" disabled={!!viewingCompany} />
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Round</label>
                                    <input type="text" name="round" value={formData.round} onChange={handleChange} placeholder="e.g., 2, 3, 6" disabled={!!viewingCompany} />
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} disabled={!!viewingCompany}>
                                        <option value="">Select Status</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Visit Date</label>
                                    <div className={styles['Coo-cp-popup-date-wrapper']}>
                                        <DatePicker
                                            selected={parseDateValue(formData.visitDate)}
                                            onChange={handleVisitDateChange}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="Select visit date"
                                            className={styles['Coo-cp-popup-date-input']}
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            yearDropdownItemNumber={7}
                                            scrollableYearDropdown
                                            minDate={new Date(new Date().getFullYear() - 1, 0, 1)}
                                            maxDate={new Date(new Date().getFullYear() + 5, 11, 31)}
                                            isClearable
                                            autoComplete="off"
                                            disabled={isProcessing || !!viewingCompany}
                                        />
                                    </div>
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Package</label>
                                    <input type="text" name="package" value={formData.package} onChange={handleChange} placeholder="e.g., 6 LPA" disabled={!!viewingCompany} />
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Chennai" disabled={!!viewingCompany} />
                                </div>
                                <div className={styles['Coo-cp-popup-form-group']}>
                                    <label>Bond Period</label>
                                    <input type="text" name="bondPeriod" value={formData.bondPeriod} onChange={handleChange} placeholder="e.g., 2 Years" disabled={!!viewingCompany} />
                                </div>
                            </div>

                            {viewingCompany ? (
                                <div className={styles['Coo-cp-popup-form-actions']}>
                                    <button type="button" className={styles['Coo-cp-popup-btn-submit']} onClick={handleClose} style={{ width: '100%' }}>
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <div className={styles['Coo-cp-popup-form-actions']}>
                                    <button type="button" className={styles['Coo-cp-popup-btn-cancel']} onClick={handleClose} disabled={isProcessing}>
                                        Cancel
                                    </button>
                                    <button type="submit" className={styles['Coo-cp-popup-btn-submit']} disabled={isProcessing}>
                                        {editingCompany ? 'Update Company' : 'Add Company'}
                                        {isProcessing ? '...' : ''}
                                    </button>
                                    {submitError && (
                                        <p className={styles['Coo-cp-popup-error']}>
                                            {submitError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default CooCompanyProfilePopup;
