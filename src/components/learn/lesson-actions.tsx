"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeLesson } from "@/lib/learn/actions";

interface CompleteLessonButtonProps {
  lessonId: string;
  courseId: string;
  nextHref: string | null;
}

export function CompleteLessonButton({
  lessonId,
  courseId,
  nextHref,
}: CompleteLessonButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      const result = await completeLesson(lessonId, courseId);
      if (result.already) {
        toast.info("Already completed!", { description: "Moving on…" });
      } else {
        toast.success("Lesson complete! +20 RoboPoints 🎉", {
          description: nextHref
            ? "Loading the next lesson…"
            : "You've finished all lessons in this course!",
        });
      }
      if (nextHref) {
        router.push(nextHref);
      } else {
        router.back();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button
      variant="gradient"
      size="lg"
      onClick={handleComplete}
      disabled={loading}
      aria-label={nextHref ? "Mark complete and go to next lesson" : "Mark complete"}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CheckCircle2 className="size-4" />
      )}
      {nextHref ? "Mark complete & continue" : "Mark complete"}
    </Button>
  );
}
