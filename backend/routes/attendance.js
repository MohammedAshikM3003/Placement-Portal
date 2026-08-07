const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');
const Admin = require('../models/Admin');
const { sendMail, EMAIL_EVENTS } = require('../services/mail/mailService');

// Submit attendance & dispatch notifications
router.post('/submit', async (req, res) => {
  try {
    const attendanceData = req.body;
    
    // Validate required fields
    if (!attendanceData.companyName || !attendanceData.jobRole || !attendanceData.startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create new attendance record
    const attendance = new Attendance(attendanceData);
    await attendance.save();
    
    // Asynchronous background mail notifications (non-blocking)
    (async () => {
      try {
        const studentsList = Array.isArray(attendanceData.students) ? attendanceData.students : [];
        const totalStudents = studentsList.length;
        const totalPresent = studentsList.filter(s => s.status === 'Present').length;
        const totalAbsent = studentsList.filter(s => s.status === 'Absent').length;
        const percentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
        const dept = attendanceData.dept || (studentsList[0]?.branch) || 'General';

        // 1. Notify Individual Students
        for (const s of studentsList) {
          const studentDoc = await Student.findOne({
            $or: [{ regNo: s.regNo }, { _id: s.studentId }]
          }).lean();

          const studentEmail = studentDoc?.domainEmail || studentDoc?.email || s.email;
          if (studentEmail) {
            await sendMail({
              eventType: EMAIL_EVENTS.TRAINING_ATTENDANCE_REPORT,
              to: studentEmail,
              role: 'student',
              data: {
                trainingName: attendanceData.companyName,
                date: attendanceData.startDate,
                status: s.status || 'Present',
                percentage,
                recipientName: s.name || (studentDoc ? `${studentDoc.firstName} ${studentDoc.lastName}`.trim() : 'Student')
              }
            }).catch(err => console.error('[AttendanceMail] Student report error:', err.message));
          }
        }

        // 2. Notify Branch Coordinator (Branch Filtering Enforced)
        const coordinators = await Coordinator.find({ department: dept, isBlocked: { $ne: true } }).lean();
        for (const coord of coordinators) {
          const coordEmail = coord.domainEmail || coord.email;
          if (coordEmail) {
            await sendMail({
              eventType: EMAIL_EVENTS.DRIVE_ATTENDANCE_SUMMARY,
              to: coordEmail,
              role: 'coordinator',
              data: {
                companyName: attendanceData.companyName,
                jobRole: attendanceData.jobRole,
                startDate: attendanceData.startDate,
                dept,
                totalStudents,
                totalPresent,
                totalAbsent,
                percentage,
                submittedBy: attendanceData.submittedBy || 'Coordinator',
                recipientName: coord.fullName || coord.username
              }
            }).catch(err => console.error('[AttendanceMail] Coordinator summary error:', err.message));
          }
        }

        // 3. Notify Admin
        const admins = await Admin.find({ isBlocked: { $ne: true } }).lean();
        for (const admin of admins) {
          const adminEmail = admin.domainMailId || admin.emailId || admin.email;
          if (adminEmail) {
            await sendMail({
              eventType: EMAIL_EVENTS.DRIVE_ATTENDANCE_SUMMARY,
              to: adminEmail,
              role: 'admin',
              data: {
                companyName: attendanceData.companyName,
                jobRole: attendanceData.jobRole,
                startDate: attendanceData.startDate,
                dept,
                totalStudents,
                totalPresent,
                totalAbsent,
                percentage,
                submittedBy: attendanceData.submittedBy || 'Coordinator',
                recipientName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin'
              }
            }).catch(err => console.error('[AttendanceMail] Admin summary error:', err.message));
          }
        }
      } catch (asyncErr) {
        console.error('[AttendanceMail] Async notification processing failed:', asyncErr.message);
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Attendance submitted successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({
      error: 'Failed to submit attendance',
      details: error.message
    });
  }
});

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const attendances = await Attendance.find().sort({ submittedAt: -1 });
    res.json({
      success: true,
      data: attendances
    });
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({
      error: 'Failed to fetch attendances',
      details: error.message
    });
  }
});

// Get attendance by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const attendances = await Attendance.find({
      'students.studentId': studentId
    }).sort({ startDate: -1 });
    
    const studentAttendances = attendances.map(attendance => {
      const studentData = attendance.students.find(s => s.studentId === studentId);
      return {
        _id: attendance._id,
        companyName: attendance.companyName,
        jobRole: attendance.jobRole,
        startDate: attendance.startDate,
        endDate: attendance.endDate,
        status: studentData?.status || '-'
      };
    });
    
    res.json({
      success: true,
      data: studentAttendances
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      error: 'Failed to fetch student attendance',
      details: error.message
    });
  }
});

// Get attendance by registration number
router.get('/student/regNo/:regNo', async (req, res) => {
  try {
    const { regNo } = req.params;
    
    const attendances = await Attendance.find({
      'students.regNo': regNo
    }).sort({ startDate: -1 });
    
    const studentAttendances = attendances.map(attendance => {
      const studentData = attendance.students.find(s => s.regNo === regNo);
      return {
        _id: attendance._id,
        companyName: attendance.companyName,
        jobRole: attendance.jobRole,
        startDate: attendance.startDate,
        endDate: attendance.endDate,
        status: studentData?.status || '-'
      };
    });
    
    res.json({
      success: true,
      data: studentAttendances
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      error: 'Failed to fetch student attendance',
      details: error.message
    });
  }
});

// Get attendance by branch (for Coordinators)
router.get('/branch/:branch', async (req, res) => {
  try {
    const { branch } = req.params;
    const { startDate, endDate, batch } = req.query;
    
    const query = {
      'students.branch': new RegExp(branch, 'i')
    };
    
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }
    
    const attendances = await Attendance.find(query).sort({ startDate: -1 });
    
    const allStudents = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    
    attendances.forEach(attendance => {
      const branchStudents = attendance.students.filter(student => 
        student.branch.toLowerCase() === branch.toLowerCase() &&
        (!batch || student.batch === batch)
      );
      
      branchStudents.forEach(student => {
        allStudents.push({
          ...student,
          companyName: attendance.companyName,
          jobRole: attendance.jobRole,
          date: attendance.startDate,
          inTime: student.status === 'Present' ? '9:00 AM' : '-',
          outTime: student.status === 'Present' ? '4:00 PM' : '-'
        });
        
        if (student.status === 'Present') totalPresent++;
        if (student.status === 'Absent') totalAbsent++;
      });
    });
    
    const totalStudents = allStudents.length;
    const percentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        students: allStudents,
        stats: {
          totalStudents,
          totalPresent,
          totalAbsent,
          percentage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching branch attendance:', error);
    res.status(500).json({
      error: 'Failed to fetch branch attendance',
      details: error.message
    });
  }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByIdAndDelete(id);
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    res.json({
      success: true,
      message: 'Attendance deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      error: 'Failed to delete attendance',
      details: error.message
    });
  }
});

module.exports = router;
