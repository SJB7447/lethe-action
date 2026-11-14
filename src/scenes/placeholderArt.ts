import type * as Phaser from 'phaser';
import type { ArtLayer, ArtView, EnemyView, LayerPainter, PointView } from '../art/contract';

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
  sound: 0xb8c4ff,
  enemyView: 0xd8dcf0,
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

  perception(g, v) {
    if (!v.tuning.showPerception) return;
    // 소리 범위: 외곽선은 처음부터 실제 판정 범위 그대로 (적은 소리가 난 순간 이 안에서 듣습니다).
    // 안쪽에서 퍼져 나가는 물결은 장식이며 판정과 무관합니다.
    for (const s of v.sounds) {
      const age = 1 - s.life / s.maxLife; // 0 → 1
      const fade = 1 - age;
      polygon(g, s.points, C.sound, 0.06 * fade, 1.5, 0.6 * fade);
      const wave = Math.min(1, age / 0.35);
      if (wave < 1) {
        const pts = s.points.map((q) => ({ x: s.x + (q.x - s.x) * wave, y: s.y + (q.y - s.y) * wave }));
        polygon(g, pts, C.sound, 0, 1, 0.35 * (1 - wave));
      }
    }
    // 적 시선
    for (const e of v.enemies) {
      if (e.viewFan.length < 3) continue;
      const col = e.awareness === 'alert' ? C.cracked : e.awareness === 'heard' ? C.amber : C.enemyView;
      const a = e.awareness === 'idle' ? 0.08 : 0.14;
      polygon(g, e.viewFan, col, a, 1, a * 2.5);
    }
    // 이단아 시선 = 록온 가능 범위
    const p = v.player;
    if (p.gazeFan.length >= 3) {
      polygon(g, p.gazeFan, C.player, 0.06, 1, 0.3);
    }
  },

  alerts(g, v) {
    for (const e of v.enemies) {
      if (e.state === 'down' || e.markTimer <= 0) continue;
      const k = e.markTimer / v.tuning.noticeMarkTime; // 1 → 0
      const pop = k > 0.8 ? 1 + (k - 0.8) * 2.5 : 1; // 처음에 살짝 커졌다 줄어듦
      drawExclamation(g, e.x + e.w / 2, e.y - 18, pop * 1.5, e.markKind === 'sight' ? C.cracked : C.amber, Math.min(1, k * 3));
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
    drawPlayerFace(g, v);
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
  // 눈 (보는 쪽). 알아챈 정도에 따라 색이 바뀝니다.
  const eyeCol = e.awareness === 'alert' ? 0xffffff : e.awareness === 'heard' ? C.amber : 0x1a1d28;
  g.fillStyle(eyeCol, 1);
  g.fillRect(e.eyeX - 4, e.eyeY - 2, 8, 4);
  if (e.hp < e.maxHp) {
    g.fillStyle(0x000000, 0.6);
    g.fillRect(e.x, e.y - 8, e.w, 3);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(e.x, e.y - 8, (e.w * e.hp) / e.maxHp, 3);
  }
}

/** 이단아 얼굴: 눈 두 개, 눈동자가 시선 방향을 봅니다. */
function drawPlayerFace(g: Phaser.GameObjects.Graphics, v: ArtView): void {
  const p = v.player;
  const fx = p.x + p.w / 2 + p.facing * 2; // 얼굴 중심
  const fy = p.eyeY;
  // 얼굴판 (어두운 바이저)
  g.fillStyle(C.bg, 0.85);
  g.fillRect(fx - 9, fy - 5, 18, 10);
  const gx = Math.cos(p.gaze);
  const gy = Math.sin(p.gaze);
  for (const ox of [-4, 4]) {
    const ex = fx + ox;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex, fy, 3);
    g.fillStyle(C.bg, 1);
    g.fillCircle(ex + gx * 1.6, fy + gy * 1.6, 1.6);
  }
}

/** 닫힌 다각형 (채우기 + 외곽선) */
function polygon(
  g: Phaser.GameObjects.Graphics,
  pts: readonly PointView[],
  color: number,
  fillAlpha: number,
  lineWidth: number,
  lineAlpha: number,
): void {
  if (pts.length < 3) return;
  g.fillStyle(color, fillAlpha);
  g.lineStyle(lineWidth, color, lineAlpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();
  g.strokePath();
}

/** 느낌표: (x, y)가 아래 끝. 어두운 배경판 위에 막대 + 점 */
function drawExclamation(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, color: number, alpha: number): void {
  const w = 4 * scale; // 막대 굵기
  const bar = 11 * scale; // 막대 길이
  const gap = 2.5 * scale;
  const total = bar + gap + w;
  g.fillStyle(C.bg, 0.75 * alpha);
  g.fillRoundedRect(x - w / 2 - 4, y - total - 4, w + 8, total + 8, 4);
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x - w / 2, y - total, w, bar, Math.min(2, w / 2));
  g.fillCircle(x, y - w / 2, w / 2);
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
