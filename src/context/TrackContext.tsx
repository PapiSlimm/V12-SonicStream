/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { Track } from '../types';

interface TrackContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  playTrack: (track: Track, options?: { preview?: boolean }) => void;
  pause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setIsPlaying: (playing: boolean) => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  isPreviewMode: boolean;
  progress: number;
  setProgress: (val: number) => void;
  togglePlay: () => void;
  cachedTracks: Track[];
  cacheTrack: (track: Track) => Promise<void>;
  removeCachedTrack: (trackId: string) => Promise<void>;
  isTrackCached: (trackId: string) => boolean;
}

const DB_NAME = 'SonicStreamCache';
const STORE_NAME = 'tracks';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const TrackContext = createContext<TrackContextType | undefined>(undefined);

export const TrackProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedTracks, setCachedTracks] = useState<Track[]>([]);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Encrypted Heartbeat Logic
  useEffect(() => {
    if (isPlaying && currentTrack) {
      heartbeatIntervalRef.current = setInterval(async () => {
        try {
          // In a real app, this would be a signed JWT or similar cryptographic payload
          const payload = {
            trackId: currentTrack.id,
            timestamp: Date.now(),
            entropy: Math.random().toString(36).substring(7)
          };
          
          // Encrypt/Sign payload (simplified for implementation)
          const token = btoa(JSON.stringify(payload)); 

          await fetch('/api/analytics/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
        } catch (err) {
          console.error('Heartbeat connection failed', err);
        }
      }, 30000);
    } else {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    }

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [isPlaying, currentTrack]);

  // Load Cached Tracks on Mount
  useEffect(() => {
    initDB().then(db => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        setCachedTracks(req.result || []);
      };
    }).catch(err => console.error('Failed to init IndexedDB:', err));
  }, []);

  const cacheTrack = useCallback(async (track: Track) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const cachedTrack = {
        ...track,
        cachedAt: Date.now(),
        isOfflineAvailable: true
      };

      await new Promise<void>((resolve, reject) => {
        const req = store.put(cachedTrack);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      
      setCachedTracks(prev => {
        if (prev.some(t => t.id === track.id)) return prev;
        return [...prev, cachedTrack];
      });
    } catch (err) {
      console.error('Failed to cache track:', err);
    }
  }, []);

  const removeCachedTrack = useCallback(async (trackId: string) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const req = store.delete(trackId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      
      setCachedTracks(prev => prev.filter(t => t.id !== trackId));
    } catch (err) {
      console.error('Failed to remove cached track:', err);
    }
  }, []);

  const isTrackCached = useCallback((trackId: string) => {
    return cachedTracks.some(t => t.id === trackId);
  }, [cachedTracks]);

  const nextTrack = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentTrack(queue[nextIdx]);
      setCurrentIndex(nextIdx);
      setIsPlaying(true);
    }
  }, [currentIndex, queue]);

  const previousTrack = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentTrack(queue[prevIdx]);
      setCurrentIndex(prevIdx);
      setIsPlaying(true);
    }
  }, [currentIndex, queue]);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => {
      const newQueue = prev.filter(t => t.id !== trackId);
      // Adjust currentIndex if necessary
      if (currentTrack?.id === trackId) {
        // If we removed the current track, stop playback or move to next
        setIsPlaying(false);
        setCurrentTrack(null);
        setCurrentIndex(-1);
      } else {
        const newIdx = newQueue.findIndex(t => t.id === currentTrack?.id);
        setCurrentIndex(newIdx);
      }
      return newQueue;
    });
  }, [currentTrack]);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      // Update currentIndex if the current track moved
      if (currentTrack) {
        const newIdx = result.findIndex(t => t.id === currentTrack.id);
        setCurrentIndex(newIdx);
      }
      return result;
    });
  }, [currentTrack]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentTrack(null);
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, []);

  const playTrack = useCallback((track: Track, options: { preview?: boolean } = {}) => {
    // Update queue if track not in it
    setQueue(prev => {
      const idx = prev.findIndex(t => t.id === track.id);
      if (idx === -1) {
        const newQueue = [...prev, track];
        setCurrentIndex(newQueue.length - 1);
        return newQueue;
      }
      setCurrentIndex(idx);
      return prev;
    });

    setCurrentTrack(track);
    setIsPlaying(true);
    setIsPreviewMode(!!options.preview);
    
    // Logic for initializing HLS/DASH stream would be injected here
    console.log(`Initializing ${track.hlsUrl ? 'HLS' : 'DASH'} stream for: ${track.title}`);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  return (
    <TrackContext.Provider value={{
      currentTrack,
      queue,
      isPlaying,
      playTrack,
      pause,
      nextTrack,
      previousTrack,
      setIsPlaying,
      setQueue,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      clearQueue,
      isPreviewMode,
      progress,
      setProgress,
      togglePlay,
      cachedTracks,
      cacheTrack,
      removeCachedTrack,
      isTrackCached
    }}>
      {children}
    </TrackContext.Provider>
  );
};

export const useTracks = () => {
  const context = useContext(TrackContext);
  if (context === undefined) {
    throw new Error('useTracks must be used within a TrackProvider');
  }
  return context;
};

export const useTrack = () => {
  const context = useContext(TrackContext);
  if (context === undefined) {
    throw new Error('useTrack must be used within a TrackProvider');
  }
  return context;
};
