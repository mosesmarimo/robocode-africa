"use client";

import * as React from "react";
import type { DiagramPart } from "@/lib/domain/diagram";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { getActiveEngine } from "@/lib/sim/active";

/** Interactive input controls shown on input components while the simulation runs. */
export function SimOverlay({ part }: { part: DiagramPart }) {
  const def = COMPONENT_BY_ID[part.type];
  const [, force] = React.useState(0);
  if (!def) return null;
  const eng = getActiveEngine();
  if (!eng) return null;

  const chip = "absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 rounded-lg border border-white/15 bg-black/70 px-2 py-1.5 text-white backdrop-blur";

  if (def.simRole === "potentiometer" || def.simRole === "ldr") {
    const val = eng.potValues[part.id] ?? 512;
    return (
      <div className={chip} onPointerDown={(e) => e.stopPropagation()}>
        <input
          type="range" min={0} max={1023} value={val}
          onChange={(e) => { eng.potValues[part.id] = Number(e.target.value); force((x) => x + 1); }}
          className="h-1.5 w-28 cursor-pointer accent-amber-400"
        />
        <div className="text-center text-[10px] text-white/70">{val}</div>
      </div>
    );
  }

  if (["ntc", "gas", "flame", "sound"].includes(def.simRole)) {
    const val = eng.analogInputs[part.id] ?? 400;
    return (
      <div className={chip} onPointerDown={(e) => e.stopPropagation()}>
        <input type="range" min={0} max={1023} value={val}
          onChange={(e) => { eng.analogInputs[part.id] = Number(e.target.value); force((x) => x + 1); }}
          className="h-1.5 w-28 cursor-pointer accent-amber-400" />
        <div className="text-center text-[10px] text-white/70">{def.simRole}: {val}</div>
      </div>
    );
  }

  if (def.simRole === "ultrasonic") {
    const val = eng.distances[part.id] ?? 50;
    return (
      <div className={chip} onPointerDown={(e) => e.stopPropagation()}>
        <input type="range" min={2} max={300} value={val}
          onChange={(e) => { eng.distances[part.id] = Number(e.target.value); force((x) => x + 1); }}
          className="h-1.5 w-32 cursor-pointer accent-amber-400" />
        <div className="text-center text-[10px] text-white/70">{val} cm</div>
      </div>
    );
  }

  if (def.simRole === "pushbutton" || def.simRole === "switch" || def.simRole === "pir") {
    const down = eng.pressed[part.id] ?? false;
    const set = (v: boolean) => { eng.pressed[part.id] = v; force((x) => x + 1); };
    return (
      <div className={chip} onPointerDown={(e) => e.stopPropagation()}>
        <button
          onPointerDown={() => set(true)}
          onPointerUp={() => set(def.simRole === "switch" ? !down : false)}
          onPointerLeave={() => def.simRole !== "switch" && set(false)}
          className={"rounded-md px-3 py-1 text-[11px] font-medium " + (down ? "bg-amber-400 text-black" : "bg-white/15")}
        >
          {def.simRole === "pir" ? (down ? "Motion!" : "Trigger") : down ? "Pressed" : "Press"}
        </button>
      </div>
    );
  }

  return null;
}
