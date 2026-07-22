import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import Adminicon from '../assets/Adminicon.png';
import mongoDBService from '../services/mongoDBService';
import AdCalendar from '../components/Calendar/Ad_Calendar';
import FormDropdown from '../components/common/FormDropdown/FormDropdown';
import styles from './AdminCompanyprofilepopup.module.css';

const RequiredStar = () => <span className={styles['Admin-profile-required-star']}>*</span>;

const DropdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4" viewBox="0 0 292.4 292.4" className={styles['Admin-cp-profile-dropdown-icon']}>
        <path fill="#999" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.2 1.8-12.9 5.4-3.7 3.6-5.5 8-5.5 13s1.8 9.4 5.5 13l128.8 128.8c3.7 3.7 8 5.5 13 5.5s9.4-1.8 13-5.5l128.8-128.8c3.7-3.6 5.4-8 5.4-13s-1.7-9.4-5.4-13z" />
    </svg>
);

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
    const { companyId } = useParams();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState(emptyFormData);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingCompany, setIsLoadingCompany] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMode, setSuccessMode] = useState('create');

    const [errorTooltip, setErrorTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [highlightedField, setHighlightedField] = useState(null);
    const highlightResetTimerRef = useRef(null);
    const highlightClearTimerRef = useRef(null);

    const fieldRefs = useRef({});
    const registerFieldRef = useCallback((field) => (node) => {
        fieldRefs.current[field] = node;
    }, []);

    const clearFieldHighlight = useCallback(() => {
        if (highlightResetTimerRef.current) { clearTimeout(highlightResetTimerRef.current); highlightResetTimerRef.current = null; }
        if (highlightClearTimerRef.current) { clearTimeout(highlightClearTimerRef.current); highlightClearTimerRef.current = null; }
        setHighlightedField(null);
    }, []);

    const focusField = useCallback((field) => {
        const target = fieldRefs.current[field];
        if (!target) return;

        if (highlightResetTimerRef.current) { clearTimeout(highlightResetTimerRef.current); highlightResetTimerRef.current = null; }
        if (highlightClearTimerRef.current) { clearTimeout(highlightClearTimerRef.current); highlightClearTimerRef.current = null; }

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            try { target.focus({ preventScroll: true }); } catch { target.focus(); }
        }, 100);

        clearFieldHighlight();
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => { setHighlightedField(field); });
        });

        highlightClearTimerRef.current = window.setTimeout(() => {
            setHighlightedField((cur) => (cur === field ? null : cur));
        }, 3000);
    }, [clearFieldHighlight]);

    const [supportsPointerTooltip, setSupportsPointerTooltip] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
        return (
            window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches ||
            window.matchMedia('(hover: hover) and (pointer: fine)').matches
        );
    });

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
        return undefined;
    }, []);

    const handleTooltipMove = useCallback((event) => {
        if (!supportsPointerTooltip) return;
        setErrorTooltip({ visible: true, x: event.clientX + 14, y: event.clientY + 18 });
    }, [supportsPointerTooltip]);

    const handleTooltipLeave = useCallback(() => {
        if (!supportsPointerTooltip) return;
        setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, [supportsPointerTooltip]);

    useEffect(() => () => {
        if (highlightResetTimerRef.current) clearTimeout(highlightResetTimerRef.current);
        if (highlightClearTimerRef.current) clearTimeout(highlightClearTimerRef.current);
    }, []);

    const isEditMode = useMemo(() => location.pathname.includes('/manage/edit/'), [location.pathname]);
    const isViewMode = useMemo(() => location.pathname.includes('/manage/view/'), [location.pathname]);

    const missingFields = useMemo(() => {
        const missing = [];
        if (!formData.companyName) missing.push({ field: 'companyName', label: 'Company Name' });
        if (!formData.companyType) missing.push({ field: 'companyType', label: 'Company Type' });
        if (!formData.jobRole) missing.push({ field: 'jobRole', label: 'Job Role' });
        if (!formData.hrName) missing.push({ field: 'hrName', label: 'HR Name' });
        return missing;
    }, [formData]);

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

    const handleDropdownChange = (name, value) => {
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

    const bondPeriodValue = String(formData.bondPeriod || '').trim();
    const bondPeriodNumber = Number.parseFloat(bondPeriodValue);
    const bondPeriodSuffix = Number.isFinite(bondPeriodNumber) && bondPeriodNumber > 1 ? 'Years' : 'Year';

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
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
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
                            Back
                        </button>
                    </div>

                    <form id="admin-company-profile-form" className={styles['Admin-cp-page-form']} onSubmit={handleSubmit}>
                        <div className={styles['Admin-cp-page-grid']}>
                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>
                                    <span className={styles['Admin-profile-label-heading']}>Company Name <RequiredStar /></span>
                                </label>
                                <input ref={registerFieldRef('companyName')} type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" required disabled={isReadOnly} className={highlightedField === 'companyName' ? styles['Admin-profile-field-highlight'] : ''} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>
                                    <span className={styles['Admin-profile-label-heading']}>Company Type <RequiredStar /></span>
                                </label>
                                <FormDropdown
                                    id="companyType"
                                    ref={registerFieldRef('companyType')}
                                    options={['CORE', 'IT', 'ITES(BPO/KPO)', 'Marketing & Sales', 'HR / Business analyst']}
                                    selectedOption={formData.companyType}
                                    onSelect={(val) => handleDropdownChange('companyType', val)}
                                    placeholder="Select Company Type"
                                    disabled={isReadOnly}
                                    role="admin"
                                    className={`${styles['cp-dropdown-wrapper']} ${highlightedField === 'companyType' ? styles['Admin-profile-field-highlight'] : ''}`}
                                    headerClassName={styles['cp-dropdown-header']}
                                />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>
                                    <span className={styles['Admin-profile-label-heading']}>Job Role <RequiredStar /></span>
                                </label>
                                <input ref={registerFieldRef('jobRole')} type="text" name="jobRole" value={formData.jobRole} onChange={handleChange} placeholder="e.g., Junior Developer" required disabled={isReadOnly} className={highlightedField === 'jobRole' ? styles['Admin-profile-field-highlight'] : ''} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>Mode</label>
                                <FormDropdown
                                    id="mode"
                                    ref={registerFieldRef('mode')}
                                    options={['Online', 'Offline', 'Hybrid']}
                                    selectedOption={formData.mode}
                                    onSelect={(val) => handleDropdownChange('mode', val)}
                                    placeholder="Select Mode"
                                    disabled={isReadOnly}
                                    role="admin"
                                    className={`${styles['cp-dropdown-wrapper']} ${highlightedField === 'mode' ? styles['Admin-profile-field-highlight'] : ''}`}
                                    headerClassName={styles['cp-dropdown-header']}
                                />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>
                                    <span className={styles['Admin-profile-label-heading']}>HR Name <RequiredStar /></span>
                                </label>
                                <input ref={registerFieldRef('hrName')} type="text" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="Enter HR name" required disabled={isReadOnly} className={highlightedField === 'hrName' ? styles['Admin-profile-field-highlight'] : ''} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>HR Contact</label>
                                <input type="email" name="hrContact" value={formData.hrContact} onChange={handleChange} placeholder="Enter email" disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>Round</label>
                                <input type="text" name="round" value={formData.round} onChange={handleChange} placeholder="e.g., 2, 3, 6" disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>Status</label>
                                <FormDropdown
                                    id="status"
                                    ref={registerFieldRef('status')}
                                    options={['Confirmed', 'Pending']}
                                    selectedOption={formData.status}
                                    onSelect={(val) => handleDropdownChange('status', val)}
                                    placeholder="Select Status"
                                    disabled={isReadOnly}
                                    role="admin"
                                    className={`${styles['cp-dropdown-wrapper']} ${highlightedField === 'status' ? styles['Admin-profile-field-highlight'] : ''}`}
                                    headerClassName={styles['cp-dropdown-header']}
                                />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>Visit Date</label>
                                <div className={styles['Admin-cp-date-wrapper']}>
                                    <AdCalendar
                                        value={formData.visitDate}
                                        onChange={handleVisitDateChange}
                                    />
                                </div>
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>Package</label>
                                <div className={styles['Admin-cp-input-affix-wrapper']}>
                                    <input type="text" name="package" value={formData.package} onChange={handleChange} placeholder="e.g., 6" disabled={isReadOnly} className={styles['Admin-cp-input-affix-input']} />
                                    <div className={styles['Admin-cp-input-affix']}>LPA</div>
                                </div>
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>Location</label>
                                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Chennai" disabled={isReadOnly} />
                            </div>

                            <div className={styles['Admin-cp-page-field']}>
                                <label className={styles['Admin-cp-page-field-label']}>Bond Period</label>
                                <div className={styles['Admin-cp-input-affix-wrapper']}>
                                    <input type="text" name="bondPeriod" value={formData.bondPeriod} onChange={handleChange} placeholder="e.g., 1" disabled={isReadOnly} className={styles['Admin-cp-input-affix-input']} />
                                    <div className={styles['Admin-cp-input-affix']}>{bondPeriodSuffix}</div>
                                </div>
                            </div>
                        </div>

                        {submitError && <p className={styles['Admin-cp-page-error']}>{submitError}</p>}

                    </form>
                </section>

                {!isViewMode && (
                    <div className={styles['Admin-cp-page-actions-outside']}>
                        <button type="button" className={styles['Admin-cp-page-secondary-btn']} onClick={handleBack} disabled={isProcessing}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="admin-company-profile-form"
                            className={styles['Admin-cp-page-primary-btn']}
                            disabled={isProcessing || isLoadingCompany || missingFields.length > 0}
                        >
                            {isEditMode ? (isProcessing ? 'Updating...' : 'Update Company') : (isProcessing ? 'Adding...' : 'Add Company')}
                        </button>
                    </div>
                )}

                {!isReadOnly && missingFields.length > 0 && (
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
                            {missingFields.map((error, index) => (
                                <li
                                    key={`${error.field}-${index}`}
                                    className={styles['Admin-profile-validation-item']}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => focusField(error.field)}
                                    onMouseEnter={supportsPointerTooltip ? handleTooltipMove : undefined}
                                    onMouseMove={supportsPointerTooltip ? handleTooltipMove : undefined}
                                    onMouseLeave={supportsPointerTooltip ? handleTooltipLeave : undefined}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {error.label} is required
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {supportsPointerTooltip && errorTooltip.visible && (
                    <div
                        className={styles['Admin-profile-validation-pointer-tooltip']}
                        style={{ left: `${errorTooltip.x}px`, top: `${errorTooltip.y}px` }}
                    >
                        Click to navigate
                    </div>
                )}
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
