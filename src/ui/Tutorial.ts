import { eventLog } from "../util/EventLog";
import { gameEvents, GameEvents } from "../state/EventBus";

const STORAGE_KEY = "cmvp_tutorial_done";

type AutoAdvanceEvent = "enemy-hit" | "grimoire-opened";

interface StepConfig {
  getHighlightEl?: () => HTMLElement | null;
  html: string;
  autoAdvanceOn?: AutoAdvanceEvent;
}

export class Tutorial {
  private overlay: HTMLElement;
  private stepIndex = -1;
  private steps: StepConfig[];
  private activeListener?: { event: AutoAdvanceEvent; fn: (payload: GameEvents[AutoAdvanceEvent]) => void };
  private onReplayRequested = () => this.start(true);

  constructor() {
    this.overlay = document.getElementById("tutorial-overlay")!;
    this.steps = [
      { html: "<p>你是初心法師，魔法要靠你自己構築。</p>" },
      {
        getHighlightEl: () => document.getElementById("game-container"),
        html: "<p>使用 <b>WASD</b> 或方向鍵移動，滑鼠瞄準方向。動一下角色，感受看看。</p>",
      },
      {
        getHighlightEl: () => document.getElementById("grimoire-btn"),
        html: "<p>打開你的<b>魔導書</b>——你所有的魔法都會存在這裡。</p>",
        autoAdvanceOn: "grimoire-opened",
      },
      {
        getHighlightEl: () => document.getElementById("grimoire-editor-mount"),
        html: "<p>這是「小火球」，你目前（Lv.1）能寫出的咒語。施法要消耗 <b>MP</b>（法力），咒語越誇張耗得越多；等級越高，能用的參數跟法力上限都會變大。</p>",
      },
      {
        getHighlightEl: () => document.getElementById("grimoire-editor-mount"),
        html: "<p>試著修改 <b>power</b> 這個數字，然後按下方的「建置／測試」看看威力怎麼變化。</p>",
      },
      {
        getHighlightEl: () => document.querySelector('.hotkey-assign-btn[data-slot="1"]'),
        html: "<p>記得先按「儲存咒語」，再把它設為<b>快捷鍵 1</b>，戰鬥中才能用。</p>",
      },
      {
        getHighlightEl: () => document.getElementById("game-container"),
        html: "<p>關閉魔導書，走到假人附近，按 <b>1</b> 施放咒語！</p>",
        autoAdvanceOn: "enemy-hit",
      },
      {
        html: "<p>命中了！你已經開始構築屬於自己的魔法。</p><p>教學結束，剩下的冒險交給你自己了！</p>",
      },
    ];
  }

  maybeAutoStart(): void {
    gameEvents.on("tutorial-replay", this.onReplayRequested);
    if (!localStorage.getItem(STORAGE_KEY)) {
      this.start(false);
    }
  }

  destroy(): void {
    gameEvents.off("tutorial-replay", this.onReplayRequested);
    this.cleanupListener();
  }

  start(force: boolean): void {
    if (!force && localStorage.getItem(STORAGE_KEY)) return;
    this.stepIndex = -1;
    eventLog.log("tutorial_start");
    this.advance();
  }

  private advance(): void {
    this.cleanupListener();
    this.stepIndex += 1;
    if (this.stepIndex > 0) {
      eventLog.log("tutorial_step_complete", { step: this.stepIndex - 1 });
    }
    if (this.stepIndex >= this.steps.length) {
      this.finish(true);
      return;
    }
    this.render();
  }

  private render(): void {
    const step = this.steps[this.stepIndex];
    const highlightEl = step.getHighlightEl?.() ?? null;
    this.overlay.classList.remove("hidden");
    const isLast = this.stepIndex === this.steps.length - 1;

    this.overlay.innerHTML = `
      ${highlightEl ? "" : '<div class="tutorial-mask"></div>'}
      ${highlightEl ? this.renderHighlight(highlightEl) : ""}
      <div class="tutorial-tooltip" id="tutorial-tooltip">
        ${step.html}
        <div class="tutorial-actions">
          <button class="tutorial-skip" id="tutorial-skip-btn">跳過教學</button>
          <button class="tutorial-next" id="tutorial-next-btn">${isLast ? "開始冒險" : "下一步"}</button>
        </div>
      </div>
    `;

    this.positionTooltip(highlightEl);

    document.getElementById("tutorial-next-btn")!.addEventListener("click", () => this.advance());
    document.getElementById("tutorial-skip-btn")!.addEventListener("click", () => this.skip());

    if (step.autoAdvanceOn) {
      const event = step.autoAdvanceOn;
      const fn = () => this.advance();
      gameEvents.on(event, fn);
      this.activeListener = { event, fn };
    }
  }

  private renderHighlight(el: HTMLElement): string {
    const rect = el.getBoundingClientRect();
    return `<div class="tutorial-highlight" style="left:${rect.left - 4}px; top:${rect.top - 4}px; width:${rect.width + 8}px; height:${rect.height + 8}px;"></div>`;
  }

  private positionTooltip(highlightEl?: HTMLElement | null): void {
    const tooltip = document.getElementById("tutorial-tooltip");
    if (!tooltip) return;

    if (!highlightEl) {
      tooltip.style.left = "50%";
      tooltip.style.top = "50%";
      tooltip.style.transform = "translate(-50%, -50%)";
      return;
    }

    const rect = highlightEl.getBoundingClientRect();
    tooltip.style.left = `${Math.min(rect.left, window.innerWidth - 340)}px`;
    tooltip.style.top = `${Math.min(rect.bottom + 12, window.innerHeight - 160)}px`;
  }

  private skip(): void {
    eventLog.log("tutorial_skip", { step: this.stepIndex });
    this.finish(false);
  }

  private finish(completed: boolean): void {
    this.cleanupListener();
    this.overlay.classList.add("hidden");
    this.overlay.innerHTML = "";
    localStorage.setItem(STORAGE_KEY, "1");
    if (completed) {
      eventLog.log("tutorial_complete");
    }
  }

  private cleanupListener(): void {
    if (this.activeListener) {
      gameEvents.off(this.activeListener.event, this.activeListener.fn);
      this.activeListener = undefined;
    }
  }
}
