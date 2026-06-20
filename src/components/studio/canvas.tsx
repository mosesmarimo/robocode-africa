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
import { SimOverlay } from "@/components/studio/sim-overlay";
import { AddComponentMenu } from "@/components/studio/add-component-menu";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPartEl, getPinInfo } from "@/lib/studio/pin-registry";

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

/** Auto orthogonal (Manhattan) route, staggered per wire so parallel wires form a tidy bus. */
function autoRoute(a: Pt, b: Pt, i: number): Pt[] {
  const off = ((i % 16) - 8) * 8; // -64..+56, grid-aligned lane offset
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) {
    const midX = GSNAP((a.x + b.x) / 2 + off);
    return [{ x: midX, y: a.y }, { x: midX, y: b.y }];
  }
  const midY = GSNAP((a.y + b.y) / 2 + off);
  return [{ x: a.x, y: midY }, { x: b.x, y: midY }];
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
    return <WokwiPart partId={part.id} tag={getBoard(boardId).wokwiTag} />;
  }
  const def = COMPONENT_BY_ID[part.type];
  if (!def) return null;
  if (def.tag.startsWith("rc-breadboard")) return <Breadboard partId={part.id} />;
  return <WokwiPart partId={part.id} tag={def.tag} props={part.props} />;
}

export function StudioCanvas() {
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
    if (running) return;
    e.stopPropagation();
    useStudio.getState().select(part.id);
    const w = screenToWorld(e.clientX, e.clientY);
    drag.current = { id: part.id, dx: w.x - part.x, dy: w.y - part.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  // ---- wire bend points ----
  const bendDrag = React.useRef<{ wireId: string; index: number } | null>(null);
  const startBendDrag = (e: React.PointerEvent, wireId: string, index: number) => {
    if (running) return;
    e.stopPropagation();
    useStudio.getState().selectWire(wireId);
    bendDrag.current = { wireId, index };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const insertBend = (e: React.MouseEvent, wireId: string, a: { x: number; y: number }, pts: { x: number; y: number }[], b: { x: number; y: number }) => {
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
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement?.tagName !== "TEXTAREA") {
        useStudio.getState().deleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? useStudio.getState().redo() : useStudio.getState().undo();
      }
      const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "");
      if (!typing && (e.key === "f" || e.key === "F")) { e.preventDefault(); fitView(); }
      if (!typing && (e.key === "g" || e.key === "G")) { e.preventDefault(); setShowGrid((s) => !s); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitView]);

  const wirePos = (ref: string) => {
    const [pid, pin] = ref.split(":");
    const part = parts.find((p) => p.id === pid);
    return part ? partPinPos(part, pin) : null;
  };

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
          {wires.map((wire, wi) => {
            const a = wirePos(wire.from);
            const b = wirePos(wire.to);
            if (!a || !b) return null;
            const explicit = wire.points ?? [];
            const pts = explicit.length ? explicit : autoRoute(a, b, wi);
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
                {/* connection terminals — clearly land on each pin */}
                <circle cx={a.x} cy={a.y} r={4} fill={color} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
                <circle cx={b.x} cy={b.y} r={4} fill={color} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
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
              <PinDots part={part} onPinDown={onPinClick} />
              {running && <SimOverlay part={part} />}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas toolbar: Add component + overflow menu (Wokwi-style) */}
      <div className="absolute left-3 top-3 z-30 flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <AddComponentMenu />
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
            <DropdownMenuItem onClick={() => useStudio.getState().undo()}>
              <Undo2 /> Undo <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => useStudio.getState().redo()}>
              <Redo2 /> Redo <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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

      <ZoomControls zoom={zoom} setZoom={setZoom} reset={fitView} />
    </div>
  );
}

function PinDots({ part, onPinDown }: { part: DiagramPart; onPinDown: (e: React.PointerEvent, id: string, pin: string) => void }) {
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
      {pins.map((p) => (
        <button
          key={p.name}
          title={p.name}
          onPointerDown={(e) => onPinDown(e, part.id, p.name)}
          className="group absolute -ml-2 -mt-2 grid size-4 place-items-center rounded-full"
          style={{ left: p.x, top: p.y }}
        >
          <span className="size-2 rounded-full bg-amber-400/0 ring-1 ring-amber-400/0 transition-all group-hover:bg-amber-400 group-hover:ring-2 group-hover:ring-amber-300/60" />
        </button>
      ))}
    </>
  );
}

function ZoomControls({ zoom, setZoom, reset }: { zoom: number; setZoom: (z: number) => void; reset: () => void }) {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1 text-white backdrop-blur">
      <button className="grid size-8 place-items-center rounded hover:bg-white/10" onClick={() => setZoom(Math.max(0.3, zoom - 0.15))}>−</button>
      <button className="min-w-16 rounded px-2 text-xs hover:bg-white/10" onClick={reset} title="Fit to screen">⤢ {Math.round(zoom * 100)}%</button>
      <button className="grid size-8 place-items-center rounded hover:bg-white/10" onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}>+</button>
    </div>
  );
}
