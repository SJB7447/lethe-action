import type { Rect } from './physics';

/** 1단계 실험실 방. 적 4마리 + 공중 연쇄를 시험할 발판 배치. */
export interface EnemySpawn {
  x: number;
  y: number;
  kind: 'cracked' | 'solid';
  flying: boolean;
  patrol: number; // 좌우 순찰 폭
}

export const ROOM = {
  width: 2400,
  height: 900,
  playerSpawn: { x: 160, y: 700 },
  solids: [
    // 바닥과 외벽
    { x: 0, y: 860, w: 2400, h: 40 },
    { x: 0, y: 0, w: 40, h: 900 },
    { x: 2360, y: 0, w: 40, h: 900 },
    { x: 0, y: 0, w: 2400, h: 30 },
    // 발판
    { x: 420, y: 700, w: 220, h: 20 },
    { x: 780, y: 580, w: 200, h: 20 },
    { x: 1150, y: 660, w: 260, h: 20 },
    { x: 1560, y: 520, w: 220, h: 20 },
    { x: 1900, y: 680, w: 240, h: 20 },
    // 벽 점프 기둥
    { x: 1020, y: 300, w: 36, h: 360 },
    { x: 2120, y: 360, w: 36, h: 320 },
  ] as Rect[],
  enemies: [
    { x: 520, y: 650, kind: 'cracked', flying: false, patrol: 80 },
    { x: 860, y: 430, kind: 'cracked', flying: true, patrol: 60 },
    { x: 1270, y: 610, kind: 'cracked', flying: false, patrol: 90 },
    { x: 1660, y: 380, kind: 'cracked', flying: true, patrol: 70 },
    { x: 2000, y: 810, kind: 'solid', flying: false, patrol: 120 },
  ] as EnemySpawn[],
};
