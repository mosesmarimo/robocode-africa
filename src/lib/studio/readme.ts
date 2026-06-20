import type { Diagram } from "@/lib/domain/diagram";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { getBoard } from "@/lib/domain/boards";

export function partLabel(type: string): string {
  if (type.startsWith("__board__")) return getBoard(type.split(":")[1]).name;
  return COMPONENT_BY_ID[type]?.name ?? type;
}

/** Generates a Markdown description of a project from its diagram. */
export function generateReadme(title: string, diagram: Diagram): string {
  const board = getBoard(diagram.board);
  const comps = (diagram.parts ?? []).filter((p) => p.id !== "mcu" && !p.type.startsWith("__board__"));
  const wires = diagram.wires ?? [];
  const out: string[] = [];
  out.push(`# ${title}`, "");
  out.push(`A **RoboCode.Africa** project built on the **${board.name}** (${board.mcu}).`, "");
  out.push("## Components", "");
  out.push(`- **${board.name}** — the microcontroller running your code`);
  for (const p of comps) out.push(`- **${partLabel(p.type)}**`);
  out.push("", "## Wiring", "");
  if (wires.length) {
    out.push("| From | To | Wire |", "| --- | --- | --- |");
    for (const w of wires) out.push(`| \`${w.from}\` | \`${w.to}\` | ${w.color ?? ""} |`);
  } else {
    out.push("_No connections yet — drag components onto the canvas and wire them pin-to-pin._");
  }
  out.push(
    "",
    "## How it works",
    "",
    "Write your program in `sketch.ino`, then press **Run** to start the simulation. " +
      "RoboCode translates your code into instructions that drive the components in real time — " +
      "LEDs light up, the buzzer sounds, displays show text, and sensors respond to the controls on each component.",
  );
  return out.join("\n");
}
