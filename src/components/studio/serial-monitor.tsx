"use client";

import * as React from "react";
import { Trash2, TerminalSquare } from "lucide-react";
import { useStudio } from "@/lib/studio/store";

export function SerialMonitor() {
  const serial = useStudio((s) => s.serial);
  const clear = useStudio((s) => s.clearSerial);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [serial]);

  return (
    <div className="flex h-full flex-col border-t border-border bg-[#0b1020]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-white/70">
          <TerminalSquare className="size-3.5" /> Serial Monitor
        </span>
        <button onClick={clear} className="grid size-6 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white">
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed text-emerald-300">
        {serial.length === 0 ? (
          <p className="text-white/30">Serial output will appear here when you run your code…</p>
        ) : (
          serial.map((line, i) => <div key={i} className="whitespace-pre-wrap break-words">{line}</div>)
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
