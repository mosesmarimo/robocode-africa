import { Zap } from "lucide-react";
import { levelProgress } from "@/lib/domain/constants";

export function PointsPill({ points }: { points: number }) {
  const { level, pct } = levelProgress(points);
  return (
    <div className="hidden items-center gap-2.5 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
      <span className="grid size-6 place-items-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
        {level}
      </span>
      <div className="flex flex-col">
        <span className="flex items-center gap-1 text-xs font-semibold leading-none">
          <Zap className="size-3 text-accent" /> {points.toLocaleString()}
        </span>
        <span className="mt-1 block h-1 w-20 overflow-hidden rounded-full bg-muted">
          <span className="block h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
        </span>
      </div>
    </div>
  );
}
