import React, { useState, useEffect } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Additional Information Popup
 * Matches design: Information textarea
 */
export default function PopupAdditionalInfo({ data, onSave, onDiscard }) {
  const [info, setInfo] = useState(data?.info || '');

  // Sync info when data prop changes (when reopening saved additional info)
  useEffect(() => {
    if (data) {
      setInfo(data.info || '');
    }
  }, [data]);

  return (
    <div className={styles.overlay} onClick={onDiscard}>
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
          <button className={styles.popupDiscardBtn} onClick={onDiscard}>Discard</button>
          <button className={styles.popupSaveBtn} onClick={() => onSave({ info })}>Save</button>
        </div>
      </div>
    </div>
  );
}
