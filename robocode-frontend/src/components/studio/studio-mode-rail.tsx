"use client";

import { Cpu, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudioMode = "robotics" | "coding";

/** Vertical tab rail on the right edge of the Studio: ROBOTICS | CODING. */
export function StudioModeRail({ mode, onChange }: { mode: StudioMode; onChange: (m: StudioMode) => void }) {
  const tabs: { id: StudioMode; label: string; icon: typeof Cpu }[] = [
    { id: "robotics", label: "ROBOTICS", icon: Cpu },
    { id: "coding", label: "CODING", icon: Code2 },
  ];
  return (
    <div className="flex w-14 shrink-0 flex-col border-r border-border bg-card">
      {tabs.map((t) => {
        const active = mode === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-pressed={active}
            title={t.label}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-3 border-b border-l-4 border-border transition-colors last:border-b-0",
              active
                ? "border-l-primary bg-primary/15 text-primary"
                : "border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <t.icon className={cn("shrink-0", active ? "size-6" : "size-5")} />
            <span className="text-base font-extrabold uppercase tracking-[0.18em] [writing-mode:vertical-rl]">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
