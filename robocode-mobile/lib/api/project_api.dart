import 'api_client.dart';
import '../models/project.dart';

class ProjectApi {
  ProjectApi._();
  static final ProjectApi instance = ProjectApi._();
  final ApiClient _api = ApiClient.instance;

  Future<ProjectDetail> detail(String id) async =>
      ProjectDetail.fromJson(await _api.get<Map<String, dynamic>>('/projects/$id'));

  Future<List<ProjectSummary>> top() async =>
      ProjectSummary.listFromTop(await _api.get<Map<String, dynamic>>('/projects/top'));

  /// Clones a shared/public project into the caller's account. Returns the
  /// new project's id. Throws [ApiException] (403) if the source isn't
  /// visible to the caller.
  Future<String> remix(String id) async {
    final res = await _api.post<Map<String, dynamic>>('/projects/$id/remix');
    return res['id'].toString();
  }
}
