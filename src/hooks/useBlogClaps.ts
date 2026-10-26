import { useState, useEffect, useRef } from 'react';
import { getVisitorId } from '../lib/visitor';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface UseBlogClapsReturn {
  blogClaps: number | null;
  userHasClapped: boolean;
  clappingBlog: boolean;
  blogClapsError: string | null;
  handleBlogClap: () => Promise<void>;
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export const useBlogClaps = (slug: string | undefined): UseBlogClapsReturn => {
  const [blogClaps, setBlogClaps] = useState<number | null>(null);
  const [userHasClapped, setUserHasClapped] = useState<boolean>(false);
  const [clappingBlog, setClappingBlog] = useState<boolean>(false);
  const [blogClapsError, setBlogClapsError] = useState<string | null>(null);

  const hasFetchedRef = useRef<string | null>(null);

  const saveUserClap = () => {
    if (!slug) return;
    try {
      const existing = JSON.parse(localStorage.getItem('clappedBlogs') || '[]');
      if (Array.isArray(existing) && !existing.includes(slug)) {
        existing.push(slug);
        localStorage.setItem('clappedBlogs', JSON.stringify(existing));
      }
    } catch (error) {
      console.warn('Unable to save user clap to localStorage:', error);
    }
  };

  const loadBlogClaps = async () => {
    if (!slug) return;

    const visitorId = getVisitorId();

    try {
      const res = await fetch(
        `/api/claps?slug=${encodeURIComponent(slug)}&visitorId=${encodeURIComponent(visitorId)}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      const count =
        typeof data.clapCount === 'number'
          ? data.clapCount
          : (typeof data.clap_count === 'number' ? data.clap_count : 0);

      setBlogClaps(count);

      // Server is the single source of truth for clap state
      if (data.hasClapped === true) {
        setUserHasClapped(true);
        saveUserClap();
      } else {
        setUserHasClapped(false);
      }
    } catch (error) {
      console.warn('Unable to load blog claps count:', error);
      // Fallback: If network failed, set 0 if still null so UI doesn't hang
      setBlogClaps((prev) => (prev === null ? 0 : prev));
    }
  };

  const handleBlogClap = async () => {
    if (!slug || userHasClapped || clappingBlog) return;

    const previousCount = blogClaps;
    const previousHasClapped = userHasClapped;

    // 1. Optimistic update
    setUserHasClapped(true);
    setBlogClaps((prev) => (typeof prev === 'number' ? prev + 1 : 1));
    setClappingBlog(true);
    setBlogClapsError(null);

    // 2. Localhost guard: do not send POST to avoid altering live database counts
    if (isLocalhost()) {
      setClappingBlog(false);
      return;
    }

    // 3. Live production: persist clap via POST /api/claps
    try {
      const visitorId = getVisitorId();
      const response = await fetch('/api/claps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, visitorId }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      const count =
        typeof result.clapCount === 'number'
          ? result.clapCount
          : (typeof result.clap_count === 'number' ? result.clap_count : null);

      if (count !== null) {
        setBlogClaps(count);
      }
      setUserHasClapped(true);
      saveUserClap();
    } catch (error) {
      console.error('Failed to save blog clap:', error);
      // Rollback optimistic update
      setBlogClaps(previousCount);
      setUserHasClapped(previousHasClapped);
      setBlogClapsError('Failed to record clap. Please try again.');
    } finally {
      setClappingBlog(false);
    }
  };

  // Real-time updates effect (if Supabase configured)
  useEffect(() => {
    if (!slug || !isSupabaseConfigured) return;

    let channel: any;
    const removeChannel = () => {
      if (!channel) return;
      try {
        const removal = supabase.removeChannel(channel);
        if (removal && typeof removal.catch === 'function') {
          removal.catch(() => {});
        }
      } catch {}
    };

    try {
      channel = supabase.channel(`blog-claps-${slug}`);
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_claps',
          filter: `post_slug=eq.${slug}`,
        },
        () => void loadBlogClaps()
      );
      channel.subscribe();
    } catch {
      removeChannel();
      return;
    }

    return removeChannel;
  }, [slug]);

  // Load claps on mount with StrictMode ref guard
  useEffect(() => {
    if (!slug) return;
    if (hasFetchedRef.current === slug) return;
    hasFetchedRef.current = slug;

    loadBlogClaps();
  }, [slug]);

  return {
    blogClaps,
    userHasClapped,
    clappingBlog,
    blogClapsError,
    handleBlogClap,
  };
};
