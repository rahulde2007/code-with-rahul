import { useState, useEffect, useCallback, useRef } from 'react';
import { getVisitorId } from '../lib/visitor';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { photos } from '../data/photos';

export interface UsePhotoLikesReturn {
  photoLoveCounts: Record<string, number>;
  userLovedPhotos: Set<string>;
  lovingPhoto: boolean;
  isLoading: boolean;
  photoLikesError: string | null;
  handleLovePhoto: (photoId: string) => Promise<void>;
  refreshPhotoLikes: () => Promise<void>;
}

export const usePhotoLikes = (): UsePhotoLikesReturn => {
  // Counts are initially undefined until batch GET completes
  const [photoLoveCounts, setPhotoLoveCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Red heart is strictly driven by server's hasLiked response (localStorage cannot override server)
  const [userLovedPhotos, setUserLovedPhotos] = useState<Set<string>>(new Set());

  const [lovingPhoto, setLovingPhoto] = useState(false);
  const [photoLikesError, setPhotoLikesError] = useState<string | null>(null);

  // Keep a ref to latest userLovedPhotos for race-condition guards in rapid clicks
  const userLovedPhotosRef = useRef(userLovedPhotos);
  userLovedPhotosRef.current = userLovedPhotos;

  const hasFetchedBatchRef = useRef(false);

  const saveUserLovedToStorage = useCallback((photoId: string) => {
    try {
      const stored = localStorage.getItem('lovedPhotos');
      const parsed = stored ? JSON.parse(stored) : [];
      const list: string[] = Array.isArray(parsed) ? parsed.map(String) : [];
      if (!list.includes(photoId)) {
        list.push(photoId);
        localStorage.setItem('lovedPhotos', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Unable to save lovedPhotos to localStorage:', e);
    }
  }, []);

  const removeUserLovedFromStorage = useCallback((photoId: string) => {
    try {
      const stored = localStorage.getItem('lovedPhotos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((id) => String(id) !== photoId);
          localStorage.setItem('lovedPhotos', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Unable to update lovedPhotos in localStorage:', e);
    }
  }, []);

  // Fetch all photo likes and user like status in a single batch request
  const refreshPhotoLikes = useCallback(async () => {
    try {
      const visitorId = getVisitorId();
      const allPhotoIds = photos.map((p) => p.photoId).join(',');
      const res = await fetch(
        `/api/photo-likes?photoIds=${encodeURIComponent(allPhotoIds)}&visitorId=${encodeURIComponent(visitorId)}`
      );

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data && typeof data.counts === 'object') {
        setPhotoLoveCounts((prev) => {
          const nextCounts: Record<string, number> = { ...prev };
          for (const photo of photos) {
            if (typeof data.counts[photo.photoId] === 'number') {
              nextCounts[photo.photoId] = data.counts[photo.photoId];
            } else if (nextCounts[photo.photoId] === undefined) {
              nextCounts[photo.photoId] = 0;
            }
          }
          return nextCounts;
        });
      }

      // Red heart is strictly set according to server hasLiked truth; localStorage cannot override server
      const serverLoved = new Set<string>();
      if (data?.hasLiked && typeof data.hasLiked === 'object') {
        for (const [id, liked] of Object.entries(data.hasLiked)) {
          if (liked) {
            serverLoved.add(id);
          }
        }
      } else if (Array.isArray(data?.userLikes)) {
        for (const id of data.userLikes) {
          if (typeof id === 'string') {
            serverLoved.add(id);
          }
        }
      }

      setUserLovedPhotos(serverLoved);

      // Sync localStorage with server response
      try {
        localStorage.setItem('lovedPhotos', JSON.stringify(Array.from(serverLoved)));
      } catch (e) {
        console.warn('Unable to sync lovedPhotos to localStorage:', e);
      }
    } catch (error) {
      console.warn('Unable to load photo likes:', error);
      // Retain previous counts! Do NOT set to 0 if batch fetch fails
      setPhotoLoveCounts((prev) => prev);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLovePhoto = useCallback(
    async (photoId: string) => {
      if (!photoId || userLovedPhotosRef.current.has(photoId) || lovingPhoto) {
        return;
      }

      const previousCount = photoLoveCounts[photoId] ?? 0;
      const visitorId = getVisitorId();

      // 1. Optimistic update
      setLovingPhoto(true);
      setUserLovedPhotos((prev) => new Set(prev).add(photoId));
      setPhotoLoveCounts((prev) => ({
        ...prev,
        [photoId]: (prev[photoId] ?? 0) + 1,
      }));
      saveUserLovedToStorage(photoId);
      setPhotoLikesError(null);

      try {
        // 2. Persist to API
        const response = await fetch('/api/photo-likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photoId, visitorId }),
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const result = await response.json();
        const serverCount =
          typeof result.likeCount === 'number'
            ? result.likeCount
            : typeof result.like_count === 'number'
            ? result.like_count
            : null;

        if (serverCount !== null) {
          setPhotoLoveCounts((prev) => ({
            ...prev,
            [photoId]: serverCount,
          }));
        }

        if (result.alreadyLiked || result.hasLiked) {
          setUserLovedPhotos((prev) => new Set(prev).add(photoId));
        }
      } catch (error) {
        console.error('Failed to save photo like:', error);
        // Rollback optimistic update
        setPhotoLoveCounts((prev) => ({
          ...prev,
          [photoId]: previousCount,
        }));
        setUserLovedPhotos((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        removeUserLovedFromStorage(photoId);
        setPhotoLikesError('Failed to record like. Please try again.');
      } finally {
        setLovingPhoto(false);
      }
    },
    [lovingPhoto, photoLoveCounts, removeUserLovedFromStorage, saveUserLovedToStorage]
  );

  // Real-time updates effect (if Supabase is configured)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

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
      channel = supabase.channel('photo-likes-realtime');
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_likes',
        },
        (payload: any) => {
          if (payload?.new && payload.new.photo_id) {
            const updatedPhotoId = String(payload.new.photo_id);
            const count = Number(payload.new.like_count) || 0;
            setPhotoLoveCounts((prev) => ({
              ...prev,
              [updatedPhotoId]: count,
            }));
          }
        }
      );
      channel.subscribe();
    } catch {
      removeChannel();
      return;
    }

    return removeChannel;
  }, []);

  // Fetch initial batch of likes on mount once (guarded against StrictMode double-fetch)
  useEffect(() => {
    if (hasFetchedBatchRef.current) return;
    hasFetchedBatchRef.current = true;
    refreshPhotoLikes();
  }, [refreshPhotoLikes]);

  return {
    photoLoveCounts,
    userLovedPhotos,
    lovingPhoto,
    isLoading,
    photoLikesError,
    handleLovePhoto,
    refreshPhotoLikes,
  };
};
