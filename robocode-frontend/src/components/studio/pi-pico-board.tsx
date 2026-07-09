"use client";

import * as React from "react";
import type { ElementPin } from "@/types/wokwi";
import { registerPartEl, unregisterPartEl } from "@/lib/studio/pin-registry";

const WIDTH = 120;
const HEIGHT = 300;
const PIN_Y0 = 34;
const PIN_DY = 12.6;
const LEFT_X = 8;
const RIGHT_X = 112;

// Pin order top->bottom, left header then right header, matching the physical Pico pinout.
const LEFT_NAMES = [
  "GP0", "GP1", "GND.1", "GP2", "GP3", "GP4", "GP5", "GND.2", "GP6", "GP7",
  "GP8", "GP9", "GND.3", "GP10", "GP11", "GP12", "GP13", "GND.4", "GP14", "GP15",
];

const RIGHT_NAMES = [
  "VBUS", "VSYS", "GND.5", "3V3_EN", "3V3", "ADC_VREF", "GP28", "AGND", "GP27", "GP26",
  "RUN", "GP22", "GND.6", "GP21", "GP20", "GP19", "GP18", "GND.7", "GP17", "GP16",
];

// GP25 has no physical header pin on real hardware — it drives the onboard LED
// directly — but lessons that wire an EXTERNAL LED to the onboard-LED GPIO need
// somewhere for that wire to land, or it renders floating/invisible. Expose one
// wireable pad anchored at the onboard LED graphic's position (see the `rect
// ref={ledRef}` below), matching where a wire to `mcu:GP25` visually belongs.
const GP25_X = 61.5;
const GP25_Y = 18;

function buildPins(): ElementPin[] {
  const pins: ElementPin[] = [];
  LEFT_NAMES.forEach((name, i) => pins.push({ name, x: LEFT_X, y: PIN_Y0 + i * PIN_DY, signals: [] }));
  RIGHT_NAMES.forEach((name, i) => pins.push({ name, x: RIGHT_X, y: PIN_Y0 + i * PIN_DY, signals: [] }));
  pins.push({ name: "GP25", x: GP25_X, y: GP25_Y, signals: [] });
  return pins;
}

const PINS = buildPins();

/**
 * First-party Raspberry Pi Pico (RP2040) board element. Renders real GP-numbered pin
 * labels (matching what MicroPython/rp2040js expects) instead of the wokwi-nano-rp2040-connect
 * element's Nano silkscreen. Exposes a boolean `ledBuiltIn` DOM property, set by
 * Rp2040Engine via `BoardDef.builtinLedProp`, to drive the onboard LED graphic.
 */
export function PiPicoBoard({ partId }: { partId: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const ledRef = React.useRef<SVGRectElement | null>(null);

  React.useEffect(() => {
    const el = ref.current as (HTMLDivElement & { pinInfo?: ElementPin[]; ledBuiltIn?: boolean }) | null;
    if (!el) return;
    el.pinInfo = PINS;
    let lit = false;
    Object.defineProperty(el, "ledBuiltIn", {
      configurable: true,
      get: () => lit,
      set: (v: boolean) => {
        lit = !!v;
        if (ledRef.current) ledRef.current.style.fill = lit ? "#7CFC7C" : "#2a3a2a";
      },
    });
    registerPartEl(partId, el);
    return () => unregisterPartEl(partId);
  }, [partId]);

  return (
    <div ref={ref} data-rc-part="pico" style={{ width: WIDTH, height: HEIGHT }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* board */}
        <rect x={2} y={2} width={WIDTH - 4} height={HEIGHT - 4} rx={8} fill="#0f4030" stroke="#0a2a1f" strokeWidth={1.5} />

        {/* USB stub */}
        <rect x={42} y={0} width={36} height={10} rx={1.5} fill="#b7bcc2" stroke="#8b9096" strokeWidth={0.75} />
        <rect x={46} y={2} width={28} height={6} fill="#8b9096" />

        {/* onboard LED */}
        <rect ref={ledRef} x={58} y={16} width={7} height={4} rx={1} style={{ fill: "#2a3a2a" }} />
        <text x={68} y={20.5} fontSize={5} fill="#9fb3a8">LED</text>

        {/* RP2040 chip */}
        <rect x={42} y={110} width={36} height={36} fill="#161616" stroke="#000" strokeWidth={0.75} />
        <circle cx={47} cy={115} r={1.4} fill="#555" />
        <text x={60} y={130} fontSize={5} fill="#ccc" textAnchor="middle">
          RP2040
        </text>

        {/* pads + silkscreen labels */}
        {PINS.map((p) => {
          const isLeft = p.x === LEFT_X;
          return (
            <g key={p.name}>
              <circle cx={p.x} cy={p.y} r={2.4} fill="#d4af37" stroke="#a3811f" strokeWidth={0.5} />
              <text
                x={isLeft ? p.x + 5 : p.x - 5}
                y={p.y + 2}
                fontSize={6}
                fill="#e8f2ec"
                textAnchor={isLeft ? "start" : "end"}
              >
                {p.name}
              </text>
            </g>
          );
        })}

        <text x={WIDTH / 2} y={HEIGHT - 10} fontSize={8} fill="#e8f2ec" textAnchor="middle">
          Raspberry Pi Pico
        </text>
      </svg>
    </div>
  );
}
