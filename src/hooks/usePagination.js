import { useState, useMemo } from 'react';

/**
 * usePagination
 * Handles page state, page navigation, and slicing data for display.
 *
 * @param {Array}  data       - Full dataset to paginate
 * @param {number} pageSize   - Rows per page (default: 6)
 * @returns {{ page, totalPages, paginatedData, goTo, next, prev, reset }}
 */
export function usePagination(data = [], pageSize = 6) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  function goTo(n)  { setPage(Math.max(1, Math.min(n, totalPages))); }
  function next()   { goTo(page + 1); }
  function prev()   { goTo(page - 1); }
  function reset()  { setPage(1); }

  return { page, totalPages, paginatedData, goTo, next, prev, reset };
}

export default usePagination;
