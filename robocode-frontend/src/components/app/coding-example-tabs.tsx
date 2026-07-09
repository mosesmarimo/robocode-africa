"use client";

import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type CodingExample = {
  id: string;
  title: string;
  description: string | null;
};

export type CodingExampleGroup = {
  label: string;
  items: CodingExample[];
};

// Distinct per-language tints (panel background/border + heading colour),
// assigned by tab order — carried over from the old stacked-section layout.
const TINTS = [
  { bg: "bg-blue-500/8", border: "border-blue-500/25", text: "text-blue-500" },
  { bg: "bg-emerald-500/8", border: "border-emerald-500/25", text: "text-emerald-500" },
  { bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-600" },
  { bg: "bg-fuchsia-500/8", border: "border-fuchsia-500/25", text: "text-fuchsia-500" },
  { bg: "bg-cyan-500/8", border: "border-cyan-500/25", text: "text-cyan-500" },
  { bg: "bg-rose-500/8", border: "border-rose-500/25", text: "text-rose-500" },
  { bg: "bg-violet-500/8", border: "border-violet-500/25", text: "text-violet-500" },
  { bg: "bg-lime-500/10", border: "border-lime-500/25", text: "text-lime-600" },
  { bg: "bg-orange-500/8", border: "border-orange-500/25", text: "text-orange-500" },
  { bg: "bg-teal-500/8", border: "border-teal-500/25", text: "text-teal-500" },
];

/**
 * Coding examples arranged as VERTICAL language tabs (left rail on md+,
 * wrapping row on small screens), one language per tab, each language's
 * examples in its own table. Rows link into the Coding Studio.
 */
export function CodingExampleTabs({ groups }: { groups: CodingExampleGroup[] }) {
  if (!groups.length) return null;

  return (
    <Tabs
      orientation="vertical"
      defaultValue={groups[0].label}
      className="flex flex-col gap-4 md:flex-row md:items-start"
    >
      <TabsList className="flex h-auto w-full flex-row flex-wrap items-stretch md:w-48 md:shrink-0 md:flex-col md:flex-nowrap">
        {groups.map((g) => (
          <TabsTrigger key={g.label} value={g.label} className="justify-start gap-1.5">
            <Code2 className="size-3.5 opacity-60" />
            {g.label}
            <span className="ml-auto rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
              {g.items.length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {groups.map((g, i) => {
        const tint = TINTS[i % TINTS.length];
        return (
          <TabsContent key={g.label} value={g.label} className="mt-0 min-w-0 flex-1">
            <div className={`overflow-hidden rounded-2xl border ${tint.bg} ${tint.border}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${tint.border} text-left`}>
                    <th className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${tint.text}`}>
                      {g.label} example
                    </th>
                    <th className={`hidden px-4 py-3 text-xs font-bold uppercase tracking-wider sm:table-cell ${tint.text}`}>
                      What you&apos;ll build
                    </th>
                    <th className="w-px px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b last:border-b-0 ${tint.border} transition-colors hover:bg-background/60`}
                    >
                      <td className="px-4 py-3 align-top">
                        <Link href={`/studio/${t.id}`} className="font-semibold hover:text-primary">
                          {t.title}
                        </Link>
                        {/* Description collapses under the title on small screens. */}
                        <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{t.description}</p>
                      </td>
                      <td className="hidden px-4 py-3 align-top text-muted-foreground sm:table-cell">
                        {t.description}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/studio/${t.id}`}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                        >
                          Open <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
