/** [담당: Antigravity] 임시 합성 효과음. 파일 기반 재생으로 교체 예정. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  volume = 0.6;

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  blip(freq: number, dur: number, type: OscillatorType, vol: number): void {
    this.sweep(freq, freq, dur, type, vol);
  }

  sweep(from: number, to: number, dur: number, type: OscillatorType, vol: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur: number, vol: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = vol;
    src.connect(gain).connect(this.master);
    src.start();
  }

  arp(freqs: number[], step: number, vol: number): void {
    freqs.forEach((f, i) => setTimeout(() => this.blip(f, step * 1.5, 'sine', vol), i * step * 1000));
  }
}
