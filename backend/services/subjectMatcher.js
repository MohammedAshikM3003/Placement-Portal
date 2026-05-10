const { distance } = require('fastest-levenshtein');

const ROMAN_TO_ARABIC = {
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
  ix: '9',
  x: '10'
};

function normalizeSubjectName(name) {
  if (!name) return '';
  let value = String(name).toLowerCase();
  value = value.replace(/[‐‑–—]/g, '-');
  value = value.replace(/[_]/g, ' ');
  value = value.replace(/\s*-\s*/g, '-');
  value = value.replace(/[^a-z0-9\s-]/g, ' ');
  value = value.replace(/\s+/g, ' ').trim();

  value = value.replace(/-(i{1,3}|iv|v|vi{0,3}|ix|x)$/g, (match, roman) => {
    return `-${ROMAN_TO_ARABIC[roman] || roman}`;
  });
  value = value.replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x)$/g, (match, roman) => {
    return ROMAN_TO_ARABIC[roman] || roman;
  });

  return value;
}

function buildSubjectLookup(subjects) {
  const lookup = {};
  for (const subject of subjects || []) {
    if (!subject?.courseCode) continue;
    lookup[String(subject.courseCode).toUpperCase()] = subject;
  }
  return lookup;
}

function buildSubjectNameLookup(subjects) {
  const lookup = {};
  for (const subject of subjects || []) {
    if (!subject?.courseName) continue;
    const normalized = normalizeSubjectName(subject.courseName);
    if (!normalized) continue;

    const existing = lookup[normalized];
    if (!existing) {
      lookup[normalized] = subject;
      continue;
    }

    const existingCredits = existing.credits;
    const nextCredits = subject.credits;
    if ((existingCredits === null || existingCredits === undefined) && nextCredits !== undefined) {
      lookup[normalized] = subject;
    }
  }
  return lookup;
}

function matchCourseCode(code, subjectLookup, maxDistance = 1) {
  if (!code) return { match: null, corrected: false };
  const normalized = String(code).toUpperCase().replace(/\s+/g, '');
  if (subjectLookup[normalized]) {
    return { match: subjectLookup[normalized], corrected: false, correctedCode: normalized };
  }

  let bestKey = null;
  let bestDist = maxDistance + 1;
  for (const key of Object.keys(subjectLookup)) {
    const d = distance(normalized, key);
    if (d < bestDist) {
      bestDist = d;
      bestKey = key;
      if (bestDist === 1) break;
    }
  }

  if (bestKey && bestDist <= maxDistance) {
    return { match: subjectLookup[bestKey], corrected: true, correctedCode: bestKey, distance: bestDist };
  }

  return { match: null, corrected: false };
}

function matchSubjectName(name, subjectNameLookup) {
  if (!name) return null;
  const normalized = normalizeSubjectName(name);
  if (!normalized) return null;
  return subjectNameLookup[normalized] || null;
}

module.exports = {
  buildSubjectLookup,
  buildSubjectNameLookup,
  matchCourseCode,
  matchSubjectName,
  normalizeSubjectName
};
