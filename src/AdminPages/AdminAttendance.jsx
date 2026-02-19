import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import useAdminAuth from '../utils/useAdminAuth';

import Navbar from "../components/Navbar/Adnavbar.js";

import Sidebar from "../components/Sidebar/Adsidebar.js";



import mongoDBService from '../services/mongoDBService';

import Adminicon from "../assets/Adminicon.png";



import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

import styles from './AdminAttendance.module.css';



// Success Popup Component

const AttendanceSuccessPopup = ({ onClose, isUpdate, presentCount, absentCount, companyName, jobRole, startDate, endDate }) => {

  // Format date to dd-mm-yyyy

  const formatDate = (dateString) => {

    if (!dateString) return '';

    const [year, month, day] = dateString.split('-');

    return `${day}-${month}-${year}`;

  };



  return (

    <div className={styles['Admin-at-popup-overlay']}>

      <div className={styles['Admin-popup-container']}>

        <div className={styles['Admin-popup-header']}>{isUpdate ? 'Updated!' : 'Submitted!'}</div>

        <div className={styles['Admin-popup-body']}>

          <svg className={styles['Admin-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">

            <circle className={styles['Admin-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>

            <path className={styles['Admin-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>

          </svg>

          <div style={{ margin: '1rem 0 0.5rem 0', fontSize: 16, color: '#1E1F24' }}>

            <div style={{ fontWeight: 700 }}>{companyName} : {jobRole}</div>

            <div style={{ marginTop: '0.3rem', fontSize: 15, color: '#6B6D74', fontWeight: 400 }}>

              {formatDate(startDate)} to {formatDate(endDate)}

            </div>

          </div>

          <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.45rem', fontWeight: 500, color: '#1E1F24' }}>

            Attendance {isUpdate ? 'Updated' : 'Submitted'} ✓

          </h2>

          <div style={{ margin: '1.5rem 0', fontSize: 18, color: '#555' }}>

            <div style={{ marginBottom: '0.8rem' }}>

              <span style={{ color: '#4EA24E', fontWeight: 'bold', fontSize: 18 }}>Present: </span>

              <span style={{ fontWeight: 'bold', fontSize: 22, color: '#333' }}>{presentCount}</span>

            </div>

            <div>

              <span style={{ color: '#E62727', fontWeight: 'bold', fontSize: 18 }}>Absent: </span>

              <span style={{ fontWeight: 'bold', fontSize: 22, color: '#333' }}>{absentCount}</span>

            </div>

          </div>

        </div>

        <div className={styles['Admin-popup-footer']}>

          <button onClick={onClose} className={styles['Admin-popup-close-btn']}>Close</button>

        </div>

      </div>

    </div>

  );

};



// Validation Popup for Unmarked Students

const UnmarkedStudentsPopup = ({ students, onClose, onShow }) => (

  <div className={styles['Admin-at-popup-overlay']}>

    <div className={styles['Admin-popup-container']}>

      <div className={styles['Admin-popup-header-warning']}>Attendance Not Marked!</div>

      <div className={styles['Admin-popup-body']}>

        <svg className={styles['Admin-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">

          <circle className={styles['Admin-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>

          <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none"/>

        </svg>

        <h2 className={styles['Admin-status-title']}>

          Please Mark Attendance

        </h2>

        <div className={styles['Admin-popup-scroll']} style={{ margin: '1.5rem 0', fontSize: 16, color: '#6B6D74', maxHeight: '240px', overflowY: 'auto' }}>

          <p className={styles['Admin-status-text']} style={{ marginBottom: '1.2rem', fontWeight: 600 }}>The following students have not been marked:</p>

          {students.map((student, index) => (

            <div key={index} style={{ marginBottom: '0.8rem', padding: '0.8rem', background: '#f9f9f9', borderRadius: '8px', textAlign: 'left', border: '1px solid #e5e5e5' }}>

              <div style={{ fontWeight: 'bold', color: '#1E1F24', fontSize: '15px' }}>{student.name}</div>

              <div style={{ fontSize: '14px', color: '#6B6D74', marginTop: '4px' }}>Reg No: {student.regNo}</div>

              <div style={{ fontSize: '14px', color: '#6B6D74' }}>Branch: {student.branch}</div>

            </div>

          ))}

        </div>

      </div>

      <div className={styles['Admin-popup-footer']}>

        <button onClick={() => onShow(students[0])} className={styles['Admin-popup-show-btn']}>Show</button>

        <button onClick={onClose} className={styles['Admin-popup-close-btn']}>Close</button>

      </div>

    </div>

  </div>

);



export default function AdminAtt({ onLogout }) {

  const navigate = useNavigate();

  useAdminAuth(); // JWT authentication verification

  const location = useLocation();

  const [isDriveOpen, setIsDriveOpen] = useState(false);

  const [isStartDateOpen, setIsStartDateOpen] = useState(false);

  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);

  const [selectedDrive, setSelectedDrive] = useState(null);

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [drives, setDrives] = useState([]);

  const [students, setStudents] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [availableDates, setAvailableDates] = useState([]);

  const [availableEndDates, setAvailableEndDates] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  const [existingAttendances, setExistingAttendances] = useState([]);

  const [currentAttendanceId, setCurrentAttendanceId] = useState(null);

  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [successPopupData, setSuccessPopupData] = useState({ isUpdate: false, presentCount: 0, absentCount: 0, companyName: '', jobRole: '', startDate: '', endDate: '' });

  const [showUnmarkedPopup, setShowUnmarkedPopup] = useState(false);

  const [unmarkedStudents, setUnmarkedStudents] = useState([]);

  const [eligibleStudentsData, setEligibleStudentsData] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);



  const [refreshKey, setRefreshKey] = useState(0);



  // Function to refresh data

  const refreshData = () => {

    setRefreshKey(prev => prev + 1);

  };



  // Filter students based on search term

  const filteredStudents = useMemo(() => {

    if (!searchTerm.trim()) {

      return students;

    }

    const searchLower = searchTerm.toLowerCase().trim();

    return students.filter(student => 

      student.name.toLowerCase().includes(searchLower) ||

      student.regNo.toLowerCase().includes(searchLower)

    );

  }, [students, searchTerm]);



  const toggleSidebar = () => {

    setIsSidebarOpen(prev => !prev);

  };



  // Listen for sidebar close event from navigation links

  useEffect(() => {

    const handleCloseSidebar = () => {

      setIsSidebarOpen(false);

    };

    window.addEventListener('closeSidebar', handleCloseSidebar);

    return () => {

      window.removeEventListener('closeSidebar', handleCloseSidebar);

    };

  }, []);



  // Fetch all company drives and existing attendances

  useEffect(() => {

    const fetchData = async () => {

      try {

        setIsLoading(true);

        

        // Clear previous data to prevent caching

        setDrives([]);

        setExistingAttendances([]);

        setSelectedCompanyJob(null);

        setSelectedDrive(null);

        setStartDate("");

        setEndDate("");

        setStudents([]);

        setAvailableDates([]);

        setAvailableEndDates([]);

        

        console.log('=== ADMIN FETCHING FRESH DATA ===');

        console.log('Timestamp:', new Date().toISOString());

        

        // Fetch from companies.drives collection AND eligible students

        const [drivesResponse, attendancesResponse, eligibleStudentsResponse] = await Promise.all([

          mongoDBService.getCompanyDrives(),

          mongoDBService.getAllAttendances(),

          mongoDBService.getAllEligibleStudents()

        ]);

        

        console.log('Admin RAW drives response:', drivesResponse);

        console.log('Admin Drive count:', Array.isArray(drivesResponse) ? drivesResponse.length : 'Not an array');

        console.log('Admin Eligible Students:', eligibleStudentsResponse.eligibleStudents);

        

        const allDrives = Array.isArray(drivesResponse) ? drivesResponse : [];

        setDrives(allDrives);

        setExistingAttendances(attendancesResponse.data || []);

        setEligibleStudentsData(eligibleStudentsResponse.eligibleStudents || []);

        setIsLoading(false);

        

        console.log('=== ADMIN END FETCH ===');

      } catch (error) {

        console.error('Error fetching data:', error);

        setIsLoading(false);

      }

    };

    fetchData();

  }, [refreshKey]);

  

  // Refresh data when page becomes visible (prevent stale cache)

  useEffect(() => {

    const handleVisibilityChange = () => {

      if (!document.hidden) {

        console.log('Admin page visible again - refreshing data');

        refreshData();

      }

    };

    

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {

      document.removeEventListener('visibilitychange', handleVisibilityChange);

    };

  }, []);



  // Format date to dd-mm-yyyy

  const formatDate = (dateString) => {

    if (!dateString) return '';

    const [year, month, day] = dateString.split('-');

    return `${day}-${month}-${year}`;

  };



  // Format date to dd-mm-yyyy

  const formatDateDisplay = (dateString) => {

    if (!dateString) return 'dd-mm-yyyy';

    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, '0');

    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const year = date.getFullYear();

    return `${day}-${month}-${year}`;

  };



  // Helper function to check if a drive has existing attendance

  const hasExistingAttendance = (companyName, jobRole, date) => {

    return existingAttendances.some(

      att => att.companyName === companyName &&

             att.jobRole === jobRole &&

             new Date(att.startDate).toDateString() === new Date(date).toDateString()

    );

  };



  // Group drives by company + job role - ONLY SHOW DRIVES WITH ELIGIBLE STUDENTS

  const groupedDrives = useMemo(() => {

    const groups = {};

    

    // Normalize date for comparison

    const normalizeDate = (dateStr) => {

      if (!dateStr) return null;

      const date = new Date(dateStr);

      return date.toISOString().split('T')[0];

    };

    

    drives.forEach(drive => {

      const jobRole = drive.jobRole || 'Job Role';

      const key = `${drive.companyName}:${jobRole}`;

      

      const driveDateNormalized = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate);

      

      // Check if there's a matching eligible students record

      const hasEligibleStudents = eligibleStudentsData.some(es => {

        const esDateNormalized = normalizeDate(es.driveStartDate || es.companyDriveDate);

        return es.companyName === drive.companyName && esDateNormalized === driveDateNormalized;

      });

      

      console.log(`Drive ${drive.companyName} (${driveDateNormalized}): Has eligible students = ${hasEligibleStudents}`);

      

      // ONLY add drive if it has eligible students

      if (hasEligibleStudents) {

        if (!groups[key]) {

          groups[key] = {

            companyName: drive.companyName,

            jobRole: jobRole,

            drives: []

          };

        }

        groups[key].drives.push(drive);

      }

    });

    

    console.log('Grouped drives with eligible students:', Object.values(groups));

    return Object.values(groups);

  }, [drives, eligibleStudentsData]);



  // Auto-fill form when company data is passed from Company Drive page

  useEffect(() => {

    if (location.state?.companyData && drives.length > 0 && groupedDrives.length > 0) {

      const companyData = location.state.companyData;

      console.log('Auto-filling with company data:', companyData);

      

      // Find matching drive group

      const matchingGroup = groupedDrives.find(

        group => group.companyName === companyData.companyName && 

                 group.jobRole === companyData.jobRole

      );

      

      if (matchingGroup) {

        // Set the company and job role

        console.log('📌 Setting selectedCompanyJob:', matchingGroup);

        console.log('📌 Matching group has _id?:', matchingGroup._id);

        console.log('📌 Matching group drives:', matchingGroup.drives);

        setSelectedCompanyJob(matchingGroup);

        

        // Extract and set dates (use startingDate/endingDate from companies.drives schema)

        const dates = matchingGroup.drives

          .filter(drive => drive.startingDate || drive.driveStartDate || drive.companyDriveDate)

          .map(drive => ({

            date: drive.startingDate || drive.driveStartDate || drive.companyDriveDate,

            endDate: drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate,

            drive: drive

          }))

          .sort((a, b) => new Date(a.date) - new Date(b.date));

        

        setAvailableDates(dates);

        

        // Auto-select start and end dates from company data

        if (companyData.startingDate && companyData.endingDate) {

          const startDateStr = new Date(companyData.startingDate).toISOString().split('T')[0];

          const endDateStr = new Date(companyData.endingDate).toISOString().split('T')[0];

          

          // Find matching drive by date

          const matchingDrive = dates.find(d => d.date === startDateStr);

          

          if (matchingDrive) {

            // Set all the date fields

            setStartDate(startDateStr);

            setEndDate(endDateStr);

            setSelectedDrive(matchingDrive.drive);

            setAvailableEndDates([{ date: endDateStr }]);

            

            // Check if attendance already exists

            const existingAttendance = existingAttendances.find(

              att => att.companyName === companyData.companyName &&

                     att.jobRole === companyData.jobRole &&

                     new Date(att.startDate).toDateString() === new Date(startDateStr).toDateString()

            );

            

            if (existingAttendance) {

              // Load existing attendance data

              setIsUpdateMode(true);

              setCurrentAttendanceId(existingAttendance._id);

              loadExistingAttendance(existingAttendance);

            } else {

              // Load students for new attendance

              setIsUpdateMode(false);

              setCurrentAttendanceId(null);

              loadStudentsForDrive(matchingDrive.drive);

            }

          }

        }

      }

      

      // Clear the state after using it

      window.history.replaceState({}, document.title);

    }

  }, [location.state, drives, groupedDrives, existingAttendances]);



  // Handle company+job role selection

  const handleCompanyJobSelect = (group) => {

    setSelectedCompanyJob(group);

    setIsDriveOpen(false);

    

    // Extract unique dates from drives in this group (use startingDate from companies.drives)

    const dates = group.drives

      .filter(drive => drive.startingDate || drive.driveStartDate || drive.companyDriveDate)

      .map(drive => ({

        date: drive.startingDate || drive.driveStartDate || drive.companyDriveDate,

        endDate: drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate,

        drive: drive

      }))

      .sort((a, b) => new Date(a.date) - new Date(b.date));

    

    setAvailableDates(dates);

    setStartDate("");

    setEndDate("");

    setAvailableEndDates([]);

    setStudents([]);

    setSelectedDrive(null);

  };



  // Handle start date selection

  const handleStartDateSelect = async (dateObj) => {

    setStartDate(dateObj.date);

    setSelectedDrive(dateObj.drive);

    setIsStartDateOpen(false);

    

    // Auto-populate end date from the drive data (no dropdown needed)

    setEndDate(dateObj.endDate || dateObj.date);

    setAvailableEndDates([]);

    

    // Check if attendance already exists for this drive

    const existingAttendance = existingAttendances.find(

      att => att.companyName === selectedCompanyJob.companyName &&

             att.jobRole === selectedCompanyJob.jobRole &&

             new Date(att.startDate).toDateString() === new Date(dateObj.date).toDateString()

    );

    

    if (existingAttendance) {

      // Load existing attendance data

      setIsUpdateMode(true);

      setCurrentAttendanceId(existingAttendance._id);

      await loadExistingAttendance(existingAttendance);

    } else {

      // Load students for new attendance

      setIsUpdateMode(false);

      setCurrentAttendanceId(null);

      await loadStudentsForDrive(dateObj.drive);

    }

  };



  // Handle end date selection

  const handleEndDateSelect = (dateObj) => {

    setEndDate(dateObj.date);

    setIsEndDateOpen(false);

  };



  // Load existing attendance data

  const loadExistingAttendance = async (attendance) => {

    setIsLoading(true);

    try {

      // Map existing attendance students to the format needed

      const mappedStudents = attendance.students.map((student, index) => ({

        sNo: index + 1,

        studentId: student.studentId,

        name: student.name,

        regNo: student.regNo,

        department: student.branch,

        batch: student.batch,

        yearSec: student.yearSec,

        semester: student.semester,

        phoneNo: student.phoneNo,

        status: student.status

      }));

      setStudents(mappedStudents);

    } catch (error) {

      console.error('Error loading existing attendance:', error);

    } finally {

      setIsLoading(false);

    }

  };



  // Load students for a specific drive

  const loadStudentsForDrive = async (drive) => {

    setIsLoading(true);

    try {

      console.log('🔍 Loading students for drive:', drive);

      

      // First, try to find matching eligible students record

      const eligibleStudentsResponse = await mongoDBService.getAllEligibleStudents();

      const allEligibleStudents = eligibleStudentsResponse.eligibleStudents || [];

      

      console.log('📋 All eligible students records:', allEligibleStudents);

      console.log('🎯 Looking for match with:', {

        companyName: drive.companyName,

        startingDate: drive.startingDate,

        driveStartDate: drive.driveStartDate,

        companyDriveDate: drive.companyDriveDate

      });

      

      // Normalize date for comparison (remove time portion)

      const normalizeDate = (dateStr) => {

        if (!dateStr) return null;

        const date = new Date(dateStr);

        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD

      };

      

      const driveDateNormalized = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate);

      

      // Find eligible students record matching this drive's company and date

      const matchingEligibleStudents = allEligibleStudents.find(es => {

        const esDateNormalized = normalizeDate(es.driveStartDate || es.companyDriveDate);

        const matches = es.companyName === drive.companyName && esDateNormalized === driveDateNormalized;

        

        console.log(`Checking ${es.companyName} (${esDateNormalized}) vs ${drive.companyName} (${driveDateNormalized}): ${matches ? '✅' : '❌'}`);

        

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

      console.log(`📊 Found ${matchingEligibleStudents.students.length} students`);

      

      // Fetch complete student details for each student in the eligible students list

      const studentPromises = (matchingEligibleStudents.students || []).map(async (student, index) => {

        try {

          const response = await mongoDBService.getStudentById(student.studentId);

          // The API returns the student directly, not wrapped in a 'student' property

          const studentData = response;

          

          console.log('Student data fetched:', studentData);

          

          // Format year-sec as III-B format

          let yearSec = '-';

          if (studentData?.currentYear && studentData?.section) {

            yearSec = `${studentData.currentYear}-${studentData.section}`;

          } else if (studentData?.year && studentData?.section) {

            yearSec = `${studentData.year}-${studentData.section}`;

          }

          

          // Calculate semester from year (I->1,2; II->3,4; III->5,6; IV->7,8)

          let semester = '-';

          // First check if semester is directly available in student data

          if (studentData?.semester || studentData?.currentSemester) {

            semester = studentData?.semester || studentData?.currentSemester;

          } else if (studentData?.currentYear || studentData?.year) {

            // Calculate semester from year if not directly available

            const year = studentData?.currentYear || studentData?.year;

            const semesterMap = { 'I': '1', 'II': '3', 'III': '5', 'IV': '7' };

            semester = semesterMap[year] || '-';

          }

          

          return {

            sNo: index + 1,

            studentId: student.studentId,

            name: student.name || (studentData?.firstName && studentData?.lastName ? `${studentData.firstName} ${studentData.lastName}` : '-'),

            regNo: student.regNo || studentData?.regNo || '-',

            department: student.branch || studentData?.department || studentData?.branch || '-',

            batch: student.batch || studentData?.batch || '-',

            yearSec: yearSec,

            semester: semester,

            phoneNo: studentData?.mobileNo || studentData?.phoneNo || studentData?.phone || '-',

            status: "-" // Default status

          };

        } catch (error) {

          console.error(`Error fetching student ${student.studentId}:`, error);

          return {

            sNo: index + 1,

            studentId: student.studentId,

            name: student.name,

            regNo: student.regNo,

            department: student.branch,

            batch: student.batch,

            yearSec: '-',

            semester: '-',

            phoneNo: '-',

            status: "-"

          };

        }

      });

      

      const resolvedStudents = await Promise.all(studentPromises);

      console.log(`✅ Resolved ${resolvedStudents.length} students, setting to state`);

      setStudents(resolvedStudents);

      console.log('✅ Students set to state successfully');

    } catch (error) {

      console.error('❌ Error fetching student details:', error);

    } finally {

      setIsLoading(false);

    }

  };



  // Handle status change

  const handleStatusChange = (index, newStatus) => {

    const updatedStudents = [...students];

    updatedStudents[index].status = newStatus;

    setStudents(updatedStudents);

  };



  // Calculate statistics

  const stats = useMemo(() => {

    const total = students.length;

    const present = students.filter(s => s.status === "Present").length;

    const absent = students.filter(s => s.status === "Absent").length;

    const marked = present + absent;

    const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0;

    

    return { total, present, absent, percentage };

  }, [students]);



  // Pie chart data - show grey circle if no data

  const pieData = (stats.present === 0 && stats.absent === 0) 

    ? [{ name: 'No Data', value: 1, color: '#D3D3D3' }]

    : [

        { name: 'Present', value: stats.present, color: '#2DBE7F' },

        { name: 'Absent', value: stats.absent, color: '#F04F4F' }

      ];



  const handleApply = async () => {

    // Validate that attendance has been marked

    if (!selectedCompanyJob || !startDate || !endDate || students.length === 0) {

      alert('Please select a drive and ensure students are loaded before submitting.');

      return;

    }



    // Check if any student has status as "-"

    const studentsWithoutStatus = students.filter(s => s.status === "-" || !s.status);

    if (studentsWithoutStatus.length > 0) {

      setUnmarkedStudents(studentsWithoutStatus.map(s => ({

        name: s.name,

        regNo: s.regNo,

        branch: s.department,

        rowIndex: students.indexOf(s)

      })));

      setShowUnmarkedPopup(true);

      return;

    }



    setIsSubmitting(true);

    setSubmitStatus(null);



    try {

      // Prepare attendance data

      // Ensure we have a valid driveId

      console.log('=== ATTENDANCE SUBMISSION DEBUG ===');

      console.log('selectedDrive:', selectedDrive);

      console.log('selectedDrive?._id:', selectedDrive?._id);

      console.log('selectedCompanyJob:', selectedCompanyJob);

      console.log('selectedCompanyJob?.drives:', selectedCompanyJob?.drives);

      console.log('startDate:', startDate);

      console.log('endDate:', endDate);

      

      let driveId = selectedDrive?._id;

      console.log('Step 1 - driveId from selectedDrive:', driveId);

      

      // If no selectedDrive, try to find the drive from selectedCompanyJob by matching dates

      if (!driveId && selectedCompanyJob?.drives && selectedCompanyJob.drives.length > 0) {

        console.log('Step 2 - Looking for drive in selectedCompanyJob.drives...');

        console.log('Number of drives:', selectedCompanyJob.drives.length);

        

        // Try to find matching drive by date

        const matchingDrive = selectedCompanyJob.drives.find(d => {

          const dStart = d.startingDate || d.driveStartDate;

          const normalizedDriveStart = dStart ? new Date(dStart).toISOString().split('T')[0] : null;

          console.log(`  Checking drive ${d._id}: startDate=${normalizedDriveStart} vs ${startDate}`);

          return dStart && normalizedDriveStart === startDate;

        });

        

        if (matchingDrive) {

          driveId = matchingDrive._id;

          console.log('✅ Found drive ID from selectedCompanyJob.drives by date match:', driveId);

        } else if (selectedCompanyJob.drives.length === 1) {

          // If only one drive, use it

          driveId = selectedCompanyJob.drives[0]._id;

          console.log('✅ Using single drive ID from selectedCompanyJob.drives:', driveId);

        } else {

          console.error('❌ Could not find matching drive!');

        }

      }

      

      console.log('=== FINAL DRIVE ID:', driveId, '===');

      

      if (!driveId) {

        console.error('⚠️ ERROR: No driveId available for attendance submission!');

        alert('Error: Cannot determine drive ID. Please try again or contact support.');

        setIsSubmitting(false);

        return;

      }

      

      const attendanceData = {

        driveId: driveId, // Include unique drive ID

        companyName: selectedCompanyJob.companyName,

        jobRole: selectedCompanyJob.jobRole,

        startDate: startDate,

        endDate: endDate,

        totalStudents: stats.total,

        totalPresent: stats.present,

        totalAbsent: stats.absent,

        percentage: stats.percentage,

        students: students.map(student => ({

          studentId: student.studentId,

          name: student.name,

          regNo: student.regNo,

          branch: student.department,

          batch: student.batch,

          yearSec: student.yearSec,

          semester: student.semester || '-',

          phoneNo: student.phoneNo,

          status: student.status

        }))

      };



      let response;

      if (isUpdateMode && currentAttendanceId) {

        // Update existing attendance

        response = await mongoDBService.updateAttendance(currentAttendanceId, attendanceData);

        setSuccessPopupData({

          isUpdate: true,

          presentCount: stats.present,

          absentCount: stats.absent,

          companyName: selectedCompanyJob.companyName,

          jobRole: selectedCompanyJob.jobRole,

          startDate: startDate,

          endDate: endDate

        });

      } else {

        // Submit new attendance

        response = await mongoDBService.submitAttendance(attendanceData);

        setSuccessPopupData({

          isUpdate: false,

          presentCount: stats.present,

          absentCount: stats.absent,

          companyName: selectedCompanyJob.companyName,

          jobRole: selectedCompanyJob.jobRole,

          startDate: startDate,

          endDate: endDate

        });

      }

      

      if (response.success) {

        setSubmitStatus('success');

        setShowSuccessPopup(true);

        

        // Refresh attendances list

        const attendancesResponse = await mongoDBService.getAllAttendances();

        setExistingAttendances(attendancesResponse.data || []);

      }

    } catch (error) {

      console.error('Error submitting/updating attendance:', error);

      setSubmitStatus('error');

      alert(`Failed to ${isUpdateMode ? 'update' : 'submit'} attendance: ` + (error.message || 'Unknown error'));

    } finally {

      setIsSubmitting(false);

    }

  };

  

  const closeSuccessPopup = () => {

    setShowSuccessPopup(false);

    // Navigate to Company Drive Details page immediately after closing popup

    // Pass the selected DRIVE data (not the grouped company data) so the details page can load correctly

    if (selectedDrive) {

      navigate('/admin/company-drive/details', { 

        state: { 

          company: selectedDrive,

          driveId: selectedDrive._id,

          startingDate: selectedDrive.startingDate

        } 

      });

    } else if (selectedCompanyJob) {

      // Fallback: if no selectedDrive but have selectedCompanyJob, navigate to company drive list

      navigate('/admin/company-drive');

    } else {

      navigate('/admin/company-drive');

    }

    // Reset form after successful submission (kept for safety if component remains mounted briefly)

    setTimeout(() => {

      setSelectedCompanyJob(null);

      setSelectedDrive(null);

      setStartDate("");

      setEndDate("");

      setStudents([]);

      setAvailableDates([]);

      setSubmitStatus(null);

      setIsUpdateMode(false);

      setCurrentAttendanceId(null);

    }, 500);

  };

  

  const closeUnmarkedPopup = () => {

    setShowUnmarkedPopup(false);

    setUnmarkedStudents([]);

  };

  

  const handleShowUnmarkedStudent = (student) => {

    setShowUnmarkedPopup(false);

    // Scroll to the student row in the table

    setTimeout(() => {

      const tableBody = document.querySelector(`.${styles['Admin-at-table-body-scroll']}`);

      const rows = tableBody?.querySelectorAll('tr');

      if (rows && student.rowIndex !== undefined) {

        const targetRow = rows[student.rowIndex];

        if (targetRow) {

          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Highlight the row temporarily

          targetRow.style.background = '#fff3cd';

          setTimeout(() => {

            targetRow.style.background = '';

          }, 2000);

        }

      }

    }, 100);

  };

  



  return (

    <div>

      {showSuccessPopup && (

        <AttendanceSuccessPopup

          onClose={closeSuccessPopup}

          isUpdate={successPopupData.isUpdate}

          presentCount={successPopupData.presentCount}

          absentCount={successPopupData.absentCount}

          companyName={successPopupData.companyName}

          jobRole={successPopupData.jobRole}

          startDate={successPopupData.startDate}

          endDate={successPopupData.endDate}

        />

      )}

      

      {showUnmarkedPopup && (

        <UnmarkedStudentsPopup

          students={unmarkedStudents}

          onClose={closeUnmarkedPopup}

          onShow={handleShowUnmarkedStudent}

        />

      )}

      

      {/* Navbar & Sidebar */}

      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />

      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />



      {/* UPDATED CLASS: Admin-at-layout-main */}

      <div className={styles['Admin-at-layout-main']}>

        {/* Sidebar JSX */}

          



        {/* Main Content Layout */}

        {/* UPDATED CLASS: Admin-at-main-content-layout */}

        <div className={styles['Admin-at-main-content-layout']}>

          {/* Filter Section */}

          <div className={styles['Admin-at-filter-section']}>

            {/* Select Drive Dropdown (Company : Job Role) */}

            <div className={styles['Admin-at-filter-select']}>

              <div 

                className={styles['Admin-at-filter-select-display']}

                onClick={() => setIsDriveOpen(!isDriveOpen)}

              >

                {selectedCompanyJob ? `${selectedCompanyJob.companyName} : ${selectedCompanyJob.jobRole}` : "Select Drive"}

              </div>

              <span className={styles['Admin-at-filter-select-arrow']} onClick={() => setIsDriveOpen(!isDriveOpen)}>

                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>

              </span>

              <div className={`${styles['Admin-at-filter-select-options']} ${isDriveOpen ? styles['open'] : ''}`}>

                {isLoading ? (

                  <div className={styles['Admin-at-filter-select-option']} style={{color: '#888'}}>Loading...</div>

                ) : groupedDrives.length === 0 ? (

                  <div className={styles['Admin-at-filter-select-option']} style={{color: '#888'}}>No drives available</div>

                ) : (

                  groupedDrives.map((group, index) => {

                    // Check if any date for this company/job has attendance (use startingDate from companies.drives)

                    const hasAttendance = group.drives.some(drive => 

                      hasExistingAttendance(

                        group.companyName,

                        group.jobRole,

                        drive.startingDate || drive.driveStartDate || drive.companyDriveDate

                      )

                    );

                    return (

                      <div 

                        key={index} 

                        className={styles['Admin-at-filter-select-option']} 

                        onClick={() => handleCompanyJobSelect(group)}

                        style={{ color: hasAttendance ? '#4EA24E' : '#555', fontWeight: hasAttendance ? '600' : 'normal' }}

                      >

                        {group.companyName} : {group.jobRole}

                      </div>

                    );

                  })

                )}

              </div>

            </div>

            

            {/* Start Date Dropdown */}

            <div className={styles['Admin-at-filter-select']}>

              <div 

                className={styles['Admin-at-filter-select-display']}

                onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}

                style={{ 

                  cursor: selectedCompanyJob ? 'pointer' : 'not-allowed',

                  backgroundColor: selectedCompanyJob ? 'white' : '#ffffff',

                  color: selectedCompanyJob ? '#333' : '#999'

                }}

              >

                {startDate ? formatDateDisplay(startDate) : "Select Start Date"}

              </div>

              <span 

                className={styles['Admin-at-filter-select-arrow']} 

                onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}

                style={{ cursor: selectedCompanyJob ? 'pointer' : 'not-allowed' }}

              >

                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>

              </span>

              <div className={`${styles['Admin-at-filter-select-options']} ${isStartDateOpen ? styles['open'] : ''}`}>

                {availableDates.map((dateObj, index) => {

                  const hasAttendance = selectedCompanyJob && hasExistingAttendance(

                    selectedCompanyJob.companyName,

                    selectedCompanyJob.jobRole,

                    dateObj.date

                  );

                  return (

                    <div 

                      key={index} 

                      className={styles['Admin-at-filter-select-option']} 

                      onClick={() => handleStartDateSelect(dateObj)}

                      style={{ color: hasAttendance ? '#4EA24E' : '#555', fontWeight: hasAttendance ? '600' : 'normal' }}

                    >

                      {formatDateDisplay(dateObj.date)}

                    </div>

                  );

                })}

                {availableDates.length === 0 && selectedCompanyJob && (

                  <div className={styles['Admin-at-filter-select-option']} style={{ color: '#999', cursor: 'default' }}>

                    No dates available

                  </div>

                )}

              </div>

            </div>

            

            {/* End Date Display (Read-only) */}

            <div className={styles['Admin-at-filter-select']}>

              <div 

                className={styles['Admin-at-filter-select-display']}

                style={{ 

                  cursor: 'default',

                  backgroundColor: '#ffffff',

                  color: endDate ? '#333' : '#999'

                }}

              >

                {endDate ? formatDateDisplay(endDate) : "Select End Date"}

              </div>

              <span 

                className={styles['Admin-at-filter-select-arrow']}

                style={{ cursor: 'default', opacity: 0.3 }}

              >

                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>

              </span>

            </div>

            

            {/* Submit/Update Button */}

            <button 

              className={styles['Admin-at-filter-btn']} 

              onClick={handleApply}

              disabled={isSubmitting || students.length === 0}

              style={{

                opacity: isSubmitting || students.length === 0 ? 0.6 : 1,

                cursor: isSubmitting || students.length === 0 ? 'not-allowed' : 'pointer',

                backgroundColor: isUpdateMode ? '#2196F3' : '#4EA24E',

                minWidth: '140px',

                whiteSpace: 'nowrap',

                overflow: 'hidden',

                textOverflow: 'ellipsis'

              }}

            >

              {isSubmitting ? (isUpdateMode ? 'Updating...' : 'Submitting...') : (isUpdateMode ? 'Update' : 'Submit')}

            </button>

          </div>

          {/* Grid and Pie Chart Section */}

          <div className={styles['Admin-at-summary-pie-layout']}>

            {/* Summary Grid */}

            <div className={styles['Admin-at-summary-grid']}>

              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-blue']}`}>

                <div className={styles['Admin-at-card-label']}>Total Students</div>

                <div className={styles['Admin-at-card-value']}>{stats.total}</div>

              </div>

              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-green']}`}>

                <div className={styles['Admin-at-card-label']}>Total Present</div>

                <div className={styles['Admin-at-card-value']}>{stats.present}</div>

              </div>

              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-darkblue']}`}>

                <div className={styles['Admin-at-card-label']}>Percentage</div>

                <div className={styles['Admin-at-card-value']}>{stats.percentage} <span style={{ fontSize: '17px' }}>%</span></div>

              </div>

              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-red']}`}>

                <div className={styles['Admin-at-card-label']}>Total Absent</div>

                <div className={styles['Admin-at-card-value']}>{stats.absent}</div>

              </div>

            </div>

            {/* Pie Chart Section */}

            <div className={styles['Admin-at-pie-chart-section']}>

              <div className={styles['Admin-at-pie-chart-header']}>

                <div className={styles['Admin-at-pie-chart-title']}>Attendance</div>

                <div className={styles['Admin-at-pie-chart-date']}>{formatDate(startDate) || 'dd/mm/yyyy'}</div>

              </div>

              <div className={styles['Admin-at-pie-chart-content']}>

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

                <div className={styles['Admin-at-pie-chart-stats']}>

                  <div className={`${styles['Admin-at-pie-chart-stat-row']} ${styles['cco-at-pie-chart-stat-present']}`}>

                    <span className={styles['Admin-at-pie-chart-stat-label']}>Present</span>

                    <span className={styles['Admin-at-pie-chart-stat-value']}>{stats.present}</span>

                  </div>

                  <div className={`${styles['Admin-at-pie-chart-stat-row']} ${styles['co-at-pie-chart-stat-absent']}`}>

                    <span className={styles['Admin-at-pie-chart-stat-label']}>Absent</span>

                    <span className={styles['Admin-at-pie-chart-stat-value']}>{stats.absent}</span>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Table Section */}

          

          {/* UPDATED CLASS: Admin-at-table-section, Admin-at-table-header */}

          <div className={styles['Admin-at-table-section']}>

            <div className={styles['Admin-at-table-header-row']}>

              <div className={styles['Admin-at-table-header']}>ATTENDANCE DETAILS</div>

              <input

                type="text"

                placeholder="Enter Name / Reg No"

                value={searchTerm}

                onChange={(e) => setSearchTerm(e.target.value)}

                className={styles['Admin-at-search-input']}

              />

            </div>

            {/* UPDATED CLASS: Admin-at-attendance-table-header */}

            <table className={styles['Admin-at-attendance-table-header']} style={{ width: '100%' }}>

              <thead>

                <tr>

                    <th style={{ width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>S.No</th>

                    <th style={{ width: '13%', textAlign: 'center', verticalAlign: 'middle' }}>Name</th>

                    <th style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle' }}>Register Number</th>

                    <th style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>Branch</th>

                    <th style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>Batch</th>

                    <th style={{ width: '9%', textAlign: 'center', verticalAlign: 'middle' }}>Year-sec</th>

                    <th style={{ width: '9%', textAlign: 'center', verticalAlign: 'middle' }}>Sem</th>

                    <th style={{ width: '11%', textAlign: 'center', verticalAlign: 'middle' }}>Phone No</th>

                    <th style={{ width: '8%', textAlign: 'center', verticalAlign: 'middle' }}>Status</th>

                    <th style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>Action</th>

                </tr>

              </thead>

            </table>

            <div className={styles['Admin-at-table-body-scroll']}>

              <table className={styles['Admin-at-attendance-table-body']} style={{ width: '102%' }}>

                <tbody>

                  {isLoading ? (

                    <tr className={styles['Admin-at-loading-row']}>

                      <td colSpan="10" className={styles['Admin-at-loading-cell']}>

                        <div className={styles['Admin-at-loading-wrapper']}>

                          <div className={styles['Admin-at-spinner']}></div>

                          <span className={styles['Admin-at-loading-text']}>Loading students...</span>

                        </div>

                      </td>

                    </tr>

                  ) : filteredStudents.length === 0 ? (

                    <tr>

                      <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>

                        {students.length === 0 ? 'Select a drive to view students' : 'No students found'}

                      </td>

                    </tr>

                  ) : (

                    filteredStudents.map((student, index) => (

                      <tr key={index}>

                        <td style={{ width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>{student.sNo}</td>

                        <td style={{ width: '13%', fontWeight: '600', textAlign: 'center', verticalAlign: 'middle' }}>{student.name}</td>

                        <td style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle' }}>{student.regNo}</td>

                        <td style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>{student.department}</td>

                        <td style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>

                          {student.batch ? student.batch.replace('-', '-\n') : '-'}

                        </td>

                        <td style={{ width: '9%', textAlign: 'center', verticalAlign: 'middle' }}>{student.yearSec}</td>

                        <td style={{ width: '9%', textAlign: 'center', verticalAlign: 'middle' }}>{student.semester || '-'}</td>

                        <td style={{ width: '11%', textAlign: 'center', verticalAlign: 'middle' }}>{student.phoneNo}</td>

                        <td 

                          style={{ 

                            width: '8%',

                            textAlign: 'center',

                            verticalAlign: 'middle',

                            color: student.status === "Present" ? '#00B728' : student.status === "Absent" ? '#E62727' : '#888',

                            fontWeight: 'bold'

                          }}

                        >

                          {student.status}

                        </td>

                        <td style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>

                          <button 

                            className={styles['action-present-btn']}

                            onClick={() => handleStatusChange(index, "Present")}

                            style={{ marginRight: '8px' }}

                          >

                            Present

                          </button>

                          <button 

                            className={styles['action-absent-btn']}

                            onClick={() => handleStatusChange(index, "Absent")}

                          >

                            Absent

                          </button>

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



      {isSidebarOpen && (

        <div

          className={styles['Admin-at-overlay']}

          onClick={() => setIsSidebarOpen(false)}

        />

      )}

    </div>

  );

}