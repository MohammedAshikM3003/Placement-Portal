import React, { useState, useEffect } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Achievement Popup
 * Matches design: Achievement Details textarea
 */
export default function PopupAchievementBuilder({ data, onSave, onDiscard }) {
  const [details, setDetails] = useState(data?.details || '');

  // Sync details when data prop changes (when reopening saved achievement)
  useEffect(() => {
    if (data) {
      setDetails(data.details || '');
    }
  }, [data]);

  return (
    <div className={styles.overlay} onClick={onDiscard}>
      <div className={styles.popupContainer} style={{ width: '460px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>Achievement</div>
        <div className={styles.popupBody}>
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Achievement Details:</p>
            <textarea
              className={styles.popupTextarea}
              placeholder="Write your Achievement Details."
              value={details}
              onChange={e => setDetails(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.popupFooter}>
          <button className={styles.popupDiscardBtn} onClick={onDiscard}>Discard</button>
          <button className={styles.popupSaveBtn} onClick={() => onSave({ details })}>Save</button>
        </div>
      </div>
    </div>
  );
}
