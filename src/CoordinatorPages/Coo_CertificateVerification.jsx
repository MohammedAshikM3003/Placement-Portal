import React, { useState, useMemo, useEffect, useCallback } from "react";

import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_CertificateVerification.module.css';
import manageStudentsIcon from "../assets/Coo_ManagestudentsCardicon.svg";
import { FaRegEye, FaSearch, FaMapMarkerAlt, FaImage, FaWindowMaximize } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import certificateService from "../services/certificateService.jsx";
import mongoDBService from "../services/mongoDBService.jsx";

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

    return {
        id: certificateId,
        certificateId,
        studentId: certificate.studentId,
        name: certificate.studentName || certificate.name || 'Unknown Student',
        regNo: certificate.regNo || certificate.reg || '',
        section: certificate.section || '',
        certName:
            certificate.certificateName ||
            certificate.competition ||
            certificate.comp ||
            certificate.fileName ||
            'Certificate',
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
        regNo: "",
        section: "",
        status: "",
        certName: "",
    });
    const [activeFilters, setActiveFilters] = useState({
        regNo: "",
        section: "",
        status: "",
        certName: "",
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
            const certificates = await certificateService.getCertificatesByDepartment(coordinatorDepartment);
            const normalized = certificates
                .map(mapCertificateRecord)
                .filter(Boolean);
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
        const filters = {
            regNo: normalize(activeFilters.regNo),
            section: normalize(activeFilters.section),
            status: normalize(activeFilters.status),
            certName: normalize(activeFilters.certName),
        };

        return certData.filter((item) => {
            const reg = (item.regNo || "").toLowerCase();
            const section = (item.section || "").toLowerCase();
            const statusDisplay = (item.status || "").toLowerCase();
            const cert = (item.certName || "").toLowerCase();

            const matchesRegNo = !filters.regNo || reg.includes(filters.regNo);
            const matchesSection = !filters.section || section.includes(filters.section);
            const matchesStatus =
                !filters.status ||
                statusDisplay.includes(filters.status) ||
                item.rawStatus.includes(filters.status);
            const matchesCertName = !filters.certName || cert.includes(filters.certName);

            return matchesRegNo && matchesSection && matchesStatus && matchesCertName;
        });
    }, [certData, activeFilters]);

    const applyFilters = () => {
        const normalizedStatus = filterInputs.status ? filterInputs.status.trim().toLowerCase() : '';
        const isStatusFilter = normalizedStatus === 'pending' || normalizedStatus === 'approved' || normalizedStatus === 'rejected' || normalizedStatus === 'accepted';

        setActiveFilters(filterInputs);

        const queryStatus = isStatusFilter ? normalizedStatus : '';

        const fetchWithFilters = async () => {
            if (!coordinatorDepartment) return;

            setIsLoading(true);
            setLoadError(null);

            try {
                const certificates = await certificateService.getCertificatesByDepartment(coordinatorDepartment, {
                    status: queryStatus,
                    regNo: filterInputs.regNo,
                    search: filterInputs.certName
                });
                const normalized = certificates.map(mapCertificateRecord).filter(Boolean);
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
                    regNo: pendingFilters.regNo,
                    search: pendingFilters.certName,
                });
                const normalized = certificates.map(mapCertificateRecord).filter(Boolean);
                setCertData(normalized);
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
            if (!certificateId || !apiStatus) return;

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

                if (normalized) {
                    setCertData((prev) =>
                        prev.map((item) =>
                            item.certificateId === certificateId ? normalized : item
                        )
                    );
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
        [coordinatorIdentifier, refreshCertificates, certData]
    );

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
                                        placeholder="Register Number"
                                        value={filterInputs.regNo}
                                        onChange={handleInputChange("regNo")}
                                    />
                                    {filterInputs.regNo && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("regNo")}
                                        />
                                    )}
                                </div>
                                <div className={styles["co-cert-input-group"]}>
                                    <FaImage className={styles["co-cert-input-icon"]} />
                                    <input
                                        type="text"
                                        placeholder="Search by Section"
                                        value={filterInputs.section}
                                        onChange={handleInputChange("section")}
                                    />
                                    {filterInputs.section && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("section")}
                                        />
                                    )}
                                </div>
                                <div className={styles["co-cert-input-group"]}>
                                    <FaMapMarkerAlt className={styles["co-cert-input-icon"]} />
                                    <input
                                        type="text"
                                        placeholder="Status"
                                        value={filterInputs.status}
                                        onChange={handleInputChange("status")}
                                    />
                                    {filterInputs.status && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("status")}
                                        />
                                    )}
                                </div>
                                <div className={styles["co-cert-input-group"]}>
                                    <FaWindowMaximize className={styles["co-cert-input-icon"]} />
                                    <input
                                        type="text"
                                        placeholder="Certificate Name"
                                        value={filterInputs.certName}
                                        onChange={handleInputChange("certName")}
                                    />
                                    {filterInputs.certName && (
                                        <IoClose
                                            className={styles["co-cert-clear-icon"]}
                                            onClick={() => clearFilterField("certName")}
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
                            <table>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Student Name</th>
                                        <th>Reg no</th>
                                        <th>Section</th>
                                        <th>Certificate Name</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                        <th>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={8} className={styles["co-cert-empty"]}>Loading certificates…</td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className={styles["co-cert-empty"]}>
                                                {coordinatorDepartment
                                                    ? 'No certificates to review for this department yet.'
                                                    : 'Coordinator department not available.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item, idx) => {
                                            const statusClass = item.status
                                                ? styles[`status-${item.status.toLowerCase()}`]
                                                : '';
                                            const isApproved = item.rawStatus === 'approved';
                                            const isRejected = item.rawStatus === 'rejected';
                                            const updatingStatus = updatingIds[item.certificateId];
                                            const disableApprove = isApproved || Boolean(updatingStatus);
                                            const disableReject = isRejected || Boolean(updatingStatus);
                                            const disableButtons = Boolean(updatingStatus);
                                            const acceptLabel = updatingStatus === 'approved' ? 'Saving…' : 'Accept';
                                            const rejectLabel = updatingStatus === 'rejected' ? 'Saving…' : 'Reject';

                                            return (
                                                <tr key={item.certificateId || item.id}>
                                                    <td>{idx + 1}</td>
                                                    <td>{item.name}</td>
                                                    <td>{item.regNo}</td>
                                                    <td>{item.section}</td>
                                                    <td className={styles["co-cert-bold"]}>{item.certName}</td>
                                                    <td>
                                                        <span className={cx(styles["co-cert-status-pill"], statusClass)}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className={styles["co-cert-action-btns"]}>
                                                            <button
                                                                className={styles["co-cert-accept-btn"]}
                                                                type="button"
                                                                disabled={disableApprove}
                                                                onClick={() => handleCertificateStatusChange(item.certificateId, "Accepted")}
                                                            >
                                                                {acceptLabel}
                                                            </button>
                                                            <button
                                                                className={styles["co-cert-reject-btn"]}
                                                                type="button"
                                                                disabled={disableReject}
                                                                onClick={() => handleCertificateStatusChange(item.certificateId, "Rejected")}
                                                            >
                                                                {rejectLabel}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button className={styles["co-cert-view-btn"]} disabled={disableButtons}>
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
                </main>
            </div>
        </div>
    );
};

export default Coo_Certificate;