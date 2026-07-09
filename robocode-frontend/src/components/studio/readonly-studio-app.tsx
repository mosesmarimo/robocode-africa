"use client";

import * as React from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Play, Square, Eye, GitFork, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStudio, type StudioFile } from "@/lib/studio/store";
import type { Diagram } from "@/lib/domain/diagram";
import { getBoard } from "@/lib/domain/boards";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { StudioCanvas } from "@/components/studio/canvas";
import { CodeEditor } from "@/components/studio/code-editor";
import { SerialMonitor } from "@/components/studio/serial-monitor";
import { FileTabs } from "@/components/studio/file-tabs";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSimulation } from "@/lib/sim/use-simulation";
import { remixProject } from "@/lib/studio/remix-action";

export type ReadOnlyStudioInitial = {
  title: string;
  board: string;
  diagram: Diagram;
  files: StudioFile[];
  /** The real project id (not the share slug) — needed to call the remix endpoint. */
  sourceProjectId: string;
  /** Whether the visitor already has a session — gates whether "Remix" calls the
   * API directly or sends them to sign up first. */
  authenticated: boolean;
  /** The referrer's code carried on the share link (`/p/<id>?ref=CODE`), if any —
   * forwarded to `/join` so signing up from a shared project also counts as an invite. */
  joinRef: string | null;
};

/** "Remix in Studio": authenticated visitors clone the project into their own
 * account immediately; signed-out visitors go to `/join` (carrying the
 * author's ref code, if the link had one) so they earn the referral bonus. */
function RemixButton({ sourceProjectId, authenticated, joinRef }: Pick<ReadOnlyStudioInitial, "sourceProjectId" | "authenticated" | "joinRef">) {
  const [pending, setPending] = React.useState(false);

  if (!authenticated) {
    return (
      <Button variant="gradient" asChild>
        <Link href={joinRef ? `/join?ref=${encodeURIComponent(joinRef)}` : "/join"}>
          <GitFork className="size-4" /> Remix in Studio
        </Link>
      </Button>
    );
  }

  async function handleRemix() {
    setPending(true);
    try {
      await remixProject(sourceProjectId); // redirects to /studio/<newId> on success
    } catch (e) {
      unstable_rethrow(e); // let the NEXT_REDIRECT signal bubble
      // Server Action errors are opaque across the client boundary (and the
      // ApiError class itself is server-only) — show a fixed, friendly
      // message rather than trying to inspect it, matching the toolbar's
      // save/share error handling.
      toast.error("Couldn't remix this project — it may be private.");
      setPending(false);
    }
  }

  return (
    <Button variant="gradient" onClick={handleRemix} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <GitFork className="size-4" />}
      Remix in Studio
    </Button>
  );
}

export function ReadOnlyStudioApp({ initial }: { initial: ReadOnlyStudioInitial }) {
  const load = useStudio((s) => s.load);
  const running = useStudio((s) => s.running);
  // projectId "new" → useSimulation skips the (authed) simulation-run record.
  const { start, stop } = useSimulation("new");

  React.useEffect(() => {
    // Every file is marked read-only so the Monaco editor can't be edited.
    load({
      projectId: "new",
      title: initial.title,
      diagram: initial.diagram,
      files: initial.files.map((f) => ({ ...f, readonly: true })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Slim, read-only top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
        <BrandLogo href="/" showName={false} className="mr-0.5" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{initial.title}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">{getBoard(initial.board).name}</p>
        </div>
        <span className="ml-2 hidden items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          <Eye className="size-3" /> Read-only shared project
        </span>

        <div className="flex-1" />

        <ThemeToggle />
        {running ? (
          <Button variant="destructive" onClick={stop}><Square className="size-4" /> Stop</Button>
        ) : (
          <Button variant="outline" onClick={start}><Play className="size-4" /> Run</Button>
        )}
        <RemixButton sourceProjectId={initial.sourceProjectId} authenticated={initial.authenticated} joinRef={initial.joinRef} />
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <Link href="/">Make your own</Link>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: diagram + live simulation (no editing affordances) */}
        <section className="relative flex min-w-0 flex-1 flex-col">
          <StudioCanvas readOnly />
        </section>

        {/* Right: read-only code with file tabs + serial monitor */}
        <aside className="hidden w-[30rem] shrink-0 flex-col border-l border-border lg:flex">
          <div className="flex items-center gap-2 border-b border-border bg-card pr-2">
            <div className="min-w-0 flex-1">
              <FileTabs />
            </div>
          </div>
          <div className="min-h-0 flex-[3]">
            <CodeEditor />
          </div>
          <div className="h-44 shrink-0">
            <SerialMonitor />
          </div>
        </aside>
      </div>
    </div>
  );
}
