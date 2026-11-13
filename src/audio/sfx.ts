/** [담당: Antigravity] 파일 기반 효과음 재생기 (`public/assets/audio/*.wav`). */

export const SFX_KEYS = [
  'jump',
  'jump_wall',
  'land',
  'dash',
  'dash_perfect',
  'hurt',
  'needle_fire',
  'needle_hit',
  'needle_kill',
  'lock_start',
  'lock_complete',
  'fragment_open',
  'fragment_open_chain',
  'fragment_missed',
  'strike_start',
  'strike_hit',
  'enemy_telegraph',
  'enemy_counter',
  'enemy_down',
  'dive_ready',
  'dive_start',
  'dive_impact',
] as const;

export type SfxKey = (typeof SFX_KEYS)[number];

export interface PlayOptions {
  volume?: number;
  rate?: number;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private rawBuffers = new Map<SfxKey, ArrayBuffer>();
  private decoded = new Map<SfxKey, AudioBuffer>();
  private loading = new Map<SfxKey, Promise<void>>();
  volume = 0.65;

  /** 모든 효과음 WAV 파일을 미리 내려받습니다. */
  preloadAll(keys: readonly SfxKey[] = SFX_KEYS): void {
    for (const key of keys) {
      void this.loadFile(key);
    }
  }

  /** 사용자 입력 시 AudioContext를 활성화하고 대기 중인 버퍼를 디코딩합니다. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      this.decodePending();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      this.decodePending();
    } catch {
      this.ctx = null;
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  play(key: SfxKey, options?: PlayOptions): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const buffer = this.decoded.get(key);
    if (!buffer) {
      void this.loadFile(key);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    if (options?.rate !== undefined) {
      src.playbackRate.value = Math.max(0.25, Math.min(4, options.rate));
    }

    const gain = ctx.createGain();
    gain.gain.value = options?.volume ?? 1;

    src.connect(gain).connect(this.master);
    src.start(ctx.currentTime);
  }

  private loadFile(key: SfxKey): Promise<void> {
    if (this.decoded.has(key) || this.rawBuffers.has(key)) {
      this.decodePending();
      return Promise.resolve();
    }
    const existing = this.loading.get(key);
    if (existing) return existing;

    const task = fetch(`./assets/audio/${key}.wav`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((ab) => {
        this.rawBuffers.set(key, ab);
        return this.decodeKey(key);
      })
      .catch((err) => {
        console.warn(`[sfx] ${key}.wav 로드 실패:`, err);
      })
      .finally(() => {
        this.loading.delete(key);
      });

    this.loading.set(key, task);
    return task;
  }

  private decodePending(): void {
    if (!this.ctx) return;
    for (const key of this.rawBuffers.keys()) {
      void this.decodeKey(key);
    }
  }

  private async decodeKey(key: SfxKey): Promise<void> {
    if (!this.ctx || this.decoded.has(key)) return;
    const raw = this.rawBuffers.get(key);
    if (!raw) return;
    this.rawBuffers.delete(key);
    try {
      // decodeAudioData는 전달된 ArrayBuffer를 detach하므로 복사본을 넘깁니다.
      const copy = raw.slice(0);
      const audioBuf = await this.ctx.decodeAudioData(copy);
      this.decoded.set(key, audioBuf);
    } catch (err) {
      console.warn(`[sfx] ${key}.wav 디코딩 실패:`, err);
    }
  }
}
