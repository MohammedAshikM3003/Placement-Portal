import React, { useState, useEffect } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Certification Popup
 * Matches design: Certificate Name, Issued by
 */
export default function PopupCertification({ data, onSave, onDiscard }) {
  const [formData, setFormData] = useState({
    certificateName: data?.certificateName || '',
    issuedBy: data?.issuedBy || '',
  });

  // Sync formData when data prop changes (when reopening saved certification)
  useEffect(() => {
    if (data) {
      setFormData({
        certificateName: data.certificateName || '',
        issuedBy: data.issuedBy || '',
      });
    }
  }, [data]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.overlay} onClick={onDiscard}>
      <div className={styles.popupContainer} style={{ width: '460px' }} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>Certification</div>
        <div className={styles.popupBody}>
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Certificate Details:</p>
            <div className={styles.popupRow}>
              <div className={styles.popupInputWithRemove}>
                <input
                  className={styles.popupInput}
                  placeholder="Certificate Name"
                  value={formData.certificateName}
                  onChange={e => handleChange('certificateName', e.target.value)}
                />
                {formData.certificateName && (
                  <button className={styles.popupInputRemoveBtn} onClick={() => handleChange('certificateName', '')}>×</button>
                )}
              </div>
              <div className={styles.popupInputWithRemove}>
                <input
                  className={styles.popupInput}
                  placeholder="Issued by"
                  value={formData.issuedBy}
                  onChange={e => handleChange('issuedBy', e.target.value)}
                />
                {formData.issuedBy && (
                  <button className={styles.popupInputRemoveBtn} onClick={() => handleChange('issuedBy', '')}>×</button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.popupFooter}>
          <button className={styles.popupDiscardBtn} onClick={onDiscard}>Discard</button>
          <button className={styles.popupSaveBtn} onClick={() => onSave(formData)}>Save</button>
        </div>
      </div>
    </div>
  );
}
