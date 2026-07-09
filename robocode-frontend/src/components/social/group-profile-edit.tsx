"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { updateGroup } from "@/lib/social/actions";

interface GroupProfileEditProps {
  groupId: string;
  name: string;
  description: string | null;
  avatarSeed: string;
  visibility: string;
}

export function GroupProfileEdit({
  groupId,
  name: initialName,
  description: initialDescription,
  avatarSeed: initialAvatarSeed,
  visibility: initialVisibility,
}: GroupProfileEditProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [avatarSeed, setAvatarSeed] = useState(initialAvatarSeed);
  const [visibility, setVisibility] = useState(
    initialVisibility === "private" ? "private" : "discoverable",
  );
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await updateGroup(groupId, {
        name: name.trim(),
        description: description.trim(),
        avatarSeed: avatarSeed.trim(),
        visibility: visibility as "discoverable" | "private",
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Group updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="size-3.5" /> Edit group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit group</DialogTitle>
          <DialogDescription>Update your group&apos;s details and visibility.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-seed">Avatar seed</Label>
            <Input
              id="edit-seed"
              value={avatarSeed}
              onChange={(e) => setAvatarSeed(e.target.value)}
              maxLength={32}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger id="edit-visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discoverable">Discoverable</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="gradient" disabled={pending || name.trim().length < 2}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
