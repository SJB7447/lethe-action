/**
 * [담당: Antigravity] 'fragments' 층 그리기 — 록온 진행 + 찢긴 기억 조각.
 * 규칙: docs/ART_GUIDE.md (2장 시각 언어, 3장 읽기 순서·view.time 기준, 4장 판정 읽기 전용).
 */
import type * as Phaser from 'phaser';
import type { ArtView, EnemyView } from './contract';
import { PALETTE } from './palette';

interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** 중심에서 바깥으로 뻗는 직선 균열 가지들 (단위 방향 기준 정규화 좌표) */
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

/** fragments 층 진입점: 모든 살아있는 적의 록온·열린 조각을 그립니다. */
export function drawFragmentsLayer(g: Phaser.GameObjects.Graphics, view: ArtView): void {
  for (const e of view.enemies) {
    if (e.state === 'down') continue;
    const ex = e.x + e.w / 2;
    const ey = e.y + e.h / 2;

    if (e.fragment > 0) {
      drawOpenFragment(g, ex, ey, e, view.time);
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

  // 1) 중력 렌즈 외곽 보조 링 (수축하는 얇은 앰버 원)
  g.lineStyle(1.5, PALETTE.amberDeep, 0.3 + p * 0.45);
  g.strokeCircle(ex, ey, ringRadius + 5);

  // 2) 록온 진행 원호
  g.lineStyle(2.5, nearReady ? PALETTE.amberBright : PALETTE.amberGold, 0.55 + p * 0.45);
  g.beginPath();
  g.arc(ex, ey, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
  g.strokePath();

  // 3) 4방향 삼각 조준 파편 (중심을 향해 수렴)
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

  // 4) 가운데서 바깥으로 번지는 균열선
  drawCrackBranches(g, ex, ey, p * 0.75, 0.35 + p * 0.55);
}

/** 열린 찢긴 기억 조각: 펄스하는 삼각 분할 다면체 + 만개한 균열선 + 남은 시간 링 */
function drawOpenFragment(
  g: Phaser.GameObjects.Graphics,
  ex: number,
  ey: number,
  e: EnemyView,
  time: number,
): void {
  const ratio = e.fragmentMax > 0 ? Math.max(0, Math.min(1, e.fragment / e.fragmentMax)) : 1;
  const urgent = ratio < 0.35;
  const pulse = 1 + Math.sin(time * (urgent ? 34 : 18)) * 0.14;
  const urgentBlink = urgent && Math.floor(time * 24) % 2 === 0;

  // 1) 배후 균열선 (파편 아래에 깔아 대비 확보)
  drawCrackBranches(g, ex, ey, 1.05, 0.92);

  // 2) 남은 시간 링 (바깥 앰버 골드 + 내부 얇은 잔광)
  const timerRadius = 35;
  g.lineStyle(1, PALETTE.amberDeep, 0.45);
  g.strokeCircle(ex, ey, timerRadius);

  g.lineStyle(3.5, urgentBlink ? PALETTE.memoryWhite : PALETTE.amberGold, 0.95);
  g.beginPath();
  g.arc(ex, ey, timerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio, false);
  g.strokePath();

  // 3) 어긋난 4개의 삼각 분할 파편 (날카로운 균열 기하)
  const r = 15 * pulse;
  const w = r * 0.76;
  const split = 1.6 + Math.sin(time * 12) * 0.5;

  // 어두운 잉크 외곽 슬릿으로 배경과 분리 (가독성 최우선)
  g.lineStyle(2, PALETTE.ink, 0.85);
  g.fillStyle(PALETTE.amberGold, 0.96);

  // 상·하·좌·우 4분할 삼각형
  g.fillTriangle(ex, ey - r - split, ex + w, ey - split * 0.4, ex - w, ey - split * 0.4);
  g.fillTriangle(ex, ey + r + split, ex + w, ey + split * 0.4, ex - w, ey + split * 0.4);
  g.fillStyle(PALETTE.amberBright, 0.92);
  g.fillTriangle(ex - w - split, ey, ex - split * 0.5, ey - r * 0.55, ex - split * 0.5, ey + r * 0.55);
  g.fillTriangle(ex + w + split, ey, ex + split * 0.5, ey - r * 0.55, ex + split * 0.5, ey + r * 0.55);

  // 4) 중심 코어 하이라이트 (memoryWhite)
  const core = 5.5 * pulse;
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

    // 주 균열은 memoryWhite, 보조 가지는 amberBright
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
