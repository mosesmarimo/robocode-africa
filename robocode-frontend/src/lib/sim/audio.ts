"use client";

// Shared buzzer-tone oscillator mixer used by both sim engines (InterpreterEngine in
// engine.ts, for Uno/ESP32; Rp2040Engine, for the Pico). One persistent square-wave
// oscillator per part id, retuned in place per frame rather than recreated — matches
// the behaviour both engines had independently before this file existed.
//
// close() additionally releases the underlying AudioContext. Previously neither engine
// did this: every Run created a new AudioContext and Stop never closed it, so repeated
// Run/Stop cycles leaked one AudioContext per run (browsers cap concurrent contexts,
// eventually throwing/warning). Call close() once from stop()/teardown().
export class ToneMixer {
  private audio?: AudioContext;
  private osc: Record<string, { o: OscillatorNode; g: GainNode }> = {};

  private ensureAudio(): AudioContext {
    if (!this.audio) this.audio = new AudioContext();
    return this.audio;
  }

  setTone(id: string, freq: number): void {
    if (freq > 0) {
      const ctx = this.ensureAudio();
      let node = this.osc[id];
      if (!node) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        g.gain.value = 0.04;
        o.connect(g).connect(ctx.destination);
        o.start();
        node = this.osc[id] = { o, g };
      }
      node.o.frequency.value = freq;
      node.g.gain.value = 0.04;
    } else if (this.osc[id]) {
      this.stopOne(id);
    }
  }

  private stopOne(id: string): void {
    const node = this.osc[id];
    if (node) {
      try {
        node.g.gain.value = 0;
        node.o.stop();
      } catch {}
      delete this.osc[id];
    }
  }

  stopAll(): void {
    for (const id of Object.keys(this.osc)) this.stopOne(id);
  }

  close(): void {
    this.stopAll();
    this.audio?.close();
    this.audio = undefined;
  }
}
