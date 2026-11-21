import type { Body } from './physics';

/**
 * 챕터 1 균열형 보스 데이터. 동작은 Sim(sim.ts의 '보스' 구역)이 처리합니다.
 * 규칙 초안은 docs/STAGE2.md. 수치는 tuning의 boss* 값.
 *
 * - 약점 균열(weak) 3곳: 록온 → 조각 → 파고들기. 하나당 피해, 퍼펙트면 더 큼
 * - 3곳을 모두 끊으면 다운: 핵심 균열(core)이 열림 → 파고들면 큰 피해. 다운 중 고스트 다이빙도 큰 피해
 * - 패턴: 기억 소거 파동(열린 조각을 닫고 록온 진행을 지움), 돌진
 * - 체력 절반 이하에서 페이즈 2 (패턴 간격이 짧아지고 파동이 빨라짐)
 */

export type BossState = 'intro' | 'idle' | 'telegraph' | 'active' | 'recover' | 'down' | 'defeated';
export type BossPattern = 'wave' | 'charge';
export type BossPartRole = 'weak' | 'core';

/** 방 데이터에 넣는 보스 배치 (발 중앙 좌표) */
export interface BossSpec {
  name: string;
  x: number;
  y: number;
}

/** 보스 몸에 붙은 균열 위치 (몸 중심 기준, facing이 -1이면 좌우 반전) */
export const BOSS_PARTS: readonly { role: BossPartRole; dx: number; dy: number }[] = [
  { role: 'weak', dx: 0, dy: -78 }, // 머리
  { role: 'weak', dx: -60, dy: -12 }, // 앞팔
  { role: 'weak', dx: 50, dy: 46 }, // 허리 뒤
  { role: 'core', dx: 0, dy: 4 }, // 다운 중에만 열리는 핵심
];

export const BOSS_W = 110;
export const BOSS_H = 200;

export interface BossData extends Body {
  name: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  state: BossState;
  timer: number; // 현재 상태의 남은 시간
  pattern: BossPattern;
  patternCount: number;
  facing: -1 | 1;
  hurtFlash: number;
  /** 기억 소거 파동 */
  waveActive: boolean;
  waveX: number;
  waveY: number;
  waveRadius: number;
  chargeDir: -1 | 1;
}
