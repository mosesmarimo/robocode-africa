import type { Diagram } from "@/lib/domain/diagram";
import { COMPONENT_BY_ID } from "@/lib/domain/components";

// Resolves diagram wires (+ breadboard internal connections) into electrical nets,
// then maps each component pin to the board pin it is electrically connected to.

class UnionFind {
  parent: Record<string, string> = {};
  find(x: string): string {
    if (this.parent[x] === undefined) this.parent[x] = x;
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[ra] = rb;
  }
}

function breadboardGroups(partId: string): string[][] {
  // Mirror Breadboard pin naming: columns 1..30 rows a-e (top group), f-j (bottom group); rails.
  const groups: string[][] = [];
  const COLS = 30;
  for (let c = 1; c <= COLS; c++) {
    groups.push(["a", "b", "c", "d", "e"].map((r) => `${partId}:${c}${r}`));
    groups.push(["f", "g", "h", "i", "j"].map((r) => `${partId}:${c}${r}`));
  }
  const rails = ["TP", "TN", "BP", "BN"];
  for (const rail of rails) {
    const g: string[] = [];
    for (let i = 1; i <= COLS - 2; i++) g.push(`${partId}:${rail}${i}`);
    groups.push(g);
  }
  return groups;
}

export interface ResolvedNet {
  /** for a given "partId:pin" returns the connected board pin label (e.g. "13", "A0", "GND.1") or null */
  boardPinOf: (ref: string) => string | null;
  /** all board pins on the same net as ref */
  netBoardPins: (ref: string) => string[];
}

export function resolveNetlist(diagram: Diagram): ResolvedNet {
  const uf = new UnionFind();

  // breadboard internal connections + 2-terminal passthrough (resistor)
  for (const part of diagram.parts) {
    const def = COMPONENT_BY_ID[part.type];
    if (def?.simRole === "breadboard") {
      for (const group of breadboardGroups(part.id)) {
        for (let i = 1; i < group.length; i++) uf.union(group[0], group[i]);
      }
    } else if (def?.simRole === "resistor") {
      uf.union(`${part.id}:1`, `${part.id}:2`);
    }
  }

  // wires
  for (const w of diagram.wires) {
    uf.union(w.from, w.to);
  }

  // collect board pin endpoints per net root
  const netBoardPinsMap: Record<string, Set<string>> = {};
  const addBoardPin = (ref: string) => {
    if (!ref.startsWith("mcu:")) return;
    const root = uf.find(ref);
    (netBoardPinsMap[root] ??= new Set()).add(ref.slice(4));
  };
  for (const w of diagram.wires) {
    addBoardPin(w.from);
    addBoardPin(w.to);
  }

  const boardPinOf = (ref: string): string | null => {
    const root = uf.find(ref);
    const set = netBoardPinsMap[root];
    if (!set || set.size === 0) return null;
    // prefer a signal pin over power/ground when several exist
    const pins = [...set];
    const signal = pins.find((p) => !/^(GND|5V|3V3|VIN|VCC)/i.test(p));
    return signal ?? pins[0];
  };

  const netBoardPins = (ref: string): string[] => {
    const root = uf.find(ref);
    return [...(netBoardPinsMap[root] ?? [])];
  };

  return { boardPinOf, netBoardPins };
}
