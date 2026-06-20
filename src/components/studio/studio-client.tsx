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
  return <StudioApp initial={initial} />;
}
