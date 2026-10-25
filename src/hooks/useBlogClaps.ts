import { useState, useEffect } from 'react';
import { getVisitorId } from '../lib/visitor';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface UseBlogClapsReturn {
  blogClaps: number;
  userHasClapped: boolean;
  clappingBlog: boolean;
  blogClapsError: string | null;
  handleBlogClap: () => Promise<void>;
}

export const useBlogClaps = (slug: string | undefined): UseBlogClapsReturn => {
  const [blogClaps, setBlogClaps] = useState(0);
  const [userHasClapped, setUserHasClapped] = useState(false);
  const [clappingBlog, setClappingBlog] = useState(false);
  const [blogClapsError, setBlogClapsError] = useState<string | null>(null);

  const loadUserClapHistory = () => {
    if (!slug) return;
    try {
      const clapped = JSON.parse(localStorage.getItem('clappedBlogs') || '[]');
      setUserHasClapped(Array.isArray(clapped) && clapped.includes(slug));
    } catch (error) {
      console.warn('Unable to load saved blog claps:', error);
    }
  };

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
    loadUserClapHistory();

    const visitorId = getVisitorId();

    try {
      const res = await fetch(
        `/api/claps?slug=${encodeURIComponent(slug)}&visitorId=${encodeURIComponent(visitorId)}`
      );
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (typeof data.clap_count === 'number') {
        setBlogClaps(data.clap_count);
      }
      if (data.hasClapped) {
        setUserHasClapped(true);
        saveUserClap();
      }
    } catch (error) {
      console.warn('Unable to load blog claps count:', error);
    }
  };

  const handleBlogClap = async () => {
    if (!slug || userHasClapped || clappingBlog) return;

    const previousCount = blogClaps;
    const visitorId = getVisitorId();

    // 1. Optimistic update
    setClappingBlog(true);
    setUserHasClapped(true);
    setBlogClaps((prev) => prev + 1);
    saveUserClap();
    setBlogClapsError(null);

    try {
      // 2. Persist clap via serverless function
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
      if (typeof result.clap_count === 'number') {
        setBlogClaps(result.clap_count);
      }
      if (result.alreadyClapped) {
        setUserHasClapped(true);
      }
    } catch (error) {
      console.error('Failed to save blog clap:', error);
      // Rollback optimistic update
      setBlogClaps(previousCount);
      setUserHasClapped(false);
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

  // Load claps on mount
  useEffect(() => {
    if (slug) {
      loadBlogClaps();
    }
  }, [slug]);

  return {
    blogClaps,
    userHasClapped,
    clappingBlog,
    blogClapsError,
    handleBlogClap,
  };
};
