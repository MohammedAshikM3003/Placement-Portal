/**
 * Marksheet PDF Extraction Service
 * ─────────────────────────────────────────────────────────
 * Extracts structured marksheet data from PDFs
 * Uses pdf-parse for text extraction from structured PDFs
 */

const pdfParse = require('pdf-parse');

/**
 * Extract all marksheets from PDF buffer
 * Returns array of marksheet objects (one per student)
 */
async function extractAllMarksheetsFromPDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    // Split by "Register Number:" which marks the start of each marksheet
    // The full marksheet text comes BEFORE "Register Number:"
    // We'll extract everything from a "Register Number:" to the next one
    
    const fullText = data.text;
    const regexSplit = /(?=Register Number:)/;  // Positive lookahead to split but keep the marker
    const studentSections = fullText.split(regexSplit).filter(s => s.trim());
    
    console.log(`[PDF Extraction] Found ${studentSections.length} student sections by "Register Number:"`);
    
    const marksheets = [];
    
    for (let i = 0; i < studentSections.length; i++) {
      const sectionText = studentSections[i].trim();
      if (!sectionText) continue;
      
      const marksheet = parseMarksheetPage(sectionText);
      if (marksheet) {
        marksheets.push(marksheet);
        console.log(`[PDF Extraction] ✓ Extracted marksheet ${i + 1}: ${marksheet.regNo} - ${marksheet.studentName}`);
        console.log(`[PDF Extraction] 📚 Subjects count: ${marksheet.subjects ? marksheet.subjects.length : 0}`, marksheet.subjects ? `First subject: ${marksheet.subjects[0]?.courseCode}` : 'NO SUBJECTS');
      } else {
        console.log(`[PDF Extraction] ✗ Failed to extract marksheet ${i + 1}`);
      }
    }
    
    return marksheets;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse a single marksheet page (text)
 * Extracts: RegNo, Name, Semester, Subjects, SGPA
 */
function parseMarksheetPage(pageText) {
  try {
    // ─────────────────────────────────────────────────────────
    // 1. Extract Register Number
    // ─────────────────────────────────────────────────────────
    const regNoMatch = pageText.match(/Register\s+Number\s*:\s*([A-Z0-9]+)/i);
    if (!regNoMatch) {
      console.warn('No Register Number found in page');
      return null;
    }
    const regNo = regNoMatch[1].trim();
    
    // ─────────────────────────────────────────────────────────
    // 2. Extract Student Name
    // ─────────────────────────────────────────────────────────
    const nameMatch = pageText.match(/Name\s+(?:of\s+)?the\s+Candidate\s*:\s*([A-Za-z\s\.]+?)(?:\n|$)/i);
    const studentName = nameMatch ? nameMatch[1].trim() : 'Unknown';
    
    // ─────────────────────────────────────────────────────────
    // 3. Extract Programme
    // ─────────────────────────────────────────────────────────
    const programmeMatch = pageText.match(/Programme\s*:\s*([^\n]+)/i);
    const programme = programmeMatch ? programmeMatch[1].trim() : '';
    
    // ─────────────────────────────────────────────────────────
    // 4. Extract Exam Date
    // ─────────────────────────────────────────────────────────
    const examDateMatch = pageText.match(/(?:UG|PG)\s+&\s+PG\s+END\s+SEMESTER\s+EXAMINATIONS?\s*[-–]\s*([^\n]+)/i);
    const examDate = examDateMatch ? examDateMatch[1].trim() : '';
    
    // ─────────────────────────────────────────────────────────
    // 5. Extract D.O.B
    // ─────────────────────────────────────────────────────────
    const dobMatch = pageText.match(/D\.?\s*O\.?\s*B\s*:\s*([\d\-\/]+)/i);
    const dob = dobMatch ? dobMatch[1].trim() : '--';
    
    // ─────────────────────────────────────────────────────────
    // 6. Extract Semester (will be filled by extractSubjectsFromTable)
    // ─────────────────────────────────────────────────────────
    let semester = 1;
    console.log('[parseMarksheetPage] Calling extractSubjectsFromTable...');
    const extractedData = extractSubjectsFromTable(pageText);
    
    // extractSubjectsFromTable returns {subjects, semester}
    if (extractedData && extractedData.semester) {
      semester = extractedData.semester;
      console.log('[parseMarksheetPage] ✓✓✓ Extracted semester from table:', semester);
    } else {
      console.log('[parseMarksheetPage] ⚠️ No semester found in extracted data:', extractedData);
    }
    
    const subjects = extractedData && extractedData.subjects ? extractedData.subjects : [];
    
    // ─────────────────────────────────────────────────────────
    // 7. Return Marksheet Object
    // ─────────────────────────────────────────────────────────
    return {
      regNo,
      studentName,
      programme,
      examDate,
      dob,
      semester,
      subjects,
      extractedAt: new Date()
    };
  } catch (error) {
    console.error('Error parsing marksheet page:', error.message);
    return null;
  }
}

/**
 * Extract subjects/courses from the table in the marksheet
 * Table format:
 *   S.NO | SEMESTER | COURSE CODE | COURSE NAME | GRADE OBTAINED | RESULT
 */
function extractSubjectsFromTable(pageText) {
  const subjects = [];
  
  // Split by lines and find table rows (start after header row)
  const lines = pageText.split('\n');
  let inTable = false;
  let headerFound = false;
  
  console.log('[Subject Extraction] Starting table parsing. Total lines:', lines.length);
  console.log('[Subject Extraction] First 500 chars of page:', pageText.substring(0, 500));
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table header - two formats:
    // Format 1: Single line with all headers "S.NOSEMESTERCOURSE CODECOURSE NAMEGRADE OBTAINEDRESULT"
    // Format 2: Multi-line header (RESULT may be on line 5-6 positions later)
    
    if ((line.includes('S.NO') || line.includes('S.NOSEMESTER')) && 
        (line.includes('RESULT') || line.includes('RESULTP'))) {
      // Format 1: single line header
      console.log('[Subject Extraction] Found table header (single line) at line', i, ':', line);
      inTable = true;
      headerFound = true;
      i++; // Skip header
      continue;
    }
    
    // Format 2: Check if this line is the start of a multi-line header
    if ((line.includes('S.NO') || line.includes('S.NOSEMESTER')) && !headerFound) {
      // Look ahead to see if RESULT appears in next few lines (multi-line header format)
      let resultFound = false;
      for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
        if (lines[j].trim().includes('RESULT') || lines[j].trim().includes('RESULTP')) {
          resultFound = true;
          i = j; // Skip all header lines, continue from RESULT line
          break;
        }
      }
      if (resultFound) {
        console.log('[Subject Extraction] Found table header (multi-line format) at lines', i - (j - i - 1), '-', i);
        inTable = true;
        headerFound = true;
        i++; // Skip the RESULT line
        continue;
      }
    }
    
    // End of table detection - when we hit revaluation or similar
    if (inTable && line.includes('Revaluation')) {
      console.log('[Subject Extraction] End of table detected at line', i);
      break;
    }
    
    // Parse table row - must be in table and have actual data
    if (inTable && line && /^\d+/.test(line)) {
      console.log('[Subject Extraction] Parsing line', i, ':', line);
      
      const subject = parseTableRow(line, lines, i);
      if (subject) {
        console.log('[Subject Extraction] ✓ Extracted subject:', JSON.stringify(subject));
        subjects.push(subject);
      } else {
        console.log('[Subject Extraction] ✗ Failed to parse line');
      }
    }
  }
  
  console.log('[Subject Extraction] Total subjects extracted:', subjects.length);
  // Get semester from first subject if available (as fallback for frontend)
  const marksheetSemester = subjects.length > 0 ? subjects[0].semester : 1;
  
  return {
    subjects,
    semester: marksheetSemester  // Fallback semester from first subject
  };
}

/**
 * Parse a single table row to extract subject details
 * Extracts: CourseCode, CourseName, Grade, Result, Semester, Year
 * PDF Format: S.NO | SEMESTER | COURSE_CODE | COURSE_NAME | GRADE | RESULT
 */
function parseTableRow(line, allLines, lineIndex) {
  // Use explicit array of valid grades and results to ensure accurate matching at the end
  // Sorted by length descending prevents partial matches (e.g. 'A' matching when it should be 'RA')
  const validGrades = ['A+', 'B+', 'WD', 'RA', 'O', 'A', 'B', 'C', 'U'];
  const validResults = ['AB', 'RA', 'W', 'P', 'F'];
  
  let grade = null;
  let result = null;
  let endMatchStr = '';

  for (let r of validResults) {
    if (grade) break;
    for (let g of validGrades) {
      // Create pattern to match Grade + Result exactly at the end of the line
      const escapePlus = g.replace('+', '\\+');
      const pattern = new RegExp(`(${escapePlus})\\s*(${r})\\s*$`, 'i');
      const match = line.match(pattern);
      if (match) {
        grade = match[1].toUpperCase();
        result = match[2].toUpperCase();
        endMatchStr = match[0];
        break;
      }
    }
  }

  if (!grade || !result) {
    return null;
  }
  
  // Find course code pattern: 2-3 uppercase letters + 3 digits
  const courseCodeMatch = line.match(/([A-Z]{2,3}\d{3})/i);
  if (!courseCodeMatch) {
    return null;
  }
  
  const courseCode = courseCodeMatch[1].toUpperCase();
  const codeEndIndex = courseCodeMatch.index + courseCode.length;
  
  // Find where the grade starts (at the end)
  // Work backwards: the matched string is at endMatch.index
  // But we need to find the actual start of grade in the line
  // The grade is the part before the final P/F/AB
  const gradeStartIndex = line.length - endMatchStr.length;
  
  // Extract course name between code end and grade start
  let courseName = line.substring(codeEndIndex, gradeStartIndex).trim();
  
  // Remove leading numbers (S.NO and semester code digits)
  courseName = courseName.replace(/^\d+\s*/, '').trim();
  
  // Normalize spaces
  courseName = courseName.replace(/\s{2,}/g, ' ');
  
  if (!courseName) {
    courseName = courseCode;
  }
  
  // ===== NEW: Extract Semester from each row =====
  // PDF text has NO SPACES between S.NO, SEMESTER, and course code
  // Examples from logs:
  //   "1220CS211C ProgrammingAP" → S.NO=1, SEMESTER=2
  //   "7220GE028Manufacturing..." → S.NO=7, SEMESTER=2
  //   "11220PH028Physics..." → S.NO=11, SEMESTER=2
  // Pattern: [S.NO: 1-2 digits][SEMESTER: 1 digit][REST]
  
  let semester = 1;
  let year = 1;
  
  // Match first 1-2 digits (S.NO) followed by exactly 1 digit (SEMESTER)
  const snoSemMatch = line.match(/^(\d{1,2})(\d)/);
  
  console.log(`[parseTableRow] Extracting from: "${line.substring(0, 30)}..."`);
  console.log(`[parseTableRow] Using pattern: /^(\\d{1,2})(\\d)/`);
  console.log(`[parseTableRow] Match result:`, snoSemMatch);
  
  if (snoSemMatch) {
    const sno = parseInt(snoSemMatch[1], 10);
    const potentialSemester = parseInt(snoSemMatch[2], 10);
    
    console.log(`[parseTableRow] Extracted S.NO=${sno}, potentialSemester=${potentialSemester}`);
    
    // Validate: semester must be 1-8
    if (potentialSemester >= 1 && potentialSemester <= 8) {
      semester = potentialSemester;
      year = Math.ceil(semester / 2);
      console.log(`[parseTableRow] ✓✓✓ SUCCESS: SEMESTER=${semester}, YEAR=${year}`);
    } else {
      console.log(`[parseTableRow] ✗ Invalid semester ${potentialSemester}, using default 1`);
    }
  } else {
    console.log(`[parseTableRow] ✗ Could not extract semester, using default 1`);
  }
  
  return {
    courseCode,
    courseName,
    grade,
    result,
    credits: 0,
    semester,  // NEW: semester on each subject
    year       // NEW: calculated year on each subject
  };
}

/**
 * Validate extracted marksheet data
 */
function validateMarksheetData(marksheet) {
  const errors = [];
  
  if (!marksheet.regNo) errors.push('Register Number is required');
  if (!marksheet.studentName) errors.push('Student Name is required');
  if (!marksheet.semester || marksheet.semester < 1 || marksheet.semester > 8) {
    errors.push('Semester must be between 1-8');
  }
  if (!marksheet.subjects || marksheet.subjects.length === 0) {
    errors.push('No subjects found in marksheet');
  }
  
  // Validate each subject
  if (marksheet.subjects) {
    marksheet.subjects.forEach((subject, idx) => {
      if (!subject.courseCode) errors.push(`Subject ${idx + 1}: Course Code is missing`);
      if (!subject.courseName) errors.push(`Subject ${idx + 1}: Course Name is missing`);
      if (!subject.grade) errors.push(`Subject ${idx + 1}: Grade is missing`);
      if (!subject.result) errors.push(`Subject ${idx + 1}: Result is missing`);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Match student from database based on regNo and name
 * Returns { isMatched, student, warnings }
 */
async function matchStudentFromDatabase(regNo, studentName, Student) {
  try {
    // Exact match on registration number
    const student = await Student.findOne({ regNo: regNo.trim() });
    
    if (!student) {
      return {
        isMatched: false,
        student: null,
        warning: `No student found with Register Number: ${regNo}`
      };
    }
    
    // Verify name matches (case-insensitive, partial match allowed)
    const extractedNameLower = studentName.toLowerCase().trim();
    const storedNameLower = `${student.firstName} ${student.lastName}`.toLowerCase();
    
    // Check if names are similar enough (at least first and last name match)
    const nameMatch = storedNameLower.includes(extractedNameLower) ||
                      extractedNameLower.includes(storedNameLower);
    
    if (!nameMatch) {
      return {
        isMatched: true,
        student,
        warning: `Name mismatch: PDF shows "${studentName}", DB has "${student.firstName} ${student.lastName}"`
      };
    }
    
    return {
      isMatched: true,
      student,
      warning: null
    };
  } catch (error) {
    throw new Error(`Database lookup failed: ${error.message}`);
  }
}

module.exports = {
  extractAllMarksheetsFromPDF,
  parseMarksheetPage,
  extractSubjectsFromTable,
  validateMarksheetData,
  matchStudentFromDatabase
};
