import type * as Phaser from 'phaser';
import type { EventBus } from '../core/events';
import { tuning as T } from '../core/tuning';
import type { Sim } from '../game/sim';

/**
 * 타격감 화면 효과 (손맛 영역, Claude 담당).
 * 이벤트를 받아 카메라 확대·밀림, 번쩍임, 집중선, 가장자리 맥동을 만듭니다.
 * 모두 실제 시간으로 움직이므로 히트스톱 중에도 재생됩니다. 세기는 tuning의 fx* 값.
 */

const AMBER = 0xe8b04b;
const WHITE = 0xfff1cf;
const CRIMSON = 0xc2334d;
const INK = 0x05060a;

/** 화면 효과는 그림 층 위, 디버그 아래 */
export const HIT_FX_DEPTH = 900;

interface ImpactLines {
  x: number; // 화면 좌표
  y: number;
  life: number;
  maxLife: number;
  count: number;
  seed: number;
  power: number;
}

export class HitFx {
  /** 카메라에 더할 값 (LabScene이 읽음) */
  zoom = 0;
  kickX = 0;
  kickY = 0;

  private g: Phaser.GameObjects.Graphics;
  private flash = 0;
  private flashColor = WHITE;
  private edge = 0;
  private edgeColor = AMBER;
  private tunnel = 0;
  private time = 0;
  private lines: ImpactLines[] = [];

  constructor(
    private scene: Phaser.Scene,
    bus: EventBus,
    private getSim: () => Sim,
  ) {
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(HIT_FX_DEPTH);

    bus.on('strike:hit', ({ enemyId, chain, perfect }) => this.onStrike(enemyId, chain, perfect));
    bus.on('lock:complete', () => this.pulse(AMBER, T.fxLockPulse, T.fxZoomPunch * 0.3));
    bus.on('fragment:open', ({ chained }) => {
      if (chained) this.pulse(AMBER, T.fxLockPulse * 0.7, 0);
    });
    bus.on('fragment:close', ({ missed }) => {
      if (missed) this.pulse(CRIMSON, T.fxMissFlash, 0);
    });
    bus.on('room:reset', () => this.clear());
  }

  private clear(): void {
    this.zoom = this.kickX = this.kickY = this.flash = this.edge = this.tunnel = 0;
    this.lines = [];
  }

  private pulse(color: number, strength: number, zoom: number): void {
    if (strength > this.edge) {
      this.edge = strength;
      this.edgeColor = color;
    }
    this.zoom = Math.max(this.zoom, zoom);
  }

  private onStrike(enemyId: number, chain: number, perfect: boolean): void {
    const sim = this.getSim();
    const e = sim.enemies.find((o) => o.id === enemyId);
    const p = sim.player;
    // 연쇄가 길수록, 퍼펙트면 더 강하게
    const k = Math.min(T.fxChainCap, 1 + (chain - 1) * T.fxChainGrowth) * (perfect ? T.fxPerfectBoost : 1);
    this.zoom = Math.max(this.zoom, T.fxZoomPunch * k);

    // 파고든 방향으로 카메라를 밀어 줍니다
    const speed = Math.hypot(p.vx, p.vy) || 1;
    this.kickX = (p.vx / speed) * T.fxKick * k;
    this.kickY = (p.vy / speed) * T.fxKick * k;

    this.flash = Math.max(this.flash, T.fxFlash * Math.min(1.5, k));
    this.flashColor = perfect ? 0xffffff : chain >= 3 ? AMBER : WHITE;

    if (e && T.fxImpactLines > 0) {
      const cam = this.scene.cameras.main;
      this.lines.push({
        x: e.x + e.w / 2 - cam.scrollX,
        y: e.y + e.h / 2 - cam.scrollY,
        life: 0.16,
        maxLife: 0.16,
        count: Math.round(T.fxImpactLines),
        seed: Math.random() * Math.PI * 2,
        power: k,
      });
    }
  }

  /** 렌더 프레임마다. realDt는 실제 경과 시간. */
  update(realDt: number): void {
    const sim = this.getSim();
    this.time += realDt;
    this.zoom *= Math.exp(-realDt * 16);
    this.kickX *= Math.exp(-realDt * 18);
    this.kickY *= Math.exp(-realDt * 18);
    this.flash *= Math.exp(-realDt * 22);
    this.edge *= Math.exp(-realDt * 7);
    const tunnelTarget = sim.player.mode === 'strike' ? T.fxStrikeTunnel : 0;
    this.tunnel += (tunnelTarget - this.tunnel) * (1 - Math.exp(-realDt * 25));
    for (const l of this.lines) l.life -= realDt;
    this.lines = this.lines.filter((l) => l.life > 0);
    if (this.zoom < 0.0005) this.zoom = 0;
  }

  draw(): void {
    const g = this.g;
    g.clear();
    if (!T.fxEnabled) return;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    if (this.tunnel > 0.01) vignette(g, INK, this.tunnel, w, h, 150);
    if (this.edge > 0.01) vignette(g, this.edgeColor, this.edge * 0.6, w, h, 70);
    // 퍼펙트 연쇄 중: 가장자리 흰빛 맥동
    if (this.getSim().perfectMode && T.fxPerfectGlow > 0) {
      vignette(g, 0xffffff, T.fxPerfectGlow * (0.75 + 0.25 * Math.sin(this.time * 10)), w, h, 90);
    }

    for (const l of this.lines) {
      const t = 1 - l.life / l.maxLife; // 0 → 1
      const alpha = (1 - t) * 0.9;
      const inner = 30 + t * 120 * l.power;
      const len = (70 + 60 * l.power) * (1 - t * 0.5);
      for (let i = 0; i < l.count; i++) {
        const a = l.seed + (i / l.count) * Math.PI * 2 + (i % 2) * 0.12;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const r0 = inner * (i % 3 === 0 ? 0.8 : 1);
        g.lineStyle(i % 2 === 0 ? 3 : 1.5, i % 3 === 0 ? AMBER : WHITE, alpha);
        g.lineBetween(l.x + ca * r0, l.y + sa * r0, l.x + ca * (r0 + len), l.y + sa * (r0 + len));
      }
    }

    if (this.flash > 0.01) {
      g.fillStyle(this.flashColor, Math.min(0.8, this.flash));
      g.fillRect(-40, -40, w + 80, h + 80);
    }
  }
}

/** 가장자리에서 안쪽으로 옅어지는 테두리 */
function vignette(g: Phaser.GameObjects.Graphics, color: number, alpha: number, w: number, h: number, thickness: number): void {
  const steps = 10;
  const step = thickness / steps;
  const pad = 40; // 확대·밀림 때도 가장자리가 비지 않게
  for (let i = 0; i < steps; i++) {
    const a = alpha * Math.pow(1 - i / steps, 2) * 0.35;
    const inset = i * step;
    g.fillStyle(color, a);
    g.fillRect(-pad, -pad, w + pad * 2, inset + step + pad); // 위
    g.fillRect(-pad, h - inset - step, w + pad * 2, inset + step + pad); // 아래
    g.fillRect(-pad, -pad, inset + step + pad, h + pad * 2); // 왼쪽
    g.fillRect(w - inset - step, -pad, inset + step + pad, h + pad * 2); // 오른쪽
  }
}
