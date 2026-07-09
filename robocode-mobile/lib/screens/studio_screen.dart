import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../api/api_client.dart';
import '../config.dart';

/// Embeds the RoboCode Studio (the web simulator) in a WebView, authenticated
/// by injecting the JWT as the rc_session cookie for the web origin.
///
/// Use [StudioScreen(projectId: id)] to open a saved project, or
/// [StudioScreen.launch(path)] to open an arbitrary studio path (e.g.
/// `studio/new?mode=coding&lang=python`).
class StudioScreen extends StatefulWidget {
  final String? projectId;
  final String? launchPath;

  const StudioScreen({super.key, required String this.projectId}) : launchPath = null;

  const StudioScreen.launch(String path, {super.key})
      : launchPath = path,
        projectId = null;

  @override
  State<StudioScreen> createState() => _StudioScreenState();
}

class _StudioScreenState extends State<StudioScreen> {
  WebViewController? _controller;
  bool _loading = true;
  String? _error;

  String get _studioUrl {
    final raw = widget.launchPath;
    // Defense-in-depth: only allow relative paths. Reject anything that looks
    // absolute or external (has a URI scheme, or starts with `//`) and fall
    // back to a safe default so we never load an attacker-supplied origin.
    final String path;
    if (raw != null) {
      final looksAbsolute = raw.startsWith('//') || Uri.parse(raw).hasScheme;
      path = looksAbsolute ? 'studio/new' : raw;
    } else {
      path = 'studio/${widget.projectId}';
    }
    return '${AppConfig.webBase}/$path';
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  void _retry() {
    setState(() {
      _error = null;
      _loading = true;
      _controller = null;
    });
    _init();
  }

  Future<void> _init() async {
    try {
      final token = await ApiClient.instance.token;
      final uri = Uri.parse(AppConfig.webBase);
      if (token != null && token.isNotEmpty) {
        await WebViewCookieManager().setCookie(
          WebViewCookie(name: 'rc_session', value: token, domain: uri.host, path: '/'),
        );
      }
      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(NavigationDelegate(
          onNavigationRequest: (request) {
            // Keep the JWT-cookie-bearing WebView pinned to the web origin:
            // only allow in-WebView navigation to the AppConfig.webBase host.
            final uri = Uri.parse(request.url);
            final allowed = Uri.parse(AppConfig.webBase).host;
            if (uri.host == allowed) return NavigationDecision.navigate;
            // Never load a non-allowlisted host in this WebView (it would
            // carry the studio's session cookie to an arbitrary origin). But
            // don't just drop legitimate external links (docs, share targets,
            // etc.) silently — hand https (or http://localhost in dev) off
            // to the system browser/app instead.
            final scheme = uri.scheme.toLowerCase();
            final isExternalHttps = scheme == 'https';
            final isDevLocalhost = scheme == 'http' && (uri.host == 'localhost' || uri.host == '127.0.0.1');
            if (isExternalHttps || isDevLocalhost) {
              launchUrl(uri, mode: LaunchMode.externalApplication);
            }
            return NavigationDecision.prevent;
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (e) {
            if (mounted) setState(() => _error = e.description);
          },
        ))
        ..loadRequest(Uri.parse(_studioUrl));
      if (mounted) setState(() => _controller = controller);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RoboCode Studio'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _controller?.reload(),
          ),
        ],
      ),
      body: Stack(
        children: [
          if (_controller != null) WebViewWidget(controller: _controller!),
          if (_error != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off, size: 40, color: Colors.grey),
                    const SizedBox(height: 12),
                    Text('Could not load the Studio.\n$_error', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _retry,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          if (_loading && _error == null) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
