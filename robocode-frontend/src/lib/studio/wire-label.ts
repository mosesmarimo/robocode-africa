// Colours for the pin-name label drawn at a wire's board endpoint.
// Normally the label is filled with the wire colour and haloed in the canvas
// background — but a dark wire (black GND leads, the palette's #000000) would
// vanish against the dark canvas, so those flip to light text haloed in the
// wire colour (keeping the colour association without losing legibility).

const CANVAS_BG = "#0d1426";

/** Named CSS colours that appear in baked/wokwi-style diagrams. */
const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ef4444",
  green: "#16a34a",
  blue: "#2563ff",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#a855f7",
  gray: "#64748b",
  grey: "#64748b",
  gold: "#eab308",
  brown: "#92400e",
  cyan: "#06b6d4",
  magenta: "#d946ef",
  limegreen: "#22c55e",
};

function toRgb(color: string): { r: number; g: number; b: number } | null {
  const c = NAMED[color.trim().toLowerCase()] ?? color.trim();
  const hex6 = /^#([0-9a-f]{6})$/i.exec(c);
  if (hex6) {
    const n = parseInt(hex6[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const hex3 = /^#([0-9a-f]{3})$/i.exec(c);
  if (hex3) {
    const [r, g, b] = hex3[1].split("").map((d) => parseInt(d + d, 16));
    return { r, g, b };
  }
  return null;
}

/** fill + halo for a pin label so it stays legible for ANY wire colour. */
export function wireLabelColors(wireColor: string): { fill: string; halo: string } {
  const rgb = toRgb(wireColor);
  if (rgb) {
    const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    if (lum < 80) return { fill: "#cbd5e1", halo: wireColor };
  }
  return { fill: wireColor, halo: CANVAS_BG };
}
