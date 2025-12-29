import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdAddBranchMainPage.module.css';
import Adminicon from "../assets/Adminicon.png";
import mongoDBService from '../services/mongoDBService';

function AdminABM() {
  const navigate = useNavigate();
  
  // Added Sidebar State Logic
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const branchList = await mongoDBService.getBranches();
      const activeBranches = Array.isArray(branchList)
        ? branchList.filter(branch => branch?.isActive !== false)
        : [];
      setBranches(activeBranches);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setFetchError('Unable to load branches right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const totalBranches = branches.length;
  const totalCoordinators = 30;

  const handleBranchClick = (branchCode) => {
    navigate(`/admin-manage-coordinators/${branchCode}`);
  };

  const handleAddBranchClick = () => {
    navigate('/admin-add-branch');
  };

  return (
    <>
      {/* Pass onToggleSidebar to Navbar */}
      <Adnavbar Adminicon={Adminicon} onToggleSidebar={toggleSidebar} />
      <div className={styles['Admin-add-branch-layout']}>
        {/* Pass isOpen to Sidebar */}
        <Adsidebar isOpen={isSidebarOpen} />
        <div className={styles['Admin-add-branch-main-content']}>
          
          <div className={styles['Admin-add-branch-stats-container']}>
            <div className={`${styles['Admin-add-branch-card']} ${styles['Admin-add-branch-card-green']}`} onClick={handleAddBranchClick}>
              <div className={styles['Admin-add-branch-card-icon']}>
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="30" fill="white"/>
                  <path d="M30 20V40M20 30H40" stroke="#4EA24E" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className={styles['Admin-add-branch-card-title']}>Add Branch</h2>
              <p className={styles['Admin-add-branch-card-subtitle']}>Create a new<br/>Department Branch.</p>
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

          <div className={styles['Admin-add-branch-section']}>
            <h2 className={styles['Admin-add-branch-section-title']}>Existing Branches</h2>
            <div className={`${styles['Admin-add-branch-list']} admin-branch-scroll`}>
              {isLoading && (
                <div className={styles['Admin-add-branch-empty']}>
                  Loading branches...
                </div>
              )}

              {fetchError && !isLoading && (
                <div className={styles['Admin-add-branch-error']}>
                  {fetchError}
                </div>
              )}

              {!isLoading && !fetchError && branches.length === 0 && (
                <div className={styles['Admin-add-branch-empty']}>
                  No branches available yet.
                </div>
              )}

              {!isLoading && !fetchError && branches.map((branch) => {
                const branchCode = branch.branchAbbreviation || branch.branchCode || branch.id;
                const branchName = branch.branchFullName || branch.branchName || branchCode;

                return (
                  <div 
                    key={branch.id || branch._id || branchCode} 
                    className={styles['Admin-add-branch-item']}
                    onClick={() => handleBranchClick(branchCode)}
                  >
                    <div className={styles['Admin-add-branch-item-content']}>
                      <h3 className={styles['Admin-add-branch-item-code']}>{branchCode}</h3>
                      <p className={styles['Admin-add-branch-item-name']}>{branchName}</p>
                    </div>
                    <div className={styles['Admin-add-branch-item-arrow']}>
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 10L25 20L15 30" stroke="#8B8BA3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default AdminABM;