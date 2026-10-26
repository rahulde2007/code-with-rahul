import React from 'react';
import { Heart } from 'lucide-react';
import { ClappingHandsIcon } from '../icons/SocialIcons';

interface BlogReactionsProps {
  blogLoves: number;
  blogClaps?: number;
  blogLikes?: number;
  userHasLoved: boolean;
  userHasClapped?: boolean;
  userHasLiked?: boolean;
  lovingBlog: boolean;
  clappingBlog?: boolean;
  likingBlog?: boolean;
  onLove: () => void;
  onClap?: () => void;
  onLike?: () => void;
  onShare: () => void;
}

export const BlogReactions: React.FC<BlogReactionsProps> = ({
  blogLoves,
  blogClaps,
  blogLikes,
  userHasLoved,
  userHasClapped,
  userHasLiked,
  lovingBlog,
  clappingBlog,
  likingBlog,
  onLove,
  onClap,
  onLike,
  onShare,
}) => {
  const clapsCount = typeof blogClaps === 'number' ? blogClaps : (blogLikes ?? 0);
  const isClapped = Boolean(userHasClapped ?? userHasLiked);
  const isClapLoading = Boolean(clappingBlog ?? likingBlog);
  const handleClap = onClap || onLike || (() => {});

  return (
    <div className="flex items-center gap-3">
      {/* Heart / Love Button */}
      <button
        type="button"
        onClick={onLove}
        disabled={userHasLoved || lovingBlog}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 group shadow-sm text-sm font-bold font-outfit cursor-pointer disabled:cursor-default touch-manipulation ${
          userHasLoved
            ? 'bg-red-500/15 border-transparent text-red-500'
            : 'bg-card border-border text-foreground hover:bg-accent'
        }`}
        aria-label="Love this post"
      >
        <Heart
          className={`h-4 w-4 group-hover:scale-110 transition-transform duration-200 ${
            userHasLoved ? 'fill-red-600 text-red-500' : 'fill-none'
          }`}
        />
        <span>{blogLoves}</span>
      </button>

      {/* Clapping Hands Button */}
      <button
        type="button"
        onClick={handleClap}
        disabled={isClapped || isClapLoading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 group shadow-sm text-sm font-bold font-outfit cursor-pointer disabled:cursor-default touch-manipulation ${
          isClapped
            ? 'bg-blue-500/15 border-transparent text-blue-500'
            : 'bg-card border-border text-foreground hover:bg-accent'
        }`}
        aria-label="Clap for this post"
      >
        <ClappingHandsIcon
          size="16"
          className={`group-hover:scale-110 transition-transform duration-200 ${
            isClapped ? 'fill-blue-500' : 'fill-current text-foreground'
          }`}
        />
        <span>{clapsCount}</span>
      </button>

      {/* Share Button */}
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-foreground hover:bg-accent transition-all duration-200 group shadow-sm text-sm font-bold font-outfit cursor-pointer touch-manipulation"
        aria-label="Share this post"
      >
        <span>Share</span>
      </button>
    </div>
  );
};

export default BlogReactions;
