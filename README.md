# Plataforma Club Atlético Sucre

Página web informativa + registro de padres de familia + paneles por rol (padre, profesor, admin)
+ app móvil para la escuela de fútbol **Club Atlético Sucre** — "Embajadores del Sur", Ipiales, Nariño.

> "Importa más el cómo se gana que el resultado."

## Producción

| Parte | URL |
|---|---|
| Web (Vercel) | https://proyecto-final-atletico-sucre.vercel.app |
| API (Render) | https://proyecto-final-atletico-sucre.onrender.com — documentación interactiva en [/docs](https://proyecto-final-atletico-sucre.onrender.com/docs), salud en [/health](https://proyecto-final-atletico-sucre.onrender.com/health) |
| Base de datos | PostgreSQL en Supabase (Session pooler, puerto 5432) con RLS activado en todas las tablas |
| APK Android | _pendiente (Fase 7)_ — GitHub Releases |

## Cuentas de prueba

**Solo existen en desarrollo** (`ENVIRONMENT=development`): `python seed.py` las crea en tu máquina.
En producción (Render) el seed no crea cuentas de prueba. Aquí no hay contraseñas: están solo en tu `.env`.

| Rol | Correo | Contraseña | Qué tiene |
|---|---|---|---|
| Profesor | `profesor@atleticosucre.test` | la de `SEED_PASSWORD` de tu `.env` | Categorías 2014-2015 y 2016-2017 |
| Padre 1 | `padre@atleticosucre.test` | la de `SEED_PASSWORD` de tu `.env` | 2 hijos: Mateo (2015, aprobado, inscripción pagada) y Sofía (2017, Femenino, pendiente) |
| Padre 2 | `padre2@atleticosucre.test` | la de `SEED_PASSWORD` de tu `.env` | 1 hijo: Samuel (2014, aprobado). Sirve para probar que un padre no ve los hijos de otro |

**Administradores (desarrollo y producción):** los correos de `ADMIN_EMAILS`. Su contraseña inicial es
`ADMIN_PASSWORD_INICIAL`, obligatoria en producción (si falta, el servidor no arranca). En desarrollo, si está
vacía, se usa la de `SEED_PASSWORD`. Se pide cambiarla en el primer ingreso.

## Estructura del monorepo

```
.
├── backend/    FastAPI + SQLAlchemy 2 + PostgreSQL (Supabase) → Render
├── frontend/   Angular 22 (standalone, signals) → Vercel
├── mobile/     Flutter (Riverpod) → APK en GitHub Releases
├── referencia-ai-studio/   diseño de referencia (no se despliega)
└── CLAUDE.md   contexto y reglas del proyecto
```

## Cómo correrlo en local

### Requisitos
- Python 3.14 (la misma versión de Render: `PYTHON_VERSION=3.14.7`)
- Node.js 20.19+ / 22+ y npm
- Flutter 3.x (solo para `mobile/`, desde la Fase 7)

### Backend (http://127.0.0.1:8000)

```bash
cd backend
py -3.14 -m venv .venv        # Linux / macOS: python3.14 -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

pip install -r requirements-dev.txt
cp .env.example .env          # y completa los valores (ADMIN_EMAILS, SEED_PASSWORD, SECRET_KEY)
python seed.py                # sedes, categorías, horarios, cuerpo técnico y cuentas de prueba
uvicorn main:app --reload --port 8000
pytest                        # pruebas (usan SQLite temporal, nunca Supabase)
```

- Salud: http://127.0.0.1:8000/health
- Documentación interactiva: http://127.0.0.1:8000/docs (botón **Authorize** → pega el `access_token`)

### Arquitectura del backend

```
backend/
├── main.py            app, CORS, manejo uniforme de errores {"detail": "..."}
├── config.py          todo desde variables de entorno
├── database.py        engine, sesión y Base (SQLAlchemy 2)
├── models.py          entidades (tablas en inglés)        enums.py  valores permitidos
├── schemas.py         Pydantic: validación y mensajes en español
├── security.py        bcrypt, JWT y dependencias por rol (require_parent / require_coach / require_admin)
├── dependencies.py    inyección de dependencias de los servicios
├── policies/          AccessPolicy: quién puede ver qué deportista
├── repositories/      acceso a datos (Repository)
├── services/          reglas de negocio (Service Layer, Strategy, Factory)
├── routers/           HTTP: public, auth, parent (/me), coach (/coach), admin (/admin), crud
├── seed.py            datos de ejemplo           migrations.py  columnas nuevas sin borrar datos
└── tests/             pytest
```

### Frontend (http://localhost:4200)

```bash
cd frontend
npm install
npm start          # ng serve, usa environment.development.ts → API local
npm test           # pruebas (Vitest)
npm run build      # salida en dist/atletico-sucre-web/browser
```

## Despliegue

### Backend en Render
- Blueprint: `backend/render.yaml` (`rootDir: backend`, `healthCheckPath: /health`).
- Variables secretas que se ingresan en el panel: `DATABASE_URL` (**Session pooler** de Supabase, puerto 5432), `ADMIN_EMAILS`,
  `ADMIN_PASSWORD_INICIAL`, `FRONTEND_ORIGIN`, `BREVO_API_KEY`, `EMAIL_FROM`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
- El plan gratis se duerme tras 15 minutos sin uso; la primera visita tarda unos 50 s y la web muestra
  "Conectando con el servidor…" mientras despierta. Antes de una demostración, abre la página un minuto antes.
- Datos iniciales en producción: `python seed.py` desde tu PC con `ENVIRONMENT=production` y la `DATABASE_URL`
  del Session pooler (no crea cuentas de prueba).

### Frontend en Vercel
- Proyecto: https://proyecto-final-atletico-sucre.vercel.app
- Se importa como **proyecto único** (no "Services"): Root Directory `frontend`, Framework Preset **Other**.
  `frontend/vercel.json` define install (`npm ci`), build (`npm run build`), output
  (`dist/atletico-sucre-web/browser`), el rewrite de todas las rutas a `index.html` (SPA: `/padre`, `/admin`… no dan 404
  al recargar), caché larga para JS/CSS con hash y encabezados de seguridad. Node `22.x` (en `package.json`).
- Cada push a `main` despliega solo. La URL de producción va en `FRONTEND_ORIGIN` de Render (sin `/` al final);
  las URL de vista previa de Vercel no están autorizadas por CORS.

## Patrones de diseño

| Patrón | Dónde | Para qué |
|---|---|---|
| **Repository** | `backend/repositories/` (`AbstractRepository` → `SqlAlchemyRepository` → uno por entidad) | Los servicios no escriben consultas SQL; se pueden probar y cambiar la base sin tocarlos |
| **Service Layer** | `backend/services/` | Las reglas (inscripción, pagos, asistencia) viven en un solo lugar; los routers solo traducen HTTP |
| **Dependency Injection** | `backend/dependencies.py` con `Depends(...)` | Cada servicio recibe su sesión, estrategia, correo y almacenamiento; en pruebas se reemplazan con `dependency_overrides` |
| **Strategy** | `services/category_strategy.py` (`BirthYearRangeStrategy`, `AgeAtCutoffStrategy`) y `services/payment_status.py` (`MonthlyDueDayPolicy`) | La regla para asignar la categoría y la regla de "al día" se cambian agregando una clase, sin tocar los servicios |
| **Factory** | `get_mailer()` (consola / memoria / Brevo), `get_storage()` (local / Supabase), `PlayerFactory`, `crud_router()` | Crear el objeto correcto según la configuración, y generar los CRUD de catálogos con un solo molde |
| **Policy** | `policies/ownership.py` (`AccessPolicy`) | Verifica en **cada** endpoint que el deportista pertenezca al padre (o a las categorías del profesor). Si no, responde 404 |
| **Unit of Work** (transacción) | `AuthService.register_parent` | El acudiente, sus hijos y las autorizaciones se guardan completos o no se guarda nada |

## Datos personales

El registro incluye la autorización de tratamiento de datos personales (Ley 1581 de 2012), obligatoria,
y la de uso de imagen, opcional. Cada aceptación queda guardada con la versión del texto, la fecha y la IP (`data_consents`).
Los datos de un deportista (incluida su salud) solo los ven su acudiente, el profesor de su categoría y los
administradores. Las fotos y los comprobantes son privados: se entregan solo después de verificar quién los pide.
