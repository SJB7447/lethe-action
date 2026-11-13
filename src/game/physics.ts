/** 단순 AABB 충돌. x, y는 왼쪽 위 좌표. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Body extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
  wallDir: -1 | 0 | 1;
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function cx(r: Rect): number {
  return r.x + r.w / 2;
}
export function cy(r: Rect): number {
  return r.y + r.h / 2;
}

export class World {
  readonly solids: Rect[] = [];
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  /** 축을 나눠서 이동하고 충돌을 해결합니다. */
  move(b: Body, dt: number): void {
    b.onGround = false;

    b.x += b.vx * dt;
    for (const s of this.solids) {
      if (!overlaps(b, s)) continue;
      if (b.vx > 0) b.x = s.x - b.w;
      else if (b.vx < 0) b.x = s.x + s.w;
      b.vx = 0;
    }

    b.y += b.vy * dt;
    for (const s of this.solids) {
      if (!overlaps(b, s)) continue;
      if (b.vy > 0) {
        b.y = s.y - b.h;
        b.onGround = true;
      } else if (b.vy < 0) {
        b.y = s.y + s.h;
      }
      b.vy = 0;
    }

    // 바닥 위에 서 있으면 vy=0이어도 접지로 처리
    if (!b.onGround && b.vy >= 0 && this.hits({ x: b.x, y: b.y + b.h, w: b.w, h: 1 })) b.onGround = true;

    b.wallDir = 0;
    const probeY = b.y + 4;
    const probeH = b.h - 8;
    if (this.hits({ x: b.x - 2, y: probeY, w: 2, h: probeH })) b.wallDir = -1;
    else if (this.hits({ x: b.x + b.w, y: probeY, w: 2, h: probeH })) b.wallDir = 1;
  }

  hits(r: Rect): boolean {
    for (const s of this.solids) if (overlaps(r, s)) return true;
    return false;
  }

  /** 벽 속에 박혔을 때 가장 짧은 방향으로 밀어냅니다. */
  depenetrate(b: Body): void {
    for (let i = 0; i < 4; i++) {
      let moved = false;
      for (const s of this.solids) {
        if (!overlaps(b, s)) continue;
        const pushes = [
          { dx: s.x - (b.x + b.w), dy: 0 },
          { dx: s.x + s.w - b.x, dy: 0 },
          { dx: 0, dy: s.y - (b.y + b.h) },
          { dx: 0, dy: s.y + s.h - b.y },
        ];
        pushes.sort((p, q) => Math.abs(p.dx) + Math.abs(p.dy) - (Math.abs(q.dx) + Math.abs(q.dy)));
        b.x += pushes[0].dx;
        b.y += pushes[0].dy;
        moved = true;
      }
      if (!moved) break;
    }
    b.x = Math.max(0, Math.min(this.width - b.w, b.x));
    b.y = Math.max(-200, Math.min(this.height - b.h, b.y));
  }
}

export function approach(v: number, target: number, step: number): number {
  return v < target ? Math.min(v + step, target) : Math.max(v - step, target);
}
