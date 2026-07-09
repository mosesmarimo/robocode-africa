"use client";

// Shared "engine badge + output pane" rendering, mirroring the pattern in
// components/studio/coding-studio.tsx (ENGINE_BADGE + the output panel) so a
// tryit/exercise Run result looks consistent with the Coding Studio.
import { cn } from "@/lib/utils";

export type RunEngine = "browser" | "server" | "ai";

export type BlockOutputState =
  | { mode: "idle" }
  | { mode: "render"; doc: string }
  | { mode: "run"; text: string; error: boolean; engine?: RunEngine };

const ENGINE_BADGE: Record<RunEngine, { label: string; className: string }> = {
  browser: { label: "Ran in your browser", className: "border-border/60 bg-muted text-muted-foreground" },
  server: { label: "Ran on server", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" },
  ai: { label: "AI-simulated (approximate)", className: "border-amber-500/30 bg-amber-500/10 text-amber-500" },
};

export function EngineBadge({ engine }: { engine?: RunEngine }) {
  if (!engine) return null;
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", ENGINE_BADGE[engine].className)}>
      {ENGINE_BADGE[engine].label}
    </span>
  );
}

export function BlockOutputPane({ output, minHeight = 120 }: { output: BlockOutputState; minHeight?: number }) {
  if (output.mode === "idle") return null;
  if (output.mode === "render") {
    return (
      <iframe
        title="Preview"
        sandbox="allow-scripts allow-modals"
        srcDoc={output.doc}
        className="w-full border-0 bg-white"
        style={{ height: minHeight }}
      />
    );
  }
  return (
    <pre
      className={cn(
        "w-full overflow-auto whitespace-pre-wrap break-words bg-[#0b0e16] p-3 font-mono text-xs leading-relaxed",
        output.error ? "text-red-400" : "text-emerald-300",
      )}
      style={{ minHeight }}
    >
      {output.text}
    </pre>
  );
}
