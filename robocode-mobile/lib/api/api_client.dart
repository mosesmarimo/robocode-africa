import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config.dart';

/// Thrown for non-2xx API responses; carries the backend message + field errors.
class ApiException implements Exception {
  final int status;
  final String message;
  final Map<String, String>? fieldErrors;
  ApiException(this.status, this.message, [this.fieldErrors]);
  @override
  String toString() => message;
}

/// Singleton HTTP client for the RoboCode backend. Attaches the stored JWT as a
/// Bearer token and normalises errors into [ApiException].
class ApiClient {
  ApiClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBase,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'content-type': 'application/json'},
      validateStatus: (s) => s != null && s < 500,
    ));
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
      final token = await _storage.read(key: _tokenKey);
      if (token != null && token.isNotEmpty) {
        options.headers['authorization'] = 'Bearer $token';
      }
      handler.next(options);
    }));
  }

  static final ApiClient instance = ApiClient._();

  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'rc_session';

  Future<String?> get token => _storage.read(key: _tokenKey);
  Future<void> setToken(String token) => _storage.write(key: _tokenKey, value: token);
  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  T _unwrap<T>(Response res) {
    final code = res.statusCode ?? 500;
    if (code >= 200 && code < 300) return res.data as T;
    final data = res.data;
    String message = 'Request failed ($code)';
    Map<String, String>? fieldErrors;
    if (data is Map) {
      final m = data['message'];
      if (m is List) {
        message = m.join(', ');
      } else if (m != null) {
        message = m.toString();
      }
      final fe = data['fieldErrors'];
      if (fe is Map) fieldErrors = fe.map((k, v) => MapEntry(k.toString(), v.toString()));
    }
    throw ApiException(code, message, fieldErrors);
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) async {
    final res = await _dio.get(path, queryParameters: query);
    return _unwrap<T>(res);
  }

  Future<T> post<T>(String path, {Object? body}) async {
    final res = await _dio.post(path, data: body);
    return _unwrap<T>(res);
  }

  Future<T> put<T>(String path, {Object? body}) async {
    final res = await _dio.put(path, data: body);
    return _unwrap<T>(res);
  }

  Future<T> patch<T>(String path, {Object? body}) async {
    final res = await _dio.patch(path, data: body);
    return _unwrap<T>(res);
  }
}
