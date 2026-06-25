import { useState, useEffect } from 'react';

/**
 * useDebounce
 * Delays updating the returned value until after delay ms of inactivity.
 * Use for search inputs to avoid firing on every keystroke.
 *
 * @param {*}      value - Value to debounce
 * @param {number} delay - Debounce delay in ms (default: 300)
 * @returns Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
