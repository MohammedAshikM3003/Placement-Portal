const DEPARTMENTS = {
  cse: 'CSE',
  ece: 'ECE',
  eee: 'EEE',
  it: 'IT',
  mech: 'MECH',
  civil: 'CIVIL',
  csd: 'CSD',
};

const YEAR_MAP = {
  'first year': 'I',
  'second year': 'II',
  'third year': 'III',
  'fourth year': 'IV',
  'final year': 'IV',
  '1st year': 'I',
  '2nd year': 'II',
  '3rd year': 'III',
  '4th year': 'IV',
};

function parseStudentFilterQuery(prompt) {
  const text = String(prompt || '').trim();
  const lower = text.toLowerCase();
  const filters = {};

  const regNoMatch = lower.match(/\b\d{6,}\b/);
  if (regNoMatch) {
    filters.regNo = regNoMatch[0];
  }

  const nameMatch = text.match(/(?:show|find|get|search|display)\s+(?:me\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+){0,2})(?:\s+student|\s+record|\s+details|\s+profile)?/i);
  if (nameMatch && !filters.regNo) {
    filters.name = nameMatch[1].trim();
  }

  Object.keys(DEPARTMENTS).forEach((key) => {
    if (new RegExp(`\\b${key}\\b`, 'i').test(lower)) {
      filters.department = DEPARTMENTS[key];
    }
  });

  const batchMatch = text.match(/\b20\d{2}[-–]20\d{2}\b/);
  if (batchMatch) {
    filters.batch = batchMatch[0];
  }

  Object.keys(YEAR_MAP).forEach((phrase) => {
    if (lower.includes(phrase)) {
      filters.currentYear = YEAR_MAP[phrase];
    }
  });

  const cgpaMinMatch = lower.match(/(?:cgpa|gpa)\s*(?:above|greater than|>=|>|more than|at least)\s*(\d+(?:\.\d+)?)/i);
  if (cgpaMinMatch) {
    filters.cgpaMin = Number(cgpaMinMatch[1]);
  }

  const cgpaMaxMatch = lower.match(/(?:cgpa|gpa)\s*(?:below|less than|<=|<|at most)\s*(\d+(?:\.\d+)?)/i);
  if (cgpaMaxMatch) {
    filters.cgpaMax = Number(cgpaMaxMatch[1]);
  }

  const skillMatch = text.match(/(?:know|knows|skilled in|skills?|experience in|proficient in)\s+([a-zA-Z0-9#+.]+(?:\s*,?\s*[a-zA-Z0-9#+.]+)*)/i);
  if (skillMatch) {
    filters.skills = skillMatch[1].trim();
  }

  if (/\bblocked\b/i.test(lower)) {
    filters.isBlocked = true;
  }

  if (/\b(not placed|unplaced|un-placed)\b/i.test(lower)) {
    filters.isPlaced = false;
  } else if (/\bplaced\b/i.test(lower)) {
    filters.isPlaced = true;
  }

  return {
    filters,
    columns: [],
    reason: 'Rule-based parsing',
  };
}

module.exports = { parseStudentFilterQuery };
