/**
 * 게임 로직 ↔ 효과음·UI 사이의 유일한 연결 통로.
 * 이벤트를 추가·변경하면 docs/EVENTS.md도 함께 갱신합니다.
 */
export interface GameEventMap {
  'player:jump': { wall: boolean };
  'player:land': { impact: number };
  'player:dash': { perfect: boolean };
  'player:hurt': { hp: number; maxHp: number };
  'needle:fire': Record<string, never>;
  'needle:hit': { enemyId: number; killed: boolean };
  'lock:progress': { enemyId: number; progress: number };
  'lock:complete': { enemyId: number };
  'fragment:open': { enemyId: number; window: number; chained: boolean };
  'fragment:close': { enemyId: number; missed: boolean };
  'strike:start': { enemyId: number; chain: number };
  'strike:hit': { enemyId: number; chain: number };
  'enemy:telegraph': { enemyId: number; counter: boolean };
  'enemy:down': { enemyId: number };
  'combo:change': { count: number };
  'combo:end': { total: number };
  'gauge:change': { value: number; max: number };
  'dive:ready': Record<string, never>;
  'dive:start': Record<string, never>;
  'dive:impact': { count: number };
  'dive:end': Record<string, never>;
  'mode:change': { assist: boolean };
  'room:reset': Record<string, never>;
}

export type GameEventName = keyof GameEventMap;
type Handler<K extends GameEventName> = (payload: GameEventMap[K]) => void;

export class EventBus {
  private handlers = new Map<GameEventName, Set<Handler<GameEventName>>>();

  on<K extends GameEventName>(name: K, fn: Handler<K>): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(fn as Handler<GameEventName>);
    return () => set.delete(fn as Handler<GameEventName>);
  }

  emit<K extends GameEventName>(name: K, payload: GameEventMap[K]): void {
    const set = this.handlers.get(name);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[event ${name}]`, err);
      }
    }
  }
}
