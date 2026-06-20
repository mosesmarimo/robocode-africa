"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export function AddComponentMenu() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const addPart = useStudio((s) => s.addPart);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const grouped = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? COMPONENTS.filter((c) => [c.name, c.description, ...(c.keywords ?? [])].join(" ").toLowerCase().includes(q))
      : COMPONENTS;
    return CATEGORY_ORDER.map((cat) => ({ cat, items: filtered.filter((c) => c.category === cat) })).filter((g) => g.items.length);
  }, [query]);

  function add(id: string) {
    addPart(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Add component"
          className="flex items-center gap-2 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Plus className="size-4" /> Add component
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[22rem] overflow-hidden rounded-xl border border-white/10 bg-[#0e1426]/97 p-0 text-white shadow-2xl backdrop-blur"
      >
        <div className="border-b border-white/10 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components…"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="max-h-[64vh] overflow-y-auto py-1">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <p className="sticky top-0 z-10 bg-[#0e1426] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                {CATEGORY_LABELS[cat]}
              </p>
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => add(c.id)}
                  title={c.description}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/8"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/8 text-primary">
                    <Icon name={CATEGORY_ICON[cat]} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-[11px] text-white/45">{c.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ))}
          {grouped.length === 0 && <p className="px-3 py-6 text-center text-sm text-white/40">No components match “{query}”.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
