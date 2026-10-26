import { useState, useEffect, useRef } from 'react';

const VISITOR_ID_KEY = 'blog_visitor_id';

// Module-level state across renders in the same session
let moduleVisitorId: string | null = null;
let cachedVisitorCount: number | null = null;
let inFlightVisitPromise: Promise<number | null> | null = null;

function generateVisitorId(): string {
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
 * Resolves persistent anonymous visitor ID:
 * 1. Checks module variable (preserves consistent ID within the same page session)
 * 2. Checks localStorage (reads first; generates and saves if absent)
 * 3. Falls back to cookie if localStorage fails (disabled/blocked)
 * 4. Falls back to in-memory module variable if cookie also fails
 * Does not generate a new ID on repeated calls.
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
    id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      const cookieVal = getCookie(VISITOR_ID_KEY);
      id = cookieVal || generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    setCookie(VISITOR_ID_KEY, id);
  } catch {
    // 3. localStorage failed, fallback to cookie
    try {
      id = getCookie(VISITOR_ID_KEY);
      if (!id) {
        id = generateVisitorId();
        setCookie(VISITOR_ID_KEY, id);
      }
    } catch {
      // 4. Cookie also failed, fallback to in-memory
      if (!id) {
        id = generateVisitorId();
      }
    }
  }

  if (!id) {
    id = generateVisitorId();
  }

  moduleVisitorId = id;
  return id;
}

/**
 * Sends POST /api/visit with visitorId.
 * If POST fails, falls back to GET /api/visit to retrieve visitor count.
 */
async function recordVisitOnce(visitorId: string): Promise<number | null> {
  if (cachedVisitorCount !== null) {
    return cachedVisitorCount;
  }

  if (inFlightVisitPromise) {
    return inFlightVisitPromise;
  }

  inFlightVisitPromise = (async () => {
    try {
      // Attempt POST /api/visit with { visitorId }
      const response = await fetch('/api/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId }),
      });

      if (!response.ok) {
        throw new Error(`POST /api/visit failed with status ${response.status}`);
      }

      const data = await response.json();
      if (typeof data?.visitorCount === 'number') {
        cachedVisitorCount = data.visitorCount;
        return data.visitorCount;
      }
      const count = Number(data?.visitorCount);
      if (!isNaN(count)) {
        cachedVisitorCount = count;
        return count;
      }
      return null;
    } catch (postErr) {
      console.warn('POST /api/visit failed, falling back to GET /api/visit:', postErr);
      try {
        const getResponse = await fetch('/api/visit', { method: 'GET' });
        if (getResponse.ok) {
          const getData = await getResponse.json();
          if (typeof getData?.visitorCount === 'number') {
            cachedVisitorCount = getData.visitorCount;
            return getData.visitorCount;
          }
          const count = Number(getData?.visitorCount);
          if (!isNaN(count)) {
            cachedVisitorCount = count;
            return count;
          }
        }
      } catch (getErr) {
        console.warn('Fallback GET /api/visit also failed:', getErr);
      }
      return null;
    } finally {
      inFlightVisitPromise = null;
    }
  })();

  return inFlightVisitPromise;
}

export interface UseVisitorCountReturn {
  visitorCount: number | null;
  isLoading: boolean;
}

export function useVisitorCount(): UseVisitorCountReturn {
  const [visitorCount, setVisitorCount] = useState<number | null>(() => cachedVisitorCount);
  const [isLoading, setIsLoading] = useState<boolean>(() => cachedVisitorCount === null);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    // StrictMode guard: useRef prevents duplicate POST invocation in React StrictMode
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const visitorId = getVisitorId();
    if (!visitorId) {
      setIsLoading(false);
      return;
    }

    if (cachedVisitorCount !== null) {
      setVisitorCount(cachedVisitorCount);
      setIsLoading(false);
      return;
    }

    recordVisitOnce(visitorId).then((count) => {
      if (typeof count === 'number') {
        setVisitorCount(count);
      }
      setIsLoading(false);
    });
  }, []);

  return { visitorCount, isLoading };
}
