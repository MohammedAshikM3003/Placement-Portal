import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Paper } from '@mui/material';
import { School, Dashboard, Description, CalendarToday, EmojiEvents, Business, Person, Logout, Info, Star, Mail } from '@mui/icons-material';
import {
  FaTachometerAlt, FaFileAlt, FaUserCheck, FaRegStar, FaBuilding, FaUser, FaBell,
  FaFileUpload, FaCheckCircle, FaCalendarAlt, FaBriefcase, FaEllipsisV, FaSignOutAlt, FaGraduationCap,
  FaTimes, FaThLarge, FaHome, FaInfo, FaStar, FaEnvelope, FaLightbulb
} from "react-icons/fa";
import { PieChart } from "react-minimal-pie-chart";
import ksrCollegeLogo from "./assets/ksrCollegeImage.jpg";
import PlacementPortalIcon from './assets/PlacementPortalicon.png';
import logo from './assets/logo.png';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <FaTachometerAlt size={24} />, active: true },
  { text: 'Resume', icon: <FaFileAlt size={24} />, active: false },
  { text: 'Attendance', icon: <FaCalendarAlt size={24} />, active: false },
  { text: 'Achievements', icon: <FaRegStar size={24} />, active: false },
  { text: 'Company', icon: <FaBriefcase size={24} />, active: false },
];

const Card = ({
  title,
  icon,
  children,
  notificationDot,
  closeX,
  starCorner,
  rightIcon,
  topRight,
  actionButton,
  style = {},
  titleStyle = {},
  ...props
}) => (
  <div
    style={{
      border: "1.5px solid #222",
      borderRadius: 18,
      background: "#fff",
      padding: "22px 22px 18px 22px",
      minHeight: 170,
      position: "relative",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      ...style,
    }}
    {...props}
  >
    {notificationDot && <span style={{ color: "#e53935", fontSize: 20, position: 'absolute', right: 18, top: 16 }}>●</span>}
    {closeX && <FaTimes color="#e53935" size={24} style={{ position: 'absolute', right: 18, top: 14, cursor: 'pointer' }} />}
    {starCorner && <FaRegStar color="#facc15" size={26} style={{ position: 'absolute', right: 18, top: 14 }} />}
    {topRight && <span style={{ position: 'absolute', right: 18, top: 14 }}>{topRight}</span>}
    <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
      {icon && <span style={{ color: "#2563eb", fontSize: 26, marginRight: 10 }}>{icon}</span>}
      <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 18, ...titleStyle, flex: 1 }}>{title}</span>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    {actionButton && (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', marginBottom: 2 }}>
        {actionButton}
      </div>
    )}
  </div>
);

export default function PlacementPortalDashboard({ onLogout, userEmail, onViewChange }) {
  return (
    <div style={{ background: "#f8faff", minHeight: "100vh", fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#2563eb", padding: "0 2.5rem", height: "70px", color: "#fff", boxShadow: '0 2px 8px #e5eaf1',
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <FaGraduationCap size={38} color="#fff" style={{ marginRight: 12 }} />
          <span style={{ fontWeight: 800, fontSize: "2rem", letterSpacing: 1 }}>Placement Portal</span>
        </div>
        <ul style={{ display: "flex", gap: "2.5rem", listStyle: "none", margin: 0, fontSize: 19, fontWeight: 600 }}>
          <li style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
            <FaHome /> Home
          </li>
          <li style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
            <FaInfo /> About
          </li>
          <li style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
            <FaStar /> Features
          </li>
          <li style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
            <FaEnvelope /> Contact
          </li>
        </ul>
      </nav>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside style={{
          width: 270,
          background: "#fff",
          height: "calc(100vh - 70px)",
          display: "flex",
          flexDirection: "column",
          borderRight: "1.5px solid #e5e7eb",
          fontFamily: 'Inter, Arial, sans-serif',
          position: "fixed",
          left: 0,
          top: 70,
          overflow: "hidden"
        }}>
          {/* Top Section - Fixed */}
          <div style={{ 
            padding: "38px 0 0 0", 
            flexShrink: 0,
            background: "#fff",
            zIndex: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", paddingLeft: 32 }}>
              <FaGraduationCap size={38} color="#2563eb" style={{ marginRight: 18 }} />
              <div>
                <span style={{ fontWeight: 800, color: "#222", fontSize: 21 }}>Student</span><br />
                <span style={{ color: "#bdbdbd", fontSize: 16, fontWeight: 500 }}>Final Year</span>
              </div>
            </div>
          </div>

          {/* Scrollable Menu Section */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "38px 0 0 0",
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 #f1f5f9"
          }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {menuItems.map(item => (
                <li 
                  key={item.text} 
                  onClick={() => {
                    console.log("Dashboard sidebar item clicked:", item.text);
                    if (item.text === 'Resume') {
                      console.log("Navigating to resume from dashboard sidebar");
                      onViewChange("resume");
                    } else if (item.text === 'Dashboard') {
                      console.log("Already on dashboard");
                    }
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 22,
                    padding: "20px 28px 20px 32px",
                    borderRadius: 16,
                    marginBottom: 8,
                    cursor: "pointer",
                    color: item.active ? "#2563eb" : "#222",
                    fontWeight: item.active ? 800 : 500,
                    background: item.active ? "#eaf2ff" : "transparent",
                    position: "relative",
                    fontSize: 20,
                  }}
                >
                  {item.active && (
                    <div style={{
                      position: "absolute",
                      left: 0, top: 10, bottom: 10, width: 10,
                      borderRadius: 8,
                      background: "#2563eb"
                    }} />
                  )}
                  <span style={{ color: item.active ? "#2563eb" : "#222", fontSize: 28 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Section - Fixed */}
          <div style={{ 
            paddingBottom: 38, 
            paddingTop: 20, 
            flexShrink: 0,
            background: "#fff",
            borderTop: "1.5px solid #e5e7eb",
            zIndex: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, padding: "16px 28px 16px 32px" }}>
              <FaUser size={22} color="#222" />
              <span style={{ fontSize: 20, color: "#222", fontWeight: 600 }}>Profile</span>
            </div>
            <button
              onClick={onLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "#e57373",
                color: "#fff",
                border: "none",
                padding: "18px 0",
                borderRadius: 28,
                width: "85%",
                fontWeight: 800,
                fontSize: 22,
                cursor: "pointer",
                boxShadow: "0 2px 8px #f1f5f9",
                marginLeft: "auto",
                marginRight: "auto",
                justifyContent: "center",
                letterSpacing: 0.5,
              }}
            >
              <FaSignOutAlt size={24} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Dashboard */}
        <main style={{ 
          marginLeft: 270, 
          marginTop: 70,
          padding: "2.5rem", 
          background: "#f8faff",
          minHeight: "calc(100vh - 70px)",
          width: "calc(100vw - 270px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
            <img
              src={ksrCollegeLogo}
              alt="College Logo"
              style={{ width: 70, borderRadius: "50%", border: "2px solid #e0e0e0", background: "#fff", marginRight: 18 }}
            />
            <span style={{ fontWeight: 900, fontSize: "2.1rem", color: '#111' }}>
              K S R COLLEGE OF ENGINEERING (<span style={{ color: "#e53935" }}>Autonomous</span>) – 637215
            </span>
          </div>

          <h2 style={{ fontWeight: 800, fontSize: "1.7rem", margin: "2.2rem 0 1.5rem", color: '#111' }}>
            Welcome Back, {userEmail ? userEmail.split('@')[0] : 'Student'}
          </h2>

          {/* Cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "2rem",
            width: "100%",
            maxWidth: "100%",
            padding: "1rem 0"
          }}>
            <Card title="Attendance" icon={<FaUserCheck size={22} />} style={{ minHeight: 400, maxWidth: 500, gridRow: "1 / 3" }}>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 10 }}>Attendance</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ position: 'relative', width: 200, height: 200 }}>
                  <PieChart
                    data={[
                      { title: "Present", value: 65, color: "#4caf50" },
                      { title: "Absent", value: 35, color: "#e57373" }
                    ]}
                    totalValue={100}
                    lineWidth={32}
                    label={() => ''}
                    style={{ height: 200, width: 200 }}
                    startAngle={-90}
                  />
                  <span style={{ position: 'absolute', left: -60, top: 80, background: '#fff', borderRadius: 8, padding: '5px 10px', color: '#e57373', fontWeight: 900, fontSize: 14 }}>A 35%</span>
                  <span style={{ position: 'absolute', right: -60, top: 80, background: '#fff', borderRadius: 8, padding: '5px 10px', color: '#4caf50', fontWeight: 900, fontSize: 14 }}>P 65%</span>
                </div>
                <div style={{ color: '#bbb', fontWeight: 900, fontSize: 18, marginTop: 15, textAlign: 'center' }}>280 Days</div>
              </div>
            </Card>
            <Card title="Notification/Announcement" icon={<FaBell size={22} />} notificationDot={false} style={{ minHeight: 200, maxWidth: 400 }}>
              <div>New company<br />Reminder profile not completed</div>
            </Card>
            <Card title="Resume Status" icon={<FaFileAlt size={22} />}
              rightIcon={<span style={{ color: "#2563eb", fontSize: 20, fontWeight: 700 }}>&#8963;</span>}
              actionButton={<button 
                onClick={() => {
                  console.log("Resume button clicked");
                  onViewChange("resume");
                }}
                style={{ background: "#2563eb", color: "#fff", borderRadius: 16, padding: "6px 28px", fontWeight: 600, cursor: "pointer" }}
              >Resume</button>} style={{ minHeight: 200, maxWidth: 400 }}>
              <div>Upload Resume</div>
            </Card>
            <Card title="Achievements" icon={<FaRegStar size={22} />} actionButton={<button style={{ background: "#2563eb", color: "#fff", borderRadius: 16, padding: "6px 28px", fontWeight: 600 }}>Upload</button>} style={{ minHeight: 200, maxWidth: 400, gridRow: "3", gridColumn: "1" }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Upload Certificates</div>
            </Card>
            <Card title="Suggestions" icon={<FaLightbulb size={22} color="#2563eb" />} style={{ minHeight: 200, maxWidth: 400 }}>
              <div>Based on your CGPA eligible for TCS<br />Add PAN number to complete profile</div>
            </Card>
            <Card title="Upcoming Drive" icon={<FaBuilding size={22} />} actionButton={<button style={{ background: "#2563eb", color: "#fff", borderRadius: 16, padding: "6px 28px", fontWeight: 600 }}>Apply</button>} style={{ minHeight: 200, maxWidth: 400 }}>
              <div><b>Company Name :</b> Infosys<br /><b>Date :</b> 20-08-2025<br /><b>Role :</b> Testing</div>
            </Card>
            <Card title="Placement Status" icon={<FaCheckCircle size={22} color="#2563eb" />} style={{ minHeight: 200, maxWidth: 400, gridRow: "3", gridColumn: "3" }}>
              <div>Working Good</div>
            </Card>
            <Card title="Application Status" icon={<FaFileAlt size={22} />} topRight={null} style={{ minHeight: 200, maxWidth: 400, gridRow: "3", gridColumn: "2" }}>
              <div>List of Jobs applied<br />Status : Applied</div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
