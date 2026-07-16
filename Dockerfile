# Stage 1: Build
FROM node:24-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy package and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy compiler settings and source files
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN pnpm run build

# Stage 2: Runtime (Production)
FROM node:24-alpine AS runner

# Install pnpm and su-exec (lightweight privilege-drop tool for Alpine)
# su-exec is used in docker-entrypoint.sh to drop from root → node user at startup
RUN npm install -g pnpm && apk add --no-cache su-exec

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy build output and public directory
COPY --from=builder /usr/src/app/dist ./dist
COPY public ./public

# Copy the entrypoint script that fixes volume ownership at startup
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Pre-create the data directory so the volume mount point exists
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app

# Declare the persistent volume directory for SQLite metrics database
VOLUME /usr/src/app/data

# NOTE: We intentionally do NOT set USER node here.
# The entrypoint script runs as root to fix mounted-volume permissions,
# then drops privileges to 'node' via su-exec before starting the app.

# Health check — uses wget (built into Alpine) to probe the /health endpoint.
# --start-period gives the app time to initialize SQLite before probes begin.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
