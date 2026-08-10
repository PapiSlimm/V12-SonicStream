import { Track } from '../types';

export interface DistributionResult {
  success: boolean;
  external_id?: string;
  error?: string;
  message?: string;
}

export class DistributionService {
  async deliverToPlatform(track: Track, platform: string): Promise<DistributionResult> {
    if (track || platform) {
      // params ignored
    }
    return { 
      success: false, 
      error: 'Music distribution services are currently disabled and not provided at this time.' 
    };
  }

  static async submitToBandzoogle(release: any) {
    if (release) {
      // release ignored
    }
    return { success: false, message: 'Music distribution services are currently disabled.' };
  }

  static validateReleaseForDistribution(release: any) {
    const errors: string[] = [];
    if (!release.title) errors.push('Release title is required');
    if (!release.artist) errors.push('Artist name is required');
    if (!release.artwork_url) errors.push('Artwork is required');
    if (!release.tracks || release.tracks.length === 0) errors.push('At least one track is required');
    
    return {
      ready: errors.length === 0,
      errors
    };
  }
}
