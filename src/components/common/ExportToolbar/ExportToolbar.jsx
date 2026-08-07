/**
 * components/common/ExportToolbar/ExportToolbar.jsx
 *
 * A reusable export button with a dropdown menu.
 * Integrates with the existing ExportProgressAlert / ExportSuccessAlert / ExportFailedAlert
 * from src/components/alerts.
 *
 * Usage example:
 *
 *   const exportActions = [
 *     { label: 'Export to Excel', icon: '📊', onExport: exportToExcel },
 *     { label: 'Export as PDF',   icon: '📄', onExport: exportToPDF   },
 *   ];
 *
 *   <ExportToolbar
 *     label="Print"
 *     actions={exportActions}
 *     exportType={exportType}
 *     exportProgress={exportProgress}
 *     exportState={exportPopupState}
 *     onExportStateChange={setExportPopupState}
 *   />
 *
 * The component manages its own open/close state for the dropdown menu.
 * Alert rendering is delegated to the existing alert components.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ExportToolbar.module.css';
import {
  ExportProgressAlert,
  ExportSuccessAlert,
  ExportFailedAlert,
} from '../../alerts';

// ─── ExportToolbar ─────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {string}   [props.label]              - Button label (default: "Print")
 * @param {Array}    props.actions              - Array of { label, icon?, onExport }
 * @param {string}   [props.exportType]         - Current export type name (e.g. 'Excel')
 * @param {number}   [props.exportProgress]     - Progress 0–100
 * @param {string}   [props.exportState]        - 'none' | 'progress' | 'success' | 'failed'
 * @param {Function} [props.onExportStateChange]- (state) => void
 */
function ExportToolbar({
  label = 'Print',
  actions = [],
  exportType,
  exportProgress,
  exportState = 'none',
  onExportStateChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  const handleAction = useCallback((onExport) => {
    setIsOpen(false);
    if (onExport) onExport();
  }, []);

  const handleClose = useCallback(() => {
    if (onExportStateChange) onExportStateChange('none');
  }, [onExportStateChange]);

  return (
    <>
      {/* ── Dropdown wrapper ─────────────────────────── */}
      <div className={styles.wrap} ref={wrapRef}>
        <button
          type="button"
          className={styles.btn}
          onClick={handleToggle}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {label}
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▼</span>
        </button>

        {isOpen && (
          <div className={styles.menu} role="menu">
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => handleAction(action.onExport)}
              >
                {action.icon && (
                  <span className={styles.menuItemIcon}>{action.icon}</span>
                )}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Alert overlays ───────────────────────────── */}
      <ExportProgressAlert
        isOpen={exportState === 'progress'}
        progress={exportProgress}
        exportType={exportType}
      />
      <ExportSuccessAlert
        isOpen={exportState === 'success'}
        onClose={handleClose}
        exportType={exportType}
      />
      <ExportFailedAlert
        isOpen={exportState === 'failed'}
        onClose={handleClose}
        exportType={exportType}
      />
    </>
  );
}

export default ExportToolbar;
