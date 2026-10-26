import { useState, useEffect, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getVisitorId } from '../lib/visitor';

interface UseBlogReactionsReturn {
  blogLoves: number | null;
  userHasLoved: boolean;
  lovingBlog: boolean;
  blogLikes: number | null;
  userHasLiked: boolean;
  likingBlog: boolean;
  blogReactionsError: string | null;
  handleBlogLove: () => Promise<void>;
  handleBlogLike: () => Promise<void>;
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export const useBlogReactions = (slug: string | undefined): UseBlogReactionsReturn => {
  const [blogLoves, setBlogLoves] = useState<number | null>(null);
  const [userHasLoved, setUserHasLoved] = useState<boolean>(false);
  const [lovingBlog, setLovingBlog] = useState<boolean>(false);

  const [blogLikes, setBlogLikes] = useState<number | null>(null);
  const [userHasLiked, setUserHasLiked] = useState<boolean>(false);
  const [likingBlog, setLikingBlog] = useState<boolean>(false);

  const [blogReactionsError, setBlogReactionsError] = useState<string | null>(null);

  const hasFetchedRef = useRef<string | null>(null);

  const saveUserReaction = (type: 'love' | 'like') => {
    if (!slug) return;
    try {
      const key = type === 'love' ? 'lovedBlogs' : 'likedBlogs';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(existing)) return;
      if (!existing.includes(slug)) {
        existing.push(slug);
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch (error) {
      console.warn('Unable to save user reaction to localStorage:', error);
    }
  };

  const loadBlogReactions = async () => {
    if (!slug) return;

    const visitorId = getVisitorId();

    try {
      const res = await fetch(
        `/api/likes?slug=${encodeURIComponent(slug)}&visitorId=${encodeURIComponent(visitorId)}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      const count =
        typeof data.likeCount === 'number'
          ? data.likeCount
          : (typeof data.like_count === 'number' ? data.like_count : 0);

      setBlogLoves(count);

      // Server is the single source of truth for like state
      if (data.hasLiked === true) {
        setUserHasLoved(true);
        saveUserReaction('love');
      } else {
        setUserHasLoved(false);
      }
    } catch (error) {
      console.warn('Unable to load blog reactions:', error);
      // Fallback: If network failed, set 0 if still null so UI doesn't hang
      setBlogLoves((prev) => (prev === null ? 0 : prev));
    }
  };

  const handleBlogLove = async () => {
    if (!slug || userHasLoved || lovingBlog) return;

    const previousCount = blogLoves;
    const previousHasLoved = userHasLoved;

    // 1. Optimistic update
    setUserHasLoved(true);
    setBlogLoves((prev) => (typeof prev === 'number' ? prev + 1 : 1));
    setLovingBlog(true);
    setBlogReactionsError(null);

    // 2. Localhost guard: do not send POST to avoid altering live database counts
    if (isLocalhost()) {
      setLovingBlog(false);
      return;
    }

    // 3. Live production: persist like via POST /api/likes
    try {
      const visitorId = getVisitorId();
      const response = await fetch('/api/likes', {
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
        typeof result.likeCount === 'number'
          ? result.likeCount
          : (typeof result.like_count === 'number' ? result.like_count : null);

      if (count !== null) {
        setBlogLoves(count);
      }
      setUserHasLoved(true);
      saveUserReaction('love');
    } catch (error) {
      console.error('Failed to save blog like:', error);
      // Rollback optimistic update
      setBlogLoves(previousCount);
      setUserHasLoved(previousHasLoved);
      setBlogReactionsError('Failed to record like. Please try again.');
    } finally {
      setLovingBlog(false);
    }
  };

  const handleBlogLike = async () => {
    if (!slug || userHasLiked || likingBlog) return;
    setLikingBlog(true);
    setUserHasLiked(true);
    setBlogLikes((prev) => (typeof prev === 'number' ? prev + 1 : 1));
    saveUserReaction('like');
    setLikingBlog(false);
  };

  // Real-time updates effect (if Supabase is configured)
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
      channel = supabase.channel(`blog-likes-${slug}`);
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
          filter: `post_slug=eq.${slug}`,
        },
        () => void loadBlogReactions()
      );
      channel.subscribe();
    } catch {
      removeChannel();
      return;
    }

    return removeChannel;
  }, [slug]);

  // Load reactions on mount with StrictMode ref guard
  useEffect(() => {
    if (!slug) return;
    if (hasFetchedRef.current === slug) return;
    hasFetchedRef.current = slug;

    loadBlogReactions();
  }, [slug]);

  return {
    blogLoves,
    userHasLoved,
    lovingBlog,
    blogLikes,
    userHasLiked,
    likingBlog,
    blogReactionsError,
    handleBlogLove,
    handleBlogLike,
  };
};
