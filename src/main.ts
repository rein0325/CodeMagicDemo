import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import { TownScene } from "./game/scenes/TownScene";
import { WildernessScene } from "./game/scenes/WildernessScene";
import { BossScene } from "./game/scenes/BossScene";
import { eventLog } from "./util/EventLog";
import { HUD } from "./ui/HUD";
import { Grimoire } from "./ui/Grimoire";
import { DemoComplete } from "./ui/DemoComplete";
import { gameEvents } from "./state/EventBus";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: "game-container",
  width: 1000,
  height: 640,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  fps: {
    forceSetTimeOut: true,
  },
  scene: [BootScene, TownScene, WildernessScene, BossScene],
};

new Phaser.Game(config);

eventLog.log("session_start");
window.addEventListener("beforeunload", () => eventLog.log("session_end"));

const grimoire = new Grimoire(document.getElementById("grimoire-overlay")!);

const hud = new HUD(
  document.getElementById("hud")!,
  () => gameEvents.emit("tutorial-replay", undefined),
  () => grimoire.open()
);
setInterval(() => hud.refresh(), 150);

new DemoComplete(document.getElementById("demo-complete-overlay")!);
