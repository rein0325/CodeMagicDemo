import { SpellData } from "../spell/SpellData";
import { SIZE_BASE_RADIUS, SIZE_SCALE } from "../spell/SpellEngine";
import { CAST_CHANT_DURATION } from "../game/effects/CastVfx";

const RESULT_HOLD_MS = 1200;
const MAX_POP_SCALE = 1.8;

export class SpellPreview {
  private circle: HTMLElement;
  private fireball: HTMLElement;
  private timers: number[] = [];

  constructor(private container: HTMLElement) {
    this.circle = container.querySelector("#preview-circle")!;
    this.fireball = container.querySelector("#preview-fireball")!;
  }

  play(spell: SpellData): void {
    this.reset();
    this.container.classList.remove("hidden");
    this.circle.classList.add("active");

    for (let i = 0; i < 6; i++) {
      this.timers.push(window.setTimeout(() => this.spawnSpark(), i * 60));
    }

    this.timers.push(
      window.setTimeout(() => {
        this.circle.classList.remove("active");
        this.circle.classList.add("fadeout");
        this.showFireball(spell);
      }, CAST_CHANT_DURATION)
    );

    this.timers.push(
      window.setTimeout(() => {
        this.container.classList.add("hidden");
        this.reset();
      }, CAST_CHANT_DURATION + RESULT_HOLD_MS)
    );
  }

  private spawnSpark(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 38 + Math.random() * 10;
    const spark = document.createElement("div");
    spark.className = "preview-spark";
    spark.style.transform = `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`;
    this.container.appendChild(spark);

    void spark.offsetWidth;
    spark.style.transform = "translate(0, 0)";
    spark.style.opacity = "0";

    window.setTimeout(() => spark.remove(), 300);
  }

  private showFireball(spell: SpellData): void {
    const radius = SIZE_BASE_RADIUS + (spell.size - 1) * SIZE_SCALE;
    const popScale = Math.min(MAX_POP_SCALE, radius / 12);
    this.fireball.style.setProperty("--pop-scale", String(popScale));
    this.fireball.classList.add("active");
  }

  private reset(): void {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.circle.classList.remove("active", "fadeout");
    this.fireball.classList.remove("active");
    this.container.querySelectorAll(".preview-spark").forEach((el) => el.remove());
  }
}
