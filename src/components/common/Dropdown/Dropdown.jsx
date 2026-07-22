import React, { useState, useEffect, useRef } from 'react';
import styles from './Dropdown.module.css';

const roleColors = {
  admin: { thumb: '#4EA24E', hover: '#3d8a3d', borderHover: '#4EA24E' },
  coo: { thumb: '#D23B42', hover: '#b32d34', borderHover: '#D23B42' },
  coordinator: { thumb: '#D23B42', hover: '#b32d34', borderHover: '#D23B42' },
  stu: { thumb: '#2085f6', hover: '#4338CA', borderHover: '#2085f6' },
  student: { thumb: '#2085f6', hover: '#4338CA', borderHover: '#2085f6' }
};

const Dropdown = ({ 
  id,
  options = [], 
  selectedOption = null, 
  onSelect = () => {}, 
  placeholder = 'Select Option', 
  disabled = false,
  role = 'admin',
  className = '',
  headerClassName = '',
  ref = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  };

  const handleSelect = (option) => {
    const value = (typeof option === 'object' && option !== null) ? option.value : option;
    onSelect(value);
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    if (selectedOption === null || selectedOption === undefined || selectedOption === '') {
      return placeholder;
    }
    const matchedOption = options.find(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return opt.value === selectedOption;
      }
      return opt === selectedOption;
    });
    if (matchedOption) {
      return typeof matchedOption === 'object' ? matchedOption.label : matchedOption;
    }
    return selectedOption;
  };

  const themeColors = roleColors[role.toLowerCase()] || roleColors.admin;

  return (
    <div 
      id={id}
      className={`${styles['dropdown-wrapper']} ${disabled ? styles['dropdown-disabled'] : ''} ${className}`} 
      style={{
        '--dropdown-hover-color': themeColors.borderHover
      }}
      ref={(node) => {
        dropdownRef.current = node;
        if (ref) {
          if (typeof ref === 'function') {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      }}
    >
      <div
        className={`${styles['dropdown-header']} ${disabled ? styles['dropdown-header-disabled'] : ''} ${headerClassName}`}
        onClick={handleToggle}
      >
        <span>{getDisplayLabel()}</span>
        {!disabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 292.4 292.4"
            className={`${styles['dropdown-arrow']} ${isOpen ? styles['dropdown-arrow-open'] : ''}`}
          >
            <path fill="#808080" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.2 1.8-12.9 5.4-3.7 3.6-5.5 8-5.5 13s1.8 9.4 5.5 13l128.8 128.8c3.7 3.7 8 5.5 13 5.5s9.4-1.8 13-5.5l128.8-128.8c3.7-3.6 5.4-8 5.4-13s-1.7-9.4-5.4-13z" />
          </svg>
        )}
      </div>
      {isOpen && !disabled && (
        <div 
          className={styles['dropdown-menu']}
          style={{
            '--scrollbar-thumb-color': themeColors.thumb,
            '--scrollbar-thumb-hover-color': themeColors.hover
          }}
        >
          {options.map((option, index) => {
            const label = (typeof option === 'object' && option !== null) ? option.label : option;
            const itemStyle = (typeof option === 'object' && option !== null) ? option.style : undefined;
            return (
              <div
                key={index}
                className={styles['dropdown-item']}
                style={itemStyle}
                onClick={() => handleSelect(option)}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
