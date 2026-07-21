# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [Unreleased]

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

- **Repositorios Privados**: Actualización del endpoint de la API y del widget SVG para permitir la visualización de métricas de repositorios privados mediante la inclusión del parámetro `private` y la configuración de un token de acceso en el archivo `.env`.
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

**Versión actualmente expuesta / en producción:** v1.1.1
