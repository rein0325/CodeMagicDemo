export interface SpellData {
  type: "Fireball";
  power: number;
  speed: number;
  size: number;
  count: number;
  angle: number;
  range: number;
}

export type SpellParam = Exclude<keyof SpellData, "type">;

export interface ParamRange {
  min: number;
  max: number;
  default: number;
}

export const PARAM_RANGES: Record<SpellParam, ParamRange> = {
  power: { min: 1, max: 100, default: 50 },
  speed: { min: 1, max: 30, default: 12 },
  size: { min: 1, max: 5, default: 2 },
  count: { min: 1, max: 10, default: 5 },
  angle: { min: 0, max: 180, default: 30 },
  range: { min: 1, max: 50, default: 20 },
};

export const PARAM_NAMES = Object.keys(PARAM_RANGES) as SpellParam[];

export const PARAM_UNLOCK_LEVEL: Record<SpellParam, number> = {
  power: 1,
  size: 1,
  speed: 2,
  count: 3,
  angle: 4,
  range: 4,
};

export const PARAM_DESCRIPTIONS: Record<SpellParam, string> = {
  power: "控制魔法的傷害",
  size: "控制火球的大小",
  speed: "控制魔法飛行的速度",
  count: "控制一次發射幾顆",
  angle: "控制多顆時的散開角度",
  range: "控制魔法能飛多遠",
};

export const DEFAULT_SPELL: SpellData = {
  type: "Fireball",
  power: PARAM_RANGES.power.default,
  speed: PARAM_RANGES.speed.default,
  size: PARAM_RANGES.size.default,
  count: PARAM_RANGES.count.default,
  angle: PARAM_RANGES.angle.default,
  range: PARAM_RANGES.range.default,
};

export const DEFAULT_SPELL_SOURCE = `Fireball(
  power = 20,
  size = 2
)`;

export const STARTER_SPELL_NAME = "小火球";
export const STARTER_SPELL_SOURCE = `Fireball(
  power = 20
)`;
