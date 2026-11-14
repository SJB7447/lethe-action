/**
 * 손맛 관련 수치는 전부 여기에 둡니다. 튜닝 패널이 이 객체를 직접 수정합니다.
 * 시간 단위 s, 거리 단위 px.
 */
export const DEFAULT_TUNING = {
  // ── 록온·연쇄 (기획안 1단계 슬라이더 6종) ──
  lockTime: 0.6, // 먼 거리 기준 록온 시간
  fragmentWindow: 0.63, // 조각이 열려 있는 시간
  chainSearchRadius: 380, // 타격 후 다음 적을 찾는 거리
  chainSpeed: 1800, // 파고들 때 이동 속도
  hitstop: 0.07, // 타격 순간 정지 시간
  chainInertia: 0.42, // 타격 후 남는 속도 비율

  // ── 시선 (이단아) ──
  gazeHalfAngle: 30, // 시선 원뿔 반각 (도). 이 안에 있고 벽에 가리지 않은 적만 록온 (거리는 lockRange)

  // ── 록온 보조 규칙 ──
  lockTimeMin: 0.2, // 가까울 때 록온 시간
  lockRange: 420, // 록온 가능 거리
  closeRange: 140, // 이 거리 안이면 lockTimeMin 적용
  maxLocks: 3, // 동시에 록온할 수 있는 적 수
  dodgeLockBonus: 0.5, // 회피 성공 후 록온 시간 감소 비율
  dodgeBonusDuration: 1.5, // 회피 보너스 지속 시간
  assistWindowBonus: 1.25, // 자동 보조 시 조각 유지 시간 배수
  attackBuffer: 0.15, // 공격 선입력 허용 시간
  comboTimeout: 1.6, // 타격 없이 이 시간이 지나면 콤보 종료

  // ── 이동 ──
  runSpeed: 330,
  runAccel: 3200,
  runDecel: 3800,
  airAccel: 2200,
  airDrag: 700, // 공중에서 달리기 속도를 넘는 관성이 줄어드는 정도
  gravity: 2300,
  jumpVelocity: 780,
  jumpCut: 0.45, // 점프 버튼을 일찍 떼면 상승 속도에 곱함
  maxFall: 1100,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  wallSlideSpeed: 170,
  wallJumpX: 250,
  wallJumpY: 700,
  wallJumpLock: 0.14, // 벽 점프 직후 조작이 덜 먹는 시간

  // ── 회피 (무적 대시) ──
  dashSpeed: 950,
  dashTime: 0.14,
  dashCooldown: 0.7,
  dashIFrames: 0.2,
  perfectDodgeRange: 150,

  // ── 기억 추출 바늘 ──
  needleSpeed: 1500,
  needleRange: 540,
  needleCooldown: 0.4,

  // ── 게이지 ──
  gaugePerStrike: 18,
  gaugePerNeedle: 3,

  // ── 적 ──
  enemyAggroRange: 170, // 발각된 뒤 공격을 시작하는 거리
  enemyTelegraph: 0.55,
  enemyCounterTelegraph: 0.28,
  enemyLungeSpeed: 560,
  enemyAttackCooldown: 1.8,
  enemySlowWhileOpen: 0.25, // 조각이 열린 적의 이동 속도 배수
  respawnDelay: 3,

  // ── 적 인식 (시선) ──
  enemyViewRange: 310, // 적 시선 거리
  enemyViewHalfAngle: 40, // 적 시선 원뿔 반각 (도)
  enemyAlertMemory: 2, // 이단아를 놓친 뒤 발각 상태를 유지하는 시간
  enemyInvestigateTime: 2.5, // 소리를 들은 뒤 확인하러 가는 시간
  enemyChaseSpeed: 170,
  enemyInvestigateSpeed: 95,
  noticeMarkTime: 0.9, // 느낌표 표시 시간

  // ── 소리 (범위 px) ──
  soundWallFactor: 0.4, // 벽 너머로 남은 거리의 몇 배까지 퍼지는지 (0 = 완전히 막힘)
  soundLife: 0.6, // 소리 범위 표시 시간
  soundStep: 110, // 달리기 발소리
  soundStepInterval: 0.32,
  soundJump: 130,
  soundLand: 240, // 착지 (낙하 세기만큼 비례)
  soundDash: 180,
  soundNeedle: 150,
  soundNeedleHit: 200,
  soundStrike: 320,
  soundDive: 600,

  // ── 연출 ──
  shake: 7,
  strikeShakeGrowth: 1.5, // 연쇄가 이어질수록 흔들림 증가
  diveSlowmo: 0.15,

  // ── 모드 ──
  assist: false,
  autoRespawn: true,
  showPerception: true, // 시선·소리 범위 표시
  showDebug: false, // 범위·판정 박스 표시
  showArt: true, // 그래픽 표시 (끄면 임시 사각형). 주소 ?art=0 / ?art=1 로도 지정
};

export type Tuning = typeof DEFAULT_TUNING;
export const tuning: Tuning = { ...DEFAULT_TUNING };

const STORAGE_KEY = 'lethe.tuning.v1';

export function loadTuning(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) applyTuning(JSON.parse(raw));
  } catch {
    /* 저장소를 못 쓰면 기본값으로 진행 */
  }
}

export function saveTuning(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tuning));
  } catch {
    /* 무시 */
  }
}

export function applyTuning(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const src = data as Record<string, unknown>;
  const dst = tuning as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_TUNING)) {
    if (typeof src[key] === typeof dst[key]) dst[key] = src[key];
  }
}

export function resetTuning(): void {
  Object.assign(tuning, DEFAULT_TUNING);
  saveTuning();
}
