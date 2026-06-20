"use client";

import * as React from "react";
import { RotateCw, Trash2, X } from "lucide-react";
import { useStudio } from "@/lib/studio/store";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LED_COLORS = ["red", "green", "blue", "yellow", "orange", "white"];

export function Inspector() {
  const selectedId = useStudio((s) => s.selectedId);
  const part = useStudio((s) => s.parts.find((p) => p.id === s.selectedId));
  const setProp = useStudio((s) => s.setProp);
  const rotate = useStudio((s) => s.rotatePart);
  const del = useStudio((s) => s.deleteSelected);
  const select = useStudio((s) => s.select);

  if (!selectedId || !part || part.id === "mcu") return null;
  const def = COMPONENT_BY_ID[part.type];
  if (!def) return null;

  return (
    <div className="absolute left-4 top-4 z-20 w-60 rounded-xl border border-white/10 bg-[#0e1426]/95 p-3 text-white shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{def.name}</p>
        <button onClick={() => select(null)} className="grid size-6 place-items-center rounded text-white/50 hover:bg-white/10">
          <X className="size-3.5" />
        </button>
      </div>
      <p className="mt-0.5 text-xs text-white/50">{def.description}</p>

      <div className="mt-3 space-y-2.5">
        {def.simRole === "led" && (
          <div className="space-y-1">
            <Label className="text-xs text-white/70">Colour</Label>
            <div className="flex flex-wrap gap-1.5">
              {LED_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setProp(part.id, "color", c)}
                  className={"size-6 rounded-full border-2 " + (part.props?.color === c ? "border-white" : "border-white/20")}
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}
        {def.simRole === "resistor" && (
          <div className="space-y-1">
            <Label className="text-xs text-white/70">Resistance (Ω)</Label>
            <Input
              value={String(part.props?.value ?? "220")}
              onChange={(e) => setProp(part.id, "value", e.target.value)}
              className="h-8 border-white/15 bg-white/5 text-white"
            />
          </div>
        )}
        {(def.simRole === "pushbutton") && (
          <div className="space-y-1">
            <Label className="text-xs text-white/70">Colour</Label>
            <div className="flex flex-wrap gap-1.5">
              {["green", "red", "blue", "yellow", "black"].map((c) => (
                <button key={c} onClick={() => setProp(part.id, "color", c)}
                  className={"size-6 rounded-full border-2 " + (part.props?.color === c ? "border-white" : "border-white/20")}
                  style={{ background: c }} title={c} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={() => rotate(part.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-xs hover:bg-white/15">
          <RotateCw className="size-3.5" /> Rotate
        </button>
        <button onClick={del} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive/20 py-1.5 text-xs text-red-300 hover:bg-destructive/30">
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
