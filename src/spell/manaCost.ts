import { SpellData } from "./SpellData";

export function calculateManaCost(spell: SpellData): number {
  const cost =
    3 +
    spell.power * 0.1 +
    spell.speed * 0.15 +
    spell.size * spell.size * 2 +
    spell.count * spell.count * 0.6 +
    spell.angle * 0.02 +
    spell.range * 0.1;

  return Math.round(cost);
}

export function calculateCooldownMs(spell: SpellData): number {
  return calculateManaCost(spell) * 25;
}
