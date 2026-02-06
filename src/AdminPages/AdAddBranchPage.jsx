import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useAdminAuth from '../utils/useAdminAuth';

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdAddBranchPage.module.css';
import Adminicon from "../assets/Adminicon.png";
import AddCoordinatoricon from "../assets/AddCoordinatoricon.svg";
import BranchIcon from "../assets/adaddbranchicon.svg"; 
import mongoDBService from '../services/mongoDBService';

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
  
  const [selectedDate, setSelectedDate] = useState(null);
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

  useEffect(() => {
    loadDegrees();
  }, [loadDegrees]);

  const handleAddBranchClick = () => navigate('/admin-add-branch-main');

  const handleAddCoordinator = () => navigate('/admin-coordinator-detail');

  const handleDiscard = () => {
    setFormData({
      degreeAbbreviation: '',
      degreeFullName: '',
      branchFullName: '',
      branchAbbreviation: ''
    });
    setSelectedDate(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userRole');
    navigate('/admin-login');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const branchData = {
        degreeFullName: formData.degreeFullName,
        degreeAbbreviation: formData.degreeAbbreviation,
        branchFullName: formData.branchFullName,
        branchAbbreviation: formData.branchAbbreviation,
        establishedDate: selectedDate
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
                  <circle cx="30" cy="30" r="30" fill="white"/>
                  <path d="M30 20V40M20 30H40" stroke="#4EA24E" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className={styles['Admin-add-branch-card-title']}>Existing Branch</h2>
              <p className={styles['Admin-add-branch-card-subtitle']}>View Department<br/>Branches.</p>
              
            </div>

            <div className={`${styles['Admin-add-branch-card']} ${styles['Admin-add-branch-card-blue']}`}>
              <h2 className={styles['Admin-add-branch-card-title']}>Overall<br/>Branches</h2>
              <div className={styles['Admin-add-branch-card-number']}>{totalBranches}</div>
            </div>

            <div className={`${styles['Admin-add-branch-card']} ${styles['Admin-add-branch-card-red']}`}>
              <h2 className={styles['Admin-add-branch-card-title']}>Total<br/>Coordinators</h2>
              <div className={styles['Admin-add-branch-card-number']}>{totalCoordinators}</div>
            </div>
          </div>

          <div className={styles['Admin-add-branch-form-container']}>
            <div className={styles['Admin-add-branch-form-header']}>
              <h3 className={styles['Admin-add-branch-form-title']}>Branch Information</h3>
            </div>

            <div className={styles['Admin-add-branch-form-grid']}>
              <select
                name="degreeAbbreviation"
                value={formData.degreeAbbreviation}
                onChange={handleDegreeChange}
                className={styles['Admin-add-branch-input']}
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
              <input
                type="text"
                name="branchFullName"
                value={formData.branchFullName}
                onChange={handleInputChange}
                placeholder="Branch Full Name"
                className={styles['Admin-add-branch-input']}
              />
              <input
                type="text"
                name="branchAbbreviation"
                value={formData.branchAbbreviation}
                onChange={handleInputChange}
                placeholder="Branch Abbreviation"
                className={styles['Admin-add-branch-input']}
              />
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                placeholderText="Date"
                className={styles['Admin-add-branch-input']}
                dateFormat="dd/MM/yyyy"
                wrapperClassName={styles['Admin-add-branch-datepicker-wrapper']}
                portalId="root-portal"
              />
            </div>

            <div className={styles['Admin-add-branch-actions']}>
              <button onClick={handleAddCoordinator} className={`${styles['Admin-add-branch-btn']} ${styles['Admin-add-branch-btn-add-coord']}`}>
                <img src={AddCoordinatoricon} alt="" className={styles['btn-icon']} />
                <div className={styles['btn-content']}>
                  <div className={styles['btn-text-main']}>Add</div>
                  <div className={styles['btn-text-sub']}>Coordinator</div>
                </div>
              </button>

              <div className={styles['Admin-add-branch-actions-right']}>
                <button onClick={handleDiscard} className={`${styles['Admin-add-branch-btn']} ${styles['Admin-add-branch-btn-discard']}`}>
                  <svg className={styles['btn-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <div className={styles['btn-content']}>
                    <div className={styles['btn-text-main']}>Discard</div>
                    <div className={styles['btn-text-sub']}>cancel changes</div>
                  </div>
                </button>

                <button onClick={handleSave} className={`${styles['Admin-add-branch-btn']} ${styles['Admin-add-branch-btn-save']}`} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className={styles['Admin-add-branch-loading-spinner']}></div>
                      <div className={styles['btn-content']}>
                        <div className={styles['btn-text-main']}>Adding...</div>
                        <div className={styles['btn-text-sub']}>Please Wait</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className={styles['btn-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12l3 3 5-5" />
                      </svg>
                      <div className={styles['btn-content']}>
                        <div className={styles['btn-text-main']}>Add</div>
                        <div className={styles['btn-text-sub']}>This Branch</div>
                      </div>
                    </>
                  )}
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