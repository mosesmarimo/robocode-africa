"use client";

import * as React from "react";
import { nanoid } from "nanoid";
import { ChevronUp, ChevronDown, Trash2, Plus, Play, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStudio } from "@/lib/studio/store";
import {
  type Block,
  type PinMode,
  type BlockCategory,
  DEFAULT_BLOCKS,
  BLOCK_LABELS,
  BLOCK_CATEGORY,
  CATEGORY_COLORS,
  PALETTE_BLOCKS,
  makeBlock,
  generateCode,
} from "@/lib/studio/blocks";

// ── Internal block node with stable id ─────────────────────────────────────

type BlockNode = { id: string; block: Block };

function wrapBlocks(blocks: Block[]): BlockNode[] {
  return blocks.map((block) => ({ id: nanoid(6), block }));
}

function unwrapBlocks(nodes: BlockNode[]): Block[] {
  return nodes.map((n) => n.block);
}

// ── Pin options ─────────────────────────────────────────────────────────────

const DIGITAL_PINS = ["2","3","4","5","6","7","8","9","10","11","12","13"];
const ALL_PINS = ["0","1",...DIGITAL_PINS,"A0","A1","A2","A3","A4","A5"];
const PIN_MODES: PinMode[] = ["OUTPUT","INPUT","INPUT_PULLUP"];

// ── Single Block Row ────────────────────────────────────────────────────────

interface BlockRowProps {
  node: BlockNode;
  index: number;
  total: number;
  depth?: number;
  onUpdate: (id: string, block: Block) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onAddChild?: (parentId: string, block: Block) => void;
  onDeleteChild?: (parentId: string, childId: string) => void;
  onUpdateChild?: (parentId: string, childId: string, block: Block) => void;
  onMoveChildUp?: (parentId: string, childId: string) => void;
  onMoveChildDown?: (parentId: string, childId: string) => void;
}

function BlockRow({
  node,
  index,
  total,
  depth = 0,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddChild,
  onDeleteChild,
  onUpdateChild,
  onMoveChildUp,
  onMoveChildDown,
}: BlockRowProps) {
  const { block } = node;
  const cat: BlockCategory = BLOCK_CATEGORY[block.kind];
  const colors = CATEGORY_COLORS[cat];
  const isContainer = block.kind === "FOREVER" || block.kind === "REPEAT" || block.kind === "IF_PRESSED";

  // Children nodes with stable ids stored per parent node
  const [childNodes, setChildNodes] = React.useState<BlockNode[]>(() =>
    isContainer && "children" in block ? wrapBlocks(block.children) : [],
  );

  // Sync children back up to parent whenever they change
  React.useEffect(() => {
    if (!isContainer) return;
    const children = unwrapBlocks(childNodes);
    if (block.kind === "REPEAT") onUpdate(node.id, { ...block, children });
    else if (block.kind === "FOREVER") onUpdate(node.id, { ...block, children });
    else if (block.kind === "IF_PRESSED") onUpdate(node.id, { ...block, children });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childNodes]);

  function handleChildUpdate(childId: string, updated: Block) {
    setChildNodes((prev) => prev.map((c) => (c.id === childId ? { ...c, block: updated } : c)));
  }
  function handleChildDelete(childId: string) {
    setChildNodes((prev) => prev.filter((c) => c.id !== childId));
  }
  function handleChildAddBlock(b: Block) {
    setChildNodes((prev) => [...prev, { id: nanoid(6), block: b }]);
  }
  function handleChildMoveUp(childId: string) {
    setChildNodes((prev) => {
      const idx = prev.findIndex((c) => c.id === childId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }
  function handleChildMoveDown(childId: string) {
    setChildNodes((prev) => {
      const idx = prev.findIndex((c) => c.id === childId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  return (
    <div className={cn("flex flex-col gap-1", depth > 0 && "ml-4 border-l-2 border-dashed pl-2", colors.border)}>
      {/* Block card */}
      <div className={cn("flex items-start gap-2 rounded-xl border p-2.5", colors.bg, colors.border)}>
        {/* Label */}
        <span className={cn("mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wide", colors.text, "min-w-[96px]")}>
          {BLOCK_LABELS[block.kind]}
        </span>

        {/* Inline params */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <BlockParams block={block} onChange={(b) => onUpdate(node.id, b)} />
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            aria-label="Move block up"
            disabled={index === 0}
            onClick={() => onMoveUp(node.id)}
            className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-white/10 hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            aria-label="Move block down"
            disabled={index === total - 1}
            onClick={() => onMoveDown(node.id)}
            className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-white/10 hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="size-3.5" />
          </button>
          <button
            aria-label="Delete block"
            onClick={() => onDelete(node.id)}
            className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-red-500/20 hover:text-red-400"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Children (for container blocks) */}
      {isContainer && (
        <div className="ml-4 flex flex-col gap-1 pl-1">
          {childNodes.map((child, ci) => (
            <BlockRow
              key={child.id}
              node={child}
              index={ci}
              total={childNodes.length}
              depth={depth + 1}
              onUpdate={handleChildUpdate}
              onDelete={handleChildDelete}
              onMoveUp={handleChildMoveUp}
              onMoveDown={handleChildMoveDown}
            />
          ))}

          {/* Add block inside container */}
          <MiniPalette onAdd={handleChildAddBlock} />
        </div>
      )}
    </div>
  );
}

// ── Inline param editors ────────────────────────────────────────────────────

function BlockParams({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.kind) {
    case "PIN_MODE":
      return (
        <>
          <PinSelect value={String(block.pin)} onChange={(v) => onChange({ ...block, pin: Number(v) })} pins={ALL_PINS} />
          <SmallSelect
            value={block.mode}
            options={PIN_MODES}
            onChange={(v) => onChange({ ...block, mode: v as PinMode })}
          />
        </>
      );
    case "DIGITAL_WRITE":
      return (
        <>
          <PinSelect value={String(block.pin)} onChange={(v) => onChange({ ...block, pin: Number(v) })} pins={DIGITAL_PINS} />
          <SmallSelect
            value={block.on ? "HIGH" : "LOW"}
            options={["HIGH", "LOW"]}
            onChange={(v) => onChange({ ...block, on: v === "HIGH" })}
          />
        </>
      );
    case "WAIT":
      return (
        <NumberInput
          value={block.ms}
          min={1}
          max={60000}
          label="ms"
          onChange={(v) => onChange({ ...block, ms: v })}
        />
      );
    case "REPEAT":
      return (
        <NumberInput
          value={block.times}
          min={1}
          max={999}
          label="times"
          onChange={(v) => onChange({ ...block, times: v })}
        />
      );
    case "FOREVER":
      return <span className="text-xs text-muted-foreground italic">runs continuously</span>;
    case "IF_PRESSED":
      return (
        <>
          <span className="text-xs text-muted-foreground">pin</span>
          <PinSelect value={String(block.pin)} onChange={(v) => onChange({ ...block, pin: Number(v) })} pins={DIGITAL_PINS} />
        </>
      );
    case "SERIAL_PRINT":
      return (
        <input
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={block.text}
          maxLength={80}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="text to print"
        />
      );
    case "TONE":
      return (
        <>
          <PinSelect value={String(block.pin)} onChange={(v) => onChange({ ...block, pin: Number(v) })} pins={DIGITAL_PINS} />
          <NumberInput value={block.freq} min={20} max={20000} label="Hz" onChange={(v) => onChange({ ...block, freq: v })} />
        </>
      );
    case "NO_TONE":
      return <PinSelect value={String(block.pin)} onChange={(v) => onChange({ ...block, pin: Number(v) })} pins={DIGITAL_PINS} />;
    case "SERVO_WRITE":
      return (
        <>
          <PinSelect value={String(block.pin)} onChange={(v) => onChange({ ...block, pin: Number(v) })} pins={["3","5","6","9","10","11"]} />
          <NumberInput value={block.angle} min={0} max={180} label="°" onChange={(v) => onChange({ ...block, angle: v })} />
        </>
      );
    default: {
      const _never: never = block;
      void _never;
      return null;
    }
  }
}

// ── Small reusable widgets ──────────────────────────────────────────────────

function PinSelect({ value, onChange, pins }: { value: string; onChange: (v: string) => void; pins: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-20 rounded-lg border-border bg-background px-2 text-xs [&>span]:truncate">
        <span className="text-muted-foreground text-xs mr-1">pin</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {pins.map((p) => (
          <SelectItem key={p} value={p} className="text-xs">
            {p}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SmallSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-28 rounded-lg border-border bg-background px-2 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-xs">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NumberInput({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-1">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </label>
  );
}

// ── Mini inline palette (inside container blocks) ───────────────────────────

const SIMPLE_PALETTE: Block["kind"][] = [
  "DIGITAL_WRITE",
  "WAIT",
  "SERIAL_PRINT",
  "TONE",
  "NO_TONE",
  "SERVO_WRITE",
  "IF_PRESSED",
  "REPEAT",
];

function MiniPalette({ onAdd }: { onAdd: (b: Block) => void }) {
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {SIMPLE_PALETTE.map((kind) => {
        const cat = BLOCK_CATEGORY[kind];
        const colors = CATEGORY_COLORS[cat];
        return (
          <button
            key={kind}
            aria-label={`Add ${BLOCK_LABELS[kind]} block`}
            onClick={() => onAdd(makeBlock(kind))}
            className={cn(
              "flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition-all hover:brightness-125",
              colors.bg,
              colors.border,
              colors.text,
            )}
          >
            <Plus className="size-3" />
            {BLOCK_LABELS[kind]}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Block Editor ───────────────────────────────────────────────────────

export function BlockEditor() {
  const setCode = useStudio((s) => s.setSketch);
  const [nodes, setNodes] = React.useState<BlockNode[]>(() => wrapBlocks(DEFAULT_BLOCKS));
  const [preview, setPreview] = React.useState(false);

  const blocks = unwrapBlocks(nodes);
  const generated = generateCode(blocks);

  function handleUpdate(id: string, updated: Block) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, block: updated } : n)));
  }

  function handleDelete(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  }

  function handleMoveUp(id: string) {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function handleMoveDown(id: string) {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function handleAddBlock(kind: Block["kind"]) {
    setNodes((prev) => [...prev, { id: nanoid(6), block: makeBlock(kind) }]);
  }

  function handleUseCode() {
    setCode(generated);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* Palette header */}
      <div className="border-b border-border bg-card/80 px-3 py-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Add Block
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PALETTE_BLOCKS.map((kind) => {
            const cat = BLOCK_CATEGORY[kind];
            const colors = CATEGORY_COLORS[cat];
            return (
              <button
                key={kind}
                aria-label={`Add ${BLOCK_LABELS[kind]}`}
                onClick={() => handleAddBlock(kind)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all hover:brightness-125 active:scale-95",
                  colors.bg,
                  colors.border,
                  colors.text,
                )}
              >
                <Plus className="size-3.5 shrink-0" />
                {BLOCK_LABELS[kind]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Program blocks */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <span className="text-3xl">🤖</span>
            <p className="text-sm font-medium">Your program is empty</p>
            <p className="text-xs">Click a block above to add it here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {nodes.map((node, i) => (
              <BlockRow
                key={node.id}
                node={node}
                index={i}
                total={nodes.length}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: preview + use code */}
      <div className="border-t border-border bg-card/80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Code2 className="size-3.5" />
            {preview ? "Hide generated code" : "Show generated code"}
          </button>
          <Button variant="gradient" size="sm" onClick={handleUseCode} className="gap-1.5">
            <Play className="size-3.5" />
            Use this code
          </Button>
        </div>
        {preview && (
          <pre className="max-h-40 overflow-y-auto rounded-lg border border-border bg-[#0b1020] p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
            {generated}
          </pre>
        )}
      </div>
    </div>
  );
}
