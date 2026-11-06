# App móvil — Club Atlético Sucre (Flutter)

App para padres de familia. Consume la misma API del backend (Render).
Se construye en la **Fase 7**; por ahora solo está la estructura de carpetas.

## Arquitectura

```
lib/
├── core/        api client, configuración (URL de la API), almacenamiento seguro del token
├── data/
│   ├── models/        modelos (fromJson / toJson)
│   └── repositories/  acceso a la API (patrón Repository)
└── features/    auth, registro, hijos, asistencia, pagos, avisos
```

- Estado: **Riverpod** (los proveedores se pueden probar sin `BuildContext`, errores detectados al compilar).
- Token JWT guardado con `flutter_secure_storage`.

## Cuando lleguemos a la Fase 7

```bash
# dentro de mobile/ (genera android/, ios/, pubspec.yaml sin borrar lib/)
flutter create --org co.atleticosucre --project-name atletico_sucre .
flutter pub get
flutter run
flutter build apk --release      # se publica en GitHub Releases
flutter build appbundle          # para Google Play, más adelante
```
