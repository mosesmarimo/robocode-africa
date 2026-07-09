"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid h-screen place-items-center bg-[#0d1426] px-4 text-white">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-destructive/15 text-red-300">
          <AlertTriangle className="size-7" />
        </span>
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold">Studio couldn&apos;t load</h1>
          <p className="text-white/60">
            We hit a snag opening this project. Please try again.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient" onClick={reset}>
            <RotateCw className="size-4" /> Try again
          </Button>
          <Button variant="outline" asChild className="bg-white/5 text-white">
            <Link href="/app/projects">Back to projects</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
