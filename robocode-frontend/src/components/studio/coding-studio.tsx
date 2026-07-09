"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Play, Loader2, Wand2, Terminal, Eraser, Download, Volume2, Square, ShieldCheck, BookOpen, Plus, X, Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme/theme-provider";
import { useStudio } from "@/lib/studio/store";
import { cn } from "@/lib/utils";
import {
  CODE_LANGUAGES, CODE_LANG_MAP, DEFAULT_CODE_LANG, buildPreviewDoc, monacoForFile, langFromFiles,
  type CodeLang, type CodeFile,
} from "@/lib/studio/coding";
import { runProject, generateCodeAction, explainCodeAction, validateCodeAction } from "@/lib/studio/coding-actions";
import { runInBrowser } from "@/lib/run";
import { createProject, saveProject } from "@/lib/studio/actions";
import { zipFiles, downloadBlob } from "@/lib/zip";

type RunEngine = "browser" | "server" | "ai";

type OutputState =
  | { mode: "idle" }
  | { mode: "render"; doc: string }
  | { mode: "run"; text: string; error: boolean; engine?: RunEngine }
  | { mode: "explain"; text: string }
  | { mode: "validate"; text: string };

const ENGINE_BADGE: Record<RunEngine, { label: string; className: string }> = {
  browser: { label: "Ran in your browser", className: "border-border/60 bg-muted text-muted-foreground" },
  server: { label: "Ran on server", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" },
  ai: { label: "AI-simulated (approximate)", className: "border-amber-500/30 bg-amber-500/10 text-amber-500" },
};

// Languages shown alphabetically by label.
const LANG_OPTIONS = [...CODE_LANGUAGES].sort((a, b) => a.label.localeCompare(b.label));

export function CodingStudio({
  projectId,
  projectKind = "robotics",
  initialFiles,
  initialExplanations,
}: {
  projectId: string;
  projectKind?: "robotics" | "coding";
  initialFiles?: CodeFile[];
  initialExplanations?: Record<string, { text: string; current: boolean }>;
}) {
  const { resolved } = useTheme();
  const storeTitle = useStudio((s) => s.title);
  const storageKey = `rc-coding:${projectId}`;
  const isCodingProject = projectKind === "coding" && !!initialFiles?.length;

  const [lang, setLang] = React.useState<CodeLang>(() => (isCodingProject ? langFromFiles(initialFiles!) : DEFAULT_CODE_LANG));
  const [files, setFiles] = React.useState<CodeFile[]>(() =>
    isCodingProject ? initialFiles!.map((f) => ({ ...f })) : CODE_LANG_MAP[DEFAULT_CODE_LANG].starter.map((f) => ({ ...f })),
  );
  const [activeFile, setActiveFile] = React.useState<string>(() => (isCodingProject ? initialFiles![0].name : CODE_LANG_MAP[DEFAULT_CODE_LANG].starter[0].name));
  const [output, setOutput] = React.useState<OutputState>({ mode: "idle" });
  const [busy, setBusy] = React.useState<null | "run" | "explain" | "validate">(null);
  const [explained, setExplained] = React.useState<Record<string, { text: string; content: string }>>(() => {
    const seed: Record<string, { text: string; content: string }> = {};
    if (isCodingProject && initialExplanations) {
      for (const f of initialFiles!) {
        const e = initialExplanations[f.name];
        if (e?.current) seed[f.name] = { text: e.text, content: f.content };
      }
    }
    return seed;
  });
  const [saving, setSaving] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);
  const [audioLoading, setAudioLoading] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [vibeOpen, setVibeOpen] = React.useState(false);
  const [vibePrompt, setVibePrompt] = React.useState("");
  const [vibing, setVibing] = React.useState(false);

  const def = CODE_LANG_MAP[lang];
  const active = files.find((f) => f.name === activeFile) ?? files[0];

  // Load scratch (for non-coding-project contexts) once.
  React.useEffect(() => {
    if (isCodingProject) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw) as { lang?: CodeLang; files?: CodeFile[]; activeFile?: string };
      if (s.files?.length) {
        setFiles(s.files);
        setActiveFile(s.activeFile && s.files.some((f) => f.name === s.activeFile) ? s.activeFile : s.files[0].name);
        setLang(s.lang && CODE_LANG_MAP[s.lang] ? s.lang : langFromFiles(s.files));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist scratch (debounced).
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ lang, files, activeFile }));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [lang, files, activeFile, storageKey]);

  // Stop any audio on unmount.
  React.useEffect(() => () => audioRef.current?.pause(), []);

  // Auto-show the active file's current persisted explanation once on mount.
  const didAutoShow = React.useRef(false);
  React.useEffect(() => {
    if (didAutoShow.current) return;
    didAutoShow.current = true;
    const e = explained[activeFile];
    if (e && e.content === active.content) setOutput({ mode: "explain", text: e.text });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setActiveContent(content: string) {
    setFiles((fs) => fs.map((f) => (f.name === active.name ? { ...f, content } : f)));
  }

  function changeLang(next: CodeLang) {
    const starter = CODE_LANG_MAP[lang].starter;
    const pristine = JSON.stringify(files) === JSON.stringify(starter);
    if (!pristine && !window.confirm("Switch language? This replaces the current files with a fresh starter.")) return;
    const fresh = CODE_LANG_MAP[next].starter.map((f) => ({ ...f }));
    setLang(next);
    setFiles(fresh);
    setActiveFile(fresh[0].name);
    setOutput({ mode: "idle" });
  }

  function addFile() {
    const name = window.prompt("New file name (with extension):", `file.${def.ext}`)?.trim();
    if (!name) return;
    if (files.some((f) => f.name === name)) return toast.error("A file with that name already exists.");
    setFiles((fs) => [...fs, { name, content: "" }]);
    setActiveFile(name);
  }
  function deleteFile(name: string) {
    if (files.length <= 1) return;
    if (!window.confirm(`Delete ${name}?`)) return;
    setFiles((fs) => {
      const next = fs.filter((f) => f.name !== name);
      if (activeFile === name) setActiveFile(next[0].name);
      return next;
    });
  }

  async function run() {
    if (def.render) {
      setOutput({ mode: "render", doc: buildPreviewDoc(files) });
      return;
    }
    setBusy("run");
    setOutput({ mode: "run", text: "Running…", error: false });
    try {
      // Browser tier first (Web Worker — Pyodide/sql.js/JS/TS), entirely
      // client-side; null means this language has no browser engine. Only
      // then fall through to the server action, which owns the server
      // (jailed Docker sandbox) and AI tiers — see coding-actions.ts.
      const browser = await runInBrowser(lang, files, files[0]?.name);
      const r = browser ?? (await runProject(lang, files, files[0]?.name));
      setOutput(
        !r.ok
          ? { mode: "run", text: r.text || "Couldn't run your code.", error: true, engine: r.engine }
          : { mode: "run", text: r.output || (r.error ? r.text || "Error" : "(program finished with no output)"), error: r.error, engine: r.engine },
      );
    } finally {
      setBusy(null);
    }
  }

  async function validate() {
    setBusy("validate");
    setOutput({ mode: "validate", text: "Validating…" });
    try {
      const r = await validateCodeAction(lang, active.content, active.name);
      setOutput({ mode: "validate", text: r.ok && r.result ? r.result : r.text || "Couldn't validate." });
    } finally {
      setBusy(null);
    }
  }

  async function explain(thenSpeak = false) {
    const cached = explained[active.name];
    if (cached && cached.content === active.content) {
      setOutput({ mode: "explain", text: cached.text });
      if (thenSpeak) void speak(cached.text);
      return;
    }
    setBusy("explain");
    setOutput({ mode: "explain", text: "Explaining…" });
    try {
      const r = await explainCodeAction(lang, active.content, active.name, isCodingProject ? projectId : undefined);
      const text = r.ok && r.explanation ? r.explanation : r.text || "Couldn't explain.";
      setOutput({ mode: "explain", text });
      if (r.ok && r.explanation) {
        setExplained((m) => ({ ...m, [active.name]: { text: r.explanation as string, content: active.content } }));
        if (thenSpeak) void speak(r.explanation);
      }
    } finally {
      setBusy(null);
    }
  }

  /** Read text aloud using the server TTS (AWS Polly neural — same as Spelling Bee). */
  async function speak(text: string) {
    const plain = text.replace(/[`*#>_]/g, "").replace(/\n{2,}/g, ". ").trim();
    if (!plain) return;
    setAudioLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: plain.slice(0, 3000) }),
      });
      if (!res.ok) {
        toast.error("Couldn't generate audio.");
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => setSpeaking(false);
      setSpeaking(true);
      await audio.play();
    } catch {
      toast.error("Couldn't play audio.");
      setSpeaking(false);
    } finally {
      setAudioLoading(false);
    }
  }
  function toggleAudio() {
    if (speaking) {
      audioRef.current?.pause();
      setSpeaking(false);
      return;
    }
    if ((output.mode === "explain" || output.mode === "validate") && !output.text.endsWith("…")) void speak(output.text);
    else void explain(true); // no explanation yet → generate then read
  }

  async function vibe() {
    const instruction = vibePrompt.trim();
    if (!instruction) return;
    setVibing(true);
    try {
      const r = await generateCodeAction(lang, instruction);
      if (!r.ok || !r.files?.length) {
        toast.error(r.text || "RoboVibe couldn't generate that. Try rephrasing.");
        return;
      }
      setFiles(r.files.map((f) => ({ ...f })));
      setActiveFile(r.files[0].name);
      setOutput({ mode: "idle" });
      setVibeOpen(false);
      setVibePrompt("");
      toast.success(`RoboVibe created ${r.files.length} file${r.files.length === 1 ? "" : "s"} — hit Run to try it.`);
    } finally {
      setVibing(false);
    }
  }

  function download() {
    if (files.length === 1) {
      downloadBlob(new Blob([files[0].content], { type: "text/plain" }), files[0].name);
      return;
    }
    const base = (storeTitle || "robocode-project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
    downloadBlob(zipFiles(files), `${base}.zip`);
  }

  async function handleSave() {
    setSaving(true);
    const filesIn = files.map((f) => ({ name: f.name, language: monacoForFile(f.name), content: f.content }));
    const title = storeTitle || "Coding Project";
    const diagram = { board: "arduino-uno", parts: [], wires: [] };
    try {
      if (projectId === "new" || projectKind !== "coding") {
        // New, or a coding scratchpad inside a robotics project → make a new coding project.
        await createProject({ title, kind: "coding", board: "arduino-uno", diagram, files: filesIn });
        return; // redirects
      }
      await saveProject({ projectId, title, kind: "coding", board: "arduino-uno", diagram, files: filesIn });
      toast.success("Coding project saved");
    } catch (e) {
      const { unstable_rethrow } = await import("next/navigation");
      unstable_rethrow(e);
      toast.error("Couldn't save — please sign in as the owner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-3">
        <Select value={lang} onValueChange={(v) => changeLang(v as CodeLang)}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANG_OPTIONS.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="gradient" onClick={run} disabled={busy === "run"}>
          {busy === "run" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run
        </Button>
        {!def.render && (
          <Button variant="outline" onClick={validate} disabled={busy === "validate"}>
            {busy === "validate" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            <span className="hidden md:inline">Validate with AI</span>
          </Button>
        )}
        <button
          type="button"
          onClick={() => setVibeOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
        >
          <Wand2 className="size-4" /> RoboVibe
        </button>
        <Button variant="outline" onClick={() => explain(false)} disabled={busy === "explain"}>
          {busy === "explain" ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
          <span className="hidden md:inline">Code Explainer</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={toggleAudio} disabled={audioLoading} aria-label={speaking ? "Stop audio" : "Read explanation aloud"} title="Audio explanation">
          {audioLoading ? <Loader2 className="size-4 animate-spin" /> : speaking ? <Square className="size-4 text-destructive" /> : <Volume2 className="size-4" />}
        </Button>

        <div className="flex-1" />

        <Button variant="ghost" size="icon-sm" onClick={download} aria-label="Download code" title={files.length > 1 ? "Download as .zip" : "Download file"}>
          <Download className="size-4" />
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span className="hidden sm:inline">{projectKind === "coding" ? "Save" : "Save as project"}</span>
        </Button>
      </div>

      {/* Editor | Output */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Editor + file tabs */}
        <div className="flex min-h-0 flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-border bg-card">
            {files.map((f) => (
              <div
                key={f.name}
                className={cn(
                  "group flex shrink-0 items-center gap-1.5 border-r border-border px-3 py-2 text-xs font-medium",
                  f.name === activeFile ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <button onClick={() => setActiveFile(f.name)} className="whitespace-nowrap">{f.name}</button>
                {files.length > 1 && (
                  <button onClick={() => deleteFile(f.name)} aria-label={`Delete ${f.name}`} className="opacity-0 transition-opacity group-hover:opacity-100">
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addFile} aria-label="Add file" title="Add file" className="shrink-0 px-2.5 py-2 text-muted-foreground hover:text-foreground">
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Editor
              key={active?.name}
              height="100%"
              theme={resolved === "dark" ? "vs-dark" : "vs"}
              language={monacoForFile(active?.name ?? "")}
              value={active?.content ?? ""}
              onChange={(v) => setActiveContent(v ?? "")}
              loading={<div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>}
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, smoothScrolling: true, padding: { top: 12 }, tabSize: 2, automaticLayout: true }}
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-xs font-semibold text-muted-foreground">
            <Terminal className="size-3.5" />
            {output.mode === "render" ? "Preview" : output.mode === "explain" ? "Explanation" : output.mode === "validate" ? "Validation" : "Output"}
            {output.mode === "run" && output.engine && (
              <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium normal-case", ENGINE_BADGE[output.engine].className)}>
                {ENGINE_BADGE[output.engine].label}
              </span>
            )}
            <div className="flex-1" />
            {output.mode !== "idle" && (
              <button onClick={() => { audioRef.current?.pause(); setSpeaking(false); setOutput({ mode: "idle" }); }} className="inline-flex items-center gap-1 hover:text-foreground" aria-label="Clear">
                <Eraser className="size-3.5" /> Clear
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {output.mode === "idle" && (
              <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
                <div>
                  <Terminal className="mx-auto mb-2 size-6 opacity-60" />
                  {def.render ? "Click Run to preview your page." : "Run, Validate or Explain — the AI shows the result here."}
                </div>
              </div>
            )}
            {output.mode === "render" && (
              <iframe title="Preview" sandbox="allow-scripts allow-modals" srcDoc={output.doc} className="size-full border-0 bg-white" />
            )}
            {output.mode === "run" && (
              <pre className={cn("size-full overflow-auto whitespace-pre-wrap break-words bg-[#0b0e16] p-4 font-mono text-sm leading-relaxed", output.error ? "text-red-400" : "text-emerald-300")}>
                {output.text}
              </pre>
            )}
            {(output.mode === "explain" || output.mode === "validate") &&
              (busy === output.mode ? (
                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" /> {output.mode === "explain" ? "Explaining…" : "Validating…"}
                </div>
              ) : (
                <div className="size-full overflow-auto p-4">
                  <div className="md-body text-sm">
                    <Markdown remarkPlugins={[remarkGfm]}>{output.text}</Markdown>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* RoboVibe dialog */}
      <Dialog open={vibeOpen} onOpenChange={setVibeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="size-5 text-fuchsia-500" /> RoboVibe — {def.label}</DialogTitle>
            <DialogDescription>
              Describe what you want to build. The AI can create a single file or a small multi-file project in {def.label}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Describe what to build"
            placeholder={`e.g. ${def.render ? "a landing page with a header, styles and a button" : "a small number-guessing game with a helper module"}`}
            value={vibePrompt}
            onChange={(e) => setVibePrompt(e.target.value)}
            rows={4}
            maxLength={2000}
            disabled={vibing}
          />
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost" disabled={vibing}>Cancel</Button></DialogClose>
            <Button variant="gradient" onClick={vibe} disabled={vibing || vibePrompt.trim().length === 0}>
              {vibing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {vibing ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
