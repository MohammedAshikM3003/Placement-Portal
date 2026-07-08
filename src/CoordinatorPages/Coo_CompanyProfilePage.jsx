import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from '../components/Navbar/Conavbar';
import Sidebar from '../components/Sidebar/Cosidebar';
import mongoDBService from '../services/mongoDBService';
import styles from './Coo_CompanyProfilePage.module.css';
import { CertificateDownloadProgressAlert } from '../components/alerts';

const RequiredStar = () => <span className={styles['Coo-profile-required-star']}>*</span>;

const DropdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4" viewBox="0 0 292.4 292.4" className={styles['Coo-cp-profile-dropdown-icon']}>
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

// Format date helper to display in dd-MM-yyyy format
const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        // assume yyyy-mm-dd format
        if (parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    return dateString;
};

function CooCompanyProfilePage({ onLogout, onViewChange }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { companyId } = useParams();
    const { isAuthenticated, isLoading: authLoading } = useCoordinatorAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState(emptyFormData);
    const [isLoadingCompany, setIsLoadingCompany] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(18);
    const [submitError, setSubmitError] = useState('');

    const handleCloseSidebar = () => setIsSidebarOpen(false);

    useEffect(() => {
        const closeSidebarListener = () => setIsSidebarOpen(false);
        window.addEventListener('closeSidebar', closeSidebarListener);
        return () => window.removeEventListener('closeSidebar', closeSidebarListener);
    }, []);

    useEffect(() => {
        const loadCompany = async () => {
            setSubmitError('');
            setIsLoadingCompany(true);
            const startTime = Date.now();

            try {
                let selectedCompany = location.state?.company;
                const stateCompanyId = selectedCompany?.id || selectedCompany?._id;

                if (!selectedCompany || (companyId && String(stateCompanyId) !== String(companyId))) {
                    const companies = await mongoDBService.getCompanies();
                    selectedCompany = (companies || []).find(
                        (company) => String(company.id || company._id) === String(companyId)
                    );
                }

                if (!selectedCompany) {
                    setSubmitError('Unable to find the selected company. Please return and try again.');
                    return;
                }

                setFormData(mapCompanyToFormData(selectedCompany));
            } catch (error) {
                console.error('Failed to load company details:', error);
                setSubmitError(error?.message || 'Failed to load company details. Please try again.');
            } finally {
                const elapsedTime = Date.now() - startTime;
                const delay = Math.max(0, 800 - elapsedTime);
                setTimeout(() => {
                    setIsLoadingCompany(false);
                }, delay);
            }
        };

        loadCompany();
    }, [location.state, companyId]);

    useEffect(() => {
        if (!isLoadingCompany) {
            setLoadingProgress(100);
            return;
        }

        setLoadingProgress(18);
        const intervalId = setInterval(() => {
            setLoadingProgress((currentProgress) => {
                if (currentProgress >= 92) return currentProgress;
                if (currentProgress >= 70) return Math.min(currentProgress + 2, 92);
                if (currentProgress >= 35) return Math.min(currentProgress + 4, 70);
                return Math.min(currentProgress + 6, 35);
            });
        }, 60);

        return () => clearInterval(intervalId);
    }, [isLoadingCompany]);

    const handleBack = () => {
        navigate('/coo-company-profile');
    };

    const bondPeriodValue = String(formData.bondPeriod || '').trim();
    const bondPeriodNumber = Number.parseFloat(bondPeriodValue);
    const bondPeriodSuffix = Number.isFinite(bondPeriodNumber) && bondPeriodNumber > 1 ? 'Years' : 'Year';

    if (authLoading) {
        return <div className={styles['Coo-cp-page-loading']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    const isReadOnly = true;

    return (
        <div className={styles['Coo-cp-page-layout']}>
            <CertificateDownloadProgressAlert
                isOpen={isLoadingCompany}
                progress={loadingProgress}
                fileLabel="company details"
                title="Loading..."
                color="#d23b42"
                progressColor="#d23b42"
                messages={{
                    initial: 'Fetching company details...',
                    mid: 'Loading latest record...',
                    final: 'Preparing page...'
                }}
            />
            <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

            <Sidebar
                isOpen={isSidebarOpen}
                onLogout={onLogout}
                currentView="company-profile"
                onViewChange={onViewChange}
                onClose={() => setIsSidebarOpen(false)}
            />

            {isSidebarOpen && (
                <div className={styles['Coo-cp-page-overlay']} onClick={handleCloseSidebar} />
            )}

            <main className={styles['Coo-cp-page-main']}>
                <section className={styles['Coo-cp-page-card']}>
                    <div className={styles['Coo-cp-page-header']}>
                        <div>
                            <h1>View Company</h1>
                            <p>Read-only company details</p>
                        </div>
                        <button
                            type="button"
                            className={styles['Coo-cp-page-header-back-btn']}
                            onClick={handleBack}
                        >
                            &#8592; Back
                        </button>
                    </div>

                    <form id="coo-company-profile-form" className={styles['Coo-cp-page-form']} onSubmit={(e) => e.preventDefault()}>
                        <div className={styles['Coo-cp-page-grid']}>
                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>
                                    <span className={styles['Coo-profile-label-heading']}>Company Name <RequiredStar /></span>
                                </label>
                                <input type="text" name="companyName" value={formData.companyName} readOnly disabled={isReadOnly} />
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>
                                    <span className={styles['Coo-profile-label-heading']}>Company Type <RequiredStar /></span>
                                </label>
                                <div className={styles['Coo-cp-select-wrapper']}>
                                    <select name="companyType" value={formData.companyType} readOnly disabled={isReadOnly}>
                                        <option value="">Select Company Type</option>
                                        <option value="CORE">CORE</option>
                                        <option value="IT">IT</option>
                                        <option value="ITES(BPO/KPO)">ITES(BPO/KPO)</option>
                                        <option value="Marketing & Sales">Marketing & Sales</option>
                                        <option value="HR / Business analyst">HR / Business analyst</option>
                                    </select>
                                    <DropdownIcon />
                                </div>
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>
                                    <span className={styles['Coo-profile-label-heading']}>Job Role <RequiredStar /></span>
                                </label>
                                <input type="text" name="jobRole" value={formData.jobRole} readOnly disabled={isReadOnly} />
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>Mode</label>
                                <div className={styles['Coo-cp-select-wrapper']}>
                                    <select name="mode" value={formData.mode} readOnly disabled={isReadOnly}>
                                        <option value="">Select Mode</option>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                    <DropdownIcon />
                                </div>
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>
                                    <span className={styles['Coo-profile-label-heading']}>HR Name <RequiredStar /></span>
                                </label>
                                <input type="text" name="hrName" value={formData.hrName} readOnly disabled={isReadOnly} />
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>HR Contact</label>
                                <input type="email" name="hrContact" value={formData.hrContact} readOnly disabled={isReadOnly} />
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>Round</label>
                                <input type="text" name="round" value={formData.round} readOnly disabled={isReadOnly} />
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>Status</label>
                                <div className={styles['Coo-cp-select-wrapper']}>
                                    <select name="status" value={formData.status} readOnly disabled={isReadOnly}>
                                        <option value="">Select Status</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                    <DropdownIcon />
                                </div>
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>Visit Date</label>
                                <input type="text" name="visitDate" value={formatDisplayDate((formData.visitDate || '').slice(0, 10))} readOnly disabled={isReadOnly} />
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>Package</label>
                                <div className={styles['Coo-cp-input-affix-wrapper']}>
                                    <input type="text" name="package" value={formData.package} readOnly disabled={isReadOnly} className={styles['Coo-cp-input-affix-input']} />
                                    <div className={styles['Coo-cp-input-affix']}>LPA</div>
                                </div>
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>Location</label>
                                <input type="text" name="location" value={formData.location} readOnly disabled={isReadOnly} />
                            </div>

                            <div className={styles['Coo-cp-page-field']}>
                                <label className={styles['Coo-cp-page-field-label']}>Bond Period</label>
                                <div className={styles['Coo-cp-input-affix-wrapper']}>
                                    <input type="text" name="bondPeriod" value={formData.bondPeriod} readOnly disabled={isReadOnly} className={styles['Coo-cp-input-affix-input']} />
                                    <div className={styles['Coo-cp-input-affix']}>{bondPeriodSuffix}</div>
                                </div>
                            </div>
                        </div>

                        {submitError && <p className={styles['Coo-cp-page-error']}>{submitError}</p>}
                    </form>
                </section>
            </main>
        </div>
    );
}

export default CooCompanyProfilePage;
