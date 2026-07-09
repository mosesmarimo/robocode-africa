"use client";

import * as React from "react";
import { unstable_rethrow } from "next/navigation";
import { Play, Square, Save, Share2, Undo2, Redo2, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudio } from "@/lib/studio/store";
import { BOARD_LIST, type BoardId } from "@/lib/domain/boards";
import { saveProject, createProject, shareProject } from "@/lib/studio/actions";
import { getReferralStats } from "@/lib/referrals/actions";

export function Toolbar({ projectId, onRun, onStop }: { projectId: string; onRun: () => void; onStop: () => void }) {
  const board = useStudio((s) => s.board);
  const setBoard = useStudio((s) => s.setBoard);
  const running = useStudio((s) => s.running);
  const dirty = useStudio((s) => s.dirty);
  const [saving, setSaving] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
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
        await createProject({ title: st.title, kind: "robotics", board: st.board, diagram: st.toDiagram(), files });
        return; // redirects
      }
      await saveProject({ projectId, title: st.title, kind: "robotics", board: st.board, diagram: st.toDiagram(), files });
      st.markSaved();
      toast.success("Project saved");
    } catch (e) {
      // createProject() ends in redirect(), which throws a NEXT_REDIRECT
      // control-flow signal — let Next handle it rather than treating it as a
      // save failure.
      unstable_rethrow(e);
      toast.error("Couldn't save — please sign in as the owner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (projectId === "new") {
      toast.error("Save your project first, then share it.");
      return;
    }
    setSharing(true);
    try {
      const { shareId } = await shareProject(projectId);
      // Tag the link with the sharer's own referral code so every share is
      // also an invite — best-effort: a failure here still yields a working
      // (untagged) share link rather than blocking the share.
      let ref: string | null = null;
      try {
        ref = (await getReferralStats()).code;
      } catch {
        /* no ref tag — the share link still works */
      }
      const url = ref
        ? `${window.location.origin}/p/${shareId}?ref=${encodeURIComponent(ref)}`
        : `${window.location.origin}/p/${shareId}`;
      await navigator.clipboard?.writeText(url);
      toast.success("Public share link copied", { description: url });
    } catch {
      toast.error("Couldn't create a share link — please sign in as the owner.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
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
      <Button variant="outline" onClick={handleShare} disabled={sharing} title="Create a public read-only link">
        {sharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
        <span className="hidden sm:inline">Share</span>
      </Button>
      <Button variant={dirty ? "default" : "outline"} onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        <span className="hidden sm:inline">Save</span>
      </Button>
    </header>
  );
}
