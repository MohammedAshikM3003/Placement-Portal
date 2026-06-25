/**
 * components/dialog/ConfirmDialog/ConfirmDialog.jsx
 *
 * A shared confirmation/warning modal dialog.
 * Replaces the repeated inline popup components spread across pages.
 *
 * Usage example:
 *
 *   <ConfirmDialog
 *     isOpen={activePopup === 'deleteWarning'}
 *     variant="delete"
 *     title="Delete Student"
 *     heading="Are you sure?"
 *     message={`Delete ${selectedCount} selected student${selectedCount > 1 ? 's' : ''}?`}
 *     confirmLabel="Delete"
 *     cancelLabel="Discard"
 *     isLoading={deleteInProgress}
 *     onConfirm={confirmDelete}
 *     onClose={closePopup}
 *     icon={<TrashIcon />}
 *   />
 *
 * Variants:
 *   - 'delete'  — red (default for destructive actions)
 *   - 'block'   — red
 *   - 'unblock' — amber
 *   - 'warn'    — amber
 *   - 'info'    — blue
 *   - 'success' — green
 */

import React, { useEffect, useCallback } from 'react';
import styles from './ConfirmDialog.module.css';

// ─── Default icon variants ──────────────────────────────────────

const DEFAULT_ICONS = {
  delete: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  block: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  unblock: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 11 12 14 22 4" />
    </svg>
  ),
  warn: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ─── Component ─────────────────────────────────────────────────

/**
 * @param {Object}          props
 * @param {boolean}         props.isOpen         - Controls visibility
 * @param {Function}        props.onClose         - Called when Cancel/overlay clicked
 * @param {Function}        [props.onConfirm]     - Called when Confirm clicked
 * @param {string}          [props.variant]       - delete|block|unblock|warn|info|success
 * @param {string}          [props.title]         - Dialog header text
 * @param {string}          [props.heading]       - Large body heading (e.g. "Are you sure?")
 * @param {React.ReactNode} [props.message]       - Body message text or node
 * @param {string}          [props.confirmLabel]  - Confirm button label (default: "Confirm")
 * @param {string}          [props.cancelLabel]   - Cancel button label (default: "Cancel")
 * @param {boolean}         [props.isLoading]     - Disables buttons, shows loading text
 * @param {string}          [props.loadingLabel]  - Override confirm text while loading
 * @param {React.ReactNode} [props.icon]          - Custom icon to show in body
 * @param {boolean}         [props.hideCancel]    - Hides the cancel button (for success dialogs)
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  variant = 'delete',
  title,
  heading = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  loadingLabel,
  icon,
  hideCancel = false,
}) {
  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !isLoading) onClose?.();
  }, [isLoading, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const resolvedIcon = icon ?? DEFAULT_ICONS[variant] ?? DEFAULT_ICONS.warn;
  const buttonLabel = isLoading
    ? (loadingLabel ?? `${confirmLabel}…`)
    : confirmLabel;

  return (
    <div
      className={styles.overlay}
      onClick={() => { if (!isLoading) onClose?.(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
    >
      <div
        className={styles.dialog}
        data-variant={variant}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────── */}
        {title && (
          <div className={styles.header} id="cd-title">
            {title}
          </div>
        )}

        {/* ── Body ───────────────────────────────────── */}
        <div className={styles.body}>
          {resolvedIcon && (
            <div className={styles.iconWrap} aria-hidden="true">
              {resolvedIcon}
            </div>
          )}
          {heading && <h2 className={styles.heading}>{heading}</h2>}
          {message  && <p  className={styles.message}>{message}</p>}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className={styles.footer}>
          {!hideCancel && (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
          )}
          {onConfirm && (
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {buttonLabel}
            </button>
          )}
          {hideCancel && !onConfirm && (
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
