"use client";

// Client wrapper that does the `dynamic(..., { ssr: false })` import — App
// Router forbids `ssr: false` inside a Server Component, so this exists
// purely to give the _site page (and the robocode.africa published fallback)
// a plain "use client" boundary to render, mirroring
// readonly-studio-client.tsx/readonly-studio-app.tsx's split.
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { PublishedSiteData } from "@/components/site/published-site-view";

const PublishedSiteView = dynamic(
  () => import("@/components/site/published-site-view").then((m) => m.PublishedSiteView),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-screen place-items-center bg-[#0d1426] text-white/70">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    ),
  },
);

export function PublishedSiteClient({ data }: { data: PublishedSiteData }) {
  return <PublishedSiteView data={data} />;
}
