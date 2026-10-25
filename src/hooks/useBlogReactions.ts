import { useState, useEffect, useRef } from 'react';
import { commentService, isSupabaseConfigured, supabase } from '../lib/supabase';
import { getVisitorId } from '../lib/visitor';

interface UseBlogReactionsReturn {
  // State
  blogLoves: number;
  userHasLoved: boolean;
  lovingBlog: boolean;
  blogLikes: number;
  userHasLiked: boolean;
  likingBlog: boolean;
  blogReactionsError: string | null;

  // Functions
  handleBlogLove: () => Promise<void>;
  handleBlogLike: () => Promise<void>;
}

export const useBlogReactions = (slug: string | undefined): UseBlogReactionsReturn => {
  const [blogLoves, setBlogLoves] = useState(0);
  const [userHasLoved, setUserHasLoved] = useState(false);
  const [lovingBlog, setLovingBlog] = useState(false);

  const [blogLikes, setBlogLikes] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [likingBlog, setLikingBlog] = useState(false);

  const [blogReactionsError, setBlogReactionsError] = useState<string | null>(null);

  const userId = useRef('blog-user-' + Math.random().toString(36).slice(2, 11)).current;

  const loadUserReactionHistory = () => {
    if (!slug) return;
    try {
      const loved = JSON.parse(localStorage.getItem('lovedBlogs') || '[]');
      const liked = JSON.parse(localStorage.getItem('likedBlogs') || '[]');
      setUserHasLoved(Array.isArray(loved) && loved.includes(slug));
      setUserHasLiked(Array.isArray(liked) && liked.includes(slug));
    } catch (error) {
      console.warn('Unable to load saved blog reactions:', error);
    }
  };

  const saveUserReaction = (type: 'love' | 'like') => {
    if (!slug) return;
    const key = type === 'love' ? 'lovedBlogs' : 'likedBlogs';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(existing)) return;
    if (!existing.includes(slug)) {
      existing.push(slug);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  };

  const loadBlogReactions = async () => {
    if (!slug) return;
    loadUserReactionHistory();

    const visitorId = getVisitorId();

    try {
      // 1. Fetch real like count and visitor like status from /api/likes
      const likesPromise = fetch(
        `/api/likes?slug=${encodeURIComponent(slug)}&visitorId=${encodeURIComponent(visitorId)}`
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (typeof data.like_count === 'number') {
            setBlogLoves(data.like_count);
          }
          if (data.hasLiked) {
            setUserHasLoved(true);
            saveUserReaction('love');
          }
        });

      // 2. Fetch claps count
      const clapsPromise = commentService
        .getBlogLikesCount(slug)
        .then((count) => setBlogLikes(count))
        .catch((err) => console.warn('Unable to load blog claps:', err));

      await Promise.allSettled([likesPromise, clapsPromise]);
    } catch (error) {
      console.warn('Unable to load blog reactions:', error);
    }
  };

  const handleBlogLove = async () => {
    if (!slug || userHasLoved || lovingBlog) return;

    const previousCount = blogLoves;
    const visitorId = getVisitorId();

    // 1. Optimistic update
    setLovingBlog(true);
    setUserHasLoved(true);
    setBlogLoves((prev) => prev + 1);
    saveUserReaction('love');
    setBlogReactionsError(null);

    try {
      // 2. Persist like via serverless function
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
      if (typeof result.like_count === 'number') {
        setBlogLoves(result.like_count);
      }
      if (result.alreadyLiked) {
        setUserHasLoved(true);
      }
    } catch (error) {
      console.error('Failed to save blog like:', error);
      // Rollback optimistic update
      setBlogLoves(previousCount);
      setUserHasLoved(false);
      setBlogReactionsError('Failed to record like. Please try again.');
    } finally {
      setLovingBlog(false);
    }
  };

  const handleBlogLike = async () => {
    if (!slug || userHasLiked || likingBlog) return;
    try {
      setLikingBlog(true);
      await commentService.likeBlogPost(slug, userId);
      saveUserReaction('like');
      setBlogLikes((p) => p + 1);
      setUserHasLiked(true);
      setBlogReactionsError(null);
    } catch (error) {
      console.error('Failed to save blog clap:', error);
      setBlogReactionsError('Failed to clap for the post.');
    } finally {
      setLikingBlog(false);
    }
  };

  // Real-time updates effect
  useEffect(() => {
    if (!slug || !isSupabaseConfigured) return;

    let channel: any;
    const removeChannel = () => {
      if (!channel) return;
      try {
        const removal = supabase.removeChannel(channel);
        if (removal && typeof removal.catch === 'function') {
          removal.catch((error: unknown) => {
            console.error('Unable to clean up blog reaction subscription:', error);
          });
        }
      } catch (error) {
        console.error('Unable to clean up blog reaction subscription:', error);
      }
    };

    try {
      channel = supabase.channel(`blog-reactions-${slug}`);

      // Listen to post_likes real-time changes
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

      // Listen to blog_likes (claps)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_likes',
          filter: `blog_slug=eq.${slug}`,
        },
        () => void loadBlogReactions()
      );

      channel.subscribe();
    } catch (error) {
      console.error('Unable to subscribe to blog reactions:', error);
      removeChannel();
      return;
    }

    return removeChannel;
  }, [slug]);

  // Load reactions on mount
  useEffect(() => {
    if (slug) {
      loadBlogReactions();
    }
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

