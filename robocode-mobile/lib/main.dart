import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'router.dart';
import 'state/auth.dart';
import 'theme.dart';

void main() {
  runApp(const RoboCodeApp());
}

class RoboCodeApp extends StatefulWidget {
  const RoboCodeApp({super.key});
  @override
  State<RoboCodeApp> createState() => _RoboCodeAppState();
}

class _RoboCodeAppState extends State<RoboCodeApp> {
  late final AuthState _auth;
  late final RoboRouter _router;

  @override
  void initState() {
    super.initState();
    _auth = AuthState();
    _router = RoboRouter(_auth);
    _auth.bootstrap();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _auth,
      child: MaterialApp.router(
        title: 'RoboCode.Africa',
        debugShowCheckedModeBanner: false,
        theme: RoboTheme.light(),
        darkTheme: RoboTheme.dark(),
        routerConfig: _router.config,
      ),
    );
  }
}
