import type * as Phaser from 'phaser';
import type { ArtLayer, ArtView, EnemyView, LayerPainter } from '../art/contract';

/**
 * 임시 사각형 그림. 그래픽이 꺼져 있거나(?art=0) 그 층을 구현하지 않았을 때 씁니다.
 * 판정 박스를 그대로 그리므로 "그림 없는 기준 화면" 역할도 합니다.
 */

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
};

const cx = (r: { x: number; w: number }) => r.x + r.w / 2;
const cy = (r: { y: number; h: number }) => r.y + r.h / 2;

export const placeholderArt: Record<ArtLayer, LayerPainter> = {
  background(g, v) {
    g.lineStyle(1, C.grid, 1);
    for (let x = 0; x <= v.world.width; x += 80) g.lineBetween(x, 0, x, v.world.height);
    for (let y = 0; y <= v.world.height; y += 80) g.lineBetween(0, y, v.world.width, y);
  },

  terrain(g, v) {
    for (const s of v.world.solids) {
      g.fillStyle(C.solid, 1);
      g.fillRect(s.x, s.y, s.w, s.h);
      g.lineStyle(2, C.solidEdge, 1);
      g.lineBetween(s.x, s.y, s.x + s.w, s.y);
    }
  },

  enemies(g, v) {
    for (const e of v.enemies) drawEnemyBody(g, e, v);
  },

  afterimages(g, v) {
    for (const gh of v.ghosts) {
      g.fillStyle(gh.color, Math.max(0, gh.life / 0.22) * 0.35);
      g.fillRect(gh.x, gh.y, gh.w, gh.h);
    }
    const p = v.player;
    if (p.mode === 'strike' && p.strikeTarget) {
      g.lineStyle(3, C.amber, 0.9);
      g.lineBetween(cx(p), cy(p), cx(p.strikeTarget), cy(p.strikeTarget));
    }
  },

  player(g, v) {
    const p = v.player;
    const blink = p.invuln > 0 && p.mode === 'normal' && Math.floor(v.realTime * 30) % 2 === 0;
    if (blink) return;
    g.fillStyle(p.hurtFlash > 0 ? C.playerHurt : C.player, 1);
    g.fillRect(p.x, p.y, p.w, p.h);
    g.fillStyle(C.bg, 1);
    g.fillRect(p.facing > 0 ? p.x + p.w - 8 : p.x + 3, p.y + 9, 5, 5);
    if (p.dodgeBonus > 0) {
      g.lineStyle(2, C.player, 0.6);
      g.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    }
  },

  projectiles(g, v) {
    for (const n of v.needles) {
      const len = Math.hypot(n.vx, n.vy) || 1;
      g.lineStyle(2, C.needle, 1);
      g.lineBetween(n.x, n.y, n.x - (n.vx / len) * 18, n.y - (n.vy / len) * 18);
    }
  },

  particles(g, v) {
    for (const pt of v.particles) {
      g.fillStyle(pt.color, pt.life / pt.maxLife);
      g.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
  },

  fragments(g, v) {
    for (const e of v.enemies) {
      if (e.state === 'down') continue;
      const ex = cx(e);
      const ey = cy(e);
      // 록온 진행: 원호가 차오르고 균열선이 점점 드러납니다.
      if (e.lockProgress > 0) {
        g.lineStyle(2, C.amber, 0.5 + e.lockProgress * 0.5);
        g.beginPath();
        g.arc(ex, ey, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e.lockProgress, false);
        g.strokePath();
        drawCrack(g, ex, ey, e.lockProgress * 0.6);
      }
      // 열린 조각: 펄스하는 다이아몬드 + 남은 시간 링
      if (e.fragment > 0) {
        const t = e.fragment / e.fragmentMax;
        const r = 13 * (1 + Math.sin(v.realTime * 30) * 0.12);
        g.fillStyle(C.amber, 0.95);
        g.fillTriangle(ex, ey - r, ex + r * 0.7, ey, ex - r * 0.7, ey);
        g.fillTriangle(ex, ey + r, ex + r * 0.7, ey, ex - r * 0.7, ey);
        g.lineStyle(3, C.amber, 0.9);
        g.beginPath();
        g.arc(ex, ey, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t, false);
        g.strokePath();
        drawCrack(g, ex, ey, 1);
      }
    }
  },

  screen(g, v) {
    if (v.diveTimer <= 0) return;
    g.fillStyle(0x2a1a4a, 0.35);
    g.fillRect(v.camera.scrollX, v.camera.scrollY, v.camera.width, v.camera.height);
  },
};

function drawEnemyBody(g: Phaser.GameObjects.Graphics, e: EnemyView, v: ArtView): void {
  if (e.state === 'down') {
    const a = Math.max(0, Math.min(1, e.timer / v.tuning.respawnDelay)) * 0.25;
    g.lineStyle(1, C.solidEnemy, a);
    g.strokeRect(e.x, e.y, e.w, e.h);
    return;
  }
  let col = e.kind === 'cracked' ? C.cracked : C.solidEnemy;
  if (e.state === 'telegraph' && Math.floor(v.realTime * (e.counter ? 30 : 16)) % 2 === 0) col = C.telegraph;
  if (e.hurtFlash > 0) col = 0xffffff;
  g.fillStyle(col, 1);
  g.fillRect(e.x, e.y, e.w, e.h);
  if (e.hp < e.maxHp) {
    g.fillStyle(0x000000, 0.6);
    g.fillRect(e.x, e.y - 8, e.w, 3);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(e.x, e.y - 8, (e.w * e.hp) / e.maxHp, 3);
  }
}

/** 찢긴 기억 균열 (임시 그림) */
function drawCrack(g: Phaser.GameObjects.Graphics, x: number, y: number, amount: number): void {
  g.lineStyle(2, 0xfff1cf, amount);
  const pts = [
    [-12, -16], [-4, -6], [-9, 2], [2, 8], [-2, 16],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    g.lineBetween(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1]);
  }
}
