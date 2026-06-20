"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, UserPlus, ClipboardList, Star } from "lucide-react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createClass, addStudentByEmail, createAssignment, gradeSubmission } from "@/lib/teacher/actions";

// ── Create Class Dialog ───────────────────────────────────────────────────────
export function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createClass(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Class created!");
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" /> New Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new class</DialogTitle>
          <DialogDescription>Give your class a name. Students can join with the generated code.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="class-name">Class name</Label>
            <Input
              id="class-name"
              name="name"
              placeholder="e.g. Grade 8 Robotics"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending ? "Creating…" : "Create class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Student Dialog ────────────────────────────────────────────────────────
export function AddStudentDialog({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addStudentByEmail(classId, fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`${res.studentName ?? "Student"} added to class!`);
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="size-4" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add student by email</DialogTitle>
          <DialogDescription>Enter the student&apos;s school email to enroll them in this class.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="student-email">Student email</Label>
            <Input
              id="student-email"
              name="email"
              type="email"
              placeholder="student@school.ac.zw"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending ? "Adding…" : "Add student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Assignment Dialog ──────────────────────────────────────────────────
export function CreateAssignmentDialog({
  classes,
  tasks,
  defaultClassId,
}: {
  classes: { id: string; name: string }[];
  tasks: { id: string; title: string; difficulty: string }[];
  defaultClassId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId ?? "");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (selectedClassId) fd.set("classId", selectedClassId);
    if (selectedTaskId) fd.set("taskId", selectedTaskId);
    startTransition(async () => {
      const res = await createAssignment(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Assignment created!");
        formRef.current?.reset();
        setSelectedTaskId("");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <ClipboardList className="size-4" /> New Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create assignment</DialogTitle>
          <DialogDescription>Assign a task or provide custom instructions to a class.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-title">Title</Label>
            <Input
              id="assignment-title"
              name="title"
              placeholder="e.g. LED Blink Challenge"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Task (optional)</Label>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Link a graded task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No task</SelectItem>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} — {t.difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-instructions">Instructions (optional)</Label>
            <Textarea
              id="assignment-instructions"
              name="instructions"
              placeholder="Describe the assignment goals, hints, or rubric…"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignment-due">Due date (optional)</Label>
            <Input id="assignment-due" name="dueAt" type="datetime-local" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="gradient" disabled={pending || !selectedClassId}>
              {pending ? "Creating…" : "Create assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Grade Submission Dialog ───────────────────────────────────────────────────
export function GradeDialog({
  submissionId,
  studentName,
  taskTitle,
  existingScore,
  existingFeedback,
}: {
  submissionId: string;
  studentName: string;
  taskTitle: string;
  existingScore?: number | null;
  existingFeedback?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("submissionId", submissionId);
    startTransition(async () => {
      const res = await gradeSubmission(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Submission graded and points awarded!");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="size-4" /> Grade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
          <DialogDescription>
            {studentName} — <span className="font-medium text-foreground">{taskTitle}</span>
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`score-${submissionId}`}>Score (0–100)</Label>
            <Input
              id={`score-${submissionId}`}
              name="score"
              type="number"
              min={0}
              max={100}
              defaultValue={existingScore ?? ""}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`feedback-${submissionId}`}>Feedback (optional)</Label>
            <Textarea
              id={`feedback-${submissionId}`}
              name="feedback"
              defaultValue={existingFeedback ?? ""}
              placeholder="Well done! Next time try…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending ? "Saving…" : "Save grade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
