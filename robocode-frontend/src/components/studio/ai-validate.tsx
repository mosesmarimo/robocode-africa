"use client";

import * as React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, X, Wand2, CornerDownLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { runValidation, runVibe } from "@/lib/studio/run-validation";

const VIBE_STEPS = [
  "Reading your circuit…",
  "Designing the changes…",
  "Choosing components & pins…",
  "Wiring it up…",
  "Writing the code & README…",
  "Double-checking validity…",
];

/** Floating AI controls for the simulation canvas (top-right): RoboVibe + Validate. */
export function CanvasAiValidate() {
  const validating = useStudio((s) => s.aiValidating);
  const result = useStudio((s) => s.aiResult);
  const setResult = useStudio((s) => s.setAiResult);

  const [vibeOpen, setVibeOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [vibing, setVibing] = React.useState(false);
  const [vibeMsg, setVibeMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [step, setStep] = React.useState(0);

  // Advance the "what RoboVibe is doing" steps while it works (the call can take
  // a minute or two), stopping on the last step rather than looping.
  React.useEffect(() => {
    if (!vibing) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, VIBE_STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, [vibing]);

  async function doVibe() {
    if (!prompt.trim() || vibing) return;
    setVibing(true);
    setVibeMsg(null);
    const r = await runVibe(prompt);
    setVibing(false);
    setVibeMsg({ ok: r.ok, text: r.message });
    if (r.ok) setPrompt("");
  }

  return (
    <div className="absolute right-3 top-3 z-30 flex w-[23rem] max-w-[calc(100%-1.5rem)] flex-col items-end gap-2" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex gap-2">
        <button
          onClick={() => setVibeOpen((o) => !o)}
          aria-label="RoboVibe"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Wand2 className="size-4" /> RoboVibe
        </button>
        <button
          onClick={() => runValidation()}
          disabled={validating}
          aria-label="Validate with AI"
          className="flex items-center gap-2 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-70"
        >
          {validating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {validating ? "Validating…" : "Validate with AI"}
        </button>
      </div>

      {vibeOpen && (
        <div className="w-full rounded-xl border border-white/10 bg-[#0e1426]/97 p-3 text-white shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Wand2 className="size-3.5 text-fuchsia-400" /> RoboVibe
            </span>
            <button onClick={() => setVibeOpen(false)} aria-label="Close RoboVibe" className="grid size-6 place-items-center rounded text-white/50 hover:bg-white/10"><X className="size-3.5" /></button>
          </div>
          <p className="mb-2 text-xs text-white/55">
            Describe a change to your project — or, on a blank canvas, what to build. AI updates the diagram, code and README to match.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") doVibe(); }}
            aria-label="Describe a change for RoboVibe"
            placeholder="e.g. Add a red LED on pin 8 with a resistor that blinks with the buzzer — or — Build a traffic light with 3 LEDs"
            rows={3}
            disabled={vibing}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/30 p-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-fuchsia-400/50 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-white/40">⌘/Ctrl + Enter</span>
            <button
              onClick={doVibe}
              disabled={vibing || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50"
            >
              {vibing ? <><Loader2 className="size-3.5 animate-spin" /> Vibing…</> : <><CornerDownLeft className="size-3.5" /> Vibe it</>}
            </button>
          </div>
          {/* Processing animation */}
          {vibing && (
            <div className="mt-2 rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/5 p-3">
              <div className="flex items-center gap-3">
                <span className="relative grid size-9 shrink-0 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-fuchsia-500/25 animate-ping" />
                  <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 shadow-lg">
                    <Wand2 className="size-4 text-white animate-pulse" />
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">RoboVibe is building your project…</p>
                  <p key={step} className="text-xs text-white/60 robovibe-fade">{VIBE_STEPS[step]}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="robovibe-bar h-full w-1/3 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-400" />
              </div>
            </div>
          )}
          {/* Success / error animation */}
          {!vibing && vibeMsg && (
            <div className={"mt-2 rounded-lg p-3 text-sm " + (vibeMsg.ok ? "bg-emerald-500/10 text-emerald-100" : "bg-red-500/10 text-red-200")}>
              {vibeMsg.ok ? (
                <div className="flex items-start gap-2.5">
                  <span className="relative grid size-7 shrink-0 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-emerald-400/30 robovibe-ping-once" />
                    <CheckCircle2 className="robovibe-pop relative size-6 text-emerald-400" />
                  </span>
                  <div>
                    <p className="font-medium">{vibeMsg.text}</p>
                    <p className="mt-0.5 text-xs text-white/55">Diagram, code &amp; README updated. Use ⌘Z to undo.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
                  <span>{vibeMsg.text}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(validating || result) && (
        <div className="w-full max-h-[60vh] overflow-auto rounded-xl border border-white/10 bg-[#0e1426]/97 p-3 text-white shadow-2xl backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-3.5 text-primary" /> AI validation</span>
            <button onClick={() => setResult(null)} aria-label="Close AI validation" className="grid size-6 place-items-center rounded text-white/50 hover:bg-white/10"><X className="size-3.5" /></button>
          </div>
          {validating && !result ? (
            <p className="py-3 text-sm text-white/60">Analyzing your circuit and code…</p>
          ) : (
            <div className="md-body md-dark text-sm"><Markdown remarkPlugins={[remarkGfm]}>{result ?? ""}</Markdown></div>
          )}
        </div>
      )}
    </div>
  );
}
