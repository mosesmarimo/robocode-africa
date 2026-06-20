import { Icon } from "@/components/icon";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: string;
  hint?: string;
  tone?: "primary" | "secondary" | "accent" | "success";
}) {
  const toneMap = {
    primary: "bg-primary/12 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/18 text-accent-foreground",
    success: "bg-success/15 text-success",
  } as const;
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", toneMap[tone])}>
        <Icon name={icon} className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none font-display">{value}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
      </div>
    </Card>
  );
}
