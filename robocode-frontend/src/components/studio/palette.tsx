"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/icon";
import { useStudio } from "@/lib/studio/store";
import { COMPONENTS, CATEGORY_LABELS, CATEGORY_ORDER, type ComponentCategory } from "@/lib/domain/components";

const CATEGORY_ICON: Record<ComponentCategory, string> = {
  prototype: "cpu",
  output: "lightbulb",
  display: "book-open",
  input: "mouse-pointer-2",
  sensor: "radar",
  actuator: "rotate-ccw",
  module: "wifi",
  passive: "zap",
};

export function Palette() {
  const [query, setQuery] = React.useState("");
  const addPart = useStudio((s) => s.addPart);

  const grouped = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? COMPONENTS.filter((c) => [c.name, c.description, ...(c.keywords ?? [])].join(" ").toLowerCase().includes(q))
      : COMPONENTS;
    return CATEGORY_ORDER.map((cat) => ({ cat, items: filtered.filter((c) => c.category === cat) })).filter((g) => g.items.length);
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search components…" className="h-9 pl-9" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {grouped.map(({ cat, items }) => (
          <div key={cat} className="mb-4">
            <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon name={CATEGORY_ICON[cat]} className="size-3.5" /> {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid gap-1.5">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addPart(c.id)}
                  title={c.description}
                  className="group flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm transition-all hover:border-border hover:bg-muted"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon name={CATEGORY_ICON[cat]} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <Plus className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && <p className="px-1 text-sm text-muted-foreground">No components match.</p>}
      </div>
    </div>
  );
}
