"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Diagram, DiagramPart, DiagramWire } from "@/lib/domain/diagram";
import { WIRE_COLORS } from "@/lib/domain/diagram";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { getBoard, type BoardId } from "@/lib/domain/boards";

export const GRID = 8;
const snapGrid = (v: number) => Math.round(v / GRID) * GRID;

/** Monaco language id for a source file, by extension. */
export function langForFile(name: string): string {
  switch (name.split(".").pop()?.toLowerCase()) {
    case "ino":
    case "cpp":
    case "cc":
    case "h":
    case "hpp":
    case "c":
      return "cpp";
    case "py":
      return "python";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}

// Undo history covers the board and source files as well as the diagram, so a
// board switch (which resets the whole workspace) is fully recoverable with ⌘Z.
type Snapshot = {
  parts: DiagramPart[];
  wires: DiagramWire[];
  board: BoardId;
  files: StudioFile[];
  activeFile: string;
};

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

  // AI validation (shared between the canvas button and the Description tab)
  aiResult: string | null;
  aiValidating: boolean;

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
  /** Apply an AI "RoboVibe" edit: replace diagram/code/readme atomically (undoable). */
  applyVibe: (d: {
    parts?: DiagramPart[];
    wires?: DiagramWire[];
    board?: BoardId;
    code?: string;
    files?: { name: string; content: string }[];
    readme?: string;
  }) => void;

  undo: () => void;
  redo: () => void;

  setAiResult: (r: string | null) => void;
  setAiValidating: (b: boolean) => void;
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
  return {
    parts: structuredClone(s.parts),
    wires: structuredClone(s.wires),
    board: s.board,
    files: structuredClone(s.files),
    activeFile: s.activeFile,
  };
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
  aiResult: null,
  aiValidating: false,
  past: [],
  future: [],

  load: (d) => {
    // Open the file the board actually runs: main.py on MicroPython boards.
    const isMicroPython = getBoard((d.diagram.board as BoardId) ?? "arduino-uno").mcuTarget === "rp2040js";
    const sketch = d.files.find((f) => (isMicroPython ? f.name.endsWith(".py") : f.name.endsWith(".ino"))) ?? d.files[0];
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
      aiResult: null,
      aiValidating: false,
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
    const board = getBoard(s.board);
    if (board.mcuTarget === "rp2040js") {
      // Pico runs MicroPython: prefer the first .py file.
      return (s.files.find((f) => f.name.endsWith(".py")) ?? s.files[0])?.content ?? "";
    }
    return (s.files.find((f) => f.name.endsWith(".ino")) ?? s.files[0])?.content ?? "";
  },
  readmeContent: () => get().files.find((f) => f.name.toLowerCase() === "readme.md")?.content ?? "",
  // Selecting a different board starts a FRESH workspace: the canvas keeps only
  // the new board (no components/wires) and the code window resets to the new
  // board's starter sketch — old wiring/pins/code never target the new board.
  // The previous diagram + files land in undo history (⌘Z restores everything).
  setBoard: (b) =>
    set((s) => {
      if (b === s.board) return {};
      const board = getBoard(b);
      const sketchName = board.mcuTarget === "rp2040js" ? "main.py" : "sketch.ino";
      const sketch: StudioFile = { name: sketchName, language: langForFile(sketchName), content: board.starterCode };
      const readme = s.files.find((f) => f.name.toLowerCase() === "readme.md");
      return {
        past: [...s.past, snapshot(s)],
        future: [],
        board: b,
        parts: [{ id: "mcu", type: `__board__:${b}`, x: 360, y: 220, rotation: 0 }],
        wires: [],
        files: readme ? [sketch, readme] : [sketch],
        activeFile: sketchName,
        selectedId: null,
        selectedWireId: null,
        pendingWire: null,
        pinStates: {},
        partState: {},
        serial: [],
        dirty: true,
      };
    }),
  setTitle: (t) => set({ title: t, dirty: true }),

  applyVibe: (d) =>
    set((s) => {
      let files = s.files;
      let activeFile = s.activeFile;

      if (d.files && d.files.length) {
        // Replace the full source set with the AI's files (keep README unless the
        // AI also supplied one). Sketch (.ino/.py) first, README last.
        const incoming = d.files
          .filter((f) => f.name.toLowerCase() !== "readme.md")
          .map((f) => ({ name: f.name, language: langForFile(f.name), content: f.content }));
        const aiReadme = d.files.find((f) => f.name.toLowerCase() === "readme.md")?.content ?? d.readme;
        const readmeContent = aiReadme ?? s.files.find((f) => f.name.toLowerCase() === "readme.md")?.content;
        files = [...incoming];
        if (readmeContent != null) files.push({ name: "README.md", language: "markdown", content: readmeContent });
        const mainSketch = incoming.find((f) => f.name.endsWith(".ino") || f.name.endsWith(".py")) ?? incoming[0];
        if (mainSketch) activeFile = mainSketch.name;
      } else {
        if (d.code != null) {
          const sketch = files.find((f) => f.name.endsWith(".ino"));
          if (sketch) files = files.map((f) => (f.name === sketch.name ? { ...f, content: d.code! } : f));
        }
        if (d.readme != null) {
          const readme = files.find((f) => f.name.toLowerCase() === "readme.md");
          files = readme
            ? files.map((f) => (f === readme ? { ...f, content: d.readme! } : f))
            : [...files, { name: "README.md", language: "markdown", content: d.readme }];
        }
      }
      return {
        past: [...s.past, snapshot(s)],
        future: [],
        parts: d.parts ?? s.parts,
        wires: d.wires ?? s.wires,
        board: d.board ?? s.board,
        files,
        activeFile,
        selectedId: null,
        selectedWireId: null,
        dirty: true,
      };
    }),

  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    set({
      parts: prev.parts,
      wires: prev.wires,
      board: prev.board,
      files: prev.files,
      activeFile: prev.activeFile,
      past: s.past.slice(0, -1),
      future: [snapshot(s), ...s.future],
      dirty: true,
    });
  },
  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    set({
      parts: next.parts,
      wires: next.wires,
      board: next.board,
      files: next.files,
      activeFile: next.activeFile,
      future: s.future.slice(1),
      past: [...s.past, snapshot(s)],
      dirty: true,
    });
  },

  setAiResult: (r) => set({ aiResult: r }),
  setAiValidating: (b) => set({ aiValidating: b }),
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
