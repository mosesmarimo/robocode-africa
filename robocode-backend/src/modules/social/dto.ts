import { z } from "zod";

// Targets a post / wall can belong to.
export const POST_TARGETS = ["project", "group", "user"] as const;
// Things you can follow.
export const FOLLOW_TARGETS = ["user", "project", "group"] as const;
// Things you can report.
export const REPORT_TARGETS = ["post", "comment", "user", "project", "group"] as const;

// --- Friends ---------------------------------------------------------------
export const friendRequestSchema = z.object({
  userId: z.string().min(1, "A user is required."),
});
export type FriendRequestInput = z.infer<typeof friendRequestSchema>;

// --- Follows ---------------------------------------------------------------
export const followSchema = z.object({
  targetType: z.enum(FOLLOW_TARGETS),
  targetId: z.string().min(1),
});
export type FollowInput = z.infer<typeof followSchema>;

// --- Groups ----------------------------------------------------------------
export const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters.").max(60, "Group name too long (max 60)."),
  description: z.string().trim().max(500, "Description too long (max 500).").optional().default(""),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(500).optional(),
  avatarSeed: z.string().trim().max(40).optional(),
  visibility: z.enum(["discoverable", "private"]).optional(),
});
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const memberRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});
export type MemberRoleInput = z.infer<typeof memberRoleSchema>;

// --- Posts / comments ------------------------------------------------------
const projectAttachment = z.object({
  kind: z.literal("project"),
  projectId: z.string().min(1),
  title: z.string().max(120).optional(),
  board: z.string().max(40).optional(),
});

export const createPostSchema = z.object({
  targetType: z.enum(POST_TARGETS),
  targetId: z.string().min(1),
  body: z.string().trim().min(1, "Write something to post.").max(2000, "Post too long (max 2000 characters)."),
  attachments: z.array(projectAttachment).max(4).optional(),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty.").max(1000, "Comment too long (max 1000 characters)."),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// --- Reporting -------------------------------------------------------------
export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3, "Tell us what's wrong.").max(500, "Reason too long (max 500)."),
});
export type ReportInput = z.infer<typeof reportSchema>;
