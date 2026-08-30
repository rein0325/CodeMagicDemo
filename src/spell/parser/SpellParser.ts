import {
  DEFAULT_SPELL,
  PARAM_DESCRIPTIONS,
  PARAM_NAMES,
  PARAM_RANGES,
  PARAM_UNLOCK_LEVEL,
  SpellData,
  SpellParam,
} from "../SpellData";
import { suggestClosest } from "./levenshtein";
import { PlayerProgress } from "../../state/PlayerProgress";
import { eventLog } from "../../util/EventLog";

export interface SpellError {
  message: string;
  hint?: string;
  line?: number;
}

export type ParseResult = { ok: true; data: SpellData } | { ok: false; error: SpellError };

function lineNumberAt(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

export function parseSpell(source: string): ParseResult {
  const trimmed = source.trim();
  const callMatch = /Fireball\s*\(([\s\S]*)\)\s*$/m.exec(trimmed);

  if (!callMatch) {
    return {
      ok: false,
      error: {
        message: "❌ 找不到 Fireball(...) 咒語",
        hint: "💡 試試看：Fireball(power=20)",
      },
    };
  }

  const body = callMatch[1];
  const bodyOffset = trimmed.indexOf(body);
  const pairRe = /([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)/g;
  const found: Partial<Record<SpellParam, number>> = {};

  let match: RegExpExecArray | null;
  while ((match = pairRe.exec(body))) {
    const key = match[1];
    const value = parseFloat(match[2]);
    const line = lineNumberAt(trimmed, bodyOffset + match.index);

    if (!PARAM_NAMES.includes(key as SpellParam)) {
      const suggestion = suggestClosest(key, PARAM_NAMES);
      return {
        ok: false,
        error: {
          message: `❌ 未知參數：${key}`,
          hint: suggestion
            ? `💡 你是不是想使用 ${suggestion}？${suggestion} 可以${PARAM_DESCRIPTIONS[suggestion]}。`
            : undefined,
          line,
        },
      };
    }

    const param = key as SpellParam;
    const unlockLevel = PARAM_UNLOCK_LEVEL[param];
    if (PlayerProgress.level < unlockLevel) {
      eventLog.log("param_locked_error", { param, level: PlayerProgress.level, unlockLevel });
      return {
        ok: false,
        error: {
          message: `❌ 尚未解鎖：${param}`,
          hint: `💡 ${param} 可以${PARAM_DESCRIPTIONS[param]}，達到 Lv.${unlockLevel} 就能使用（你目前是 Lv.${PlayerProgress.level}）。`,
          line,
        },
      };
    }

    const range = PARAM_RANGES[param];
    if (value < range.min || value > range.max) {
      return {
        ok: false,
        error: {
          message: `❌ ${param} 數值超出範圍（${range.min}～${range.max}）`,
          hint: `💡 ${param} 可以${PARAM_DESCRIPTIONS[param]}，試著調整看看。`,
          line,
        },
      };
    }

    found[param] = value;
  }

  const data: SpellData = { ...DEFAULT_SPELL, ...found, type: "Fireball" };
  return { ok: true, data };
}
