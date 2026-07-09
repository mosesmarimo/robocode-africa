"use client";

// Publish-to-web dialog: lets the owner put a project live at
// <subdomain>.<domain> (robocode.studio or robocode.africa — see
// src/lib/publish/actions.ts and the backend's PublishService). Wired into
// the shared Studio header (studio-header.tsx), so it covers both the
// Robotics and Coding studios in one place.
import * as React from "react";
import { Globe, Loader2, Check, Copy, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  listPublishDomains,
  checkPublishAvailability,
  getProjectPublishState,
  publishProject,
  unpublishProject,
  type PublishAvailability,
} from "@/lib/publish/actions";

type Phase = "loading" | "unpublished" | "published";

const AVAILABILITY_DEBOUNCE_MS = 400;

function CopyShareRow({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    try {
      // navigator.share is unavailable in most desktop browsers — guard and
      // fall back silently to just copy/paste (the button is still useful
      // for the many students on mobile browsers where it IS supported).
      if (typeof navigator.share !== "function") {
        await copy();
        return;
      }
      await navigator.share({ title: "Check out my RoboCode project!", url });
    } catch {
      // Cancelled or unsupported mid-flight — nothing to report.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-sm">{url}</code>
      <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label="Copy link">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
      <Button type="button" variant="outline" size="icon-sm" onClick={share} aria-label="Share link">
        <Share2 className="size-4" />
      </Button>
    </div>
  );
}

export function PublishDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [domains, setDomains] = React.useState<string[]>([]);
  const [domain, setDomain] = React.useState("");
  const [subdomain, setSubdomain] = React.useState("");
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(null);
  const [availability, setAvailability] = React.useState<{ checking: boolean; result: PublishAvailability | null }>({
    checking: false,
    result: null,
  });
  const [busy, setBusy] = React.useState(false);

  function openDialog() {
    if (projectId === "new") {
      toast.error("Save your project first, then publish it.");
      return;
    }
    setOpen(true);
  }

  // Load domains + current publish state fresh every time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    setPhase("loading");
    let cancelled = false;
    (async () => {
      const [domainList, current] = await Promise.all([listPublishDomains(), getProjectPublishState(projectId)]);
      if (cancelled) return;
      setDomains(domainList);
      if (current.url) {
        setPublishedUrl(current.url);
        setPhase("published");
      } else {
        setDomain(current.domain ?? domainList[0] ?? "");
        setSubdomain("");
        setAvailability({ checking: false, result: null });
        setPhase("unpublished");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  // Debounced availability check — only one timeout survives per keystroke
  // (each render clears the previous one), so this is race-safe without
  // extra bookkeeping.
  React.useEffect(() => {
    if (phase !== "unpublished") return;
    const name = subdomain.trim().toLowerCase();
    if (!name || !domain) {
      setAvailability({ checking: false, result: null });
      return;
    }
    setAvailability({ checking: true, result: null });
    const t = setTimeout(async () => {
      const r = await checkPublishAvailability(domain, name);
      setAvailability({ checking: false, result: r });
    }, AVAILABILITY_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [domain, subdomain, phase]);

  async function doPublish() {
    const name = subdomain.trim().toLowerCase();
    if (!name || availability.result?.available !== true) return;
    setBusy(true);
    try {
      const r = await publishProject(projectId, domain, name);
      if (!r.ok) {
        toast.error(r.error || "Couldn't publish this project.");
        return;
      }
      setPublishedUrl(r.url);
      setPhase("published");
      toast.success("Published! Your project is live.");
    } finally {
      setBusy(false);
    }
  }

  async function doUnpublish() {
    setBusy(true);
    try {
      await unpublishProject(projectId);
      setPublishedUrl(null);
      setDomain(domains[0] ?? "");
      setSubdomain("");
      setAvailability({ checking: false, result: null });
      setPhase("unpublished");
      toast.success("Unpublished — the name is free again.");
    } finally {
      setBusy(false);
    }
  }

  const name = subdomain.trim().toLowerCase();
  const canPublish = !busy && !!name && availability.result?.available === true;

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog} title="Publish this project to the web">
        <Globe className="size-4" /> <span className="hidden sm:inline">Publish</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="size-5 text-primary" /> Publish to the web
            </DialogTitle>
            <DialogDescription>
              Give your project a live web address anyone can visit — no RoboCode account needed.
            </DialogDescription>
          </DialogHeader>

          {phase === "loading" && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Loading…
            </div>
          )}

          {phase === "published" && publishedUrl && (
            <div className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground">Your project is live at:</p>
              <CopyShareRow url={publishedUrl} />
              <Button type="button" variant="destructive" onClick={doUnpublish} disabled={busy} className="w-full">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Unpublish
              </Button>
            </div>
          )}

          {phase === "unpublished" && (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="publish-domain">Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger id="publish-domain">
                    <SelectValue placeholder="Choose a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="publish-subdomain">Address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="publish-subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="my-cool-robot"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span className="shrink-0 text-sm text-muted-foreground">.{domain}</span>
                </div>
                <div className="min-h-5 text-xs">
                  {availability.checking && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" /> Checking availability…
                    </span>
                  )}
                  {!availability.checking && availability.result?.available === true && (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <Check className="size-3.5" /> {name}.{domain} is available
                    </span>
                  )}
                  {!availability.checking && availability.result && availability.result.available === false && (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <X className="size-3.5" /> {reasonToMessage(availability.result.reason)}
                    </span>
                  )}
                </div>
              </div>

              <Button type="button" variant="gradient" onClick={doPublish} disabled={!canPublish} className="w-full">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />} Publish
              </Button>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Backend `reason` codes → kid-friendly copy (see PublishService.checkAvailability/validateName). */
function reasonToMessage(reason?: string): string {
  switch (reason) {
    case "taken":
      return "That name is already taken.";
    case "reserved-by-a-school":
      return "That name belongs to a school.";
    case "unsupported-domain":
      return "That domain isn't supported.";
    default:
      return reason || "That name isn't available.";
  }
}
