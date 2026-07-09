"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { RankButton } from "@/components/studio/rank-button";
import { PublishDialog } from "@/components/studio/publish-dialog";
import { useStudio } from "@/lib/studio/store";

/** Shared studio header (both Robotics + Coding modes): logo + name → dashboard,
 * editable project title, AI rank, and a Dashboard link. */
export function StudioHeader({ projectId }: { projectId: string }) {
  const title = useStudio((s) => s.title);
  const setTitle = useStudio((s) => s.setTitle);
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <BrandLogo href="/app" name="RoboCode Studio" className="shrink-0" />
      <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Project title"
        className="w-36 rounded-md bg-transparent px-2 py-1 text-sm font-semibold outline-none hover:bg-muted focus:bg-muted sm:w-64"
      />
      <div className="flex-1" />
      <RankButton projectId={projectId} />
      <PublishDialog projectId={projectId} />
      <Button variant="ghost" size="sm" asChild title="Back to dashboard">
        <Link href="/app">
          <LayoutDashboard className="size-4" /> <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </Button>
      <ThemeToggle />
    </header>
  );
}
