import React, { useState, useMemo, useEffect, useCallback } from "react";

import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_CertificateVerification.module.css';
import manageStudentsIcon from "../assets/Coo_ManagestudentsCardicon.svg";
import { FaRegEye, FaSearch, FaMapMarkerAlt, FaImage, FaWindowMaximize } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import certificateService from "../services/certificateService.jsx";
import mongoDBService from "../services/mongoDBService.jsx";
import {
    CertificatePreviewProgressAlert,
    CertificatePreviewFailedAlert
} from "../components/alerts";

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

const readStoredCoordinatorData = () => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('coordinatorData');
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to parse coordinatorData from storage:', error);
        return null;
    }
};

const resolveCoordinatorDepartment = (data) => {
    if (!data) return null;
    const deptValue =
        data.department ||
        data.branch ||
        data.dept ||
        data.departmentName ||
        data.coordinatorDepartment ||
        data.assignedDepartment;
    return deptValue ? deptValue.toString().toUpperCase() : null;
};

const statusDisplayMap = {
    approved: 'Accepted',
    pending: 'Pending',
    rejected: 'Rejected'
};

const mapCertificateRecord = (certificate) => {
    if (!certificate) return null;

    const getFirstAvailableValue = (keys = []) => {
        for (const key of keys) {
            if (certificate[key] !== undefined && certificate[key] !== null && certificate[key] !== '') {
                return certificate[key];
            }
        }
        return '';
    };

    const toTrimmedString = (value, fallback = '') => {
        if (value === undefined || value === null) {
            return fallback;
        }
        const trimmed = value.toString().trim();
        return trimmed || fallback;
    };

    const rawStatus = (certificate.status || certificate.Status || 'pending')
        .toString()
        .trim()
        .toLowerCase();

    const certificateId =
        certificate.certificateId ||
        certificate._id ||
        certificate.id ||
        certificate.achievementId ||
        null;

    if (!certificateId) {
        return null;
    }

    const displayStatus = statusDisplayMap[rawStatus] || 'Pending';

    const competitionValue = toTrimmedString(
        getFirstAvailableValue([
            'comp',
            'competition',
            'certificateName',
            'certName',
            'eventName',
            'awardName',
            'title',
            'achievementTitle',
            'fileName'
        ])
    );

    const yearValue = toTrimmedString(
        getFirstAvailableValue([
            'year',
            'academicYear',
            'currentYear',
            'studentYear'
        ])
    );

    const semesterValue = toTrimmedString(
        getFirstAvailableValue([
            'semester',
            'sem',
            'term',
            'currentSemester'
        ])
    );

    const dateValue = toTrimmedString(
        getFirstAvailableValue([
            'date',
            'eventDate',
            'achievementDate',
            'certificateDate',
            'issuedOn',
            'awardedOn',
            'uploadDate',
            'createdAt'
        ])
    );

    const prizeValue = toTrimmedString(
        getFirstAvailableValue([
            'prize',
            'award',
            'position',
            'rank',
            'result'
        ])
    );

    return {
        id: certificateId,
        certificateId,
        studentId: certificate.studentId,
        name: certificate.studentName || certificate.name || 'Unknown Student',
        regNo: certificate.regNo || certificate.reg || '',
        section: certificate.section || '',
        year: yearValue,
        semester: semesterValue,
        comp: competitionValue || 'Certificate',
        certName: competitionValue || 'Certificate',
        date: dateValue,
        prize: prizeValue,
        rawStatus,
        status: displayStatus,
        uploadDate: certificate.uploadDate || '',
        fileName: certificate.fileName || '',
        fileType: certificate.fileType || '',
        fileSize: certificate.fileSize || 0,
        achievementId: certificate.achievementId || certificateId,
    };
};

const toApiStatus = (status) => {
    if (!status) return null;
    const normalized = status.toString().trim().toLowerCase();
    if (normalized === 'accepted') return 'approved';
    if (['approved', 'pending', 'rejected'].includes(normalized)) {
        return normalized;
    }
    return null;
};

const CertificateTableLoader = ({ message }) => (
    <div className={styles["co-cert-table-loader"]}>
        <span className={styles["co-cert-table-spinner"]} />
        <span className={styles["co-cert-table-loader-text"]}>
            {message || 'Loading certificates...'}
        </span>
    </div>
);

const Coo_Certificate = ({ onLogout, onViewChange }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [coordinatorData, setCoordinatorData] = useState(() => readStoredCoordinatorData());
    const coordinatorDepartment = useMemo(
        () => resolveCoordinatorDepartment(coordinatorData),
        [coordinatorData]
    );
    const [certData, setCertData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [updatingIds, setUpdatingIds] = useState({});
    const [filterInputs, setFilterInputs] = useState({
        searchTerm: "",
        year: "",
        section: "",
        compPrize: "",
        status: "",
    });
    const [activeFilters, setActiveFilters] = useState({
        searchTerm: "",
        year: "",
        section: "",
        compPrize: "",
        status: "",
    });

    const [previewState, setPreviewState] = useState({
        status: 'idle', // idle | progress | error
        progress: 0,
        errorMessage: ''
    });

    useEffect(() => {
        let isMounted = true;

        const ensureCoordinatorDetails = async () => {
            if (typeof window === 'undefined') return;

            let storedData = readStoredCoordinatorData();

            if (storedData && isMounted) {
                setCoordinatorData(prev => prev || storedData);
            }

            const storedId =
                storedData?.coordinatorId ||
                storedData?._id ||
                storedData?.id ||
                (typeof window !== 'undefined' ? localStorage.getItem('coordinatorId') : null);

            if (!storedId) {
                return;
            }

            try {
                const response = await mongoDBService.getCoordinatorById(storedId);
                if (!isMounted || !response) return;

                const normalized = response?.coordinator || response;
                if (!normalized) return;

                storedData = {
                    ...(storedData || {}),
                    ...normalized,
                    coordinatorId: storedId
                };

                const normalizedDepartment = resolveCoordinatorDepartment(storedData);
                const mergedCoordinatorData = {
                    ...storedData,
                    department: normalizedDepartment,
                    branch: normalizedDepartment || storedData?.branch
                };

                setCoordinatorData(mergedCoordinatorData);

                try {
                    localStorage.setItem('coordinatorData', JSON.stringify(mergedCoordinatorData));
                    localStorage.setItem('coordinatorId', storedId);
                } catch (storageError) {
                    console.error('Failed to persist coordinator data:', storageError);
                }
            } catch (error) {
                console.error('Failed to fetch coordinator details:', error);
            }
        };

        ensureCoordinatorDetails();

        return () => {
            isMounted = false;
        };
    }, []);

    const coordinatorIdentifier = useMemo(() => {
        if (coordinatorData) {
            return (
                coordinatorData.coordinatorId ||
                coordinatorData._id ||
                coordinatorData.id ||
                (typeof window !== 'undefined' ? localStorage.getItem('coordinatorId') : '')
            );
        }

        if (typeof window !== 'undefined') {
            return localStorage.getItem('coordinatorId') || '';
        }

        return '';
    }, [coordinatorData]);

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

    const refreshCertificates = useCallback(async () => {
        if (!coordinatorDepartment) {
            setCertData([]);
            return [];
        }

        setIsLoading(true);
        setLoadError(null);

        try {
            const certificates = await certificateService.getCertificatesByDepartment(coordinatorDepartment, {
                status: 'pending'
            });
            const normalized = certificates
                .map(mapCertificateRecord)
                .filter(Boolean)
                .filter((item) => item.rawStatus === 'pending');
            setCertData(normalized);
            return normalized;
        } catch (error) {
            console.error('Failed to load certificates:', error);
            setLoadError(error.message || 'Failed to load certificates');
            setCertData([]);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [coordinatorDepartment]);

    useEffect(() => {
        if (!coordinatorDepartment) {
            return;
        }

        refreshCertificates();
    }, [coordinatorDepartment, refreshCertificates]);

    const pendingCount = useMemo(
        () => certData.filter((item) => item.rawStatus === "pending").length,
        [certData]
    );

    const filteredData = useMemo(() => {
        const normalize = (value) => (value ? value.toString().trim().toLowerCase() : "");
        const toRomanYear = (value) => {
            if (!value) return "";
            const trimmed = value.toString().trim();
            if (!trimmed) return "";
            const map = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
            if (map[trimmed]) return map[trimmed];
            const upper = trimmed.toUpperCase();
            if (['I', 'II', 'III', 'IV'].includes(upper)) return upper;
            const num = parseInt(trimmed, 10);
            if (!Number.isNaN(num) && map[String(num)]) return map[String(num)];
            return upper;
        };
        const filters = {
            searchTerm: normalize(activeFilters.searchTerm),
            year: toRomanYear(activeFilters.year),
            section: normalize(activeFilters.section),
            compPrize: normalize(activeFilters.compPrize),
            status: normalize(activeFilters.status),
        };

        return certData.filter((item) => {
            const name = (item.name || "").toLowerCase();
            const reg = (item.regNo || "").toLowerCase();
            const section = (item.section || "").toLowerCase();
            const statusDisplay = (item.status || "").toLowerCase();
            const competition = (item.certName || item.comp || "").toLowerCase();
            const prize = (item.prize || "").toLowerCase();
            const yearRoman = toRomanYear(item.year);

            const matchesSearch =
                !filters.searchTerm ||
                name.includes(filters.searchTerm) ||
                reg.includes(filters.searchTerm);
            const matchesYear = !filters.year || yearRoman === filters.year;
            const matchesSection = !filters.section || section.includes(filters.section);
            const matchesStatus =
                !filters.status ||
                statusDisplay.includes(filters.status) ||
                item.rawStatus.includes(filters.status);
            const matchesCompPrize =
                !filters.compPrize ||
                competition.includes(filters.compPrize) ||
                prize.includes(filters.compPrize);

            return (
                matchesSearch &&
                matchesYear &&
                matchesSection &&
                matchesStatus &&
                matchesCompPrize
            );
        });
    }, [certData, activeFilters]);

    const applyFilters = () => {
        const normalizedStatus = filterInputs.status ? filterInputs.status.trim().toLowerCase() : '';
        const isStatusFilter = normalizedStatus === 'pending' || normalizedStatus === 'approved' || normalizedStatus === 'rejected' || normalizedStatus === 'accepted';

        setActiveFilters(filterInputs);

        if (certData.length === 0 && coordinatorDepartment) {
            refreshCertificates();
        }

        const fetchWithFilters = async () => {
            if (!coordinatorDepartment) return;

            setIsLoading(true);
            setLoadError(null);

            try {
                const certificates = await certificateService.getCertificatesByDepartment(coordinatorDepartment, {
                    status: 'pending'
                });

                const normalized = certificates
                    .map(mapCertificateRecord)
                    .filter(Boolean)
                    .filter((item) => item.rawStatus === 'pending');
                setCertData(normalized);
            } catch (error) {
                console.error('Failed to apply filters:', error);
                setLoadError(error.message || 'Failed to filter certificates');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWithFilters();
    };

    const handleInputChange = (field) => (event) => {
        const { value } = event.target;
        setFilterInputs((prev) => ({ ...prev, [field]: value }));
    };

    const clearFilterField = (field) => {
        setFilterInputs((prev) => ({ ...prev, [field]: "" }));
        setActiveFilters((prev) => ({ ...prev, [field]: "" }));
    };

    const handlePendingCardClick = useCallback(() => {
        const pendingFilters = {
            ...filterInputs,
            status: "Pending",
        };

        setFilterInputs(pendingFilters);
        setActiveFilters(pendingFilters);

        if (!coordinatorDepartment) {
            return;
        }

        const fetchPending = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const certificates = await certificateService.getCertificatesByDepartment(coordinatorDepartment, {
                    status: 'pending',
                    regNo: pendingFilters.searchTerm,
                    search: pendingFilters.compPrize,
                });

                const pendingNormalized = certificates
                    .map(mapCertificateRecord)
                    .filter(Boolean)
                    .filter((item) => item.rawStatus === 'pending');
                setCertData(pendingNormalized);
            } catch (error) {
                console.error('Failed to load pending certificates:', error);
                setLoadError(error.message || 'Failed to load pending certificates');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPending();
    }, [coordinatorDepartment, filterInputs]);

    const handleManageStudentsClick = () => {
        onViewChange?.("manage-students");
    };

    const handleCertificateStatusChange = useCallback(
        async (certificateId, targetStatus) => {
            const apiStatus = toApiStatus(targetStatus);

            if (!certificateId || !apiStatus) {
                return;
            }

            setUpdatingIds((prev) => ({ ...prev, [certificateId]: apiStatus }));
            setLoadError(null);

            const payload = {
                status: apiStatus,
                verifiedAt: new Date().toISOString(),
            };

            if (coordinatorIdentifier) {
                payload.verifiedBy = coordinatorIdentifier;
            }
            try {
                const updated = await certificateService.updateCertificateStatus(certificateId, payload);
                const normalized = mapCertificateRecord(updated);

                setCertData((prev) =>
                    prev.filter((item) => item.certificateId !== certificateId)
                );

                if (coordinatorDepartment) {
                    const certificates = await certificateService.getCertificatesByDepartment(coordinatorDepartment, {
                        status: 'pending',
                        regNo: filterInputs.searchTerm,
                        search: filterInputs.compPrize,
                    });
                    const pendingNormalized = certificates
                        .map(mapCertificateRecord)
                        .filter(Boolean)
                        .filter((item) => item.rawStatus === 'pending');
                    setCertData(pendingNormalized);
                }
            } catch (error) {
                console.error('Failed to update certificate status:', error);
                setLoadError(error.message || 'Failed to update certificate status');
            } finally {
                setUpdatingIds((prev) => {
                    const next = { ...prev };
                    delete next[certificateId];
                    return next;
                });
            }
        },
        [activeFilters.status, coordinatorDepartment, coordinatorIdentifier, filterInputs, refreshCertificates]
    );

    const handlePreviewCertificate = useCallback(async (certificateRecord) => {
        if (!certificateRecord || previewState.status === 'progress') {
            return;
        }

        let progressTimer;
        setPreviewState({ status: 'progress', progress: 0, errorMessage: '' });

        const animateProgress = () => {
            setPreviewState((prev) => {
                if (prev.status !== 'progress') {
                    return prev;
                }

                const nextProgress = prev.progress >= 85
                    ? prev.progress
                    : Math.min(prev.progress + Math.random() * 12, 85);

                return { ...prev, progress: nextProgress };
            });
        };

        progressTimer = setInterval(animateProgress, 150);

        try {
            let certificateDocument = null;

            if (certificateRecord.studentId && certificateRecord.achievementId) {
                certificateDocument = await mongoDBService.getCertificateFileByAchievementId(
                    certificateRecord.studentId,
                    certificateRecord.achievementId
                );
            }

            if (!certificateDocument || !certificateDocument.fileData) {
                throw new Error('Certificate file data is unavailable.');
            }

            const dataUrl = certificateDocument.fileData.startsWith('data:')
                ? certificateDocument.fileData
                : `data:${certificateDocument.fileType || 'application/pdf'};base64,${certificateDocument.fileData}`;

            if (progressTimer) {
                clearInterval(progressTimer);
            }

            setPreviewState((prev) => ({ ...prev, progress: 100 }));

            setTimeout(() => {
                const previewWindow = window.open('', '_blank');

                if (!previewWindow) {
                    setPreviewState({
                        status: 'error',
                        progress: 0,
                        errorMessage: 'Popup blocked. Please allow popups for this site.'
                    });
                    return;
                }

                previewWindow.document.write(`
                    <html>
                        <head><title>${certificateRecord.certName || 'Certificate Preview'}</title></head>
                        <body style="margin:0">
                            <embed src="${dataUrl}" type="${certificateDocument.fileType || 'application/pdf'}" width="100%" height="100%" />
                        </body>
                    </html>
                `);
                previewWindow.document.close();

                setTimeout(
                    () => setPreviewState({ status: 'idle', progress: 0, errorMessage: '' }),
                    400
                );
            }, 300);
        } catch (error) {
            console.error('Certificate preview failed:', error);
            setPreviewState({
                status: 'error',
                progress: 0,
                errorMessage: error.message || 'Unable to preview the certificate. Please try again.'
            });
        } finally {
            if (progressTimer) {
                clearInterval(progressTimer);
            }
        }
    }, [previewState.status]);

    const closePreviewAlerts = () => {
        setPreviewState({ status: 'idle', progress: 0, errorMessage: '' });
    };

    const formatDisplayDate = (value) => {
        if (!value) return '--';
        const trimmed = value.toString().trim();
        if (!trimmed) return '--';

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const [year, month, day] = trimmed.split('-');
            return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
        }

        if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(trimmed)) {
            return trimmed.replace(/\//g, '-');
        }

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            const day = String(parsed.getDate()).padStart(2, '0');
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const year = parsed.getFullYear();
            return `${day}-${month}-${year}`;
        }

        return trimmed;
    };

    const formatYearSec = (yearValue, sectionValue) => {
        const toRoman = (numStr) => {
            const map = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
            const trimmed = (numStr || '').toString().trim();
            if (!trimmed) return '';
            if (map[trimmed]) return map[trimmed];
            const upper = trimmed.toUpperCase();
            if (['I', 'II', 'III', 'IV'].includes(upper)) return upper;
            const n = parseInt(trimmed, 10);
            if (!Number.isNaN(n) && map[String(n)]) return map[String(n)];
            return upper;
        };

        const yr = toRoman(yearValue);
        const sec = (sectionValue || '').toString().trim().toUpperCase();
        if (yr && sec) return `${yr}-${sec}`;
        if (yr) return yr;
        if (sec) return sec;
        return '--';
    };

    const renderCell = (value, fallback = '--') => {
        if (value === undefined || value === null) {
            return fallback;
        }
        const trimmed = value.toString().trim();
        return trimmed || fallback;
    };

    return (
        <div className={styles["co-cert-page-wrapper"]}>
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className={styles["co-cert-layout"]}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView="certificate-verification"
                    onViewChange={onViewChange}
                />
                <main className={styles["co-cert-main-content"]}>
                    {/* TOP HEADER CARDS */}
                    <div className={styles["co-cert-top-row"]}>
                        {/* Left Card: Manage Students */}
                        <div
                            className={cx(styles["co-cert-card"], styles["co-cert-manage-card"])}
                            role="button"
                            tabIndex={0}
                            onClick={handleManageStudentsClick}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    handleManageStudentsClick();
                                }
                            }}
                        >
                            <div className={styles["co-cert-icon-wrapper"]}>
                                <img src={manageStudentsIcon} alt="Manage" />
                            </div>
                            <h2>Manage Students</h2>
                            <p>Access and manage student information.</p>
                        </div>
                        {/* Middle Card: Filter Card */}
                        <div className={styles["co-cert-filter-card"]}>
                            <div className={styles["co-cert-filter-badge"]}>Certificate Verification</div>
                            <div className={styles["co-cert-filter-grid"]}>
                                <div className={styles["co-cert-input-group"]}>
                                    <FaSearch className={styles["co-cert-input-icon"]} />
                                    <input
                                        type="text"
                                        placeholder="Name/Reg.No"
                                        value={filterInputs.searchTerm}
                                        onChange={handleInputChange("searchTerm")}
                                    />
                                    {filterInputs.searchTerm && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("searchTerm")}
                                        />
                                    )}
                                </div>
                                <div className={styles["co-cert-input-group"]}>
                                    <FaImage className={styles["co-cert-input-icon"]} />
                                    <select
                                        value={filterInputs.year}
                                        onChange={handleInputChange("year")}
                                    >
                                        <option value="">Year</option>
                                        <option value="I">I</option>
                                        <option value="II">II</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                    </select>
                                    {filterInputs.year && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("year")}
                                        />
                                    )}
                                </div>
                                <div className={styles["co-cert-input-group"]}>
                                    <FaMapMarkerAlt className={styles["co-cert-input-icon"]} />
                                    <select
                                        value={filterInputs.section}
                                        onChange={handleInputChange("section")}
                                    >
                                        <option value="">Section</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                    {filterInputs.section && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("section")}
                                        />
                                    )}
                                </div>
                                <div className={styles["co-cert-input-group"]}>
                                    <FaWindowMaximize className={styles["co-cert-input-icon"]} />
                                    <input
                                        type="text"
                                        placeholder="Competition/Prize"
                                        value={filterInputs.compPrize}
                                        onChange={handleInputChange("compPrize")}
                                    />
                                    {filterInputs.compPrize && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("compPrize")}
                                        />
                                    )}
                                </div>
                            </div>
                            <button
                                className={styles["co-cert-apply-btn"]}
                                type="button"
                                onClick={applyFilters}
                            >
                                Apply Filters
                            </button>
                        </div>
                        {/* Right Card: Pending Count */}
                        <div
                            className={cx(styles["co-cert-card"], styles["co-cert-pending-card"])}
                            role="button"
                            tabIndex={0}
                            onClick={handlePendingCardClick}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    handlePendingCardClick();
                                }
                            }}
                        >
                            <h1>PENDING</h1>
                            <span>CERTIFICATES</span>
                            <div className={styles["co-cert-big-number"]}>{pendingCount}</div>
                        </div>
                    </div>
                    {/* TABLE SECTION */}
                    <div className={styles["co-cert-table-container"]}>
                        <h3 className={styles["co-cert-table-title"]}>CERTIFICATE VERIFICATION</h3>
                        {loadError && (
                            <div className={styles["co-cert-alert"]}>{loadError}</div>
                        )}
                        <div className={styles["co-cert-table-wrapper"]}>
                            <table className={styles["co-cert-table"]}>
                                <colgroup>
                                    <col className={styles["co-cert-col-sno"]} />
                                    <col className={styles["co-cert-col-reg"]} />
                                    <col className={styles["co-cert-col-name"]} />
                                    <col className={styles["co-cert-col-yearsec"]} />
                                    <col className={styles["co-cert-col-sem"]} />
                                    <col className={styles["co-cert-col-date"]} />
                                    <col className={styles["co-cert-col-comp"]} />
                                    <col className={styles["co-cert-col-prize"]} />
                                    <col className={styles["co-cert-col-action"]} />
                                    <col className={styles["co-cert-col-view"]} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Reg.No</th>
                                        <th>Name</th>
                                        <th>Year-Sec</th>
                                        <th>Sem</th>
                                        <th>Date</th>
                                        <th>Competition</th>
                                        <th>Prize</th>
                                        <th>Action</th>
                                        <th>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={10}>

                                                <CertificateTableLoader
                                                    message={certData.length > 0 ? 'Refreshing certificates...' : 'Loading certificates...'}
                                                />
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className={styles["co-cert-empty"]}>
                                                {coordinatorDepartment
                                                    ? 'No certificates to review for this department yet.'
                                                    : 'Coordinator department not available.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item, index) => {

                                            const normalizedStatus = (item.rawStatus || item.status || '').toLowerCase();
                                            const isApproved = normalizedStatus === 'approved';
                                            const isRejected = normalizedStatus === 'rejected';
                                            const statusLabel = isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending';
                                            const statusClassKey = isApproved
                                                ? 'status-accepted'
                                                : isRejected
                                                    ? 'status-rejected'
                                                    : 'status-pending';
                                            const statusClass = styles[statusClassKey] || '';

                                            const updatingStatus = updatingIds[item.certificateId];
                                            const shouldShowButtons = !isApproved && !isRejected;
                                            const disableButtons = Boolean(updatingStatus);
                                            const acceptLabel = updatingStatus === 'approved' ? 'Saving...' : 'Approve';
                                            const rejectLabel = updatingStatus === 'rejected' ? 'Saving...' : 'Reject';

                                            return (
                                                <tr key={item.certificateId || item.id}>
                                                    <td data-label="S.No">{index + 1}</td>
                                                    <td data-label="Reg.No">{renderCell(item.regNo)}</td>
                                                    <td data-label="Name">{renderCell(item.name, 'Unknown Student')}</td>
                                                    <td data-label="Year-Sec">{formatYearSec(item.year, item.section)}</td>
                                                    <td data-label="Sem">{renderCell(item.semester)}</td>
                                                    <td data-label="Date">{formatDisplayDate(item.date)}</td>
                                                    <td data-label="Competition" className={styles["co-cert-bold"]}>{renderCell(item.comp)}</td>
                                                    <td data-label="Prize">{renderCell(item.prize)}</td>
                                                    <td data-label="Action">

                                                        {shouldShowButtons ? (
                                                            <div className={styles["co-cert-action-btns"]}>
                                                                <button
                                                                    className={styles["co-cert-accept-btn"]}
                                                                    type="button"
                                                                    disabled={disableButtons}
                                                                    onClick={() => handleCertificateStatusChange(item.certificateId, 'Approved')}
                                                                >
                                                                    {acceptLabel}
                                                                </button>
                                                                <button
                                                                    className={styles["co-cert-reject-btn"]}
                                                                    type="button"
                                                                    disabled={disableButtons}
                                                                    onClick={() => handleCertificateStatusChange(item.certificateId, 'Rejected')}
                                                                >
                                                                    {rejectLabel}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className={cx(styles["co-cert-status-pill"], statusClass)}>
                                                                {statusLabel}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className={styles["co-cert-view-btn"]}
                                                            type="button"
                                                            disabled={Boolean(updatingStatus)}
                                                            onClick={() => handlePreviewCertificate(item)}
                                                        >
                                                            <FaRegEye />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <CertificatePreviewProgressAlert
                        isOpen={previewState.status === 'progress'}
                        progress={previewState.progress}
                        title="Previewing..."
                    />
                    <CertificatePreviewFailedAlert
                        isOpen={previewState.status === 'error'}
                        onClose={closePreviewAlerts}
                        message={previewState.errorMessage}
                    />
                </main>
            </div>
        </div>
    );
};

export default Coo_Certificate;