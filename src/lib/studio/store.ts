"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Diagram, DiagramPart, DiagramWire } from "@/lib/domain/diagram";
import { WIRE_COLORS } from "@/lib/domain/diagram";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { type BoardId } from "@/lib/domain/boards";

export const GRID = 8;
const snapGrid = (v: number) => Math.round(v / GRID) * GRID;

type Snapshot = { parts: DiagramPart[]; wires: DiagramWire[] };

export type PendingWire = { from: string; fromXY: { x: number; y: number } } | null;

export interface StudioFile {
  name: string;
  language: string; // arduino | cpp | markdown | json | text
  content: string;
  readonly?: boolean;
}

export interface StudioState {
  projectId: string;
  title: string;
  board: BoardId;
  parts: DiagramPart[];
  wires: DiagramWire[];
  files: StudioFile[];
  activeFile: string;
  dirty: boolean;

  selectedId: string | null;
  selectedWireId: string | null;
  pendingWire: PendingWire;
  wireColor: string;

  // simulation
  running: boolean;
  serial: string[];
  pinStates: Record<string, number>; // logical pin label -> value
  partState: Record<string, Record<string, number | string | boolean>>; // partId -> sim outputs

  past: Snapshot[];
  future: Snapshot[];

  load: (d: { projectId: string; title: string; diagram: Diagram; files: StudioFile[] }) => void;
  addPart: (type: string, at?: { x: number; y: number }) => void;
  movePart: (id: string, x: number, y: number) => void;
  rotatePart: (id: string) => void;
  deleteSelected: () => void;
  select: (id: string | null) => void;
  selectWire: (id: string | null) => void;
  setProp: (id: string, key: string, value: string | number | boolean) => void;

  startWire: (pinRef: string, xy: { x: number; y: number }) => void;
  cancelWire: () => void;
  completeWire: (pinRef: string) => void;
  deleteWire: (id: string) => void;
  setWireColor: (c: string) => void;
  addWireBend: (wireId: string, index: number, point: { x: number; y: number }) => void;
  moveWireBend: (wireId: string, index: number, point: { x: number; y: number }) => void;
  removeWireBend: (wireId: string, index: number) => void;

  setActiveFile: (name: string) => void;
  setFileContent: (name: string, content: string) => void;
  setSketch: (content: string) => void;
  sketchContent: () => string;
  readmeContent: () => string;
  setBoard: (b: BoardId) => void;
  setTitle: (t: string) => void;

  undo: () => void;
  redo: () => void;

  setRunning: (r: boolean) => void;
  appendSerial: (s: string) => void;
  clearSerial: () => void;
  setPinState: (pin: string, value: number) => void;
  setPartState: (partId: string, key: string, value: number | string | boolean) => void;
  resetSim: () => void;

  toDiagram: () => Diagram;
  markSaved: () => void;
}

function snapshot(s: StudioState): Snapshot {
  return { parts: structuredClone(s.parts), wires: structuredClone(s.wires) };
}

export const useStudio = create<StudioState>((set, get) => ({
  projectId: "",
  title: "Untitled Project",
  board: "arduino-uno",
  parts: [],
  wires: [],
  files: [],
  activeFile: "sketch.ino",
  dirty: false,
  selectedId: null,
  selectedWireId: null,
  pendingWire: null,
  wireColor: WIRE_COLORS[0],
  running: false,
  serial: [],
  pinStates: {},
  partState: {},
  past: [],
  future: [],

  load: (d) => {
    const sketch = d.files.find((f) => f.name.endsWith(".ino")) ?? d.files[0];
    set({
      projectId: d.projectId,
      title: d.title,
      board: (d.diagram.board as BoardId) ?? "arduino-uno",
      parts: d.diagram.parts ?? [],
      wires: d.diagram.wires ?? [],
      files: d.files,
      activeFile: sketch?.name ?? "sketch.ino",
      dirty: false,
      past: [],
      future: [],
      selectedId: null,
      selectedWireId: null,
    });
  },

  addPart: (type, at) => {
    const s = get();
    const def = COMPONENT_BY_ID[type];
    // tidy, grid-aligned placement to the right of the board (3-column flow)
    const n = s.parts.filter((p) => p.id !== "mcu").length;
    const col = n % 3;
    const row = Math.floor(n / 3);
    const part: DiagramPart = {
      id: `${type}-${nanoid(5)}`,
      type,
      x: snapGrid(at?.x ?? 460 + col * 184),
      y: snapGrid(at?.y ?? 72 + row * 152),
      rotation: 0,
      props: def?.defaultProps ? { ...def.defaultProps } : undefined,
    };
    set({ past: [...s.past, snapshot(s)], future: [], parts: [...s.parts, part], selectedId: part.id, dirty: true });
  },

  movePart: (id, x, y) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, x: snapGrid(x), y: snapGrid(y) } : p)), dirty: true })),

  rotatePart: (id) =>
    set((s) => ({
      past: [...s.past, snapshot(s)],
      future: [],
      parts: s.parts.map((p) => (p.id === id ? { ...p, rotation: ((p.rotation ?? 0) + 90) % 360 } : p)),
      dirty: true,
    })),

  deleteSelected: () => {
    const s = get();
    if (s.selectedWireId) {
      set({ past: [...s.past, snapshot(s)], future: [], wires: s.wires.filter((w) => w.id !== s.selectedWireId), selectedWireId: null, dirty: true });
      return;
    }
    if (!s.selectedId || s.selectedId === "mcu") return;
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      parts: s.parts.filter((p) => p.id !== s.selectedId),
      wires: s.wires.filter((w) => !w.from.startsWith(s.selectedId + ":") && !w.to.startsWith(s.selectedId + ":")),
      selectedId: null,
      dirty: true,
    });
  },

  select: (id) => set({ selectedId: id, selectedWireId: null }),
  selectWire: (id) => set({ selectedWireId: id, selectedId: null }),

  setProp: (id, key, value) =>
    set((s) => ({
      past: [...s.past, snapshot(s)],
      future: [],
      parts: s.parts.map((p) => (p.id === id ? { ...p, props: { ...(p.props ?? {}), [key]: value } } : p)),
      dirty: true,
    })),

  startWire: (pinRef, xy) => set({ pendingWire: { from: pinRef, fromXY: xy } }),
  cancelWire: () => set({ pendingWire: null }),
  completeWire: (pinRef) => {
    const s = get();
    if (!s.pendingWire || s.pendingWire.from === pinRef) return set({ pendingWire: null });
    const exists = s.wires.some(
      (w) =>
        (w.from === s.pendingWire!.from && w.to === pinRef) ||
        (w.to === s.pendingWire!.from && w.from === pinRef),
    );
    if (exists) return set({ pendingWire: null });
    const wire: DiagramWire = { id: `w-${nanoid(5)}`, from: s.pendingWire.from, to: pinRef, color: s.wireColor };
    set({ past: [...s.past, snapshot(s)], future: [], wires: [...s.wires, wire], pendingWire: null, dirty: true });
  },
  deleteWire: (id) => set((s) => ({ past: [...s.past, snapshot(s)], future: [], wires: s.wires.filter((w) => w.id !== id), dirty: true })),
  setWireColor: (c) => set({ wireColor: c }),

  addWireBend: (wireId, index, point) =>
    set((s) => ({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: s.wires.map((w) => {
        if (w.id !== wireId) return w;
        const pts = [...(w.points ?? [])];
        pts.splice(index, 0, { x: snapGrid(point.x), y: snapGrid(point.y) });
        return { ...w, points: pts };
      }),
      dirty: true,
    })),
  moveWireBend: (wireId, index, point) =>
    set((s) => ({
      wires: s.wires.map((w) => {
        if (w.id !== wireId || !w.points) return w;
        const pts = w.points.map((p, i) => (i === index ? { x: snapGrid(point.x), y: snapGrid(point.y) } : p));
        return { ...w, points: pts };
      }),
      dirty: true,
    })),
  removeWireBend: (wireId, index) =>
    set((s) => ({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: s.wires.map((w) =>
        w.id === wireId && w.points ? { ...w, points: w.points.filter((_, i) => i !== index) } : w,
      ),
      dirty: true,
    })),

  setActiveFile: (name) => set({ activeFile: name }),
  setFileContent: (name, content) =>
    set((s) => ({ files: s.files.map((f) => (f.name === name ? { ...f, content } : f)), dirty: true })),
  setSketch: (content) =>
    set((s) => {
      const sketch = s.files.find((f) => f.name.endsWith(".ino"));
      if (!sketch) return {};
      return { files: s.files.map((f) => (f.name === sketch.name ? { ...f, content } : f)), dirty: true };
    }),
  sketchContent: () => {
    const s = get();
    return (s.files.find((f) => f.name.endsWith(".ino")) ?? s.files[0])?.content ?? "";
  },
  readmeContent: () => get().files.find((f) => f.name.toLowerCase() === "readme.md")?.content ?? "",
  setBoard: (b) =>
    set((s) => ({
      past: [...s.past, snapshot(s)],
      future: [],
      board: b,
      parts: s.parts.map((p) => (p.id === "mcu" ? { ...p, type: `__board__:${b}` } : p)),
      dirty: true,
    })),
  setTitle: (t) => set({ title: t, dirty: true }),

  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    set({ parts: prev.parts, wires: prev.wires, past: s.past.slice(0, -1), future: [snapshot(s), ...s.future], dirty: true });
  },
  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    set({ parts: next.parts, wires: next.wires, future: s.future.slice(1), past: [...s.past, snapshot(s)], dirty: true });
  },

  setRunning: (r) => set({ running: r }),
  appendSerial: (line) => set((s) => ({ serial: [...s.serial.slice(-400), line] })),
  clearSerial: () => set({ serial: [] }),
  setPinState: (pin, value) => set((s) => ({ pinStates: { ...s.pinStates, [pin]: value } })),
  setPartState: (partId, key, value) =>
    set((s) => ({ partState: { ...s.partState, [partId]: { ...(s.partState[partId] ?? {}), [key]: value } } })),
  resetSim: () => set({ pinStates: {}, partState: {}, serial: [] }),

  toDiagram: () => {
    const s = get();
    return { board: s.board, parts: s.parts, wires: s.wires };
  },
  markSaved: () => set({ dirty: false }),
}));
