import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import { createPostSchema, type CreatePostInput, createCommentSchema, type CreateCommentInput } from "./dto";

@Controller("social/posts")
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /** A target's wall (newest first). */
  @Get("wall/:targetType/:targetId")
  wall(
    @CurrentUser() user: AuthUser,
    @Param("targetType") targetType: string,
    @Param("targetId") targetId: string,
    @Query("cursor") cursor?: string,
  ) {
    return this.posts.wall(user, targetType, targetId, cursor);
  }

  /** Comments on a post. */
  @Get(":id/comments")
  comments(@CurrentUser() user: AuthUser, @Param("id") id: string, @Query("cursor") cursor?: string) {
    return this.posts.listComments(user, id, cursor);
  }

  /** Create a post on a wall (owner/admin/self only; content-filtered). */
  @RequireActive()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body(new ZodPipe(createPostSchema)) body: CreatePostInput) {
    return this.posts.createPost(user, body);
  }

  @RequireActive()
  @Post(":id/comments")
  comment(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(createCommentSchema)) body: CreateCommentInput,
  ) {
    return this.posts.addComment(user, id, body.body);
  }

  @RequireActive()
  @Post(":id/like")
  like(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.posts.toggleLike(user, id);
  }

  /** Archive a post (author / page admin / staff). No hard delete. */
  @RequireActive()
  @Post(":id/archive")
  archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.posts.archivePost(user, id);
  }

  @RequireActive()
  @Post("comments/:id/archive")
  archiveComment(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.posts.archiveComment(user, id);
  }
}
