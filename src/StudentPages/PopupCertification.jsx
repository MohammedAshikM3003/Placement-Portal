import React, { useState, useEffect, useRef } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Certification Popup
 * Certificate Name input + Description textarea (AI-polishable)
 */
export default function PopupCertification({ data, onSave, onDiscard, enableAI = true }) {
  const [formData, setFormData] = useState({
    certificateName: data?.certificateName || '',
    description: data?.description || '',
  });

  const descriptionTextareaRef = useRef(null);

  // Sync formData when data prop changes (when reopening saved certification)
  useEffect(() => {
    if (data) {
      setFormData({
        certificateName: data.certificateName || '',
        description: data.description || '',
      });
    }
  }, [data]);

  // Auto-expand textarea based on content
  useEffect(() => {
    const textarea = descriptionTextareaRef.current;
    if (textarea) {
      textarea.style.height = '120px';
      const newHeight = Math.max(120, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [formData.description]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popupContainer} style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>Certification</div>
        <div className={styles.popupBody}>
          {/* Certificate Name */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Certificate Name:</p>
            <div className={styles.popupInputWithRemove}>
              <input
                className={styles.popupInput}
                placeholder="e.g. AWS Certified Solutions Architect"
                value={formData.certificateName}
                onChange={e => handleChange('certificateName', e.target.value)}
              />
              {formData.certificateName && (
                <button className={styles.popupInputRemoveBtn} onClick={() => handleChange('certificateName', '')}>×</button>
              )}
            </div>
          </div>

          {/* Certificate Description */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Certificate Description:</p>
            <textarea
              ref={descriptionTextareaRef}
              className={styles.popupTextarea}
              placeholder={enableAI
                ? 'Describe what you learned or achieved — AI will polish it into professional text when you create the resume'
                : 'Describe the certification details. This text will appear directly in your resume.'
              }
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
            <div className={styles.textareaActions}>
              {enableAI && (
                <span style={{ fontSize: '12px', color: '#2085f6', fontStyle: 'italic' }}>✨ AI will auto-polish during Create</span>
              )}
              <button className={styles.clearBtn} onClick={() => handleChange('description', '')}>Clear</button>
            </div>
          </div>
        </div>

        <div className={styles.popupFooter}>
          <button className={styles.popupDiscardBtn} onClick={onDiscard}>Back</button>
          <button className={styles.popupSaveBtn} onClick={() => onSave(formData)}>Save</button>
        </div>
      </div>
    </div>
  );
}
