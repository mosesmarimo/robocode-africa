"use client";

// The chromeless renderer for a published project — used both by the
// `_site/[domain]/[subdomain]` route (studio domains + the robocode.africa
// published fallback both rewrite there, see src/proxy.ts) and reused as-is
// by both routes per the "extract the renderer into a shared component"
// design. Dynamically imported with `ssr: false` by published-site-client.tsx
// (Monaco/the Studio canvas need browser APIs), mirroring the existing
// readonly-studio-client.tsx/readonly-studio-app.tsx split.
//
// IMPORTANT: the robotics branch renders through the real Studio
// canvas + sim engine (useSimulation/StudioCanvas) — never the code sandbox.
// The code sandbox (runInBrowser) is coding-only, used only by the
// non-render coding branch below.
import * as React from "react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Play, Square, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { useTheme } from "@/components/theme/theme-provider";
import { useStudio, type StudioFile } from "@/lib/studio/store";
import type { Diagram } from "@/lib/domain/diagram";
import { getBoard } from "@/lib/domain/boards";
import { StudioCanvas } from "@/components/studio/canvas";
import { CodeEditor } from "@/components/studio/code-editor";
import { FileTabs } from "@/components/studio/file-tabs";
import { SerialMonitor } from "@/components/studio/serial-monitor";
import { useSimulation } from "@/lib/sim/use-simulation";
import { langFromFiles, CODE_LANG_MAP, buildPreviewDoc, monacoForFile, type CodeFile } from "@/lib/studio/coding";
import { runInBrowser } from "@/lib/run";
import { ROOT_ORIGIN } from "@/lib/domain/constants";

export interface PublishedSiteData {
  title: string;
  kind: string;
  board: string;
  diagram: Diagram;
  /** Pre-built for kind==="robotics" (server-side, mirrors /p/[shareId]'s buildFiles); empty otherwise. */
  studioFiles: StudioFile[];
  /** Raw published files, used for every non-robotics (coding) kind. */
  codeFiles: CodeFile[];
  /** Absolute `/join?ref=...` URL on the main app — the footer CTA's target. */
  joinHref: string;
}

/** Persistent footer bar: "Built with RoboCode — make your own", the one
 * piece of chrome every published site keeps (per the brief). */
function FooterCta({ joinHref }: { joinHref: string }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-center gap-2 border-t border-border bg-card/95 px-4 text-xs backdrop-blur">
      <span className="hidden text-muted-foreground sm:inline">Built with RoboCode</span>
      <Button asChild size="sm" variant="gradient" className="h-7 px-3 text-xs">
        <Link href={joinHref}>
          <Sparkles className="size-3.5" /> Make your own
        </Link>
      </Button>
    </div>
  );
}

/** kind==="robotics": the real read-only Studio (canvas + sim + code), not the code sandbox. */
function RoboticsSite({ data }: { data: PublishedSiteData }) {
  const load = useStudio((s) => s.load);
  const running = useStudio((s) => s.running);
  // projectId "new" → useSimulation skips the (authed) simulation-run record,
  // same as the /p/[shareId] read-only share view.
  const { start, stop } = useSimulation("new");

  React.useEffect(() => {
    load({
      projectId: "new",
      title: data.title,
      diagram: data.diagram,
      files: data.studioFiles.map((f) => ({ ...f, readonly: true })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
        <BrandLogo href={ROOT_ORIGIN} showName={false} className="mr-0.5" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{data.title}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">{getBoard(data.board).name}</p>
        </div>
        <div className="flex-1" />
        {running ? (
          <Button variant="destructive" size="sm" onClick={stop}>
            <Square className="size-4" /> Stop
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={start}>
            <Play className="size-4" /> Run
          </Button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="relative flex min-w-0 flex-1 flex-col">
          <StudioCanvas readOnly />
        </section>
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

      <FooterCta joinHref={data.joinHref} />
    </div>
  );
}

/** kind==="coding", html/css: rendered straight in an iframe — no code sandbox involved. */
function CodingRenderSite({ data }: { data: PublishedSiteData }) {
  const doc = React.useMemo(() => buildPreviewDoc(data.codeFiles), [data.codeFiles]);
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="min-h-0 flex-1">
        <iframe
          title={data.title}
          sandbox="allow-scripts allow-modals"
          srcDoc={doc}
          className="size-full border-0 bg-white"
        />
      </div>
      <FooterCta joinHref={data.joinHref} />
    </div>
  );
}

/** kind==="coding", every other language: read-only code + a Run button using the browser sandbox. */
function CodingRunSite({ data }: { data: PublishedSiteData }) {
  const { resolved } = useTheme();
  const [active, setActive] = React.useState(data.codeFiles[0]?.name ?? "");
  const [output, setOutput] = React.useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const lang = React.useMemo(() => langFromFiles(data.codeFiles), [data.codeFiles]);
  const file = data.codeFiles.find((f) => f.name === active) ?? data.codeFiles[0];

  async function run() {
    setBusy(true);
    setOutput(null);
    try {
      const r = await runInBrowser(lang, data.codeFiles, data.codeFiles[0]?.name);
      if (!r) {
        setOutput({ text: "This language can't run in your browser.", error: true });
      } else if (!r.ok) {
        setOutput({ text: r.text || "Couldn't run this program.", error: true });
      } else {
        setOutput({
          text: r.output || (r.error ? r.text || "Error" : "(program finished with no output)"),
          error: r.error,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
        <BrandLogo href={ROOT_ORIGIN} showName={false} className="mr-0.5" />
        <p className="truncate text-sm font-semibold">{data.title}</p>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col border-r border-border">
          {data.codeFiles.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1">
              {data.codeFiles.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setActive(f.name)}
                  className={`whitespace-nowrap rounded px-2 py-1 text-xs ${
                    f.name === active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              theme={resolved === "dark" ? "vs-dark" : "vs"}
              language={monacoForFile(file?.name ?? "")}
              value={file?.content ?? ""}
              options={{
                readOnly: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
              loading={
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              }
            />
          </div>
        </div>
        <div className="w-[26rem] shrink-0 overflow-auto bg-[#0b0e16] p-4">
          <pre className={`whitespace-pre-wrap break-words font-mono text-sm leading-relaxed ${output?.error ? "text-red-400" : "text-emerald-300"}`}>
            {output?.text ?? "Click Run to execute this program."}
          </pre>
        </div>
      </div>

      <FooterCta joinHref={data.joinHref} />
    </div>
  );
}

export function PublishedSiteView({ data }: { data: PublishedSiteData }) {
  if (data.kind === "robotics") return <RoboticsSite data={data} />;
  const lang = langFromFiles(data.codeFiles);
  if (CODE_LANG_MAP[lang]?.render) return <CodingRenderSite data={data} />;
  return <CodingRunSite data={data} />;
}
