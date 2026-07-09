"use client";
import * as React from "react";

/** Lazy mermaid render. mermaid is browser-only and heavy, so it is imported on
 *  the client at mount time. */
export function MermaidDiagram({ chart, caption }: { chart: string; caption?: string }) {
  const [svg, setSvg] = React.useState<string>("");

  React.useEffect(() => {
    let active = true;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
      try {
        const id = "m" + Math.abs(hash(chart)).toString(36);
        const { svg } = await mermaid.render(id, chart);
        if (active) setSvg(svg);
      } catch {
        if (active) setSvg("");
      }
    })();
    return () => { active = false; };
  }, [chart]);

  return (
    <figure className="my-6 flex flex-col items-center gap-2">
      <div
        className="w-full overflow-x-auto rounded-xl border border-border bg-card p-4 [&_svg]:mx-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
