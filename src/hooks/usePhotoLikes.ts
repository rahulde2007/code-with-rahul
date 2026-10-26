import { useState, useEffect, useCallback, useRef } from 'react';
import { getVisitorId } from '../lib/visitor';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { photos } from '../data/photos';

export interface UsePhotoLikesReturn {
  photoLoveCounts: Record<string, number>;
  userLovedPhotos: Set<string>;
  lovingPhoto: boolean;
  photoLikesError: string | null;
  handleLovePhoto: (photoId: string) => Promise<void>;
  refreshPhotoLikes: () => Promise<void>;
}

export const usePhotoLikes = (): UsePhotoLikesReturn => {
  // Initialize counts for all photos to 0
  const [photoLoveCounts, setPhotoLoveCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const photo of photos) {
      counts[photo.photoId] = 0;
    }
    return counts;
  });

  const [userLovedPhotos, setUserLovedPhotos] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('lovedPhotos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set<string>(parsed.map(String));
        }
      }
    } catch (e) {
      console.warn('Unable to load lovedPhotos from localStorage:', e);
    }
    return new Set<string>();
  });

  const [lovingPhoto, setLovingPhoto] = useState(false);
  const [photoLikesError, setPhotoLikesError] = useState<string | null>(null);

  // Keep a ref to latest userLovedPhotos for race-condition guards in rapid clicks
  const userLovedPhotosRef = useRef(userLovedPhotos);
  userLovedPhotosRef.current = userLovedPhotos;

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
      const res = await fetch(`/api/photo-likes?visitorId=${encodeURIComponent(visitorId)}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      if (data && typeof data.counts === 'object') {
        setPhotoLoveCounts((prev) => ({
          ...prev,
          ...data.counts,
        }));
      }

      if (Array.isArray(data.userLikes) && data.userLikes.length > 0) {
        setUserLovedPhotos((prev) => {
          const next = new Set(prev);
          data.userLikes.forEach((id: string) => {
            next.add(id);
            saveUserLovedToStorage(id);
          });
          return next;
        });
      }
    } catch (error) {
      console.warn('Unable to load photo likes:', error);
    }
  }, [saveUserLovedToStorage]);

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
        if (typeof result.like_count === 'number') {
          setPhotoLoveCounts((prev) => ({
            ...prev,
            [photoId]: result.like_count,
          }));
        }
        if (result.alreadyLiked) {
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

  // Fetch initial batch of likes on mount
  useEffect(() => {
    refreshPhotoLikes();
  }, [refreshPhotoLikes]);

  return {
    photoLoveCounts,
    userLovedPhotos,
    lovingPhoto,
    photoLikesError,
    handleLovePhoto,
    refreshPhotoLikes,
  };
};
