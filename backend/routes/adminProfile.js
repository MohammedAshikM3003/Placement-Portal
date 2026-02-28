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
    // Normalize URLs: strip localhost/any host prefix, return relative paths
    const normalizeUrl = (url) => {
      if (!url) return null;
      // Strip http://localhost:XXXX or any http(s)://host prefix, keep /api/file/xxx
      const match = url.match(/(\/api\/file\/[a-f0-9]{24})/);
      if (match) return match[1];
      // Already a relative path or ObjectId
      return url;
    };
    const collegeImages = {
      collegeBanner: normalizeUrl(admin.collegeBanner),
      naacCertificate: normalizeUrl(admin.naacCertificate),
      nbaCertificate: normalizeUrl(admin.nbaCertificate),
      collegeLogo: normalizeUrl(admin.collegeLogo)
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
    
    // Explicitly define the mapping.
    // If the frontend sends null or "", we store NULL in MongoDB.
    // This ensures $set FORCES null values to be written, killing ghost data.
    const updateData = {
      firstName,
      lastName,
      dob,
      gender,
      emailId,
      domainMailId,
      phoneNumber,
      department,
      // Always explicitly set image fields — null for empty values
      collegeBanner: collegeBanner || null,
      collegeBannerName: collegeBanner ? (collegeBannerName || 'banner.jpg') : null,
      collegeBannerUploadDate: collegeBanner ? new Date() : undefined,
      naacCertificate: naacCertificate || null,
      naacCertificateName: naacCertificate ? (naacCertificateName || 'naac.jpg') : null,
      naacCertificateUploadDate: naacCertificate ? new Date() : undefined,
      nbaCertificate: nbaCertificate || null,
      nbaCertificateName: nbaCertificate ? (nbaCertificateName || 'nba.jpg') : null,
      nbaCertificateUploadDate: nbaCertificate ? new Date() : undefined,
      collegeLogo: collegeLogo || null,
      collegeLogoName: collegeLogo ? (collegeLogoName || 'logo.jpg') : null,
      collegeLogoUploadDate: collegeLogo ? new Date() : undefined,
      updatedAt: new Date()
    };
    
    // Handle profile photo (conditional — only update if explicitly sent)
    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto || null;
      updateData.profilePhotoName = profilePhoto ? (profilePhotoName || 'profile.jpg') : null;
      if (profilePhoto) {
        updateData.profilePhotoUploadDate = new Date();
      }
    }

    // Remove undefined keys so Mongoose doesn't try to $set them
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

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
      // Use $set with findOneAndUpdate to guarantee null fields are written to MongoDB.
      // Object.assign + save can silently skip null values in some Mongoose versions.
      const updatedAdmin = await Admin.findOneAndUpdate(
        { adminLoginID },
        { $set: updateData },
        { new: true, runValidators: false }
      );
      
      // Log cleared images for debugging
      const clearedImages = [];
      if (updateData.collegeBanner === null) clearedImages.push('collegeBanner');
      if (updateData.naacCertificate === null) clearedImages.push('naacCertificate');
      if (updateData.nbaCertificate === null) clearedImages.push('nbaCertificate');
      if (updateData.collegeLogo === null) clearedImages.push('collegeLogo');
      if (clearedImages.length > 0) {
        console.log(`✅ Cleared images from MongoDB: ${clearedImages.join(', ')}`);
      }

      const responseData = updatedAdmin.toObject();
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
