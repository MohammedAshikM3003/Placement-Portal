import React from "react";
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle } from "react-icons/fa";

// Helper to format dates from YYYY-MM-DD to DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

// Dynamic rounds based on app data - no hardcoded mock data
const generateRounds = (app) => {
  if (!app || !app.rounds) {
    return []; // Return empty array if no rounds data
  }
  
  return app.rounds.map(round => {
    let icon, statusColor;
    
    switch (round.status) {
      case "Passed":
        icon = <FaCheckCircle color="#197AFF" size={28} />;
        statusColor = "#197AFF";
        break;
      case "Rejected":
        icon = <FaTimesCircle color="#E62727" size={28} />;
        statusColor = "#E62727";
        break;
      default:
        icon = <FaExclamationCircle color="#949494" size={28} />;
        statusColor = "#717070";
    }
    
    return {
      name: round.name,
      status: round.status,
      icon: icon,
      statusColor: statusColor,
      statusText: round.status || "N/A"
    };
  });
};

export default function PopUpRejected({ app, onBack }) {
  const rounds = generateRounds(app);
  
  // Get total rounds from roundDetails or rounds array
  const totalRounds = app?.totalRounds || app?.roundDetails?.length || rounds.length || 'N/A';
  
  return (
    <>
        <h2 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: 20, marginLeft: 5, flexShrink: 0 }}>
            {app ? `${app.company}'s Placement` : "Company's Placement"}
        </h2>
        <div style={{ background: "#fff", padding: "36px", borderRadius: 16, boxShadow: "0 4px 24px #e9e6ef", flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                  <span style={{ color: "#333", fontWeight: 600 }}>{totalRounds}</span>
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
              <span style={{ fontSize: 25, color: "#888" }}>Overall Status : </span>
              <span style={{ fontSize: 27, color: "#FF3747", fontWeight: 700 }}>Rejected</span>
            </div>
            <div style={{ marginTop: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 style={{ fontWeight: 700, fontSize: "1.7rem", marginBottom: 12 }}>Recruitment Journey</h3>
                <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: "8px 32px", fontWeight: 600, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 18, marginRight: 6 }}>Back</span><span style={{ fontSize: 22 }}>↩</span>
                </button>
              </div>
              <div style={{ marginTop: 28, overflowY: "auto", paddingRight: 4, flexGrow: 1 }} className="scroll-rounds">
                {rounds.length > 0 ? rounds.map((round, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", background: "#f6f7fa", borderRadius: 16, marginBottom: 18, padding: "18px 30px" }}>
                    <div style={{ marginRight: 28 }}>{round.icon}</div>
                    <div style={{ flex: 1, fontSize: "1.07rem", fontWeight: 600 }}>{round.name}</div>
                    <div style={{ fontSize: 14, color: "#888" }}>Status: <span style={{ color: round.statusColor, fontWeight: 600 }}>{round.statusText}</span></div>
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