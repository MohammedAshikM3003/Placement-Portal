const sanitizeCacheSegment = (value) => {
  const text = String(value || '').trim().toLowerCase();
  const sanitized = text.replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return sanitized || 'default';
};

export const getCoordinatorCacheScope = (source = null) => {
  const candidate = source && typeof source === 'object'
    ? source.coordinatorId || source.username || source._id || source.id || source.staffId
    : null;

  if (candidate) return sanitizeCacheSegment(candidate);

  try {
    const stored = JSON.parse(localStorage.getItem('coordinatorData') || 'null');
    if (stored) {
      const storedCandidate = stored.coordinatorId || stored.username || stored._id || stored.id || stored.staffId;
      if (storedCandidate) return sanitizeCacheSegment(storedCandidate);
    }
  } catch (_error) {}

  try {
    const currentId = localStorage.getItem('coordinatorId') || localStorage.getItem('coordinatorUsername');
    if (currentId) return sanitizeCacheSegment(currentId);
  } catch (_error) {}

  return 'default';
};

export const getCoordinatorScopedKey = (baseKey, source = null) => {
  return `${baseKey}_${getCoordinatorCacheScope(source)}`;
};

export const clearCoordinatorScopedCache = (baseKeys = []) => {
  if (typeof localStorage === 'undefined') return;

  const keysToRemove = new Set();
  Object.keys(localStorage).forEach((key) => {
    if (baseKeys.some((baseKey) => key === baseKey || key.startsWith(`${baseKey}_`))) {
      keysToRemove.add(key);
    }
  });

  keysToRemove.forEach((key) => localStorage.removeItem(key));
};