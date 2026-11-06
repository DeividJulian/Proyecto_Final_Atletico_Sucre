# Plataforma Club Atlético Sucre

Página web informativa + registro de padres de familia + paneles por rol (padre, profesor, admin)
+ app móvil para la escuela de fútbol **Club Atlético Sucre** — "Embajadores del Sur", Ipiales, Nariño.

> "Importa más el cómo se gana que el resultado."

## Producción

| Parte | URL |
|---|---|
| Web (Vercel) | _pendiente (Fase 6)_ |
| API (Render) | _pendiente (Fase 3)_ — documentación en `/docs` |
| APK Android | _pendiente (Fase 7)_ — GitHub Releases |

## Cuentas de prueba

_Se publican al terminar la Fase 2 (seed)._

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | — | — |
| Profesor | — | — |
| Padre | — | — |

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
- Python 3.12 o superior
- Node.js 20.19+ / 22+ y npm
- Flutter 3.x (solo para `mobile/`, desde la Fase 7)

### Backend (http://127.0.0.1:8000)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

pip install -r requirements-dev.txt
cp .env.example .env          # y completa los valores
uvicorn main:app --reload --port 8000
pytest                        # pruebas
```

- Salud: http://127.0.0.1:8000/health
- Documentación: http://127.0.0.1:8000/docs

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
- Variables secretas que se ingresan en el panel: `DATABASE_URL` (pooler de Supabase), `ADMIN_EMAILS`,
  `ADMIN_PASSWORD_INICIAL`, `FRONTEND_ORIGIN`, `BREVO_API_KEY`, `EMAIL_FROM`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
- El plan gratis se duerme: la web muestra "Conectando con el servidor…" mientras despierta.

### Frontend en Vercel
- Root directory: `frontend` · Build: `npm run build` · Output: `dist/atletico-sucre-web/browser`.
- `frontend/vercel.json` reescribe todas las rutas a `index.html` (SPA).

## Patrones de diseño

Se documentan en detalle al terminar la Fase 2: Repository, Service Layer, Dependency Injection,
Strategy (categoría por año de nacimiento y estado de pago), Factory (correo y almacenamiento)
y Policy (propiedad de los datos de cada deportista).

## Datos personales

El registro incluye la autorización de tratamiento de datos personales (Ley 1581 de 2012).
Los datos de un deportista solo los ven su acudiente, el profesor de su categoría y los administradores.
