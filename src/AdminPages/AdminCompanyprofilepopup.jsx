import React, { useState, useEffect } from 'react';
// FIXED: Import CSS as a Module
import styles from './AdminCompanyprofilepopup.module.css';

function AdminCompanyprofilePopup({ isOpen, onClose, onSubmit, editingCompany }) {
    
    // --- Initial Form State ---
    const getInitialFormData = () => {
        if (editingCompany) {
            return {
                companyName: editingCompany.company,
                domain: editingCompany.domain,
                jobRole: editingCompany.jobRole,
                mode: editingCompany.mode,
                hrName: editingCompany.hrName,
                hrContact: editingCompany.hrContact,
                round: editingCompany.round || '',
                status: editingCompany.status,
                visitDate: editingCompany.visitDate,
                package: editingCompany.package,
                location: editingCompany.location,
                bondPeriod: editingCompany.bondPeriod
            };
        }
        return {
            companyName: '',
            domain: '',
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

    // Update form data and hide success screen when props change
    useEffect(() => {
        setFormData(getInitialFormData());
        setShowSuccess(false); 
        setSubmitError('');
        setIsProcessing(false);
    }, [editingCompany, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.companyName || !formData.domain || !formData.jobRole || !formData.hrName) {
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

    if (!isOpen) return null;

    return (
        // UPDATED CLASS: Admin-cp-popup-overlay
        <div className={styles['Admin-cp-popup-overlay']} onClick={handleClose}>
            <div 
                // UPDATED CLASSES: Admin-cp-popup-container, is-success, is-form
                className={`${styles['Admin-cp-popup-container']} ${showSuccess ? styles['is-success'] : styles['is-form']}`} 
                onClick={(e) => e.stopPropagation()}
            >
                
                {showSuccess ? (
                    /* --- SUCCESS POPUP MARKUP (Only for Adding) --- */
                    <>
                        {/* UPDATED CLASS: Admin-cp-added-popup-header */}
                        <div className={styles['Admin-cp-added-popup-header']}>
                            {successHeader}
                        </div>
                        {/* UPDATED CLASS: Admin-cp-added-popup-content */}
                        <div className={styles['Admin-cp-added-popup-content']}>
                            {/* UPDATED CLASS: Admin-cp-added-icon-wrapper */}
                            <div className={styles['Admin-cp-added-icon-wrapper']}>
                                {/* UPDATED CLASSES for SVG elements */}
                                <svg className={styles['Admin-cp-added-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle className={styles['Admin-cp-added-icon-circle']} cx="26" cy="26" r="25" fill="none"/>
                                    <path className={styles['Admin-cp-added-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                </svg>
                            </div>
                            
                            {/* UPDATED CLASS: Admin-cp-added-title */}
                            <h3 className={styles['Admin-cp-added-title']}>{successTitle}</h3>
                            
                            {/* UPDATED CLASS: Admin-cp-added-text */}
                            <p className={styles['Admin-cp-added-text']}>
                                The Company has been successfully added in the Portal.
                            </p>
                            
                            {/* UPDATED CLASS: Admin-cp-added-close-btn */}
                            <button className={styles['Admin-cp-added-close-btn']} onClick={handleSuccessClose} disabled={isProcessing}>
                                {isProcessing ? 'Saving...' : 'Close'}
                            </button>
                            {submitError && (
                                <p className={styles['Admin-cp-added-error']}>
                                    {submitError}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    /* --- FORM MARKUP --- */
                    <>
                        {/* UPDATED CLASS: Admin-cp-popup-header, Admin-cp-popup-close-btn */}
                        <div className={styles['Admin-cp-popup-header']}>
                            <h2>{editingCompany ? 'Edit Company' : 'Add Company'}</h2>
                            <button className={styles['Admin-cp-popup-close-btn']} onClick={handleClose}>×</button>
                        </div>

                        {/* UPDATED CLASS: Admin-cp-popup-form */}
                        <form className={styles['Admin-cp-popup-form']} onSubmit={handleSubmit}>
                            {/* UPDATED CLASS: Admin-cp-popup-form-grid */}
                            <div className={styles['Admin-cp-popup-form-grid']}>
                                {/* Fields... */}
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Company Name *</label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" required />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Domain *</label>
                                    <input type="text" name="domain" value={formData.domain} onChange={handleChange} placeholder="e.g., IT Sector" required />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Job Role *</label>
                                    <input type="text" name="jobRole" value={formData.jobRole} onChange={handleChange} placeholder="e.g., Junior Developer" required />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Mode</label>
                                    <select name="mode" value={formData.mode} onChange={handleChange}>
                                        <option value="">Select Mode</option>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>HR Name *</label>
                                    <input type="text" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="Enter HR name" required />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>HR Contact</label>
                                    <input type="email" name="hrContact" value={formData.hrContact} onChange={handleChange} placeholder="Enter email" />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Round</label>
                                    <input type="number" name="round" value={formData.round} onChange={handleChange} placeholder="e.g., 2, 3, 6" min="1" max="10" />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="">Select Status</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Visit Date</label>
                                    <input type="date" name="visitDate" value={formData.visitDate} onChange={handleChange} placeholder="DD-MM-YYYY" />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Package</label>
                                    <input type="text" name="package" value={formData.package} onChange={handleChange} placeholder="e.g., 6 LPA" />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Chennai" />
                                </div>
                                {/* UPDATED CLASS: Admin-cp-popup-form-group */}
                                <div className={styles['Admin-cp-popup-form-group']}>
                                    <label>Bond Period</label>
                                    <input type="text" name="bondPeriod" value={formData.bondPeriod} onChange={handleChange} placeholder="e.g., 2 Years" />
                                </div>
                            </div>

                            {/* UPDATED CLASSES: Admin-cp-popup-form-actions, Admin-cp-popup-btn-cancel, Admin-cp-popup-btn-submit */}
                            <div className={styles['Admin-cp-popup-form-actions']}>
                                <button type="button" className={styles['Admin-cp-popup-btn-cancel']} onClick={handleClose}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles['Admin-cp-popup-btn-submit']} disabled={isProcessing}>
                                    {editingCompany ? 'Update Company' : 'Add Company'}
                                    {isProcessing ? '...' : ''}
                                </button>
                                {submitError && (
                                    <p className={styles['Admin-cp-popup-error']}>
                                        {submitError}
                                    </p>
                                )}
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminCompanyprofilePopup;