import Phaser from "phaser";
import { gameEvents } from "../../state/EventBus";
import { HealthBar } from "../../ui/HealthBar";
import { PlayerProgress } from "../../state/PlayerProgress";
import { flashWhite, playKnockbackReaction } from "../effects/hitReaction";

let nextEnemyId = 1;

const BAR_WIDTH = 32;
const BAR_HEIGHT = 5;
const BAR_OFFSET_Y = 30;
const KILL_XP = 10;
const RESPAWN_DELAY_MS = 4000;

export interface EnemyOptions {
  x: number;
  y: number;
  hp: number;
  respawnOnDeath?: boolean;
}

export class Enemy {
  readonly id: string;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private maxHp: number;
  hp: number;
  private spawnX: number;
  private spawnY: number;
  private respawnOnDeath: boolean;
  private defeated = false;
  private healthBar: HealthBar;

  constructor(scene: Phaser.Scene, opts: EnemyOptions) {
    this.id = `enemy-${nextEnemyId++}`;
    this.scene = scene;
    this.maxHp = opts.hp;
    this.hp = opts.hp;
    this.spawnX = opts.x;
    this.spawnY = opts.y;
    this.respawnOnDeath = opts.respawnOnDeath ?? true;

    this.sprite = scene.physics.add.sprite(opts.x, opts.y, "tex-dummy");
    this.sprite.setImmovable(true);
    this.sprite.setCircle(10, 4, 12);
    this.sprite.setData("enemyRef", this);

    this.healthBar = new HealthBar(scene, opts.x, opts.y - BAR_OFFSET_Y, BAR_WIDTH, BAR_HEIGHT);
    this.healthBar.setRatio(1);
  }

  takeDamage(amount: number, castId: number, hitAngle = 0): void {
    if (this.defeated) return;
    this.hp = Math.max(0, this.hp - amount);
    this.healthBar.setRatio(this.hp / this.maxHp);

    this.spawnDamageNumber(amount);

    gameEvents.emit("enemy-hit", {
      enemyId: this.id,
      castId,
      damage: amount,
      hpRemaining: this.hp,
      x: this.sprite.x,
      y: this.sprite.y,
    });

    if (this.hp <= 0) {
      flashWhite(this.scene, this.sprite);
      this.die();
    } else {
      playKnockbackReaction(this.scene, this.sprite, this.spawnX, this.spawnY, hitAngle);
    }
  }

  private spawnDamageNumber(amount: number): void {
    const text = this.scene.add.text(this.sprite.x, this.sprite.y - 34, `-${amount}`, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffb454",
    });
    text.setOrigin(0.5);
    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  private die(): void {
    this.defeated = true;
    this.sprite.disableBody(true, false);
    this.healthBar.setVisible(false);
    PlayerProgress.gainXp(KILL_XP, "dummy");

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 0.2,
      duration: 700,
      onComplete: () => {
        if (this.respawnOnDeath) {
          this.scene.time.delayedCall(RESPAWN_DELAY_MS, () => this.respawn());
        } else {
          this.sprite.destroy();
        }
      },
    });
  }

  private respawn(): void {
    this.hp = this.maxHp;
    this.defeated = false;
    this.sprite.setPosition(this.spawnX, this.spawnY);
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.enableBody(true, this.spawnX, this.spawnY, true, true);
    this.healthBar.setVisible(true);
    this.healthBar.setRatio(1);
  }

  destroy(): void {
    this.sprite.destroy();
    this.healthBar.destroy();
  }
}
