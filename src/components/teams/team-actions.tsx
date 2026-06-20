"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createTeam, joinTeam } from "@/lib/teams/actions";

// ---------------------------------------------------------------------------
// CreateTeamDialog
// ---------------------------------------------------------------------------

export function CreateTeamDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createTeam(name, description);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Team created! You're the captain now.");
        setOpen(false);
        setName("");
        setDescription("");
        router.push(`/app/teams/${result.teamId}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg">
          <Plus className="size-4" /> Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new team</DialogTitle>
          <DialogDescription>
            Teams let you collaborate, compete together, and earn bonus RoboPoints.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              placeholder="e.g. Circuit Breakers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team-desc">Description (optional)</Label>
            <Textarea
              id="team-desc"
              placeholder="What's your team about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="gradient" disabled={pending || name.trim().length < 2}>
              {pending ? "Creating…" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// JoinButton
// ---------------------------------------------------------------------------

export function JoinButton({ teamId, isMember }: { teamId: string; isMember: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (isMember) {
    return (
      <Button variant="secondary" size="sm" disabled className="gap-1.5">
        <Users className="size-3.5" /> Joined
      </Button>
    );
  }

  function handleJoin() {
    startTransition(async () => {
      const result = await joinTeam(teamId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("You joined the team!");
        router.push(`/app/teams/${teamId}`);
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleJoin} disabled={pending}>
      {pending ? "Joining…" : "Join team"}
    </Button>
  );
}
