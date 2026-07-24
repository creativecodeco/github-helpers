# Architecture Decision Records — github-helpers

> **Mantenimiento**: Este archivo debe actualizarse en cada PR que cambie la arquitectura, rutas, variables de entorno, dependencias principales o comportamientos clave del frontend/backend. Los agentes de IA deben actualizar este documento con cada cambio significativo.

---

## Estado actual: 2026-07-24

### Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 24 |
| Backend | NestJS + Fastify + TypeScript | 11.1.28 / 5.10.0 / 6.0.3 |
| Frontend | Astro (SSG estático) | 5.18.2 |
| Base de datos | PostgreSQL + TypeORM | 8.x / 1.x |
| Package Manager | pnpm (monorepo) | 11 |
| Contenedor | Docker multi-stage, node:24-alpine | — |
| CSS | Vanilla CSS (global.css) | — |
| Tests | Vitest | 4.1.10 |

---

## Estructura del Proyecto

```
github-helpers/
├── backend/                      # Backend (NestJS + Fastify / TypeScript) — Clean Architecture
│   ├── src/
│   │   ├── adapters/
│   │   │   ├── presenters/       # SVG card renderers (stats, languages, repo, rank, streak, trophies, viewsBadge)
│   │   │   └── repositories/    # ApiGitHubRepository, CachedGitHubRepository, TypeORM repos
│   │   ├── domain/
│   │   │   ├── entities/         # UserStats, RepoStats, StreakStats, Metrics, Validation
│   │   │   └── repositories/    # IGitHubRepository, IMetricsRepository, ITokenRepository
│   │   ├── infrastructure/
│   │   │   ├── database/         # TypeORM DataSource + entity definitions
│   │   │   ├── logging/          # Logger estructurado y formateador
│   │   │   └── security/        # AES-256 token encryption, consent fingerprint, scope validation
│   │   ├── modules/              # NestJS Feature Modules & Controllers
│   │   │   ├── cards/            # CardsModule & CardsController (/api/stats, /api/languages, etc.)
│   │   │   ├── metrics/          # MetricsModule & MetricsController (/api/metrics, /api/config)
│   │   │   ├── root/             # RootController (GET / y /health con cabeceras de caché estáticas)
│   │   │   └── tokens/           # TokensModule & TokensController (/api/tokens, /api/users/purge)
│   │   ├── use-cases/            # Use cases puros (cards, history, metrics, tokens, users)
│   │   ├── app.module.ts         # NestJS Root Module
│   │   ├── main.ts               # NestJS Fastify Application bootstrap
│   │   └── server.ts             # Punto de entrada de inicio de servidor
├── frontend/                     # Astro 5 — sitio estático
│   ├── astro.config.mjs          # outDir: ../public, format: file, vite.ssr.noExternal: ['cookie']
│   └── src/
│       ├── layouts/BaseLayout.astro  # Google Analytics gtag, CSP-compatible meta tags
│       ├── components/               # CardPreview, ThemeToggle, PrivateTokenModal, Footer
│       ├── pages/                    # index.astro, help.astro, privacy.astro, sitemap.xml.ts
│       └── styles/global.css
├── tests/                        # Vitest unit tests (11 archivos, 51 tests pasados)
├── Dockerfile                    # Multi-stage: builder + runner (non-root node user)
├── pnpm-workspace.yaml           # Config monorepo + allowBuilds + minimumReleaseAgeExclude
└── .agents/
    ├── AGENTS.md                 # Reglas de seguridad y patrones para agentes de IA
    └── ARCHITECTURE.md           # Este archivo — ADR del proyecto
```

---

## Rutas API (NestJS Fastify Controllers)

| Método | Ruta | Handler | Autenticación |
|--------|------|---------|---------------|
| GET | `/api/stats` | `CardsController.getStats` | Pública, CORS `*` |
| GET | `/api/languages` | `CardsController.getLanguages` | Pública, CORS `*` |
| GET | `/api/repo` | `CardsController.getRepo` | Pública, CORS `*` |
| GET | `/api/rank` | `CardsController.getRank` | Pública, CORS `*` |
| GET | `/api/streak` | `CardsController.getStreak` | Pública |
| GET | `/api/trophies` | `CardsController.getTrophies` | Pública |
| GET | `/api/views` | `CardsController.getProfileViews` | Pública, `no-cache` |
| GET | `/api/top-repos` | `CardsController.getTopRepos` | Pública, CORS `*` |
| POST | `/api/tokens/register` | `TokensController.register` | Validado via DTO |
| DELETE | `/api/tokens/revoke` | `TokensController.revoke` | Validado via DTO |
| DELETE | `/api/users/purge` | `TokensController.purge` | Validado via DTO |
| GET | `/api/metrics` | `MetricsController.getMetrics` | `METRICS_KEY` requerida |
| GET | `/api/metrics/history` | `MetricsController.getRendersHistory` | `METRICS_KEY` requerida |
| GET | `/api/metrics/users` | `MetricsController.getUserMetrics` | `METRICS_KEY` requerida |
| GET | `/api/metrics/users/count` | `MetricsController.getUniqueUsersCount` | Pública |
| GET | `/health` | `RootController.getHealth` | Pública |
| GET | `/api/config` | `MetricsController.getConfig` | Pública |
| GET | `/` | `RootController.getRoot` | Servido dinámicamente con SEO sanitizado |

---

## Variables de Entorno

| Variable | Requerida | Propósito |
|---|---|---|
| `DATABASE_URL` | ✅ Sí | Cadena de conexión PostgreSQL |
| `ENCRYPTION_KEY` | ✅ Sí | 64 caracteres hex para AES-256 de tokens |
| `METRICS_KEY` | ✅ Sí | Clave secreta para endpoints de métricas (403 si no está) |
| `GITHUB_TOKEN` | No | PAT de GitHub para mayor rate limit en la API |
| `PRIVATE_STATS_COMING_SOON` | No | `'false'` para habilitar tokens privados |
| `PORT` | No | Puerto del servidor (default: `3000`) |

---

## Seguridad (OWASP)

- **Validación de inputs**: DTOs y expresiones regulares estrictas en parámetros de entrada (`ValidationPipe`)
  - Username: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  - Repo: `/^[a-z\d-_.]{1,100}$/i`
- **Fastify Helmet**: `@fastify/helmet` con `contentSecurityPolicy: false` para renderizado de SVG inline en etiquetas `<img>`.
- **METRICS_KEY**: obligatoria — retorna `403` si no está configurada.
- **Tokens**: AES-256-CBC cifrados en reposo, fingerprint de consentimiento con SHA-256.
- **Error responses en tarjetas**: siempre `Content-Type: image/svg+xml` (SVG `renderErrorCard`).
