import React from "react";
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle } from "react-icons/fa";
import './AlertStyles.css';

// Consolidated Placement Status Popup Component
const PlacementStatusPopup = ({ app, onBack, status = "pending" }) => {
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'placed':
        return {
          color: "#61D357",
          text: "Placed",
          rounds: [
            { name: "Round 1 (Aptitude)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
            { name: "Round 2 (Technical)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
            { name: "Round 3 (Group Discussion)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
            { name: "Round 4 (Managerial)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
            { name: "Round 5 (HR)", status: "Passed", icon: <FaCheckCircle color="#61D357" size={28} />, statusColor: "#61D357", statusText: "Passed" }
          ]
        };
      case 'rejected':
        return {
          color: "#FF3747",
          text: "Rejected",
          rounds: [
            { name: "Round 1 (Aptitude)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
            { name: "Round 2 (Technical)", status: "Rejected", icon: <FaTimesCircle color="#E62727" size={28} />, statusColor: "#E62727", statusText: "Rejected" },
            { name: "Round 3 (Group Discussion)", status: "N/A", icon: <FaExclamationCircle color="#949494" size={28} />, statusColor: "#717070", statusText: "N/A" },
            { name: "Round 4 (Managerial)", status: "N/A", icon: <FaExclamationCircle color="#949494" size={28} />, statusColor: "#717070", statusText: "N/A" },
            { name: "Round 5 (HR)", status: "N/A", icon: <FaExclamationCircle color="#949494" size={28} />, statusColor: "#717070", statusText: "N/A" }
          ]
        };
      default: // pending
        return {
          color: "#717070",
          text: "Pending",
          rounds: [
            { name: "Round 1 (Aptitude)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
            { name: "Round 2 (Technical)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
            { name: "Round 3 (Group Discussion)", status: "N/A", icon: <FaExclamationCircle color="#949494" size={28} />, statusColor: "#717070", statusText: "Pending" },
            { name: "Round 4 (Managerial)", status: "N/A", icon: <FaExclamationCircle color="#949494" size={28} />, statusColor: "#717070", statusText: "N/A" },
            { name: "Round 5 (HR)", status: "N/A", icon: <FaExclamationCircle color="#949494" size={28} />, statusColor: "#717070", statusText: "N/A" }
          ]
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="alert-overlay">
      <div className="placement-status-container">
        <h2 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: 20, marginLeft: 5, flexShrink: 0 }}>
          {app ? `${app.company}'s Placement` : "Company's Placement"}
        </h2>
        <div style={{ background: "#fff", padding: "36px", borderRadius: 16, boxShadow: "0 4px 24px #e9e6ef", flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div>
            <span style={{ fontSize: 25, color: "#888" }}>Overall Status : </span>
            <span style={{ fontSize: 27, color: config.color, fontWeight: 700 }}>{config.text}</span>
          </div>
          <div style={{ marginTop: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{ fontWeight: 700, fontSize: "1.7rem", marginBottom: 12 }}>Recruitment Journey</h3>
              <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: "8px 32px", fontWeight: 600, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 18, marginRight: 6 }}>Back</span><span style={{ fontSize: 22 }}>↩</span>
              </button>
            </div>
            <div style={{ marginTop: 28, overflowY: "auto", paddingRight: 4, flexGrow: 1 }} className="scroll-rounds">
              {config.rounds.map((round) => (
                <div key={round.name} style={{ display: "flex", alignItems: "center", background: "#f6f7fa", borderRadius: 16, marginBottom: 18, padding: "18px 30px" }}>
                  <div style={{ marginRight: 28 }}>{round.icon}</div>
                  <div style={{ flex: 1, fontSize: "1.07rem", fontWeight: 600 }}>{round.name}</div>
                  <div style={{ fontSize: 14, color: "#888" }}>Status: <span style={{ color: round.statusColor, fontWeight: 600 }}>{round.statusText}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementStatusPopup;
