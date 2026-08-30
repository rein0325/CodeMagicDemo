# Code Dungeon — Demo v0.1 開發現況總覽

> 本文件取代原本的《Code Dungeon — Demo v0.1 開發 Prompt》。原文件是「需求」，這份是「現況」：整理目前實際做出來的東西、對應的實作細節，以及還沒做／刻意不做的部分，作為後續開發的新基準。

---

## 0. 進度總覽

| 階段 | 內容 | 狀態 |
|---|---|---|
| CMVP 核心 | Code → Parser → SpellData → SpellEngine → 戰鬥 | ✅ 完成 |
| Phase 1 | 魔導書、快捷鍵、等級解鎖、教學重寫 | ✅ 完成 |
| Phase 2 | 敵人多樣化、Boss、NPC、問卷、地圖裝飾 | ✅ 完成 |
| Phase 3（未來） | 完整版 Boss、新咒語元素、進階程式概念、A/B Test、真人測試 | ⬜ 未開始 |

Demo 目前可以從頭玩到尾：城鎮教學 → 建立/儲存咒語 → 設定快捷鍵 → 野外打混合怪物 → 升級解鎖參數 → 跟 NPC 對話 → 挑戰 Boss 三階段 → 完成畫面 → 問卷。

---

## 1. 核心產品概念（不變）

> 玩家透過撰寫程式碼創造魔法，並將自己創造的魔法帶入 RPG 戰鬥。

核心循環（已實作）：

```text
探索 → 遇到敵人 → 打開魔導書 → 編輯 Code → 建立/儲存 Spell → 設定快捷鍵 → 進入戰鬥 → 使用不同 Spell → 發現新問題 → 回魔導書修改
```

---

## 2. 魔導書系統 Grimoire ✅

已完成，`src/ui/Grimoire.ts`。全螢幕疊層，開啟時會停用場景鍵盤輸入（避免打字時角色亂動）。

已具備：
- 查看所有已建立的咒語（左側卡片清單，顯示名稱＋程式碼預覽）
- 建立新咒語 / 編輯既有咒語
- 修改 Spell Code（CodeMirror 6）
- 建置／測試（含小型詠唱動畫預覽）
- 儲存咒語（新建或覆寫既有）
- 命名咒語
- 刪除咒語
- 設定快捷鍵 1–4
- 查看目前快捷鍵指派狀態（按鈕高亮）

---

## 3. Spell 儲存系統 ✅

`src/state/SpellStorage.ts`，LocalStorage 儲存（key: `cmvp_spells`）。

實際儲存欄位：

```text
id            (自動產生)
name          (玩家命名)
source        (原始程式碼字串)
createdAt
updatedAt
```

首次啟動會自動建立一個範例咒語「小火球」＝`Fireball(power=20)`，並自動指派到快捷鍵 1。

---

## 4. Spell Loadout / 快捷鍵系統 ✅

`src/state/SpellLoadout.ts` + `src/ui/HotkeyBar.ts`。

- 快捷鍵 1–4 對應到已儲存的咒語（LocalStorage 持久化，key: `cmvp_loadout`）
- 戰鬥中按數字鍵 1–4 直接施放對應咒語（取代原本設計的空白鍵/點擊單一咒語）
- HUD 快捷欄即時顯示：圖示（🔥，因目前只有 Fire 元素）、咒語名稱、MP 花費、冷卻進度（灰階遮罩）
- 冷卻公式：`冷卻時間(ms) = 該咒語 MP 花費 × 25`

---

## 5. Spell Editor UX ✅

參數維持六個：`power / speed / size / count / angle / range`，沒有新增語法複雜度。

「改 Code → 魔法明顯改變」已驗證：`count` 改變會直接影響一次發射幾顆、`size` 改變會直接影響火球視覺與物理大小、其餘參數皆有對應的飛行速度/散射角/射程效果。

---

## 6. Code 錯誤與教學提示 ✅

`src/spell/parser/SpellParser.ts`，錯誤訊息統一格式：

```text
❌ <問題>
💡 <可能原因／建議，並附上該參數的白話功能說明>
```

範例（已實測跟文件原始範例幾乎一致）：

```text
❌ 未知參數：powr
💡 你是不是想使用 power？power 可以控制魔法的傷害。
```

```text
❌ 尚未解鎖：count
💡 count 可以控制一次發射幾顆，達到 Lv.3 就能使用（你目前是 Lv.2）。
```

---

## 7. 城鎮 Town ✅

`src/game/scenes/TownScene.ts`（原 VillageScene 已改名）。

具備：
- 玩家出生點、訓練假人（可重複練習施法）
- 魔導師 NPC ＋ 村民 NPC（見第 8 節）
- 通往野外的出口
- 城鎮裝飾：火把、旗幟、書架（強化「魔法學院村莊」氛圍）
- HUD（等級/XP/MP/HP/快捷欄/魔導書按鈕/教學重看按鈕/匯出測試資料按鈕）

---

## 8. NPC 與對話 ✅

`src/game/entities/NPC.ts` + `src/ui/DialogueBox.ts`。走近顯示「按 E 互動」提示，按 E 開對話框，逐句顯示。

- **魔導師**：「在這個世界，魔法不是念出來的。魔法，是寫出來的。」＋提示打開魔導書
- **村民**：野外提示（「先把咒語準備好，設定好快捷鍵再過去比較保險。」）

---

## 9. 新手教學 Tutorial ✅

`src/ui/Tutorial.ts`，8 步驟（DOM 疊層＋高亮框，非 NPC 對話形式）：

1. 世界觀一句話
2. 移動／瞄準提示
3. 引導打開魔導書（偵測到開啟才自動前進）
4. 展示預設「小火球」＋說明 Lv.1 參數與 MP 機制
5. 引導修改 power 並建置
6. 引導設為快捷鍵 1
7. 引導關閉魔導書、按 1 施放（命中假人才自動前進）
8. 結束，交還控制權

- 每步可跳過；完成過一次不會自動再彈出，HUD 有「？」可重看
- 事件：`tutorial_start / tutorial_step_complete / tutorial_skip / tutorial_complete`

**與原規格的差異**：原規格的 Tutorial Challenge 3（一次 3 顆，需要 `count`）與 Challenge 4（更快更遠，需要 `speed`/`range`）因為牽涉到 Lv.2–4 才解鎖的參數，跟「教學發生在 Lv.1」衝突，因此**改成掛在對應等級的升級 Toast 上**，玩家升級當下才會看到對應引導文字，而不是塞在開場教學。

---

## 10. RPG 成長系統 ✅

`src/state/PlayerProgress.ts`。等級上限 Lv.5，滿級不再獲得 XP。

**XP 門檻**（升這一級所需的增量 XP，非累計）：

| 升級 | 所需 XP |
|---|---|
| Lv1→2 | 30 |
| Lv2→3 | 60 |
| Lv3→4 | 90 |
| Lv4→5 | 120 |

**等級解鎖參數**（硬性語法鎖，寫了未解鎖的參數會被 Parser 擋下）：

| 等級 | 解鎖參數 |
|---|---|
| Lv.1 | power, size |
| Lv.2 | + speed |
| Lv.3 | + count |
| Lv.4 | + angle, range |
| Lv.5 | 全部已解鎖 |

已解鎖的參數仍受 MP 費用限制（見第 11 節），數值越誇張耗魔越多——**等級解鎖與 MP 經濟是並存的雙重限制**，不是互斥設計。

升級當下：HUD 跳出 Toast（附解鎖內容的引導文字）＋播放音效＋角色受擊視覺語言的光效反應。

---

## 11. Mana 系統 ✅

`src/spell/manaCost.ts`。

**MaxMP 依等級**：Lv1=45、Lv2=60、Lv3=75、Lv4=90、Lv5=110，被動每秒回 8 點。

**耗魔公式**：

```text
cost = 3 + power×0.1 + speed×0.15 + size²×2 + count²×0.6 + angle×0.02 + range×0.1
```

`size`、`count`（範圍/AOE 相關）用平方項加重權重，刻意讓「全部拉滿」的咒語（≈136 MP）即使滿等（MaxMP 110）也負擔不起，靠經濟系統自然限制而非強制擋語法。

---

## 12. 野外地圖 ✅

`src/game/scenes/WildernessScene.ts`。

- 8 隻怪物混合生成（見第 13 節），各自獨立漫遊/索敵/攻擊/重生
- 花朵／草叢／灌木／樹木裝飾（純視覺，不加碰撞）
- 兩個出口：回城鎮、「⚠ 洞窟入口 ⚠」通往 Boss 場景
- XP／Level Up 已整合（擊殺怪物給 XP）

---

## 13. 敵人設計 ✅

`src/game/entities/Monster.ts`，設定檔驅動，共 4 種：

| 怪物 | 數量 | HP | 速度 | 攻擊力 | 特性 | XP |
|---|---|---|---|---|---|---|
| 史萊姆 Slime | 2 | 20 | 慢 30 | 5 | 怕火（1.5 倍傷害） | 8 |
| 野狼 Wolf | 2 | 35 | 快 110 | 10 | 一般 | 14 |
| 哥布林 Goblin | 3 | 40 | 中 60 | 8 | 一般（一群） | 15 |
| 石巨人 Golem | 1 | 120 | 慢 35 | 14 | 抗火（0.6 倍傷害） | 30 |

「怕火/抗火」目前是對玩家傷害的倍率（因為玩家唯一傷害來源是 Fireball，尚未有其他元素咒語，見第 20 節）。

---

## 14. 小 Boss ✅（簡化版）

`src/game/entities/Boss.ts` + `src/game/scenes/BossScene.ts`。「熔岩巨像」，HP 400，畫面上方有專屬血條。

三階段依血量切換（**改成考驗參數調度，而非元素克制**——因為目前只有 Fire 一種元素，Boss 不能真的抗火，否則打不死）：

| 階段 | HP 區間 | 行為 |
|---|---|---|
| 1 | 100–66% | 原地不動，玩家靠近才重擊，逼玩家用 `range`/`speed` 保持距離輸出 |
| 2 | 66–33% | 開始緩慢追擊＋新增範圍地震波攻擊，逼玩家用 `count`/`angle` 周旋 |
| 3（狂暴）| <33% | 移動加速、攻擊冷卻縮短、傷害提高，考驗 `power` 短時間高效輸出 |

擊敗後觸發 `boss-defeated` 事件 → Demo 完成畫面。

**這是簡化版**：只有血量門檻切換行為，沒有多階段轉場特效或更豐富的攻擊模式演出，完整版留待 v0.2（見第 20 節）。

---

## 15. Demo 完整流程 ✅

已可完整跑完：

```text
Start → 城鎮 → 魔導師對話 → 教學（建立/儲存/命名/設快捷鍵/施放 Spell）
→ 野外（打混合怪物、升級、解鎖新參數）→ 洞窟入口 → Boss 三階段
→ Boss Defeated → CODE IS MAGIC 完成畫面 → 問卷 → Demo Complete
```

---

## 16. 玩家行為驗證系統 ✅（基礎版）

`src/util/EventLog.ts`，LocalStorage key `cmvp_events`，已記錄：

```text
session_start / session_end
first_build / build_count(含 success)/ first_success
xp_gain / level_up
tutorial_start / tutorial_step_complete / tutorial_skip / tutorial_complete
spell_created / spell_updated / spell_deleted / hotkey_assigned / spell_cast
param_locked_error
monster_killed / player_died
scene_entered / npc_talk
boss_attempt_start / boss_phase_change / boss_spell_switch / boss_defeated
demo_complete / survey_submitted
```

HUD 有「匯出測試資料」按鈕可直接下載 `cmvp_events.json`。

**尚未做的細緻指標**（見第 20 節）：Hint 使用次數、教學「卡住時間」明確偵測、野外「是否主動探索」的量化指標——這些目前可以從既有事件的時間戳記事後推算，但沒有專門的即時追蹤欄位。

---

## 17. 玩家驗證問卷 ✅

`src/ui/DemoComplete.ts`，Boss 完成畫面之後可進入問卷，7 題原樣做出：

1. 「寫程式來創造魔法」有趣嗎？（1–5）
2. 會想繼續玩嗎？（1–5）
3. 是否會想自己嘗試修改魔法？（1–5）
4. 覺得程式碼是遊戲玩法的一部分嗎？（1–5）
5. 哪一部分最好玩？（開放文字）
6. 哪一部分最無聊／最困難？（開放文字）
7. 如果是完整遊戲會想繼續玩嗎？（Yes/No/Maybe）

送出後存入 `cmvp_survey`（LocalStorage）與 `EventLog` 的 `survey_submitted` 事件。

---

## 18. 玩家測試方法 ⬜ 未執行

文件原本要求的「找沒接觸過的玩家實測、觀察行為」屬於**需要使用者自己安排執行的測試流程**，不是可以直接開發出來的功能。系統面（問卷、行為紀錄、匯出資料）都已就緒，可以直接拿現在的 Demo 去找人測試。

---

## 19. 成功驗證指標 ⬜ 待測試後才能填

文件第 20 節列的九項暫定指標（Tutorial 完成率 ≥80% 等）需要實際測試數據才能對照，目前無法回答——這件事本質上就是要等第 18 節的測試執行完才有答案。

---

## 20. 尚未完成／刻意排除的項目

**留待 v0.2 或後續階段**：
- Boss 完整版：更豐富的攻擊模式、明確的階段轉場動畫與特效演出
- 新增咒語元素類型（IceBolt／Lightning 等）——目前「冰霜箭」「雷擊」都只是文件裡的範例咒語命名，底層仍然只有 `Fireball`
- 進階程式概念：Variable／Condition／Loop／Function（架構上目前沒有刻意阻擋，但完全沒開始）
- A/B Test：目前只是「資料結構還算好擴充」，沒有做任何分支邏輯或實際比較機制
- 更細緻的行為指標：Hint 使用次數、教學卡住時間、探索行為的專門量化欄位

**文件明確要求不要做，目前也確實沒做**（維持排除）：
MMO、多人連線、帳號系統、複雜後端、大型開放世界、大量職業、大量技能、大量地圖、商城、公會、PVP、複雜裝備系統。

---

## 21. 技術架構現況

核心資料流維持文件原本要求，沒有重寫：

```text
Code → SpellParser → SpellData → SpellEngine → Phaser 戰鬥
```

新增的概念模組（對應文件建議的 Grimoire/SpellStorage/SpellLoadout/QuestSystem/TutorialSystem/ProgressionSystem/AnalyticsSystem）：

```text
src/state/
  PlayerProgress.ts    等級/XP/MP/HP
  SpellStorage.ts      咒語 CRUD（LocalStorage）
  SpellLoadout.ts      快捷鍵 1–4 指派＋冷卻
  EventBus.ts          場景間事件（含 boss/grimoire/spell-cast 等）

src/spell/
  SpellData.ts         六參數定義＋等級解鎖表＋參數說明
  manaCost.ts           耗魔／冷卻公式
  parser/SpellParser.ts 語法解析＋等級鎖＋錯誤訊息

src/game/
  scenes/BootScene.ts        程式化貼圖生成（角色/怪物/Boss/NPC/裝飾）
  scenes/TownScene.ts        城鎮
  scenes/WildernessScene.ts  野外
  scenes/BossScene.ts        Boss 戰
  scenes/CombatScene.ts      共用基底（施法/冷卻/MP檢查/hit-stop）
  entities/Monster.ts        通用怪物（設定檔驅動）
  entities/Boss.ts           Boss 邏輯
  entities/NPC.ts            NPC 互動

src/ui/
  Grimoire.ts / SpellEditor.ts / SpellPreview.ts
  HUD.ts / HotkeyBar.ts / BossHealthBar.ts
  Tutorial.ts / DialogueBox.ts / DemoComplete.ts

src/util/
  EventLog.ts  行為紀錄（LocalStorage）
  Sfx.ts       程式化音效
```

---

## 最終產品目標（不變）

> 一個能讓第一次接觸 Code Dungeon 的玩家，在短時間內完整理解「寫程式 → 創造魔法 → 建立自己的魔導書 → 用不同魔法解決不同敵人」的 Vertical Slice。

目前系統面已經可以完整跑一輪這個體驗；下一步是找真人測試（第 18–19 節），用實測結果決定要不要投入 Boss 完整版與更多元素類型。
