import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet, apiGetOrNull, ApiError } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/social/follow-button";
import { FollowPreview } from "@/components/social/follow-preview";
import { Wall } from "@/components/social/wall";
import type { Wall as WallType, FollowPreview as FollowPreviewType } from "@/lib/social/types";

interface ProjectResponse {
  project: {
    id: string;
    title: string;
    boardType: string;
    thumbnail: string | null;
    description: string | null;
    ownerId: string;
  };
}

async function loadProject(id: string): Promise<ProjectResponse> {
  try {
    return await apiGet<ProjectResponse>(`/projects/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { project } = await loadProject(id);
    return { title: project.title };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectSocialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getPageUser();
  const { project } = await loadProject(id);
  const wall = await apiGet<WallType>(`/social/posts/wall/project/${id}`);
  const followPreview = await apiGetOrNull<FollowPreviewType>(`/social/follows/project/${id}/follow-preview`);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-start gap-5 p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{project.title}</h1>
              <Badge variant="muted">{project.boardType}</Badge>
            </div>
            {project.description && (
              <p className="mt-2 text-muted-foreground">{project.description}</p>
            )}
            {followPreview && followPreview.followerCount > 0 && (
              <div className="mt-3 max-w-md">
                <FollowPreview targetType="project" targetId={id} preview={followPreview} currentUserId={user.id} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FollowButton targetType="project" targetId={id} following={wall.following ?? false} />
            <Button variant="gradient" size="sm" asChild>
              <Link href={`/studio/${id}`}>
                <ExternalLink className="size-3.5" /> Open in Studio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Wall
        targetType="project"
        targetId={id}
        initial={wall}
        currentUser={{ id: user.id, displayName: user.displayName, avatarSeed: user.avatarSeed }}
      />
    </div>
  );
}
