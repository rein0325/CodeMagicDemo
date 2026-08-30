import Phaser from "phaser";
import { CombatScene, SCENE_WIDTH, SCENE_HEIGHT, WALL_MARGIN } from "./CombatScene";
import { Boss } from "../entities/Boss";
import { BossHealthBar } from "../../ui/BossHealthBar";
import { gameEvents } from "../../state/EventBus";
import { eventLog } from "../../util/EventLog";

export class BossScene extends CombatScene {
  private boss!: Boss;
  private healthBar!: BossHealthBar;
  private lastCastSlot: number | null = null;

  constructor() {
    super("Boss");
  }

  create(): void {
    this.drawFloorAndWalls("tex-cave-floor", "tex-cave-wall");
    this.setupCombatBase(SCENE_WIDTH / 2, SCENE_HEIGHT - 90);
    this.getPlayer().setInvulnerable(1000);

    this.healthBar = new BossHealthBar(document.getElementById("boss-health-bar")!);
    this.healthBar.show("熔岩巨像");

    this.boss = new Boss(this, SCENE_WIDTH / 2, SCENE_HEIGHT / 2 - 80, (hp, maxHp) =>
      this.healthBar.setRatio(hp, maxHp)
    );
    this.targetGroup.add(this.boss.sprite);

    this.setupRetreat();

    const onSpellCast = (payload: { slot: number }) => {
      if (this.lastCastSlot !== null && this.lastCastSlot !== payload.slot) {
        eventLog.log("boss_spell_switch", { from: this.lastCastSlot, to: payload.slot });
      }
      this.lastCastSlot = payload.slot;
    };
    gameEvents.on("spell-cast", onSpellCast);

    const onPlayerDefeated = () => this.handlePlayerDefeated();
    gameEvents.on("player-defeated", onPlayerDefeated);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off("spell-cast", onSpellCast);
      gameEvents.off("player-defeated", onPlayerDefeated);
      this.healthBar.hide();
    });

    eventLog.log("boss_attempt_start");
    eventLog.log("scene_entered", { scene: "Boss" });
    this.cameras.main.fadeIn(300);
  }

  private setupRetreat(): void {
    const zone = this.add.zone(SCENE_WIDTH / 2, WALL_MARGIN + 10, 220, 20);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.getPlayer().sprite, zone, () => {
      this.scene.start("Wilderness");
    });

    const sign = this.add.text(SCENE_WIDTH / 2, WALL_MARGIN + 40, "↑ 撤退到野外", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffcf7a",
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
    if (!this.boss.isDefeated()) {
      this.boss.update(time, this.getPlayer());
    }
  }
}
