import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdAddBranchMainPage.module.css';
import Adminicon from "../assets/Adminicon.png";
import mongoDBService from '../services/mongoDBService';

function AdminABM() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  
  // Added Sidebar State Logic
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCoordinators, setTotalCoordinators] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [coordinatorsByBranch, setCoordinatorsByBranch] = useState({});

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    
    try {
      // OPTIMIZED: Call new summary endpoint with server-side aggregation
      const response = await mongoDBService.getBranchesSummary();
      
      // Build coordinator counts from aggregated data
      const counts = {};
      response.branches.forEach(branch => {
        const branchCode = branch.branchAbbreviation;
        counts[branchCode] = branch.coordinatorCount || 0;
      });
      
      // Set all states together to avoid flickering
      setBranches(response.branches);
      setTotalCoordinators(response.totalCoordinators);
      setCoordinatorsByBranch(counts);
    } catch (error) {
      console.error('Failed to load branch summary:', error);
      setFetchError('Unable to load branches right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const totalBranches = branches.length;

  const handleBranchClick = (branchCode) => {
    navigate(`/admin-manage-coordinators/${branchCode}`);
  };

  const handleAddBranchClick = () => {
    navigate('/admin-add-branch', {
      state: {
        totalBranches: branches.length,
        totalCoordinators: totalCoordinators
      }
    });
  };

  // Filter branches based on search query
  const filteredBranches = branches.filter(branch => {
    const branchCode = (branch.branchAbbreviation || branch.branchCode || branch.id || '').toLowerCase();
    const branchName = (branch.branchFullName || branch.branchName || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return branchCode.includes(query) || branchName.includes(query);
  });

  // Handle scroll for indicator bar
  const handleScroll = (e) => {
    const element = e.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollPercent(percent);
    setShowScrollIndicator(scrollHeight > 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userRole');
    navigate('/admin-login');
  };

  return (
    <>
      {/* Pass onToggleSidebar to Navbar */}
      <Adnavbar Adminicon={Adminicon} onToggleSidebar={toggleSidebar} />
      <div className={styles['Admin-add-branch-layout']}>
        {/* Pass isOpen to Sidebar */}
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
            <div className={styles['Admin-add-branch-header']}>
              <h2 className={styles['Admin-add-branch-section-title']}>Existing Branches</h2>
              <div className={styles['Admin-add-branch-search-container']}>
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles['Admin-add-branch-search-input']}
                />
                <svg className={styles['Admin-add-branch-search-icon']} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            {isLoading && (
              <div className={styles['Admin-add-branch-loading-wrapper']}>
                <div className={styles['Admin-add-branch-loading-container']}>
                  <div className={styles['Admin-add-branch-loading-bar-background']}>
                    <div className={styles['Admin-add-branch-loading-bar-fill']}></div>
                  </div>
                  <p className={styles['Admin-add-branch-loading-text']}>Loading branches from database...</p>
                </div>
              </div>
            )}
            
            <div className={styles['Admin-add-branch-list']} onScroll={handleScroll}>
              {!isLoading && fetchError && (
                <div className={styles['Admin-add-branch-error']}>
                  {fetchError}
                </div>
              )}

              {!isLoading && !fetchError && branches.length === 0 && (
                <div className={styles['Admin-add-branch-empty']}>
                  No branches available yet.
                </div>
              )}

              {!isLoading && !fetchError && filteredBranches.length === 0 && branches.length > 0 && (
                <div className={styles['Admin-add-branch-empty']}>
                  No branches match your search.
                </div>
              )}

              {!isLoading && !fetchError && filteredBranches.map((branch) => {
                const branchCode = branch.branchAbbreviation || branch.branchCode || branch.id;
                const branchName = branch.branchFullName || branch.branchName || branchCode;
                const coordinatorCount = coordinatorsByBranch[branchCode] || 0;

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
                    <div className={styles['Admin-add-branch-item-info']}>
                      <div className={styles['Admin-add-branch-coordinator-count']}>
                        <span className={styles['Admin-add-branch-count-number']}>{coordinatorCount}</span>
                        <span className={styles['Admin-add-branch-count-label']}>Coordinator{coordinatorCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className={styles['Admin-add-branch-item-arrow']}>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 10L25 20L15 30" stroke="#8B8BA3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {showScrollIndicator && filteredBranches.length > 0 && (
              <div className={styles['Admin-add-branch-scroll-indicator']}>
                <div 
                  className={styles['Admin-add-branch-scroll-indicator-thumb']}
                  style={{ top: `${scrollPercent}%` }}
                ></div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default AdminABM;