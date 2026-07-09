"use client";

// Renders the `exercise` lesson block: prompt + editable starter code, a
// Check/Run (coding languages) or Open in Studio (robotics languages) action,
// and a Show Answer reveal. Completion (for the gamification hook — see
// lib/learn/block-progress.ts) fires on a passing Check, or on Show Answer
// (treated as "attempted") — whichever comes first, matching the plan's
// "keep it simple" guidance.
import * as React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Play, Loader2, ExternalLink, Eye, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeBlock } from "./code-block";
import { studioHref } from "@/lib/studio/open-in-studio";
import { runCodingSnippet, checkOutputContains } from "@/lib/run/run-snippet";
import { recordBlockCompletion } from "@/lib/learn/block-progress";
import { ROBOTICS_TRYIT_LANGS, DEFAULT_ROBOTICS_BOARD } from "./lesson-block-shared";
import { BlockOutputPane, EngineBadge, type BlockOutputState } from "./run-output";

function textareaRows(text: string): number {
  return Math.min(20, Math.max(4, text.split("\n").length));
}

export function ExerciseBlock({
  language,
  prompt,
  starter,
  solution,
  check,
  caption,
  refId,
}: {
  language: string;
  prompt: string;
  starter: string;
  solution: string;
  check?: string;
  caption?: string;
  refId: string;
}) {
  const [code, setCode] = React.useState(starter);
  const [output, setOutput] = React.useState<BlockOutputState>({ mode: "idle" });
  const [busy, setBusy] = React.useState(false);
  const [checkResult, setCheckResult] = React.useState<"pass" | "fail" | null>(null);
  const [showSolution, setShowSolution] = React.useState(false);
  const completedRef = React.useRef(false);

  const isRobotics = ROBOTICS_TRYIT_LANGS.has(language);

  async function markComplete() {
    if (completedRef.current) return;
    completedRef.current = true;
    const result = await recordBlockCompletion({ type: "exercise", language, refId });
    if (result && result.awarded > 0) {
      toast.success(`+${result.awarded} XP`, { description: "Exercise complete — nice work!" });
    }
  }

  async function run() {
    setBusy(true);
    setCheckResult(null);
    try {
      const r = await runCodingSnippet(language, code);
      if (r.mode === "render") {
        setOutput({ mode: "render", doc: r.doc });
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
        if (check) {
          const pass = ok && checkOutputContains(check, r.result.output);
          setCheckResult(pass ? "pass" : "fail");
          if (pass) await markComplete();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    setShowSolution(true);
    await markComplete();
  }

  function reset() {
    setCode(starter);
    setOutput({ mode: "idle" });
    setCheckResult(null);
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exercise</p>
        <div className="md-body text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{prompt}</ReactMarkdown>
        </div>
      </div>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        aria-label={`${language} exercise code (editable)`}
        rows={textareaRows(code)}
        className="resize-y rounded-none border-0 border-b border-border font-mono text-sm shadow-none focus-visible:ring-0"
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="Reset code" title="Reset to starter">
          <RotateCcw className="size-3.5" />
        </Button>
        {isRobotics ? (
          <Button variant="gradient" size="sm" asChild>
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
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {check ? "Check" : "Run"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={reveal} disabled={showSolution}>
          <Eye className="size-3.5" /> Show answer
        </Button>
        {checkResult === "pass" && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" /> Check passed — RoboPoints awarded
          </span>
        )}
        {checkResult === "fail" && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-destructive">
            <XCircle className="size-3.5" /> Not quite — compare with Show answer
          </span>
        )}
      </div>

      {output.mode !== "idle" && (
        <div className="border-b border-border">
          {output.mode === "run" && output.engine && (
            <div className="flex items-center gap-2 px-4 py-1.5">
              <EngineBadge engine={output.engine} />
            </div>
          )}
          <BlockOutputPane output={output} />
        </div>
      )}

      {showSolution && (
        <div className="p-4 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solution</p>
          <CodeBlock
            language={language}
            code={solution}
            openInStudio={isRobotics}
            board={DEFAULT_ROBOTICS_BOARD[language]}
          />
        </div>
      )}

      {caption && <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{caption}</div>}
    </div>
  );
}
