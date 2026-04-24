import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import Adminicon from '../assets/Adminicon.png';
import mongoDBService from '../services/mongoDBService';
import Ad_Calendar from '../components/Calendar/Ad_Calendar';
import styles from './AdminCompanyprofilepopup.module.css';

const emptyFormData = {
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

const mapCompanyToFormData = (sourceCompany) => ({
    companyName: sourceCompany?.companyName || sourceCompany?.company || '',
    companyType: sourceCompany?.companyType || sourceCompany?.domain || '',
    jobRole: sourceCompany?.jobRole || '',
    mode: sourceCompany?.mode || '',
    hrName: sourceCompany?.hrName || '',
    hrContact: sourceCompany?.hrContact || '',
    round: sourceCompany?.round || '',
    status: sourceCompany?.status || '',
    visitDate: sourceCompany?.visitDate || '',
    package: sourceCompany?.package || '',
    location: sourceCompany?.location || '',
    bondPeriod: sourceCompany?.bondPeriod || ''
});

function AdminCompanyprofilePopup({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, companyId } = useParams();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState(emptyFormData);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingCompany, setIsLoadingCompany] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMode, setSuccessMode] = useState('create');

    const normalizedMode = useMemo(() => String(mode || 'add').toLowerCase(), [mode]);
    const isViewMode = normalizedMode === 'view';
    const isEditMode = normalizedMode === 'edit';

    const pageTitle = isViewMode ? 'View Company' : isEditMode ? 'Edit Company' : 'Add Company';
    const pageDescription = isViewMode
        ? 'Read-only company details'
        : isEditMode
            ? 'Update company profile details'
            : 'Create a new company profile record';

    const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);

    useEffect(() => {
        const closeSidebarListener = () => setIsSidebarOpen(false);
        window.addEventListener('closeSidebar', closeSidebarListener);
        return () => window.removeEventListener('closeSidebar', closeSidebarListener);
    }, []);

    useEffect(() => {
        const loadCompany = async () => {
            setSubmitError('');

            if (!isEditMode && !isViewMode) {
                setFormData(emptyFormData);
                setIsLoadingCompany(false);
                return;
            }

            const companyFromState = location.state?.company;
            const stateCompanyId = companyFromState?.id || companyFromState?._id;

            if (companyFromState && (!companyId || String(stateCompanyId) === String(companyId))) {
                setFormData(mapCompanyToFormData(companyFromState));
                setIsLoadingCompany(false);
                return;
            }

            if (!companyId) {
                setSubmitError('Company details are missing. Please go back and select a company again.');
                setIsLoadingCompany(false);
                return;
            }

            setIsLoadingCompany(true);
            try {
                const companies = await mongoDBService.getCompanies();
                const selectedCompany = (companies || []).find(
                    (company) => String(company.id || company._id) === String(companyId)
                );

                if (!selectedCompany) {
                    setSubmitError('Unable to find the selected company. Please return and try again.');
                    return;
                }

                setFormData(mapCompanyToFormData(selectedCompany));
            } catch (error) {
                console.error('Failed to load company details:', error);
                setSubmitError(error?.message || 'Failed to load company details. Please try again.');
            } finally {
                setIsLoadingCompany(false);
            }
        };

        loadCompany();
    }, [isEditMode, isViewMode, location.state, companyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleVisitDateChange = (dateString) => {
        setFormData((prevState) => ({
            ...prevState,
            visitDate: dateString
        }));
    };

    const handleBack = () => {
        navigate('/admin-company-profile');
    };

    const handleSuccessClose = () => {
        setShowSuccessPopup(false);
        navigate('/admin-company-profile');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isProcessing || isViewMode) return;

        if (!formData.companyName || !formData.companyType || !formData.jobRole || !formData.hrName) {
            setSubmitError('Please fill in all required fields.');
            return;
        }

        if (formData.round && Number.isNaN(parseInt(formData.round, 10))) {
            setSubmitError('Round must be a number.');
            return;
        }

        setIsProcessing(true);
        setSubmitError('');

        const submitData = {
            ...formData,
            round: formData.round ? parseInt(formData.round, 10) : '',
            domain: formData.companyType || formData.domain,
            companyType: formData.companyType || formData.domain
        };

        try {
            if (isEditMode) {
                if (!companyId) {
                    throw new Error('Company ID is missing for edit operation.');
                }

                await mongoDBService.apiCall(`/admin/companies/${companyId}`, {
                    method: 'PUT',
                    body: JSON.stringify(submitData)
                });
                setSuccessMode('update');
            } else {
                await mongoDBService.apiCall('/admin/companies', {
                    method: 'POST',
                    body: JSON.stringify(submitData)
                });
                setSuccessMode('create');
            }

            setShowSuccessPopup(true);
        } catch (error) {
            console.error('Failed to save company:', error);
            setSubmitError(error?.message || 'Failed to save company. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (authLoading) {
        return <div className={styles['Admin-cp-page-loading']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    const isReadOnly = isViewMode || isLoadingCompany;

    return (
        <div className={styles['Admin-cp-page-layout']}>
            <Adnavbar
                onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
                adminName="Admin"
                adminImage={Adminicon}
            />

            <Adsidebar isOpen={isSidebarOpen} onLogout={onLogout} />

            {isSidebarOpen && (
                <div className={styles['Admin-cp-page-overlay']} onClick={handleCloseSidebar} />
            )}

            <main className={styles['Admin-cp-page-main']}>
                <section className={styles['Admin-cp-page-card']}>
                    <div className={styles['Admin-cp-page-header']}>
                        <div>
                            <h1>{pageTitle}</h1>
                            <p>{pageDescription}</p>
                        </div>
                        <button
                            type="button"
                            className={styles['Admin-cp-page-header-back-btn']}
                            onClick={handleBack}
                        >
                            &#8592; Back
                        </button>
                    </div>

                    <form id="admin-company-profile-form" className={styles['Admin-cp-page-form']} onSubmit={handleSubmit}>
                        <div className={styles['Admin-cp-page-grid']}>
                            <div className={styles['Admin-cp-page-field']}>
                                <label>Company Name *</label>
                                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" required disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Company Type *</label>
                                <select name="companyType" value={formData.companyType} onChange={handleChange} required disabled={isReadOnly}>
                                    <option value="">Select Company Type</option>
                                    <option value="CORE">CORE</option>
                                    <option value="IT">IT</option>
                                    <option value="ITES(BPO/KPO)">ITES(BPO/KPO)</option>
                                    <option value="Marketing & Sales">Marketing & Sales</option>
                                    <option value="HR / Business analyst">HR / Business analyst</option>
                                </select>
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Job Role *</label>
                                <input type="text" name="jobRole" value={formData.jobRole} onChange={handleChange} placeholder="e.g., Junior Developer" required disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Mode</label>
                                <select name="mode" value={formData.mode} onChange={handleChange} disabled={isReadOnly}>
                                    <option value="">Select Mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>HR Name *</label>
                                <input type="text" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="Enter HR name" required disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>HR Contact</label>
                                <input type="email" name="hrContact" value={formData.hrContact} onChange={handleChange} placeholder="Enter email" disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Round</label>
                                <input type="text" name="round" value={formData.round} onChange={handleChange} placeholder="e.g., 2, 3, 6" disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} disabled={isReadOnly}>
                                    <option value="">Select Status</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Visit Date</label>
                                <Ad_Calendar
                                    value={formData.visitDate}
                                    onChange={handleVisitDateChange}
                                />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Package</label>
                                <input type="text" name="package" value={formData.package} onChange={handleChange} placeholder="e.g., 6 LPA" disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Location</label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Chennai" disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label>Bond Period</label>
                                <input type="text" name="bondPeriod" value={formData.bondPeriod} onChange={handleChange} placeholder="e.g., 2 Years" disabled={isReadOnly} />
                            </div>
                        </div>

                        {submitError && <p className={styles['Admin-cp-page-error']}>{submitError}</p>}

                    </form>
                </section>

                <div className={styles['Admin-cp-page-actions-outside']}>
                    {isViewMode ? (
                        <button type="button" className={styles['Admin-cp-page-primary-btn']} onClick={handleBack}>
                            Back to Company Profile
                        </button>
                    ) : (
                        <>
                            <button type="button" className={styles['Admin-cp-page-secondary-btn']} onClick={handleBack} disabled={isProcessing}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="admin-company-profile-form"
                                className={styles['Admin-cp-page-primary-btn']}
                                disabled={isProcessing || isLoadingCompany}
                            >
                                {isEditMode ? (isProcessing ? 'Updating...' : 'Update Company') : (isProcessing ? 'Adding...' : 'Add Company')}
                            </button>
                        </>
                    )}
                </div>
            </main>

            {showSuccessPopup && (
                <div className={styles['Admin-cp-success-overlay']} onClick={handleSuccessClose}>
                    <div className={styles['Admin-cp-success-popup']} onClick={(event) => event.stopPropagation()}>
                        <div className={styles['Admin-cp-success-header']}>
                            {successMode === 'update' ? 'Updated !' : 'Added !'}
                        </div>
                        <div className={styles['Admin-cp-success-body']}>
                            <div className={styles['Admin-cp-success-icon-wrapper']}>
                                <svg className={styles['Admin-cp-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle className={styles['Admin-cp-success-icon-circle']} cx="26" cy="26" r="25" fill="none" />
                                    <path className={styles['Admin-cp-success-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                </svg>
                            </div>
                            <h3 className={styles['Admin-cp-success-title']}>
                                {successMode === 'update' ? 'Company Updated ✓' : 'Company Added ✓'}
                            </h3>
                            <p className={styles['Admin-cp-success-message']}>
                                {successMode === 'update'
                                    ? 'Company details have been successfully updated in the portal'
                                    : 'New company has been successfully added in the portal'}
                            </p>
                        </div>
                        <div className={styles['Admin-cp-success-footer']}>
                            <button type="button" className={styles['Admin-cp-success-close-btn']} onClick={handleSuccessClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminCompanyprofilePopup;
