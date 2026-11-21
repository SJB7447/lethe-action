import type { Rect } from './physics';

/**
 * 방 데이터 형식. 실험실 방과 스테이지 방이 같은 형식을 씁니다.
 * 좌표는 px, 방의 왼쪽 위가 (0, 0).
 */

export interface EnemySpawn {
  x: number;
  y: number;
  kind: 'cracked' | 'solid';
  flying: boolean;
  patrol: number; // 좌우 순찰 폭
  dir?: -1 | 1; // 처음 보는 방향 (기본 오른쪽)
}

/** 다른 방으로 가는 출입구. 이단아의 중심이 이 영역에 들어가면 이동합니다. */
export interface ExitDef extends Rect {
  to: string; // 도착 방 id
  entry: string; // 도착 방의 입구 이름
}

/** 체크포인트. 닿으면 사망·재시작 때 여기서 다시 시작합니다. */
export interface CheckpointDef extends Rect {
  id: string;
  entry: string; // 다시 시작할 위치 (이 방의 입구 이름)
}

export interface RoomDef {
  id: string;
  name: string; // 화면에 보여 줄 이름
  width: number;
  height: number;
  /** 이름 붙은 시작 위치. 'start'는 방에 처음 놓일 때 */
  entries: Record<string, { x: number; y: number }>;
  solids: Rect[];
  enemies: EnemySpawn[];
  exits?: ExitDef[];
  checkpoints?: CheckpointDef[];
  /** 스테이지 끝 지점 (닿으면 stage:clear) */
  goal?: Rect;
}

export interface StageDef {
  id: string;
  name: string;
  start: { room: string; entry: string };
  rooms: RoomDef[];
}

/** 1단계 실험실 방. 적 4마리 + 공중 연쇄를 시험할 발판 배치. */
export const LAB_ROOM: RoomDef = {
  id: 'lab',
  name: '조작감 실험실',
  width: 2400,
  height: 900,
  entries: { start: { x: 160, y: 700 } },
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
  ],
  enemies: [
    { x: 520, y: 650, kind: 'cracked', flying: false, patrol: 80 },
    { x: 860, y: 430, kind: 'cracked', flying: true, patrol: 60 },
    { x: 1270, y: 610, kind: 'cracked', flying: false, patrol: 90 },
    { x: 1660, y: 380, kind: 'cracked', flying: true, patrol: 70 },
    { x: 2000, y: 810, kind: 'solid', flying: false, patrol: 120 },
  ],
};
