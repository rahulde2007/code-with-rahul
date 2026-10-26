import { useState, useEffect, useRef } from 'react';
import { getVisitorId } from '../lib/visitor';

export { getVisitorId };

// Module-level state across renders in the same session
let cachedVisitorCount: number | null = null;
let inFlightVisitPromise: Promise<number | null> | null = null;
let hasRecordedInSession = false;

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Records site visit:
 * - On localhost / 127.0.0.1: Does NOT send POST /api/visit. Only sends GET /api/visit to show count in Footer.
 * - On Live / production: Sends POST /api/visit with visitorId once per session.
 * - If POST fails, falls back to GET /api/visit.
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
      // 1. Localhost check: If running on localhost or 127.0.0.1, do not count visits.
      // Only perform GET /api/visit to display current visitor count.
      if (isLocalhost()) {
        const getResponse = await fetch('/api/visit', { method: 'GET' });
        if (getResponse.ok) {
          const getData = await getResponse.json();
          const count =
            typeof getData?.visitorCount === 'number'
              ? getData.visitorCount
              : Number(getData?.visitorCount);
          if (!isNaN(count)) {
            cachedVisitorCount = count;
            return count;
          }
        }
        return null;
      }

      // 2. Live environment: Guard against sending POST more than once in the same session
      if (hasRecordedInSession && cachedVisitorCount !== null) {
        return cachedVisitorCount;
      }
      hasRecordedInSession = true;

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
    // StrictMode guard: useRef prevents duplicate invocation in React StrictMode
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
