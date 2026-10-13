import { useState, useEffect, useRef } from 'react';
import { commentService, isSupabaseConfigured, supabase } from '../lib/supabase';

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
    try {
      const [lovesResult, likesResult] = await Promise.allSettled([
        commentService.getBlogLovesCount(slug),
        commentService.getBlogLikesCount(slug),
      ]);
      if (lovesResult.status === 'fulfilled') setBlogLoves(lovesResult.value);
      if (likesResult.status === 'fulfilled') setBlogLikes(likesResult.value);
      if (lovesResult.status === 'rejected' || likesResult.status === 'rejected') {
        console.warn('Unable to load one or more blog reaction counts:', {
          loves: lovesResult.status === 'rejected' ? lovesResult.reason : undefined,
          likes: likesResult.status === 'rejected' ? likesResult.reason : undefined,
        });
      }
    } catch (error) {
      console.warn('Unable to load blog reactions:', error);
    }
  };

  const handleBlogLove = async () => {
    if (!slug || userHasLoved || lovingBlog) return;
    try {
      setLovingBlog(true);
      await commentService.loveBlogPost(slug, userId);
      saveUserReaction('love');
      setBlogLoves((p) => p + 1);
      setUserHasLoved(true);
      setBlogReactionsError(null);
    } catch (error) {
      console.error('Failed to save blog love:', error);
      setBlogReactionsError('Failed to love the post.');
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
      console.error('Failed to save blog like:', error);
      setBlogReactionsError('Failed to like the post.');
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
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_loves',
          filter: `blog_slug=eq.${slug}`,
        },
        () => void loadBlogReactions()
      );
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
