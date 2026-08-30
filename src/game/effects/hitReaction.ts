import Phaser from "phaser";

export function flashWhite(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, ms = 60): void {
  sprite.setTintFill(0xffffff);
  scene.time.delayedCall(ms, () => {
    if (sprite.active) sprite.clearTint();
  });
}

export function playKnockbackReaction(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  restX: number,
  restY: number,
  hitAngle: number
): void {
  flashWhite(scene, sprite);

  scene.tweens.killTweensOf(sprite);
  sprite.setPosition(restX, restY);
  sprite.setScale(1);

  const knockback = 6;
  scene.tweens.add({
    targets: sprite,
    x: restX + Math.cos(hitAngle) * knockback,
    y: restY + Math.sin(hitAngle) * knockback,
    duration: 60,
    yoyo: true,
    ease: "Quad.easeOut",
  });

  scene.tweens.add({
    targets: sprite,
    scaleX: 1.18,
    scaleY: 0.82,
    duration: 70,
    yoyo: true,
    ease: "Quad.easeOut",
  });
}
