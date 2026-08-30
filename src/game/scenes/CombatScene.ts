import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Projectile } from "../entities/Projectile";
import { CombatSystem } from "../systems/CombatSystem";
import { SpellEngine } from "../../spell/SpellEngine";
import { PlayerProgress } from "../../state/PlayerProgress";
import { calculateManaCost, calculateCooldownMs } from "../../spell/manaCost";
import { gameEvents } from "../../state/EventBus";
import { CastVfx } from "../effects/CastVfx";
import { sfx } from "../../util/Sfx";
import { SpellLoadout } from "../../state/SpellLoadout";
import { SpellStorage } from "../../state/SpellStorage";
import { parseSpell } from "../../spell/parser/SpellParser";
import { eventLog } from "../../util/EventLog";

export const SCENE_WIDTH = 1000;
export const SCENE_HEIGHT = 640;
export const WALL_MARGIN = 24;

const HIT_STOP_MS = 70;
const SLOT_KEYS = ["ONE", "TWO", "THREE", "FOUR"] as const;

export abstract class CombatScene extends Phaser.Scene {
  protected player!: Player;
  protected projectileGroup!: Phaser.Physics.Arcade.Group;
  protected targetGroup!: Phaser.Physics.Arcade.Group;
  protected spellEngine!: SpellEngine;
  private freezeUntil = 0;
  private casting = false;

  protected setupCombatBase(playerX: number, playerY: number): void {
    this.physics.world.setBounds(
      WALL_MARGIN,
      WALL_MARGIN,
      SCENE_WIDTH - WALL_MARGIN * 2,
      SCENE_HEIGHT - WALL_MARGIN * 2
    );

    this.projectileGroup = this.physics.add.group();
    this.targetGroup = this.physics.add.group();

    this.player = new Player(this, playerX, playerY);

    new CombatSystem(this, this.projectileGroup, this.targetGroup);
    this.spellEngine = new SpellEngine(this, this.projectileGroup);

    SLOT_KEYS.forEach((keyName, i) => {
      this.input.keyboard!.on(`keydown-${keyName}`, () => this.tryCastSlot(i + 1));
    });

    const onEnemyHit = () => this.triggerHitStop();
    gameEvents.on("enemy-hit", onEnemyHit);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => gameEvents.off("enemy-hit", onEnemyHit));

    const onGrimoireOpened = () => {
      this.input.keyboard!.enabled = false;
    };
    const onGrimoireClosed = () => {
      this.input.keyboard!.enabled = true;
    };
    gameEvents.on("grimoire-opened", onGrimoireOpened);
    gameEvents.on("grimoire-closed", onGrimoireClosed);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off("grimoire-opened", onGrimoireOpened);
      gameEvents.off("grimoire-closed", onGrimoireClosed);
    });

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => PlayerProgress.regenMp(0.1),
    });
  }

  protected drawFloorAndWalls(floorTexture: string, wallTexture: string): void {
    this.add.tileSprite(0, 0, SCENE_WIDTH, SCENE_HEIGHT, floorTexture).setOrigin(0, 0);

    this.add.tileSprite(0, 0, SCENE_WIDTH, WALL_MARGIN, wallTexture).setOrigin(0, 0);
    this.add
      .tileSprite(0, SCENE_HEIGHT - WALL_MARGIN, SCENE_WIDTH, WALL_MARGIN, wallTexture)
      .setOrigin(0, 0);
    this.add.tileSprite(0, 0, WALL_MARGIN, SCENE_HEIGHT, wallTexture).setOrigin(0, 0);
    this.add
      .tileSprite(SCENE_WIDTH - WALL_MARGIN, 0, WALL_MARGIN, SCENE_HEIGHT, wallTexture)
      .setOrigin(0, 0);
  }

  protected getPlayer(): Player {
    return this.player;
  }

  private triggerHitStop(): void {
    const now = performance.now();
    this.freezeUntil = Math.max(this.freezeUntil, now + HIT_STOP_MS);
    this.cameras.main.shake(90, 0.006);

    if (!this.physics.world.isPaused) {
      this.physics.world.pause();
      this.scheduleUnfreeze();
    }
  }

  private scheduleUnfreeze(): void {
    const wait = Math.max(0, this.freezeUntil - performance.now());
    setTimeout(() => {
      if (performance.now() >= this.freezeUntil) {
        this.physics.world.resume();
      } else {
        this.scheduleUnfreeze();
      }
    }, wait);
  }

  private tryCastSlot(slot: number): void {
    if (this.casting) return;

    const spellId = SpellLoadout.getSlotSpellId(slot);
    if (!spellId) {
      this.showFloatingMessage(`快捷鍵 ${slot} 還沒有咒語`, "#999");
      return;
    }

    const saved = SpellStorage.get(spellId);
    if (!saved) {
      this.showFloatingMessage(`快捷鍵 ${slot} 的咒語已遺失`, "#999");
      return;
    }

    const result = parseSpell(saved.source);
    if (!result.ok) {
      this.showFloatingMessage(`${saved.name} 目前無法施放`, "#ff6b6b");
      return;
    }
    const spell = result.data;

    const cooldownMs = calculateCooldownMs(spell);
    const remaining = SpellLoadout.getCooldownRemainingMs(slot, cooldownMs);
    if (remaining > 0) {
      this.showFloatingMessage(`冷卻中（${(remaining / 1000).toFixed(1)}s）`, "#7ec4ff");
      return;
    }

    const cost = calculateManaCost(spell);
    if (!PlayerProgress.canAfford(cost)) {
      this.showFloatingMessage("法力不足！", "#7ec4ff");
      sfx.buildFail();
      return;
    }

    PlayerProgress.spendMp(cost);
    SpellLoadout.startCooldown(slot);
    eventLog.log("spell_cast", { slot, spellId, name: saved.name });
    gameEvents.emit("spell-cast", { slot });

    this.casting = true;
    const { x, y } = this.player.getPosition();
    sfx.castStart();

    CastVfx.play(this, x, y, () => {
      this.casting = false;
      const pos = this.player.getPosition();
      const aimAngle = this.player.getAimAngle();
      this.spellEngine.cast(spell, pos.x, pos.y, aimAngle);
    });
  }

  private showFloatingMessage(message: string, color: string): void {
    const { x, y } = this.player.getPosition();
    const text = this.add.text(x, y - 30, message, {
      fontFamily: "monospace",
      fontSize: "14px",
      color,
    });
    text.setOrigin(0.5);
    this.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 700,
      onComplete: () => text.destroy(),
    });
  }

  protected updateProjectiles(): void {
    for (const sprite of this.projectileGroup.getChildren()) {
      const projectile = (sprite as Phaser.Physics.Arcade.Sprite).getData("projectileRef") as
        | Projectile
        | undefined;
      projectile?.update();
    }
  }
}
