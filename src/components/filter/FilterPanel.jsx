/**
 * components/filter/FilterPanel.jsx
 *
 * A composable filter panel that renders a bar of filter fields.
 * Each field can be a text input, select dropdown, or a range pair.
 *
 * Usage example:
 *
 *   const fields = [
 *     {
 *       key: 'search',
 *       type: 'text',
 *       label: 'Name / Reg Number',
 *       placeholder: 'Enter name or reg no',
 *       value: searchValue,
 *       onChange: setSearchValue,
 *       wide: true,
 *     },
 *     {
 *       key: 'department',
 *       type: 'select',
 *       label: 'Branch',
 *       value: deptValue,
 *       onChange: setDeptValue,
 *       options: branches.map(b => ({ value: b.id, label: b.name })),
 *       placeholder: 'Select Branch',
 *     },
 *     {
 *       key: 'batch',
 *       type: 'range',
 *       label: 'Batch',
 *       startValue: batchStart,
 *       endValue: batchEnd,
 *       onStartChange: setBatchStart,
 *       startPlaceholder: 'Start',
 *       endPlaceholder: 'End',
 *       endReadOnly: true,
 *     },
 *   ];
 *
 *   <FilterPanel
 *     title="Filter & Sort"
 *     fields={fields}
 *     hasActiveFilters={hasFilters}
 *     onClear={handleClear}
 *     extra={<AIToggleButton />}
 *   />
 */

import React from 'react';
import styles from './FilterPanel.module.css';

// ─── Field renderers ────────────────────────────────────────────

function TextField({ field }) {
  return (
    <div className={`${styles.field} ${field.wide ? styles.wide : ''}`} key={field.key}>
      {field.label && <label className={styles.label}>{field.label}</label>}
      <div className={styles.inputWrap}>
        {field.icon && <span className={styles.inputIcon}>{field.icon}</span>}
        <input
          id={field.id || field.key}
          type="text"
          className={styles.input}
          placeholder={field.placeholder || ''}
          value={field.value || ''}
          onChange={e => field.onChange && field.onChange(e.target.value)}
          onFocus={field.onFocus}
          onBlur={field.onBlur}
          readOnly={field.readOnly}
          disabled={field.disabled}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function SelectField({ field }) {
  return (
    <div className={`${styles.field} ${field.wide ? styles.wide : ''}`} key={field.key}>
      {field.label && <label className={styles.label}>{field.label}</label>}
      <select
        id={field.id || field.key}
        className={styles.select}
        value={field.value || ''}
        onChange={e => field.onChange && field.onChange(e.target.value)}
        disabled={field.disabled}
      >
        {field.placeholder && <option value="">{field.placeholder}</option>}
        {(field.options || []).map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeField({ field }) {
  return (
    <div className={`${styles.field} ${field.wide ? styles.wide : ''}`} key={field.key}>
      {field.label && <label className={styles.label}>{field.label}</label>}
      <div className={styles.rangeWrap}>
        <div className={styles.inputWrap} style={{ flex: 1 }}>
          <input
            id={field.id ? `${field.id}-start` : `${field.key}-start`}
            type="text"
            className={styles.input}
            placeholder={field.startPlaceholder || 'Start'}
            value={field.startValue || ''}
            onChange={e => field.onStartChange && field.onStartChange(e.target.value)}
            disabled={field.disabled}
            readOnly={field.startReadOnly}
            autoComplete="off"
          />
        </div>
        <span className={styles.rangeSep}>–</span>
        <div className={styles.inputWrap} style={{ flex: 1 }}>
          <input
            id={field.id ? `${field.id}-end` : `${field.key}-end`}
            type="text"
            className={styles.input}
            placeholder={field.endPlaceholder || 'End'}
            value={field.endValue || ''}
            onChange={e => field.onEndChange && field.onEndChange(e.target.value)}
            disabled={field.disabled}
            readOnly={field.endReadOnly}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}

function RangeSelectField({ field }) {
  // Two dropdowns side by side (e.g. Year – Semester)
  return (
    <div className={`${styles.field} ${field.wide ? styles.wide : ''}`} key={field.key}>
      {field.label && <label className={styles.label}>{field.label}</label>}
      <div className={styles.rangeWrap}>
        <select
          id={field.id ? `${field.id}-start` : `${field.key}-start`}
          className={styles.select}
          value={field.startValue || ''}
          onChange={e => field.onStartChange && field.onStartChange(e.target.value)}
          disabled={field.disabled}
          style={{ flex: 1 }}
        >
          {field.startPlaceholder && <option value="">{field.startPlaceholder}</option>}
          {(field.startOptions || []).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className={styles.rangeSep}>–</span>
        <select
          id={field.id ? `${field.id}-end` : `${field.key}-end`}
          className={styles.select}
          value={field.endValue || ''}
          onChange={e => field.onEndChange && field.onEndChange(e.target.value)}
          disabled={field.endDisabled || field.disabled}
          style={{ flex: 1 }}
        >
          {field.endPlaceholder && <option value="">{field.endPlaceholder}</option>}
          {(field.endOptions || []).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

/**
 * @param {Object}          props
 * @param {string}          [props.title]            - Label shown at top-left of panel
 * @param {Array}           props.fields             - Array of field descriptors
 * @param {boolean}         [props.hasActiveFilters] - Shows "Clear Filters" button when true
 * @param {Function}        [props.onClear]          - Called when "Clear Filters" is clicked
 * @param {string}          [props.clearLabel]       - Override clear button text
 * @param {React.ReactNode} [props.extra]            - Extra content next to title (e.g. AI toggle)
 * @param {string}          [props.className]        - Optional extra class for outer panel
 */
function FilterPanel({
  title = 'Filter & Sort',
  fields = [],
  hasActiveFilters = false,
  onClear,
  clearLabel = 'Clear Filters',
  extra,
  className,
}) {
  return (
    <div className={[styles.panel, className].filter(Boolean).join(' ')}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className={styles.header}>
        <h4 className={styles.title}>{title}</h4>
        {extra && <div className={styles.extra}>{extra}</div>}
      </div>

      {/* ── Fields ─────────────────────────────────────── */}
      <div className={styles.fields}>
        {fields.map(field => {
          switch (field.type) {
            case 'text':         return <TextField         key={field.key} field={field} />;
            case 'select':       return <SelectField       key={field.key} field={field} />;
            case 'range':        return <RangeField        key={field.key} field={field} />;
            case 'range-select': return <RangeSelectField  key={field.key} field={field} />;
            default:             return null;
          }
        })}

        {/* Clear button appears after fields when filters are active */}
        {hasActiveFilters && onClear && (
          <div className={`${styles.field} ${styles.auto}`} style={{ justifyContent: 'flex-end' }}>
            <label className={styles.label}>&nbsp;</label>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={onClear}
            >
              {clearLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterPanel;
