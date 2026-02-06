// Custom Hook for Alert Management
import { useState } from 'react';

// Centralized Alert Components Export
export { default as SuccessAlert } from './SuccessAlert';
export { default as ErrorAlert } from './ErrorAlert';
export { default as ConfirmAlert } from './ConfirmAlert';
export { default as InfoAlert } from './InfoAlert';
export { default as PlacementStatusPopup } from './PlacementStatusPopup';
export { AchievementSuccessAlert, AchievementErrorAlert } from './AchievementUploadAlert';
export { 
  RegistrationSuccessAlert, 
  ExistingRegNoAlert, 
  MismatchedRegNoAlert, 
  RegistrationFileSizeAlert 
} from './RegistrationAlerts';
export { 
  DownloadFailedAlert, 
  DownloadSuccessAlert, 
  DownloadProgressAlert, 
  PreviewFailedAlert, 
  PreviewProgressAlert, 
  SelectionAlert,
  CertificateDownloadProgressAlert,
  CertificateDownloadSuccessAlert,
  CertificatePreviewProgressAlert,
  CertificatePreviewFailedAlert
} from './DownloadPreviewAlerts';

// Admin-specific alerts (green themed) and Export alerts
export {
  ExportProgressAlert,
  ExportSuccessAlert,
  ExportFailedAlert
} from './AdminDownloadPreviewAlerts';

export const useAlert = () => {
  const [alerts, setAlerts] = useState({
    success: { isOpen: false, title: '', message: '' },
    error: { isOpen: false, title: '', message: '' },
    confirm: { isOpen: false, title: '', message: '', onConfirm: null },
    info: { isOpen: false, title: '', message: '' }
  });

  const showSuccess = (title = "Success!", message = "Operation completed successfully") => {
    setAlerts(prev => ({
      ...prev,
      success: { isOpen: true, title, message }
    }));
  };

  const showError = (title = "Error!", message = "Something went wrong") => {
    setAlerts(prev => ({
      ...prev,
      error: { isOpen: true, title, message }
    }));
  };

  const showConfirm = (title = "Confirm Action", message = "Are you sure?", onConfirm = () => {}) => {
    setAlerts(prev => ({
      ...prev,
      confirm: { isOpen: true, title, message, onConfirm }
    }));
  };

  const showInfo = (title = "Information", message = "Here's some information") => {
    setAlerts(prev => ({
      ...prev,
      info: { isOpen: true, title, message }
    }));
  };

  const closeAlert = (type) => {
    setAlerts(prev => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false }
    }));
  };

  const closeAllAlerts = () => {
    setAlerts({
      success: { isOpen: false, title: '', message: '' },
      error: { isOpen: false, title: '', message: '' },
      confirm: { isOpen: false, title: '', message: '', onConfirm: null },
      info: { isOpen: false, title: '', message: '' }
    });
  };

  return {
    alerts,
    showSuccess,
    showError,
    showConfirm,
    showInfo,
    closeAlert,
    closeAllAlerts
  };
};
