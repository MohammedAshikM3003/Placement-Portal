// Shared profile utilities: resolve backend/gridfs URLs and optional blob caching
const blobCache = new Map(); // url -> {blobUrl, sourceUrl}

export const resolveProfileUrl = (url, apiBase = '') => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  // Determine runtime base: prefer provided apiBase, else fallback to window.location.origin
  const base = (apiBase && apiBase.replace(/\/api\/?$/, '')) || (typeof window !== 'undefined' ? window.location.origin : '');
  // Use proxy endpoint when configured at build time
  const useProxy = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_USE_PROXY === 'true');
  // Rewrite localhost/127.0.0.1 absolute URLs to the current runtime backend base.
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : base);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      const sanitizedPath = parsed.pathname + parsed.search + parsed.hash;
      if (sanitizedPath.startsWith('/api/file/')) {
        const id = sanitizedPath.replace(/.*\/api\/file\//, '');
        return useProxy ? `${base}/api/proxy/image/${id}` : `${base}/api/file/${id}`;
      }
      if (sanitizedPath.startsWith('/file/')) {
        const id = sanitizedPath.replace('/file/', '');
        return useProxy ? `${base}/api/proxy/image/${id}` : `${base}/api/file/${id}`;
      }
      return sanitizedPath;
    }
  } catch (_e) {
    // Not an absolute URL; continue with relative handling below.
  }
  // If backend base provided and url starts with /api/file or /file
  if (url.startsWith('/api/file/')) {
    const id = url.replace(/.*\/api\/file\//, '');
    return useProxy ? `${base}/api/proxy/image/${id}` : `${base}/api/file/${id}`;
  }
  if (url.startsWith('/file/')) {
    const id = url.replace('/file/', '');
    return useProxy ? `${base}/api/proxy/image/${id}` : `${base}/api/file/${id}`;
  }
  // If MongoDB ObjectId-like string (24 hex chars) treat as file id
  if (/^[a-f0-9]{24}$/i.test(url)) return useProxy ? `${base}/api/proxy/image/${url}` : `${base}/api/file/${url}`;
  return url;
};

export const fetchAndCacheBlob = async (url) => {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http') && url.includes(window.location.host)) return url;
  const cached = blobCache.get(url);
  if (cached && cached.sourceUrl === url) return cached.blobUrl || url;
  // If another blob exists for different source, revoke it
  if (cached && cached.blobUrl && cached.sourceUrl !== url) {
    try { URL.revokeObjectURL(cached.blobUrl); } catch (_) {}
    blobCache.delete(url);
  }
  try {
    // Forward auth token if present to allow proxy/backend to validate protected files
    const token = (typeof window !== 'undefined') ? (localStorage.getItem('authToken') || localStorage.getItem('adminToken') || localStorage.getItem('coordinatorToken')) : null;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(url, { mode: 'cors', headers });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    if (blob.size > 0) {
      const blobUrl = URL.createObjectURL(blob);
      blobCache.set(url, { blobUrl, sourceUrl: url });
      return blobUrl;
    }
    return url;
  } catch (e) {
    return url;
  }
};

export const clearBlobCache = () => {
  for (const { blobUrl } of blobCache.values()) {
    try { URL.revokeObjectURL(blobUrl); } catch (_) {}
  }
  blobCache.clear();
};

export const canonicalStorePath = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : '');
    // If it contains /api/file/<id>
    const match = u.pathname.match(/\/api\/file\/([a-f0-9]{24})/i);
    if (match) return `/api/file/${match[1]}`;
    // If path is /file/<id>
    const match2 = u.pathname.match(/\/file\/([a-f0-9]{24})/i);
    if (match2) return `/api/file/${match2[1]}`;
  } catch (_e) {
    // not an absolute URL
  }
  if (url.startsWith('/api/file/')) return url;
  if (url.startsWith('/file/')) return `/api/file/${url.replace('/file/', '')}`;
  if (/^[a-f0-9]{24}$/i.test(url)) return `/api/file/${url}`;
  return url;
};

export default {
  resolveProfileUrl,
  fetchAndCacheBlob,
  clearBlobCache,
  canonicalStorePath
};
