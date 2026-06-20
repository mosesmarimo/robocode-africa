import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  int _mode = 0; // 0 = student, 1 = school
  bool _busy = false;
  String? _error;

  // Student fields
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _birthYear = TextEditingController();
  final _guardian = TextEditingController();
  // School fields
  final _schoolName = TextEditingController();
  final _slug = TextEditingController();
  final _adminName = TextEditingController();

  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    for (final c in [_name, _email, _password, _birthYear, _guardian, _schoolName, _slug, _adminName]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (_mode == 0) {
        await ApiClient.instance.post('/auth/student-signup', body: {
          'displayName': _name.text.trim(),
          'email': _email.text.trim(),
          'password': _password.text,
          'birthYear': _birthYear.text.trim(),
          'guardianEmail': _guardian.text.trim(),
        });
      } else {
        await ApiClient.instance.post('/auth/school-signup', body: {
          'schoolName': _schoolName.text.trim(),
          'slug': _slug.text.trim(),
          'adminName': _adminName.text.trim(),
          'email': _email.text.trim(),
          'password': _password.text,
        });
      }
      if (!mounted) return;
      context.go('/pending');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not reach the server.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(value: 0, label: Text('Student'), icon: Icon(Icons.person)),
                      ButtonSegment(value: 1, label: Text('School'), icon: Icon(Icons.apartment)),
                    ],
                    selected: {_mode},
                    onSelectionChanged: (s) => setState(() => _mode = s.first),
                  ),
                  const SizedBox(height: 20),
                  if (_mode == 0) ..._studentFields() else ..._schoolFields(),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                  ],
                  const SizedBox(height: 22),
                  FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_mode == 0 ? 'Request student account' : 'Register school'),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Accounts are reviewed for safety before activation.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _gap(List<Widget> ws) {
    final out = <Widget>[];
    for (var i = 0; i < ws.length; i++) {
      out.add(ws[i]);
      if (i < ws.length - 1) out.add(const SizedBox(height: 14));
    }
    return out;
  }

  List<Widget> _studentFields() => _gap([
        TextFormField(controller: _name, decoration: const InputDecoration(labelText: 'Your name', prefixIcon: Icon(Icons.badge_outlined)), validator: _req),
        TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.mail_outline)), validator: _emailV),
        TextFormField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline)), validator: _pwV),
        TextFormField(controller: _birthYear, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Birth year', prefixIcon: Icon(Icons.cake_outlined)), validator: _req),
        TextFormField(controller: _guardian, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Parent/guardian email (under 13)', prefixIcon: Icon(Icons.family_restroom_outlined))),
      ]);

  List<Widget> _schoolFields() => _gap([
        TextFormField(controller: _schoolName, decoration: const InputDecoration(labelText: 'School name', prefixIcon: Icon(Icons.apartment)), validator: _req),
        TextFormField(controller: _slug, decoration: const InputDecoration(labelText: 'Subdomain (e.g. springfield)', prefixIcon: Icon(Icons.link)), validator: _req),
        TextFormField(controller: _adminName, decoration: const InputDecoration(labelText: 'Your name', prefixIcon: Icon(Icons.badge_outlined)), validator: _req),
        TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Admin email', prefixIcon: Icon(Icons.mail_outline)), validator: _emailV),
        TextFormField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline)), validator: _pwV),
      ]);

  String? _req(String? v) => (v == null || v.trim().isEmpty) ? 'Required' : null;
  String? _emailV(String? v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null;
  String? _pwV(String? v) => (v == null || v.length < 6) ? 'At least 6 characters' : null;
}
