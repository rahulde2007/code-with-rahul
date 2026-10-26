import { useState, useEffect, useRef } from 'react';
import { getVisitorId } from '../lib/visitor';

// Module-level cache across re-renders within the session
const cachedBlogViews = new Map<string, number>();
const inFlightViewPromises = new Map<string, Promise<number | null>>();

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Records a blog view once:
 * - On localhost / 127.0.0.1: Does NOT send POST /api/views. Only sends GET /api/views to read count.
 * - If already viewed in this browser (localStorage 'blog_viewed_<slug>'): Only sends GET /api/views.
 * - Otherwise: Sends POST /api/views with { slug, visitorId }, marks localStorage 'blog_viewed_<slug>', and returns count.
 * - React 18 StrictMode & in-flight promise deduplication ensures at most one network call per slug.
 */
async function recordOrFetchBlogView(slug: string, visitorId: string): Promise<number | null> {
  if (cachedBlogViews.has(slug)) {
    return cachedBlogViews.get(slug)!;
  }

  const existingPromise = inFlightViewPromises.get(slug);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    const storageKey = `blog_viewed_${slug}`;
    let alreadyViewedInBrowser = false;
    try {
      alreadyViewedInBrowser = localStorage.getItem(storageKey) === 'true';
    } catch {
      alreadyViewedInBrowser = false;
    }

    const isLocal = isLocalhost();

    // 1. If running on localhost or already viewed in this browser, only fetch view count with GET
    if (isLocal || alreadyViewedInBrowser) {
      try {
        const getRes = await fetch(`/api/views?slug=${encodeURIComponent(slug)}`);
        if (getRes.ok) {
          const getData = await getRes.json();
          const count =
            typeof getData?.viewCount === 'number'
              ? getData.viewCount
              : Number(getData?.viewCount);
          if (!isNaN(count)) {
            cachedBlogViews.set(slug, count);
            return count;
          }
        }
      } catch (err) {
        console.error('Error fetching blog view count:', err);
      }
      return null;
    }

    // 2. Production & first time in browser: Send POST /api/views
    try {
      const response = await fetch('/api/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, visitorId }),
      });

      if (!response.ok) {
        throw new Error(`POST /api/views returned status ${response.status}`);
      }

      const data = await response.json();

      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // Ignore localStorage write error (e.g. private mode)
      }

      const count =
        typeof data?.viewCount === 'number'
          ? data.viewCount
          : Number(data?.viewCount);

      if (!isNaN(count)) {
        cachedBlogViews.set(slug, count);
        return count;
      }
      return null;
    } catch (postErr) {
      console.warn('POST /api/views failed, falling back to GET /api/views:', postErr);
      // Fallback to GET
      try {
        const getRes = await fetch(`/api/views?slug=${encodeURIComponent(slug)}`);
        if (getRes.ok) {
          const getData = await getRes.json();
          const count =
            typeof getData?.viewCount === 'number'
              ? getData.viewCount
              : Number(getData?.viewCount);
          if (!isNaN(count)) {
            cachedBlogViews.set(slug, count);
            return count;
          }
        }
      } catch (getErr) {
        console.error('Fallback GET /api/views also failed:', getErr);
      }
      return null;
    } finally {
      inFlightViewPromises.delete(slug);
    }
  })();

  inFlightViewPromises.set(slug, promise);
  return promise;
}

export interface UseBlogViewsReturn {
  viewCount: number | null;
  isLoading: boolean;
}

export function useBlogViews(slug: string | undefined): UseBlogViewsReturn {
  const [viewCount, setViewCount] = useState<number | null>(() => {
    return slug && cachedBlogViews.has(slug) ? cachedBlogViews.get(slug)! : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !slug || !cachedBlogViews.has(slug);
  });

  const hasExecutedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    // StrictMode ref guard: prevent duplicate execution for the same slug
    if (hasExecutedRef.current === slug) {
      if (cachedBlogViews.has(slug)) {
        setViewCount(cachedBlogViews.get(slug)!);
        setIsLoading(false);
      }
      return;
    }
    hasExecutedRef.current = slug;

    if (cachedBlogViews.has(slug)) {
      setViewCount(cachedBlogViews.get(slug)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const visitorId = getVisitorId();
    recordOrFetchBlogView(slug, visitorId).then((count) => {
      if (typeof count === 'number') {
        setViewCount(count);
      }
      setIsLoading(false);
    });
  }, [slug]);

  return { viewCount, isLoading };
}
