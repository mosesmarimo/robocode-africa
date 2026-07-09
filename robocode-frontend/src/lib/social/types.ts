// Shared types mirroring the backend `social` module response shapes.

export type FriendStatus = "self" | "none" | "friends" | "incoming" | "outgoing" | "blocked";

export interface UserCard {
  id: string;
  displayName: string;
  avatarSeed: string;
  role: string;
  tagline: string | null;
  level: number;
  roboPoints: number;
  schoolName: string | null;
}

export interface FriendRequestItem {
  id: string;
  user: UserCard;
  createdAt: string;
}

export interface FriendsList {
  friends: UserCard[];
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
}

export interface PersonResult extends UserCard {
  friendStatus: FriendStatus;
  following: boolean;
  /** Present when friendStatus is incoming/outgoing — lets the UI act on it. */
  requestId: string | null;
}

/** A follower annotated with the viewer's relationship to them (mutuals). */
export interface FollowerEntry extends UserCard {
  isFriend: boolean;
  friendStatus: FriendStatus;
  following: boolean;
}

export interface FollowersResult {
  followers: FollowerEntry[];
  total: number;
  friendCount: number;
}

/** "Followed by people you know" header preview. */
export interface FollowPreview {
  followerCount: number;
  friendFollowerCount: number;
  friendFollowers: UserCard[];
}

export interface PostAttachment {
  kind: "project";
  projectId: string;
  title?: string;
  board?: string;
}

export interface PostComment {
  id: string;
  body: string;
  status?: string;
  author: UserCard;
  createdAt: string;
  canArchive?: boolean;
}

export interface FeedContext {
  type: string;
  id: string;
  name: string;
}

export interface Post {
  id: string;
  targetType: "project" | "group" | "user";
  targetId: string;
  body: string;
  attachments: PostAttachment[];
  status: string;
  author: UserCard;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  recentComments: PostComment[];
  canArchive: boolean;
  context?: FeedContext | null;
}

export interface Wall {
  posts: Post[];
  nextCursor: string | null;
  canPost: boolean;
  following: boolean | null;
}

export interface Feed {
  posts: Post[];
  nextCursor: string | null;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  avatarSeed: string;
  visibility: string;
  ownerId: string;
  memberCount: number;
  myRole?: string | null;
  myStatus?: string | null;
}

export interface GroupMemberCard extends UserCard {
  role: string;
  status: string;
  joinedAt: string;
}

export interface GroupDetail {
  group: GroupSummary & { owner: UserCard; createdAt: string };
  members: GroupMemberCard[];
  activeMemberCount: number;
  pendingCount: number;
  me: {
    role: string | null;
    status: string | null;
    isAdmin: boolean;
    isMember: boolean;
    canPost: boolean;
    canViewWall: boolean;
    canModerate: boolean;
    following: boolean;
  };
  followerCount: number;
  followPreview: FollowPreview;
}

export interface GroupsList {
  myGroups: GroupSummary[];
  discoverable: GroupSummary[];
}

export interface BadgeItem {
  id: string;
  awardedAt: string;
  badge: { name: string; description: string; icon?: string };
}

export interface ProfileProject {
  id: string;
  title: string;
  boardType: string;
  thumbnail: string | null;
  visibility: string;
  updatedAt: string;
}

export interface SocialProfile {
  user: UserCard & { bio: string | null };
  progress: { level: number; into: number; span: number; pct: number };
  badges: BadgeItem[];
  projects: ProfileProject[];
  stats: { friends: number; followers: number; following: number; projects: number };
  followPreview: FollowPreview;
  me: { isSelf: boolean; friendStatus: FriendStatus; following: boolean; canViewWall: boolean };
}

export type FollowTarget = "user" | "project" | "group";
export type ReportTarget = "post" | "comment" | "user" | "project" | "group";

/** Standard result shape returned by every social server action. */
export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
