import Phaser from "phaser";

export interface ProjectileOptions {
  x: number;
  y: number;
  angle: number;
  speed: number;
  radius: number;
  damage: number;
  maxDistance: number;
  castId: number;
  group: Phaser.Physics.Arcade.Group;
}

export class Projectile {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly damage: number;
  readonly castId: number;
  private originX: number;
  private originY: number;
  private maxDistanceSq: number;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, opts: ProjectileOptions) {
    this.damage = opts.damage;
    this.castId = opts.castId;
    this.originX = opts.x;
    this.originY = opts.y;
    this.maxDistanceSq = opts.maxDistance * opts.maxDistance;

    this.sprite = scene.physics.add.sprite(opts.x, opts.y, "tex-fireball");
    opts.group.add(this.sprite);
    const scale = opts.radius / 12;
    this.sprite.setScale(scale);
    this.sprite.setCircle(12, 0, 0);
    this.sprite.setData("projectileRef", this);

    const vx = Math.cos(opts.angle) * opts.speed;
    const vy = Math.sin(opts.angle) * opts.speed;
    (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

    this.particles = scene.add.particles(opts.x, opts.y, "tex-particle", {
      speed: { min: 10, max: 30 },
      lifespan: 250,
      scale: { start: scale, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffcf7a, 0xff7a3c],
      quantity: 1,
      frequency: 20,
      follow: this.sprite,
    });
  }

  update(): boolean {
    if (!this.sprite.active) return false;
    const dx = this.sprite.x - this.originX;
    const dy = this.sprite.y - this.originY;
    if (dx * dx + dy * dy >= this.maxDistanceSq) {
      this.destroy();
      return false;
    }
    return true;
  }

  destroy(): void {
    const scene = this.sprite.scene;
    this.particles.stop();
    scene?.time?.delayedCall(300, () => this.particles.destroy());
    this.sprite.destroy();
  }
}
