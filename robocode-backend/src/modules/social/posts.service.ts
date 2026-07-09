import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { NotifyService } from "../../common/notify.service";
import { ContentSafetyService } from "../../common/content-safety.service";
import { POINTS } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import { SocialAccessService } from "./social-access.service";
import type { CreatePostInput } from "./dto";

const WALL_PAGE = 20;
const COMMENTS_PAGE = 30;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SocialAccessService,
    private readonly points: PointsService,
    private readonly notifier: NotifyService,
    private readonly safety: ContentSafetyService,
  ) {}

  // -------------------------------------------------------------------------
  // Wall reads
  // -------------------------------------------------------------------------

  /** Posts on a target's wall (newest first, cursor-paginated). */
  async wall(user: AuthUser, targetType: string, targetId: string, cursor?: string) {
    const target = await this.access.resolveTarget(targetType, targetId); // 404 if missing
    if (!(await this.access.canViewWall(user, targetType, targetId, target))) throw new ForbiddenException("FORBIDDEN");
    const canMod = this.access.canModerate(user, target.tenantId);

    // archived is never shown on a wall (retained only for audit). Blocked posts
    // are visible to their author and to moderators, hidden from everyone else.
    const where: Record<string, unknown> = { targetType, targetId, archivedAt: null };
    if (!canMod) where.OR = [{ status: "approved" }, { authorId: user.id }];

    const rows = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: WALL_PAGE + 1,
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

    const hasMore = rows.length > WALL_PAGE;
    const page = rows.slice(0, WALL_PAGE);
    const liked = await this.likedSet(user.id, page.map((p) => p.id));

    return {
      posts: page.map((p) => this.shapePost(user, p, liked, canMod)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      canPost: await this.access.canPostTo(user, targetType, targetId, target),
      following: targetType === "user" && targetId === user.id ? null : await this.access.isFollowing(user.id, targetType, targetId),
    };
  }

  private async likedSet(userId: string, postIds: string[]): Promise<Set<string>> {
    if (!postIds.length) return new Set();
    const likes = await this.prisma.postLike.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    return new Set(likes.map((l) => l.postId));
  }

  private shapePost(user: AuthUser, p: any, liked: Set<string>, canMod: boolean) {
    return {
      id: p.id,
      targetType: p.targetType,
      targetId: p.targetId,
      body: p.body,
      attachments: p.attachments ?? [],
      status: p.status,
      author: this.access.card(p.author),
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      likedByMe: liked.has(p.id),
      createdAt: p.createdAt,
      recentComments: (p.comments ?? [])
        .slice()
        .reverse()
        .map((c: any) => ({ id: c.id, body: c.body, author: this.access.card(c.author), createdAt: c.createdAt })),
      canArchive: p.authorId === user.id || canMod,
    };
  }

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  async createPost(user: AuthUser, input: CreatePostInput) {
    if (!(await this.access.canPostTo(user, input.targetType, input.targetId))) {
      throw new ForbiddenException({ message: "You can't post here." });
    }

    // Only your own projects may be attached.
    let attachments: unknown = undefined;
    if (input.attachments?.length) {
      const ids = input.attachments.map((a) => a.projectId);
      const owned = await this.prisma.project.findMany({
        where: { id: { in: ids }, ownerId: user.id },
        select: { id: true, title: true, boardType: true },
      });
      attachments = owned.map((p) => ({ kind: "project", projectId: p.id, title: p.title, board: p.boardType }));
    }

    const status = this.safety.check(input.body) === "clean" ? "approved" : "blocked";
    const post = await this.prisma.post.create({
      data: {
        tenantId: user.tenantId,
        authorId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        body: input.body.trim(),
        attachments: (attachments ?? undefined) as object | undefined,
        status,
      },
    });

    if (status === "blocked") {
      await this.prisma.moderationCase.create({
        data: {
          tenantId: user.tenantId,
          reporterId: null,
          targetType: "post",
          targetId: post.id,
          reason: "Automated safety filter: possible profanity or PII detected.",
          status: "open",
        },
      });
    } else {
      await this.points.awardPoints({
        userId: user.id,
        delta: POINTS.FIRST_POST,
        reason: "Shared your first update",
        refType: "post",
        refId: post.id,
        idemKey: `first-post-${user.id}`,
      });
      await this.points.awardBadge(user.id, "first-post");
    }

    return { ok: true, postId: post.id, status };
  }

  // -------------------------------------------------------------------------
  // Comments
  // -------------------------------------------------------------------------

  private async loadViewablePost(user: AuthUser, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.archivedAt) throw new NotFoundException("NOT_FOUND");
    if (!(await this.access.canViewWall(user, post.targetType, post.targetId))) throw new ForbiddenException("FORBIDDEN");
    return post;
  }

  async listComments(user: AuthUser, postId: string, cursor?: string) {
    const post = await this.loadViewablePost(user, postId);
    const canMod = this.access.canModerate(user, post.tenantId);
    const where: Record<string, unknown> = { postId, archivedAt: null };
    if (!canMod) where.OR = [{ status: "approved" }, { authorId: user.id }];

    const rows = await this.prisma.postComment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: COMMENTS_PAGE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { author: { select: SocialAccessService.cardSelect } },
    });
    const hasMore = rows.length > COMMENTS_PAGE;
    const page = rows.slice(0, COMMENTS_PAGE);
    return {
      comments: page.map((c) => ({
        id: c.id,
        body: c.body,
        status: c.status,
        author: this.access.card(c.author),
        createdAt: c.createdAt,
        canArchive: c.authorId === user.id || canMod,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async addComment(user: AuthUser, postId: string, body: string) {
    const post = await this.loadViewablePost(user, postId);
    const status = this.safety.check(body) === "clean" ? "approved" : "blocked";
    const comment = await this.prisma.postComment.create({
      data: { tenantId: user.tenantId, postId, authorId: user.id, body: body.trim(), status },
    });
    if (status === "blocked") {
      await this.prisma.moderationCase.create({
        data: {
          tenantId: user.tenantId,
          reporterId: null,
          targetType: "comment",
          targetId: comment.id,
          reason: "Automated safety filter: possible profanity or PII detected.",
          status: "open",
        },
      });
    } else {
      await this.prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
      if (post.authorId !== user.id) {
        await this.notifier.notify({
          userId: post.authorId,
          type: "post_comment",
          title: "New comment",
          body: `${user.displayName} commented on your post.`,
          data: { actorId: user.id, actorName: user.displayName, postId },
        });
      }
    }
    return { ok: true, commentId: comment.id, status };
  }

  // -------------------------------------------------------------------------
  // Likes (toggleable)
  // -------------------------------------------------------------------------

  async toggleLike(user: AuthUser, postId: string) {
    const post = await this.loadViewablePost(user, postId);

    // Atomic toggle: deleteMany/create + the matching count change in one
    // transaction so concurrent toggles can't drift the counter or 500.
    const result = await this.prisma.$transaction(async (tx) => {
      const del = await tx.postLike.deleteMany({ where: { postId, userId: user.id } });
      if (del.count > 0) {
        const u = await tx.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });
        return { liked: false, likeCount: Math.max(0, u.likeCount) };
      }
      await tx.postLike.create({ data: { postId, userId: user.id } });
      const u = await tx.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return { liked: true, likeCount: u.likeCount };
    });

    if (result.liked && post.authorId !== user.id) {
      await this.notifier.notify({
        userId: post.authorId,
        type: "post_like",
        title: "Someone liked your post",
        body: `${user.displayName} liked your post.`,
        data: { actorId: user.id, actorName: user.displayName, postId },
      });
    }
    return { ok: true, ...result };
  }

  // -------------------------------------------------------------------------
  // Archive (no hard deletes — retained for audit)
  // -------------------------------------------------------------------------

  private async pageAdmin(user: AuthUser, targetType: string, targetId: string): Promise<boolean> {
    if (targetType === "user") return targetId === user.id;
    if (targetType === "project") {
      const p = await this.prisma.project.findUnique({ where: { id: targetId }, select: { ownerId: true } });
      return !!p && p.ownerId === user.id;
    }
    if (targetType === "group") return this.access.isGroupAdmin(targetId, user.id);
    return false;
  }

  async archivePost(user: AuthUser, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException("NOT_FOUND");
    if (post.archivedAt) return { ok: true };
    const allowed =
      post.authorId === user.id ||
      this.access.canModerate(user, post.tenantId) ||
      (await this.pageAdmin(user, post.targetType, post.targetId));
    if (!allowed) throw new ForbiddenException("FORBIDDEN");

    await this.prisma.post.update({
      where: { id: postId },
      data: { archivedAt: new Date(), archivedById: user.id },
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId: post.tenantId,
        actorId: user.id,
        action: "social.post.archive",
        targetType: "post",
        targetId: postId,
        meta: { byAuthor: post.authorId === user.id },
      },
    });
    return { ok: true };
  }

  async archiveComment(user: AuthUser, commentId: string) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      include: { post: { select: { targetType: true, targetId: true } } },
    });
    if (!comment) throw new NotFoundException("NOT_FOUND");
    if (comment.archivedAt) return { ok: true };
    const allowed =
      comment.authorId === user.id ||
      this.access.canModerate(user, comment.tenantId) ||
      (await this.pageAdmin(user, comment.post.targetType, comment.post.targetId));
    if (!allowed) throw new ForbiddenException("FORBIDDEN");

    await this.prisma.postComment.update({
      where: { id: commentId },
      data: { archivedAt: new Date(), archivedById: user.id },
    });
    if (comment.status === "approved") {
      await this.prisma.post.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } });
    }
    await this.prisma.auditLog.create({
      data: {
        tenantId: comment.tenantId,
        actorId: user.id,
        action: "social.comment.archive",
        targetType: "comment",
        targetId: commentId,
      },
    });
    return { ok: true };
  }
}
