"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, X } from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { runValidation } from "@/lib/studio/run-validation";

/** Floating "Validate with AI" control for the simulation canvas (top-right). */
export function CanvasAiValidate() {
  const validating = useStudio((s) => s.aiValidating);
  const result = useStudio((s) => s.aiResult);
  const setResult = useStudio((s) => s.setAiResult);

  return (
    <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2" onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => runValidation()}
        disabled={validating}
        aria-label="Validate with AI"
        className="flex items-center gap-2 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-70"
      >
        {validating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {validating ? "Validating…" : "Validate with AI"}
      </button>
      {(validating || result) && (
        <div className="w-[22rem] max-h-[64vh] overflow-auto rounded-xl border border-white/10 bg-[#0e1426]/97 p-3 text-white shadow-2xl backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-3.5 text-primary" /> AI validation</span>
            <button onClick={() => setResult(null)} className="grid size-6 place-items-center rounded text-white/50 hover:bg-white/10"><X className="size-3.5" /></button>
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
