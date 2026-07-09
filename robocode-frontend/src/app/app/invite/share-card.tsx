"use client";

import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// `navigator.share` only exists in the browser, and its availability never
// changes at runtime — useSyncExternalStore (no subscription, just a server
// vs. client snapshot) reads it without a server/client hydration mismatch,
// unlike a plain `typeof navigator` check done directly in the render body.
function subscribe() {
  return () => {};
}
function getShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
function getServerShareSnapshot() {
  return false;
}

export function InviteShareCard({ url, code }: { url: string; code: string }) {
  const [copied, setCopied] = React.useState(false);
  const canShare = React.useSyncExternalStore(subscribe, getShareSnapshot, getServerShareSnapshot);

  async function copy() {
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    try {
      await navigator.share({
        title: "Join me on RoboCode.Africa",
        text: "Build robots, learn to code, and earn RoboPoints with me on RoboCode.Africa!",
        url,
      });
    } catch {
      // Cancelled or unsupported mid-flight — nothing to report.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 font-mono text-lg font-bold tracking-widest text-primary">
          {code}
        </span>
        <span className="text-sm text-muted-foreground">your referral code</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-sm">
          {url}
        </code>
        <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label="Copy invite link">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        {canShare && (
          <Button type="button" variant="gradient" onClick={share}>
            <Share2 className="size-4" /> Share
          </Button>
        )}
      </div>
    </div>
  );
}
