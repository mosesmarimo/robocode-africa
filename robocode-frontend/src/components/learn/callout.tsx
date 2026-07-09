import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const VARIANTS = {
  tip: { icon: Lightbulb, cls: "border-primary/30 bg-primary/5" },
  info: { icon: Info, cls: "border-sky-500/30 bg-sky-500/5" },
  warning: { icon: TriangleAlert, cls: "border-amber-500/30 bg-amber-500/5" },
} as const;

export function Callout({ variant = "tip", text }: { variant?: keyof typeof VARIANTS; text: string }) {
  const { icon: Icon, cls } = VARIANTS[variant];
  return (
    <div className={`my-5 flex gap-3 rounded-xl border p-4 ${cls}`}>
      <Icon className="mt-0.5 size-5 shrink-0 text-foreground/70" />
      <div className="md-body text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
