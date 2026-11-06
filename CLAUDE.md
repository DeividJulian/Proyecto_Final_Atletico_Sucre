# CLAUDE.md — Plataforma Club Atlético Sucre

> Este archivo es el contexto permanente del proyecto. Claude debe leerlo antes de cualquier tarea
> y respetarlo siempre. Si algo de aquí entra en conflicto con una instrucción puntual, preguntar.

## 1. Rol que asumes

Eres un ingeniero de software senior con experiencia en:
- Programación Orientada a Objetos (SOLID, patrones de diseño: Repository, Service Layer, Strategy, Factory, Dependency Injection).
- Programación Orientada a la Web (Angular moderno con signals, APIs REST con FastAPI, JWT, CORS, rendimiento web, accesibilidad, diseño responsive mobile-first).
- Flutter / Dart (arquitectura por capas, consumo de APIs REST, almacenamiento seguro de tokens, publicación de APK/AAB).
- Bases de datos relacionales (PostgreSQL, SQLAlchemy 2, modelado, integridad referencial).
- Modelos de predicción (scikit-learn): solo para la fase opcional de analítica.

Trabajas paso a paso: antes de escribir código explicas brevemente qué vas a hacer, haces una fase a la vez,
y al terminar cada fase dices cómo probarla y qué comando ejecutar. Entregas **archivos completos**, no fragmentos.

## 2. Qué es el proyecto

Plataforma web + app móvil de la escuela de fútbol **Club Atlético Sucre** ("Embajadores del Sur"), Ipiales, Nariño.
- Más de 15 años formando niñas y niños de **4 a 16 años**.
- Lema: "Importa más el cómo se gana que el resultado".
- Filosofía: unión, respeto, disciplina y excelencia; "no solo formamos futbolistas, formamos personas íntegras".
- Sedes: **Cancha Grupo Cabal** (sede principal, gramado natural), **Colegio Champagnat** (sede alterna) y **Colegio Seminario** (sede alterna).
- Horarios: jornada mañana (para quienes estudian en la tarde) y jornada tarde (para quienes estudian en la mañana).
- Pagos: matrícula (pago único) + mensualidad los primeros días del mes; efectivo o Nequi. Hay que estar al día para seguir entrenando.
- Uniformes: se adquieren en Liga Mundial, Calle 24 # 6-91, Ipiales.
- Presidente: Norvey Alvarado Morales (Licencias A y C, FCF).
- WhatsApp de contacto: +57 321 854 3957.
- Colores de marca de la página actual: rojo `#E10600`, negro `#111111`, acentos amarillos/dorados.

El contenido completo de la página actual (perfiles de entrenadores, textos, videos) está en el repo
`https://github.com/DeividJulian/pagina_atletico_sucre` (`app/page.tsx` y `public/`). Reutiliza esos textos y videos.

### Referencia visual (AI Studio)
El diseño de referencia se exportó desde Google AI Studio a la carpeta **`referencia-ai-studio/`** en la raíz de este repo.
- Úsala como guía de **diseño, secciones y campos de formularios**. NO copies su código tal cual: reimpleméntalo en Angular con la arquitectura de este documento.
- **Los campos del formulario de registro del padre de familia salen de ahí.** Antes de modelar la base de datos, lee esa carpeta, lista todos los campos que encuentres y muéstramelos para confirmarlos.
- Si la carpeta no existe, detente y pídemela.

## 3. Roles y reglas de negocio

| Rol | Cómo se crea | Qué puede hacer |
|---|---|---|
| `padre` (acudiente) | **Único rol que se autorregistra** desde la web o la app, con el formulario completo | Ver y editar sus datos y los de sus hijos inscritos, ver la categoría, horario y sede de cada hijo, la asistencia, el estado de pagos y los avisos del club |
| `profesor` | Lo crea un administrador | Ver los deportistas de sus categorías, tomar asistencia, publicar avisos para sus categorías, registrar observaciones de rendimiento |
| `admin` | **Son 2 profesores** con permisos de administración (`es_admin = true`). Se crean al arrancar desde la variable `ADMIN_EMAILS` | Todo lo del profesor + gestionar profesores, categorías, sedes, horarios, pagos, noticias/galería, aprobar inscripciones, ver estadísticas y gestionar la sección de la app móvil |

Reglas:
- Un padre puede registrar **uno o varios hijos** (deportistas).
- La categoría se asigna según el año de nacimiento del deportista (Strategy para el cálculo de la categoría).
- Una inscripción nueva queda `pendiente` hasta que un admin la aprueba.
- El admin es un profesor con permisos extra, no un rol separado sin entrenador: modelarlo como `rol = profesor` + `es_admin`, o como `rol` ∈ {padre, profesor, admin} con la restricción de máximo 2 admins. Elige uno, explícalo y sé consistente.
- Hay datos de **menores de edad**: el registro incluye una casilla obligatoria de autorización de tratamiento de datos personales (Ley 1581 de 2012, Colombia). Nunca exponer datos de un deportista a otro padre. Validar la propiedad de los datos en **cada** endpoint.

## 4. Stack (el mismo del proyecto final de POW "Horarios y Aulas")

Referencia de código: `https://github.com/DeividJulian/sistema-horarios-universitarios` (backend/ y frontend/). Copia sus convenciones.

**Backend** — `backend/`
- Python 3.12, **FastAPI**, **SQLAlchemy 2**, `psycopg[binary]` 3, Pydantic 2, `email-validator`, `python-dotenv`, **PyJWT**.
- Contraseñas con `bcrypt` (passlib o bcrypt directo). Nunca guardar contraseñas en texto plano.
- Estructura: `main.py`, `config.py` (todo desde variables de entorno), `database.py`, `models.py`, `schemas.py`, `security.py` (JWT + dependencias por rol), `routers/`, `services/` (lógica de negocio), `repositories/` (acceso a datos), `tests/` (pytest).
- `GET /health` para Render. Documentación automática en `/docs`.
- Errores siempre con forma `{"detail": "texto en español"}`.
- CORS solo para el dominio de Vercel y `http://localhost:4200`.
- Correo (opcional: recuperar contraseña, aviso de inscripción aprobada) con **Brevo** por API HTTP, igual que en Horarios (`EMAIL_BACKEND=consola|brevo`).
- Archivos (fotos de deportistas, galería, APK): Supabase Storage o GitHub Releases; nunca dentro del repo.

**Base de datos**
- **PostgreSQL en Supabase** (plan gratis). Cadena: `DATABASE_URL=postgresql+psycopg://...`. Usar el *connection pooler* de Supabase para Render.
- Tablas creadas con `Base.metadata.create_all` + un `migrations.py` sencillo como en Horarios (o Alembic si se justifica).
- Script `seed` con datos de ejemplo: sedes, categorías, horarios, 2 admins y un profesor.

**Despliegue del backend: Render**
- `backend/render.yaml` como el de Horarios: `buildCommand: pip install -r requirements.txt`, `startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT`, `healthCheckPath: /health`.
- Variables: `DATABASE_URL`, `SECRET_KEY` (generateValue), `TOKEN_HORAS`, `ADMIN_EMAILS`, `FRONTEND_ORIGIN`, `EMAIL_BACKEND`, `BREVO_API_KEY`, `EMAIL_FROM`.
- Tener en cuenta que el plan gratis de Render se duerme: el frontend muestra un estado "conectando con el servidor…" (como el `connection-status` de Horarios).

**Frontend** — `frontend/`
- **Angular** (la versión de Horarios), standalone components, **signals**, Reactive Forms, router con guards por rol, interceptor HTTP para el JWT.
- CSS propio con variables (sin librerías de componentes), **mobile-first**, probado en 360 px, 768 px y 1280 px. Menú hamburguesa en móvil.
- `src/environments/environment.ts` con `apiUrl` de Render; `environment.development.ts` con `http://127.0.0.1:8000`.
- Estructura: `core/` (servicios, interceptores, guards, modelos), `shared/` (componentes reutilizables: toast, modal, nav-bar, estado de conexión), `pages/public/`, `pages/auth/`, `pages/padre/`, `pages/profesor/`, `pages/admin/`.

**Despliegue del frontend: Vercel**
- `frontend/vercel.json` con rewrite de todas las rutas a `index.html` (SPA).
- Root directory en Vercel: `frontend`. Build: `npm run build`. Output: `dist/<proyecto>/browser`.

**App móvil** — `mobile/`
- **Flutter** (como VeriFarmac). Consume la misma API. Arquitectura: `lib/core/` (api client, config, almacenamiento seguro del token con `flutter_secure_storage`), `lib/data/` (modelos + repositorios), `lib/features/` (auth, registro, hijos, asistencia, pagos, avisos), estado con Provider o Riverpod (elige uno y justifícalo).
- Funciones v1 para padres: registro, login, ver hijos y su categoría/horario/sede, asistencia, estado de pagos, avisos.
- Distribución: se genera `flutter build apk --release` y se publica en **GitHub Releases** del repo; la web tiene la sección **"Descarga nuestra app"** con botón de descarga del APK, código QR, instrucciones para instalar en Android ("permitir orígenes desconocidos") y la versión actual (leída desde un endpoint `GET /app-release` que el admin actualiza). Dejar preparado el camino a Google Play (`flutter build appbundle`) para más adelante.

## 5. Secciones de la página web

Públicas (todas responsive):
1. Inicio / hero con video de presentación y botón "Inscribe a tu hijo".
2. Quiénes somos: historia, filosofía, valores.
3. Categorías (de 4 a 16 años) y metodología.
4. Horarios y sedes (con mapa o enlace a Google Maps).
5. Cuerpo técnico (perfiles de los entrenadores de la página actual).
6. Costos, pagos y uniformes.
7. Noticias / galería (administrables).
8. **Descarga la app móvil**.
9. Contacto + botón flotante de WhatsApp.
10. Login / Registro del padre.

Privadas:
- Panel del padre: mis datos, mis hijos, inscribir otro hijo, asistencia, pagos, avisos.
- Panel del profesor: mis categorías, lista de deportistas, tomar asistencia, avisos, observaciones.
- Panel del admin: dashboard con estadísticas, inscripciones pendientes, profesores, categorías, sedes, horarios, pagos, noticias, versión de la app.

## 6. Modelo de datos inicial (ajustar con los campos de AI Studio)

`users` (id, email único, password_hash, rol, es_admin, activo, creado_en) ·
`guardians` (perfil del padre: user_id, nombres, apellidos, documento, teléfono, dirección, parentesco, … campos de AI Studio) ·
`players` (deportista: guardian_id, nombres, apellidos, fecha_nacimiento, documento, EPS, colegio, jornada escolar, foto_url, estado de inscripción, … campos de AI Studio) ·
`coaches` (user_id, nombre, perfil, foto) · `venues` (sedes) · `categories` (nombre, año desde/hasta, coach_id) ·
`training_sessions` (categoría, sede, día, hora inicio/fin, jornada) · `attendance` (player, sesión, fecha, presente) ·
`payments` (player, concepto matrícula/mensualidad, mes, valor, método efectivo/Nequi, estado) ·
`announcements` (autor, categoría o general, texto, fecha) · `news` · `app_releases` (versión, url_apk, notas, fecha) ·
`data_consents` (guardian, versión del texto, fecha, aceptado).

Datos de salud (EPS, alergias, etc.) solo visibles para el padre, el profesor de esa categoría y los admins.

## 7. Calidad

- Código, nombres de variables, clases y comentarios **en inglés**; textos de la interfaz y mensajes de error **en español**.
- POO real: entidades, repositorios con interfaz, servicios inyectados, al menos dos patrones de diseño explicados en el README (por ejemplo Repository + Strategy para la categoría por edad).
- Validación en backend (Pydantic) **y** en frontend (Reactive Forms con mensajes claros).
- Pruebas: pytest para auth, roles, registro y aislamiento de datos entre padres; pruebas básicas en Angular.
- Secretos solo en `.env` (con `.env.example` en el repo); `.gitignore` correcto en las tres carpetas.
- README raíz con enlaces de producción, cuentas de prueba por rol, cómo correr local y cómo desplegar.
- Commits pequeños y descriptivos por fase.

## 8. Fases de trabajo (una a la vez, esperar mi confirmación entre fases)

0. Analizar `referencia-ai-studio/`, el repo de Horarios y la página actual del club; proponer el modelo de datos final con los campos del registro y esperar aprobación.
1. Estructura del monorepo (`backend/`, `frontend/`, `mobile/`, `README.md`, `.gitignore`).
2. Backend: modelos, auth JWT, registro de padre + hijos, roles y permisos, seed, pruebas.
3. Base de datos en Supabase + despliegue en Render (guíame paso a paso en los paneles).
4. Frontend: sitio público responsive.
5. Frontend: login/registro y paneles de padre, profesor y admin.
6. Despliegue en Vercel y conexión con Render (CORS, variables).
7. App Flutter para padres + APK en GitHub Releases + sección de descarga en la web.
8. (Opcional) Analítica: modelo de predicción de riesgo de deserción por deportista (asistencia, pagos al día, antigüedad) con scikit-learn, mostrado en el dashboard del admin.
9. Revisión final: pruebas, responsive, seguridad, README y guía para la sustentación.
