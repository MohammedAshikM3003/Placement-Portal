const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// Submit attendance
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
    
    // Extract only the relevant student data from each attendance record
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
    
    // Extract only the relevant student data from each attendance record
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
    
    // Build query for filtering students by branch
    const query = {
      'students.branch': new RegExp(branch, 'i') // Case-insensitive match
    };
    
    // Add date filters if provided
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }
    
    const attendances = await Attendance.find(query).sort({ startDate: -1 });
    
    // Filter and flatten students from all attendance records
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
