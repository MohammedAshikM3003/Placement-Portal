const express = require('express');
const router = express.Router();

const Subject = require('../models/Subject');

const getAcademicYearFromSemester = (semester) => {
  const sem = Number(semester);
  if (!Number.isFinite(sem) || sem < 1) return null;
  return Math.ceil(sem / 2);
};

router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.user?.role === 'coordinator') {
      const User = require('../models/User');
      const userDoc = await User.findOne({ coordinatorId: req.user.coordinatorId }).lean();
      if (userDoc?.department) {
        query.department = userDoc.department.toUpperCase();
      }
    } else if (req.query.department) {
      query.department = req.query.department.toUpperCase();
    }

    const subjects = await Subject.find(query)
      .sort({ courseCode: 1 })
      .lean();

    res.status(200).json({
      success: true,
      subjects
    });
  } catch (error) {
    console.error('[Subjects] Failed to load subject list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load subjects',
      details: error.message
    });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { courseCode, courseName, credits, semester, year } = req.body;
    if (!courseCode || !courseName) {
      return res.status(400).json({ success: false, error: 'Course Code and Course Name are required' });
    }

    let department = '';
    if (req.user?.role === 'coordinator') {
      const User = require('../models/User');
      const userDoc = await User.findOne({ coordinatorId: req.user.coordinatorId }).lean();
      department = userDoc?.department || '';
    } else if (req.body.department) {
      department = req.body.department;
    }

    const existing = await Subject.findOne({ courseCode: courseCode.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Subject with this Course Code already exists' });
    }

    const newSubject = await Subject.create({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      credits: parseInt(credits, 10) || 0,
      semester: semester ? parseInt(semester, 10) : null,
      year: year ? parseInt(year, 10) : null,
      department: department.trim().toUpperCase()
    });

    res.status(201).json({ success: true, subject: newSubject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { courseCode, courseName, credits, semester, year } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    if (courseCode && courseCode.trim().toUpperCase() !== subject.courseCode) {
      const duplicate = await Subject.findOne({ courseCode: courseCode.trim().toUpperCase(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, error: 'Another subject with this Course Code already exists' });
      }
      subject.courseCode = courseCode.trim().toUpperCase();
    }

    if (courseName !== undefined) subject.courseName = courseName.trim();
    if (credits !== undefined) subject.credits = parseInt(credits, 10) || 0;
    if (semester !== undefined) subject.semester = semester ? parseInt(semester, 10) : null;
    if (year !== undefined) subject.year = year ? parseInt(year, 10) : null;

    await subject.save();
    res.status(200).json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No subject IDs provided' });
    }

    const result = await Subject.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subjects, uploadId } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No subjects provided for saving'
      });
    }

    const savedSubjects = [];

    for (const subject of subjects) {
      const { courseCode, courseName, credits, semester, year } = subject;
      const semesterNumber = semester !== undefined && semester !== null && semester !== ''
        ? parseInt(semester, 10)
        : null;
      const yearNumber = getAcademicYearFromSemester(semesterNumber) ?? (year !== undefined && year !== null && year !== '' ? parseInt(year, 10) : null);

      if (!courseCode) {
        console.warn('[Subjects] Skipping subject without courseCode:', subject);
        continue;
      }

      try {
        const savedSubject = await Subject.findOneAndUpdate(
          { courseCode },
          {
            $set: {
              courseCode,
              courseName: courseName || '',
              credits: parseInt(credits, 10) || 0,
              semester: semesterNumber,
              year: yearNumber,
              uploadId: uploadId || null
            }
          },
          { upsert: true, new: true }
        ).lean();

        savedSubjects.push(savedSubject);
      } catch (error) {
        console.error(`[Subjects] Failed to save subject ${courseCode}:`, error.message);
      }
    }

    console.log(`[Subjects] Saved ${savedSubjects.length} subjects to database`);

    res.status(200).json({
      success: true,
      saved: savedSubjects.length,
      subjects: savedSubjects
    });
  } catch (error) {
    console.error('[Subjects] Failed to save subjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save subjects',
      details: error.message
    });
  }
});

module.exports = router;