import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import mongoDBService from '../services/mongoDBService';

import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import styles from './Coo_CompanyDriveView.module.css';
import Adminicon from '../assets/Adminicon.png';

const initialFormData = {
  companyName: '',
  mode: '',
  jobRole: '',
  branch: '',
  eligibleBranches: [],
  rounds: 0,
  package: '',
  companyType: '',
  bondPeriod: '',
  startingDate: null,
  endingDate: null,
  domain: '',
  hrName: '',
  hrContact: '',
  status: '',
  visitDate: '',
  location: '',
  roundDetails: []
};

const formatDateForInput = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  const dateObj = new Date(dateValue);
  return Number.isNaN(dateObj.getTime()) ? null : dateObj;
};

const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return '';
  if (dateValue instanceof Date) {
    return dateValue.toLocaleDateString('en-GB');
  }
  if (typeof dateValue === 'string') {
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) return dateValue;
    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB');
    }
  }
  return String(dateValue);
};

const mapDriveToForm = (drive = {}) => {
  const roundsFromData = typeof drive.rounds === 'number'
    ? drive.rounds
    : typeof drive.round === 'number'
      ? drive.round
      : Array.isArray(drive.roundDetails)
        ? drive.roundDetails.length
        : 0;

  const roundDetails = Array.isArray(drive.roundDetails) ? drive.roundDetails : new Array(roundsFromData).fill('');

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
    package: drive.package || '',
    companyType: drive.companyType || '',
    bondPeriod: drive.bondPeriod || '',
    startingDate: formatDateForInput(drive.startingDate),
    endingDate: formatDateForInput(drive.endingDate),
    domain: drive.domain || '',
    hrName: drive.hrName || '',
    hrContact: drive.hrContact || '',
    status: drive.status || '',
    visitDate: formatDateForInput(drive.visitDate),
    location: drive.location || '',
    roundDetails
  };
};

export default function CooCompanyDriveView({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showDepartmentPopup, setShowDepartmentPopup] = useState(false);


  useEffect(() => {
    const fetchBranches = async () => {
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
    fetchBranches();
  }, []);

  useEffect(() => {
    const drive = location.state?.editingDrive;
    if (!drive) {
      navigate('/coo-company-drive');
      return;
    }
    const formState = mapDriveToForm(drive);
    setFormData(formState);
    setSelectedDepartments(formState.eligibleBranches || []);
  }, [location.state, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
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

  const handleDepartmentClose = () => {
    setShowDepartmentPopup(false);
  };

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} onLogout={onLogout} />
      <div className={styles['co-cdv-layout']}>
        <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="company-drive" onViewChange={onViewChange} />
        <div className={styles['co-cdv-main-content']}>
          <div className={styles['co-cdv-container']}>
            <div className={styles['co-cdv-left-section']}>
              <div className={styles['co-cdv-header-section']}>
                <h2 className={styles['co-cdv-section-title']}>View Company Drive</h2>
                <button className={styles['co-cdv-back-button']} onClick={() => navigate('/coo-company-drive')} type="button">
                  ← Back
                </button>
              </div>

              <div className={styles['co-cdv-form-grid']}>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Company Name</label>
                  <input type="text" value={formData.companyName} className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Mode</label>
                  <input type="text" value={formData.mode} className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Job Role</label>
                  <input type="text" value={formData.jobRole} className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']} style={{ position: 'relative' }}>
                  <label className={styles['co-cdv-label']}>Eligible Branches</label>
                  <button type="button" onClick={() => setShowDepartmentPopup(true)} className={styles['co-cdv-input']} style={{ textAlign: 'left', cursor: 'default' }} disabled>
                    {selectedDepartments.length > 0 ? `${selectedDepartments.length} Department${selectedDepartments.length > 1 ? 's' : ''} Selected` : 'Select Departments'}
                  </button>
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Rounds</label>
                  <input type="text" value={formData.rounds} className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Package</label>
                  <input type="text" value={formData.package} className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Company Type</label>
                  <input type="text" value={formData.companyType} className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Bond Period</label>
                  <input type="text" value={formData.bondPeriod} className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Start Date</label>
                  <DatePicker selected={formData.startingDate} dateFormat="dd-MM-yyyy" placeholderText="Start Date" className={styles['co-cdv-input']} disabled readOnly />
                </div>
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>End Date</label>
                  <DatePicker selected={formData.endingDate} dateFormat="dd-MM-yyyy" placeholderText="End Date" className={styles['co-cdv-input']} disabled readOnly />
                </div>
              </div>

              <div className={styles['co-cdv-round-section']}>
                <h3 className={styles['co-cdv-round-title']}>Round Details</h3>
                <div className={styles['co-cdv-round-grid']}>
                  {formData.roundDetails.length === 0 && (
                    <div className={styles['co-cdv-round-placeholder']}>No round details available.</div>
                  )}
                  {formData.roundDetails.map((roundValue, index) => (
                    <div className={styles['co-cdv-round-item']} key={index}>
                      <label>Round {index + 1} :</label>
                      <input type="text" value={roundValue} className={styles['co-cdv-round-input']} disabled readOnly />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles['co-cdv-right-section']}>
              <h2 className={styles['co-cdv-section-title']}>Company Details</h2>
              <div className={styles['co-cdv-details-container']}>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Company Name</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.companyName || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Domain</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.domain || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Job Role</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.jobRole || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Mode</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.mode || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>HR Name</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.hrName || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>HR Contact</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.hrContact || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Rounds</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.rounds || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Eligible Branches</label>
                  <div className={styles['co-cdv-detail-value']}>{selectedDepartments.length ? selectedDepartments.join(', ') : formData.branch || '—'}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Status</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.status || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Visit Date</label>
                  <div className={styles['co-cdv-detail-value']}>{formatDateForDisplay(formData.visitDate)}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Package</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.package || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Location</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.location || ''}</div>
                </div>
                <div className={styles['co-cdv-detail-row']}>
                  <label>Bond Period</label>
                  <div className={styles['co-cdv-detail-value']}>{formData.bondPeriod || ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Selection Popup */}
      {showDepartmentPopup && (
        <div className={styles['co-cdv-dept-popup-overlay']} onClick={handleDepartmentClose}>
          <div className={styles['co-cdv-dept-popup-container']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['co-cdv-dept-popup-header']}>
              Departments : {selectedDepartments.length}
            </div>
            <div className={styles['co-cdv-dept-popup-content']}>
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
                    className={`${styles['co-cdv-dept-item']} ${isSelected ? styles['co-cdv-dept-item-selected'] : ''}`}
                    onClick={() => handleDepartmentToggle(deptValue)}
                  >
                    <div className={styles['co-cdv-dept-checkbox']}>
                      {isSelected && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6.5 11.5L13 5" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className={styles['co-cdv-dept-label']}>{deptLabel}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles['co-cdv-dept-popup-actions']}>
              <button
                className={styles['co-cdv-dept-btn-close']}
                onClick={handleDepartmentClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
