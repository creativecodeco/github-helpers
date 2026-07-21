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

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy build output and public directory
COPY --from=builder /usr/src/app/dist ./dist
COPY public ./public

# Ensure the app files are owned by the node user
RUN chown -R node:node /usr/src/app

# Drop privileges to non-root 'node' user
USER node

# Health check — uses wget (built into Alpine) to probe the /health endpoint.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/server.js"]
