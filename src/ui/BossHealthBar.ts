export class BossHealthBar {
  constructor(private container: HTMLElement) {}

  show(name: string): void {
    this.container.innerHTML = `
      <div id="boss-name">${name}</div>
      <div id="boss-bar-track"><div id="boss-bar-fill"></div></div>
    `;
    this.container.classList.remove("hidden");
  }

  setRatio(hp: number, maxHp: number): void {
    const fill = document.getElementById("boss-bar-fill");
    if (!fill) return;
    fill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
  }

  hide(): void {
    this.container.classList.add("hidden");
    this.container.innerHTML = "";
  }
}
