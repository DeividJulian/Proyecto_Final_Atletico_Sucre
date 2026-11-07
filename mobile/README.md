# App móvil — Club Atlético Sucre (Flutter)

App para **padres de familia**. Consume la misma API del backend (Render). Profesores y administradores usan la web.

## Arquitectura

```
lib/
├── main.dart / app.dart     arranque, tema, idioma es-CO y aviso "Conectando con el servidor…"
├── core/
│   ├── config.dart          URL de la API (Render en release; --dart-define=API_URL en debug)
│   ├── api_client.dart      HTTP + JWT + errores {"detail"} en español + tiempos de espera
│   ├── token_storage.dart   token en flutter_secure_storage (Keystore de Android, cifrado)
│   ├── server_status.dart   despierta Render y muestra el aviso mientras tanto
│   ├── router.dart          go_router con redirección según la sesión
│   ├── validators.dart      mismas reglas y mensajes que el backend y la web
│   ├── labels.dart, theme.dart
├── data/
│   ├── models/              SessionUser, Player, PlayerDetail, ScheduleItem…
│   └── repositories/        AuthRepository, FamilyRepository (patrón Repository)
├── features/                auth, hijos (luego: registro, asistencia, pagos, avisos)
└── shared/widgets.dart      aviso de servidor, errores, etiquetas de estado
```

**Estado: Riverpod** (y no Provider) porque:
- los proveedores no dependen del `BuildContext`, así que se prueban sin widgets;
- los errores de dependencias se detectan al compilar;
- `AsyncNotifier` y `FutureProvider` modelan directamente "cargando / error / datos", con
  `autoDispose` para no dejar datos de un hijo en memoria al salir.

## Comandos (CMD)

```cmd
cd /d D:\Users\User\Proyecto_Final_Atletico_Sucre\mobile
flutter pub get
flutter analyze
flutter test
```

Ejecutar en el celular (depuración USB activada):

```cmd
REM Contra el backend de producción (Render):
flutter run --dart-define=API_URL=https://proyecto-final-atletico-sucre.onrender.com

REM Contra tu PC (mismo Wi-Fi). En el backend: uvicorn main:app --host 0.0.0.0 --port 8000
REM y busca tu IP con "ipconfig" (Dirección IPv4):
flutter run --dart-define=API_URL=http://192.168.1.50:8000
```

APK de producción (usa Render sin parámetros):

```cmd
flutter build apk --release
```
