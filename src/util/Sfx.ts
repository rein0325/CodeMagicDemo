type ToneType = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: ToneType = "sine"): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  buildSuccess(): void {
    this.tone(660, 0.15);
    setTimeout(() => this.tone(880, 0.15), 60);
  }

  buildFail(): void {
    this.tone(180, 0.25, "sawtooth");
  }

  fireballCast(): void {
    this.tone(300, 0.08, "square");
  }

  castStart(): void {
    this.tone(420, 0.25, "sine");
    setTimeout(() => this.tone(520, 0.2, "sine"), 120);
  }

  hit(): void {
    this.tone(120, 0.08, "triangle");
  }

  challengeComplete(): void {
    this.tone(523, 0.12);
    setTimeout(() => this.tone(659, 0.12), 80);
    setTimeout(() => this.tone(784, 0.2), 160);
  }
}

export const sfx = new Sfx();
