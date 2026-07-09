"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { StudioInitial } from "@/components/studio/studio-app";

const StudioApp = dynamic(() => import("@/components/studio/studio-app").then((m) => m.StudioApp), {
  ssr: false,
  loading: () => (
    <div className="grid h-screen place-items-center bg-[#0d1426] text-white/70">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-sm">Loading RoboCode Studio…</p>
      </div>
    </div>
  ),
});

export function StudioClient({ initial }: { initial: StudioInitial }) {
  // Key on the project id so the whole studio remounts (and its module-level
  // zustand store is re-seeded via load()) when navigating between projects.
  return <StudioApp key={initial.projectId} initial={initial} />;
}
