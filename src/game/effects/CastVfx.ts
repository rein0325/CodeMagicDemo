import Phaser from "phaser";

export const CAST_CHANT_DURATION = 700;

export class CastVfx {
  static play(scene: Phaser.Scene, x: number, y: number, onComplete: () => void): void {
    const circle = scene.add.image(x, y, "tex-magic-circle");
    circle.setAlpha(0);
    circle.setScale(0.3);
    circle.setBlendMode(Phaser.BlendModes.ADD);
    circle.setDepth(5);

    scene.tweens.add({
      targets: circle,
      alpha: 0.9,
      scale: 1,
      duration: 220,
      ease: "Back.easeOut",
    });

    const rotateTween = scene.tweens.add({
      targets: circle,
      angle: 360,
      duration: CAST_CHANT_DURATION + 300,
      repeat: -1,
    });

    const sparkCount = 8;
    for (let i = 0; i < sparkCount; i++) {
      scene.time.delayedCall(i * 45, () => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 36 + Math.random() * 10;
        const spark = scene.add.image(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, "tex-particle");
        spark.setScale(1.6);
        spark.setTint(0xffcf7a);
        spark.setBlendMode(Phaser.BlendModes.ADD);
        spark.setDepth(6);
        scene.tweens.add({
          targets: spark,
          x,
          y,
          alpha: 0,
          scale: 0.3,
          duration: 260,
          ease: "Cubic.easeIn",
          onComplete: () => spark.destroy(),
        });
      });
    }

    scene.time.delayedCall(CAST_CHANT_DURATION, () => {
      rotateTween.stop();
      scene.tweens.add({
        targets: circle,
        alpha: 0,
        scale: 1.4,
        duration: 150,
        onComplete: () => circle.destroy(),
      });
      onComplete();
    });
  }
}
