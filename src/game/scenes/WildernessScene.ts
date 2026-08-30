import Phaser from "phaser";
import { CombatScene, SCENE_WIDTH, SCENE_HEIGHT, WALL_MARGIN } from "./CombatScene";
import { Monster, MonsterConfig, MONSTER_CONFIGS, WildernessBounds } from "../entities/Monster";
import { gameEvents } from "../../state/EventBus";
import { eventLog } from "../../util/EventLog";

const ENTRY_INVULN_MS = 1500;

const SPAWN_PLAN: { config: MonsterConfig; count: number }[] = [
  { config: MONSTER_CONFIGS.slime, count: 2 },
  { config: MONSTER_CONFIGS.wolf, count: 2 },
  { config: MONSTER_CONFIGS.goblin, count: 3 },
  { config: MONSTER_CONFIGS.golem, count: 1 },
];

export class WildernessScene extends CombatScene {
  private monsters: Monster[] = [];
  private bounds!: WildernessBounds;

  constructor() {
    super("Wilderness");
  }

  create(): void {
    this.monsters = [];
    this.bounds = {
      minX: WALL_MARGIN + 40,
      maxX: SCENE_WIDTH - WALL_MARGIN - 40,
      minY: WALL_MARGIN + 40,
      maxY: SCENE_HEIGHT - WALL_MARGIN - 40,
    };

    this.drawFloorAndWalls("tex-grass", "tex-hedge");
    this.scatterDecorations();
    this.setupCombatBase(WALL_MARGIN + 60, SCENE_HEIGHT / 2);
    this.getPlayer().setInvulnerable(ENTRY_INVULN_MS);

    this.spawnMonsters();
    this.setupEntrance();
    this.setupBossExit();

    const onPlayerDefeated = () => this.handlePlayerDefeated();
    gameEvents.on("player-defeated", onPlayerDefeated);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      gameEvents.off("player-defeated", onPlayerDefeated)
    );

    eventLog.log("scene_entered", { scene: "Wilderness" });
    this.cameras.main.fadeIn(300);
  }

  private scatterDecorations(): void {
    const textures = ["tex-flower", "tex-grass-tuft", "tex-bush"];
    for (let i = 0; i < 26; i++) {
      const texture = Phaser.Utils.Array.GetRandom(textures);
      const x = Phaser.Math.Between(this.bounds.minX, this.bounds.maxX);
      const y = Phaser.Math.Between(this.bounds.minY, this.bounds.maxY);
      const deco = this.add.image(x, y, texture);
      deco.setScale(Phaser.Math.FloatBetween(0.8, 1.2));
      if (texture === "tex-flower") {
        deco.setTint(Phaser.Utils.Array.GetRandom([0xffffff, 0xffb3d9, 0xb3d9ff, 0xfff2a8]));
      }
    }

    for (let i = 0; i < 9; i++) {
      const x = Phaser.Math.Between(this.bounds.minX, this.bounds.maxX);
      const y = Phaser.Math.Between(this.bounds.minY, this.bounds.maxY);
      this.add.image(x, y, "tex-tree").setScale(Phaser.Math.FloatBetween(0.9, 1.15));
    }
  }

  private spawnMonsters(): void {
    for (const { config, count } of SPAWN_PLAN) {
      for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(this.bounds.minX + 250, this.bounds.maxX);
        const y = Phaser.Math.Between(this.bounds.minY, this.bounds.maxY);
        const monster = new Monster(this, x, y, this.bounds, config);
        this.targetGroup.add(monster.sprite);
        this.monsters.push(monster);
      }
    }
  }

  private setupEntrance(): void {
    const zone = this.add.zone(WALL_MARGIN + 14, SCENE_HEIGHT / 2, 20, 220);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.getPlayer().sprite, zone, () => {
      this.scene.start("Town");
    });

    const sign = this.add.text(WALL_MARGIN + 70, SCENE_HEIGHT / 2 - 130, "← 城鎮", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffcf7a",
    });
    sign.setOrigin(0.5);
  }

  private setupBossExit(): void {
    const zone = this.add.zone(SCENE_WIDTH / 2, SCENE_HEIGHT - WALL_MARGIN - 10, 220, 20);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.getPlayer().sprite, zone, () => {
      this.scene.start("Boss");
    });

    const sign = this.add.text(SCENE_WIDTH / 2, SCENE_HEIGHT - WALL_MARGIN - 60, "⚠ 洞窟入口 ⚠", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ff8a8a",
    });
    sign.setOrigin(0.5);
  }

  private handlePlayerDefeated(): void {
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(500, () => this.scene.start("Town"));
  }

  update(time: number): void {
    this.getPlayer().update();
    this.updateProjectiles();
    for (const monster of this.monsters) monster.update(time, this.getPlayer());
  }
}
