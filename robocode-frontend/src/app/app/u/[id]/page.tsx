import Link from "next/link";
import { Award, Cpu, UserCheck } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { ROLE_LABELS, type Role } from "@/lib/domain/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { initials, formatRelative } from "@/lib/utils";
import { FriendButton } from "@/components/social/friend-button";
import { FollowButton } from "@/components/social/follow-button";
import { FollowPreview } from "@/components/social/follow-preview";
import { Wall } from "@/components/social/wall";
import type { SocialProfile, Wall as WallType } from "@/lib/social/types";

export const metadata = { title: "Profile" };

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getPageUser();
  const profile = await apiGet<SocialProfile>(`/social/users/${id}`);
  const wall = profile.me.canViewWall
    ? await apiGet<WallType>(`/social/posts/wall/user/${id}`)
    : null;

  const { user, progress, badges, projects, stats } = profile;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-end gap-6">
          <Avatar className="size-20 border-4 border-white/30 text-2xl">
            <AvatarFallback className="text-xl font-bold">{initials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{user.displayName}</h1>
            {user.tagline && <p className="mt-1 text-white/85">{user.tagline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium">
                {ROLE_LABELS[user.role as Role] ?? user.role}
              </span>
              {user.schoolName && (
                <span className="rounded-full bg-white/15 px-3 py-0.5 text-sm">{user.schoolName}</span>
              )}
            </div>
            <div className="mt-4 max-w-sm">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold">Level {progress.level}</span>
                <span className="text-white/80">
                  {progress.into.toLocaleString()} / {progress.span.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profile.me.isSelf ? (
              <Button variant="secondary" size="sm" asChild className="border border-white/20 bg-white/20 text-white hover:bg-white/30">
                <Link href="/app/settings">Edit profile</Link>
              </Button>
            ) : (
              <>
                <FriendButton userId={id} status={profile.me.friendStatus} />
                <FollowButton targetType="user" targetId={id} following={profile.me.following} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      {user.bio && (
        <Card>
          <CardContent className="p-6">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{user.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Friends" value={stats.friends} icon="users" tone="primary" />
        <StatCard label="Followers" value={stats.followers} icon="user-check" tone="accent" />
        <StatCard label="Following" value={stats.following} icon="users-round" tone="secondary" />
        <StatCard label="Projects" value={stats.projects} icon="cpu" tone="success" />
      </section>

      {/* Followers — mutuals first ("people you know") */}
      {profile.followPreview.followerCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <FollowPreview targetType="user" targetId={id} preview={profile.followPreview} currentUserId={me.id} />
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5 text-primary" /> Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  title={`${b.badge.name} — ${b.badge.description}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-center"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-primary">
                    <Award className="size-5" />
                  </span>
                  <span className="text-xs font-semibold leading-tight">{b.badge.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent projects */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="size-5 text-primary" /> Recent projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/app/projects/${p.id}`}
                  className="group rounded-xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug group-hover:text-primary">{p.title}</p>
                    <Badge variant="muted" className="shrink-0">{p.boardType}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground/70">{formatRelative(p.updatedAt)}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wall */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {profile.me.isSelf ? "Your wall" : `${user.displayName.split(" ")[0]}'s wall`}
        </h2>
        {profile.me.canViewWall && wall ? (
          <Wall
            targetType="user"
            targetId={id}
            initial={wall}
            currentUser={{ id: me.id, displayName: me.displayName, avatarSeed: me.avatarSeed }}
          />
        ) : (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-muted">
              <UserCheck className="size-7 text-muted-foreground" />
            </span>
            <p className="font-medium">Add as friend to see their wall</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {user.displayName.split(" ")[0]}&apos;s updates are visible to friends.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
