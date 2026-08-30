import { gameEvents } from "./EventBus";
import { eventLog } from "../util/EventLog";

export const MAX_LEVEL = 5;
export const MAX_HP = 100;
export const MP_REGEN_PER_SEC = 8;

const XP_THRESHOLDS = [30, 60, 90, 120];
const MAX_MP_BY_LEVEL = [45, 60, 75, 90, 110];

const STORAGE_KEY = "cmvp_progress";

class PlayerProgressStore {
  level = 1;
  xp = 0;
  maxMp = MAX_MP_BY_LEVEL[0];
  mp = MAX_MP_BY_LEVEL[0];
  hp = MAX_HP;
  maxHp = MAX_HP;

  constructor() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as
      | { level: number; xp: number }
      | null;
    if (saved) {
      this.level = saved.level;
      this.xp = saved.xp;
    }
    this.maxMp = MAX_MP_BY_LEVEL[this.level - 1];
    this.mp = this.maxMp;
  }

  xpToNextLevel(): number | null {
    return this.level < MAX_LEVEL ? XP_THRESHOLDS[this.level - 1] : null;
  }

  gainXp(amount: number, source: string): void {
    if (this.level >= MAX_LEVEL) return;

    this.xp += amount;
    gameEvents.emit("xp-gain", { amount, source });
    eventLog.log("xp_gain", { amount, source });

    while (this.level < MAX_LEVEL && this.xp >= XP_THRESHOLDS[this.level - 1]) {
      this.xp -= XP_THRESHOLDS[this.level - 1];
      this.level += 1;
      this.maxMp = MAX_MP_BY_LEVEL[this.level - 1];
      this.mp = this.maxMp;
      gameEvents.emit("level-up", { level: this.level, newMaxMp: this.maxMp });
      eventLog.log("level_up", { level: this.level, newMaxMp: this.maxMp });
    }

    this.save();
  }

  canAfford(cost: number): boolean {
    return this.mp >= cost;
  }

  spendMp(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.mp -= cost;
    return true;
  }

  regenMp(deltaSeconds: number): void {
    this.mp = Math.min(this.maxMp, this.mp + MP_REGEN_PER_SEC * deltaSeconds);
  }

  takeDamage(amount: number): void {
    if (this.hp <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    gameEvents.emit("player-hurt", { hpRemaining: this.hp });
    if (this.hp <= 0) {
      gameEvents.emit("player-defeated", undefined);
    }
  }

  heal(): void {
    this.hp = this.maxHp;
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ level: this.level, xp: this.xp }));
  }
}

export const PlayerProgress = new PlayerProgressStore();
