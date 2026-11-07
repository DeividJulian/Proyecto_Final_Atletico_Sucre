import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../core/validators.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_form.currentState?.validate() ?? false) || _loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).login(_email.text, _password.text);
      // The router takes the parent to "Mis hijos"
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ClubColors.black,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                children: [
                  Image.asset('assets/escudo.png', width: 110, height: 110),
                  const SizedBox(height: 12),
                  const Text(
                    'ATLÉTICO SUCRE',
                    style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 1),
                  ),
                  const Text(
                    'EMBAJADORES DEL SUR',
                    style: TextStyle(color: ClubColors.goldLight, letterSpacing: 2, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: _form,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text('Ingresar',
                                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                            const Text('Padres de familia del club', style: TextStyle(color: ClubColors.gray)),
                            const SizedBox(height: 16),
                            if (_error != null) ...[
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: ClubColors.redSoft,
                                  borderRadius: BorderRadius.circular(10),
                                  border: const Border(left: BorderSide(color: ClubColors.red, width: 4)),
                                ),
                                child: Text(_error!, style: const TextStyle(color: ClubColors.redDark)),
                              ),
                              const SizedBox(height: 12),
                            ],
                            TextFormField(
                              controller: _email,
                              keyboardType: TextInputType.emailAddress,
                              autofillHints: const [AutofillHints.email],
                              textInputAction: TextInputAction.next,
                              decoration: const InputDecoration(labelText: 'Correo'),
                              validator: Validators.email,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _password,
                              obscureText: !_showPassword,
                              autofillHints: const [AutofillHints.password],
                              onFieldSubmitted: (_) => _submit(),
                              decoration: InputDecoration(
                                labelText: 'Contraseña',
                                suffixIcon: IconButton(
                                  tooltip: _showPassword ? 'Ocultar' : 'Ver',
                                  icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
                                  onPressed: () => setState(() => _showPassword = !_showPassword),
                                ),
                              ),
                              validator: (value) => Validators.required(value),
                            ),
                            const SizedBox(height: 20),
                            FilledButton(
                              onPressed: _loading ? null : _submit,
                              child: Text(_loading ? 'Ingresando…' : 'Ingresar'),
                            ),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () => context.push('/recuperar-clave'),
                              child: const Text('¿Olvidaste tu contraseña?'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white, width: 1.5),
                    ),
                    onPressed: () => context.push('/registro'),
                    child: const Text('Inscribe a tu hijo'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
