import { Pane } from 'tweakpane';
import type { EventBus } from '../core/events';
import { applyTuning, resetTuning, saveTuning, tuning, type Tuning } from '../core/tuning';

type NumKey = { [K in keyof Tuning]: Tuning[K] extends number ? K : never }[keyof Tuning];
type Range = [NumKey, string, number, number, number];

const GROUPS: { title: string; expanded: boolean; items: Range[] }[] = [
  {
    title: '록온·연쇄 (기획 6종)',
    expanded: true,
    items: [
      ['lockTime', '록온 시간', 0.05, 1.5, 0.01],
      ['fragmentWindow', '조각 유지 시간', 0.1, 2, 0.01],
      ['chainSearchRadius', '연쇄 탐색 거리', 100, 900, 10],
      ['chainSpeed', '연쇄 이동 속도', 600, 4000, 50],
      ['hitstop', '히트스톱', 0, 0.25, 0.005],
      ['chainInertia', '연쇄 후 관성', 0, 1.2, 0.01],
    ],
  },
  {
    title: '록온 보조 규칙',
    expanded: false,
    items: [
      ['lockTimeMin', '근거리 록온 시간', 0.02, 1, 0.01],
      ['lockRange', '록온 거리', 100, 900, 10],
      ['closeRange', '근거리 기준', 0, 400, 10],
      ['maxLocks', '동시 록온 수', 1, 6, 1],
      ['dodgeLockBonus', '회피 후 록온 단축', 0, 0.9, 0.05],
      ['dodgeBonusDuration', '회피 보너스 시간', 0, 4, 0.1],
      ['assistWindowBonus', '보조 시 조각 시간 배수', 1, 2, 0.05],
      ['attackBuffer', '공격 선입력', 0, 0.4, 0.01],
      ['comboTimeout', '콤보 유지 시간', 0.3, 4, 0.1],
    ],
  },
  {
    title: '이동',
    expanded: false,
    items: [
      ['runSpeed', '달리기 속도', 100, 700, 10],
      ['runAccel', '가속', 500, 8000, 100],
      ['runDecel', '감속', 500, 8000, 100],
      ['airAccel', '공중 가속', 300, 6000, 100],
      ['airDrag', '공중 관성 감소', 0, 3000, 50],
      ['gravity', '중력', 800, 5000, 50],
      ['jumpVelocity', '점프 힘', 300, 1400, 10],
      ['jumpCut', '점프 끊기 비율', 0.1, 1, 0.05],
      ['maxFall', '최대 낙하 속도', 400, 2000, 50],
      ['coyoteTime', '코요테 타임', 0, 0.3, 0.01],
      ['jumpBuffer', '점프 선입력', 0, 0.3, 0.01],
      ['wallSlideSpeed', '벽 미끄러짐 속도', 0, 600, 10],
      ['wallJumpX', '벽 점프 수평', 100, 900, 10],
      ['wallJumpY', '벽 점프 수직', 200, 1400, 10],
    ],
  },
  {
    title: '회피·바늘',
    expanded: false,
    items: [
      ['dashSpeed', '대시 속도', 300, 2000, 10],
      ['dashTime', '대시 시간', 0.05, 0.4, 0.01],
      ['dashCooldown', '대시 쿨다운', 0, 1.5, 0.05],
      ['dashIFrames', '무적 시간', 0, 0.6, 0.01],
      ['perfectDodgeRange', '회피 성공 판정 거리', 0, 400, 10],
      ['needleSpeed', '바늘 속도', 400, 3000, 50],
      ['needleRange', '바늘 사거리', 60, 800, 10],
      ['needleCooldown', '바늘 쿨다운', 0.05, 1, 0.01],
    ],
  },
  {
    title: '적·게이지·연출',
    expanded: false,
    items: [
      ['enemyAggroRange', '적 공격 감지 거리', 0, 600, 10],
      ['enemyTelegraph', '적 공격 예고', 0.1, 1.5, 0.05],
      ['enemyCounterTelegraph', '반격 예고', 0.05, 1, 0.01],
      ['enemyLungeSpeed', '적 돌진 속도', 100, 1200, 10],
      ['enemyAttackCooldown', '적 공격 간격', 0.3, 5, 0.1],
      ['enemySlowWhileOpen', '조각 열린 적 속도', 0, 1, 0.05],
      ['respawnDelay', '적 재생성 시간', 0.5, 10, 0.5],
      ['gaugePerStrike', '타격당 게이지', 0, 50, 1],
      ['gaugePerNeedle', '바늘당 게이지', 0, 20, 1],
      ['shake', '화면 흔들림', 0, 24, 0.5],
      ['strikeShakeGrowth', '연쇄별 흔들림 증가', 0, 5, 0.1],
      ['diveSlowmo', '다이빙 슬로우 배율', 0.05, 1, 0.05],
    ],
  },
];

export function initTuningPanel(bus: EventBus, onRespawn: () => void): Pane {
  const container = document.getElementById('tuning');
  const pane = new Pane({ title: '튜닝 (손맛 실험실)', container: container ?? undefined });

  const modes = pane.addFolder({ title: '모드', expanded: true });
  modes.addBinding(tuning, 'assist', { label: '자동 보조' }).on('change', (ev) => bus.emit('mode:change', { assist: ev.value }));
  modes.addBinding(tuning, 'autoRespawn', { label: '적 자동 재생성' });
  modes.addBinding(tuning, 'showDebug', { label: '범위·판정 박스' });
  modes.addBinding(tuning, 'showArt', { label: '그래픽 표시' });

  for (const group of GROUPS) {
    const f = pane.addFolder({ title: group.title, expanded: group.expanded });
    for (const [key, label, min, max, step] of group.items) {
      f.addBinding(tuning, key, { label, min, max, step });
    }
  }

  const io = pane.addFolder({ title: '프리셋', expanded: true });
  io.addButton({ title: 'JSON 복사' }).on('click', () => {
    const json = JSON.stringify(tuning, null, 2);
    void navigator.clipboard?.writeText(json).catch(() => undefined);
    console.log(json);
  });
  io.addButton({ title: 'JSON 붙여넣기' }).on('click', () => {
    const raw = window.prompt('튜닝 JSON을 붙여넣으세요');
    if (!raw) return;
    try {
      applyTuning(JSON.parse(raw));
      saveTuning();
      pane.refresh();
    } catch {
      window.alert('JSON 형식이 올바르지 않습니다.');
    }
  });
  io.addButton({ title: '기본값으로' }).on('click', () => {
    resetTuning();
    pane.refresh();
    bus.emit('mode:change', { assist: tuning.assist });
  });
  io.addButton({ title: '방 초기화 (R)' }).on('click', onRespawn);

  pane.on('change', () => saveTuning());
  bus.on('mode:change', () => pane.refresh());
  return pane;
}
