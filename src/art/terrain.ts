/**
 * [담당: Antigravity] 'terrain' 층 그리기 — 발판·벽, 출입구, 체크포인트, 스테이지 끝 지점.
 * 지형은 낮은 명도를 유지하고(ink 위 10~20%), 출입구·체크포인트·끝 지점은 기하학적으로 구분합니다.
 */
import type * as Phaser from 'phaser';
import type { ArtView } from './contract';
import { PALETTE } from './palette';

export function drawTerrainLayer(g: Phaser.GameObjects.Graphics, view: ArtView): void {
  // 1) 발판·벽 (어두운 건축 구조물, 상단 경계만 은은하게 강조)
  for (const s of view.world.solids) {
    g.fillStyle(PALETTE.terrainFill, 1);
    g.fillRect(s.x, s.y, s.w, s.h);

    g.lineStyle(1, PALETTE.ink, 0.65);
    g.strokeRect(s.x, s.y, s.w, s.h);

    g.lineStyle(2, PALETTE.terrainEdge, 0.95);
    g.lineBetween(s.x, s.y + 1, s.x + s.w, s.y + 1);

    // 얇은 앰버 모서리 기준선 (시각적 지면 인식 보조)
    if (s.w >= 48) {
      g.lineStyle(1, PALETTE.amberDeep, 0.25);
      g.lineBetween(s.x + 4, s.y + 4, s.x + s.w - 4, s.y + 4);
    }
  }

  const st = view.stage;
  const pulse = 0.5 + 0.5 * Math.sin(view.time * 4.5);

  // 2) 출입구 (앰버 골드 기하 문틀 + 방향 셰브론)
  for (const ex of st.exits) {
    g.fillStyle(PALETTE.amberGold, 0.06 + pulse * 0.04);
    g.fillRect(ex.x, ex.y, ex.w, ex.h);

    g.lineStyle(2, PALETTE.amberGold, 0.65);
    g.strokeRect(ex.x + 2, ex.y + 2, ex.w - 4, ex.h - 4);

    // 모서리 브래킷
    const b = 10;
    g.lineStyle(2.5, PALETTE.amberBright, 0.9);
    g.lineBetween(ex.x, ex.y, ex.x + b, ex.y);
    g.lineBetween(ex.x, ex.y, ex.x, ex.y + b);
    g.lineBetween(ex.x + ex.w, ex.y, ex.x + ex.w - b, ex.y);
    g.lineBetween(ex.x + ex.w, ex.y, ex.x + ex.w, ex.y + b);

    // 중앙 세로 슬릿
    const mx = ex.x + ex.w / 2;
    const my = ex.y + ex.h / 2;
    g.lineStyle(1.5, PALETTE.memoryWhite, 0.3 + pulse * 0.25);
    g.lineBetween(mx, my - 14, mx, my + 14);
  }

  // 3) 체크포인트 (기둥 + 마름모 기억 비콘, active 시 청록 + 화이트 코어)
  for (const cp of st.checkpoints) {
    const cx = cp.x + cp.w / 2;
    const beaconY = cp.y + 20;
    const on = cp.active;

    // 받침대와 기둥
    g.fillStyle(PALETTE.terrainEdge, 1);
    g.fillRect(cx - 10, cp.y + cp.h - 6, 20, 6);
    g.fillRect(cx - 3, cp.y + 30, 6, cp.h - 36);

    if (on) {
      // 활성화: 청록 공명 링 + 맥동 마름모
      const ringR = 13 + pulse * 4;
      g.lineStyle(1.5, PALETTE.playerCyan, 0.45 + pulse * 0.35);
      g.strokeCircle(cx, beaconY, ringR);

      const r = 10 + pulse * 1.5;
      g.fillStyle(PALETTE.playerCyan, 0.95);
      g.fillTriangle(cx, beaconY - r, cx + r * 0.72, beaconY, cx - r * 0.72, beaconY);
      g.fillTriangle(cx, beaconY + r, cx + r * 0.72, beaconY, cx - r * 0.72, beaconY);

      g.fillStyle(PALETTE.memoryWhite, 0.95);
      g.fillTriangle(cx, beaconY - 4.5, cx + 3.2, beaconY, cx - 3.2, beaconY);
      g.fillTriangle(cx, beaconY + 4.5, cx + 3.2, beaconY, cx - 3.2, beaconY);
    } else {
      // 비활성화: 어두운 청남색 마름모
      const r = 8;
      g.fillStyle(PALETTE.prussianBlue, 0.8);
      g.fillTriangle(cx, beaconY - r, cx + r * 0.72, beaconY, cx - r * 0.72, beaconY);
      g.fillTriangle(cx, beaconY + r, cx + r * 0.72, beaconY, cx - r * 0.72, beaconY);
      g.lineStyle(1.5, PALETTE.terrainEdge, 0.9);
      g.strokeTriangle(cx, beaconY - r, cx + r * 0.72, beaconY, cx - r * 0.72, beaconY);
      g.strokeTriangle(cx, beaconY + r, cx + r * 0.72, beaconY, cx - r * 0.72, beaconY);
    }
  }

  // 4) 스테이지 끝 지점 (memoryWhite + amberBright 기하 게이트)
  if (st.goal) {
    const gl = st.goal;
    const gx = gl.x + gl.w / 2;
    const gy = gl.y + gl.h / 2;

    g.fillStyle(PALETTE.memoryWhite, 0.06 + pulse * 0.06);
    g.fillRect(gl.x, gl.y, gl.w, gl.h);

    g.lineStyle(2, PALETTE.memoryWhite, 0.75 + pulse * 0.2);
    g.strokeRect(gl.x, gl.y, gl.w, gl.h);

    g.lineStyle(1.5, PALETTE.amberBright, 0.6);
    g.strokeRect(gl.x + 5, gl.y + 5, gl.w - 10, gl.h - 10);

    // 중앙 다이아몬드 문양
    const dr = 14 + pulse * 2.5;
    g.fillStyle(PALETTE.memoryWhite, 0.75);
    g.fillTriangle(gx, gy - dr, gx + dr * 0.65, gy, gx - dr * 0.65, gy);
    g.fillTriangle(gx, gy + dr, gx + dr * 0.65, gy, gx - dr * 0.65, gy);
  }
}
