"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { enterCompetition } from "@/lib/competitions/actions";

interface EnterButtonProps {
  competitionId: string;
  teamId?: string;
}

export function EnterButton({ competitionId, teamId }: EnterButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleEnter() {
    setLoading(true);
    try {
      const result = await enterCompetition(competitionId, teamId);
      if (result.ok) {
        toast.success("You're in! 🎉", {
          description: "You've entered the competition and earned 75 RoboPoints.",
        });
      } else {
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Failed to enter competition. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="gradient"
      size="lg"
      onClick={handleEnter}
      disabled={loading}
      aria-label="Enter this competition"
    >
      <Zap className="size-4" />
      {loading ? "Entering…" : "Enter Competition"}
    </Button>
  );
}
