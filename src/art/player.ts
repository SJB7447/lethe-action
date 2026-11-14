/**
 * [담당: Antigravity] 'player' 층 그리기 — 이단아 실루엣 및 시선(gaze) 추적 얼굴.
 * 판정 박스(22×40) 기준점에 맞춰 그리며 판정 밖으로 공격처럼 보이는 부분을 내보내지 않습니다.
 */
import type * as Phaser from 'phaser';
import type { ArtView } from './contract';
import { PALETTE } from './palette';

export function drawPlayerLayer(g: Phaser.GameObjects.Graphics, view: ArtView): void {
  const p = view.player;
  const blink = p.invuln > 0 && p.mode === 'normal' && Math.floor(view.time * 30) % 2 === 0;
  if (blink) return;

  const baseColor = p.hurtFlash > 0 ? PALETTE.deepCrimson : PALETTE.playerCyan;
  const cx = p.x + p.w / 2;
  const bottom = p.y + p.h;
  const lean = p.mode === 'dash' ? p.facing * 4 : Math.max(-2, Math.min(2, p.vx * 0.005));

  // 1) 회피 보너스 오라 (모서리 브래킷)
  if (p.dodgeBonus > 0) {
    g.lineStyle(2, PALETTE.playerCyan, 0.7);
    g.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
  }

  // 2) 코트·망토 실루엣 (판정 박스 내부 기준, 뾰족한 직선 기하)
  g.fillStyle(PALETTE.ink, 0.92);
  g.fillTriangle(
    cx - 10, bottom,
    cx + 10, bottom,
    cx + lean * 0.5, p.y + 12,
  );

  // 몸체 코어
  g.fillStyle(baseColor, 1);
  g.fillRect(p.x + 2, p.y + 13, p.w - 4, p.h - 15);

  // 머리/후드 실루엣
  g.fillStyle(baseColor, 1);
  g.fillRect(p.x + 1, p.y, p.w - 2, 15);

  // 앰버 골드 깃/스카프 포인트
  g.fillStyle(p.hurtFlash > 0 ? PALETTE.memoryWhite : PALETTE.amberGold, 0.95);
  g.fillRect(p.x + 2, p.y + 13, p.w - 4, 3);

  // 스카프 끝단 (이동 반대 방향으로 살짝 뻗음, 판정 폭 내 유지)
  const scarfTailX = cx - p.facing * 9 - lean * 0.5;
  g.fillTriangle(
    cx - p.facing * 4, p.y + 14,
    cx - p.facing * 4, p.y + 18,
    scarfTailX, p.y + 20,
  );

  // 3) 얼굴 바이저 및 시선(gaze) 추적 눈동자
  const fx = cx + p.facing * 2;
  const fy = p.eyeY;
  g.fillStyle(PALETTE.ink, 0.95);
  g.fillRect(fx - 9, fy - 5, 18, 10);
  g.lineStyle(1, p.gazeActive ? PALETTE.amberGold : PALETTE.playerCyan, 0.55);
  g.strokeRect(fx - 9, fy - 5, 18, 10);

  const gx = Math.cos(p.gaze);
  const gy = Math.sin(p.gaze);
  for (const ox of [-4, 4]) {
    const ex = fx + ox;
    g.fillStyle(PALETTE.memoryWhite, 1);
    g.fillCircle(ex, fy, 2.8);
    g.fillStyle(PALETTE.ink, 1);
    g.fillCircle(ex + gx * 1.5, fy + gy * 1.5, 1.5);
  }
}
