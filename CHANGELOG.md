# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.2.2] - 2026-07-21

### 🚀 Nuevas Funcionalidades
- **Sincronización de Parámetros en URL**: Se añadió lógica para leer y escribir los parámetros `user` y `theme` directamente desde la barra de direcciones del navegador en caliente (utilizando `window.history.pushState`). Esto mantiene una URL única, limpia y fácilmente compartible por usuario con su configuración seleccionada.
- **Soporte de Búsqueda Dinámica por Parámetro de URL**: El backend de Express en `/` intercepta las solicitudes para parsear tanto `user` como `username` de la consulta y generar las meta-etiquetas de redes sociales en concordancia.
- **Internacionalización de las Tarjetas (i18n)**: Se añadieron diccionarios de traducción en español (`es`) e inglés (`en`) en backend para las 5 tarjetas SVG, adaptando dinámicamente títulos, etiquetas y rangos. Se implementó un selector de idioma ("Idioma de Tarjetas") en el panel del frontend que sincroniza con la query de URL `?locale=en|es` y actualiza las imágenes y códigos markdown.
- **Panel de Administración de Métricas (`/admin/metrics`)**: Interfaz web segura con vista de analíticas de uso global en tiempo real (KPIs de hits, gráfico Doughnut de distribución de tarjetas, gráfico Stacked Bar para tráfico de GitHub Camo vs Web Directa y tabla de usuarios más activos con fecha de última actualización).

### 🎨 Frontend / UX
- **Notificaciones Toasts Premium**: Implementado un sistema de toasts flotantes animados en la esquina inferior derecha con curvas de rebote sutiles (`cubic-bezier`), barra de progreso de autodescarte e íconos dinámicos en reemplazo de los textos en línea de copiado.

### 🔒 Seguridad
- **Políticas CSP Flexibles**: Se añadió el dominio de entrega de contenido seguro `https://cdn.jsdelivr.net` a la directiva `scriptSrc` en la configuración de Helmet para permitir la carga segura de la librería Chart.js en el dashboard.

### 🧪 Pruebas
- **Pruebas End-to-End (E2E) con Playwright**: Incorporados 10 casos de prueba integrales para verificar interacciones (incluyendo cambio de idioma, sincronización de la URL, y el flujo completo de autenticación y carga de gráficos del panel de administración con mocks herméticos robustos).
- **Pruebas Unitarias de Traducción**: Creado `backend/tests/i18n.test.ts` con 6 tests unitarios en Vitest para validar la correcta sustitución de cadenas de idioma en todas las tarjetas de acuerdo con el parámetro `locale`.
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

**Versión actualmente expuesta / en producción:** v1.2.2
