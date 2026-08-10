
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingAmbient = false;
  private ambientNodes: AudioNode[] = [];

  constructor() {
    // Context is initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Crisp Digital Chime
  public playChime() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Rising Arpeggio
  public playArpeggio() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (A Major)
    
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // Rhythmic Pulse (Ambient)
  public startAmbient() {
    if (this.isPlayingAmbient) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.isPlayingAmbient = true;
    const now = this.ctx.currentTime;

    // Pulse 1: Low rhythmic throb
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.5; // 0.5Hz pulse
    lfo.connect(lfoGain.gain);

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 55; // A1
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    gain.gain.value = 0.1;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    
    // Filter sweep for "flow"
    const sweep = () => {
      if (!this.isPlayingAmbient) return;
      filter.frequency.exponentialRampToValueAtTime(800, this.ctx!.currentTime + 4);
      filter.frequency.exponentialRampToValueAtTime(200, this.ctx!.currentTime + 8);
      setTimeout(sweep, 8000);
    };
    sweep();

    this.ambientNodes.push(osc, gain, filter);

    // Pulse 2: Shimmering high pulse
    const shimmerInterval = setInterval(() => {
      if (!this.isPlayingAmbient) {
        clearInterval(shimmerInterval);
        return;
      }
      this.playSoftChime();
    }, 4000);
  }

  private playSoftChime() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = 1320 + Math.random() * 440;
    
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 10;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 1);
    gain.gain.linearRampToValueAtTime(0, now + 3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3);
  }

  public stopAmbient() {
    this.isPlayingAmbient = false;
    this.ambientNodes.forEach(node => {
      try { (node as any).stop(); } catch { /* ignore */ }
      node.disconnect();
    });
    this.ambientNodes = [];
  }

  public setVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = val;
    }
  }
}

export const soundEngine = new SoundEngine();
