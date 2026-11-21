/**
 * [담당: Claude] 그래픽 연결 계약. 이 파일만 Claude가 관리하고, src/art의 나머지는 Antigravity 담당입니다.
 * 규칙은 docs/ART_GUIDE.md를 따릅니다.
 *
 * 흐름
 * 1. LabScene이 src/art/index.ts의 createArtPainter()로 ArtPainter를 받습니다.
 * 2. 매 프레임 층(ArtLayer)마다 그 층의 Graphics를 비운 뒤 그리기 함수를 부릅니다.
 *    - 그래픽 표시가 켜져 있고 ArtPainter에 그 층 함수가 있으면 그것을,
 *    - 없으면 임시 사각형 그림(src/scenes/placeholderArt.ts)을 씁니다.
 * 3. 그리기 함수가 오류를 내면 그 층만 임시 그림으로 돌아가고 콘솔에 한 번 경고합니다.
 *
 * 그리기 함수는 ArtView를 읽기만 합니다. 위치·상태·판정 크기를 바꾸면 안 됩니다.
 */
import type * as Phaser from 'phaser';
import type { Tuning } from '../core/tuning';

// ───────────────────────── 층 (아래 → 위) ─────────────────────────

/** 그리는 순서. 뒤에 있을수록 위에 그려집니다. 읽기 순서는 ART_GUIDE 3장. */
export const ART_LAYERS = [
  'background', // 배경 (시차 스크롤, 중력 렌즈 왜곡 등)
  'terrain', // 발판·벽
  'perception', // 시선 원뿔(이단아·적), 소리 범위
  'enemies', // 보안 요원 몸체, 공격 예고, 쓰러짐
  'afterimages', // 대시·파고들기 잔상, 파고드는 궤적
  'player', // 이단아
  'projectiles', // 기억 추출 바늘
  'particles', // 타격·착지 파편 등
  'alerts', // 적의 느낌표 (소리로 들음 / 이단아를 봄)
  'fragments', // 록온 진행과 찢긴 기억 조각 (항상 맨 위에 가깝게)
  'screen', // 화면 전체 효과 (고스트 다이빙 등). 카메라 좌표 기준으로 그립니다
] as const;

export type ArtLayer = (typeof ART_LAYERS)[number];

/** 층의 Phaser depth. 스프라이트를 쓸 때 같은 층에 넣으려면 이 값을 쓰세요. */
export function layerDepth(layer: ArtLayer): number {
  return (ART_LAYERS.indexOf(layer) + 1) * 10;
}

/** 디버그 표시(범위·판정 박스)의 depth. 그림은 이 값 이상을 쓰면 안 됩니다. */
export const DEBUG_DEPTH = 1000;

// ───────────────────────── 읽기 전용 상태 ─────────────────────────

export interface PointView {
  readonly x: number;
  readonly y: number;
}

export interface RectView {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface PlayerView extends RectView {
  readonly vx: number;
  readonly vy: number;
  readonly onGround: boolean;
  readonly wallDir: -1 | 0 | 1;
  readonly mode: 'normal' | 'dash' | 'strike';
  readonly facing: -1 | 1;
  readonly hp: number;
  readonly maxHp: number;
  readonly invuln: number; // 남은 무적 시간
  readonly hurtFlash: number; // 남은 피격 표시 시간
  readonly dodgeBonus: number; // 남은 회피 보너스 시간
  readonly dashDir: { readonly x: number; readonly y: number };
  readonly strikeTarget: EnemyView | null; // 파고드는 대상
  readonly gaze: number; // 시선 각도 (라디안, 0 = 오른쪽, 아래가 +)
  readonly gazeActive: boolean; // 마우스·오른쪽 스틱으로 보고 있는지 (아니면 몸이 향한 쪽)
  readonly eyeX: number; // 눈 위치 (시선이 나가는 곳)
  readonly eyeY: number;
  readonly gazeFan: readonly PointView[]; // 시선 원뿔 = 록온 가능 범위 (벽에서 잘림). 첫 점은 눈
}

export type Awareness = 'idle' | 'heard' | 'alert';

export type EnemyState = 'patrol' | 'telegraph' | 'lunge' | 'recover' | 'stunned' | 'down';

export interface EnemyView extends RectView {
  readonly id: number;
  readonly vx: number;
  readonly vy: number;
  readonly kind: 'cracked' | 'solid'; // 균열 있음 / 없음
  readonly flying: boolean;
  readonly state: EnemyState;
  readonly timer: number; // 현재 상태의 남은 시간 (down이면 재생성까지 남은 시간)
  readonly dir: -1 | 1;
  readonly counter: boolean; // 조각을 놓친 뒤의 빠른 반격인지
  readonly hp: number;
  readonly maxHp: number;
  readonly hurtFlash: number;
  readonly lockProgress: number; // 0..1 록온 진행
  readonly fragment: number; // >0이면 조각이 열려 있음 (남은 시간)
  readonly fragmentMax: number; // 조각이 열린 전체 시간
  readonly awareness: Awareness; // idle 모름 / heard 소리 듣고 확인하러 감 / alert 이단아를 봄
  readonly markTimer: number; // >0이면 느낌표 표시 중 (남은 시간)
  readonly markKind: 'sound' | 'sight';
  readonly eyeX: number;
  readonly eyeY: number;
  readonly viewFan: readonly PointView[]; // 적 시선 원뿔 (벽에서 잘림). 첫 점은 눈. 쓰러지면 빈 배열
}

export type SoundKind = 'step' | 'jump' | 'land' | 'dash' | 'needle' | 'needleHit' | 'strike' | 'dive';

export interface SoundView {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly kind: SoundKind;
  readonly life: number; // 남은 표시 시간
  readonly maxLife: number;
  /** 소리가 닿는 범위의 모양. 벽 너머는 줄어듭니다. 적이 듣는 판정과 같은 모양 */
  readonly points: readonly PointView[];
}

export interface NeedleView {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
}

export interface ParticleView {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly life: number;
  readonly maxLife: number;
  readonly size: number;
  readonly color: number;
}

export interface GhostView extends RectView {
  readonly life: number; // 남은 시간 (최대 0.22s)
  readonly color: number;
}

export interface WorldView {
  readonly width: number;
  readonly height: number;
  readonly solids: readonly RectView[];
}

export interface CameraView {
  readonly scrollX: number; // 화면 왼쪽 위의 월드 좌표
  readonly scrollY: number;
  readonly width: number; // 화면 크기 (960 × 540)
  readonly height: number;
}

export interface ArtView {
  /** 게임 시간 (s). 히트스톱 중 멈추고 슬로우 중 느려집니다. 애니메이션은 이것을 기준으로 하세요. */
  readonly time: number;
  /** 실제 경과 시간 (s). 히트스톱 중에도 흐릅니다. UI처럼 멈추면 안 되는 표시에만 쓰세요. */
  readonly realTime: number;
  readonly player: PlayerView;
  readonly enemies: readonly EnemyView[];
  readonly needles: readonly NeedleView[];
  readonly particles: readonly ParticleView[];
  readonly ghosts: readonly GhostView[];
  readonly sounds: readonly SoundView[];
  readonly world: WorldView;
  readonly camera: CameraView;
  readonly combo: number;
  readonly chain: number;
  readonly gauge: number;
  readonly gaugeMax: number;
  readonly diveTimer: number; // >0이면 고스트 다이빙 연출 중
  readonly hitstop: number; // >0이면 히트스톱 중
  readonly timeScale: number;
  readonly tuning: Readonly<Tuning>;
}

// ───────────────────────── 그리는 쪽 ─────────────────────────

export type LayerPainter = (g: Phaser.GameObjects.Graphics, view: ArtView) => void;

export interface ArtContext {
  readonly scene: Phaser.Scene;
  /** 층별 Graphics. 그리기 함수에 넘어가는 것과 같습니다. */
  readonly layers: Readonly<Record<ArtLayer, Phaser.GameObjects.Graphics>>;
}

/**
 * Antigravity가 구현합니다. 모든 항목은 선택입니다.
 * 구현하지 않은 층은 임시 사각형 그림이 그려집니다.
 */
export type ArtPainter = { readonly [K in ArtLayer]?: LayerPainter } & {
  /** 이미지·스프라이트시트를 불러옵니다 (씬의 preload 단계). 경로는 './assets/art/…' */
  preload?(load: Phaser.Loader.LoaderPlugin): void;
  /** 스프라이트, 셰이더 등을 만듭니다 (씬의 create 단계). */
  init?(ctx: ArtContext): void;
  /** 그래픽 표시를 켜고 끌 때 불립니다. 직접 만든 스프라이트는 여기서 숨기세요. */
  onToggle?(enabled: boolean): void;
};
