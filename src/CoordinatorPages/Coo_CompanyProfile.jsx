import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import{ useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import mongoDBService from '../services/mongoDBService';
import  autoTable from 'jspdf-autotable';
import searchcompany from '../assets/SearchCompanybaricon.png';
import searchbydept from '../assets/searchvisitingyrbaricon.png'
import searchdomain from '../assets/searchDomainbaricon.png';
import searchmode from '../assets/Searchmodebaricon.png';
import CompanyDrive from '../assets/CompanyDrive.svg';
import CooCompanyprofileCompanies from '../assets/CooCompanyprofilecompanies.svg';
import CooCompanyprofileConfirmed from '../assets/CooCompanyprofileconfirmed.svg';

import styles from './Coo_CompanyProfile.module.css';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import Dropdown from '../components/common/Dropdown/Dropdown.jsx';
import CooCalendar from '../components/Calendar/Coo_Calendar.jsx';

const readStoredCoordinatorData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('coordinatorData');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to parse coordinatorData:', error);
    return null;
  }
};

const resolveCoordinatorDepartment = (data) => {
  if (!data) return '';
  const deptValue =
    data.department ||
    data.branch ||
    data.dept ||
    data.departmentName ||
    data.coordinatorDepartment ||
    data.assignedDepartment;
  return deptValue ? deptValue.toString().trim().toUpperCase() : '';
};

const sampleCompanyData = [
  {
    id: 1,
    company: "TechNova Solutions",
    domain: "IT Sector",
    jobRole: "Junior Developer",
    hrName: "Mr. David Chen",
    hrContact: "9876543210",
    bondPeriod: "24 Months",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "20-10-2025",
    package: "6 LPA",
    location: "Chennai"
  },
  {
    id: 2,
    company: "DataFlow Systems",
    domain: "Data Analytics",
    jobRole: "Data Analyst",
    hrName: "Ms. Sarah Jones",
    hrContact: "9876543211",
    bondPeriod: "18 Months",
    mode: "Online",
    status: "Confirmed",
    visitDate: "25-10-2025",
    package: "7 LPA",
    location: "Bangalore"
  },
  {
    id: 3,
    company: "CloudTech Innovations",
    domain: "Cloud Computing",
    jobRole: "Cloud Engineer",
    hrName: "Mr. Alex Rodriguez",
    hrContact: "9876543212",
    bondPeriod: "No Bond",
    mode: "Online",
    status: "Confirmed",
    visitDate: "05-11-2025",
    package: "8.5 LPA",
    location: "Hyderabad"
  },
  {
    id: 4,
    company: "Innovate AI Labs",
    domain: "Artificial Intelligence",
    jobRole: "Machine Learning Engineer",
    hrName: "Ms. Jessica Lee",
    hrContact: "9876543213",
    bondPeriod: "36 Months",
    mode: "Offline",
    status: "Pending",
    visitDate: "12-11-2025",
    package: "9 LPA",
    location: "Pune"
  },
  {
    id: 5,
    company: "FutureWeb Solutions",
    domain: "Web Development",
    jobRole: "Full Stack Developer",
    hrName: "Mr. Chris Evans",
    hrContact: "9876543214",
    bondPeriod: "24 Months",
    mode: "Online",
    status: "Confirmed",
    visitDate: "18-11-2025",
    package: "5.5 LPA",
    location: "Mumbai"
  },
  {
    id: 6,
    company: "NexGen Electronics",
    domain: "Core Electronics",
    jobRole: "Electronics Engineer",
    hrName: "Ms. Emily Watson",
    hrContact: "9876543215",
    bondPeriod: "No Bond",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "25-11-2025",
    package: "6.2 LPA",
    location: "Coimbatore"
  },
  {
    id: 7,
    company: "Global Motors",
    domain: "Automotive",
    jobRole: "Mechanical Designer",
    hrName: "Mr. Ryan Miller",
    hrContact: "9876543216",
    bondPeriod: "12 Months",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "01-12-2025",
    package: "6.8 LPA",
    location: "Pune"
  },
  {
    id: 8,
    company: "EcoBuild Constructors",
    domain: "Civil Engineering",
    jobRole: "Site Engineer",
    hrName: "Ms. Olivia Green",
    hrContact: "9876543217",
    bondPeriod: "No Bond",
    mode: "Offline",
    status: "Pending",
    visitDate: "15-12-2025",
    package: "5.3 LPA",
    location: "Delhi"
  },
  {
    id: 9,
    company: "AeroDynamics",
    domain: "Aerospace",
    jobRole: "Aerospace Engineer",
    hrName: "Mr. Michael Brown",
    hrContact: "9876543218",
    bondPeriod: "48 Months",
    mode: "Online",
    status: "Cancelled",
    visitDate: "20-12-2025",
    package: "10 LPA",
    location: "Bangalore"
  },
  {
    id: 10,
    company: "BioMed Systems",
    domain: "Medical Devices",
    jobRole: "Software Developer",
    hrName: "Dr. Isabella Scott",
    hrContact: "9876543219",
    bondPeriod: "12 Months",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "05-01-2026",
    package: "7.5 LPA",
    location: "Chennai"
  }
];

const formatDisplayDate = (value) => {
  if (!value) return '—';
  const [year, month, day] = String(value).split('T')[0].split('-');
  if (!year || !month || !day) return String(value);
  return `${day}-${month}-${year}`;
};


function CompanyProfile({ onLogout, currentView, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);

  // State for search filters
  const [filters, setFilters] = useState({
    company: '',
    companyType: '',
    hrName: '',
    mode: '',
    visitDate: '',
    location: ''
  });

  const [companyFocused, setCompanyFocused] = useState(false);
  const [hrNameFocused, setHrNameFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [visitDateFocused, setVisitDateFocused] = useState(false);

  const [activeItem, setActiveItem] = useState("Company Profile");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 6;


  // This function will set the active item when a menu item is clicked
  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };

  // This function will set the active item when a menu item is clicked
 
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none' | 'progress' | 'success' | 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');

  const [coordinatorBranch, setCoordinatorBranch] = useState(() => {
    const stored = readStoredCoordinatorData();
    return resolveCoordinatorDepartment(stored) || 'CSE';
  });

  // Fetch companies from MongoDB and filter by coordinator's department
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = readStoredCoordinatorData();
      const branch = resolveCoordinatorDepartment(stored) || 'CSE';
      if (branch) setCoordinatorBranch(branch);

      const [companiesData, drivesData] = await Promise.all([
        mongoDBService.getCompanies().catch(() => []),
        mongoDBService.getCompanyDrives().catch(() => [])
      ]);

      const allCompanies = Array.isArray(companiesData) ? companiesData : [];
      const allDrives = Array.isArray(drivesData) ? drivesData : [];

      // Map drive branches to company names for cross-referencing
      const driveBranchMap = new Map();
      allDrives.forEach((drive) => {
        const cName = (drive.companyName || '').toString().trim().toLowerCase();
        if (!cName) return;
        const branches = (drive.eligibleBranches || drive.branch || drive.department || '')
          .toString()
          .split(/[,/| ]+/)
          .map((b) => b.trim().toUpperCase())
          .filter(Boolean);
        if (!driveBranchMap.has(cName)) {
          driveBranchMap.set(cName, new Set());
        }
        branches.forEach((b) => driveBranchMap.get(cName).add(b));
      });

      const targetDept = (branch || 'CSE').toUpperCase();
      const deptFilteredCompanies = allCompanies.filter((company) => {
        const cName = (company.company || company.companyName || '').toString().trim().toLowerCase();

        // 1. Check branches from matching drives
        if (driveBranchMap.has(cName)) {
          const driveBranches = driveBranchMap.get(cName);
          if (
            driveBranches.has(targetDept) ||
            Array.from(driveBranches).some((b) => b.includes(targetDept) || targetDept.includes(b))
          ) {
            return true;
          }
        }

        // 2. Check branches directly on company record
        const companyDepts = [
          company.department,
          company.branch,
          ...(Array.isArray(company.departments) ? company.departments : [company.departments]),
          ...(Array.isArray(company.branches) ? company.branches : [company.branches]),
          ...(Array.isArray(company.eligibleBranches) ? company.eligibleBranches : [company.eligibleBranches]),
          ...(Array.isArray(company.eligibleDepartments) ? company.eligibleDepartments : [company.eligibleDepartments]),
        ]
          .filter(Boolean)
          .map((d) => d.toString().trim().toUpperCase());

        if (companyDepts.length > 0) {
          return companyDepts.some((d) => {
            const tokens = d.split(/[,/| ]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
            return tokens.includes(targetDept) || d === targetDept || d.includes(targetDept) || targetDept.includes(d);
          });
        }

        // 3. Fallback check on domain / jobRole
        const domainStr = (company.domain || company.companyType || company.jobRole || '').toString().toUpperCase();
        const nonCseKeywords = ['MECHANICAL', 'AUTOMOTIVE', 'CIVIL', 'AEROSPACE', 'MEDICAL DEVICES'];
        if (nonCseKeywords.some((k) => domainStr.includes(k))) {
          return false;
        }

        return true;
      });

      setCompanies(deptFilteredCompanies);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const matchedCompanyVisitDate = useMemo(() => {
    const companyQuery = filters.company.trim().toLowerCase();
    if (!companyQuery) return '';
    const matchedCompany = companies.find((company) =>
      (company.company || company.companyName || '').trim().toLowerCase() === companyQuery
    );
    return matchedCompany ? (matchedCompany.visitDate || '').slice(0, 10) : '';
  }, [companies, filters.company]);

  const visitDateOptions = useMemo(() => {
    if (matchedCompanyVisitDate) return [matchedCompanyVisitDate];
    if (!companies.length) return [];
    const uniqueDates = new Set(
      companies
        .map((company) => (company.visitDate || '').slice(0, 10))
        .filter(Boolean)
    );
    return Array.from(uniqueDates).sort();
  }, [companies, matchedCompanyVisitDate]);

  const handleFilterVisitDateChange = useCallback((value) => {
    setFilters((prev) => ({
      ...prev,
      visitDate: value || ''
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      company: '',
      companyType: '',
      hrName: '',
      mode: '',
      visitDate: '',
      location: ''
    });
  }, []);

  useEffect(() => {
    setFilters((prev) => {
      if (matchedCompanyVisitDate && prev.visitDate !== matchedCompanyVisitDate) {
        return {
          ...prev,
          visitDate: matchedCompanyVisitDate
        };
      }
      if (!matchedCompanyVisitDate && !visitDateOptions.includes(prev.visitDate)) {
        return {
          ...prev,
          visitDate: ''
        };
      }
      return prev;
    });
  }, [matchedCompanyVisitDate, visitDateOptions]);

  const hasActiveFilters = Boolean(
    filters.company.trim() ||
    filters.companyType ||
    filters.hrName.trim() ||
    filters.mode ||
    filters.visitDate ||
    filters.location.trim()
  );

  // Filtered data using useMemo for performance
  const filteredData = useMemo(() => {
    if (!companies.length) return [];

    const companyQuery = filters.company.trim().toLowerCase();
    const hrNameQuery = filters.hrName.trim().toLowerCase();
    const modeQuery = filters.mode;
    const visitDateQuery = filters.visitDate;
    const companyTypeQuery = filters.companyType;
    const locationQuery = filters.location.trim().toLowerCase();

    return companies.filter((company) => {
      const companyName = (company.company || company.companyName || '').toLowerCase();
      const jobRole = (company.jobRole || '').toLowerCase();
      const hrName = (company.hrName || '').toLowerCase();
      const mode = company.mode || '';
      const visitDate = (company.visitDate || '').slice(0, 10);
      const companyType = company.companyType || company.domain || '';
      const location = (company.location || '').toLowerCase();

      const matchesCompanyOrRole =
        !companyQuery || companyName.includes(companyQuery) || jobRole.includes(companyQuery);
      const matchesHrName = !hrNameQuery || hrName.includes(hrNameQuery);
      const matchesMode = !modeQuery || mode === modeQuery;
      const matchesVisitDate = !visitDateQuery || visitDate === visitDateQuery;
      const matchesCompanyType = !companyTypeQuery || companyType === companyTypeQuery;
      const matchesLocation = !locationQuery || location.includes(locationQuery);

      return matchesCompanyOrRole && matchesHrName && matchesMode && matchesVisitDate && matchesCompanyType && matchesLocation;
    });
  }, [companies, filters]);

  const totalPages = Math.ceil(filteredData.length / companiesPerPage) || 1;

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * companiesPerPage;
    return filteredData.slice(startIndex, startIndex + companiesPerPage);
  }, [filteredData, currentPage]);

  const toggleCompanySelection = useCallback((id) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      setSelectedCompanyIds(new Set());
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      setSelectedCompanyIds(new Set());
    }
  };

  // Reset page and selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCompanyIds(new Set());
  }, [filters]);


  // Handle input changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const location = useLocation();
  useEffect(() => {
    switch (location.pathname) {
      case "/dashboard":
        setActiveItem("Dashboard");
        break;
      case "/manage-students":
        setActiveItem("Manage Students");
        break;
      case "/company-profile":
        setActiveItem("Company Profile");
        break;
      case "/company-drive":
        setActiveItem("Company Drive");
        break;
      case "/certificate-verification":
        setActiveItem("Certificate Verification");
        break;
      case "/eligible-students":
        setActiveItem("Eligible Students");
        break;
      case "/attendance":
        setActiveItem("Attendance");
        break;
      case "/placed-students":
        setActiveItem("Placed Students");
        break;
      default:
        setActiveItem("Dashboard");
    }
  }, [location.pathname]);

  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const toggleExportMenu = () => {
    setShowExportMenu(prev => !prev);
  };

  // Function to simulate progress and handle export
  const simulateExport = async (operation, exportFunction) => {
    setShowExportMenu(false);

    setExportType(operation === 'excel' ? 'Excel' : 'PDF');
    setExportPopupState('progress');
    setExportProgress(0);

  let progressInterval;
  let progressTimeout;

  try {
      // Simulate progress from 0 to 100
      progressInterval = setInterval(() => {
          setExportProgress(prev => Math.min(prev + 10, 100));
      }, 200);

      // Wait for progress animation to complete
      await new Promise(resolve => {
          progressTimeout = setTimeout(() => {
              clearInterval(progressInterval);
              resolve();
          }, 2000);
      });
      
      // Perform the actual export
      exportFunction();

      setExportProgress(100);
      setExportPopupState('success');
  } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      if (progressTimeout) clearTimeout(progressTimeout);

      setExportPopupState('failed');
  }
};

  const exportToExcel = () => {
    try {
      const header = [
        "S.No",
        "Company",
        "Domain",
        "Job Role",
        "HR Name",
        "HR Contact",
        "Bond Period",
        "Mode",
        "Status",
        "Visit Date",
        "Package",
        "Location"
      ];
      const data = filteredData.map((item, index) => [
        index + 1,
        item.company || item.companyName || "—",
        item.companyType || item.domain || "—",
        item.jobRole || "—",
        item.hrName || "—",
        item.hrContact || item.contact || item.mobileNumber || "—",
        item.bondPeriod || item.bond || "—",
        item.mode || "—",
        item.status || "—",
        formatDisplayDate((item.visitDate || '').slice(0, 10)),
        item.package || item.packageLPA || item.ctc || "—",
        item.location || "—"
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Company Profile");
      XLSX.writeFile(wb, "CompanyProfile.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Export to Excel failed:", error);
      throw error;
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const tableColumn = [
        "S.No",
        "Company",
        "Company Type",
        "Job Role",
        "HR Name",
        "HR Contact",
        "Bond",
        "Mode",
        "Status",
        "Visit Date",
        "Package",
        "Location",
      ];

      const tableRows = filteredData.map((item, index) => [
        index + 1,
        item.company || item.companyName || "—",
        item.companyType || item.domain || "—",
        item.jobRole || "—",
        item.hrName || "—",
        item.hrContact || item.contact || item.mobileNumber || "—",
        item.bondPeriod || item.bond || "—",
        item.mode || "—",
        item.status || "—",
        formatDisplayDate((item.visitDate || '').slice(0, 10)),
        item.package || item.packageLPA || item.ctc || "—",
        item.location || "—",
      ]);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Company Profile Report", 14, 13);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 18,
        margin: { left: 10, right: 10 },
        styles: {
          fontSize: 7.5,
          cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
          overflow: "ellipsize",
          valign: "middle",
          halign: "center",
          font: "helvetica",
          lineWidth: 0.1,
          lineColor: [220, 220, 220],
        },
        headStyles: {
          fillColor: [210, 59, 66],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
          halign: "center",
          valign: "middle",
          minCellHeight: 8,
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },   // S.No
          1: { cellWidth: 34, halign: "center" },   // Company
          2: { cellWidth: 26, halign: "center" },   // Company Type
          3: { cellWidth: 28, halign: "center" },   // Job Role
          4: { cellWidth: 26, halign: "center" },   // HR Name
          5: { cellWidth: 24, halign: "center" },   // HR Contact
          6: { cellWidth: 20, halign: "center" },   // Bond
          7: { cellWidth: 16, halign: "center" },   // Mode
          8: { cellWidth: 20, halign: "center" },   // Status
          9: { cellWidth: 22, halign: "center" },   // Visit Date
          10: { cellWidth: 22, halign: "center" },  // Package
          11: { cellWidth: 27, halign: "center" },  // Location
        },
      });

      doc.save("CompanyProfile.pdf");
      setShowExportMenu(false);
    } catch (error) {
      console.error("Export to PDF failed:", error);
      throw error;
    }
  };

  const handleExportToPDF = () => {
    simulateExport('pdf', exportToPDF);
  };
  
  const handleExportToExcel = () => {
    simulateExport('excel', exportToExcel);
  };
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Navigate to view page
  const openViewPopup = (companyId) => {
    const company = companies.find(c => (c.id || c._id) === companyId);
    navigate(`/coo-company-profile/manage/view/${companyId}`, { state: { company } });
  };

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className={styles['co-cp-layout']}>
        <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="company-profile" onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className={styles['co-cp-main-content']}>
          {/* Top Cards Row */}
          <div className={styles['co-cp-top-cards-row']}>

            {/* 1: Company Drive Card */}
            <div className={`${styles['co-cp-card']} ${styles['co-cp-report-analysis-card']}`} onClick={() => handleCardClick('company-drive')} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && handleCardClick('company-drive')} >
              <img src={CompanyDrive} alt="Company Drive" className={styles['co-cp-report-analysis-card__image']} />
              <h4 className={styles['co-cp-card-title']}>Company Drive</h4>
              <p className={styles['co-cp-card-desc']}>
                View upcoming, Ongoing, and Completed drives
              </p>
            </div>

            {/* 2: Search Filter Card */}
            <div className={styles['co-cp-search-filter-card']} >
              <div className={styles['co-cp-filter-header-container']}>
                <div className={styles['co-cp-filter-header']}>Company Profile</div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className={styles['co-cp-clear-btn-header']}
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className={styles['co-cp-search-filter-card__fields-container']}>
                {/* 1. Company / Job Role Input */}
                <div className={styles['co-cp-input-wrapper']}>
                  <label className={styles['co-cp-static-label']} htmlFor="search-company">
                    Company / Job Role
                  </label>
                  <div className={`${styles['co-cp-text-container']} ${companyFocused ? styles['is-focused'] : ''}`}>
                    <input
                      id="search-company"
                      type="text"
                      className={styles['co-cp-text']}
                      placeholder="Search Company / Job Role"
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      onFocus={() => setCompanyFocused(true)}
                      onBlur={() => setCompanyFocused(false)}
                      aria-label="Search Company or Job Role"
                    />
                  </div>
                </div>

                {/* 2. Company Type Dropdown */}
                <div className={styles['co-cp-input-wrapper']}>
                  <label className={styles['co-cp-static-label']} htmlFor="search-company-type">
                    Company Type
                  </label>
                  <Dropdown
                    id="search-company-type"
                    options={['CORE', 'IT', 'ITES(BPO/KPO)', 'Marketing & Sales', 'HR / Business analyst']}
                    selectedOption={filters.companyType}
                    onSelect={(val) => handleFilterChange('companyType', val)}
                    placeholder="Search Company Type"
                    role="coordinator"
                    className={styles['cp-dropdown-wrapper']}
                    headerClassName={styles['cp-dropdown-header']}
                  />
                </div>

                {/* 3. HR Name Input */}
                <div className={styles['co-cp-input-wrapper']}>
                  <label className={styles['co-cp-static-label']} htmlFor="search-hr-name">
                    HR Name
                  </label>
                  <div className={`${styles['co-cp-text-container']} ${hrNameFocused ? styles['is-focused'] : ''}`}>
                    <input
                      id="search-hr-name"
                      type="text"
                      className={styles['co-cp-text']}
                      placeholder="Search HR Name"
                      value={filters.hrName}
                      onChange={(e) => handleFilterChange('hrName', e.target.value)}
                      onFocus={() => setHrNameFocused(true)}
                      onBlur={() => setHrNameFocused(false)}
                      aria-label="Search HR Name"
                    />
                  </div>
                </div>

                {/* 4. Search Mode Dropdown */}
                <div className={styles['co-cp-input-wrapper']}>
                  <label className={styles['co-cp-static-label']} htmlFor="search-mode">
                    Search Mode
                  </label>
                  <Dropdown
                    id="search-mode"
                    options={['Online', 'Offline', 'Hybrid']}
                    selectedOption={filters.mode}
                    onSelect={(val) => handleFilterChange('mode', val)}
                    placeholder="Search Mode"
                    role="coordinator"
                    className={styles['cp-dropdown-wrapper']}
                    headerClassName={styles['cp-dropdown-header']}
                  />
                </div>

                {/* 5. Visit Date Calendar */}
                <div className={styles['co-cp-input-wrapper']}>
                  <label className={styles['co-cp-static-label']} htmlFor="search-visit-date">
                    Visit Date
                  </label>
                  <CooCalendar
                    id="search-visit-date"
                    value={filters.visitDate}
                    onChange={handleFilterVisitDateChange}
                    variant="filter"
                    enabledDates={visitDateOptions}
                  />
                </div>

                {/* 6. Location Input */}
                <div className={styles['co-cp-input-wrapper']}>
                  <label className={styles['co-cp-static-label']} htmlFor="search-location">
                    Location
                  </label>
                  <div className={`${styles['co-cp-text-container']} ${locationFocused ? styles['is-focused'] : ''}`}>
                    <input
                      id="search-location"
                      type="text"
                      className={styles['co-cp-text']}
                      placeholder="Search Location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      onFocus={() => setLocationFocused(true)}
                      onBlur={() => setLocationFocused(false)}
                      aria-label="Search Location"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3: Companies Stat Card */}
            <div className={`${styles['co-cp-card']} ${styles['co-cp-stat-card']}`}>
              <img src={CooCompanyprofileCompanies} alt="Companies" className={styles['co-cp-stat-card__image']} />
              <span className={styles['co-cp-stat-card__label']}>Companies Added</span>
              <span className={styles['co-cp-stat-card__value']}>{companies.length}</span>
            </div>

            {/* 4: Confirmed Stat Card */}
            <div className={`${styles['co-cp-card']} ${styles['co-cp-stat-card']}`}>
              <img src={CooCompanyprofileConfirmed} alt="Confirmed" className={styles['co-cp-stat-card__image']} />
              <span className={styles['co-cp-stat-card__label']}>Confirmed Companies</span>
              <span className={styles['co-cp-stat-card__value']}>{companies.filter(c => (c.status || '').toLowerCase() === 'confirmed').length}</span>
            </div>

          </div>
          
          {/* --- Company Profile Table Container --- */}
          <div className={styles['co-cp-bottom-card']}>
              <div className={styles['co-cp-table-header-row']}>
                  <div className={styles['co-cp-table-title-wrap']}>
                      <div className={styles['co-cp-table-title-top-row']}>
                          <h3 className={styles['co-cp-table-title']}>COMPANY PROFILE</h3>
                          <div className={`${styles['co-cp-print-button-container']} ${styles['mobile-only-print']}`}>
                              <button
                                  type="button"
                                  className={styles['co-cp-print-btn']}
                                  onClick={() => setShowExportMenu((prev) => !prev)}
                              >
                                  Print
                              </button>
                              {showExportMenu && (
                                  <div className={styles['co-cp-export-menu']}>
                                      <button type="button" onClick={handleExportToExcel}>Export to Excel</button>
                                      <button type="button" onClick={handleExportToPDF}>Save as PDF</button>
                                  </div>
                              )}
                          </div>
                      </div>
                      {!isInitialLoading && (
                          <div className={styles['co-cp-table-subtitle']}>
                              Page {currentPage} of {totalPages} | Showing {paginatedCompanies.length} on this page
                          </div>
                      )}
                  </div>
                  <div className={styles['co-cp-table-actions']}>
                      {totalPages > 1 && (
                          <div className={styles['co-cp-pagination-controls']}>
                              <button
                                  type="button"
                                  className={styles['co-cp-page-btn']}
                                  onClick={handlePrevPage}
                                  disabled={currentPage <= 1 || isLoading}
                              >
                                  Prev
                              </button>
                              <span className={styles['co-cp-page-indicator']}>
                                  {currentPage} / {totalPages}
                              </span>
                              <button
                                  type="button"
                                  className={styles['co-cp-page-btn']}
                                  onClick={handleNextPage}
                                  disabled={currentPage >= totalPages || isLoading}
                              >
                                  Next
                              </button>
                          </div>
                      )}
                      <div className={`${styles['co-cp-print-button-container']} ${styles['desktop-only-print']}`}>
                          <button
                              type="button"
                              className={styles['co-cp-print-btn']}
                              onClick={() => setShowExportMenu((prev) => !prev)}
                          >
                              Print
                          </button>
                          {showExportMenu && (
                              <div className={styles['co-cp-export-menu']}>
                                  <button type="button" onClick={handleExportToExcel}>Export to Excel</button>
                                  <button type="button" onClick={handleExportToPDF}>Save as PDF</button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              <div className={styles['co-cp-table-container']} id="co-cp-drive-table-container__table-wrapper">
                  <table className={styles['co-cp-students-table']}>
                      <thead>
                          <tr className={styles['co-cp-table-head-row']}>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-sno']}`}>S.No</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-company']}`}>Company</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-domain']}`}>Company Type</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-job-role']}`}>Job Role</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-mode']}`}>Mode</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-hr-name']}`}>HR Name</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-visit-date']}`}>Visit Date</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-location']}`}>Location</th>
                              <th className={`${styles['co-cp-th']} ${styles['co-cp-profile']}`}>View</th>
                          </tr>
                      </thead>
                      <tbody>
                          {isInitialLoading ? (
                              <tr className={styles['co-cp-loading-row']}>
                                  <td colSpan="9" className={styles['co-cp-loading-cell']}>
                                      <div className={styles['co-cp-loading-wrapper']}>
                                          <div className={styles['co-cp-spinner']}></div>
                                          <span className={styles['co-cp-loading-text']}>Loading companies…</span>
                                      </div>
                                  </td>
                              </tr>
                          ) : paginatedCompanies.length ? (
                              paginatedCompanies.map((company, index) => {
                                  const companyId = company.id || company._id;
                                  const isSelected = selectedCompanyIds.has(companyId);

                                  return (
                                      <tr
                                          key={companyId}
                                          className={`${styles['co-cp-table-row']} ${isSelected ? styles['co-cp-selected-row'] : ''}`}
                                          onClick={() => toggleCompanySelection(companyId)}
                                      >
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-sno']}`}>{(currentPage - 1) * companiesPerPage + index + 1}</td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-company']}`}>{company.company || company.companyName || '—'}</td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-domain']}`}>{company.companyType || company.domain || '—'}</td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-job-role']}`}>{company.jobRole || '—'}</td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-mode']}`}>{company.mode || '—'}</td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-hr-name']}`}>{company.hrName || '—'}</td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-visit-date']}`}>
                                              {formatDisplayDate((company.visitDate || '').slice(0, 10))}
                                          </td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-location']}`}>{company.location || '—'}</td>
                                          <td className={`${styles['co-cp-td']} ${styles['co-cp-profile']}`} onClick={(e) => {
                                              e.stopPropagation();
                                              openViewPopup(companyId);
                                          }}>
                                              <svg className={styles['co-cp-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                  <circle cx="12" cy="12" r="3"></circle>
                                              </svg>
                                          </td>
                                      </tr>
                                  );
                              })
                          ) : (
                              <tr>
                                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                      No companies found matching the applied filters.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
        </div>

      </div>

      <ExportProgressAlert
        isOpen={exportPopupState === 'progress'}
        onClose={() => {}}
        progress={exportProgress}
        exportType={exportType}
        color="#d23b42"
        progressColor="#d23b42"
      />

      <ExportSuccessAlert
        isOpen={exportPopupState === 'success'}
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
        color="#d23b42"
      />

      <ExportFailedAlert
        isOpen={exportPopupState === 'failed'}
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
        color="#d23b42"
      />


         
    </>
  );
}

export default CompanyProfile;