"use client";

import type { SimEngine } from "@/lib/sim/engine";

let active: SimEngine | null = null;
export function setActiveEngine(e: SimEngine | null) {
  active = e;
}
export function getActiveEngine(): SimEngine | null {
  return active;
}
