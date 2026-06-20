"use client";

import * as React from "react";
import type { ElementPin } from "@/types/wokwi";
import { registerPartEl, unregisterPartEl } from "@/lib/studio/pin-registry";

const COLS = 30;
const SP = 15; // hole spacing
const LEFT = 24;

function buildPins() {
  const pins: ElementPin[] = [];
  const railRows: { key: string; y: number }[] = [
    { key: "TP", y: 14 },
    { key: "TN", y: 28 },
  ];
  const bottomRail: { key: string; y: number }[] = [
    { key: "BP", y: 196 },
    { key: "BN", y: 210 },
  ];
  // main rows a-e (top) and f-j (bottom)
  const topRows = ["a", "b", "c", "d", "e"];
  const botRows = ["f", "g", "h", "i", "j"];
  const topY = 62;
  const botY = 132;

  for (const rail of [...railRows, ...bottomRail]) {
    for (let i = 0; i < COLS - 2; i++) {
      pins.push({ name: `${rail.key}${i + 1}`, x: LEFT + 18 + i * SP, y: rail.y, signals: [] });
    }
  }
  topRows.forEach((r, ri) => {
    for (let c = 1; c <= COLS; c++) pins.push({ name: `${c}${r}`, x: LEFT + (c - 1) * SP, y: topY + ri * SP, signals: [] });
  });
  botRows.forEach((r, ri) => {
    for (let c = 1; c <= COLS; c++) pins.push({ name: `${c}${r}`, x: LEFT + (c - 1) * SP, y: botY + ri * SP, signals: [] });
  });
  return pins;
}

const PINS = buildPins();
const WIDTH = LEFT + (COLS - 1) * SP + 24;
const HEIGHT = 224;

export function Breadboard({ partId }: { partId: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = ref.current as (HTMLDivElement & { pinInfo?: ElementPin[] }) | null;
    if (!el) return;
    el.pinInfo = PINS;
    registerPartEl(partId, el);
    return () => unregisterPartEl(partId);
  }, [partId]);

  return (
    <div ref={ref} style={{ width: WIDTH, height: HEIGHT }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={10} fill="#f2f0e9" stroke="#d8d4c6" />
        {/* power rail lines */}
        <line x1={LEFT + 6} y1={8} x2={WIDTH - 18} y2={8} stroke="#e23b3b" strokeWidth={1.5} />
        <line x1={LEFT + 6} y1={34} x2={WIDTH - 18} y2={34} stroke="#2f6bff" strokeWidth={1.5} />
        <line x1={LEFT + 6} y1={190} x2={WIDTH - 18} y2={190} stroke="#e23b3b" strokeWidth={1.5} />
        <line x1={LEFT + 6} y1={216} x2={WIDTH - 18} y2={216} stroke="#2f6bff" strokeWidth={1.5} />
        {/* center channel */}
        <rect x={6} y={96} width={WIDTH - 12} height={4} fill="#e3e0d4" />
        {/* holes */}
        {PINS.map((p) => (
          <rect key={p.name} x={p.x - 3} y={p.y - 3} width={6} height={6} rx={1.3} fill="#cfcabb" stroke="#b3ad9c" strokeWidth={0.5} />
        ))}
      </svg>
    </div>
  );
}
