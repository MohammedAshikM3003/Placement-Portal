import React, { useState, useCallback } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Project Popup
 * Matches design: Technologies Used, Project Description, Project Details (GitHub, Hosting)
 */
export default function PopupProject({ title = '', data, onSave, onDiscard, enableAI = true }) {
  const [formData, setFormData] = useState({
    name: data?.name || title,
    technologies: Array.isArray(data?.technologies) ? [...data.technologies] : [],
    description: data?.description || '',
    githubRepo: data?.githubRepo || '',
    hostingLink: data?.hostingLink || '',
  });

  const [techInput, setTechInput] = useState('');

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addTech = useCallback(() => {
    const val = techInput.trim();
    if (!val) return;
    setFormData(prev => {
      if (prev.technologies.includes(val)) return prev;
      return { ...prev, technologies: [...prev.technologies, val] };
    });
    setTechInput('');
  }, [techInput]);

  const removeTech = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  }, []);

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className={styles.overlay} onClick={onDiscard}>
      <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>{formData.name || 'Project'}</div>
        <div className={styles.popupBody}>
          {/* Project Name */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Project Name:</p>
            <div className={styles.popupInputWithRemove}>
              <input
                className={styles.popupInput}
                placeholder="Enter Project Name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
              />
              {formData.name && (
                <button type="button" className={styles.popupInputRemoveBtn} onClick={() => handleChange('name', '')}>×</button>
              )}
            </div>
          </div>

          {/* Technologies Used */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Technologies Used:</p>
            <div className={styles.chipsContainer}>
              {formData.technologies.map((tech, i) => (
                <span key={i} className={styles.chip}>
                  {tech}
                  <button type="button" className={styles.chipRemove} onClick={() => removeTech(i)}>×</button>
                </span>
              ))}
              <div className={styles.popupInputWithRemove}>
                <input
                  className={styles.chipInput}
                  placeholder="Enter Skill"
                  value={techInput}
                  onChange={e => setTechInput(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, addTech)}
                />
                {techInput && <button type="button" className={styles.popupInputRemoveBtn} onClick={() => setTechInput('')}>×</button>}
              </div>
              <button type="button" className={styles.addChipBtn} onClick={addTech}>
                <span className={styles.addChipBtnIcon}>+</span>
                Click to Add Skill
              </button>
            </div>
          </div>

          {/* Project Description */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Project Description:</p>
            <textarea
              className={styles.popupTextarea}
              placeholder={enableAI
                ? 'Describe your project briefly — AI will polish it into professional text when you create the resume'
                : 'Describe your project here. This text will appear directly in your resume.'
              }
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
            <div className={styles.textareaActions}>
              <button className={styles.clearBtn} onClick={() => handleChange('description', '')}>Clear</button>
              {enableAI && (
                <span style={{ fontSize: '12px', color: '#2085f6', fontStyle: 'italic' }}>✨ AI will auto-polish during Create</span>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Project Details:</p>
            <div className={styles.popupRow}>
              <div className={styles.popupInputWithRemove}>
                <input
                  className={styles.popupInput}
                  placeholder="GitHub Repository"
                  value={formData.githubRepo}
                  onChange={e => handleChange('githubRepo', e.target.value)}
                />
                {formData.githubRepo && (
                  <button className={styles.popupInputRemoveBtn} onClick={() => handleChange('githubRepo', '')}>×</button>
                )}
              </div>
              <div className={styles.popupInputWithRemove}>
                <input
                  className={styles.popupInput}
                  placeholder="Hosting Link"
                  value={formData.hostingLink}
                  onChange={e => handleChange('hostingLink', e.target.value)}
                />
                {formData.hostingLink && (
                  <button className={styles.popupInputRemoveBtn} onClick={() => handleChange('hostingLink', '')}>×</button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.popupFooter}>
          <button type="button" className={styles.popupDiscardBtn} onClick={onDiscard}>Discard</button>
          <button type="button" className={styles.popupSaveBtn} onClick={() => {
            console.log('PopupProject - Saving data:', formData);
            onSave(formData);
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}
