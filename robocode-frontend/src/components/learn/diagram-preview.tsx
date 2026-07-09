"use client";

import Link from "next/link";
import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WokwiPart } from "@/components/studio/wokwi-part";
import { Breadboard } from "@/components/studio/breadboard";
import { PiPicoBoard } from "@/components/studio/pi-pico-board";
import { getBoard } from "@/lib/domain/boards";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { getPartEl, getPinInfo } from "@/lib/studio/pin-registry";
import { wireLabelColors } from "@/lib/studio/wire-label";
import { studioHref, type BakedDiagram } from "@/lib/studio/open-in-studio";

type Pt = { x: number; y: number };

/**
 * Canvas-space position of a pin, mirroring StudioCanvas.partPinPos.
 *
 * `ns` namespaces the pin-registry lookup (see DiagramPreview's doc comment) — the
 * pin-registry keys are per-preview-instance (`${ns}${part.id}`), NOT the raw diagram
 * part id, which every baked diagram reuses (e.g. "mcu", "led-1").
 */
function partPinPos(part: BakedDiagram["parts"][number], pinName: string, ns: string): Pt | null {
  const pins = getPinInfo(`${ns}${part.id}`);
  const pin = pins.find((p) => p.name === pinName);
  if (!pin) return null;
  const el = getPartEl(`${ns}${part.id}`);
  const w = el?.offsetWidth ?? 0;
  const h = el?.offsetHeight ?? 0;
  const rot = ((part.rotation ?? 0) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const dx = pin.x - cx;
  const dy = pin.y - cy;
  const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
  const ry = dx * Math.sin(rot) + dy * Math.cos(rot);
  return { x: part.x + cx + rx, y: part.y + cy + ry };
}

/** `ns`: see DiagramPreview — registers this part's DOM element under `${ns}${part.id}`. */
function PartView({ part, ns }: { part: BakedDiagram["parts"][number]; ns: string }) {
  const partId = `${ns}${part.id}`;
  if (part.id === "mcu" || part.type.startsWith("__board__")) {
    const boardId = part.type.split(":")[1] ?? "arduino-uno";
    const tag = getBoard(boardId).wokwiTag;
    if (tag === "rc-pi-pico") return <PiPicoBoard partId={partId} />;
    return <WokwiPart partId={partId} tag={tag} />;
  }
  const def = COMPONENT_BY_ID[part.type];
  if (!def) return null;
  if (def.tag.startsWith("rc-breadboard")) return <Breadboard partId={partId} />;
  return <WokwiPart partId={partId} tag={def.tag} props={part.props} />;
}

/**
 * Read-only render of a baked diagram. Parts are positioned by x/y; wires are an
 * SVG overlay drawn after the @wokwi/elements mount and report their pins. A
 * straight polyline per wire is enough for an illustrative lesson preview; the
 * editable bus-routed version lives in the Studio. Unresolved pins are skipped.
 *
 * `pin-registry.ts` is a single module-global Map keyed by part id — every baked
 * diagram reuses the same ids ("mcu", "led-1", ...), so two DiagramPreview instances
 * on one lesson page would otherwise clobber each other's registrations, and one
 * unmounting would delete the other (still-live) instance's entries. `ns` (a
 * React.useId() unique per mounted instance) prefixes every registry key this
 * component touches so instances never collide.
 */
export function DiagramPreview({ diagram }: { diagram: BakedDiagram }) {
  const ns = React.useId();
  const { parts, wires } = diagram;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = React.useState(0);
  const [tick, setTick] = React.useState(0);

  // Track the available width so the diagram can scale to fit the lesson column.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerW(el.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Redraw once parts have mounted + measured (pin coords + sizes only exist
  // post-mount). `tick` also drives the bounds recompute below.
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setTick((t) => t + 1));
    const t1 = setTimeout(() => setTick((t) => t + 1), 150);
    const t2 = setTimeout(() => setTick((t) => t + 1), 500);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [parts]);

  // Bounding box over the measured parts (recomputed on each tick so it uses the
  // real @wokwi/elements sizes once they have mounted, not the fallback).
  const bounds = React.useMemo(() => {
    void tick; // recompute when parts (re)measure
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of parts) {
      const el = getPartEl(`${ns}${p.id}`);
      const w = el?.offsetWidth ?? 160;
      const h = el?.offsetHeight ?? 100;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + w);
      maxY = Math.max(maxY, p.y + h);
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, w: 800, h: 480 };
    const pad = 48;
    return { minX: minX - pad, minY: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }, [parts, tick, ns]);

  // Scale the whole diagram down to fit the container width (never up past 1:1).
  const scale = bounds.w > 0 && containerW > 0 ? Math.min(1, containerW / bounds.w) : 1;

  const wirePos = (ref: string): Pt | null => {
    const [pid, pin] = ref.split(":");
    const part = parts.find((p) => p.id === pid);
    return part ? partPinPos(part, pin, ns) : null;
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl border border-border bg-[#0d1426]">
      {/* reserve the scaled height so the figure occupies the right vertical space */}
      <div style={{ height: bounds.h * scale }}>
        <div
          className="relative origin-top-left"
          style={{
            width: bounds.w,
            height: bounds.h,
            transform: `scale(${scale}) translate(${-bounds.minX}px, ${-bounds.minY}px)`,
          }}
        >
          {/* wires */}
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
            {wires.map((w) => {
              const a = wirePos(w.from);
              const b = wirePos(w.to);
              if (!a || !b) return null; // skip until pins resolve
              const color = w.color ?? "#16a34a";
              return <path key={w.id} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />;
            })}
          </svg>

          {/* parts (non-interactive) */}
          {parts.map((part) => (
            <div
              key={part.id}
              className="pointer-events-none absolute select-none"
              style={{ left: part.x, top: part.y, transform: `rotate(${part.rotation ?? 0}deg)`, transformOrigin: "center" }}
            >
              <PartView part={part} ns={ns} />
            </div>
          ))}

          {/* terminals + board pin labels ABOVE the part bodies (board headers sit
              inside the opaque body outline — e.g. the Pico — so under-part markers
              would be occluded); mirrors StudioCanvas's overlay layer */}
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
            {wires.map((w) => {
              const a = wirePos(w.from);
              const b = wirePos(w.to);
              if (!a || !b) return null;
              const color = w.color ?? "#16a34a";
              return (
                <g key={w.id}>
                  {[{ pt: a, ref: w.from }, { pt: b, ref: w.to }].map(({ pt, ref }, i) => {
                    const [pid, pin] = ref.split(":");
                    const part = parts.find((p) => p.id === pid);
                    const isBoard = !!part && (part.type.startsWith("__board__") || part.id === "mcu");
                    let vertical = false;
                    let after = true;
                    if (part) {
                      const el = getPartEl(`${ns}${part.id}`);
                      const pw = el?.offsetWidth ?? 0;
                      const ph = el?.offsetHeight ?? 0;
                      const nx = pw ? (pt.x - (part.x + pw / 2)) / pw : 0;
                      const nyv = ph ? (pt.y - (part.y + ph / 2)) / ph : 0;
                      vertical = Math.abs(nyv) > Math.abs(nx);
                      after = vertical ? nyv > 0 : nx > 0;
                    }
                    return (
                      <g key={i}>
                        <circle cx={pt.x} cy={pt.y} r={4.5} fill={color} stroke="#fff" strokeWidth={1.4} />
                        {isBoard && (() => {
                          const lc = wireLabelColors(color);
                          return (
                            <text
                              x={vertical ? pt.x : after ? pt.x + 11 : pt.x - 11}
                              y={vertical ? (after ? pt.y + 15 : pt.y - 15) : pt.y}
                              dominantBaseline="central"
                              textAnchor={vertical ? "middle" : after ? "start" : "end"}
                              fontSize={11}
                              fontWeight={700}
                              fill={lc.fill}
                              stroke={lc.halo}
                              strokeWidth={3}
                              paintOrder="stroke"
                              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                            >
                              {pin}
                            </text>
                          );
                        })()}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Lesson `diagram` block: the preview + caption + an Open-in-Studio button. */
export function DiagramBlock({
  board,
  language,
  code,
  diagram,
  caption,
}: {
  board: string;
  language: string;
  code: string;
  diagram: BakedDiagram;
  caption?: string;
}) {
  return (
    <figure className="my-6 flex flex-col gap-2">
      <DiagramPreview diagram={diagram} />
      <figcaption className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{caption ?? "Wiring diagram"}</span>
        <Button variant="gradient" size="sm" asChild>
          <Link href={studioHref(language, code, board, diagram)} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" /> Open in RoboCode Studio
          </Link>
        </Button>
      </figcaption>
    </figure>
  );
}
