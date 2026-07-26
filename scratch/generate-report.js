/**
 * Placement Portal — Full Project Analysis Report Generator
 * Generates a professional .docx Word document
 * Run: node scratch/generate-report.js
 */

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, ImageRun, TableOfContents,
  PageBreak, Header, Footer, PageNumber, NumberFormat, Tab, TabStopPosition,
  TabStopType, convertInchesToTwip, LevelFormat, UnderlineType
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Color Palette ────────────────────────────────────────
const COLORS = {
  PRIMARY: "1a56db",    // Deep blue
  SECONDARY: "6366f1",  // Indigo
  ACCENT: "0ea5e9",     // Sky blue
  SUCCESS: "16a34a",    // Green
  WARNING: "d97706",    // Amber
  DANGER: "dc2626",     // Red
  TEXT: "1f2937",        // Gray-800
  MUTED: "6b7280",      // Gray-500
  LIGHT_BG: "f0f4ff",   // Light blue bg
  WHITE: "ffffff",
  BLACK: "000000",
  TABLE_HEADER: "1e40af",
  TABLE_HEADER2: "3730a3",
  TABLE_ALT: "eff6ff",
  FLOW_STEP: "dbeafe",
  FLOW_DECISION: "fef3c7",
  FLOW_ACTION: "d1fae5",
  FLOW_ERROR: "fee2e2",
  SECTION_BG: "f8fafc",
};

// ── Helper Functions ─────────────────────────────────────

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 240, after: 120 },
  });
}

function para(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, size: opts.size || 22, font: "Calibri", color: opts.color || COLORS.TEXT, bold: opts.bold, italics: opts.italics, underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") runs.push(new TextRun({ text: t, size: 22, font: "Calibri", color: COLORS.TEXT }));
      else runs.push(new TextRun({ size: 22, font: "Calibri", color: COLORS.TEXT, ...t }));
    });
  }
  return new Paragraph({
    children: runs,
    spacing: { after: opts.after || 100 },
    alignment: opts.align || AlignmentType.LEFT,
  });
}

function bullet(text, level = 0, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, size: 22, font: "Calibri", color: COLORS.TEXT }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") runs.push(new TextRun({ text: t, size: 22, font: "Calibri", color: COLORS.TEXT }));
      else runs.push(new TextRun({ size: 22, font: "Calibri", color: COLORS.TEXT, ...t }));
    });
  }
  return new Paragraph({
    children: runs,
    bullet: { level },
    spacing: { after: 60 },
  });
}

function emptyLine() {
  return new Paragraph({ text: "", spacing: { after: 80 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ── Table Builders ───────────────────────────────────────

function headerCell(text, width) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: COLORS.WHITE })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
    })],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.CLEAR, fill: COLORS.TABLE_HEADER },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function dataCell(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, size: 20, font: "Calibri", color: COLORS.TEXT, bold: opts.bold, italics: opts.italics }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") runs.push(new TextRun({ text: t, size: 20, font: "Calibri", color: COLORS.TEXT }));
      else runs.push(new TextRun({ size: 20, font: "Calibri", color: COLORS.TEXT, ...t }));
    });
  }
  return new TableCell({
    children: [new Paragraph({
      children: runs,
      alignment: AlignmentType.LEFT,
      spacing: { before: 30, after: 30 },
    })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) => headerCell(h, colWidths?.[i])),
    tableHeader: true,
  });
  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) => dataCell(cell, {
        width: colWidths?.[ci],
        shading: ri % 2 === 1 ? COLORS.TABLE_ALT : undefined,
      })),
    })
  );
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ── Flowchart as Word-compatible Box Diagram ─────────────

function flowBox(text, type = "step", width = 100) {
  const colors = {
    step: { bg: COLORS.FLOW_STEP, border: "93c5fd" },
    decision: { bg: COLORS.FLOW_DECISION, border: "fbbf24" },
    action: { bg: COLORS.FLOW_ACTION, border: "6ee7b7" },
    error: { bg: COLORS.FLOW_ERROR, border: "fca5a5" },
    start: { bg: "c7d2fe", border: COLORS.SECONDARY },
    end: { bg: "d1fae5", border: COLORS.SUCCESS },
  };
  const c = colors[type] || colors.step;
  return new Table({
    rows: [new TableRow({
      children: [new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, size: 20, font: "Calibri", color: COLORS.TEXT, bold: type === "start" || type === "end" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
        })],
        shading: { type: ShadingType.CLEAR, fill: c.bg },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: c.border },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: c.border },
          left: { style: BorderStyle.SINGLE, size: 2, color: c.border },
          right: { style: BorderStyle.SINGLE, size: 2, color: c.border },
        },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
      })]
    })],
    width: { size: width, type: WidthType.PERCENTAGE },
  });
}

function flowArrow(label = "") {
  const text = label ? `  ↓  ${label}` : "  ↓";
  return new Paragraph({
    children: [new TextRun({ text, size: 24, font: "Calibri", color: COLORS.MUTED, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 20, after: 20 },
  });
}

function flowBranch(leftLabel, rightLabel) {
  return new Table({
    rows: [new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: `← ${leftLabel}`, size: 20, font: "Calibri", color: COLORS.SUCCESS, bold: true })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: `${rightLabel} →`, size: 20, font: "Calibri", color: COLORS.DANGER, bold: true })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        }),
      ],
    })],
    width: { size: 80, type: WidthType.PERCENTAGE },
  });
}

function sectionDivider(title) {
  return new Table({
    rows: [new TableRow({
      children: [new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: `  ${title}  `, size: 20, font: "Calibri", color: COLORS.WHITE, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 20 },
        })],
        shading: { type: ShadingType.CLEAR, fill: COLORS.SECONDARY },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.SECONDARY },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.SECONDARY },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.SECONDARY },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.SECONDARY },
        },
      })]
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ══════════════════════════════════════════════════════════
//   BUILD DOCUMENT
// ══════════════════════════════════════════════════════════

async function buildDocument() {
  const doc = new Document({
    creator: "Placement Portal Analysis",
    title: "Placement Portal — Complete Project Analysis Report",
    description: "Comprehensive file-by-file analysis of the Placement Portal project",
    styles: {
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: "Calibri", size: 22 } },
      ],
    },
    numbering: {
      config: [{
        reference: "default-numbering",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT }],
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(0.9), right: convertInchesToTwip(0.9) },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: "Placement Portal — Project Analysis Report", size: 16, font: "Calibri", color: COLORS.MUTED, italics: true })],
            alignment: AlignmentType.RIGHT,
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Page ", size: 16, font: "Calibri", color: COLORS.MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Calibri", color: COLORS.MUTED }),
              new TextRun({ text: " of ", size: 16, font: "Calibri", color: COLORS.MUTED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Calibri", color: COLORS.MUTED }),
            ],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: [

        // ═══════════════════════════════════════
        //  COVER PAGE
        // ═══════════════════════════════════════
        emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({
          children: [new TextRun({ text: "PLACEMENT PORTAL", size: 56, font: "Calibri", color: COLORS.PRIMARY, bold: true })],
          alignment: AlignmentType.CENTER, spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Complete Project Analysis Report", size: 36, font: "Calibri", color: COLORS.SECONDARY })],
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
        }),
        new Table({
          rows: [new TableRow({
            children: [new TableCell({
              children: [new Paragraph({ text: "", spacing: { after: 0 } })],
              shading: { type: ShadingType.CLEAR, fill: COLORS.PRIMARY },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            })]
          })],
          width: { size: 60, type: WidthType.PERCENTAGE },
        }),
        emptyLine(),
        para("Full-Stack MERN Application (MongoDB, Express, React, Node.js)", { align: AlignmentType.CENTER, color: COLORS.MUTED, size: 24 }),
        para("with AI/OCR Integration (Ollama LLaMA 3, Tesseract, Custom Python Pipeline)", { align: AlignmentType.CENTER, color: COLORS.MUTED, size: 22 }),
        emptyLine(), emptyLine(),
        para("Generated: July 2026", { align: AlignmentType.CENTER, color: COLORS.MUTED }),
        para("Source Files Analyzed: 300+", { align: AlignmentType.CENTER, color: COLORS.MUTED }),
        para("Database Collections: 18", { align: AlignmentType.CENTER, color: COLORS.MUTED }),
        para("Application Routes: 80+", { align: AlignmentType.CENTER, color: COLORS.MUTED }),

        pageBreak(),

        // ═══════════════════════════════════════
        //  TABLE OF CONTENTS
        // ═══════════════════════════════════════
        heading("Table of Contents"),
        para("1.  Project Overview", { bold: true }),
        para("2.  Technology Stack", { bold: true }),
        para("3.  System Architecture", { bold: true }),
        para("4.  Application Flow Diagrams", { bold: true }),
        para("    4.1  Authentication & Login Flow", {}),
        para("    4.2  Student Registration Flow", {}),
        para("    4.3  Semester Marksheet Upload & OCR Processing Flow", {}),
        para("    4.4  Company Drive & Placement Flow", {}),
        para("    4.5  Resume Builder & ATS Checker Flow", {}),
        para("    4.6  Notification System Flow", {}),
        para("5.  Frontend Analysis (File-by-File)", { bold: true }),
        para("    5.1  Root-Level Pages", {}),
        para("    5.2  Admin Pages (97 files)", {}),
        para("    5.3  Coordinator Pages (62 files)", {}),
        para("    5.4  Student Pages (28 files)", {}),
        para("6.  Backend Analysis (File-by-File)", { bold: true }),
        para("    6.1  Server Core", {}),
        para("    6.2  API Routes (17 files)", {}),
        para("    6.3  Backend Services (12 files)", {}),
        para("    6.4  Mail Service", {}),
        para("    6.5  AI Service (Python)", {}),
        para("    6.6  OCR Service (Python)", {}),
        para("7.  Database Schema Analysis (18 Collections)", { bold: true }),
        para("8.  AI & OCR Services", { bold: true }),
        para("9.  Security & Authentication", { bold: true }),
        para("10. Notification System", { bold: true }),
        para("11. Shared Components Library", { bold: true }),
        para("12. Custom Hooks & Utilities", { bold: true }),
        para("13. Styling Architecture", { bold: true }),
        para("14. Performance Optimizations", { bold: true }),
        para("15. Deployment & DevOps", { bold: true }),
        para("16. Summary Statistics", { bold: true }),

        pageBreak(),

        // ═══════════════════════════════════════
        //  1. PROJECT OVERVIEW
        // ═══════════════════════════════════════
        heading("1. Project Overview"),
        para("The Placement Portal is a comprehensive, enterprise-grade web application designed for college placement cells. It manages the complete lifecycle of campus recruitment — from student registration and academic tracking through company drive management, training scheduling, resume building, and placement analytics."),
        para("The system supports three distinct user roles: Admin, Coordinator, and Student, each with dedicated dashboards, workflows, and permissions."),
        emptyLine(),
        heading("Core Capabilities", HeadingLevel.HEADING_2),
        makeTable(
          ["Module", "Description"],
          [
            ["Student Management", "Registration, profile management, academic records, blocking/unblocking"],
            ["Semester Marksheet System", "PDF upload, OCR extraction, AI-powered grade parsing, review workflow"],
            ["Company Drives", "Company profile management, drive scheduling, multi-round tracking, eligibility filtering"],
            ["Placement Tracking", "Placed students, offer letters, acceptance/rejection workflow"],
            ["Resume Builder", "In-app resume builder, ATS (Applicant Tracking System) checker, AI-powered analysis"],
            ["Training & Attendance", "Training program scheduling, batch-wise attendance, training history"],
            ["Report & Analytics", "Department-wise, company-wise, student-wise, and resume analysis reports"],
            ["Notification System", "Certificate approvals, drive scheduling, offer letters, block status, semester upload alerts"],
            ["Mail & OTP System", "Centralized email with templates, OTP-based verification, multi-provider support"],
            ["Data Archiving", "Batch zipping, department-wise archiving, historical record management"],
          ],
          [25, 75]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  2. TECHNOLOGY STACK
        // ═══════════════════════════════════════
        heading("2. Technology Stack"),

        heading("Frontend Technologies", HeadingLevel.HEADING_2),
        makeTable(
          ["Technology", "Version", "Purpose"],
          [
            ["React", "19.1.0", "UI framework (latest concurrent features)"],
            ["React Router DOM", "7.9.3", "Client-side routing with role guards"],
            ["Material UI (MUI)", "7.3.2", "Component library + Date Pickers"],
            ["Framer Motion", "12.23.11", "Animations and transitions"],
            ["Recharts", "3.6.0", "Data visualization/charts"],
            ["React Icons", "5.5.0", "Icon library"],
            ["styled-components", "6.1.19", "CSS-in-JS (selective use)"],
            ["Day.js", "1.11.18", "Date manipulation"],
            ["jsPDF + AutoTable", "3.0.4", "PDF generation from client"],
            ["html2canvas", "1.4.1", "Screenshot/canvas capture"],
            ["XLSX", "0.18.5", "Excel file parsing/generation"],
            ["pdfjs-dist", "5.4.296", "Client-side PDF rendering"],
            ["pdf-lib", "1.17.1", "PDF document manipulation"],
            ["canvas-confetti", "1.9.4", "Celebration animations"],
            ["react-easy-crop", "5.5.6", "Image cropping for profile photos"],
            ["react-datepicker", "8.7.0", "Date picker component"],
            ["flatpickr", "4.6.13", "Alternative date picker"],
            ["react-minimal-pie-chart", "9.1.1", "Lightweight pie charts"],
            ["JSZip", "3.10.1", "ZIP file creation on client"],
          ],
          [25, 15, 60]
        ),

        emptyLine(),
        heading("Backend Technologies", HeadingLevel.HEADING_2),
        makeTable(
          ["Technology", "Version", "Purpose"],
          [
            ["Node.js", "24.9.0", "JavaScript runtime"],
            ["Express", "5.1.0", "Web framework"],
            ["MongoDB", "—", "Primary database"],
            ["Mongoose", "8.19.1", "MongoDB ODM (Object Document Mapper)"],
            ["JSON Web Token", "9.0.2", "Authentication tokens"],
            ["bcryptjs", "2.4.3", "Password hashing"],
            ["Multer", "1.4.5", "File upload handling"],
            ["multer-gridfs-storage", "5.0.2", "GridFS file storage for large files"],
            ["Nodemailer", "9.0.3", "Email sending (Gmail SMTP)"],
            ["pdf-parse", "1.1.1", "Server-side PDF text extraction"],
            ["pdf-to-img", "5.0.0", "PDF to image conversion for OCR"],
            ["Tesseract.js", "7.0.0", "OCR (Optical Character Recognition)"],
            ["Puppeteer", "24.37.3", "Headless browser for PDF rendering"],
            ["Axios", "1.12.2", "HTTP client for AI service calls"],
            ["BullMQ", "5.21.4", "Job queue for async processing"],
            ["IORedis", "5.6.1", "Redis client for BullMQ"],
            ["Joi", "17.11.0", "Request validation schemas"],
            ["fastest-levenshtein", "1.0.16", "Fuzzy text matching for OCR"],
            ["CORS", "2.8.5", "Cross-origin resource sharing"],
          ],
          [25, 15, 60]
        ),

        emptyLine(),
        heading("AI & ML Services (Python)", HeadingLevel.HEADING_2),
        makeTable(
          ["Technology", "Purpose"],
          [
            ["Ollama (LLaMA 3:8b)", "Local AI model for resume analysis, academic advising, feedback generation"],
            ["FastAPI / Flask", "Python AI microservice REST API"],
            ["Tesseract OCR", "Marksheet text extraction from scanned PDFs"],
            ["Custom OCR Pipeline", "Column segmentation, row clustering, subject parsing"],
            ["ATS Engine (ats.py)", "Applicant Tracking System compatibility scoring"],
            ["Resume Engine", "Resume evaluation, structure analysis, and suggestions"],
            ["Feedback Engine", "AI-powered actionable improvement feedback"],
            ["Student Filter Engine", "Smart student eligibility matching for drives"],
          ],
          [30, 70]
        ),

        emptyLine(),
        heading("DevOps & Build Tools", HeadingLevel.HEADING_2),
        makeTable(
          ["Tool", "Purpose"],
          [
            ["Create React App", "React build tooling"],
            ["Stylelint", "CSS linting and code quality"],
            ["ESLint", "JavaScript linting"],
            ["Concurrently", "Run frontend + backend in parallel"],
            ["cross-env", "Cross-platform environment variables"],
            ["PostCSS + Autoprefixer", "CSS processing and vendor prefixing"],
            ["Docker", "Container deployment (backend + AI services)"],
            ["Vercel", "Frontend static deployment"],
            ["Render", "Backend server deployment"],
            ["Nodemon", "Backend hot-reload during development"],
          ],
          [30, 70]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  3. SYSTEM ARCHITECTURE
        // ═══════════════════════════════════════
        heading("3. System Architecture"),

        heading("High-Level Architecture", HeadingLevel.HEADING_2),
        para("The system follows a layered architecture with four main tiers:", { after: 120 }),

        sectionDivider("CLIENT LAYER — React Single-Page Application"),
        emptyLine(),
        makeTable(
          ["Component", "Technology", "Description"],
          [
            ["React SPA", "React 19 + Router 7", "Single-page application with role-based views"],
            ["Admin Dashboard", "Lazy-loaded", "51 admin page components, student DB, drives, reports"],
            ["Coordinator Dashboard", "Lazy-loaded", "31 coordinator page components, semester mgmt, certificates"],
            ["Student Dashboard", "Lazy-loaded", "14 student page components, resume builder, ATS checker"],
            ["Shared Components", "23 component dirs", "Navbar, Sidebar, Notifications, Forms, Tables, Cards"],
          ],
          [22, 20, 58]
        ),
        emptyLine(),

        sectionDivider("API LAYER — Express 5 REST Server"),
        emptyLine(),
        makeTable(
          ["Component", "Description"],
          [
            ["server-mongodb.js (513KB)", "Monolithic backend with 12,356 lines — all REST endpoints"],
            ["17 Route Modules", "Modular route files for resume, marksheets, OTP, GridFS, etc."],
            ["JWT Auth Middleware", "Token verification on every protected request"],
            ["Multer + GridFS", "File upload handling with MongoDB GridFS for large files"],
            ["Joi Validation", "Request body validation schemas"],
          ],
          [30, 70]
        ),
        emptyLine(),

        sectionDivider("DATA LAYER — MongoDB + GridFS"),
        emptyLine(),
        makeTable(
          ["Component", "Description"],
          [
            ["MongoDB (18 Collections)", "Students, Users, Admins, Marksheets, Resumes, Drives, etc."],
            ["GridFS File Storage", "Stores PDFs, images, certificates, offer letters (streaming)"],
            ["40+ Database Indexes", "Optimized for fast queries on regNo, department, batch"],
            ["Mongoose ODM", "Schema validation, pre-save hooks, virtual fields"],
          ],
          [30, 70]
        ),
        emptyLine(),

        sectionDivider("AI/ML LAYER — Ollama + Python Services"),
        emptyLine(),
        makeTable(
          ["Component", "Description"],
          [
            ["Ollama (LLaMA 3:8b)", "Local AI model — no API keys, unlimited usage"],
            ["Python OCR Service", "Tesseract + custom pipeline for marksheet extraction"],
            ["ATS Checker Engine", "Resume scoring against Applicant Tracking System criteria"],
            ["Rule-Based Fallback", "Operates when AI services are unavailable"],
          ],
          [30, 70]
        ),

        emptyLine(),
        heading("Request Flow", HeadingLevel.HEADING_2),
        para("Standard API request lifecycle:"),
        flowBox("User interacts with React UI", "start", 70),
        flowArrow(),
        flowBox("React sends API request with JWT token in Authorization header", "step", 70),
        flowArrow(),
        flowBox("Express server receives request → JWT verification → Role authorization", "step", 70),
        flowArrow(),
        flowBox("MongoDB query with lean() for performance (field projections applied)", "step", 70),
        flowArrow(),
        flowBox("JSON response sent back to React → UI re-renders", "end", 70),

        pageBreak(),

        // ═══════════════════════════════════════
        //  4. APPLICATION FLOW DIAGRAMS
        // ═══════════════════════════════════════
        heading("4. Application Flow Diagrams"),

        // ─── 4.1 Auth Flow ───────────────────
        heading("4.1 Authentication & Login Flow", HeadingLevel.HEADING_2),
        para("The application supports three authentication paths based on user role:"),
        emptyLine(),

        flowBox("Landing Page (LandingPage.jsx)", "start", 70),
        flowArrow("User clicks Login or Signup"),
        flowBox("Main Login Page (mainlogin.jsx) — Select Role: Student | Coordinator | Admin", "step", 70),
        flowArrow("Enter credentials"),

        makeTable(
          ["Role", "Credential 1", "Credential 2", "Validation Method"],
          [
            ["Student", "Registration Number", "Date of Birth", "DOB match (multi-format: DD-MM-YYYY, DDMMYYYY, ISO)"],
            ["Coordinator", "Coordinator ID", "Password", "bcrypt.compare() hash verification"],
            ["Admin", "Admin Login ID", "Password", "bcrypt.compare() hash verification"],
          ],
          [18, 22, 22, 38]
        ),
        emptyLine(),

        flowArrow("Server validates"),
        flowBox("DECISION: Credentials valid?", "decision", 70),
        flowBranch("YES — Generate JWT (24h expiry)", "NO — Show Error Popup"),
        emptyLine(),

        flowBox("Store JWT + role + userId in localStorage → AuthContext updates", "step", 70),
        flowArrow("ProtectedRoute + RoleGuard check"),
        flowBox("Route to role-specific Dashboard (Student / Coordinator / Admin)", "end", 70),

        emptyLine(),
        para("Security features applied:", { bold: true }),
        bullet("JWT tokens with configurable secret and 24-hour expiration"),
        bullet("Password hashing via bcryptjs for coordinator/admin accounts"),
        bullet("Student authentication uses DOB matching (supports multiple date formats)"),
        bullet("RoleGuard component prevents unauthorized route access"),
        bullet("Block status monitoring via periodic polling"),

        pageBreak(),

        // ─── 4.2 Registration Flow ──────────────
        heading("4.2 Student Registration Flow", HeadingLevel.HEADING_2),
        para("New student registration follows a multi-step wizard pattern with OTP verification:"),
        emptyLine(),

        flowBox("MainSignUp.jsx — Enter Email + Registration Number", "start", 70),
        flowArrow("Submit"),
        flowBox("Server generates OTP → Sends via Nodemailer (Gmail SMTP)", "step", 70),
        flowArrow("OTP arrives in student's email"),
        flowBox("Student enters OTP → Server verifies (hashed, max 3 attempts, TTL auto-expiry)", "step", 70),
        flowArrow("OTP verified successfully"),
        flowBox("MainRegistration.jsx — 4-Step Registration Wizard Begins", "action", 70),
        emptyLine(),

        makeTable(
          ["Step", "Section", "Key Fields"],
          [
            ["Step 1", "Personal Information", "Name, Gender, DOB (Calendar Picker), Mobile, Email, Address, Blood Group"],
            ["Step 2", "Academic Details", "Batch, Branch, Degree, Year, Semester, Section, 10th/12th/Diploma details"],
            ["Step 3", "Family Details", "Father/Mother/Guardian names, occupations, mobile numbers, Aadhaar"],
            ["Step 4", "Login & Other Details", "Login credentials, skills, languages, GitHub, LinkedIn, preferences"],
          ],
          [10, 25, 65]
        ),
        emptyLine(),

        flowArrow("Complete all 4 steps"),
        flowBox("Profile Photo Upload (with react-easy-crop) + Certificate Upload", "step", 70),
        flowArrow("Submit registration"),
        flowBox("DECISION: Server validation — all required fields present?", "decision", 70),
        flowBranch("YES — Save to MongoDB Students collection", "NO — Show validation errors"),
        emptyLine(),
        flowBox("Registration Success Popup (with confetti animation) → Redirect to Dashboard", "end", 70),

        pageBreak(),

        // ─── 4.3 Marksheet OCR Flow ─────────────
        heading("4.3 Semester Marksheet Upload & OCR Processing Flow", HeadingLevel.HEADING_2),
        para("This is one of the most complex flows in the application — it processes PDF marksheets through an OCR pipeline:"),
        emptyLine(),

        flowBox("Coordinator uploads PDF marksheet (Coo_MarksheetUpload.jsx)", "start", 70),
        flowArrow("POST /api/marksheets/upload via Multer"),
        flowBox("Store PDF in MongoDB GridFS (streaming, no memory limit)", "step", 70),
        flowArrow("Trigger extraction pipeline"),
        flowBox("DECISION: PDF type detection — Text-based or Scanned Image?", "decision", 70),
        emptyLine(),

        makeTable(
          ["PDF Type", "Extraction Method", "Tool Used"],
          [
            ["Text-based PDF", "Direct text extraction", "pdf-parse library"],
            ["Scanned/Image PDF", "OCR with preprocessing", "Tesseract.js + Custom Pipeline"],
            ["Complex multi-column", "Advanced column segmentation", "Python OCR Service (column_segment.py + row_cluster.py)"],
          ],
          [22, 30, 48]
        ),
        emptyLine(),

        flowArrow("Raw text extracted"),
        flowBox("Subject Parser (subject_parse.py) — Extract course codes, names, grades, credits", "step", 70),
        flowArrow("Parsed records"),
        flowBox("Subject Normalizer — Standardize names against Subject Master database", "step", 70),
        flowArrow("Fuzzy matching"),
        flowBox("Levenshtein Distance Matching — Match OCR output to known subjects", "step", 70),
        flowArrow("Calculate confidence"),
        flowBox("DECISION: Confidence Score above 80%?", "decision", 70),
        flowBranch("HIGH (>80%) — Auto-accept records", "LOW (<80%) — Flag for manual review"),
        emptyLine(),

        makeTable(
          ["Outcome", "Collection", "Next Step"],
          [
            ["Auto-accepted", "StudentMarksheet", "Update student SGPA/CGPA → Update arrear history → Send notification"],
            ["Needs review", "MarksheetReview", "Coordinator reviews manually → Approve or Reject"],
            ["Corrections applied", "CorrectionMemory", "System learns from corrections for future extractions"],
            ["Changes tracked", "AuditTrail", "Before/after values recorded for every field change"],
          ],
          [20, 25, 55]
        ),

        pageBreak(),

        // ─── 4.4 Company Drive Flow ─────────────
        heading("4.4 Company Drive & Placement Flow", HeadingLevel.HEADING_2),
        para("End-to-end flow from company registration to student placement:"),
        emptyLine(),

        flowBox("Admin creates Company Profile (AdminCompanyprofile.jsx)", "start", 70),
        flowArrow("Add drive details"),
        flowBox("Schedule Drive — Set eligibility criteria, rounds, dates (AdminCompanyDriveAD.jsx)", "step", 70),
        flowArrow("Filter students"),
        flowBox("Eligibility Engine filters students (CGPA ≥ cutoff, branch match, batch match, no active backlogs)", "step", 70),
        flowArrow("Notify eligible students"),
        flowBox("Send notifications + emails to eligible students", "action", 70),
        flowArrow("Students view in Company page"),
        flowBox("Drive Day — Mark attendance for each round (AdminAttendance.jsx)", "step", 70),
        flowArrow("Record round results"),
        flowBox("Multi-round tracking — Each round has qualified/disqualified lists", "step", 70),
        flowArrow("All rounds complete"),
        flowBox("Mark Placed Students — Assign company, role, package (AdminPlacedStudents.jsx)", "action", 70),
        flowArrow("Upload offer letters"),
        flowBox("Upload Offer Letters (stored in GridFS) → Send notification to students", "step", 70),
        flowArrow("Generate reports"),
        flowBox("Placement Analytics — Company-wise, Department-wise, Student-wise reports", "end", 70),

        pageBreak(),

        // ─── 4.5 Resume Builder Flow ────────────
        heading("4.5 Resume Builder & ATS Checker Flow", HeadingLevel.HEADING_2),
        para("Students can build, analyze, and optimize their resumes within the portal:"),
        emptyLine(),

        flowBox("Student opens Resume Builder (ResumeBuilder.jsx — 107KB)", "start", 70),
        flowArrow("Fill sections"),

        makeTable(
          ["Section", "Fields", "Features"],
          [
            ["Personal Info", "Name, email, phone, LinkedIn, GitHub", "Auto-populated from profile"],
            ["Education", "College, degree, CGPA, year", "Pre-filled from academic records"],
            ["Experience", "Company, role, duration, description", "Multiple entries supported"],
            ["Projects", "Title, tech stack, description, link", "Multiple entries with drag-reorder"],
            ["Skills", "Technical skills, soft skills, tools", "Skill tag picker with suggestions"],
            ["Certifications", "Name, issuer, date, credential ID", "Links to uploaded certificates"],
          ],
          [18, 35, 47]
        ),
        emptyLine(),

        flowArrow("Live preview renders in real-time"),
        flowBox("DECISION: Student action — Download PDF | Save to DB | Run ATS Check", "decision", 70),
        emptyLine(),

        makeTable(
          ["Action", "Implementation", "Output"],
          [
            ["Download PDF", "jsPDF + html2canvas generates PDF on client", "Downloadable .pdf file"],
            ["Save Resume", "POST /api/resume-builder — saves form data + GridFS PDF", "Stored in Resume collection"],
            ["ATS Check", "Extract text → Send to AI analysis engine", "ATS score + suggestions"],
          ],
          [20, 45, 35]
        ),
        emptyLine(),

        para("ATS Analysis Pipeline:", { bold: true }),
        flowBox("Extract resume text content", "step", 70),
        flowArrow("Check AI availability"),
        flowBox("DECISION: Ollama AI available?", "decision", 70),
        flowBranch("YES → Ollama LLaMA 3 analysis", "NO → Rule-based fallback"),
        emptyLine(),
        flowBox("Score resume: Overall Score, Categories (Format/Content/Skills), Suggestions, Strengths, Critical Fixes", "action", 70),
        flowArrow("Save results"),
        flowBox("Store analysis in ResumeAnalysis collection → Display results to student", "end", 70),

        pageBreak(),

        // ─── 4.6 Notification Flow ──────────────
        heading("4.6 Notification System Flow", HeadingLevel.HEADING_2),
        para("The portal has a comprehensive real-time notification system with 25 notification components:"),
        emptyLine(),

        heading("Student Notifications (6 Checkers)", HeadingLevel.HEADING_3),
        makeTable(
          ["Checker Component", "What It Monitors", "Display Component"],
          [
            ["GlobalNotificationChecker", "Certificate approval/rejection events", "CertificateStatusBanner"],
            ["GlobalPlacementBannerChecker", "Placement confirmations and status changes", "PlacementStatusBanner"],
            ["GlobalDriveScheduledChecker", "New company drives scheduled for student's branch", "DriveScheduledBanner"],
            ["GlobalOfferLetterNotificationChecker", "Offer letters uploaded by admin/coordinator", "OfferLetterBanner"],
            ["GlobalSemesterNotificationChecker", "New semester marksheet data uploaded", "DB Notification collection"],
            ["GlobalTrainingNotificationChecker", "Training sessions scheduled for student's batch", "TrainingBanner"],
          ],
          [32, 40, 28]
        ),
        emptyLine(),

        heading("Coordinator Notifications (2 Checkers)", HeadingLevel.HEADING_3),
        makeTable(
          ["Checker Component", "What It Monitors"],
          [
            ["GlobalCoordinatorCertificateUploadChecker", "Students uploading new certificates for verification"],
            ["GlobalCoordinatorDriveScheduledChecker", "New drives scheduled involving coordinator's department"],
          ],
          [45, 55]
        ),
        emptyLine(),

        heading("Admin/Coordinator Shared (1 Checker)", HeadingLevel.HEADING_3),
        makeTable(
          ["Checker Component", "What It Monitors"],
          [
            ["GlobalBlockNotificationChecker", "Student block/unblock events requiring attention"],
          ],
          [45, 55]
        ),
        emptyLine(),

        para("All notification checkers run as background polling services mounted at the App.jsx level. They only activate for authenticated users on non-public routes."),

        pageBreak(),

        // ═══════════════════════════════════════
        //  5. FRONTEND ANALYSIS
        // ═══════════════════════════════════════
        heading("5. Frontend Analysis (File-by-File)"),

        heading("5.1 Root-Level Pages (src/)", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Lines", "Description"],
          [
            ["App.jsx", "460", "Main application router. Defines all 80+ routes. Implements lazy-loading, role-based favicon, HTML theme classes, global notification checkers."],
            ["index.jsx", "16", "React entry point. Mounts App via ReactDOM.createRoot with web vitals."],
            ["LandingPage.jsx", "1,269", "Public landing page. Hero section with dynamic college images from GridFS, placed students carousel, company drives, team section, footer."],
            ["mainlogin.jsx", "~700", "Login page. Role-based login for Student (RegNo + DOB), Coordinator (ID + Password), Admin (ID + Password). OTP verification flow."],
            ["MainSignUp.jsx", "~160", "Signup page. Email + registration number collection, OTP email trigger."],
            ["MainRegistration.jsx", "~4,100", "Multi-step registration form (137KB). 4-step wizard: Personal → Academic → Family → Login. DOB picker, photo upload with cropping, certificate uploads."],
            ["MainRegistrationPopUp.jsx", "~80", "Registration success popup with confetti animation."],
            ["MailStatusPage.jsx", "~320", "Mail delivery status page. Real-time polling for OTP/email delivery with retry."],
          ],
          [22, 8, 70]
        ),

        pageBreak(),

        heading("5.2 Admin Pages (src/AdminPages/) — 97 Files", HeadingLevel.HEADING_2),
        para("The Admin module is the largest section with 48 JSX components and 49 CSS modules:"),
        emptyLine(),

        heading("Dashboard & Profile", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["Admin_Dashboard.jsx", "18KB", "Dashboard with overview cards: total students, coordinators, companies, drives, placed count"],
            ["AdminmainProfile.jsx", "180KB", "Admin profile management. College images (banner, NAAC, NBA, logo), profile photo upload"],
            ["AdminDBprofile.jsx", "105KB", "Complex database profile management with multiple sections"],
          ],
          [30, 10, 60]
        ),
        emptyLine(),

        heading("Student Management", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["AdminstudDB.jsx", "82KB", "Student database browser. Paginated table, search, filter by department/batch, bulk block/unblock"],
            ["AdminStuProfileView.jsx", "202KB", "Full read-only view of student data (personal, academic, family, marks, certificates, resume)"],
            ["AdminStuProfileEdit.jsx", "244KB", "LARGEST FILE. Full edit capabilities with field-level change tracking and validation"],
            ["AdminEsstudapp.jsx", "48KB", "Student application view. Individual drive applications and status"],
            ["AdminEligiblestudents.jsx", "45KB", "Filter students by eligibility criteria for specific company drives"],
            ["AdminExcelStudentUpload.jsx", "32KB", "Bulk student upload via Excel spreadsheets (XLSX parsing)"],
            ["AdminSemesterMarksheetView.jsx", "27KB", "View extracted marksheet data per student semester"],
            ["AdminSemesterMarksheetEdit.jsx", "24KB", "Edit extracted marksheet data, correct OCR errors"],
          ],
          [30, 10, 60]
        ),
        emptyLine(),

        heading("Company & Drives", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["AdminCompanyprofile.jsx", "42KB", "Company profile listing with search and pagination"],
            ["AdminCompanyprofilepopup.jsx", "29KB", "Company profile add/edit/view popup with logo upload"],
            ["AdminCompanyDrive.jsx", "84KB", "All drives listing, filter by status/company"],
            ["AdminCompanyDriveAD.jsx", "63KB", "Add/edit drive. Multi-round config, eligibility criteria, scheduling"],
            ["AdminCompanyDrivedet.jsx", "60KB", "Drive details. Round-by-round status, eligible/applied/placed breakdown"],
          ],
          [30, 10, 60]
        ),
        emptyLine(),

        heading("Attendance & Placement", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["AdminAttendance.jsx", "51KB", "Drive-wise attendance records with present/absent tracking"],
            ["Admin_Attendance_Stdinfo.jsx", "63KB", "Detailed student attendance across all drives"],
            ["AdminPlacedStudents.jsx", "32KB", "Placed students list: company, role, package, offer status"],
          ],
          [30, 10, 60]
        ),
        emptyLine(),

        heading("Reports & Analytics", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["AdminRARW.jsx", "33KB", "Report Analysis — Resume Wise. ATS score reports"],
            ["AdminRACW.jsx", "34KB", "Report Analysis — Company Wise. Company placement analytics"],
            ["AdminRADW.jsx", "31KB", "Report Analysis — Department Wise. Department-level statistics"],
            ["AdminRASW.jsx", "41KB", "Report Analysis — Student Wise. Individual student analysis"],
          ],
          [30, 10, 60]
        ),
        emptyLine(),

        heading("Coordinator Management", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["AdAddCoordinatorform.jsx", "140KB", "Full coordinator creation with department assignment, credential setup"],
            ["AdExistingCoordinator.jsx", "51KB", "Manage coordinators per branch: view, edit, block/unblock"],
            ["AdAddBranchPage.jsx", "18KB", "Create new academic branches/departments"],
            ["AdAddBranchMainPage.jsx", "10KB", "Branch overview with coordinator counts per department"],
            ["AdminABviewcoo.jsx", "15KB", "View individual coordinator details"],
          ],
          [30, 10, 60]
        ),
        emptyLine(),

        heading("Training Management", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["Admin_Training.jsx", "50KB", "Training programs listing with status tracking"],
            ["Admin_Training_Company.jsx", "41KB", "Company-specific training details and student lists"],
            ["Admin_Add_Training.jsx", "22KB", "Create training programs with batch assignment"],
            ["Admin_Schedule_Training.jsx", "45KB", "Calendar-based scheduling with batch selection"],
            ["Admin_schedule_training_batch.jsx", "44KB", "Batch-wise training scheduling"],
            ["Admin_History_Training.jsx", "48KB", "Historical training records with attendance analytics"],
            ["Admin_Preferred_Training_button.jsx", "35KB", "Student training preference tracking"],
            ["Admin_Trainings_Archive.jsx", "12KB", "Archived training programs"],
            ["Admin_TrainAttendanceStuinfo.jsx", "28KB", "Training attendance per student"],
          ],
          [34, 8, 58]
        ),
        emptyLine(),

        heading("Data Archiving (ZIP)", HeadingLevel.HEADING_3),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["Ad_ActiveZip.jsx", "23KB", "Current batch archiving operations"],
            ["Ad_ZipActive_Batches_Department.jsx", "23KB", "Department-wise active batch zipping"],
            ["Ad_Zipped_Batches.jsx", "27KB", "Browse archived (graduated) batches"],
            ["Ad_Zipped_Batch_Departments_View.jsx", "29KB", "Departments in archived batches"],
            ["Ad_Zipped_Batch_Department_Students.jsx", "25KB", "Students in archived batch departments"],
            ["Ad_Zipped_Batch_Department_Details.jsx", "24KB", "Detailed view of archived department data"],
            ["Ad_Zipping_History.jsx", "16KB", "Audit trail of all archive operations"],
          ],
          [38, 8, 54]
        ),

        pageBreak(),

        heading("5.3 Coordinator Pages (src/CoordinatorPages/) — 62 Files", HeadingLevel.HEADING_2),
        para("Coordinator pages are scoped to their assigned department:"),
        emptyLine(),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["Coo_Dashboard.jsx", "20KB", "Department-scoped dashboard overview"],
            ["Coo_ManageStudents.jsx", "75KB", "Department-filtered student list with search, pagination"],
            ["Coo_ManageStudentSemesterEdit.jsx", "234KB", "2nd LARGEST FILE. Full semester marksheet editing"],
            ["Coo_ManageStudentsSemester_new.jsx", "45KB", "Semester management overview with upload history"],
            ["Coo_ManageStudentView.jsx", "31KB", "Individual student profile viewer"],
            ["Coo_CompanyProfile.jsx", "35KB", "Company profiles (read-only for coordinators)"],
            ["Coo_CompanyProfilePage.jsx", "15KB", "Individual company profile details"],
            ["Coo_CompanyDrive.jsx", "51KB", "Department-relevant company drives"],
            ["Coo_CompanyDriveView.jsx", "15KB", "Drive details view"],
            ["Coo_CertificateVerification.jsx", "53KB", "Approve/reject student certificates"],
            ["Coo_Eligiblestudents.jsx", "38KB", "Filter eligible students for drives"],
            ["Coo_EligibleStuViewpage.jsx", "21KB", "Eligible student detail view"],
            ["Coo_Attendance.jsx", "29KB", "Department attendance management"],
            ["Coo_PlacedStudents.jsx", "24KB", "Department-wise placed students"],
            ["Coo_Profile.jsx", "69KB", "Coordinator personal profile management"],
            ["Coo_MS_Sem.jsx", "31KB", "Marksheet semester editor"],
            ["Coo_MS_Sem_profile.jsx", "32KB", "Semester editor with profile context"],
            ["Coo_MS_Editpage.jsx", "28KB", "Individual marksheet edit page"],
            ["Coo_MS_SemesterDetail.jsx", "30KB", "Semester detail viewer"],
            ["Coo_MarksheetUpload.jsx", "19KB", "PDF marksheet upload for OCR"],
            ["CooSemesterHistory.jsx", "36KB", "Semester upload history tracker"],
            ["CooSubjects.jsx", "29KB", "Subject master CRUD (codes, names, credits)"],
            ["Coo_ReportAnalysisCW.jsx", "30KB", "Report — Company Wise"],
            ["Coo_ReportAnalysisRW.jsx", "38KB", "Report — Resume Wise"],
            ["Coo_ReportAnalysisSW.jsx", "29KB", "Report — Student Wise"],
            ["Coo_StuDBCertificateView.jsx", "37KB", "Student certificate viewer"],
            ["Cood_trainDBmain.jsx", "23KB", "Training management for department"],
            ["Coo_TrainAttendanceStuinfo.jsx", "35KB", "Training attendance info"],
            ["Coo_RA_FeedbackView.jsx", "14KB", "Report feedback viewer"],
          ],
          [32, 8, 60]
        ),

        pageBreak(),

        heading("5.4 Student Pages (src/StudentPages/) — 28 Files", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["dashboard.jsx", "18KB", "Student dashboard. Upcoming drives, resume status, placement status, GPA chart"],
            ["StuProfile.jsx", "224KB", "3rd LARGEST FILE. Complete student profile view and edit"],
            ["resume.jsx", "76KB", "Resume management. Upload/download, view analysis, link to builder"],
            ["ResumeBuilder.jsx", "107KB", "In-app resume builder. Section-based editor, live preview, PDF generation"],
            ["ATSChecker.jsx", "38KB", "ATS compatibility checker. Score, suggestions, category breakdown"],
            ["company.jsx", "49KB", "Company drives viewer. Available drives with eligibility status"],
            ["achievements.jsx", "99KB", "Achievements manager. Upload certificates, track awards"],
            ["Training.jsx", "66KB", "Training programs. Scheduled trainings, attendance status"],
            ["StudentSemesterMarksheetView.jsx", "25KB", "Semester marksheet viewer. Grades, SGPA, CGPA, arrears"],
            ["PopUpPending.jsx", "114KB", "Pending items popup. Managing pending certificates/achievements"],
            ["popupEditAchievements.jsx", "32KB", "Achievement edit popup"],
            ["ResumePreviewPage.jsx", "1KB", "Resume preview wrapper page"],
            ["PopupAchievementBuilder.jsx", "2KB", "Achievement builder popup"],
            ["PopupExperience.jsx", "9KB", "Experience entry popup for resume builder"],
            ["PopupProject.jsx", "7KB", "Project entry popup for resume builder"],
            ["PopupCertification.jsx", "4KB", "Certification entry popup"],
            ["PopupAchievements.jsx", "20KB", "Achievements display popup"],
          ],
          [30, 8, 62]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  6. BACKEND ANALYSIS
        // ═══════════════════════════════════════
        heading("6. Backend Analysis (File-by-File)"),

        heading("6.1 Server Core", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["server-mongodb.js", "513KB / 12,356 lines", "Monolithic backend with ALL REST API endpoints: auth, student CRUD, coordinator CRUD, admin CRUD, company profiles, drives, attendance, placement, resume, marksheet upload/extraction/review, semester records, notifications, GridFS storage, training, reports, email/OTP, certificates, archiving, health checks."],
            ["index.js", "113 bytes", "Simple entry point requiring server-mongodb.js"],
            ["config/database.js", "1KB", "MongoDB connection via Mongoose with timeout configs and graceful shutdown"],
          ],
          [22, 18, 60]
        ),

        emptyLine(),
        heading("6.2 API Routes (backend/routes/) — 17 Files", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["resumeBuilder.js", "84KB", "Resume builder API: save/load data, PDF generation, GridFS storage, ATS analysis"],
            ["marksheetsUpload.js", "61KB", "Marksheet upload pipeline: PDF upload, OCR extraction, text parsing, batch processing"],
            ["gridfsRoutes.js", "33KB", "GridFS file operations: upload/download/delete with streaming"],
            ["adminProfile.js", "13KB", "Admin profile CRUD, college image management"],
            ["semester.js", "12KB", "Semester record CRUD, GPA calculations"],
            ["marksheetReview.js", "10KB", "Review queue endpoints: pending → resolved/rejected workflow"],
            ["otp.js", "9KB", "OTP management: generate, verify, resend with rate limiting and TTL"],
            ["health.js", "7KB", "Health checks: server status, DB connection, AI service availability"],
            ["attendance.js", "6KB", "Drive attendance submission and retrieval"],
            ["subjects.js", "6KB", "Subject master CRUD: course codes, names, credits"],
            ["semesterRecords.js", "5KB", "Semester data queries by student, department, batch"],
            ["ocrV1.js", "4KB", "Legacy OCR endpoints"],
            ["aiService.js", "4KB", "AI service proxy to Ollama for resume analysis"],
            ["semesterHistory.js", "4KB", "Upload session tracking"],
            ["semesterNotifications.js", "3KB", "Student-facing semester data alerts"],
            ["marksheetProgress.js", "2KB", "Real-time upload progress tracking"],
          ],
          [22, 8, 70]
        ),

        emptyLine(),
        heading("6.3 Backend Services (backend/services/) — 12 Files", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Size", "Description"],
          [
            ["marksheetExtractionService.js", "13KB", "PDF data extraction pipeline coordinating pdf-parse, Tesseract, and custom OCR"],
            ["semesterAutoSave.js", "10KB", "Periodic auto-save for in-progress semester edits"],
            ["marksheetValidation.js", "7KB", "Validates extracted data against rules (grade ranges, credit sums)"],
            ["subjectNormalizer.js", "6KB", "Standardizes extracted subject names against master list"],
            ["subjectMatcher.js", "6KB", "Fuzzy matching using Levenshtein distance for OCR tolerance"],
            ["mongodbService.js", "6KB", "Connection management and collection access utilities"],
            ["studentFilterService.js", "4KB", "Complex query building for drive eligibility"],
            ["academicAnalytics.js", "3KB", "GPA trends, arrear analysis, batch statistics"],
            ["placementMatcher.js", "2KB", "Match students to drives based on criteria"],
            ["academicAdvisor.js", "1KB", "AI academic improvement suggestions via Ollama"],
          ],
          [28, 8, 64]
        ),

        emptyLine(),
        heading("6.4 Mail Service (backend/services/mail/)", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Description"],
          [
            ["mailService.js", "Centralized mail sender: template rendering, idempotency dedup, audit logging, multi-provider, retry"],
            ["mailTemplates.js", "25KB of HTML email templates: OTP, placement notification, drive scheduling, certificates, offers"],
            ["mailConfig.js", "Nodemailer transporter setup with Gmail SMTP, multi-provider support"],
            ["emailEvents.js", "Event type constants: OTP_VERIFICATION, PLACEMENT_NOTIFICATION, DRIVE_SCHEDULED, etc."],
          ],
          [22, 78]
        ),

        emptyLine(),
        heading("6.5 AI Service (Python — backend/ai-service/)", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Description"],
          [
            ["app.py", "FastAPI/Flask entry point exposing REST endpoints for AI features"],
            ["ats.py (23KB)", "ATS scoring engine — comprehensive resume scoring against ATS criteria"],
            ["resume.py", "AI-powered resume content evaluation"],
            ["grammar.py", "Text quality and grammar analysis for resume content"],
            ["concise.py", "Conciseness analyzer for resume text brevity"],
            ["feedback_engine/", "AI feedback generation module — produces actionable improvement suggestions"],
            ["resume_engine/", "Core resume evaluation logic — template matching, section analysis"],
            ["student_filter_engine/", "Smart student eligibility matching with multi-criteria filters"],
          ],
          [25, 75]
        ),

        emptyLine(),
        heading("6.6 OCR Service (Python — backend/ocr-service/)", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Description"],
          [
            ["ocr_server.py (11KB)", "Flask/FastAPI OCR REST server for marksheet PDF processing"],
            ["subject_parse.py (23KB)", "Subject parser — extracts course codes, names, grades, credits from OCR text"],
            ["column_segment.py", "Multi-column PDF splitting for accurate OCR"],
            ["row_cluster.py", "Semantic row grouping from OCR text lines"],
            ["preprocess.py", "Image preprocessing: deskewing, thresholding, noise removal"],
            ["pdf_text.py", "Direct text extraction for text-based PDFs"],
            ["debug_overlay.py", "Debug visualization with bounding box overlays on OCR results"],
          ],
          [28, 72]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  7. DATABASE SCHEMA
        // ═══════════════════════════════════════
        heading("7. Database Schema Analysis (18 Collections)"),
        para("The application uses MongoDB with Mongoose ODM. All collections have optimized indexes:"),
        emptyLine(),
        makeTable(
          ["Collection", "Model File", "Key Indexes", "Purpose"],
          [
            ["students", "Student.js", "regNo (unique), email, dept, batch, isArchived+dept+batch", "Core student data with 70+ fields"],
            ["users", "User.js", "email (unique), role, coordinatorId, adminId", "Auth credentials for all 3 roles"],
            ["admins", "Admin.js", "adminLoginID (unique), emailId", "Admin profiles with college images (base64)"],
            ["studentmarksheets", "StudentMarksheet.js", "studentId+semester (unique), regNo+semester", "Semester grades with subject-level detail"],
            ["semester", "SemesterRecord.js", "recordKey (unique), regNo+semester+year (unique)", "Semester upload records with batch stats"],
            ["resume", "Resume.js", "studentId, gridfsFileId, regNo+createdAt", "Resume files (GridFS) and builder data"],
            ["resumeanalyses", "ResumeAnalysis.js", "studentId+createdAt, overallScore", "ATS analysis results and AI feedback"],
            ["placed_students", "PlacedStudent.js", "regNo, company, company+batch, dept+batch", "Placement records with offer letters"],
            ["attendances", "Attendance.js", "driveId, students.studentId, students.regNo", "Drive attendance per student"],
            ["subjects", "Subject.js", "courseCode (unique)", "Subject master: codes, names, credits"],
            ["notifications", "Notification.js", "studentId, uploadId, studentId+notificationRead", "Student-facing notification alerts"],
            ["otps", "Otp.js", "expiresAt (TTL auto-delete), email+purpose+role", "OTP records with auto-expiry"],
            ["emaillogs", "EmailLog.js", "recipient, eventType, idempotencyKey (unique)", "Email delivery audit trail"],
            ["marksheetreviews", "MarksheetReview.js", "status+createdAt, regNo+semester", "OCR extraction review queue"],
            ["audittrails", "AuditTrail.js", "marksheetId, timestamp", "Marksheet field change tracking"],
            ["correctionmemories", "CorrectionMemory.js", "field+originalValue+approvalStatus", "OCR correction learning database"],
            ["semesteruploadhistories", "SemUploadHistory.js", "uploadId (unique), coordinatorId", "Upload session tracking"],
            ["marksheetauditlogs", "MarksheetAuditLog.js", "—", "Additional audit logging"],
          ],
          [18, 18, 34, 30]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  8. AI & OCR
        // ═══════════════════════════════════════
        heading("8. AI & OCR Services"),

        heading("AI Integration", HeadingLevel.HEADING_2),
        para("The system uses a multi-provider AI strategy with graceful fallback:"),
        emptyLine(),

        flowBox("User triggers AI action (ATS Check / Resume Analysis / Academic Advising)", "start", 70),
        flowArrow("Check AI availability"),
        flowBox("DECISION: Which AI provider is available?", "decision", 70),
        emptyLine(),

        makeTable(
          ["Priority", "Provider", "Technology", "Characteristics"],
          [
            ["1 (Primary)", "Ollama Local", "LLaMA 3:8b via HTTP (localhost:11434)", "No API keys, unlimited usage, runs locally"],
            ["2 (Secondary)", "Python AI Service", "FastAPI + custom engines", "Specialized ATS/resume/feedback engines"],
            ["3 (Fallback)", "Rule-Based", "free-ai-service.js (23KB)", "No AI dependency, pattern-matching based"],
          ],
          [15, 18, 35, 32]
        ),
        emptyLine(),

        flowBox("Generate: Score, Suggestions, Strengths, Critical Fixes, Overall Tips", "action", 70),
        flowArrow("Save to database"),
        flowBox("Store in ResumeAnalysis collection → Display results to user", "end", 70),

        emptyLine(),
        heading("OCR Pipeline Detail", HeadingLevel.HEADING_2),
        para("The marksheet OCR pipeline handles both text-based and scanned PDFs:"),
        emptyLine(),

        flowBox("PDF received from coordinator upload", "start", 70),
        flowArrow("Detect PDF type"),
        flowBox("DECISION: Does PDF contain selectable text?", "decision", 70),
        flowBranch("YES → pdf-parse (fast, accurate)", "NO → Image extraction + OCR"),
        emptyLine(),
        para("For scanned/image PDFs:", { bold: true }),
        bullet("Image preprocessing: deskewing, contrast enhancement, noise removal (preprocess.py)"),
        bullet("Column segmentation: splits multi-column layouts (column_segment.py)"),
        bullet("Tesseract OCR: extracts raw text from preprocessed images"),
        bullet("Row clustering: groups text lines into semantic rows (row_cluster.py)"),
        bullet("Subject parsing: extracts structured data — course code, name, grade, credits (subject_parse.py)"),
        bullet("Fuzzy matching: matches extracted names to Subject Master using Levenshtein distance"),
        bullet("Confidence scoring: auto-accept (>80%) or flag for manual review (<80%)"),
        bullet("Correction memory: system learns from coordinator corrections for future extractions"),

        pageBreak(),

        // ═══════════════════════════════════════
        //  9. SECURITY
        // ═══════════════════════════════════════
        heading("9. Security & Authentication"),
        makeTable(
          ["Feature", "Implementation", "Details"],
          [
            ["JWT Authentication", "jsonwebtoken v9.0.2", "Configurable secret, 24-hour token expiry, stored in localStorage"],
            ["Password Hashing", "bcryptjs v2.4.3", "Salted hash for coordinator and admin passwords"],
            ["Student Auth", "DOB-based matching", "Multi-format support: DD-MM-YYYY, DDMMYYYY, ISO, Calendar date objects"],
            ["Role-Based Access", "RoleGuard component", "Wraps routes with allowedRoles=['student'|'coordinator'|'admin']"],
            ["Protected Routes", "ProtectedRoute.jsx", "Validates auth state + localStorage session before rendering"],
            ["OTP Verification", "Hashed OTPs in MongoDB", "TTL auto-expiry, max 3 attempts, resend cooldown timer"],
            ["Block/Unblock", "isBlocked field", "Admin/coordinator can block students; real-time polling detects blocks"],
            ["CORS", "cors middleware", "Configured origin restrictions"],
            ["Input Validation", "Joi schemas", "Server-side request body validation"],
            ["Audit Trail", "AuditTrail model", "Before/after tracking on marksheet edits with editor identification"],
            ["Idempotency", "EmailLog + key", "Prevents duplicate email sends using unique idempotency keys"],
          ],
          [20, 22, 58]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  11. SHARED COMPONENTS
        // ═══════════════════════════════════════
        heading("10. Shared Components Library"),
        para("The application has 23 component directories plus standalone components:"),
        emptyLine(),
        makeTable(
          ["Component", "Files", "Description"],
          [
            ["Navbar (5 variants)", "10 files", "LandingNavbar, Navbar (student), Adnavbar (admin), Conavbar (coordinator), mrnavbar (registration)"],
            ["Sidebar (5 variants)", "12 files", "Student (Sidebar), Admin (Adsidebar), Coordinator (Cosidebar), Registration (mrsidebar) with profile photos and cache"],
            ["Calendar", "2 files", "DOBDatePicker with custom blue scrollbar styling"],
            ["LoadingSpinner", "2 files", "Animated spinner with customizable messages"],
            ["UnifiedLoadingScreen", "2 files", "Full-screen overlay during auth transitions"],
            ["SkeletonLoader", "Multiple", "Skeleton placeholders for content loading states"],
            ["CertificateNotification", "25 files", "9 checkers + 7 banners + 4 popups + 5 CSS modules"],
            ["ProtectedRoute", "1 file", "Auth + role guard for route protection"],
            ["RouteErrorBoundary", "1 file", "React Error Boundary for graceful crash handling"],
            ["InteractiveBackground", "2 files", "Animated background for login pages"],
            ["Confetti", "1 file", "Celebration animation using canvas-confetti"],
            ["BlockedPopup", "2 files", "User block notification modal"],
            ["UserNotFoundPopup", "1 file", "Login failure popup with suggestions"],
            ["MarksheetDisplay", "2 files", "Rendered marksheet data view component"],
            ["alerts/", "Multiple", "Toast/alert notification UI"],
            ["button/", "Multiple", "Shared button components"],
            ["card/", "Multiple", "Card UI components"],
            ["dialog/", "Multiple", "Modal/dialog components"],
            ["form/", "Multiple", "Form input components"],
            ["table/", "Multiple", "Data table components"],
            ["filter/", "Multiple", "Filter/search UI components"],
            ["layout/", "Multiple", "Layout wrapper components"],
          ],
          [25, 10, 65]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  12. HOOKS & UTILS
        // ═══════════════════════════════════════
        heading("11. Custom Hooks & Utilities"),

        heading("Custom React Hooks (src/hooks/) — 9 Files", HeadingLevel.HEADING_2),
        makeTable(
          ["Hook", "Purpose"],
          [
            ["useDebounce", "Debounces rapidly changing values (search input) — prevents excessive API calls"],
            ["usePagination", "Pagination logic: page, limit, total, navigation functions"],
            ["useSearch", "Search state management with integrated debouncing"],
            ["useSort", "Column sorting logic with ascending/descending toggle"],
            ["useBreakpoint", "Responsive breakpoint detection for adaptive layouts"],
            ["useConfirmDialog", "Confirmation modal state management (open/close/confirm)"],
            ["useProfileCache", "Profile data caching with localStorage persistence"],
            ["useBannerQueueSlot", "Notification banner queue management (prevents overlap)"],
          ],
          [25, 75]
        ),

        emptyLine(),
        heading("Utility Functions (src/utils/) — 12 Files", HeadingLevel.HEADING_2),
        makeTable(
          ["Utility", "Purpose"],
          [
            ["apiConfig.js", "API base URL resolution for development vs production environments"],
            ["blockStatusChecker.js", "Periodic block status polling for student and coordinator accounts"],
            ["bannerQueueManager.js", "Manages notification banner display queue and priority"],
            ["faviconUtils.js", "Dynamic favicon color based on user role (purple/blue/green/orange)"],
            ["imageCompression.js", "Client-side image compression before upload to reduce bandwidth"],
            ["skillUtils.js", "Skill tag parsing, normalization, and suggestion generation"],
            ["emailUtils.js", "Email validation and formatting utilities"],
            ["cacheMigration.js", "One-time localStorage cleanup for version migrations"],
            ["coordinatorCacheKeys.js", "Scoped cache key management for coordinator-specific data"],
            ["cleanupRegistration.js", "Cleanup temporary registration data on completion/abort"],
            ["useAdminAuth.js", "Admin-specific authentication hook"],
            ["useCoordinatorAuth.js", "Coordinator-specific authentication hook"],
          ],
          [25, 75]
        ),

        emptyLine(),
        heading("Frontend Services (src/services/) — 20 Files", HeadingLevel.HEADING_2),
        makeTable(
          ["Service", "Size", "Description"],
          [
            ["mongoDBService.jsx", "43KB", "Main data service — all API calls to backend"],
            ["authService.jsx", "33KB", "Login, logout, token management, session validation"],
            ["fastDataService.jsx", "22KB", "Optimized data fetching with parallel requests and caching"],
            ["resumeAnalysisService.jsx", "18KB", "ATS checking and AI analysis request client"],
            ["loginDataPreloader.jsx", "17KB", "Pre-fetch profile, sidebar, dashboard data during login"],
            ["landingPageCacheService.js", "13KB", "Cache college images and company drives in localStorage"],
            ["multiProviderService.jsx", "12KB", "Multi-provider AI fallback: Ollama → OpenAI → Rule-based"],
            ["certificateService.jsx", "10KB", "Certificate upload, verification, download APIs"],
            ["collegeImagesService.js", "10KB", "Fetch college images from GridFS"],
            ["gridfsService.js", "10KB", "GridFS file upload/download client"],
            ["adminImageCacheService.jsx", "10KB", "Admin profile photos and college image caching"],
            ["fileStorageService.jsx", "8KB", "Unified file upload/download abstraction"],
            ["aiService.jsx", "6KB", "Frontend AI feature API client"],
          ],
          [28, 8, 64]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  13. STYLING
        // ═══════════════════════════════════════
        heading("12. Styling Architecture"),
        makeTable(
          ["Approach", "Usage", "Description"],
          [
            ["CSS Modules", "All pages + components", "Primary styling. *.module.css ensures no class name collisions"],
            ["Global CSS", "index.css, variables.css, animations.css", "Design tokens, CSS custom properties, shared animations"],
            ["Design System", "styles/tokens/, styles/globals/", "Centralized breakpoints, typography, variables"],
            ["Theme Classes", "admin-theme, coo-theme, stu-theme", "Role-based scrollbar colors applied to <html>"],
            ["styled-components", "Selective use", "CSS-in-JS for dynamic styles in specific components"],
          ],
          [20, 30, 50]
        ),
        emptyLine(),
        para("CSS Isolation Rules:", { bold: true }),
        bullet("Each page uses ONLY its own .module.css file"),
        bullet("No cross-page CSS imports allowed"),
        bullet("No global selector leakages inside CSS modules"),
        bullet("Shared styling only via dedicated shared components"),
        bullet("Build process includes lint:css-leaks check to enforce isolation"),

        pageBreak(),

        // ═══════════════════════════════════════
        //  14. PERFORMANCE
        // ═══════════════════════════════════════
        heading("13. Performance Optimizations"),
        makeTable(
          ["Optimization", "Implementation"],
          [
            ["Lazy Loading", "80+ page components loaded via React.lazy() — only fetched when navigated to"],
            ["Code Splitting", "Role-based chunks: Admin, Coordinator, Student pages load independently"],
            ["Server Pagination", "/api/students returns 50 records per page (not all 3000+ at once)"],
            ["Field Projections", "Heavy binary data (images, PDFs) excluded from list API responses"],
            ["Lean Queries", "Mongoose .lean() returns plain JS objects — 50% faster than Mongoose documents"],
            ["Database Indexes", "40+ indexes across 18 collections for sub-millisecond lookups"],
            ["Client Caching", "localStorage-based caching for college images, profile data, sidebar state"],
            ["Image Compression", "Client-side compression before upload via imageCompression.js"],
            ["Debounced Search", "useDebounce hook prevents excessive API calls during typing"],
            ["Pre-fetching", "loginDataPreloader fetches profile + sidebar + dashboard during login transition"],
            ["GridFS Streaming", "Large files streamed from GridFS (not loaded entirely into memory)"],
            ["Skeleton Loaders", "Visual loading placeholders reduce perceived wait time"],
            ["Suspense Fallbacks", "Every lazy-loaded route has a LoadingSpinner fallback"],
            ["Cache Migration", "One-time cleanup of stale localStorage entries on app update"],
          ],
          [22, 78]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  15. DEPLOYMENT
        // ═══════════════════════════════════════
        heading("14. Deployment & DevOps"),

        heading("Environment Configuration", HeadingLevel.HEADING_2),
        makeTable(
          ["File", "Purpose"],
          [
            ["vercel.json", "Vercel deployment config with SPA rewrites (/api → /api, /* → /index.html)"],
            ["backend/render.yaml", "Render deployment configuration for backend server"],
            ["backend/Dockerfile", "Docker container for Node.js backend"],
            ["backend/ai-service/Dockerfile", "Docker container for Python AI service"],
            ["backend/ocr-service/Dockerfile", "Docker container for Python OCR service"],
            [".env / .env.development / .env.production", "Environment-specific configuration files"],
            ["env.example", "Template: MONGODB_URI, JWT_SECRET, PORT, OLLAMA_URL, CORS_ORIGIN"],
            [".stylelintrc.json", "CSS linting rules for code quality"],
          ],
          [32, 68]
        ),
        emptyLine(),
        heading("npm Scripts", HeadingLevel.HEADING_2),
        makeTable(
          ["Script", "Command", "Description"],
          [
            ["start", "react-scripts start", "Start React dev server on port 3000"],
            ["build", "lint:css-leaks && check:import-case && react-scripts build", "Production build with lint checks"],
            ["dev", "concurrently backend + frontend", "Full-stack development mode"],
            ["start:backend", "cd backend && npm run start:mongodb", "Start Express backend on port 5000"],
            ["lint:css-leaks", "node scripts/check-css-leaks.js", "Check for CSS module isolation violations"],
            ["check:import-case", "node scripts/check-import-case.js", "Verify import casing matches filenames"],
          ],
          [18, 42, 40]
        ),

        pageBreak(),

        // ═══════════════════════════════════════
        //  16. SUMMARY STATISTICS
        // ═══════════════════════════════════════
        heading("15. Summary Statistics"),

        heading("Codebase Metrics", HeadingLevel.HEADING_2),
        makeTable(
          ["Metric", "Count"],
          [
            ["Total Source Files", "300+"],
            ["Admin Pages", "97 files (48 JSX + 49 CSS modules)"],
            ["Coordinator Pages", "62 files (31 JSX + 31 CSS modules)"],
            ["Student Pages", "28 files (14 JSX + 14 CSS modules)"],
            ["Shared Components", "23 component directories"],
            ["Backend Models", "18 Mongoose schemas"],
            ["API Route Files", "17 route modules"],
            ["Backend Services", "12 service modules"],
            ["Frontend Services", "20 service files"],
            ["Custom Hooks", "9 hooks"],
            ["Utility Functions", "12 utility modules"],
            ["Asset Files", "154 icons/images/SVGs"],
            ["Database Indexes", "40+ across all collections"],
            ["Total Routes", "80+ (public + role-protected)"],
            ["npm Dependencies (Frontend)", "39 packages"],
            ["npm Dependencies (Backend)", "17 packages"],
          ],
          [35, 65]
        ),

        emptyLine(),
        heading("Top 10 Largest Files", HeadingLevel.HEADING_2),
        makeTable(
          ["Rank", "File", "Size"],
          [
            ["1", "server-mongodb.js", "513 KB (12,356 lines)"],
            ["2", "AdminStuProfileEdit.jsx", "244 KB"],
            ["3", "Coo_ManageStudentSemesterEdit.jsx", "234 KB"],
            ["4", "StuProfile.jsx", "224 KB"],
            ["5", "AdminStuProfileView.jsx", "202 KB"],
            ["6", "AdminmainProfile.jsx", "180 KB"],
            ["7", "AdAddCoordinatorform.jsx", "140 KB"],
            ["8", "MainRegistration.jsx", "138 KB"],
            ["9", "PopUpPending.jsx", "114 KB"],
            ["10", "ResumeBuilder.jsx", "107 KB"],
          ],
          [10, 55, 35]
        ),

        emptyLine(), emptyLine(),
        sectionDivider("END OF REPORT"),
        emptyLine(),
        para("This report covers every page, component, model, route, service, and utility in the Placement Portal project. All information was extracted directly from source code analysis.", { italics: true, color: COLORS.MUTED }),

      ],
    }],
  });

  // ── Write to file ──────────────────────────────────────
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "..", "Placement_Portal_Project_Report.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`\n✅ Report generated successfully!`);
  console.log(`📄 File: ${outPath}`);
  console.log(`📊 Size: ${(buffer.length / 1024).toFixed(1)} KB\n`);
}

buildDocument().catch(err => {
  console.error("❌ Error generating report:", err);
  process.exit(1);
});
