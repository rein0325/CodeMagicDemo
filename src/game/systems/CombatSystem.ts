import Phaser from "phaser";
import { Enemy } from "../entities/Enemy";
import { Monster } from "../entities/Monster";
import { Projectile } from "../entities/Projectile";
import { sfx } from "../../util/Sfx";

interface Damageable {
  takeDamage(amount: number, castId: number, hitAngle?: number): void;
}

export class CombatSystem {
  constructor(
    private scene: Phaser.Scene,
    private projectileGroup: Phaser.Physics.Arcade.Group,
    private targetGroup: Phaser.Physics.Arcade.Group
  ) {
    this.scene.physics.add.overlap(
      this.projectileGroup,
      this.targetGroup,
      this.onHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private onHit = (
    projectileObj: Phaser.GameObjects.GameObject,
    targetObj: Phaser.GameObjects.GameObject
  ): void => {
    const projSprite = projectileObj as Phaser.Physics.Arcade.Sprite;
    const targetSprite = targetObj as Phaser.Physics.Arcade.Sprite;
    const projectile = projSprite.getData("projectileRef") as Projectile | undefined;
    const target =
      (targetSprite.getData("enemyRef") as Enemy | undefined) ??
      (targetSprite.getData("monsterRef") as Monster | undefined) ??
      (targetSprite.getData("bossRef") as Damageable | undefined);
    if (!projectile || !target) return;

    const body = projSprite.body as Phaser.Physics.Arcade.Body;
    const hitAngle = Math.atan2(body.velocity.y, body.velocity.x);

    (target as Damageable).takeDamage(projectile.damage, projectile.castId, hitAngle);
    projectile.destroy();
    sfx.hit();
  };
}
