# Stage 1: Build
FROM node:24-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm@11.17.0 --ignore-scripts

WORKDIR /usr/src/app

ENV ASTRO_TELEMETRY_DISABLED=1

# Copy package and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy compiler settings, frontend and backend source files
COPY backend ./backend
COPY frontend ./frontend

# Compile Frontend and Backend
RUN pnpm run build

# Stage 2: Runtime (Production)
FROM node:24-alpine AS runner

# Install pnpm
RUN npm install -g pnpm@11.17.0 --ignore-scripts

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy build output and public directory
COPY --from=builder /usr/src/app/backend/dist ./backend/dist
COPY --from=builder /usr/src/app/public ./public

# Ensure the app files are owned by the node user
RUN chown -R node:node /usr/src/app

# Drop privileges to non-root 'node' user
USER node

# Health check — uses wget (built into Alpine) to probe the /health endpoint.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]
