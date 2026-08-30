import { gameEvents } from "../state/EventBus";
import { eventLog } from "../util/EventLog";
import { PlayerProgress } from "../state/PlayerProgress";
import { SpellStorage } from "../state/SpellStorage";

interface LikertQuestion {
  id: string;
  text: string;
}

const LIKERT_QUESTIONS: LikertQuestion[] = [
  { id: "q1_fun", text: "你覺得「寫程式來創造魔法」有趣嗎？" },
  { id: "q2_continue", text: "你會想繼續玩嗎？" },
  { id: "q3_experiment", text: "你是否會想自己嘗試修改魔法？" },
  { id: "q4_code_is_gameplay", text: "你覺得程式碼是遊戲玩法的一部分嗎？" },
];

export class DemoComplete {
  private overlay: HTMLElement;
  private answers: Record<string, string | number> = {};

  constructor(overlay: HTMLElement) {
    this.overlay = overlay;
    gameEvents.on("boss-defeated", () => this.showComplete());
  }

  private showComplete(): void {
    eventLog.log("demo_complete");

    const events = eventLog.getAll();
    const startTs = events.find((e) => e.name === "session_start")?.ts ?? Date.now();
    const minutes = Math.max(0, Math.round((Date.now() - startTs) / 60000));

    this.overlay.classList.remove("hidden");
    this.overlay.innerHTML = `
      <div id="demo-complete-panel">
        <div id="demo-complete-title">CODE IS MAGIC</div>
        <p>你擊敗了熔岩巨像，完成了這趟旅程。</p>
        <div id="demo-complete-stats">
          <div>等級：Lv.${PlayerProgress.level}</div>
          <div>建立咒語數：${SpellStorage.list().length}</div>
          <div>遊玩時間：約 ${minutes} 分鐘</div>
        </div>
        <button id="demo-survey-btn">填寫簡短問卷</button>
      </div>
    `;

    document.getElementById("demo-survey-btn")!.addEventListener("click", () => this.showSurvey());
  }

  private showSurvey(): void {
    this.overlay.innerHTML = `
      <div id="demo-complete-panel">
        <div id="demo-complete-title" style="font-size:18px;">簡短問卷</div>
        <div id="survey-questions">
          ${LIKERT_QUESTIONS.map((q) => this.likertHtml(q)).join("")}
          <div class="survey-question">
            <p>哪一部分最好玩？</p>
            <textarea class="survey-open" data-id="q5_best_part" rows="2"></textarea>
          </div>
          <div class="survey-question">
            <p>哪一部分最無聊／最困難？</p>
            <textarea class="survey-open" data-id="q6_worst_part" rows="2"></textarea>
          </div>
          <div class="survey-question">
            <p>如果這是一款完整遊戲，你會想繼續玩嗎？</p>
            <div class="survey-choices" data-id="q7_would_play">
              <button class="survey-choice-btn" data-value="Yes">Yes</button>
              <button class="survey-choice-btn" data-value="No">No</button>
              <button class="survey-choice-btn" data-value="Maybe">Maybe</button>
            </div>
          </div>
        </div>
        <button id="survey-submit-btn">送出問卷</button>
      </div>
    `;

    this.overlay.querySelectorAll<HTMLButtonElement>(".survey-likert-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.closest(".survey-choices")!;
        const id = group.getAttribute("data-id")!;
        this.answers[id] = Number(btn.dataset.value);
        group.querySelectorAll(".survey-likert-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    this.overlay.querySelectorAll<HTMLButtonElement>(".survey-choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.closest(".survey-choices")!;
        const id = group.getAttribute("data-id")!;
        this.answers[id] = btn.dataset.value!;
        group.querySelectorAll(".survey-choice-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    document.getElementById("survey-submit-btn")!.addEventListener("click", () => this.submitSurvey());
  }

  private likertHtml(q: LikertQuestion): string {
    return `
      <div class="survey-question">
        <p>${q.text}</p>
        <div class="survey-choices" data-id="${q.id}">
          ${[1, 2, 3, 4, 5]
            .map((n) => `<button class="survey-likert-btn" data-value="${n}">${n}</button>`)
            .join("")}
        </div>
      </div>
    `;
  }

  private submitSurvey(): void {
    this.overlay.querySelectorAll<HTMLTextAreaElement>(".survey-open").forEach((el) => {
      this.answers[el.dataset.id!] = el.value.trim();
    });

    eventLog.log("survey_submitted", this.answers);
    localStorage.setItem("cmvp_survey", JSON.stringify(this.answers));

    this.overlay.innerHTML = `
      <div id="demo-complete-panel">
        <div id="demo-complete-title" style="font-size:18px;">感謝你的遊玩！</div>
        <p>你的回饋已經記錄下來了。</p>
      </div>
    `;
  }
}
