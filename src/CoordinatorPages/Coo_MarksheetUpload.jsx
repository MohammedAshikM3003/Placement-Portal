import React, { useState, useCallback } from 'react';
import styles from './Coo_MarksheetUpload.module.css';
import Navbar from "../components/Navbar/Conavbar";
import Sidebar from "../components/Sidebar/Cosidebar";
import { CertificatePreviewProgressAlert } from '../components/alerts';
import { joinApiUrl } from '../utils/apiConfig';

/**
 * Coordinator Marksheet Upload Component
 * ─────────────────────────────────────────────────────────
 * Allows coordinators to:
 * 1. Upload semester marksheet PDFs
 * 2. Preview extracted data
 * 3. Match with students
 * 4. Confirm and save to database
 */

const CoordinatorMarksheetUpload = ({ onLogout, onViewChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState('select'); // select | preview | confirming | complete
  const [extractedData, setExtractedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleViewChange = (view) => {
    if (onViewChange && typeof onViewChange === 'function') {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  // ─────────────────────────────────────────────────────────
  // File Upload & Extraction
  // ─────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setErrors(['Only PDF files are supported']);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors(['File size must be less than 10MB']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
  };

  const handleExtractMarksheets = async () => {
    if (!file) {
      setErrors(['Please select a PDF file']);
      return;
    }

    if (!semester) {
      setErrors(['Please select a semester']);
      return;
    }

    setLoading(true);
    setErrors([]);
    setUploadProgress(10);

    let progressTimer = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('semester', semester);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(joinApiUrl('/marksheets/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include'
      });

      let progressTimer = null;
      const startProgress = () => {
        if (progressTimer) return;
        progressTimer = setInterval(() => {
          setUploadProgress((currentProgress) => {
            const max = 94;
            if (currentProgress >= max) return currentProgress;
            const delta = Math.random() * 3 + 0.6;
            return Math.min(max, +(currentProgress + delta).toFixed(1));
          });
        }, 200);
      };
      startProgress();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      // animate to 100
      const animateFinal = () => {
        let rafId = null;
        const frame = () => {
          setUploadProgress((p) => {
            if (p >= 100) {
              if (rafId) cancelAnimationFrame(rafId);
              return 100;
            }
            const remaining = 100 - p;
            const inc = Math.max(0.6, Math.min(6, remaining * 0.08));
            const next = Math.min(100, +(p + inc).toFixed(1));
            return next;
          });
          rafId = requestAnimationFrame(frame);
        };
        frame();
      };

      animateFinal();
      setExtractedData(data);
      setUploadStep('preview');

      if (data.warnings && data.warnings.length > 0) {
        console.warn('Warnings during extraction:', data.warnings);
      }
    } catch (error) {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
      setUploadProgress(0);
      setErrors([error.message || 'Failed to extract marksheets']);
      console.error('Extraction error:', error);
    } finally {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Confirm & Save
  // ─────────────────────────────────────────────────────────
  const handleConfirmUpload = async () => {
    if (!extractedData?.extractedMarksheets || extractedData.extractedMarksheets.length === 0) {
      setErrors(['No marksheets to confirm']);
      return;
    }

    setConfirmLoading(true);
    setErrors([]);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(joinApiUrl('/marksheets/confirm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          marksheets: extractedData.extractedMarksheets,
          semester
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Confirmation failed');
      }

      const data = await response.json();

      setUploadStep('complete');
      setSuccessMessage(
        `Successfully saved marksheets for ${data.saved} students`
      );

      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error) {
      setErrors([error.message || 'Failed to confirm upload']);
      console.error('Confirmation error:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSemester('');
    setUploadStep('select');
    setExtractedData(null);
    setErrors([]);
    setSuccessMessage('');
  };

  const handleGoBack = () => {
    if (uploadStep === 'preview') {
      setUploadStep('select');
      setExtractedData(null);
    } else {
      resetForm();
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render: File Selection Step
  // ─────────────────────────────────────────────────────────
  const renderSelectStep = () => (
    <div className={styles.uploadContainer}>
      <div className={styles.uploadCard}>
        <h2 className={styles.title}>Upload Semester Marksheet PDF</h2>
        
        <div className={styles.form}>
          {/* Semester Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Select Semester <span className={styles.required}>*</span>
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className={styles.select}
            >
              <option value="">-- Choose Semester --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Upload PDF File <span className={styles.required}>*</span>
            </label>
            <div className={styles.fileInputWrapper}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="fileInput"
              />
              <label htmlFor="fileInput" className={styles.fileInputLabel}>
                <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Click to upload or drag and drop</span>
                <span className={styles.fileHint}>PDF files up to 10MB</span>
              </label>
              {file && (
                <div className={styles.fileSelected}>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className={styles.errorBox}>
              {errors.map((err, idx) => (
                <div key={idx} className={styles.errorMessage}>
                  ✕ {err}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <button
              onClick={handleExtractMarksheets}
              disabled={loading || !file || !semester}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              {loading ? 'Extracting...' : 'Extract & Preview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // Render: Preview Step
  // ─────────────────────────────────────────────────────────
  const renderPreviewStep = () => (
    <div className={styles.uploadContainer}>
      <div className={styles.previewCard}>
        <h2 className={styles.title}>Preview Extracted Marksheets</h2>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Total Extracted:</span>
            <span className={styles.value}>{extractedData?.summary?.totalExtracted || 0}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Matched Students:</span>
            <span className={`${styles.value} ${styles.success}`}>
              {extractedData?.summary?.totalMatched || 0}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Warnings:</span>
            <span className={`${styles.value} ${styles.warning}`}>
              {extractedData?.summary?.totalWarnings || 0}
            </span>
          </div>
        </div>

        {/* Warnings */}
        {extractedData?.warnings && extractedData.warnings.length > 0 && (
          <div className={styles.warningsBox}>
            <h3 className={styles.warningTitle}>Issues Found</h3>
            <div className={styles.warningsList}>
              {extractedData.warnings.map((warning, idx) => (
                <div key={idx} className={styles.warningItem}>
                  <strong>{warning.regNo}</strong>: {warning.warning || warning.error || warning.errors?.join(', ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Data Table */}
        <div className={styles.tableContainer}>
          <h3 className={styles.tableTitle}>Extracted Marksheets</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Name</th>
                <th>Subjects</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {extractedData?.extractedMarksheets?.map((marksheet, idx) => (
                <tr key={idx}>
                  <td>{marksheet.regNo}</td>
                  <td>{marksheet.studentName}</td>
                  <td>{marksheet.subjects?.length || 0}</td>
                  <td className={styles.statusMatched}>✓ Matched</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
          <button
            onClick={handleGoBack}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            Back
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={confirmLoading}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            {confirmLoading ? 'Confirming...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // Render: Complete Step
  // ─────────────────────────────────────────────────────────
  const renderCompleteStep = () => (
    <div className={styles.uploadContainer}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>Upload Successful!</h2>
        <p className={styles.successMessage}>{successMessage}</p>
        <button
          onClick={resetForm}
          className={`${styles.button} ${styles.primaryButton}`}
        >
          Upload Another File
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <Navbar onLogout={onLogout} onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        isOpen={isSidebarOpen}
        onLogout={onLogout}
        currentView="manage-marksheets"
        onViewChange={handleViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />

      {isSidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={styles.content}>
        {uploadStep === 'select' && renderSelectStep()}
        {uploadStep === 'preview' && renderPreviewStep()}
        {uploadStep === 'complete' && renderCompleteStep()}
      </div>

      <CertificatePreviewProgressAlert
        isOpen={loading}
        progress={uploadProgress}
        title="Uploading..."
        fileLabel="marksheet"
        messages={{
          initial: 'Extracting subjects from PDF...',
          mid: 'Matching marksheets with students...',
          final: 'Preparing preview...'
        }}
      />
    </div>
  );
};

export default CoordinatorMarksheetUpload;
