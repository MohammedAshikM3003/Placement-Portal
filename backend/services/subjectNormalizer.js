// d:/Placement-Portal/backend/services/subjectNormalizer.js
const fs = require('fs');
const path = require('path');

const OCR_SPELLING_MAP = {
  'technol0gy': 'Technology',
  'technoiogy': 'Technology',
  'statistlcs': 'Statistics',
  'physlcs': 'Physics',
  'electronlcs': 'Electronics'
};

const LOWERCASE_WORDS = new Set(['and', 'or', 'to', 'of', 'in', 'for', 'with', 'the', 'a', 'an', 'by', 'from']);

function capitalizeWord(word, idx, isAllUppercaseString) {
  if (!word) return '';
  
  // Preserve Roman numerals
  const isRoman = /^[IVXLCDM]+$/i.test(word) || word.toLowerCase() === 'lll';
  if (isRoman) {
    if (word.toLowerCase() === 'lll') return 'III';
    return word.toUpperCase();
  }
  
  // Special academic terms
  const wordLower = word.toLowerCase();
  if (wordLower === 'c#') return 'C#';
  if (wordLower === 'c++') return 'C++';
  if (wordLower === '.net') return '.NET';
  if (wordLower === 'ai/ml') return 'AI/ML';
  
  if (word.includes('-')) {
    return word.split('-').map((w) => capitalizeWord(w, idx, isAllUppercaseString)).join('-');
  }
  if (word.includes('/')) {
    return word.split('/').map((w) => capitalizeWord(w, idx, isAllUppercaseString)).join('/');
  }
  
  if (LOWERCASE_WORDS.has(wordLower) && idx > 0) {
    // If it was already capitalized in the input, keep it capitalized
    if (word === 'And' || word === 'Or' || word === 'To' || word === 'Of' || word === 'In' || word === 'For' || word === 'With' || word === 'The' || word === 'A' || word === 'An' || word === 'By' || word === 'From') {
      return word;
    }
    // If it was all uppercase but the string is not all uppercase, keep it as is
    if (word === word.toUpperCase() && !isAllUppercaseString) {
      return word;
    }
    return wordLower;
  }
  
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function toSmartTitleCase(str) {
  const isAllUppercaseString = str === str.toUpperCase();
  return str.split(' ').map((word, idx) => capitalizeWord(word, idx, isAllUppercaseString)).join(' ');
}

function correctOcrSpelling(name) {
  let words = name.split(' ');
  words = words.map(word => {
    const cleanWord = word.replace(/[.,:;|_-]/g, '').toLowerCase();
    if (OCR_SPELLING_MAP[cleanWord]) {
      const originalPunctuation = word.match(/[.,:;|_-]+$/);
      const suffix = originalPunctuation ? originalPunctuation[0] : '';
      return OCR_SPELLING_MAP[cleanWord] + suffix;
    }
    return word;
  });
  return words.join(' ');
}

function logSubjectNormalization(original, normalized, reason, confidence) {
  try {
    const debugDir = 'd:/Placement-Portal/debug';
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    const reportPath = path.join(debugDir, 'subject_normalization_report.json');
    let logs = [];
    if (fs.existsSync(reportPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch (ex) {
        logs = [];
      }
    }
    logs.push({
      original,
      normalized,
      reason,
      confidence: Math.round(confidence * 100)
    });
    if (logs.length > 200) {
      logs = logs.slice(logs.length - 200);
    }
    fs.writeFileSync(reportPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error('[SubjectNormalizer] Failed to write report:', error.message);
  }
}

function cleanTrailingSubjectNoise(name) {
  if (!name) return '';
  let cleaned = name.trim();
  
  // 1. Loop to strip common grade/result suffix words repeatedly
  const suffixPattern = /\s+(?:\+V|d|P|F|U|RA|AB|A\+|B\+|O|S|A|B|C|PASS|FAIL|\+)\b$/i;
  let previous = '';
  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.replace(suffixPattern, '').trim();
  }
  
  // 2. Grammar check: If the last word is a single character (except 'I', 'V') or looks like a grade, strip it
  let words = cleaned.split(' ');
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    const isSingleChar = lastWord.length === 1 && !/^[IV]$/i.test(lastWord);
    const looksLikeGrade = /^(?:A\+|B\+|O|A|B|C|U|S|RA|AB|P|F|d|\+)$/i.test(lastWord);
    
    if (isSingleChar || looksLikeGrade) {
      words.pop();
      cleaned = words.join(' ');
    }
  }
  
  return cleaned;
}

function normalizeSubjectName(rawName, confidence = 1.0) {
  if (!rawName) return { normalized: '', reason: 'Empty name', shouldReview: false };
  
  const original = rawName;
  
  // Stage 8 - Confidence Check (< 80% retains original name)
  if (confidence < 0.80) {
    return {
      normalized: original,
      reason: 'Confidence too low to normalize',
      shouldReview: true
    };
  }
  
  let name = rawName.trim();
  let reasons = [];
  
  // Stage 1 - Remove Trailing Punctuation
  const trimmed = name.replace(/[.,:;|_-]+$/, '').trim();
  if (trimmed !== name) {
    reasons.push('Removed trailing punctuation');
    name = trimmed;
  }
  
  // Noise character & Grammar check stripping
  const noiseCleaned = cleanTrailingSubjectNoise(name);
  if (noiseCleaned !== name) {
    reasons.push('Removed leaked result noise');
    name = noiseCleaned;
  }
  
  // Stage 2 - Normalize Whitespace
  const compressed = name.replace(/\s+/g, ' ').trim();
  if (compressed !== name) {
    reasons.push('Normalized whitespace');
    name = compressed;
  }
  
  // Stage 3 - Roman Numeral Normalization
  const normalizedRoman = name.replace(/\b(i|ii|iii|iv|v|vi|vii|viii|lll|ii|iii|iv|vi|vii|viii)\b$/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower === 'lll') return 'III';
    return lower.toUpperCase();
  });
  if (normalizedRoman !== name) {
    reasons.push('Roman numeral normalization');
    name = normalizedRoman;
  }
  
  // Stage 5 - Smart Title Case
  const titleCased = toSmartTitleCase(name);
  if (titleCased !== name) {
    reasons.push('Smart title case');
    name = titleCased;
  }
  
  // Stage 6 - OCR Spelling Correction
  const spellingCorrected = correctOcrSpelling(name);
  if (spellingCorrected !== name) {
    reasons.push('OCR spelling correction');
    name = spellingCorrected;
  }
  
  if (reasons.length > 0) {
    logSubjectNormalization(original, name, reasons.join(', '), confidence);
  }
  
  return {
    normalized: name,
    reason: reasons.join(', ') || 'Preserved valid format',
    shouldReview: false
  };
}

module.exports = {
  normalizeSubjectName,
  toSmartTitleCase,
  correctOcrSpelling
};
