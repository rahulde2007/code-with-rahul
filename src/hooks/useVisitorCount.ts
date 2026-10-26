import { useState, useEffect, useRef } from 'react';
import { getVisitorId } from '../lib/visitor';

// Module-level cache to guarantee only one POST request is sent across StrictMode double-invocations
let cachedVisitorCount: number | null = null;
let inFlightVisitPromise: Promise<number | null> | null = null;

async function recordVisitOnce(visitorId: string): Promise<number | null> {
  if (cachedVisitorCount !== null) {
    return cachedVisitorCount;
  }

  if (inFlightVisitPromise) {
    return inFlightVisitPromise;
  }

  inFlightVisitPromise = (async () => {
    try {
      const response = await fetch('/api/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (typeof data?.visitorCount === 'number') {
        cachedVisitorCount = data.visitorCount;
        return data.visitorCount;
      }
      return null;
    } catch (err) {
      console.warn('Failed to record site visit via POST, falling back to GET:', err);
      try {
        const getResponse = await fetch('/api/visit', { method: 'GET' });
        if (getResponse.ok) {
          const getData = await getResponse.json();
          if (typeof getData?.visitorCount === 'number') {
            cachedVisitorCount = getData.visitorCount;
            return getData.visitorCount;
          }
        }
      } catch (getErr) {
        console.warn('Failed to fetch visitor count fallback via GET:', getErr);
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
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    const visitorId = getVisitorId();
    recordVisitOnce(visitorId).then((count) => {
      if (typeof count === 'number') {
        setVisitorCount(count);
      }
      setIsLoading(false);
    });
  }, []);

  return { visitorCount, isLoading };
}
