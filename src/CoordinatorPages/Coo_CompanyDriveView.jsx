import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Ad_Calendar from '../components/Calendar/Ad_Calendar';
import FormDropdown from '../components/common/FormDropdown/FormDropdown';

import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import styles from './Coo_CompanyDriveView.module.css';
import mongoDBService from '../services/mongoDBService';
import Adminicon from '../assets/Adminicon.png';
import { normalizeSkillCategories } from '../utils/skillUtils';

const initialFormData = {
  companyName: '',
  mode: '',
  jobRole: '',
  batchStart: '',
  batchEnd: '',
  branch: '',
  eligibleBranches: [],
  rounds: 0,
  package: '',
  companyType: '',
  bondPeriod: '',
  startingDate: '',
  endingDate: '',
  domain: '',
  hrName: '',
  hrContact: '',
  status: '',
  visitDate: '',
  location: '',
  internship: 'No',
  internshipDuration: '',
  stipend: '',
  coreSkills: normalizeSkillCategories([]),
  roundDetails: [],
  roundDates: []
};

const formatDateForCalendar = (dateValue) => {
  if (!dateValue) return '';
  const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(dateObj.getTime())) {
    return '';
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
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

  const roundDates = Array.isArray(drive.roundDates)
    ? drive.roundDates
    : new Array(roundsFromData).fill('');

  const batchStartVal = drive.batchStart || (drive.eligibleBatch ? drive.eligibleBatch.split('-')[0] : drive.batch ? drive.batch.split('-')[0] : '');
  const batchEndVal = drive.batchEnd || (drive.eligibleBatch ? drive.eligibleBatch.split('-')[1] : drive.batch ? drive.batch.split('-')[1] : '');

  return {
    ...initialFormData,
    companyName: drive.companyName || '',
    mode: drive.mode || '',
    jobRole: drive.jobRole || '',
    batchStart: batchStartVal || '',
    batchEnd: batchEndVal || '',
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
    startingDate: formatDateForCalendar(drive.startingDate || drive.driveStartDate || drive.companyDriveDate),
    endingDate: formatDateForCalendar(drive.endingDate || drive.driveEndDate),
    domain: drive.domain || '',
    hrName: drive.hrName || '',
    hrContact: drive.hrContact || '',
    status: drive.status || '',
    visitDate: drive.visitDate ? formatDateForCalendar(drive.visitDate) : '',
    location: drive.location || '',
    internship: drive.internship || 'No',
    internshipDuration: drive.internshipDuration || '',
    stipend: drive.stipend || '',
    coreSkills: normalizeSkillCategories(
      Array.isArray(drive.coreSkills) && drive.coreSkills.length > 0
        ? drive.coreSkills
        : Array.isArray(drive.skills) && drive.skills.length > 0
          ? drive.skills
          : []
    ),
    roundDetails,
    roundDates
  };
};

function CooCompanyDriveView({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showDepartmentPopup, setShowDepartmentPopup] = useState(false);

  const durationText = useMemo(() => {
    if (!formData.startingDate || !formData.endingDate) return '—';
    const start = parseLocalDate(formData.startingDate);
    const end = parseLocalDate(formData.endingDate);
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
    return diffDays >= 1 ? `${diffDays} ${diffDays > 1 ? 'Days' : 'Day'}` : '—';
  }, [formData.startingDate, formData.endingDate]);

  const daysLeftText = useMemo(() => {
    if (!formData.startingDate) return '—';
    const start = parseLocalDate(formData.startingDate);
    const end = formData.endingDate ? parseLocalDate(formData.endingDate) : null;
    if (!start || Number.isNaN(start.getTime())) return '—';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((start.getTime() - today.getTime()) / dayMs);

    if (diffDays < 0) {
      if (end && today.getTime() <= end.getTime()) {
        return 'Active';
      }
      return 'Ended';
    } else if (diffDays === 0) {
      return 'Starts Today';
    } else {
      return `${diffDays} ${diffDays > 1 ? 'Days' : 'Day'}`;
    }
  }, [formData.startingDate, formData.endingDate]);

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
    const loadDriveData = async () => {
      let drive = location.state?.editingDrive || location.state?.company;
      const driveId = location.state?.editingDriveId || drive?._id || drive?.id;

      if (!drive && driveId) {
        try {
          const drives = await mongoDBService.getCompanyDrives();
          drive = (drives || []).find(d => String(d._id || d.id) === String(driveId));
        } catch (err) {
          console.error("Failed to load drive:", err);
        }
      }

      if (!drive) {
        navigate('/coo-company-drive');
        return;
      }

      const formState = mapDriveToForm(drive);
      setFormData(formState);
      setSelectedDepartments(formState.eligibleBranches || []);
    };

    loadDriveData();
  }, [location.state, navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} onLogout={onLogout} />
      <div className={styles['co-cdv-layout']}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="company-drive"
          onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className={styles['co-cdv-main-content']}>
          <div className={styles['co-cdv-container']}>

            {/* Left Section - View Company Drive */}
            <div className={styles['co-cdv-left-section']}>
              <div className={styles['co-cdv-header-section']}>
                <h2 className={styles['co-cdv-section-title']}>
                  View Company Drive
                </h2>
                <button
                  className={styles['co-cdv-back-button']}
                  onClick={() => navigate('/coo-company-drive')}
                  type="button"
                >
                  Back
                </button>
              </div>

              <div className={styles['co-cdv-form-grid']}>
                {/* 1. Company Name */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Company Name</label>
                  <FormDropdown
                    id="companyName-dropdown"
                    options={formData.companyName ? [{ label: formData.companyName, value: formData.companyName }] : []}
                    selectedOption={formData.companyName}
                    onSelect={() => {}}
                    placeholder="Select Company"
                    disabled={true}
                    role="coordinator"
                    className={styles['co-cdv-dropdown-wrapper']}
                    headerClassName={styles['co-cdv-dropdown-header']}
                  />
                </div>

                {/* 2. Mode */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Mode</label>
                  <FormDropdown
                    id="mode-dropdown"
                    options={['Online', 'Offline', 'Hybrid']}
                    selectedOption={formData.mode}
                    onSelect={() => {}}
                    placeholder="Select Mode"
                    disabled={true}
                    role="coordinator"
                    className={styles['co-cdv-dropdown-wrapper']}
                    headerClassName={styles['co-cdv-dropdown-header']}
                  />
                </div>

                {/* 3. Job Role */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Job Role</label>
                  <input
                    type="text"
                    name="jobRole"
                    value={formData.jobRole}
                    className={styles['co-cdv-input']}
                    readOnly
                    disabled
                  />
                </div>

                {/* 4. Eligible Batch */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Eligible Batch</label>
                  <div className={styles['co-cdv-batch-wrapper']}>
                    <input
                      type="text"
                      name="batchStart"
                      value={formData.batchStart}
                      className={styles['co-cdv-batch-input']}
                      readOnly
                      disabled
                    />
                    <span className={styles['co-cdv-batch-separator']}>-</span>
                    <input
                      type="text"
                      name="batchEnd"
                      value={formData.batchEnd}
                      className={styles['co-cdv-batch-input']}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* 5. Branches */}
                <div className={styles['co-cdv-form-group']} style={{ position: 'relative' }}>
                  <label className={styles['co-cdv-label']}>Branches</label>
                  <button
                    type="button"
                    onClick={() => setShowDepartmentPopup(true)}
                    className={styles['co-cdv-input']}
                    style={{ textAlign: 'left', cursor: 'pointer', paddingRight: '45px' }}
                  >
                    {formData.eligibleBranches && formData.eligibleBranches.length > 0
                      ? `${formData.eligibleBranches.length} Branch${formData.eligibleBranches.length > 1 ? 'es' : ''} Selected`
                      : 'Select Branches'}
                  </button>
                  <div style={{
                    position: 'absolute',
                    right: '10px',
                    top: 'calc(50% + 10px)',
                    transform: 'translateY(-50%)',
                    width: '28px',
                    height: '28px',
                    backgroundColor: '#d23b42',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 6. Rounds */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>
                    {formData.rounds > 1 ? 'Rounds' : 'Round'}
                  </label>
                  <input
                    type="number"
                    name="rounds"
                    value={formData.rounds === 0 ? '' : formData.rounds}
                    className={styles['co-cdv-input']}
                    readOnly
                    disabled
                  />
                </div>

                {/* 7. Package */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Package</label>
                  <div className={styles['co-cdv-input-with-chip']}>
                    <input
                      type="text"
                      name="package"
                      value={formData.package}
                      className={styles['co-cdv-input']}
                      readOnly
                      disabled
                    />
                    <span className={styles['co-cdv-chip']}>LPA</span>
                  </div>
                </div>

                {/* 8. Company Type */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Company Type</label>
                  <FormDropdown
                    id="companyType-dropdown"
                    options={['CORE', 'IT', 'ITES(BPO/KPO)', 'Marketing & Sales', 'HR / Business analyst']}
                    selectedOption={formData.companyType}
                    onSelect={() => {}}
                    placeholder="Select Company Type"
                    disabled={true}
                    role="coordinator"
                    className={styles['co-cdv-dropdown-wrapper']}
                    headerClassName={styles['co-cdv-dropdown-header']}
                  />
                </div>

                {/* 9. Bond Period */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Bond Period</label>
                  <div className={styles['co-cdv-input-with-chip']}>
                    <input
                      type="text"
                      name="bondPeriod"
                      value={formData.bondPeriod}
                      className={styles['co-cdv-input']}
                      readOnly
                      disabled
                    />
                    <span className={styles['co-cdv-chip']}>
                      {formData.bondPeriod > 1 ? 'Years' : 'Year'}
                    </span>
                  </div>
                </div>

                {/* 10. Start Date */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Start Date</label>
                  <div className={styles['co-cdv-datepicker-wrapper']} style={{ pointerEvents: 'none', opacity: '0.85' }}>
                    <Ad_Calendar
                      value={formData.startingDate}
                      onChange={() => {}}
                      themeColor="#d23b42"
                      hoverColor="#fbebeb"
                      disabled={true}
                      style={{ backgroundColor: '#fff9f9', height: '53.6px', padding: '0 0.9rem', borderColor: '#f4dddd' }}
                    />
                  </div>
                </div>

                {/* 11. End Date */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>End Date</label>
                  <div className={styles['co-cdv-datepicker-wrapper']} style={{ pointerEvents: 'none', opacity: '0.85' }}>
                    <Ad_Calendar
                      value={formData.endingDate}
                      onChange={() => {}}
                      themeColor="#d23b42"
                      hoverColor="#fbebeb"
                      disabled={true}
                      style={{ backgroundColor: '#fff9f9', height: '53.6px', padding: '0 0.9rem', borderColor: '#f4dddd' }}
                    />
                  </div>
                </div>

                {/* 12. Days Left */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Days Left</label>
                  <input
                    type="text"
                    value={daysLeftText}
                    className={styles['co-cdv-input']}
                    readOnly
                    disabled
                    style={{ cursor: 'not-allowed', color: '#666666' }}
                  />
                </div>

                {/* 13. Duration of Drive */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Duration of Drive</label>
                  <input
                    type="text"
                    value={durationText}
                    className={styles['co-cdv-input']}
                    readOnly
                    disabled
                    style={{ cursor: 'not-allowed', color: '#666666' }}
                  />
                </div>

                {/* 14. Internship */}
                <div className={styles['co-cdv-form-group']}>
                  <label className={styles['co-cdv-label']}>Internship</label>
                  <FormDropdown
                    id="internship-dropdown"
                    options={['Yes', 'No']}
                    selectedOption={formData.internship || 'No'}
                    onSelect={() => {}}
                    placeholder="Select Internship"
                    disabled={true}
                    role="coordinator"
                    className={styles['co-cdv-dropdown-wrapper']}
                    headerClassName={styles['co-cdv-dropdown-header']}
                  />
                </div>

                {/* 15 & 16. Internship Details */}
                {formData.internship === 'Yes' && (
                  <>
                    <div className={styles['co-cdv-form-group']}>
                      <label className={styles['co-cdv-label']}>Duration</label>
                      <FormDropdown
                        id="internshipDuration-dropdown"
                        options={[
                          '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months',
                          '7 Months', '8 Months', '9 Months', '10 Months', '11 Months', '12 Months'
                        ]}
                        selectedOption={formData.internshipDuration}
                        onSelect={() => {}}
                        placeholder="Select Duration"
                        disabled={true}
                        role="coordinator"
                        className={styles['co-cdv-dropdown-wrapper']}
                        headerClassName={styles['co-cdv-dropdown-header']}
                      />
                    </div>

                    <div className={styles['co-cdv-form-group']}>
                      <label className={styles['co-cdv-label']}>Stipend</label>
                      <div className={styles['co-cdv-input-with-chip']}>
                        <input
                          type="text"
                          name="stipend"
                          value={formData.stipend}
                          className={styles['co-cdv-input']}
                          readOnly
                          disabled
                        />
                        <span className={styles['co-cdv-chip']}>/ Month</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Core Skills Section */}
              <div className={styles['co-cdv-skills-section']}>
                <h3 className={styles['co-cdv-skills-title']}>Core Skills</h3>
                <div className={styles['co-cdv-skills-list']}>
                  {(formData.coreSkills || []).length === 0 || !(formData.coreSkills || []).some(c => c.items && c.items.length > 0) ? (
                    <div style={{ color: '#777', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                      No core skills specified.
                    </div>
                  ) : (
                    (formData.coreSkills || []).map((cat, catIndex) => (
                      <div key={catIndex} className={styles['co-cdv-skills-row']}>
                        <div className={styles['co-cdv-skill-category-field']}>
                          <div className={styles['co-cdv-skill-label-box']}>
                            {cat.category}
                          </div>
                        </div>
                        <div className={styles['co-cdv-skills-chips-container']}>
                          {(cat.items || []).map((skill, i) => (
                            <span key={i} className={styles['co-cdv-skill-chip']}>
                              {skill}
                            </span>
                          ))}
                          {(!cat.items || cat.items.length === 0) && (
                            <span style={{ color: '#999', fontSize: '0.88rem', fontStyle: 'italic' }}>—</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Round Details Section */}
              <div className={styles['co-cdv-round-section']}>
                <h3 className={styles['co-cdv-round-title']}>Round Details</h3>
                <div className={styles['co-cdv-round-grid']}>
                  {formData.roundDetails.length === 0 && (
                    <div className={styles['co-cdv-round-placeholder']}>
                      No round details available.
                    </div>
                  )}

                  {formData.roundDetails.map((roundValue, index) => (
                    <div className={styles['co-cdv-round-item']} key={index}>
                      <label style={{ minWidth: '85px' }}>Round {index + 1} :</label>
                      <input
                        type="text"
                        value={roundValue}
                        placeholder="Round Name"
                        className={styles['co-cdv-round-input']}
                        readOnly
                        disabled
                      />
                      <div className={styles['co-cdv-round-date-wrapper']}>
                        <Ad_Calendar
                          value={formData.roundDates ? formData.roundDates[index] : ''}
                          onChange={() => {}}
                          disabled={true}
                          themeColor="#d23b42"
                          hoverColor="#fbebeb"
                          style={{ height: '48px', width: '100%', boxSizing: 'border-box', padding: '0 0.8rem', backgroundColor: '#fff9f9', borderColor: '#f4dddd' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section - Company Details */}
            {formData.companyName && (
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
                    <label>{formData.rounds > 1 ? 'Rounds' : 'Round'}</label>
                    <div className={styles['co-cdv-detail-value']}>{formData.rounds === 0 ? '' : formData.rounds}</div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Eligible Batch</label>
                    <div className={styles['co-cdv-detail-value']}>
                      {formData.batchStart && formData.batchEnd
                        ? `${formData.batchStart} - ${formData.batchEnd}`
                        : formData.batchStart || formData.batchEnd || '—'}
                    </div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Eligible Branches</label>
                    <div className={styles['co-cdv-detail-value']}>
                      {formData.eligibleBranches && formData.eligibleBranches.length
                        ? formData.eligibleBranches.join(', ')
                        : formData.branch || '—'}
                    </div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Status</label>
                    <div className={styles['co-cdv-detail-value']}>{formData.status || ''}</div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Visit Date</label>
                    <div className={styles['co-cdv-detail-value']}>
                      {formData.visitDate
                        ? (formData.visitDate instanceof Date
                          ? formData.visitDate.toLocaleDateString('en-GB')
                          : formData.visitDate)
                        : ''}
                    </div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Package</label>
                    <div className={styles['co-cdv-detail-value-with-chip']}>
                      <span style={{ flex: 1, padding: '0 0.9rem', display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: '600', color: '#333333', minWidth: 0 }}>
                        {formData.package || ''}
                      </span>
                      <span className={styles['co-cdv-detail-chip']}>LPA</span>
                    </div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Location</label>
                    <div className={styles['co-cdv-detail-value']}>{formData.location || ''}</div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Bond Period</label>
                    <div className={styles['co-cdv-detail-value-with-chip']}>
                      <span style={{ flex: 1, padding: '0 0.9rem', display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: '600', color: '#333333', minWidth: 0 }}>
                        {formData.bondPeriod || ''}
                      </span>
                      <span className={styles['co-cdv-detail-chip']}>
                        {formData.bondPeriod > 1 ? 'Years' : 'Year'}
                      </span>
                    </div>
                  </div>

                  <div className={styles['co-cdv-detail-row']}>
                    <label>Internship</label>
                    <div className={styles['co-cdv-detail-value']}>{formData.internship || 'No'}</div>
                  </div>

                  {formData.internship === 'Yes' && (
                    <>
                      <div className={styles['co-cdv-detail-row']}>
                        <label>Internship Duration</label>
                        <div className={styles['co-cdv-detail-value']}>{formData.internshipDuration || '—'}</div>
                      </div>

                      <div className={styles['co-cdv-detail-row']}>
                        <label>Stipend</label>
                        <div className={styles['co-cdv-detail-value-with-chip']}>
                          <span style={{ flex: 1, padding: '0 0.9rem', display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: '600', color: '#333333', minWidth: 0 }}>
                            {formData.stipend || '—'}
                          </span>
                          <span className={styles['co-cdv-detail-chip']}>/ Month</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className={styles['co-cdv-detail-row']} style={{ gridColumn: '1 / -1' }}>
                    <label>Core Skills</label>
                    <div className={styles['co-cdv-detail-value']} style={{ height: 'auto', minHeight: '53.6px', padding: '0.6rem 0.9rem', flexWrap: 'wrap', gap: '6px' }}>
                      {formData.coreSkills && formData.coreSkills.some(c => c.items && c.items.length > 0)
                        ? formData.coreSkills.filter(c => c.items && c.items.length > 0).map(c => `${c.category}: ${c.items.join(', ')}`).join(' | ')
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Department Selection Popup (View Mode) */}
      {showDepartmentPopup && (
        <div className={styles['co-cdv-dept-popup-overlay']} onClick={() => setShowDepartmentPopup(false)}>
          <div className={styles['co-cdv-dept-popup-container']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['co-cdv-dept-popup-header']}>
              Branches : {selectedDepartments.length}
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
                  >
                    <div className={styles['co-cdv-dept-checkbox']}>
                      {isSelected && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6.5 11.5L13 5" stroke="#d23b42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                onClick={() => setShowDepartmentPopup(false)}
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

export default CooCompanyDriveView;
