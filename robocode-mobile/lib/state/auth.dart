import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../models/user.dart';

enum AuthStatus { unknown, signedOut, signedIn }

/// Holds the authenticated user + drives login/logout against the backend.
class AuthState extends ChangeNotifier {
  final ApiClient _api = ApiClient.instance;

  AuthStatus status = AuthStatus.unknown;
  AppUser? user;

  bool get isSignedIn => status == AuthStatus.signedIn && user != null;

  /// On app start: if a token exists, validate it via /auth/me.
  Future<void> bootstrap() async {
    final token = await _api.token;
    if (token == null || token.isEmpty) {
      _set(AuthStatus.signedOut, null);
      return;
    }
    try {
      final res = await _api.get<Map<String, dynamic>>('/auth/me');
      final u = res['user'];
      if (u is Map<String, dynamic>) {
        _set(AuthStatus.signedIn, AppUser.fromJson(u));
      } else {
        await _api.clearToken();
        _set(AuthStatus.signedOut, null);
      }
    } catch (_) {
      await _api.clearToken();
      _set(AuthStatus.signedOut, null);
    }
  }

  /// Returns null on success, or an error message on failure.
  Future<String?> login(String email, String password) async {
    try {
      final res = await _api.post<Map<String, dynamic>>('/auth/login', body: {
        'email': email,
        'password': password,
      });
      final token = res['token']?.toString();
      if (token == null) return 'Unexpected response from server.';
      await _api.setToken(token);
      final u = res['user'];
      _set(AuthStatus.signedIn, u is Map<String, dynamic> ? AppUser.fromJson(u) : null);
      if (user == null) await bootstrap();
      return null;
    } on ApiException catch (e) {
      return e.message;
    } catch (_) {
      return 'Could not reach the server. Check your connection.';
    }
  }

  Future<void> refreshUser() async {
    try {
      final res = await _api.get<Map<String, dynamic>>('/auth/me');
      final u = res['user'];
      if (u is Map<String, dynamic>) _set(AuthStatus.signedIn, AppUser.fromJson(u));
    } catch (_) {/* keep current */}
  }

  Future<void> logout() async {
    await _api.clearToken();
    _set(AuthStatus.signedOut, null);
  }

  void _set(AuthStatus s, AppUser? u) {
    status = s;
    user = u;
    notifyListeners();
  }
}
