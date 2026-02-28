import React, { useState, useEffect, useRef } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Achievement Popup
 * Achievement Details textarea with AI support
 */
export default function PopupAchievementBuilder({ data, onSave, onDiscard, enableAI = true }) {
  const [details, setDetails] = useState(data?.details || '');
  const textareaRef = useRef(null);

  // Sync details when data prop changes (when reopening saved achievement)
  useEffect(() => {
    if (data) {
      setDetails(data.details || '');
    }
  }, [data]);

  // Auto-expand textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '120px';
      const newHeight = Math.max(120, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [details]);

  return (
    <div className={styles.overlay}>
      <div className={styles.popupContainer} style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>Achievement</div>
        <div className={styles.popupBody}>
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Achievement Details:</p>
            <textarea
              ref={textareaRef}
              className={styles.popupTextarea}
              placeholder={enableAI
                ? 'Describe your achievement briefly — AI will polish it into professional text when you create the resume'
                : 'Describe your achievement. This text will appear directly in your resume.'
              }
              value={details}
              onChange={e => setDetails(e.target.value)}
            />
            <div className={styles.textareaActions}>
              {enableAI && (
                <span style={{ fontSize: '12px', color: '#2085f6', fontStyle: 'italic' }}>✨ AI will auto-polish during Create</span>
              )}
              <button className={styles.clearBtn} onClick={() => setDetails('')}>Clear</button>
            </div>
          </div>
        </div>

        <div className={styles.popupFooter}>
          <button className={styles.popupDiscardBtn} onClick={onDiscard}>Back</button>
          <button className={styles.popupSaveBtn} onClick={() => onSave({ details })}>Save</button>
        </div>
      </div>
    </div>
  );
}
