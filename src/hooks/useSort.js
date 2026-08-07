import { useState, useMemo } from 'react';

/**
 * useSort
 * Sorts an array by a column key and direction.
 *
 * @param {Array} data - Dataset to sort
 * @returns {{ sortKey, sortDir, sorted, requestSort }}
 */
export function useSort(data = []) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  function requestSort(key) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return { sortKey, sortDir, sorted, requestSort };
}

export default useSort;
