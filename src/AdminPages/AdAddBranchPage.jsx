import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdAddBranchPage.module.css';
import Adminicon from "../assets/Adminicon.png";
import AddCoordinatoricon from "../assets/AddCoordinatoricon.svg";
import BranchIcon from "../assets/adaddbranchicon.svg";
import mongoDBService from '../services/mongoDBService';

const RequiredStar = () => <span className={styles['Admin-add-branch-required-star']}>*</span>;

const DropdownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4" viewBox="0 0 292.4 292.4" className={styles['Admin-add-branch-dropdown-icon']}>
    <path fill="#999" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.2 1.8-12.9 5.4-3.7 3.6-5.5 8-5.5 13s1.8 9.4 5.5 13l128.8 128.8c3.7 3.7 8 5.5 13 5.5s9.4-1.8 13-5.5l128.8-128.8c3.7-3.6 5.4-8 5.4-13s-1.7-9.4-5.4-13z" />
  </svg>
);

function AdminABN() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [formData, setFormData] = useState({
    degreeAbbreviation: '',
    degreeFullName: '',
    branchFullName: '',
    branchAbbreviation: ''
  });

  const [existingBranches, setExistingBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchFullNameError, setBranchFullNameError] = useState('');
  const [branchAbbreviationError, setBranchAbbreviationError] = useState('');

  const normalizeString = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, '');
  };

  const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const isDuplicateString = (str1, str2) => {
    const n1 = normalizeString(str1);
    const n2 = normalizeString(str2);
    if (n1 === n2) return true;

    const len = Math.max(n1.length, n2.length);
    if (len < 5) return false;

    const dist = getLevenshteinDistance(n1, n2);
    const allowedDiff = len > 15 ? 2 : 1;
    return dist <= allowedDiff;
  };

  const isDuplicateAbbreviation = (abbr1, abbr2) => {
    return normalizeString(abbr1) === normalizeString(abbr2);
  };

  const titleCaseBranchName = (name) => {
    if (!name) return '';
    const lowercaseConjunctions = ['and', 'the', 'in', 'to', 'for', 'with', 'a', 'an', 'or', 'at', 'by', 'from', 'but'];
    return name
      .split(' ')
      .map((word, index) => {
        if (!word) return ''; // preserve extra spaces
        const lowerWord = word.toLowerCase();
        if (index === 0 || !lowercaseConjunctions.includes(lowerWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return lowerWord;
      })
      .join(' ');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === 'branchFullName') {
      const formatted = titleCaseBranchName(value);
      setFormData(prev => ({ ...prev, branchFullName: formatted }));
      
      setBranchFullNameError('');
      if (formatted.trim()) {
        if (/[^a-zA-Z\s]/.test(formatted)) {
          setBranchFullNameError("Special characters are not allowed. Only letters and spaces are allowed.");
        } else {
          const duplicate = existingBranches.find(b => 
            isDuplicateString(b.branchFullName, formatted)
          );
          if (duplicate) {
            setBranchFullNameError(`This branch name already exists (as '${duplicate.branchFullName}').`);
          }
        }
      }
    }

    if (name === 'branchAbbreviation') {
      const formatted = value.toUpperCase();
      setFormData(prev => ({ ...prev, branchAbbreviation: formatted }));
      
      setBranchAbbreviationError('');
      if (formatted.trim()) {
        const duplicate = existingBranches.find(b => 
          isDuplicateAbbreviation(b.branchAbbreviation, formatted)
        );
        if (duplicate) {
          setBranchAbbreviationError(`This abbreviation already exists (as '${duplicate.branchAbbreviation}').`);
        }
      }
    }
  };

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [degrees, setDegrees] = useState([]);
  const [isLoadingDegrees, setIsLoadingDegrees] = useState(false);
  const [degreeError, setDegreeError] = useState('');

  // Get counts from navigation state (passed from main page)
  const totalBranches = location.state?.totalBranches ?? 0;
  const totalCoordinators = location.state?.totalCoordinators ?? 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'branchFullName') {
      setBranchFullNameError('');
      if (value.trim()) {
        if (/[^a-zA-Z\s]/.test(value)) {
          setBranchFullNameError("Special characters are not allowed. Only letters and spaces are allowed.");
        } else {
          const duplicate = existingBranches.find(b =>
            isDuplicateString(b.branchFullName, value)
          );
          if (duplicate) {
            setBranchFullNameError(`This branch name already exists (as '${duplicate.branchFullName}').`);
          }
        }
      }
    }

    if (name === 'branchAbbreviation') {
      setBranchAbbreviationError('');
      if (value.trim()) {
        const duplicate = existingBranches.find(b =>
          isDuplicateAbbreviation(b.branchAbbreviation, value)
        );
        if (duplicate) {
          setBranchAbbreviationError(`This abbreviation already exists (as '${duplicate.branchAbbreviation}').`);
        }
      }
    }
  };

  const handleDegreeChange = (e) => {
    const selectedValue = e.target.value;
    const selectedDegree = degrees.find((degree) => {
      if (degree?.degreeAbbreviation) {
        return degree.degreeAbbreviation === selectedValue;
      }
      return degree?.degreeFullName === selectedValue;
    });

    const resolvedFullName = selectedDegree?.degreeFullName || selectedValue;
    const resolvedAbbreviation = selectedDegree?.degreeAbbreviation || selectedValue;

    setFormData((prev) => ({
      ...prev,
      degreeAbbreviation: resolvedAbbreviation,
      degreeFullName: resolvedFullName
    }));
  };

  const loadDegrees = useCallback(async () => {
    setIsLoadingDegrees(true);
    setDegreeError('');
    try {
      const degreeList = await mongoDBService.getDegrees();
      const activeDegrees = Array.isArray(degreeList)
        ? degreeList.filter((degree) => degree?.isActive !== false)
        : [];
      setDegrees(activeDegrees);
    } catch (error) {
      console.error('Failed to load degrees:', error);
      setDegreeError('Unable to load degrees right now. Please try again.');
    } finally {
      setIsLoadingDegrees(false);
    }
  }, []);

  const loadBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    try {
      const branchesList = await mongoDBService.getBranches();
      setExistingBranches(branchesList || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    loadDegrees();
    loadBranches();
  }, [loadDegrees, loadBranches]);

  const handleAddBranchClick = () => navigate('/admin-add-branch-main');

  const handleAddCoordinator = () => navigate('/admin-coordinator-detail');

  const handleDiscard = () => {
    setFormData({
      degreeAbbreviation: '',
      degreeFullName: '',
      branchFullName: '',
      branchAbbreviation: ''
    });
    setBranchFullNameError('');
    setBranchAbbreviationError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userRole');
    navigate('/admin-login');
  };

  const handleSave = async () => {
    if (!formData.degreeAbbreviation || !formData.branchFullName || !formData.branchAbbreviation) {
      alert("Please fill in all required fields.");
      return;
    }
    if (branchFullNameError || branchAbbreviationError) {
      alert("Please resolve the validation errors first.");
      return;
    }
    setIsLoading(true);
    try {
      const branchData = {
        degreeFullName: formData.degreeFullName,
        degreeAbbreviation: formData.degreeAbbreviation,
        branchFullName: formData.branchFullName,
        branchAbbreviation: formData.branchAbbreviation
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Branch created successfully:', result);
        setShowSuccessPopup(true);
        handleDiscard(); // Clear form after successful creation
      } else {
        console.error('Error creating branch:', result);
        alert(`Error: ${result.error || 'Failed to create branch'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  return (
    <>
      <Adnavbar Adminicon={Adminicon} onToggleSidebar={toggleSidebar} />
      <div className={styles['Admin-add-branch-layout']}>
        <Adsidebar isOpen={isSidebarOpen} onLogout={handleLogout} />
        <div className={styles['Admin-add-branch-main-content']}>

          <div className={styles['Admin-add-branch-stats-container']}>
            <div className={`${styles['Admin-add-branch-card']} ${styles['Admin-add-branch-card-green']}`} onClick={handleAddBranchClick}>
              <div className={styles['Admin-add-branch-card-icon']}>
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="30" fill="white" />
                  <path d="M30 20V40M20 30H40" stroke="#4EA24E" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className={styles['Admin-add-branch-card-title']}>Existing Branch</h2>
              <p className={styles['Admin-add-branch-card-subtitle']}>View Department<br />Branches.</p>

            </div>

            <div className={`${styles['Admin-add-branch-card']} ${styles['Admin-add-branch-card-blue']}`}>
              <h2 className={styles['Admin-add-branch-card-title']}>Overall<br />Branches</h2>
              <div className={styles['Admin-add-branch-card-number']}>{totalBranches}</div>
            </div>

            <div className={`${styles['Admin-add-branch-card']} ${styles['Admin-add-branch-card-red']}`}>
              <h2 className={styles['Admin-add-branch-card-title']}>Total<br />Coordinators</h2>
              <div className={styles['Admin-add-branch-card-number']}>{totalCoordinators}</div>
            </div>
          </div>

          <div className={styles['Admin-add-branch-form-container']}>
            <div className={styles['Admin-add-branch-form-header']}>
              <h3 className={styles['Admin-add-branch-form-title']}>Branch Information</h3>
            </div>

            <div className={styles['Admin-add-branch-form-grid']}>
              <div className={styles['Admin-add-branch-field']}>
                <label className={styles['Admin-add-branch-field-label']} htmlFor="degreeAbbreviation">
                  <span className={styles['Admin-add-branch-label-heading']}>Degree <RequiredStar /></span>
                </label>
                <div className={styles['Admin-add-branch-select-wrapper']}>
                  <select
                    id="degreeAbbreviation"
                    name="degreeAbbreviation"
                    value={formData.degreeAbbreviation}
                    onChange={handleDegreeChange}
                    className={`${styles['Admin-add-branch-input']} ${styles['Admin-add-branch-form-select']}`}
                    disabled={isLoadingDegrees || degreeError}
                  >
                    <option value="" disabled>
                      {isLoadingDegrees ? 'Loading degrees...' : 'Degree'}
                    </option>
                    {degrees.map((degree) => {
                      const value = degree.degreeAbbreviation || degree.degreeFullName;
                      const label = degree.degreeFullName
                        ? degree.degreeAbbreviation
                          ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                          : degree.degreeFullName
                        : value;
                      return (
                        <option key={degree.id || degree._id || value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <DropdownIcon />
                </div>
              </div>

              <div className={styles['Admin-add-branch-field']}>
                <label className={styles['Admin-add-branch-field-label']} htmlFor="branchFullName">
                  <span className={styles['Admin-add-branch-label-heading']}>Branch Full Name <RequiredStar /></span>
                </label>
                <input
                  id="branchFullName"
                  type="text"
                  name="branchFullName"
                  value={formData.branchFullName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter Branch Full Name"
                  className={styles['Admin-add-branch-input']}
                />
                {branchFullNameError && (
                  <span className={styles['Admin-add-branch-field-error']}>{branchFullNameError}</span>
                )}
              </div>

              <div className={styles['Admin-add-branch-field']}>
                <label className={styles['Admin-add-branch-field-label']} htmlFor="branchAbbreviation">
                  <span className={styles['Admin-add-branch-label-heading']}>Branch Abbreviation <RequiredStar /></span>
                </label>
                <input
                  id="branchAbbreviation"
                  type="text"
                  name="branchAbbreviation"
                  value={formData.branchAbbreviation}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter Branch Abbreviation"
                  className={styles['Admin-add-branch-input']}
                />
                {branchAbbreviationError && (
                  <span className={styles['Admin-add-branch-field-error']}>{branchAbbreviationError}</span>
                )}
              </div>
            </div>

            <div className={styles['Admin-add-branch-actions']}>
              <button onClick={handleAddCoordinator} className={`${styles['Admin-add-branch-btn']} ${styles['Admin-add-branch-btn-add-coord']}`}>
                <img src={AddCoordinatoricon} alt="" className={styles['Admin-add-branch-btn-icon']} />
                Add Coordinator
              </button>

              <div className={styles['Admin-add-branch-actions-right']}>
                <button onClick={handleDiscard} className={`${styles['Admin-add-branch-btn']} ${styles['Admin-add-branch-btn-discard']}`}>
                  Discard
                </button>

                <button
                  onClick={handleSave}
                  className={`${styles['Admin-add-branch-btn']} ${styles['Admin-add-branch-btn-save']}`}
                  disabled={isLoading || !formData.degreeAbbreviation || !formData.branchFullName || !formData.branchAbbreviation || branchFullNameError || branchAbbreviationError}
                >
                  {isLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Branch Success Popup */}
      {showSuccessPopup && (
        <div className={styles['Admin-add-branch-popup-overlay']}>
          <div className={styles['Admin-add-branch-popup-container']}>
            <div className={styles['Admin-add-branch-popup-header']}>
              Added !
            </div>
            <div className={styles['Admin-add-branch-popup-body']}>
              <div className={styles['Admin-add-branch-popup-icon']}>
                <img src={BranchIcon} alt="Branch Added" style={{ width: '40px', height: '40px', filter: 'brightness(0) invert(1)' }} />
              </div>
              <h2 className={styles['Admin-add-branch-popup-title']}>
                Department Added ✓
              </h2>
              <p className={styles['Admin-add-branch-popup-message']}>
                New Department have been Successfully Added in the Portal
              </p>
            </div>
            <div className={styles['Admin-add-branch-popup-footer']}>
              <button
                onClick={closeSuccessPopup}
                className={styles['Admin-add-branch-popup-close-btn']}
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

export default AdminABN;