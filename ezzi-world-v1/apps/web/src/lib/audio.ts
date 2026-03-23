// Audio system for EZZI World
// Uses Web Audio API for procedural sound generation

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  enable() {
    this.enabled = true;
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  disable() {
    this.enabled = false;
  }

  private ensureContext() {
    if (!this.enabled || !this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  // Play a capsule opening sound
  playCapsuleOpen(rarity: string) {
    if (!this.ensureContext()) return;

    const frequencies: Record<string, number[]> = {
      common: [440],
      rare: [440, 554],
      epic: [440, 554, 659],
      legendary: [440, 554, 659, 880],
      mythic: [440, 554, 659, 880, 1100],
    };

    const freqs = frequencies[rarity] || frequencies.common;

    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.frequency.value = freq;
      osc.type = i === freqs.length - 1 ? 'sine' : 'triangle';

      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.5 + i * 0.1);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + i * 0.05);
      osc.stop(this.ctx!.currentTime + 0.5 + i * 0.1);
    });
  }

  // Play mining sound
  playMiningStart() {
    if (!this.ensureContext()) return;

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.frequency.setValueAtTime(200, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx!.currentTime + 0.3);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.5);
  }

  // Play success sound
  playSuccess() {
    if (!this.ensureContext()) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx!.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + i * 0.1);
      osc.stop(this.ctx!.currentTime + i * 0.1 + 0.3);
    });
  }

  // Play error sound
  playError() {
    if (!this.ensureContext()) return;

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx!.currentTime + 0.3);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.3);
  }

  // Play hover sound
  playHover() {
    if (!this.ensureContext()) return;

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.frequency.value = 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.02, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.05);
  }
}

export const audio = new AudioSystem();
