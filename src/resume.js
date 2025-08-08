import React from 'react';
import { AppBar, Typography, IconButton, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, TextField, Paper, Chip } from '@mui/material';
import { School, Dashboard, Description, CalendarToday, EmojiEvents, Business, Person, Logout, Upload, Preview, Download, Menu, MoreVert, KeyboardArrowDown, Info, Star, Mail } from '@mui/icons-material';
import { FaLinkedin, FaGithub, FaTachometerAlt, FaFileAlt, FaCalendarAlt, FaRegStar, FaBriefcase, FaGraduationCap, FaUser, FaSignOutAlt, FaHome, FaInfo, FaStar, FaEnvelope } from 'react-icons/fa';
import PlacementPortalIcon from './assets/PlacementPortalicon.png';
import logo from './assets/logo.png';
import Adminicon from './assets/Adminicon.png';
import ksrCollegeImage from './assets/ksrCollegeImage.jpg';
import CompanySideBarIcon from './assets/CompanySideBarIcon.svg';

const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
  { icon: require('./assets/ProfileSideBarIcon.png'), text: 'Profile', view: 'profile' },
];

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

function MainContent({ onViewChange }) {
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

  const handleViewProfile = () => {
    // Navigate to profile page
    if (onViewChange) {
      onViewChange('profile');
    }
    console.log('View Profile clicked - navigating to profile');
  };

  return (
    <Box sx={{ flexGrow: 1, background: "#f8fafd", height: "100vh", ml: '0px', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden' }}>
      
      <Box sx={{ p: 1, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <Box display="flex" gap={2} justifyContent="space-between" sx={{ width: '100%', height: '100%' }}>
          {/* Left Column - Profile Only */}
          <Box sx={{ display: 'flex', flexDirection: 'column', width: 350 }}>
            {/* Student Info Card */}
            <Paper elevation={3} sx={{ 
              width: 350, 
              height: '650px',
              p: 3, 
              mt: 0,
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "space-between",
              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
              color: '#fff',
              borderRadius: '16px',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: '20px' }}>
                <img src={Adminicon} alt="Placement Portal" style={{ width: 130, height: 130, marginBottom: 20, filter: 'brightness(0) invert(1)' }} />
                                  
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', mb: 3, pl: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      Name
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      Student
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      Reg No
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      7315XXXXXXX
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      Dept
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      B.E CSE
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      Year
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      4th
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      Sem
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      7
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      CGPA
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      8.7
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      Phone
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      96291XXXXX
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: 1 }}>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>
                      DOB
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                      :
                    </Typography>
                    <Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                      16-05-2006
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                onClick={handleViewProfile}
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
                  mt: 'auto',
                  mb: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                    boxShadow: '0 4px 12px rgba(255,255,255,0.4)',
                    transform: 'translateY(-2px)'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  }
                }}
              >
                View Profile
              </Button>
            </Paper>
          </Box>
          
          {/* Right Column - Upload Section, Resume Checklist, and Resume Score */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 'calc(100% - 370px)', flex: 1 }}>
            {/* Resume Upload Section */}
            <Paper elevation={3} sx={{ 
              width: '100%',
              height: '400px',
              p: 3, 
              mt: 0,
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
            <Box sx={{ display: 'flex', gap: 1, width: '100%', height: '280px' }}>
              {/* Resume Checklist */}
              <Paper elevation={2} sx={{ 
                flex: 1,
                height: '250px',
                p: 3, 
                mt: 1,
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
                height: '250px',
                p: 3, 
                mt: 1,
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

function PlacementPortal({ onLogout, onViewChange, currentView }) {
  return (
    <>
      <style>{`
        body {
          background: #f8f8fb;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', Arial, sans-serif;
          overflow: hidden;
        }
        
        .container {
          font-family: 'Poppins', Arial, sans-serif;
          background: #f8f8fb;
          min-height: 100vh;
          overflow: hidden;
        }
        
        /* Navbar styles */
        .navbar {
          display: flex;
          align-items: center;
          background: #2085f6;
          color: #fff;
          padding: 15px 32px 15px 26px;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        
        .navbar .left {
          display: flex;
          align-items: center;
        }
        
        .portal-logo {
          height: 35px;
          width: 35px;
          margin-right: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .portal-logo img {
          height: 35px;
          width: 35px;
          filter: brightness(0) invert(1);
        }
        
        .portal-name {
          font-size: 1.48rem;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        
        .navbar .menu {
          display: flex;
          gap: 35px;
          font-size: 1.06rem;
        }
        
        .navbar .menu span {
          color: #fff;
          text-decoration: none;
          margin: 0 5px;
          font-weight: 500;
          position: relative;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .navbar .menu span:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .main {
          display: flex;
          min-height: calc(100vh - 65px);
          margin-top: 65px;
        }
        
        /* Sidebar */
        .sidebar {
          background: #fff;
          width: 230px;
          height: calc(100vh - 65px);
          box-shadow: 2px 0 12px #e1e6ef3a;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 65px;
          overflow-y: hidden;
          z-index: 999;
        }
        
        .sidebar .user-info {
          text-align: center;
          padding: 25px 20px 20px 20px;
          font-size: 1rem;
          color: #555;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex-shrink: 0;
        }
        
        .sidebar .user-details img {
          width: 24px;
          height: 24px;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .sidebar .user-details {
          margin-top: 8px;
          font-weight: 600;
          font-size: 1.1em;
          color: #191c24;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0;
        }
        
        .sidebar .user-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }
        
        .sidebar .user-year {
          color: #777;
          font-size: 0.9em;
          font-weight: 400;
          margin-top: 2px;
          display: block;
        }
        
        .sidebar .menu-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #999;
          font-size: 1.2em;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .sidebar .menu-toggle:hover {
          background: #f0f0f0;
        }
        
        .sidebar .nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 25px 0;
          justify-content: space-between;
          gap: 0;
          min-height: 0;
        }
        
        .sidebar .nav-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .sidebar .nav-item {
          display: flex;
          align-items: center;
          font-size: 1.04rem;
          padding: 18px 25px;
          color: #000000;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
          gap: 15px;
          border-left: 4px solid transparent;
          margin: 3px 0;
        }
        
        .sidebar .nav-item.selected {
          background: #F8F8F8;
          border-left: 4px solid #197AFF;
          color: #197AFF;
          font-weight: 600;
        }
        
        .sidebar .nav-item.selected img {
          filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%);
        }
        
        .sidebar .nav-item:hover:not(.selected) {
          background: #f0f6ff;
          border-left: 4px solid #197AFF;
          color: #197AFF;
        }
        
        .sidebar .nav-item img {
          width: 20px;
          height: 20px;
          transition: transform 0.2s;
          filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
        }
        
        .sidebar .nav-item:hover img {
          transform: scale(1.1);
        }
        
        .sidebar .nav-item:hover:not(.selected) img {
          filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%);
        }
        
        .sidebar .nav-divider {
          height: 1px;
          background: #e0e0e0;
          margin: 8px 25px;
          border-top: 1px dotted #ccc;
          flex-shrink: 0;
        }
        
        .sidebar .logout-btn {
          background: #E96D7B;
          color: #fff;
          margin: 25px 25px 25px 25px;
          padding: 15px 0;
          border: none;
          border-radius: 25px;
          font-size: 1.07rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .sidebar .logout-btn:hover {
          background: #d55a6a;
        }
      `}</style>
      
      <div className="container">
        {/* NAVBAR */}
        <div className="navbar">
          <div className="left">
            <span className="portal-logo">
              <img src={Adminicon} alt="Portal Logo" />
            </span>
            <span className="portal-name">Placement Portal</span>
          </div>
          <div className="menu">
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              Home
            </span>
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              About
            </span>
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              Features
            </span>
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Contact
            </span>
          </div>
        </div>

        <div className="main">
          {/* SIDEBAR */}
          <div className="sidebar">
            <div className="user-info">
              <div className="user-details">
                <img src={Adminicon} alt="Admin" style={{ 
                  filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)"
                }} />
                <div className="user-text">
                  <span>Student</span>
                  <span className="user-year">Final Year</span>
                </div>
                <img src={Adminicon} alt="Admin" style={{ 
                  width: "16px", 
                  height: "16px",
                  marginLeft: "auto"
                }} />
              </div>
            </div>
            <button className="menu-toggle">•••</button>
            <nav className="nav">
              <div className="nav-section">
                {sidebarItems.slice(0, 5).map((item) => (
                  <span
                    key={item.text}
                    className={`nav-item${item.view === currentView ? ' selected' : ''}`}
                    onClick={() => {
                      console.log("Sidebar item clicked:", item.text, "view:", item.view);
                      onViewChange(item.view);
                    }}
                  >
                    <img src={item.icon} alt={item.text} /> {item.text}
                  </span>
                ))}
              </div>
              <div className="nav-divider"></div>
              <span className={`nav-item${currentView === 'profile' ? ' selected' : ''}`}
                onClick={() => onViewChange('profile')}
              >
                <img src={require('./assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
              </span>
            </nav>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
          
          {/* RESUME CONTENT */}
          <div style={{ marginLeft: '230px', width: 'calc(100vw - 230px)', overflow: 'hidden' }}>
            <MainContent onViewChange={onViewChange} />
          </div>
        </div>
      </div>
    </>
  );
}

export default PlacementPortal;






