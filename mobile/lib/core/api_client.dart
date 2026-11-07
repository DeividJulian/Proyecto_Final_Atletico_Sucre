import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import 'config.dart';
import 'token_storage.dart';

/// Error from the API with the Spanish message of {"detail": "..."}.
class ApiException implements Exception {
  ApiException(this.message, {this.status});

  final String message;
  final int? status;

  bool get isUnauthorized => status == 401;

  @override
  String toString() => message;
}

/// Thin HTTP client: base URL, JWT header, JSON, timeouts and Spanish errors.
/// Render's free plan may take ~50 s to wake up, so the timeout is generous.
class ApiClient {
  ApiClient(this._tokens, {http.Client? client, String? baseUrl})
      : _http = client ?? http.Client(),
        baseUrl = baseUrl ?? AppConfig.apiUrl;

  final TokenStorage _tokens;
  final http.Client _http;
  final String baseUrl;

  static const timeout = Duration(seconds: 70);

  /// Called when a protected call answers 401 (expired session).
  void Function()? onUnauthorized;

  Future<dynamic> get(String path, {Map<String, String>? query, bool auth = true}) =>
      _send('GET', path, query: query, auth: auth);

  Future<dynamic> post(String path, Object? body, {bool auth = true}) => _send('POST', path, body: body, auth: auth);

  Future<dynamic> put(String path, Object? body) => _send('PUT', path, body: body);

  /// Downloads a file that needs the session (player photo, receipt). Null when it does not exist.
  Future<Uint8List?> getBytes(String path) async {
    final response = await _guard(() async => _http.get(_uri(path), headers: await _headers(auth: true)));
    if (response.statusCode == 404) return null;
    _check(response, auth: true);
    return response.bodyBytes;
  }

  /// Multipart form (payment with receipt).
  Future<dynamic> multipart(String path, Map<String, String> fields, {String? fileField, String? filePath}) async {
    final request = http.MultipartRequest('POST', _uri(path))
      ..headers.addAll(await _headers(auth: true, json: false))
      ..fields.addAll(fields);
    if (fileField != null && filePath != null) {
      request.files.add(await http.MultipartFile.fromPath(fileField, filePath, contentType: _imageType(filePath)));
    }
    final streamed = await _guard(() => _http.send(request));
    final response = await http.Response.fromStream(streamed);
    _check(response, auth: true);
    return _decode(response);
  }

  Future<dynamic> _send(String method, String path, {Object? body, Map<String, String>? query, bool auth = true}) async {
    final uri = _uri(path, query);
    final headers = await _headers(auth: auth);
    final encoded = body == null ? null : jsonEncode(body);
    final response = await _guard(() {
      switch (method) {
        case 'POST':
          return _http.post(uri, headers: headers, body: encoded);
        case 'PUT':
          return _http.put(uri, headers: headers, body: encoded);
        default:
          return _http.get(uri, headers: headers);
      }
    });
    _check(response, auth: auth);
    return _decode(response);
  }

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('$baseUrl$path').replace(queryParameters: query?.isEmpty ?? true ? null : query);

  Future<Map<String, String>> _headers({required bool auth, bool json = true}) async {
    final headers = <String, String>{'Accept': 'application/json'};
    if (json) headers['Content-Type'] = 'application/json';
    if (auth) {
      final token = await _tokens.read();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<T> _guard<T>(Future<T> Function() call) async {
    try {
      return await call().timeout(timeout);
    } on TimeoutException {
      throw ApiException('El servidor tardó demasiado en responder. Intenta de nuevo.');
    } on SocketException {
      throw ApiException('No hay conexión con el servidor. Revisa tu internet.');
    } on http.ClientException {
      throw ApiException('No hay conexión con el servidor. Revisa tu internet.');
    }
  }

  void _check(http.Response response, {required bool auth}) {
    if (response.statusCode < 400) return;
    final message = _detail(response) ??
        (response.statusCode >= 500
            ? 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.'
            : 'Ocurrió un error. Intenta de nuevo.');
    if (response.statusCode == 401 && auth) onUnauthorized?.call();
    throw ApiException(message, status: response.statusCode);
  }

  String? _detail(http.Response response) {
    try {
      final body = jsonDecode(utf8.decode(response.bodyBytes));
      final detail = body is Map ? body['detail'] : null;
      return detail is String && detail.trim().isNotEmpty ? detail : null;
    } catch (_) {
      return null;
    }
  }

  dynamic _decode(http.Response response) {
    if (response.bodyBytes.isEmpty) return null;
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  static MediaType _imageType(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.png')) return MediaType('image', 'png');
    if (lower.endsWith('.webp')) return MediaType('image', 'webp');
    return MediaType('image', 'jpeg');
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(ref.watch(tokenStorageProvider)));
