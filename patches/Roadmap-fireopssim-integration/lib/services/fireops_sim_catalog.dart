import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'package:firepath/services/fireops_sim_links.dart';

/// Cached FireOpsSim taskbook catalog for richer companion links.
class FireOpsSimCatalog {
  FireOpsSimCatalog._();

  static const String catalogUrl =
      'https://fireopssim.com/data/taskbook-resources.json';
  static const String _cacheKey = 'fireops_sim_catalog_v1';
  static const String _cacheAtKey = 'fireops_sim_catalog_v1_at';
  static const Duration _maxAge = Duration(days: 7);

  static final FireOpsSimCatalog instance = FireOpsSimCatalog._();

  Map<String, dynamic>? _memory;
  DateTime? _memoryAt;

  Future<Map<String, dynamic>?> load({bool refresh = false}) async {
    if (!refresh && _memory != null) return _memory;

    final prefs = await SharedPreferences.getInstance();
    if (!refresh) {
      final cached = prefs.getString(_cacheKey);
      final cachedAtRaw = prefs.getString(_cacheAtKey);
      if (cached != null && cachedAtRaw != null) {
        final cachedAt = DateTime.tryParse(cachedAtRaw);
        if (cachedAt != null &&
            DateTime.now().difference(cachedAt) <= _maxAge) {
          try {
            _memory = jsonDecode(cached) as Map<String, dynamic>;
            _memoryAt = cachedAt;
            return _memory;
          } catch (_) {
            // fall through to network fetch
          }
        }
      }
    }

    try {
      final response = await http
          .get(Uri.parse(catalogUrl))
          .timeout(const Duration(seconds: 12));
      if (response.statusCode != 200) return _memory;
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) return _memory;
      _memory = decoded;
      _memoryAt = DateTime.now();
      await prefs.setString(_cacheKey, response.body);
      await prefs.setString(_cacheAtKey, _memoryAt!.toIso8601String());
      return _memory;
    } catch (e) {
      debugPrint('FireOpsSimCatalog fetch failed: $e');
      return _memory;
    }
  }

  bool hasCertification(String certId, [Map<String, dynamic>? catalog]) {
    final data = catalog ?? _memory;
    if (data == null) return false;
    final certs = data['certifications'];
    if (certs is! Map) return false;
    return certs.containsKey(certId);
  }

  bool hasTaskOverride(String taskId, [Map<String, dynamic>? catalog]) {
    final data = catalog ?? _memory;
    if (data == null) return false;
    final overrides = data['taskOverrides'];
    if (overrides is! Map) return false;
    return overrides.containsKey(taskId);
  }

  Uri taskbookResourcesUri({
    required String certId,
    required String taskId,
    String? stateCode,
    String? goal,
    String? returnUrl,
    Map<String, dynamic>? catalog,
  }) {
    final data = catalog ?? _memory;
    final resolvedCert =
        hasCertification(certId, data) ? certId : certId.trim().toLowerCase();
    return FireOpsSimLinks.taskbookResourcesUri(
      certId: resolvedCert,
      taskId: taskId,
      stateCode: stateCode,
      goal: goal,
      returnUrl: returnUrl,
    );
  }

  Future<void> warmCache() async {
    await load();
  }
}
