"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import type { NavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavLinks({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTrack = searchParams.get("track");
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.title && (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.href} className="flex flex-col gap-0.5">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    name={item.icon}
                    className={cn("size-[1.15rem] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                  />
                  {item.label}
                </Link>
                {item.children && item.children.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {item.children.map((child) => {
                      const childTrack = new URLSearchParams(child.href.split("?")[1] ?? "").get("track");
                      const childActive = pathname.startsWith("/app/learn") && currentTrack === childTrack;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            "ml-[2.15rem] rounded-md px-3 py-1.5 text-sm transition-all",
                            childActive
                              ? "bg-primary/12 font-semibold text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
