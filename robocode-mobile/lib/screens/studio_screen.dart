import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../api/api_client.dart';
import '../config.dart';

/// Embeds the RoboCode Studio (the web simulator) in a WebView, authenticated
/// by injecting the JWT as the rc_session cookie for the web origin.
class StudioScreen extends StatefulWidget {
  final String projectId;
  const StudioScreen({super.key, required this.projectId});
  @override
  State<StudioScreen> createState() => _StudioScreenState();
}

class _StudioScreenState extends State<StudioScreen> {
  WebViewController? _controller;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
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
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (e) {
            if (mounted) setState(() => _error = e.description);
          },
        ))
        ..loadRequest(Uri.parse('${AppConfig.webBase}/studio/${widget.projectId}'));
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
