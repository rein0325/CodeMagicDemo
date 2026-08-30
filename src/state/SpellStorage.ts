import { STARTER_SPELL_NAME, STARTER_SPELL_SOURCE } from "../spell/SpellData";
import { eventLog } from "../util/EventLog";

export interface SavedSpell {
  id: string;
  name: string;
  source: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "cmvp_spells";

class SpellStorageStore {
  private spells: SavedSpell[];

  constructor() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      this.spells = JSON.parse(raw);
    } else {
      const starter: SavedSpell = {
        id: this.generateId(),
        name: STARTER_SPELL_NAME,
        source: STARTER_SPELL_SOURCE,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.spells = [starter];
      this.persist();
    }
  }

  list(): SavedSpell[] {
    return [...this.spells];
  }

  get(id: string): SavedSpell | undefined {
    return this.spells.find((s) => s.id === id);
  }

  create(name: string, source: string): SavedSpell {
    const spell: SavedSpell = {
      id: this.generateId(),
      name,
      source,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.spells.push(spell);
    this.persist();
    eventLog.log("spell_created", { id: spell.id, name });
    return spell;
  }

  update(id: string, patch: { name?: string; source?: string }): void {
    const spell = this.get(id);
    if (!spell) return;
    if (patch.name !== undefined) spell.name = patch.name;
    if (patch.source !== undefined) spell.source = patch.source;
    spell.updatedAt = Date.now();
    this.persist();
    eventLog.log("spell_updated", { id });
  }

  remove(id: string): void {
    this.spells = this.spells.filter((s) => s.id !== id);
    this.persist();
    eventLog.log("spell_deleted", { id });
  }

  private generateId(): string {
    return `spell-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.spells));
  }
}

export const SpellStorage = new SpellStorageStore();
