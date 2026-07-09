// Data models mirroring the backend `social` module response shapes
// (see robocode-frontend `src/lib/social/types.ts`). All use defensive
// manual `fromJson` factories, matching the style of `AppUser`.

/// Friend/relationship status between the viewer and another user.
/// One of: self, none, friends, incoming, outgoing, blocked.
typedef FriendStatus = String;

/// The compact user representation returned across every social endpoint.
class UserCard {
  final String id;
  final String displayName;
  final String? avatarSeed;
  final String role;
  final String? tagline;
  final int level;
  final int roboPoints;
  final String? schoolName;

  UserCard({
    required this.id,
    required this.displayName,
    required this.avatarSeed,
    required this.role,
    required this.tagline,
    required this.level,
    required this.roboPoints,
    required this.schoolName,
  });

  factory UserCard.fromJson(Map<String, dynamic> j) => UserCard(
        id: j['id']?.toString() ?? '',
        displayName: j['displayName']?.toString() ?? 'User',
        avatarSeed: j['avatarSeed']?.toString(),
        role: j['role']?.toString() ?? 'student',
        tagline: j['tagline']?.toString(),
        level: (j['level'] as num?)?.toInt() ?? 1,
        roboPoints: (j['roboPoints'] as num?)?.toInt() ?? 0,
        schoolName: j['schoolName']?.toString(),
      );
}

/// "Followed by people you know" header preview, returned by
/// `GET /social/follows/:targetType/:targetId/follow-preview` and embedded on
/// profile/group payloads. [friendFollowers] are the *viewer's* own friends who
/// follow the target (a capped sample for stacked avatars).
class FollowPreview {
  final int followerCount;
  final int friendFollowerCount;
  final List<UserCard> friendFollowers;

  FollowPreview({
    required this.followerCount,
    required this.friendFollowerCount,
    required this.friendFollowers,
  });

  /// An empty preview, used as a defensive fallback when the field is absent.
  factory FollowPreview.empty() =>
      FollowPreview(followerCount: 0, friendFollowerCount: 0, friendFollowers: const []);

  factory FollowPreview.fromJson(Map<String, dynamic> j) => FollowPreview(
        followerCount: (j['followerCount'] as num?)?.toInt() ?? 0,
        friendFollowerCount: (j['friendFollowerCount'] as num?)?.toInt() ?? 0,
        friendFollowers: _mapList(j['friendFollowers'], UserCard.fromJson),
      );
}

/// A single follower row: a [UserCard] flattened with the viewer's relationship
/// to that follower (so the list can surface friends first and render actions).
class FollowerEntry {
  final UserCard user;
  final bool isFriend;
  final FriendStatus friendStatus;
  final bool following;

  FollowerEntry({
    required this.user,
    required this.isFriend,
    required this.friendStatus,
    required this.following,
  });

  factory FollowerEntry.fromJson(Map<String, dynamic> j) => FollowerEntry(
        user: UserCard.fromJson(j),
        isFriend: j['isFriend'] == true,
        friendStatus: j['friendStatus']?.toString() ?? 'none',
        following: j['following'] == true,
      );
}

/// Wrapper for `GET /social/follows/:targetType/:targetId/followers`.
class FollowersResult {
  final List<FollowerEntry> followers;
  final int total;
  final int friendCount;

  FollowersResult({required this.followers, required this.total, required this.friendCount});

  factory FollowersResult.fromJson(Map<String, dynamic> j) => FollowersResult(
        followers: _mapList(j['followers'], FollowerEntry.fromJson),
        total: (j['total'] as num?)?.toInt() ?? 0,
        friendCount: (j['friendCount'] as num?)?.toInt() ?? 0,
      );
}

/// A pending friend request (incoming or outgoing) wrapping a [UserCard].
class FriendRequestItem {
  final String id;
  final UserCard user;
  final DateTime? createdAt;

  FriendRequestItem({required this.id, required this.user, required this.createdAt});

  factory FriendRequestItem.fromJson(Map<String, dynamic> j) => FriendRequestItem(
        id: j['id']?.toString() ?? '',
        user: UserCard.fromJson((j['user'] as Map?)?.cast<String, dynamic>() ?? const {}),
        createdAt: DateTime.tryParse(j['createdAt']?.toString() ?? ''),
      );
}

/// Wrapper for `GET /social/friends`.
class FriendsList {
  final List<UserCard> friends;
  final List<FriendRequestItem> incoming;
  final List<FriendRequestItem> outgoing;

  FriendsList({required this.friends, required this.incoming, required this.outgoing});

  factory FriendsList.fromJson(Map<String, dynamic> j) => FriendsList(
        friends: _mapList(j['friends'], UserCard.fromJson),
        incoming: _mapList(j['incoming'], FriendRequestItem.fromJson),
        outgoing: _mapList(j['outgoing'], FriendRequestItem.fromJson),
      );
}

/// A search result: a [UserCard] plus the viewer's relationship to it.
class PersonResult {
  final UserCard user;
  final FriendStatus friendStatus;
  final bool following;

  PersonResult({required this.user, required this.friendStatus, required this.following});

  factory PersonResult.fromJson(Map<String, dynamic> j) => PersonResult(
        user: UserCard.fromJson(j),
        friendStatus: j['friendStatus']?.toString() ?? 'none',
        following: j['following'] == true,
      );
}

/// An attachment on a post (currently only a referenced project).
class PostAttachment {
  final String kind;
  final String projectId;
  final String? title;
  final String? board;

  PostAttachment({required this.kind, required this.projectId, this.title, this.board});

  factory PostAttachment.fromJson(Map<String, dynamic> j) => PostAttachment(
        kind: j['kind']?.toString() ?? 'project',
        projectId: j['projectId']?.toString() ?? '',
        title: j['title']?.toString(),
        board: j['board']?.toString(),
      );
}

/// A comment on a post.
class PostComment {
  final String id;
  final String body;
  final String? status;
  final UserCard author;
  final DateTime? createdAt;
  final bool canArchive;

  PostComment({
    required this.id,
    required this.body,
    required this.status,
    required this.author,
    required this.createdAt,
    required this.canArchive,
  });

  factory PostComment.fromJson(Map<String, dynamic> j) => PostComment(
        id: j['id']?.toString() ?? '',
        body: j['body']?.toString() ?? '',
        status: j['status']?.toString(),
        author: UserCard.fromJson((j['author'] as Map?)?.cast<String, dynamic>() ?? const {}),
        createdAt: DateTime.tryParse(j['createdAt']?.toString() ?? ''),
        canArchive: j['canArchive'] == true,
      );
}

/// The page/source a feed post came from (group / project / user wall).
class FeedContext {
  final String type;
  final String id;
  final String name;

  FeedContext({required this.type, required this.id, required this.name});

  factory FeedContext.fromJson(Map<String, dynamic> j) => FeedContext(
        type: j['type']?.toString() ?? '',
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
      );
}

/// A wall/feed post.
class Post {
  final String id;
  final String targetType; // project | group | user
  final String targetId;
  final String body;
  final List<PostAttachment> attachments;
  final String status;
  final UserCard author;
  final int likeCount;
  final int commentCount;
  final bool likedByMe;
  final DateTime? createdAt;
  final List<PostComment> recentComments;
  final bool canArchive;
  final FeedContext? context;

  Post({
    required this.id,
    required this.targetType,
    required this.targetId,
    required this.body,
    required this.attachments,
    required this.status,
    required this.author,
    required this.likeCount,
    required this.commentCount,
    required this.likedByMe,
    required this.createdAt,
    required this.recentComments,
    required this.canArchive,
    required this.context,
  });

  factory Post.fromJson(Map<String, dynamic> j) => Post(
        id: j['id']?.toString() ?? '',
        targetType: j['targetType']?.toString() ?? 'user',
        targetId: j['targetId']?.toString() ?? '',
        body: j['body']?.toString() ?? '',
        attachments: _mapList(j['attachments'], PostAttachment.fromJson),
        status: j['status']?.toString() ?? 'approved',
        author: UserCard.fromJson((j['author'] as Map?)?.cast<String, dynamic>() ?? const {}),
        likeCount: (j['likeCount'] as num?)?.toInt() ?? 0,
        commentCount: (j['commentCount'] as num?)?.toInt() ?? 0,
        likedByMe: j['likedByMe'] == true,
        createdAt: DateTime.tryParse(j['createdAt']?.toString() ?? ''),
        recentComments: _mapList(j['recentComments'], PostComment.fromJson),
        canArchive: j['canArchive'] == true,
        context: j['context'] is Map
            ? FeedContext.fromJson((j['context'] as Map).cast<String, dynamic>())
            : null,
      );
}

/// Wrapper for `GET /social/posts/wall/...`.
class Wall {
  final List<Post> posts;
  final String? nextCursor;
  final bool canPost;
  final bool? following;

  Wall({required this.posts, required this.nextCursor, required this.canPost, required this.following});

  factory Wall.fromJson(Map<String, dynamic> j) => Wall(
        posts: _mapList(j['posts'], Post.fromJson),
        nextCursor: j['nextCursor']?.toString(),
        canPost: j['canPost'] == true,
        following: j['following'] is bool ? j['following'] as bool : null,
      );
}

/// Wrapper for `GET /social/feed`.
class Feed {
  final List<Post> posts;
  final String? nextCursor;

  Feed({required this.posts, required this.nextCursor});

  factory Feed.fromJson(Map<String, dynamic> j) => Feed(
        posts: _mapList(j['posts'], Post.fromJson),
        nextCursor: j['nextCursor']?.toString(),
      );
}

/// Wrapper for `GET /social/posts/:id/comments`.
class CommentPage {
  final List<PostComment> comments;
  final String? nextCursor;

  CommentPage({required this.comments, required this.nextCursor});

  factory CommentPage.fromJson(Map<String, dynamic> j) => CommentPage(
        comments: _mapList(j['comments'], PostComment.fromJson),
        nextCursor: j['nextCursor']?.toString(),
      );
}

/// A group as it appears in lists.
class GroupSummary {
  final String id;
  final String name;
  final String? description;
  final String? avatarSeed;
  final String visibility;
  final String ownerId;
  final int memberCount;
  final String? myRole;
  final String? myStatus;

  GroupSummary({
    required this.id,
    required this.name,
    required this.description,
    required this.avatarSeed,
    required this.visibility,
    required this.ownerId,
    required this.memberCount,
    required this.myRole,
    required this.myStatus,
  });

  bool get isAdmin => myRole == 'admin' || myRole == 'owner';

  factory GroupSummary.fromJson(Map<String, dynamic> j) => GroupSummary(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? 'Group',
        description: j['description']?.toString(),
        avatarSeed: j['avatarSeed']?.toString(),
        visibility: j['visibility']?.toString() ?? 'public',
        ownerId: j['ownerId']?.toString() ?? '',
        memberCount: (j['memberCount'] as num?)?.toInt() ?? 0,
        myRole: j['myRole']?.toString(),
        myStatus: j['myStatus']?.toString(),
      );
}

/// Wrapper for `GET /social/groups`.
class GroupsList {
  final List<GroupSummary> myGroups;
  final List<GroupSummary> discoverable;

  GroupsList({required this.myGroups, required this.discoverable});

  factory GroupsList.fromJson(Map<String, dynamic> j) => GroupsList(
        myGroups: _mapList(j['myGroups'], GroupSummary.fromJson),
        discoverable: _mapList(j['discoverable'], GroupSummary.fromJson),
      );
}

/// A member of a group: a [UserCard] plus group-specific role/status.
class GroupMemberCard {
  final UserCard user;
  final String role; // admin | member | owner
  final String status; // active | pending
  final DateTime? joinedAt;

  GroupMemberCard({required this.user, required this.role, required this.status, required this.joinedAt});

  bool get isPending => status == 'pending';
  bool get isAdmin => role == 'admin' || role == 'owner';

  factory GroupMemberCard.fromJson(Map<String, dynamic> j) => GroupMemberCard(
        user: UserCard.fromJson(j),
        role: j['role']?.toString() ?? 'member',
        status: j['status']?.toString() ?? 'active',
        joinedAt: DateTime.tryParse(j['joinedAt']?.toString() ?? ''),
      );
}

/// The viewer's relationship/permissions for a group.
class GroupViewerState {
  final String? role;
  final String? status;
  final bool isAdmin;
  final bool isMember;
  final bool canPost;
  final bool canViewWall;
  final bool canModerate;
  final bool following;

  GroupViewerState({
    required this.role,
    required this.status,
    required this.isAdmin,
    required this.isMember,
    required this.canPost,
    required this.canViewWall,
    required this.canModerate,
    required this.following,
  });

  factory GroupViewerState.fromJson(Map<String, dynamic> j) => GroupViewerState(
        role: j['role']?.toString(),
        status: j['status']?.toString(),
        isAdmin: j['isAdmin'] == true,
        isMember: j['isMember'] == true,
        canPost: j['canPost'] == true,
        canViewWall: j['canViewWall'] == true,
        canModerate: j['canModerate'] == true,
        following: j['following'] == true,
      );
}

/// Wrapper for `GET /social/groups/:id`.
class GroupDetail {
  final GroupSummary group;
  final UserCard? owner;
  final DateTime? createdAt;
  final List<GroupMemberCard> members;
  final int activeMemberCount;
  final int pendingCount;
  final GroupViewerState me;
  final int followerCount;
  final FollowPreview followPreview;

  GroupDetail({
    required this.group,
    required this.owner,
    required this.createdAt,
    required this.members,
    required this.activeMemberCount,
    required this.pendingCount,
    required this.me,
    required this.followerCount,
    required this.followPreview,
  });

  factory GroupDetail.fromJson(Map<String, dynamic> j) {
    final g = (j['group'] as Map?)?.cast<String, dynamic>() ?? const {};
    return GroupDetail(
      group: GroupSummary.fromJson(g),
      owner: g['owner'] is Map ? UserCard.fromJson((g['owner'] as Map).cast<String, dynamic>()) : null,
      createdAt: DateTime.tryParse(g['createdAt']?.toString() ?? ''),
      members: _mapList(j['members'], GroupMemberCard.fromJson),
      activeMemberCount: (j['activeMemberCount'] as num?)?.toInt() ?? 0,
      pendingCount: (j['pendingCount'] as num?)?.toInt() ?? 0,
      me: GroupViewerState.fromJson((j['me'] as Map?)?.cast<String, dynamic>() ?? const {}),
      followerCount: (j['followerCount'] as num?)?.toInt() ?? 0,
      followPreview: j['followPreview'] is Map
          ? FollowPreview.fromJson((j['followPreview'] as Map).cast<String, dynamic>())
          : FollowPreview.empty(),
    );
  }
}

/// A badge entry on a profile.
class BadgeItem {
  final String id;
  final DateTime? awardedAt;
  final String name;
  final String description;
  final String? icon;

  BadgeItem({
    required this.id,
    required this.awardedAt,
    required this.name,
    required this.description,
    required this.icon,
  });

  factory BadgeItem.fromJson(Map<String, dynamic> j) {
    final b = (j['badge'] as Map?)?.cast<String, dynamic>() ?? const {};
    return BadgeItem(
      id: j['id']?.toString() ?? '',
      awardedAt: DateTime.tryParse(j['awardedAt']?.toString() ?? ''),
      name: b['name']?.toString() ?? 'Badge',
      description: b['description']?.toString() ?? '',
      icon: b['icon']?.toString(),
    );
  }
}

/// A project shown on a user's social profile.
class ProfileProject {
  final String id;
  final String title;
  final String boardType;
  final String? thumbnail;
  final String visibility;
  final DateTime? updatedAt;

  ProfileProject({
    required this.id,
    required this.title,
    required this.boardType,
    required this.thumbnail,
    required this.visibility,
    required this.updatedAt,
  });

  factory ProfileProject.fromJson(Map<String, dynamic> j) => ProfileProject(
        id: j['id']?.toString() ?? '',
        title: j['title']?.toString() ?? 'Project',
        boardType: j['boardType']?.toString() ?? '',
        thumbnail: j['thumbnail']?.toString(),
        visibility: j['visibility']?.toString() ?? 'private',
        updatedAt: DateTime.tryParse(j['updatedAt']?.toString() ?? ''),
      );
}

/// Level/XP progress on a profile.
class ProfileProgress {
  final int level;
  final int into;
  final int span;
  final double pct;

  ProfileProgress({required this.level, required this.into, required this.span, required this.pct});

  factory ProfileProgress.fromJson(Map<String, dynamic> j) => ProfileProgress(
        level: (j['level'] as num?)?.toInt() ?? 1,
        into: (j['into'] as num?)?.toInt() ?? 0,
        span: (j['span'] as num?)?.toInt() ?? 0,
        pct: (j['pct'] as num?)?.toDouble() ?? 0,
      );
}

/// Aggregate counts on a profile.
class ProfileStats {
  final int friends;
  final int followers;
  final int following;
  final int projects;

  ProfileStats({required this.friends, required this.followers, required this.following, required this.projects});

  factory ProfileStats.fromJson(Map<String, dynamic> j) => ProfileStats(
        friends: (j['friends'] as num?)?.toInt() ?? 0,
        followers: (j['followers'] as num?)?.toInt() ?? 0,
        following: (j['following'] as num?)?.toInt() ?? 0,
        projects: (j['projects'] as num?)?.toInt() ?? 0,
      );
}

/// The viewer's relationship/permissions for a profile.
class ProfileViewerState {
  final bool isSelf;
  final FriendStatus friendStatus;
  final bool following;
  final bool canViewWall;

  ProfileViewerState({
    required this.isSelf,
    required this.friendStatus,
    required this.following,
    required this.canViewWall,
  });

  factory ProfileViewerState.fromJson(Map<String, dynamic> j) => ProfileViewerState(
        isSelf: j['isSelf'] == true,
        friendStatus: j['friendStatus']?.toString() ?? 'none',
        following: j['following'] == true,
        canViewWall: j['canViewWall'] == true,
      );
}

/// Wrapper for `GET /social/users/:id`.
class SocialProfile {
  final UserCard user;
  final String? bio;
  final ProfileProgress progress;
  final List<BadgeItem> badges;
  final List<ProfileProject> projects;
  final ProfileStats stats;
  final ProfileViewerState me;
  final FollowPreview followPreview;

  SocialProfile({
    required this.user,
    required this.bio,
    required this.progress,
    required this.badges,
    required this.projects,
    required this.stats,
    required this.me,
    required this.followPreview,
  });

  factory SocialProfile.fromJson(Map<String, dynamic> j) {
    final u = (j['user'] as Map?)?.cast<String, dynamic>() ?? const {};
    return SocialProfile(
      user: UserCard.fromJson(u),
      bio: u['bio']?.toString(),
      progress: ProfileProgress.fromJson((j['progress'] as Map?)?.cast<String, dynamic>() ?? const {}),
      badges: _mapList(j['badges'], BadgeItem.fromJson),
      projects: _mapList(j['projects'], ProfileProject.fromJson),
      stats: ProfileStats.fromJson((j['stats'] as Map?)?.cast<String, dynamic>() ?? const {}),
      me: ProfileViewerState.fromJson((j['me'] as Map?)?.cast<String, dynamic>() ?? const {}),
      followPreview: j['followPreview'] is Map
          ? FollowPreview.fromJson((j['followPreview'] as Map).cast<String, dynamic>())
          : FollowPreview.empty(),
    );
  }
}

/// Maps a raw JSON list into a typed list using [fromJson], tolerating nulls
/// and non-list values.
List<T> _mapList<T>(dynamic raw, T Function(Map<String, dynamic>) fromJson) {
  if (raw is! List) return <T>[];
  return raw
      .whereType<Map>()
      .map((e) => fromJson(e.cast<String, dynamic>()))
      .toList(growable: false);
}
