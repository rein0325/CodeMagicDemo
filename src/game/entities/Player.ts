import Phaser from "phaser";
import { PlayerProgress } from "../../state/PlayerProgress";

const MOVE_SPEED = 220;

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private keys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private aimAngle = 0;
  private invulnerable = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "tex-player");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setCircle(8, 2, 4);

    const kb = scene.input.keyboard!;
    this.keys = {
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };
  }

  update(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    if (this.keys.a.isDown || this.keys.left.isDown) vx -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown) vx += 1;
    if (this.keys.w.isDown || this.keys.up.isDown) vy -= 1;
    if (this.keys.s.isDown || this.keys.down.isDown) vy += 1;

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      vx = (vx / len) * MOVE_SPEED;
      vy = (vy / len) * MOVE_SPEED;
    }
    body.setVelocity(vx, vy);

    const pointer = this.scene.input.activePointer;
    const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
    this.aimAngle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      worldPoint.x,
      worldPoint.y
    );
    this.sprite.setRotation(this.aimAngle + Math.PI / 2);
  }

  getAimAngle(): number {
    return this.aimAngle;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setInvulnerable(ms: number): void {
    this.invulnerable = true;
    this.scene.time.delayedCall(ms, () => {
      this.invulnerable = false;
    });
  }

  takeDamage(amount: number): void {
    if (this.invulnerable || PlayerProgress.hp <= 0) return;
    PlayerProgress.takeDamage(amount);
    this.playHitReaction();
  }

  private playHitReaction(): void {
    this.sprite.setTintFill(0xff4d4d);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });

    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setScale(1);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.15,
      scaleY: 0.85,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }
}
