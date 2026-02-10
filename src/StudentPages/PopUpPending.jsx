import React from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import scrollStyles from './PopupScrollbar.module.css';

// Helper to format dates from YYYY-MM-DD to DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

// Dynamic rounds based on app data - no hardcoded mock data
export const generateRounds = (app) => {
  // Check if student is Absent - if any round is Absent, mark all as Absent
  const hasAbsent = app?.rounds?.some(r => r.status === 'Absent');
  
  // If roundDetails exist, use them as the base and merge with student rounds
  if (app?.roundDetails && app.roundDetails.length > 0) {
    return app.roundDetails.map((roundName, index) => {
      // Find corresponding student round by name or round number
      const studentRound = app.rounds?.find(
        r => r.name === roundName || 
             r.roundName === roundName || 
             r.roundNumber === (index + 1)
      );
      
      // If student is absent, mark all rounds as Absent
      const status = hasAbsent ? "Absent" : (studentRound?.status || "Pending");
      
      return {
        name: roundName || `Round ${index + 1}`,
        status: status,
        icon: status === "Passed" 
          ? <FaCheckCircle color="#197AFF" size={28} />
          : status === "Failed"
          ? <FaTimes color="#D23B42" size={28} />
          : status === "Absent"
          ? <FaExclamationCircle color="#FA7B20" size={28} />
          : <FaExclamationCircle color="#949494" size={28} />,
        statusColor: status === "Passed" ? "#197AFF" : 
                     status === "Failed" ? "#D23B42" :
                     status === "Absent" ? "#FA7B20" : "#717070",
        statusText: status
      };
    });
  }
  
  // Fallback: If only student rounds exist without roundDetails
  if (app?.rounds && app.rounds.length > 0) {
    // Check if any round has Absent status
    const hasAbsent = app.rounds.some(r => r.status === 'Absent');
    
    return app.rounds.map(round => {
      const status = hasAbsent ? "Absent" : round.status;
      
      return {
        name: round.name || round.roundName || `Round ${round.roundNumber}`,
        status: status,
        icon: status === "Passed" 
          ? <FaCheckCircle color="#197AFF" size={28} />
          : status === "Failed"
          ? <FaTimes color="#D23B42" size={28} />
          : status === "Absent"
          ? <FaExclamationCircle color="#FA7B20" size={28} />
          : <FaExclamationCircle color="#949494" size={28} />,
        statusColor: status === "Passed" ? "#197AFF" : 
                     status === "Failed" ? "#D23B42" :
                     status === "Absent" ? "#FA7B20" : "#717070",
        statusText: status || "Pending"
      };
    });
  }
  
  return []; // Return empty array if no rounds data
};

export const getOverallStatus = (app) => {
  const rounds = generateRounds(app);
  const hasAbsent = rounds.some(r => r.status === "Absent");
  const hasFailed = rounds.some(r => r.status === "Failed");
  const passedCount = rounds.filter(r => r.status === "Passed").length;
  const totalRounds = app?.totalRounds || app?.roundDetails?.length || rounds.length;
  const allPassed = passedCount === totalRounds && totalRounds > 0;

  if (hasAbsent) {
    return { status: "Absent", color: "#FA7B20" };
  }
  if (hasFailed) {
    return { status: "Rejected", color: "#D23B42" };
  }
  if (allPassed) {
    return { status: "Placed", color: "#1FAD66" };
  }
  if (passedCount > 0) {
    return { status: `Passed-${passedCount}`, color: "#1976D2" };
  }
  return { status: "Pending", color: "#717070" };
};

export default function PopUpPending({ app, onBack }) {
  console.log('PopUpPending received app:', app);
  console.log('App rounds:', app?.rounds);
  console.log('App roundDetails:', app?.roundDetails);
  
  const rounds = generateRounds(app);
  console.log('Generated rounds:', rounds);

  const { status: overallStatus, color: overallStatusColor } = getOverallStatus(app);

  console.log('PopUpPending Status analysis:', { overallStatus });

  // Get total rounds from roundDetails or rounds array
  const displayTotalRounds = app?.totalRounds || app?.roundDetails?.length || rounds.length || 'N/A';

  return (
    <>
        <h2 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: 20, marginLeft: 5, flexShrink: 0 }}>
            {app ? `${app.company}'s Placement` : "Company's Placement"}
        </h2>
        <div style={{ background: "#fff", padding: "28px", borderRadius: 16, boxShadow: "0 4px 24px #e9e6ef", flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Company Info Section */}
            <div style={{ marginBottom: 20, padding: "16px", background: "#f6f7fa", borderRadius: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.95rem' }}>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Company: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>{app?.company || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Job Role: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>{app?.jobRole || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Total Rounds: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>{displayTotalRounds}</span>
                </div>
                <div>
                  <span style={{ color: "#888", fontWeight: 500 }}>Drive Date: </span>
                  <span style={{ color: "#333", fontWeight: 600 }}>
                    {app?.startDate && app?.endDate 
                      ? `${formatDate(app.startDate)} to ${formatDate(app.endDate)}` 
                      : app?.startDate 
                      ? formatDate(app.startDate) 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <span style={{ fontSize: 23, color: "#888" }}>Overall Status: </span>
              <span style={{ 
                fontSize: 25, 
                color: overallStatusColor, 
                fontWeight: 700,
                padding: '4px 16px',
                borderRadius: '8px',
                background: `${overallStatusColor}15`
              }}>
                {overallStatus}
              </span>
            </div>
            <div style={{ marginTop: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 style={{ fontWeight: 700, fontSize: "1.7rem", marginBottom: 12 }}>Recruitment Journey</h3>
                <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: "8px 32px", fontWeight: 600, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 18, marginRight: 6 }}>Back</span><span style={{ fontSize: 22 }}>↩</span>
                </button>
              </div>
              <div style={{ marginTop: 28, overflowY: "auto", paddingRight: 4, flexGrow: 1 }} className={scrollStyles['scroll-rounds']}>
                {rounds.length > 0 ? rounds.map((round, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", background: "#f6f7fa", borderRadius: 16, marginBottom: 18, padding: "18px 30px" }}>
                    <div style={{ marginRight: 28 }}>{round.icon}</div>
                    <div style={{ flex: 1, fontSize: "1.07rem", fontWeight: 600 }}>{round.name}</div>
                    <div style={{ fontSize: 14, color: "#888" }}>
                      Status: <span style={{ 
                        color: round.statusColor, 
                        fontWeight: 600,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: `${round.statusColor}15`
                      }}>
                        {round.statusText}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: '#888', padding: '40px', fontSize: '1rem' }}>
                    No round information available
                  </div>
                )}
              </div>
            </div>
        </div>
    </>
  );
}