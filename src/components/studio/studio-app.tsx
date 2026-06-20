"use client";

import * as React from "react";
import { FileCode2, Blocks, PanelRight, PanelRightClose, Cpu, BookText } from "lucide-react";
import { useStudio, type StudioFile } from "@/lib/studio/store";
import type { Diagram } from "@/lib/domain/diagram";
import { Toolbar } from "@/components/studio/toolbar";
import { StudioCanvas } from "@/components/studio/canvas";
import { Inspector } from "@/components/studio/inspector";
import { CodeEditor } from "@/components/studio/code-editor";
import { BlockEditor } from "@/components/studio/block-editor";
import { SerialMonitor } from "@/components/studio/serial-monitor";
import { FileTabs } from "@/components/studio/file-tabs";
import { Description } from "@/components/studio/description";
import { useSimulation } from "@/lib/sim/use-simulation";
import { cn } from "@/lib/utils";

type EditorMode = "code" | "blocks";
type SimTab = "simulation" | "description";

export type StudioInitial = {
  projectId: string;
  title: string;
  diagram: Diagram;
  files: StudioFile[];
};

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Cpu; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

export function StudioApp({ initial }: { initial: StudioInitial }) {
  const load = useStudio((s) => s.load);
  const activeFile = useStudio((s) => s.activeFile);
  const { start, stop } = useSimulation(initial.projectId);
  const [mode, setMode] = React.useState<EditorMode>("code");
  const [codeOpen, setCodeOpen] = React.useState(true);
  const [simTab, setSimTab] = React.useState<SimTab>("simulation");

  React.useEffect(() => {
    load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSketch = activeFile.endsWith(".ino");

  return (
    <div className="flex h-screen flex-col bg-background">
      <Toolbar projectId={initial.projectId} onRun={start} onStop={stop} />
      <div className="flex min-h-0 flex-1">
        {/* Left: Simulation / Description */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1">
            <TabButton active={simTab === "simulation"} onClick={() => setSimTab("simulation")} icon={Cpu} label="Simulation" />
            <TabButton active={simTab === "description"} onClick={() => setSimTab("description")} icon={BookText} label="Description" />
            <div className="flex-1" />
            <button
              onClick={() => setCodeOpen((o) => !o)}
              aria-label={codeOpen ? "Hide code panel" : "Show code panel"}
              title="Toggle code panel"
              className="hidden size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:grid"
            >
              {codeOpen ? <PanelRightClose className="size-4" /> : <PanelRight className="size-4" />}
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            {/* Canvas stays mounted so the simulation keeps running; Description overlays it */}
            <StudioCanvas />
            <Inspector />
            {simTab === "description" && (
              <div className="absolute inset-0 z-40 overflow-auto bg-background">
                <Description />
              </div>
            )}
          </div>
        </section>

        {/* Right: code panel with file tabs */}
        {codeOpen && (
          <aside className="hidden w-[30rem] shrink-0 flex-col border-l border-border lg:flex">
            <div className="flex items-center gap-2 border-b border-border bg-card pr-2">
              <div className="min-w-0 flex-1">
                <FileTabs />
              </div>
              {isSketch && (
                <div className="flex shrink-0 items-center rounded-lg border border-border bg-muted p-0.5">
                  <button
                    onClick={() => setMode("blocks")}
                    className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all", mode === "blocks" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <Blocks className="size-3.5" /> Blocks
                  </button>
                  <button
                    onClick={() => setMode("code")}
                    className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all", mode === "code" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <FileCode2 className="size-3.5" /> Code
                  </button>
                </div>
              )}
            </div>
            <div className="min-h-0 flex-[3]">
              {mode === "blocks" && isSketch ? <BlockEditor /> : <CodeEditor />}
            </div>
            <div className="h-44 shrink-0">
              <SerialMonitor />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
