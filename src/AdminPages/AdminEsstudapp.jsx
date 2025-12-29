import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminBrowseStudenticon from "../assets/AdEsapkicon.svg";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
// FIXED: Import CSS as a Module
import styles from './AdminEsstudapp.module.css';

function AdminEsstudapp() {
  const navigate = useNavigate();
  
  const [filterData, setFilterData] = useState({
    companyName: '',
    driveStartDate: '',
    driveEndDate: '',
    totalRound: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    diplomaPercentage: '',
    ugCgpa: '',
    pgCgpa: '',
    backlogs: '',
    department: '',
    arrearStatus: '',
    bondWillingness: '',
    driveMode: '',
    companyType: '',
    jobLocation: '',
    jobs: '',
    includedCompany: '',
    mobileNo: ''
  });

  const handleFilterChange = (field, value) => {
    setFilterData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    console.log("Search action triggered with data:", filterData);
    // Add your search logic here
  };
  
  const handleClear = () => {
    setFilterData({
      companyName: '',
      driveStartDate: '',
      driveEndDate: '',
      totalRound: '',
      tenthPercentage: '',
      twelfthPercentage: '',
      diplomaPercentage: '',
      ugCgpa: '',
      pgCgpa: '',
      backlogs: '',
      department: '',
      arrearStatus: '',
      bondWillingness: '',
      driveMode: '',
      companyType: '',
      jobLocation: '',
      jobs: '',
      includedCompany: '',
      mobileNo: ''
    });
    console.log("Clear filter action triggered.");
  };

  // ADDED: Navigation function to go back to Eligible Students page
  const handleEligibleStudentsClick = () => {
    navigate('/admin-eligible-students'); // Assuming this is the parent route
  };

  return (
    // UPDATED CLASS: Admin-es-apk-main-wrapper
    <div className={styles['Admin-es-apk-main-wrapper']}>
      <AdNavbar />
      {/* UPDATED CLASS: Admin-es-apk-layout-container */}
      <div className={styles['Admin-es-apk-layout-container']}>
        <AdSidebar />
        {/* UPDATED CLASSES: Admin-es-apk-container, Admin-es-apk-content-wrapper */}
        <div className={`${styles['Admin-es-apk-container']} ${styles['Admin-es-apk-content-wrapper']}`}>
          {/* UPDATED CLASS: Admin-es-apk-dashboard-area */}
          <div className={styles['Admin-es-apk-dashboard-area']}>
            {/* UPDATED CLASS: Admin-es-apk-summary-cards */}
            <div className={styles['Admin-es-apk-summary-cards']}>
              {/* Eligible Student Card */}
              {/* UPDATED CLASSES: Admin-es-apk-summary-card, Admin-es-apk-eligible-student-card, Admin-es-apk-summary-card-icon, Admin-es-apk-icon-bg-white, Admin-es-apk-summary-card-title-1, Admin-es-apk-summary-card-desc-1, Admin-es-apk-summary-card-desc-1-margin */}
              <div 
                className={`${styles['Admin-es-apk-summary-card']} ${styles['Admin-es-apk-eligible-student-card']}`}
                onClick={handleEligibleStudentsClick}
                style={{ cursor: 'pointer' }}
              >
                <div className={`${styles['Admin-es-apk-summary-card-icon']} ${styles['Admin-es-apk-icon-bg-white']}`}>
                  <img src={AdminBrowseStudenticon} alt="Eligible Students" />
                </div>
                <div className={styles['Admin-es-apk-summary-card-title-1']}>Eligible<br/>Student</div>
                <div className={`${styles['Admin-es-apk-summary-card-desc-1']} ${styles['Admin-es-apk-summary-card-desc-1-margin']}`}>Eligible Students for<br/>Upcoming Drive</div>
              </div>
              
              {/* Eligible Students Filter Card */}
              {/* UPDATED CLASSES for search card, tab, inputs, and helpers */}
              <div className={`${styles['Admin-es-apk-search-filters']} ${styles['Admin-es-apk-eligible-students-search']}`}>
                <div className={styles['Admin-es-apk-search-tab']}>Eligible Students</div>
                <div className={`${styles['Admin-es-apk-search-inputs']} ${styles['Admin-es-apk-eligible-inputs']}`}>
                  <div className={`${styles['Admin-es-apk-search-input']} ${filterData.companyName ? styles['filled'] : ''}`}>
                    <input 
                      type="text" 
                      id="companyName" 
                      value={filterData.companyName} 
                      onChange={(e) => handleFilterChange('companyName', e.target.value)} 
                      list="company-options"
                      placeholder="Select Company Name"
                    />
                    <label htmlFor="companyName">Company Name</label>
                    <datalist id="company-options">
                      <option value="Company A" />
                      <option value="Company B" />
                      <option value="Company C" />
                    </datalist>
                  </div>
                  <div className={`${styles['Admin-es-apk-search-input']} ${styles['Admin-es-apk-date-input']} ${filterData.driveStartDate ? styles['filled'] : ''}`}>
                    <input 
                      type="date" 
                      id="driveStartDate" 
                      value={filterData.driveStartDate} 
                      onChange={(e) => handleFilterChange('driveStartDate', e.target.value)} 
                    />
                    <label htmlFor="driveStartDate">Drive Start Date</label>
                  </div>
                  <div className={`${styles['Admin-es-apk-search-input']} ${styles['Admin-es-apk-date-input']} ${filterData.driveEndDate ? styles['filled'] : ''}`}>
                    <input 
                      type="date" 
                      id="driveEndDate" 
                      value={filterData.driveEndDate} 
                      onChange={(e) => handleFilterChange('driveEndDate', e.target.value)} 
                    />
                    <label htmlFor="driveEndDate">Drive End Date</label>
                  </div>
                  <div className={`${styles['Admin-es-apk-search-input']} ${filterData.totalRound ? styles['filled'] : ''}`}>
                    <input 
                      type="text" 
                      id="totalRound" 
                      value={filterData.totalRound} 
                      onChange={(e) => handleFilterChange('totalRound', e.target.value)} 
                      placeholder="Enter Total Round"
                    />
                    <label htmlFor="totalRound">Total Round</label>
                  </div>
                </div>
              </div>
              
              {/* Filtered Students Count Card */}
              {/* UPDATED CLASSES: Admin-es-apk-summary-card, Admin-es-apk-filtered-students-card, Admin-es-apk-filtered-title, Admin-es-apk-filtered-count, Admin-es-apk-filtered-desc */}
              <div className={`${styles['Admin-es-apk-summary-card']} ${styles['Admin-es-apk-filtered-students-card']}`}>
                <div className={styles['Admin-es-apk-filtered-title']}>Filtered<br/>Students</div>
                <div className={styles['Admin-es-apk-filtered-count']}>40</div>
                <div className={styles['Admin-es-apk-filtered-desc']}>Number of Students<br/>Eligible for Drive</div>
              </div>
            </div>
            
            {/* Bottom Filter Section */}
            {/* UPDATED CLASSES: Admin-es-apk-bottom-filters, Admin-es-apk-filter-row, Admin-es-apk-filter-input, Admin-es-apk-bottom-button-container, Admin-es-apk-clear-bottom-btn, Admin-es-apk-search-bottom-btn */}
            <div className={styles['Admin-es-apk-bottom-filters']}>
              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.tenthPercentage ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="tenthPercentage" 
                    value={filterData.tenthPercentage} 
                    onChange={(e) => handleFilterChange('tenthPercentage', e.target.value)}
                    placeholder="10th Percentage"
                  />
                  <label htmlFor="tenthPercentage">10th Percentage</label>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.twelfthPercentage ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="twelfthPercentage" 
                    value={filterData.twelfthPercentage} 
                    onChange={(e) => handleFilterChange('twelfthPercentage', e.target.value)}
                    placeholder="12th Percentage"
                  />
                  <label htmlFor="twelfthPercentage">12th Percentage</label>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.diplomaPercentage ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="diplomaPercentage" 
                    value={filterData.diplomaPercentage} 
                    onChange={(e) => handleFilterChange('diplomaPercentage', e.target.value)}
                    placeholder="Diploma Percentage"
                  />
                  <label htmlFor="diplomaPercentage">Diploma Percentage</label>
                </div>
              </div>

              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.ugCgpa ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="ugCgpa" 
                    value={filterData.ugCgpa} 
                    onChange={(e) => handleFilterChange('ugCgpa', e.target.value)}
                    placeholder="UG CGPA"
                  />
                  <label htmlFor="ugCgpa">UG CGPA</label>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.pgCgpa ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="pgCgpa" 
                    value={filterData.pgCgpa} 
                    onChange={(e) => handleFilterChange('pgCgpa', e.target.value)}
                    placeholder="PG CGPA"
                  />
                  <label htmlFor="pgCgpa">PG CGPA</label>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.backlogs ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="backlogs" 
                    value={filterData.backlogs} 
                    onChange={(e) => handleFilterChange('backlogs', e.target.value)}
                    placeholder="No. of Backlogs"
                  />
                  <label htmlFor="backlogs">No. of Backlogs</label>
                </div>
              </div>

              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.department ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="department" 
                    value={filterData.department} 
                    onChange={(e) => handleFilterChange('department', e.target.value)} 
                    list="department-options"
                    placeholder="Department"
                  />
                  <label htmlFor="department">Department</label>
                  <datalist id="department-options">
                    <option value="CSE" />
                    <option value="IT" />
                    <option value="ECE" />
                  </datalist>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.arrearStatus ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="arrearStatus" 
                    value={filterData.arrearStatus} 
                    onChange={(e) => handleFilterChange('arrearStatus', e.target.value)} 
                    list="arrear-options"
                    placeholder="Arrear Status"
                  />
                  <label htmlFor="arrearStatus">Arrear Status</label>
                  <datalist id="arrear-options">
                    <option value="Yes" />
                    <option value="No" />
                  </datalist>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.bondWillingness ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="bondWillingness" 
                    value={filterData.bondWillingness} 
                    onChange={(e) => handleFilterChange('bondWillingness', e.target.value)} 
                    list="bond-options"
                    placeholder="Willingness to Sign in Bond"
                  />
                  <label htmlFor="bondWillingness">Willingness to Sign in Bond</label>
                  <datalist id="bond-options">
                    <option value="Yes" />
                    <option value="No" />
                  </datalist>
                </div>
              </div>

              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.driveMode ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="driveMode" 
                    value={filterData.driveMode} 
                    onChange={(e) => handleFilterChange('driveMode', e.target.value)} 
                    list="mode-options"
                    placeholder="Mode of Drive"
                  />
                  <label htmlFor="driveMode">Mode of Drive</label>
                  <datalist id="mode-options">
                    <option value="Online" />
                    <option value="Offline" />
                    <option value="Hybrid" />
                  </datalist>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.companyType ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="companyType" 
                    value={filterData.companyType} 
                    onChange={(e) => handleFilterChange('companyType', e.target.value)} 
                    list="type-options"
                    placeholder="Types of Companies"
                  />
                  <label htmlFor="companyType">Types of Companies</label>
                  <datalist id="type-options">
                    <option value="Product" />
                    <option value="Service" />
                  </datalist>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.jobLocation ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="jobLocation" 
                    value={filterData.jobLocation} 
                    onChange={(e) => handleFilterChange('jobLocation', e.target.value)} 
                    list="location-options"
                    placeholder="Preferred Job Location"
                  />
                  <label htmlFor="jobLocation">Preferred Job Location</label>
                  <datalist id="location-options">
                    <option value="Chennai" />
                    <option value="Bangalore" />
                  </datalist>
                </div>
              </div>

              <div className={styles['Admin-es-apk-filter-row']}>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.jobs ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="jobs" 
                    value={filterData.jobs} 
                    onChange={(e) => handleFilterChange('jobs', e.target.value)}
                    placeholder="Jobs"
                  />
                  <label htmlFor="jobs">Jobs</label>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.includedCompany ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="includedCompany" 
                    value={filterData.includedCompany} 
                    onChange={(e) => handleFilterChange('includedCompany', e.target.value)}
                    placeholder="Included Company"
                  />
                  <label htmlFor="includedCompany">Included Company</label>
                </div>
                <div className={`${styles['Admin-es-apk-filter-input']} ${filterData.mobileNo ? styles['filled'] : ''}`}>
                  <input 
                    type="text" 
                    id="mobileNo" 
                    value={filterData.mobileNo} 
                    onChange={(e) => handleFilterChange('mobileNo', e.target.value)}
                    placeholder="Mobile No."
                  />
                  <label htmlFor="mobileNo">Mobile No.</label>
                </div>
              </div>

              <div className={styles['Admin-es-apk-bottom-button-container']}>
                <button className={styles['Admin-es-apk-clear-bottom-btn']} onClick={handleClear}>Clear</button>
                <button className={styles['Admin-es-apk-search-bottom-btn']} onClick={handleSearch}>Search</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminEsstudapp;