import React from "react";
import Adminicon from "./assets/Adminicon.png";
import ksrCollegeImage from "./assets/ksrCollegeImage.jpg";
import MyAccountIcon from "./assets/MyAccountIcon.png";
import NotificationIcon from "./assets/NotificationIcon.png";
import PlacemtStatusIcon from "./assets/PlacemtStatusIcon.png";
import SuggestionIcon from "./assets/SuggestionIcon.png";
import teenyicons_certificate_outline from "./assets/teenyicons_certificate-outline.png";
import UpcomingDriveIcon from "./assets/UpcomingDriveIcon.png";
import UploadResumeIcon from "./assets/UploadResumeIcon.png";
import GroupIcon from "./assets/Group.png";

const sidebarItems = [
  { icon: Adminicon, text: "Dashboard", active: true },
  { icon: UploadResumeIcon, text: "Resume" },
  { icon: GroupIcon, text: "Attendance" },
  { icon: teenyicons_certificate_outline, text: "Achievements" },
  { icon: Adminicon, text: "Company" },
  { icon: MyAccountIcon, text: "Profile" },
];

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Inter, Roboto, Arial, sans-serif",
    background: "#fafbfc",
  },
  sidebar: {
    width: 270,
    background: "#fff",
    boxShadow: "2px 0 10px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: 28,
    paddingLeft: 18,
    paddingRight: 18,
    minHeight: "100vh",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 35,
    width: "100%",
    paddingLeft: 7,
  },
  studentTitle: { fontWeight: 700, fontSize: 19, color: "#222", marginBottom: 1 },
  subTitle: { fontWeight: 500, fontSize: 13.6, color: "#999" },
  optionGroup: { marginTop: 5, marginBottom: 16, width: "100%" },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 18px",
    width: "100%",
    cursor: "pointer",
    color: "#333",
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 5,
    borderRadius: 10,
    transition: "all 0.14s ease",
    outline: "none",
  },
  sidebarItemActive: {
    background: "#e8f1fd",
    color: "#1867c0",
    fontWeight: 600,
  },
  logoutBtn: {
    marginTop: "auto",
    marginBottom: 23,
    marginLeft: 14,
    width: 139,
    height: 42,
    background: "#ff6b6b",
    fontWeight: 600,
    color: "#fff",
    border: "none",
    borderRadius: 25,
    outline: "none",
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 2px 10px rgba(255,0,0,0.04)",
    transition: "background .17s",
  },

  main: {
    flex: 1,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
  },

  navBar: {
    background: "#1976d2",
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    color: "#fff",
    fontSize: 23,
    fontWeight: 700,
    letterSpacing: "0.5px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    fontSize: 23,
    fontWeight: 700,
    color: "#fff",
  },

  navMenu: {
    display: "flex",
    alignItems: "center",
    gap: 34,
  },

  navMenuItem: {
    position: "relative",
    padding: "5px 15px",
    fontWeight: 500,
    fontSize: 17,
    color: "#fff",
    background: "none",
    border: "none",
    outline: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background 0.18s",
  },

  collegeRow: {
    display: "flex",
    alignItems: "center",
    gap: 19,
    background: "#fff",
    padding: "24px 32px 0 32px",
    marginBottom: 11,
  },

  // Grid with fixed column widths and row heights adjusted for taller cards
  gridArea: {
    display: "grid",
    gridTemplateColumns: "270px 270px 270px 270px",
    gridTemplateRows: "auto auto auto", // Row 1 & 3 taller (280px), row 2 normal (180px)
    gap: "20px",
    padding: "36px 30px 32px 30px",
    background: "#fafbfc",
    minHeight: "calc(100vh - 240px)",
  },

  /* ------------ Card Styles ----------- */

  // Notification / Announcement - tall card (extra height)
  cardNotif: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "16px 17px 10px 22px",
    gridColumn: "1 / span 1",
    gridRow: "1 / span 1",
    width: 270,
    height: 280, // increased height
  },

  // Upload Resume - tall card (extra height)
  cardResume: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "16px 19px 10px 24px",
    gridColumn: "2 / span 1",
    gridRow: "1 / span 1",
    width: 270,
    height: 280, // increased height
  },

  // Upcoming Drive - tall card (extra height), fixed width 500px as before
  cardDrive: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "16px 16px 11px 23px",
    gridColumn: "3 / span 1",
    gridRow: "1 / span 1",
    width: 560,
    height: 200, // increased height
    maxWidth: 600,
  },

  cardCertificates: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.13)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "34px 32px 15px 35px",
    gridColumn: "1 / span 2",
    gridRow: "2 / span 1",
    width: 560,
    height: 200,
  },

  cardAppStatus: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "35px 22px",
    gridColumn: "3 / span 1",
    gridRow: "2 / span 1",
    width: 270,
    height: 180,
    marginTop: "-70px",
  },

  cardPlacmtStatus: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 18px 20px 18px",
    gridColumn: "4 / span 1",
    gridRow: "2 / span 1",
    width: 270,
    height: 180,
    marginTop: "-70px",
  },

  cardSuggest: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "21px 18px 12px 24px",
    gridColumn: "2 / span 1",
    gridRow: "3 / span 1",
    width: 270,
    height: 200,
  },

  cardMyAccount: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.09)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "22px 18px 14px 24px",
    gridColumn: "1 / span 1",
    gridRow: "3 / span 1",
    width: 270,
    height: 200,
  },

  // Attendance card spans last two columns, tall card with extra height
  cardAttendance: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 9px rgba(80, 139, 255, 0.13)",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "26px 25px",
    gridColumn: "3 / span 2",
    gridRow: "3 / span 1",
    width: 560,
    height: 280, // increased height
    marginTop: "-80px",
  },

  attendanceStatusText: {
    maxWidth: 200,
    marginLeft: 18,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  attendanceRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    width: "100%",
  },

  cardTitle: {
    fontWeight: 700,
    fontSize: 17,
    margin: "7px 0 10px 0",
    letterSpacing: "0.03em",
  },

  cardText: {
    fontSize: 13.3,
    color: "#555",
    marginTop: 4,
    maxWidth: "93%",
    lineHeight: 1.5,
  },

  attendancePercent: {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 5,
    marginTop: 0,
  },

  attendanceDetail: {
    fontSize: 14.5,
    color: "#555",
    marginBottom: 8,
  },
};

function AttendancePieChart({ present, absent }) {
  const total = present + absent;
  const presentPerc = (present / total) * 100;
  const absentPerc = (absent / total) * 100;

  return (
    <svg width="90" height="90" viewBox="0 0 122 122">
      <circle
        cx="61"
        cy="61"
        r="50"
        fill="none"
        stroke="#f95e5c"
        strokeWidth="21"
        strokeDasharray={`${(absentPerc / 100) * 314} 314`}
        strokeDashoffset="0"
      />
      <circle
        cx="61"
        cy="61"
        r="50"
        fill="none"
        stroke="#37c08a"
        strokeWidth="21"
        strokeDasharray={`${(presentPerc / 100) * 314} 314`}
        strokeDashoffset={`-${(absentPerc / 100) * 314}`}
      />
    </svg>
  );
}

function PlacementPortalDashboard() {
  const attendance = { present: 49, absent: 51 };
  const presentPerc = Math.round(
    (attendance.present / (attendance.present + attendance.absent)) * 100
  );
  const absentPerc = 100 - presentPerc;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoRow}>
          <img src={Adminicon} style={{ width: 32, height: 32 }} alt="Admin" />
          <div>
            <div style={styles.studentTitle}>Student</div>
            <div style={styles.subTitle}>Final Year</div>
          </div>
          <div
            style={{ marginLeft: "auto", color: "#aaa", fontSize: 21, cursor: "pointer" }}
          >
            ...
          </div>
        </div>
        <div style={styles.optionGroup}>
          {sidebarItems.map((item, idx) => (
            <div
              key={idx}
              style={
                item.active
                  ? { ...styles.sidebarItem, ...styles.sidebarItemActive }
                  : styles.sidebarItem
              }
              tabIndex={0}
            >
              <img src={item.icon} style={{ width: 22, height: 22 }} alt={item.text} />
              {item.text}
            </div>
          ))}
        </div>
        <button style={styles.logoutBtn}>
          <span style={{ fontSize: 18 }}>↻</span>
          Logout
        </button>
      </aside>

      {/* Main content */}
      <div style={styles.main}>
        {/* Nav Bar */}
        <div style={styles.navBar}>
          <div style={styles.navBrand}>
            <img src={Adminicon} style={{ width: 27 }} alt="Admin icon" />
            <span>Placement Portal</span>
          </div>
          <nav style={styles.navMenu}>
            {["Home", "About", "Features", "Contact"].map((label) => (
              <button key={label} style={styles.navMenuItem}>
                {label} <span style={{ fontSize: 12, marginLeft: 3 }}>▼</span>
              </button>
            ))}
          </nav>
        </div>

        {/* College Row */}
        <div style={styles.collegeRow}>
          <img
            src={ksrCollegeImage}
            alt="KSR College"
            style={{ width: 74, height: 74, borderRadius: "50%" }}
          />
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 26,
                color: "#111",
                letterSpacing: 0,
              }}
            >
              K S R COLLEGE OF ENGINEERING
              <span style={{ color: "#dc3545" }}> (Autonomous)</span> -637215
            </div>
            <div style={{ fontWeight: 500, fontSize: 13.1, color: "#777", marginTop: 2 }}>
              Welcome Back, Student
            </div>
          </div>
        </div>

        {/* Dashboard Grid Area */}
        <div style={styles.gridArea}>
          {/* Notification / Announcement */}
          <div style={styles.cardNotif}>
            <img
              src={NotificationIcon}
              alt="Notification"
              style={{ width: 31, marginBottom: 11 }}
            />
            <div style={styles.cardTitle}>Notification / Announcement</div>
            <div style={styles.cardText}>New Company Reminder: profile not completed</div>
          </div>

          {/* Upload Resume */}
          <div style={styles.cardResume}>
            <img src={UploadResumeIcon} alt="Resume" style={{ width: 33, marginBottom: 10 }} />
            <div style={styles.cardTitle}>Upload Resume</div>
            <div style={styles.cardText}>Showcase your skills with your resume</div>
          </div>

          {/* Upcoming Drive */}
          <div style={styles.cardDrive}>
            <img src={UpcomingDriveIcon} alt="Upcoming Drive" style={{ width: 32, marginBottom: 7 }} />
            <div style={styles.cardTitle}>Upcoming Drive</div>
            <div style={{ ...styles.cardText, fontSize: 12.6, marginTop: 8 }}>
              <strong>Company Name:</strong> Infosys<br />
              <strong>Date:</strong> 20/08/2025<br />
              <strong>Role:</strong> Testing<br />
              <strong>Eligibility:</strong>
            </div>
          </div>

          {/* Upload Certificates */}
          <div style={styles.cardCertificates}>
            <img
              src={teenyicons_certificate_outline}
              alt="Certificates"
              style={{ width: 36, marginBottom: 12 }}
            />
            <div style={{ ...styles.cardTitle, fontSize: 19, marginTop: 6 }}>
              Upload Certificates
            </div>
            <div
              style={{
                ...styles.cardText,
                fontSize: 15,
                marginTop: 4,
                lineHeight: 1.6,
                width: "72%",
              }}
            >
              Let your accomplishments shine with pride. Add more space for multi-line certificate
              details or future enhancements.
            </div>
          </div>

          {/* Application Status */}
          <div style={styles.cardAppStatus}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 13,
                marginTop: 4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 17 }}>Application Status</div>
              <button
                style={{
                  background: "#208bee",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "4px 13px",
                  borderRadius: 7,
                  marginLeft: 5,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13.1,
                }}
              >
                Apply
              </button>
            </div>
            <div style={{ ...styles.cardText, fontSize: 13.5, marginTop: 4 }}>
              List of Jobs Applied
              <br />
              Status: Applied
            </div>
          </div>

          {/* Placement Status */}
          <div style={styles.cardPlacmtStatus}>
            <img
              src={PlacemtStatusIcon}
              alt="Placement"
              style={{ width: 25, marginBottom: 4 }}
            />
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>Placement Status</div>
            <div style={{ marginTop: 13, fontSize: 14 }}>Working Good</div>
          </div>

          {/* Suggestions */}
          <div style={styles.cardSuggest}>
            <img src={SuggestionIcon} alt="Suggestion" style={{ width: 27, marginBottom: 9 }} />
            <div style={{ fontWeight: 700, fontSize: 15.5 }}>Suggestions</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
              Based on your CGPA eligible for TCS <br />
              Add PAN number to complete profile
            </div>
          </div>

          {/* My Account */}
          <div style={styles.cardMyAccount}>
            <img src={MyAccountIcon} alt="My Account" style={{ width: 28, marginBottom: 8 }} />
            <div style={{ fontWeight: 700, fontSize: 15.5 }}>My Account</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Settings</div>
          </div>

          {/* Attendance */}
          <div style={styles.cardAttendance}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>Attendance</div>
            <div style={styles.attendanceRow}>
              <AttendancePieChart present={attendance.present} absent={attendance.absent} />
              <div style={styles.attendanceStatusText}>
                <div style={{ ...styles.attendancePercent, color: "#f95e5c" }}>
                  A {absentPerc}%
                </div>
                <div style={styles.attendanceDetail}>Absent {attendance.absent}</div>
                <div style={{ ...styles.attendancePercent, color: "#37c08a", marginTop: 6 }}>
                  P {presentPerc}%
                </div>
                <div style={styles.attendanceDetail}>Present {attendance.present}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlacementPortalDashboard;
