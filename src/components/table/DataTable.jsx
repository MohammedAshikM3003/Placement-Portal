/**
 * components/table/DataTable.jsx
 *
 * A fully reusable, accessible data table component.
 *
 * Features:
 *  - Column definitions with optional sort, align, render fn
 *  - Optional checkbox selection (single or multi)
 *  - Optional row click handler
 *  - Loading & empty states
 *  - Pagination controls (prev/next)
 *  - Toolbar slot for title, subtitle, and custom action children
 *  - Footer slot for custom content
 *  - Row variant support (selected, blocked/flagged)
 *
 * Usage example:
 *
 *   const columns = [
 *     { key: 'regNo',      header: 'Reg No',   sortable: true },
 *     { key: 'name',       header: 'Name',     sortable: true },
 *     { key: 'department', header: 'Branch' },
 *     { key: 'actions',    header: '',         align: 'center',
 *       render: (row) => <button onClick={() => view(row.id)}>View</button> },
 *   ];
 *
 *   <DataTable
 *     columns={columns}
 *     data={filteredStudents}
 *     rowKey="id"
 *     isLoading={loading}
 *     emptyMessage="No students found"
 *     selectable
 *     selectedIds={selectedIds}
 *     onSelectionChange={setSelectedIds}
 *     pagination={{ currentPage, totalPages, onPrev, onNext }}
 *     title="Students"
 *     subtitle={`${total} total`}
 *     toolbarActions={<>...</>}
 *     serialOffset={(currentPage - 1) * pageSize}
 *   />
 */

import React, { useCallback } from 'react';
import styles from './DataTable.module.css';

// ─── Sort Icon ──────────────────────────────────────────────────
const SortIcon = ({ direction }) => (
  <span className={styles.sortIcon} aria-hidden="true">
    <span style={{ opacity: direction === 'asc'  ? 1 : 0.3 }}>▲</span>
    <span style={{ opacity: direction === 'desc' ? 1 : 0.3 }}>▼</span>
  </span>
);

// ─── Main Component ─────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Array}    props.columns            - Column definitions
 * @param {Array}    props.data               - Row data array
 * @param {string}   props.rowKey             - Unique key field on each row object
 * @param {boolean}  [props.isLoading]        - Shows spinner when true
 * @param {string}   [props.loadingText]      - Override loading message
 * @param {string}   [props.emptyMessage]     - Message when data is empty
 * @param {boolean}  [props.selectable]       - Show checkbox column
 * @param {Set}      [props.selectedIds]      - Set of selected rowKey values
 * @param {Function} [props.onSelectionChange]- (newSet) => void
 * @param {Function} [props.onRowClick]       - (row) => void – if provided, rows are clickable
 * @param {Function} [props.getRowVariant]    - (row) => 'selected'|'blocked'|null
 * @param {Object}   [props.sort]             - { key, direction: 'asc'|'desc' }
 * @param {Function} [props.onSortChange]     - (columnKey) => void
 * @param {Object}   [props.pagination]       - { currentPage, totalPages, onPrev, onNext }
 * @param {string}   [props.title]            - Toolbar title text
 * @param {string}   [props.subtitle]         - Toolbar subtitle text
 * @param {React.ReactNode} [props.toolbarActions] - Extra content on the right of toolbar
 * @param {React.ReactNode} [props.footer]    - Content below the table
 * @param {number}   [props.serialOffset]     - Base serial number (defaults to 0)
 * @param {boolean}  [props.showSerial]       - Show S.No column (default true)
 */
function DataTable({
  columns = [],
  data = [],
  rowKey = 'id',
  isLoading = false,
  loadingText = 'Loading…',
  emptyMessage = 'No data available',
  selectable = false,
  selectedIds,
  onSelectionChange,
  onRowClick,
  getRowVariant,
  sort,
  onSortChange,
  pagination,
  title,
  subtitle,
  toolbarActions,
  footer,
  serialOffset = 0,
  showSerial = true,
  className = '',
  style = {},
  scrollAreaStyle = {},
  scrollAreaClassName = '',
  selectHeaderLabel = '',
}) {
  // ── Derived state ──────────────────────────────────────────────
  const hasData = data.length > 0;
  const allSelected = selectable && hasData && selectedIds && data.every(row => selectedIds.has(row[rowKey]));
  const someSelected = selectable && hasData && selectedIds && data.some(row => selectedIds.has(row[rowKey]));

  // Total column count (for colSpan on state rows)
  const colCount =
    columns.length +
    (selectable ? 1 : 0) +
    (showSerial ? 1 : 0);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(row => row[rowKey])));
    }
  }, [allSelected, data, rowKey, onSelectionChange]);

  const handleSelectRow = useCallback((id, e) => {
    e.stopPropagation();
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }, [selectedIds, onSelectionChange]);

  const handleRowClick = useCallback((row) => {
    if (onRowClick) onRowClick(row);
  }, [onRowClick]);

  const handleHeaderSort = useCallback((colKey) => {
    if (onSortChange) onSortChange(colKey);
  }, [onSortChange]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className={`${styles.wrapper} ${className}`} style={style}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      {(title || toolbarActions || pagination) && (
        <div className={styles.toolbar}>
          <div className={styles.titleGroup}>
            {title    && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p  className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.actions}>
            {pagination && pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={pagination.onPrev}
                  disabled={pagination.currentPage <= 1 || isLoading}
                  aria-label="Previous page"
                >
                  Prev
                </button>
                <span className={styles.pageIndicator}>
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={pagination.onNext}
                  disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
            {toolbarActions}
          </div>
        </div>
      )}

      {/* ── Scrollable table area ────────────────────────────── */}
      <div className={`${styles.scrollArea} ${scrollAreaClassName}`} style={scrollAreaStyle}>
        <table className={styles.table} role="table">
          <thead className={styles.thead}>
            <tr>
              {/* Checkbox header */}
              {selectable && (
                <th 
                  className={`${styles.th} ${styles.checkboxCell}`} 
                  aria-label="Select all"
                  style={selectHeaderLabel ? { width: 'auto', cursor: 'pointer' } : undefined}
                  onClick={selectHeaderLabel ? handleSelectAll : undefined}
                >
                  {selectHeaderLabel ? (
                    <span style={{ userSelect: 'none' }}>{selectHeaderLabel}</span>
                  ) : (
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  )}
                </th>
              )}

              {/* Serial number header */}
              {showSerial && (
                <th className={`${styles.th} ${styles.snoCell}`}>S.No</th>
              )}

              {/* Column headers */}
              {columns.map(col => {
                const isSorted = sort && sort.key === col.key;
                const thCls = [
                  styles.th,
                  col.sortable ? styles.sortable : '',
                  isSorted ? styles.sortActive : '',
                  col.align === 'center' ? styles.center : '',
                  col.align === 'right'  ? styles.right  : '',
                ].filter(Boolean).join(' ');

                return (
                  <th
                    key={col.key}
                    className={thCls}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={col.sortable ? () => handleHeaderSort(col.key) : undefined}
                    aria-sort={isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className={styles.thInner}>
                      {col.header}
                      {col.sortable && (
                        <SortIcon direction={isSorted ? sort.direction : null} />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {/* ── Loading state ──────────────────────────────── */}
            {isLoading && (
              <tr className={styles.stateRow}>
                <td className={styles.stateCell} colSpan={colCount}>
                  <div className={styles.stateContent}>
                    <div className={styles.spinner} aria-hidden="true" />
                    <span className={styles.stateText}>{loadingText}</span>
                  </div>
                </td>
              </tr>
            )}

            {/* ── Empty state ────────────────────────────────── */}
            {!isLoading && !hasData && (
              <tr className={styles.stateRow}>
                <td className={styles.stateCell} colSpan={colCount}>
                  <div className={styles.stateContent}>
                    <span className={styles.stateIcon}>📋</span>
                    <span className={styles.stateText}>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}

            {/* ── Data rows ──────────────────────────────────── */}
            {!isLoading && hasData && data.map((row, index) => {
              const id = row[rowKey];
              const isSelected = selectable && selectedIds && selectedIds.has(id);
              const variant = getRowVariant ? getRowVariant(row) : null;

              const trCls = [
                styles.tr,
                onRowClick ? styles.trClickable : '',
                isSelected || variant === 'selected' ? styles.trSelected : '',
                variant === 'blocked' ? styles.trBlocked : '',
              ].filter(Boolean).join(' ');

              return (
                <tr
                  key={id}
                  className={trCls}
                  onClick={() => handleRowClick(row)}
                  aria-selected={isSelected || undefined}
                >
                  {/* Checkbox cell */}
                  {selectable && (
                    <td
                      className={`${styles.td} ${styles.checkboxCell}`}
                      onClick={e => handleSelectRow(id, e)}
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}

                  {/* Serial number cell */}
                  {showSerial && (
                    <td className={`${styles.td} ${styles.snoCell}`}>
                      {serialOffset + index + 1}
                    </td>
                  )}

                  {/* Data cells */}
                  {columns.map(col => {
                    const tdCls = [
                      styles.td,
                      col.align === 'center' ? styles.center : '',
                      col.align === 'right'  ? styles.right  : '',
                      col.wrap               ? styles.wrap   : '',
                    ].filter(Boolean).join(' ');

                    const cellContent = col.render
                      ? col.render(row, index)
                      : (row[col.key] ?? '—');

                    return (
                      <td
                        key={col.key}
                        className={tdCls}
                        onClick={col.stopPropagation ? e => e.stopPropagation() : undefined}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer slot ─────────────────────────────────────── */}
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
}

export default DataTable;
