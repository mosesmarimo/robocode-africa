import Link from "next/link";
import { Rocket } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { NavLinks } from "@/components/app/nav-links";
import { navForRole } from "@/lib/nav";

export function Sidebar({ role, brandName, logoUrl }: { role: string; brandName: string; logoUrl?: string | null }) {
  const sections = navForRole(role);
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 px-4 py-5 lg:flex">
      <div className="px-2">
        <BrandLogo name={brandName} logoUrl={logoUrl} />
      </div>
      <div className="mt-7 flex-1 overflow-y-auto px-1">
        <NavLinks sections={sections} />
      </div>
      <Link
        href="/app/projects"
        className="mt-4 flex items-center gap-3 rounded-xl bg-brand-gradient p-3 text-white shadow-md transition-transform hover:scale-[1.02]"
      >
        <Rocket className="size-5" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Open Studio</p>
          <p className="text-xs text-white/80">Start building</p>
        </div>
      </Link>
    </aside>
  );
}
