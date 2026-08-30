import { SpellStorage } from "./SpellStorage";
import { eventLog } from "../util/EventLog";

const STORAGE_KEY = "cmvp_loadout";
const SLOT_COUNT = 4;

class SpellLoadoutStore {
  private slots: (string | null)[];
  private lastCastAt: number[] = [0, 0, 0, 0];

  constructor() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      this.slots = JSON.parse(raw);
    } else {
      this.slots = new Array(SLOT_COUNT).fill(null);
      const starter = SpellStorage.list()[0];
      if (starter) this.slots[0] = starter.id;
      this.persist();
    }
  }

  getSlotSpellId(slot: number): string | null {
    return this.slots[slot - 1] ?? null;
  }

  assign(slot: number, spellId: string): void {
    this.slots[slot - 1] = spellId;
    this.persist();
    eventLog.log("hotkey_assigned", { slot, spellId });
  }

  clear(slot: number): void {
    this.slots[slot - 1] = null;
    this.persist();
  }

  getCooldownRemainingMs(slot: number, cooldownMs: number): number {
    const elapsed = performance.now() - this.lastCastAt[slot - 1];
    return Math.max(0, cooldownMs - elapsed);
  }

  startCooldown(slot: number): void {
    this.lastCastAt[slot - 1] = performance.now();
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slots));
  }
}

export const SpellLoadout = new SpellLoadoutStore();
