"use client";

// Renders the `tryit` lesson block: an editable code box + Run (coding
// languages, sandbox-powered) or Open in Studio (robotics languages — never
// run in the sandbox, see lesson-block-shared.ts).
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Play, Loader2, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { studioHref } from "@/lib/studio/open-in-studio";
import { runCodingSnippet } from "@/lib/run/run-snippet";
import { recordBlockCompletion } from "@/lib/learn/block-progress";
import { ROBOTICS_TRYIT_LANGS, DEFAULT_ROBOTICS_BOARD } from "./lesson-block-shared";
import { BlockOutputPane, EngineBadge, type BlockOutputState } from "./run-output";

function textareaRows(text: string): number {
  return Math.min(20, Math.max(3, text.split("\n").length));
}

export function TryItBlock({
  language,
  code: initialCode,
  expectedOutput,
  caption,
  refId,
}: {
  language: string;
  code: string;
  expectedOutput?: string;
  caption?: string;
  refId: string;
}) {
  const [code, setCode] = React.useState(initialCode);
  const [output, setOutput] = React.useState<BlockOutputState>({ mode: "idle" });
  const [busy, setBusy] = React.useState(false);
  const completedRef = React.useRef(false);

  const isRobotics = ROBOTICS_TRYIT_LANGS.has(language);

  async function markComplete() {
    if (completedRef.current) return;
    completedRef.current = true;
    const result = await recordBlockCompletion({ type: "tryit", language, refId });
    if (result && result.awarded > 0) {
      toast.success(`+${result.awarded} XP`, { description: "First run of this try-it — nice!" });
    }
  }

  async function run() {
    setBusy(true);
    try {
      const r = await runCodingSnippet(language, code);
      if (r.mode === "render") {
        setOutput({ mode: "render", doc: r.doc });
        await markComplete(); // a successful render is this tryit's "run"
      } else {
        const ok = r.result.ok && !r.result.error;
        setOutput({
          mode: "run",
          text: !r.result.ok
            ? r.result.text || "Couldn't run your code."
            : r.result.output || (r.result.error ? r.result.text || "Error" : "(program finished with no output)"),
          error: !ok,
          engine: r.result.engine,
        });
        if (ok) await markComplete();
      }
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCode(initialCode);
    setOutput({ mode: "idle" });
  }

  return (
    <figure className="my-5 overflow-hidden rounded-xl border border-border bg-[#282c34]">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs text-white/70">{language} — Try it</span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={reset}
            aria-label="Reset code"
            title="Reset to original"
            className="text-white/60 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-3.5" />
          </Button>
          {isRobotics ? (
            <Button variant="gradient" size="sm" asChild onClick={markComplete}>
              <Link
                href={studioHref(language, code, DEFAULT_ROBOTICS_BOARD[language])}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" /> Open in Studio
              </Link>
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={run} disabled={busy}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Run
            </Button>
          )}
        </div>
      </figcaption>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        aria-label={`${language} code (editable)`}
        rows={textareaRows(code)}
        className="resize-y rounded-none border-0 bg-transparent font-mono text-sm text-white/90 shadow-none focus-visible:ring-0"
      />

      {!isRobotics && expectedOutput && (
        <div className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
          <span className="font-semibold text-white/70">Expected:</span>{" "}
          <span className="whitespace-pre-wrap font-mono">{expectedOutput}</span>
        </div>
      )}

      {output.mode !== "idle" && (
        <div className="border-t border-white/10">
          {output.mode === "run" && output.engine && (
            <div className="flex items-center gap-2 px-4 py-1.5">
              <EngineBadge engine={output.engine} />
            </div>
          )}
          <BlockOutputPane output={output} />
        </div>
      )}

      {caption && (
        <figcaption className="border-t border-white/10 px-4 py-2 text-xs text-white/60">{caption}</figcaption>
      )}
    </figure>
  );
}
