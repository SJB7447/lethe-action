import type { EventBus } from '../core/events';
import type { Input } from '../core/input';
import { tuning as T } from '../core/tuning';
import { hears, inSight, sightFan, soundShape, type Vec } from './perception';
import { approach, cx, cy, overlaps, World, type Body } from './physics';
import { ROOM, type EnemySpawn } from './room';

/**
 * 1단계 실험실 시뮬레이션. Phaser에 의존하지 않습니다.
 * 렌더링은 scenes/LabScene.ts가 이 객체의 상태를 읽어서 그립니다.
 */

export type PlayerMode = 'normal' | 'dash' | 'strike';

export interface Player extends Body {
  mode: PlayerMode;
  facing: -1 | 1;
  hp: number;
  maxHp: number;
  invuln: number;
  coyote: number;
  jumpBuf: number;
  jumping: boolean;
  wallLock: number;
  dashTimer: number;
  dashCd: number;
  airDashes: number;
  dashDir: { x: number; y: number };
  needleCd: number;
  attackBuf: number;
  dodgeBonus: number;
  strikeTarget: Enemy | null;
  strikeTimer: number;
  hurtFlash: number;
  /** 시선 각도 (라디안, 0 = 오른쪽, 아래가 +) */
  gaze: number;
  /** 마우스·오른쪽 스틱으로 시선을 정하고 있는지 (아니면 몸이 향한 쪽) */
  gazeActive: boolean;
  eyeX: number;
  eyeY: number;
  /** 시선 원뿔 모양 (벽에서 잘림). 첫 점은 눈 */
  gazeFan: Vec[];
  stepTimer: number;
}

export type Awareness = 'idle' | 'heard' | 'alert';
export type SoundKind = 'step' | 'jump' | 'land' | 'dash' | 'needle' | 'needleHit' | 'strike' | 'dive';

export interface Sound {
  x: number;
  y: number;
  radius: number;
  kind: SoundKind;
  life: number;
  maxLife: number;
  /** 소리 범위 모양 (벽 너머는 줄어듦). 판정과 같은 규칙 */
  points: Vec[];
}

export type EnemyState = 'patrol' | 'telegraph' | 'lunge' | 'recover' | 'stunned' | 'down';

export interface Enemy extends Body {
  id: number;
  spawn: EnemySpawn;
  kind: 'cracked' | 'solid';
  flying: boolean;
  hp: number;
  maxHp: number;
  state: EnemyState;
  timer: number;
  dir: -1 | 1;
  attackCd: number;
  lungeDir: { x: number; y: number };
  counter: boolean;
  lockProgress: number;
  fragment: number; // >0이면 조각이 열려 있음 (남은 시간)
  fragmentMax: number;
  hurtFlash: number;
  bob: number;
  /** idle: 모름 / heard: 소리를 듣고 확인하러 감 / alert: 이단아를 봄 */
  awareness: Awareness;
  awareTimer: number;
  heardX: number;
  heardY: number;
  /** >0이면 느낌표 표시 중 */
  markTimer: number;
  markKind: 'sound' | 'sight';
  eyeX: number;
  eyeY: number;
  /** 시선 원뿔 모양 (벽에서 잘림). 첫 점은 눈. 쓰러지면 빈 배열 */
  viewFan: Vec[];
}

export interface Needle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  traveled: number;
  alive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

export interface Ghost {
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
  color: number;
}

export const GAUGE_MAX = 100;
const FIXED_DT = 1 / 120;
const SOUND_RAYS = 96; // 소리 모양 정밀도 (판정도 이 모양을 씀)
const PLAYER_W = 22;
const PLAYER_H = 40;

export class Sim {
  readonly world = new World(ROOM.width, ROOM.height);
  player!: Player;
  enemies: Enemy[] = [];
  needles: Needle[] = [];
  particles: Particle[] = [];
  ghosts: Ghost[] = [];
  sounds: Sound[] = [];
  /** 마우스가 가리키는 월드 좌표. LabScene이 매 프레임 넣어 줍니다. */
  aimWorld: Vec | null = null;

  gauge = 0;
  combo = 0;
  comboTimer = 0;
  chain = 0;

  hitstop = 0; // 남은 정지 시간 (실시간)
  shake = 0; // 흔들림 세기 (px)
  timeScale = 1;
  time = 0; // 게임 시간 (s). 히트스톱 중 멈추고 슬로우 중 느려짐. 그림 애니메이션 기준
  diveTimer = 0; // >0이면 고스트 다이빙 연출 중 (실시간)
  private diveImpactDone = false;
  private ghostTimer = 0;
  private accumulator = 0;
  private nextId = 1;
  private wasGrounded = true;

  constructor(
    private bus: EventBus,
    private input: Input,
  ) {
    this.world.solids.push(...ROOM.solids);
    this.reset();
  }

  reset(): void {
    const s = ROOM.playerSpawn;
    this.player = {
      x: s.x, y: s.y, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, onGround: false, wallDir: 0,
      mode: 'normal', facing: 1, hp: 5, maxHp: 5, invuln: 0, coyote: 0, jumpBuf: 0, jumping: false,
      wallLock: 0, dashTimer: 0, dashCd: 0, airDashes: 1, dashDir: { x: 1, y: 0 }, needleCd: 0,
      attackBuf: 0, dodgeBonus: 0, strikeTarget: null, strikeTimer: 0, hurtFlash: 0,
      gaze: 0, gazeActive: false, eyeX: 0, eyeY: 0, gazeFan: [], stepTimer: 0,
    };
    this.enemies = ROOM.enemies.map((sp) => this.makeEnemy(sp));
    this.needles = [];
    this.particles = [];
    this.ghosts = [];
    this.sounds = [];
    this.gauge = 0;
    this.combo = 0;
    this.chain = 0;
    this.diveTimer = 0;
    this.timeScale = 1;
    this.bus.emit('room:reset', {});
    this.bus.emit('gauge:change', { value: 0, max: GAUGE_MAX });
    this.bus.emit('combo:change', { count: 0 });
    this.bus.emit('player:hp', { hp: this.player.hp, maxHp: this.player.maxHp });
  }

  private makeEnemy(sp: EnemySpawn): Enemy {
    const hp = sp.kind === 'solid' ? 4 : 2;
    return {
      id: this.nextId++, spawn: sp, kind: sp.kind, flying: sp.flying,
      x: sp.x, y: sp.y, w: 30, h: sp.flying ? 30 : 44, vx: 0, vy: 0, onGround: false, wallDir: 0,
      hp, maxHp: hp, state: 'patrol', timer: 0, dir: 1, attackCd: 1, lungeDir: { x: 0, y: 0 },
      counter: false, lockProgress: 0, fragment: 0, fragmentMax: 1, hurtFlash: 0, bob: Math.random() * 6,
      awareness: 'idle', awareTimer: 0, heardX: 0, heardY: 0, markTimer: 0, markKind: 'sound',
      eyeX: 0, eyeY: 0, viewFan: [],
    };
  }

  // ───────────────────────── 메인 루프 ─────────────────────────

  /** 렌더 프레임마다 한 번. realDt는 실제 경과 시간. */
  frame(realDt: number): void {
    this.updateGaze();
    this.advance(realDt);
    this.updateFans();
  }

  private advance(realDt: number): void {
    const p = this.player;
    if (this.input.consume('reset')) this.reset();
    if (this.input.consume('assist')) {
      T.assist = !T.assist;
      this.bus.emit('mode:change', { assist: T.assist });
    }
    if (this.input.consume('dive')) this.tryDive();

    // 다이빙 연출 (실시간 기준)
    if (this.diveTimer > 0) this.updateDive(realDt);

    // 공격 선입력은 히트스톱 중에도 받아 둡니다.
    if (this.input.consume('attack')) p.attackBuf = T.attackBuffer;

    if (this.hitstop > 0) {
      this.hitstop -= realDt;
      this.decayFx(realDt);
      return;
    }

    // 고정 타임스텝: 프레임레이트가 달라도 조작감이 같도록
    this.accumulator += realDt * this.timeScale;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < 8) {
      this.step(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;
      if (this.hitstop > 0) {
        this.accumulator = 0;
        break;
      }
    }
    this.decayFx(realDt);
  }

  private decayFx(realDt: number): void {
    this.shake = Math.max(0, this.shake - realDt * 60);
  }

  private step(dt: number): void {
    this.time += dt;
    const p = this.player;
    this.updateGaze();
    this.updatePlayer(dt);
    this.updateGaze(); // 이번 스텝의 입력·이동으로 바뀐 몸 방향·눈 위치를 록온에 반영
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.updateLock(dt);
    this.updateNeedles(dt);
    this.checkEnemyHits();

    // 콤보
    if (this.combo > 0 && p.mode !== 'strike' && !this.anyFragmentOpen()) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.endCombo();
    }

    // 잔상, 파티클
    this.ghostTimer -= dt;
    if ((p.mode === 'dash' || p.mode === 'strike') && this.ghostTimer <= 0) {
      this.ghostTimer = 0.018;
      this.ghosts.push({ x: p.x, y: p.y, w: p.w, h: p.h, life: 0.22, color: p.mode === 'strike' ? 0xe8b04b : 0x6ee7f2 });
    }
    for (const g of this.ghosts) g.life -= dt;
    this.ghosts = this.ghosts.filter((g) => g.life > 0);
    for (const pt of this.particles) {
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 1 - 4 * dt;
      pt.vy *= 1 - 4 * dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const snd of this.sounds) snd.life -= dt;
    this.sounds = this.sounds.filter((snd) => snd.life > 0);
  }

  // ───────────────────────── 플레이어 ─────────────────────────

  private updatePlayer(dt: number): void {
    const p = this.player;
    const inp = this.input.state;

    p.invuln = Math.max(0, p.invuln - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.needleCd = Math.max(0, p.needleCd - dt);
    p.attackBuf = Math.max(0, p.attackBuf - dt);
    p.dodgeBonus = Math.max(0, p.dodgeBonus - dt);
    p.wallLock = Math.max(0, p.wallLock - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);

    if (this.input.consume('jump')) p.jumpBuf = T.jumpBuffer;
    else p.jumpBuf = Math.max(0, p.jumpBuf - dt);

    // 공격 버튼: 열린 조각이 있으면 파고들기, 없으면 바늘
    if (p.attackBuf > 0 && p.mode !== 'strike') {
      const target = this.pickStrikeTarget();
      if (target) {
        p.attackBuf = 0;
        this.beginStrike(target);
      } else if (p.mode === 'normal' && p.needleCd <= 0) {
        p.attackBuf = 0;
        this.fireNeedle();
      }
    }

    if (this.input.consume('dash') && p.mode === 'normal' && p.dashCd <= 0 && (p.onGround || p.airDashes > 0)) {
      this.beginDash();
    }

    if (p.mode === 'strike') return this.updateStrike(dt);
    if (p.mode === 'dash') return this.updateDash(dt);

    // ── 일반 이동 ──
    if (inp.x !== 0 && p.wallLock <= 0) p.facing = inp.x > 0 ? 1 : -1;
    // 시선을 쓰고 있으면 몸도 시선 쪽을 봅니다
    if (p.gazeActive && p.wallLock <= 0) p.facing = Math.cos(p.gaze) >= 0 ? 1 : -1;
    const target = inp.x * T.runSpeed;
    const control = p.wallLock > 0 ? 0.25 : 1;
    if (p.onGround) {
      const acc = inp.x !== 0 ? T.runAccel : T.runDecel;
      p.vx = approach(p.vx, target, acc * dt * control);
    } else if (Math.abs(p.vx) > T.runSpeed && Math.sign(p.vx) === Math.sign(target || p.vx)) {
      // 연쇄 후 관성: 달리기 속도보다 빠르면 천천히 줄어듭니다.
      p.vx = approach(p.vx, target, T.airDrag * dt);
    } else {
      p.vx = approach(p.vx, target, T.airAccel * dt * control);
    }

    // 중력, 벽 미끄러짐
    p.vy = Math.min(p.vy + T.gravity * dt, T.maxFall);
    const pushingWall = p.wallDir !== 0 && Math.sign(inp.x) === p.wallDir;
    if (!p.onGround && pushingWall && p.vy > T.wallSlideSpeed) p.vy = T.wallSlideSpeed;

    // 점프 (코요테 타임 + 선입력)
    p.coyote = p.onGround ? T.coyoteTime : Math.max(0, p.coyote - dt);
    if (p.jumpBuf > 0) {
      if (p.coyote > 0) {
        p.vy = -T.jumpVelocity;
        p.jumping = true;
        p.jumpBuf = 0;
        p.coyote = 0;
        this.bus.emit('player:jump', { wall: false });
        this.emitSound(cx(p), p.y + p.h, T.soundJump, 'jump');
      } else if (p.wallDir !== 0 && !p.onGround) {
        p.vx = -p.wallDir * T.wallJumpX;
        p.vy = -T.wallJumpY;
        p.facing = p.wallDir === 1 ? -1 : 1;
        p.wallLock = T.wallJumpLock;
        p.jumping = true;
        p.jumpBuf = 0;
        this.bus.emit('player:jump', { wall: true });
        this.emitSound(cx(p), cy(p), T.soundJump, 'jump');
      }
    }
    if (p.jumping && !inp.jumpHeld && p.vy < 0) {
      p.vy *= T.jumpCut;
      p.jumping = false;
    }
    if (p.vy >= 0) p.jumping = false;

    const fallSpeed = p.vy;
    this.world.move(p, dt);
    if (p.onGround) {
      p.airDashes = 1;
      if (!this.wasGrounded && fallSpeed > 300) {
        this.bus.emit('player:land', { impact: fallSpeed / T.maxFall });
        this.burst(cx(p), p.y + p.h, 5, 0x8a90a8, 120);
        this.emitSound(cx(p), p.y + p.h - 2, T.soundLand * Math.min(1, fallSpeed / T.maxFall), 'land');
      }
      // 달리기 발소리
      if (Math.abs(p.vx) > T.runSpeed * 0.6) {
        p.stepTimer -= dt;
        if (p.stepTimer <= 0) {
          p.stepTimer = T.soundStepInterval;
          this.emitSound(cx(p), p.y + p.h - 2, T.soundStep, 'step');
        }
      } else {
        p.stepTimer = 0;
      }
    }
    this.wasGrounded = p.onGround;
  }

  private beginDash(): void {
    const p = this.player;
    const inp = this.input.state;
    let dx = inp.x;
    let dy = inp.y;
    if (dx === 0 && dy === 0) dx = p.facing;
    if (p.onGround && dy > 0) dy = 0;
    const len = Math.hypot(dx, dy) || 1;
    p.dashDir = { x: dx / len, y: dy / len };
    p.mode = 'dash';
    p.dashTimer = T.dashTime;
    p.dashCd = T.dashCooldown;
    p.invuln = Math.max(p.invuln, T.dashIFrames);
    if (!p.onGround) p.airDashes--;

    // 회피 성공 판정: 공격 중이거나 공격 예고 중인 적이 가까이 있으면
    const perfect = this.enemies.some(
      (e) => (e.state === 'lunge' || (e.state === 'telegraph' && e.timer < 0.2)) &&
        Math.hypot(cx(e) - cx(p), cy(e) - cy(p)) < T.perfectDodgeRange,
    );
    if (perfect) {
      p.dodgeBonus = T.dodgeBonusDuration;
      p.airDashes = 1;
      this.burst(cx(p), cy(p), 10, 0x6ee7f2, 260);
    }
    this.bus.emit('player:dash', { perfect });
    this.emitSound(cx(p), cy(p), T.soundDash, 'dash');
  }

  private updateDash(dt: number): void {
    const p = this.player;
    p.vx = p.dashDir.x * T.dashSpeed;
    p.vy = p.dashDir.y * T.dashSpeed;
    this.world.move(p, dt);
    p.dashTimer -= dt;
    if (p.dashTimer <= 0) {
      p.mode = 'normal';
      p.vx *= 0.45;
      p.vy = p.vy < 0 ? p.vy * 0.35 : p.vy * 0.5;
    }
  }

  private fireNeedle(): void {
    const p = this.player;
    const inp = this.input.state;
    let dx = p.facing as number;
    let dy = 0;
    if (p.gazeActive) {
      // 시선 방향으로 쏩니다
      dx = Math.cos(p.gaze);
      dy = Math.sin(p.gaze);
    } else if (inp.y < 0) {
      dy = -1;
      dx = inp.x;
    } else if (inp.y > 0 && !p.onGround) {
      dy = 1;
      dx = inp.x;
    }
    const len = Math.hypot(dx, dy) || 1;
    this.needles.push({
      x: cx(p), y: cy(p) - 4, vx: (dx / len) * T.needleSpeed, vy: (dy / len) * T.needleSpeed,
      traveled: 0, alive: true,
    });
    p.needleCd = T.needleCooldown;
    this.bus.emit('needle:fire', {});
    this.emitSound(cx(p), cy(p), T.soundNeedle, 'needle');
  }

  private updateNeedles(dt: number): void {
    for (const n of this.needles) {
      const step = Math.hypot(n.vx, n.vy) * dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.traveled += step;
      if (n.traveled > T.needleRange || this.world.hits({ x: n.x - 2, y: n.y - 2, w: 4, h: 4 })) n.alive = false;
      if (!n.alive) continue;
      for (const e of this.enemies) {
        if (e.state === 'down') continue;
        if (!overlaps({ x: n.x - 6, y: n.y - 6, w: 12, h: 12 }, e)) continue;
        n.alive = false;
        e.hp--;
        e.hurtFlash = 0.12;
        const killed = e.hp <= 0;
        this.burst(n.x, n.y, 6, 0xd8dcf0, 200);
        this.addGauge(T.gaugePerNeedle);
        if (killed) this.downEnemy(e);
        else {
          e.state = 'stunned';
          e.timer = 0.18;
          e.vx = Math.sign(n.vx || 1) * 160;
        }
        this.bus.emit('needle:hit', { enemyId: e.id, killed });
        this.emitSound(n.x, n.y, T.soundNeedleHit, 'needleHit');
        if (!killed) this.alert(e); // 맞은 적은 이단아를 알아챕니다
        break;
      }
    }
    this.needles = this.needles.filter((n) => n.alive);
  }

  // ───────────────────────── 록온 · 연쇄 ─────────────────────────

  private effectiveLockTime(dist: number): number {
    let t: number;
    if (dist <= T.closeRange) t = T.lockTimeMin;
    else {
      const k = Math.min(1, (dist - T.closeRange) / Math.max(1, T.lockRange - T.closeRange));
      t = T.lockTimeMin + (T.lockTime - T.lockTimeMin) * k;
    }
    if (this.player.dodgeBonus > 0) t *= 1 - T.dodgeLockBonus;
    return Math.max(0.03, t);
  }

  private updateLock(dt: number): void {
    const p = this.player;
    const eye = this.playerEye();
    const px = eye.x;
    const py = eye.y;
    const halfAngle = (T.gazeHalfAngle * Math.PI) / 180;
    const lockable = (e: Enemy) => e.kind === 'cracked' && e.state !== 'down' && e.fragment <= 0;

    let candidates: Enemy[] = [];
    if (this.input.state.lockHeld || T.assist) {
      // 이단아의 시선 원뿔 안에 있고 벽에 가리지 않은 적만 록온됩니다.
      candidates = this.enemies
        .filter(lockable)
        .filter((e) => inSight(eye, p.gaze, halfAngle, T.lockRange, cx(e), cy(e), this.world.solids))
        .map((e) => ({ e, d: Math.hypot(cx(e) - px, cy(e) - py) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, this.input.state.lockHeld ? T.maxLocks : 1)
        .map(({ e }) => e);
    }

    for (const e of this.enemies) {
      if (e.fragment > 0) {
        e.fragment -= dt;
        if (e.fragment <= 0) {
          e.fragment = 0;
          this.onFragmentMissed(e);
        }
        continue;
      }
      if (candidates.includes(e)) {
        const d = Math.hypot(cx(e) - px, cy(e) - py);
        const before = e.lockProgress;
        e.lockProgress += dt / this.effectiveLockTime(d);
        if (before === 0) this.bus.emit('lock:progress', { enemyId: e.id, progress: 0 });
        if (e.lockProgress >= 1) {
          e.lockProgress = 0;
          this.bus.emit('lock:complete', { enemyId: e.id });
          this.openFragment(e, false);
        }
      } else {
        e.lockProgress = Math.max(0, e.lockProgress - dt * 2.5);
      }
    }
  }

  private openFragment(e: Enemy, chained: boolean): void {
    const window = T.fragmentWindow * (T.assist ? T.assistWindowBonus : 1);
    e.fragment = window;
    e.fragmentMax = window;
    this.bus.emit('fragment:open', { enemyId: e.id, window, chained });
  }

  private onFragmentMissed(e: Enemy): void {
    this.bus.emit('fragment:close', { enemyId: e.id, missed: true });
    if (e.state !== 'down') {
      this.alert(e);
      e.state = 'telegraph';
      e.timer = T.enemyCounterTelegraph;
      e.counter = true;
      this.bus.emit('enemy:telegraph', { enemyId: e.id, counter: true });
    }
    if (this.combo > 0) this.endCombo();
  }

  private anyFragmentOpen(): boolean {
    return this.enemies.some((e) => e.fragment > 0);
  }

  private pickStrikeTarget(): Enemy | null {
    const p = this.player;
    const inp = this.input.state;
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const e of this.enemies) {
      if (e.fragment <= 0 || e.state === 'down') continue;
      const dx = cx(e) - cx(p);
      const dy = cy(e) - cy(p);
      const d = Math.hypot(dx, dy);
      if (d > T.lockRange * 1.3) continue;
      // 시선(없으면 입력 방향)과 같은 쪽 적을 우선
      let dirBonus = 0;
      if (p.gazeActive) dirBonus = ((dx * Math.cos(p.gaze) + dy * Math.sin(p.gaze)) / (d || 1)) * 120;
      else if (inp.x !== 0 || inp.y !== 0) dirBonus = ((dx * inp.x + dy * inp.y) / (d || 1)) * 120;
      const score = d - dirBonus;
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  private beginStrike(e: Enemy): void {
    const p = this.player;
    p.mode = 'strike';
    p.strikeTarget = e;
    p.strikeTimer = 0.6;
    p.invuln = Math.max(p.invuln, 0.3);
    this.bus.emit('strike:start', { enemyId: e.id, chain: this.chain + 1 });
  }

  private updateStrike(dt: number): void {
    const p = this.player;
    const e = p.strikeTarget;
    p.strikeTimer -= dt;
    if (!e || e.state === 'down' || p.strikeTimer <= 0) {
      p.mode = 'normal';
      p.strikeTarget = null;
      this.world.depenetrate(p);
      return;
    }
    const dx = cx(e) - cx(p);
    const dy = cy(e) - cy(p);
    const d = Math.hypot(dx, dy);
    const step = T.chainSpeed * dt;
    p.facing = dx >= 0 ? 1 : -1;
    p.invuln = Math.max(p.invuln, 0.1);
    if (d <= step + 8) {
      p.x += dx;
      p.y += dy;
      this.strikeHit(e, dx / (d || 1), dy / (d || 1));
      return;
    }
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
    p.vx = (dx / d) * T.chainSpeed;
    p.vy = (dy / d) * T.chainSpeed;
  }

  private strikeHit(e: Enemy, nx: number, ny: number): void {
    const p = this.player;
    this.chain++;
    this.combo++;
    this.comboTimer = T.comboTimeout;
    e.fragment = 0;
    this.downEnemy(e);
    this.bus.emit('strike:hit', { enemyId: e.id, chain: this.chain });
    this.bus.emit('combo:change', { count: this.combo });
    this.addGauge(T.gaugePerStrike);

    this.hitstop = T.hitstop;
    this.shake = Math.min(24, T.shake + (this.chain - 1) * T.strikeShakeGrowth);
    this.burst(cx(e), cy(e), 18, 0xe8b04b, 420);
    this.burst(cx(e), cy(e), 8, 0xffffff, 300);
    this.emitSound(cx(e), cy(e), T.soundStrike, 'strike');

    // 관성 유지 + 살짝 띄워서 다음 연쇄로 이어지게
    p.mode = 'normal';
    p.strikeTarget = null;
    p.vx = nx * T.chainSpeed * T.chainInertia;
    p.vy = Math.min(ny * T.chainSpeed * T.chainInertia, -260);
    p.airDashes = 1;
    p.jumping = false;
    this.world.depenetrate(p);

    // 다음 적의 조각을 바로 엽니다.
    const next = this.enemies
      .filter((o) => o !== e && o.kind === 'cracked' && o.state !== 'down' && o.fragment <= 0)
      .map((o) => ({ o, d: Math.hypot(cx(o) - cx(p), cy(o) - cy(p)) }))
      .filter(({ d }) => d <= T.chainSearchRadius)
      .sort((a, b) => a.d - b.d)[0];
    if (next) {
      next.o.lockProgress = 0;
      this.openFragment(next.o, true);
    }
  }

  private endCombo(): void {
    if (this.combo > 0) this.bus.emit('combo:end', { total: this.combo });
    this.combo = 0;
    this.chain = 0;
    this.bus.emit('combo:change', { count: 0 });
  }

  // ───────────────────────── 적 ─────────────────────────

  private updateEnemy(e: Enemy, dt: number): void {
    e.hurtFlash = Math.max(0, e.hurtFlash - dt);
    e.attackCd = Math.max(0, e.attackCd - dt);
    e.markTimer = Math.max(0, e.markTimer - dt);
    const p = this.player;

    if (e.state === 'down') {
      e.timer -= dt;
      if (e.timer <= 0 && T.autoRespawn) {
        Object.assign(e, this.makeEnemy(e.spawn), { id: e.id });
      }
      return;
    }

    const slow = e.fragment > 0 ? T.enemySlowWhileOpen : 1;
    const edt = dt * slow;
    const dx = cx(p) - cx(e);
    const dy = cy(p) - cy(e);
    const dist = Math.hypot(dx, dy);
    e.timer -= edt;
    this.perceive(e, edt);

    switch (e.state) {
      case 'patrol': {
        if (e.awareness === 'alert') {
          // 발각: 쫓아가다가 가까우면 공격
          e.dir = dx >= 0 ? 1 : -1;
          if (e.flying) {
            e.vx = (dx / (dist || 1)) * T.enemyChaseSpeed;
            e.vy = (dy / (dist || 1)) * T.enemyChaseSpeed;
          } else {
            e.vx = Math.abs(dx) > 12 ? e.dir * T.enemyChaseSpeed : 0;
          }
          if (dist < T.enemyAggroRange && e.attackCd <= 0 && p.hp > 0) {
            e.state = 'telegraph';
            e.timer = T.enemyTelegraph;
            e.counter = false;
            this.bus.emit('enemy:telegraph', { enemyId: e.id, counter: false });
          }
        } else if (e.awareness === 'heard') {
          // 소리가 난 곳으로 확인하러 감
          const hx = e.heardX - cx(e);
          const hy = e.heardY - cy(e);
          if (Math.abs(hx) > 10) e.dir = hx > 0 ? 1 : -1;
          if (e.flying) {
            const len = Math.hypot(hx, hy);
            e.vx = len > 12 ? (hx / len) * T.enemyInvestigateSpeed : 0;
            e.vy = len > 12 ? (hy / len) * T.enemyInvestigateSpeed : 0;
          } else {
            e.vx = Math.abs(hx) > 12 ? e.dir * T.enemyInvestigateSpeed : 0;
          }
        } else {
          const left = e.spawn.x - e.spawn.patrol;
          const right = e.spawn.x + e.spawn.patrol;
          if (e.x < left) e.dir = 1;
          if (e.x > right) e.dir = -1;
          e.vx = e.dir * 70;
        }
        break;
      }
      case 'telegraph':
        e.vx = 0;
        e.dir = dx >= 0 ? 1 : -1;
        if (e.timer <= 0) {
          e.state = 'lunge';
          e.timer = 0.24;
          const len = dist || 1;
          e.lungeDir = e.flying ? { x: dx / len, y: dy / len } : { x: Math.sign(dx) || 1, y: 0 };
        }
        break;
      case 'lunge':
        e.vx = e.lungeDir.x * T.enemyLungeSpeed * (e.counter ? 1.25 : 1);
        if (e.flying) e.vy = e.lungeDir.y * T.enemyLungeSpeed;
        if (e.timer <= 0) {
          e.state = 'recover';
          e.timer = 0.5;
          e.attackCd = T.enemyAttackCooldown;
          e.counter = false;
        }
        break;
      case 'recover':
      case 'stunned':
        e.vx = approach(e.vx, 0, 900 * edt);
        if (e.flying) e.vy = approach(e.vy, 0, 900 * edt);
        if (e.timer <= 0) e.state = 'patrol';
        break;
    }

    if (e.flying) {
      if (e.state === 'patrol' && e.awareness === 'idle') {
        e.bob += edt * 2.4;
        e.vy = (e.spawn.y + Math.sin(e.bob) * 24 - e.y) * 4;
      }
      this.world.move(e, edt);
    } else {
      e.vy = Math.min(e.vy + T.gravity * edt, T.maxFall);
      this.world.move(e, edt);
    }
  }

  private checkEnemyHits(): void {
    const p = this.player;
    if (p.invuln > 0 || p.mode === 'strike' || this.diveTimer > 0) return;
    for (const e of this.enemies) {
      if (e.state !== 'lunge') continue;
      if (!overlaps(p, e)) continue;
      p.hp--;
      p.invuln = 0.9;
      p.hurtFlash = 0.25;
      p.vx = Math.sign(cx(p) - cx(e) || 1) * 380;
      p.vy = -420;
      p.mode = 'normal';
      this.hitstop = 0.05;
      this.shake = 10;
      this.burst(cx(p), cy(p), 10, 0xff5470, 260);
      // player:hurt는 실제 피격에만 보냅니다. hp는 피해 직후 값(0일 수 있음)입니다.
      this.bus.emit('player:hurt', { hp: Math.max(0, p.hp), maxHp: p.maxHp });
      if (p.hp <= 0) p.hp = p.maxHp; // 실험실이므로 바로 회복
      this.bus.emit('player:hp', { hp: p.hp, maxHp: p.maxHp });
      if (this.combo > 0) this.endCombo();
      break;
    }
  }

  private downEnemy(e: Enemy): void {
    e.state = 'down';
    e.timer = T.respawnDelay;
    e.fragment = 0;
    e.lockProgress = 0;
    e.vx = 0;
    e.vy = 0;
    this.bus.emit('enemy:down', { enemyId: e.id });
  }

  // ───────────────────────── 게이지 · 고스트 다이빙 ─────────────────────────

  private addGauge(v: number): void {
    const before = this.gauge;
    this.gauge = Math.min(GAUGE_MAX, this.gauge + v);
    if (this.gauge !== before) this.bus.emit('gauge:change', { value: this.gauge, max: GAUGE_MAX });
    if (before < GAUGE_MAX && this.gauge >= GAUGE_MAX) this.bus.emit('dive:ready', {});
  }

  private tryDive(): void {
    if (this.gauge < GAUGE_MAX || this.diveTimer > 0) return;
    this.diveTimer = 1.4;
    this.diveImpactDone = false;
    this.timeScale = T.diveSlowmo;
    this.player.invuln = 2;
    this.bus.emit('dive:start', {});
  }

  /** 임시 연출: 슬로우 → 화면 안 모든 적 격파 → 복귀. 실시간 기준. */
  private updateDive(realDt: number): void {
    this.diveTimer -= realDt;
    if (!this.diveImpactDone && this.diveTimer <= 0.7) {
      this.diveImpactDone = true;
      let count = 0;
      for (const e of this.enemies) {
        if (e.state === 'down') continue;
        if (Math.abs(cx(e) - cx(this.player)) > 700) continue;
        this.burst(cx(e), cy(e), 24, 0x9b7bd4, 500);
        this.downEnemy(e);
        count++;
      }
      this.gauge = 0;
      this.shake = 20;
      this.hitstop = 0.12;
      this.timeScale = 1;
      this.combo += count;
      this.comboTimer = T.comboTimeout;
      this.emitSound(cx(this.player), cy(this.player), T.soundDive, 'dive');
      this.bus.emit('dive:impact', { count });
      this.bus.emit('gauge:change', { value: 0, max: GAUGE_MAX });
      this.bus.emit('combo:change', { count: this.combo });
    }
    if (this.diveTimer <= 0) {
      this.diveTimer = 0;
      this.timeScale = 1;
      this.bus.emit('dive:end', {});
    }
  }

  // ───────────────────────── 시선 · 인식 · 소리 ─────────────────────────

  private playerEye(): Vec {
    const p = this.player;
    return { x: cx(p) + p.facing * 3, y: p.y + 11 };
  }

  private enemyEye(e: Enemy): Vec {
    return { x: cx(e) + e.dir * 8, y: e.flying ? cy(e) : e.y + 12 };
  }

  /** 마우스(월드 좌표) 또는 오른쪽 스틱으로 시선을 정합니다. 둘 다 없으면 몸이 향한 쪽. */
  private updateGaze(): void {
    const p = this.player;
    const inp = this.input.state;
    const eye = this.playerEye();
    if (inp.aimSource === 'mouse' && this.aimWorld) {
      p.gaze = Math.atan2(this.aimWorld.y - eye.y, this.aimWorld.x - eye.x);
      p.gazeActive = true;
    } else if (inp.aimSource === 'stick') {
      p.gaze = Math.atan2(inp.aimStickY, inp.aimStickX);
      p.gazeActive = true;
    } else {
      p.gaze = p.facing > 0 ? 0 : Math.PI;
      p.gazeActive = false;
    }
  }

  /** 그림용 시선 원뿔. 렌더 프레임마다 한 번. */
  private updateFans(): void {
    const p = this.player;
    const solids = this.world.solids;
    const pe = this.playerEye();
    p.eyeX = pe.x;
    p.eyeY = pe.y;
    p.gazeFan = sightFan(pe, p.gaze, (T.gazeHalfAngle * Math.PI) / 180, T.lockRange, solids, 24);
    for (const e of this.enemies) {
      if (e.state === 'down') {
        e.viewFan = [];
        continue;
      }
      const ee = this.enemyEye(e);
      e.eyeX = ee.x;
      e.eyeY = ee.y;
      e.viewFan = sightFan(ee, e.dir > 0 ? 0 : Math.PI, (T.enemyViewHalfAngle * Math.PI) / 180, T.enemyViewRange, solids, 16);
    }
  }

  /** 적의 시선 판정. 보이면 발각, 놓치면 기억 시간 뒤 확인 → 평상시. */
  private perceive(e: Enemy, dt: number): void {
    const p = this.player;
    const seen =
      this.diveTimer <= 0 &&
      inSight(this.enemyEye(e), e.dir > 0 ? 0 : Math.PI, (T.enemyViewHalfAngle * Math.PI) / 180, T.enemyViewRange, cx(p), cy(p), this.world.solids);
    if (seen) {
      this.alert(e);
      return;
    }
    e.awareTimer -= dt;
    if (e.awareness === 'alert' && e.awareTimer <= 0) {
      e.awareness = 'heard'; // 마지막으로 본 곳을 확인하러 감
      e.awareTimer = T.enemyInvestigateTime;
    } else if (e.awareness === 'heard' && e.awareTimer <= 0) {
      e.awareness = 'idle';
    }
  }

  /** 적이 이단아를 알아챔 (봤거나, 맞았거나, 반격) */
  private alert(e: Enemy): void {
    const p = this.player;
    if (e.awareness !== 'alert') this.notice(e, 'sight');
    e.awareness = 'alert';
    e.awareTimer = T.enemyAlertMemory;
    e.heardX = cx(p);
    e.heardY = cy(p);
  }

  private notice(e: Enemy, cause: 'sound' | 'sight'): void {
    e.markTimer = T.noticeMarkTime;
    e.markKind = cause;
    this.bus.emit('enemy:notice', { enemyId: e.id, cause });
  }

  /** 소리를 냅니다. 벽 너머로는 줄어들고, 범위 안의 적은 확인하러 옵니다. */
  private emitSound(x: number, y: number, radius: number, kind: SoundKind): void {
    if (radius <= 1) return;
    const solids = this.world.solids;
    const wall = T.soundWallFactor;
    // 판정은 화면에 그리는 이 모양으로 합니다 (보이는 범위 = 들리는 범위).
    const shape = soundShape(x, y, radius, wall, solids, SOUND_RAYS);
    this.sounds.push({ x, y, radius, kind, life: T.soundLife, maxLife: T.soundLife, points: shape });
    for (const e of this.enemies) {
      if (e.state === 'down' || e.awareness === 'alert') continue;
      if (!hears(shape, cx(e), cy(e))) continue;
      const wasIdle = e.awareness === 'idle';
      e.awareness = 'heard';
      e.awareTimer = T.enemyInvestigateTime;
      e.heardX = x;
      e.heardY = y;
      if (wasIdle) this.notice(e, 'sound');
    }
  }

  private burst(x: number, y: number, n: number, color: number, speed: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      const life = 0.25 + Math.random() * 0.25;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, maxLife: life, size: 2 + Math.random() * 3, color });
    }
  }
}
