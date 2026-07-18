// backend/services/placementMatcher.js

const CORPORATE_DRIVES = [
  {
    company: 'Google India',
    minCgpa: 8.0,
    maxBacklogs: 0,
    departments: ['Computer Science and Engineering', 'Information Technology']
  },
  {
    company: 'Zoho Corporation',
    minCgpa: 7.0,
    maxBacklogs: 1,
    departments: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Electrical and Electronics Engineering']
  },
  {
    company: 'Cognizant (CTS)',
    minCgpa: 6.0,
    maxBacklogs: 2,
    departments: [] // Empty means all departments eligible
  }
];

function matchStudentPlacementDrives(analytics, department = '') {
  const cgpa = analytics.cgpa || 0.0;
  const backlogs = analytics.backlogCount || 0;
  
  const results = [];
  
  for (const drive of CORPORATE_DRIVES) {
    const cgpaPassed = cgpa >= drive.minCgpa;
    const backlogsPassed = backlogs <= drive.maxBacklogs;
    const deptPassed = drive.departments.length === 0 || drive.departments.includes(department);
    
    const isEligible = cgpaPassed && backlogsPassed && deptPassed;
    
    results.push({
      company: drive.company,
      minCgpa: drive.minCgpa,
      maxBacklogs: drive.maxBacklogs,
      isEligible,
      reasons: [
        `CGPA ${cgpaPassed ? '✓ Meet' : '× Fail'} (Has: ${cgpa.toFixed(2)}, Req: ${drive.minCgpa})`,
        `Backlogs ${backlogsPassed ? '✓ Meet' : '× Fail'} (Has: ${backlogs}, Max: ${drive.maxBacklogs})`,
        `Department ${deptPassed ? '✓ Match' : '× Excluded'}`
      ]
    });
  }
  
  return results;
}

module.exports = {
  matchStudentPlacementDrives
};
