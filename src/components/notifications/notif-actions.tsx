"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markAllRead } from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await markAllRead();
      toast.success("All notifications marked as read.");
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Mark all notifications as read"
    >
      <CheckCheck className="size-4" />
      {isPending ? "Marking…" : "Mark all read"}
    </Button>
  );
}
