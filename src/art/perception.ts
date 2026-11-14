/**
 * [담당: Antigravity] 'perception' 층 그리기 — 이단아·적 시선 원뿔 및 소리 범위.
 * gazeFan, viewFan, sounds[].points 모양 그대로를 사용해 판정과 일치시킵니다.
 */
import type * as Phaser from 'phaser';
import type { ArtView, PointView } from './contract';
import { PALETTE } from './palette';

export function drawPerceptionLayer(g: Phaser.GameObjects.Graphics, view: ArtView): void {
  if (!view.tuning.showPerception) return;

  // 1) 소리 범위 (sounds[].points 모양 그대로, 퍼져 나가며 감쇠)
  for (const s of view.sounds) {
    if (s.points.length < 3 || s.maxLife <= 0) continue;
    const age = 1 - Math.max(0, Math.min(1, s.life / s.maxLife));
    const grow = Math.min(1, age / 0.25);
    const fade = 1 - age;
    const pts = s.points.map((q) => ({
      x: s.x + (q.x - s.x) * grow,
      y: s.y + (q.y - s.y) * grow,
    }));
    drawPolygon(g, pts, PALETTE.playerCyan, 0.06 * fade, 1.5, 0.48 * fade);
  }

  // 2) 적 시선 원뿔 (viewFan 모양 그대로)
  for (const e of view.enemies) {
    if (e.viewFan.length < 3) continue;
    const col =
      e.awareness === 'alert'
        ? PALETTE.deepCrimson
        : e.awareness === 'heard'
          ? PALETTE.amberGold
          : PALETTE.memoryWhite;
    const fillAlpha = e.awareness === 'idle' ? 0.06 : 0.14;
    const lineAlpha = e.awareness === 'idle' ? 0.18 : 0.42;
    drawPolygon(g, e.viewFan, col, fillAlpha, 1.2, lineAlpha);
  }

  // 3) 이단아 시선 원뿔 = 록온 가능 범위 (gazeFan 모양 그대로)
  const p = view.player;
  if (p.gazeFan.length >= 3) {
    const lineAlpha = p.gazeActive ? 0.36 : 0.22;
    drawPolygon(g, p.gazeFan, PALETTE.playerCyan, 0.055, 1.2, lineAlpha);
  }
}

function drawPolygon(
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
