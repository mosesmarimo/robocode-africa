"use client";

import * as React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2 } from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { partLabel } from "@/lib/studio/readme";
import { getBoard } from "@/lib/domain/boards";
import { Button } from "@/components/ui/button";
import { validateProject } from "@/lib/studio/validate-action";
import { diagramToPng } from "@/lib/studio/diagram-image";

export function Description() {
  const readme = useStudio((s) => s.readmeContent());
  const parts = useStudio((s) => s.parts);
  const wires = useStudio((s) => s.wires);
  const board = useStudio((s) => s.board);
  const components = parts.filter((p) => p.id !== "mcu" && !p.type.startsWith("__board__"));

  const [pending, start] = React.useTransition();
  const [result, setResult] = React.useState<string | null>(null);

  function validate() {
    const st = useStudio.getState();
    setResult(null);
    start(async () => {
      const image = (await diagramToPng(st.parts, st.wires, st.board)) ?? undefined;
      const r = await validateProject({
        title: st.title,
        board: getBoard(st.board).name,
        components: components.map((p) => partLabel(p.type)),
        connections: st.wires.map((w) => ({ from: w.from, to: w.to })),
        code: st.sketchContent(),
        readme: st.readmeContent(),
        image,
      });
      setResult(r.text);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="flex items-center gap-1.5 font-display font-semibold"><Sparkles className="size-4 text-primary" /> AI circuit validation</p>
          <p className="text-sm text-muted-foreground">Have DeepSeek check that your wiring and code match.</p>
        </div>
        <Button variant="gradient" onClick={validate} disabled={pending}>
          {pending ? <><Loader2 className="size-4 animate-spin" /> Checking…</> : "Validate with AI"}
        </Button>
      </div>
      {result && (
        <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="md-body text-sm"><Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown></div>
        </div>
      )}

      <div className="md-body">
        <Markdown remarkPlugins={[remarkGfm]}>
          {readme || "# Project description\n\nAdd a `README.md` file to describe this project."}
        </Markdown>
      </div>

      <hr className="my-8 border-border" />

      <h2 className="font-display text-xl font-bold">Live circuit</h2>
      <p className="mt-1 text-sm text-muted-foreground">Auto-generated from the current diagram.</p>

      <h3 className="mt-5 font-display text-base font-semibold">Components ({components.length + 1})</h3>
      <ul className="mt-2 space-y-1 text-sm">
        <li className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" /> <b>{getBoard(board).name}</b>
          <span className="text-muted-foreground">— {getBoard(board).mcu}</span>
        </li>
        {components.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-secondary" /> {partLabel(p.type)}
          </li>
        ))}
      </ul>

      <h3 className="mt-6 font-display text-base font-semibold">Connections ({wires.length})</h3>
      {wires.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No wires yet — connect components on the canvas.</p>
      ) : (
        <div className="mt-2 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Wire</th>
              </tr>
            </thead>
            <tbody>
              {wires.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono text-xs">{w.from}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{w.to}</td>
                  <td className="px-3 py-1.5">
                    <span className="inline-block size-3 rounded-full align-middle" style={{ background: w.color ?? "#64748b" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
