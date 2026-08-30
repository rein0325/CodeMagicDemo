# Code Dungeon — Demo v0.1

用「寫程式」來施展魔法的 2D RPG demo。玩家不是選咒語，而是用類似 Python 的語法自己組出咒語參數（`Fireball(power=20, speed=8, count=3, angle=15, size=1.2)`），組完存進魔導書、綁上快捷鍵，再拿到戰鬥裡實際測試效果。

線上試玩：<https://rein0325.github.io/CodeMagicDemo/>

## 這是什麼

一個垂直切片（vertical slice）demo，玩法流程是：

```
城鎮（教學 + NPC + 訓練假人）
  → 魔導書（寫咒語、設定快捷鍵）
    → 野外（史萊姆／野狼／哥布林／石巨人，練等升級）
      → 洞窟入口 → Boss 戰（熔岩巨像，三階段）
        → 通關畫面 + 簡短問卷
```

核心設計：
- **只有 Fire 一種真正的元素**，咒語只有 `Fireball`。等級提升會逐步解鎖新參數（`speed`／`count`／`angle`／`range`），解鎖後每次施法仍會依參數強度消耗對應 MP——兩種限制同時存在，避免玩家一解鎖就把數值全部拉滿。
- 怪物有 `fireMultiplier`（史萊姆怕火、石巨人抗火），Boss 三階段呼應玩家在等級提升過程中學到的參數（先考驗保持距離、再考驗覆蓋範圍、最後考驗爆發輸出）。
- 所有玩家行為（建置次數、施法、升級、擊殺、NPC 對話、Boss 階段切換、問卷結果……）都會記錄到 `localStorage`，HUD 上有「匯出測試資料」可以直接下載 JSON，方便之後做遊玩測試分析。

## 執行方式

需要 Node.js（有裝 `npm` 就可以）。

```bash
npm install       # 安裝相依套件
npm run dev        # 啟動開發伺服器（有熱重載），預設 http://localhost:5173
npm run build       # 正式建置，輸出到 docs/（GitHub Pages 直接讀這個資料夾發布）
npm run preview      # 本機預覽 build 出來的成品
npm run typecheck     # 只跑 TypeScript 型別檢查，不產生檔案
```

> `build` 的輸出資料夾是 `docs/`（不是 Vite 預設的 `dist/`），這是刻意設定的，這樣 GitHub Pages 才能直接用「Deploy from a branch → main → /docs」發布，不需要另外架 CI。**改完程式碼、要更新線上版本時，記得先 `npm run build` 重新產生 `docs/`，再一起 commit + push。**

### 操作方式

- 滑鼠移動瞄準、`1`～`4` 施放對應快捷鍵的咒語
- 城鎮裡走近 NPC 按 `E` 對話
- `R` 重新開始當前場景（不會清進度）
- HUD 右上角「🔄 重新開始」會清空所有進度（等級、咒語、快捷鍵、教學狀態），像全新玩家一樣重來，這個操作無法復原

## 專案結構

```
src/
  game/
    scenes/     Boot（貼圖載入/烘焙）、Town、Wilderness、Boss，共用邏輯在 CombatScene
    entities/   Player、Enemy（訓練假人）、Monster（史萊姆/野狼/哥布林/石巨人）、Boss、NPC、Projectile
    effects/    受擊反應、詠唱特效
    systems/    戰鬥碰撞判定
  spell/       咒語解析器（SpellParser）、魔力消耗公式、咒語資料型別
  state/       玩家進度、咒語儲存（Grimoire 資料層）、快捷鍵綁定、事件匯流排
  ui/          魔導書、HUD、快捷鍵列、教學、對話框、通關問卷
  util/        行為紀錄（EventLog）、音效
public/art/     手繪像素風美術素材原檔（角色/怪物/Boss/NPC/火球）
```

美術資產走「BootScene 動態烘焙」流程：`public/art/` 放的是綠幕／洋紅幕／黑底的原始去背前圖檔，`BootScene.ts` 開機時會自動辨識每張圖的底色去背、裁切、縮放進遊戲原本用的固定貼圖尺寸，才不會動到 `Player.ts`／`Monster.ts`／`Projectile.ts` 裡寫死的碰撞半徑跟縮放公式。目前野外/城鎮的地板、牆壁、裝飾物（花草樹叢火把之類）跟施法特效還是程式即時繪製的色塊，沒有替換成美術圖。

## 已知限制 / 之後會做的事

- **UI 美術**：魔導書、HUD、對話框、通關問卷目前是純色 CSS 面板，還沒套用「深色外框 + 羊皮紙內頁」的統一風格；快捷鍵格子的咒語圖示還是寫死的 🔥 emoji，沒接真的圖檔。
- **地圖／裝飾物美術**：城鎮、野外、洞窟的地板牆壁 tile，以及花草樹叢火把旗幟書架等裝飾物，都還是程式繪製的色塊，還沒換成手繪素材。
- **Boss 戰**：目前是簡化版三階段（近戰／地震波／狂暴），完整版（更多招式、視覺分階段換貼圖）留到 v0.2。
- **元素系統**：`Fireball` 目前是唯一真正可用的咒語型別，`Ice`／`Lightning` 目前只存在於怪物的抗性/弱點設定裡（當作風味數值），還沒有對應的真實咒語邏輯。
- 部分品質問題（假人刷經驗速度、場景重進的物件清理、事件重複觸發、刪除咒語未清快捷鍵、`tsc` 型別檢查）已在近期修過，`npm run typecheck` 目前是乾淨的，之後有改動建議繼續維持這個習慣（build 前先跑一次 typecheck）。
