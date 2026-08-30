import Phaser from "phaser";
import { flashWhite, playKnockbackReaction } from "../effects/hitReaction";
import { Player } from "./Player";
import { gameEvents } from "../../state/EventBus";
import { eventLog } from "../../util/EventLog";

const MAX_HP = 400;
const MELEE_RANGE = 55;
const SLAM_RANGE = 85;
const SLAM_RADIUS = 100;
const SLAM_CHARGE_MS = 1200;
const SLAM_COOLDOWN_MS = 3000;

interface PhaseConfig {
  moveSpeed: number;
  attackCooldownMs: number;
  attackDamage: number;
  slamEnabled: boolean;
  slamDamage: number;
}

const PHASES: PhaseConfig[] = [
  { moveSpeed: 0, attackCooldownMs: 2000, attackDamage: 14, slamEnabled: false, slamDamage: 0 },
  { moveSpeed: 40, attackCooldownMs: 1600, attackDamage: 16, slamEnabled: true, slamDamage: 20 },
  { moveSpeed: 75, attackCooldownMs: 1000, attackDamage: 20, slamEnabled: true, slamDamage: 26 },
];

export class Boss {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private hp = MAX_HP;
  private defeated = false;
  private phaseIndex = 0;
  private lastAttackAt = -Infinity;
  private lastSlamAt = -Infinity;
  private closeTimerStart: number | null = null;
  private onHpChange: (hp: number, maxHp: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onHpChange: (hp: number, maxHp: number) => void) {
    this.scene = scene;
    this.onHpChange = onHpChange;

    this.sprite = scene.physics.add.sprite(x, y, "tex-boss");
    this.sprite.setImmovable(true);
    this.sprite.setCircle(20, 6, 8);
    this.sprite.setData("bossRef", this);

    this.onHpChange(this.hp, MAX_HP);
  }

  get maxHp(): number {
    return MAX_HP;
  }

  isDefeated(): boolean {
    return this.defeated;
  }

  update(time: number, player: Player): void {
    if (this.defeated) return;

    const phase = PHASES[this.phaseIndex];
    const playerPos = player.getPosition();
    const dx = playerPos.x - this.sprite.x;
    const dy = playerPos.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    this.sprite.setRotation(Math.atan2(dy, dx));

    if (dist <= MELEE_RANGE) {
      body.setVelocity(0, 0);
      if (time >= this.lastAttackAt + phase.attackCooldownMs) {
        this.lastAttackAt = time;
        this.meleeAttack(player, phase.attackDamage);
      }
    } else if (phase.moveSpeed > 0) {
      const angle = Math.atan2(dy, dx);
      body.setVelocity(Math.cos(angle) * phase.moveSpeed, Math.sin(angle) * phase.moveSpeed);
    } else {
      body.setVelocity(0, 0);
    }

    if (phase.slamEnabled) {
      this.updateSlam(time, dist, phase, player);
    } else {
      this.closeTimerStart = null;
    }
  }

  private meleeAttack(player: Player, damage: number): void {
    flashWhite(this.scene, this.sprite, 120);
    this.scene.time.delayedCall(150, () => {
      if (this.defeated) return;
      player.takeDamage(damage);
    });
  }

  private updateSlam(time: number, dist: number, phase: PhaseConfig, player: Player): void {
    if (time < this.lastSlamAt + SLAM_COOLDOWN_MS) return;

    if (dist <= SLAM_RANGE) {
      if (this.closeTimerStart === null) this.closeTimerStart = time;
      if (time - this.closeTimerStart >= SLAM_CHARGE_MS) {
        this.triggerSlam(phase, player);
        this.closeTimerStart = null;
      }
    } else {
      this.closeTimerStart = null;
    }
  }

  private triggerSlam(phase: PhaseConfig, player: Player): void {
    this.lastSlamAt = performance.now();

    const ring = this.scene.add.circle(this.sprite.x, this.sprite.y, 10, 0xff5a1f, 0.4);
    this.scene.tweens.add({
      targets: ring,
      radius: SLAM_RADIUS,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });

    this.scene.cameras.main.shake(200, 0.01);

    this.scene.time.delayedCall(400, () => {
      if (this.defeated) return;
      const pos = player.getPosition();
      const dist = Math.hypot(pos.x - this.sprite.x, pos.y - this.sprite.y);
      if (dist <= SLAM_RADIUS) {
        player.takeDamage(phase.slamDamage);
      }
    });
  }

  takeDamage(amount: number, _castId: number, hitAngle = 0): void {
    if (this.defeated) return;
    this.hp = Math.max(0, this.hp - amount);
    this.onHpChange(this.hp, MAX_HP);
    this.spawnDamageNumber(amount);

    if (this.hp <= 0) {
      flashWhite(this.scene, this.sprite);
      this.die();
      return;
    }

    playKnockbackReaction(this.scene, this.sprite, this.sprite.x, this.sprite.y, hitAngle);
    this.updatePhase();
  }

  private updatePhase(): void {
    const ratio = this.hp / MAX_HP;
    const newPhaseIndex = ratio <= 1 / 3 ? 2 : ratio <= 2 / 3 ? 1 : 0;
    if (newPhaseIndex !== this.phaseIndex) {
      this.phaseIndex = newPhaseIndex;
      gameEvents.emit("boss-phase-change", { phase: newPhaseIndex + 1 });
      eventLog.log("boss_phase_change", { phase: newPhaseIndex + 1 });
      this.scene.cameras.main.shake(150, 0.008);
    }
  }

  private spawnDamageNumber(amount: number): void {
    const text = this.scene.add.text(this.sprite.x, this.sprite.y - 36, `-${amount}`, {
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

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 0.2,
      duration: 900,
      onComplete: () => {
        gameEvents.emit("boss-defeated", undefined);
        eventLog.log("boss_defeated");
      },
    });
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
