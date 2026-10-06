import React, { useState, useEffect } from "react";
import { FaStar, FaRegStar } from 'react-icons/fa';
import mongoDBService from '../services/mongoDBService.jsx';

function SFPScrollTextarea({ value, height = 140, placeholder }) {
  return (
    <div
      style={{
        display: 'block',
        minHeight: `${height}px`,
        borderRadius: '10px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #e0e0e0',
        padding: '12px',
        boxSizing: 'border-box',
        fontFamily: "'Poppins', sans-serif",
        fontSize: '0.88rem',
        color: value ? '#444' : '#888',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textAlign: 'left'
      }}
    >
      {value || placeholder}
    </div>
  );
}

export const CooRAAdminFeedbackView = ({
  roundName,
  onClose,
  studentData = {},
  roundNumber = null,
  driveContext = null,
  selectedStartDate = null,
  selectedJobRole = null,
  selectedCompany = null
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(1);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [loadError, setLoadError] = useState('');
  const FIELD_HEIGHT = '50px';

  const [isPopupMobile, setIsPopupMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const onResize = () => setIsPopupMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAdminFeedbackRecord = async () => {
      const normalizedRound = Number.isFinite(Number(roundNumber))
        ? Number(roundNumber)
        : Number.parseInt(String(roundName || '').match(/round\s+(\d+)/i)?.[1] || '', 10);

      const targetDriveId = driveContext?._id || driveContext?.driveId || '';
      const targetCompany = selectedCompany || driveContext?.companyName || '';
      const targetJobRole = selectedJobRole || driveContext?.jobRole || '';
      const targetStartDate = selectedStartDate || driveContext?.startingDate || '';
      const studentResult = String(studentData?.Result || studentData?.status || '').toLowerCase();
      const feedbackTypeFilter = studentResult === 'passed' ? 'passed' : studentResult === 'failed' ? 'failed' : '';

      setIsLoadingFeedback(true);
      setLoadError('');

      try {
        const response = await mongoDBService.getFeedbackByDrive(targetDriveId, {
          companyName: targetCompany,
          jobRole: targetJobRole,
          startingDate: targetStartDate,
          roundNumber: Number.isFinite(normalizedRound) ? normalizedRound : '',
          feedbackType: feedbackTypeFilter
        });

        if (!isMounted) return;

        let records = Array.isArray(response?.data) ? response.data : [];

        // If no records found with feedbackType filter, try without feedbackType filter
        if (records.length === 0 && feedbackTypeFilter) {
          const fallbackResponse = await mongoDBService.getFeedbackByDrive(targetDriveId, {
            companyName: targetCompany,
            jobRole: targetJobRole,
            startingDate: targetStartDate,
            roundNumber: Number.isFinite(normalizedRound) ? normalizedRound : ''
          });
          if (Array.isArray(fallbackResponse?.data) && fallbackResponse.data.length > 0) {
            records = fallbackResponse.data;
          }
        }

        const latest = records[0] || null;

        if (!latest) {
          setFeedback('');
          return;
        }

        setFeedback((latest?.feedback || '').toString());
        if (latest?.selectedDate) {
          setSelectedDate(String(latest.selectedDate).slice(0, 10));
        }
        setRating(Number(latest?.rating) > 0 ? Number(latest.rating) : 1);
        if (latest?.studentCount || latest?.eligibleStudentsCount) {
          setStudentCount(Number(latest.studentCount || latest.eligibleStudentsCount) || 0);
        }
      } catch (error) {
        if (!isMounted) return;
        setLoadError('Unable to load admin feedback.');
        console.error('Coordinator report admin feedback load error:', error);
      } finally {
        if (isMounted) {
          setIsLoadingFeedback(false);
        }
      }
    };

    loadAdminFeedbackRecord();

    return () => {
      isMounted = false;
    };
  }, [roundNumber, roundName, driveContext?._id, driveContext?.driveId, driveContext?.companyName, driveContext?.jobRole, driveContext?.startingDate, selectedStartDate, selectedJobRole, selectedCompany, studentData?.Result, studentData?.status]);

  const color = {
    header: '#4EA24E',
    badgeBg: '#E8F5E8',
    badgeText: '#2a5a2a',
    primary: '#4EA24E',
    primaryShadow: 'rgba(78,162,78,0.3)',
    assessment: '#4EA24E',
    focus: '#4EA24E',
    focusRing: 'rgba(78,162,78,0.2)',
    thumb: '#4EA24E'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: isPopupMobile ? '560px' : '620px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <div
          style={{
            backgroundColor: color.header,
            color: '#fff',
            padding: '1.1rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '0.02em'
          }}
        >
          Admin Feedback View
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 16px 0' }}>
          <div
            style={{
              backgroundColor: color.badgeBg,
              color: color.badgeText,
              borderRadius: '20px',
              padding: '6px 32px',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            {roundName || 'Round Wise Analysis'}
          </div>
        </div>

        <div
          className="araf-popup-body"
          style={{
            padding: '12px 20px 8px',
            paddingRight: '16px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <div style={{ backgroundColor: color.badgeBg, color: color.badgeText, borderRadius: '999px', padding: '6px 14px', fontWeight: 700, fontSize: '0.92rem' }}>
                Admin Feedback
              </div>
              {studentData?.Name && (
                <div style={{ backgroundColor: '#f3f6fb', color: '#4f5b6b', borderRadius: '999px', padding: '6px 14px', fontWeight: 600, fontSize: '0.86rem' }}>
                  Student: {studentData.Name}
                </div>
              )}
              {studentData?.RegNo && (
                <div style={{ backgroundColor: '#f3f6fb', color: '#4f5b6b', borderRadius: '999px', padding: '6px 14px', fontWeight: 600, fontSize: '0.86rem' }}>
                  Reg No: {studentData.RegNo}
                </div>
              )}
              {studentData?.Result && (
                <div style={{ backgroundColor: '#f3f6fb', color: '#4f5b6b', borderRadius: '999px', padding: '6px 14px', fontWeight: 600, fontSize: '0.86rem' }}>
                  Result: {studentData.Result}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'nowrap' }}>
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #def4dd', borderRadius: '8px', height: FIELD_HEIGHT, padding: '0 0.9rem', backgroundColor: '#f9fff9', fontSize: '0.84rem', lineHeight: 1.2, userSelect: 'none', boxSizing: 'border-box', width: '100%' }}>
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedDate ? (() => { const [y, m, d] = selectedDate.split('-'); return `${d}-${m}-${y}`; })() : 'DD-MM-YYYY'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                {studentCount > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #def4dd', borderRadius: '8px', height: FIELD_HEIGHT, padding: '0 0.9rem', backgroundColor: '#f9fff9', fontSize: '0.84rem', lineHeight: 1.2, userSelect: 'none', boxSizing: 'border-box', width: '100%' }}>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {`Students Count: ${studentCount}`}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ backgroundColor: color.assessment, color: '#fff', borderRadius: '8px', padding: '0 14px', fontWeight: 700, fontSize: '0.95rem', textAlign: 'center', height: FIELD_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Overall Assessment
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ fontSize: isPopupMobile ? '2.2rem' : '2.05rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                      {rating >= star ? <FaStar color="#FFE817" /> : <FaRegStar color="#ccc" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px' }}>Feedback :</div>
            <div style={{ position: 'relative' }}>
              <SFPScrollTextarea value={feedback} height={158} placeholder="No admin feedback submitted for this round yet." />
            </div>
            {isLoadingFeedback && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Loading admin feedback...</div>}
            {!isLoadingFeedback && !feedback && !loadError && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>No admin feedback found for this round.</div>}
            {loadError && <div style={{ fontSize: '0.8rem', color: '#d32f2f', marginTop: '4px' }}>{loadError}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: isPopupMobile ? '14px 24px calc(env(safe-area-inset-bottom, 20px) + 25px)' : '14px 24px 20px', background: '#fff', borderTop: '1px solid #eef1f7' }}>
          <button onClick={onClose} style={{ backgroundColor: '#7C7C7C', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 40px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default CooRAAdminFeedbackView;
