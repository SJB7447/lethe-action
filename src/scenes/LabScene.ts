import * as Phaser from 'phaser';
import type { EventBus } from '../core/events';
import type { Input } from '../core/input';
import { tuning as T } from '../core/tuning';
import { cx, cy } from '../game/physics';
import { Sim, type Enemy } from '../game/sim';

/** 렌더링 전용 씬. 모든 판정은 Sim이 하고, 여기서는 그리기만 합니다. */

const C = {
  bg: 0x0b0d14,
  grid: 0x161a26,
  solid: 0x2a2f42,
  solidEdge: 0x454c66,
  player: 0x6ee7f2,
  playerHurt: 0xff5470,
  cracked: 0xc2334d,
  solidEnemy: 0x7a7f99,
  telegraph: 0xffd166,
  amber: 0xe8b04b,
  needle: 0xd8dcf0,
  debug: 0x3d6b8f,
};

export class LabScene extends Phaser.Scene {
  sim!: Sim;
  private g!: Phaser.GameObjects.Graphics;
  private camX = 0;
  private camY = 0;
  private time_ = 0;

  constructor(
    private bus: EventBus,
    private input_: Input,
  ) {
    super('lab');
  }

  create(): void {
    this.sim = new Sim(this.bus, this.input_);
    this.g = this.add.graphics();
    const p = this.sim.player;
    this.camX = cx(p) - this.scale.width / 2;
    this.camY = cy(p) - this.scale.height / 2;
    (window as unknown as { __sim: Sim }).__sim = this.sim; // 디버그·테스트용
  }

  update(_time: number, delta: number): void {
    const realDt = Math.min(delta / 1000, 1 / 20);
    this.time_ += realDt;
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

  private draw(): void {
    const g = this.g;
    const sim = this.sim;
    const p = sim.player;
    g.clear();

    // 배경 격자
    g.lineStyle(1, C.grid, 1);
    for (let x = 0; x <= sim.world.width; x += 80) g.lineBetween(x, 0, x, sim.world.height);
    for (let y = 0; y <= sim.world.height; y += 80) g.lineBetween(0, y, sim.world.width, y);

    // 지형
    for (const s of sim.world.solids) {
      g.fillStyle(C.solid, 1);
      g.fillRect(s.x, s.y, s.w, s.h);
      g.lineStyle(2, C.solidEdge, 1);
      g.lineBetween(s.x, s.y, s.x + s.w, s.y);
    }

    // 디버그: 범위 표시
    if (T.showDebug) {
      g.lineStyle(1, C.debug, 0.8);
      g.strokeCircle(cx(p), cy(p), T.lockRange);
      g.lineStyle(1, C.amber, 0.35);
      g.strokeCircle(cx(p), cy(p), T.chainSearchRadius);
      g.lineStyle(1, C.player, 0.35);
      g.strokeCircle(cx(p), cy(p), T.closeRange);
    }

    for (const e of sim.enemies) this.drawEnemy(e);

    // 잔상
    for (const gh of sim.ghosts) {
      g.fillStyle(gh.color, Math.max(0, gh.life / 0.22) * 0.35);
      g.fillRect(gh.x, gh.y, gh.w, gh.h);
    }

    // 파고드는 궤적
    if (p.mode === 'strike' && p.strikeTarget) {
      g.lineStyle(3, C.amber, 0.9);
      g.lineBetween(cx(p), cy(p), cx(p.strikeTarget), cy(p.strikeTarget));
    }

    // 플레이어 (히트박스 그대로 = 임시 그림)
    const blink = p.invuln > 0 && p.mode === 'normal' && Math.floor(this.time_ * 30) % 2 === 0;
    if (!blink) {
      const col = p.hurtFlash > 0 ? C.playerHurt : C.player;
      g.fillStyle(col, 1);
      g.fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle(C.bg, 1);
      g.fillRect(p.facing > 0 ? p.x + p.w - 8 : p.x + 3, p.y + 9, 5, 5);
      if (p.dodgeBonus > 0) {
        g.lineStyle(2, C.player, 0.6);
        g.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
      }
    }

    // 바늘
    for (const n of sim.needles) {
      const len = Math.hypot(n.vx, n.vy) || 1;
      g.lineStyle(2, C.needle, 1);
      g.lineBetween(n.x, n.y, n.x - (n.vx / len) * 18, n.y - (n.vy / len) * 18);
    }

    // 파티클
    for (const pt of sim.particles) {
      g.fillStyle(pt.color, pt.life / pt.maxLife);
      g.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }

    // 고스트 다이빙 화면 효과
    if (sim.diveTimer > 0) {
      const cam = this.cameras.main;
      g.fillStyle(0x2a1a4a, 0.35);
      g.fillRect(cam.scrollX, cam.scrollY, this.scale.width, this.scale.height);
    }
  }

  private drawEnemy(e: Enemy): void {
    const g = this.g;
    if (e.state === 'down') {
      const a = Math.max(0, Math.min(1, e.timer / T.respawnDelay)) * 0.25;
      g.lineStyle(1, C.solidEnemy, a);
      g.strokeRect(e.x, e.y, e.w, e.h);
      return;
    }
    let col = e.kind === 'cracked' ? C.cracked : C.solidEnemy;
    if (e.state === 'telegraph' && Math.floor(this.time_ * (e.counter ? 30 : 16)) % 2 === 0) col = C.telegraph;
    if (e.hurtFlash > 0) col = 0xffffff;
    g.fillStyle(col, 1);
    g.fillRect(e.x, e.y, e.w, e.h);
    // 체력
    if (e.hp < e.maxHp) {
      g.fillStyle(0x000000, 0.6);
      g.fillRect(e.x, e.y - 8, e.w, 3);
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(e.x, e.y - 8, (e.w * e.hp) / e.maxHp, 3);
    }

    const ex = cx(e);
    const ey = cy(e);
    // 록온 진행: 원호가 차오르고 균열선이 점점 드러납니다.
    if (e.lockProgress > 0) {
      g.lineStyle(2, C.amber, 0.5 + e.lockProgress * 0.5);
      g.beginPath();
      g.arc(ex, ey, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e.lockProgress, false);
      g.strokePath();
      this.drawCrack(ex, ey, e.lockProgress * 0.6);
    }
    // 열린 조각: 펄스하는 다이아몬드 + 남은 시간 링
    if (e.fragment > 0) {
      const t = e.fragment / e.fragmentMax;
      const pulse = 1 + Math.sin(this.time_ * 30) * 0.12;
      const r = 13 * pulse;
      g.fillStyle(C.amber, 0.95);
      g.fillTriangle(ex, ey - r, ex + r * 0.7, ey, ex - r * 0.7, ey);
      g.fillTriangle(ex, ey + r, ex + r * 0.7, ey, ex - r * 0.7, ey);
      g.lineStyle(3, C.amber, 0.9);
      g.beginPath();
      g.arc(ex, ey, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t, false);
      g.strokePath();
      this.drawCrack(ex, ey, 1);
    }
  }

  /** 찢긴 기억 균열 (임시 그림) */
  private drawCrack(x: number, y: number, amount: number): void {
    const g = this.g;
    g.lineStyle(2, 0xfff1cf, amount);
    const pts = [
      [-12, -16], [-4, -6], [-9, 2], [2, 8], [-2, 16],
    ];
    for (let i = 0; i < pts.length - 1; i++) {
      g.lineBetween(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1]);
    }
  }
}
