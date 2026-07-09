import '../models/social.dart';
import 'api_client.dart';

/// Typed wrapper over [ApiClient] for the backend `social` module. Mirrors the
/// server actions in robocode-frontend `src/lib/social/actions.ts`. Every method
/// throws [ApiException] on a non-2xx response, exactly like the rest of the app.
class SocialApi {
  SocialApi._();
  static final SocialApi instance = SocialApi._();

  final ApiClient _api = ApiClient.instance;

  // ---------------------------------------------------------------------------
  // Friends
  // ---------------------------------------------------------------------------

  Future<FriendsList> friends() async =>
      FriendsList.fromJson(await _api.get<Map<String, dynamic>>('/social/friends'));

  Future<void> sendFriendRequest(String userId) =>
      _api.post<Map<String, dynamic>>('/social/friends/requests', body: {'userId': userId});

  Future<void> acceptFriendRequest(String id) =>
      _api.post<Map<String, dynamic>>('/social/friends/requests/$id/accept', body: const {});

  Future<void> declineFriendRequest(String id) =>
      _api.post<Map<String, dynamic>>('/social/friends/requests/$id/decline', body: const {});

  Future<void> cancelFriendRequest(String id) =>
      _api.post<Map<String, dynamic>>('/social/friends/requests/$id/cancel', body: const {});

  Future<void> unfriend(String userId) =>
      _api.delete<Map<String, dynamic>>('/social/friends/$userId');

  Future<void> blockUser(String userId) =>
      _api.post<Map<String, dynamic>>('/social/friends/$userId/block', body: const {});

  // ---------------------------------------------------------------------------
  // Follows
  // ---------------------------------------------------------------------------

  /// `GET /social/follows/me`. Returns the raw map (users / projects / groups);
  /// callers read the lists they need.
  Future<Map<String, dynamic>> myFollows() =>
      _api.get<Map<String, dynamic>>('/social/follows/me');

  /// `GET /social/follows/:targetType/:targetId/followers`. Each follower is
  /// annotated with the viewer's relationship (isFriend / friendStatus /
  /// following) so the list can surface mutuals ("People you know") first.
  Future<FollowersResult> followersOf(String targetType, String targetId) async {
    final res = await _api
        .get<Map<String, dynamic>>('/social/follows/$targetType/$targetId/followers');
    return FollowersResult.fromJson(res);
  }

  /// `GET /social/follows/:targetType/:targetId/follow-preview`. Returns the
  /// follower count plus the viewer's own friends who follow the target
  /// (the "people you know" header sample).
  Future<FollowPreview> followPreview(String targetType, String targetId) async {
    final res = await _api
        .get<Map<String, dynamic>>('/social/follows/$targetType/$targetId/follow-preview');
    return FollowPreview.fromJson(res);
  }

  /// Follow a target. Returns the new `following` flag.
  Future<bool> follow(String targetType, String targetId) async {
    final res = await _api.post<Map<String, dynamic>>('/social/follows',
        body: {'targetType': targetType, 'targetId': targetId});
    return res['following'] == true;
  }

  /// Unfollow a target. Returns the new `following` flag.
  Future<bool> unfollow(String targetType, String targetId) async {
    final res = await _api.post<Map<String, dynamic>>('/social/follows/unfollow',
        body: {'targetType': targetType, 'targetId': targetId});
    return res['following'] == true;
  }

  // ---------------------------------------------------------------------------
  // Groups
  // ---------------------------------------------------------------------------

  Future<GroupsList> groups() async =>
      GroupsList.fromJson(await _api.get<Map<String, dynamic>>('/social/groups'));

  Future<GroupDetail> group(String id) async =>
      GroupDetail.fromJson(await _api.get<Map<String, dynamic>>('/social/groups/$id'));

  /// Create a group, returning the new group id.
  Future<String> createGroup({required String name, String? description}) async {
    final body = <String, dynamic>{'name': name};
    if (description != null && description.trim().isNotEmpty) {
      body['description'] = description.trim();
    }
    final res = await _api.post<Map<String, dynamic>>('/social/groups', body: body);
    return res['groupId']?.toString() ?? '';
  }

  Future<void> updateGroup(
    String id, {
    String? name,
    String? description,
    String? avatarSeed,
    String? visibility,
  }) {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (description != null) body['description'] = description;
    if (avatarSeed != null) body['avatarSeed'] = avatarSeed;
    if (visibility != null) body['visibility'] = visibility;
    return _api.patch<Map<String, dynamic>>('/social/groups/$id', body: body);
  }

  Future<void> joinGroup(String id) =>
      _api.post<Map<String, dynamic>>('/social/groups/$id/join', body: const {});

  Future<void> leaveGroup(String id) =>
      _api.post<Map<String, dynamic>>('/social/groups/$id/leave', body: const {});

  Future<void> approveMember(String groupId, String userId) =>
      _api.post<Map<String, dynamic>>('/social/groups/$groupId/members/$userId/approve', body: const {});

  Future<void> declineMember(String groupId, String userId) =>
      _api.post<Map<String, dynamic>>('/social/groups/$groupId/members/$userId/decline', body: const {});

  Future<void> removeMember(String groupId, String userId) =>
      _api.post<Map<String, dynamic>>('/social/groups/$groupId/members/$userId/remove', body: const {});

  Future<void> setMemberRole(String groupId, String userId, String role) =>
      _api.post<Map<String, dynamic>>('/social/groups/$groupId/members/$userId/role', body: {'role': role});

  // ---------------------------------------------------------------------------
  // Posts / comments / likes
  // ---------------------------------------------------------------------------

  Future<Wall> wall(String targetType, String targetId, {String? cursor}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/social/posts/wall/$targetType/$targetId',
      query: cursor == null ? null : {'cursor': cursor},
    );
    return Wall.fromJson(res);
  }

  Future<CommentPage> comments(String postId, {String? cursor}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/social/posts/$postId/comments',
      query: cursor == null ? null : {'cursor': cursor},
    );
    return CommentPage.fromJson(res);
  }

  /// Create a post. Returns the raw `{ok, postId, status}` map so callers can
  /// react to a `blocked` status from the safety filter.
  Future<Map<String, dynamic>> createPost({
    required String targetType,
    required String targetId,
    required String body,
    List<Map<String, dynamic>>? attachments,
  }) {
    final payload = <String, dynamic>{
      'targetType': targetType,
      'targetId': targetId,
      'body': body,
    };
    if (attachments != null && attachments.isNotEmpty) payload['attachments'] = attachments;
    return _api.post<Map<String, dynamic>>('/social/posts', body: payload);
  }

  /// Add a comment. Returns the raw `{ok, commentId, status}` map.
  Future<Map<String, dynamic>> addComment(String postId, String body) =>
      _api.post<Map<String, dynamic>>('/social/posts/$postId/comments', body: {'body': body});

  /// Toggle a like. Returns the raw `{ok, liked, likeCount}` map.
  Future<Map<String, dynamic>> toggleLike(String postId) =>
      _api.post<Map<String, dynamic>>('/social/posts/$postId/like', body: const {});

  /// Archive a post (hidden but retained — there is no hard delete).
  Future<void> archivePost(String postId) =>
      _api.post<Map<String, dynamic>>('/social/posts/$postId/archive', body: const {});

  /// Archive a comment.
  Future<void> archiveComment(String commentId) =>
      _api.post<Map<String, dynamic>>('/social/posts/comments/$commentId/archive', body: const {});

  // ---------------------------------------------------------------------------
  // People / feed / profile / report
  // ---------------------------------------------------------------------------

  Future<Feed> feed({String? cursor}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/social/feed',
      query: cursor == null ? null : {'cursor': cursor},
    );
    return Feed.fromJson(res);
  }

  Future<List<PersonResult>> searchPeople(String query) async {
    final res = await _api
        .get<Map<String, dynamic>>('/social/people/search', query: {'q': query});
    final raw = res['results'];
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((e) => PersonResult.fromJson(e.cast<String, dynamic>()))
        .toList(growable: false);
  }

  Future<SocialProfile> profile(String userId) async =>
      SocialProfile.fromJson(await _api.get<Map<String, dynamic>>('/social/users/$userId'));

  Future<void> report({
    required String targetType,
    required String targetId,
    required String reason,
  }) =>
      _api.post<Map<String, dynamic>>('/social/report',
          body: {'targetType': targetType, 'targetId': targetId, 'reason': reason});
}
