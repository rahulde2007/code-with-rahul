import Giscus from '@giscus/react';
import { useEffect, useState, memo } from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import './giscus-comments.css';

interface GiscusCommentsProps {
  slug: string;
}

const GiscusComments = ({ slug }: GiscusCommentsProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const repo = (import.meta.env.VITE_GISCUS_REPO || 'rahulde2007/code-with-rahul') as `${string}/${string}`;
  const repoId = import.meta.env.VITE_GISCUS_REPO_ID || 'R_kgDOVG7QHg';
  const category = import.meta.env.VITE_GISCUS_CATEGORY || 'Blog Comments';
  const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID || 'DIC_kwDOVG7QHs4DJT7E';

  useEffect(() => {
    console.log('🗨️ GiscusComments component loaded for slug:', slug);

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [slug]);

  if (!isLoaded || !slug) {
    return null;
  }

  const giscusTheme = theme === 'dark' ? 'transparent_dark' : 'light';

  return (
    <div className="mt-6 pt-4">
      <h4 className="text-xl md:text-2xl font-semibold text-foreground mb-6 font-hanken">
        Comments
      </h4>
      {repoId && categoryId ? (
        <div className="giscus-wrapper">
          <Giscus
            key={`giscus-${slug}-${giscusTheme}`}
            id="comments"
            repo={repo}
            repoId={repoId}
            category={category}
            categoryId={categoryId}
            mapping="specific"
            term={`blog-{${slug}}`}
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="bottom"
            theme={giscusTheme}
            lang="en"
            loading="eager"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Comments are not configured for this repository.
        </p>
      )}
    </div>
  );
};

export default memo(GiscusComments);
