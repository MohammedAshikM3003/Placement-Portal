import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, TextField, Paper, Chip } from '@mui/material';
import { School, Dashboard, Description, CalendarToday, EmojiEvents, Business, Person, Logout, Upload, Preview, Download, Menu, MoreVert, KeyboardArrowDown, Info, Star, Mail } from '@mui/icons-material';
import { FaLinkedin, FaGithub, FaTachometerAlt, FaFileAlt, FaCalendarAlt, FaRegStar, FaBriefcase, FaGraduationCap, FaUser, FaSignOutAlt, FaHome, FaInfo, FaStar, FaEnvelope } from 'react-icons/fa';
import PlacementPortalIcon from './assets/PlacementPortalicon.png';
import logo from './assets/logo.png';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <FaTachometerAlt size={24} />, active: false },
  { text: 'Resume', icon: <FaFileAlt size={24} />, active: true },
  { text: 'Attendance', icon: <FaCalendarAlt size={24} />, active: false },
  { text: 'Achievements', icon: <FaRegStar size={24} />, active: false },
  { text: 'Company', icon: <FaBriefcase size={24} />, active: false },
];

function Sidebar({ onLogout, onViewChange }) {
  return (
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

      {/* Static Menu Section */}
      <div style={{ 
        flex: 1, 
        padding: "38px 0 0 0"
      }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {menuItems.map(item => (
            <li 
              key={item.text} 
              onClick={() => {
                console.log("Sidebar item clicked:", item.text);
                if (item.text === 'Dashboard') {
                  console.log("Navigating to dashboard");
                  onViewChange("dashboard");
                } else if (item.text === 'Resume') {
                  console.log("Navigating to resume");
                  onViewChange("resume");
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
  );
}

function Navbar({ onViewChange }) {
  return (
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
  );
}

function ResumeChecklist() {
  return (
    <Paper elevation={2} sx={{ 
      p: 3, 
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      height: 'calc(100vh - 400px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      width: 300
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="18px">
        Resume Checklist
      </Typography>
      <Box component="ol" sx={{ 
        pl: 2.5, 
        m: 0, 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        overflow: 'hidden'
      }}>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
          Use college mail id
        </Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
          Keep it within in 1 page
        </Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
          Mention CGPA and School
        </Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
          boards percentage
        </Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
          Include Skills and Projects
        </Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
          Add GitHub and LinkedIn Profile
        </Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
          Don't Include any Pictures
        </Typography>
      </Box>
    </Paper>
  );
}

function ResumeScore() {
  return (
    <Paper elevation={2} sx={{ 
      p: 3, 
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="18px">
        Resume Score
      </Typography>
      <Typography fontSize={14} color="#333" mb={1} fontWeight={500}>
        Resume Strength (Marks)
      </Typography>
      <Typography fontSize={14} color="#666" sx={{ lineHeight: 1.4 }}>
        Suggestions : #for eg add GitHub id
      </Typography>
    </Paper>
  );
}

function MainContent() {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploadedFile, setUploadedFile] = React.useState(null);
  const [uploadDate, setUploadDate] = React.useState(null);
  const [uploadError, setUploadError] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setUploadError('');

    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload only PDF or DOC/DOCX files');
      return;
    }

    // Check file size (1MB = 1024 * 1024 bytes)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 1MB');
      return;
    }

    // File is valid - just select it, don't upload yet
    setSelectedFile(file);
    
    // Clear the file input to allow re-uploading the same file
    event.target.value = '';
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    // Delete old file if exists
    if (uploadedFile) {
      console.log('Deleting old file:', uploadedFile.name);
      // In a real application, you would make an API call to delete the old file from server
    }

    // Upload the selected file
    setUploadedFile(selectedFile);
    setUploadDate(new Date().toLocaleDateString());
    setSelectedFile(null); // Clear selected file after upload
    setShowSuccess(true); // Show success message
    
    // Hide success message after a short delay
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000); // Hide after 2 seconds
  };

  const handlePreview = () => {
    if (!uploadedFile) {
      setUploadError('No file uploaded to preview');
      return;
    }
    
    // Create a URL for the file and open it in a new tab
    const fileUrl = URL.createObjectURL(uploadedFile);
    window.open(fileUrl, '_blank');
  };

  const handleDownload = () => {
    if (!uploadedFile) {
      setUploadError('No file uploaded to download');
      return;
    }
    
    // Create a download link and trigger download
    const fileUrl = URL.createObjectURL(uploadedFile);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = uploadedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };



  return (
    <Box sx={{ flexGrow: 1, background: "#f8fafd", minHeight: "100vh", ml: '280px', fontFamily: 'Inter, Arial, sans-serif' }}>
      <Toolbar />
      
      <Box sx={{ p: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" justifyContent="flex-start" sx={{ width: '100%', pl: 2 }}>
          {/* Left Column - Profile Only */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 300, mt: '10px', mr: '20px' }}>
            {/* Student Info Card */}
            <Paper elevation={3} sx={{ 
              width: 350, 
              height: '658px',
              p: 3, 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "flex-start",
              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
              color: '#fff',
              borderRadius: '16px',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)'
            }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: '100px' }}>
                <img src={PlacementPortalIcon.default || PlacementPortalIcon} alt="Placement Portal" style={{ width: 130, height: 130, marginBottom: 20, marginLeft: '-3px', filter: 'brightness(0) invert(1)' }} />
                                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', mb: 3, alignItems: 'center', mt: '20px', ml: '4px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2, mt: '3px' }}>
                      <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                        Name
                      </Typography>
                      <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                        :
                      </Typography>
                      <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                        Student
                      </Typography>
                    </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                      Reg No
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                      7315XXXXXXX
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                      Dept
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                      B.E CSE
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                      Year
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                      4th
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                      Sem
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                      7
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                      CGPA
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                      8.7
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                      Phone
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                      96291XXXXX
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '60px', fontWeight: 'bold' }}>
                      DOB
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" textAlign="left" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
                      16-05-2006
                    </Typography>
                  </Box>
                </Box>
              </Box>
                             <Button 
                 variant="contained" 
                 sx={{ 
                   backgroundColor: '#fff',
                   color: '#1976d2',
                   fontWeight: 600,
                   px: 3,
                   py: 1,
                   borderRadius: '12px',
                   fontSize: '14px',
                   textTransform: 'none',
                   boxShadow: '0 3px 10px rgba(255,255,255,0.3)',
                   mt: '20px',
                   '&:hover': {
                     backgroundColor: '#f8f9fa',
                     boxShadow: '0 4px 12px rgba(255,255,255,0.4)'
                   }
                 }}
               >
                 View Profile
               </Button>
            </Paper>
          </Box>
          
          {/* Right Column - Upload Section, Resume Checklist, and Resume Score */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 930, ml: 'auto', mt: '10px', mr: '20px' }}>
            {/* Resume Upload Section */}
            <Paper elevation={3} sx={{ 
              width: 'calc(100% - 50px)',
              height: '330px',
              p: 3, 
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
                              <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="26px" align="center">
                  Upload Your Resume
                </Typography>
              
              <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ flex: 1, justifyContent: 'space-evenly' }}>
                                                                     <Button 
                     variant="outlined" 
                     component="label" 
                     startIcon={<Upload />}
                     sx={{ 
                       borderColor: '#9e9e9e',
                       color: '#9e9e9e',
                       px: 4,
                       py: 2,
                       borderRadius: '12px',
                       fontWeight: 600,
                       fontSize: '16px',
                       textTransform: 'none',
                       borderWidth: '2px',
                       '&:hover': {
                         borderColor: '#757575',
                         backgroundColor: '#f8f9fa',
                         borderWidth: '2px'
                       }
                     }}
                   >
                     {selectedFile ? selectedFile.name : 'Upload (Max 1 MB)'}
                     <input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
                   </Button>
                
                <Box sx={{ textAlign: 'center', color: '#9e9e9e' }}>
                  <Typography fontSize={19} mb={0.5} sx={{ lineHeight: 1.4 }}>
                    *Only PDF and DOC/DOCX files allowed
                  </Typography>
                  {uploadError && (
                    <Typography fontSize={16} mb={0.5} sx={{ lineHeight: 1.4, color: '#d32f2f' }}>
                      {uploadError}
                    </Typography>
                  )}
                  {selectedFile && (
                    <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#1976d2' }}>
                      Selected: {selectedFile.name}
                    </Typography>
                  )}
                  {uploadedFile && !selectedFile && (
                    <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#1976d2' }}>
                      Last uploaded: {uploadedFile.name}
                    </Typography>
                  )}
                  {showSuccess ? (
                    <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#4caf50' }}>
                      ✓ Resume uploaded successfully
                    </Typography>
                  ) : (
                    <Typography fontSize={19} sx={{ lineHeight: 1.4 }}>
                      *Select a file and click Upload
                    </Typography>
                  )}
                  {uploadDate && (
                    <Typography fontSize={16} sx={{ lineHeight: 1.4, color: '#1976d2' }}>
                      Last uploaded on: {uploadDate}
                    </Typography>
                  )}
                </Box>
                
                <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent="center">
                                     <Button 
                     variant="contained" 
                     size="small"
                     startIcon={<Preview />} 
                     onClick={handlePreview}
                     sx={{ 
                       backgroundColor: '#6c49e0',
                       borderRadius: '8px',
                       fontWeight: 600,
                       fontSize: '14px',
                       textTransform: 'none',
                       px: 3,
                       py: 1,
                       boxShadow: '0 4px 12px rgba(108, 73, 224, 0.3)',
                       '&:hover': { 
                         backgroundColor: '#5a35d1',
                         boxShadow: '0 6px 16px rgba(108, 73, 224, 0.4)'
                       }
                     }}
                   >
                     Preview
                   </Button>
                                     <Button 
                     variant="outlined" 
                     size="small"
                     onClick={handleFileUpload}
                     sx={{ 
                       borderColor: '#1976d2',
                       color: '#1976d2',
                       borderRadius: '8px',
                       fontWeight: 600,
                       fontSize: '14px',
                       textTransform: 'none',
                       px: 3,
                       py: 1,
                       '&:hover': {
                         borderColor: '#1565c0',
                         backgroundColor: '#f5f5f5'
                       }
                     }}
                   >
                     Upload
                   </Button>

                                     <Button 
                     variant="contained" 
                     size="small"
                     startIcon={<Download />}
                     onClick={handleDownload}
                     sx={{ 
                       backgroundColor: '#4caf50',
                       borderRadius: '8px',
                       fontWeight: 600,
                       fontSize: '14px',
                       textTransform: 'none',
                       px: 3,
                       py: 1,
                       boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                       '&:hover': { 
                         backgroundColor: '#388e3c',
                         boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)'
                       }
                     }}
                   >
                     Download
                   </Button>
                </Box>
              </Box>
            </Paper>
            
            {/* Resume Checklist and Resume Score - Side by Side under Upload Section */}
            <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: '10px' }}>
              {/* Resume Checklist */}
              <Paper elevation={2} sx={{ 
                flex: 1,
                height: '254px',
                p: 3, 
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="18px">
                  Resume Checklist
                </Typography>
                <Box component="ol" sx={{ 
                  pl: 2.5, 
                  m: 0, 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-evenly',
                  overflow: 'hidden'
                }}>
                  <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
                    Use college mail id
                  </Typography>
                  <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
                    Keep it within in 1 page
                  </Typography>
                  <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
                    Mention CGPA and School
                  </Typography>
                  <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
                    boards percentage
                  </Typography>
                  <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
                    Include Skills and Projects
                  </Typography>
                  <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
                    Add GitHub and LinkedIn Profile
                  </Typography>
                  <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>
                    Don't Include any Pictures
                  </Typography>
                </Box>
              </Paper>
              
              {/* Resume Score */}
              <Paper elevation={2} sx={{ 
                flex: 1,
                height: '254px',
                p: 3, 
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="18px">
                  Resume Score
                </Typography>
                <Typography fontSize={14} color="#333" mb={1.5} fontWeight={500}>
                  Resume Strength (Marks)
                </Typography>
                <Typography fontSize={14} color="#666" sx={{ lineHeight: 1.4 }}>
                  Suggestions : #for eg add GitHub id
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function PlacementPortal({ onLogout, onViewChange }) {
  return (
    <div style={{ background: "#f8faff", minHeight: "100vh", fontFamily: 'Inter, Arial, sans-serif' }}>
      <Navbar />
      <div style={{ display: "flex" }}>
        <Sidebar onLogout={onLogout} onViewChange={onViewChange} />
        <MainContent />
      </div>
    </div>
  );
}

export default PlacementPortal;
