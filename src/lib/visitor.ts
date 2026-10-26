const VISITOR_ID_KEY = 'blog_visitor_id';

let moduleVisitorId: string | null = null;

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
 * 1. Checks module variable (preserves consistent ID within the same page session)
 * 2. Checks localStorage key "blog_visitor_id" (reads first; creates and saves if absent)
 * 3. Falls back to cookie "blog_visitor_id" (if localStorage fails or is disabled)
 * 4. Falls back to in-memory module variable if cookie also fails
 * Does not generate a new ID on repeated calls or page refreshes.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  // 1. Same session module variable
  if (moduleVisitorId) {
    return moduleVisitorId;
  }

  let id: string | null = null;

  // 2. Try localStorage first
  try {
    const stored = localStorage.getItem(VISITOR_ID_KEY);
    if (stored && stored.trim().length > 0) {
      id = stored.trim();
    }
  } catch {
    // localStorage read failed (e.g. disabled or restricted)
  }

  // 3. Fallback to cookie if absent in localStorage
  if (!id) {
    try {
      const cookieVal = getCookie(VISITOR_ID_KEY);
      if (cookieVal && cookieVal.trim().length > 0) {
        id = cookieVal.trim();
      }
    } catch {
      // cookie read failed
    }
  }

  // 4. Generate once if absent from both
  if (!id) {
    id = generateRandomId();
  }

  // 5. Save to localStorage
  try {
    localStorage.setItem(VISITOR_ID_KEY, id);
  } catch {
    // localStorage write failed
  }

  // 6. Save to cookie
  try {
    setCookie(VISITOR_ID_KEY, id);
  } catch {
    // cookie write failed
  }

  // 7. Store in module-level variable
  moduleVisitorId = id;
  return id;
}

