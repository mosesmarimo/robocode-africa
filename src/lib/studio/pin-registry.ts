"use client";

import type { ElementPin } from "@/types/wokwi";

// Live registry of rendered part DOM elements, used to read pin positions for wiring.
const els = new Map<string, HTMLElement>();

export function registerPartEl(id: string, el: HTMLElement) {
  els.set(id, el);
}
export function unregisterPartEl(id: string) {
  els.delete(id);
}
export function getPartEl(id: string) {
  return els.get(id);
}

export function getPinInfo(id: string): ElementPin[] {
  const el = els.get(id) as (HTMLElement & { pinInfo?: ElementPin[] }) | undefined;
  return el?.pinInfo ?? [];
}

/** Absolute (canvas-space) position of a pin given the canvas transform. */
export function pinCanvasPos(
  partId: string,
  pinName: string,
  canvasEl: HTMLElement | null,
  zoom: number,
): { x: number; y: number } | null {
  const el = els.get(partId);
  if (!el || !canvasEl) return null;
  const pins = getPinInfo(partId);
  const pin = pins.find((p) => p.name === pinName);
  if (!pin) return null;
  const elRect = el.getBoundingClientRect();
  const canvasRect = canvasEl.getBoundingClientRect();
  // pinInfo coords are in the element's intrinsic pixel space; scale by rendered size.
  const scaleX = elRect.width / (el.offsetWidth || elRect.width);
  const scaleY = elRect.height / (el.offsetHeight || elRect.height);
  const screenX = elRect.left + pin.x * scaleX;
  const screenY = elRect.top + pin.y * scaleY;
  return { x: (screenX - canvasRect.left) / zoom, y: (screenY - canvasRect.top) / zoom };
}
