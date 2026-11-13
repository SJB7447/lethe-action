import * as Phaser from 'phaser';
import { createArtPainter } from '../art';
import {
  ART_LAYERS,
  DEBUG_DEPTH,
  layerDepth,
  type ArtLayer,
  type ArtPainter,
  type ArtView,
} from '../art/contract';
import type { EventBus } from '../core/events';
import type { Input } from '../core/input';
import { tuning as T } from '../core/tuning';
import { cx, cy } from '../game/physics';
import { GAUGE_MAX, Sim } from '../game/sim';
import { placeholderArt } from './placeholderArt';

/**
 * 렌더링 전용 씬. 모든 판정은 Sim이 하고, 여기서는 그리기만 합니다.
 * 그림은 층별로 src/art(Antigravity) 또는 임시 사각형(placeholderArt)이 그립니다.
 */

const DEBUG = {
  lockRange: 0x3d6b8f,
  chainRange: 0xe8b04b,
  closeRange: 0x6ee7f2,
  hitbox: 0x7cff8a,
  solid: 0xff8a3d,
};

export class LabScene extends Phaser.Scene {
  sim!: Sim;
  private art: ArtPainter = {};
  private layers = {} as Record<ArtLayer, Phaser.GameObjects.Graphics>;
  private debugG!: Phaser.GameObjects.Graphics;
  private brokenLayers = new Set<ArtLayer>(); // 오류를 낸 그림 층 (임시 그림으로 대체)
  private artShown: boolean | null = null;
  private camX = 0;
  private camY = 0;
  private realTime = 0;

  constructor(
    private bus: EventBus,
    private input_: Input,
  ) {
    super('lab');
  }

  preload(): void {
    try {
      this.art = createArtPainter();
      this.art.preload?.(this.load);
    } catch (err) {
      console.error('[art] createArtPainter/preload 실패, 임시 그림만 사용합니다:', err);
      this.art = {};
    }
  }

  create(): void {
    this.sim = new Sim(this.bus, this.input_);
    for (const layer of ART_LAYERS) {
      this.layers[layer] = this.add.graphics().setDepth(layerDepth(layer));
    }
    this.debugG = this.add.graphics().setDepth(DEBUG_DEPTH);
    try {
      this.art.init?.({ scene: this, layers: this.layers });
    } catch (err) {
      console.error('[art] init 실패, 임시 그림만 사용합니다:', err);
      this.art = {};
    }
    const p = this.sim.player;
    this.camX = cx(p) - this.scale.width / 2;
    this.camY = cy(p) - this.scale.height / 2;
    (window as unknown as { __sim: Sim }).__sim = this.sim; // 디버그·테스트용
  }

  update(_time: number, delta: number): void {
    const realDt = Math.min(delta / 1000, 1 / 20);
    this.realTime += realDt;
    this.input_.poll();
    if (this.input_.consume('debug')) T.showDebug = !T.showDebug;
    this.sim.frame(realDt);
    this.input_.endFrame();
    this.updateCamera(realDt);
    this.draw();
  }

  private updateCamera(dt: number): void {
    const p = this.sim.player;
    const w = this.scale.width;
    const h = this.scale.height;
    const lookAhead = Math.max(-140, Math.min(140, p.vx * 0.18));
    const tx = cx(p) + lookAhead - w / 2;
    const ty = cy(p) - h * 0.55;
    const k = 1 - Math.exp(-8 * dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    this.camX = Math.max(0, Math.min(this.sim.world.width - w, this.camX));
    this.camY = Math.max(0, Math.min(this.sim.world.height - h, this.camY));
    const s = this.sim.shake;
    const ox = s > 0 ? (Math.random() * 2 - 1) * s : 0;
    const oy = s > 0 ? (Math.random() * 2 - 1) * s : 0;
    this.cameras.main.setScroll(Math.round(this.camX + ox), Math.round(this.camY + oy));
  }

  private makeView(): ArtView {
    const sim = this.sim;
    const cam = this.cameras.main;
    return {
      time: sim.time,
      realTime: this.realTime,
      player: sim.player,
      enemies: sim.enemies,
      needles: sim.needles,
      particles: sim.particles,
      ghosts: sim.ghosts,
      world: { width: sim.world.width, height: sim.world.height, solids: sim.world.solids },
      camera: { scrollX: cam.scrollX, scrollY: cam.scrollY, width: this.scale.width, height: this.scale.height },
      combo: sim.combo,
      chain: sim.chain,
      gauge: sim.gauge,
      gaugeMax: GAUGE_MAX,
      diveTimer: sim.diveTimer,
      hitstop: sim.hitstop,
      timeScale: sim.timeScale,
      tuning: T,
    };
  }

  private draw(): void {
    const view = this.makeView();
    const showArt = T.showArt;
    if (showArt !== this.artShown) {
      this.artShown = showArt;
      try {
        this.art.onToggle?.(showArt);
      } catch (err) {
        console.error('[art] onToggle 실패:', err);
      }
    }

    for (const layer of ART_LAYERS) {
      const g = this.layers[layer];
      g.clear();
      const custom = this.art[layer];
      if (showArt && custom && !this.brokenLayers.has(layer)) {
        try {
          custom(g, view);
          continue;
        } catch (err) {
          this.brokenLayers.add(layer);
          console.error(`[art] '${layer}' 층 그리기 실패, 이 층은 임시 그림으로 바꿉니다:`, err);
          g.clear();
        }
      }
      placeholderArt[layer](g, view);
    }

    this.drawDebug();
  }

  /** 범위·판정 박스. 그림과 상관없이 항상 맨 위에 그립니다. */
  private drawDebug(): void {
    const g = this.debugG;
    g.clear();
    if (!T.showDebug) return;
    const sim = this.sim;
    const p = sim.player;
    g.lineStyle(1, DEBUG.lockRange, 0.8);
    g.strokeCircle(cx(p), cy(p), T.lockRange);
    g.lineStyle(1, DEBUG.chainRange, 0.35);
    g.strokeCircle(cx(p), cy(p), T.chainSearchRadius);
    g.lineStyle(1, DEBUG.closeRange, 0.35);
    g.strokeCircle(cx(p), cy(p), T.closeRange);

    // 판정 박스
    g.lineStyle(1, DEBUG.hitbox, 0.9);
    g.strokeRect(p.x, p.y, p.w, p.h);
    for (const e of sim.enemies) {
      if (e.state !== 'down') g.strokeRect(e.x, e.y, e.w, e.h);
    }
    g.lineStyle(1, DEBUG.solid, 0.5);
    for (const s of sim.world.solids) g.strokeRect(s.x, s.y, s.w, s.h);
  }
}
