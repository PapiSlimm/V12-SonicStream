import { unlockAudioContext } from '../utils/production';

class SoundService {
  private audio: HTMLAudioElement | null = null;
  private context: AudioContext | null = null;
  private spriteData: Record<string, [number, number]> = {
    'click': [0, 500],
    'success': [1000, 1500],
    'error': [2000, 2500],
    'notification': [3000, 3500],
    'upload': [4000, 4500],
    'download': [5000, 5500],
    'like': [6000, 6500],
    'follow': [7000, 7500]
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio('/assets/sonic-sprite-v12.mp3');
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      unlockAudioContext(this.context);
    }
  }

  play(spriteName: string) {
    if (!this.audio || !this.spriteData[spriteName]) return;

    const [start, end] = this.spriteData[spriteName];
    this.audio.currentTime = start / 1000;
    this.audio.play();

    const stopAt = end / 1000;
    const checkTime = () => {
      if (this.audio && this.audio.currentTime >= stopAt) {
        this.audio.pause();
        this.audio.removeEventListener('timeupdate', checkTime);
      }
    };
    this.audio.addEventListener('timeupdate', checkTime);
  }
}

export const soundService = new SoundService();
