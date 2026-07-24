# Project Guidelines for Coding Agents

This file documents workspace-specific rules, patterns, and guidelines that all AI coding assistants must adhere to when working on this repository.

## MCP Tools & Discovery

- **Codebase Memory**: This project uses `codebase-memory-mcp`. Always prefer using MCP graph tools (`search_graph`, `trace_path`, `get_code_snippet`, etc.) over raw grep/find commands for exploring the codebase.
- **Keep indexed**: If new modules or extensive changes are introduced, re-index the repository using `index_repository`.

## Security Rules (OWASP Compliance)

- **Secure by Default**: Never disable authorization or validation checks.
- **XSS & Security Vulnerability Prevention**: No code must contain Cross-Site Scripting (XSS), Path Traversal, SQL Injection, or other OWASP vulnerabilities. Unsanitized user inputs or query parameters must NEVER be directly injected into HTML, SVG, metadata, or template responses. All inputs rendered in client-facing outputs must be strictly sanitized or HTML/XML-escaped.
- **Input Validation**:
  - Every endpoint receiving user parameters (`username`, `repo`, etc.) must strictly validate them using regular expressions before processing or forwarding.
  - Username Regex: `/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i`
  - Repo Regex: `/^[a-z\d-_.]{1,100}$/i`
- **Metrics Security**: The metrics endpoints under `/api/metrics` must always require a valid `METRICS_KEY`. If `METRICS_KEY` is not set in the environment, the endpoints must respond with `403 Forbidden` rather than falling back to public access.
- **Rate Limiting**: Rate limiting is configured at `/api/` using `express-rate-limit`. Do not bypass or remove this unless instructed. If adding new endpoints, ensure they are protected by the rate limiter.
- **Security Headers**: `helmet` is used to enforce secure headers. Keep `contentSecurityPolicy: false` to allow inline CSS inside the generated SVG cards.
- **Environment Secrets**: Do NOT attempt to read, write, or modify the `.env` file (or any other local environment files containing secrets/configurations) directly. Always output or present the required environment key templates to the user so they can configure them manually.

## Docker Guidelines

- **Non-Root Execution**: The runner stage must run as the non-privileged `node` user (`USER node`).
- **Precise COPY**: Avoid using trailing wildcards/globs in `COPY` commands (e.g. `COPY package.json pnpm-lock.yaml* ...`) if the files are known to exist. List them explicitly to avoid matching unintended files.

## Codebase Patterns

- **PostgreSQL Database**: We use PostgreSQL managed through TypeORM for security and concurrency. Avoid using raw SQL queries; instead, use the Active Record / Data Mapper repositories or QueryBuilder parameterized bindings to prevent SQL Injection.
- **SVG Cards**: Cards are rendered directly as SVG strings in server code and cached for 2 hours. If returning an error on a card endpoint, always send the response as `Content-Type: image/svg+xml` containing an SVG representation of the error card (e.g., using `renderErrorCard(message)`), so it renders correctly inside `<img>` tags on GitHub.
- **Package Manager**: Use `pnpm` exclusively. Never run `npm install` or `yarn` inside this workspace. Run test suite using `pnpm test`. Always install packages using exact versions without carets (`^`) or tildes (`~`) to ensure consistency with locally tested packages.

## Release & Version Management

- **Documentation Synchronization**: AI coding agents MUST update all relevant markdown files (`README.md`, `CHANGELOG.md`, `.agents/ARCHITECTURE.md`, etc.) on every modification that changes architecture, configuration keys, or deployment steps to ensure documentation is always synchronized.
- **Manual Version Changes**: When explicitly asked to change the version:
  1. Update `"version"` in the root `package.json`, `backend/package.json`, and `frontend/package.json`.
  2. Document the release in `CHANGELOG.md` under a section header formatted as `## [<version>] - <YYYY-MM-DD>`, including details of all features/fixes included.
  3. Ensure the production version indicator at the bottom of `CHANGELOG.md` (`Versión actualmente expuesta / en producción: v<version>`) matches the new version.
  4. Run `pnpm run build` and `pnpm test` to verify that the build compiles and tests pass successfully.

## Code Quality & Sonar Guidelines

- **Avoid Code Duplication**: Do not duplicate common utility functions, helper methods, or business logic (e.g. XML/HTML escaping, URL parsing, custom rate limiting). Consolidate them into reusable modules or helper classes where possible.
- **TypeScript Best Practices**:
  - **No Unused Variables or Imports**: Never leave unused variables, parameters, types, functions, or imports (`@typescript-eslint/no-unused-vars`). Clean up all unused symbols before finishing any task.
  - **Readonly Members**: Mark all class properties, private fields, and methods that are initialized and never reassigned as `readonly` (e.g. `private readonly handleCardRequest`).
  - **Strict Parameter Types**: Ensure all inputs (especially query parameters from Express `req.query`) are strictly type-checked at runtime using `typeof` and validated before passing them to internal functions to avoid type confusion.
- **OWASP & Sonar Compliance**: Keep code clean and free of Sonar issues. Avoid raw `.includes()` checks for security-sensitive domains/referers. Sanitization of user inputs for XSS prevention and validation of dynamic request target hosts to prevent SSRF are required.
- **Guard Clauses & Negation First**: Prefer guard clauses with negation first (e.g. `if (!targetUsername) { return ...; }` or `if (!targetUsername) { throw new BadRequestException(...); }`) to handle validation/missing conditions early and avoid nesting main logic in positive `if` blocks.
- **Clean Code Principles**: Adhere strictly to Clean Code principles: write highly readable, single-responsibility functions, use meaningful self-documenting names, eliminate dead code/unused variables, avoid magic numbers/strings, keep methods short, and maintain minimal cyclomatic complexity across all modules.
