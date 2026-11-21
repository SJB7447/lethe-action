/**
 * [담당: Antigravity] 'enemies' 층 그리기 — 보안 요원 2종(cracked/solid) + 챕터 1 균열형 보스 및 약점/핵심 소켓.
 * 규칙: docs/ART_GUIDE.md (팔레트 전용, view.time 기준, 판정 읽기 전용, 색약 대비 실루엣 구분).
 */
import type * as Phaser from 'phaser';
import type { ArtView, BossView, EnemyView } from './contract';
import { PALETTE } from './palette';

export function drawEnemiesLayer(g: Phaser.GameObjects.Graphics, view: ArtView): void {
  if (view.boss) {
    drawBoss(g, view.boss, view);
  }
  for (const e of view.enemies) {
    if (e.bossPart) {
      drawBossPart(g, e, view.time);
    } else {
      drawGuard(g, e, view);
    }
  }
}

/** 챕터 1 균열형 보스: 기억 소거 파동(판정 두께 그대로) + 기하 중장갑 몸체 + 패턴 예고 + 다운 표시 */
function drawBoss(g: Phaser.GameObjects.Graphics, b: BossView, view: ArtView): void {
  const bx = b.x + b.w / 2;
  const by = b.y + b.h / 2;

  // 1) 기억 소거 파동 — 판정 두께 bossWaveWidth 그대로
  if (b.waveActive) {
    const width = view.tuning.bossWaveWidth;
    const half = width / 2;
    g.lineStyle(width, PALETTE.deepCrimson, 0.2);
    g.strokeCircle(b.waveX, b.waveY, b.waveRadius);

    g.lineStyle(2, PALETTE.memoryWhite, 0.88);
    g.strokeCircle(b.waveX, b.waveY, b.waveRadius + half);
    if (b.waveRadius - half > 0) {
      g.strokeCircle(b.waveX, b.waveY, b.waveRadius - half);
    }
  }

  // 2) 다운 상태 배후 오라
  if (b.state === 'down') {
    const pulse = 0.08 + 0.05 * Math.sin(view.time * 6);
    g.fillStyle(PALETTE.memoryWhite, pulse);
    g.fillRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
    g.lineStyle(1.5, PALETTE.memoryWhite, 0.45);
    g.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
  }

  // 3) 보스 중장갑 기하 몸체 (판정 박스 내부 기준)
  const defeated = b.state === 'defeated';
  const bodyAlpha = defeated ? 0.45 : 1;
  const fillCol =
    b.hurtFlash > 0
      ? PALETTE.memoryWhite
      : b.phase === 2
        ? PALETTE.bossPhase2
        : PALETTE.bossArmor;
  const edgeCol =
    b.state === 'down'
      ? PALETTE.terrainEdge
      : b.phase === 2
        ? PALETTE.amberBright
        : PALETTE.deepCrimson;

  g.fillStyle(fillCol, bodyAlpha);
  g.fillRect(b.x, b.y + 8, b.w, b.h - 8);

  // 상단 각진 어깨/왕관 실루엣 (판정 박스 안쪽)
  g.fillStyle(PALETTE.ink, 0.7 * bodyAlpha);
  g.fillRect(b.x + 8, b.y + 16, b.w - 16, b.h - 28);

  g.fillStyle(fillCol, bodyAlpha);
  g.fillTriangle(b.x, b.y + 14, b.x + 18, b.y, b.x + 18, b.y + 14);
  g.fillTriangle(b.x + b.w, b.y + 14, b.x + b.w - 18, b.y, b.x + b.w - 18, b.y + 14);
  g.fillRect(b.x + 18, b.y, b.w - 36, 16);

  // 흉갑 균열선 (페이즈 2일수록 선명하게 맥동)
  const ribAlpha = defeated ? 0.2 : b.phase === 2 ? 0.75 + 0.2 * Math.sin(view.time * 10) : 0.4;
  g.lineStyle(2, b.phase === 2 ? PALETTE.deepCrimson : PALETTE.amberDeep, ribAlpha);
  g.lineBetween(b.x + 12, b.y + 42, bx, b.y + 56);
  g.lineBetween(b.x + b.w - 12, b.y + 42, bx, b.y + 56);
  g.lineBetween(bx, b.y + 56, bx, b.y + b.h - 14);

  // 외곽 장갑 테두리
  g.lineStyle(2, edgeCol, 0.92 * bodyAlpha);
  g.strokeRect(b.x, b.y + 4, b.w, b.h - 4);

  // 4) 시선 바이저 눈
  const eyeCx = bx + b.facing * 20;
  const eyeY = b.y + 26;
  g.fillStyle(PALETTE.ink, 0.95);
  g.fillRect(eyeCx - 13, eyeY - 4, 26, 10);
  g.fillStyle(
    b.state === 'down' || defeated
      ? PALETTE.terrainEdge
      : b.phase === 2
        ? PALETTE.amberBright
        : PALETTE.memoryWhite,
    1,
  );
  g.fillRect(eyeCx - 10, eyeY - 2, 20, 6);

  // 5) 공격 예고 (view.time 기반 — 히트스톱 정지 준수)
  if (b.state === 'telegraph') {
    const blink = Math.floor(view.time * 14) % 2 === 0;
    if (b.pattern === 'wave') {
      const denom = Math.max(0.01, view.tuning.bossWaveTelegraph);
      const t = Math.max(0, Math.min(1, 1 - b.timer / denom));
      g.lineStyle(4, PALETTE.deepCrimson, blink ? 0.98 : 0.42);
      g.strokeCircle(bx, by, 30 + t * 90);
      g.lineStyle(1.5, PALETTE.memoryWhite, blink ? 0.85 : 0.25);
      g.strokeCircle(bx, by, 24 + t * 90);
    } else {
      const fx = b.facing > 0 ? b.x + b.w + 10 : b.x - 10;
      const cy0 = b.y + b.h - 42;
      g.fillStyle(PALETTE.amberBright, blink ? 0.95 : 0.42);
      g.fillTriangle(fx, cy0 - 24, fx, cy0 + 24, fx + b.facing * 46, cy0);
      g.lineStyle(2, PALETTE.memoryWhite, blink ? 0.95 : 0.35);
      g.lineBetween(fx + b.facing * 8, cy0 - 16, fx + b.facing * 32, cy0);
      g.lineBetween(fx + b.facing * 8, cy0 + 16, fx + b.facing * 32, cy0);
    }
  }
}

/** 보스 약점('weak')·핵심('core') 균열 소켓 */
function drawBossPart(g: Phaser.GameObjects.Graphics, e: EnemyView, time: number): void {
  const ex = e.x + e.w / 2;
  const ey = e.y + e.h / 2;

  if (e.state === 'down') {
    if (e.bossPart === 'weak') {
      g.lineStyle(1.5, PALETTE.terrainEdge, 0.55);
      g.strokeCircle(ex, ey, 9);
      g.lineBetween(ex - 5, ey - 5, ex + 5, ey + 5);
      g.lineBetween(ex + 5, ey - 5, ex - 5, ey + 5);
    }
    return;
  }

  const isCore = e.bossPart === 'core';
  const pulse = isCore ? 1 + Math.sin(time * 12) * 0.12 : 1;
  const r = (isCore ? 17 : 11.5) * pulse;
  const fillCol = e.hurtFlash > 0 ? PALETTE.memoryWhite : isCore ? PALETTE.amberBright : PALETTE.deepCrimson;

  // 어두운 잉크 소켓 받침
  g.fillStyle(PALETTE.ink, 0.9);
  g.fillCircle(ex, ey, r + 3);

  // 각진 마름모 코어
  g.fillStyle(fillCol, 0.98);
  g.fillTriangle(ex, ey - r, ex + r * 0.85, ey, ex - r * 0.85, ey);
  g.fillTriangle(ex, ey + r, ex + r * 0.85, ey, ex - r * 0.85, ey);

  g.lineStyle(2, PALETTE.memoryWhite, 0.92);
  g.strokeTriangle(ex, ey - r, ex + r * 0.85, ey, ex - r * 0.85, ey);
  g.strokeTriangle(ex, ey + r, ex + r * 0.85, ey, ex - r * 0.85, ey);

  if (isCore) {
    const inner = r * 0.45;
    g.fillStyle(PALETTE.memoryWhite, 0.95);
    g.fillTriangle(ex, ey - inner, ex + inner * 0.8, ey, ex - inner * 0.8, ey);
    g.fillTriangle(ex, ey + inner, ex + inner * 0.8, ey, ex - inner * 0.8, ey);
  }
}

/** 일반 보안 요원 2종 (cracked / solid, 지상 / 비행 실루엣 구분) */
function drawGuard(g: Phaser.GameObjects.Graphics, e: EnemyView, view: ArtView): void {
  if (e.state === 'down') {
    const a = Math.max(0, Math.min(1, e.timer / Math.max(0.01, view.tuning.respawnDelay))) * 0.25;
    g.lineStyle(1, PALETTE.terrainEdge, a);
    g.strokeRect(e.x, e.y, e.w, e.h);
    return;
  }

  const ex = e.x + e.w / 2;
  const ey = e.y + e.h / 2;
  const isTelegraph =
    e.state === 'telegraph' && Math.floor(view.time * (e.counter ? 30 : 16)) % 2 === 0;
  const col =
    e.hurtFlash > 0
      ? PALETTE.memoryWhite
      : isTelegraph
        ? PALETTE.amberBright
        : e.kind === 'cracked'
          ? PALETTE.deepCrimson
          : PALETTE.terrainEdge;

  if (e.flying) {
    // 비행 보안 요원 (30×30 중심 기준 다이아몬드 드론)
    const rx = e.w / 2;
    const ry = e.h / 2;
    g.fillStyle(col, 1);
    g.fillTriangle(ex, ey - ry, ex + rx, ey, ex - rx, ey);
    g.fillTriangle(ex, ey + ry, ex + rx, ey, ex - rx, ey);
    if (e.kind === 'cracked') {
      // 균열형 드론: 날카로운 상하 스파이크 노치
      g.lineStyle(1.5, PALETTE.memoryWhite, 0.75);
      g.lineBetween(ex - 5, ey - ry + 3, ex + 3, ey + ry - 3);
    } else {
      // 비균열형 드론: 단단한 수평 장갑 바
      g.lineStyle(2, PALETTE.prussianBlue, 0.95);
      g.strokeRect(e.x + 3, ey - 5, e.w - 6, 10);
    }
  } else {
    // 지상 보안 요원 (30×44)
    g.fillStyle(col, 1);
    if (e.kind === 'cracked') {
      // 균열형: 뾰족한 각진 어깨 + 중앙 균열 슬릿
      g.fillRect(e.x + 2, e.y + 8, e.w - 4, e.h - 8);
      g.fillTriangle(e.x, e.y + 10, e.x + 10, e.y, e.x + 10, e.y + 10);
      g.fillTriangle(e.x + e.w, e.y + 10, e.x + e.w - 10, e.y, e.x + e.w - 10, e.y + 10);
      g.fillRect(e.x + 10, e.y + 2, e.w - 20, 8);
      g.lineStyle(1.5, PALETTE.memoryWhite, 0.7);
      g.lineBetween(ex - 4, e.y + 16, ex + 3, e.y + 28);
      g.lineBetween(ex + 3, e.y + 28, ex - 2, e.y + 38);
    } else {
      // 비균열형: 평평하고 두꺼운 방패형 장갑 실루엣
      g.fillRect(e.x, e.y, e.w, e.h);
      g.fillStyle(PALETTE.prussianBlue, 0.85);
      g.fillRect(e.x + 4, e.y + 14, e.w - 8, e.h - 20);
      g.lineStyle(1.5, PALETTE.ink, 0.7);
      g.strokeRect(e.x, e.y, e.w, e.h);
    }
  }

  // 눈 (알아챈 정도에 따라 색 변화)
  const eyeCol =
    e.awareness === 'alert'
      ? PALETTE.memoryWhite
      : e.awareness === 'heard'
        ? PALETTE.amberBright
        : PALETTE.ink;
  g.fillStyle(eyeCol, 1);
  g.fillRect(e.eyeX - 4, e.eyeY - 2, 8, 4);

  // 손상 시 소형 체력 바
  if (e.hp < e.maxHp) {
    g.fillStyle(PALETTE.ink, 0.75);
    g.fillRect(e.x, e.y - 8, e.w, 3);
    g.fillStyle(PALETTE.memoryWhite, 0.85);
    g.fillRect(e.x, e.y - 8, (e.w * e.hp) / Math.max(1, e.maxHp), 3);
  }
}
