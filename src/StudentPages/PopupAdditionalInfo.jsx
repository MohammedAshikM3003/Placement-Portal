import React, { useState, useEffect } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Additional Information Popup
 * Matches design: Information textarea
 */
export default function PopupAdditionalInfo({ data, onSave, onDiscard, onDelete }) {
  const [info, setInfo] = useState(data?.info || '');

  // Sync info when data prop changes (when reopening saved additional info)
  useEffect(() => {
    if (data) {
      setInfo(data.info || '');
    }
  }, [data]);

  const isFormValid = Boolean(info?.trim());

  const handleSave = () => {
    if (!isFormValid) return;
    onSave({ info });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popupContainer} style={{ width: '460px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>Additional Information</div>
        <div className={styles.popupBody}>
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Information:</p>
            <textarea
              className={styles.popupTextarea}
              placeholder="Write your Additional Information."
              value={info}
              onChange={e => setInfo(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.popupFooter}>
          <button className={styles.popupDiscardBtn} onClick={onDiscard}>Back</button>
          {onDelete && (
            <button className={styles.popupDiscardBtn} style={{ color: '#d9534f', borderColor: '#d9534f' }} onClick={onDelete}>Delete</button>
          )}
          <button className={styles.popupSaveBtn} onClick={handleSave} disabled={!isFormValid}>Save</button>
        </div>
      </div>
    </div>
  );
}
