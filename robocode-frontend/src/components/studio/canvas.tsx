"use client";

import * as React from "react";
import { MoreVertical, Undo2, Redo2, Scan, ZoomIn, ZoomOut, Grid3x3, Maximize2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useStudio } from "@/lib/studio/store";
import type { DiagramPart } from "@/lib/domain/diagram";
import { getBoard } from "@/lib/domain/boards";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { WokwiPart } from "@/components/studio/wokwi-part";
import { Breadboard } from "@/components/studio/breadboard";
import { PiPicoBoard } from "@/components/studio/pi-pico-board";
import { SimOverlay } from "@/components/studio/sim-overlay";
import { AddComponentMenu } from "@/components/studio/add-component-menu";
import { CanvasAiValidate } from "@/components/studio/ai-validate";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPartEl, getPinInfo } from "@/lib/studio/pin-registry";
import { wireLabelColors } from "@/lib/studio/wire-label";

function partPinPos(part: DiagramPart, pinName: string) {
  const pins = getPinInfo(part.id);
  const pin = pins.find((p) => p.name === pinName);
  if (!pin) return null;
  const el = getPartEl(part.id);
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

type Pt = { x: number; y: number };

const GSNAP = (v: number) => Math.round(v / 8) * 8;

type RouteItem = { id: string; a: Pt; b: Pt };

/**
 * Orthogonal "bus" routing in two passes so no two wire segments ever sit on top
 * of one another (they may only cross):
 *  1. Horizontal lanes — each wire's horizontal run is packed into the lowest free
 *     lane in a top/bottom channel whose occupied x-ranges don't overlap.
 *  2. Vertical risers — every riser is column-packed by interval-graph colouring
 *     per x: risers sharing an x whose y-spans overlap (e.g. several wires on the
 *     same GND/5V pin, or pins that line up) are fanned out to distinct x with a
 *     short jog off the pin, so collinear risers never overlay.
 */
function computeBusRoutes(items: RouteItem[]): Map<string, Pt[]> {
  const map = new Map<string, Pt[]>();
  if (!items.length) return map;
  let top = Infinity;
  let bot = -Infinity;
  for (const it of items) {
    top = Math.min(top, it.a.y, it.b.y);
    bot = Math.max(bot, it.a.y, it.b.y);
  }
  const mid = (top + bot) / 2;
  const GAP = 12;
  const RISER_STEP = 7;
  const topBase = top - 24;
  const botBase = bot + 24;
  const topLanes: [number, number][][] = [];
  const botLanes: [number, number][][] = [];

  // pack left-to-right for tight, stable lanes
  const sorted = [...items].sort((p, q) => Math.min(p.a.x, p.b.x) - Math.min(q.a.x, q.b.x));

  // ---- pass 1: a horizontal lane Y per wire ----
  const laneYOf = new Map<string, number>();
  for (const it of sorted) {
    const x0 = Math.min(it.a.x, it.b.x) - 6;
    const x1 = Math.max(it.a.x, it.b.x) + 6;
    const toTop = (it.a.y + it.b.y) / 2 <= mid;
    const lanes = toTop ? topLanes : botLanes;
    let L = 0;
    for (;;) {
      const lane = lanes[L] ?? (lanes[L] = []);
      if (lane.every(([a, b]) => x1 < a || x0 > b)) {
        lane.push([x0, x1]);
        break;
      }
      L++;
    }
    laneYOf.set(it.id, toTop ? topBase - L * GAP : botBase + L * GAP);
  }

  // ---- pass 2: column-pack the vertical risers ----
  type Riser = { key: number; lo: number; hi: number; apply: (off: number) => void };
  const offA = new Map<string, number>();
  const offB = new Map<string, number>();
  const byColumn = new Map<number, Riser[]>();
  for (const it of sorted) {
    const laneY = laneYOf.get(it.id)!;
    const ax = GSNAP(it.a.x);
    const bx = GSNAP(it.b.x);
    const push = (key: number, y0: number, y1: number, apply: (o: number) => void) => {
      const r: Riser = { key, lo: Math.min(y0, y1), hi: Math.max(y0, y1), apply };
      const g = byColumn.get(key);
      if (g) g.push(r);
      else byColumn.set(key, [r]);
    };
    push(ax, it.a.y, laneY, (o) => offA.set(it.id, o));
    push(bx, laneY, it.b.y, (o) => offB.set(it.id, o));
  }
  for (const group of byColumn.values()) {
    group.sort((p, q) => p.lo - q.lo);
    const colEnd: number[] = []; // highest `hi` assigned to each colour
    for (const r of group) {
      let c = 0;
      while (colEnd[c] !== undefined && colEnd[c] > r.lo) c++;
      colEnd[c] = r.hi;
      r.apply(c);
    }
  }

  // ---- build routes: jog → riser → lane → riser → jog ----
  for (const it of sorted) {
    const laneY = laneYOf.get(it.id)!;
    const ax = GSNAP(it.a.x) + (offA.get(it.id) ?? 0) * RISER_STEP;
    const bx = GSNAP(it.b.x) + (offB.get(it.id) ?? 0) * RISER_STEP;
    map.set(it.id, [
      { x: ax, y: it.a.y },
      { x: ax, y: laneY },
      { x: bx, y: laneY },
      { x: bx, y: it.b.y },
    ]);
  }
  return map;
}

function pathD(a: Pt, pts: Pt[], b: Pt) {
  return "M " + [a, ...pts, b].map((p) => `${p.x} ${p.y}`).join(" L ");
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function PartView({ part }: { part: DiagramPart }) {
  if (part.id === "mcu" || part.type.startsWith("__board__")) {
    const boardId = part.type.split(":")[1] ?? "arduino-uno";
    const tag = getBoard(boardId).wokwiTag;
    if (tag === "rc-pi-pico") return <PiPicoBoard partId={part.id} />;
    return <WokwiPart partId={part.id} tag={tag} />;
  }
  const def = COMPONENT_BY_ID[part.type];
  if (!def) return null;
  if (def.tag.startsWith("rc-breadboard")) return <Breadboard partId={part.id} />;
  return <WokwiPart partId={part.id} tag={def.tag} props={part.props} />;
}

export function StudioCanvas({ readOnly = false }: { readOnly?: boolean } = {}) {
  const parts = useStudio((s) => s.parts);
  const wires = useStudio((s) => s.wires);
  const selectedId = useStudio((s) => s.selectedId);
  const selectedWireId = useStudio((s) => s.selectedWireId);
  const pendingWire = useStudio((s) => s.pendingWire);
  const running = useStudio((s) => s.running);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const worldRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 40, y: 40 });
  const [, setTick] = React.useState(0);
  const [cursor, setCursor] = React.useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = React.useState(true);

  // recompute wire geometry shortly after parts change / mount
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setTick((t) => t + 1));
    const t = setTimeout(() => setTick((x) => x + 1), 120);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [parts]);

  const screenToWorld = React.useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current!.getBoundingClientRect();
      return { x: (clientX - rect.left - offset.x) / zoom, y: (clientY - rect.top - offset.y) / zoom };
    },
    [offset, zoom],
  );

  // ---- fit-to-view: centre & scale the whole circuit ----
  const fitView = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ps = useStudio.getState().parts;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const part of ps) {
      const el = getPartEl(part.id);
      const w = el?.offsetWidth ?? 140;
      const h = el?.offsetHeight ?? 90;
      minX = Math.min(minX, part.x);
      minY = Math.min(minY, part.y);
      maxX = Math.max(maxX, part.x + w);
      maxY = Math.max(maxY, part.y + h);
    }
    if (!isFinite(minX)) return;
    const pad = 72;
    const bw = maxX - minX + pad * 2;
    const bh = maxY - minY + pad * 2;
    const z = Math.min(1.6, Math.max(0.3, Math.min(rect.width / bw, rect.height / bh)));
    setZoom(z);
    setOffset({
      x: (rect.width - (maxX - minX) * z) / 2 - minX * z,
      y: (rect.height - (maxY - minY) * z) / 2 - minY * z,
    });
  }, []);

  // auto-fit once after the circuit loads & its elements have measured
  const fittedRef = React.useRef(false);
  React.useEffect(() => {
    if (fittedRef.current || parts.length === 0) return;
    const t = setTimeout(() => {
      fitView();
      fittedRef.current = true;
    }, 450);
    return () => clearTimeout(t);
  }, [parts.length, fitView]);

  // ---- part dragging ----
  const drag = React.useRef<{ id: string; dx: number; dy: number } | null>(null);
  const onPartPointerDown = (e: React.PointerEvent, part: DiagramPart) => {
    if (running || readOnly) return;
    e.stopPropagation();
    useStudio.getState().select(part.id);
    const w = screenToWorld(e.clientX, e.clientY);
    drag.current = { id: part.id, dx: w.x - part.x, dy: w.y - part.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  // ---- wire bend points ----
  const bendDrag = React.useRef<{ wireId: string; index: number } | null>(null);
  const startBendDrag = (e: React.PointerEvent, wireId: string, index: number) => {
    if (running || readOnly) return;
    e.stopPropagation();
    useStudio.getState().selectWire(wireId);
    bendDrag.current = { wireId, index };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const insertBend = (e: React.MouseEvent, wireId: string, a: { x: number; y: number }, pts: { x: number; y: number }[], b: { x: number; y: number }) => {
    if (readOnly) return;
    e.stopPropagation();
    const c = screenToWorld(e.clientX, e.clientY);
    const full = [a, ...pts, b];
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < full.length - 1; i++) {
      const d = distToSeg(c.x, c.y, full[i].x, full[i].y, full[i + 1].x, full[i + 1].y);
      if (d < bestD) { bestD = d; best = i; }
    }
    useStudio.getState().addWireBend(wireId, best, c);
    useStudio.getState().selectWire(wireId);
  };

  // ---- panning ----
  const pan = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const onBgPointerDown = (e: React.PointerEvent) => {
    useStudio.getState().select(null);
    useStudio.getState().cancelWire();
    pan.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const w = screenToWorld(e.clientX, e.clientY);
    if (pendingWire) setCursor(w);
    if (bendDrag.current) {
      useStudio.getState().moveWireBend(bendDrag.current.wireId, bendDrag.current.index, w);
    } else if (drag.current) {
      useStudio.getState().movePart(drag.current.id, Math.round(w.x - drag.current.dx), Math.round(w.y - drag.current.dy));
    } else if (pan.current) {
      setOffset({ x: pan.current.ox + (e.clientX - pan.current.x), y: pan.current.oy + (e.clientY - pan.current.y) });
    }
  };
  const onPointerUp = () => {
    drag.current = null;
    pan.current = null;
    bendDrag.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    const next = Math.min(2.5, Math.max(0.3, zoom * (1 + delta)));
    const ratio = next / zoom;
    setOffset({ x: mx - (mx - offset.x) * ratio, y: my - (my - offset.y) * ratio });
    setZoom(next);
  };

  const onPinClick = (e: React.PointerEvent, partId: string, pinName: string) => {
    if (readOnly) return;
    e.stopPropagation();
    const ref = `${partId}:${pinName}`;
    const st = useStudio.getState();
    if (st.pendingWire) {
      st.completeWire(ref);
    } else {
      const part = parts.find((p) => p.id === partId);
      const pos = part ? partPinPos(part, pinName) : null;
      st.startWire(ref, pos ?? { x: 0, y: 0 });
    }
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useStudio.getState().cancelWire();
      if (!readOnly && (e.key === "Delete" || e.key === "Backspace") && document.activeElement?.tagName !== "TEXTAREA") {
        useStudio.getState().deleteSelected();
      }
      if (!readOnly && (e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? useStudio.getState().redo() : useStudio.getState().undo();
      }
      const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "");
      if (!typing && (e.key === "f" || e.key === "F")) { e.preventDefault(); fitView(); }
      if (!typing && (e.key === "g" || e.key === "G")) { e.preventDefault(); setShowGrid((s) => !s); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitView, readOnly]);

  const wirePos = (ref: string) => {
    const [pid, pin] = ref.split(":");
    const part = parts.find((p) => p.id === pid);
    return part ? partPinPos(part, pin) : null;
  };

  // "partId:pin" -> wire colour, so PinDots can paint a connected pin in the
  // colour of the line arriving at it (last wire wins on shared pins, e.g. GND).
  const pinWireColors = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const w of wires) {
      const c = w.color ?? "#16a34a";
      m.set(w.from, c);
      m.set(w.to, c);
    }
    return m;
  }, [wires]);

  // lane-routed paths for every wire that has no manual bend points
  const autoItems: RouteItem[] = [];
  for (const w of wires) {
    if (w.points && w.points.length) continue;
    const a = wirePos(w.from);
    const b = wirePos(w.to);
    if (a && b) autoItems.push({ id: w.id, a, b });
  }
  const routeMap = computeBusRoutes(autoItems);

  return (
    <div
      ref={containerRef}
      className={
        "relative h-full w-full overflow-hidden [background-color:#0d1426] cursor-grab active:cursor-grabbing " +
        (showGrid ? "bg-dots" : "")
      }
      onPointerDown={onBgPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <div
        ref={worldRef}
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        {/* wires */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
          {wires.map((wire) => {
            const a = wirePos(wire.from);
            const b = wirePos(wire.to);
            if (!a || !b) return null;
            const explicit = wire.points ?? [];
            const pts = explicit.length ? explicit : routeMap.get(wire.id) ?? [];
            const d = pathD(a, pts, b);
            const selected = selectedWireId === wire.id;
            const color = wire.color ?? "#16a34a";
            return (
              <g key={wire.id}>
                {/* wide invisible hit area: select on click, add bend on double-click */}
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth={16}
                  fill="none"
                  className="pointer-events-auto cursor-pointer"
                  onPointerDown={(e) => { e.stopPropagation(); useStudio.getState().selectWire(wire.id); }}
                  onDoubleClick={(e) => insertBend(e, wire.id, a, explicit, b)}
                />
                <path d={d} stroke={color} strokeWidth={selected ? 5 : 3} fill="none" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none" />
                {/* connection terminals live in the overlay SVG after the parts, so
                    they can't be occluded by opaque board bodies (see below) */}
                {selected &&
                  explicit.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={5.5}
                      fill="#fff"
                      stroke={color}
                      strokeWidth={2}
                      className="pointer-events-auto cursor-move"
                      onPointerDown={(e) => startBendDrag(e, wire.id, i)}
                      onDoubleClick={(e) => { e.stopPropagation(); useStudio.getState().removeWireBend(wire.id, i); }}
                    />
                  ))}
              </g>
            );
          })}
          {pendingWire && (() => {
            const a = wirePos(pendingWire.from);
            if (!a) return null;
            return <path d={`M ${a.x} ${a.y} L ${cursor.x} ${cursor.y}`} stroke="#ffb020" strokeWidth={3} strokeDasharray="6 5" fill="none" />;
          })()}
        </svg>

        {/* parts */}
        {parts.map((part) => (
          <div
            key={part.id}
            className="absolute select-none"
            style={{ left: part.x, top: part.y, transform: `rotate(${part.rotation ?? 0}deg)`, transformOrigin: "center" }}
          >
            <div
              onPointerDown={(e) => onPartPointerDown(e, part)}
              className={
                "relative rounded-md transition-shadow " +
                (selectedId === part.id ? "outline outline-2 outline-offset-4 outline-primary" : "")
              }
            >
              <PartView part={part} />
              <PinDots part={part} onPinDown={onPinClick} pinColors={pinWireColors} />
              {running && <SimOverlay part={part} />}
            </div>
          </div>
        ))}

        {/* wire terminals + pin-name labels — a second SVG layer drawn AFTER the
            parts so a terminal landing on a board header (which sits inside the
            opaque body outline, e.g. the Pico's) is never painted over. Board
            endpoints also get the pin name in the wire's colour so every line
            unambiguously shows which pin it connects to. */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
          {wires.map((wire) => {
            const a = wirePos(wire.from);
            const b = wirePos(wire.to);
            if (!a || !b) return null;
            const color = wire.color ?? "#16a34a";
            return (
              <g key={wire.id}>
                {[{ pt: a, ref: wire.from }, { pt: b, ref: wire.to }].map(({ pt, ref }, i) => (
                  <WireTerminal key={i} pt={pt} pinRef={ref} color={color} parts={parts} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Canvas toolbar: Add component + overflow menu (Wokwi-style) */}
      <div className="absolute left-3 top-3 z-30 flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        {!readOnly && <AddComponentMenu />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More actions"
              className="grid size-10 place-items-center rounded-lg border border-white/10 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {!readOnly && (
              <>
                <DropdownMenuItem onClick={() => useStudio.getState().undo()}>
                  <Undo2 /> Undo <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => useStudio.getState().redo()}>
                  <Redo2 /> Redo <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={fitView}>
              <Scan /> Fit to screen <DropdownMenuShortcut>F</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>
              <ZoomIn /> Zoom in <DropdownMenuShortcut>+</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}>
              <ZoomOut /> Zoom out <DropdownMenuShortcut>−</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowGrid((s) => !s)}>
              <Grid3x3 /> Toggle grid <DropdownMenuShortcut>G</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                else document.documentElement.requestFullscreen().catch(() => {});
              }}
            >
              <Maximize2 /> Full screen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast("Studio shortcuts", {
                  description: "Drag to move · scroll to zoom · click pins to wire · double-click a wire to add a bend · F fit · G grid · Del delete · ⌘Z undo",
                })
              }
            >
              <HelpCircle /> Help
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!readOnly && <CanvasAiValidate />}

      <ZoomControls zoom={zoom} setZoom={setZoom} reset={fitView} />
    </div>
  );
}

/**
 * One wire endpoint: terminal rings exactly on the pin, plus — for board pins —
 * the pin name in the wire's colour, placed just outside the board edge nearest
 * the pin (left/right for side headers, above/below for top/bottom headers).
 * Rendered in the above-parts overlay, so nothing occludes it.
 */
function WireTerminal({ pt, pinRef, color, parts }: { pt: Pt; pinRef: string; color: string; parts: DiagramPart[] }) {
  const [pid, pin] = pinRef.split(":");
  const part = parts.find((p) => p.id === pid);
  const isBoard = !!part && (part.type.startsWith("__board__") || part.id === "mcu");
  let vertical = false;
  let after = true; // label after (right/below) vs before (left/above) the pin
  if (part) {
    const el = getPartEl(part.id);
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const nx = w ? (pt.x - (part.x + w / 2)) / w : 0;
    const ny = h ? (pt.y - (part.y + h / 2)) / h : 0;
    vertical = Math.abs(ny) > Math.abs(nx);
    after = vertical ? ny > 0 : nx > 0;
  }
  return (
    <g className="pointer-events-none">
      <circle cx={pt.x} cy={pt.y} r={8} fill={color} opacity={0.25} />
      <circle cx={pt.x} cy={pt.y} r={4.5} fill={color} stroke="#fff" strokeWidth={1.5} />
      <circle cx={pt.x} cy={pt.y} r={1.5} fill="#fff" opacity={0.9} />
      {isBoard && (() => {
        const lc = wireLabelColors(color);
        return (
          <text
            x={vertical ? pt.x : after ? pt.x + 12 : pt.x - 12}
            y={vertical ? (after ? pt.y + 16 : pt.y - 16) : pt.y}
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
}

function PinDots({
  part,
  onPinDown,
  pinColors,
}: {
  part: DiagramPart;
  onPinDown: (e: React.PointerEvent, id: string, pin: string) => void;
  pinColors: Map<string, string>;
}) {
  const [pins, setPins] = React.useState<{ name: string; x: number; y: number }[]>([]);
  React.useEffect(() => {
    let frame = 0;
    const read = () => setPins(getPinInfo(part.id).map((p) => ({ name: p.name, x: p.x, y: p.y })));
    frame = requestAnimationFrame(read);
    const t = setTimeout(read, 150);
    return () => { cancelAnimationFrame(frame); clearTimeout(t); };
  }, [part.id, part.type]);

  return (
    <>
      {pins.map((p) => {
        const wireColor = pinColors.get(`${part.id}:${p.name}`);
        return (
          <button
            key={p.name}
            title={p.name}
            onPointerDown={(e) => onPinDown(e, part.id, p.name)}
            className="group absolute -ml-2 -mt-2 grid size-4 place-items-center rounded-full"
            style={{ left: p.x, top: p.y }}
          >
            <span
              className="size-2 rounded-full bg-amber-400/0 ring-1 ring-amber-400/0 transition-all group-hover:bg-amber-400 group-hover:ring-2 group-hover:ring-amber-300/60"
              style={
                wireColor
                  ? { backgroundColor: wireColor, boxShadow: `0 0 0 2.5px ${wireColor}59, 0 0 7px 1px ${wireColor}b3` }
                  : undefined
              }
            />
          </button>
        );
      })}
    </>
  );
}

function ZoomControls({ zoom, setZoom, reset }: { zoom: number; setZoom: (z: number) => void; reset: () => void }) {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 text-white backdrop-blur">
      <button aria-label="Zoom out" className="grid size-8 place-items-center rounded hover:bg-white/10" onClick={() => setZoom(Math.max(0.3, zoom - 0.15))}>−</button>
      <button className="min-w-16 rounded px-2 text-xs hover:bg-white/10" onClick={reset} title="Fit to screen">⤢ {Math.round(zoom * 100)}%</button>
      <button aria-label="Zoom in" className="grid size-8 place-items-center rounded hover:bg-white/10" onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}>+</button>
    </div>
  );
}
