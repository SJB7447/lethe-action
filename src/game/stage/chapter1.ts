import type { Rect } from '../physics';
import type { ExitDef, RoomDef, StageDef } from '../room';

/**
 * 챕터 1 — 레테 마포점 로비 (회색 박스 초안).
 * 방 순서와 소개 요소는 docs/STAGE2.md. 배치는 기획자 플레이 후 조정합니다.
 */

const WALL = 40;
const DOOR_H = 140; // 출입구 높이

interface DoorSpec {
  side: 'left' | 'right';
  floorY: number; // 출입구 바닥 높이
  to: string;
  entry: string;
}

/** 바닥·천장·좌우 벽(출입구 자리는 뚫림)과 출입구 영역을 만듭니다. */
function shell(w: number, h: number, doors: DoorSpec[]): { solids: Rect[]; exits: ExitDef[] } {
  const solids: Rect[] = [
    { x: 0, y: h - WALL, w, h: WALL }, // 바닥
    { x: 0, y: 0, w, h: 30 }, // 천장
  ];
  const exits: ExitDef[] = [];
  for (const side of ['left', 'right'] as const) {
    const x = side === 'left' ? 0 : w - WALL;
    const ds = doors.filter((d) => d.side === side).sort((a, b) => a.floorY - b.floorY);
    let top = 0;
    for (const d of ds) {
      const doorTop = d.floorY - DOOR_H;
      if (doorTop > top) solids.push({ x, y: top, w: WALL, h: doorTop - top });
      // 출입구 아래 받침 (방 바닥보다 높은 출입구)
      if (d.floorY < h - WALL) solids.push({ x: side === 'left' ? 0 : w - 120, y: d.floorY, w: 120, h: 20 });
      exits.push({ x, y: doorTop, w: WALL, h: DOOR_H, to: d.to, entry: d.entry });
      top = d.floorY;
    }
    if (top < h) solids.push({ x, y: top, w: WALL, h: h - top });
  }
  return { solids, exits };
}

// ── R1 입구 로비: 이동·시선 록온·파고들기 ──
const r1 = shell(1800, 900, [{ side: 'right', floorY: 860, to: 'r2', entry: 'west' }]);
const R1: RoomDef = {
  id: 'r1',
  name: 'R1 입구 로비',
  width: 1800,
  height: 900,
  entries: { start: { x: 120, y: 860 }, east: { x: 1680, y: 860 } },
  solids: [
    ...r1.solids,
    { x: 560, y: 780, w: 220, h: 80 }, // 안내 데스크
    { x: 980, y: 680, w: 200, h: 20 },
    { x: 1300, y: 600, w: 180, h: 20 },
  ],
  exits: r1.exits,
  enemies: [
    { x: 880, y: 810, kind: 'cracked', flying: false, patrol: 60 },
    { x: 1380, y: 480, kind: 'cracked', flying: true, patrol: 50 },
  ],
};

// ── R2 보안 게이트: 적 시선·소리, 엄폐, 균열 없는 경비 ──
const r2 = shell(2200, 900, [
  { side: 'left', floorY: 860, to: 'r1', entry: 'east' },
  { side: 'right', floorY: 860, to: 'r3', entry: 'west' },
]);
const R2: RoomDef = {
  id: 'r2',
  name: 'R2 보안 게이트',
  width: 2200,
  height: 900,
  entries: { west: { x: 110, y: 860 }, east: { x: 2080, y: 860 } },
  solids: [
    ...r2.solids,
    { x: 520, y: 760, w: 90, h: 100 }, // 엄폐 상자 (바닥에서 100)
    { x: 980, y: 740, w: 100, h: 120 }, // 보안 게이트 기둥 (바닥에서 120)
    { x: 700, y: 640, w: 620, h: 20 }, // 위쪽 통로 (상자·기둥에서 100~120, 경비 머리 위로 지나가기)
    { x: 1500, y: 760, w: 90, h: 100 },
  ],
  exits: r2.exits,
  enemies: [
    { x: 1200, y: 810, kind: 'solid', flying: false, patrol: 110, dir: -1 }, // 경비 (균열 없음)
    { x: 900, y: 590, kind: 'cracked', flying: false, patrol: 70 }, // 위쪽 통로 위
    { x: 1800, y: 810, kind: 'cracked', flying: false, patrol: 90, dir: -1 },
  ],
};

// ── R3 아트리움: 높은 공간, 수직 연쇄, 비행 적, 벽 점프 ──
const r3 = shell(1600, 1600, [
  { side: 'left', floorY: 1560, to: 'r2', entry: 'east' },
  { side: 'right', floorY: 420, to: 'r4', entry: 'west' },
]);
const R3: RoomDef = {
  id: 'r3',
  name: 'R3 아트리움',
  width: 1600,
  height: 1600,
  entries: { west: { x: 110, y: 1560 }, east: { x: 1500, y: 420 } },
  solids: [
    ...r3.solids,
    // 지그재그 발판: 위로 한 칸씩 120px (점프 높이 약 132px)
    { x: 260, y: 1440, w: 200, h: 20 },
    { x: 560, y: 1320, w: 200, h: 20 },
    { x: 860, y: 1200, w: 200, h: 20 },
    { x: 1160, y: 1080, w: 200, h: 20 },
    { x: 860, y: 960, w: 200, h: 20 },
    { x: 560, y: 840, w: 200, h: 20 },
    { x: 260, y: 720, w: 200, h: 20 },
    { x: 560, y: 600, w: 200, h: 20 },
    { x: 860, y: 500, w: 200, h: 20 },
    { x: 1200, y: 460, w: 180, h: 20 },
    // 벽 점프로 질러가는 기둥 (선택 경로)
    { x: 1440, y: 560, w: 36, h: 520 },
  ],
  exits: r3.exits,
  enemies: [
    { x: 700, y: 1180, kind: 'cracked', flying: true, patrol: 60 },
    { x: 1000, y: 1000, kind: 'cracked', flying: true, patrol: 50 },
    { x: 420, y: 780, kind: 'cracked', flying: true, patrol: 50 },
    { x: 720, y: 520, kind: 'cracked', flying: true, patrol: 50 },
    { x: 1060, y: 380, kind: 'cracked', flying: true, patrol: 40 },
  ],
};

// ── R4 복도 + 체크포인트: 혼합 전투, 퍼펙트 연쇄로 방 정리 ──
const r4 = shell(2600, 900, [
  { side: 'left', floorY: 860, to: 'r3', entry: 'east' },
  { side: 'right', floorY: 860, to: 'r5', entry: 'west' },
]);
const R4: RoomDef = {
  id: 'r4',
  name: 'R4 복도',
  width: 2600,
  height: 900,
  entries: { west: { x: 110, y: 860 }, east: { x: 2480, y: 860 } },
  solids: [
    ...r4.solids,
    { x: 700, y: 740, w: 220, h: 20 },
    { x: 1080, y: 620, w: 260, h: 20 },
    { x: 1700, y: 740, w: 220, h: 20 },
    { x: 2100, y: 760, w: 90, h: 100 },
  ],
  exits: r4.exits,
  checkpoints: [{ id: 'cp-r4', x: 200, y: 720, w: 60, h: 140, entry: 'west' }],
  enemies: [
    { x: 760, y: 810, kind: 'cracked', flying: false, patrol: 90 },
    { x: 1000, y: 520, kind: 'cracked', flying: true, patrol: 60 },
    { x: 1300, y: 810, kind: 'solid', flying: false, patrol: 120, dir: -1 },
    { x: 1500, y: 460, kind: 'cracked', flying: true, patrol: 60 },
    { x: 1800, y: 690, kind: 'cracked', flying: false, patrol: 60 },
    { x: 2250, y: 520, kind: 'cracked', flying: true, patrol: 50 },
  ],
};

// ── R5 보스 전실: 컷신 자리 (지금은 스테이지 끝) ──
const r5 = shell(1200, 900, [{ side: 'left', floorY: 860, to: 'r4', entry: 'east' }]);
const R5: RoomDef = {
  id: 'r5',
  name: 'R5 보스 전실',
  width: 1200,
  height: 900,
  entries: { west: { x: 110, y: 860 } },
  solids: [...r5.solids],
  exits: r5.exits,
  checkpoints: [{ id: 'cp-r5', x: 200, y: 720, w: 60, h: 140, entry: 'west' }],
  enemies: [],
  goal: { x: 1000, y: 700, w: 120, h: 160 }, // 보스·컷신이 생기기 전까지 임시 끝 지점
};

export const CHAPTER1: StageDef = {
  id: 'ch1',
  name: '챕터 1 — 레테 마포점 로비',
  start: { room: 'r1', entry: 'start' },
  rooms: [R1, R2, R3, R4, R5],
};
