/**
 * [담당: Antigravity] 효과음 진입점.
 * initAudio(bus)의 이름과 인자만 유지하면 내부는 자유롭게 바꿔도 됩니다.
 * 지금은 WebAudio로 만든 임시음입니다. 실제 효과음 파일로 교체해 주세요.
 */
import type { EventBus } from '../core/events';
import { Sfx } from './sfx';

export function initAudio(bus: EventBus): void {
  const sfx = new Sfx();
  const unlock = () => sfx.unlock();
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);

  bus.on('player:jump', ({ wall }) => sfx.blip(wall ? 520 : 440, 0.06, 'square', 0.05));
  bus.on('player:dash', ({ perfect }) => {
    sfx.noise(0.08, 0.08);
    if (perfect) sfx.sweep(900, 1800, 0.12, 'sine', 0.08);
  });
  bus.on('player:land', ({ impact }) => sfx.noise(0.05, 0.04 + impact * 0.06));
  bus.on('player:hurt', () => sfx.sweep(300, 90, 0.18, 'sawtooth', 0.08));
  bus.on('needle:fire', () => sfx.sweep(1600, 900, 0.05, 'triangle', 0.04));
  bus.on('needle:hit', ({ killed }) => sfx.blip(killed ? 220 : 330, 0.05, 'square', 0.06));
  bus.on('lock:complete', () => sfx.blip(1320, 0.05, 'sine', 0.07));
  bus.on('fragment:open', ({ chained }) => sfx.sweep(chained ? 880 : 660, chained ? 1760 : 1320, 0.08, 'sine', 0.07));
  bus.on('fragment:close', ({ missed }) => missed && sfx.sweep(500, 200, 0.15, 'square', 0.05));
  bus.on('strike:hit', ({ chain }) => {
    sfx.noise(0.07, 0.14);
    sfx.blip(180 + Math.min(chain, 8) * 40, 0.09, 'square', 0.1);
  });
  bus.on('enemy:telegraph', ({ counter }) => sfx.blip(counter ? 980 : 760, 0.04, 'triangle', 0.04));
  bus.on('dive:ready', () => sfx.arp([523, 659, 784, 1047], 0.06, 0.06));
  bus.on('dive:start', () => sfx.sweep(120, 60, 0.8, 'sawtooth', 0.1));
  bus.on('dive:impact', () => {
    sfx.noise(0.4, 0.2);
    sfx.sweep(80, 40, 0.5, 'sine', 0.2);
  });
}
