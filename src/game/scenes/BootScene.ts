import Phaser from "phaser";

// Every provided art file: [rawLoadKey, filename, outputTextureKey, targetW, targetH]
const ART_ASSETS: [string, string, string, number, number][] = [
  ["raw-player", "player.png", "tex-player", 20, 24],
  ["raw-dummy", "dummy.png", "tex-dummy", 28, 40],
  ["raw-goblin", "goblin.png", "tex-goblin", 20, 24],
  ["raw-slime", "slime.png", "tex-slime", 18, 16],
  ["raw-wolf", "wolf.png", "tex-wolf", 22, 26],
  ["raw-golem", "golem.png", "tex-golem", 32, 36],
  ["raw-boss", "boss.png", "tex-boss", 52, 60],
  ["raw-npc-mage", "npc-mage.png", "tex-npc-mage", 20, 26],
  ["raw-npc-villager", "npc-villager.png", "tex-npc-villager", 20, 24],
  ["raw-fireball", "fireball.png", "tex-fireball", 24, 24],
  ["raw-particle", "particle.png", "tex-particle", 4, 4],
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    for (const [rawKey, file] of ART_ASSETS) {
      this.load.image(rawKey, `art/${file}`);
    }
  }

  create(): void {
    for (const [rawKey, , outKey, w, h] of ART_ASSETS) {
      this.bakeArtTexture(rawKey, outKey, w, h);
    }

    const g = this.add.graphics();

    this.drawFloorTile(g);
    this.drawWallTile(g);
    this.drawGrassTile(g);
    this.drawHedgeTile(g);
    this.drawFlower(g);
    this.drawGrassTuft(g);
    this.drawBush(g);
    this.drawTree(g);
    this.drawTorch(g);
    this.drawBanner(g);
    this.drawBookshelf(g);
    this.drawCaveFloorTile(g);
    this.drawCaveWallTile(g);
    this.drawMagicCircle(g);

    g.destroy();

    this.scene.start("Town");
  }

  // Output canvas size must match the old generateTexture() dims exactly (setCircle/scale elsewhere is hardcoded to them).
  private bakeArtTexture(rawKey: string, outKey: string, targetW: number, targetH: number): void {
    const src = this.textures.get(rawKey).getSourceImage() as HTMLImageElement;
    const sw = src.width;
    const sh = src.height;

    const work = document.createElement("canvas");
    work.width = sw;
    work.height = sh;
    const wctx = work.getContext("2d")!;
    wctx.drawImage(src, 0, 0);

    const imgData = wctx.getImageData(0, 0, sw, sh);
    const d = imgData.data;

    const corners = [0, (sw - 1) * 4, (sh - 1) * sw * 4, ((sh - 1) * sw + sw - 1) * 4];
    let br = 0;
    let bg = 0;
    let bb = 0;
    for (const c of corners) {
      br += d[c];
      bg += d[c + 1];
      bb += d[c + 2];
    }
    br /= corners.length;
    bg /= corners.length;
    bb /= corners.length;
    const glowMode = 0.299 * br + 0.587 * bg + 0.114 * bb < 40;

    let minX = sw;
    let minY = sh;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        const r = d[i];
        const gPx = d[i + 1];
        const b = d[i + 2];
        let alpha: number;
        if (glowMode) {
          alpha = Math.max(r, gPx, b);
        } else {
          const dist = Math.sqrt((r - br) ** 2 + (gPx - bg) ** 2 + (b - bb) ** 2);
          alpha = 255 * Phaser.Math.Clamp((dist - 50) / 60, 0, 1);
        }
        d[i + 3] = alpha;
        if (alpha > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    wctx.putImageData(imgData, 0, 0);

    if (maxX < minX) {
      minX = 0;
      minY = 0;
      maxX = sw - 1;
      maxY = sh - 1;
    }

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const scale = Math.min(targetW / bw, targetH / bh);
    const dw = bw * scale;
    const dh = bh * scale;
    const dx = (targetW - dw) / 2;
    const dy = (targetH - dh) / 2;

    const out = document.createElement("canvas");
    out.width = targetW;
    out.height = targetH;
    const octx = out.getContext("2d")!;
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(work, minX, minY, bw, bh, dx, dy, dw, dh);

    if (this.textures.exists(outKey)) this.textures.remove(outKey);
    this.textures.addCanvas(outKey, out);
  }

  private drawFloorTile(g: Phaser.GameObjects.Graphics): void {
    // 32x32 dark stone floor tile, seamless grid lines on top/left edges only
    g.fillStyle(0x2a2730);
    g.fillRect(0, 0, 32, 32);

    g.fillStyle(0x201e26);
    g.fillRect(0, 0, 32, 2);
    g.fillRect(0, 0, 2, 32);

    g.fillStyle(0x322f3a);
    g.fillRect(6, 6, 4, 4);
    g.fillRect(20, 18, 5, 3);

    g.fillStyle(0x1c1a22);
    g.fillRect(18, 4, 3, 3);
    g.fillRect(9, 22, 3, 3);

    g.generateTexture("tex-floor", 32, 32);
    g.clear();
  }

  private drawWallTile(g: Phaser.GameObjects.Graphics): void {
    // 32x32 dark stone brick tile for arena walls
    g.fillStyle(0x1c1a22);
    g.fillRect(0, 0, 32, 32);

    g.fillStyle(0x141219);
    g.fillRect(0, 15, 32, 2);
    g.fillRect(15, 0, 2, 15);
    g.fillRect(7, 17, 2, 15);
    g.fillRect(23, 17, 2, 15);

    g.fillStyle(0x252230);
    g.fillRect(2, 2, 10, 10);
    g.fillRect(19, 20, 9, 8);

    g.generateTexture("tex-wall", 32, 32);
    g.clear();
  }

  private drawGrassTile(g: Phaser.GameObjects.Graphics): void {
    // 32x32 outdoor grass tile for the Wilderness floor
    g.fillStyle(0x2d4a2a);
    g.fillRect(0, 0, 32, 32);

    g.fillStyle(0x35572f);
    g.fillRect(4, 6, 3, 3);
    g.fillRect(20, 14, 3, 3);
    g.fillRect(11, 22, 3, 3);

    g.fillStyle(0x264023);
    g.fillRect(16, 4, 3, 3);
    g.fillRect(6, 20, 3, 3);
    g.fillRect(24, 24, 3, 3);

    g.generateTexture("tex-grass", 32, 32);
    g.clear();
  }

  private drawHedgeTile(g: Phaser.GameObjects.Graphics): void {
    // 32x32 hedge/tree-line tile for the Wilderness boundary
    g.fillStyle(0x1c3319);
    g.fillRect(0, 0, 32, 32);

    g.fillStyle(0x2a4a24);
    g.fillCircle(8, 10, 8);
    g.fillCircle(22, 8, 7);
    g.fillCircle(14, 22, 9);
    g.fillCircle(26, 24, 6);

    g.fillStyle(0x35572f);
    g.fillCircle(8, 8, 4);
    g.fillCircle(22, 6, 3);
    g.fillCircle(14, 19, 4);

    g.generateTexture("tex-hedge", 32, 32);
    g.clear();
  }

  private drawFlower(g: Phaser.GameObjects.Graphics): void {
    // 8x8 canvas, drawn in white so it can be tinted per-instance
    g.fillStyle(0xffffff);
    g.fillCircle(2, 4, 1.6);
    g.fillCircle(6, 4, 1.6);
    g.fillCircle(4, 2, 1.6);
    g.fillCircle(4, 6, 1.6);
    g.fillStyle(0xffe066);
    g.fillCircle(4, 4, 1.4);

    g.generateTexture("tex-flower", 8, 8);
    g.clear();
  }

  private drawGrassTuft(g: Phaser.GameObjects.Graphics): void {
    // 10x8 canvas, a few blades of grass
    g.fillStyle(0x4a7a3a);
    g.fillTriangle(1, 8, 3, 8, 2, 1);
    g.fillTriangle(4, 8, 6, 8, 5, 0);
    g.fillTriangle(7, 8, 9, 8, 8, 2);

    g.generateTexture("tex-grass-tuft", 10, 8);
    g.clear();
  }

  private drawBush(g: Phaser.GameObjects.Graphics): void {
    // 14x12 canvas, small standalone shrub
    g.fillStyle(0x2a4a24);
    g.fillCircle(4, 7, 5);
    g.fillCircle(10, 7, 5);
    g.fillCircle(7, 4, 5);

    g.fillStyle(0x3f6b34);
    g.fillCircle(6, 4, 2.5);

    g.generateTexture("tex-bush", 14, 12);
    g.clear();
  }

  private drawTree(g: Phaser.GameObjects.Graphics): void {
    // 24x32 canvas, top-down stylized tree
    g.fillStyle(0x5c3d22);
    g.fillRect(10, 22, 4, 8);

    g.fillStyle(0x2a4a24);
    g.fillCircle(12, 14, 11);

    g.fillStyle(0x3f6b34);
    g.fillCircle(8, 10, 5);
    g.fillCircle(16, 12, 4);

    g.generateTexture("tex-tree", 24, 32);
    g.clear();
  }

  private drawTorch(g: Phaser.GameObjects.Graphics): void {
    // 10x18 canvas, wall-mounted torch for Town decoration
    g.fillStyle(0x4a3320);
    g.fillRect(4, 6, 2, 12);

    g.fillStyle(0xff7a3c);
    g.fillCircle(5, 6, 4);
    g.fillStyle(0xffcf7a);
    g.fillCircle(5, 5, 2);

    g.generateTexture("tex-torch", 10, 18);
    g.clear();
  }

  private drawBanner(g: Phaser.GameObjects.Graphics): void {
    // 12x22 canvas, hanging cloth banner
    g.fillStyle(0x5a2f5a);
    g.fillRect(1, 0, 10, 18);
    g.fillTriangle(1, 18, 6, 22, 6, 18);
    g.fillTriangle(6, 18, 11, 18, 6, 22);

    g.fillStyle(0xffcf7a);
    g.fillCircle(6, 8, 3);

    g.generateTexture("tex-banner", 12, 22);
    g.clear();
  }

  private drawBookshelf(g: Phaser.GameObjects.Graphics): void {
    // 18x22 canvas, Town decoration prop
    g.fillStyle(0x5c3d22);
    g.fillRect(0, 0, 18, 22);

    g.fillStyle(0x3a2414);
    g.fillRect(1, 7, 16, 2);
    g.fillRect(1, 14, 16, 2);

    g.fillStyle(0xc23b3b);
    g.fillRect(2, 1, 3, 6);
    g.fillStyle(0x4a7a3a);
    g.fillRect(6, 1, 3, 6);
    g.fillStyle(0x7ec4ff);
    g.fillRect(10, 1, 3, 6);
    g.fillStyle(0xffcf7a);
    g.fillRect(14, 1, 2, 6);

    g.generateTexture("tex-bookshelf", 18, 22);
    g.clear();
  }

  private drawCaveFloorTile(g: Phaser.GameObjects.Graphics): void {
    // 32x32 dark volcanic cave floor
    g.fillStyle(0x261a16);
    g.fillRect(0, 0, 32, 32);

    g.fillStyle(0x1a1210);
    g.fillRect(0, 0, 32, 2);
    g.fillRect(0, 0, 2, 32);

    g.lineStyle(1, 0xff5a1f, 0.5);
    g.lineBetween(4, 28, 10, 18);
    g.lineBetween(22, 30, 26, 20);

    g.generateTexture("tex-cave-floor", 32, 32);
    g.clear();
  }

  private drawCaveWallTile(g: Phaser.GameObjects.Graphics): void {
    // 32x32 dark volcanic cave wall
    g.fillStyle(0x140d0b);
    g.fillRect(0, 0, 32, 32);

    g.fillStyle(0x1e1512);
    g.fillRect(0, 14, 32, 4);

    g.fillStyle(0xff5a1f);
    g.fillRect(6, 20, 2, 8);
    g.fillRect(24, 6, 2, 10);

    g.generateTexture("tex-cave-wall", 32, 32);
    g.clear();
  }

  private drawMagicCircle(g: Phaser.GameObjects.Graphics): void {
    // 64x64 rune circle used for the casting/incantation VFX
    g.lineStyle(3, 0xffa940, 1);
    g.strokeCircle(32, 32, 28);

    g.lineStyle(2, 0xffcf7a, 1);
    g.strokeCircle(32, 32, 20);

    g.lineStyle(2, 0xffa940, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.lineBetween(32 + Math.cos(a) * 22, 32 + Math.sin(a) * 22, 32 + Math.cos(a) * 30, 32 + Math.sin(a) * 30);
    }

    g.generateTexture("tex-magic-circle", 64, 64);
    g.clear();
  }
}
