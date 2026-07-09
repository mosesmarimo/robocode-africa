import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../../auth/auth-user.type";
import { SocialAccessService } from "./social-access.service";

const FEED_PAGE = 20;

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SocialAccessService,
  ) {}

  /** Aggregated feed: posts from followed projects/users, friends, own projects,
   * and the walls of groups the user is an active member of. */
  async feed(user: AuthUser, cursor?: string) {
    const [follows, memberships, friendships, myProjects] = await Promise.all([
      this.prisma.follow.findMany({ where: { followerId: user.id } }),
      this.prisma.groupMember.findMany({ where: { userId: user.id, status: "active" }, select: { groupId: true } }),
      this.prisma.friendship.findMany({
        where: { status: "accepted", OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
        select: { requesterId: true, addresseeId: true },
      }),
      this.prisma.project.findMany({ where: { ownerId: user.id }, select: { id: true }, take: 100 }),
    ]);

    const projectIds = new Set<string>(myProjects.map((p) => p.id));
    const groupIds = new Set<string>(memberships.map((m) => m.groupId));
    const userIds = new Set<string>([user.id]);
    for (const f of follows) {
      if (f.targetType === "project") projectIds.add(f.targetId);
      else if (f.targetType === "user") userIds.add(f.targetId);
    }
    for (const fr of friendships) {
      userIds.add(fr.requesterId === user.id ? fr.addresseeId : fr.requesterId);
    }

    const or: Record<string, unknown>[] = [];
    if (projectIds.size) or.push({ targetType: "project", targetId: { in: [...projectIds] } });
    if (groupIds.size) or.push({ targetType: "group", targetId: { in: [...groupIds] } });
    if (userIds.size) or.push({ targetType: "user", targetId: { in: [...userIds] } });
    if (!or.length) return { posts: [], nextCursor: null };

    const rows = await this.prisma.post.findMany({
      where: { archivedAt: null, status: "approved", OR: or },
      orderBy: { createdAt: "desc" },
      take: FEED_PAGE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { select: SocialAccessService.cardSelect },
        comments: {
          where: { archivedAt: null, status: "approved" },
          orderBy: { createdAt: "desc" },
          take: 2,
          include: { author: { select: SocialAccessService.cardSelect } },
        },
      },
    });

    const hasMore = rows.length > FEED_PAGE;
    const page = rows.slice(0, FEED_PAGE);

    // Liked-by-me + wall context names, batched.
    const likes = page.length
      ? await this.prisma.postLike.findMany({ where: { userId: user.id, postId: { in: page.map((p) => p.id) } }, select: { postId: true } })
      : [];
    const likedSet = new Set(likes.map((l) => l.postId));
    const context = await this.resolveContext(page);

    return {
      posts: page.map((p) => ({
        id: p.id,
        targetType: p.targetType,
        targetId: p.targetId,
        context: context[`${p.targetType}:${p.targetId}`] ?? null,
        body: p.body,
        attachments: p.attachments ?? [],
        status: p.status,
        author: this.access.card(p.author),
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        likedByMe: likedSet.has(p.id),
        createdAt: p.createdAt,
        recentComments: p.comments
          .slice()
          .reverse()
          .map((c) => ({ id: c.id, body: c.body, author: this.access.card(c.author), createdAt: c.createdAt })),
        canArchive: p.authorId === user.id,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  private async resolveContext(posts: any[]): Promise<Record<string, { type: string; id: string; name: string }>> {
    const projectIds = new Set<string>();
    const groupIds = new Set<string>();
    const userIds = new Set<string>();
    for (const p of posts) {
      if (p.targetType === "project") projectIds.add(p.targetId);
      else if (p.targetType === "group") groupIds.add(p.targetId);
      else if (p.targetType === "user") userIds.add(p.targetId);
    }
    const [projects, groups, users] = await Promise.all([
      projectIds.size ? this.prisma.project.findMany({ where: { id: { in: [...projectIds] } }, select: { id: true, title: true } }) : [],
      groupIds.size ? this.prisma.group.findMany({ where: { id: { in: [...groupIds] } }, select: { id: true, name: true } }) : [],
      userIds.size ? this.prisma.user.findMany({ where: { id: { in: [...userIds] } }, select: { id: true, displayName: true } }) : [],
    ]);
    const map: Record<string, { type: string; id: string; name: string }> = {};
    for (const p of projects) map[`project:${p.id}`] = { type: "project", id: p.id, name: p.title };
    for (const g of groups) map[`group:${g.id}`] = { type: "group", id: g.id, name: g.name };
    for (const u of users) map[`user:${u.id}`] = { type: "user", id: u.id, name: u.displayName };
    return map;
  }
}
