import styles from './SuccessPopup.module.css';

/**
 * SuccessPopup — shared save-confirmation popup for all portals.
 *
 * Props:
 *   isOpen      {boolean}   Whether the popup is visible.
 *   onClose     {function}  Called when the user clicks "Close" or the overlay.
 *   title       {string}    Header bar text.       Default: "Saved!"
 *   heading     {string}    Bold text in body.     Default: "Changes Saved ✔"
 *   message     {string}    Subtitle in body.      Default: "Successfully saved in the Portal"
 *   buttonLabel {string}    Close button label.    Default: "Close"
 *
 * Usage:
 *   import SuccessPopup from '../components/SuccessPopup';
 *   <SuccessPopup isOpen={showSuccess} onClose={() => setShowSuccess(false)} />
 */
function SuccessPopup({
  isOpen,
  onClose,
  title       = 'Saved!',
  heading     = 'Changes Saved \u2714',
  message     = 'Successfully saved in the Portal',
  buttonLabel = 'Close',
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>

        {/* Coloured header */}
        <div className={styles.header}>{title}</div>

        {/* Animated SVG checkmark + message */}
        <div className={styles.body}>
          <svg
            className={styles.successIcon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle
              className={styles.successIconCircle}
              cx="26" cy="26" r="25"
              fill="none"
            />
            <path
              className={styles.successIconCheck}
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>

          <h2 className={styles.title}>{heading}</h2>
          <p className={styles.message}>{message}</p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeBtn}>
            {buttonLabel}
          </button>
        </div>

      </div>
    </div>
  );
}

export default SuccessPopup;
