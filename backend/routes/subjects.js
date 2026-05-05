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
    const subjects = await Subject.find({})
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

/**
 * POST /
 * Save/update multiple subjects to database
 * 
 * Request:
 *   - subjects: Array of {courseCode, courseName, credits, semester, year}
 * 
 * Response:
 *   - saved: Count of saved subjects
 *   - subjects: Saved subject objects
 */
router.post('/', async (req, res) => {
  try {
    const { subjects } = req.body;

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
              year: yearNumber
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