import React, { useState } from 'react';
import { Typography, Button, Box, Paper } from '@mui/material';
import { Upload, Preview, Download } from '@mui/icons-material';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import './Resume.css';
import Adminicon from './assets/Adminicon.png';

// The inner components (ResumeChecklist, ResumeScore, MainContent) remain unchanged.
// ... (ResumeChecklist and ResumeScore components go here, no changes needed)
function ResumeChecklist() {
  return (
    <Paper elevation={2} sx={{ 
      flex: 1,
      width: '100%',
      height: '100%',
      minHeight: '250px',
      p: 3, 
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      border: '2px solid #c8c8c8', // UPDATED: border width changed to 2px
      transition: 'border-color 0.3s ease', // ADDED: transition for smooth hover
      '&:hover': {
        borderColor: '#2085f6' // ADDED: border color on hover
      }
    }}>
      <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="18px">
        Resume Checklist
      </Typography>
      <Box component="ol" sx={{ pl: 2.5, m: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>Use college mail id</Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>Keep it within in 1 page</Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>Mention CGPA and School</Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>boards percentage</Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>Include Skills and Projects</Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>Add GitHub and LinkedIn Profile</Typography>
        <Typography component="li" fontSize={14} color="#333" sx={{ lineHeight: 1.4 }}>Don't Include any Pictures</Typography>
      </Box>
    </Paper>
  );
}

function ResumeScore() {
  return (
    <Paper elevation={2} sx={{ 
      flex: 1,
      width: '100%',
      height: '100%',
      minHeight: '250px',
      p: 3, 
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '2px solid #c8c8c8', // UPDATED: border width changed to 2px
      transition: 'border-color 0.3s ease', // ADDED: transition for smooth hover
      '&:hover': {
        borderColor: '#2085f6' // ADDED: border color on hover
      }
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
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload only PDF or DOC/DOCX files');
      return;
    }
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 1MB');
      return;
    }
    setSelectedFile(file);
    event.target.value = '';
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }
    if (uploadedFile) console.log('Deleting old file:', uploadedFile.name);
    setUploadedFile(selectedFile);
    setUploadDate(new Date().toLocaleDateString());
    setSelectedFile(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handlePreview = () => {
    if (!uploadedFile) {
      setUploadError('No file uploaded to preview');
      return;
    }
    const fileUrl = URL.createObjectURL(uploadedFile);
    window.open(fileUrl, '_blank');
  };

  const handleDownload = () => {
    if (!uploadedFile) {
      setUploadError('No file uploaded to download');
      return;
    }
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
    if (onViewChange) onViewChange('profile');
    console.log('View Profile clicked - navigating to profile');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%' }}>
      <Box 
        display="flex" 
        gap={2} 
        sx={{ 
          width: '100%',
          height: '100%',
          flexDirection: { xs: 'column', md: 'row' }
        }}
      >
        {/* Left Column - Profile */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: { xs: '100%', md: 350 },
          height: { xs: 'auto', md: '100%' }
        }}>
          <Paper elevation={3} sx={{ 
            width: '100%', 
            height: '100%',
            p: 3, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            color: '#fff',
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
            border: '2px solid #c8c8c8', // UPDATED: border width changed to 2px
            transition: 'border-color 0.3s ease', // ADDED: transition for smooth hover
            '&:hover': {
              borderColor: '#2085f6' // ADDED: border color on hover
            }
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: '20px' }}>
              <img src={Adminicon} alt="Placement Portal" style={{ width: 120, height: 100, marginBottom: 20, filter: 'brightness(0) invert(1)' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', mb: 3, pl: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Name</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>Student</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Reg No</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>7315XXXXXXX</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Dept</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>B.E CSE</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Year</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>4th</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Sem</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>7</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>CGPA</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>8.7</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>Phone</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>96291XXXXX</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '60px' }}>DOB</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>:</Typography><Typography variant="body1" color="#e3f2fd" fontSize="18px" sx={{ fontWeight: 'bold', minWidth: '120px' }}>16-05-2006</Typography></Box>
              </Box>
            </Box>
            <Button variant="contained" onClick={handleViewProfile} sx={{ backgroundColor: '#fff', color: '#1976d2', fontWeight: 600, px: 3, py: 1, borderRadius: '12px', fontSize: '14px', textTransform: 'none', boxShadow: '0 3px 10px rgba(255,255,255,0.3)', mt: 2, mb: 2, '&:hover': { backgroundColor: '#f8f9fa', boxShadow: '0 4px 12px rgba(255,255,255,0.4)', transform: 'translateY(-2px)' }, '&:active': { transform: 'translateY(0)' } }}>View Profile</Button>
          </Paper>
        </Box>
        
        {/* Right Column */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          width: { xs: '100%', md: 'calc(100% - 370px)' },
          height: { xs: 'auto', md: '100%' },
          flex: 1 
        }}>
          <Paper elevation={3} sx={{ 
            width: '100%',
            height: { xs: 'auto', md: 'auto' },
            minHeight: { xs: 420, md: 'auto' },
            flex: { xs: 'none', md: 0.6 },
            p: 3, 
            background: '#fff', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
            display: 'flex', 
            flexDirection: 'column',
            border: '2px solid #c8c8c8', // UPDATED: border width changed to 2px
            transition: 'border-color 0.3s ease', // ADDED: transition for smooth hover
            '&:hover': {
              borderColor: '#2085f6' // ADDED: border color on hover
            }
          }}>
            <Typography variant="h6" fontWeight={700} color="#1976d2" mb={2.5} fontSize="26px" align="center">Upload Your Resume</Typography>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ flex: 1, justifyContent: 'space-evenly' }}>
              <Button variant="outlined" component="label" startIcon={<Upload />} sx={{ borderColor: '#9e9e9e', color: '#9e9e9e', px: 4, py: 2, borderRadius: '12px', fontWeight: 600, fontSize: '16px', textTransform: 'none', borderWidth: '2px', '&:hover': { borderColor: '#757575', backgroundColor: '#f8f9fa', borderWidth: '2px' } }}>
                {selectedFile ? selectedFile.name : 'Upload (Max 1 MB)'}
                <input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
              </Button>
              <Box sx={{ textAlign: 'center', color: '#9e9e9e' }}>
                <Typography fontSize={19} mb={0.5} sx={{ lineHeight: 1.4 }}>*Only PDF and DOC/DOCX files allowed</Typography>
                {uploadError && <Typography fontSize={16} mb={0.5} sx={{ lineHeight: 1.4, color: '#d32f2f' }}>{uploadError}</Typography>}
                {selectedFile && <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#1976d2' }}>Selected: {selectedFile.name}</Typography>}
                {uploadedFile && !selectedFile && <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#1976d2' }}>Last uploaded: {uploadedFile.name}</Typography>}
                {showSuccess ? <Typography fontSize={19} sx={{ lineHeight: 1.4, color: '#4caf50' }}>✓ Resume uploaded successfully</Typography> : <Typography fontSize={19} sx={{ lineHeight: 1.4 }}>*Click Upload and Select a file</Typography>}
                {uploadDate && <Typography fontSize={16} sx={{ lineHeight: 1.4, color: '#1976d2' }}>Last uploaded on: {uploadDate}</Typography>}
              </Box>
              <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent="center">
                <Button variant="contained" size="small" startIcon={<Preview />} onClick={handlePreview} sx={{ backgroundColor: '#6c49e0', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textTransform: 'none', px: 3, py: 1, boxShadow: '0 4px 12px rgba(108, 73, 224, 0.3)', '&:hover': { backgroundColor: '#5a35d1', boxShadow: '0 6px 16px rgba(108, 73, 224, 0.4)' } }}>Preview</Button>
                <Button variant="outlined" size="small" onClick={handleFileUpload} sx={{ borderColor: '#1976d2', color: '#1976d2', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textTransform: 'none', px: 3, py: 1, '&:hover': { borderColor: '#1565c0', backgroundColor: '#f5f5f5' } }}>Upload</Button>
                <Button variant="contained" size="small" startIcon={<Download />} onClick={handleDownload} sx={{ backgroundColor: '#4caf50', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textTransform: 'none', px: 3, py: 1, boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)', '&:hover': { backgroundColor: '#388e3c', boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)' } }}>Download</Button>
              </Box>
            </Box>
          </Paper>
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            width: '100%',
            flexDirection: { xs: 'column', md: 'row' },
            flex: { xs: 'none', md: 0.4 }
          }}>
            <ResumeChecklist />
            <ResumeScore />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function Resume({ onLogout, onViewChange }) { // Removed currentView from props
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // This handler simply calls the navigation function passed from App.js
  const handleViewChange = (view) => {
    onViewChange(view);
    setIsSidebarOpen(false);
  };

  return (
    <div className="container">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="main">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout}
          currentView={'resume'} // Hardcode 'resume' for highlighting
          onViewChange={handleViewChange} 
        />
        <div className="dashboard-area">
          {/* Pass onViewChange to MainContent so the "View Profile" button works */}
          <MainContent onViewChange={onViewChange} />
        </div>
      </div>
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}

export default Resume;
