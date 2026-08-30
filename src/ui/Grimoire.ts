import { SpellEditor } from "./SpellEditor";
import { SpellPreview } from "./SpellPreview";
import { SpellStorage } from "../state/SpellStorage";
import { SpellLoadout } from "../state/SpellLoadout";
import { parseSpell } from "../spell/parser/SpellParser";
import { calculateManaCost } from "../spell/manaCost";
import { DEFAULT_SPELL_SOURCE } from "../spell/SpellData";
import { gameEvents } from "../state/EventBus";
import { sfx } from "../util/Sfx";
import { eventLog } from "../util/EventLog";

export class Grimoire {
  private overlay: HTMLElement;
  private editor?: SpellEditor;
  private preview?: SpellPreview;
  private selectedId: string | null = null;
  private isOpen = false;
  private buildCount = 0;
  private hadFirstSuccess = false;

  constructor(overlay: HTMLElement) {
    this.overlay = overlay;
  }

  open(): void {
    this.isOpen = true;
    this.overlay.classList.remove("hidden");
    this.render();
    gameEvents.emit("grimoire-opened", undefined);
  }

  close(): void {
    this.isOpen = false;
    this.overlay.classList.add("hidden");
    gameEvents.emit("grimoire-closed", undefined);
  }

  isOpened(): boolean {
    return this.isOpen;
  }

  private render(): void {
    this.overlay.innerHTML = `
      <div id="grimoire-panel">
        <div id="grimoire-header">
          <h2>📖 魔導書</h2>
          <button id="grimoire-close-btn">✕</button>
        </div>
        <div id="grimoire-body">
          <div id="grimoire-list">
            <button id="grimoire-new-btn">＋ 新增咒語</button>
            <div id="grimoire-spell-cards"></div>
          </div>
          <div id="grimoire-detail">
            <input id="grimoire-name-input" type="text" placeholder="咒語名稱" />
            <div id="grimoire-editor-mount"></div>
            <div id="grimoire-preview" class="hidden">
              <div id="preview-circle"></div>
              <div id="preview-fireball"></div>
            </div>
            <div id="grimoire-actions">
              <button id="grimoire-build-btn">建置／測試</button>
              <button id="grimoire-save-btn">儲存咒語</button>
              <button id="grimoire-delete-btn">刪除</button>
            </div>
            <div id="grimoire-status"></div>
            <pre id="grimoire-error" class="hidden"></pre>
            <div id="grimoire-hotkeys">
              <span>設為快捷鍵：</span>
              <button class="hotkey-assign-btn" data-slot="1">1</button>
              <button class="hotkey-assign-btn" data-slot="2">2</button>
              <button class="hotkey-assign-btn" data-slot="3">3</button>
              <button class="hotkey-assign-btn" data-slot="4">4</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("grimoire-close-btn")!.addEventListener("click", () => this.close());
    document.getElementById("grimoire-new-btn")!.addEventListener("click", () => this.selectNew());
    document.getElementById("grimoire-build-btn")!.addEventListener("click", () => this.build());
    document.getElementById("grimoire-save-btn")!.addEventListener("click", () => this.save());
    document.getElementById("grimoire-delete-btn")!.addEventListener("click", () => this.delete());
    document.querySelectorAll(".hotkey-assign-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = Number((btn as HTMLElement).dataset.slot);
        this.assignHotkey(slot);
      });
    });

    this.preview = new SpellPreview(document.getElementById("grimoire-preview")!);
    this.renderList();

    const spells = SpellStorage.list();
    if (this.selectedId && spells.some((s) => s.id === this.selectedId)) {
      this.selectSpell(this.selectedId);
    } else if (spells.length > 0) {
      this.selectSpell(spells[0].id);
    } else {
      this.selectNew();
    }
  }

  private renderList(): void {
    const container = document.getElementById("grimoire-spell-cards")!;
    const spells = SpellStorage.list();
    container.innerHTML = spells
      .map(
        (s) => `
          <div class="grimoire-card ${s.id === this.selectedId ? "active" : ""}" data-id="${s.id}">
            <div class="grimoire-card-name">${this.escapeHtml(s.name)}</div>
            <div class="grimoire-card-code">${this.escapeHtml(s.source.replace(/\s+/g, " ").slice(0, 40))}</div>
          </div>
        `
      )
      .join("");

    container.querySelectorAll(".grimoire-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.selectSpell((card as HTMLElement).dataset.id!);
      });
    });
  }

  private selectSpell(id: string): void {
    const spell = SpellStorage.get(id);
    if (!spell) return;
    this.selectedId = id;
    (document.getElementById("grimoire-name-input") as HTMLInputElement).value = spell.name;
    this.mountEditor(spell.source);
    this.updateStatus("");
    this.highlightSelectedCard();
    this.updateHotkeyButtons();
  }

  private selectNew(): void {
    this.selectedId = null;
    (document.getElementById("grimoire-name-input") as HTMLInputElement).value = "";
    this.mountEditor(DEFAULT_SPELL_SOURCE);
    this.updateStatus("");
    this.highlightSelectedCard();
    this.updateHotkeyButtons();
  }

  private mountEditor(source: string): void {
    const mount = document.getElementById("grimoire-editor-mount")!;
    mount.innerHTML = "";
    this.editor = new SpellEditor(mount, source);
  }

  private highlightSelectedCard(): void {
    document.querySelectorAll(".grimoire-card").forEach((card) => {
      card.classList.toggle("active", (card as HTMLElement).dataset.id === this.selectedId);
    });
  }

  private build(): boolean {
    const code = this.editor!.getCode();
    const result = parseSpell(code);
    const errorPanel = document.getElementById("grimoire-error")!;

    this.buildCount += 1;
    eventLog.logOnce("first_build", "first_build");
    eventLog.log("build_count", { count: this.buildCount, success: result.ok });

    if (result.ok) {
      this.updateStatus(`✅ 咒語就緒（預估耗魔 ${calculateManaCost(result.data)} MP）`, false);
      errorPanel.classList.add("hidden");
      errorPanel.textContent = "";
      sfx.buildSuccess();
      this.preview!.play(result.data);
      if (!this.hadFirstSuccess) {
        this.hadFirstSuccess = true;
        eventLog.log("first_success");
      }
      return true;
    }

    this.updateStatus("建置失敗", true);
    const { message, hint, line } = result.error;
    errorPanel.textContent = [line !== undefined ? `第 ${line} 行：` : undefined, message, hint]
      .filter(Boolean)
      .join("\n");
    errorPanel.classList.remove("hidden");
    sfx.buildFail();
    return false;
  }

  private save(): void {
    const ok = this.build();
    if (!ok) return;

    const nameInput = document.getElementById("grimoire-name-input") as HTMLInputElement;
    const name = nameInput.value.trim() || "未命名咒語";
    const source = this.editor!.getCode();

    if (this.selectedId) {
      SpellStorage.update(this.selectedId, { name, source });
    } else {
      const spell = SpellStorage.create(name, source);
      this.selectedId = spell.id;
    }

    this.renderList();
    this.highlightSelectedCard();
    this.updateStatus("✅ 咒語已儲存", false);
  }

  private delete(): void {
    if (!this.selectedId) return;
    const id = this.selectedId;
    SpellStorage.remove(id);
    for (let slot = 1; slot <= 4; slot++) {
      if (SpellLoadout.getSlotSpellId(slot) === id) SpellLoadout.clear(slot);
    }
    this.selectedId = null;
    this.renderList();
    const remaining = SpellStorage.list();
    if (remaining.length > 0) this.selectSpell(remaining[0].id);
    else this.selectNew();
  }

  private assignHotkey(slot: number): void {
    if (!this.selectedId) {
      this.updateStatus("請先儲存咒語，才能設定快捷鍵", true);
      return;
    }
    SpellLoadout.assign(slot, this.selectedId);
    this.updateHotkeyButtons();
    this.updateStatus(`已設為快捷鍵 ${slot}`, false);
  }

  private updateHotkeyButtons(): void {
    document.querySelectorAll<HTMLButtonElement>(".hotkey-assign-btn").forEach((btn) => {
      const slot = Number(btn.dataset.slot);
      const assignedId = SpellLoadout.getSlotSpellId(slot);
      btn.classList.toggle("assigned", assignedId === this.selectedId && !!this.selectedId);
    });
  }

  private updateStatus(text: string, isError = false): void {
    const status = document.getElementById("grimoire-status")!;
    status.textContent = text;
    status.classList.toggle("error", isError);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
