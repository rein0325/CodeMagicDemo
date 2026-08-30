type Listener<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

export interface GameEvents {
  "enemy-hit": { enemyId: string; castId: number; damage: number; hpRemaining: number; x: number; y: number };
  "level-up": { level: number; newMaxMp: number };
  "xp-gain": { amount: number; source: string };
  "player-hurt": { hpRemaining: number };
  "player-defeated": undefined;
  "tutorial-replay": undefined;
  "grimoire-opened": undefined;
  "grimoire-closed": undefined;
  "spell-cast": { slot: number };
  "boss-phase-change": { phase: number };
  "boss-defeated": undefined;
  [key: string]: unknown;
}

export const gameEvents = new EventBus<GameEvents>();
