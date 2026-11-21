/**
 * [담당: Antigravity] 'alerts' 층 그리기 — 적의 알아챔 느낌표 (소리 들음 / 발각).
 * 균열 기하 스타일의 날카로운 각진 느낌표를 사용합니다.
 */
import type * as Phaser from 'phaser';
import type { ArtView } from './contract';
import { PALETTE } from './palette';

export function drawAlertsLayer(g: Phaser.GameObjects.Graphics, view: ArtView): void {
  const maxTime = Math.max(0.001, view.tuning.noticeMarkTime);

  for (const e of view.enemies) {
    if (e.state === 'down' || e.markTimer <= 0) continue;

    const k = Math.max(0, Math.min(1, e.markTimer / maxTime));
    const pop = k > 0.8 ? 1 + (k - 0.8) * 2.5 : 1;
    const alpha = Math.min(1, k * 3);
    const x = e.x + e.w / 2;
    const y = e.y - 16;

    drawSharpExclamation(g, x, y, pop * 1.4, e.markKind === 'sight', alpha);
  }
}

function drawSharpExclamation(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  isSight: boolean,
  alpha: number,
): void {
  const mainCol = isSight ? PALETTE.deepCrimson : PALETTE.amberGold;
  const hiCol = isSight ? PALETTE.memoryWhite : PALETTE.amberBright;

  const h = 16 * scale;
  const w = 3.2 * scale;
  const dotR = 2.4 * scale;
  const topY = y - h - dotR * 2.4;

  // 어두운 잉크 다이아몬드 배경판
  const padX = 7 * scale;
  const midY = y - (h + dotR * 2.4) / 2;
  g.fillStyle(PALETTE.ink, 0.82 * alpha);
  g.fillTriangle(x, topY - 5 * scale, x + padX, midY, x - padX, midY);
  g.fillTriangle(x, y + 3 * scale, x + padX, midY, x - padX, midY);
  g.lineStyle(1.2, mainCol, 0.8 * alpha);
  g.strokeTriangle(x, topY - 5 * scale, x + padX, midY, x - padX, midY);
  g.strokeTriangle(x, y + 3 * scale, x + padX, midY, x - padX, midY);

  // 발각(sight) 시 양옆 날카로운 경고 스파이크
  if (isSight) {
    g.lineStyle(1.8, hiCol, 0.9 * alpha);
    g.lineBetween(x - padX - 2 * scale, midY - 3 * scale, x - padX - 6 * scale, midY - 6 * scale);
    g.lineBetween(x + padX + 2 * scale, midY - 3 * scale, x + padX + 6 * scale, midY - 6 * scale);
  }

  // 각진 역삼각 느낌표 막대
  g.fillStyle(mainCol, alpha);
  g.fillTriangle(x - w, topY, x + w, topY, x, y - dotR * 2.4);

  // 상단 하이라이트선
  g.lineStyle(1.5, hiCol, 0.9 * alpha);
  g.lineBetween(x - w * 0.7, topY + 1.5 * scale, x + w * 0.7, topY + 1.5 * scale);

  // 아래 점 (마름모)
  const dotY = y - dotR;
  g.fillStyle(hiCol, alpha);
  g.fillTriangle(x, dotY - dotR, x + dotR, dotY, x - dotR, dotY);
  g.fillTriangle(x, dotY + dotR, x + dotR, dotY, x - dotR, dotY);
}
