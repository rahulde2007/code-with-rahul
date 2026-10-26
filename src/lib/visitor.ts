const VISITOR_ID_KEY = 'blog_visitor_id';

let inMemoryVisitorId: string | null = null;

function generateRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, ...rest] = cookie.trim().split('=');
      if (key === name) {
        const val = rest.join('=');
        return val ? decodeURIComponent(val) : null;
      }
    }
  } catch {
    // ignore cookie read errors
  }
  return null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  try {
    const oneYearInSeconds = 365 * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${oneYearInSeconds}; path=/; SameSite=Lax`;
  } catch {
    // ignore cookie write errors
  }
}

/**
 * Returns a persistent anonymous visitor ID for this browser.
 * Follows the resolution order:
 * 1. inMemoryVisitorId (preserves consistent ID within the same page session)
 * 2. localStorage (reads first; creates and saves if absent)
 * 3. cookie fallback (1-year expiration with same key name if localStorage is unavailable)
 * 4. module-level in-memory fallback (prevents ID from changing across calls within page load)
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  // 1. If already resolved in memory during this page load, return it immediately
  if (inMemoryVisitorId) {
    return inMemoryVisitorId;
  }

  let visitorId: string | null = null;

  // 2. Try localStorage first
  try {
    visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      // Check if existing cookie can restore localStorage
      const cookieVal = getCookie(VISITOR_ID_KEY);
      if (cookieVal) {
        visitorId = cookieVal;
      } else {
        visitorId = generateRandomId();
      }
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    // Sync to cookie as fallback backup
    setCookie(VISITOR_ID_KEY, visitorId);
  } catch (err) {
    // localStorage failed (e.g. disabled or SecurityError)
    console.warn('LocalStorage is not accessible for visitorId, falling back to cookie:', err);
    try {
      visitorId = getCookie(VISITOR_ID_KEY);
      if (!visitorId) {
        visitorId = generateRandomId();
        setCookie(VISITOR_ID_KEY, visitorId);
      }
    } catch (cookieErr) {
      console.warn('Cookie is not accessible for visitorId, falling back to in-memory:', cookieErr);
      if (!visitorId) {
        visitorId = generateRandomId();
      }
    }
  }

  // 3. Fallback to memory variable if everything failed
  if (!visitorId) {
    visitorId = generateRandomId();
  }

  inMemoryVisitorId = visitorId;
  return visitorId;
}

