# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.4.0] - 2026-07-24

### 🚀 Nuevas Funcionalidades
- **Integración con GitHub GraphQL API v4 (`https://api.github.com/graphql`)**:
  - Migración de consultas de datos de usuarios, lenguajes, repositorios top y rachas de contribución a la API v4 de GraphQL en una sola petición POST.
  - Uso automático del `GITHUB_TOKEN` del servidor para todas las peticiones globales y del PAT (`userToken`) del usuario registrado cuando está disponible.
  - Soporte completo para métricas de organizaciones privadas (`ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]`) y contribuciones privadas (`restrictedContributionsCount`).
- **README.md de Ejemplo Dinámico**:
  - Se implementó un panel reactivo en `index.astro` que genera una plantilla Markdown completa y lista para copiar con el saludo al usuario y la colección de tarjetas que se renderizaron exitosamente.
  - Botón de copiado con retroalimentación vía Toast notification y soporte multilingüe completo (español e inglés).
- **Reorganización de la Sección de Ayuda en Sub-páginas**:
  - Reestructuración completa del Centro de Ayuda desde un archivo único en 4 sub-páginas dedicadas:
    - `/help/github-profile`: Guía paso a paso para crear el perfil especial en GitHub.
    - `/help/tokens`: Creación y permisos de solo lectura para Personal Access Tokens (PAT).
    - `/help/security`: Explicación del cifrado AES-256-GCM y protección de datos.
    - `/help/revocation`: Proceso de revocación de tokens y eliminación definitiva (GDPR).
  - Hub principal `/help` con tarjetas de categoría navegables y redirección inteligente de hashes (`#github-profile` -> `/help/github-profile`).

### 📝 Sistema de Logging Estructurado & Observabilidad
- **Módulo Centralizado de Logging (`backend/src/infrastructure/logging/logger.ts`)**:
  - Implementación de un logger estructurado en formato JSON para producción y formateado en desarrollo.
  - Enmascaramiento y redactado automático de tokens, secretos y credenciales en metadatos (`[REDACTED]`).
  - Middleware de Express `requestLoggerMiddleware` para trazabilidad de peticiones HTTP en `/api/*` y `/health` (método, ruta, status, tiempo de respuesta en ms y user-agent).
  - Migración completa de todas las invocaciones `console.log`, `console.warn` y `console.error` del backend hacia el logger centralizado.

### 🌐 Arquitectura i18n & Refactorización del Frontend
- **Módulo Centralizado de Internacionalización (`src/utils/i18n.ts`)**:
  - Implementación de un diccionario fuertemente tipado en TypeScript para `'es'` y `'en'` que abarca interfaz, mensajes de estado, toasts de notificación, errores de red, modales y encabezados del README live.
  - Función auxiliar `t(key, locale, params?)` que reemplaza todas las comparaciones ternarias estáticas dispersas (`currentLocale === 'en' ? ... : ...`) y soporta interpolación de parámetros dinámicos (ej. `{username}`).
  - Función `updateDomTranslations(locale)` para actualizar automáticamente los atributos `[data-i18n]` y `[data-i18n-placeholder]` en el DOM.
- **Limpieza de Código y Tipos**:
  - Eliminación de la variable no utilizada `currentReadmeTab` y de la copia local del objeto `TRANSLATIONS` en `index.astro`.
  - Corrección de la configuración de TypeScript en `frontend/tsconfig.json` removiendo la opción obsoleta `"baseUrl": "."`.

### 🧪 Pruebas Unitarias
- **Suite para `i18n` Frontend**: Creado `frontend/tests/i18nFrontend.test.ts` para verificar la paridad de claves entre idiomas, interpolación de variables y comportamientos de fallback.
- **Suite para `readmeGenerator`**: Creado `frontend/tests/sampleReadme.test.ts` para verificar la generación correcta de plantillas Markdown bilingües y la integración con las tarjetas activas.

### 🛠️ Entorno y Gestor de Paquetes
- **Actualización de pnpm**: Actualizado el gestor de paquetes a `pnpm@11.17.0` en el `Dockerfile` (etapas builder y runner) y en la configuración de `packageManager` de `package.json`.

## [1.3.0] - 2026-07-22

### 🔒 Seguridad y Correcciones SonarCloud
- **Resolución de Vulnerabilidades**:
  - Se añadieron cabeceras seguras `rel="noopener noreferrer"` en todos los enlaces del frontend con `target="_blank"`.
  - Se configuró la descarga segura de `pnpm@11.15.1` y se añadió el flag `--ignore-scripts` en las etapas del Dockerfile para mitigar riesgos en dependencias de ciclo de vida.
- **Reducción de Complejidad Cognitiva**:
  - Refactorizado `ApiGitHubRepository` desglosando la complejidad de las consultas y formateo de datos en múltiples métodos auxiliares privados.
  - Refactorizado `SaveUserStatsHistoryUseCase` extrayendo las sub-rutinas en métodos privados `updateEntry` y `createEntry` de baja complejidad.
  - Simplificación del código de `trophiesCard` abstrayendo la correspondencia de rangos en un helper específico.
- **Optimización de Estructuras y Desempeño**:
  - Reemplazados los operadores ternarios anidados de `ApiGitHubRepository` y `streakCard` por sentencias condicionales explícitas.
  - Reemplazado el uso ineficiente de `.replace` encadenado con expresiones regulares por `.replaceAll()` en `topReposCard`.
  - Conversión del arreglo de ámbitos sensibles `dangerousScopes` en `security.ts` a un `Set` para búsquedas en tiempo O(1) con `.has()`.
  - Marcados los mapas de caché privada en `CachedGitHubRepository` como de solo lectura (`readonly`).
  - Removido el constructor inútil en `TypeORMMetricsRepository`.
  - Reemplazados los parseadores nativos globales (`parseInt` y `parseFloat`) por sus métodos estáticos de `Number` correspondientes para consistencia de tipos.

### 🎨 Accesibilidad (WCAG AA)
- **Contraste de Color en global.css**:
  - Ajustados los botones y estados (`.primary-btn`, `.danger-btn`, `.copy-btn.copied`) con colores WCAG AA complacientes (> 4.5:1 de ratio).
  - Eliminado el uso de fondos semitransparentes `rgba` en el botón de light-mode, reemplazándolo por color sólido para garantizar relaciones de contraste superiores a 9.4:1 de forma estática.

### 🧪 Pruebas Unitarias
- **Migración a Aserciones Semánticas**:
  - Se reemplazaron todas las aserciones de longitud basadas en `.length` con `.toBe()` por la aserción semántica dedicada `.toHaveLength()` en las suites de pruebas unitarias (`history`, `purge`, `security`, `github`).
  - Reemplazada la aserción estática obvia `expect(1+1).toBe(2)` en `sample.test.ts` por una validación dinámica.

## [1.2.2] - 2026-07-21

### 🚀 Nuevas Funcionalidades
- **Sincronización de Parámetros en URL**: Se añadió lógica para leer y escribir los parámetros `user` y `theme` directamente desde la barra de direcciones del navegador en caliente (utilizando `window.history.pushState`). Esto mantiene una URL única, limpia y fácilmente compartible por usuario con su configuración seleccionada.
- **Soporte de Búsqueda Dinámica por Parámetro de URL**: El backend de Express en `/` intercepta las solicitudes para parsear tanto `user` como `username` de la consulta y generar las meta-etiquetas de redes sociales en concordancia.
- **Internacionalización Completa (UI i18n & SVG locale)**: 
  - Se añadieron diccionarios de traducción en español (`es`) e inglés (`en`) en backend para las 5 tarjetas SVG.
  - Se implementó un selector de idioma en el panel del frontend que sincroniza con la query de URL `?locale=en|es` y actualiza reactivamente el idioma de la página completa (`index.astro`, modal de tokens privados, modal de purga GDPR y mensajes Toast en caliente) sin recargas.
- **Panel de Administración de Métricas (`/admin/metrics`)**:
  - Interfaz web segura con vista de analíticas de uso global en tiempo real (KPIs de hits, gráfico Doughnut de distribución de tarjetas, gráfico Stacked Bar para tráfico de GitHub Camo vs Web Directa y tabla de usuarios).
  - **Gráfico de Historial Temporal (Line Chart)**: Endpoint `/api/metrics/history` y gráfico interactivo Chart.js para visualizar hits de renders diarios en el panel.
  - **Auto-Refresco y Polling**: Checkbox de refresco automático cada 30 segundos y botón manual de actualización rápida con spinner animado.
  - **Búsqueda y Paginación**: Tabla de perfiles con entrada de filtro en tiempo real y paginación de 10 elementos por página.

### 🎨 Frontend / UX
- **Notificaciones Toasts Premium**: Implementado un sistema de toasts flotantes animados en la esquina inferior derecha con curvas de rebote sutiles (`cubic-bezier`), barra de progreso de autodescarte e íconos dinámicos en reemplazo de los textos en línea de copiado.

### 🔒 Seguridad
- **Políticas CSP Flexibles**: Se añadió el dominio de entrega de contenido seguro `https://cdn.jsdelivr.net` a la directiva `scriptSrc` en la configuración de Helmet para permitir la carga segura de la librería Chart.js en el dashboard.

### 🧪 Pruebas
- **Pruebas End-to-End (E2E) con Playwright**: Incorporados 12 casos de prueba integrales para verificar interacciones (incluyendo cambio de idioma en caliente, traducción de placeholders y textos de UI, búsqueda y paginación de perfiles en el dashboard, sincronización de la URL y el flujo de gráficos con mocks herméticos robustos).- **Pruebas Unitarias de Traducción**: Creado `backend/tests/i18n.test.ts` con 6 tests unitarios en Vitest para validar la correcta sustitución de cadenas de idioma en todas las tarjetas de acuerdo con el parámetro `locale`.
- **Aislamiento en Vitest**: Excluidas las especificaciones de Playwright en la suite de pruebas unitarias en `vitest.config.ts`.

## [1.2.1] - 2026-07-21

### 🚀 Nuevas Funcionalidades
- **Tarjeta de Top Repositorios** (`/api/top-repos`): Nuevo endpoint SVG que muestra los 4 repositorios más destacados del usuario (por estrellas), con nombre, descripción, lenguaje con color, conteo de estrellas y forks. Soporta todos los temas y ancho personalizado.
- **5 Nuevos Temas Premium**: Se añadieron `catppuccin_mocha`, `nord`, `cyberpunk`, `gruvbox` y `synthwave` al sistema de temas en `theme.ts`.
- **Aliases de Color Comunitarios**: El controlador de tarjetas acepta ahora los alias estándar de la comunidad `title_color`, `bg_color`, `icon_color`, `border_color`, `text_color`, `secondary_color` y `bg_gradient`.
- **Personalización del Ancho de Tarjeta**: Todos los presentadores SVG soportan el parámetro `card_width` (e.g. `card_width=100%`, `card_width=600`, `full_width=true`). La coordenada `viewBox` se mantiene fija para preservar el layout interno.

### 🎨 Frontend
- **Nuevos botones de tema** en el panel de configuración (Catppuccin, Nord, Cyberpunk, Gruvbox, Synthwave).
- **Control de Ancho de Tarjeta**: Botones "Estándar (495px)" y "Ancho Completo (100%)" + campo de ancho personalizado con botón "Aplicar". El parámetro `card_width` se inyecta en todas las URLs generadas.
- **Vista previa de Top Repositorios**: Nueva tarjeta de previsualización con generador de código Markdown.

### 🧪 Pruebas
- **10 nuevas pruebas unitarias** en `topReposCard.test.ts`: validación de estructura SVG, aplicación de temas, formato K-suffix de conteos, soporte de ancho 100% y personalizado, truncado de descripciones, y los 5 nuevos temas.

## [1.2.0] - 2026-07-21

### 🏗️ Arquitectura y Estructura (Monorepo)
- **Separación de Backend en Carpeta Dedicada**: Reestructuración completa del monorepo moviendo el código fuente del backend (`src/`) y las pruebas (`tests/`) al subdirectorio dedicado `backend/` para evitar la mezcla de configuraciones en la raíz del proyecto.
- **Configuración de pnpm workspaces**: Ajustado el archivo [pnpm-workspace.yaml](file:///Users/joaltoroc/Code/creativecodeco/github-helpers/pnpm-workspace.yaml) para registrar de forma separada los paquetes `"backend"` y `"frontend"`.
- **Simplificación del package.json Raíz**: Rediseñado el package.json de la raíz del monorepo para servir únicamente como orquestador de dependencias compartidas y comandos globales (`build`, `dev`, `test`, `lint`, `format`).

### 📦 Gestión de Dependencias
- **Eliminación de release-it**: Se removió por completo la suite de automatización `release-it` y `@release-it/conventional-changelog` del proyecto, delegando la gestión de versiones directamente a los agentes de IA mediante directrices explícitas en `AGENTS.md`.
- **Fijación de Versiones de Dependencias**: Se eliminaron los caracteres de rango `^` y `~` de todas las dependencias en los tres archivos `package.json` del monorepo para asegurar la consistencia absoluta de versiones probadas localmente. Se documentó esta regla en `AGENTS.md`.

### ⚙️ Herramientas de Desarrollo y Calidad (TypeScript / Linters / Pruebas)
- **Soporte Nativo de TypeScript en Frontend**: Creado el archivo de compilación [frontend/tsconfig.json](file:///Users/joaltoroc/Code/creativecodeco/github-helpers/frontend/tsconfig.json) heredando de `astro/tsconfigs/strict`.
- **Migración a ESLint Flat Config (ESM)**: Creado [eslint.config.mjs](file:///Users/joaltoroc/Code/creativecodeco/github-helpers/eslint.config.mjs) con soporte ESM completo para integrar de manera nativa TypeScript y componentes Astro (`eslint-plugin-astro` v3 y `astro-eslint-parser` v3) con cero errores y cero advertencias.
- **Entorno de Pruebas Unitarias**: Configurada la suite de pruebas unitarias con Vitest y `happy-dom` en el frontend ([frontend/vitest.config.ts](file:///Users/joaltoroc/Code/creativecodeco/github-helpers/frontend/vitest.config.ts)) junto a un script unificado de ejecución paralela (`pnpm -r test`).

## [1.1.1] - 2026-07-21

### 🏗️ Base de Datos
- **Migración a PostgreSQL con TypeORM**: Reemplazo completo de la base de datos SQLite y su controlador de bajo nivel `sqlite3` por una arquitectura basada en TypeORM con PostgreSQL para mejorar la seguridad (prevención de inyección SQL), concurrencia y flexibilidad de despliegue.
- **Entidades de Dominio e Infraestructura**: Mapeo completo de las tablas `global_metrics`, `user_metrics`, `request_log` y `user_tokens` mediante decoradores TypeORM.

### 🐳 Docker & Despliegue
- **Simplificación del Contenedor**: Eliminación del entrypoint script `docker-entrypoint.sh` y la dependencia de volumen persistente local. El contenedor ahora se inicia directamente con el usuario no privilegiado `node`.

### 🔒 Seguridad
- **Políticas de Secretos**: Modificación de las directrices en `AGENTS.md` prohibiendo la lectura/escritura del archivo `.env` por parte de agentes de IA para salvaguardar secretos locales de producción.

### 📡 Rutas de la API (Corrección)
- **Corrección de Error 404**: Solucionado el error 404 en las tarjetas de racha (`/api/streak`) y trofeos (`/api/trophies`) corrigiendo su registro en el servidor de Express.

### 🎨 Frontend / UX
- **Configuración del Contador de Visitas**: Reubicación de las opciones de configuración del contador de visitas del perfil dentro de su propia tarjeta de vista previa.
- **Optimización de Foco**: Implementación de actualización en tiempo real que mantiene el foco del teclado al escribir, previniendo reinicios molestos del DOM.

## [1.1.0] - 2026-07-17

### ✨ Características

- **Repositorios Privados**: Actualización del endpoint de la API and del widget SVG para permitir la visualización de métricas de repositorios privados mediante la inclusión del parámetro `private` y la configuración de un token de acceso en el archivo `.env`.
- **Refactor a Clean Architecture**: Reestructuración completa del código fuente para implementar principios de Clean Architecture.

## [1.0.0] - 2026-07-16

### ✨ Características

- **Gestión de Versiones**: Integración de `release-it` y `@release-it/conventional-changelog` para automatizar futuros lanzamientos y el mantenimiento del historial de cambios de forma semántica.
- **Configuración del Agente**: Adición de directrices de codificación para asistentes de IA en [.agents/AGENTS.md](./.agents/AGENTS.md).

### 🔒 Seguridad (Alineación OWASP)

- **Protección contra Abuso (Rate Limiting)**: Implementación de `express-rate-limit` con un límite de 100 peticiones por cada 15 minutos. En caso de superarse el límite, responde de manera compatible con un SVG en los endpoints de las tarjetas y con JSON en la API de métricas.
- **Cabeceras Seguras**: Integración de `helmet` configurado con políticas de origen cruzado para admitir la incrustación segura de tarjetas en READMEs externos.
- **Validación Estricta de Parámetros**: Validación por expresiones regulares en parámetros `username` y `repo` de la API para prevenir vulnerabilidades de SSRF y inyecciones de rutas.
- **Seguridad por Defecto (Access Control)**: Restricción automática de acceso en `/api/metrics` con error `403` si la variable `METRICS_KEY` no se encuentra configurada en el entorno.

### 🐳 Docker & Despliegue

- **Mitigación de Fuga de Datos**: Corrección en las instrucciones `COPY` del [Dockerfile](./Dockerfile) sustituyendo los patrones glob con comodines (`*`) por nombres de archivo explícitos (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).
- **Documentación de Persistencia**: Actualización de [README.md](./README.md) con las instrucciones para montar un volumen persistente en `/usr/src/app/data` y evitar la pérdida de la base de datos de métricas SQLite al recrear contenedores en Docker o Coolify.

---

**Versión actualmente expuesta / en producción:** v1.4.0
