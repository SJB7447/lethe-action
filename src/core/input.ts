/**
 * 키보드 + 마우스 + 게임패드 입력. 렌더 프레임마다 poll()로 읽고,
 * "이번에 눌림"은 consume*()로 한 번만 소비합니다.
 */
export interface InputState {
  x: number; // -1..1
  y: number; // -1..1 (아래가 +)
  jumpHeld: boolean;
  lockHeld: boolean;
  /** 시선을 정하는 장치. 마지막으로 움직인 쪽이 이깁니다. none이면 몸이 향한 쪽을 봅니다. */
  aimSource: 'none' | 'mouse' | 'stick';
  /** 오른쪽 스틱 방향 (aimSource가 stick일 때) */
  aimStickX: number;
  aimStickY: number;
}

type Action = 'jump' | 'dash' | 'attack' | 'dive' | 'assist' | 'reset' | 'debug' | 'help';

const KEYMAP: Record<string, Action | 'left' | 'right' | 'up' | 'down' | 'lock'> = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump',
  ShiftLeft: 'dash', ShiftRight: 'dash', KeyX: 'dash',
  KeyJ: 'attack', KeyC: 'attack',
  KeyK: 'lock', KeyV: 'lock',
  KeyE: 'dive', KeyF: 'dive',
  KeyT: 'assist',
  KeyR: 'reset',
  Backquote: 'debug',
  KeyH: 'help',
};

// 표준 게임패드 매핑
const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9 };

export class Input {
  readonly state: InputState = {
    x: 0, y: 0, jumpHeld: false, lockHeld: false, aimSource: 'none', aimStickX: 1, aimStickY: 0,
  };
  private down = new Set<string>();
  private mouseLock = false;
  private pressed = new Set<Action>();
  private padPrev: boolean[] = [];

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (!this.down.has(a) && isAction(a)) this.pressed.add(a);
      this.down.add(a);
    });
    target.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (a) this.down.delete(a);
    });
    target.addEventListener('blur', () => {
      this.down.clear();
      this.mouseLock = false;
    });

    // 마우스: 게임 화면(canvas) 위에서만 받습니다. 튜닝 패널 클릭은 무시.
    const onCanvas = (e: Event) => e.target instanceof HTMLCanvasElement;
    target.addEventListener('mousemove', (e) => {
      if (onCanvas(e)) this.state.aimSource = 'mouse';
    });
    target.addEventListener('mousedown', (e) => {
      if (!onCanvas(e)) return;
      this.state.aimSource = 'mouse';
      if (e.button === 0) this.pressed.add('attack');
      if (e.button === 2) this.mouseLock = true;
    });
    target.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.mouseLock = false;
    });
    target.addEventListener('contextmenu', (e) => {
      if (onCanvas(e)) e.preventDefault();
    });
  }

  poll(): void {
    let x = (this.down.has('right') ? 1 : 0) - (this.down.has('left') ? 1 : 0);
    let y = (this.down.has('down') ? 1 : 0) - (this.down.has('up') ? 1 : 0);
    let jumpHeld = this.down.has('jump');
    let lockHeld = this.down.has('lock') || this.mouseLock;

    const pad = getPad();
    if (pad) {
      const b = (i: number) => !!pad.buttons[i]?.pressed;
      const edge = (i: number, a: Action) => {
        if (b(i) && !this.padPrev[i]) this.pressed.add(a);
      };
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (Math.abs(ax) > 0.3) x = Math.sign(ax) * Math.min(1, (Math.abs(ax) - 0.3) / 0.5);
      if (Math.abs(ay) > 0.5) y = Math.sign(ay);
      if (b(14)) x = -1;
      if (b(15)) x = 1;
      if (b(12)) y = -1;
      if (b(13)) y = 1;
      // 오른쪽 스틱 = 시선
      const rx = pad.axes[2] ?? 0;
      const ry = pad.axes[3] ?? 0;
      if (Math.hypot(rx, ry) > 0.35) {
        this.state.aimSource = 'stick';
        this.state.aimStickX = rx;
        this.state.aimStickY = ry;
      }
      edge(PAD.A, 'jump');
      edge(PAD.B, 'dash');
      edge(PAD.RT, 'dash');
      edge(PAD.X, 'attack');
      edge(PAD.Y, 'dive');
      edge(PAD.SELECT, 'assist');
      edge(PAD.START, 'reset');
      jumpHeld ||= b(PAD.A);
      lockHeld ||= b(PAD.RB) || b(PAD.LT);
      this.padPrev = pad.buttons.map((btn) => btn.pressed);
    }

    this.state.x = x;
    this.state.y = y;
    this.state.jumpHeld = jumpHeld;
    this.state.lockHeld = lockHeld;
  }

  consume(a: Action): boolean {
    if (!this.pressed.has(a)) return false;
    this.pressed.delete(a);
    return true;
  }

  /** 프레임 끝에 남은 눌림을 비웁니다 (선입력은 게임 쪽 타이머로 처리). */
  endFrame(): void {
    this.pressed.clear();
  }
}

function isAction(a: string): a is Action {
  return ['jump', 'dash', 'attack', 'dive', 'assist', 'reset', 'debug', 'help'].includes(a);
}

function getPad(): Gamepad | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
  for (const p of navigator.getGamepads()) if (p && p.connected) return p;
  return null;
}
