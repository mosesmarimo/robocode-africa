"use client";

import { useStudio } from "@/lib/studio/store";
import { cn } from "@/lib/utils";

export function FileTabs() {
  const files = useStudio((s) => s.files);
  const activeFile = useStudio((s) => s.activeFile);
  const setActiveFile = useStudio((s) => s.setActiveFile);
  const names = [...files.map((f) => f.name), "diagram.json"];

  return (
    <div className="flex items-center overflow-x-auto">
      {names.map((name) => (
        <button
          key={name}
          onClick={() => setActiveFile(name)}
          className={cn(
            "whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors",
            activeFile === name ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
