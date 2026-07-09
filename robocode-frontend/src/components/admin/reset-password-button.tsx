"use client";

import { useState, useTransition } from "react";
import { KeyRound, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { resetUserPassword } from "@/lib/admin/actions";
import { resetMemberPassword } from "@/lib/school/actions";

type Scope = "admin" | "school";

interface ResetPasswordButtonProps {
  scope: Scope;
  userId: string;
  name: string;
}

/** Lets a super/school admin reset a user's password — either auto-generate a
 * temporary one (shown once, copyable) or set a specific password. */
export function ResetPasswordButton({ scope, userId, name }: ResetPasswordButtonProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"generate" | "set">("generate");
  const [password, setPassword] = useState("");
  const [temp, setTemp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const reset = scope === "admin" ? resetUserPassword : resetMemberPassword;

  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      // reset local state when the dialog closes
      setMode("generate");
      setPassword("");
      setTemp(null);
      setCopied(false);
    }
  }

  function handle() {
    if (mode === "set" && password.trim().length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    start(async () => {
      const res = await reset(userId, mode === "set" ? password.trim() : undefined).catch((e: Error) => ({
        ok: false as const,
        error: e.message,
      }));
      if (!res.ok) {
        toast.error(res.error ?? "Could not reset password.");
        return;
      }
      if (res.temporaryPassword) {
        setTemp(res.temporaryPassword);
        toast.success("Temporary password generated.");
      } else {
        toast.success(`Password updated for ${name}.`);
        close(false);
      }
    });
  }

  async function copy() {
    if (!temp) return;
    await navigator.clipboard?.writeText(temp);
    setCopied(true);
    toast.success("Copied to clipboard.");
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} aria-label={`Reset password for ${name}`}>
        <KeyRound className="size-3.5" />
        Reset password
      </Button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password — {name}</DialogTitle>
            <DialogDescription>
              {temp
                ? "Share this temporary password with the user securely. It won't be shown again. Ask them to change it from Settings after signing in."
                : "Generate a temporary password to hand over, or set a specific one. The user is notified that their password changed (the password itself is not sent to them)."}
            </DialogDescription>
          </DialogHeader>

          {temp ? (
            <div className="space-y-2 pt-1">
              <Label>Temporary password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">{temp}</code>
                <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label="Copy password">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "generate" ? "default" : "outline"}
                  onClick={() => setMode("generate")}
                >
                  Generate one
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "set" ? "default" : "outline"}
                  onClick={() => setMode("set")}
                >
                  Set a password
                </Button>
              </div>
              {mode === "set" && (
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="text"
                    autoComplete="off"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={pending}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {temp ? (
              <DialogClose asChild>
                <Button variant="default">Done</Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="ghost" disabled={pending}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button variant="default" onClick={handle} disabled={pending}>
                  {pending ? "Resetting…" : mode === "generate" ? "Generate password" : "Set password"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
