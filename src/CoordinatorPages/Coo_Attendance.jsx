import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import Dropdown from '../components/common/Dropdown/Dropdown';
import styles from './Coo_Attendance.module.css';
import mongoDBService from '../services/mongoDBService.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Helper function to read coordinator data from storage
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

// Helper function to resolve coordinator's department/branch
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

export default function Attendance({ onLogout, currentView, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const navigate = useNavigate();

  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [drives, setDrives] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [existingAttendances, setExistingAttendances] = useState([]);
  const [eligibleStudentsData, setEligibleStudentsData] = useState([]);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh data
  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fetch coordinator's branch and attendance data on mount
  useEffect(() => {
    const coordinatorData = readStoredCoordinatorData();
    const branch = resolveCoordinatorDepartment(coordinatorData);
    
    if (branch) {
      setCoordinatorBranch(branch);
      console.log('Coordinator branch:', branch);
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Clear previous data to prevent caching
        setDrives([]);
        setExistingAttendances([]);
        setSelectedCompanyJob(null);
        setStartDate("");
        setEndDate("");
        setStudents([]);
        setAvailableDates([]);
        
        console.log('=== FETCHING FRESH DATA ===');
        console.log('Timestamp:', new Date().toISOString());
        
        // Fetch fresh data from companies.drives collection AND eligible students
        const [drivesResponse, attendancesResponse, eligibleStudentsResponse] = await Promise.all([
          mongoDBService.getCompanyDrives(),
          mongoDBService.getAllAttendance(),
          mongoDBService.getAllEligibleStudents()
        ]);
        
        console.log('RAW drives response:', drivesResponse);
        console.log('Drive count:', Array.isArray(drivesResponse) ? drivesResponse.length : 'Not an array');
        console.log('RAW attendances response:', attendancesResponse);
        console.log('Eligible students response:', eligibleStudentsResponse.eligibleStudents);
        
        // Filter drives by coordinator's branch
        const allDrives = Array.isArray(drivesResponse) ? drivesResponse : [];
        const allEligibleStudents = eligibleStudentsResponse.eligibleStudents || [];
        console.log('All drives before filtering:', allDrives);
        
        // Normalize date for comparison
        const normalizeDate = (dateStr) => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        };
        
        const branchDrives = allDrives.filter(drive => {
          const driveBranches = (drive.eligibleBranches || drive.branch || drive.department || '').toString().split(',').map(b => b.trim().toUpperCase());
          const matchesBranch = branch && driveBranches.some(b => b === branch || b.includes(branch));
          
          // Check if drive has eligible students
          const driveDateNormalized = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate);
          const hasEligibleStudents = allEligibleStudents.some(es => {
            const esDateNormalized = normalizeDate(es.driveStartDate || es.companyDriveDate);
            return es.companyName === drive.companyName && esDateNormalized === driveDateNormalized;
          });
          
          console.log(`Drive ${drive.companyName} - ${drive.jobRole}:`, {
            eligibleBranches: drive.eligibleBranches,
            branch: drive.branch,
            department: drive.department,
            parsed: driveBranches,
            coordinatorBranch: branch,
            matchesBranch,
            hasEligibleStudents,
            finalMatch: matchesBranch && hasEligibleStudents
          });
          
          return matchesBranch && hasEligibleStudents;
        });
        
        console.log('Filtered drives for branch', branch, ':', branchDrives);
        console.log('=== END FETCH ===');
        
        setDrives(branchDrives);
        setExistingAttendances(attendancesResponse.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]); // Re-fetch when refreshKey changes
  
  // Refresh data when page becomes visible (prevent stale cache)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible again - refreshing data');
        refreshData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Format date display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'dd-mm-yyyy';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Group drives by company and job role
  const groupedDrivesArray = useMemo(() => {
    const grouped = drives.reduce((acc, drive) => {
      const key = `${drive.companyName}-${drive.jobRole}`;
      if (!acc[key]) {
        acc[key] = {
          companyName: drive.companyName,
          jobRole: drive.jobRole,
          drives: []
        };
      }
      acc[key].drives.push(drive);
      return acc;
    }, {});
    return Object.values(grouped);
  }, [drives]);

  const driveDropdownOptions = useMemo(() => {
    return groupedDrivesArray.map(group => {
      const key = `${group.companyName}:${group.jobRole}`;
      const hasAttendance = existingAttendances.some(
        att => att.companyName === group.companyName &&
               att.jobRole === group.jobRole
      );
      return {
        label: `${group.companyName} : ${group.jobRole}`,
        value: key,
        style: {
          color: hasAttendance ? '#D23B42' : '#555',
          fontWeight: hasAttendance ? '600' : 'bold'
        }
      };
    });
  }, [groupedDrivesArray, existingAttendances]);

  const startDateDropdownOptions = useMemo(() => {
    return availableDates.map(dateObj => {
      const hasAttendance = selectedCompanyJob && existingAttendances.some(
        att => att.companyName === selectedCompanyJob.companyName &&
               att.jobRole === selectedCompanyJob.jobRole &&
               new Date(att.startDate).toDateString() === new Date(dateObj.date).toDateString()
      );
      return {
        label: formatDateDisplay(dateObj.date),
        value: dateObj.date,
        style: {
          color: hasAttendance ? '#D23B42' : '#555',
          fontWeight: hasAttendance ? '600' : 'bold'
        }
      };
    });
  }, [availableDates, selectedCompanyJob, existingAttendances]);

  // Handle company/job selection
  const handleCompanyJobSelect = (group) => {
    setSelectedCompanyJob(group);
    setIsDriveOpen(false);
    
    // Get available dates for this company/job from the actual DB field names
    const dates = group.drives
      .filter(drive => drive.startingDate || drive.driveStartDate || drive.companyDriveDate)
      .map(drive => ({
        date: drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
        endDate: drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
        drive: drive
      }));
    
    setAvailableDates(dates);
    setStartDate("");
    setEndDate("");
    setStudents([]);
  };

  // Load students for a specific drive
  const loadStudentsForDrive = async (drive) => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading students for drive:', drive);
      console.log('🔍 Coordinator branch:', coordinatorBranch);
      
      // Fetch fresh eligible students data
      const eligibleStudentsResponse = await mongoDBService.getAllEligibleStudents();
      const allEligibleStudents = eligibleStudentsResponse.eligibleStudents || [];
      console.log('📋 Fresh eligible students data:', allEligibleStudents);
      
      // Normalize date for comparison (remove time portion)
      const normalizeDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
      };
      
      const driveDateNormalized = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate);
      console.log('🎯 Looking for company:', drive.companyName, 'date:', driveDateNormalized);
      
      // Find eligible students record matching this drive's company and date
      const matchingEligibleStudents = allEligibleStudents.find(es => {
        const esDateNormalized = normalizeDate(es.driveStartDate || es.companyDriveDate);
        const matches = es.companyName === drive.companyName && esDateNormalized === driveDateNormalized;
        console.log(`  Checking: ${es.companyName} (${esDateNormalized}) === ${drive.companyName} (${driveDateNormalized})? ${matches ? '✅' : '❌'}`);
        return matches;
      });
      
      if (!matchingEligibleStudents || !matchingEligibleStudents.students || matchingEligibleStudents.students.length === 0) {
        console.warn('⚠️ No eligible students found for this drive');
        console.log('Available eligible student records:', allEligibleStudents.map(es => ({
          company: es.companyName,
          date: es.driveStartDate,
          studentCount: es.students?.length || 0
        })));
        setStudents([]);
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Found matching eligible students:', matchingEligibleStudents);
      console.log(`📊 Found ${matchingEligibleStudents.students.length} total students`);
      
      // Check if attendance already exists for this drive
      const existingAttendance = existingAttendances.find(
        att => att.companyName === drive.companyName &&
               att.jobRole === drive.jobRole &&
               new Date(att.startDate).toDateString() === new Date(drive.startingDate || drive.driveStartDate).toDateString()
      );
      
      // Fetch complete student details for each student in the eligible students list
      const studentPromises = (matchingEligibleStudents.students || []).map(async (student, index) => {
        try {
          const response = await mongoDBService.getStudentById(student.studentId);
          const studentData = response;
          
          // Format year-sec as III-B format
          let yearSec = '-';
          if (studentData?.currentYear && studentData?.section) {
            yearSec = `${studentData.currentYear}-${studentData.section}`;
          } else if (studentData?.year && studentData?.section) {
            yearSec = `${studentData.year}-${studentData.section}`;
          }
          
          // Calculate semester from year
          let semester = '-';
          if (studentData?.semester || studentData?.currentSemester) {
            semester = studentData?.semester || studentData?.currentSemester;
          } else if (studentData?.currentYear || studentData?.year) {
            const year = studentData?.currentYear || studentData?.year;
            const semesterMap = { 'I': '1', 'II': '3', 'III': '5', 'IV': '7' };
            semester = semesterMap[year] || '-';
          }
          
          // Check if this student has attendance marked
          let status = '-';
          if (existingAttendance && existingAttendance.students) {
            const attendanceRecord = existingAttendance.students.find(s => s.studentId === student.studentId || s.regNo === student.regNo);
            if (attendanceRecord) {
              status = attendanceRecord.status || '-';
            }
          }
          
          // Filter by coordinator branch
          const studentBranch = (student.branch || studentData?.department || studentData?.branch || '').toUpperCase();
          if (studentBranch !== coordinatorBranch) {
            return null; // Skip students not in coordinator's branch
          }
          
          return {
            sNo: index + 1,
            studentId: student.studentId,
            name: student.name || (studentData?.firstName && studentData?.lastName ? `${studentData.firstName} ${studentData.lastName}` : '-'),
            regNo: student.regNo || studentData?.regNo || '-',
            batch: student.batch || studentData?.batch || '-',
            yearSec: yearSec,
            semester: semester,
            phoneNo: studentData?.mobileNo || studentData?.phoneNo || studentData?.phone || '-',
            branch: studentBranch,
            status: status
          };
        } catch (error) {
          console.error(`Error fetching student ${student.studentId}:`, error);
          return null;
        }
      });
      
      const resolvedStudents = (await Promise.all(studentPromises)).filter(s => s !== null);
      console.log(`✅ Resolved ${resolvedStudents.length} students for branch ${coordinatorBranch}`);
      console.log('Student data:', resolvedStudents);
      setStudents(resolvedStudents);
    } catch (error) {
      console.error('❌ Error fetching student details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle start date selection
  const handleStartDateSelect = async (dateObj) => {
    setStartDate(dateObj.date);
    setIsStartDateOpen(false);
    setEndDate(dateObj.endDate || dateObj.date);
    
    // Load students for this drive
    await loadStudentsForDrive(dateObj.drive);
  };

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }
    const searchLower = searchTerm.toLowerCase().trim();
    return students.filter(student =>
      (student.name || '').toLowerCase().includes(searchLower) ||
      (student.regNo || '').toLowerCase().includes(searchLower)
    );
  }, [students, searchTerm]);

  // Calculate stats from students
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.status === 'Present').length;
    const absent = students.filter(s => s.status === 'Absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  }, [students]);

  // Pie chart data
  const pieData = useMemo(() => {
    return students.length === 0 
      ? [{ name: 'No Data', value: 1, color: '#e0e0e0' }]
      : [
          { name: 'Present', value: stats.present, color: '#2DBE7F' },
          { name: 'Absent', value: stats.absent, color: '#F04F4F' }
        ];
  }, [students, stats]);

  // ADDED: NEW STATE FOR RESPONSIVE SIDEBAR
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // ADDED: NEW FUNCTION TO TOGGLE SIDEBAR
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      {/* Navbar JSX */}
      <Navbar onToggleSidebar={toggleSidebar} />

      <div className={styles["co-at-layout-main"]}>
        {/* MODIFIED: Pass state for conditional class to Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="attendance"
          onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Layout */}
        <div className={styles["co-at-main-content-layout"]}>
          {/* Filter Section */}
          <div className={styles["co-at-filter-section"]}>
            {/* Select Drive Dropdown (Company : Job Role) */}
            <Dropdown
              options={driveDropdownOptions}
              selectedOption={selectedCompanyJob ? `${selectedCompanyJob.companyName}:${selectedCompanyJob.jobRole}` : ''}
              onSelect={(key) => {
                const group = groupedDrivesArray.find(g => `${g.companyName}:${g.jobRole}` === key);
                if (group) handleCompanyJobSelect(group);
              }}
              placeholder="Select Drive"
              role="coordinator"
              className={styles['attendance-dropdown-wrapper']}
              headerClassName={styles['attendance-dropdown-header']}
            />
            
            {/* Start Date Dropdown */}
            <Dropdown
              options={startDateDropdownOptions}
              selectedOption={startDate}
              onSelect={(selectedDate) => {
                const dateObj = availableDates.find(d => d.date === selectedDate);
                if (dateObj) handleStartDateSelect(dateObj);
              }}
              placeholder="Select Start Date"
              disabled={!selectedCompanyJob}
              role="coordinator"
              className={styles['attendance-dropdown-wrapper']}
              headerClassName={styles['attendance-dropdown-header']}
            />
            
            {/* End Date Display (Read-only) */}
            <div className={styles["co-at-filter-select"]}>
              <div 
                className={styles["co-at-filter-select-display"]}
                style={{ 
                  cursor: 'default',
                  backgroundColor: '#ffffff',
                  color: endDate ? '#333' : '#999'
                }}
              >
                {endDate ? formatDateDisplay(endDate) : "Select End Date"}
              </div>
              <span 
                className={styles["co-at-filter-select-arrow"]}
                style={{ cursor: 'default', opacity: 0.3 }}
              >
                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>
              </span>
            </div>
          </div>
          {/* Grid and Pie Chart Section */}
          <div className={styles["co-at-summary-pie-layout"]}>
            <div className={styles["co-at-summary-grid"]}>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-blue"]}`}>
                <div className={styles["co-at-card-label"]}>Total Students</div>
                <div className={styles["co-at-card-value"]}>{stats.total}</div>
              </div>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-green"]}`}>
                <div className={styles["co-at-card-label"]}>Total Present</div>
                <div className={styles["co-at-card-value"]}>{stats.present}</div>
              </div>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-darkblue"]}`}>
                <div className={styles["co-at-card-label"]}>Percentage</div>
                <div className={styles["co-at-card-value"]}>{stats.percentage} <span style={{ fontSize: '17px' }}>%</span></div>
              </div>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-red"]}`}>
                <div className={styles["co-at-card-label"]}>Total Absent</div>
                <div className={styles["co-at-card-value"]}>{stats.absent}</div>
              </div>
            </div>
            <div className={styles["co-at-pie-chart-section"]}>
              <div className={styles["co-at-pie-chart-header"]}>
                <div className={styles["co-at-pie-chart-title"]}>Attendance</div>
                <div className={styles["co-at-pie-chart-date"]}>{startDate ? formatDateDisplay(startDate) : 'dd/mm/yyyy'}</div>
              </div>
              <div className={styles["co-at-pie-chart-content"]}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={pieData[0].name === 'No Data' ? false : ({ name, value }) => `${name} ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles["co-at-pie-chart-stats"]}>
                  <div
                    className={`${styles["co-at-pie-chart-stat-row"]} ${styles["co-at-pie-chart-stat-present"]}`}
                  >
                    <span className={styles["co-at-pie-chart-stat-label"]}>Present</span>
                    <span className={styles["co-at-pie-chart-stat-value"]}>{stats.present}</span>
                  </div>
                  <div
                    className={`${styles["co-at-pie-chart-stat-row"]} ${styles["co-at-pie-chart-stat-absent"]}`}
                  >
                    <span className={styles["co-at-pie-chart-stat-label"]}>Absent</span>
                    <span className={styles["co-at-pie-chart-stat-value"]}>{stats.absent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Table Section */}
          
          <div className={styles["co-at-table-section"]}>
            <div className={styles["co-at-table-header-row"]}>
              <div className={styles["co-at-table-header"]}>ATTENDANCE DETAILS - {coordinatorBranch || 'Loading...'}</div>
              <input
                type="text"
                placeholder="Enter Name / Reg No"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles['co-at-search-input']}
              />
            </div>
            <div className={styles['co-at-table-body-scroll']}>
              <table className={styles['co-at-attendance-table-body']}>
                <thead>
                  <tr>
                    <th style={{ width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>S.No</th>
                    <th style={{ width: '16%', textAlign: 'center', verticalAlign: 'middle' }}>Name</th>
                    <th style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>Register Number</th>
                    <th style={{ width: '11%', textAlign: 'center', verticalAlign: 'middle' }}>Batch</th>
                    <th style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>Year-Sec</th>
                    <th style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>Sem</th>
                    <th style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle' }}>Phone No</th>
                    <th style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles['co-at-loading-row']}>
                      <td colSpan="8" className={styles['co-at-loading-cell']}>
                        <div className={styles['co-at-loading-wrapper']}>
                          <div className={styles['co-at-spinner']}></div>
                          <span className={styles['co-at-loading-text']}>Loading students...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#F04F4F' }}>
                        {error}
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        {students.length === 0 ? (!selectedCompanyJob ? 'Select a drive to view attendance' : `No students found for ${coordinatorBranch} branch`) : 'No matching students found'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <tr key={index}>
                        <td style={{ width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>{student.sNo || (index + 1)}</td>
                        <td style={{ width: '16%', fontWeight: '600', textAlign: 'center', verticalAlign: 'middle' }}>{student.name || '-'}</td>
                        <td style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>{student.regNo || '-'}</td>
                        <td style={{ width: '11%', textAlign: 'center', verticalAlign: 'middle' }}>{student.batch || '-'}</td>
                        <td style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>{student.yearSec || '-'}</td>
                        <td style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>{student.semester || '-'}</td>
                        <td style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle' }}>{student.phoneNo || '-'}</td>
                        <td 
                          style={{ 
                            width: '10%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            color: student.status === "Present" ? '#00B728' : student.status === "Absent" ? '#E62727' : '#888',
                            fontWeight: 'bold'
                          }}
                        >
                          {student.status || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}