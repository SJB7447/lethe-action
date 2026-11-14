import type { Rect } from './physics';

/**
 * 시선·소리 계산. 판정과 그림이 같은 함수를 써서, 화면에 보이는 범위 = 실제 판정 범위가 되게 합니다.
 */

export interface Vec {
  x: number;
  y: number;
}

const EPS = 1e-6;

/**
 * (ox, oy)에서 (dx, dy) 방향으로 maxLen까지 나아갈 때 처음 닿는 벽까지의 거리. 없으면 maxLen.
 * - 벽 표면에서 바깥쪽으로 나가는 경우는 막히지 않습니다 (표면에 닿아 있을 뿐 들어가지 않음).
 * - 벽 표면에서 안쪽으로 들어가는 경우는 0입니다.
 * - 시작점이 벽 내부이면 그 벽은 무시합니다.
 */
export function rayDistance(ox: number, oy: number, dx: number, dy: number, maxLen: number, solids: readonly Rect[]): number {
  let best = maxLen;
  for (const s of solids) {
    let tEnter = -Infinity;
    let tExit = Infinity;
    if (Math.abs(dx) < EPS) {
      if (ox <= s.x || ox >= s.x + s.w) continue; // 평행하고 바깥(또는 표면 위)
    } else {
      const t1 = (s.x - ox) / dx;
      const t2 = (s.x + s.w - ox) / dx;
      tEnter = Math.max(tEnter, Math.min(t1, t2));
      tExit = Math.min(tExit, Math.max(t1, t2));
    }
    if (Math.abs(dy) < EPS) {
      if (oy <= s.y || oy >= s.y + s.h) continue;
    } else {
      const t1 = (s.y - oy) / dy;
      const t2 = (s.y + s.h - oy) / dy;
      tEnter = Math.max(tEnter, Math.min(t1, t2));
      tExit = Math.min(tExit, Math.max(t1, t2));
    }
    if (tEnter > tExit) continue; // 빗나감
    if (tExit <= EPS) continue; // 뒤쪽이거나, 표면에서 바깥으로 나가는 중
    if (tEnter < -EPS) continue; // 시작점이 벽 내부
    const hit = Math.max(0, tEnter);
    if (hit < best) best = hit;
  }
  return best;
}

/** 두 점 사이를 벽이 가리지 않는지 */
export function hasLineOfSight(ax: number, ay: number, bx: number, by: number, solids: readonly Rect[]): boolean {
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 1e-6) return true;
  return rayDistance(ax, ay, (bx - ax) / len, (by - ay) / len, len, solids) >= len - 0.5;
}

/** 각도 차이 (-π..π) */
export function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** 시선 원뿔 안에 있고(거리·각도) 벽에 가리지 않았는지 */
export function inSight(
  eye: Vec,
  angle: number,
  halfAngleRad: number,
  range: number,
  tx: number,
  ty: number,
  solids: readonly Rect[],
): boolean {
  const d = Math.hypot(tx - eye.x, ty - eye.y);
  if (d > range) return false;
  if (Math.abs(angleDiff(Math.atan2(ty - eye.y, tx - eye.x), angle)) > halfAngleRad) return false;
  return hasLineOfSight(eye.x, eye.y, tx, ty, solids);
}

/** 시선 원뿔 모양 (벽에서 잘림). 첫 점은 눈 위치. */
export function sightFan(eye: Vec, angle: number, halfAngleRad: number, range: number, solids: readonly Rect[], rays: number): Vec[] {
  const pts: Vec[] = [{ x: eye.x, y: eye.y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngleRad + (2 * halfAngleRad * i) / rays;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = rayDistance(eye.x, eye.y, dx, dy, range, solids);
    pts.push({ x: eye.x + dx * d, y: eye.y + dy * d });
  }
  return pts;
}

/**
 * 소리가 (sx, sy)에서 (tx, ty) 방향으로 닿는 거리.
 * 벽을 만나기 전까지는 그대로, 벽 너머로는 남은 거리 × wallFactor 만큼만 퍼집니다.
 */
export function soundReach(sx: number, sy: number, dx: number, dy: number, radius: number, wallFactor: number, solids: readonly Rect[]): number {
  const hit = rayDistance(sx, sy, dx, dy, radius, solids);
  if (hit >= radius) return radius;
  return hit + (radius - hit) * wallFactor;
}

/** 다각형 안에 점이 있는지 (짝홀 규칙) */
export function pointInPolygon(pts: readonly Vec[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/**
 * 대상이 소리를 듣는지. 화면에 그리는 소리 모양(soundShape)과 같은 다각형으로 판정하므로
 * 보이는 범위 = 들리는 범위입니다.
 */
export function hears(shape: readonly Vec[], tx: number, ty: number): boolean {
  return pointInPolygon(shape, tx, ty);
}

/** 소리 범위 모양 (벽 너머는 줄어듦). 판정(hears)과 같은 규칙. */
export function soundShape(sx: number, sy: number, radius: number, wallFactor: number, solids: readonly Rect[], rays: number): Vec[] {
  const pts: Vec[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (Math.PI * 2 * i) / rays;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = soundReach(sx, sy, dx, dy, radius, wallFactor, solids);
    pts.push({ x: sx + dx * d, y: sy + dy * d });
  }
  return pts;
}
