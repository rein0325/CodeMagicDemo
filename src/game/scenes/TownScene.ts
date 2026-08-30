import Phaser from "phaser";
import { CombatScene, SCENE_WIDTH, SCENE_HEIGHT } from "./CombatScene";
import { Enemy } from "../entities/Enemy";
import { NPC } from "../entities/NPC";
import { PlayerProgress } from "../../state/PlayerProgress";
import { Tutorial } from "../../ui/Tutorial";
import { DialogueBox } from "../../ui/DialogueBox";
import { eventLog } from "../../util/EventLog";

export class TownScene extends CombatScene {
  private dummy!: Enemy;
  private tutorial!: Tutorial;
  private npcs: NPC[] = [];
  private dialogueBox!: DialogueBox;

  constructor() {
    super("Town");
  }

  create(): void {
    this.npcs = [];
    this.drawFloorAndWalls("tex-floor", "tex-wall");
    this.scatterDecorations();
    this.setupCombatBase(150, SCENE_HEIGHT / 2);

    PlayerProgress.heal();

    this.dummy = new Enemy(this, { x: 600, y: SCENE_HEIGHT / 2, hp: 100, respawnOnDeath: true });
    this.targetGroup.add(this.dummy.sprite);

    this.setupExit();
    this.setupNpcs();

    this.input.keyboard!.on("keydown-R", () => this.scene.restart());

    this.cameras.main.fadeIn(300);

    this.tutorial = new Tutorial();
    this.tutorial.maybeAutoStart();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.tutorial.destroy());

    eventLog.log("scene_entered", { scene: "Town" });
  }

  private scatterDecorations(): void {
    const torchPositions = [
      { x: 60, y: 40 },
      { x: SCENE_WIDTH - 60, y: 40 },
      { x: 60, y: SCENE_HEIGHT - 40 },
      { x: SCENE_WIDTH - 60, y: SCENE_HEIGHT - 40 },
    ];
    for (const p of torchPositions) this.add.image(p.x, p.y, "tex-torch");

    this.add.image(140, 60, "tex-banner");
    this.add.image(860, 60, "tex-banner");
    this.add.image(500, 500, "tex-bookshelf");
    this.add.image(760, 500, "tex-bookshelf");
  }

  private setupExit(): void {
    const zone = this.add.zone(SCENE_WIDTH - 34, SCENE_HEIGHT / 2, 20, 220);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.getPlayer().sprite, zone, () => {
      this.scene.start("Wilderness");
    });

    const sign = this.add.text(SCENE_WIDTH - 60, SCENE_HEIGHT / 2 - 130, "→ 野外", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffcf7a",
    });
    sign.setOrigin(0.5);
  }

  private setupNpcs(): void {
    this.dialogueBox = new DialogueBox(document.getElementById("dialogue-box")!);

    this.npcs.push(
      new NPC(this, {
        x: 300,
        y: SCENE_HEIGHT / 2 - 90,
        texture: "tex-npc-mage",
        name: "魔導師",
        lines: [
          "在這個世界，魔法不是念出來的。",
          "魔法，是寫出來的。",
          "打開你的魔導書，把你想要的威力寫出來吧。",
        ],
      })
    );

    this.npcs.push(
      new NPC(this, {
        x: 750,
        y: SCENE_HEIGHT / 2 + 90,
        texture: "tex-npc-villager",
        name: "村民",
        lines: ["野外深處聽說有東西在等你……", "先把咒語準備好，設定好快捷鍵再過去比較保險。"],
      })
    );

    const onInteract = () => this.handleInteract();
    this.input.keyboard!.on("keydown-E", onInteract);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard!.off("keydown-E", onInteract);
    });
  }

  private handleInteract(): void {
    if (this.dialogueBox.isOpen()) {
      this.dialogueBox.advance();
      return;
    }

    const { x, y } = this.getPlayer().getPosition();
    const npc = this.npcs.find((n) => n.isPlayerNear(x, y));
    if (npc) {
      this.dialogueBox.open(npc.name, npc.lines);
      eventLog.log("npc_talk", { name: npc.name });
    }
  }

  update(): void {
    this.getPlayer().update();
    this.updateProjectiles();

    const { x, y } = this.getPlayer().getPosition();
    for (const npc of this.npcs) {
      npc.setHintVisible(npc.isPlayerNear(x, y) && !this.dialogueBox.isOpen());
    }
  }
}
