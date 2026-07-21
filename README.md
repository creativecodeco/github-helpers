# GitHub Helpers - Stats Generator & Live API

Este proyecto es un microservicio y cliente web desarrollado en **Node.js con TypeScript** que permite consultar las estadísticas y los lenguajes de programación más utilizados por cualquier usuario de GitHub en tiempo real, devolviendo imágenes en formato **SVG** listas para ser incrustadas directamente en el archivo `README.md` de tus proyectos.

Desarrollado y mantenido por **[CreativeCode.com.co](https://creativecode.com.co)**.

---

## ⚡ Características Principales

1. **Clean Architecture (Arquitectura Limpia):** Estructurado en capas desacopladas (Dominio, Casos de Uso, Adaptadores e Infraestructura) para garantizar mantenibilidad, testabilidad y escalabilidad.
2. **API en Vivo (Hot Rendering):** Generación de tarjetas SVG al vuelo a través de endpoints con cabeceras `Content-Type: image/svg+xml`.
3. **Caché en Memoria (2 horas):** Minimiza las llamadas a la API de GitHub para evitar bloqueos por límite de tasa (Rate Limits) mediante el patrón Decorador.
4. **Imágenes Autocontenidas (Base64 Bypass):** Las fotos de perfil se descargan y se convierten a Base64 en el servidor, garantizando que el proxy de imágenes de GitHub (`camo.githubusercontent.com`) las muestre sin problemas.
5. **Métricas Clave de Visibilidad:**
   - **Estadísticas Generales:** Commits totales, estrellas obtenidas, pull requests, issues y seguidores.
   - **Lenguajes más Usados:** Gráfica de distribución de lenguajes (calculada por peso de bytes) con leyenda estructurada.
6. **Múltiples Temas Estéticos:** Dark, Light, Neon, Solarized, Radical, Tokyonight y Glassmorphism.
7. **Panel Web Premium (Glassmorphism):** Una interfaz web elegante construida en CSS puro con vista previa en tiempo real y copiador de enlaces Markdown automático.
8. **Pruebas Unitarias Integradas:** Implementadas utilizando **Vitest** con inyección de dependencias.
9. **Listo para Docker y Coolify:** Dockerfile de construcción en múltiples etapas (multi-stage) optimizado para producción.

---

## 🏗️ Arquitectura del Proyecto

El código fuente está organizado siguiendo los principios de **Clean Architecture**:

```
src/
├── domain/                  # Lógica de negocio pura (Entidades y Contratos de Repositorios)
│   ├── entities/            # UserStats, LanguageStat, Metrics, UserToken, Validation
│   └── repositories/        # IGitHubRepository, ITokenRepository, IMetricsRepository
├── use-cases/               # Casos de uso (Orquestadores de la lógica de negocio)
│   ├── cards/               # GetUserStatsCardUseCase, GetUserLanguagesCardUseCase, etc.
│   └── tokens/              # RegisterUserTokenUseCase, RevokeUserTokenUseCase
├── adapters/                # Adaptadores de Interfaz (Controladores, Repositorios y Presentadores)
│   ├── controllers/         # CardController, TokenController, MetricsController
│   ├── presenters/          # statsCard, languagesCard, theme (Renderizadores de SVGs)
│   └── repositories/        # TypeORMTokenRepository, TypeORMMetricsRepository, ApiGitHubRepository, CachedGitHubRepository
└── infrastructure/          # Detalles técnicos concretos (Base de datos, Servidor Express, Criptografía)
    ├── database/            # Configuración de TypeORM con PostgreSQL y Entidades
    │   └── entities/        # Entidades de base de datos (GlobalMetric, UserMetric, etc.)
    ├── express/             # Enrutamiento, middlewares y arranque de servidor Express
    ├── security/            # Criptografía AES-256-GCM y validación de scopes
    └── server.ts            # Entrypoint principal (Wrapper de importación limpio y relativo)
```

### Path Aliases (Alias de Rutas)
El proyecto utiliza alias `@/` apuntando al directorio `src/`. Esto previene la existencia de rutas relativas complejas como `../../`.
- En desarrollo: Se resuelve en tiempo de ejecución utilizando `tsconfig-paths/register`.
- En producción: `tsc-alias` reescribe los imports a rutas relativas nativas durante la compilación en el directorio `dist/`.

---

## 🚀 Comenzar (Desarrollo Local)

### Requisitos previos
- Node.js v18 o superior.
- (Opcional) Un token de acceso personal (PAT) de GitHub para aumentar el límite de peticiones de la API.

### Instalación

1. Clona e ingresa al repositorio.
2. Instala las dependencias estables usando `pnpm`:
   ```bash
   pnpm install
   ```
3. Copia el archivo de configuración de entorno:
   ```bash
   cp .env.example .env
   ```
4. Abre el archivo `.env` y configura las siguientes variables clave:
   - `GITHUB_TOKEN`: Tu token de acceso personal de GitHub para evitar límites de tasa.
   - `METRICS_KEY`: Clave secreta obligatoria para poder acceder a los endpoints de analíticas (`/api/metrics`).
   - `TRUST_PROXY`: Número de saltos del proxy (por defecto `1`), útil para que el rate limit identifique correctamente las IPs detrás de Cloudflare, Nginx, etc.
   - `PRIVATE_STATS_COMING_SOON`: Estado de configuración de estadísticas privadas. Establécelo en `false` para habilitar y activar completamente la funcionalidad de registro/revocación de tokens (por defecto `true`).
   - `STATS_HISTORY_FREQUENCY_HOURS`: Frecuencia mínima en horas entre tomas de instantáneas del historial de estadísticas del usuario (por defecto `12`).

### Scripts de Desarrollo

- **Modo Desarrollo (auto-reload y resolución de paths):**
  ```bash
  pnpm dev
  ```
- **Ejecutar Pruebas Unitarias (Vitest):**
  ```bash
  pnpm test
  ```
- **Compilar para Producción (compila archivos TS y reescribe alias):**
  ```bash
  pnpm build
  ```
- **Iniciar Servidor Compilado:**
  ```bash
  pnpm start
  ```
- **Gestionar Versiones y Releases (release-it):**
  ```bash
  pnpm release
  ```

Una vez ejecutado, el panel de configuración estará disponible en:  
👉 **http://localhost:3000**

### 📦 Gestión de Versiones y Changelog
Este proyecto utiliza `release-it` junto con la especificación de [Conventional Commits](https://www.conventionalcommits.org/) para automatizar los lanzamientos de versión.

Cuando ejecutas `pnpm release`:
1. Analiza el historial de commits desde la última versión.
2. Calcula el incremento de versión correspondiente (Major, Minor, Patch).
3. Actualiza la versión en `package.json` y genera/actualiza el archivo `CHANGELOG.md`.
4. Realiza un commit con los cambios, crea la etiqueta (git tag) y sube todo a GitHub.
5. Crea un Release oficial en GitHub con el log de cambios automático.

---

## 📡 Endpoints de la API

Las tarjetas se pueden incrustar en cualquier archivo Markdown usando la siguiente sintaxis:

### 1. Tarjeta de Estadísticas Generales
```markdown
![Estadísticas de GitHub](http://tu-servidor.com/api/stats?username=tu-usuario&theme=neon&locale=en)
```
- **Parámetros:**
  - `username` (Obligatorio): Nombre de usuario en GitHub. Valida con regex `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`.
  - `theme` (Opcional): `dark` (por defecto), `light`, `neon`, `glassmorphism`, `solarized`, `radical`, `tokyonight`.
  - `locale` o `lang` (Opcional): `es` (Español, por defecto) o `en` (Inglés). Traduce dinámicamente los textos internos de la tarjeta.

### 2. Tarjeta de Lenguajes más Usados
```markdown
![Lenguajes de GitHub](http://tu-servidor.com/api/languages?username=tu-usuario&theme=tokyonight&locale=en)
```
- **Parámetros:**
  - `username` (Obligatorio): Nombre de usuario en GitHub.
  - `theme` (Opcional): Mismos temas que la tarjeta de estadísticas.
  - `locale` (Opcional): `es` o `en` para traducción.

---

## 📊 Panel de Administración de Métricas (`/admin/metrics`)

El servicio cuenta con una interfaz web segura de analíticas en la dirección `/admin/metrics`.
- **Acceso:** Protegido mediante un formulario de autenticación glassmorphic que valida contra la clave configurada en la variable de entorno `METRICS_KEY`.
- **Analíticas en Tiempo Real:**
  - Métricas KPI para renderizados totales, usuarios únicos registrados y vistas de insignias de perfil.
  - Gráfico de dona (Doughnut) de distribución de tipos de tarjetas solicitadas.
  - Gráfico de barras apiladas (Stacked Bar) de tráfico por origen (GitHub Camo vs Web Directa).
  - Listado de usuarios/perfiles más activos con fecha de última actualización y hits de perfil.

---

## 🔒 Seguridad (Alineación OWASP)

Este microservicio implementa las siguientes medidas de seguridad para entornos de producción:
* **Cabeceras Seguras (Helmet)**: Configurado con políticas de recursos de origen cruzado (`cross-origin`) para permitir incrustar de forma segura las tarjetas en READMEs externos.
* **Rate Limiting**: Límite de 100 peticiones cada 15 minutos por dirección IP. En caso de bloqueo, responde con un SVG legible para evitar errores de renderizado de imágenes.
* **Validación de Parámetros por Expresión Regular**:
  - Validado a nivel de Controller y en la capa de negocio de Use Cases.
  - Username: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  - Repo: `/^[a-z\d-_.]{1,100}$/i`
* **Estadísticas Privadas (Coming Soon - Doble Defensa)**:
  - Las características de almacenamiento cifrado de PATs personales de GitHub están marcadas en la interfaz frontend como deshabilitadas e inactivas.
  - Como doble defensa contra manipulaciones del DOM en el navegador, los casos de uso del backend (`RegisterUserTokenUseCase` y `RevokeUserTokenUseCase`) lanzan un error explícito de indisponibilidad si son llamados directamente en el API.
* **Secure by Default**: Los endpoints de métricas se bloquean por defecto con error `403` si no se configura la variable `METRICS_KEY`.

---

## 🐳 Despliegue en Docker y Coolify

Este proyecto incluye un `Dockerfile` optimizado con builds en multi-etapa y configuración segura que se ejecuta bajo el usuario no root `node`.

### Pruebas Locales con Docker

Dado que la base de datos se ha migrado a PostgreSQL, el contenedor de la aplicación no requiere almacenamiento persistente en disco. Puedes enlazarlo a tu servidor de PostgreSQL local:

1. Construir la imagen:
   ```bash
   docker build -t github-helpers .
   ```
2. Ejecutar el contenedor pasando las credenciales de la base de datos en las variables de entorno:
   ```bash
   docker run -d -p 3000:3000 --name github-helpers-app --env-file .env github-helpers
   ```

### Despliegue en Coolify
1. Crea un nuevo recurso de tipo **Application** en tu panel de Coolify.
2. Selecciona **GitHub Repository** como fuente y apunta a este repositorio.
3. En la configuración de construcción, selecciona **Dockerfile**.
4. Configura el puerto de exposición en el puerto `3000`.
5. **Base de Datos**: Añade un servicio de base de datos **PostgreSQL** en Coolify.
6. **Variables de Entorno**: Agrega en la pestaña `Environment Variables` los datos de acceso de la base de datos y tus tokens de seguridad:
   * `DB_HOST`: Host de tu base de datos PostgreSQL de Coolify.
   * `DB_PORT`: `5432`
   * `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: Datos de tu base de datos PostgreSQL.
   * `DB_SSL`: `'true'` (si la base de datos requiere SSL).
   * `DB_SYNCHRONIZE`: `'true'` (si deseas que cree las tablas al iniciar la primera vez).
   * `GITHUB_TOKEN`, `METRICS_KEY`, `TRUST_PROXY`.
7. Haz clic en **Deploy**. Coolify construirá el contenedor seguro de producción y lo pondrá en marcha con SSL automático.
