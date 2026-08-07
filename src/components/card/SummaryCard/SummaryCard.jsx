/**
 * components/card/SummaryCard/SummaryCard.jsx
 *
 * A shared statistics/summary card for dashboards.
 *
 * Usage example:
 *
 *   <SummaryCard
 *     label="Total Students"
 *     value={totalStudents}
 *     icon={<GradCapIcon />}
 *     variant="admin"
 *     sub="Across all branches"
 *     trend={{ direction: 'up', label: '+12 this month' }}
 *     onClick={() => navigate('/admin/students')}
 *   />
 *
 * Variants: 'admin' | 'coo' | 'student' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
 */

import React from 'react';
import styles from './SummaryCard.module.css';

/**
 * @param {Object}          props
 * @param {string}          props.label           - Card label (e.g. "Total Students")
 * @param {string|number}   props.value           - Primary statistic value
 * @param {React.ReactNode} [props.icon]          - Icon element shown on the left
 * @param {string}          [props.variant]       - Color variant (admin|coo|student|success|warning|error|info|neutral)
 * @param {string}          [props.sub]           - Optional subtitle text below value
 * @param {Object}          [props.trend]         - { direction: 'up'|'down'|'flat', label: string }
 * @param {Function}        [props.onClick]       - Makes card clickable
 * @param {string}          [props.className]     - Optional extra class
 */
function SummaryCard({
  label,
  value,
  icon,
  variant = 'info',
  sub,
  trend,
  onClick,
  className,
}) {
  const cardCls = [
    styles.card,
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardCls}
      data-variant={variant}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
    >
      {/* ── Icon ──────────────────────────────────────── */}
      {icon && (
        <div className={styles.iconWrap} aria-hidden="true">
          {icon}
        </div>
      )}

      {/* ── Text content ──────────────────────────────── */}
      <div className={styles.content}>
        {label && <p className={styles.label}>{label}</p>}
        <p className={styles.value}>{value ?? '—'}</p>
        {sub   && <p className={styles.sub}>{sub}</p>}
      </div>

      {/* ── Trend badge ──────────────────────────────── */}
      {trend && (
        <div className={`${styles.trend} ${styles[trend.direction] || styles.flat}`}>
          {trend.direction === 'up'   && '▲ '}
          {trend.direction === 'down' && '▼ '}
          {trend.label}
        </div>
      )}
    </div>
  );
}

export default SummaryCard;
