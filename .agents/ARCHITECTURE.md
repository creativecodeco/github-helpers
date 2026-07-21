# Architecture Decision Records — github-helpers

> **Mantenimiento**: Este archivo debe actualizarse en cada PR que cambie la arquitectura, rutas, variables de entorno, dependencias principales o comportamientos clave del frontend/backend. Los agentes de IA deben actualizar este documento con cada cambio significativo.

---

## Estado actual: 2026-07-21

### Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 24 |
| Backend | Express + TypeScript | 5.2.1 / 6.0.3 |
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
├── src/                          # Backend (Express/TypeScript) — Clean Architecture
│   ├── adapters/
│   │   ├── controllers/          # CardController, MetricsController, TokenController
│   │   ├── presenters/           # SVG card renderers (stats, languages, repo, rank, streak, trophies, viewsBadge)
│   │   └── repositories/        # ApiGitHubRepository, CachedGitHubRepository, TypeORM repos
│   ├── domain/
│   │   ├── entities/             # UserStats, RepoStats, StreakStats, Metrics, Validation
│   │   └── repositories/        # IGitHubRepository, IMetricsRepository, ITokenRepository
│   ├── infrastructure/
│   │   ├── database/             # TypeORM DataSource + entity definitions
│   │   ├── express/server.ts     # App Express con Helmet, CORS, rate limiting, rutas
│   │   └── security/security.ts # AES-256 token encryption, consent fingerprint, scope validation
│   └── use-cases/
│       ├── cards/                # GetUserStats/Languages/Repo/Rank/Streak/Trophies CardUseCase
│       ├── history/              # SaveUserStatsHistoryUseCase
│       ├── metrics/              # RecordProfileViewUseCase
│       ├── tokens/               # RegisterUserToken, RevokeUserToken UseCases
│       └── users/                # PurgeUserDataUseCase
├── frontend/                     # Astro 5 — sitio estático
│   ├── astro.config.mjs          # outDir: ../public, format: file, vite.ssr.noExternal: ['cookie']
│   └── src/
│       ├── layouts/BaseLayout.astro  # Google Analytics gtag, CSP-compatible meta tags
│       ├── components/               # CardPreview, ThemeToggle, PrivateTokenModal, Footer
│       ├── pages/                    # index.astro, help.astro, privacy.astro, sitemap.xml.ts
│       └── styles/global.css
├── tests/                        # Vitest unit tests (7 archivos, 27 tests)
├── Dockerfile                    # Multi-stage: builder + runner (non-root node user)
├── pnpm-workspace.yaml           # Config monorepo + allowBuilds + minimumReleaseAgeExclude
└── .agents/
    ├── AGENTS.md                 # Reglas de seguridad y patrones para agentes de IA
    └── ARCHITECTURE.md           # Este archivo — ADR del proyecto
```

---

## Rutas API (server.ts)

| Método | Ruta | Handler | Autenticación |
|--------|------|---------|---------------|
| GET | `/api/stats` | `CardController.getStats` | Pública, CORS `*` |
| GET | `/api/languages` | `CardController.getLanguages` | Pública, CORS `*` |
| GET | `/api/repo` | `CardController.getRepo` | Pública, CORS `*` |
| GET | `/api/rank` | `CardController.getRank` | Pública, CORS `*` |
| GET | `/api/cards/streak` | `CardController.getStreak` | Pública |
| GET | `/api/cards/trophies` | `CardController.getTrophies` | Pública |
| GET | `/api/views` | `CardController.getProfileViews` | Pública, `no-cache` |
| POST | `/api/tokens/register` | `TokenController.register` | Rate limited |
| DELETE | `/api/tokens/revoke` | `TokenController.revoke` | Rate limited |
| DELETE | `/api/users/purge` | `TokenController.purge` | Rate limited |
| GET | `/api/metrics` | `MetricsController.getMetrics` | `METRICS_KEY` requerida |
| GET | `/api/metrics/users` | `MetricsController.getUserMetrics` | `METRICS_KEY` requerida |
| GET | `/api/metrics/users/count` | `MetricsController.getUniqueUsersCount` | Pública |
| GET | `/health` | inline | Pública |
| GET | `/api/config` | inline | Pública |

> **Fallback SPA**: regex `/^\/(?!api|_astro|.*\.(?:css|js|...)$).*$/` → `public/index.html`

---

## Variables de Entorno

| Variable | Requerida | Propósito |
|---|---|---|
| `DATABASE_URL` | ✅ Sí | Cadena de conexión PostgreSQL |
| `ENCRYPTION_KEY` | ✅ Sí | 64 caracteres hex para AES-256 de tokens |
| `METRICS_KEY` | ✅ Sí | Clave secreta para endpoints de métricas (403 si no está) |
| `GITHUB_TOKEN` | No | PAT de GitHub para mayor rate limit en la API |
| `PRIVATE_STATS_COMING_SOON` | No | `'false'` para habilitar tokens privados |
| `TRUST_PROXY` | No | Config del proxy de Express (default: `'1'`) |
| `PORT` | No | Puerto del servidor (default: `3000`) |

---

## Seguridad (OWASP)

- **Validación de inputs**: regex estricto en TODOS los parámetros de entrada
  - Username: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  - Repo: `/^[a-z\d-_.]{1,100}$/i`
- **Helmet CSP**: permite Cloudflare Insights, Google Tag Manager (img + script), Google Fonts, Google Analytics, DoubleClick
- **METRICS_KEY**: obligatoria — retorna `403` si no está configurada
- **Rate Limiting**: 100 req/15min en `/api/`, con SVG error card como respuesta en endpoints de tarjetas
- **Tokens**: AES-256-CBC cifrados en reposo, fingerprint de consentimiento con SHA-256
- **Error responses en tarjetas**: siempre `Content-Type: image/svg+xml` (SVG `renderErrorCard`)

---

## Comportamientos Clave del Frontend (index.astro)

### Orden de tarjetas
1. 👁️ **Contador de Visitas** (Profile Views) — siempre primero
2. 📊 Estadísticas Generales
3. 🥧 Lenguajes Más Usados
4. 📁 Repositorio Destacado
5. 🏅 Rango de Desarrollador
6. 🔥 Racha de Contribuciones
7. 🏆 Trofeos de GitHub

### Auto-sort post-generación
- Después de que las 7 tarjetas terminan de cargar (éxito o error), `sortCardsByStatus()` reordena el DOM
- **Detección de error**: placeholder con `svg.error` en la clase
- **Resultado**: tarjetas exitosas primero, errores al final

### Temas disponibles
`dark` | `light` | `blue` | `glassmorphism` | `solarized` | `radical` | `tokyonight`

### Feature flags
- **Private Token Modal**: controlado por `PRIVATE_STATS_COMING_SOON !== 'false'`
- **Live Metrics Badge**: carga desde `/api/metrics/users/count`

---

## Dockerfile (multi-stage)

```dockerfile
# Stage 1: builder — compila frontend (Astro) + backend (tsc + tsc-alias)
FROM node:24-alpine AS builder
# ... instala pnpm, copia todo, ejecuta pnpm run build

# Stage 2: runner — solo deps de producción
FROM node:24-alpine AS runner
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
USER node  # non-root
HEALTHCHECK ... wget /health
```

---

## Notas de Dependencias

### Astro 7.x — BUG CONOCIDO (no actualizar aún)
Astro 7.1.3 tiene un bug con `cookie@2.x` (ESM/CJS interop en Node 24): `parseCookie` no se puede importar como named export desde `default-prerenderer.js`. Seguimiento en [GitHub Issue #15847](https://github.com/withastro/astro/issues/15847).

**Decisión**: Mantener `astro@5.18.2` hasta que el bug esté corregido en una versión 7.x posterior.

### cookie
- `astro@5.x` usa `cookie@0.x` (CJS)
- `astro@7.x` requiere `cookie@2.x` (ESM) — conflicto con Node 24 resuelve como CJS
- El campo `vite.ssr.noExternal: ['cookie']` en `astro.config.mjs` es un workaround preparatorio para cuando se actualice a Astro 7.x

---

## Suite de Tests

| Archivo | Cobertura |
|---|---|
| `tests/metrics.test.ts` | TypeORM metrics recording, unique user count |
| `tests/viewsBadge.test.ts` | Profile views badge rendering |
| `tests/purge.test.ts` | GDPR user data purge |
| `tests/history.test.ts` | Stats history tracking |
| `tests/renderer.test.ts` | SVG card rendering |
| `tests/github.test.ts` | GitHub API integration |
| `tests/security.test.ts` | Token encryption, scope validation, consent fingerprint |

Comando: `pnpm test` (27 tests, todos pasan ✅)

---

## Release & Versionado

- **Herramienta**: `release-it` + `@release-it/conventional-changelog`
- **Comando**: `pnpm release` desde la rama `main`
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Archivos a sincronizar en cada release**: `README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`

---

## Tracking Git

- `.agents/skills/` — **NO trackeado** (gitignored) — skills son locales únicamente
