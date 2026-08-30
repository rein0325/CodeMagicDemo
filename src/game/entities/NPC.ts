import Phaser from "phaser";

const INTERACT_RANGE = 50;

export interface NpcConfig {
  x: number;
  y: number;
  texture: string;
  name: string;
  lines: string[];
}

export class NPC {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly name: string;
  readonly lines: string[];
  private hint: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: NpcConfig) {
    this.sprite = scene.add.sprite(config.x, config.y, config.texture);
    this.name = config.name;
    this.lines = config.lines;

    this.hint = scene.add.text(config.x, config.y - 26, "按 E 互動", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ffcf7a",
    });
    this.hint.setOrigin(0.5);
    this.hint.setVisible(false);
  }

  isPlayerNear(playerX: number, playerY: number): boolean {
    return Math.hypot(playerX - this.sprite.x, playerY - this.sprite.y) <= INTERACT_RANGE;
  }

  setHintVisible(visible: boolean): void {
    this.hint.setVisible(visible);
  }
}
