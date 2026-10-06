import ffmpeg from 'fluent-ffmpeg';
import { logger } from '../../middleware/error.js';

export async function masterTrack(inputPath: string, outputPath: string, profile: string = 'balanced') {
  logger.info(`Mastering track with profile ${profile}: ${inputPath} -> ${outputPath}`);
  
  const profiles: Record<string, string[]> = {
    balanced: [
      'compand=attacks=0:points=-80/-80|-45/-45|-27/-27|0/-7|20/-7:soft-tank=2',
      'equalizer=f=60:width_type=h:width=100:g=2',
      'equalizer=f=12000:width_type=h:width=2000:g=1',
      'loudnorm=I=-14:LRA=7:tp=-1'
    ],
    warm: [
      'compand=attacks=0:points=-80/-80|-45/-45|-27/-27|0/-7|20/-7:soft-tank=4',
      'equalizer=f=250:width_type=h:width=200:g=3',
      'equalizer=f=10000:width_type=h:width=3000:g=-2',
      'loudnorm=I=-16:LRA=11:tp=-1.5'
    ],
    bright: [
      'compand=attacks=0:points=-80/-80|-45/-45|-27/-27|0/-7|20/-7:soft-tank=1',
      'equalizer=f=5000:width_type=h:width=3000:g=3',
      'equalizer=f=15000:width_type=h:width=2000:g=4',
      'loudnorm=I=-12:LRA=5:tp=-0.5'
    ],
    club: [
      'compand=attacks=0:points=-80/-80|-45/-45|-27/-27|0/-5|20/-5:soft-tank=1',
      'equalizer=f=50:width_type=h:width=40:g=6',
      'equalizer=f=100:width_type=h:width=50:g=2',
      'loudnorm=I=-9:LRA=3:tp=-0.1'
    ]
  };

  const filters = profiles[profile] || profiles.balanced;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(filters)
      .output(outputPath)
      .on('end', () => {
        logger.info('Mastering completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('Mastering failed:', err);
        reject(err);
      })
      .run();
  });
}
