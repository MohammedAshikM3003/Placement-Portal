import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ResumeBuilder.module.css';

/**
 * Professional Experience / Internship Popup
 * Matches design: Company Details, Date, Technologies Used, Project, Description
 */
// Safely extract a string from a description that might be stored as an object
const safeDescription = (desc) => {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  if (typeof desc === 'object') return desc.input || desc.description || desc.text || desc.value || '';
  return String(desc);
};

export default function PopupExperience({ title = 'Software Engineer', data, onSave, onDiscard, enableAI = true }) {
  const [formData, setFormData] = useState({
    title: data?.title || data?.label || title,
    companyName: data?.companyName || '',
    location: data?.location || '',
    mode: data?.mode || 'in-person',
    fromDate: data?.fromDate || '',
    toDate: data?.toDate || '',
    technologies: Array.isArray(data?.technologies) ? [...data.technologies] : [],
    projects: Array.isArray(data?.projects) ? [...data.projects] : [],
    description: safeDescription(data?.description),
  });

  const [techInput, setTechInput] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const descriptionTextareaRef = useRef(null);

  // Auto-expand textarea based on content
  useEffect(() => {
    const textarea = descriptionTextareaRef.current;
    if (textarea) {
      textarea.style.height = '150px';
      const newHeight = Math.max(150, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [formData.description]);

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

  const addProject = useCallback(() => {
    const val = projectInput.trim();
    if (!val) return;
    setFormData(prev => {
      if (prev.projects.includes(val)) return prev;
      return { ...prev, projects: [...prev.projects, val] };
    });
    setProjectInput('');
  }, [projectInput]);

  const removeProject = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  }, []);

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleSave = () => {
    console.log('PopupExperience - Saving data:', formData);
    onSave(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>{formData.title || 'Professional Experience'}</div>
        <div className={styles.popupBody}>
          {/* Company Details */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Company Details:</p>
            <div className={styles.popupRow}>
              <div className={styles.popupInputWithRemove}>
                <input
                  className={styles.popupInput}
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={e => handleChange('companyName', e.target.value)}
                />
                {formData.companyName && (
                  <button className={styles.popupInputRemoveBtn} onClick={() => handleChange('companyName', '')}>×</button>
                )}
              </div>
              <div className={styles.popupInputWithRemove}>
                <input
                  className={styles.popupInput}
                  placeholder="Location"
                  value={formData.location}
                  onChange={e => handleChange('location', e.target.value)}
                />
                {formData.location && (
                  <button className={styles.popupInputRemoveBtn} onClick={() => handleChange('location', '')}>×</button>
                )}
              </div>
            </div>
          </div>

          {/* Date */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Date:</p>
            <div className={styles.popupRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={formData.fromDate}
                onChange={e => handleChange('fromDate', e.target.value)}
              />
              <input
                type="date"
                className={styles.dateInput}
                value={formData.toDate}
                onChange={e => handleChange('toDate', e.target.value)}
              />
            </div>
          </div>

          {/* Mode */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Mode:</p>
            <select
              className={styles.popupInput}
              value={formData.mode}
              onChange={e => handleChange('mode', e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="remote">Remote (Virtual)</option>
              <option value="in-person">In-Person (On-Site)</option>
              <option value="hybrid">Hybrid</option>
            </select>
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

          {/* Internship Description */}
          <div className={styles.popupFieldGroup}>
            <p className={styles.popupLabel}>Internship Description:</p>
            <textarea
              ref={descriptionTextareaRef}
              className={styles.popupTextarea}
              placeholder={enableAI
                ? 'Describe your work briefly — AI will polish it into professional text when you create the resume'
                : 'Describe your work experience here. This text will appear directly in your resume.'
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
          <button type="button" className={styles.popupDiscardBtn} onClick={onDiscard}>Back</button>
          <button type="button" className={styles.popupSaveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
