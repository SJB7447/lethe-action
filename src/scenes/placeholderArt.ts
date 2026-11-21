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
    const st = v.stage;
    // 출입구: 앰버 문틀
    for (const ex of st.exits) {
      g.fillStyle(C.amber, 0.08);
      g.fillRect(ex.x, ex.y, ex.w, ex.h);
      g.lineStyle(2, C.amber, 0.6);
      g.strokeRect(ex.x + 2, ex.y + 2, ex.w - 4, ex.h - 4);
    }
    // 체크포인트: 기둥 + 불빛 (켜지면 청록)
    for (const cp of st.checkpoints) {
      const on = cp.active;
      g.fillStyle(0x3a4058, 1);
      g.fillRect(cp.x + cp.w / 2 - 4, cp.y + 30, 8, cp.h - 30);
      g.fillStyle(on ? C.player : 0x5a6078, on ? 0.95 : 0.6);
      g.fillCircle(cp.x + cp.w / 2, cp.y + 22, on ? 10 + Math.sin(v.realTime * 4) * 1.5 : 8);
    }
    // 끝 지점 (보스·컷신이 생기기 전 임시)
    if (st.goal) {
      const gl = st.goal;
      g.fillStyle(0xffffff, 0.06 + 0.04 * Math.sin(v.realTime * 3));
      g.fillRect(gl.x, gl.y, gl.w, gl.h);
      g.lineStyle(2, 0xffffff, 0.7);
      g.strokeRect(gl.x, gl.y, gl.w, gl.h);
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
    if (v.boss) drawBoss(g, v);
    for (const e of v.enemies) {
      if (e.bossPart) drawBossPart(g, e);
      else drawEnemyBody(g, e, v);
    }
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
        // 퍼펙트 시간: 흰 테두리가 조여들며 빛남
        if (e.perfectTimer > 0) {
          const k = e.perfectTimer / Math.max(0.001, v.tuning.perfectWindow);
          g.lineStyle(3, 0xffffff, 0.95);
          g.strokeCircle(ex, ey, 22 + 18 * k);
          g.fillStyle(0xffffff, 0.25);
          g.fillCircle(ex, ey, 18);
        }
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
    const cam = v.camera;
    // 보스 체력 (임시: Antigravity HUD가 boss:hp로 대체)
    if (v.boss && v.boss.state !== 'defeated') {
      const b = v.boss;
      const w = 420;
      const x = cam.scrollX + (cam.width - w) / 2;
      const y = cam.scrollY + cam.height - 34;
      g.fillStyle(C.bg, 0.8);
      g.fillRect(x - 4, y - 4, w + 8, 16);
      g.fillStyle(b.phase === 2 ? C.cracked : C.amber, 0.95);
      g.fillRect(x, y, (w * b.hp) / b.maxHp, 8);
      g.lineStyle(1, 0xffffff, 0.4);
      g.lineBetween(x + w / 2, y - 2, x + w / 2, y + 10); // 페이즈 2 경계
    }
    if (v.diveTimer > 0) {
      g.fillStyle(0x2a1a4a, 0.35);
      g.fillRect(cam.scrollX, cam.scrollY, cam.width, cam.height);
    }
    // 사망: 크림슨에서 어둠으로
    if (v.stage.deathTimer > 0) {
      const k = 1 - v.stage.deathTimer / Math.max(0.01, v.tuning.deathRespawnDelay); // 0 → 1
      g.fillStyle(C.cracked, 0.25 * (1 - k));
      g.fillRect(cam.scrollX, cam.scrollY, cam.width, cam.height);
      g.fillStyle(C.bg, Math.min(0.9, k * 1.2));
      g.fillRect(cam.scrollX, cam.scrollY, cam.width, cam.height);
    }
    if (v.stage.cleared) {
      g.fillStyle(C.bg, 0.6);
      g.fillRect(cam.scrollX, cam.scrollY, cam.width, cam.height);
    }
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

/** 보스 몸체 + 예고 + 기억 소거 파동 (임시 그림) */
function drawBoss(g: Phaser.GameObjects.Graphics, v: ArtView): void {
  const b = v.boss;
  if (!b) return;
  // 파동: 판정 두께 그대로
  if (b.waveActive) {
    const half = v.tuning.bossWaveWidth / 2;
    g.lineStyle(v.tuning.bossWaveWidth, C.cracked, 0.18);
    g.strokeCircle(b.waveX, b.waveY, b.waveRadius);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(b.waveX, b.waveY, b.waveRadius + half);
    g.strokeCircle(b.waveX, b.waveY, Math.max(0, b.waveRadius - half));
  }
  const defeated = b.state === 'defeated';
  let col = defeated ? 0x3a2a30 : b.phase === 2 ? 0x5a1c2a : 0x3c2030;
  if (b.hurtFlash > 0) col = 0xffffff;
  g.fillStyle(col, defeated ? 0.5 : 1);
  g.fillRect(b.x, b.y, b.w, b.h);
  g.lineStyle(2, b.state === 'down' ? 0x6a6a80 : C.cracked, 0.9);
  g.strokeRect(b.x, b.y, b.w, b.h);
  // 눈 (보는 방향)
  g.fillStyle(b.state === 'down' ? 0x444455 : 0xffffff, 1);
  g.fillRect(b.x + b.w / 2 + b.facing * 22 - 10, b.y + 26, 20, 6);
  // 예고: 파동은 몸이 붉게 맥동, 돌진은 앞쪽 화살표
  if (b.state === 'telegraph') {
    const blink = Math.floor(v.time * 14) % 2 === 0;
    if (b.pattern === 'wave') {
      g.lineStyle(4, C.cracked, blink ? 1 : 0.4);
      g.strokeCircle(b.x + b.w / 2, b.y + b.h / 2, 30 + (1 - b.timer / Math.max(0.01, v.tuning.bossWaveTelegraph)) * 90);
    } else {
      const fx = b.facing > 0 ? b.x + b.w + 10 : b.x - 10;
      const cy0 = b.y + b.h - 40;
      g.fillStyle(C.telegraph, blink ? 0.95 : 0.4);
      g.fillTriangle(fx, cy0 - 26, fx, cy0 + 26, fx + b.facing * 50, cy0);
    }
  }
  if (b.state === 'down') {
    g.fillStyle(0xffffff, 0.08 + 0.05 * Math.sin(v.time * 6));
    g.fillRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
  }
}

/** 보스 균열 소켓 (조각·록온은 fragments 층이 그림) */
function drawBossPart(g: Phaser.GameObjects.Graphics, e: EnemyView): void {
  if (e.state === 'down') {
    if (e.bossPart === 'weak') {
      g.lineStyle(1, 0x6a6a80, 0.6);
      g.strokeCircle(e.x + e.w / 2, e.y + e.h / 2, 9); // 끊긴 자리
    }
    return;
  }
  const r = e.bossPart === 'core' ? 16 : 11;
  g.fillStyle(e.hurtFlash > 0 ? 0xffffff : C.cracked, 1);
  g.fillCircle(e.x + e.w / 2, e.y + e.h / 2, r);
  g.lineStyle(2, 0xfff1cf, 0.9);
  g.strokeCircle(e.x + e.w / 2, e.y + e.h / 2, r);
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
