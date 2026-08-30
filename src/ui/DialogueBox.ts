export class DialogueBox {
  private lines: string[] = [];
  private index = 0;
  private speakerName = "";
  private onAdvanceClick = () => this.advance();

  constructor(private container: HTMLElement) {}

  open(speakerName: string, lines: string[]): void {
    this.speakerName = speakerName;
    this.lines = lines;
    this.index = 0;
    this.container.classList.remove("hidden");
    this.render();
  }

  advance(): void {
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.close();
      return;
    }
    this.render();
  }

  isOpen(): boolean {
    return !this.container.classList.contains("hidden");
  }

  close(): void {
    this.container.classList.add("hidden");
    this.container.innerHTML = "";
  }

  private render(): void {
    this.container.innerHTML = `
      <div id="dialogue-name">${this.escapeHtml(this.speakerName)}</div>
      <div id="dialogue-text">${this.escapeHtml(this.lines[this.index])}</div>
      <div id="dialogue-hint">按 E／點擊繼續</div>
    `;
    this.container.removeEventListener("click", this.onAdvanceClick);
    this.container.addEventListener("click", this.onAdvanceClick, { once: true });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
