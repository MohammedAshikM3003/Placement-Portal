// One-time cache migration utilities to sanitize/remove bad cached URLs
const LOCALHOST_HOSTNAMES = ['localhost', '127.0.0.1'];

const looksLikeUrl = (v) => {
  try { new URL(v, window.location.origin); return true; } catch (e) { return false; }
};

const sanitizeValue = (v) => {
  if (!v || typeof v !== 'string') return v;
  try {
    const u = new URL(v, window.location.origin);
    if (LOCALHOST_HOSTNAMES.includes(u.hostname)) {
      return u.pathname + u.search + u.hash; // return as relative path for resolver
    }
    return v;
  } catch (e) {
    return v;
  }
};

const migrateAdminProfileCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    let changed = false;
    ['profilePhoto','collegeBanner','naacCertificate','nbaCertificate','collegeLogo'].forEach(f => {
      if (parsed[f] && looksLikeUrl(parsed[f])) {
        const s = sanitizeValue(parsed[f]);
        if (s !== parsed[f]) { parsed[f] = s; changed = true; }
      }
    });
    if (changed) localStorage.setItem(key, JSON.stringify(parsed));
    return changed;
  } catch (e) {
    return false;
  }
};

const migrateCollegeImagesCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    let changed = false;
    ['collegeLogo','collegeBanner','naacCertificate','nbaCertificate'].forEach(f => {
      if (parsed[f] && looksLikeUrl(parsed[f])) {
        const s = sanitizeValue(parsed[f]);
        if (s !== parsed[f]) { parsed[f] = s; changed = true; }
      }
    });
    if (changed) localStorage.setItem(key, JSON.stringify(parsed));
    return changed;
  } catch (e) { return false; }
};

export const runCacheMigration = () => {
  try {
    const marker = 'cacheMigration_v1_done';
    if (localStorage.getItem(marker)) return false;

    let touched = false;
    // Admin profile cache key
    if (localStorage.getItem('adminProfileCache')) {
      touched = migrateAdminProfileCache('adminProfileCache') || touched;
    }
    // College images cache
    if (localStorage.getItem('collegeImagesCache')) {
      touched = migrateCollegeImagesCache('collegeImagesCache') || touched;
    }
    // coordinator cached profile inside coordinatorData
    if (localStorage.getItem('coordinatorData')) {
      try {
        const raw = JSON.parse(localStorage.getItem('coordinatorData'));
        if (raw && raw.profilePhoto && looksLikeUrl(raw.profilePhoto)) {
          const s = sanitizeValue(raw.profilePhoto);
          if (s !== raw.profilePhoto) { raw.profilePhoto = s; localStorage.setItem('coordinatorData', JSON.stringify(raw)); touched = true; }
        }
      } catch (e) {}
    }

    localStorage.setItem(marker, touched ? '1' : '1');
    return touched;
  } catch (e) {
    try { localStorage.setItem('cacheMigration_v1_done','1'); } catch (_){}
    return false;
  }
};

export default { runCacheMigration };
