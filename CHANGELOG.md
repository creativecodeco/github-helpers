# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

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

**Versión actualmente expuesta / en producción:** v1.0.0
