import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import scrollStyles from './PopupScrollbar.module.css';

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
  
  return app.rounds.map((round, index) => ({
    name: round.name,
    status: round.status,
    icon: <FaCheckCircle color={index === app.rounds.length - 1 ? "#61D357" : "#197AFF"} size={28} />,
    statusColor: index === app.rounds.length - 1 ? "#61D357" : "#197AFF",
    statusText: round.status || "Passed"
  }));
};

export default function PopUpPlaced({ app, onBack }) {
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
              <span style={{ fontSize: 27, color: "#61D357", fontWeight: 700 }}>Placed</span>
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