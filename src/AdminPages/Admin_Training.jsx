import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import AddTrainingIcon from '../assets/ad_addtrainingicon.svg';
import ScheduleTrainingIcon from '../assets/ad_scheduletrainingicon.svg';
import AttendanceTrainingIcon from '../assets/ad_at_attendance.svg';
import styles from './Admin_Training.module.css';
import mongoDBService from '../services/mongoDBService';

const TRAINING_ARCHIVE_STORAGE_KEY = 'placement-portal-admin-training-archives';

const getTrainingArchiveKey = (card) => card?.scheduleId || card?.id || card?.companyName || '';

const readArchivedTrainings = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(TRAINING_ARCHIVE_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((card) => ({
        ...card,
        archiveKey: getTrainingArchiveKey(card),
        archivedAt: card?.archivedAt || ''
      }))
      .filter((card) => Boolean(card.archiveKey));
  } catch {
    return [];
  }
};

const writeArchivedTrainings = (cards) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TRAINING_ARCHIVE_STORAGE_KEY, JSON.stringify(cards));
};

function AdminTraining({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [trainingCards, setTrainingCards] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [openCardMenuId, setOpenCardMenuId] = useState('');
  const [activePopup, setActivePopup] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [isAttendancePopupOpen, setIsAttendancePopupOpen] = useState(false);
  const [attendancePopupLoading, setAttendancePopupLoading] = useState(false);
  const [attendanceSearchLoading, setAttendanceSearchLoading] = useState(false);
  const [attendancePopupSchedules, setAttendancePopupSchedules] = useState([]);
  const [attendanceSelectedCompany, setAttendanceSelectedCompany] = useState('');
  const [attendanceSelectedCourse, setAttendanceSelectedCourse] = useState('');
  const [attendanceSelectedApplicableYear, setAttendanceSelectedApplicableYear] = useState('');
  const [attendanceSelectedPhase, setAttendanceSelectedPhase] = useState('');
  const [attendanceSelectedStartDate, setAttendanceSelectedStartDate] = useState('');
  const [attendanceSelectedEndDate, setAttendanceSelectedEndDate] = useState('');

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!event.target.closest('[data-training-card-menu="true"]')) {
        setOpenCardMenuId('');
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    const loadTrainingDashboardData = async () => {
      setIsLoadingCards(true);
      try {
        const [batchAssignments, schedules, trainings] = await Promise.all([
          mongoDBService.getScheduledTrainingBatchAssignments(),
          mongoDBService.getScheduledTrainings(),
          mongoDBService.getTrainings()
        ]);

        const normalizedBatchAssignments = Array.isArray(batchAssignments) ? batchAssignments : [];
        const normalizedSchedules = Array.isArray(schedules) ? schedules : [];
        const normalizedTrainings = Array.isArray(trainings) ? trainings : [];
        const archivedCards = readArchivedTrainings();
        const archivedKeys = new Set(archivedCards.map((card) => getTrainingArchiveKey(card)));

        const companyList = [...new Set(
          normalizedBatchAssignments
            .map((item) => (item?.companyName || '').toString().trim())
            .filter(Boolean)
        )];
        setCompanies(companyList);

        const trainingByCompany = new Map(
          normalizedTrainings.map((item) => [
            (item?.companyName || '').toString().trim(),
            item
          ])
        );

        // Build a map of scheduleId → total student count across all batches
        const studentCountByScheduleId = new Map();
        normalizedBatchAssignments.forEach((assignment) => {
          const sid = (assignment?.scheduleId || '').toString().trim();
          if (sid) {
            const count = Array.isArray(assignment?.students) ? assignment.students.length : 0;
            studentCountByScheduleId.set(sid, (studentCountByScheduleId.get(sid) || 0) + count);
          }
        });

        const cards = normalizedSchedules.map((schedule) => {
          const companyName = (schedule?.companyName || '').toString().trim() || 'Training';
          const phases = Array.isArray(schedule?.phases) ? schedule.phases : [];
          const phaseNumbers = [...new Set(
            phases
              .map((phase) => (phase?.phaseNumber || '').toString().trim())
              .filter(Boolean)
          )];
          const applicableYears = [...new Set(
            phases
              .map((phase) => normalizeYearToken(phase?.applicableYear || ''))
              .filter(Boolean)
          )];

          const yearText = applicableYears.length > 0
            ? applicableYears.join(', ')
            : '-';

          const yearTokens = applicableYears.length > 0
            ? applicableYears
            : [];

          const phaseText = phaseNumbers.length > 0
            ? phaseNumbers.join(', ')
            : '-';

          let durationText = '-';
          const start = new Date(schedule?.startDate);
          const end = new Date(schedule?.endDate);
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            const diffMs = end.getTime() - start.getTime();
            const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
            durationText = `${days} Day${days > 1 ? 's' : ''}`;
          }

          const schedId = (schedule?._id || '').toString();
          const studentCount = studentCountByScheduleId.get(schedId) || 0;

          return {
            id: schedule?._id || `${companyName}-${schedule?.startDate || ''}`,
            scheduleId: schedule?._id || '',
            companyName,
            logoText: companyName.charAt(0).toUpperCase() || 'T',
            startDate: schedule?.startDate || '',
            endDate: schedule?.endDate || '',
            yearText,
            yearTokens,
            phaseText,
            durationText,
            studentCount,
            isEnded: (() => {
              try {
                const ed = new Date(schedule?.endDate);
                if (Number.isNaN(ed.getTime())) return false;
                const today = new Date();
                // compare date-only (ignore time)
                const edDateOnly = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
                const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return edDateOnly < todayDateOnly;
              } catch (e) {
                return false;
              }
            })()
          };
        });

        setTrainingCards(cards.filter((card) => !archivedKeys.has(getTrainingArchiveKey(card))));
      } catch (error) {
        console.error('Failed to load admin training dashboard data:', error);
        setCompanies([]);
        setTrainingCards([]);
      } finally {
        setIsLoadingCards(false);
      }
    };

    loadTrainingDashboardData();
  }, []);

  const filteredTrainingCards = useMemo(() => {
    return trainingCards.filter((card) => {
      if (selectedCompany && card.companyName !== selectedCompany) {
        return false;
      }

      if (selectedYear) {
        const cardYears = Array.isArray(card.yearTokens) ? card.yearTokens : [];
        if (!cardYears.includes(selectedYear)) {
          return false;
        }
      }

      if (selectedStartDate && normalizeDateKey(card.startDate) !== selectedStartDate) {
        return false;
      }

      if (selectedEndDate && normalizeDateKey(card.endDate) !== selectedEndDate) {
        return false;
      }

      return true;
    });
  }, [trainingCards, selectedCompany, selectedYear, selectedStartDate, selectedEndDate]);

  const yearOptions = useMemo(() => {
    const order = ['I', 'II', 'III', 'IV'];
    const years = [...new Set(
      trainingCards
        .flatMap((card) => (Array.isArray(card.yearTokens) ? card.yearTokens : []))
        .map((year) => (year || '').toString().trim())
        .filter(Boolean)
    )];

    return years.sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [trainingCards]);

  const baseCardsForDateOptions = useMemo(() => {
    return trainingCards.filter((card) => {
      if (selectedCompany && card.companyName !== selectedCompany) return false;
      if (selectedYear) {
        const cardYears = Array.isArray(card.yearTokens) ? card.yearTokens : [];
        if (!cardYears.includes(selectedYear)) return false;
      }
      return true;
    });
  }, [trainingCards, selectedCompany, selectedYear]);

  const startDateOptions = useMemo(() => {
    return [...new Set(
      baseCardsForDateOptions
        .map((card) => normalizeDateKey(card.startDate))
        .filter(Boolean)
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [baseCardsForDateOptions]);

  const endDateOptions = useMemo(() => {
    if (!selectedStartDate) {
      return [];
    }

    return [...new Set(
      baseCardsForDateOptions
        .filter((card) => normalizeDateKey(card.startDate) === selectedStartDate)
        .map((card) => normalizeDateKey(card.endDate))
        .filter(Boolean)
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [baseCardsForDateOptions, selectedStartDate]);

  useEffect(() => {
    if (selectedStartDate && !startDateOptions.includes(selectedStartDate)) {
      setSelectedStartDate('');
    }

    if (selectedEndDate && !endDateOptions.includes(selectedEndDate)) {
      setSelectedEndDate('');
    }
  }, [selectedStartDate, selectedEndDate, startDateOptions, endDateOptions]);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const handleClearFilters = () => {
    setSelectedCompany('');
    setSelectedYear('');
    setSelectedStartDate('');
    setSelectedEndDate('');
  };

  const persistArchivedCards = (cards) => {
    const normalizedCards = cards.map((card) => ({
      ...card,
      archiveKey: getTrainingArchiveKey(card),
      archivedAt: card.archivedAt || new Date().toISOString()
    }));

    writeArchivedTrainings(normalizedCards);
  };

  const handleArchiveCard = (card) => {
    const archiveKey = getTrainingArchiveKey(card);
    if (!archiveKey) {
      return;
    }

    const currentArchivedCards = readArchivedTrainings();
    const nextArchivedCards = [
      {
        ...card,
        archiveKey,
        archivedAt: new Date().toISOString()
      },
      ...currentArchivedCards.filter((item) => getTrainingArchiveKey(item) !== archiveKey)
    ];

    persistArchivedCards(nextArchivedCards);
    setTrainingCards((prev) => prev.filter((item) => getTrainingArchiveKey(item) !== archiveKey));
    setOpenCardMenuId('');
    navigate('/admin-trainings-archive');
  };

  const handleDeleteCard = (card) => {
    if (!card.scheduleId) {
      alert('Scheduled training ID not found.');
      return;
    }
    setCardToDelete(card);
    setActivePopup('deleteWarning');
    setOpenCardMenuId('');
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;

    setDeleteInProgress(true);
    try {
      await mongoDBService.deleteScheduledTraining(cardToDelete.scheduleId);
      const archiveKey = getTrainingArchiveKey(cardToDelete);
      setTrainingCards((prev) => prev.filter((item) => getTrainingArchiveKey(item) !== archiveKey));

      const nextArchivedCards = readArchivedTrainings().filter((item) => getTrainingArchiveKey(item) !== archiveKey);
      persistArchivedCards(nextArchivedCards);
      setActivePopup('deleteSuccess');
    } catch (error) {
      console.error('Failed to delete scheduled training:', error);
      alert(error.message || 'Failed to delete training.');
      setActivePopup(null);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const closePopup = () => {
    setActivePopup(null);
    setCardToDelete(null);
  };

  const formatDateForDisplay = (rawDate) => {
    if (!rawDate) return '-';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return '-';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseScheduleCourses = (scheduleRecord) => {
    // Handle batch assignments (courseName field)
    if (scheduleRecord?.courseName) {
      return [(scheduleRecord.courseName || '').toString().trim()].filter(Boolean);
    }

    // Handle schedules (phases with applicableCourses)
    const phases = Array.isArray(scheduleRecord?.phases) ? scheduleRecord.phases : [];
    const courses = phases.flatMap((phase) => {
      const applicableCourses = Array.isArray(phase?.applicableCourses) ? phase.applicableCourses : [];
      return applicableCourses.map((course) => (course || '').toString().trim()).filter(Boolean);
    });

    return [...new Set(courses)];
  };

  function normalizeDateKey(rawDate) {
    if (!rawDate) return '';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return rawDate.toString().trim();
    }

    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  function normalizeYearToken(value = '') {
    const raw = value.toString().trim().toUpperCase();
    if (!raw) return '';
    const compact = raw.replace(/[^A-Z0-9]/g, '');
    if (!compact) return '';

    const yearAliases = {
      '1': 'I', '01': 'I', '1ST': 'I', '1STYEAR': 'I', 'FIRST': 'I', 'FIRSTYEAR': 'I', 'I': 'I',
      '2': 'II', '02': 'II', '2ND': 'II', '2NDYEAR': 'II', 'SECOND': 'II', 'SECONDYEAR': 'II', 'II': 'II',
      '3': 'III', '03': 'III', '3RD': 'III', '3RDYEAR': 'III', 'THIRD': 'III', 'THIRDYEAR': 'III', 'III': 'III',
      '4': 'IV', '04': 'IV', '4TH': 'IV', '4THYEAR': 'IV', 'FOURTH': 'IV', 'FOURTHYEAR': 'IV', 'IV': 'IV'
    };

    return yearAliases[compact] || compact;
  }

  const parseSchedulePhases = (scheduleRecord) => {
    const phases = Array.isArray(scheduleRecord?.phases) ? scheduleRecord.phases : [];
    return phases
      .map((phase) => ({
        phaseNumber: (phase?.phaseNumber || '').toString().trim(),
        applicableYear: normalizeYearToken(phase?.applicableYear || ''),
        applicableCourses: Array.isArray(phase?.applicableCourses)
          ? phase.applicableCourses.map((course) => (course || '').toString().trim()).filter(Boolean)
          : []
      }))
      .filter((phase) => phase.phaseNumber || phase.applicableYear || phase.applicableCourses.length > 0);
  };

  const getSelectedAttendanceSchedule = () => {
    const companyKey = attendanceSelectedCompany.toString().trim().toLowerCase();
    const courseKey = attendanceSelectedCourse.toString().trim().toLowerCase();
    const yearKey = normalizeYearToken(attendanceSelectedApplicableYear);
    const phaseKey = attendanceSelectedPhase.toString().trim();
    const startKey = normalizeDateKey(attendanceSelectedStartDate);

    return attendancePopupSchedules.find((schedule) => {
      const scheduleCompany = (schedule?.companyName || '').toString().trim().toLowerCase();
      if (scheduleCompany !== companyKey) return false;

      if (courseKey) {
        const scheduleCourses = parseScheduleCourses(schedule).map((course) => course.toLowerCase());
        if (!scheduleCourses.includes(courseKey)) return false;
      }

      if (yearKey) {
        const scheduleYear = normalizeYearToken(schedule?.applicableYear || '');
        const phaseYears = parseSchedulePhases(schedule).map((phase) => normalizeYearToken(phase.applicableYear));
        if (scheduleYear !== yearKey && !phaseYears.includes(yearKey)) {
          return false;
        }
      }

      if (phaseKey) {
        const phaseNumbers = parseSchedulePhases(schedule).map((phase) => phase.phaseNumber);
        const schedulePhase = (schedule?.phaseNumber || '').toString().trim();
        if (!phaseNumbers.includes(phaseKey) && schedulePhase !== phaseKey) {
          return false;
        }
      }

      if (startKey) {
        return normalizeDateKey(schedule?.startDate) === startKey;
      }

      return true;
    }) || null;
  };

  const attendanceCompanyOptions = useMemo(() => {
    return [...new Set(
      attendancePopupSchedules
        .map((schedule) => (schedule?.companyName || '').toString().trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [attendancePopupSchedules]);

  const attendanceCourseOptions = useMemo(() => {
    if (!attendanceSelectedCompany) return [];

    return [...new Set(
      attendancePopupSchedules
        .filter((schedule) => (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany)
        .flatMap((schedule) => parseScheduleCourses(schedule))
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [attendancePopupSchedules, attendanceSelectedCompany]);

  const attendanceStartDateOptions = useMemo(() => {
    if (!attendanceSelectedCompany || !attendanceSelectedCourse || !attendanceSelectedApplicableYear || !attendanceSelectedPhase) return [];

    return [...new Set(
      attendancePopupSchedules
        .filter((schedule) => {
          const companyMatch = (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany;
          const courseMatch = parseScheduleCourses(schedule).includes(attendanceSelectedCourse);
          if (!companyMatch || !courseMatch) return false;

          const yearKey = normalizeYearToken(attendanceSelectedApplicableYear);
          const phaseKey = attendanceSelectedPhase.toString().trim();
          const scheduleYear = normalizeYearToken(schedule?.applicableYear || '');
          const phaseEntries = parseSchedulePhases(schedule);
          const phaseYears = phaseEntries.map((phase) => normalizeYearToken(phase.applicableYear));
          const phaseNumbers = phaseEntries.map((phase) => phase.phaseNumber);
          const schedulePhase = (schedule?.phaseNumber || '').toString().trim();

          const yearMatch = !yearKey || scheduleYear === yearKey || phaseYears.includes(yearKey);
          const phaseMatch = !phaseKey || phaseNumbers.includes(phaseKey) || schedulePhase === phaseKey;
          return yearMatch && phaseMatch;
        })
        .map((schedule) => schedule?.startDate || '')
        .filter(Boolean)
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [attendancePopupSchedules, attendanceSelectedCompany, attendanceSelectedCourse, attendanceSelectedApplicableYear, attendanceSelectedPhase]);

  const attendanceApplicableYearOptions = useMemo(() => {
    if (!attendanceSelectedCompany || !attendanceSelectedCourse) return [];

    const yearValues = attendancePopupSchedules
      .filter((schedule) => {
        const companyMatch = (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany;
        const courseMatch = parseScheduleCourses(schedule).includes(attendanceSelectedCourse);
        return companyMatch && courseMatch;
      })
      .flatMap((schedule) => {
        const topLevelYear = normalizeYearToken(schedule?.applicableYear || '');
        const phaseYears = parseSchedulePhases(schedule).map((phase) => normalizeYearToken(phase.applicableYear));
        return [topLevelYear, ...phaseYears].filter(Boolean);
      });

    return [...new Set(yearValues)].sort((a, b) => a.localeCompare(b));
  }, [attendancePopupSchedules, attendanceSelectedCompany, attendanceSelectedCourse]);

  const attendancePhaseOptions = useMemo(() => {
    if (!attendanceSelectedCompany || !attendanceSelectedCourse || !attendanceSelectedApplicableYear) return [];

    const yearKey = normalizeYearToken(attendanceSelectedApplicableYear);

    const phaseValues = attendancePopupSchedules
      .filter((schedule) => {
        const companyMatch = (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany;
        const courseMatch = parseScheduleCourses(schedule).includes(attendanceSelectedCourse);
        return companyMatch && courseMatch;
      })
      .flatMap((schedule) => {
        const phaseEntries = parseSchedulePhases(schedule);
        const matchingPhaseEntries = phaseEntries
          .filter((phase) => {
            const phaseYear = normalizeYearToken(phase.applicableYear);
            return !yearKey || !phaseYear || phaseYear === yearKey;
          })
          .map((phase) => phase.phaseNumber)
          .filter(Boolean);

        const scheduleYear = normalizeYearToken(schedule?.applicableYear || '');
        const topLevelPhase = (schedule?.phaseNumber || '').toString().trim();
        const topLevelPhaseMatch = topLevelPhase && (!yearKey || !scheduleYear || scheduleYear === yearKey) ? [topLevelPhase] : [];

        return [...matchingPhaseEntries, ...topLevelPhaseMatch];
      });

    return [...new Set(phaseValues)].sort((a, b) => {
      const aNum = Number.parseInt(a, 10);
      const bNum = Number.parseInt(b, 10);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });
  }, [attendancePopupSchedules, attendanceSelectedCompany, attendanceSelectedCourse, attendanceSelectedApplicableYear]);

  const todayInfo = useMemo(() => {
    const now = new Date();
    const dateOnlyToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const selectedSchedule = getSelectedAttendanceSchedule();

    if (!selectedSchedule?.startDate) {
      return {
        todayDate: formatDateForDisplay(dateOnlyToday),
        trainingDayLabel: 'Training Day -'
      };
    }

    const start = new Date(selectedSchedule.startDate);
    const end = new Date(selectedSchedule.endDate || selectedSchedule.startDate);
    const dateOnlyStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const dateOnlyEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const oneDayMs = 24 * 60 * 60 * 1000;
    const diffFromStart = Math.floor((dateOnlyToday.getTime() - dateOnlyStart.getTime()) / oneDayMs) + 1;
    const totalDays = Math.max(1, Math.floor((dateOnlyEnd.getTime() - dateOnlyStart.getTime()) / oneDayMs) + 1);

    const clampedDay = Math.min(Math.max(diffFromStart, 1), totalDays);

    return {
      todayDate: formatDateForDisplay(dateOnlyToday),
      trainingDayLabel: `Training Day ${clampedDay}`
    };
  }, [attendancePopupSchedules, attendanceSelectedCompany, attendanceSelectedCourse, attendanceSelectedApplicableYear, attendanceSelectedPhase, attendanceSelectedStartDate]);

  const handleOpenAttendancePopup = async () => {
    if (attendancePopupLoading) {
      return;
    }

    setAttendancePopupLoading(true);
    try {
      const batchAssignments = await mongoDBService.getScheduledTrainingBatchAssignments();
      const normalizedAssignments = Array.isArray(batchAssignments) ? batchAssignments : [];
      setAttendancePopupSchedules(normalizedAssignments);
      setAttendanceSelectedCompany('');
      setAttendanceSelectedCourse('');
      setAttendanceSelectedApplicableYear('');
      setAttendanceSelectedPhase('');
      setAttendanceSelectedStartDate('');
      setAttendanceSelectedEndDate('');
      setIsAttendancePopupOpen(true);
    } catch (error) {
      console.error('Failed to load attendance popup data:', error);
      alert(error.message || 'Failed to load attendance info');
      setIsAttendancePopupOpen(false);
    } finally {
      setAttendancePopupLoading(false);
    }
  };

  const handleSearchAttendance = async () => {
    if (attendanceSearchLoading) {
      return;
    }

    const selectedSchedule = getSelectedAttendanceSchedule();
    if (!selectedSchedule) {
      alert('Please select Company, Course, Applicable Year, Phase, and Start Date.');
      return;
    }

    setAttendanceSearchLoading(true);
    try {
      // Fetch batch assignments for the selected company and course
      const filters = {
        companyName: attendanceSelectedCompany,
        courseName: attendanceSelectedCourse,
        applicableYear: attendanceSelectedApplicableYear
      };

      const batchAssignments = await mongoDBService.getScheduledTrainingBatchAssignments(filters);
      const normalizedAssignments = Array.isArray(batchAssignments) ? batchAssignments : [];

      const phaseFilteredAssignments = normalizedAssignments.filter((assignment) => {
        const phaseKey = attendanceSelectedPhase.toString().trim();
        if (!phaseKey) return true;

        const phaseEntries = Array.isArray(assignment?.phases) ? assignment.phases : [];
        const assignmentPhaseNumbers = phaseEntries
          .map((phase) => (phase?.phaseNumber || '').toString().trim())
          .filter(Boolean);
        const topLevelPhase = (assignment?.phaseNumber || '').toString().trim();

        return assignmentPhaseNumbers.includes(phaseKey) || topLevelPhase === phaseKey;
      });

      if (phaseFilteredAssignments.length === 0) {
        alert('No batch assignments found for the selected company and course.');
        setAttendanceSearchLoading(false);
        return;
      }

      // Navigate to attendance page with the selected data
      navigate('/admin-attendance-stdinfo', {
        state: {
          companyName: attendanceSelectedCompany,
          courseName: attendanceSelectedCourse,
          batchName: '-',
          scheduleId: selectedSchedule._id || '',
          startDate: selectedSchedule.startDate || '',
          endDate: attendanceSelectedEndDate || selectedSchedule.endDate || '',
          applicableYear: attendanceSelectedApplicableYear,
          phaseNumber: attendanceSelectedPhase,
          todayDate: todayInfo.todayDate,
          trainingDay: todayInfo.trainingDayLabel
        }
      });

      setIsAttendancePopupOpen(false);
    } catch (error) {
      console.error('Failed to fetch batch assignments:', error);
      alert(error.message || 'Failed to fetch attendance data. Please try again.');
    } finally {
      setAttendanceSearchLoading(false);
    }
  };

  const handleAttendanceCompanyChange = (value) => {
    setAttendanceSelectedCompany(value);
    setAttendanceSelectedCourse('');
    setAttendanceSelectedApplicableYear('');
    setAttendanceSelectedPhase('');
    setAttendanceSelectedStartDate('');
    setAttendanceSelectedEndDate('');
  };

  const handleAttendanceCourseChange = (value) => {
    setAttendanceSelectedCourse(value);
    setAttendanceSelectedApplicableYear('');
    setAttendanceSelectedPhase('');
    setAttendanceSelectedStartDate('');
    setAttendanceSelectedEndDate('');
  };

  const handleAttendanceApplicableYearChange = (value) => {
    setAttendanceSelectedApplicableYear(value);
    setAttendanceSelectedPhase('');
    setAttendanceSelectedStartDate('');
    setAttendanceSelectedEndDate('');
  };

  const handleAttendancePhaseChange = (value) => {
    setAttendanceSelectedPhase(value);
    setAttendanceSelectedStartDate('');
    setAttendanceSelectedEndDate('');
  };

  const handleAttendanceStartDateChange = (value) => {
    setAttendanceSelectedStartDate(value);
    const selectedSchedule = attendancePopupSchedules.find((schedule) => {
      const companyMatch = (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany;
      const courseMatch = parseScheduleCourses(schedule).includes(attendanceSelectedCourse);
      const yearKey = normalizeYearToken(attendanceSelectedApplicableYear);
      const phaseKey = attendanceSelectedPhase.toString().trim();
      const scheduleYear = normalizeYearToken(schedule?.applicableYear || '');
      const phaseEntries = parseSchedulePhases(schedule);
      const phaseYears = phaseEntries.map((phase) => normalizeYearToken(phase.applicableYear));
      const phaseNumbers = phaseEntries.map((phase) => phase.phaseNumber);
      const schedulePhase = (schedule?.phaseNumber || '').toString().trim();
      const yearMatch = !yearKey || scheduleYear === yearKey || phaseYears.includes(yearKey);
      const phaseMatch = !phaseKey || phaseNumbers.includes(phaseKey) || schedulePhase === phaseKey;
      const startMatch = normalizeDateKey(schedule?.startDate) === normalizeDateKey(value);
      return companyMatch && courseMatch && yearMatch && phaseMatch && startMatch;
    });

    setAttendanceSelectedEndDate(selectedSchedule?.endDate || '');
  };

  return (
    <div className={styles['ad-tr-page']}>
      {activePopup === 'deleteWarning' && (
        <div className={styles['ad-tr-popup-overlay']}>
          <div className={styles['ad-tr-popup-container']}>
            <div className={styles['ad-tr-popup-header']}>Delete Training</div>
            <div className={styles['ad-tr-popup-body']}>
              <div className={styles['ad-tr-warning-icon']}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="55" fill="none" stroke="#ffa500" strokeWidth="2" />
                  <text x="60" y="75" textAnchor="middle" fill="#ffffff" fontSize="48" fontWeight="700" fontFamily="Arial">!</text>
                </svg>
              </div>
              <h2>Are you sure?</h2>
              <p>Delete training for <strong>{cardToDelete?.companyName}</strong>? This action cannot be undone.</p>
            </div>
            <div className={styles['ad-tr-popup-footer']}>
              <button onClick={closePopup} className={styles['ad-tr-popup-cancel-btn']} disabled={deleteInProgress}>Discard</button>
              <button onClick={confirmDelete} className={styles['ad-tr-popup-delete-btn']} disabled={deleteInProgress}>
                {deleteInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {activePopup === 'deleteSuccess' && (
        <div className={styles['ad-tr-popup-overlay']}>
          <div className={styles['ad-tr-popup-container']}>
            <div className={styles['ad-tr-popup-header']}>Deleted !</div>
            <div className={styles['ad-tr-popup-body']}>
              <div className={styles['ad-tr-icon-wrapper']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2>Training Deleted ✓</h2>
              <p>The training has been deleted successfully!</p>
            </div>
            <div className={styles['ad-tr-popup-footer']}>
              <button onClick={closePopup} className={styles['ad-tr-popup-close-btn']}>Close</button>
            </div>
          </div>
        </div>
      )}

      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles['ad-tr-content']}>
        <div className={styles['ad-tr-header-row']}>
          <div className={styles['ad-tr-breadcrumb']}>
            {/* <div className={styles['ad-tr-breadcrumb-title']}>Admin</div>
            <div className={styles['ad-tr-breadcrumb-sub']}>Training</div> */}
          </div>
        </div>

        <div className={styles['ad-tr-top-grid']}>
          <button type="button" className={styles['ad-tr-action-card']} onClick={() => navigate('/admin-training-company')}>
            <img className={styles['ad-tr-action-icon']} src={AddTrainingIcon} alt="Add Training" />
            <h4 className={styles['ad-tr-action-title']}>Training Company</h4>
            <p className={styles['ad-tr-action-sub']}>All Training Company for Scheduling</p>
          </button>

          <button type="button" className={styles['ad-tr-action-card']} onClick={() => navigate('/admin-schedule-training')}>
            <img className={styles['ad-tr-action-icon']} src={ScheduleTrainingIcon} alt="Schedule Training" />
            <h4 className={styles['ad-tr-action-title']}>Schedule Training</h4>
            <p className={styles['ad-tr-action-sub']}>Plan phases and schedule your training sessions</p>
          </button>

          <button
            type="button"
            className={styles['ad-tr-action-card']}
            onClick={handleOpenAttendancePopup}
            disabled={attendancePopupLoading}
          >
            <img className={styles['ad-tr-action-icon']} src={AttendanceTrainingIcon} alt="Attendance and Student Info" />
            <h4 className={styles['ad-tr-action-title']}>
              {attendancePopupLoading ? 'Loading...' : 'Attendance Information'}
            </h4>
            <p className={styles['ad-tr-action-sub']}>View daily attendance status and student details</p>
          </button>
          <div className={styles['ad-tr-filter-card']}>
            <div className={styles['ad-tr-filter-header-container']}>
              <div className={styles['ad-tr-filter-title']}>Trainings</div>
              {(selectedCompany || selectedYear || selectedStartDate || selectedEndDate) && (
                <button
                  type="button"
                  className={styles['ad-tr-filter-clear-btn']}
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              )}
            </div>
            <div className={styles['ad-tr-filter-grid']}>
              <div className={styles['ad-tr-filter-field']}>
                <label className={styles['ad-tr-filter-label']}>Company</label>
                <div className={styles['ad-tr-filter-container']}>
                  <select
                    className={styles['ad-tr-filter-control']}
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                  >
                    <option value="">Select Company</option>
                    {companies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles['ad-tr-filter-field']}>
                <label className={styles['ad-tr-filter-label']}>Year</label>
                <div className={styles['ad-tr-filter-container']}>
                  <select
                    className={styles['ad-tr-filter-control']}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles['ad-tr-filter-field']}>
                <label className={styles['ad-tr-filter-label']}>Start Date</label>
                <div className={styles['ad-tr-filter-container']}>
                  <select
                    className={styles['ad-tr-filter-control']}
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    disabled={startDateOptions.length === 0}
                  >
                    <option value="">Select Start Date</option>
                    {startDateOptions.map((dateValue) => (
                      <option key={dateValue} value={dateValue}>{formatDateForDisplay(dateValue)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles['ad-tr-filter-field']}>
                <label className={styles['ad-tr-filter-label']}>End Date</label>
                <div className={styles['ad-tr-filter-container']}>
                  <select
                    className={styles['ad-tr-filter-control']}
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    disabled={endDateOptions.length === 0}
                  >
                    <option value="">Select End Date</option>
                    {endDateOptions.map((dateValue) => (
                      <option key={dateValue} value={dateValue}>{formatDateForDisplay(dateValue)}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className={styles['ad-tr-section-header']}>
          <div className={styles['ad-tr-section-header-title']}>Trainings</div>
          <button
            type="button"
            className={styles['ad-tr-section-archive-btn']}
            onClick={() => navigate('/admin-trainings-archive')}
          >
            Archive
          </button>
        </div>

        <div className={styles['ad-tr-training-grid']}>
          {isLoadingCards ? (
            <div className={styles['ad-tr-loading-wrapper']}>
              <div className={styles['ad-tr-spinner']}></div>
              <span className={styles['ad-tr-loading-text']}>Loading scheduled trainings…</span>
            </div>
          ) : filteredTrainingCards.length === 0 ? (
            <div className={styles['ad-tr-training-empty']}>No scheduled trainings found.</div>
          ) : (
            filteredTrainingCards.map((card, index) => {
              const baseCardClass = index % 2 === 0 ? styles['ad-tr-training-card'] : styles['ad-tr-training-card-alt'];
              const logoClass = index % 2 === 0 ? styles['ad-tr-training-logo'] : styles['ad-tr-training-logo-alt'];
              const ended = Boolean(card.isEnded);
              const cardClass = ended ? `${baseCardClass} ${styles['ad-tr-training-card-ended']}` : baseCardClass;

              const handleCardClick = () => {
                const query = new URLSearchParams({
                  mode: 'edit',
                  company: card.companyName
                });

                if (card.scheduleId) {
                  query.set('scheduleId', card.scheduleId);
                }

                navigate(`/admin-preferred-training-students?${query.toString()}`);
              };

              return (
                <div key={card.id} className={cardClass} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                  <div className={styles['ad-tr-training-card-menu']} data-training-card-menu="true">
                    <button
                      type="button"
                      className={styles['ad-tr-training-card-menu-btn']}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenCardMenuId((current) => (current === card.id ? '' : card.id));
                      }}
                      aria-label="Open card actions"
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <circle cx="8" cy="3" r="1.4" />
                        <circle cx="8" cy="8" r="1.4" />
                        <circle cx="8" cy="13" r="1.4" />
                      </svg>
                    </button>

                    {openCardMenuId === card.id && (
                      <div className={styles['ad-tr-training-card-menu-dropdown']}>
                        <button
                          type="button"
                          className={styles['ad-tr-training-card-menu-item']}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleArchiveCard(card);
                          }}
                        >
                          Archive
                        </button>
                        <button
                          type="button"
                          className={styles['ad-tr-training-card-menu-item']}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteCard(card);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={logoClass}>{card.logoText}</div>
                  <div className={ended ? styles['ad-tr-ended-badge'] : styles['ad-tr-active-badge']}>
                    {ended ? 'ENDED' : 'ACTIVE'}
                  </div>
                  <div className={styles['ad-tr-training-name']}>{card.companyName}</div>
                  <div className={styles['ad-tr-training-meta']}>Year: {card.yearText}</div>
                  <div className={styles['ad-tr-training-meta']}>Phase: {card.phaseText}</div>
                  <div className={styles['ad-tr-training-meta']}>Students: {card.studentCount}</div>
                  <div className={styles['ad-tr-training-meta']}>Start Date: {formatDateForDisplay(card.startDate)}</div>
                  <div className={styles['ad-tr-training-meta']}>End Date: {formatDateForDisplay(card.endDate)}</div>
                  <div className={styles['ad-tr-training-meta']}>Duration: {card.durationText}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isAttendancePopupOpen && (
        <div className={styles['ad-tr-att-popup-overlay']}>
          <div className={styles['ad-tr-att-popup-container']}>
            <div className={styles['ad-tr-att-popup-header']}>Attendance & Student Info</div>

            <div className={styles['ad-tr-att-popup-body']}>
              <div className={styles['ad-tr-att-popup-grid']}>
                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Company</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedCompany}
                      onChange={(e) => handleAttendanceCompanyChange(e.target.value)}
                    >
                      <option value="">Select Company</option>
                      {attendanceCompanyOptions.map((companyName) => (
                        <option key={companyName} value={companyName}>{companyName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Course</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedCourse}
                      onChange={(e) => handleAttendanceCourseChange(e.target.value)}
                      disabled={!attendanceSelectedCompany}
                    >
                      <option value="">Select Course</option>
                      {attendanceCourseOptions.map((courseName) => (
                        <option key={courseName} value={courseName}>{courseName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Applicable Year</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedApplicableYear}
                      onChange={(e) => handleAttendanceApplicableYearChange(e.target.value)}
                      disabled={!attendanceSelectedCompany || !attendanceSelectedCourse}
                    >
                      <option value="">Select Applicable Year</option>
                      {attendanceApplicableYearOptions.map((yearValue) => (
                        <option key={yearValue} value={yearValue}>{yearValue}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Phase</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedPhase}
                      onChange={(e) => handleAttendancePhaseChange(e.target.value)}
                      disabled={!attendanceSelectedCompany || !attendanceSelectedCourse || !attendanceSelectedApplicableYear}
                    >
                      <option value="">Select Phase</option>
                      {attendancePhaseOptions.map((phaseValue) => (
                        <option key={phaseValue} value={phaseValue}>{`Phase ${phaseValue}`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Start Date</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedStartDate}
                      onChange={(e) => handleAttendanceStartDateChange(e.target.value)}
                      disabled={!attendanceSelectedCompany || !attendanceSelectedCourse || !attendanceSelectedApplicableYear || !attendanceSelectedPhase}
                    >
                      <option value="">Select Start Date</option>
                      {attendanceStartDateOptions.map((startDate) => (
                        <option key={startDate} value={startDate}>{formatDateForDisplay(startDate)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>End Date</label>
                  <div className={styles['ad-tr-att-text-container']}>
                    <input
                      className={styles['ad-tr-att-text']}
                      value={formatDateForDisplay(attendanceSelectedEndDate)}
                      readOnly
                      placeholder="Auto fetched"
                    />
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Today Date</label>
                  <div className={styles['ad-tr-att-text-container']}>
                    <input className={styles['ad-tr-att-text']} value={todayInfo.todayDate} readOnly />
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Training Day</label>
                  <div className={styles['ad-tr-att-text-container']}>
                    <input className={styles['ad-tr-att-text']} value={todayInfo.trainingDayLabel} readOnly />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['ad-tr-att-popup-footer']}>
              <button
                type="button"
                className={styles['ad-tr-att-popup-close-btn']}
                onClick={() => setIsAttendancePopupOpen(false)}
                disabled={attendanceSearchLoading}
              >
                Close
              </button>
              <button
                type="button"
                className={styles['ad-tr-att-popup-search-btn']}
                onClick={handleSearchAttendance}
                disabled={attendanceSearchLoading}
              >
                {attendanceSearchLoading ? 'Search...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTraining;
