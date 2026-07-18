// backend/services/academicAdvisor.js

function generateAdvisoryFeedback(analytics) {
  const recommendations = [];
  const cgpa = analytics.cgpa || 0.0;
  const backlogs = analytics.backlogCount || 0;

  if (backlogs > 2) {
    recommendations.push({
      priority: 'CRITICAL',
      message: 'High Backlog Count detected. Special remedial coaching is highly recommended to recover eligibility.',
      action: 'Register for Remedial Classes'
    });
  } else if (backlogs > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Pending arrears found. Clear remaining subjects to restore full placement eligibility.',
      action: 'Schedule Arrear Exams'
    });
  }

  if (cgpa >= 8.5) {
    recommendations.push({
      priority: 'INFO',
      message: 'Excellent academic standing! Eligible for premium Tier-1 Dream placement drives.',
      action: 'Apply for Premium Companies'
    });
  } else if (cgpa >= 6.5) {
    recommendations.push({
      priority: 'INFO',
      message: 'Good academic standing. Eligible for most corporate placement drives.',
      action: 'Prepare Coding & Aptitude'
    });
  } else if (cgpa > 0.0) {
    recommendations.push({
      priority: 'WARNING',
      message: 'CGPA is below 6.5. Focus on score improvements in the upcoming semester to clear placement cutoffs.',
      action: 'Schedule Academic Counseling'
    });
  }

  return recommendations;
}

module.exports = {
  generateAdvisoryFeedback
};
