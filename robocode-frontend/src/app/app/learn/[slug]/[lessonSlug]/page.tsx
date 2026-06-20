import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { apiGet, ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CompleteLessonButton } from "@/components/learn/lesson-actions";

export const metadata = { title: "Lesson" };

/** Tiny markdown-ish renderer: lines starting with # → heading, blank → spacing, else paragraph */
function renderBlock(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let paraLines: string[] = [];
  let key = 0;

  function flushPara() {
    if (paraLines.length === 0) return;
    const content = paraLines.join(" ").trim();
    if (content) {
      elements.push(
        <p key={key++} className="leading-relaxed text-foreground/90">
          {content}
        </p>,
      );
    }
    paraLines = [];
  }

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith("### ")) {
      flushPara();
      elements.push(
        <h3 key={key++} className="font-display text-lg font-bold mt-5 mb-1">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      flushPara();
      elements.push(
        <h2 key={key++} className="font-display text-xl font-bold mt-6 mb-2">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      flushPara();
      elements.push(
        <h1 key={key++} className="font-display text-2xl font-bold mt-6 mb-2">
          {line.slice(2)}
        </h1>,
      );
    } else if (line.trim() === "") {
      flushPara();
      elements.push(<div key={key++} className="h-3" />);
    } else {
      paraLines.push(line);
    }
  }
  flushPara();

  return elements;
}

type BodyBlock = { type: string; text: string };

interface LessonNav {
  id: string;
  slug: string;
  title: string;
}

interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  estMinutes: number;
  body: { blocks?: BodyBlock[] } | null;
}

interface LessonCourse {
  id: string;
  slug: string;
  title: string;
  lessons: LessonNav[];
}

interface LessonResponse {
  course: LessonCourse;
  lesson: LessonDetail;
  lessonIndex: number;
  prevLesson: LessonNav | null;
  nextLesson: LessonNav | null;
  isEnrolled: boolean;
  isCompleted: boolean;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;

  let data: LessonResponse;
  try {
    data = await apiGet<LessonResponse>(`/learn/courses/${slug}/lessons/${lessonSlug}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const { course, lesson, prevLesson, nextLesson, isEnrolled, isCompleted } = data;
  const lessonIdx = data.lessonIndex;

  // Parse body blocks
  const blocks: BodyBlock[] = lesson.body?.blocks ?? [];

  const nextHref = nextLesson
    ? `/app/learn/${course.slug}/${nextLesson.slug}`
    : null;

  const courseHref = `/app/learn/${course.slug}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb nav */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/app/learn">Learn</Link>
        </Button>
        <span>/</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href={courseHref}>{course.title}</Link>
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {lesson.title}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main lesson content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Lesson header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="muted">
                  Lesson {lessonIdx + 1} of {course.lessons.length}
                </Badge>
                {lesson.estMinutes > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="size-3" />
                    {lesson.estMinutes} min
                  </Badge>
                )}
                {isCompleted && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Completed
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                {lesson.title}
              </h1>
            </div>
          </div>

          {/* Lesson body */}
          {blocks.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This lesson has no content yet.
              </p>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8">
              <div className="prose-lesson space-y-1">
                {blocks.map((block, i) => {
                  if (block.type === "markdown") {
                    return (
                      <div key={i} className="space-y-1">
                        {renderBlock(block.text)}
                      </div>
                    );
                  }
                  // Fallback for unknown block types
                  return (
                    <p key={i} className="text-sm text-muted-foreground">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </Card>
          )}

          <Separator />

          {/* Bottom navigation */}
          <div className="flex items-center justify-between gap-3">
            <div>
              {prevLesson ? (
                <Button variant="outline" asChild>
                  <Link href={`/app/learn/${course.slug}/${prevLesson.slug}`}>
                    <ArrowLeft className="size-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href={courseHref}>
                    <ArrowLeft className="size-4" />
                    <span className="hidden sm:inline">Back to course</span>
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isEnrolled ? (
                isCompleted ? (
                  nextLesson ? (
                    <Button variant="gradient" size="lg" asChild>
                      <Link href={`/app/learn/${course.slug}/${nextLesson.slug}`}>
                        Next lesson <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="gradient" size="lg" asChild>
                      <Link href={courseHref}>
                        <CheckCircle2 className="size-4" />
                        Back to course
                      </Link>
                    </Button>
                  )
                ) : (
                  <CompleteLessonButton
                    lessonId={lesson.id}
                    courseId={course.id}
                    nextHref={nextHref}
                  />
                )
              ) : (
                <Button variant="outline" asChild>
                  <Link href={courseHref}>Enroll to track progress</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: lesson list */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-3">
            <h2 className="font-display font-bold text-sm uppercase tracking-wide text-muted-foreground">
              Lessons
            </h2>
            <Card className="divide-y divide-border overflow-hidden p-0">
              {course.lessons.map((l, i) => {
                const isCurrent = l.id === lesson.id;
                return (
                  <Link
                    key={l.id}
                    href={`/app/learn/${course.slug}/${l.slug}`}
                    className={`flex items-center gap-2.5 p-3 text-sm transition-colors hover:bg-muted/50 ${
                      isCurrent ? "bg-primary/8 text-primary font-semibold" : ""
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <span className="shrink-0 text-xs w-4 text-center text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="flex-1 line-clamp-2 leading-snug">
                      {l.title}
                    </span>
                    {isCurrent && (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
