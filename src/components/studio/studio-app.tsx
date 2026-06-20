"use client";

import * as React from "react";
import { FileCode2, Blocks, PanelRight, PanelRightClose } from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import type { Diagram } from "@/lib/domain/diagram";
import { Toolbar } from "@/components/studio/toolbar";
import { StudioCanvas } from "@/components/studio/canvas";
import { Inspector } from "@/components/studio/inspector";
import { CodeEditor } from "@/components/studio/code-editor";
import { BlockEditor } from "@/components/studio/block-editor";
import { SerialMonitor } from "@/components/studio/serial-monitor";
import { useSimulation } from "@/lib/sim/use-simulation";
import { cn } from "@/lib/utils";

type EditorMode = "code" | "blocks";

export type StudioInitial = {
  projectId: string;
  title: string;
  diagram: Diagram;
  code: string;
  language?: string;
};

export function StudioApp({ initial }: { initial: StudioInitial }) {
  const load = useStudio((s) => s.load);
  const { start, stop } = useSimulation(initial.projectId);
  const [mode, setMode] = React.useState<EditorMode>("code");
  const [codeOpen, setCodeOpen] = React.useState(true);

  React.useEffect(() => {
    load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Toolbar projectId={initial.projectId} onRun={start} onStop={stop} />
      <div className="flex min-h-0 flex-1">
        <section className="relative min-w-0 flex-1">
          <StudioCanvas />
          <Inspector />
          <button
            onClick={() => setCodeOpen((o) => !o)}
            aria-label={codeOpen ? "Hide code panel" : "Show code panel"}
            title="Toggle code panel"
            className="absolute right-3 top-3 z-20 hidden size-9 place-items-center rounded-lg border border-white/10 bg-black/40 text-white backdrop-blur hover:bg-black/60 lg:grid"
          >
            {codeOpen ? <PanelRightClose className="size-4" /> : <PanelRight className="size-4" />}
          </button>
        </section>
        {codeOpen && (
        <aside className="hidden w-[30rem] shrink-0 flex-col border-l border-border lg:flex">
          {/* Header with mode toggle */}
          <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
              {mode === "blocks" ? (
                <>
                  <Blocks className="size-4 shrink-0 text-primary" />
                  <span className="truncate">Block Editor</span>
                </>
              ) : (
                <>
                  <FileCode2 className="size-4 shrink-0 text-primary" />
                  <span className="truncate">sketch.ino</span>
                </>
              )}
            </div>
            {/* Segmented toggle */}
            <div className="flex shrink-0 items-center rounded-lg border border-border bg-muted p-0.5">
              <button
                aria-label="Switch to blocks mode"
                onClick={() => setMode("blocks")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  mode === "blocks"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Blocks className="size-3.5" />
                Blocks
              </button>
              <button
                aria-label="Switch to code mode"
                onClick={() => setMode("code")}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  mode === "code"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FileCode2 className="size-3.5" />
                Code
              </button>
            </div>
          </div>

          {/* Editor area */}
          <div className="min-h-0 flex-[3]">
            {mode === "blocks" ? <BlockEditor /> : <CodeEditor />}
          </div>

          {/* Serial monitor always visible */}
          <div className="h-44 shrink-0">
            <SerialMonitor />
          </div>
        </aside>
        )}
      </div>
    </div>
  );
}
