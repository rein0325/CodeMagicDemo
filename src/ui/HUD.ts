import { eventLog } from "../util/EventLog";
import { PlayerProgress, MAX_LEVEL } from "../state/PlayerProgress";
import { gameEvents } from "../state/EventBus";
import { sfx } from "../util/Sfx";
import { HotkeyBar } from "./HotkeyBar";

const LEVEL_UNLOCK_MESSAGE: Record<number, string> = {
  2: "解鎖 speed，試著讓火球飛更快！",
  3: "解鎖 count，試著一次射出好幾顆！",
  4: "解鎖 angle／range，試著讓火球飛得更廣更遠！",
  5: "所有參數都解鎖了，法力上限也來到新高！",
};

export class HUD {
  private xpFill: HTMLElement;
  private xpText: HTMLElement;
  private mpFill: HTMLElement;
  private mpText: HTMLElement;
  private hpFill: HTMLElement;
  private hpText: HTMLElement;
  private levelText: HTMLElement;
  private hotkeyBar: HotkeyBar;

  constructor(
    private mountEl: HTMLElement,
    private onTutorialReplay: () => void,
    private onOpenGrimoire: () => void
  ) {
    this.mountEl.innerHTML = `
      <div id="hud-top">
        <div id="hud-title">CODE DUNGEON — DEMO v0.1</div>
        <div id="hud-buttons">
          <button id="grimoire-btn" title="魔導書">📖</button>
          <button id="tutorial-btn" title="重看教學">？</button>
          <button id="export-data-btn">匯出測試資料</button>
          <button id="reset-progress-btn" title="清除進度，重新開始">🔄 重新開始</button>
        </div>
      </div>
      <div id="hud-level">Lv.1 法師</div>
      <div class="hud-bar-row">
        <span class="hud-bar-label">XP</span>
        <div class="hud-bar-track"><div id="xp-bar-fill" class="hud-bar-fill xp"></div></div>
        <span id="xp-bar-text" class="hud-bar-text"></span>
      </div>
      <div class="hud-bar-row">
        <span class="hud-bar-label">MP</span>
        <div class="hud-bar-track"><div id="mp-bar-fill" class="hud-bar-fill mp"></div></div>
        <span id="mp-bar-text" class="hud-bar-text"></span>
      </div>
      <div class="hud-bar-row">
        <span class="hud-bar-label">HP</span>
        <div class="hud-bar-track"><div id="hp-bar-fill" class="hud-bar-fill hp"></div></div>
        <span id="hp-bar-text" class="hud-bar-text"></span>
      </div>
      <div id="hotkey-bar"></div>
    `;

    this.levelText = document.getElementById("hud-level")!;
    this.xpFill = document.getElementById("xp-bar-fill")!;
    this.xpText = document.getElementById("xp-bar-text")!;
    this.mpFill = document.getElementById("mp-bar-fill")!;
    this.mpText = document.getElementById("mp-bar-text")!;
    this.hpFill = document.getElementById("hp-bar-fill")!;
    this.hpText = document.getElementById("hp-bar-text")!;
    this.hotkeyBar = new HotkeyBar(document.getElementById("hotkey-bar")!);

    document.getElementById("export-data-btn")!.addEventListener("click", () => this.exportData());
    document.getElementById("tutorial-btn")!.addEventListener("click", () => this.onTutorialReplay());
    document.getElementById("grimoire-btn")!.addEventListener("click", () => this.onOpenGrimoire());
    document.getElementById("reset-progress-btn")!.addEventListener("click", () => this.resetProgress());

    gameEvents.on("level-up", (payload) => this.showLevelUpToast(payload.level, payload.newMaxMp));

    this.refresh();
  }

  refresh(): void {
    this.levelText.textContent = `Lv.${PlayerProgress.level} 法師`;

    const xpNext = PlayerProgress.xpToNextLevel();
    if (xpNext === null) {
      this.xpFill.style.width = "100%";
      this.xpText.textContent = "MAX";
    } else {
      this.xpFill.style.width = `${(PlayerProgress.xp / xpNext) * 100}%`;
      this.xpText.textContent = `${PlayerProgress.xp}/${xpNext}`;
    }

    this.mpFill.style.width = `${(PlayerProgress.mp / PlayerProgress.maxMp) * 100}%`;
    this.mpText.textContent = `${Math.floor(PlayerProgress.mp)}/${PlayerProgress.maxMp}`;

    this.hpFill.style.width = `${(PlayerProgress.hp / PlayerProgress.maxHp) * 100}%`;
    this.hpText.textContent = `${PlayerProgress.hp}/${PlayerProgress.maxHp}`;

    this.hotkeyBar.refresh();
  }

  private showLevelUpToast(level: number, newMaxMp: number): void {
    const container = document.getElementById("toast-container");
    if (!container) return;

    sfx.challengeComplete();

    const toast = document.createElement("div");
    toast.className = "level-up-toast";
    const unlockMsg = LEVEL_UNLOCK_MESSAGE[level] ?? "";
    const maxSuffix = level >= MAX_LEVEL ? "" : `（法力上限 ${newMaxMp}）`;
    toast.textContent = `升級了！Lv.${level} 法師 —— ${unlockMsg}${maxSuffix}`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  private resetProgress(): void {
    const confirmed = window.confirm(
      "確定要清除所有進度重新開始嗎？\n（等級、咒語、快捷鍵、教學狀態、行為紀錄都會被清除，且無法復原）"
    );
    if (!confirmed) return;

    const keys = [
      "cmvp_progress",
      "cmvp_spells",
      "cmvp_loadout",
      "cmvp_tutorial_done",
      "cmvp_survey",
      "cmvp_events",
      "cmvp_flags",
    ];
    for (const key of keys) localStorage.removeItem(key);

    window.location.reload();
  }

  private exportData(): void {
    const blob = new Blob([eventLog.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cmvp_events.json";
    a.click();
    URL.revokeObjectURL(url);
  }
}
