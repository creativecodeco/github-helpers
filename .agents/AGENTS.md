# Project Guidelines for Coding Agents

This file documents workspace-specific rules, patterns, and guidelines that all AI coding assistants must adhere to when working on this repository.

## MCP Tools & Discovery
* **Codebase Memory**: This project uses `codebase-memory-mcp`. Always prefer using MCP graph tools (`search_graph`, `trace_path`, `get_code_snippet`, etc.) over raw grep/find commands for exploring the codebase.
* **Keep indexed**: If new modules or extensive changes are introduced, re-index the repository using `index_repository`.

## Security Rules (OWASP Compliance)
* **Secure by Default**: Never disable authorization or validation checks.
* **Input Validation**: 
  * Every endpoint receiving user parameters (`username`, `repo`, etc.) must strictly validate them using regular expressions before processing or forwarding.
  * Username Regex: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  * Repo Regex: `/^[a-z\d-_.]{1,100}$/i`
* **Metrics Security**: The metrics endpoints under `/api/metrics` must always require a valid `METRICS_KEY`. If `METRICS_KEY` is not set in the environment, the endpoints must respond with `403 Forbidden` rather than falling back to public access.
* **Rate Limiting**: Rate limiting is configured at `/api/` using `express-rate-limit`. Do not bypass or remove this unless instructed. If adding new endpoints, ensure they are protected by the rate limiter.
* **Security Headers**: `helmet` is used to enforce secure headers. Keep `contentSecurityPolicy: false` to allow inline CSS inside the generated SVG cards.

## Docker Guidelines
* **Non-Root Execution**: The runner stage must run as the non-privileged `node` user (`USER node`).
* **Precise COPY**: Avoid using trailing wildcards/globs in `COPY` commands (e.g. `COPY package.json pnpm-lock.yaml* ...`) if the files are known to exist. List them explicitly to avoid matching unintended files.
* **Volume Mounts**: The persistent SQLite database is stored in `/usr/src/app/data`. Ensure this directory is declared as a `VOLUME` and has its owner set to `node` (`chown -R node:node /usr/src/app`).

## Codebase Patterns
* **SQLite Database**: We use the native `sqlite3` driver in WAL mode for high concurrency. Run database modifications inside `db.serialize()` to ensure proper ordering.
* **SVG Cards**: Cards are rendered directly as SVG strings in server code and cached for 2 hours. If returning an error on a card endpoint, always send the response as `Content-Type: image/svg+xml` containing an SVG representation of the error card (e.g., using `renderErrorCard(message)`), so it renders correctly inside `<img>` tags on GitHub.
* **Package Manager**: Use `pnpm` exclusively. Never run `npm install` or `yarn` inside this workspace. Run test suite using `pnpm test`.

## Release & Version Management
* **release-it**: The repository uses `release-it` to manage semantic versioning and automate changelog generation.
* **Commands**: Run `pnpm release` from the `main` branch to trigger a new release.
* **Conventional Commits**: Commit messages must follow the Conventional Commits specification (e.g. `feat: ...`, `fix: ...`, `chore: ...`) to enable automatic changelog generation.

