import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { studioHref } from "@/lib/studio/open-in-studio";

const PRISM_LANG: Record<string, string> = {
  python: "python", javascript: "javascript", typescript: "typescript",
  html: "markup", css: "css", go: "go", rust: "rust", cpp: "cpp",
  csharp: "csharp", sql: "sql", arduino: "cpp", micropython: "python",
};

export function CodeBlock({
  language, code, filename, openInStudio, board,
}: { language: string; code: string; filename?: string; openInStudio?: boolean; board?: string }) {
  return (
    <figure className="my-5 overflow-hidden rounded-xl border border-border bg-[#282c34]">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs text-white/70">{filename ?? language}</span>
        {openInStudio && (
          <Button variant="gradient" size="sm" asChild>
            <Link href={studioHref(language, code, board)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Open in RoboCode Studio
            </Link>
          </Button>
        )}
      </figcaption>
      <SyntaxHighlighter
        language={PRISM_LANG[language] ?? "text"}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.85rem" }}
      >
        {code.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </figure>
  );
}
