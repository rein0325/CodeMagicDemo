import { SpellLoadout } from "../state/SpellLoadout";
import { SpellStorage } from "../state/SpellStorage";
import { PlayerProgress } from "../state/PlayerProgress";
import { parseSpell } from "../spell/parser/SpellParser";
import { calculateManaCost, calculateCooldownMs } from "../spell/manaCost";

const SLOT_COUNT = 4;

export class HotkeyBar {
  constructor(private mountEl: HTMLElement) {
    this.mountEl.innerHTML = Array.from({ length: SLOT_COUNT }, (_, i) => this.slotHtml(i + 1)).join("");
  }

  private slotHtml(slot: number): string {
    return `
      <div class="hotkey-slot" id="hotkey-slot-${slot}">
        <div class="hotkey-key">${slot}</div>
        <div class="hotkey-icon">🔥</div>
        <div class="hotkey-name">空</div>
        <div class="hotkey-mp"></div>
        <div class="hotkey-cooldown-overlay"></div>
      </div>
    `;
  }

  refresh(): void {
    for (let slot = 1; slot <= SLOT_COUNT; slot++) {
      const el = document.getElementById(`hotkey-slot-${slot}`);
      if (!el) continue;

      const nameEl = el.querySelector(".hotkey-name") as HTMLElement;
      const mpEl = el.querySelector(".hotkey-mp") as HTMLElement;
      const cooldownEl = el.querySelector(".hotkey-cooldown-overlay") as HTMLElement;

      const spellId = SpellLoadout.getSlotSpellId(slot);
      const saved = spellId ? SpellStorage.get(spellId) : undefined;

      if (!saved) {
        nameEl.textContent = "空";
        mpEl.textContent = "";
        cooldownEl.style.height = "0%";
        el.classList.remove("unaffordable");
        continue;
      }

      nameEl.textContent = saved.name;

      const result = parseSpell(saved.source);
      if (!result.ok) {
        mpEl.textContent = "錯誤";
        el.classList.add("unaffordable");
        continue;
      }

      const cost = calculateManaCost(result.data);
      const cooldownMs = calculateCooldownMs(result.data);
      const remaining = SpellLoadout.getCooldownRemainingMs(slot, cooldownMs);

      mpEl.textContent = `${cost} MP`;
      cooldownEl.style.height = cooldownMs > 0 ? `${(remaining / cooldownMs) * 100}%` : "0%";
      el.classList.toggle("unaffordable", !PlayerProgress.canAfford(cost) || remaining > 0);
    }
  }
}
