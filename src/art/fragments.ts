/**
 * [담당: Antigravity] 'fragments' 층 그리기 — 록온 진행 + 찢긴 기억 조각 + 퍼펙트 타이밍 표시.
 * 규칙: docs/ART_GUIDE.md (2장 시각 언어, 3장 읽기 순서·view.time 기준, 4장 판정 읽기 전용).
 */
import type * as Phaser from 'phaser';
import type { ArtView, EnemyView } from './contract';
import { PALETTE } from './palette';

interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** 중심에서 바깥으로 뻗는 직선 균열 가지들 */
const CRACK_BRANCHES: readonly (readonly Vec2[])[] = [
  [
    { x: 0, y: 0 },
    { x: -5, y: -9 },
    { x: -13, y: -15 },
    { x: -18, y: -25 },
  ],
  [
    { x: 0, y: 0 },
    { x: 7, y: -7 },
    { x: 14, y: -12 },
    { x: 21, y: -20 },
  ],
  [
    { x: 0, y: 0 },
    { x: -6, y: 8 },
    { x: -14, y: 14 },
    { x: -19, y: 23 },
  ],
  [
    { x: 0, y: 0 },
    { x: 6, y: 9 },
    { x: 11, y: 18 },
    { x: 16, y: 27 },
  ],
];

/** fragments 층 진입점: 모든 살아있는 적의 록온·열린 조각·퍼펙트 창을 그립니다. */
export function drawFragmentsLayer(g: Phaser.GameObjects.Graphics, view: ArtView): void {
  const perfectWindow = Math.max(0.001, view.tuning.perfectWindow);

  for (const e of view.enemies) {
    if (e.state === 'down') continue;
    const ex = e.x + e.w / 2;
    const ey = e.y + e.h / 2;

    if (e.fragment > 0) {
      drawOpenFragment(g, ex, ey, e, view.time, perfectWindow);
    } else if (e.lockProgress > 0) {
      drawLockProgress(g, ex, ey, e.lockProgress, view.time);
    }
  }
}

/** 록온 진행 (0→1): 중력 렌즈 수축 링 + 조준 파편 + 중심에서 번지는 균열선 */
function drawLockProgress(
  g: Phaser.GameObjects.Graphics,
  ex: number,
  ey: number,
  progress: number,
  time: number,
): void {
  const p = Math.max(0, Math.min(1, progress));
  const ringRadius = 42 - p * 12;
  const nearReady = p > 0.75;

  g.lineStyle(1.5, PALETTE.amberDeep, 0.3 + p * 0.45);
  g.strokeCircle(ex, ey, ringRadius + 5);

  g.lineStyle(2.5, nearReady ? PALETTE.amberBright : PALETTE.amberGold, 0.55 + p * 0.45);
  g.beginPath();
  g.arc(ex, ey, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
  g.strokePath();

  const shardDist = 28 - p * 10;
  const shardLen = 6 + p * 3;
  const rot = (1 - p) * 0.35 + Math.sin(time * 6) * 0.04;
  g.fillStyle(nearReady ? PALETTE.memoryWhite : PALETTE.amberGold, 0.45 + p * 0.5);
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const tipX = ex + cos * shardDist;
    const tipY = ey + sin * shardDist;
    const baseX = ex + cos * (shardDist + shardLen);
    const baseY = ey + sin * (shardDist + shardLen);
    const perpX = -sin * 3.2;
    const perpY = cos * 3.2;
    g.fillTriangle(tipX, tipY, baseX + perpX, baseY + perpY, baseX - perpX, baseY - perpY);
  }

  drawCrackBranches(g, ex, ey, p * 0.75, 0.35 + p * 0.55);
}

/** 열린 찢긴 기억 조각: 퍼펙트 타이밍 테두리 + 펄스 다면체 + 균열선 + 남은 시간 링 */
function drawOpenFragment(
  g: Phaser.GameObjects.Graphics,
  ex: number,
  ey: number,
  e: EnemyView,
  time: number,
  perfectWindow: number,
): void {
  const ratio = e.fragmentMax > 0 ? Math.max(0, Math.min(1, e.fragment / e.fragmentMax)) : 1;
  const urgent = ratio < 0.35;
  const pulse = 1 + Math.sin(time * (urgent ? 34 : 18)) * 0.14;
  const urgentBlink = urgent && Math.floor(time * 24) % 2 === 0;

  // 1) 배후 균열선
  drawCrackBranches(g, ex, ey, 1.05, 0.92);

  // 2) 퍼펙트 판정 시간 (e.perfectTimer > 0): memoryWhite 수축 링 + 마름모 플래시
  if (e.perfectTimer > 0) {
    const pk = Math.max(0, Math.min(1, e.perfectTimer / perfectWindow));
    const pr = 21 + 19 * pk;
    g.fillStyle(PALETTE.memoryWhite, 0.22 + 0.12 * pk);
    g.fillCircle(ex, ey, 19);
    g.lineStyle(3, PALETTE.memoryWhite, 0.96);
    g.strokeCircle(ex, ey, pr);
    // 4방향 수축 직선 눈금
    const tickOut = pr + 5;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      g.lineBetween(ex + cos * (pr - 2), ey + sin * (pr - 2), ex + cos * tickOut, ey + sin * tickOut);
    }
  }

  // 3) 남은 시간 링
  const timerRadius = 35;
  g.lineStyle(1, PALETTE.amberDeep, 0.45);
  g.strokeCircle(ex, ey, timerRadius);

  g.lineStyle(3.5, urgentBlink || e.perfectTimer > 0 ? PALETTE.memoryWhite : PALETTE.amberGold, 0.95);
  g.beginPath();
  g.arc(ex, ey, timerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio, false);
  g.strokePath();

  // 4) 어긋난 4개의 삼각 분할 파편
  const r = 15 * pulse;
  const w = r * 0.76;
  const split = 1.6 + Math.sin(time * 12) * 0.5;

  g.lineStyle(2, PALETTE.ink, 0.85);
  g.fillStyle(e.perfectTimer > 0 ? PALETTE.amberBright : PALETTE.amberGold, 0.96);

  g.fillTriangle(ex, ey - r - split, ex + w, ey - split * 0.4, ex - w, ey - split * 0.4);
  g.fillTriangle(ex, ey + r + split, ex + w, ey + split * 0.4, ex - w, ey + split * 0.4);
  g.fillStyle(e.perfectTimer > 0 ? PALETTE.memoryWhite : PALETTE.amberBright, 0.92);
  g.fillTriangle(ex - w - split, ey, ex - split * 0.5, ey - r * 0.55, ex - split * 0.5, ey + r * 0.55);
  g.fillTriangle(ex + w + split, ey, ex + split * 0.5, ey - r * 0.55, ex + split * 0.5, ey + r * 0.55);

  // 5) 중심 코어 하이라이트
  const core = (e.perfectTimer > 0 ? 6.8 : 5.5) * pulse;
  g.fillStyle(PALETTE.memoryWhite, 0.98);
  g.fillTriangle(ex, ey - core, ex + core * 0.75, ey, ex - core * 0.75, ey);
  g.fillTriangle(ex, ey + core, ex + core * 0.75, ey, ex - core * 0.75, ey);
}

/** 중심(ex, ey)에서 바깥으로 뻗는 날카로운 직선 균열 가지 그리기 */
function drawCrackBranches(
  g: Phaser.GameObjects.Graphics,
  ex: number,
  ey: number,
  reach: number,
  alpha: number,
): void {
  const clamped = Math.max(0, Math.min(1.2, reach));
  if (clamped <= 0) return;

  for (let b = 0; b < CRACK_BRANCHES.length; b++) {
    const pts = CRACK_BRANCHES[b];
    const segCount = pts.length - 1;
    const progressTotal = clamped * segCount;

    const color = b % 2 === 0 ? PALETTE.memoryWhite : PALETTE.amberBright;
    g.lineStyle(b % 2 === 0 ? 2 : 1.5, color, alpha);

    for (let i = 0; i < segCount; i++) {
      const segT = Math.max(0, Math.min(1, progressTotal - i));
      if (segT <= 0) break;
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const x1 = ex + p0.x + (p1.x - p0.x) * segT;
      const y1 = ey + p0.y + (p1.y - p0.y) * segT;
      g.lineBetween(ex + p0.x, ey + p0.y, x1, y1);
    }
  }
}
