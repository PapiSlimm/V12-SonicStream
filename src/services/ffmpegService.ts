import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const generateHLS = async (inputPath: string, outputDir: string) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const trackId = uuidv4();
  const hlsPath = path.join(outputDir, `${trackId}.m3u8`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(hlsPath)
      .on('end', () => {
        resolve({
          trackId,
          hlsPath: `/api/stream/${trackId}/index.m3u8`
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
};

export const generateDASH = async (inputPath: string, outputDir: string) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const trackId = uuidv4();
  const dashPath = path.join(outputDir, `${trackId}.mpd`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-f dash',
        '-seg_duration 10',
        '-use_timeline 1',
        '-use_template 1',
        '-init_seg_name init-stream$RepresentationID$.m4s',
        '-media_seg_name chunk-stream$RepresentationID$-$Number%05d$.m4s'
      ])
      .output(dashPath)
      .on('end', () => {
        resolve({
          trackId,
          dashPath: `/api/stream/${trackId}/index.mpd`
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
};
