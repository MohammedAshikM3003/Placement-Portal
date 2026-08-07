import { useState, useMemo } from 'react';

/**
 * useSearch
 * Filters an array by a search term across specified keys.
 *
 * @param {Array}    data   - Full dataset
 * @param {string[]} keys   - Object keys to search within
 * @returns {{ query, setQuery, filtered }}
 */
export function useSearch(data = [], keys = []) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(item =>
      keys.some(key => String(item[key] ?? '').toLowerCase().includes(q))
    );
  }, [data, keys, query]);

  return { query, setQuery, filtered };
}

export default useSearch;
