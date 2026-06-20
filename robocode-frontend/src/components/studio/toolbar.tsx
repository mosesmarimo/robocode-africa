"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square, Save, Share2, Undo2, Redo2, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudio } from "@/lib/studio/store";
import { BOARD_LIST, type BoardId } from "@/lib/domain/boards";
import { saveProject, createProject } from "@/lib/studio/actions";

export function Toolbar({ projectId, onRun, onStop }: { projectId: string; onRun: () => void; onStop: () => void }) {
  const title = useStudio((s) => s.title);
  const setTitle = useStudio((s) => s.setTitle);
  const board = useStudio((s) => s.board);
  const setBoard = useStudio((s) => s.setBoard);
  const running = useStudio((s) => s.running);
  const dirty = useStudio((s) => s.dirty);
  const [saving, setSaving] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);

  React.useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  async function handleSave() {
    setSaving(true);
    const st = useStudio.getState();
    try {
      const files = st.files.map((f) => ({ name: f.name, language: f.language, content: f.content }));
      if (projectId === "new") {
        await createProject({ title: st.title, board: st.board, diagram: st.toDiagram(), files });
        return; // redirects
      }
      await saveProject({ projectId, title: st.title, board: st.board, diagram: st.toDiagram(), files });
      st.markSaved();
      toast.success("Project saved");
    } catch {
      toast.error("Couldn't save — please sign in as the owner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href="/app/projects" aria-label="Back to projects"><ArrowLeft className="size-4" /></Link>
      </Button>
      <BrandLogo href="/app" showName={false} className="mr-0.5" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-44 rounded-md bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:bg-muted focus:bg-muted sm:w-64"
      />
      <div className="hidden sm:block">
        <Select value={board} onValueChange={(v) => setBoard(v as BoardId)}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BOARD_LIST.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-1 flex items-center">
        <Button variant="ghost" size="icon-sm" onClick={() => useStudio.getState().undo()} aria-label="Undo"><Undo2 className="size-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => useStudio.getState().redo()} aria-label="Redo"><Redo2 className="size-4" /></Button>
      </div>

      <div className="flex-1" />

      {running ? (
        <Button variant="destructive" onClick={onStop}><Square className="size-4" /> Stop</Button>
      ) : (
        <Button variant="gradient" onClick={onRun}><Play className="size-4" /> Run</Button>
      )}
      <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen} aria-label="Toggle fullscreen" title="Fullscreen">
        {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      </Button>
      <Button
        variant="outline"
        onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Share link copied"); }}
      >
        <Share2 className="size-4" /> <span className="hidden sm:inline">Share</span>
      </Button>
      <Button variant={dirty ? "default" : "outline"} onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        <span className="hidden sm:inline">Save</span>
      </Button>
    </header>
  );
}
