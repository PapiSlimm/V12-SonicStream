import { useEffect, useRef } from 'react';
import { apiFetch, json } from '../api/apiFetch';
import { useAuth } from '../context/AuthContext';
import { ShortVideo } from '../types';

export const usePlayTracking = (
  video: ShortVideo,
  isPlaying: boolean,
  currentTime: number,
  duration: number
) => {
  const { user } = useAuth();
  const lastTrackedTimeRef = useRef<number>(0);
  const startedRef = useRef<boolean>(false);
  const milestoneTrackedRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    // Reset trackers when the video ID changes
    startedRef.current = false;
    lastTrackedTimeRef.current = 0;
    milestoneTrackedRef.current = {};
  }, [video.id]);

  // Track start of play
  useEffect(() => {
    if (isPlaying && !startedRef.current) {
      startedRef.current = true;
      sendTrackingEvent('video_play_start', {
        videoId: video.id,
        title: video.creator,
        song: video.song,
        duration,
        currentTime: 0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, video.id, duration]);

  // Track milestones and periodic play progress
  useEffect(() => {
    if (!isPlaying || duration <= 0) return;

    const percentage = Math.round((currentTime / duration) * 100);

    // 1. Send milestone events at 25%, 50%, 75%
    const milestones = [25, 50, 75];
    for (const milestone of milestones) {
      if (percentage >= milestone && !milestoneTrackedRef.current[milestone]) {
        milestoneTrackedRef.current[milestone] = true;
        sendTrackingEvent('video_play_milestone', {
          videoId: video.id,
          title: video.creator,
          song: video.song,
          duration,
          currentTime,
          milestone: `${milestone}%`
        });
      }
    }

    // 2. Periodic play duration check - send progress ping every 5 seconds of active playback
    const timeDelta = currentTime - lastTrackedTimeRef.current;
    if (Math.abs(timeDelta) >= 5) {
      lastTrackedTimeRef.current = currentTime;
      sendTrackingEvent('video_play_progress', {
        videoId: video.id,
        title: video.creator,
        song: video.song,
        duration,
        currentTime,
        progressPercent: percentage
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, isPlaying, video.id]);

  // Track video completion when video current time gets extremely close to duration or ends
  useEffect(() => {
    if (duration > 0 && currentTime >= duration - 0.2 && !milestoneTrackedRef.current[100]) {
      milestoneTrackedRef.current[100] = true;
      sendTrackingEvent('video_play_complete', {
        videoId: video.id,
        title: video.creator,
        song: video.song,
        duration,
        currentTime,
        completed: true
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, video.id]);

  const sendTrackingEvent = async (type: string, payload: any) => {
    try {
      await apiFetch('/api/analytics/track', {
        method: 'POST',
        ...json({
          userId: user?.id || 'anonymous_mobile_streamer',
          type,
          payload
        })
      });
      console.log(`[PlayTracking] Event successfully sent: ${type}`, payload);
    } catch (err) {
      console.error(`[PlayTracking] Failed to log active play event ${type}`, err);
    }
  };
};
