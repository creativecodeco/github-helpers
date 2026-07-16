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

# Install pnpm globally
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

# Create data directory and set correct permissions
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app

# Declare the persistent volume directory for SQLite metrics database
VOLUME /usr/src/app/data

# Switch to the non-root 'node' user
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
