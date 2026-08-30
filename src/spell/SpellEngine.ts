import Phaser from "phaser";
import { SpellData } from "./SpellData";
import { Projectile } from "../game/entities/Projectile";
import { sfx } from "../util/Sfx";

export const SPEED_SCALE = 40; // px/s per speed unit
export const RANGE_SCALE = 30; // px per range unit
export const SIZE_BASE_RADIUS = 6;
export const SIZE_SCALE = 6; // px radius per size unit above 1

let nextCastId = 1;

export class SpellEngine {
  constructor(
    private scene: Phaser.Scene,
    private projectileGroup: Phaser.Physics.Arcade.Group
  ) {}

  cast(spell: SpellData, originX: number, originY: number, aimAngleRad: number): number {
    const castId = nextCastId++;
    const spreadRad = Phaser.Math.DegToRad(spell.angle);
    const n = Math.max(1, Math.round(spell.count));
    const radius = SIZE_BASE_RADIUS + (spell.size - 1) * SIZE_SCALE;
    const maxDistance = spell.range * RANGE_SCALE;
    const velocityMag = spell.speed * SPEED_SCALE;

    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5; // -0.5..0.5 spread fan
      const projAngle = aimAngleRad + t * spreadRad;
      new Projectile(this.scene, {
        x: originX,
        y: originY,
        angle: projAngle,
        speed: velocityMag,
        radius,
        damage: spell.power,
        maxDistance,
        castId,
        group: this.projectileGroup,
      });
    }

    sfx.fireballCast();
    return castId;
  }
}
