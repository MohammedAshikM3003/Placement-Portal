import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import AddTrainingIcon from '../assets/ad_addtrainingicon.svg';
import ScheduleTrainingIcon from '../assets/ad_scheduletrainingicon.svg';
import AttendanceTrainingIcon from '../assets/ad_at_attendance.svg';
import styles from './Admin_Training.module.css';
import mongoDBService from '../services/mongoDBService';

function AdminTraining({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainingCards, setTrainingCards] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const getPlaceholderText = () => {
    if (selectedCompany && !selectedBatch) return 'Select the Batch';
    if (!selectedCompany && selectedBatch) return 'Select the Company';
    return 'Select Company and Batch';
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const getAbsentSlicePath = (absentPercent) => {
    if (!absentPercent || absentPercent <= 0) return '';
    if (absentPercent >= 1) {
      return 'M60 20 A40 40 0 1 1 59.999 20 L60 60 Z';
    }

    const startAngle = 0;
    const endAngle = absentPercent * 360;
    const start = polarToCartesian(60, 60, 40, endAngle);
    const end = polarToCartesian(60, 60, 40, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 0 ${end.x} ${end.y} L 60 60 Z`;
  };

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const loadTrainingDashboardData = async () => {
      setIsLoadingCards(true);
      try {
        const [schedules, trainings] = await Promise.all([
          mongoDBService.getScheduledTrainings(),
          mongoDBService.getTrainings()
        ]);

        const normalizedSchedules = Array.isArray(schedules) ? schedules : [];
        const normalizedTrainings = Array.isArray(trainings) ? trainings : [];

        const companyList = [...new Set(
          normalizedSchedules
            .map((item) => (item?.companyName || '').toString().trim())
            .filter(Boolean)
        )];
        setCompanies(companyList);

        const batchList = [...new Set(
          normalizedSchedules.flatMap((item) =>
            Array.isArray(item?.batches)
              ? item.batches
                  .map((batch) => (batch?.batchName || '').toString().trim())
                  .filter(Boolean)
              : []
          )
        )];
        setBatches(batchList);

        const trainingByCompany = new Map(
          normalizedTrainings.map((item) => [
            (item?.companyName || '').toString().trim(),
            item
          ])
        );

        const cards = normalizedSchedules.map((schedule) => {
          const companyName = (schedule?.companyName || '').toString().trim() || 'Training';
          const trainingInfo = trainingByCompany.get(companyName);
          const trainerCount = Array.isArray(trainingInfo?.trainers) ? trainingInfo.trainers.length : 0;
          const firstCourse = Array.isArray(trainingInfo?.courses) && trainingInfo.courses[0]?.name
            ? trainingInfo.courses[0].name
            : '-';

          const batchNames = Array.isArray(schedule?.batches)
            ? schedule.batches
                .map((batch) => (batch?.batchName || '').toString().trim())
                .filter(Boolean)
            : [];

          const batchCount = batchNames.length;
          const phaseCount = Array.isArray(schedule?.phases) ? schedule.phases.length : 0;

          let durationText = 'Duration: -';
          const start = new Date(schedule?.startDate);
          const end = new Date(schedule?.endDate);
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            const diffMs = end.getTime() - start.getTime();
            const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
            durationText = `Duration: ${days} Day${days > 1 ? 's' : ''}`;
          }

          return {
            id: schedule?._id || `${companyName}-${schedule?.startDate || ''}`,
            scheduleId: schedule?._id || '',
            companyName,
            logoText: companyName.charAt(0).toUpperCase() || 'T',
            trainerCount,
            firstCourse,
            batchNames,
            batchCount,
            phaseCount,
            durationText
          };
        });

        setTrainingCards(cards);
      } catch (error) {
        console.error('Failed to load admin training dashboard data:', error);
        setCompanies([]);
        setBatches([]);
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

      if (selectedBatch && !card.batchNames.includes(selectedBatch)) {
        return false;
      }

      return true;
    });
  }, [trainingCards, selectedCompany, selectedBatch]);

  const appliedSummary = useMemo(() => {
    if (!selectedCompany || !selectedBatch) return null;
    return filteredTrainingCards[0] || null;
  }, [filteredTrainingCards, selectedCompany, selectedBatch]);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  return (
    <div className={styles['ad-tr-page']}>
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
            <div className={styles['ad-tr-action-icon']}>
              <img src={AddTrainingIcon} alt="Add Training" />
            </div>
            <div className={styles['ad-tr-action-title']}>Add Training Programme</div>
            <div className={styles['ad-tr-action-sub']}>Click to Add Training programs to develop Students skills</div>
          </button>

          <button
            type="button"
            className={styles['ad-tr-action-card']}
            onClick={() => navigate('/admin-schedule-training?mode=new')}
          >
            <div className={styles['ad-tr-action-icon']}>
              <img src={ScheduleTrainingIcon} alt="Schedule Training" />
            </div>
            <div className={styles['ad-tr-action-title']}>Schedule Training</div>
            <div className={styles['ad-tr-action-sub']}>Click to Schedule Training programs to develop Students skill</div>
          </button>

          <button type="button" className={styles['ad-tr-action-card']}
          onClick={() => navigate('/admin-attendance-stdinfo')}
          >
            <div className={styles['ad-tr-action-icon']}>
              <img src={AttendanceTrainingIcon} alt="Attendance and Student Info" />
            </div>
            <div className={styles['ad-tr-action-title']}>Attendance & Student Info</div>
            <div className={styles['ad-tr-action-sub']}>Click to take Attendance and to view Student info</div>
          </button>

          <div className={styles['ad-tr-summary-card']}>
            <div className={styles['ad-tr-summary-filters']}>
              <select
                className={styles['ad-tr-select']}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className={styles['ad-tr-select']}
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className={styles['ad-tr-summary-body']}>
              <div className={styles['ad-tr-summary-text']}>
                {appliedSummary ? (
                  <>
                    <div className={styles['ad-tr-summary-line']}><span>Company :</span><strong>{appliedSummary.companyName}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Batches :</span><strong>{appliedSummary.batchCount}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Phases :</span><strong>{appliedSummary.phaseCount}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Course :</span><strong>{appliedSummary.firstCourse}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Trainers :</span><strong>{appliedSummary.trainerCount}</strong></div>
                  </>
                ) : (
                  <div className={styles['ad-tr-summary-placeholder']}>{getPlaceholderText()}</div>
                )}
              </div>

              <div className={styles['ad-tr-summary-chart']}>
                {(() => {
                  const present = appliedSummary?.present ?? 0;
                  const absent = appliedSummary?.absent ?? 0;
                  const total = present + absent;
                  const absentPercent = total > 0 ? absent / total : 0;
                  const absentPath = getAbsentSlicePath(absentPercent);

                  return (
                    <>
                      <svg viewBox="0 0 120 120" className={styles['ad-tr-pie']} aria-hidden="true">
                        {/* Background circle for Present (green) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="40"
                          fill="#17c491"
                        />
                        {/* Absent slice (red) as a path */}
                        {absentPath ? (
                          <path
                            d={absentPath}
                            fill="#ff6b6b"
                          />
                        ) : null}
                        {/* Labels inside pie */}
                        <text x="70" y="55" className={styles['ad-tr-pie-label-present']}>Present</text>
                        <text x="72" y="70" className={styles['ad-tr-pie-value-present']}>{present}</text>
                        <text x="32" y="45" className={styles['ad-tr-pie-label-absent']}>Absent</text>
                        <text x="35" y="60" className={styles['ad-tr-pie-value-absent']}>{absent}</text>
                      </svg>

                      <div className={styles['ad-tr-summary-legend']}>
                        <div className={styles['ad-tr-legend-row']}>
                          <span>Present</span>
                          <strong className={styles['ad-tr-legend-present']}>{present}</strong>
                        </div>
                        <div className={styles['ad-tr-legend-row']}>
                          <span>Absent</span>
                          <strong className={styles['ad-tr-legend-absent']}>{absent}</strong>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className={styles['ad-tr-section-header']}>Trainings</div>

        <div className={styles['ad-tr-training-grid']}>
          {isLoadingCards ? (
            <div className={styles['ad-tr-training-empty']}>Loading scheduled trainings...</div>
          ) : filteredTrainingCards.length === 0 ? (
            <div className={styles['ad-tr-training-empty']}>No scheduled trainings found.</div>
          ) : (
            filteredTrainingCards.map((card, index) => {
              const cardClass = index % 2 === 0 ? styles['ad-tr-training-card'] : styles['ad-tr-training-card-alt'];
              const logoClass = index % 2 === 0 ? styles['ad-tr-training-logo'] : styles['ad-tr-training-logo-alt'];

              const handleCardClick = () => {
                const query = new URLSearchParams({
                  mode: 'edit',
                  company: card.companyName
                });

                if (card.scheduleId) {
                  query.set('scheduleId', card.scheduleId);
                }

                navigate(`/admin-schedule-training?${query.toString()}`);
              };

              return (
                <div key={card.id} className={cardClass} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                  <div className={logoClass}>{card.logoText}</div>
                  <div className={styles['ad-tr-training-name']}>{card.companyName}</div>
                  <div className={styles['ad-tr-training-meta']}>Batches: {card.batchCount}</div>
                  <div className={styles['ad-tr-training-meta']}>Phases: {card.phaseCount}</div>
                  <div className={styles['ad-tr-training-meta']}>Trainers: {card.trainerCount}</div>
                  <div className={styles['ad-tr-training-meta']}>{card.durationText}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTraining;
