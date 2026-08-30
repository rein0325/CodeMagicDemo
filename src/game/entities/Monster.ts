import Phaser from "phaser";
import { HealthBar } from "../../ui/HealthBar";
import { PlayerProgress } from "../../state/PlayerProgress";
import { flashWhite, playKnockbackReaction } from "../effects/hitReaction";
import { Player } from "./Player";
import { eventLog } from "../../util/EventLog";

const BAR_WIDTH = 32;
const BAR_HEIGHT = 5;

export interface WildernessBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MonsterConfig {
  key: string;
  label: string;
  texture: string;
  maxHp: number;
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  attackDamage: number;
  attackCooldownMs: number;
  xpReward: number;
  fireMultiplier: number;
  respawnDelayMs: number;
  bodyRadius: number;
  bodyOffset: number;
  barOffsetY: number;
}

export const MONSTER_CONFIGS: Record<string, MonsterConfig> = {
  slime: {
    key: "slime",
    label: "史萊姆",
    texture: "tex-slime",
    maxHp: 20,
    moveSpeed: 30,
    aggroRange: 100,
    attackRange: 24,
    attackDamage: 5,
    attackCooldownMs: 1500,
    xpReward: 8,
    fireMultiplier: 1.5,
    respawnDelayMs: 3500,
    bodyRadius: 9,
    bodyOffset: 3,
    barOffsetY: 22,
  },
  wolf: {
    key: "wolf",
    label: "野狼",
    texture: "tex-wolf",
    maxHp: 35,
    moveSpeed: 110,
    aggroRange: 170,
    attackRange: 28,
    attackDamage: 10,
    attackCooldownMs: 900,
    xpReward: 14,
    fireMultiplier: 1,
    respawnDelayMs: 4000,
    bodyRadius: 9,
    bodyOffset: 3,
    barOffsetY: 22,
  },
  goblin: {
    key: "goblin",
    label: "哥布林",
    texture: "tex-goblin",
    maxHp: 40,
    moveSpeed: 60,
    aggroRange: 130,
    attackRange: 34,
    attackDamage: 8,
    attackCooldownMs: 1200,
    xpReward: 15,
    fireMultiplier: 1,
    respawnDelayMs: 4000,
    bodyRadius: 8,
    bodyOffset: 2,
    barOffsetY: 26,
  },
  golem: {
    key: "golem",
    label: "石巨人",
    texture: "tex-golem",
    maxHp: 120,
    moveSpeed: 35,
    aggroRange: 110,
    attackRange: 40,
    attackDamage: 14,
    attackCooldownMs: 1600,
    xpReward: 30,
    fireMultiplier: 0.6,
    respawnDelayMs: 6000,
    bodyRadius: 13,
    bodyOffset: 5,
    barOffsetY: 32,
  },
};

let nextMonsterId = 1;

export class Monster {
  readonly id: string;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private bounds: WildernessBounds;
  private config: MonsterConfig;
  private hp: number;
  private defeated = false;
  private healthBar: HealthBar;
  private wanderTarget: { x: number; y: number };
  private nextWanderAt = 0;
  private lastAttackAt = -Infinity;

  constructor(scene: Phaser.Scene, x: number, y: number, bounds: WildernessBounds, config: MonsterConfig) {
    this.id = `${config.key}-${nextMonsterId++}`;
    this.scene = scene;
    this.bounds = bounds;
    this.config = config;
    this.hp = config.maxHp;
    this.wanderTarget = { x, y };

    this.sprite = scene.physics.add.sprite(x, y, config.texture);
    this.sprite.setCircle(config.bodyRadius, config.bodyOffset, config.bodyOffset);
    this.sprite.setData("monsterRef", this);

    this.healthBar = new HealthBar(scene, x, y - config.barOffsetY, BAR_WIDTH, BAR_HEIGHT);
    this.healthBar.setRatio(1);
  }

  update(time: number, player: Player): void {
    if (this.defeated || !this.sprite.body) return;

    this.healthBar.setPosition(this.sprite.x, this.sprite.y - this.config.barOffsetY);

    const playerPos = player.getPosition();
    const dx = playerPos.x - this.sprite.x;
    const dy = playerPos.y - this.sprite.y;
    const distToPlayer = Math.hypot(dx, dy);

    if (distToPlayer <= this.config.attackRange) {
      (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.sprite.setRotation(Math.atan2(dy, dx));
      if (time >= this.lastAttackAt + this.config.attackCooldownMs) {
        this.lastAttackAt = time;
        this.attack(player);
      }
      return;
    }

    if (distToPlayer <= this.config.aggroRange) {
      this.wanderTarget = { x: playerPos.x, y: playerPos.y };
    } else if (time >= this.nextWanderAt) {
      this.wanderTarget = {
        x: Phaser.Math.Between(this.bounds.minX, this.bounds.maxX),
        y: Phaser.Math.Between(this.bounds.minY, this.bounds.maxY),
      };
      this.nextWanderAt = time + Phaser.Math.Between(2000, 4000);
    }

    const tx = this.wanderTarget.x - this.sprite.x;
    const ty = this.wanderTarget.y - this.sprite.y;
    const dist = Math.hypot(tx, ty);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (dist < 6) {
      body.setVelocity(0, 0);
    } else {
      const angle = Math.atan2(ty, tx);
      body.setVelocity(Math.cos(angle) * this.config.moveSpeed, Math.sin(angle) * this.config.moveSpeed);
      this.sprite.setRotation(angle);
    }
  }

  private attack(player: Player): void {
    flashWhite(this.scene, this.sprite, 100);
    this.scene.time.delayedCall(100, () => {
      if (this.defeated) return;
      player.takeDamage(this.config.attackDamage);
    });
  }

  takeDamage(amount: number, _castId: number, hitAngle = 0): void {
    if (this.defeated) return;
    const actual = Math.max(1, Math.round(amount * this.config.fireMultiplier));
    this.hp = Math.max(0, this.hp - actual);
    this.healthBar.setRatio(this.hp / this.config.maxHp);

    this.spawnDamageNumber(actual);

    if (this.hp <= 0) {
      flashWhite(this.scene, this.sprite);
      this.die();
    } else {
      playKnockbackReaction(this.scene, this.sprite, this.sprite.x, this.sprite.y, hitAngle);
    }
  }

  private spawnDamageNumber(amount: number): void {
    const text = this.scene.add.text(this.sprite.x, this.sprite.y - 30, `-${amount}`, {
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
    PlayerProgress.gainXp(this.config.xpReward, this.config.key);
    eventLog.log("monster_killed", { type: this.config.key });

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 0.2,
      duration: 700,
      onComplete: () => {
        this.scene.time.delayedCall(this.config.respawnDelayMs, () => this.respawn());
      },
    });
  }

  private respawn(): void {
    const x = Phaser.Math.Between(this.bounds.minX, this.bounds.maxX);
    const y = Phaser.Math.Between(this.bounds.minY, this.bounds.maxY);

    this.hp = this.config.maxHp;
    this.defeated = false;
    this.sprite.setPosition(x, y);
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.enableBody(true, x, y, true, true);
    this.healthBar.setPosition(x, y - this.config.barOffsetY);
    this.healthBar.setVisible(true);
    this.healthBar.setRatio(1);
    this.wanderTarget = { x, y };
  }

  destroy(): void {
    this.sprite.destroy();
    this.healthBar.destroy();
  }
}
