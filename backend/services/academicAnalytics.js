// backend/services/academicAnalytics.js

const GRADE_POINTS = {
  'O': 10, 'S': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6,
  'C': 5, 'U': 0, 'RA': 0, 'AB': 0, 'SA': 0, 'W': 0, 'WD': 0
};

function calculateSemesterGPA(subjects) {
  let totalCredits = 0;
  let totalPoints = 0;
  let hasFail = false;

  for (const s of subjects) {
    const grade = (s.grade || '').toUpperCase();
    const credits = Number(s.credits || 0);
    const points = GRADE_POINTS.hasOwnProperty(grade) ? GRADE_POINTS[grade] : 0;
    
    totalCredits += credits;
    totalPoints += credits * points;
    if (grade === 'U' || grade === 'RA' || s.result === 'F' || s.result === 'AB') {
      hasFail = true;
    }
  }

  if (totalCredits === 0) return 0.0;
  return +(totalPoints / totalCredits).toFixed(2);
}

function classifyCourse(code, name) {
  const upperCode = (code || '').toUpperCase();
  const upperName = (name || '').toUpperCase();

  if (upperName.includes('LAB') || upperName.includes('PRACTICAL') || upperName.includes('WORKSHOP') || upperName.includes('SEMINAR')) {
    return 'Laboratory Course';
  } else if (upperName.includes('ELECTIVE') || upperCode.endsWith('E') || upperCode.includes('PE') || upperCode.includes('OE')) {
    return upperCode.startsWith('O') ? 'Open Elective' : 'Professional Elective';
  } else if (upperName.includes('AUDIT') || upperCode.startsWith('AD') || upperCode.startsWith('AC')) {
    return 'Audit Course';
  }
  return 'Professional Core';
}

function analyzeAcademicProfile(subjects, semester, historicalMarksheets = []) {
  const gpa = calculateSemesterGPA(subjects);
  
  // Combine current subjects and historical ones for cumulative profiling
  let allSubjects = [...subjects];
  for (const hm of historicalMarksheets) {
    if (hm.subjects) {
      allSubjects = allSubjects.concat(hm.subjects);
    }
  }

  let totalCredits = 0;
  let earnedCredits = 0;
  let failedCredits = 0;
  let backlogs = 0;
  const gradeDistribution = {};

  for (const s of allSubjects) {
    const credits = Number(s.credits || 0);
    const grade = (s.grade || '').toUpperCase();
    
    totalCredits += credits;
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;

    if (grade === 'U' || grade === 'RA' || s.result === 'F' || s.result === 'AB') {
      failedCredits += credits;
      backlogs += 1;
    } else if (s.result === 'P' || grade) {
      earnedCredits += credits;
    }
  }

  const passPercentage = allSubjects.length > 0 ? +(((allSubjects.length - backlogs) / allSubjects.length) * 100).toFixed(1) : 100;
  
  // Cumulative CGPA calculation
  let cgpa = gpa;
  if (historicalMarksheets.length > 0) {
    const totalGpas = historicalMarksheets.reduce((sum, m) => sum + (m.sgpa || m.gpa || 0), 0) + gpa;
    cgpa = +(totalGpas / (historicalMarksheets.length + 1)).toFixed(2);
  }

  const isPlacementEligible = cgpa >= 6.0 && backlogs === 0;
  const graduationProbability = backlogs > 3 ? 0.60 : backlogs > 0 ? 0.85 : 0.98;
  const riskLevel = backlogs > 2 ? 'HIGH' : backlogs > 0 ? 'MEDIUM' : 'LOW';

  return {
    gpa,
    cgpa,
    totalCredits,
    earnedCredits,
    failedCredits,
    backlogCount: backlogs,
    passPercentage,
    gradeDistribution,
    riskAnalysis: {
      riskLevel,
      graduationProbability,
      isPlacementEligible
    }
  };
}

module.exports = {
  calculateSemesterGPA,
  classifyCourse,
  analyzeAcademicProfile
};
