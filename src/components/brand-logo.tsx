import Link from "next/link";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({
  name = "RoboCode.Africa",
  logoUrl,
  href = "/app",
  className,
  showName = true,
}: {
  name?: string;
  logoUrl?: string | null;
  href?: string;
  className?: string;
  /** Hide the wordmark and render the logo mark only (e.g. in the Studio toolbar). */
  showName?: boolean;
}) {
  return (
    <Link href={href} aria-label={name} className={cn("group flex items-center gap-2.5", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="size-9 rounded-xl object-cover" />
      ) : (
        <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-md transition-transform group-hover:scale-105">
          <Cpu className="size-5" />
        </span>
      )}
      {showName && <span className="font-display text-base font-bold leading-none tracking-tight">{name}</span>}
    </Link>
  );
}
