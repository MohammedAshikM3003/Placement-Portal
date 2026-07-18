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

function matchSubjectName(name, subjectNameLookup, minSimilarity = 0.80) {
  if (!name) return null;
  const normalized = normalizeSubjectName(name);
  if (!normalized) return null;
  if (subjectNameLookup[normalized]) {
    return { match: subjectNameLookup[normalized], similarity: 1.0, exact: true };
  }

  let bestMatch = null;
  let bestDist = 999;
  let bestKey = null;

  for (const key of Object.keys(subjectNameLookup)) {
    const maxLen = Math.max(key.length, normalized.length);
    if (Math.abs(key.length - normalized.length) / maxLen > (1 - minSimilarity)) continue;
    const d = distance(normalized, key);
    if (d < bestDist) {
      bestDist = d;
      bestMatch = subjectNameLookup[key];
      bestKey = key;
      if (bestDist === 1) break;
    }
  }

  if (bestMatch && bestKey) {
    const maxLen = Math.max(bestKey.length, normalized.length);
    const similarity = 1 - (bestDist / maxLen);
    if (similarity >= minSimilarity) {
      return { match: bestMatch, similarity, exact: false };
    }
  }

  return null;
}

function getNGrams(text, n = 3) {
  const clean = String(text || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const ngrams = [];
  for (let i = 0; i < clean.length - n + 1; i++) {
    ngrams.push(clean.substr(i, n));
  }
  const splitWords = clean.split(/\s+/).filter(Boolean);
  ngrams.push(...splitWords);
  return ngrams;
}

function calculateCosineSimilarity(text1, text2) {
  const vec1 = getNGrams(text1);
  const vec2 = getNGrams(text2);
  if (vec1.length === 0 || vec2.length === 0) return 0.0;
  
  const freq1 = {};
  for (const w of vec1) freq1[w] = (freq1[w] || 0) + 1;
  const freq2 = {};
  for (const w of vec2) freq2[w] = (freq2[w] || 0) + 1;
  
  const allWords = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
  let dotProduct = 0;
  let sum1 = 0;
  let sum2 = 0;
  
  for (const w of allWords) {
    const val1 = freq1[w] || 0;
    const val2 = freq2[w] || 0;
    dotProduct += val1 * val2;
    sum1 += val1 * val1;
    sum2 += val2 * val2;
  }
  
  const denominator = Math.sqrt(sum1) * Math.sqrt(sum2);
  if (denominator === 0) return 0.0;
  return dotProduct / denominator;
}

function matchSubjectSemantic(name, subjectNameLookup, minSimilarity = 0.70) {
  if (!name) return null;
  const normalized = normalizeSubjectName(name);
  if (!normalized) return null;

  let bestMatch = null;
  let bestScore = 0.0;
  
  for (const key of Object.keys(subjectNameLookup)) {
    const score = calculateCosineSimilarity(normalized, key);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = subjectNameLookup[key];
    }
  }

  if (bestMatch && bestScore >= minSimilarity) {
    return { match: bestMatch, similarity: bestScore, exact: bestScore >= 0.95 };
  }
  return null;
}

module.exports = {
  buildSubjectLookup,
  buildSubjectNameLookup,
  matchCourseCode,
  matchSubjectName,
  matchSubjectSemantic,
  normalizeSubjectName
};
