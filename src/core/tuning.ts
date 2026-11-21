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

  // ── 퍼펙트 (난이도) ──
  perfectWindow: 0.15, // 조각이 열린 직후 이 시간 안에 공격하면 퍼펙트 → 퍼펙트 연쇄 (화면 안 모든 적 록온)
  gaugePerfectBonus: 8, // 퍼펙트 타격 추가 게이지
  perfectMashGuard: 0.15, // 연타 방지 (실제 시간 s): 직전 헛공격과의 간격이 이보다 짧거나, 조각이 열리기 직전 이 시간 안에 헛공격이 있으면 퍼펙트 아님

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
  needleRange: 470,
  needleCooldown: 0.4,

  // ── 게이지 ──
  gaugePerStrike: 18,
  gaugePerNeedle: 3,

  // ── 적 ──
  contactDamage: true, // 적·보스 몸에 닿기만 해도 피격 (끄면 공격 중일 때만)
  enemyAggroRange: 170, // 발각된 뒤 공격을 시작하는 거리
  enemyTelegraph: 0.55,
  enemyCounterTelegraph: 0.28,
  enemyLungeSpeed: 560,
  enemyAttackCooldown: 1.8,
  enemySlowWhileOpen: 0.25, // 조각이 열린 적의 이동 속도 배수
  respawnDelay: 3, // (실험실) 적 재생성 시간
  deathRespawnDelay: 1.2, // (스테이지) 사망 뒤 체크포인트에서 다시 시작할 때까지 (실시간 s)

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

  // ── 보스 (챕터 1 균열형) ──
  bossMaxHp: 25,
  bossWeakDamage: 1, // 약점 균열 한 곳
  bossPerfectDamage: 2, // 약점 균열 퍼펙트
  bossCoreDamage: 4, // 다운 중 핵심 균열 (퍼펙트면 ×1.5)
  bossDiveDamage: 5, // 다운 중 고스트 다이빙
  bossDownTime: 3, // 다운 시간 = 핵심 균열이 열려 있는 시간
  bossIntroTime: 1.5,
  bossMoveSpeed: 70,
  bossPatternGap: 2.2, // 패턴 사이 쉬는 시간 (페이즈 1)
  bossPatternGap2: 1.3, // (페이즈 2)
  bossWaveTelegraph: 0.9, // 기억 소거 파동 예고
  bossWaveSpeed: 520, // 파동이 퍼지는 속도
  bossPhase2WaveBoost: 1.35,
  bossWaveWidth: 44, // 파동 고리 두께 (이 안의 조각이 닫힘)
  bossWaveMaxRadius: 1100,
  bossWaveRecover: 0.5,
  bossChargeTelegraph: 0.7, // 돌진 예고
  bossChargeSpeed: 900,
  bossChargeMaxTime: 1.6,
  bossChargeRecover: 1.0, // 돌진 뒤 빈틈
  bossDefeatDelay: 2.2, // 격파 연출 뒤 stage:clear까지

  // ── 타격 화면 효과 ──
  fxZoomPunch: 0.06, // 타격 순간 화면 확대 (1 + 값)
  fxKick: 12, // 파고든 방향으로 카메라가 밀리는 거리 (px)
  fxFlash: 0.28, // 타격 순간 번쩍임 세기
  fxImpactLines: 14, // 타격 지점 집중선 개수 (0 = 끔)
  fxChainGrowth: 0.25, // 연쇄 1회마다 효과가 커지는 비율
  fxChainCap: 2.2, // 연쇄로 커지는 최대 배수
  fxLockPulse: 0.6, // 록온 완료·연쇄 조각 열림 때 가장자리 앰버 맥동
  fxStrikeTunnel: 0.55, // 파고드는 동안 가장자리 어두움
  fxMissFlash: 0.7, // 조각을 놓쳤을 때 가장자리 크림슨
  fxPerfectBoost: 1.6, // 퍼펙트 타격 효과 배수
  fxPerfectGlow: 0.45, // 퍼펙트 연쇄 중 가장자리 흰빛
  // 효과가 사라지는 시간 (s, 거의 사라질 때까지). 실제 시간 기준이라 히트스톱 중에도 흐름
  fxZoomTime: 0.19,
  fxKickTime: 0.17,
  fxFlashTime: 0.14,
  fxLinesTime: 0.16,
  fxEdgeTime: 0.43,
  fxTunnelEase: 0.12, // 파고들기 터널이 켜지고 꺼지는 시간

  // ── 모드 ──
  assist: false,
  autoRespawn: true,
  fxEnabled: true, // 타격 화면 효과 표시
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
