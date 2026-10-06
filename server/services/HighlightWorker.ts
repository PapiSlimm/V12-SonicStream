import { run, all, get } from '../db.js';
import { uploadToGCS } from '../utils/storage.js';
import { config } from '../config.js';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface Highlight {
  id: number;
  eventId: string;
  title: string;
  clipUrl: string;
  activityLevel: number;
  createdAt: string;
}

class HighlightWorker {
  private activityScores = new Map<string, number>();
  private intervalId: NodeJS.Timeout | null = null;
  /** Maps eventId → HLS manifest URL for the live stream */
  private streamUrls = new Map<string, string>();

  constructor() {
    this.startWorker();
  }

  /** Call from Socket.IO handlers when a chat or reaction event fires */
  public recordActivity(eventId: string, weight = 1) {
    if (!eventId) return;
    this.activityScores.set(eventId, (this.activityScores.get(eventId) ?? 0) + weight);
  }

  /** Register the HLS manifest URL for a live event stream */
  public registerStream(eventId: string, hlsUrl: string) {
    this.streamUrls.set(eventId, hlsUrl);
  }

  public unregisterStream(eventId: string) {
    this.streamUrls.delete(eventId);
  }

  private startWorker() {
    if (this.intervalId) return;
    this.intervalId = setInterval(async () => {
      try {
        let threshold = config.HIGHLIGHT_ACTIVITY_THRESHOLD;
        try {
          const dbSetting = await get<{ setting_value: string }>(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'highlight_activity_threshold'"
          );
          if (dbSetting?.setting_value) {
            threshold = parseInt(dbSetting.setting_value, 10) || threshold;
          }
        } catch (dbErr) {
          // Fallback silently if DB is not ready
        }

        const snapshot = Array.from(this.activityScores.entries());
        this.activityScores.clear();

        for (const [eventId, score] of snapshot) {
          if (score >= threshold) {
            console.log(`[HighlightWorker] High activity on event ${eventId} (score ${score}) — capturing clip with threshold ${threshold}`);
            await this.generateHighlightClip(eventId, score);
          }
        }
      } catch (err) {
        console.error('[HighlightWorker] Error in worker loop:', err);
      }
    }, 15_000);
  }

  public async generateHighlightClip(eventId: string, score: number): Promise<void> {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const clipTitle = `Crowd Frenzy @ ${timestamp} (score: ${score})`;
    const hlsUrl    = this.streamUrls.get(eventId);

    let clipUrl = '';

    if (hlsUrl) {
      // Real clip: pull a 30-second segment from the live HLS stream
      clipUrl = await this.ffmpegClip(eventId, hlsUrl).catch(err => {
        console.error(`[HighlightWorker] ffmpeg clip failed for ${eventId}:`, err.message);
        return '';
      });
    }

    if (!clipUrl) {
      // Stream URL unknown or ffmpeg failed — record a pending placeholder.
      // A human or post-processing job can fill this in later.
      clipUrl = `pending://highlight/${eventId}/${Date.now()}`;
      console.warn(`[HighlightWorker] No stream URL for event ${eventId} — storing placeholder.`);
    }

    await run(
      `INSERT INTO event_highlights (event_id, title, clip_url, activity_level) VALUES (?, ?, ?, ?)`,
      [eventId, clipTitle, clipUrl, score]
    );
    console.log(`[HighlightWorker] Saved highlight "${clipTitle}" → ${clipUrl}`);
  }

  /**
   * Capture a 30-second segment from an HLS stream, upload to GCS, return URL.
   * Requires: ffmpeg in PATH (installed in Dockerfile) + GCS_BUCKET set.
   */
  private async ffmpegClip(eventId: string, hlsUrl: string): Promise<string> {
    const tmpFile = path.join(os.tmpdir(), `highlight_${eventId}_${Date.now()}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(hlsUrl)
        .inputOptions(['-t', '30'])           // capture 30 seconds
        .outputOptions(['-c', 'copy'])         // no re-encode — fast
        .output(tmpFile)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });

    const gcsKey = `highlights/${eventId}/${path.basename(tmpFile)}`;
    const url    = await uploadToGCS(tmpFile, gcsKey);

    // Clean up temp file
    fs.unlink(tmpFile, () => {});
    return url;
  }

  public async getHighlightsForEvent(eventId: string): Promise<Highlight[]> {
    return all<Highlight>(
      `SELECT id, event_id AS eventId, title, clip_url AS clipUrl,
              activity_level AS activityLevel, created_at AS createdAt
       FROM event_highlights WHERE event_id = ? ORDER BY id DESC`,
      [eventId]
    ).catch(() => []);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const highlightWorker = new HighlightWorker();
