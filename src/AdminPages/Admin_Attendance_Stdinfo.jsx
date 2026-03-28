import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar/Adnavbar.js";
import Sidebar from "../components/Sidebar/Adsidebar.js";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts/index.js';
import styles from "./Admin_Attendance_Stdinfo.module.css";
import eyeicon from "../assets/training-eyeicon.svg";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DeleteConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting }) => (
    <div className={styles['Admin-ad-train-popup-overlay']}>
        <div className={styles['Admin-ad-train-popup-container']}>
            <div className={styles['Admin-ad-train-popup-header']}>Warning</div>
            <div className={styles['Admin-ad-train-popup-body']}>
                <div className={styles['Admin-ad-train-warning-icon']}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-ad-train-warning-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                        <path className={styles['Admin-ad-train-warning-icon--exclamation']} d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" />
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Student Will Be Removed</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
                    Remove {selectedCount} Student{selectedCount > 1 ? 's' : ''} from Placement Training?
                </p>
            </div>
            <div className={styles['Admin-ad-train-popup-footer']}>
                <button
                    onClick={onClose}
                    className={styles['Admin-ad-train-popup-cancel-btn']}
                    disabled={isDeleting}
                >
                    Discard
                </button>
                <button
                    onClick={onConfirm}
                    className={styles['Admin-ad-train-popup-delete-btn']}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const UpdateSuccessPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles['ad-train-att-updated-popup-overlay']} onClick={onClose}>
      <div className={styles['ad-train-att-updated-popup-container']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['ad-train-att-updated-popup-header']}>Updated !</div>
        <div className={styles['ad-train-att-updated-popup-body']}>
          <div className={styles['ad-train-att-updated-icon-wrapper']}>
            <svg className={styles['ad-train-att-updated-icon']} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <circle className={styles['ad-train-att-updated-icon-circle']} cx="32" cy="32" r="22" fill="none" />
              <g className={styles['ad-train-att-updated-icon-arrows']} fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 26a14 14 0 0 1 23-4" />
                <polyline points="45 18 46 26 38 25" />
                <path d="M42 38a14 14 0 0 1-23 4" />
                <polyline points="19 46 18 38 26 39" />
              </g>
            </svg>
          </div>
          <h2 className={styles['ad-train-att-updated-title']}>Attendance Updated ✓</h2>
          <p className={styles['ad-train-att-updated-text']}>The Attendances Changes have been Successfully Updated in the Portal</p>
        </div>
        <div className={styles['ad-train-att-updated-popup-footer']}>
          <button className={styles['ad-train-att-updated-close-btn']} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const AttenTrainAddedPopup = ({ isOpen, onClose, selectedCount }) => {
  if (!isOpen) return null;

  return (
    <div className={styles['atten-train-popup-overlay']} onClick={onClose}>
      <div
        className={`${styles['atten-train-popup-container']} ${styles['atten-train-is-success']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['atten-train-added-popup-header']}>Added !</div>
        <div className={styles['atten-train-added-popup-content']}>
          <div className={styles['atten-train-added-icon-wrapper']}>
            <svg className={styles['atten-train-added-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles['atten-train-added-icon-circle']} cx="26" cy="26" r="25" fill="none" />
              <path className={styles['atten-train-added-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>

          <h3 className={styles['atten-train-added-title']}>Added ✔</h3>
          <p className={styles['atten-train-added-text']}>
            {selectedCount} Student{selectedCount > 1 ? 's' : ''} added successfully.
          </p>
        </div>
        <div className={styles['atten-train-added-popup-footer']}>
          <button className={styles['atten-train-added-close-btn']} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
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

const AttenTrainProfilePopup = ({ isOpen, onClose, onSubmit, editingCompany, viewingCompany }) => {
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState('Added ✔');
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

  const handleClose = () => {
    setFormData(getInitialFormData());
    setShowSuccess(false);
    setSubmitError('');
    setIsProcessing(false);
    onClose();
  };

  const handleSuccessClose = () => {
    handleClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    if (!formData.companyName || !formData.companyType || !formData.jobRole || !formData.hrName) {
      setIsProcessing(false);
      alert('Please fill in all required fields');
      return;
    }
    if (formData.round && isNaN(parseInt(formData.round))) {
      setIsProcessing(false);
      alert('Round must be a number');
      return;
    }

    const submitData = {
      ...formData,
      round: formData.round ? parseInt(formData.round) : ''
    };

    setSubmitError('');

    try {
      if (editingCompany) {
        await Promise.resolve(onSubmit?.(submitData));
        setIsProcessing(false);
        handleClose();
      } else {
        await Promise.resolve(onSubmit?.(submitData));
        setIsProcessing(false);
        setSuccessHeader('Added !');
        setSuccessTitle('Added ✔');
        setShowSuccess(true);
      }
    } catch (error) {
      setIsProcessing(false);
      setSubmitError(error?.message || 'Failed to save. Please try again.');
    }
  };

  useEffect(() => {
    setFormData(getInitialFormData());
    setShowSuccess(false);
    setSubmitError('');
    setIsProcessing(false);
  }, [editingCompany, viewingCompany, isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles['atten-train-popup-overlay']} onClick={handleClose}>
      <div
        className={`${styles['atten-train-popup-container']} ${showSuccess ? styles['atten-train-is-success'] : styles['atten-train-is-form']}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          <>
            <div className={styles['atten-train-added-popup-header']}>
              {successHeader}
            </div>
            <div className={styles['atten-train-added-popup-content']}>
              <div className={styles['atten-train-added-icon-wrapper']}>
                <svg className={styles['atten-train-added-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle className={styles['atten-train-added-icon-circle']} cx="26" cy="26" r="25" fill="none" />
                  <path className={styles['atten-train-added-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>

              <h3 className={styles['atten-train-added-title']}>{successTitle}</h3>
              <p className={styles['atten-train-added-text']}>
                Added successfully.
              </p>
            </div>
            <div className={styles['atten-train-added-popup-footer']}>
              <button className={styles['atten-train-added-close-btn']} onClick={handleSuccessClose}>
                Close
              </button>
              {submitError && (
                <p className={styles['atten-train-added-error']}>
                  {submitError}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles['atten-train-popup-header']}>
              <h2>{viewingCompany ? 'View' : (editingCompany ? 'Edit' : 'Add')}</h2>
              <button className={styles['atten-train-popup-close-btn']} onClick={handleClose} disabled={isProcessing}>×</button>
            </div>

            <form className={styles['atten-train-popup-form']} onSubmit={handleSubmit}>
              <div className={styles['atten-train-popup-form-grid']}>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Company Name *</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" required disabled={!!viewingCompany} />
                </div>
                <div className={styles['atten-train-popup-form-group']}>
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
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Job Role *</label>
                  <input type="text" name="jobRole" value={formData.jobRole} onChange={handleChange} placeholder="e.g., Junior Developer" required disabled={!!viewingCompany} />
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Mode</label>
                  <select name="mode" value={formData.mode} onChange={handleChange} disabled={!!viewingCompany}>
                    <option value="">Select Mode</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>HR Name *</label>
                  <input type="text" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="Enter HR name" required disabled={!!viewingCompany} />
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>HR Contact</label>
                  <input type="email" name="hrContact" value={formData.hrContact} onChange={handleChange} placeholder="Enter email" disabled={!!viewingCompany} />
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Round</label>
                  <input type="text" name="round" value={formData.round} onChange={handleChange} placeholder="e.g., 2, 3, 6" disabled={!!viewingCompany} />
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} disabled={!!viewingCompany}>
                    <option value="">Select Status</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Visit Date</label>
                  <div className={styles['atten-train-popup-date-wrapper']}>
                    <DatePicker
                      selected={parseDateValue(formData.visitDate)}
                      onChange={handleVisitDateChange}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select visit date"
                      className={styles['atten-train-popup-date-input']}
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
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Package</label>
                  <input type="text" name="package" value={formData.package} onChange={handleChange} placeholder="e.g., 6 LPA" disabled={!!viewingCompany} />
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Chennai" disabled={!!viewingCompany} />
                </div>
                <div className={styles['atten-train-popup-form-group']}>
                  <label>Bond Period</label>
                  <input type="text" name="bondPeriod" value={formData.bondPeriod} onChange={handleChange} placeholder="e.g., 2 Years" disabled={!!viewingCompany} />
                </div>
              </div>

              {viewingCompany ? (
                <div className={styles['atten-train-popup-form-actions']}>
                  <button type="button" className={styles['atten-train-popup-btn-submit']} onClick={handleClose} style={{ width: '100%' }}>
                    Close
                  </button>
                </div>
              ) : (
                <div className={styles['atten-train-popup-form-actions']}>
                  <button type="button" className={styles['atten-train-popup-btn-cancel']} onClick={handleClose} disabled={isProcessing}>
                    Cancel
                  </button>
                  <button type="submit" className={styles['atten-train-popup-btn-submit']} disabled={isProcessing}>
                    {editingCompany ? (isProcessing ? 'UPDATING...' : 'UPDATE') : (isProcessing ? 'ADD...' : 'ADD')}
                  </button>
                  {submitError && (
                    <p className={styles['atten-train-popup-error']}>
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
};

const DeleteSuccessPopup = ({ onClose }) => (
  <div className={styles['Admin-ad-train-popup-overlay']}>
    <div className={styles['Admin-ad-train-popup-container']}>
      <div className={styles['Admin-ad-train-popup-header']}>Removed !</div>
      <div className={styles['Admin-ad-train-popup-body']}>
        <svg className={styles['Admin-ad-train-delete-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle className={styles['Admin-ad-train-delete-success-icon--circle']} cx="26" cy="26" r="25" fill="none" />
          <g className={styles['Admin-ad-train-delete-success-icon--bin']} fill="none" strokeWidth="2">
            <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8" />
          </g>
        </svg>
        <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Student Removed ✓</h2>
        <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The selected student has been removed successfully!</p>
      </div>
      <div className={styles['Admin-ad-train-popup-footer']}>
        <button onClick={onClose} className={styles['Admin-ad-train-popup-close-btn']}>Close</button>
      </div>
    </div>
  </div>
);


const studentData = [
  { id: 1, name: "Kiruthika", regNo: "73152313038", dept: "CSE", year: "III", section: "A", phone: "9898986547", date: "25-02-2025", status: "-" },
  { id: 2, name: "Donald Trump", regNo: "73152313049", dept: "CSE", year: "III", section: "B", phone: "9788657300", date: "25-02-2025", status: "-" },
  { id: 3, name: "Ravinder Singh", regNo: "73152313052", dept: "CSE", year: "III", section: "B", phone: "7845014685", date: "25-02-2025", status: "-" },
  { id: 4, name: "Divam Balwal", regNo: "73152313061", dept: "CSE", year: "III", section: "B", phone: "6369123456", date: "25-02-2025", status: "-" },
  { id: 5, name: "Mohammed Ashik M", regNo: "73152313075", dept: "CSE", year: "III", section: "A", phone: "9380171449", date: "25-02-2025", status: "-" },
  { id: 6, name: "Gowrinath", regNo: "73152313088", dept: "CSE", year: "III", section: "B", phone: "7812845645", date: "25-02-2025", status: "-" },
];

export default function AdminTrainAttendanceStuinfo({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTraining, setActiveTraining] = useState("R-Sequence");
  const [activeBatch, setActiveBatch] = useState("Batch-1");
  const [students, setStudents] = useState(studentData);
  const [pendingChanges, setPendingChanges] = useState({});

  const [filters, setFilters] = useState({
    dept: "",
    name: "",
    regNo: "",
    section: "",
    date: "",
  });
  const [statusFilter, setStatusFilter] = useState("all"); // all, present, absent
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [open, setOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    const deptQ = (filters.dept || "").trim().toLowerCase();
    const nameQ = (filters.name || "").trim().toLowerCase();
    const regNoQ = (filters.regNo || "").trim().toLowerCase();
    const sectionQ = (filters.section || "").trim().toLowerCase();
    const dateQ = (filters.date || "").trim().toLowerCase();

    return students.filter((s) => {
      // Department filter
      const deptMatch = !deptQ || (s.dept || "").toLowerCase() === deptQ;
      // Name filter
      const nameMatch = !nameQ || (s.name || "").toLowerCase().includes(nameQ);
      // Register No filter
      const regNoMatch = !regNoQ || (s.regNo || "").toLowerCase().includes(regNoQ);
      // Section filter
      const sectionMatch = !sectionQ || (s.section || "").toLowerCase() === sectionQ;
      // Date filter
      const dateMatch = !dateQ || (s.date && s.date.includes(dateQ));
      // Status filter
      const statusMatch = statusFilter === "all" || s.status.toLowerCase() === statusFilter;
      return deptMatch && nameMatch && regNoMatch && sectionMatch && dateMatch && statusMatch;
    });
  }, [students, filters.dept, filters.name, filters.regNo, filters.section, filters.date, statusFilter]);

  const handleCheckboxChange = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(students.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStatusUpdate = (id, status) => {
    setPendingChanges((prev) => ({ ...prev, [id]: status }));
  };

  const handleBatchStatusUpdate = (status) => {
    if (selectedStudents.length === 0) return;
    const updates = {};
    selectedStudents.forEach((id) => {
      updates[id] = status;
    });
    setPendingChanges((prev) => ({ ...prev, ...updates }));
  };

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showDeleteSuccessPopup, setShowDeleteSuccessPopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddSuccessPopup, setShowAddSuccessPopup] = useState(false);
  const [showUpdateSuccessPopup, setShowUpdateSuccessPopup] = useState(false);
  // Filter button logic
  const handleFilterClick = () => {
    // No-op: filteredStudents is already reactive to filters
    // Optionally, you can add feedback or animation here
  };

  const handleUpdateClick = () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setStudents((prev) =>
      prev.map((s) =>
        pendingChanges[s.id] ? { ...s, status: pendingChanges[s.id] } : s
      )
    );
    setPendingChanges({});
    setTimeout(() => setShowUpdateSuccessPopup(true), 50);
  };

  const handleCloseUpdateSuccess = () => {
    setShowUpdateSuccessPopup(false);
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const handleRemoveStudents = () => {
    if (selectedStudents.length === 0) return;
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    // Simulate deletion process
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStudents((prev) => prev.filter((s) => !selectedStudents.includes(s.id)));
    setSelectedStudents([]);
    setIsDeleting(false);
    setShowDeletePopup(false);
    setShowDeleteSuccessPopup(true);
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
  };

  const handleCloseDeleteSuccess = () => {
    setShowDeleteSuccessPopup(false);
  };

  const handleOpenAddPopup = () => {
    if (selectedStudents.length === 0) return;
    setShowAddSuccessPopup(true);
  };

  const handleCloseAddPopup = () => {
    setShowAddSuccessPopup(false);
  };

  const simulateExport = async (type, exportFn) => {
    setOpen(false);
    setExportType(type);
    setExportProgress(0);
    setExportPopupState('progress');

    let progressInterval;
    let progressTimeout;

    try {
      // Simulate progress from 0 to 100
      progressInterval = setInterval(() => {
        setExportProgress((prev) => Math.min(prev + 10, 100));
      }, 200);

      // Wait for progress animation to complete
      await new Promise((resolve) => {
        progressTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          resolve();
        }, 2000);
      });

      // Perform the actual export
      const result = await exportFn();

      if (result !== false) {
        setExportProgress(100);
        setExportPopupState('success');
      } else {
        setExportPopupState('failed');
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      if (progressTimeout) clearTimeout(progressTimeout);
      setExportPopupState('failed');
    }
  };

  const exportToExcel = async () => {
    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      const rows = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Name": student.name,
        "Register Number": student.regNo,
        "Department": student.dept,
        "Year": student.year,
        "Section": student.section,
        "Phone No": student.phone,
        "Date": student.date,
        "Status": student.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },   // S.No
        { wch: 20 },  // Name
        { wch: 18 },  // Register Number
        { wch: 12 },  // Department
        { wch: 5 },   // Year
        { wch: 8 },   // Section
        { wch: 12 },  // Phone No
        { wch: 12 },  // Date
        { wch: 10 }   // Status
      ];

      XLSX.writeFile(workbook, "attendance_data.xlsx");
      return true;
    } catch (error) {
      console.error('Excel export error:', error);
      return false;
    }
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const head = [[
        'S.No',
        'Name',
        'Register Number',
        'Department',
        'Year',
        'Section',
        'Phone No',
        'Date',
        'Status',
      ]];

      const body = filteredStudents.map((student, index) => [
        index + 1,
        student.name,
        student.regNo,
        student.dept,
        student.year,
        student.section,
        student.phone,
        student.date,
        student.status,
      ]);

      doc.text('Attendance Report', 14, 15);
      autoTable(doc, {
        head,
        body,
        startY: 20,
        styles: { fontSize: 8 },
      });

      doc.save('attendance_data.pdf');
      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      return false;
    }
  };

  const handleExportExcel = () => {
    simulateExport("Excel", exportToExcel);
  };

  const handleExportPDF = () => {
    simulateExport("PDF", exportToPDF);
  };

  return (
    <div className={styles["ad-train-att-main-wrapper"] + " " + styles["ad-train-att-page"]}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles["ad-train-att-main-layout"]}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
        />
        <div className={styles["ad-train-att-content-area"]}>
          <div className={styles["ad-train-att-container"]}>
            {/* Top Row - Two Columns */}
            <div className={styles["ad-train-att-top-row"]}>
              {/* Left: Filter Section */}
              <div className={styles["ad-train-att-filter-card"]}>
                <div className={styles["ad-train-att-filter-tabs-container"]}>
                  <button className={styles["ad-train-att-filter-tab-button"]} type="button">
                    Phase - I
                  </button>
                </div>

                <div className={styles["ad-train-att-filter-fields-container"]}>
                  {/* First Row: Department and Name */}
                  <div className={styles["ad-train-att-filter-fields-row"]}>
                    {/* Department Dropdown with Static Label */}
                    <div className={styles["ad-train-att-filter-field-wrapper"]}>
                      <label className={styles["ad-train-att-static-label"]} htmlFor="ad-train-att-filter-dept" style={{ color: '#d3d3d3' }}>
                        Department
                      </label>
                      <select
                        id="ad-train-att-filter-dept"
                        className={styles["ad-train-att-filter-input"]}
                        required
                        value={filters.dept || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, dept: e.target.value }))
                        }
                      >
                        <option value="" disabled>Select Department</option>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="MECH">MECH</option>
                        <option value="CIVIL">CIVIL</option>
                      </select>
                    </div>

                    {/* Name Input with Static Label */}
                    <div className={styles["ad-train-att-filter-field-wrapper"]}>
                      <label className={styles["ad-train-att-static-label"]} htmlFor="ad-train-att-filter-name">
                        Name
                      </label>
                      <input
                        id="ad-train-att-filter-name"
                        className={styles["ad-train-att-filter-input"] + " " + styles["ad-train-att-filter-input-green"]}
                        type="text"
                        placeholder="Name"
                        required
                        value={filters.name || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {/* Second Row: Register No and Section Dropdown */}
                  <div className={styles["ad-train-att-filter-fields-row"]}>
                    {/* Register No Input with Static Label */}
                    <div className={styles["ad-train-att-filter-field-wrapper"]}>
                      <label className={styles["ad-train-att-static-label"]} htmlFor="ad-train-att-filter-regno">
                        Register No
                      </label>
                      <input
                        id="ad-train-att-filter-regno"
                        className={styles["ad-train-att-filter-input"]}
                        type="text"
                        placeholder="Register No"
                        required
                        value={filters.regNo || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, regNo: e.target.value }))
                        }
                      />
                    </div>

                    {/* Section Dropdown with Static Label */}
                    <div className={styles["ad-train-att-filter-field-wrapper"]}>
                      <label className={styles["ad-train-att-static-label"]} htmlFor="ad-train-att-filter-section">
                        Section
                      </label>
                      <select
                        id="ad-train-att-filter-section"
                        className={styles["ad-train-att-filter-input"]}
                        required
                        value={filters.section || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, section: e.target.value }))
                        }
                      >
                        <option value="" disabled>Select Section</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>

                  {/* Third Row: Date Picker and Filter Button */}
                  <div className={styles["ad-train-att-filter-fields-row"]}>
                    {/* Date Picker with Static Label */}
                    <div className={styles["ad-train-att-filter-field-wrapper"]}>
                      <label className={styles["ad-train-att-static-label"]} htmlFor="ad-train-att-filter-date">
                        Date
                      </label>
                      <input
                        id="ad-train-att-filter-date"
                        className={styles["ad-train-att-filter-input"]}
                        type="date"
                        value={filters.date || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, date: e.target.value }))
                        }
                      />
                    </div>
                    {/* Filter Button */}
                    <div className={styles["ad-train-att-filter-field-wrapper"]}>
                      <label className={styles["ad-train-att-static-label"]} style={{ visibility: 'hidden' }}>
                        Button
                      </label>
                      <button
                        type="button"
                        className={styles["ad-train-att-filter-btn-green"]}
                        onClick={handleFilterClick}
                      >
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Buttons Section (no card) */}
              <div className={styles["ad-train-att-buttons-section"]}>
                <div className={styles["ad-train-att-buttons-white-card"]}>
                  {/* Training Sequence Buttons */}
                  <div className={styles["ad-train-att-training-buttons-row"]}>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "R-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("R-Sequence")}
                    >
                      R - Sequence
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "X-Plore" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("X-Plore")}
                    >
                      X - Plore
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "Z-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("Z-Sequence")}
                    >
                      Z - Sequence
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "A-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("A-Sequence")}
                    >
                      A - Sequence
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "B-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("B-Sequence")}
                    >
                      B - Sequence
                    </button>
                  </div>

                  <div className={styles["ad-train-att-buttons-divider"]} />

                  {/* Batch Buttons */}
                  <div className={styles["ad-train-att-batch-buttons-row"]}>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-1" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-1")}
                    >
                      Batch - 1
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-2" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-2")}
                    >
                      Batch - 2
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-3" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-3")}
                    >
                      Batch - 3
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-4" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-4")}
                    >
                      Batch - 4
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-5" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-5")}
                    >
                      Batch - 5
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles["ad-train-att-action-buttons-row"]}>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-present-btn"]} ${statusFilter === 'present' ? styles.active : ''}`} 
                    onClick={() => handleBatchStatusUpdate('Present')}
                  >
                    Present
                  </button>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-absent-btn"]} ${statusFilter === 'absent' ? styles.active : ''}`} 
                    onClick={() => handleBatchStatusUpdate('Absent')}
                  >
                    Absent
                  </button>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-add-btn"]} ${statusFilter === 'add' ? styles.active : ''}`} 
                    onClick={handleOpenAddPopup}
                    disabled={selectedStudents.length === 0}
                  >
                    Add
                  </button>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-remove-btn"]}`} 
                    onClick={handleRemoveStudents}
                    disabled={selectedStudents.length === 0}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Attendance Table Section */}
            <div className={styles["ad-train-att-table-section"]}>
              <div className={styles["ad-train-att-table-header"]}>
                <h2 className={styles["ad-train-att-table-title"]}>ATTENDANCE DETAILS</h2>
                <div className={styles['Admin-DB-print-button-container']}>
                  <button
                    className={styles['Admin-DB-print-btn']}
                    onClick={() => setOpen(!open)}
                  >
                    Print
                  </button>
                  {open && (
                    <div className={styles['Admin-DB-export-menu']}>
                      <button onClick={handleExportExcel}>Export to Excel</button>
                      <button onClick={handleExportPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles["ad-train-att-table-wrapper"]}>
                <table className={`${styles["ad-train-att-table"]} attendance-table`}>
                  <thead>
                    <tr>
                      <th className={styles["ad-train-att-col-select"]}>Select</th>
                      <th className={styles["ad-train-att-col-sno"]}>S.No</th>
                      <th className={styles["ad-train-att-col-name"]}>Name</th>
                      <th className={styles["ad-train-att-col-reg"]}>Register Number</th>
                      <th className={styles["ad-train-att-col-dept"]}>Department</th>
                      <th className={styles["ad-train-att-col-year"]}>Year</th>
                      <th className={styles["ad-train-att-col-section"]}>Section</th>
                      <th className={styles["ad-train-att-col-phone"]}>Phone No</th>
                      <th className={styles["ad-train-att-col-date"]}>Date</th>
                      <th className={styles["ad-train-att-col-view"]}>View</th>
                      <th className={styles["ad-train-att-col-status"]}>Status</th>
                      <th className={styles["ad-train-att-col-action"]}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => {
                      const displayStatus = pendingChanges[student.id] || student.status;
                      return (
                        <tr key={student.id} className={selectedStudents.includes(student.id) ? styles['selected-row'] : ''}>
                          <td className={styles["ad-train-att-col-select"]}>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleCheckboxChange(student.id)}
                            />
                          </td>
                          <td className={styles["ad-train-att-col-sno"]}>{index + 1}</td>
                          <td className={styles["ad-train-att-col-name"]}>{student.name}</td>
                          <td className={styles["ad-train-att-col-reg"]}>{student.regNo}</td>
                          <td className={styles["ad-train-att-col-dept"]}>{student.dept}</td>
                          <td className={styles["ad-train-att-col-year"]}>{student.year}</td>
                          <td className={styles["ad-train-att-col-section"]}>{student.section}</td>
                          <td className={styles["ad-train-att-col-phone"]}>{student.phone}</td>
                          <td className={styles["ad-train-att-col-date"]}>{student.date || '-'}</td>
                          <td className={styles["ad-train-att-col-view"]}>
                            <img src={eyeicon} alt="View Details" className={styles["ad-train-att-eye-icon"]} />
                          </td>
                          <td className={styles["ad-train-att-col-status"]}>
                            <span className={`${styles["ad-train-att-status-text"]} ${styles[`ad-train-att-${displayStatus.toLowerCase()}`]}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className={styles["ad-train-att-col-action"]}>
                            <div className={styles["ad-train-att-action-btns"]}>
                              <button className={styles["ad-train-att-present-small-btn"]} onClick={() => handleStatusUpdate(student.id, "Present")}>Present</button>
                              <button className={styles["ad-train-att-absent-small-btn"]} onClick={() => handleStatusUpdate(student.id, "Absent")}>Absent</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions inside Table */}
              <div className={styles["ad-train-att-bottom-actions"]}>
                <button 
                  className={styles["ad-train-att-discard-btn"]} 
                  onClick={handleDiscard}
                >
                  Discard
                </button>
                <button 
                  className={styles["ad-train-att-update-btn"]} 
                  onClick={handleUpdateClick}
                  disabled={!hasPendingChanges}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <DeleteConfirmationPopup
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          selectedCount={selectedStudents.length}
          isDeleting={isDeleting}
        />
      )}

      {/* Delete Success Popup */}
      {showDeleteSuccessPopup && (
        <DeleteSuccessPopup onClose={handleCloseDeleteSuccess} />
      )}

      <AttenTrainAddedPopup
        isOpen={showAddSuccessPopup}
        onClose={handleCloseAddPopup}
        selectedCount={selectedStudents.length}
      />

      <UpdateSuccessPopup isOpen={showUpdateSuccessPopup} onClose={handleCloseUpdateSuccess} />

      {/* Export Popup using Eligible Students components */}
      <ExportProgressAlert
        isOpen={exportPopupState === 'progress'}
        onClose={() => {}}
        progress={exportProgress}
        exportType={exportType}
        color="#4EA24E"
        progressColor="#4EA24E"
      />
      <ExportSuccessAlert
        isOpen={exportPopupState === 'success'}
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
        color="#4EA24E"
      />
      <ExportFailedAlert
        isOpen={exportPopupState === 'failed'}
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
        color="#4EA24E"
      />
    </div>
  );
}
