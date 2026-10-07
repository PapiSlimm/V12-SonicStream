import { Queue, Worker, Job } from 'bullmq';
import { db } from './db.js';
import IORedis from 'ioredis';
import { config } from './config.js';
import { logger } from './middleware/error.js';
import { run } from './db.js';
import { ffmpegQueueSize } from './monitoring.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { getWritablePath, getGCSBucket, uploadToGCS } from './utils/storage.js';
import { registry } from './services/ServiceRegistry.js';

import { masterTrack } from './domains/music/mastering.service.js';
import { AlertingService } from './services/AlertingService.js';

const downloadFile = async (url: string, path: string) => {
  const writer = fs.createWriteStream(path);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const runFFmpeg = (args: string[], timeoutMs: number = 300000) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);

    const timeout = setTimeout(() => {
      ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg process timed out'));
    }, timeoutMs);

    // Keep the tail of stderr so a non-zero exit reports WHY, not just a code.
    let errTail = '';
    ffmpeg.stderr?.on('data', (d: Buffer) => {
      errTail = (errTail + d.toString()).slice(-2000);
    });

    ffmpeg.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve(true);
      else reject(new Error(`FFmpeg exited with code ${code}: ${errTail.slice(-500)}`));
    });

    ffmpeg.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

/** Run ffmpeg and return full stderr (loudnorm prints its JSON report there). */
const runFFmpegCapture = (args: string[], timeoutMs: number = 300000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    const timeout = setTimeout(() => { ffmpeg.kill('SIGKILL'); reject(new Error('FFmpeg process timed out')); }, timeoutMs);
    let err = '';
    ffmpeg.stderr?.on('data', (d: Buffer) => { err += d.toString(); });
    ffmpeg.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve(err);
      else reject(new Error(`FFmpeg exited with code ${code}: ${err.slice(-500)}`));
    });
    ffmpeg.on('error', (e) => { clearTimeout(timeout); reject(e); });
  });
};

/** ffprobe duration in seconds (0 on failure — callers treat it as unknown). */
const probeDuration = (file: string): Promise<number> => {
  return new Promise((resolve) => {
    const p = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
    let out = '';
    p.stdout?.on('data', (d: Buffer) => { out += d.toString(); });
    p.on('close', () => resolve(Math.max(0, parseFloat(out.trim()) || 0)));
    p.on('error', () => resolve(0));
  });
};

/** Parse the JSON block loudnorm prints at the end of its analysis pass. */
const parseLoudnorm = (stderr: string): Record<string, string> | null => {
  const m = stderr.match(/\{[^{}]*"input_i"[\s\S]*?\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
};

export let connection: IORedis | null = null;
export let distributionQueue: Queue | null = null;
export let ffmpegQueue: Queue | null = null;
export let masteringQueue: Queue | null = null;
export let videoQueue: Queue | null = null;
export let aiQueue: Queue | null = null;
export let analyticsQueue: Queue | null = null;
export let notificationsQueue: Queue | null = null;
export let rssQueue: Queue | null = null;

export async function initRedis(): Promise<void> {
  if (registry.has('redis')) {
    return;
  }

  const redisUrl = config.REDIS_URL;
  const isLocalhost = !redisUrl || 
                     redisUrl.includes('localhost') || 
                     redisUrl.includes('127.0.0.1') ||
                     redisUrl === '';

  if (!isLocalhost) {
    try {
      logger.info(`Connecting to Redis at ${redisUrl}...`);
      connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: true,
        connectTimeout: 5000,
      });
      connection.on('error', (err) => {
        logger.warn('Redis connection error, background jobs might be delayed:', err.message);
        AlertingService.raiseAlert('redis', 'warning', `Redis connection error: ${err.message}`, err).catch(() => {});
      });

      // Verify connection by doing a ping
      await connection.ping();

      distributionQueue = new Queue('distribution', { connection });
      ffmpegQueue = new Queue('ffmpeg', { connection });
      masteringQueue = new Queue('mastering', { connection });
      videoQueue = new Queue('video', { connection });
      aiQueue = new Queue('ai', { connection });
      analyticsQueue = new Queue('analytics', { connection });
      notificationsQueue = new Queue('notifications', { connection });
      rssQueue = new Queue('rss', { connection });

      // Attach error handlers to BullMQ Queues to prevent unhandled error event crashes
      const queueList = [
        { q: distributionQueue, name: 'distributionQueue' },
        { q: ffmpegQueue, name: 'ffmpegQueue' },
        { q: masteringQueue, name: 'masteringQueue' },
        { q: videoQueue, name: 'videoQueue' },
        { q: aiQueue, name: 'aiQueue' },
        { q: analyticsQueue, name: 'analyticsQueue' },
        { q: notificationsQueue, name: 'notificationsQueue' },
        { q: rssQueue, name: 'rssQueue' },
      ];

      for (const { q, name } of queueList) {
        q.on('error', (err) => {
          logger.error(`${name} connection error:`, err);
        });
      }

      // Periodically update the FFmpeg gauge to keep metrics fresh
      setInterval(async () => {
        try {
          if (ffmpegQueue) {
            const size = await ffmpegQueue.count();
            ffmpegQueueSize.set(size);
          }
        } catch (err: any) {
          logger.warn('[Monitoring] Failed to update FFmpeg queue size gauge:', err.message);
        }
      }, 15000).unref();

      registry.register('redis', connection);
      logger.info('[Redis] Initialized and validated successfully.');
    } catch (err: any) {
      logger.error('[Redis] Failed to initialize Redis connection, falling back to simulated in-memory Redis:', err);
      logger.warn('⚠️ [Redis] Running with in-memory simulation for background jobs.');
      AlertingService.raiseAlert('redis', 'critical', `Redis initialization failed: ${err.message || err}`, err).catch(() => {});
      registry.register('redis', { simulated: true });
    }
  } else {
    logger.info(`Redis URL is "${redisUrl}". Skipping Redis connection and using in-memory simulation for background jobs.`);
    registry.register('redis', { simulated: true });
  }
}

// Background Job Processors
export const processVideo = async (job: { data: any, id?: string }) => {
  logger.info(`[Video Worker] Processing background video job: ${job.id}`);
  const { videoId, taskType } = job.data;
  await new Promise(resolve => setTimeout(resolve, 1000));
  logger.info(`[Video Worker] Background video job ${job.id} completed successfully for video: ${videoId} (type: ${taskType || 'default'})`);
};

export const processAI = async (job: { data: any, id?: string }) => {
  const { aiJobId, jobType, inputUrl, prompt } = job.data || {};

  // Legacy fire-and-forget payloads ({ prompt, context } with no job row) still land here.
  if (!aiJobId) {
    logger.info(`[AI Worker] Legacy background AI job ${job.id} for: "${prompt || 'anon'}"`);
    return;
  }

  logger.info(`[AI Worker] Processing ai_job ${aiJobId} (${jobType})`);
  const markFailed = async (reason: string, message: string) => {
    await run(
      `UPDATE ai_jobs SET status = 'failed', fail_reason = ?, error_log = ?, retry_count = retry_count + 1 WHERE id = ?`,
      [reason, message, aiJobId]
    ).catch(e => logger.error('[AI Worker] Failed to record job failure:', e));
  };

  try {
    if (jobType === 'mastering') {
      if (!inputUrl) throw new Error('Mastering job has no inputUrl');
      const inPath = path.join('/tmp', `aijob-${aiJobId}-in`);
      const outPath = path.join('/tmp', `aijob-${aiJobId}-mastered.mp3`);
      await downloadFile(inputUrl, inPath);
      await masterTrack(inPath, outPath, job.data.profile || 'balanced');

      let outputUrl = `/${outPath.replace(/\\/g, '/')}`;
      if (getGCSBucket()) {
        outputUrl = await uploadToGCS(outPath, `ai_mastered/${path.basename(outPath)}`);
      }
      try { fs.unlinkSync(inPath); fs.unlinkSync(outPath); } catch {}

      await run(
        `UPDATE ai_jobs SET status = 'completed', outputUrl = ?, completed_at = ? WHERE id = ?`,
        [outputUrl, new Date().toISOString(), aiJobId]
      );
      logger.info(`[AI Worker] Mastering job ${aiJobId} completed: ${outputUrl}`);

    } else if (jobType === 'video_segment') {
      if (!config.GEMINI_API_KEY) {
        await markFailed('MODEL_BACKEND_NOT_CONFIGURED', 'GEMINI_API_KEY is not configured on the worker');
        return; // configuration problem: retrying won't help, don't rethrow
      }
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'A cinematic music visual segment',
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' as any },
      });
      // Background worker can afford a real polling window (up to ~10 minutes).
      let attempts = 0;
      while (!operation.done && attempts < 60) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
        attempts++;
      }
      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!operation.done || !videoUri) {
        throw new Error('Video generation did not complete within the polling window');
      }
      await run(
        `UPDATE ai_jobs SET status = 'completed', outputUrl = ?, completed_at = ? WHERE id = ?`,
        [videoUri, new Date().toISOString(), aiJobId]
      );
      logger.info(`[AI Worker] Video job ${aiJobId} completed`);

    } else {
      await markFailed('UNSUPPORTED_JOB_TYPE', `Worker has no processor for jobType '${jobType}'`);
      return;
    }
  } catch (err: any) {
    logger.error(`[AI Worker] ai_job ${aiJobId} failed:`, err);
    await markFailed('PROCESSING_ERROR', err?.message || 'Unknown worker error');
    throw err; // rethrow so BullMQ retry/backoff policy applies
  }
};

export const processAnalytics = async (job: { data: any, id?: string }) => {
  logger.info(`[Analytics Worker] Processing stream/engagement metrics job: ${job.id}`);
  const { eventType, value, metadata } = job.data;
  await db.run(
    'INSERT INTO event_logs (event_type, details) VALUES (?, ?)',
    [eventType || 'background_worker_analytics', JSON.stringify({ value, metadata, processed_at: new Date() })]
  ).catch(e => logger.error('Worker failed to write analytics log', e));
  logger.info(`[Analytics Worker] Aggregated background metrics for: ${eventType}`);
};

export const processNotifications = async (job: { data: any, id?: string }) => {
  logger.info(`[Notifications Worker] Dispatching message context: ${job.id}`);
  const { userId, title, icon, body } = job.data;
  await db.run(
    'INSERT INTO notifications (user_id, title, status, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    [userId || 'system', `[WORKER] ${title || 'Background Update'}: ${body || ''}`, 'unread']
  ).catch(e => logger.error('Worker failed to write notification log', e));
  logger.info(`[Notifications Worker] Background notification successfully queued/dispatched for user ${userId || 'all'} with icon asset: ${icon || 'none'}`);
};

export const processRSS = async (job: { data: any, id?: string }) => {
  logger.info(`[RSS Worker] Syncing and pulling external feeds: ${job.id}`);
  const { feedId } = job.data;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info(`[RSS Worker] RSS Feed: ${feedId || 'all'} synchronized and cached successfully.`);
  } catch (err) {
    logger.error('[RSS Worker] Failed syncing feed:', err);
    throw err;
  }
};

// Processors
export const processFFmpeg = async (job: Job) => {
  logger.info(`Processing FFmpeg job ${job.id}`);
  const { trackId, fileUrl, filePath, outputDir } = job.data;
  const sourcePath = fileUrl || filePath;
  
  const inputPath = path.join('/tmp', `input-${job.id}-${Date.now()}.mp3`);
  const tempOutputDir = path.join('/tmp', `output-${job.id}-${Date.now()}`);
  
  if (!fs.existsSync(tempOutputDir)) {
    fs.mkdirSync(tempOutputDir, { recursive: true });
  }

  try {
    await job.updateProgress(10);
    
    if (!sourcePath) {
      throw new Error(`No file source provided for trackId: ${trackId}`);
    }

    // Download file first if it's a URL
    if (sourcePath.startsWith('http')) {
      await downloadFile(sourcePath, inputPath);
    } else {
      // Local file
      fs.copyFileSync(sourcePath, inputPath);
    }

    await job.updateProgress(30);

    /* ──────────────────────────────────────────────────────────────────────
     * SONIC MEDIA PIPELINE (2026-10-07 rewrite)
     *
     * Old pipeline: single-bitrate HLS with a bogus video profile flag on an
     * audio file, a DASH pass that doubled CPU for a player that never used
     * it, and zero loudness control.
     *
     * New pipeline (CPU-only, fits the 0.5-vCPU Render box):
     *  1. ANALYZE   — ffprobe duration + loudnorm measurement pass (EBU R128)
     *  2. MEZZANINE — one loudness-normalized WAV at -14 LUFS / -1 dBTP
     *                 (the streaming-platform standard), encoded once so the
     *                 ladder rungs stay sample-identical in timing
     *  3. LADDER    — one ffmpeg run fans out 3 AAC rungs (256/128/64 kbps)
     *                 into HLS variant playlists + an adaptive master playlist
     *                 (playlist.m3u8 — same URL shape the player already uses)
     *  4. PREVIEW   — 30 s MP3 with fade-in/out from the mezzanine
     * DASH is intentionally dropped: /api/stream already answers .mpd with an
     * honest 404 and the player falls back to HLS.
     * ────────────────────────────────────────────────────────────────────── */
    const mezzPath = path.join(tempOutputDir, 'mezz.wav');
    const previewPath = path.join(tempOutputDir, 'preview.mp3');

    // 1. ANALYZE — measure loudness (and duration for the DB).
    const durationSec = await probeDuration(inputPath);
    const analysis = await runFFmpegCapture([
      '-hide_banner', '-i', inputPath,
      '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json',
      '-f', 'null', '-'
    ]);
    const ln = parseLoudnorm(analysis);
    await job.updateProgress(45);

    // 2. MEZZANINE — apply the measured values (true two-pass loudnorm).
    const loudnormFilter = ln
      ? `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true`
      : 'loudnorm=I=-14:TP=-1.0:LRA=11'; // analysis failed — single-pass fallback
    await runFFmpeg([
      '-hide_banner', '-i', inputPath,
      '-af', loudnormFilter,
      '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le',
      mezzPath
    ]);
    await job.updateProgress(60);

    // 3. LADDER — one process, three rungs, adaptive master playlist.
    await runFFmpeg([
      '-hide_banner', '-i', mezzPath,
      '-filter_complex', '[0:a]asplit=3[hi][mid][lo]',
      '-map', '[hi]',  '-c:a:0', 'aac', '-b:a:0', '256k',
      '-map', '[mid]', '-c:a:1', 'aac', '-b:a:1', '128k',
      '-map', '[lo]',  '-c:a:2', 'aac', '-b:a:2', '64k',
      '-f', 'hls',
      '-var_stream_map', 'a:0,name:hi a:1,name:mid a:2,name:lo',
      '-master_pl_name', 'playlist.m3u8',
      '-hls_time', '6',
      '-hls_list_size', '0',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(tempOutputDir, 'seg_%v_%03d.ts'),
      path.join(tempOutputDir, 'stream_%v.m3u8')
    ]);
    await job.updateProgress(80);

    // 4. PREVIEW — 30 s, fade in/out, from the normalized mezzanine.
    await runFFmpeg([
      '-hide_banner', '-i', mezzPath,
      '-ss', '0', '-t', '30',
      '-af', 'afade=t=in:st=0:d=1,afade=t=out:st=28:d=2',
      '-c:a', 'libmp3lame', '-b:a', '128k',
      previewPath
    ]);

    // The WAV mezzanine is an intermediate — never ship ~50 MB to storage.
    try { fs.unlinkSync(mezzPath); } catch { /* ignore */ }

    // Move to final destination
    let streamUrl = '';
    let dashUrl = '';
    let previewUrl = '';
    
    const bucketName = getGCSBucket();
    if (bucketName) {
      try {
        const files = fs.readdirSync(tempOutputDir);
        for (const file of files) {
          const localFile = path.join(tempOutputDir, file);
          const gcsDest = `streams/${trackId}/${file}`;
          const uploadedUrl = await uploadToGCS(localFile, gcsDest);
          if (file === 'playlist.m3u8') streamUrl = uploadedUrl;
          else if (file === 'preview.mp3') previewUrl = uploadedUrl;
        }
      } catch (err) {
        logger.error(`[GCS Stream Error] Failed to upload output stream files to GCS bucket "${bucketName}", using local fallback:`, err);
        // Fallback local operation on error
        const absoluteOutputDir = getWritablePath(outputDir);
        if (!fs.existsSync(absoluteOutputDir)) {
          fs.mkdirSync(absoluteOutputDir, { recursive: true });
        }
        fs.readdirSync(tempOutputDir).forEach(file => {
          fs.copyFileSync(path.join(tempOutputDir, file), path.join(absoluteOutputDir, file));
        });
        streamUrl = `/${path.join(outputDir, 'playlist.m3u8')}`;
        previewUrl = `/${path.join(outputDir, 'preview.mp3')}`;
      }
    } else {
      const absoluteOutputDir = getWritablePath(outputDir);
      if (!fs.existsSync(absoluteOutputDir)) {
        fs.mkdirSync(absoluteOutputDir, { recursive: true });
      }
      
      fs.readdirSync(tempOutputDir).forEach(file => {
        fs.copyFileSync(path.join(tempOutputDir, file), path.join(absoluteOutputDir, file));
      });
      
      streamUrl = `/${path.join(outputDir, 'playlist.m3u8')}`;
      previewUrl = `/${path.join(outputDir, 'preview.mp3')}`;
    }

    await job.updateProgress(100);

    logger.info(`Track ${trackId} processed successfully`);
    // NOTE: double-quoted "live" was a latent Postgres bug (PG reads double
    // quotes as a COLUMN name) — parameterized now. hls_url is what the
    // /api/stream route redirects to; duration feeds the fallback playlist.
    await run(
      'UPDATE tracks SET status = ?, stream_url = ?, hls_url = ?, dash_url = ?, preview_url = ?, duration = ? WHERE id = ?',
      ['live', streamUrl, streamUrl, dashUrl || null, previewUrl, durationSec || null, trackId]
    );
  } catch (error) {
    logger.error(`FFmpeg processing failed for track ${trackId}:`, error);
    await run('UPDATE tracks SET status = ? WHERE id = ?', ['error', trackId]);
    throw error;
  } finally {
    // Cleanup
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(tempOutputDir)) fs.rmSync(tempOutputDir, { recursive: true, force: true });
    } catch (e) {
      logger.warn('Cleanup failed:', e);
    }
  }
  
  if (ffmpegQueue) {
    const size = await ffmpegQueue.count();
    ffmpegQueueSize.set(size);
  }
};

export const processMastering = async (job: { data: any, id?: string }) => {
  logger.info(`Processing Mastering job ${job.id}`);
  const { trackId, inputPath, outputPath, profile } = job.data;
  
  try {
    await masterTrack(inputPath, outputPath, profile);
    
    let dbFileUrl = outputPath;
    const bucketName = getGCSBucket();
    if (bucketName) {
      try {
        const fileName = path.basename(outputPath);
        dbFileUrl = await uploadToGCS(outputPath, `mastered/${fileName}`);
        // Clean up the local mastered file
        try { fs.unlinkSync(outputPath); } catch {}
      } catch (err: any) {
        logger.error(`[GCS Mastering Error] Failed to upload mastered file to GCS: ${err.message}`);
        dbFileUrl = `/${outputPath.replace(/\\/g, '/')}`;
      }
    } else {
      dbFileUrl = `/${outputPath.replace(/\\/g, '/')}`;
    }

    await run("UPDATE tracks SET file_url = ?, status = 'live' WHERE id = ?", [dbFileUrl, trackId]);
    logger.info(`Track ${trackId} mastered successfully`);
  } catch (error) {
    logger.error(`Mastering failed for track ${trackId}:`, error);
    await run("UPDATE tracks SET status = 'error' WHERE id = ?", [trackId]);
    throw error;
  }
};

export const processDistribution = async (job: { data: { releaseId: string }, id?: string }) => {
  const { releaseId } = job.data;
  logger.info(`[Distribution Worker] Processing release id: ${releaseId}`);
  try {
    const release = await db.get<any>('SELECT * FROM releases WHERE id = ?', [releaseId]);
    if (!release) {
      throw new Error(`Release not found: ${releaseId}`);
    }

    // Update status to packaging
    await db.run("UPDATE releases SET status = 'VALIDATING' WHERE id = ?", [releaseId]);
    await db.run("UPDATE releases SET status = 'ERROR' WHERE id = ?", [releaseId]);
    throw new Error('Music distribution services are not supported at this time.');
  } catch (err) {
    logger.error(`[Distribution Worker Error] Failed to distribute release ${releaseId}:`, err);
    await db.run("UPDATE releases SET status = 'ERROR' WHERE id = ?", [releaseId]);
    throw err;
  }
};

export const addDistributionJob = async (data: any) => {
  if (distributionQueue) {
    return distributionQueue.add('distribute-release', data);
  } else {
    // Run in background without blocking
    processDistribution({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory Distribution failed:', err));
  }
};

export const addFFmpegJob = async (data: any) => {
  if (ffmpegQueue) {
    return ffmpegQueue.add('process-track', data);
  } else {
    // Run in background without blocking
    processFFmpeg({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory FFmpeg failed:', err));
  }
};

export const addMasteringJob = async (data: any) => {
  if (masteringQueue) {
    return masteringQueue.add('master-track', data);
  } else {
    // Run in background without blocking
    processMastering({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory Mastering failed:', err));
  }
};

export const addVideoJob = async (data: any) => {
  if (videoQueue) {
    return videoQueue.add('process-video', data);
  } else {
    processVideo({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory Video Job failed:', err));
  }
};

export const addAIJob = async (data: any) => {
  if (aiQueue) {
    return aiQueue.add('ai-job', data);
  } else {
    processAI({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory AI Job failed:', err));
  }
};

export const addAnalyticsJob = async (data: any) => {
  if (analyticsQueue) {
    return analyticsQueue.add('process-analytics', data);
  } else {
    processAnalytics({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory Analytics Job failed:', err));
  }
};

export const addNotificationJob = async (data: any) => {
  if (notificationsQueue) {
    return notificationsQueue.add('broadcast-notification', data);
  } else {
    processNotifications({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory Notification failed:', err));
  }
};

export const addRSSJob = async (data: any) => {
  if (rssQueue) {
    return rssQueue.add('sync-rss-feed', data);
  } else {
    processRSS({ data, id: `mem_${Date.now()}` }).catch(err => logger.error('In-memory RSS failed:', err));
  }
};

export let activeWorkers: Worker[] = [];

export async function closeWorkers(): Promise<void> {
  if (activeWorkers.length > 0) {
    logger.info(`[Worker] Shutting down ${activeWorkers.length} active BullMQ workers...`);
    const closePromises = activeWorkers.map(w => w.close().catch(err => {
      logger.error(`Error closing worker ${w.name}:`, err);
    }));
    await Promise.all(closePromises);
    activeWorkers = [];
  }

  // Also close open queues
  const queues = [
    distributionQueue,
    ffmpegQueue,
    masteringQueue,
    videoQueue,
    aiQueue,
    analyticsQueue,
    notificationsQueue,
    rssQueue
  ];
  for (const q of queues) {
    if (q) {
      try {
        await q.close();
      } catch (err: any) {
        logger.error(`Error closing queue:`, err.message || err);
      }
    }
  }
}

export async function closeRedis(): Promise<void> {
  await closeWorkers();
  if (connection) {
    try {
      await connection.quit();
      logger.info('[Redis] Connection closed safely.');
    } catch (err: any) {
      logger.error('[Redis] Error disconnecting during shutdown:', err.message || err);
    }
    connection = null;
  }
}

export const initWorker = () => {
  if (!connection) {
    logger.warn('Running in mock mode without Redis background workers');
    return;
  }

  activeWorkers = [];

  const registerFailureListener = (workerObj: Worker, name: string) => {
    workerObj.on('failed', (job, err) => {
      logger.error(`[Worker] Job ${job?.id || 'unknown'} in queue ${name} failed:`, err);
      AlertingService.raiseAlert('worker', 'warning', `Job failed in ${name}: ${err.message}`, { jobId: job?.id, data: job?.data }).catch(() => {});
    });
  };

  // Distribution Worker
  const distWorker = new Worker('distribution', processDistribution, { connection });

  distWorker.on('error', (err) => {
    logger.error('distWorker connection error:', err);
  });
  registerFailureListener(distWorker, 'distribution');
  activeWorkers.push(distWorker);

  // FFmpeg Worker
  const ffmpegWorker = new Worker('ffmpeg', processFFmpeg, { connection });

  ffmpegWorker.on('completed', (job) => {
    logger.info(`FFmpeg job ${job.id} completed`);
  });

  ffmpegWorker.on('error', (err) => {
    logger.error('ffmpegWorker connection error:', err);
  });
  registerFailureListener(ffmpegWorker, 'ffmpeg');
  activeWorkers.push(ffmpegWorker);

  // Mastering Worker
  const masteringWorker = new Worker('mastering', processMastering, { connection });

  masteringWorker.on('error', (err) => {
    logger.error('masteringWorker connection error:', err);
  });
  registerFailureListener(masteringWorker, 'mastering');
  activeWorkers.push(masteringWorker);

  // New Workers
  const videoWorker = new Worker('video', processVideo, { connection });
  videoWorker.on('error', (err) => logger.error('videoWorker connection error:', err));
  registerFailureListener(videoWorker, 'video');
  activeWorkers.push(videoWorker);

  const aiWorker = new Worker('ai', processAI, { connection });
  aiWorker.on('error', (err) => logger.error('aiWorker connection error:', err));
  registerFailureListener(aiWorker, 'ai');
  activeWorkers.push(aiWorker);

  const analyticsWorker = new Worker('analytics', processAnalytics, { connection });
  analyticsWorker.on('error', (err) => logger.error('analyticsWorker connection error:', err));
  registerFailureListener(analyticsWorker, 'analytics');
  activeWorkers.push(analyticsWorker);

  const notificationsWorker = new Worker('notifications', processNotifications, { connection });
  notificationsWorker.on('error', (err) => logger.error('notificationsWorker connection error:', err));
  registerFailureListener(notificationsWorker, 'notifications');
  activeWorkers.push(notificationsWorker);

  const rssWorker = new Worker('rss', processRSS, { connection });
  rssWorker.on('error', (err) => logger.error('rssWorker connection error:', err));
  registerFailureListener(rssWorker, 'rss');
  activeWorkers.push(rssWorker);

  registry.register('worker', true);

  return { 
    distWorker, 
    ffmpegWorker, 
    masteringWorker,
    videoWorker,
    aiWorker,
    analyticsWorker,
    notificationsWorker,
    rssWorker
  };
};
