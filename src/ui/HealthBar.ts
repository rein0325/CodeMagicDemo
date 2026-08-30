import Phaser from "phaser";

export class HealthBar {
  private bg: Phaser.GameObjects.Rectangle;
  private fg: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private width: number,
    private height: number
  ) {
    const left = x - width / 2;
    this.bg = scene.add.rectangle(left, y, width, height, 0x1a1a1a).setOrigin(0, 0.5);
    this.fg = scene.add.rectangle(left, y, width, height, 0x4ade80).setOrigin(0, 0.5);
  }

  setRatio(ratio: number): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    this.fg.setSize(this.width * clamped, this.height);

    const color = clamped > 0.5 ? 0x4ade80 : clamped > 0.2 ? 0xffcf7a : 0xff6b6b;
    this.fg.setFillStyle(color);
  }

  setPosition(x: number, y: number): void {
    const left = x - this.width / 2;
    this.bg.setPosition(left, y);
    this.fg.setPosition(left, y);
  }

  setVisible(visible: boolean): void {
    this.bg.setVisible(visible);
    this.fg.setVisible(visible);
  }

  destroy(): void {
    this.bg.destroy();
    this.fg.destroy();
  }
}
