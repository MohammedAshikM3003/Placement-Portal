import React from 'react';
import './AlertStyles.css';

const normalizeFileLabel = (label = 'resume') => {
  const safe = (label ?? 'resume').toString().trim();
  const lower = safe ? safe.toLowerCase() : 'resume';
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  return { lower, capitalized };
};

// Download Failed Popup
export const DownloadFailedAlert = ({ isOpen, onClose, color = '#4ea24e' }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          Download Failed !
        </div>
        <div className="achievement-popup-body">
          <div className="download-error-icon-container">
            <svg className="download-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="download-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
              <path className="download-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Download Failed !
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Unable to download the certificate.<br />
            Please try again or contact support.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Certificate-themed helpers -------------------------------------------------
export const CertificateDownloadProgressAlert = ({
  isOpen,
  progress = 25,
  fileLabel = 'certificate',
  title = 'Downloading...',
  messages,
  color = '#008c15',
  progressColor = '#197AFF',
}) => (
  <DownloadProgressAlert
    isOpen={isOpen}
    progress={progress}
    fileLabel={fileLabel}
    title={title}
    messages={messages}
    color={color}
    progressColor={progressColor}
  />
);

export const CertificateDownloadSuccessAlert = ({
  isOpen,
  onClose,
  fileLabel = 'certificate',
  title = 'Downloaded !',
  description,
  color = '#22C55E',
}) => (
  <DownloadSuccessAlert
    isOpen={isOpen}
    onClose={onClose}
    fileLabel={fileLabel}
    title={title}
    description={description}
    color={color}
  />
);

export const CertificatePreviewProgressAlert = ({
  isOpen,
  progress = 25,
  title = 'Previewing...',
  messages,
  color = '#D73D3D',
  progressColor = '#D73D3D',
  fileLabel = 'certificate',
}) => (
  <PreviewProgressAlert
    isOpen={isOpen}
    progress={progress}
    title={title}
    messages={messages}
    color={color}
    progressColor={progressColor}
    fileLabel={fileLabel}
  />
);

export const CertificatePreviewFailedAlert = ({
  isOpen,
  onClose,
  title = 'Preview Failed !',
  message = 'Unable to preview the certificate. Please try downloading it instead.'
}) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#D73D3D' }}>
          {title}
        </div>
        <div className="achievement-popup-body">
          <div className="preview-error-icon-container">
            <svg className="preview-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
              <path className="preview-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
            {title}
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
            {message}
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Selection Requirement Alert
export const SelectionAlert = ({
  isOpen,
  title = 'Select a Certificate',
  message = 'Please choose the appropriate certificate rows to continue.',
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#197AFF' }}>
          {title}
        </div>
        <div className="achievement-popup-body selection-alert-body">
          <div className="selection-alert-icon-container">
            <svg className="selection-alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="selection-alert-icon--circle" cx="26" cy="26" r="25" />
              <path
                className="selection-alert-icon--exclamation"
                d="M26 15c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2s2-.9 2-2V17c0-1.1-.9-2-2-2zm0 18c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                fill="#197AFF"
              />
            </svg>
          </div>
          <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
            Action Required
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '16px', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// Download Success Popup (Fixed Capital 'A's)
export const DownloadSuccessAlert = ({ isOpen, onClose, fileLabel = 'resume', title = 'Downloaded !', description, color = '#197AFF' }) => {
  if (!isOpen) return null;

  const { lower: labelLower, capitalized: labelCapitalized } = normalizeFileLabel(fileLabel);
  const defaultDescription = (
    <>
      The {labelLower} has been successfully
      <br />
      downloaded as PDF to your device.
    </>
  );

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          {title}
        </div>
        <div className="achievement-popup-body">
          <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            {labelCapitalized} Downloaded ✓
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {description || defaultDescription}
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Download Progress Popup (Fixed Capital 'A's)
export const DownloadProgressAlert = ({ isOpen, progress = 25, fileLabel = 'resume', messages, title = 'Downloading...', color = '#197AFF', progressColor = '#197AFF' }) => {
  if (!isOpen) return null;

  const { lower: labelLower } = normalizeFileLabel(fileLabel);
  const combinedMessages = {
    initial: `Preparing ${labelLower} for download...`,
    mid: 'Finalizing download...',
    final: 'Starting download...',
    ...messages,
  };

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          {title}
        </div>
        <div className="achievement-popup-body">
          <div className="download-progress-icon-container">
            <svg className="download-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="download-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
              <circle 
                className="download-progress-icon--progress" 
                cx="26" 
                cy="26" 
                r="20" 
                fill="none" 
                stroke={progressColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Downloading {Math.round(progress)}%
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {progress < 85 ? combinedMessages.initial :
             progress < 100 ? combinedMessages.mid :
             combinedMessages.final}
          </p>
          <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
            {progress >= 100 ? 'Almost ready!' : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Preview Failed Popup (Fixed Capital 'A's)
export const PreviewFailedAlert = ({ isOpen, onClose, color = '#197AFF' }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          Preview Failed !
        </div>
        <div className="achievement-popup-body">
          <div className="preview-error-icon-container">
            <svg className="preview-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
              <path className="preview-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Preview Failed !
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Unable to preview the certificate.<br />
            Please try downloading it instead.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Preview Progress Popup (Already correct, left as is)
export const PreviewProgressAlert = ({ isOpen, progress = 25, title = 'Previewing...', messages, color = '#197AFF', progressColor = '#197AFF', fileLabel = 'resume' }) => {
  if (!isOpen) return null;

  const { lower: labelLower } = normalizeFileLabel(fileLabel);
  const combinedMessages = {
    initial: `Fetching ${labelLower} from database...`,
    mid: 'Preparing preview...',
    final: 'Opening preview...',
    ...messages,
  };

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          {title}
        </div>
        <div className="achievement-popup-body">
          <div className="preview-progress-icon-container">
            <svg className="preview-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
              <circle 
                className="preview-progress-icon--progress" 
                cx="26" 
                cy="26" 
                r="20" 
                fill="none" 
                stroke={progressColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Loading {Math.round(progress)}%
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {progress < 85
              ? combinedMessages.initial
              : progress < 100
                ? combinedMessages.mid
                : combinedMessages.final}
          </p>
          <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
            {progress >= 100 ? 'Almost ready!' : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Admin-specific green theme exports
const ADMIN_GREEN = '#4ea24e';

export const AdminDownloadFailedAlert = ({ isOpen, onClose }) => {
  return <DownloadFailedAlert isOpen={isOpen} onClose={onClose} color={ADMIN_GREEN} />;
};

export const AdminCertificateDownloadProgressAlert = ({
  isOpen,
  progress = 25,
  fileLabel = 'certificate',
  title = 'Downloading...',
  messages,
}) => (
  <DownloadProgressAlert
    isOpen={isOpen}
    progress={progress}
    fileLabel={fileLabel}
    title={title}
    messages={messages}
    color={ADMIN_GREEN}
    progressColor={ADMIN_GREEN}
  />
);

export const AdminCertificateDownloadSuccessAlert = ({
  isOpen,
  onClose,
  fileLabel = 'certificate',
  title = 'Downloaded !',
  description,
}) => (
  <DownloadSuccessAlert
    isOpen={isOpen}
    onClose={onClose}
    fileLabel={fileLabel}
    title={title}
    description={description}
    color={ADMIN_GREEN}
  />
);

export const AdminPreviewProgressAlert = ({ 
  isOpen, 
  progress = 25, 
  title = 'Previewing...', 
  messages, 
  fileLabel = 'certificate' 
}) => (
  <PreviewProgressAlert
    isOpen={isOpen}
    progress={progress}
    title={title}
    messages={messages}
    color={ADMIN_GREEN}
    progressColor={ADMIN_GREEN}
    fileLabel={fileLabel}
  />
);

export const AdminPreviewFailedAlert = ({ isOpen, onClose }) => {
  return <PreviewFailedAlert isOpen={isOpen} onClose={onClose} color={ADMIN_GREEN} />;
};

// Export Progress Alert
export const ExportProgressAlert = ({ isOpen, progress = 25, exportType = 'Excel', color = '#4ea24e', progressColor = '#4ea24e' }) => {
  if (!isOpen) return null;

  const messages = {
    initial: `Preparing ${exportType} export...`,
    mid: `Generating ${exportType} file...`,
    final: `Finalizing ${exportType} export...`,
  };

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          Exporting...
        </div>
        <div className="achievement-popup-body">
          <div className="preview-progress-icon-container">
            <svg className="preview-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
              <circle 
                className="preview-progress-icon--progress" 
                cx="26" 
                cy="26" 
                r="20" 
                fill="none" 
                stroke={progressColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Exporting {Math.round(progress)}%
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {progress < 40
              ? messages.initial
              : progress < 85
                ? messages.mid
                : messages.final}
          </p>
          <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
            {progress >= 100 ? 'Download starting...' : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Export Success Alert
export const ExportSuccessAlert = ({ isOpen, onClose, exportType = 'Excel', color = '#4ea24e' }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          Export Complete!
        </div>
        <div className="achievement-popup-body">
          <svg className="achievement-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="achievement-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="achievement-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            {exportType} Exported!
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Your {exportType} file has been<br />downloaded successfully
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Export Failed Alert
export const ExportFailedAlert = ({ isOpen, onClose, exportType = 'Excel', color = '#4ea24e' }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: color }}>
          Export Failed
        </div>
        <div className="achievement-popup-body">
          <div className="preview-error-icon-container">
            <svg className="preview-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-error-icon--circle" cx="26" cy="26" r="25" fill={color}/>
              <path d="M26 16v12M26 34v2" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Export Failed
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Unable to export {exportType} file.<br />
            Please try again.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};