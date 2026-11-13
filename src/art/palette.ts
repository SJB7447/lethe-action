/**
 * [담당: Antigravity] 레테(LETHE) 통합 색상 팔레트 (docs/ART_GUIDE.md 2장 기준).
 * 그림 코드에서는 색상을 직접 하드코딩하지 않고 이 파일의 상수만 사용합니다.
 */
export const PALETTE = {
  /** 모든 화면의 기본 어둠 */
  ink: 0x0b0d14,
  /** 챕터 1, 찢긴 기억 조각 (화면에서 가장 눈에 띄어야 함) */
  amberGold: 0xe8b04b,
  /** 앰버 하이라이트 (밝은 강조) */
  amberBright: 0xffd166,
  /** 깊은 앰버 (보조 잔광·테두리) */
  amberDeep: 0x9e6f21,
  /** 챕터 2, 균열 보이는 적·피격 */
  deepCrimson: 0xc2334d,
  /** 챕터 3 */
  prussianBlue: 0x1f3a5f,
  /** 챕터 4, 고스트 다이빙·연결 게이지 */
  paleViolet: 0x9b7bd4,
  /** 챕터 5, 박제실 */
  deepEmerald: 0x1f6b52,
  /** 이단아 (임시 식별색) */
  playerCyan: 0x6ee7f2,
  /** 균열선, 하이라이트 */
  memoryWhite: 0xfff1cf,
} as const;
