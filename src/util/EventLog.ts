export type EventName =
  | "session_start"
  | "first_build"
  | "build_count"
  | "first_success"
  | "session_end"
  | "xp_gain"
  | "level_up"
  | "tutorial_start"
  | "tutorial_step_complete"
  | "tutorial_skip"
  | "tutorial_complete"
  | "spell_created"
  | "spell_updated"
  | "spell_deleted"
  | "hotkey_assigned"
  | "spell_cast"
  | "param_locked_error"
  | "monster_killed"
  | "player_died"
  | "scene_entered"
  | "npc_talk"
  | "boss_attempt_start"
  | "boss_phase_change"
  | "boss_spell_switch"
  | "boss_defeated"
  | "demo_complete"
  | "survey_submitted";

interface LogEntry {
  name: EventName;
  data?: Record<string, unknown>;
  ts: number;
}

class EventLog {
  private storageKey = "cmvp_events";
  private flagsKey = "cmvp_flags";

  log(name: EventName, data?: Record<string, unknown>): void {
    const all = this.getAll();
    all.push({ name, data, ts: Date.now() });
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  }

  logOnce(name: EventName, flag: string, data?: Record<string, unknown>): void {
    const flags = JSON.parse(localStorage.getItem(this.flagsKey) ?? "{}");
    if (!flags[flag]) {
      flags[flag] = true;
      localStorage.setItem(this.flagsKey, JSON.stringify(flags));
      this.log(name, data);
    }
  }

  getAll(): LogEntry[] {
    return JSON.parse(localStorage.getItem(this.storageKey) ?? "[]");
  }

  exportJson(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }
}

export const eventLog = new EventLog();
