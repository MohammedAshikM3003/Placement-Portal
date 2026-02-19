const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// PUBLIC ENDPOINT - GET college images only (no authentication required)
// This allows the landing page to display college images without login
router.get('/college-images/:adminLoginID', async (req, res) => {
  try {
    const { adminLoginID } = req.params;
    const loginID = adminLoginID || 'admin1000'; // Default admin
    
    const admin = await Admin.findOne({ adminLoginID: loginID });
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'College images not found' 
      });
    }
    
    // Return only public college images (not personal admin data)
    const collegeImages = {
      collegeBanner: admin.collegeBanner || null,
      naacCertificate: admin.naacCertificate || null,
      nbaCertificate: admin.nbaCertificate || null,
      collegeLogo: admin.collegeLogo || null
    };
    
    res.json({ 
      success: true, 
      data: collegeImages 
    });
    
  } catch (error) {
    console.error('Error fetching college images:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching college images',
      error: error.message 
    });
  }
});

// GET admin profile by adminLoginID
router.get('/profile/:adminLoginID', async (req, res) => {
  try {
    const { adminLoginID } = req.params;
    
    const admin = await Admin.findOne({ adminLoginID });
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin profile not found' 
      });
    }
    
    // Don't send password in response
    const adminData = admin.toObject();
    delete adminData.adminPassword;
    
    res.json({ 
      success: true, 
      data: adminData 
    });
    
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching admin profile',
      error: error.message 
    });
  }
});

// POST or PUT - Save/Update admin profile
router.post('/profile', async (req, res) => {
  try {
    const {
      adminLoginID,
      currentPassword,
      newPassword,
      confirmPassword,
      firstName,
      lastName,
      dob,
      gender,
      emailId,
      domainMailId,
      phoneNumber,
      department,
      profilePhoto,
      profilePhotoName,
      collegeBanner,
      collegeBannerName,
      naacCertificate,
      naacCertificateName,
      nbaCertificate,
      nbaCertificateName,
      collegeLogo,
      collegeLogoName
    } = req.body;

    if (!adminLoginID) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin Login ID is required' 
      });
    }

    // Find existing admin
    let admin = await Admin.findOne({ adminLoginID });
    
    const updateData = {
      firstName,
      lastName,
      dob,
      gender,
      emailId,
      domainMailId,
      phoneNumber,
      department,
      updatedAt: new Date()
    };
    
    // Handle profile photo
    if (profilePhoto) {
      updateData.profilePhoto = profilePhoto;
      updateData.profilePhotoName = profilePhotoName || 'profile.jpg';
      updateData.profilePhotoUploadDate = new Date();
    }
    
    // Handle college banner
    if (collegeBanner) {
      updateData.collegeBanner = collegeBanner;
      updateData.collegeBannerName = collegeBannerName || 'banner.jpg';
      updateData.collegeBannerUploadDate = new Date();
    }
    
    // Handle NAAC certificate
    if (naacCertificate) {
      updateData.naacCertificate = naacCertificate;
      updateData.naacCertificateName = naacCertificateName || 'naac.jpg';
      updateData.naacCertificateUploadDate = new Date();
    }
    
    // Handle NBA certificate
    if (nbaCertificate) {
      updateData.nbaCertificate = nbaCertificate;
      updateData.nbaCertificateName = nbaCertificateName || 'nba.jpg';
      updateData.nbaCertificateUploadDate = new Date();
    }
    
    // Handle college logo
    if (collegeLogo) {
      updateData.collegeLogo = collegeLogo;
      updateData.collegeLogoName = collegeLogoName || 'logo.jpg';
      updateData.collegeLogoUploadDate = new Date();
    }

    // Handle password change
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'New passwords do not match' 
        });
      }
      
      if (admin && currentPassword) {
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.adminPassword);
        if (!isMatch) {
          return res.status(400).json({ 
            success: false, 
            message: 'Current password is incorrect' 
          });
        }
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updateData.adminPassword = await bcrypt.hash(newPassword, salt);
    }

    if (admin) {
      // Update existing admin
      Object.assign(admin, updateData);
      await admin.save();
      
      const responseData = admin.toObject();
      delete responseData.adminPassword;
      
      res.json({ 
        success: true, 
        message: 'Admin profile updated successfully',
        data: responseData 
      });
    } else {
      // Create new admin (for initial setup)
      if (!newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password is required for new admin' 
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      updateData.adminLoginID = adminLoginID;
      updateData.adminPassword = await bcrypt.hash(newPassword, salt);
      
      admin = new Admin(updateData);
      await admin.save();
      
      const responseData = admin.toObject();
      delete responseData.adminPassword;
      
      res.status(201).json({ 
        success: true, 
        message: 'Admin profile created successfully',
        data: responseData 
      });
    }
    
  } catch (error) {
    console.error('Error saving admin profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while saving admin profile',
      error: error.message 
    });
  }
});

// PUT - Update admin login credentials only
router.put('/login-credentials', async (req, res) => {
  try {
    const {
      currentLoginId,
      newLoginId,
      confirmLoginId,
      currentPassword,
      newPassword,
      confirmPassword
    } = req.body;

    if (!currentLoginId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current Login ID is required' 
      });
    }

    const admin = await Admin.findOne({ adminLoginID: currentLoginId });
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Verify current password if provided
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.adminPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
    }

    // Update Login ID if provided
    if (newLoginId && confirmLoginId) {
      if (newLoginId !== confirmLoginId) {
        return res.status(400).json({ 
          success: false, 
          message: 'New Login IDs do not match' 
        });
      }
      
      // Check if new loginID already exists
      const existing = await Admin.findOne({ adminLoginID: newLoginId });
      if (existing && existing._id.toString() !== admin._id.toString()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Login ID already exists' 
        });
      }
      
      admin.adminLoginID = newLoginId;
    }

    // Update password if provided
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'New passwords do not match' 
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      admin.adminPassword = await bcrypt.hash(newPassword, salt);
    }

    admin.updatedAt = new Date();
    await admin.save();

    const responseData = admin.toObject();
    delete responseData.adminPassword;

    res.json({ 
      success: true, 
      message: 'Login credentials updated successfully',
      data: responseData 
    });

  } catch (error) {
    console.error('Error updating login credentials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating credentials',
      error: error.message 
    });
  }
});

module.exports = router;
