import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlacementPortalicon from './assets/PlacementPortalicon.png';
import Sidebarcoordinator from './assets/Sidebarcoordinator.png';
import DashboardSideBaricon from './assets/DashboardSideBarIcon.png';
import ManageStudenticon from './assets/Managestudenticon.png';
import Companyprofileicon from './assets/Compnyprofileicon.png';
import CompanySideBarIcon from './assets/CompanySideBarIcon.png';
import Certificateverificationicon from './assets/Certificateverificationicon.png';
import Eligiblestudenticon from './assets/Eligiblestudenticon.png';
import AttendanceSideBarIcon from './assets/AttendanceSideBarIcon.png';
import PlacedStudentIcon from './assets/PlacedStudentIcon.png';
import Reportanalysisicon from './assets/Reportanalysisicon.png';
import Profileicon from './assets/Profileicon.png';
import Logouticon from './assets/Logouticon.png';
import Backbtnvector from './assets/Backbtnvector.png';
import StudentPopup from './assets/StudentPopup.png';
import Navbaricon from './assets/Navbaricon.png';

// Dummy student data for demonstration
const studentData = [
  { id: 1, name: 'Student-1', registerNo: '73151929345', batch: '2023-2027', section: 'A', cgpa: '9.1', skills: 'Python', status: 'Unplaced' },
  { id: 2, name: 'Student-2', registerNo: '73153498762', batch: '2022-2026', section: 'B', cgpa: '8.5', skills: 'Java', status: 'Unplaced' },
  { id: 3, name: 'Student-3', registerNo: '73153456789', batch: '2023-2027', section: 'A', cgpa: '8.1', skills: 'Java', status: 'Placed' },
  { id: 4, name: 'Student-4', registerNo: '73159876543', batch: '2022-2026', section: 'B', cgpa: '9.0', skills: 'Javascript', status: 'Placed' },
  { id: 5, name: 'Student-5', registerNo: '73152313132', batch: '2023-2027', section: 'A', cgpa: '7.9', skills: 'Data Analysis', status: 'Placed' },
  { id: 6, name: 'Student-6', registerNo: '73152378906', batch: '2024-2028', section: 'C', cgpa: '6.8', skills: 'Python', status: 'Unplaced' },
  { id: 7, name: 'Student-7', registerNo: '73152345678', batch: '2024-2028', section: 'A', cgpa: '8.6', skills: 'Frontend', status: 'Placed' },
  { id: 8, name: 'Student-8', registerNo: '73152316545', batch: '2022-2028', section: 'A', cgpa: '8.1', skills: 'Blockchain', status: 'Unplaced' },
  { id: 9, name: 'Student-9', registerNo: '73152316783', batch: '2025-2029', section: 'A', cgpa: '7.2',skills: 'Java', status: 'Unplaced' },
  { id: 10, name: 'Student-10', registerNo: '73152318908', batch: '2023-2027', section: 'B', cgpa: '6.9', skills: 'Python', status: 'Unplaced' }
];

const styles = {
  container: { fontFamily: "'Poppins', sans-serif", display: "flex", height: "100vh", background: "#f9f9f9" },
  sidebar: { width: "290px", height: "500px", background: "white", color: "black", display: "flex", flexDirection: "column", padding: "0", justifyContent: "space-between", minHeight: "100vh" },
  sidebarHeader: { fontWeight: "bold", fontSize: "22px", display: "flex", alignItems: "center", padding: "95px 10px 1px 10px", gap: 12 },
  sidebarMenu: { flex: 1, marginTop: "28px", background: "white" },
  sidebarItem: { display: "flex", alignItems: "center", padding: "13px 30px", fontSize: "17px", color: "black", cursor: "pointer", textDecoration: "none", transition: ".2s", borderLeft: "4px solid transparent", gap: 14 },
  sidebarItemActive: { background: "#fff2f2", color: "#f44344", borderLeft: "4px solid #f44344", fontWeight: "bold" },
  logout: { margin: "20px 70px", background: "#f44344", color: "white", border: "none", borderRadius: "22px", fontWeight: "bold", fontSize: "17px", padding: "11px 0", cursor: "pointer", boxShadow: "0 4px 12px #0001", transition: "box-shadow .2s" },
  main: { flex: 1, padding: "0", minWidth: "0", background: "#f9f9f9" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f44344", color: "#fff", height: "72px", padding: "0px 100px", fontSize: "25px", fontWeight: "bold", letterSpacing: "1px", position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, boxShadow: "0 2px 10px #0001" },
  navbarLinks: { display: "flex", gap: "30px", alignItems: "center", fontSize: "17px", fontWeight: "normal" },
  backBttn: { alignSelf: "flex-end", padding: "10px 30px", background: "red", color: "#fff", border: "none", fontWeight: "bold", borderRadius: "25px", fontSize: "18px", boxShadow: "1px 2px 8px #0001", cursor: "pointer", display: "flex", alignItems: "center", marginRight: "40px", marginLeft: "auto", marginTop: "100px", marginBottom: "10px", transition: ".2s", gap: 7 },
  profileHeader: { display: "flex", alignItems: "center", gap: 300, marginTop: -60, marginLeft: 300, marginBottom: 100 },
  avatarCircleImg: { width: "150px", height: "150px", borderRadius: "50%", background: "#ffe1e1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "80px", color: "#2270df", border: "3px solid #f44344", position: "absolute", left: 350, textAlign: "center" },
  avatarText: { fontSize: "11px", color: "#f44344", position: "absolute", bottom: "25px", left: "50%", transform: "translateX(-50%)", fontWeight: "500" },
  studentDetails: { display: "flex", flexDirection: "column", gap: "3px" },
  studentName: { fontWeight: 700, fontSize: 27, color: "#212325", marginRight: "100", marginLeft: "50", marginTop: "40", marginBottom: 10 },
  studentReg: { fontSize: 17, color: "#888a", marginTop: -10, fontWeight: "400", letterSpacing: 1 },
  studentCGPA: { fontSize: 20, fontWeight: "300", color: "#666", letterSpacing: 1, marginBottom: 2 },
  studentCGPAValue: { color: "#f44344", fontWeight: "700" },
  placementStatus: { fontSize: 17, fontWeight: "600", color: "#017728", padding: "6px 10px", borderRadius: "31px", background: "#d3ffe1", display: "inline-block", marginTop: "10px", width: "200" },
  detailsWrapper: { display: "flex", gap: "32px", marginTop: "-90px", marginLeft: 60, justifyContent: "space-between", flexWrap: "wrap" },
  detailsCol: { flex: 1, minWidth: "320px", display: "flex", flexDirection: "column", gap: "13px" },
  detailsSectionTitle: { fontWeight: 600, fontSize: 27, color: "#ee3a43", marginBottom: "15px", marginTop: "15px" },
  fieldRow: { display: "flex", alignItems: "center", gap: "8px", marginLeft: 3 },
  fieldLabel: { fontWeight: "600", fontSize: "17px", width: "138px", color: "#222c" },
  fieldInput: { flex: "0 0 300px", background: "#fff", border: "1.8px solid #eef0f6", boxSizing: "border-box", borderRadius: "10px", padding: "10px 15px", fontSize: "16px", color: "#1f2022", fontWeight: "500", outline: "none", marginBottom: "0", pointerEvents: "none" },
  fieldInputOnline: { flex: "0 0 300px", background: "#fff", border: "1.8px solid #e5e7ec", boxSizing: "border-box", borderRadius: "10px", padding: "7px 15px", fontSize: "16px", color: "#2868b7", fontWeight: "50", outline: "none", marginBottom: "0", pointerEvents: "none" },
  resumeActions: { display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" },
  resumeBtn: { padding: "10px 20px", border: "none", borderRadius: "30px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", transition: ".2s", marginLeft: "90", marginRight: 30, marginTop: -90 },
  resumePreview: { background: "#4b41ff", color: "#fff", marginLeft: 150 },
  resumeDownload: { background: "#1ec55b", color: "#fff", alignItems: "center" },
};

function mergeStyles(...args) {
  return Object.assign({}, ...args);
}

const Field = ({ label, value, type = "text", inputStyle }) => (
  <div style={styles.fieldRow}>
    <div style={styles.fieldLabel}>{label}</div>
    <input
      style={inputStyle || styles.fieldInput}
      value={value}
      type={type}
      readOnly
      disabled
      tabIndex={-1}
    />
  </div>
);

const ResumeActions = () => (
  <div style={styles.resumeActions}>
    <button style={{ ...styles.resumeBtn, ...styles.resumePreview }}>Preview</button>
    <button style={{ ...styles.resumeBtn, ...styles.resumeDownload }}>Download</button>
  </div>
);

const ProfileDetails = ({ student }) => (
  <div style={styles.detailsWrapper}>
    <div style={styles.detailsCol}>
      <div style={styles.detailsSectionTitle}>Personal & Academic Details</div>
      <Field label="Department" value="Computer Science and Engineering" />
      <Field label="Section" value={student.section} />
      <Field label="Batch" value={student.batch} />
      <Field label="CGPA" value={student.cgpa} />
      <Field label="Domain mail ID" value="Student1csse2427@skrce.ac.in" />
      <Field label="Personal Email ID" value="Sstudentstu07@gmail.com" />
      <Field label="Contact" value="9361204205" />
    </div>
    <div style={styles.detailsCol}>
      <div style={styles.detailsSectionTitle}>Skills & Professional Details</div>
      <Field label="Skills" value={student.skills} />
      <Field label="Domain" value="Gen AI" />
      <div style={{ ...styles.detailsSectionTitle, fontSize: 27, marginTop: 28, marginBottom: 10 }}>Online Profile</div>
      <Field label="Portfolio" value="link" inputStyle={styles.fieldInputOnline} />
      <Field label="Linked In" value="link" inputStyle={styles.fieldInputOnline} />
      <div style={{ ...styles.detailsSectionTitle, fontSize: 27, marginTop: 26, marginBottom: 9, color: "#ee3a43" }}>Resume :</div>
      <ResumeActions />
    </div>
  </div>
);

const ProfileHeader = ({ student }) => (
  <div style={styles.profileHeader}>
    <div style={styles.avatarCircleImg}>
      <img src={StudentPopup} alt="student Photo" style={{ width: 70, marginRight: 1, marginBottom: 20, verticalAlign: "middle" }} />
      <div style={styles.avatarText}>Student Photo</div>
    </div>
    <div style={styles.studentDetails}>
      <div style={styles.studentName}>{student.name}</div>
      <div style={styles.studentReg}>Register number : {student.registerNo}</div>
      <div style={styles.studentCGPA}>
        CGPA : <span style={styles.studentCGPAValue}>{student.cgpa}</span>
      </div>
      <div style={styles.placementStatus}>Placement Status : {student.status}</div>
    </div>
  </div>
);

const Sidebar = () => (
  <aside style={styles.sidebar}>
    <div>
      <div style={styles.sidebarHeader}>
        <span>
          <i className="fas fa-graduation-cap" style={{ fontSize: 30, marginRight: 12 }} />
        </span>
        <img src={Sidebarcoordinator} alt="Coordinator Icon" style={{ width: 29, height: 25 }} />
        <span>Coordinator</span>
      </div>
      <div style={styles.sidebarMenu}>
        <div style={styles.sidebarItem}><img src={DashboardSideBaricon} alt="Dashboard" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-columns" />Dashboard</div>
        <div style={styles.sidebarItem}>
        <img src={ManageStudenticon} alt="Manage Students" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-user-cog" />Manage Students</div>
        <div style={styles.sidebarItem}>
        <img src={Companyprofileicon} alt="Company Profile" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-building" />Company Profile</div>
        <div style={styles.sidebarItem}>
        <img src={CompanySideBarIcon} alt="Company Drive" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-bus-alt" />Company Drive</div>
        <div style={styles.sidebarItem}>
        <img src={Certificateverificationicon} alt="Certificate Verification" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-certificate" />Certificate Verification</div>
        <div style={mergeStyles(styles.sidebarItem, styles.sidebarItemActive)}>
        <img src={Eligiblestudenticon} alt="Eligible Students" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-users" />Eligible Students</div>
        <div style={styles.sidebarItem}>
        <img src={AttendanceSideBarIcon} alt="Attendance" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-calendar-alt" />Attendance</div>
        <div style={styles.sidebarItem}>
        <img src={PlacedStudentIcon} alt="Placed Students" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-user-check" />Placed Students</div>
        <div style={styles.sidebarItem}>
        <img src={Reportanalysisicon} alt="Report Analysis" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-chart-bar" />Report Analysis</div>
        <div style={styles.sidebarItem}>
        <img src={Profileicon} alt="Profile" style={{ width: 22, marginRight: 10, verticalAlign: "middle" }} />
        <i className="fas fa-user" />Profile</div>
      </div>
    </div>
    <button style={styles.logout}>
      <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />Logout</button>
  </aside>
);

const Navbar = () => (
  <div style={styles.navbar}>
    <img
      src={PlacementPortalicon}
      alt="Portal Logo"
      style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)" }}
    />
    <span>Placement Portal</span>
    <div style={styles.navbarLinks}>
      <span>Home</span>
      <span>About</span>
      <span>Features</span>
      <span>Contact</span>
    </div>
  </div>
);

export default function CoEligibleStudentsPopUp() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch student data here
    const foundStudent = studentData.find(s => s.id.toString() === studentId);
    setStudent(foundStudent);
  }, [studentId]);

  if (!student) {
    return <div>Loading...</div>; // Or a not-found page
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <Navbar />
        <div style={{ padding: "20px" }}>
          <button style={styles.backBttn} onClick={() => navigate(-1)}>
            <img src={Backbtnvector} alt="Back" style={{ width: 20, height: 20, verticalAlign: "middle" }} /> Back
          </button>
          <ProfileHeader student={student} />
          <ProfileDetails student={student} />
        </div>
      </main>
    </div>
  );
}