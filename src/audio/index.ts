/**
 * [담당: Antigravity] 효과음 진입점.
 * initAudio(bus)의 이름과 인자만 유지하면 내부는 자유롭게 바꿔도 됩니다.
 */
import type { EventBus } from '../core/events';
import { SFX_KEYS, Sfx } from './sfx';

export function initAudio(bus: EventBus): void {
  const sfx = new Sfx();
  sfx.preloadAll(SFX_KEYS);

  const unlock = () => sfx.unlock();
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);

  let lastHp = Number.POSITIVE_INFINITY;

  bus.on('room:reset', () => {
    lastHp = Number.POSITIVE_INFINITY;
  });

  bus.on('player:jump', ({ wall }) => {
    sfx.play(wall ? 'jump_wall' : 'jump', { volume: 0.45 });
  });

  bus.on('player:land', ({ impact }) => {
    sfx.play('land', { volume: Math.min(0.6, 0.22 + impact * 0.38) });
  });

  bus.on('player:dash', ({ perfect }) => {
    sfx.play(perfect ? 'dash_perfect' : 'dash', { volume: perfect ? 0.68 : 0.48 });
  });

  bus.on('player:hurt', ({ hp }) => {
    if (hp < lastHp) {
      sfx.play('hurt', { volume: 0.65 });
    }
    lastHp = hp;
  });

  bus.on('needle:fire', () => {
    sfx.play('needle_fire', { volume: 0.35 });
  });

  bus.on('needle:hit', ({ killed }) => {
    sfx.play(killed ? 'needle_kill' : 'needle_hit', { volume: killed ? 0.56 : 0.42 });
  });

  bus.on('lock:progress', ({ progress }) => {
    if (progress === 0) sfx.play('lock_start', { volume: 0.26 });
  });

  bus.on('lock:complete', () => {
    sfx.play('lock_complete', { volume: 0.7 });
  });

  bus.on('fragment:open', ({ chained }) => {
    sfx.play(chained ? 'fragment_open_chain' : 'fragment_open', { volume: 0.66 });
  });

  bus.on('fragment:close', ({ missed }) => {
    if (missed) sfx.play('fragment_missed', { volume: 0.68 });
  });

  bus.on('strike:start', ({ chain }) => {
    sfx.play('strike_start', { volume: 0.44, rate: 1 + Math.min(chain, 8) * 0.03 });
  });

  bus.on('strike:hit', ({ chain }) => {
    sfx.play('strike_hit', { volume: 0.86, rate: 1 + Math.min(chain, 8) * 0.045 });
  });

  bus.on('enemy:telegraph', ({ counter }) => {
    sfx.play(counter ? 'enemy_counter' : 'enemy_telegraph', { volume: counter ? 0.56 : 0.36 });
  });

  bus.on('enemy:down', () => {
    sfx.play('enemy_down', { volume: 0.55 });
  });

  bus.on('dive:ready', () => {
    sfx.play('dive_ready', { volume: 0.62 });
  });

  bus.on('dive:start', () => {
    sfx.play('dive_start', { volume: 0.8 });
  });

  bus.on('dive:impact', () => {
    sfx.play('dive_impact', { volume: 0.92 });
  });
}
