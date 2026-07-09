"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from "@/lib/api/client";
import type {
  ActionResult,
  FollowTarget,
  ReportTarget,
  Wall,
  Feed,
  PostComment,
} from "@/lib/social/types";

/** Wrap a backend call, normalising ApiError into a returnable result.
 * Success payload is nested under `.data`. */
async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
    return { ok: false, error: (e as Error).message || "Something went wrong." };
  }
}

// --- Friends ---------------------------------------------------------------
export async function sendFriendRequest(userId: string) {
  const r = await run(() => apiPost<{ ok: boolean; friendshipId: string }>("/social/friends/requests", { userId }));
  revalidatePath("/app/friends");
  return r;
}
export async function acceptFriendRequest(requestId: string) {
  const r = await run(() => apiPost(`/social/friends/requests/${requestId}/accept`));
  revalidatePath("/app/friends");
  return r;
}
export async function declineFriendRequest(requestId: string) {
  const r = await run(() => apiPost(`/social/friends/requests/${requestId}/decline`));
  revalidatePath("/app/friends");
  return r;
}
export async function cancelFriendRequest(requestId: string) {
  const r = await run(() => apiPost(`/social/friends/requests/${requestId}/cancel`));
  revalidatePath("/app/friends");
  return r;
}
export async function unfriend(userId: string) {
  const r = await run(() => apiDelete(`/social/friends/${userId}`));
  revalidatePath("/app/friends");
  return r;
}
export async function blockUser(userId: string) {
  const r = await run(() => apiPost(`/social/friends/${userId}/block`));
  revalidatePath("/app/friends");
  return r;
}

// --- Follows ---------------------------------------------------------------
export async function follow(targetType: FollowTarget, targetId: string) {
  return run(() => apiPost<{ ok: boolean; following: boolean }>("/social/follows", { targetType, targetId }));
}
export async function unfollow(targetType: FollowTarget, targetId: string) {
  return run(() => apiPost<{ ok: boolean; following: boolean }>("/social/follows/unfollow", { targetType, targetId }));
}

// --- Groups ----------------------------------------------------------------
export async function createGroup(input: { name: string; description?: string }) {
  const r = await run(() => apiPost<{ ok: boolean; groupId: string }>("/social/groups", input));
  revalidatePath("/app/groups");
  return r;
}
export async function updateGroup(
  id: string,
  input: { name?: string; description?: string; avatarSeed?: string; visibility?: "discoverable" | "private" },
) {
  const r = await run(() => apiPatch(`/social/groups/${id}`, input));
  revalidatePath(`/app/groups/${id}`);
  return r;
}
export async function joinGroup(id: string) {
  const r = await run(() => apiPost<{ ok: boolean; status: string }>(`/social/groups/${id}/join`));
  revalidatePath(`/app/groups/${id}`);
  revalidatePath("/app/groups");
  return r;
}
export async function leaveGroup(id: string) {
  const r = await run(() => apiPost(`/social/groups/${id}/leave`));
  revalidatePath(`/app/groups/${id}`);
  revalidatePath("/app/groups");
  return r;
}
export async function approveMember(groupId: string, userId: string) {
  const r = await run(() => apiPost(`/social/groups/${groupId}/members/${userId}/approve`));
  revalidatePath(`/app/groups/${groupId}`);
  return r;
}
export async function declineMember(groupId: string, userId: string) {
  const r = await run(() => apiPost(`/social/groups/${groupId}/members/${userId}/decline`));
  revalidatePath(`/app/groups/${groupId}`);
  return r;
}
export async function removeMember(groupId: string, userId: string) {
  const r = await run(() => apiPost(`/social/groups/${groupId}/members/${userId}/remove`));
  revalidatePath(`/app/groups/${groupId}`);
  return r;
}
export async function setMemberRole(groupId: string, userId: string, role: "admin" | "member") {
  const r = await run(() => apiPost(`/social/groups/${groupId}/members/${userId}/role`, { role }));
  revalidatePath(`/app/groups/${groupId}`);
  return r;
}

// --- Posts / comments / likes ---------------------------------------------
export async function createPost(input: {
  targetType: "project" | "group" | "user";
  targetId: string;
  body: string;
  attachments?: { kind: "project"; projectId: string }[];
}) {
  return run(() => apiPost<{ ok: boolean; postId: string; status: string }>("/social/posts", input));
}
export async function addComment(postId: string, body: string) {
  return run(() => apiPost<{ ok: boolean; commentId: string; status: string }>(`/social/posts/${postId}/comments`, { body }));
}
export async function toggleLike(postId: string) {
  return run(() => apiPost<{ ok: boolean; liked: boolean; likeCount: number }>(`/social/posts/${postId}/like`));
}
export async function archivePost(postId: string) {
  return run(() => apiPost(`/social/posts/${postId}/archive`));
}
export async function archiveComment(commentId: string) {
  return run(() => apiPost(`/social/posts/comments/${commentId}/archive`));
}

// --- Reporting -------------------------------------------------------------
export async function reportContent(input: { targetType: ReportTarget; targetId: string; reason: string }) {
  return run(() => apiPost("/social/report", input));
}

// --- Reads / pagination (callable from client components) ------------------
export async function loadWall(targetType: string, targetId: string, cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return run(() => apiGet<Wall>(`/social/posts/wall/${targetType}/${targetId}${qs}`));
}
export async function loadFeed(cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return run(() => apiGet<Feed>(`/social/feed${qs}`));
}
export async function loadComments(postId: string, cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return run(() => apiGet<{ comments: PostComment[]; nextCursor: string | null }>(`/social/posts/${postId}/comments${qs}`));
}
export async function searchPeople(q: string) {
  return run(() => apiGet<{ results: import("@/lib/social/types").PersonResult[] }>(`/social/people/search?q=${encodeURIComponent(q)}`));
}
export async function followersOf(targetType: string, targetId: string) {
  return run(() => apiGet<import("@/lib/social/types").FollowersResult>(`/social/follows/${targetType}/${targetId}/followers`));
}
export async function loadFollowPreview(targetType: string, targetId: string) {
  return run(() => apiGet<import("@/lib/social/types").FollowPreview>(`/social/follows/${targetType}/${targetId}/follow-preview`));
}
